type ApiStats = {
    success: number;
    errors: number;
    timeouts: number;
    rateLimits: number;
    total: number;
    perStatus: Record<number, number>;
    perEndpoint: Record<string, number>;
    lastErrors: { url: string; status: number; message?: string; timestamp: number }[];
};

const apiStats: ApiStats = {
    success: 0,
    errors: 0,
    timeouts: 0,
    rateLimits: 0,
    total: 0,
    perStatus: {},
    perEndpoint: {},
    lastErrors: []
};

export function logApiCall(url: string, status: number, message?: string): void {
    apiStats.total++;

    apiStats.perStatus[status] = (apiStats.perStatus[status] || 0) + 1;

    apiStats.perEndpoint[url] = (apiStats.perEndpoint[url] || 0) + 1;

    if (status >= 200 && status < 300) {
        apiStats.success++;
    } else {
        apiStats.errors++;
        if (status === 429) apiStats.rateLimits++;
        if (message?.toLowerCase().includes('timeout')) apiStats.timeouts++;

        apiStats.lastErrors.push({ url, status, message, timestamp: Date.now() });
        if (apiStats.lastErrors.length > 20) {
            apiStats.lastErrors.shift();
        }

        console.warn(`[API ERROR] ${status} | ${url}${message ? ` | ${message}` : ''}`);
    }
}

export function getApiStats(): ApiStats {
    return apiStats;
}

export function resetApiStats(): void {
    apiStats.success = 0;
    apiStats.errors = 0;
    apiStats.timeouts = 0;
    apiStats.rateLimits = 0;
    apiStats.total = 0;
    apiStats.perStatus = {};
    apiStats.perEndpoint = {};
    apiStats.lastErrors = [];

    console.log('API stats have been reset.');
}
