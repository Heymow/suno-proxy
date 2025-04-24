import fs from 'fs';
import path from 'path';

const statsFilePath = path.join(__dirname, 'api-stats.json');


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

loadApiStats();

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

    saveApiStats();
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

function saveApiStats(): void {
    try {
        fs.mkdirSync(path.dirname(statsFilePath), { recursive: true });
        fs.writeFileSync(statsFilePath, JSON.stringify(apiStats, null, 2));
    } catch (error) {
        console.error('Error saving API stats:', error);
    }
}

function loadApiStats(): void {
    try {
        if (fs.existsSync(statsFilePath)) {
            const data = fs.readFileSync(statsFilePath, 'utf-8');
            const parsed = JSON.parse(data);
            Object.assign(apiStats, parsed);
            console.log('API stats loaded from file.');
        }
    } catch (error) {
        console.error('Error loading API stats:', error);
    }
}