import chalk from 'chalk';

export class ApiError extends Error {
    statusCode: number;
    body: unknown;

    constructor(statusCode: number, message: string, body?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.body = body;
    }
}

export class ConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigError';
    }
}

export function handleError(err: unknown, verbose: boolean = false): never {
    if (err instanceof ApiError) {
        if (err.statusCode === 401) {
            process.stderr.write(chalk.red('Error: Unauthorized. Check your API key.\n'));
            process.stderr.write(chalk.dim('Set via: --api-key, GROWPANEL_API_KEY env var, or ~/.growpanelrc\n'));
        } else if (err.statusCode === 429) {
            process.stderr.write(chalk.red('Error: Rate limit exceeded. Please wait and retry.\n'));
        } else {
            process.stderr.write(chalk.red(`Error: ${err.message} (HTTP ${err.statusCode})\n`));
        }
        if (verbose && err.body) {
            process.stderr.write(chalk.dim(JSON.stringify(err.body, null, 2) + '\n'));
        }
    } else if (err instanceof ConfigError) {
        process.stderr.write(chalk.red(`Config error: ${err.message}\n`));
    } else if (err instanceof Error) {
        process.stderr.write(chalk.red(`Error: ${err.message}\n`));
        if (verbose && err.stack) {
            process.stderr.write(chalk.dim(err.stack + '\n'));
        }
    } else {
        process.stderr.write(chalk.red(`Error: ${String(err)}\n`));
    }
    process.exit(1);
}
