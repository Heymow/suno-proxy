import { useEffect, useState, useMemo, useCallback } from "react";
import { Point, ApiStats } from "@/types";
import RequestTimeline from "./RequestTimeline";
import Stat from "@/components/ui/Stat";
import { RefreshCcw, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { fetchTimeline } from "@/services/apiService";
import { useTimelineSync } from "@/hooks/useTimelineSync";
import { handleWithBlur } from "@/utils/theme";
import { ZOOM_LABELS, ZOOM_STORAGE_KEY, METRICS_STORAGE_KEY, FREQ_STORAGE_KEY, ALL_METRICS } from "./RequestTimeline/timelineConstants";
import TimelineToolbar from "./TimelineToolbar";

export function getZoomLabel(zoom: number) {
    return ZOOM_LABELS[zoom] ?? `${zoom}x`;
}

export default function MainView({
    stats,
    error,
    // loading,
    // resetStats,
    // toggleDarkMode,
}: {
    stats: ApiStats | null;
    loading: boolean;
    error: string | null;
    resetStats: () => void;
    toggleDarkMode: () => void;
}) {
    const [currentZoomLevel, setCurrentZoomLevel] = useState(() => {
        const stored = localStorage.getItem(ZOOM_STORAGE_KEY);
        return stored ? Number(stored) : 27;
    });
    const [selectedMetricTypes, setSelectedMetricTypes] = useState<typeof ALL_METRICS[number][]>(() => {
        const stored = localStorage.getItem(METRICS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [...ALL_METRICS];
    });
    const [selectedFrequency, setSelectedFrequency] = useState<"perHour" | "perMinute" | "perSecond" | "raw">(() => {
        const stored = localStorage.getItem(FREQ_STORAGE_KEY);
        return stored ? stored as any : "perMinute";
    });

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
                console.error("Error fetching initial timeline data:", err);
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

    const hideTooltip = useCallback(() => {
        const tooltip = document.querySelector(".tooltip") as HTMLElement;
        if (tooltip) {
            tooltip.style.opacity = "0";
            setTimeout(() => {
                tooltip.style.display = "none";
            }, 200);
        }
    }
        , []);

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

    const handleSetSelectedMetricTypes = useCallback(
        (types: typeof ALL_METRICS[number][]) => setSelectedMetricTypes(types),
        []
    );
    const handleSetSelectedFrequency = useCallback(
        (freq: "perHour" | "perMinute" | "perSecond" | "raw") => setSelectedFrequency(freq),
        []
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
            <div className="grid grid-cols-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4 ">
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

            <div className="flex items-center justify-between mt-4 -mb-4">

                <TimelineToolbar
                    currentZoomLevel={currentZoomLevel}
                    selectedMetricTypes={selectedMetricTypes}
                    setSelectedMetricTypes={handleSetSelectedMetricTypes}
                    selectedFrequency={selectedFrequency}
                    setSelectedFrequency={handleSetSelectedFrequency}
                    handleZoomIn={handleZoomIn}
                    handleZoomOut={handleZoomOut}
                    hideTooltip={hideTooltip}
                />
            </div>

            <div className=" flex items-baseline flex-col">
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
