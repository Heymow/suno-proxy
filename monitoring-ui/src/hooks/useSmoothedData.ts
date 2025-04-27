import { useMemo } from "react";
import { Point } from "@/types";

export default function useSmoothedData(data: Point[], windowSize = 5) {
    return useMemo(() => {
        if (data.length < windowSize) return data;
        const smoothed: Point[] = [];
        for (let i = 0; i < data.length; i++) {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
            const window = data.slice(start, end);
            const avg = (key: keyof Point) =>
                window.reduce((sum, d) => sum + (d[key] as number), 0) / window.length;
            smoothed.push({
                ...data[i],
                total: avg("total"),
                errors: avg("errors"),
                timeouts: avg("timeouts"),
                rateLimits: avg("rateLimits"),
            });
        }
        return smoothed;
    }, [data, windowSize]);
}