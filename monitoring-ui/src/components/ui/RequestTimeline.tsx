import { Point } from "@/types";
import { AreaClosed } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveBasis } from "@visx/curve";
import useTimeWindow from "@/hooks/useTimeWindow";
import useVisibleData from "@/hooks/useVisibleData";
import useSmoothedData from "@/hooks/useSmoothedData";
import useTimelineScales from "@/hooks/useTimelineScales";
import TimelineContainer from "@/components/ui/TimelineContainer";
import React, { useRef, useState, useEffect } from "react";
import { RequestTimelineVisxProps } from "@/types";

type MetricType = "total" | "errors" | "callsPerSecond" | "callsPerMinute" | "callsPerHour";

type Props = RequestTimelineVisxProps & {
    zoomLevel?: number;
    height?: number;
    metric?: MetricType;
};

function RequestTimelineVisx({
    data,
    zoomLevel = 1,
    height = 260,
    duration,
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
    const smoothedData = useSmoothedData(visibleData, SMOOTH_WINDOW);

    const { xScale, yScale, yMax, margin } = useTimelineScales(
        visibleData,
        windowStart,
        virtualNow,
        containerWidth,
        height
    );

    const hasEnoughData = visibleData && visibleData.length > 1;

    return (
        <div ref={containerRef} style={{ width: "100%" }}>
            <TimelineContainer width={containerWidth} height={height}>
                {hasEnoughData ? (
                    <>
                        <AreaClosed<Point>
                            data={smoothedData}
                            x={d => xScale(d.timestamp)}
                            y={d => yScale(d.total)}
                            yScale={yScale}
                            stroke="#4f46e5"
                            fill="url(#areaGradient)"
                            curve={curveBasis}
                            style={{ opacity: 0.8 }}
                            mask="url(#fadeMask)"
                        />
                        <AreaClosed<Point>
                            data={smoothedData}
                            x={d => xScale(d.timestamp)}
                            y={d => yScale(d.errors + d.timeouts + d.rateLimits)}
                            yScale={yScale}
                            stroke="#dc2626"
                            fill="url(#criticalGradient)"
                            curve={curveBasis}
                            style={{ opacity: 0.8 }}
                            mask="url(#fadeMask)"
                        />
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

                                textTransform: "none",

                            })}
                            tickLineProps={{ stroke: "#888", strokeWidth: 1 }}
                            hideAxisLine={false}
                            hideTicks={false}
                        />
                        <AxisLeft left={margin.left}
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
                                textTransform: "none",
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