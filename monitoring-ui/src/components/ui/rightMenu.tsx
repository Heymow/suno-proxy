import { Separator } from '@/components/ui/separator';
import { ApiStats } from '@/MonitoringDashboard';
import { ChevronsLeftRightEllipsis } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function rightMenu({ stats, perStatus, perEndpoint, lastErrors }: { stats: ApiStats | null; perStatus: Record<string, number>; perEndpoint: Record<string, number>; lastErrors: Array<{ url: string; status: number; message?: string; timestamp: number }> }) {
    if (!stats) return null;
    const [selectedError, setSelectedError] = useState<typeof lastErrors[0] | null>(null);
    const visibleErrors = 3;

    return (
        <div className="space-y-3 p-4 bg-muted/30 rounded-md animate-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-semibold mb-2">Status Codes</h2>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(perStatus).map(([code, count]) => (
                        <Button
                            key={code}
                            className={`mb-3 rounded-bl-md cursor-pointer p-3 flex items-center gap-2 text-foreground bg-accent-background hover:text-secondary transition-colors outline-1 justify-between ${code.startsWith('2')
                                ? 'text-green-300'
                                : code.startsWith('4')
                                    ? 'text-yellow-300'
                                    : code.startsWith('5')
                                        ? 'text-red-300'
                                        : 'text-gray-300'
                                }`}
                        >
                            {code}: <span>{count}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <Separator />

            <div>
                <h2 className="text-xl font-semibold mb-4">Endpoints</h2>
                <ul className="list-disc pl-2 pr-2 space-y-1 text-sm w-full">
                    {Object.entries(perEndpoint)
                        .sort(([, countA], [, countB]) => countB - countA)
                        .map(([endpoint, count]) => (
                            <Button
                                key={endpoint}
                                className="mb-3 rounded-bl-md cursor-pointer w-full p-3 flex items-center gap-2 text-foreground bg-accent-background hover:text-secondary transition-colors outline-1 justify-between"
                            >
                                <ChevronsLeftRightEllipsis className="w-4 h-4 mr-2" />
                                <span>{endpoint}</span> <span className=''>{count}</span>
                            </Button>
                        ))}
                </ul>
            </div>

            <Separator />

            <div>
                <h2 className="text-xl font-semibold mb-4">Last Errors</h2>
                <div className="space-y-3">
                    {lastErrors.slice(0, visibleErrors).map((err, index) => (
                        <div
                            key={index}
                            className={`p-4 bg-muted/30 border rounded-md shadow-sm transition cursor-pointer
              ${err.status >= 500 ? 'text-red-100 border-red-500/20' : 'text-yellow-100 border-yellow-500/20'}
              hover:bg-muted/50`}
                            onClick={() => setSelectedError(err)}
                        >
                            <div className="text-xs text-muted-foreground mb-1 font-mono">
                                {'>'} [{new Date(err.timestamp).toLocaleDateString()} {new Date(err.timestamp).toLocaleTimeString()}]
                            </div>
                            <div className="text-sm text-red-500">
                                <code>{err.status}</code> – {err.url}
                            </div>
                            {err.message && (
                                <div className="text-xs text-muted-foreground italic mt-1">{err.message}</div>
                            )}
                        </div>
                    ))}
                </div>

                {selectedError && (
                    <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>API Error Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 text-sm">
                                <div><strong>Status:</strong> {selectedError.status}</div>
                                <div><strong>URL:</strong> <code className="break-all">{selectedError.url}</code></div>
                                <div><strong>Message:</strong> {selectedError.message || "N/A"}</div>
                                <div><strong>Time:</strong> {new Date(selectedError.timestamp).toLocaleString()}</div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}