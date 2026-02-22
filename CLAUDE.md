# GrowPanel CLI

## What This Is

TypeScript CLI wrapping the GrowPanel REST API. Non-interactive, optimized for AI agents and scripting. Published on npm as `growpanel-cli`.

## Build & Run

```bash
npm install
npm run build          # tsup → dist/index.js (ESM)
npm run dev -- <args>  # Run from source via tsx
npm run typecheck      # tsc --noEmit
node bin/growpanel.js  # Run built version
```

## Architecture

### Dynamic Commands

The CLI uses dynamic/generic handlers so new API endpoints work automatically:

- `reports <name>` → calls `/reports/<name>` (any report name accepted)
- `forecast <name>` → calls `/forecast/<name>`
- `data <resource> <action>` → calls `/data/<resource>` with appropriate HTTP method
- `api <METHOD> <path>` → raw passthrough to any API endpoint

### File Structure

```
src/
  index.ts         Root program, registers all command groups
  client.ts        GrowPanelClient (fetch + Bearer auth)
  config.ts        Config: ~/.growpanelrc → env → flags
  output.ts        JSON / table / CSV rendering
  errors.ts        Error types + stderr formatting
  types.ts         Shared interfaces
  body.ts          Read JSON from --body, @file, or stdin
  columns.ts       Column definitions for known reports
  commands/
    reports.ts     reports <name> — dynamic
    forecast.ts    forecast <name> — dynamic
    customers.ts   customers list/get/resync
    plans.ts       plans list
    data.ts        Generic CRUD for 5 resource types
    exports.ts     CSV exports (raw passthrough)
    settings.ts    Settings + integration settings
    integrations.ts  Webhook subscriptions
    account.ts     Account/billing/team/api-keys
    api.ts         Raw API passthrough
```

### Key Patterns

- **Config resolution**: `--api-key` flag > `GROWPANEL_API_KEY` env > `~/.growpanelrc`
- **Output auto-detect**: `table` on TTY, `json` when piped
- **Column registry** (`columns.ts`): Maps report names to column definitions. Unknown reports auto-detect columns from JSON response keys.
- **Response unwrapping**: All commands unwrap `{ result: ... }` before rendering
- **Error handling**: Every `.action()` wrapped in try/catch → `handleError()`. Errors to stderr, data to stdout.
- **Body input**: `--body '{"json":true}'`, `--body @file.json`, or stdin pipe

### Conventions

- 4-space indentation, single quotes
- ESM with `.js` extensions in imports
- All async/await
- Export pattern: `registerXxxCommand(program: Command): void`

### Adding a New Command Group

1. Create `src/commands/my_command.ts`
2. Export `registerMyCommand(program: Command): void`
3. Import and register in `src/index.ts`

### Adding Column Definitions for a Report

Edit `src/columns.ts` and add to the `COLUMNS` record:

```typescript
'new-report': [
    { key: 'date', header: 'Date', align: 'left' },
    { key: 'value', header: 'Value', format: 'currency', align: 'right' },
],
```

Reports without column definitions auto-detect from JSON keys.
