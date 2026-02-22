import { readFileSync } from 'node:fs';
import { ConfigError } from './errors.js';

export async function readBody(bodyFlag?: string): Promise<unknown> {
    // From --body flag
    if (bodyFlag) {
        if (bodyFlag.startsWith('@')) {
            const filePath = bodyFlag.slice(1);
            try {
                return JSON.parse(readFileSync(filePath, 'utf-8'));
            } catch (err) {
                throw new ConfigError(`Failed to read body from file: ${filePath}`);
            }
        }
        try {
            return JSON.parse(bodyFlag);
        } catch {
            throw new ConfigError('Invalid JSON in --body. Use --body \'{"key":"value"}\' or --body @file.json');
        }
    }

    // From stdin (only if piped)
    if (!process.stdin.isTTY) {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        const input = Buffer.concat(chunks).toString('utf-8').trim();
        if (!input) {
            throw new ConfigError('No input received from stdin.');
        }
        try {
            return JSON.parse(input);
        } catch {
            throw new ConfigError('Invalid JSON from stdin.');
        }
    }

    throw new ConfigError('No request body provided. Use --body \'{"key":"value"}\', --body @file.json, or pipe JSON via stdin.');
}
