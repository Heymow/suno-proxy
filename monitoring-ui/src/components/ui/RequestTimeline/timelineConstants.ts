import { MetricType } from "@/types";

export const METRIC_COLORS: Record<MetricType, string> = {
    total: "#4f46e5",
    errors: "#e53e3e",
    rateLimits: "#f59e42",
    success: "#22c55e",
    timeouts: "#64748b"
};

export const ZOOM_LABELS: Record<number, string> = {
    0.1: "1 week",
    1: "1 day",
    3: "8 hours",
    9: "2.5 hours",
    27: "1 hour",
    81: "20 minutes",
    243: "5 minutes",
    729: "2 minutes",
    2187: "20 seconds",
    6561: "10 seconds",
    19683: "3 seconds",
};

export const ZOOM_STORAGE_KEY = "timelineZoomLevel";

export const METRICS_STORAGE_KEY = "timelineMetricTypes";

export const FREQ_STORAGE_KEY = "timelineFrequency";

export const ALL_METRICS = ["total", "errors", "rateLimits", "success", "timeouts"] as const;