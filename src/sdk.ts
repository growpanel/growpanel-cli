// SDK accessor — gives every command access to the typed GrowPanel client.
//
// Why this exists alongside the legacy `GrowPanelClient` in client.ts: the SDK\'s
// `gp.reports.getMrr(...)` style is the long-term API for new commands, and gives
// typed parameters + response shapes for free. The path-based `client.get('/reports/mrr', ...)`
// in client.ts still works for the dynamic `reports <name>` and `api <method> <path>`
// commands where the endpoint isn\'t known at compile time — those will keep using it.
//
// Migration plan: any command that targets a SPECIFIC known endpoint should switch to
// the SDK (typed params, typed response). Dynamic generic commands stay on client.ts.

import { GrowPanel } from '@growpanel/sdk';
import type { Config } from './types.js';

export function buildSDK(config: Config): GrowPanel {
    return new GrowPanel({
        apiKey: config.apiKey,
        baseUrl: config.apiUrl
    });
}
