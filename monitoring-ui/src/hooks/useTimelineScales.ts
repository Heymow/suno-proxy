import { useMemo } from "react";
import { scaleLinear, scaleTime } from "@visx/scale";

const margin = { top: 20, right: 10, bottom: 30, left: 40 };

export default function useTimelineScales(
  visibleData: { timestamp: number; value: number }[],
  windowStart: number,
  virtualNow: number,
  width: number,
  height: number
) {
  const xScale = useMemo(
    () =>
      scaleTime({
        domain: [windowStart, virtualNow],
        range: [margin.left, width - margin.right],
      }),
    [windowStart, virtualNow, width]
  );

  const yMax = height - margin.top - margin.bottom;
  const yScale = useMemo(() => {
    const values = visibleData.map(d => d.value).filter(v => !isNaN(v));
    const max = values.length > 0 ? Math.max(...values, 0.5) : 1;

    return scaleLinear({
      domain: [0, max],
      range: [yMax, margin.top],
      nice: true,
    });
  }, [visibleData, yMax]);

  return { xScale, yScale, yMax, margin };
}