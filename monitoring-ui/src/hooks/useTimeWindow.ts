import { useState, useEffect } from "react";

export default function useTimeWindow(duration: number) {
    const [realNow, setRealNow] = useState(Date.now());
    const [virtualNow, setVirtualNow] = useState(Date.now());
    const DISPLAY_DURATION = duration * 1000;

    useEffect(() => {
        const realInterval = setInterval(() => setRealNow(Date.now()), 500);
        let rafId: number;
        const update = () => {
            setVirtualNow(prev => prev + 16);
            rafId = requestAnimationFrame(update);
        };
        rafId = requestAnimationFrame(update);
        return () => {
            clearInterval(realInterval);
            cancelAnimationFrame(rafId);
        };
    }, []);

    useEffect(() => {
        setVirtualNow(realNow);
    }, [realNow]);

    return { windowStart: virtualNow - DISPLAY_DURATION, virtualNow };
}