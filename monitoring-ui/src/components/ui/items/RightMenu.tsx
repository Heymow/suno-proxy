import { RightMenuProps } from "@/types";
import { useState, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import LastErrors from "@/components/ui/items/LastErrors";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusCodes } from "@/components/ui/items/StatusCodes";
import { Endpoints } from "@/components/ui/items/Endpoints";

type LastError = { url: string; status: number; message?: string; timestamp: number };

export default function RightMenu({ stats, perStatus, perEndpoint, lastErrors }: RightMenuProps) {
    if (!stats || !perStatus || !perEndpoint || !lastErrors) return <div>Loading...</div>;

    const [selectedError, setSelectedError] = useState<LastError | null>(null);
    const handleDialogClose = useCallback(() => setSelectedError(null), []);

    const visibleErrorsCount = 3;

    return (
        <div className="space-y-3 p-4 bg-muted/30 rounded-md animate-in slide-in-from-bottom-4 duration-500">
            <StatusCodes perStatus={perStatus} />
            <Separator />
            <Endpoints perEndpoint={perEndpoint} />
            <Separator />
            <LastErrors lastErrors={lastErrors} visibleErrors={visibleErrorsCount} onErrorSelect={setSelectedError} />
            {selectedError && (
                <Dialog open={!!selectedError} onOpenChange={handleDialogClose}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>API Error Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 text-sm">
                            <div>
                                <strong>Status:</strong> {selectedError.status}
                            </div>
                            <div>
                                <strong>URL:</strong> <code className="break-all">{selectedError.url}</code>
                            </div>
                            <div>
                                <strong>Message:</strong> {selectedError.message || "N/A"}
                            </div>
                            <div>
                                <strong>Time:</strong> {new Date(selectedError.timestamp).toLocaleString()}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}