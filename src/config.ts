import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { Config, GlobalOptions } from './types.js';
import { ConfigError } from './errors.js';

interface RcFile {
    api_key?: string;
    api_url?: string;
}

function loadRcFile(): RcFile {
    try {
        const rcPath = join(homedir(), '.growpanelrc');
        const content = readFileSync(rcPath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return {};
    }
}

export function loadConfig(opts: GlobalOptions): Config {
    const rc = loadRcFile();

    const apiKey = opts.apiKey || process.env.GROWPANEL_API_KEY || rc.api_key || '';
    const apiUrl = opts.apiUrl || process.env.GROWPANEL_API_URL || rc.api_url || 'https://api.growpanel.io';

    // Determine default format based on TTY
    let format: Config['format'] = 'json';
    if (opts.format) {
        format = opts.format;
    } else if (process.stdout.isTTY) {
        format = 'table';
    }

    const color = opts.color !== false && !process.env.NO_COLOR;
    const verbose = opts.verbose || false;

    if (!apiKey) {
        throw new ConfigError(
            'No API key configured.\n' +
            'Set via one of:\n' +
            '  --api-key <key>\n' +
            '  GROWPANEL_API_KEY environment variable\n' +
            '  ~/.growpanelrc file: { "api_key": "your-key" }'
        );
    }

    return { apiKey, apiUrl, format, color, verbose };
}
