import { useEffect, useState, useMemo } from "react";
import { Point, ApiStats } from "@/types";
import RequestTimeline from "./RequestTimeline";
import Stat from "@/components/ui/Stat";
import { fetchTimeline } from "@/services/apiService";
import { useTimelineSync } from "@/hooks/useTimelineSync";
import { handleWithBlur } from "@/utils/theme";
import { ZOOM_STORAGE_KEY, ALL_METRICS } from "./RequestTimeline/timelineConstants";
import ZoomLevel from "./ZoomLevel";
import useTimeWindow from "@/hooks/useTimeWindow";
import { getStatItems } from "@/utils/statItemsConfig";


export default function LiveStats({
    stats,
    error,
}: {
    stats: ApiStats | null;
    loading: boolean;
    error: string | null;
    resetStats: () => void;
    toggleDarkMode: () => void;
}) {
    const [currentZoomLevel, setCurrentZoomLevel] = useState(() => {
        const stored = localStorage.getItem(ZOOM_STORAGE_KEY);
        return stored ? Number(stored) : 243;
    });

    const frequency = useMemo(() => {
        return currentZoomLevel <= 1 ? "perHour" : currentZoomLevel <= 27 ? "perMinute" : "perSecond";
    }, [currentZoomLevel]);

    const computedDuration = useMemo(() => {
        if (frequency === "perSecond") return 60;
        return 3600 * 24 / currentZoomLevel;
    }, [frequency, currentZoomLevel]);

    useTimeWindow(computedDuration);

    useEffect(() => {
        localStorage.setItem(ZOOM_STORAGE_KEY, String(currentZoomLevel));
    }, [currentZoomLevel]);

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

    const statItems = useMemo(() => getStatItems(stats), [stats]);

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
            <div className="flex items-center justify-between mb-6">
                <div />
                <ZoomLevel
                    currentZoomLevel={currentZoomLevel}
                    handleZoomIn={handleZoomIn}
                    handleZoomOut={handleZoomOut}
                />
            </div>
            <div className="grid grid-cols-1 3xl:grid-cols-2 gap-3">
                {statItems.map(({ key, label, value, icon, iconColor, enableFlash }) => (
                    <div key={key} className={"flex items-center w-full"}>
                        <div className="flex-1 max-w-1/4 overflow-x-hidden mb-10 -mr-5">
                            <Stat
                                label={label}
                                value={value}
                                icon={icon}
                                iconColor={iconColor}
                                enableFlash={enableFlash}
                            />
                        </div>
                        <div className="flex-1 w-full max-w-full overflow-x-hidden items-baseline flex-col">
                            <RequestTimeline
                                data={timelineData}
                                zoomLevel={currentZoomLevel}
                                height={200}
                                metricTypes={[key as typeof ALL_METRICS[number]]}
                                frequency={frequency}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between mt-4 -mb-4">

            </div>

        </>
    );
}
