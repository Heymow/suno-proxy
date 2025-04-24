import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ApiStats } from '@/MonitoringDashboard';

export default function rightMenu({ stats, perStatus, perEndpoint, lastErrors }: { stats: ApiStats | null; perStatus: Record<string, number>; perEndpoint: Record<string, number>; lastErrors: Array<{ url: string; status: number; message?: string; timestamp: number }> }) {
    if (!stats) return null;

    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-xl font-semibold mb-2">Status Codes</h2>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(perStatus).map(([code, count]) => (
                        <Badge key={code} variant="secondary">
                            {code}: {count}
                        </Badge>
                    ))}
                </div>
            </div>

            <Separator />

            <div>
                <h2 className="text-xl font-semibold mb-2">Endpoints</h2>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                    {Object.entries(perEndpoint).map(([endpoint, count]) => (
                        <li key={endpoint}>
                            <code className="text-muted-foreground">{endpoint}</code>: {count}
                        </li>
                    ))}
                </ul>
            </div>

            <Separator />

            <div>
                <h2 className="text-xl font-semibold mb-2">Last Errors</h2>
                <ScrollArea className="h-40 border rounded-md bg-muted/30 px-4 py-2 animate-in slide-in-from-bottom-4 duration-500">
                    <ul className="text-sm space-y-1 text-red-500">
                        {(lastErrors).map((err, index) => (
                            <li key={index}>
                                <span className="font-mono text-xs text-muted-foreground">
                                    [{new Date(err.timestamp).toLocaleTimeString()}]
                                </span>{' '}
                                <code>{err.status}</code> – {err.url}
                                {err.message && ` | ${err.message}`}
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </div>
        </div>
    );
}