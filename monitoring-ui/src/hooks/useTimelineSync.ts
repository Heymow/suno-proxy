import { useEffect, useRef, useState } from "react";
import { Point } from "@/types";

const DISPLAY_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export function useTimelineSync(initialTimeline: Point[]) {
    const [timeline, setTimeline] = useState<Point[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    // ⏳ Mise à jour quand initialTimeline arrive
    useEffect(() => {
        const now = Date.now();
        setTimeline(initialTimeline.filter(p => p.timestamp >= now - DISPLAY_DURATION_MS));
    }, [initialTimeline]);

    // 📡 Connexion WebSocket
    useEffect(() => {
        const protocol = location.protocol === "https:" ? "wss" : "ws";
        const host = import.meta.env.VITE_API_WS_URL || location.host;
        const ws = new WebSocket(`${protocol}://${host}/ws/timeline`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "timeline_point") {
                    const point = msg.data as Point;
                    setTimeline(prev => {
                        const now = Date.now();
                        const updated = [...prev, point];
                        return updated.filter(p => p.timestamp >= now - DISPLAY_DURATION_MS);
                    });
                }
            } catch (err) {
                console.error("Erreur parsing WebSocket:", err);
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        ws.onclose = () => {
            console.warn("WebSocket fermé");
        };

        return () => {
            ws.close();
        };
    }, []);

    return timeline;
}
