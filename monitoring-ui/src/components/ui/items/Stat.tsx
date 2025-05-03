import { Card, CardContent } from '@/components/ui/card';
import React, { useEffect, useRef, useState } from 'react';

interface StatProps {
    className?: string;
    label: string;
    value: number;
    icon?: React.ReactNode;
    iconColor?: string;
    enableFlash?: boolean;
}

const ANIMATION_DURATION = 200;
const DEFAULT_COLOR = "#6366f1";

const Stat = React.memo(({ label, value, icon, iconColor, enableFlash = true, className }: StatProps) => {
    const [isFlashing, setIsFlashing] = useState(false);
    const prevValue = useRef(value);

    useEffect(() => {
        if (!enableFlash) return;
        if (prevValue.current !== value) {
            setIsFlashing(false);
            const raf = requestAnimationFrame(() => setIsFlashing(true));
            prevValue.current = value;
            return () => cancelAnimationFrame(raf);
        }
    }, [value, enableFlash]);

    const flashColor = iconColor || DEFAULT_COLOR;

    return (
        <Card
            className={className || `w-full rounded-xl border shadow hover:shadow-lg transition duration-300 bg-muted/50 min-w-33${isFlashing && enableFlash ? " stat-flash" : ""}`}
            style={isFlashing && enableFlash ? { borderColor: flashColor } : {}}
            onAnimationEnd={() => setIsFlashing(false)}
        >
            <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2 flex-wrap">
                    {icon && <div className="w-6 h-6">{icon}</div>}
                    <span className="font-medium w-full">{label}</span>
                </div>
                <div className="text-3xl font-bold text-foreground text-right">{value}</div>
            </CardContent>
            <style>{`
                .stat-flash {
                    animation: stat-flash-border ${ANIMATION_DURATION}ms cubic-bezier(.4,0,.2,1);
                }
                @keyframes stat-flash-border {
                    0%, 80% {
                        border-color: ${flashColor};
                        box-shadow: 0 0 0 1px ${flashColor}22; /* flash plus doux (alpha 13%) */
                    }
                    /* 100% implicite: retour à la bordure normale */
                }
            `}</style>
        </Card>
    );
});

export default Stat;
