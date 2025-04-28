import { useEffect, useState, useMemo } from "react";
import { Point, ApiStats } from "@/types";
import RequestTimeline from "./RequestTimeline";
import Stat from "@/components/ui/Stat";
import { RefreshCcw, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { fetchTimeline } from "@/services/apiService";
import { useTimelineSync } from "@/hooks/useTimelineSync";
import { Button } from "./button";
import { handleWithBlur } from "@/utils/theme";
import { METRIC_COLORS } from "./RequestTimeline";

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

const ZOOM_STORAGE_KEY = "timelineZoomLevel";
const METRICS_STORAGE_KEY = "timelineMetricTypes";
const FREQ_STORAGE_KEY = "timelineFrequency";

export default function MainView({
    stats,
    error
}: {
    stats: ApiStats | null;
    loading: boolean;
    error: string | null;
    resetStats: () => void;
    toggleDarkMode: () => void;
}) {
    // Chargement initial depuis le localStorage
    const [currentZoomLevel, setCurrentZoomLevel] = useState(() => {
        const stored = localStorage.getItem(ZOOM_STORAGE_KEY);
        return stored ? Number(stored) : 27;
    });
    const ALL_METRICS = ["total", "errors", "rateLimits", "success", "timeouts"] as const;
    const [selectedMetricTypes, setSelectedMetricTypes] = useState<typeof ALL_METRICS[number][]>(() => {
        const stored = localStorage.getItem(METRICS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [...ALL_METRICS];
    });
    const [selectedFrequency, setSelectedFrequency] = useState<"perHour" | "perMinute" | "perSecond" | "raw">(() => {
        const stored = localStorage.getItem(FREQ_STORAGE_KEY);
        return stored ? stored as any : "perMinute";
    });

    // Sauvegarde à chaque modification
    useEffect(() => {
        localStorage.setItem(ZOOM_STORAGE_KEY, String(currentZoomLevel));
    }, [currentZoomLevel]);
    useEffect(() => {
        localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(selectedMetricTypes));
    }, [selectedMetricTypes]);
    useEffect(() => {
        localStorage.setItem(FREQ_STORAGE_KEY, selectedFrequency);
    }, [selectedFrequency]);

    const [initialData, setInitialData] = useState<Point[]>([]);
    const [loaded, setLoaded] = useState(false);

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

            <div className="mt-6 flex items-baseline flex-col">
                <div className="flex items-center justify-between">
                    <h3 className="text-ls text-muted-foreground mr-2 mb-2">Activity</h3>
                    <div className="flex flex-col 2xl:flex-row  gap-2 mr-12">

                        <div className="flex gap-4 mb-2 ml-1">
                            <div className="flex gap-2">
                                {ALL_METRICS.map(metric => (
                                    <MetricCheckbox
                                        key={metric}
                                        metric={metric}
                                        checked={selectedMetricTypes.includes(metric)}
                                        onChange={() => {
                                            setSelectedMetricTypes(prev =>
                                                prev.includes(metric)
                                                    ? prev.filter(m => m !== metric)
                                                    : [...prev, metric]
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
                                    handleWithBlur(() => setSelectedFrequency(value))();
                                }}
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
                <RequestTimeline
                    data={timelineData}
                    zoomLevel={currentZoomLevel}
                    height={260}
                    metricTypes={selectedMetricTypes}
                    frequency={selectedFrequency}
                />
            </div>
        </>
    );
}
