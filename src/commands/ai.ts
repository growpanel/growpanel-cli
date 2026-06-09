import { Command } from 'commander';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout, stderr } from 'node:process';
import { loadConfig } from '../config.js';
import { handleError } from '../errors.js';
import type { GlobalOptions } from '../types.js';

interface AskOptions {
    conversationId?: string;
    autoAccept?: boolean;
    yes?: boolean;
}

interface SsePayload {
    event: string;
    data: unknown;
}

async function* consumeSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SsePayload> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sep: number;
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
            const raw = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            let event = 'message';
            let dataLine = '';
            for (const line of raw.split('\n')) {
                if (line.startsWith('event: ')) event = line.slice(7).trim();
                else if (line.startsWith('data: ')) dataLine += line.slice(6);
            }
            if (!dataLine) continue;
            try { yield { event, data: JSON.parse(dataLine) }; }
            catch { /* ignore malformed frames */ }
        }
    }
}

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

async function promptYN(question: string): Promise<boolean> {
    const rl = createInterface({ input: stdin, output: stderr });
    try {
        const answer = await rl.question(question);
        return /^y(es)?$/i.test(answer.trim());
    } finally {
        rl.close();
    }
}

async function postJson(url: string, apiKey: string, body: unknown) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify(body)
    });
}

async function runTurn(
    apiUrl: string,
    apiKey: string,
    payload: Record<string, unknown>,
    opts: AskOptions
): Promise<string | null> {
    // Returns the accepted action_id to resume on, or null when turn is done.
    const res = await postJson(`${apiUrl.replace(/\/$/, '')}/chat/v2`, apiKey, payload);
    if (!res.ok || !res.body) {
        stderr.write(red(`HTTP ${res.status}`) + '\n');
        try { stderr.write((await res.text()) + '\n'); } catch { /* ignore */ }
        return null;
    }

    let conversationId: string | undefined;
    let acceptedResumeId: string | null = null;

    for await (const { event, data } of consumeSse(res.body)) {
        const d = data as Record<string, unknown>;
        if (event === 'session') {
            conversationId = d.conversation_id as string;
            payload.conversation_id = conversationId;
        } else if (event === 'tool_call_start') {
            stderr.write(dim(`• ${d.label || d.name}\n`));
        } else if (event === 'text_delta') {
            stdout.write(d.text as string);
        } else if (event === 'pending_action') {
            stdout.write('\n');
            stderr.write(cyan(`\nProposed: ${d.action_type}\n`));
            const diff = d.diff as { before?: unknown; after?: unknown } | null;
            if (diff) {
                if (diff.before !== undefined) stderr.write(dim(`  before: ${JSON.stringify(diff.before)}\n`));
                if (diff.after  !== undefined) stderr.write(dim(`  after:  ${JSON.stringify(diff.after)}\n`));
            }
            const accept = opts.yes
                ? true
                : await promptYN(yellow('Apply? [y/N] '));

            const dres = await fetch(`${apiUrl.replace(/\/$/, '')}/chat/v2/actions/${d.id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ decision: accept ? 'accept' : 'reject', session_config: { client: 'cli' } })
            });
            const dj = (await dres.json().catch(() => ({}))) as Record<string, unknown>;
            if (accept && dj.status === 'executed') {
                stderr.write(green(`✓ ${dj.label || d.action_type}\n`));
                acceptedResumeId = String(d.id);
            } else if (!accept) {
                stderr.write(dim('  rejected.\n'));
                acceptedResumeId = String(d.id);
            } else {
                const err = (dj.applied_result as Record<string, unknown> | undefined)?.error;
                stderr.write(red(`✗ ${err || dj.status}\n`));
                acceptedResumeId = String(d.id);
            }
        } else if (event === 'handoff') {
            stderr.write('\n' + yellow(`→ Escalating to a human teammate.\n`));
            stderr.write(dim(`  subject: ${d.subject}\n`));
            // CLI does not open HelpScout; just confirm the ticket was logged.
        } else if (event === 'error') {
            stderr.write('\n' + red(`Error: ${d.message || d.code}\n`));
        }
    }
    stdout.write('\n');
    return acceptedResumeId;
}

export function registerAiCommand(program: Command): void {
    program
        .command('ai <prompt...>')
        .description('Ask the GrowPanel AI agent (multi-step, tool-using, streaming)')
        .option('-c, --conversation-id <id>', 'Continue an existing conversation')
        .option('-y, --yes', 'Auto-accept all proposed write actions (dangerous)')
        .action(async (promptWords: string[], cmdOpts: AskOptions, cmd: Command) => {
            try {
                const opts = cmd.parent!.opts<GlobalOptions>();
                const config = loadConfig(opts);
                const apiUrl = config.apiUrl;
                const apiKey = config.apiKey;

                let conversationId = cmdOpts.conversationId;
                const prompt = promptWords.join(' ').trim();
                if (!prompt) throw new Error('prompt is required');

                const sessionConfig: Record<string, unknown> = {
                    client: 'cli',
                    confirmation_policy: cmdOpts.yes ? 'auto_writes' : 'prompt_for_writes'
                };

                const payload: Record<string, unknown> = {
                    conversation_id: conversationId || null,
                    message: prompt,
                    session_config: sessionConfig
                };

                let resumeId = await runTurn(apiUrl, apiKey, payload, cmdOpts);
                while (resumeId) {
                    const resumePayload: Record<string, unknown> = {
                        conversation_id: payload.conversation_id,
                        resume_action_id: resumeId,
                        session_config: sessionConfig
                    };
                    resumeId = await runTurn(apiUrl, apiKey, resumePayload, cmdOpts);
                }
            } catch (err) {
                handleError(err);
            }
        });
}
