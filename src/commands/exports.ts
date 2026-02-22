import { Command } from 'commander';
import { loadConfig } from '../config.js';
import { GrowPanelClient } from '../client.js';
import { handleError } from '../errors.js';
import type { GlobalOptions } from '../types.js';

export function registerExportsCommand(program: Command): void {
    const exports = program
        .command('exports')
        .description('Export data as CSV');

    // exports customers
    exports
        .command('customers')
        .description('Export customers as CSV')
        .option('--date <range>', 'Date range in yyyyMMdd-yyyyMMdd format')
        .addHelpText('after', `
Examples:
  $ growpanel exports customers > customers.csv
  $ growpanel exports customers --date 20240101-20241231 > customers_2024.csv
        `)
        .action(async (options: { date?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const params: Record<string, string | undefined> = {
                    date: options.date,
                };

                const csv = await client.getRaw('/exports/customers.csv', params);
                process.stdout.write(csv);
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });

    // exports mrr-movements
    exports
        .command('mrr-movements')
        .description('Export MRR movements as CSV')
        .option('--date <range>', 'Date range in yyyyMMdd-yyyyMMdd format')
        .addHelpText('after', `
Examples:
  $ growpanel exports mrr-movements > movements.csv
  $ growpanel exports mrr-movements --date 20240101-20241231 > movements_2024.csv
        `)
        .action(async (options: { date?: string }, command: Command) => {
            try {
                const globalOpts = command.optsWithGlobals() as GlobalOptions;
                const config = loadConfig(globalOpts);
                const client = new GrowPanelClient(config);

                const params: Record<string, string | undefined> = {
                    date: options.date,
                };

                const csv = await client.getRaw('/exports/mrr-movements.csv', params);
                process.stdout.write(csv);
            } catch (err) {
                handleError(err, command.optsWithGlobals()?.verbose);
            }
        });
}
