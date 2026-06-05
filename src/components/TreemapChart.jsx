import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { ResponsiveChartWrapper } from "./ResponsiveChartWrapper";
import { ChartTooltip } from "./ChartTooltip";
import { ChartLegend } from "./ChartLegend";
import { cssVar } from "../utils/cssVar";
import { ENERGY_SOURCES, ENERGY_COLORS, ENERGY_LABELS } from "../colorPalette";
import { data, getCountries, getYearRange } from "../data";

function TreemapSVG({ width, height, year, onTooltip }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const textColor = cssVar("--chart-text");
    const backgroundColor = cssVar("--bg-card");
    const axisColor = cssVar("--chart-axis");

    const countries = getCountries().filter((c) => c !== "World");
    const yearData = countries
      .map((country) => {
        const row = data.find((d) => d.country === country && d.year === year);
        if (!row) return null;
        const total = row.primary_energy || 0;
        if (total <= 0) return null;
        return {
          name: country,
          children: ENERGY_SOURCES.map((src) => ({
            name: src,
            value: row[src] ?? 0,
            country,
          })),
        };
      })
      .filter(Boolean)
      .filter((row) => row.children.some((child) => child.value > 0));

    if (!yearData.length) return;

    const margin = { top: 10, right: 15, bottom: 10, left: 15 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return;

    const root = {
      name: "Energy Mix",
      children: yearData,
    };

    const treemap = d3.treemap().size([w, h]).paddingInner(1.5).paddingOuter(0);

    const hierarchy = d3
      .hierarchy(root)
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value);

    const tree = treemap(hierarchy);
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const countryNodes = tree
      .descendants()
      .filter((node) => node.depth === 1 && node.value > 0);

    countryNodes.forEach((node) => {
      const { x0, y0, x1, y1 } = node;
      g.append("rect")
        .attr("x", x0)
        .attr("y", y0)
        .attr("width", x1 - x0)
        .attr("height", y1 - y0)
        .attr("fill", backgroundColor)
        .attr("stroke", axisColor)
        .attr("stroke-width", 1)
        .attr("opacity", 1);

      const labelWidth = x1 - x0;
      const labelHeight = y1 - y0;
      if (labelWidth > 80 && labelHeight > 24) {
        g.append("text")
          .attr("x", x0 + 8)
          .attr("y", y0 + 16)
          .attr("fill", textColor)
          .attr("font-size", "11px")
          .attr("font-weight", 600)
          .attr("text-anchor", "start")
          .attr("alignment-baseline", "hanging")
          .style("pointer-events", "none")
          .text(node.data.name);
      }
    });

    const sourceNodes = tree
      .descendants()
      .filter((node) => node.depth === 2 && node.value > 0);

    sourceNodes.forEach((node) => {
      const { x0, y0, x1, y1, value } = node;
      const sourceName = node.data.name;
      const countryName = node.data.country;
      const parentTotal = node.parent?.value || value;
      const share = ((value / parentTotal) * 100).toFixed(1);

      if (x1 - x0 < 16 || y1 - y0 < 16) return;

      g.append("rect")
        .attr("x", x0)
        .attr("y", y0)
        .attr("width", x1 - x0)
        .attr("height", y1 - y0)
        .attr("fill", ENERGY_COLORS[sourceName])
        .attr("stroke", backgroundColor)
        .attr("stroke-width", 0.8)
        .attr("opacity", 0.95)
        .on("mousemove", function (event) {
          const [mx, my] = d3.pointer(event, svg.node());
          onTooltip({
            x: mx,
            y: my,
            title: `${ENERGY_LABELS[sourceName]} — ${countryName}`,
            rows: [
              {
                key: `${countryName}-${sourceName}`,
                label: "Energy",
                color: ENERGY_COLORS[sourceName],
                value: `${value.toLocaleString()} TWh (${share}%)`,
              },
            ],
          });
        })
        .on("mouseleave", () => onTooltip(null));
    });
  }, [width, height, year, onTooltip]);

  return <svg ref={svgRef} width={width} height={height} />;
}

export function TreemapChart() {
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
      title="Energy Consumption by Country"
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
          <TreemapSVG
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
