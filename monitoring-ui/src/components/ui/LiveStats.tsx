// import { useEffect, useState, useMemo } from "react";
import {
    // Point,
    ApiStats
} from "@/types";
// import RequestTimeline from "./RequestTimeline";
// import Stat from "@/components/ui/Stat";
// import { RefreshCcw, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
// import { fetchTimeline } from "@/services/apiService";
// import { useTimelineSync } from "@/hooks/useTimelineSync";
// import { handleWithBlur } from "@/utils/theme";


export default function LiveStats({
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

    // const [initialData, setInitialData] = useState<Point[]>([]);
    // const [loaded, setLoaded] = useState(false);

    // useEffect(() => {
    //     const load = async () => {
    //         try {
    //             const data = await fetchTimeline();
    //             setInitialData(data);
    //         } catch (err) {
    //             console.error("Erreur de récupération initiale de la timeline:", err);
    //             setInitialData([]);
    //         } finally {
    //             setLoaded(true);
    //         }
    //     };
    //     load();
    // }, []);

    // const timelineData = useTimelineSync(initialData);

    // const isLoading = !stats || !loaded;

    // const statItems = useMemo(() => [
    //     {
    //         key: "total",
    //         label: "Total Calls",
    //         value: stats?.total ?? 0,
    //         icon: <RefreshCcw />,
    //         iconColor: "#6366f1", // indigo-500
    //         className: "hidden md:block",
    //         enableFlash: false,
    //     },
    //     {
    //         key: "success",
    //         label: "Success",
    //         value: stats?.success ?? 0,
    //         icon: <CheckCircle className="text-green-500" />,
    //         iconColor: "#22c55e", // green-500
    //     },
    //     {
    //         key: "errors",
    //         label: "Errors",
    //         value: stats?.errors ?? 0,
    //         icon: <XCircle className="text-red-500" />,
    //         iconColor: "#ef4444", // red-500
    //     },
    //     {
    //         key: "rateLimits",
    //         label: "Rate Limits",
    //         value: stats?.rateLimits ?? 0,
    //         icon: <AlertTriangle className="text-yellow-500" />,
    //         iconColor: "#eab308", // yellow-500
    //     },
    //     {
    //         key: "timeouts",
    //         label: "Timeouts",
    //         value: stats?.timeouts ?? 0,
    //         icon: <Clock className="text-blue-400" />,
    //         iconColor: "#60a5fa", // blue-400
    //         className: "hidden xl:block 2xl:hidden 3xl:block",
    //     },
    // ], [stats]);

    // if (error) {
    //     return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
    // }
    // if (isLoading) {
    //     return <div className="flex items-center justify-center h-full">Loading...</div>;
    // }

    return stats + " " + error;
}