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
import { motion, useReducedMotion } from "motion/react";

export function ChartLegend({ items, onItemClick, activeKey }) {
  const prefersReducedMotion = useReducedMotion();
  const itemTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: "easeOut" };

  return (
    <div className="legend-items">
      {items.map((item) => (
        <motion.div
          key={item.key}
          className={`legend-item ${activeKey === item.key ? "active" : ""}`}
          role={onItemClick ? "button" : undefined}
          tabIndex={onItemClick ? 0 : undefined}
          aria-pressed={onItemClick ? activeKey === item.key : undefined}
          onClick={onItemClick ? () => onItemClick(item.key) : undefined}
          onKeyDown={
            onItemClick
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onItemClick(item.key);
                  }
                }
              : undefined
          }
          whileHover={onItemClick ? { scale: 1.02 } : undefined}
          animate={{ scale: 1 }}
          transition={itemTransition}
        >
          <span className="legend-swatch" style={{ background: item.color }} />
          <span className="legend-label">{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
