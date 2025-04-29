import { Button } from "@/components/ui/button";
import { ZOOM_LABELS } from "./RequestTimeline/timelineConstants";

function getZoomLabel(zoom: number) {
    return ZOOM_LABELS[zoom] ?? `${zoom}x`;
}

export default function ZoomLevel({
    currentZoomLevel,
    handleZoomIn,
    handleZoomOut,
}: {
    currentZoomLevel: number;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
}) {

    return (
        <div className="flex items-center gap-2 ml-2 -m-2">
            <h3 className="flex text-sm text-muted-foreground -m-3 min-w-50">
                <span className="hidden xl:block text-xs text-nowrap mt-0.5">Zoom :</span>
                <div className="flex items-center gap-2 ml-2 flex-col lg:flex-row -mt-4 lg:mt-0">
                    <span className="text-xs text-muted-foreground w-12 text-nowrap text-center">{getZoomLabel(currentZoomLevel)}</span>
                    <div className="flex items-center gap-2 ml-2">
                        <Button
                            variant="outline"
                            className="cursor-pointer h-5 w-4"
                            onClick={handleZoomOut}
                        >
                            <div className="text-sm -mt-0.5">-</div>
                        </Button>
                        <Button
                            variant="outline"
                            className="cursor-pointer h-5 w-4"
                            onClick={handleZoomIn}
                        >
                            <div className="text-xs -mt-0.5">+</div>
                        </Button>
                    </div>
                </div>
            </h3>
        </div>
    )
}