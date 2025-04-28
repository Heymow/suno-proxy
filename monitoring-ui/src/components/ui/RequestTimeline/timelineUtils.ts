import { Point } from "@/types";

export type MetricType = "total" | "errors" | "rateLimits" | "success" | "timeouts";
export type Frequency = "raw" | "perSecond" | "perMinute" | "perHour";

export function getValue(point: Point, metricType: MetricType) {
    switch (metricType) {
        case "total": return point.total;
        case "errors": return point.errors;
        case "rateLimits": return point.rateLimits;
        case "success": return point.total - point.errors - point.timeouts - point.rateLimits;
        case "timeouts": return point.timeouts;
        default: return point.total;
    }
}

export function rollingRate(
    data: Point[],
    getValue: (p: Point) => number,
    windowMs: number
): { timestamp: number; value: number }[] {
    if (data.length < 2) return [];
    const result: { timestamp: number; value: number }[] = [];
    let left = 0;
    for (let right = 1; right < data.length; right++) {
        const t = data[right].timestamp;
        while (left < right && data[left].timestamp < t - windowMs) {
            left++;
        }
        if (left === right || left === 0) continue;
        const dt = (data[right].timestamp - data[left].timestamp) / 1000;
        const dv = getValue(data[right]) - getValue(data[left]);
        const rate = dt > 0 ? dv / (dt / (windowMs / 1000)) : 0;
        result.push({ timestamp: t, value: rate });
    }
    return result;
}

export function smoothAggregatedData(
    data: { timestamp: number; value: number }[],
    window: number
) {
    if (data.length < 2) return data;
    const result = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - window + 1);
        const windowData = data.slice(start, i + 1);
        const avg =
            windowData.reduce((sum, d) => sum + d.value, 0) / windowData.length;
        result.push({ ...data[i], value: avg });
    }
    return result;
}

export function removeNaN(data: { timestamp: number; value: number }[]) {
    return data.filter(d => !isNaN(d.value) && isFinite(d.value));
}

export function binByWindow(
    data: Point[],
    metricType: MetricType,
    binSize: number
): { timestamp: number; value: number }[] {
    if (data.length < 2) return [];
    const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
    const minTs = sorted[0].timestamp;
    const maxTs = sorted[sorted.length - 1].timestamp;
    const bins = [];
    for (let binStart = minTs; binStart < maxTs; binStart += binSize) {
        const binEnd = binStart + binSize;
        const left = [...sorted].reverse().find(d => d.timestamp <= binStart);
        const right = [...sorted].reverse().find(d => d.timestamp <= binEnd);
        if (!left || !right || left === right) continue;

        if (left === sorted[0]) continue;
        const value = getValue(right, metricType) - getValue(left, metricType);
        bins.push({ timestamp: binStart + binSize / 2, value: Math.max(0, value) });
    }
    return bins;
}