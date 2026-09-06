import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useDimensions } from "../hooks/useDimensions";

/**
 * ResponsiveChartWrapper — the "wrapper pattern" for responsive charts.
 *
 * Uses the useDimensions hook to measure the chart container, then passes
 * the measured { width, height } to children via a render-prop function.
 *
 * The SVG is absolutely positioned inside the container so it doesn't
 * affect the container's measured size (preventing a resize feedback loop).
 *
 * The .chart-svg-wrapper also serves as the positioning context for
 * HTML tooltips — they sit absolutely positioned on top of the SVG.
 */

export function ResponsiveChartWrapper({
  title,
  description,
  controls,
  legend,
  supplementary,
  children,
}) {
  const [ref, dimensions] = useDimensions();
  const titleId = useId();
  const descriptionId = useId();
  const prefersReducedMotion = useReducedMotion();
  const motionTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: "easeOut" };

  return (
    <motion.section
      className="chart-widget"
      aria-labelledby={titleId}
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      transition={motionTransition}
      layout
      layoutTransition={motionTransition}
    >
      <div className="chart-header">
        <h2 id={titleId} className="chart-title">
          {title}
        </h2>
        {controls && <div className="chart-controls">{controls}</div>}
      </div>
      {description && (
        <p id={descriptionId} className="sr-only">
          {description}
        </p>
      )}
      <div ref={ref} className="chart-container">
        {dimensions.width > 0 && dimensions.height > 0 && (
          <motion.div
            className="chart-svg-wrapper"
            animate={{ y: 0 }}
            transition={motionTransition}
          >
            {children({ ...dimensions, titleId, descriptionId })}
          </motion.div>
        )}
      </div>
      {legend && <div className="chart-legend">{legend}</div>}
      {supplementary}
    </motion.section>
  );
}
