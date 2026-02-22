export interface Config {
    apiKey: string;
    apiUrl: string;
    format: 'json' | 'table' | 'csv';
    color: boolean;
    verbose: boolean;
}

export interface ColumnDef {
    key: string;
    header: string;
    format?: 'currency' | 'percent' | 'number' | 'date';
    align?: 'left' | 'right';
}

export interface GlobalOptions {
    apiKey?: string;
    apiUrl?: string;
    format?: 'json' | 'table' | 'csv';
    color?: boolean;
    verbose?: boolean;
}
