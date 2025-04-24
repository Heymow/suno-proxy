import Stat from "./Stat";
import { RefreshCcw, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";

interface ApiStats {
    success: number;
    errors: number;
    timeouts: number;
    rateLimits: number;
    total: number;
}

export default function MainView(
    { stats, error }: { stats: ApiStats | null; loading: boolean; error: string | null; resetStats: () => void; toggleDarkMode: () => void; }) {
    if (error) {
        return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
    }
    if (!stats) {
        return <div className="flex items-center justify-center h-full">No data available</div>;
    }
    const { success, errors, timeouts, rateLimits, total } = {

        success: stats?.success || 0,
        errors: stats?.errors || 0,
        timeouts: stats?.timeouts || 0,
        rateLimits: stats?.rateLimits || 0,
        total: stats?.total || 0,
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 transition-opacity duration-300 min-w-100 flex-wrap">
            <Stat label="Total Calls" value={total} icon={<RefreshCcw />} />
            <Stat label="Success" value={success} icon={<CheckCircle className="text-green-500" />} />
            <Stat label="Errors" value={errors} icon={<XCircle className="text-red-500" />} />
            <Stat label="Rate Limits" value={rateLimits} icon={<AlertTriangle className="text-yellow-500" />} />
            <Stat label="Timeouts" value={timeouts} icon={<Clock className="text-blue-400" />} />
        </div >
    )
}