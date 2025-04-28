import { Props } from "@/types";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveBasis } from "@visx/curve";
import useTimeWindow from "@/hooks/useTimeWindow";
import useVisibleData from "@/hooks/useVisibleData";
import useSmoothedData from "@/hooks/useSmoothedData";
import useTimelineScales from "@/hooks/useTimelineScales";
import TimelineContainer from "@/components/ui/TimelineContainer";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { getSeries, filterSeriesByWindow } from "./RequestTimeline/series";
import CustomAreaClosed from "./RequestTimeline/customAreaClosed";

function RequestTimelineVisx({
    data,
    zoomLevel = 1,
    height = 260,
    metricTypes = ["total"],
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
        () => getSeries({ metricTypes, frequency, smoothed, visibleData, zoomLevel }),
        [metricTypes, frequency, smoothed, visibleData, zoomLevel]
    );

    const filteredSeries = useMemo(
        () => filterSeriesByWindow(series, windowStart, virtualNow),
        [series, windowStart, virtualNow]
    );

    const allDisplayData = useMemo(
        () => filteredSeries.flatMap(s => s.data),
        [filteredSeries]
    );

    const { xScale, yScale, yMax, margin } = useTimelineScales(
        allDisplayData,
        windowStart,
        virtualNow,
        containerWidth,
        height
    );

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
                        {filteredSeries
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
                        {filteredSeries.map(serie => (
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