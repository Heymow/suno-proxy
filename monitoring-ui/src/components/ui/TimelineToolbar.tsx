import { Button } from "@/components/ui/button";
import { handleWithBlur } from "@/utils/theme";
import MetricCheckbox from "./RequestTimeline/MetricCheckbox";
import { ALL_METRICS } from "./RequestTimeline/timelineConstants";
import { MetricType } from "@/types";
import { getZoomLabel } from "./OverviewView";
import React from "react";


function TimelineToolbar({
    currentZoomLevel,
    selectedMetricTypes,
    setSelectedMetricTypes,
    selectedFrequency,
    setSelectedFrequency,
    handleZoomIn,
    handleZoomOut,
    hideTooltip
}: {
    currentZoomLevel: number;
    selectedMetricTypes: MetricType[];
    setSelectedMetricTypes: (types: MetricType[]) => void;
    selectedFrequency: "perHour" | "perMinute" | "perSecond" | "raw";
    setSelectedFrequency: (frequency: "perHour" | "perMinute" | "perSecond" | "raw") => void;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    hideTooltip: () => void;
}) {
    return (
        <div className="mt-6 flex items-center justify-between">
            <h3 className="text-ls text-muted-foreground mr-2 mb-2">Activity</h3>
            <div className="flex flex-col 2xl:flex-row  gap-2 mr-12">

                <div className="flex gap-4 mb-2 ml-1">
                    <div className="flex gap-2">
                        {ALL_METRICS.map((metric) => (
                            <MetricCheckbox
                                key={metric}
                                metric={metric}
                                checked={selectedMetricTypes.includes(metric)}
                                onChange={() => {
                                    setSelectedMetricTypes(
                                        selectedMetricTypes.includes(metric)
                                            ? selectedMetricTypes.filter((m) => m !== metric)
                                            : [...selectedMetricTypes, metric]
                                    );
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 mb-2 h-10">
                    <select
                        value={selectedFrequency}
                        onChange={(e) => {
                            const value = e.target.value as "perHour" | "perMinute" | "perSecond" | "raw";
                            hideTooltip();
                            handleWithBlur(() => setSelectedFrequency(value))();
                        }}
                        onFocus={hideTooltip}
                        className="border-1 rounded px-2 mr-2"
                    >
                        <option value="raw" className="bg-background">Raw (cumulative)</option>
                        <option value="perHour" className="bg-background">Per Hour</option>
                        <option value="perMinute" className="bg-background">Per Minute</option>
                        <option value="perSecond" className="bg-background">Per Second</option>
                    </select>

                    <div className="flex items-center gap-2 ml-2 -m-2">
                        <h3 className="flex text-sm text-muted-foreground -m-3 min-w-50">
                            <span className="hidden xl:block text-xs text-nowrap mt-0.5">Zoom :</span>
                            <div className="flex items-center gap-2 ml-2 flex-col lg:flex-row -mt-4 lg:mt-0">
                                <span className="text-xs text-muted-foreground w-12 text-nowrap text-center">{getZoomLabel(currentZoomLevel)}</span>
                                <div className="flex items-center gap-2 ml-2">
                                    <Button
                                        variant="outline"
                                        className="cursor-pointer h-5 w-4"
                                        onClick={handleZoomOut}
                                    >
                                        <div className="text-sm -mt-0.5">-</div>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="cursor-pointer h-5 w-4"
                                        onClick={handleZoomIn}
                                    >
                                        <div className="text-xs -mt-0.5">+</div>
                                    </Button>
                                </div>
                            </div>
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default React.memo(TimelineToolbar);