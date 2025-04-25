import RequestTimeline from "./RequestTimeline";
import Stat from "@/components/ui/Stat";
import { RefreshCcw, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Point, ApiStats } from "@/types";
import { fetchTimeline, fetchLatestPoint } from "@/services/apiService";

// === PARAMÈTRES MODIFIABLES ===
const DISPLAY_DURATION_MS = 60 * 60 * 1000;
const PRECISION_MS = 100;
const MAX_POINTS = DISPLAY_DURATION_MS / PRECISION_MS;

export default function MainView({ stats, error }: {
    stats: ApiStats | null;
    loading: boolean;
    error: string | null;
    resetStats: () => void;
    toggleDarkMode: () => void;
}) {
    const [timelineData, setTimelineData] = useState<Point[]>([]);
    const bufferRef = useRef<Point[]>([]);

    // Chargement initial
    useEffect(() => {
        fetchTimeline()
            .then((data: Point[]) => {
                const trimmed = data.slice(-MAX_POINTS);
                setTimelineData(trimmed);
            })
            .catch((err) => {
                console.error("Erreur de récupération initiale de la timeline:", err);
                setTimelineData([]);
            });
    }, []);

    // Récupération toutes les 100ms (mais sans trigger de setState)
    useEffect(() => {
        const fetchInterval = setInterval(async () => {
            try {
                const newPoint = await fetchLatestPoint();
                bufferRef.current.push(newPoint);
                if (bufferRef.current.length > 50) {
                    bufferRef.current.shift(); // sécurité pour ne pas exploser
                }
            } catch (err) {
                console.error("Erreur lors de la récupération du point :", err);
            }
        }, PRECISION_MS);

        return () => clearInterval(fetchInterval);
    }, []);

    // flush du buffer toutes les 500ms
    useEffect(() => {
        const flushInterval = setInterval(() => {
            if (bufferRef.current.length === 0) return;

            setTimelineData((prev) => {
                const updated = [...prev, ...bufferRef.current];
                bufferRef.current = [];
                return updated.length > MAX_POINTS ? updated.slice(-MAX_POINTS) : updated;
            });
        }, 500);

        return () => clearInterval(flushInterval);
    }, []);

    if (error) return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
    if (!stats) return <div className="flex items-center justify-center h-full">No data available</div>;

    const { success, errors, timeouts, rateLimits, total } = stats;

    return (
        <>
            <div className="grid grid-cols-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4 transition-opacity duration-300 min-w-100 flex-wrap">
                <div className="hidden md:block">
                    <Stat label="Total Calls" value={total} icon={<RefreshCcw />} />
                </div>
                <Stat label="Success" value={success} icon={<CheckCircle className="text-green-500" />} />
                <Stat label="Errors" value={errors} icon={<XCircle className="text-red-500" />} />
                <Stat label="Rate Limits" value={rateLimits} icon={<AlertTriangle className="text-yellow-500" />} />
                <div className="hidden xl:block 2xl:hidden 3xl:block">
                    <Stat label="Timeouts" value={timeouts} icon={<Clock className="text-blue-400" />} />
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-sm text-muted-foreground mb-2">Timeline</h3>
                <RequestTimeline data={timelineData} />
            </div>
        </>
    );
}
