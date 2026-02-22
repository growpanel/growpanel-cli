import type { Config } from './types.js';
import { ApiError } from './errors.js';

export class GrowPanelClient {
    private baseUrl: string;
    private apiKey: string;
    private verbose: boolean;

    constructor(config: Config) {
        this.baseUrl = config.apiUrl.replace(/\/$/, '');
        this.apiKey = config.apiKey;
        this.verbose = config.verbose;
    }

    private buildUrl(path: string, params?: Record<string, string | undefined>): string {
        const url = new URL(path, this.baseUrl);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== '') {
                    url.searchParams.set(key, value);
                }
            }
        }
        return url.toString();
    }

    private log(method: string, url: string): void {
        if (this.verbose) {
            process.stderr.write(`${method} ${url}\n`);
        }
    }

    private async request<T>(method: string, path: string, options?: {
        params?: Record<string, string | undefined>;
        body?: unknown;
    }): Promise<T> {
        const url = this.buildUrl(path, options?.params);
        this.log(method, url);

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
        };

        const res = await fetch(url, {
            method,
            headers,
            body: options?.body ? JSON.stringify(options.body) : undefined,
        });

        if (this.verbose) {
            process.stderr.write(`← ${res.status} ${res.statusText}\n`);
        }

        if (!res.ok) {
            let body: unknown;
            try {
                body = await res.json();
            } catch {
                body = await res.text();
            }
            const message = (body && typeof body === 'object' && 'error' in body)
                ? String((body as Record<string, unknown>).error)
                : `HTTP ${res.status} ${res.statusText}`;
            throw new ApiError(res.status, message, body);
        }

        // Handle 204 No Content
        if (res.status === 204) {
            return undefined as T;
        }

        return await res.json() as T;
    }

    async get<T = unknown>(path: string, params?: Record<string, string | undefined>): Promise<T> {
        return this.request<T>('GET', path, { params });
    }

    async post<T = unknown>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('POST', path, { body });
    }

    async put<T = unknown>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('PUT', path, { body });
    }

    async delete<T = unknown>(path: string): Promise<T> {
        return this.request<T>('DELETE', path);
    }

    async getRaw(path: string, params?: Record<string, string | undefined>): Promise<string> {
        const url = this.buildUrl(path, params);
        this.log('GET', url);

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        if (!res.ok) {
            let body: unknown;
            try { body = await res.json(); } catch { body = await res.text(); }
            const message = (body && typeof body === 'object' && 'error' in body)
                ? String((body as Record<string, unknown>).error)
                : `HTTP ${res.status}`;
            throw new ApiError(res.status, message, body);
        }

        return await res.text();
    }
}
