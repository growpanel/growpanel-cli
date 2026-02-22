import { Command } from 'commander';
import { loadConfig } from '../config.js';
import { GrowPanelClient } from '../client.js';
import { render } from '../output.js';
import { handleError } from '../errors.js';
import { readBody } from '../body.js';
import type { GlobalOptions } from '../types.js';

function createIntegrationCommand(parent: Command, name: string, path: string): void {
    parent
        .command(name)
        .description(`Get or update ${name} integration settings`)
        .option('--body <json>', 'Request body as JSON string or @file.json (triggers POST/PUT)')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                let data;
                if (options.body) {
                    const body = await readBody(options.body);
                    // Use PUT for notifications, POST for others
                    if (name === 'notifications') {
                        data = await client.put(path, body);
                    } else {
                        data = await client.post(path, body);
                    }
                } else {
                    data = await client.get(path);
                }

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

export function registerSettingsCommand(program: Command): void {
    const settings = program
        .command('settings')
        .description('Manage account settings and integrations')
        .addHelpText('after', `
Examples:
  $ growpanel settings get
  $ growpanel settings update --body '{"base_currency":"usd"}'
  $ growpanel settings notifications
  $ growpanel settings notifications --body '{"email_reports":true}'
  $ growpanel settings stripe
  $ growpanel settings stripe --body '{"api_key":"sk_test_..."}'
        `);

    // settings get
    settings
        .command('get')
        .description('Get all account settings')
        .action(async (options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get('/settings');

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // settings update
    settings
        .command('update')
        .description('Update account settings')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.post('/settings', body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // Integration subcommands
    createIntegrationCommand(settings, 'notifications', '/settings/notifications');
    createIntegrationCommand(settings, 'stripe', '/settings/stripe');
    createIntegrationCommand(settings, 'hubspot', '/settings/hubspot');
    createIntegrationCommand(settings, 'webhook', '/settings/webhook');
    createIntegrationCommand(settings, 'slack', '/settings/slack');
    createIntegrationCommand(settings, 'teams', '/settings/teams');
    createIntegrationCommand(settings, 'looker-studio', '/settings/looker-studio');
}
