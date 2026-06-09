import { Command } from 'commander';
import { registerReportsCommand } from './commands/reports.js';
import { registerCustomersCommand } from './commands/customers.js';
import { registerPlansCommand } from './commands/plans.js';
import { registerDataCommand } from './commands/data.js';
import { registerExportsCommand } from './commands/exports.js';
import { registerSettingsCommand } from './commands/settings.js';
import { registerIntegrationsCommand } from './commands/integrations.js';
import { registerAccountCommand } from './commands/account.js';
import { registerApiCommand } from './commands/api.js';
import { registerAiCommand } from './commands/ai.js';

const program = new Command();

program
    .name('growpanel')
    .description('CLI for GrowPanel subscription analytics API')
    .version('0.1.0')
    .option('--api-key <key>', 'API key (overrides GROWPANEL_API_KEY env var and ~/.growpanelrc)')
    .option('--api-url <url>', 'API base URL (default: https://api.growpanel.io)')
    .option('--format <format>', 'Output format: json, table, csv')
    .option('--no-color', 'Disable colored output')
    .option('--verbose', 'Show request/response details on stderr');

registerReportsCommand(program);
registerCustomersCommand(program);
registerPlansCommand(program);
registerDataCommand(program);
registerExportsCommand(program);
registerSettingsCommand(program);
registerIntegrationsCommand(program);
registerAccountCommand(program);
registerApiCommand(program);
registerAiCommand(program);

program.parse();
