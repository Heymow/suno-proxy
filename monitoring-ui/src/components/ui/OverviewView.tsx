import { useEffect, useState, useMemo } from "react";
import { Point, ApiStats } from "@/types";
import RequestTimeline from "./RequestTimeline";
import Stat from "@/components/ui/Stat";
import { RefreshCcw, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { fetchTimeline } from "@/services/apiService";
import { useTimelineSync } from "@/hooks/useTimelineSync";
import { Button } from "./button";
import { handleWithBlur } from "@/utils/theme";

const ZOOM_LABELS: Record<number, string> = {
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

function getZoomLabel(zoom: number) {
    return ZOOM_LABELS[zoom] ?? `${zoom}x`;
}

// function getMetricForZoom(zoomLevel: number): "total" | "errors" | "callsPerHour" | "callsPerMinute" | "callsPerSecond" {
//     if (zoomLevel <= 1) return "callsPerHour";
//     if (1 < zoomLevel && zoomLevel <= 729) return "callsPerMinute";
//     return "callsPerSecond";
// }

export default function MainView({
    stats,
    error,
}: {
    stats: ApiStats | null;
    loading: boolean;
    error: string | null;
    resetStats: () => void;
    toggleDarkMode: () => void;
}) {
    const [initialData, setInitialData] = useState<Point[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [currentZoomLevel, setCurrentZoomLevel] = useState(1);
    const [selectedMetricType, setSelectedMetricType] = useState<"total" | "errors" | "rateLimits" | "success" | "timeouts">("total");
    const [selectedFrequency, setSelectedFrequency] = useState<"perHour" | "perMinute" | "perSecond" | "raw">("perMinute");

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchTimeline();
                setInitialData(data);
            } catch (err) {
                console.error("Erreur de récupération initiale de la timeline:", err);
                setInitialData([]);
            } finally {
                setLoaded(true);
            }
        };
        load();
    }, []);

    const timelineData = useTimelineSync(initialData);

    const isLoading = !stats || !loaded;

    const statItems = useMemo(() => [
        {
            key: "total",
            label: "Total Calls",
            value: stats?.total ?? 0,
            icon: <RefreshCcw />,
            iconColor: "#6366f1", // indigo-500
            className: "hidden md:block",
            enableFlash: false,
        },
        {
            key: "success",
            label: "Success",
            value: stats?.success ?? 0,
            icon: <CheckCircle className="text-green-500" />,
            iconColor: "#22c55e", // green-500
        },
        {
            key: "errors",
            label: "Errors",
            value: stats?.errors ?? 0,
            icon: <XCircle className="text-red-500" />,
            iconColor: "#ef4444", // red-500
        },
        {
            key: "rateLimits",
            label: "Rate Limits",
            value: stats?.rateLimits ?? 0,
            icon: <AlertTriangle className="text-yellow-500" />,
            iconColor: "#eab308", // yellow-500
        },
        {
            key: "timeouts",
            label: "Timeouts",
            value: stats?.timeouts ?? 0,
            icon: <Clock className="text-blue-400" />,
            iconColor: "#60a5fa", // blue-400
            className: "hidden xl:block 2xl:hidden 3xl:block",
        },
    ], [stats]);

    const handleZoomOut = handleWithBlur(() =>
        setCurrentZoomLevel(prev =>
            prev === 1 ? prev / 10 : Math.max(Math.trunc(100 * prev / 3) / 100, 0.1)
        )
    );
    const handleZoomIn = handleWithBlur(() =>
        setCurrentZoomLevel(prev =>
            Math.ceil(prev * 3) > 19683 ? prev : Math.ceil(prev * 3)
        )
    );

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                {error}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                Loading...
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4">
                {statItems.map(({ key, label, value, icon, iconColor, className, enableFlash }) => (
                    <div key={key} className={className}>
                        <Stat
                            label={label}
                            value={value}
                            icon={icon}
                            iconColor={iconColor}
                            enableFlash={enableFlash}
                        />
                    </div>
                ))}
            </div>

            <div className="mt-6 flex flex-col">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm text-muted-foreground">Activity</h3>
                    <div className="flex items-center gap-2 mr-12">

                        <div className="flex gap-4 mb-2">
                            <select
                                value={selectedMetricType}
                                onChange={(e) => {
                                    const value = e.target.value as "total" | "errors" | "rateLimits" | "success" | "timeouts";
                                    handleWithBlur(() => setSelectedMetricType(value))();
                                }}
                                className="border rounded px-2 py-1"
                            >
                                <option value="total" className="bg-accent">Total</option>
                                <option value="errors" className="bg-accent">Errors</option>
                                <option value="rateLimits" className="bg-accent">Rate Limits</option>
                                <option value="success" className="bg-accent">Success</option>
                                <option value="timeouts" className="bg-accent">Timeouts</option>
                            </select>
                            <select
                                value={selectedFrequency}
                                onChange={(e) => {
                                    const value = e.target.value as "perHour" | "perMinute" | "perSecond" | "raw";
                                    handleWithBlur(() => setSelectedFrequency(value))();
                                }}
                                className="border rounded px-2 py-1"
                            >
                                <option value="raw" className="bg-accent">Raw (cumulative)</option>
                                <option value="perHour" className="bg-accent">Per Hour</option>
                                <option value="perMinute" className="bg-accent">Per Minute</option>
                                <option value="perSecond" className="bg-accent">Per Second</option>
                            </select>
                        </div>

                        <h3 className="text-sm text-muted-foreground">
                            Zoom : {getZoomLabel(currentZoomLevel)}
                        </h3>
                        <Button
                            variant="outline"
                            className="cursor-pointer h-5 w-4"
                            onClick={handleZoomOut}
                        >
                            <div className="flex items-center text-sm">-</div>
                        </Button>
                        <Button
                            variant="outline"
                            className="cursor-pointer h-5 w-4"
                            onClick={handleZoomIn}
                        >
                            <div className="flex items-center text-xs pb-0.5">+</div>
                        </Button>
                    </div>
                </div>
                <RequestTimeline
                    data={timelineData}
                    zoomLevel={currentZoomLevel}
                    height={260}
                    metricType={selectedMetricType}
                    frequency={selectedFrequency}
                />
            </div>
        </>
    );
}
