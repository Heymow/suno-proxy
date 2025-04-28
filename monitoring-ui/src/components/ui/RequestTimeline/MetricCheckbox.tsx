import { METRIC_COLORS } from "./timelineConstants";
import React from "react";

function MetricCheckbox({
    metric,
    checked,
    onChange,
}: {
    metric: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
            <input
                type="checkbox"
                checked={checked}
                className="cursor-pointer"
                onChange={onChange}
            />
            <span style={{ color: METRIC_COLORS[metric as keyof typeof METRIC_COLORS] }} className={`text-xs ${checked ? "opacity-100" : "opacity-70"}`}>
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </span>
        </label >

    );
}

export default React.memo(MetricCheckbox);