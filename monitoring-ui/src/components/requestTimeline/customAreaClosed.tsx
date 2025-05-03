import { AreaClosed as VisxAreaClosed } from "@visx/shape";

export default function CustomAreaClosed({
    data,
    x,
    y,
    yScale,
    stroke,
    fill,
    curve,
    style,
    mask
}: {
    data: { timestamp: number; value: number }[];
    x: (d: any) => number;
    y: (d: any) => number;
    yScale: any;
    stroke: string;
    fill: string;
    curve: any;
    style: React.CSSProperties;
    mask: string;
}) {
    const compatibleData = data.map(d => ({
        timestamp: d.timestamp,
        value: d.value,
        total: d.value,
        errors: 0,
        timeouts: 0,
        rateLimits: 0,
        opacity: 1
    }));

    return (
        <VisxAreaClosed
            data={compatibleData}
            x={x}
            y={y}
            yScale={yScale}
            stroke={stroke}
            fill={fill}
            curve={curve}
            style={style}
            mask={mask}
        />
    );
}