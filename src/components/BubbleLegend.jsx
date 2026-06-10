import { cssVar } from "../utils/cssVar";

export function BubbleLegend({ scale, tickNumber = 4 }) {
  if (!scale || typeof scale.ticks !== "function") return null;
  const ticks = scale.ticks ? scale.ticks(tickNumber) : [];
  if (!ticks || ticks.length === 0) return null;

  const maxValue = ticks[ticks.length - 1];
  const diameter = scale(maxValue) * 2; // diameter of the biggest circle
  const dashWidth = diameter / 2 + 10;

  const textColor = cssVar("--chart-text");

  const allCircles = ticks.map((tick, i) => {
    const xCenter = diameter / 2;
    const yCircleTop = diameter - 2 * scale(tick);
    const yCircleCenter = diameter - scale(tick);

    return (
      <g key={i}>
        <circle
          cx={xCenter}
          cy={yCircleCenter}
          r={scale(tick)}
          fill="none"
          stroke={textColor}
        />
        <line
          x1={xCenter}
          x2={xCenter + dashWidth}
          y1={yCircleTop}
          y2={yCircleTop}
          stroke={textColor}
          strokeDasharray={"2,2"}
        />
        <text
          x={xCenter + dashWidth + 4}
          y={yCircleTop}
          fontSize={10}
          alignmentBaseline="middle"
          fill={textColor}
        >
          {tick}
        </text>
      </g>
    );
  });

  return (
    <svg width={diameter} height={diameter} overflow="visible">
      {allCircles}
    </svg>
  );
}
