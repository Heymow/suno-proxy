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
                    <h3 className="text-sm text-muted-foreground">Global Health</h3>
                    <div className="flex items-center gap-2 mr-12">
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
                    metric="callsPerHour"
                />
            </div>
        </>
    );
}
