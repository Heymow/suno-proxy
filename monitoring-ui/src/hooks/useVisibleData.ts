import { useMemo } from "react";
import { Point } from "@/types";

const MAX_POINTS = 500;
const FADE_MARGIN = 5;

export default function useVisibleData(data: Point[], windowStart: number) {
    return useMemo(() => {
        const filtered = data.filter((d) => d.timestamp >= windowStart);
        const sampling = Math.ceil(filtered.length / MAX_POINTS) || 1;
        const sampled = filtered.filter((_, i) => i % sampling === 0);
        return sampled.map((d, i, arr) => {
            let opacity = 1;
            if (i < FADE_MARGIN) opacity = i / FADE_MARGIN;
            if (i >= arr.length - FADE_MARGIN) opacity = (arr.length - 1 - i) / FADE_MARGIN;
            return { ...d, opacity: Math.max(0, Math.min(1, opacity)) };
        });
    }, [data, windowStart]);
}