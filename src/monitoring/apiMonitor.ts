import fs from 'fs';
import path from 'path';
import { normalizeUrl } from '../utils/normalizeUrl.js';
import { ApiStats, TimelinePoint } from '../types/ApiTypes.js';
import { broadcastTimelinePoint } from '../websocket/wsServer.js';

const isProd = process.env.NODE_ENV === 'production';

const statsFilePath = isProd
    ? path.join('/tmp', 'api-stats.json')
    : path.resolve(process.cwd(), 'data', 'api-stats.json');

const timelineFilePath = isProd
    ? path.join('/tmp', 'timeline-data.json')
    : path.resolve(process.cwd(), 'data', 'timeline-data.json');

const DISPLAY_DURATION_MS = 60 * 60 * 1000; // 1h
const PRECISION_MS = 100; // 100ms par point
const MAX_POINTS = DISPLAY_DURATION_MS / PRECISION_MS;

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

const timeline: TimelinePoint[] = [];

setInterval(() => {
    saveTimeline();
    saveApiStats();
}, 10000);

loadApiStats();
loadTimeline();

setInterval(() => {
    const now = Date.now();
    const last = timeline.at(-1);
    if (!last || now - last.timestamp >= PRECISION_MS) {
        const point = {
            timestamp: now,
            total: apiStats.total,
            errors: apiStats.errors,
            timeouts: apiStats.timeouts,
            rateLimits: apiStats.rateLimits
        };
        timeline.push(point);
        if (timeline.length > MAX_POINTS) timeline.shift();
        broadcastTimelinePoint(point);
    }
}, PRECISION_MS);

export function logApiCall(url: string, status: number, message?: string): void {
    apiStats.total++;
    apiStats.perStatus[status] = (apiStats.perStatus[status] || 0) + 1;
    const normalizedUrl = normalizeUrl(url);
    apiStats.perEndpoint[normalizedUrl] = (apiStats.perEndpoint[normalizedUrl] || 0) + 1;

    if (status >= 200 && status < 300) {
        apiStats.success++;
    } else {
        apiStats.errors++;
        if (status === 429) apiStats.rateLimits++;
        if (message?.toLowerCase().includes('timeout')) apiStats.timeouts++;

        apiStats.lastErrors.push({
            url: normalizedUrl,
            status,
            message,
            timestamp: Date.now(),
        });

        if (apiStats.lastErrors.length > 20) apiStats.lastErrors.shift();
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
    timeline.length = 0;
    saveApiStats();
    saveTimeline();
    console.log('API stats and timeline have been reset.');
}

export function getTimeline(): TimelinePoint[] {
    return timeline;
}

export function getLastPoint(): TimelinePoint | null {
    return timeline.at(-1) || null;
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

function saveTimeline(): void {
    try {
        fs.mkdirSync(path.dirname(timelineFilePath), { recursive: true });
        fs.writeFileSync(timelineFilePath, JSON.stringify(timeline, null, 2));
    } catch (error) {
        console.error('Error saving timeline:', error);
    }
}

function loadTimeline(): void {
    try {
        if (fs.existsSync(timelineFilePath)) {
            const data = fs.readFileSync(timelineFilePath, 'utf-8');
            const parsed = JSON.parse(data);
            timeline.push(...parsed);
            console.log('Timeline loaded from file.');
        }
    } catch (error) {
        console.error('Error loading timeline:', error);
    }
}
