import { Point } from "@/types";
import { AreaClosed as VisxAreaClosed } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveBasis } from "@visx/curve";
import useTimeWindow from "@/hooks/useTimeWindow";
import useVisibleData from "@/hooks/useVisibleData";
import useSmoothedData from "@/hooks/useSmoothedData";
import useTimelineScales from "@/hooks/useTimelineScales";
import TimelineContainer from "@/components/ui/TimelineContainer";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { RequestTimelineVisxProps } from "@/types";

type MetricType = "total" | "errors" | "rateLimits" | "success" | "timeouts";
type Frequency = "raw" | "perSecond" | "perMinute" | "perHour";

type Props = RequestTimelineVisxProps & {
    zoomLevel?: number;
    height?: number;
    metricTypes?: MetricType[]; // <-- tableau de metrics
    frequency?: Frequency;
};

export const METRIC_COLORS: Record<MetricType, string> = {
    total: "#4f46e5",
    errors: "#e53e3e",
    rateLimits: "#f59e42",
    success: "#22c55e",
    timeouts: "#64748b"
};

function getValue(point: Point, metricType: MetricType) {
    switch (metricType) {
        case "total": return point.total;
        case "errors": return point.errors;
        case "rateLimits": return point.rateLimits;
        case "success": return point.total - point.errors - point.timeouts - point.rateLimits;
        case "timeouts": return point.timeouts;
        default: return point.total;
    }
}

function CustomAreaClosed({
    data,
    x,
    y,
    yScale,
    stroke,
    fill,
    curve,
    style,
    mask
}: {
    data: { timestamp: number; value: number }[];
    x: (d: any) => number;
    y: (d: any) => number;
    yScale: any;
    stroke: string;
    fill: string;
    curve: any;
    style: React.CSSProperties;
    mask: string;
}) {
    const compatibleData = data.map(d => ({
        timestamp: d.timestamp,
        value: d.value,
        total: d.value,
        errors: 0,
        timeouts: 0,
        rateLimits: 0,
        opacity: 1
    }));

    return (
        <VisxAreaClosed
            data={compatibleData}
            x={x}
            y={y}
            yScale={yScale}
            stroke={stroke}
            fill={fill}
            curve={curve}
            style={style}
            mask={mask}
        />
    );
}

function aggregateCalls(
    data: Point[],
    windowMs: number,
    getValue: (p: Point) => number,
    alignedStart: number,
    alignedEnd: number
): { timestamp: number; value: number }[] {
    const result: { timestamp: number; value: number }[] = [];
    let dataIdx = 0;
    let prevValue: number | null = null;

    for (
        let bucketStart = alignedStart;
        bucketStart < alignedEnd;
        bucketStart += windowMs
    ) {
        let firstIdx = dataIdx;
        while (firstIdx < data.length && data[firstIdx].timestamp < bucketStart) firstIdx++;
        let lastIdx = firstIdx;
        while (lastIdx < data.length && data[lastIdx].timestamp < bucketStart + windowMs) lastIdx++;

        if (lastIdx - firstIdx > 1) {
            const value =
                getValue(data[lastIdx - 1]) - getValue(data[firstIdx]);
            result.push({
                timestamp: bucketStart,
                value: value / (windowMs / 1000),
            });
            prevValue = getValue(data[lastIdx - 1]);
            dataIdx = lastIdx;
        } else {
            result.push({
                timestamp: bucketStart,
                value: 0,
            });
        }
    }
    return result;
}

