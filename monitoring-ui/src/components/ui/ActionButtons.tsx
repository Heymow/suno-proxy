import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, TimerReset } from "lucide-react";
import { cn } from "@/lib/utils";
import { handleWithBlur } from "@/utils/theme";

export default function ActionButtons({
    autoRefresh,
    setAutoRefresh,
    fetchStats,
    resetStats,
}: {
    autoRefresh: boolean;
    setAutoRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    fetchStats: () => Promise<void>;
    resetStats: () => Promise<void>;
}) {
    return (
        <div className="flex justify-end gap-1 mb-6">
            <Button
                variant="outline"
                onClick={handleWithBlur(() => setAutoRefresh((v) => !v))}
                className={cn("cursor-pointer", autoRefresh && "animate-pulse")}
            >
                <Badge variant={autoRefresh ? "default" : "destructive"} />
                Auto Refresh
            </Button>
            <Button
                variant="outline"
                onClick={handleWithBlur(fetchStats)}
                className="cursor-pointer"
            >
                <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button
                variant="outline"
                onClick={handleWithBlur(resetStats)}
                className="cursor-pointer"
            >
                <TimerReset className="w-4 h-4 mr-2" /> Reset
            </Button>
        </div>
    );
}