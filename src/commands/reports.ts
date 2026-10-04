import { Command } from 'commander';
import { loadConfig } from '../config.js';
import { GrowPanelClient } from '../client.js';
import { render, formatValue } from '../output.js';
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
        .option('--segment <id>', 'Filter by saved segment ID (a filter combination saved in the app). The report only covers customers matching the segment — list them with: growpanel data segments list')
        .option('--billing-freq <freq>', 'Filter by billing frequency: month | year | quarter | week | day (the adjective forms monthly/yearly/annual are auto-normalized). Space-separate for OR.')
        .option('--created-date <range>', 'Filter by when the lead was created. Inclusive range: from..to, from.. (on or after), ..to (on or before), or a single date. Accepts yyyy-MM-dd or yyyyMMdd. Use * for "has any value", ~ for "has none".')
        .option('--paid-started <range>', 'Filter by when the customer started paying. Same range format as --created-date. Use this (not --created-date) for revenue questions like "how is the 2026 intake retaining?".')
        .option('--cancel-date <range>', 'Filter by when the subscription was cancelled. Same range format as --created-date.')
        .option('--renewal-date <range>', 'Filter by the next renewal (next billing) date. Same range format as --created-date.')
        .option('--trial-end-date <range>', 'Filter by when the trial ends. Same range format as --created-date.')
        .option('--mrr <amount>', 'Filter by current MRR, in whole units of the account currency (not cents): 1000 (is), 1000.. (above), ..1000 (below), 500..1000 (between, inclusive).')
        .option('--last-active-mrr <amount>', 'Filter by the MRR the last time it was above zero (finds churned customers by what they paid). Same format as --mrr.')
        .option('--total-paid <amount>', 'Filter by total paid so far (successful payments incl. one-time, after discounts, refunds not subtracted). Same format as --mrr.')
        .option('--payments <count>', 'Filter by the number of successful payments: 3 (exactly), 3.. (more than), ..3 (fewer than), 2..5 (between, inclusive).')
        .option('--type <movement>', 'For the mrr-subtypes report: which movement to decompose into subtypes — expansion | contraction | churn (required for that report).')
        .option('--breakdown <field>', 'Group results by a dimension. Supported on mrr, retention, cohort, leads, leads-table, transactions (cashflow), transactions-table, cashflow-refunds, churn-reasons, churn-scheduled, cancellation-timing. Common values: plan, currency, payment_method, country, region, market, age, data_source, billing_freq, pricing_model. Custom variables: custom_<key>. Dimension values must match the stored form (e.g. billing_freq=month, not "monthly") — a value that matches nothing returns 0 rows.')
        .option('--sort <field>', 'Sort the list in list-style reports. For paused: mrr (default), paused_since or expected_back.')
        .option('--order <dir>', 'Sort direction: asc or desc (default desc).')
        .option('--limit <n>', 'Maximum rows in list-style reports (e.g. paused, default 500).')
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
        segment: opts.segment,
        billing_freq: opts.billingFreq,
        created_date: opts.createdDate,
        paid_started: opts.paidStarted,
        cancel_date: opts.cancelDate,
        renewal_date: opts.renewalDate,
        trial_end_date: opts.trialEndDate,
        mrr: opts.mrr,
        last_active_mrr: opts.lastActiveMrr,
        total_paid: opts.totalPaid,
        payments: opts.payments,
        type: opts.type,
        breakdown: opts.breakdown,
        show: opts.show,
        sort: opts.sort,
        order: opts.order,
        limit: opts.limit,
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
  $ growpanel reports paused --sort expected_back --order asc
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
            // Snapshot reports like `paused` return { summary, list, ... }: in table/CSV output show
            // the summary as key/value rows, then the list as a table. JSON keeps the whole object.
            if (config.format !== 'json' && result && typeof result === 'object' && !Array.isArray(result) && Array.isArray((result as any).list)) {
                const { summary, list } = result as { summary?: unknown; list: unknown[] };
                if (summary && typeof summary === 'object') {
                    // Summary amounts are in cents like everywhere in the API: show *_mrr values as money.
                    const shown = Object.fromEntries(Object.entries(summary as Record<string, unknown>)
                        .map(([k, v]) => [k, /mrr/.test(k) && typeof v === 'number' ? formatValue(v, 'currency', currency) : v]));
                    render(shown, { config, columns: null, currency });
                }
                render(list, { config, columns, currency });
                return;
            }
            render(result, { config, columns, currency });
        } catch (err) {
            handleError(err, command.optsWithGlobals()?.verbose);
        }
    });
}

export { addReportOptions, buildReportParams };
