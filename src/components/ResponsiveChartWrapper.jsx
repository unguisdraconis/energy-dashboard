import { useDimensions } from "../hooks/useDimensions";

/**
 * ResponsiveChartWrapper — the "wrapper pattern" for responsive charts.
 *
 * Uses the useDimensions hook to measure the chart container, then passes
 * the measured { width, height } to children via a render-prop function.
 *
 * The SVG is absolutely positioned inside the container so it doesn't
 * affect the container's measured size (preventing a resize feedback loop).
 */
export function ResponsiveChartWrapper({ title, controls, legend, children }) {
  const [ref, dimensions] = useDimensions();

  return (
    <div className="chart-widget">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        {controls && <div className="chart-controls">{controls}</div>}
      </div>
      <div ref={ref} className="chart-container">
        {dimensions.width > 0 && dimensions.height > 0 && (
          <div className="chart-svg-wrapper">{children(dimensions)}</div>
        )}
      </div>
      {legend && <div className="chart-legend">{legend}</div>}
    </div>
  );
}
