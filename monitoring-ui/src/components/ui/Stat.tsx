import { Card, CardContent } from '@/components/ui/card';
import React from 'react';

interface StatProps {
    label: string;
    value: number;
    icon?: React.ReactNode;
}

const Stat = React.memo(({ label, value, icon }: StatProps) => {
    return (
        <Card className="w-full rounded-xl border shadow hover:shadow-lg transition duration-300 bg-muted/50 min-w-33">
            <CardContent className="">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2 flex-wrap">
                    {icon && <div className="w-6 h-6">{icon}</div>}
                    <span className="font-medium w-full">{label}</span>
                </div>
                <div className="text-3xl font-bold text-foreground text-right">{value}</div>
            </CardContent>
        </Card>
    );
});

export default Stat;
