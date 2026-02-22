import { Command } from 'commander';
import { loadConfig } from '../config.js';
import { GrowPanelClient } from '../client.js';
import { render } from '../output.js';
import { handleError } from '../errors.js';
import type { GlobalOptions, ColumnDef } from '../types.js';

const CUSTOMER_LIST_COLUMNS: ColumnDef[] = [
    { key: 'id', header: 'ID', align: 'left' },
    { key: 'name', header: 'Name', align: 'left' },
    { key: 'email', header: 'Email', align: 'left' },
    { key: 'status', header: 'Status', align: 'left' },
    { key: 'current_mrr', header: 'MRR', format: 'currency', align: 'right' },
    { key: 'created_date', header: 'Created', format: 'date', align: 'left' },
];

export function registerCustomersCommand(program: Command): void {
    const customers = program
        .command('customers')
        .description('Manage and query customers');

    // customers list
    customers
        .command('list')
        .description('List all customers')
        .option('--date <range>', 'Date range in yyyyMMdd-yyyyMMdd format')
        .option('--limit <n>', 'Maximum number of results')
        .option('--offset <n>', 'Offset for pagination')
        .addHelpText('after', `
Examples:
  $ growpanel customers list
  $ growpanel customers list --limit 100
  $ growpanel customers list --date 20240101-20241231
  $ growpanel customers list --offset 100 --limit 50
        `)
        .action(async (options: { date?: string; limit?: string; offset?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const params: Record<string, string | undefined> = {
                    date: options.date,
                    limit: options.limit,
                    offset: options.offset,
                };

                const data = await client.get('/customers', params);

                // Unwrap { result: { count, list } }
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                const list = (result && typeof result === 'object' && 'list' in result)
                    ? result.list
                    : result;

                const count = (result && typeof result === 'object' && 'count' in result)
                    ? result.count
                    : null;

                if (count !== null && config.format === 'table') {
                    process.stderr.write(`Total customers: ${count}\n\n`);
                }

                render(list, { config, columns: CUSTOMER_LIST_COLUMNS });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // customers get <id>
    customers
        .command('get <id>')
        .description('Get a specific customer by ID')
        .addHelpText('after', `
Examples:
  $ growpanel customers get cus_abc123
  $ growpanel customers get cus_abc123 --format json
        `)
        .action(async (id: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get(`/customers/${id}`);

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: null });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // customers resync <id>
    customers
        .command('resync <id>')
        .description('Trigger a resync for a specific customer (admin/owner only)')
        .addHelpText('after', `
Examples:
  $ growpanel customers resync cus_abc123
        `)
        .action(async (id: string, options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.post(`/customers/${id}/resync`);

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
