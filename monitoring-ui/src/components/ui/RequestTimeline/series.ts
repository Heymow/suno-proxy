import { getValue, rollingRate, smoothAggregatedData, removeNaN, binByWindow, MetricType, Frequency } from "./timelineUtils";
import { Point } from "@/types";
import { METRIC_COLORS } from "./timelineConstants";

export function getSeries({
    metricTypes,
    frequency,
    visibleData,
    zoomLevel
}: {
    metricTypes: MetricType[],
    frequency: Frequency,
    visibleData: Point[],
    zoomLevel: number
}): { metricType: MetricType, color: string, data: { timestamp: number; value: number }[] }[] {
    const getMetricData = (metricType: MetricType): { metricType: MetricType, color: string, data: { timestamp: number; value: number }[] } | null => {
        const color = METRIC_COLORS[metricType];

        if (frequency === "raw") {
            const data = removeNaN(visibleData.map(d => ({
                timestamp: d.timestamp,
                value: getValue(d, metricType) || 0,
            })));
            return { metricType, color, data };
        }

        if (frequency === "perSecond") {
            const data = removeNaN(binByWindow(visibleData, metricType, 1000));
            return { metricType, color, data };
        }

        if (frequency === "perMinute" || frequency === "perHour") {
            const windowMs = frequency === "perHour" ? 3_600_000 : 60_000;
            const rolling = rollingRate(
                visibleData,
                d => getValue(d, metricType),
                windowMs
            );
            const smoothedData = smoothAggregatedData(
                rolling,
                Math.min(300, Math.round(1000 / zoomLevel))
            );
            const data = removeNaN(smoothedData);
            return { metricType, color, data };
        }

        return null;
    };

    return metricTypes
        .map(getMetricData)
        .filter((s): s is { metricType: MetricType, color: string, data: { timestamp: number; value: number }[] } => !!s);
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