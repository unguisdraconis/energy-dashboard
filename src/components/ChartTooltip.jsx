import { useRef, useLayoutEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * ChartTooltip — reusable HTML tooltip overlay for charts.
 *
 * Positioned absolutely inside .chart-svg-wrapper (which is itself
 * absolutely positioned inside .chart-container). Coordinates are
 * relative to the SVG / wrapper origin.
 *
 * Uses useLayoutEffect to measure its own size and clamp position
 * so it never overflows the container.
 *
 * Usage:
 *   <ChartTooltip x={120} y={80} containerWidth={600} containerHeight={400}>
 *     <div className="tooltip-title">2024</div>
 *     <div className="tooltip-row">
 *       <span className="tooltip-swatch" style={{ background: '#E69F00' }} />
 *       <span className="tooltip-label">Oil</span>
 *       <span className="tooltip-value">1,234 TWh</span>
 *     </div>
 *   </ChartTooltip>
 */
export function ChartTooltip({
  x,
  y,
  containerWidth,
  containerHeight,
  children,
}) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tw = el.offsetWidth;
    const th = el.offsetHeight;
    const pad = 8;
    const offset = 14;

    let left = x + offset;
    let top = y;

    // Flip horizontally if overflowing right
    if (left + tw > containerWidth - pad) {
      left = x - tw - offset;
    }
    // Clamp left edge
    if (left < pad) left = pad;

    // Clamp vertically
    if (top + th > containerHeight - pad) {
      top = containerHeight - th - pad;
    }
    if (top < pad) top = pad;

    setPos({ left, top });
  }, [x, y, containerWidth, containerHeight, children]);

  return (
    <motion.div
      ref={ref}
      className="chart-tooltip"
      initial={{ scale: 0.96 }}
      animate={{ scale: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.18 }}
      style={{ left: pos.left, top: pos.top }}
    >
      {children}
    </motion.div>
  );
}
