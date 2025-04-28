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
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";

type MetricType = "total" | "errors" | "rateLimits" | "success" | "timeouts";
type Frequency = "raw" | "perSecond" | "perMinute" | "perHour";

type Props = RequestTimelineVisxProps & {
    zoomLevel?: number;
    height?: number;
    metricTypes?: MetricType[];
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

function rollingRate(
    data: Point[],
    getValue: (p: Point) => number,
    windowMs: number
): { timestamp: number; value: number }[] {
    if (data.length < 2) return [];
    const result: { timestamp: number; value: number }[] = [];
    let left = 0;
    for (let right = 1; right < data.length; right++) {
        const t = data[right].timestamp;
        // Décale la fenêtre à gauche
        while (left < right && data[left].timestamp < t - windowMs) {
            left++;
        }
        const dt = (data[right].timestamp - data[left].timestamp) / 1000; // en secondes
        const dv = getValue(data[right]) - getValue(data[left]);
        const rate = dt > 0 ? dv / (dt / (windowMs / 1000)) : 0;
        result.push({ timestamp: t, value: rate });
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
                    let windowMs = 60_000;
                    if (frequency === "perSecond") windowMs = 1_000;
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
                    const averageInterval = (rolling[1]?.timestamp - rolling[0]?.timestamp) || 1;
                    const filtered = lissaged.filter(
                        d =>
                            d.timestamp <= virtualNow &&
                            d.timestamp >= windowStart + SMOOTH_WINDOW * averageInterval
                    );
                    displayData = filtered;
                }
                return {
                    metricType,
                    color: METRIC_COLORS[metricType],
                    data: removeNaN(displayData),
                };
            }),
        [metricTypes, frequency, smoothed, visibleData, zoomLevel, virtualNow, windowStart, SMOOTH_WINDOW]
    );

    const allDisplayData = useMemo(() => series.flatMap(s => s.data), [series]);

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

    const {
        tooltipData,
        tooltipLeft,
        tooltipTop,
        showTooltip,
        hideTooltip,
    } = useTooltip<{ timestamp: number; value: number }>();

    function handleMouseMove(event: React.MouseEvent<SVGRectElement, MouseEvent>) {
        const point = localPoint(event) || { x: 0, y: 0 };
        const x0 = xScale.invert(point.x!);
        const closest = allDisplayData.reduce((a, b) =>
            Math.abs(b.timestamp - x0.getTime()) < Math.abs(a.timestamp - x0.getTime()) ? b : a
        );

        showTooltip({
            tooltipData: closest,
            tooltipLeft: point.x,
            tooltipTop: point.y,
        });
    }

    return (
        <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
            {tooltipData && (
                <TooltipWithBounds
                    top={tooltipTop}
                    left={tooltipLeft}
                    style={{
                        position: "absolute",
                        backgroundColor: "rgba(0, 0, 0, 0.85)",
                        color: "white",
                        padding: "5px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        lineHeight: "1.5",
                        zIndex: 1000,
                        pointerEvents: "none",
                    }}
                    className="w-fit h-fit bg-accent"
                >
                    <div>
                        <strong>
                            {new Date(tooltipData.timestamp).toLocaleTimeString()}
                        </strong>
                        <br />
                        {series
                            .map(serie => {
                                const point = serie.data.reduce((a, b) =>
                                    Math.abs(b.timestamp - tooltipData.timestamp) < Math.abs(a.timestamp - tooltipData.timestamp) ? b : a
                                );
                                const avgInterval = serie.data.length > 1
                                    ? Math.abs(serie.data[1].timestamp - serie.data[0].timestamp)
                                    : 0;
                                if (
                                    point &&
                                    Math.abs(point.timestamp - tooltipData.timestamp) <= avgInterval * 1.5 &&
                                    point.value !== undefined &&
                                    point.value !== null &&
                                    !isNaN(point.value) &&
                                    point.value !== 0
                                ) {
                                    return (
                                        <div key={serie.metricType} style={{ color: serie.color }}>
                                            {serie.metricType}: {point.value.toFixed(2)}
                                        </div>
                                    );
                                }
                                return null;
                            })
                        }
                    </div>
                </TooltipWithBounds>
            )}
            <TimelineContainer width={containerWidth} height={height}>
                {allDisplayData.length > 1 ? (
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
                        <rect
                            width={containerWidth}
                            height={height}
                            fill="transparent"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={hideTooltip}
                            style={{ cursor: "crosshair" }}
                        />
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