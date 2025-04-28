import { Button } from "@/components/ui/button";
import { handleWithBlur } from "@/utils/theme";

export function StatusCodes({ perStatus }: { perStatus: Record<string, number> }) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Status Codes</h2>
            <div className="flex flex-wrap gap-2">
                {Object.entries(perStatus).sort(([, countA], [, countB]) => countB - countA).slice(0, 5)
                    .map(([code, count]) => (
                        <Button
                            key={code}
                            className={`mb-3 rounded-bl-md cursor-pointer p-3 flex items-center gap-2 text-foreground bg-accent-background hover:text-secondary transition-colors outline-1 justify-between ${code.startsWith("2")
                                ? "text-green-300"
                                : code.startsWith("4")
                                    ? "text-yellow-500"
                                    : code.startsWith("5")
                                        ? "text-red-300"
                                        : "text-gray-300"
                                }`}
                            onClick={handleWithBlur(() => { })}
                        >
                            {code}: <span>{count}</span>
                        </Button>
                    ))}
            </div>
        </div>
    );
}