import { Point } from "@/types";
import { AreaClosed as VisxAreaClosed } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveBasis } from "@visx/curve";
import useTimeWindow from "@/hooks/useTimeWindow";
import useVisibleData from "@/hooks/useVisibleData";
import useSmoothedData from "@/hooks/useSmoothedData";
import useTimelineScales from "@/hooks/useTimelineScales";
import TimelineContainer from "@/components/ui/TimelineContainer";
import React, { useRef, useState, useEffect } from "react";
import { RequestTimelineVisxProps } from "@/types";

type MetricType = "total" | "errors" | "rateLimits" | "success" | "timeouts";
type Frequency = "raw" | "perSecond" | "perMinute" | "perHour";

type Props = RequestTimelineVisxProps & {
    zoomLevel?: number;
    height?: number;
    metricType?: MetricType;
    frequency?: Frequency;
};

// Définir un wrapper pour AreaClosed qui masque les détails de typage
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
    // Converti données en format compatible
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

// Helper pour calculer les calls par période
function aggregateCalls(
    data: Point[],
    windowMs: number,
    getValue: (p: Point) => number
): { timestamp: number; value: number }[] {
    if (data.length < 2) return [];
    const result: { timestamp: number; value: number }[] = [];
    let i = 0;
    while (i < data.length - 1) {
        const start = data[i].timestamp;
        const end = start + windowMs;
        let j = i + 1;
        while (j < data.length && data[j].timestamp < end) j++;
        const value = getValue(data[j - 1]) - getValue(data[i]);
        result.push({ timestamp: start, value: value / (windowMs / 1000) });
        i = j;
    }
    return result;
}

// Smoothing pour les séries dérivées
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

// Ajout d'une fonction pour filtrer les points avec NaN
function removeNaN(data: { timestamp: number; value: number }[]) {
    return data.filter(d => !isNaN(d.value) && isFinite(d.value));
}

function RequestTimelineVisx({
    data,
    zoomLevel = 1,
    height = 260,
    duration,
    metricType = "total",
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

    // Sélectionne la bonne clé selon metricType
    function getValue(point: Point) {
        switch (metricType) {
            case "total": return point.total;
            case "errors": return point.errors;
            case "rateLimits": return point.rateLimits;
            case "success": return point.total - point.errors - point.timeouts - point.rateLimits;
            case "timeouts": return point.timeouts;
            default: return point.total;
        }
    }

    // Toujours appeler le hook, même si tu ne l'utilises pas
    const smoothed = useSmoothedData(visibleData, SMOOTH_WINDOW);

    let displayData: { timestamp: number; value: number }[] = [];
    if (frequency === "raw") {
        displayData = smoothed.map(d => ({
            timestamp: d.timestamp,
            value: getValue(d),
        }));
    } else {
        let windowMs = 1000;
        if (frequency === "perMinute") windowMs = 60_000;
        if (frequency === "perHour") windowMs = 3_600_000;
        const aggregated = aggregateCalls(visibleData, windowMs, getValue);
        displayData = smoothAggregatedData(aggregated, Math.round(SMOOTH_WINDOW / 10));
    }

    const safeDisplayData = removeNaN(displayData);

    // Si aucune donnée valide, ajoute des valeurs par défaut pour éviter les erreurs
    const hasEnoughData = safeDisplayData.length > 1;
    if (!hasEnoughData) {
        safeDisplayData.push({ timestamp: Date.now() - 1000, value: 0 });
        safeDisplayData.push({ timestamp: Date.now(), value: 0 });
    }

    const { xScale, yScale, yMax, margin } = useTimelineScales(
        safeDisplayData,
        windowStart,
        virtualNow,
        containerWidth,
        height
    );

    return (
        <div ref={containerRef} style={{ width: "100%" }}>
            <TimelineContainer width={containerWidth} height={height}>
                {hasEnoughData ? (
                    <>
                        <CustomAreaClosed
                            data={safeDisplayData}
                            x={d => xScale(d.timestamp)}
                            y={d => yScale(d.value)}
                            yScale={yScale}
                            stroke="#4f46e5"
                            fill="url(#areaGradient)"
                            curve={curveBasis}
                            style={{ opacity: 0.8 }}
                            mask="url(#fadeMask)"
                        />

                        {/* Reste inchangé */}
                        <AxisBottom
                            top={yMax}
                            scale={xScale}
                            numTicks={Math.max(3, Math.floor(containerWidth / 150))}
                            tickFormat={d =>
                                new Date(Number(d)).toLocaleTimeString("en-US", {
                                    hour12: false,
                                    year: computedDuration > 31536000 ? "numeric" : undefined,
                                    month: computedDuration > 2592000 ? "2-digit" : undefined,
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
                        Not enough data
                    </text>
                )}
            </TimelineContainer>
        </div>
    );
}

export default React.memo(RequestTimelineVisx);