import { MetricType } from "@/types";

export const METRIC_COLORS: Record<MetricType, string> = {
    total: "#4f46e5",
    errors: "#e53e3e",
    rateLimits: "#f59e42",
    success: "#22c55e",
    timeouts: "#64748b"
};