function smoothAggregatedData(
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

function removeNaN(data: { timestamp: number; value: number }[]) {
    return data.filter(d => !isNaN(d.value) && isFinite(d.value));
}

function RequestTimelineVisx({
    data,
    zoomLevel = 1,
    height = 260,
    metricTypes = [
        "total"],
    duration,
    frequency = "raw",
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(800);

    useEffect(() => {
        function updateWidth() {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth || 800);
            }
        }
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    const computedDuration = duration ?? 3600 * 24 / zoomLevel;
    const SMOOTH_WINDOW = 200 / zoomLevel;

    const { windowStart, virtualNow } = useTimeWindow(computedDuration);
    const visibleData = useVisibleData(data, windowStart);
    const smoothed = useSmoothedData(visibleData, SMOOTH_WINDOW);

    const series = useMemo(
        () =>
            metricTypes.map(metricType => {
                let displayData: { timestamp: number; value: number }[] = [];

                if (frequency === "raw") {
                    displayData = smoothed.map(d => ({
                        timestamp: d.timestamp,
                        value: getValue(d, metricType),
                    }));
                } else {
                    let windowMs = 100;
                    if (frequency === "perSecond") {
                        windowMs = Math.max(100, Math.floor((virtualNow - windowStart) / containerWidth));
                    }
                    if (frequency === "perMinute") {
                        windowMs = Math.max(1000, Math.floor((virtualNow - windowStart) / containerWidth));
                    }
                    if (frequency === "perHour") {
                        windowMs = Math.max(60_000, Math.floor((virtualNow - windowStart) / containerWidth));
                    }

                    let alignedEnd = Math.ceil(virtualNow / windowMs) * windowMs;
                    let bucketCount = Math.max(2, Math.ceil((alignedEnd - windowStart) / windowMs));
                    let alignedStart = alignedEnd - bucketCount * windowMs;

                    const bucketMargin = 2 * windowMs;
                    const visibleForBucket = data.filter(d => d.timestamp >= alignedStart - bucketMargin && d.timestamp <= alignedEnd);

                    const aggregated = aggregateCalls(
                        visibleForBucket,
                        windowMs,
                        p => getValue(p, metricType),
                        alignedStart,
                        alignedEnd
                    );

                    if (aggregated.length <= 200) {
                        displayData = smoothAggregatedData(aggregated, Math.round(SMOOTH_WINDOW / 10));
                    } else {
                        displayData = aggregated;
                    }
                }
                return {
                    metricType,
                    color: METRIC_COLORS[metricType],
                    data: removeNaN(displayData),
                };
            }),
        [metricTypes, frequency, smoothed]
    );

    const allDisplayData = series.flatMap(s => s.data);
    const hasEnoughData = allDisplayData.length > 1;
    if (!hasEnoughData) {
        allDisplayData.push({ timestamp: Date.now() - 1000, value: 0 });
        allDisplayData.push({ timestamp: Date.now(), value: 0 });
    }

    const { xScale, yScale, yMax, margin } = useTimelineScales(
        allDisplayData,
        windowStart,
        virtualNow,
        containerWidth,
        height
    );

    if (!metricTypes || metricTypes.length === 0) {
        return (
            <div ref={containerRef} style={{ width: "100%" }}>
                <TimelineContainer width={containerWidth} height={height}>
                    <text
                        x={containerWidth / 2}
                        y={height / 2}
                        textAnchor="middle"
                        fill="#888"
                        fontSize={16}
                    >
                        Please select a response type
                    </text>
                </TimelineContainer>
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ width: "100%" }}>
            <TimelineContainer width={containerWidth} height={height}>
                {hasEnoughData ? (
                    <>
                        {series.map(serie => (
                            <CustomAreaClosed
                                key={serie.metricType}
                                data={serie.data}
                                x={d => xScale(d.timestamp)}
                                y={d => yScale(d.value)}
                                yScale={yScale}
                                stroke={serie.color}
                                fill="none"
                                curve={curveBasis}
                                style={{ opacity: 0.8 }}
                                mask="url(#fadeMask)"
                            />
                        ))}

                        <AxisBottom
                            top={yMax}
                            scale={xScale}
                            numTicks={Math.max(3, Math.floor(containerWidth / 150))}
                            tickFormat={d =>
                                new Date(Number(d)).toLocaleTimeString("en-US", {
                                    hour12: false,
                                    day: computedDuration > 86400 ? "2-digit" : undefined,
                                    weekday: computedDuration > 604800 ? "long" : undefined,
                                    hour: computedDuration > 3600 ? "2-digit" : undefined,
                                    minute: computedDuration < 604800 ? "2-digit" : undefined,
                                    second: computedDuration < 3600 ? "2-digit" : undefined,
                                })
                            }
                            tickLabelProps={() => ({
                                fill: "#888",
                                fontSize: 10,
                                textAnchor: "middle",
                                fontFamily: "Arial",
                                fontWeight: 400,
                                dy: 0,
                                dx: 0,
                                strokeWidth: 1,
                                stroke: "#888",
                                strokeOpacity: 0.2,
                                textDecoration: "none",
                                texttransform: "none",
                            })}
                            tickLineProps={{ stroke: "#888", strokeWidth: 1 }}
                            hideAxisLine={false}
                            hideTicks={false}
                        />
                        <AxisLeft
                            left={margin.left}
                            scale={yScale}
                            numTicks={4}
                            tickFormat={d => d.toString()}
                            tickLabelProps={() => ({
                                fill: "#888",
                                fontSize: 10,
                                textAnchor: "end",
                                fontFamily: "Arial",
                                fontWeight: 400,
                                dy: 0,
                                dx: -5,
                                strokeWidth: 1,
                                stroke: "#666",
                                strokeOpacity: 0.2,
                                textDecoration: "none",
                                texttransform: "none",
                            })}
                            tickLineProps={{ stroke: "#888", strokeWidth: 1 }}
                            hideAxisLine={false}
                            hideTicks={false}
                        />
                    </>
                ) : (
                    <text
                        x={containerWidth / 2}
                        y={height / 2}
                        textAnchor="middle"
                        fill="#888"
                        fontSize={16}
                    >
                        Not enough data for this zoom level
                    </text>
                )}
            </TimelineContainer>
        </div>
    );
}

export default React.memo(RequestTimelineVisx);