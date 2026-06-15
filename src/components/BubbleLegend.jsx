import { cssVar } from "../utils/cssVar"; // Import utility function to access CSS custom properties.

export function BubbleLegend({ scale, tickNumber = 4 }) {
  if (!scale || typeof scale.ticks !== "function") return null; // Check is a valid `scale` object with a `.ticks()` method is provided.  If not, return null.
  const ticks = scale.ticks ? scale.ticks(tickNumber) : []; // Generate ticks using the scale's `ticks()` function. Default to an empty array if unavailable.
  if (!ticks || ticks.length === 0) return null; // If no ticks are available, exit early by returning null.

  const maxValue = ticks[ticks.length - 1]; // Determine the maximum value from the generated ticks for scaling purposes.
  const diameter = scale(maxValue) * 2; // Calculate the diameter of the largest circle to be rendered using the scale function.
  const dashWidth = diameter / 2 + 10; // Define dashWidth, which is used for positioning tick labels. It's set to half the diameter plus a constant offset.

  const textColor = cssVar("--chart-text"); // Retrieve text color from CSS variables using `cssVar`.

  const allCircles = ticks.map((tick, i) => {
    // Create SVG circle elements and corresponding labels for each tick value
    const xCenter = diameter / 2; // Calculate x-coordinate center of circles (half the diameter)
    const yCircleTop = diameter - 2 * scale(tick); // Compute y-coordinates for the tope edge and center of each bubble based on its scaled radius.
    const yCircleCenter = diameter - scale(tick);

    return (
      {/* Use `key` to uniquely identify each group in React */}
      <g key={i}>
        {/* Render a circle for the current tick value. The circle's center is at (xCenter,
yCircleCenter) and has radius `scale(tick)`. */}
        <circle
          cx={xCenter}
          cy={yCircleCenter}
          r={scale(tick)}
          fill="none"
          stroke={textColor}
        />
        {/* Render a dashed line below each circle as a label guide. */}
        <line
          x1={xCenter}
          x2={xCenter + dashWidth} // Position end of the line to the right byt 'dashwidth'.
          y1={yCircleTop} // Vertical positiona aliagns with the top of the circle.
          y2={yCircleTop}
          stroke={textColor} // Use the same text color throughought for consistency.
          strokeDasharray={"2,2"} // Create a dashed line pattern.
        />

        {/* Render the tick value as a label next to each dashed line. */}
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
