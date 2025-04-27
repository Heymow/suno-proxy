import { useMemo } from "react";
import { scaleTime, scaleLinear } from "@visx/scale";
import { Point } from "@/types";

const margin = { top: 20, right: 30, bottom: 30, left: 40 };

export default function useTimelineScales(
  visibleData: (Point & { opacity: number })[],
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
  const yScale = useMemo(
    () =>
      scaleLinear({
        domain: [0, Math.max(...visibleData.map(d => d.total), 10)],
        range: [yMax, margin.top],
        nice: true,
      }),
    [visibleData, yMax]
  );

  return { xScale, yScale, yMax, margin };
}