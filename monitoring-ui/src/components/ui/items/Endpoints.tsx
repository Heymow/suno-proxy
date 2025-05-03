import { Button } from "@/components/ui/button";
import { handleWithBlur } from "@/utils/theme";
import { useMemo } from "react";
import { ChevronsLeftRightEllipsis } from "lucide-react";

export function Endpoints({ perEndpoint }: { perEndpoint: Record<string, number> }) {
    const sortedEndpoints = useMemo(() => {
        return Object.entries(perEndpoint).sort(([, countA], [, countB]) => countB - countA).slice(0, 5);
    }, [perEndpoint]);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Endpoints</h2>
            <ul className="list-disc pl-2 pr-2 space-y-1 text-sm w-full">
                {sortedEndpoints.map(([endpoint, count]) => (
                    <Button
                        key={endpoint}
                        className="mb-3 rounded-bl-md cursor-pointer w-full p-3 flex items-center gap-2 text-foreground bg-accent-background hover:text-secondary transition-colors outline-1 justify-between"
                        onClick={handleWithBlur(() => { })}
                    >
                        <ChevronsLeftRightEllipsis className="w-4 h-4 mr-2" />
                        <span>{endpoint}</span> <span>{count}</span>
                    </Button>
                ))}
            </ul>
        </div>
    );
}