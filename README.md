# growpanel-cli

CLI for the [GrowPanel](https://growpanel.io) subscription analytics API. Designed for scripting, automation, and AI agents.

## Install

```bash
npm install -g growpanel-cli
```

Requires Node.js 20 or later.

## Authentication

Get an API key from **Settings > API Keys** in your GrowPanel dashboard.

Configure it using one of these methods (in priority order):

```bash
# 1. CLI flag (highest priority)
growpanel --api-key <key> reports summary

# 2. Environment variable
export GROWPANEL_API_KEY=your-api-key

# 3. Config file
echo '{"api_key":"your-api-key"}' > ~/.growpanelrc
```

## Quick Start

```bash
# Get MRR summary metrics
growpanel reports summary

# Get MRR timeline for 2024
growpanel reports mrr --date 20240101-20241231 --interval month

# List customers
growpanel customers list

# Export customers as CSV
growpanel exports customers > customers.csv

# Raw API passthrough (works with any endpoint)
growpanel api GET /reports/mrr date=20240101-20241231
```

## Output Formats

The CLI auto-detects the best output format:

- **Terminal (TTY)**: Colored tables with formatted currency and numbers
- **Piped/redirected**: Raw JSON for machine consumption

Override with `--format`:

```bash
growpanel reports summary --format json    # JSON output
growpanel reports summary --format table   # Colored table
growpanel reports summary --format csv     # CSV output
```

## Global Options

| Option | Description |
|--------|-------------|
| `--api-key <key>` | API key (overrides env/config) |
| `--api-url <url>` | API base URL (default: `https://api.growpanel.io`) |
| `--format <fmt>` | Output format: `json`, `table`, `csv` |
| `--no-color` | Disable colored output |
| `--verbose` | Log HTTP requests/responses to stderr |
| `--version` | Show version |
| `--help` | Show help |

## Commands

### reports

Fetch any subscription analytics report. New API reports work automatically without CLI updates.

```bash
growpanel reports <name> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--date <range>` | Date range: `yyyyMMdd-yyyyMMdd` (e.g., `20240101-20241231`) |
| `--interval <val>` | Aggregation: `day`, `week`, `month`, `quarter`, `year` |
| `--currency <code>` | Filter by currency (e.g., `usd`, `eur`) |
| `--region <region>` | Filter by region |
| `--plan <id>` | Filter by plan group ID |
| `--country <code>` | Filter by ISO country code |
| `--data-source <id>` | Filter by data source ID |
| `--breakdown <field>` | Group by: `plan`, `currency`, `billing_freq`, etc. |

**Available reports:** `mrr`, `mrr-table`, `mrr-table-subtypes`, `summary`, `cmrr-summary`, `movement-table`, `map`, `cohort`, `leads`, `leads-table`, `leads-days`, `leads-summary`, `transactions`, `transactions-table`, `transactions-detail`, `transactions-summary`, `invoices-detail`, `churn-scheduled`, `churn-scheduled-movements`, `churn-scheduled-summary`, `customer-concentration`, `cashflow-failed-payments`, `cashflow-failed-payments-summary`, `cashflow-failed-payments-detail`, `cashflow-failed-payments-table`, `cashflow-refunds`, `cashflow-refunds-table`, `cashflow-refunds-detail`, `cashflow-failure-rate`, `cashflow-failure-rate-summary`, `cashflow-outstanding-unpaid`, `custom-variables`

```bash
growpanel reports mrr --date 20240101-20241231 --interval month
growpanel reports summary
growpanel reports cohort --currency usd
growpanel reports cashflow-failed-payments --date 20240601-20241231
growpanel reports mrr --breakdown plan --format json | jq '.[] | {date, total_mrr}'
```

### customers

```bash
growpanel customers list [--date <range>] [--limit <n>] [--offset <n>]
growpanel customers get <id>
growpanel customers resync <id>    # admin/owner only
```

### plans

```bash
growpanel plans list
```

### data

Generic CRUD for data resources: `customers`, `plans`, `plan-groups`, `data-sources`, `invoices`.

```bash
# Standard CRUD
growpanel data <resource> list [--data-source <id>]
growpanel data <resource> get <id>
growpanel data <resource> create --body '{"name":"Acme"}'
growpanel data <resource> update <id> --body '{"name":"Updated"}'
growpanel data <resource> delete <id>

# Data source operations
growpanel data data-sources reset <id>
growpanel data data-sources connect <id>
growpanel data data-sources full-import <id>
growpanel data data-sources progress <id>
growpanel data data-sources abort <id>

# Plan group operations
growpanel data plan-groups ai-suggest --body '{"plans":["plan1","plan2"]}'
growpanel data plan-groups merge --body '{"source":"pg1","target":"pg2"}'
growpanel data plan-groups delete-multiple --body '{"ids":["pg1","pg2"]}'
```

### exports

Export data as CSV (writes directly to stdout).

```bash
growpanel exports customers > customers.csv
growpanel exports mrr-movements > movements.csv
growpanel exports customers --date 20240101-20241231 > customers_2024.csv
```

### settings

```bash
growpanel settings get                                        # Get all settings
growpanel settings update --body '{"base_currency":"usd"}'    # Update settings

# Integration settings (GET without --body, POST/PUT with --body)
growpanel settings notifications
growpanel settings notifications --body '{"email_reports":true}'
growpanel settings stripe
growpanel settings hubspot
growpanel settings webhook
growpanel settings slack
growpanel settings teams
growpanel settings looker-studio
```

### integrations

Manage webhook subscriptions for third-party integrations (n8n, Zapier, etc.).

```bash
growpanel integrations verify
growpanel integrations webhooks list
growpanel integrations webhooks get <id>
growpanel integrations webhooks create --body '{"url":"https://example.com/hook","events":["customer.created"]}'
growpanel integrations webhooks delete <id>
growpanel integrations webhooks sample customer.created
```

### account

```bash
# Account management
growpanel account get
growpanel account update --body '{"name":"New Name"}'
growpanel account delete

# Billing
growpanel account billing details
growpanel account billing invoices
growpanel account billing portal
growpanel account billing subscribe --body '{"plan":"pro"}'
growpanel account billing change-plan --body '{"plan":"enterprise"}'
growpanel account billing preview-change --body '{"plan":"enterprise"}'
growpanel account billing undo-cancellation
growpanel account billing address --body '{"line1":"123 Main St","city":"NYC","country":"US"}'
growpanel account billing check-vat --body '{"vat_number":"DK12345678"}'
growpanel account billing setup
growpanel account billing delete-card <cardId>

# Team management
growpanel account team list
growpanel account team invite --body '{"email":"user@example.com","role":"admin"}'
growpanel account team edit <userId> --body '{"role":"readonly"}'
growpanel account team remove <userId>
growpanel account team revoke-invite user@example.com
growpanel account team resend-invite user@example.com

# API key management
growpanel account api-keys list
growpanel account api-keys create --body '{"name":"CI Key","role":"readonly"}'
growpanel account api-keys update <id> --body '{"name":"Renamed Key"}'
growpanel account api-keys delete <id>
```

### api

Generic passthrough for any API endpoint. Useful for new endpoints or one-off requests.

```bash
growpanel api <METHOD> <path> [key=value...]

# GET with query params
growpanel api GET /reports/mrr date=20240101-20250131 interval=month

# POST with JSON body
growpanel api POST /data/customers --body '{"name":"Acme","email":"a@b.com"}'

# DELETE
growpanel api DELETE /data/customers/cus_123
```

## Request Body Input

Commands that accept a request body support three input methods:

```bash
# Inline JSON
growpanel data customers create --body '{"name":"Acme","email":"a@b.com"}'

# From file
growpanel data customers create --body @customer.json

# From stdin (pipe)
echo '{"name":"Acme"}' | growpanel data customers create
cat customer.json | growpanel data customers create
```

## Usage with AI Agents

This CLI is optimized for AI agent consumption:

- Every command has detailed `--help` output with examples
- Default JSON output when piped (no parsing needed)
- Consistent error messages on stderr, data on stdout
- Exit code 0 on success, 1 on error
- All commands are non-interactive (no prompts)
- New API endpoints work automatically via `growpanel api` passthrough

```bash
# AI agent workflow example
export GROWPANEL_API_KEY=your-key

# Get structured data
growpanel reports summary --format json

# Chain with jq
growpanel reports mrr --format json | jq '.[0].total_mrr'

# Pipe to other tools
growpanel exports customers | csvtool col 1,2 -
```

## Config File

Create `~/.growpanelrc` with:

```json
{
    "api_key": "accountId.keyId.secret",
    "api_url": "https://api.growpanel.io"
}
```

## Development

```bash
git clone https://github.com/growpanel/growpanel-cli.git
cd growpanel-cli
npm install
npm run dev -- reports summary    # Run from source
npm run build                     # Build to dist/
npm run typecheck                 # TypeScript check
```

## License

MIT
