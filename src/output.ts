import Table from 'cli-table3';
import chalk from 'chalk';
import type { Config, ColumnDef } from './types.js';

interface RenderOptions {
    config: Config;
    columns?: ColumnDef[] | null;
}

function formatValue(value: unknown, format?: ColumnDef['format']): string {
    if (value === null || value === undefined) {
        return '';
    }

    switch (format) {
        case 'currency':
            return `$${(Number(value) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case 'percent':
            return `${Number(value).toFixed(2)}%`;
        case 'number':
            return Number(value).toLocaleString('en-US');
        case 'date':
            return String(value);
        default:
            return String(value);
    }
}

function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function toTitleCase(snakeCase: string): string {
    return snakeCase
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function looksNumeric(key: string, value: unknown): boolean {
    if (typeof value !== 'number' && typeof value !== 'string') {
        return false;
    }
    const numValue = Number(value);
    if (isNaN(numValue)) {
        return false;
    }
    // Keys containing these words are likely numeric
    const numericKeys = ['count', 'total', 'amount', 'mrr', 'arr', 'rate', 'customers', 'leads', 'trials', 'conversions', 'percentage', 'change'];
    return numericKeys.some(k => key.toLowerCase().includes(k));
}

function autoDetectColumns(data: Record<string, unknown>[]): ColumnDef[] {
    if (data.length === 0) {
        return [];
    }

    const firstRow = data[0];
    return Object.keys(firstRow).map(key => {
        const value = firstRow[key];
        const isNumeric = looksNumeric(key, value);

        return {
            key,
            header: toTitleCase(key),
            align: (isNumeric ? 'right' : 'left') as 'left' | 'right',
        };
    });
}

export function renderKeyValue(obj: Record<string, unknown>, options: RenderOptions): void {
    const { config } = options;

    if (config.format === 'json') {
        process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
        return;
    }

    if (config.format === 'csv') {
        // CSV format: key,value
        process.stdout.write('key,value\n');
        for (const [key, value] of Object.entries(obj)) {
            const keyStr = escapeCSV(String(key));
            const valueStr = escapeCSV(String(value));
            process.stdout.write(`${keyStr},${valueStr}\n`);
        }
        return;
    }

    // Table format
    const table = new Table({
        head: config.color ? [chalk.bold('Key'), chalk.bold('Value')] : ['Key', 'Value'],
        colAligns: ['left', 'right'],
        style: {
            head: config.color ? ['cyan'] : [],
            border: config.color ? ['gray'] : [],
        },
    });

    for (const [key, value] of Object.entries(obj)) {
        table.push([toTitleCase(key), String(value)]);
    }

    process.stdout.write(table.toString() + '\n');
}

export function render(data: unknown, options: RenderOptions): void {
    const { config, columns } = options;

    // Handle non-array data
    if (!Array.isArray(data)) {
        if (typeof data === 'object' && data !== null) {
            renderKeyValue(data as Record<string, unknown>, options);
        } else {
            process.stdout.write(JSON.stringify(data, null, 2) + '\n');
        }
        return;
    }

    // Handle empty array
    if (data.length === 0) {
        if (config.format === 'json') {
            process.stdout.write('[]\n');
        } else {
            process.stdout.write('No data\n');
        }
        return;
    }

    // Determine columns
    const cols = columns || autoDetectColumns(data as Record<string, unknown>[]);

    if (config.format === 'json') {
        process.stdout.write(JSON.stringify(data, null, 2) + '\n');
        return;
    }

    if (config.format === 'csv') {
        // Header row
        const headers = cols.map(c => escapeCSV(c.header));
        process.stdout.write(headers.join(',') + '\n');

        // Data rows
        for (const row of data) {
            const values = cols.map(c => {
                const value = (row as Record<string, unknown>)[c.key];
                const formatted = formatValue(value, c.format);
                return escapeCSV(formatted);
            });
            process.stdout.write(values.join(',') + '\n');
        }
        return;
    }

    // Table format
    const table = new Table({
        head: config.color
            ? cols.map(c => chalk.bold(c.header))
            : cols.map(c => c.header),
        colAligns: cols.map(c => c.align || 'left'),
        style: {
            head: config.color ? ['cyan'] : [],
            border: config.color ? ['gray'] : [],
        },
    });

    for (const row of data) {
        const values = cols.map(c => {
            const value = (row as Record<string, unknown>)[c.key];
            return formatValue(value, c.format);
        });
        table.push(values);
    }

    process.stdout.write(table.toString() + '\n');
}
