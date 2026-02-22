import { Command } from 'commander';
import { loadConfig } from '../config.js';
import { GrowPanelClient } from '../client.js';
import { render } from '../output.js';
import { handleError } from '../errors.js';
import type { GlobalOptions, ColumnDef } from '../types.js';

const PLAN_LIST_COLUMNS: ColumnDef[] = [
    { key: 'id', header: 'ID', align: 'left' },
    { key: 'name', header: 'Name', align: 'left' },
    { key: 'external_id', header: 'External ID', align: 'left' },
    { key: 'interval', header: 'Interval', align: 'left' },
    { key: 'amount', header: 'Amount', format: 'currency', align: 'right' },
    { key: 'customer_count', header: 'Customers', format: 'number', align: 'right' },
];

export function registerPlansCommand(program: Command): void {
    const plans = program
        .command('plans')
        .description('Query subscription plans');

    // plans list
    plans
        .command('list')
        .description('List all plans')
        .addHelpText('after', `
Examples:
  $ growpanel plans list
  $ growpanel plans list --format json
  $ growpanel plans list --format csv
        `)
        .action(async (options: unknown, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const data = await client.get('/plans');

                // Unwrap { result: ... } if present
                const result = (data && typeof data === 'object' && 'result' in (data as any))
                    ? (data as any).result
                    : data;

                render(result, { config, columns: PLAN_LIST_COLUMNS });
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });
}
