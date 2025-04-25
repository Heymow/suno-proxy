import { useEffect } from "react";

export default function useAutoRefresh(callback: () => void, interval: number, enabled: boolean) {
    useEffect(() => {
        if (!enabled) return;

        const id = setInterval(callback, interval);
        return () => clearInterval(id);
    }, [callback, interval, enabled]);
}