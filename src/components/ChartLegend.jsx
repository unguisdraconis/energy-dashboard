/**
 * ChartLegend — reusable color-swatch legend for any chart.
 *
 * Props:
 *   items — Array of { key, color, label }
 *
 * Usage:
 *   <ChartLegend items={[
 *     { key: 'coal', color: '#4a4a4a', label: 'Coal' },
 *     { key: 'oil',  color: '#E69F00', label: 'Oil' },
 *   ]} />
 */
export function ChartLegend({ items }) {
  return (
    <div className="legend-items">
      {items.map((item) => (
        <div key={item.key} className="legend-item">
          <span className="legend-swatch" style={{ background: item.color }} />
          <span className="legend-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
