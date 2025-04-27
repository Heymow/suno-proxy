import React from "react";
import { LinearGradient } from "@visx/gradient";

export default function TimelineContainer({
    width,
    height,
    children,
}: {
    width: number;
    height: number;
    children: React.ReactNode;
}) {
    return (
        <div style={{ position: "relative", "marginLeft": 20 }}>
            <svg width={width} height={height} style={{ overflow: "visible" }}>
                <mask id="fadeMask">
                    <linearGradient id="fadeGradient" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="black" stopOpacity="0" />
                        <stop offset="15%" stopColor="white" stopOpacity="1" />
                        <stop offset="94%" stopColor="white" stopOpacity="1" />
                        <stop offset="95%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#fadeGradient)" />
                </mask>
                <LinearGradient id="areaGradient" from="#4f46e5" to="#4f46e5" toOpacity={0} />
                <LinearGradient id="criticalGradient" from="#dc2626" to="#dc2626" toOpacity={0} />
                {children}
            </svg>
        </div>
    );
}