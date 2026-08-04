import { Command } from 'commander';
import { loadConfig } from '../config.js';
import { GrowPanelClient } from '../client.js';
import { render } from '../output.js';
import { getColumns, KNOWN_REPORTS } from '../columns.js';
import { handleError } from '../errors.js';
import type { GlobalOptions } from '../types.js';

function addReportOptions(cmd: Command): Command {
    return cmd
        .option('--date <range>', 'Date range in yyyyMMdd-yyyyMMdd format (e.g., 20240101-20241231)')
        .option('--interval <interval>', 'Aggregation interval: day, week, month, quarter, year')
        .option('--currency <code>', 'Filter by currency code (e.g., usd, eur)')
        .option('--region <region>', 'Filter by region')
        .option('--plan <id>', 'Filter by plan group ID')
        .option('--country <code>', 'Filter by ISO country code')
        .option('--data-source <id>', 'Filter by data source ID')
        .option('--billing-freq <freq>', 'Filter by billing frequency: month | year | quarter | week | day (the adjective forms monthly/yearly/annual are auto-normalized). Space-separate for OR.')
        .option('--type <movement>', 'For the mrr-subtypes report: which movement to decompose into subtypes — expansion | contraction | churn (required for that report).')
        .option('--breakdown <field>', 'Group results by a dimension. Supported on mrr, retention, cohort, leads, leads-table, transactions (cashflow), transactions-table, cashflow-refunds, churn-reasons, churn-scheduled, cancellation-timing. Common values: plan, currency, payment_method, country, region, market, age, data_source, billing_freq, pricing_model. Custom variables: custom_<key>. Dimension values must match the stored form (e.g. billing_freq=month, not "monthly") — a value that matches nothing returns 0 rows.')
        .option('--show <value>', 'Include extra info (e.g., "query" to see SQL)');
}

function buildReportParams(opts: Record<string, string | undefined>): Record<string, string | undefined> {
    return {
        date: opts.date,
        interval: opts.interval,
        currency: opts.currency,
        region: opts.region,
        plan: opts.plan,
        country: opts.country,
        data_source: opts.dataSource,
        billing_freq: opts.billingFreq,
        type: opts.type,
        breakdown: opts.breakdown,
        show: opts.show,
    };
}

export function registerReportsCommand(program: Command): void {
    const reports = program
        .command('reports <name>')
        .description('Fetch a subscription analytics report by name')
        .addHelpText('after', `
Known reports:
  ${KNOWN_REPORTS.join(', ')}

Any report name is accepted — new API reports work automatically.

Examples:
  $ growpanel reports summary
  $ growpanel reports mrr --date 20240101-20241231 --interval month
  $ growpanel reports mrr --breakdown plan --format json
  $ growpanel reports cohort --currency usd
  $ growpanel reports cashflow-failed-payments --date 20240601-20241231
        `);

    addReportOptions(reports);

    reports.action(async (name: string, options: Record<string, string | undefined>, command: Command) => {
        try {
            const globalOpts = command.optsWithGlobals() as GlobalOptions;
            const config = loadConfig(globalOpts);
            const client = new GrowPanelClient(config);
            const params = buildReportParams(options);
            const data = await client.get(`/reports/${name}`, params);

            // Extract currency before unwrapping
            const currency = (data && typeof data === 'object' && 'currency' in (data as any))
                ? String((data as any).currency)
                : undefined;

            // Unwrap { result: ... } if present
            const result = (data && typeof data === 'object' && 'result' in (data as any))
                ? (data as any).result
                : data;

            const columns = getColumns(name);
            render(result, { config, columns, currency });
        } catch (err) {
            handleError(err, command.optsWithGlobals()?.verbose);
        }
    });
}

export { addReportOptions, buildReportParams };
