import { Command } from 'commander';
import { loadConfig } from '../config.js';
import { GrowPanelClient } from '../client.js';
import { render } from '../output.js';
import { handleError } from '../errors.js';
import { readBody } from '../body.js';
import type { GlobalOptions } from '../types.js';

export function registerAccountCommand(program: Command): void {
    const account = program
        .command('account')
        .description('Manage account, billing, team, and API keys')
        .addHelpText('after', `
Examples:
  $ growpanel account get
  $ growpanel account update --body '{"name":"New Account Name"}'
  $ growpanel account billing details
  $ growpanel account billing subscribe --body '{"plan":"pro"}'
  $ growpanel account team list
  $ growpanel account team invite --body '{"email":"user@example.com","role":"admin"}'
  $ growpanel account api-keys list
  $ growpanel account api-keys create --body '{"name":"Production Key"}'
        `);

    // account get
    account
        .command('get')
        .description('Get account details')
        .action(async (options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get('/account');

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // account update
    account
        .command('update')
        .description('Update account details')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.post('/account', body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // account delete
    account
        .command('delete')
        .description('Delete the account (irreversible)')
        .action(async (options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.delete('/account');

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // account billing subgroup
    const billing = account
        .command('billing')
        .description('Manage billing and subscriptions');

    billing
        .command('details')
        .description('Get billing details')
        .action(async (options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get('/account/billing');

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    billing
        .command('invoices')
        .description('List billing invoices')
        .action(async (options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get('/account/billing/invoices');

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    billing
        .command('portal')
        .description('Get billing portal URL')
        .action(async (options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get('/account/billing/portal');

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    billing
        .command('subscribe')
        .description('Subscribe to a plan')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.post('/account/billing/subscribe', body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    billing
        .command('check-vat')
        .description('Check VAT number validity')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                // Parse body to extract vat_number for query param
                const bodyData = options.body ? await readBody(options.body) : {};
                const vatNumber = (bodyData && typeof bodyData === 'object' && 'vat_number' in bodyData)
                    ? String(bodyData.vat_number)
                    : undefined;

                const params: Record<string, string | undefined> = {
                    vat_number: vatNumber,
                };

                const data = await client.get('/account/billing/check-vat', params);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    billing
        .command('address')
        .description('Update billing address')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.post('/account/billing/address', body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    billing
        .command('setup')
        .description('Setup billing')
        .action(async (options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.post('/account/billing/setup');

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    billing
        .command('preview-change')
        .description('Preview plan change')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.post('/account/billing/preview-change', body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    billing
        .command('change-plan')
        .description('Change subscription plan')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.post('/account/billing/change-plan', body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    billing
        .command('undo-cancellation')
        .description('Undo a scheduled subscription cancellation')
        .action(async (options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.post('/account/billing/undo-cancellation');

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    billing
        .command('delete-card <cardId>')
        .description('Delete a payment card')
        .action(async (cardId: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.delete(`/account/billing/cards/${cardId}`);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // account team subgroup
    const team = account
        .command('team')
        .description('Manage team members');

    team
        .command('list')
        .description('List all team members')
        .action(async (options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get('/account/team');

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    team
        .command('edit <userId>')
        .description('Edit a team member')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (userId: string, options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.put(`/account/team/${userId}`, body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    team
        .command('remove <userId>')
        .description('Remove a team member')
        .action(async (userId: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.delete(`/account/team/${userId}`);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    team
        .command('invite')
        .description('Invite a new team member')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.post('/account/team/invite', body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    team
        .command('revoke-invite <email>')
        .description('Revoke a pending team invitation')
        .action(async (email: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.delete(`/account/team/invites/${email}`);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    team
        .command('resend-invite <email>')
        .description('Resend a pending team invitation')
        .action(async (email: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.post(`/account/team/resend/${email}`);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // account api-keys subgroup
    const apiKeys = account
        .command('api-keys')
        .description('Manage API keys');

    apiKeys
        .command('list')
        .description('List all API keys')
        .action(async (options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get('/account/api-keys');

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    apiKeys
        .command('create')
        .description('Create a new API key')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.post('/account/api-keys', body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    apiKeys
        .command('update <id>')
        .description('Update an API key')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (id: string, options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.put(`/account/api-keys/${id}`, body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    apiKeys
        .command('delete <id>')
        .description('Delete an API key')
        .action(async (id: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.delete(`/account/api-keys/${id}`);

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
