import { Command } from 'commander';
import { loadConfig } from '../config.js';
import { GrowPanelClient } from '../client.js';
import { render } from '../output.js';
import { handleError } from '../errors.js';
import { readBody } from '../body.js';
import type { GlobalOptions } from '../types.js';

const RESOURCES = ['customers', 'plans', 'plan-groups', 'data-sources', 'invoices'];

function createCrudCommands(parent: Command, resource: string): void {
    // list
    parent
        .command('list')
        .description(`List all ${resource}`)
        .option('--data-source <id>', 'Filter by data source ID')
        .action(async (options: { dataSource?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const params: Record<string, string | undefined> = {
                    data_source: options.dataSource,
                };

                const data = await client.get(`/data/${resource}`, params);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // get <id>
    parent
        .command('get <id>')
        .description(`Get a specific ${resource.slice(0, -1)} by ID`)
        .action(async (id: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get(`/data/${resource}/${id}`);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // create
    parent
        .command('create')
        .description(`Create a new ${resource.slice(0, -1)}`)
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.post(`/data/${resource}`, body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // update <id>
    parent
        .command('update <id>')
        .description(`Update a ${resource.slice(0, -1)} by ID`)
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (id: string, options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.put(`/data/${resource}/${id}`, body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // delete <id>
    parent
        .command('delete <id>')
        .description(`Delete a ${resource.slice(0, -1)} by ID`)
        .action(async (id: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.delete(`/data/${resource}/${id}`);

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

function createDataSourcesSpecialCommands(parent: Command): void {
    // reset <id>
    parent
        .command('reset <id>')
        .description('Reset a data source')
        .action(async (id: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.post(`/data/data-sources/${id}/reset`);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // connect <id>
    parent
        .command('connect <id>')
        .description('Connect a data source')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (id: string, options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = options.body ? await readBody(options.body) : undefined;

                const data = await client.post(`/data/data-sources/${id}/connect`, body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // full-import <id>
    parent
        .command('full-import <id>')
        .description('Trigger a full import for a data source')
        .action(async (id: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.post(`/data/data-sources/${id}/full-import`);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // progress <id>
    parent
        .command('progress <id>')
        .description('Get import progress for a data source')
        .action(async (id: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get(`/data/data-sources/${id}/progress`);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // abort <id>
    parent
        .command('abort <id>')
        .description('Abort an ongoing import for a data source')
        .action(async (id: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.post(`/data/data-sources/${id}/abort`);

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

function createPlanGroupsSpecialCommands(parent: Command): void {
    // delete-multiple
    parent
        .command('delete-multiple')
        .description('Delete multiple plan groups')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.post('/data/plan-groups/delete-multiple', body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // ai-suggest
    parent
        .command('ai-suggest')
        .description('Get AI suggestions for plan grouping')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.post('/data/plan-groups/ai-suggest', body);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // merge
    parent
        .command('merge')
        .description('Merge plan groups')
        .option('--body <json>', 'Request body as JSON string or @file.json')
        .action(async (options: { body?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);
                const body = await readBody(options.body);

                const data = await client.post('/data/plan-groups/merge', body);

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

export function registerDataCommand(program: Command): void {
    const data = program
        .command('data <resource>')
        .description('Generic CRUD operations for data resources')
        .addHelpText('after', `
Resources:
  ${RESOURCES.join(', ')}

Examples:
  $ growpanel data customers list
  $ growpanel data customers get cus_abc123
  $ growpanel data customers create --body '{"name":"Acme","email":"a@b.com"}'
  $ growpanel data customers update cus_abc123 --body '{"name":"Updated"}'
  $ growpanel data customers delete cus_abc123
  $ growpanel data data-sources reset ds_123
  $ growpanel data data-sources progress ds_123
  $ growpanel data plan-groups ai-suggest --body '{"plans":["plan1","plan2"]}'
        `);

    // Create subcommands for each resource
    for (const resource of RESOURCES) {
        const resourceCmd = new Command(resource)
            .description(`Manage ${resource}`);

        createCrudCommands(resourceCmd, resource);

        // Add special commands for data-sources
        if (resource === 'data-sources') {
            createDataSourcesSpecialCommands(resourceCmd);
        }

        // Add special commands for plan-groups
        if (resource === 'plan-groups') {
            createPlanGroupsSpecialCommands(resourceCmd);
        }

        data.addCommand(resourceCmd);
    }
}
