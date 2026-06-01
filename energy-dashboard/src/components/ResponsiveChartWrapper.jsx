import { useDimensions } from '../hooks/useDimensions';

/**
 * ResponsiveChartWrapper — the "wrapper pattern" for responsive charts.
 *
 * Uses the useDimensions hook to measure the chart container, then passes
 * the measured { width, height } to children via a render-prop function.
 *
 * Props:
 *   title    — Chart title string
 *   controls — Optional React node rendered in the header (dropdowns, toggles, sliders)
 *   legend   — Optional React node rendered below the chart
 *   children — Render-prop function: ({ width, height }) => <SVG ... />
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
        {dimensions.width > 0 &&
          dimensions.height > 0 &&
          children(dimensions)}
      </div>
      {legend && <div className="chart-legend">{legend}</div>}
    </div>
  );
}
