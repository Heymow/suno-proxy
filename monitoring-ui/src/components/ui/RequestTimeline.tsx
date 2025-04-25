import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { Point } from "@/types";
import { memo, useMemo } from "react";

// Nombre fixe de colonnes affichées à l’écran
const VISIBLE_POINTS = 300;

const RequestTimeline = memo(({ data }: { data: Point[] }) => {
    const displayedData = useMemo(() => {
        const slice = data.slice(-VISIBLE_POINTS);

        return slice.map((d) => ({
            ...d,
            label: new Date(d.timestamp).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                // @ts-expect-error: still works
                fractionalSecondDigits: 1,
            }),
            critical: d.errors + d.timeouts + d.rateLimits,
        }));
    }, [data]);

    return (
        <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={displayedData}
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
                        domain={['dataMin', 'dataMax']}
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
