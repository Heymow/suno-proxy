import { getValue, rollingRate, smoothAggregatedData, removeNaN, binPerSecond, MetricType, Frequency } from "./timelineUtils";
import { Point } from "@/types";
import { METRIC_COLORS } from "./timeLineConstants";

export function getSeries({
    metricTypes,
    frequency,
    smoothed,
    visibleData,
    zoomLevel
}: {
    metricTypes: MetricType[],
    frequency: Frequency,
    smoothed: { timestamp: number;[key: string]: any }[],
    visibleData: Point[],
    zoomLevel: number
}) {
    return metricTypes.map(metricType => {
        if (frequency === "raw") {
            return {
                metricType,
                color: METRIC_COLORS[metricType],
                data: removeNaN(smoothed.map(d => ({
                    timestamp: d.timestamp,
                    value: getValue({ ...d, total: 0, errors: 0, timeouts: 0, rateLimits: 0 }, metricType),
                }))),
            };
        }
        if (frequency === "perSecond") {
            return {
                metricType,
                color: METRIC_COLORS[metricType],
                data: removeNaN(binPerSecond(visibleData, metricType)),
            };
        }
        let windowMs = 60_000;
        if (frequency === "perMinute") windowMs = 60_000;
        if (frequency === "perHour") windowMs = 3_600_000;
        const rolling = rollingRate(
            visibleData,
            d => getValue(d, metricType),
            windowMs
        );
        const lissaged = smoothAggregatedData(
            rolling,
            Math.min(3, Math.round(1000 / zoomLevel))
        );
        return {
            metricType,
            color: METRIC_COLORS[metricType],
            data: removeNaN(lissaged),
        };
    });
}

export function filterSeriesByWindow(
    series: {
        metricType: MetricType,
        color: string,
        data: { timestamp: number; value: number }[]
    }[],
    windowStart: number,
    virtualNow: number
) {
    return series.map(serie => ({
        ...serie,
        data: serie.data.filter(
            d => d.timestamp >= windowStart && d.timestamp <= virtualNow
        ),
    }));
}