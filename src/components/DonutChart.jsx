import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { ResponsiveChartWrapper } from "./ResponsiveChartWrapper";
import { ChartTooltip } from "./ChartTooltip";
import { ChartLegend } from "./ChartLegend";
import { cssVar } from "../utils/cssVar";
import { ENERGY_SOURCES, ENERGY_COLORS, ENERGY_LABELS } from "../colorPalette";
import { data, getYearRange } from "../data";

function DonutSVG({ width, height, year, onTooltip }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const textColor = cssVar("--chart-text");
    const backgroundColor = cssVar("--bg-card");

    const worldRow = data.find((d) => d.country === "World" && d.year === year);
    if (!worldRow) return;

    const segments = ENERGY_SOURCES.map((src) => ({
      src,
      value: worldRow[src] ?? 0,
    })).filter((segment) => segment.value > 0);

    const total = d3.sum(segments, (d) => d.value);
    if (total <= 0) return;

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return;

    const radius = Math.min(w, h) / 2;
    const chart = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left + w / 2},${margin.top + h / 2})`,
      );

    const arc = d3
      .arc()
      .innerRadius(radius * 0.55)
      .outerRadius(radius * 0.9);

    const labelArc = d3
      .arc()
      .innerRadius(radius * 0.96)
      .outerRadius(radius * 0.96);

    const pie = d3
      .pie()
      .sort(null)
      .value((d) => d.value);

    const pieData = pie(segments);

    chart
      .append("g")
      .selectAll("path")
      .data(pieData)
      .join("path")
      .attr("d", arc)
      .attr("fill", (d) => ENERGY_COLORS[d.data.src])
      .attr("stroke", backgroundColor)
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.95)
      .on("mousemove", function (event, d) {
        const [mx, my] = d3.pointer(event, svg.node());
        onTooltip({
          x: mx,
          y: my,
          title: ENERGY_LABELS[d.data.src],
          rows: [
            {
              key: d.data.src,
              label: ENERGY_LABELS[d.data.src],
              color: ENERGY_COLORS[d.data.src],
              value: `${((d.data.value / total) * 100).toFixed(1)}%`,
            },
          ],
        });
      })
      .on("mouseleave", () => onTooltip(null));

    chart
      .append("g")
      .selectAll("text")
      .data(pieData)
      .join("text")
      .filter((d) => d.endAngle - d.startAngle > 0.25)
      .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
      .attr("fill", textColor)
      .attr("font-size", "9px")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .text((d) => `${((d.data.value / total) * 100).toFixed(0)}%`);

    chart
      .append("circle")
      .attr("r", radius * 0.52)
      .attr("fill", backgroundColor)
      .attr("opacity", 1);

    chart
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.25em")
      .attr("fill", textColor)
      .attr("font-size", "13px")
      .attr("font-weight", 600)
      .text("World");

    chart
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.1em")
      .attr("fill", textColor)
      .attr("font-size", "11px")
      .text(`${year}`);
  }, [width, height, year, onTooltip]);

  return <svg ref={svgRef} width={width} height={height} />;
}

export function DonutChart() {
  const [minYear, maxYear] = getYearRange();
  const [year, setYear] = useState(maxYear);
  const [tooltip, setTooltip] = useState(null);

  const handleTooltip = useCallback((val) => setTooltip(val), []);

  const legendItems = ENERGY_SOURCES.map((src) => ({
    key: src,
    color: ENERGY_COLORS[src],
    label: ENERGY_LABELS[src],
  }));

  return (
    <ResponsiveChartWrapper
      title="Global Energy Mix"
      controls={
        <div className="year-slider-container">
          <input
            type="range"
            className="year-slider"
            min={minYear}
            max={maxYear}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <span className="year-label">{year}</span>
        </div>
      }
      legend={<ChartLegend items={legendItems} />}
    >
      {({ width, height }) => (
        <>
          <DonutSVG
            width={width}
            height={height}
            year={year}
            onTooltip={handleTooltip}
          />
          {tooltip && (
            <ChartTooltip
              x={tooltip.x}
              y={tooltip.y}
              containerWidth={width}
              containerHeight={height}
            >
              <div className="tooltip-title">{tooltip.title}</div>
              {tooltip.rows.map((row) => (
                <div key={row.key} className="tooltip-row">
                  <span
                    className="tooltip-swatch"
                    style={{ background: row.color }}
                  />
                  <span className="tooltip-label">{row.label}</span>
                  <span className="tooltip-value" style={{ color: row.color }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </ChartTooltip>
          )}
        </>
      )}
    </ResponsiveChartWrapper>
  );
}
