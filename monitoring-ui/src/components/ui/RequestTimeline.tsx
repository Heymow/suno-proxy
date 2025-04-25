import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Point } from "@/types";
import { memo, useMemo, useState, useEffect } from "react";

// 10 minutes de défilement à l’écran
const DISPLAY_DURATION_MS = 20 * 60 * 1000;

const RequestTimeline = memo(({ data }: { data: Point[] }) => {
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : Date.now();
    const [virtualNow, setVirtualNow] = useState(lastTimestamp);

    useEffect(() => {
        const interval = setInterval(() => {
            setVirtualNow(Date.now());
        }, 250); // ou 250ms

        return () => clearInterval(interval);
    }, []);

    const windowStart = virtualNow - DISPLAY_DURATION_MS;

    const visibleData = useMemo(() => {
        const windowed = data.filter(d => d.timestamp >= windowStart);
        const sampling = Math.max(1, Math.ceil(windowed.length / 500));
        return windowed
            .filter((_, i) => i % sampling === 0)
            .map((d) => ({
                ...d,
                critical: d.errors + d.timeouts + d.rateLimits,
            }));
    }, [data, windowStart]);

    return (
        <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={visibleData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={[windowStart, virtualNow]}
                        tickFormatter={(value: number) =>
                            new Date(value).toLocaleTimeString("en-GB", {
                                minute: "2-digit",
                                second: "2-digit",
                                // @ts-expect-error
                                fractionalSecondDigits: 1,
                            })
                        }
                        tick={{ fontSize: 10 }}
                        scale="time"
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                        isAnimationActive={false}
                        wrapperStyle={{ pointerEvents: 'none' }} // empêche les recalculs sur hover
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const { timestamp, total, critical } = payload[0].payload;
                            return (
                                <div className="bg-background p-2 rounded-md shadow text-xs">
                                    <div><strong>{new Date(timestamp).toLocaleTimeString("en-GB", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                        // @ts-expect-error
                                        fractionalSecondDigits: 1
                                    })}</strong></div>
                                    <div>Total: {total}</div>
                                    <div className="text-red-500">Critical: {critical}</div>
                                </div>
                            );
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#4f46e5"
                        fillOpacity={1}
                        fill="url(#totalGradient)"
                        isAnimationActive={false}
                    />
                    <Area
                        type="monotone"
                        dataKey="critical"
                        stroke="#dc2626"
                        fillOpacity={1}
                        fill="url(#errorGradient)"
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
});

export default RequestTimeline;
