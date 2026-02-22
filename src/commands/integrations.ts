import { Command } from 'commander';
import { loadConfig } from '../config.js';
import { GrowPanelClient } from '../client.js';
import { render } from '../output.js';
import { handleError } from '../errors.js';
import { readBody } from '../body.js';
import type { GlobalOptions } from '../types.js';

export function registerIntegrationsCommand(program: Command): void {
    const integrations = program
        .command('integrations')
        .description('Manage integrations and webhooks')
        .addHelpText('after', `
Examples:
  $ growpanel integrations verify
  $ growpanel integrations webhooks list
  $ growpanel integrations webhooks get wh_123
  $ growpanel integrations webhooks create --body '{"url":"https://example.com/webhook","events":["customer.created"]}'
  $ growpanel integrations webhooks delete wh_123
  $ growpanel integrations webhooks sample customer.created
        `);

    // integrations verify
    integrations
        .command('verify')
        .description('Verify integration status')
        .action(async (options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get('/integrations/verify');

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // integrations webhooks
    const webhooks = integrations
        .command('webhooks')
        .description('Manage webhooks');

    // webhooks list
    webhooks
        .command('list')
        .description('List all webhooks')
        .action(async (options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get('/integrations/webhooks');

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // webhooks get <id>
    webhooks
        .command('get <id>')
        .description('Get a specific webhook by ID')
        .action(async (id: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get(`/integrations/webhooks/${id}`);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // webhooks create
    webhooks
        .command('create')
        .description('Create a new webhook')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.post('/integrations/webhooks', body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // webhooks delete <id>
    webhooks
        .command('delete <id>')
        .description('Delete a webhook by ID')
        .action(async (id: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.delete(`/integrations/webhooks/${id}`);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // webhooks sample <event>
    webhooks
        .command('sample <event>')
        .description('Get a sample webhook payload for an event type')
        .action(async (event: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get(`/integrations/sample/${event}`);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });
}
