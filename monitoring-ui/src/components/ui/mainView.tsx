import { useEffect, useState } from "react";
import { Point, ApiStats } from "@/types";
import RequestTimeline from "./RequestTimeline";
import Stat from "@/components/ui/Stat";
import { RefreshCcw, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { fetchTimeline } from "@/services/apiService";
import { useTimelineSync } from "@/hooks/useTimelineSync";

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

    if (error) return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
    if (!stats || !loaded) return <div className="flex items-center justify-center h-full">Loading...</div>;

    const { success, errors, timeouts, rateLimits, total } = stats;

    return (
        <>
            <div className="grid grid-cols-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4">
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
