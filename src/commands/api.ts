import { Command } from 'commander';
import { loadConfig } from '../config.js';
import { GrowPanelClient } from '../client.js';
import { render } from '../output.js';
import { handleError } from '../errors.js';
import { readBody } from '../body.js';
import type { GlobalOptions } from '../types.js';

export function registerApiCommand(program: Command): void {
    program
        .command('api <method> <path> [params...]')
        .description('Generic raw API passthrough')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .addHelpText('after', `
Generic API command for any endpoint. Supports GET, POST, PUT, DELETE.

For GET requests, params are added as query parameters.
For POST/PUT requests, use --body for JSON payload or provide key=value pairs.

Examples:
  $ growpanel api GET /reports/mrr date=20240101-20250131
  $ growpanel api POST /data/customers --body '{"name":"Acme","email":"a@b.com"}'
  $ growpanel api DELETE /data/customers/cus_123
  $ growpanel api PUT /account/team/user_123 --body '{"role":"admin"}'
  $ growpanel api GET /customers limit=100 offset=0
        `)
        .action(async (method: string, path: string, params: string[], options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const upperMethod = method.toUpperCase();

                if (upperMethod === 'GET') {
                    // Parse params as key=value pairs for query params
                    const queryParams: Record<string, string> = {};
                    for (const param of params) {
                        const [key, ...valueParts] = param.split('=');
                        if (valueParts.length > 0) {
                            queryParams[key] = valueParts.join('=');
                        }
                    }

                    const data = await client.get(path, queryParams);

                    // Unwrap { result: ... } if present
                    const result = (data && typeof data === 'object' && 'result' in (data as any))
                        ? (data as any).result
                        : data;

                    render(result, { config, columns: null });
                } else if (upperMethod === 'POST') {
                    let body;
                    if (options.body) {
                        body = await readBody(options.body);
                    } else if (params.length > 0) {
                        // Build JSON body from key=value pairs
                        body = {};
                        for (const param of params) {
                            const [key, ...valueParts] = param.split('=');
                            if (valueParts.length > 0) {
                                const value = valueParts.join('=');
                                // Try to parse as JSON, otherwise use as string
                                try {
                                    (body as Record<string, unknown>)[key] = JSON.parse(value);
                                } catch {
                                    (body as Record<string, unknown>)[key] = value;
                                }
                            }
                        }
                    }

                    const data = await client.post(path, body);

                    // Unwrap { result: ... } if present
                    const result = (data && typeof data === 'object' && 'result' in (data as any))
                        ? (data as any).result
                        : data;

                    render(result, { config, columns: null });
                } else if (upperMethod === 'PUT') {
                    let body;
                    if (options.body) {
                        body = await readBody(options.body);
                    } else if (params.length > 0) {
                        // Build JSON body from key=value pairs
                        body = {};
                        for (const param of params) {
                            const [key, ...valueParts] = param.split('=');
                            if (valueParts.length > 0) {
                                const value = valueParts.join('=');
                                // Try to parse as JSON, otherwise use as string
                                try {
                                    (body as Record<string, unknown>)[key] = JSON.parse(value);
                                } catch {
                                    (body as Record<string, unknown>)[key] = value;
                                }
                            }
                        }
                    }

                    const data = await client.put(path, body);

                    // Unwrap { result: ... } if present
                    const result = (data && typeof data === 'object' && 'result' in (data as any))
                        ? (data as any).result
                        : data;

                    render(result, { config, columns: null });
                } else if (upperMethod === 'DELETE') {
                    const data = await client.delete(path);

                    // Unwrap { result: ... } if present
                    const result = (data && typeof data === 'object' && 'result' in (data as any))
                        ? (data as any).result
                        : data;

                    render(result, { config, columns: null });
                } else {
                    throw new Error(`Unsupported HTTP method: ${method}. Use GET, POST, PUT, or DELETE.`);
                }
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });
}
