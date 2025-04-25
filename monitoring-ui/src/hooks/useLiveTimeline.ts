// useLiveTimeline.ts
import { useEffect, useRef, useState } from "react";
import { Point } from "@/types";
import { fetchTimeline, fetchLatestPoint } from "@/services/apiService";

const DISPLAY_DURATION_MS = 60 * 60 * 1000; // 1h
const PRECISION_MS = 100; // précision d'un point
const MAX_POINTS = DISPLAY_DURATION_MS / PRECISION_MS;

export function useLiveTimeline() {
    const dataRef = useRef<Point[]>([]);
    const [visibleData, setVisibleData] = useState<Point[]>([]);
    const lastUpdateRef = useRef(Date.now());

    // Chargement initial de la timeline
    useEffect(() => {
        fetchTimeline()
            .then((data: Point[]) => {
                const trimmed = data.slice(-MAX_POINTS);
                dataRef.current = trimmed;
            })
            .catch((err) => console.error("Erreur chargement initial:", err));
    }, []);

    // Fetch régulier des nouveaux points (mais non lié au rendu)
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const point = await fetchLatestPoint();
                dataRef.current.push(point);
                if (dataRef.current.length > MAX_POINTS) {
                    dataRef.current.shift();
                }
            } catch (err) {
                console.error("Erreur fetch point:", err);
            }
        }, PRECISION_MS);
        return () => clearInterval(interval);
    }, []);

    // Affichage régulier calé sur le temps réel
    useEffect(() => {
        let frame: number;

        const loop = () => {
            const now = Date.now();
            const visible = dataRef.current;
            setVisibleData([...visible]);
            lastUpdateRef.current = now;
            frame = requestAnimationFrame(loop);
        };

        frame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frame);
    }, []);

    return visibleData;
}
