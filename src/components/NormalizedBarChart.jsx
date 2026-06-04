import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { ResponsiveChartWrapper } from "./ResponsiveChartWrapper";
import { ChartTooltip } from "./ChartTooltip";
import { ChartLegend } from "./ChartLegend";
import { cssVar } from "../utils/cssVar";
import { ENERGY_SOURCES, ENERGY_COLORS, ENERGY_LABELS } from "../colorPalette";
import { data, getCountries, getYearRange } from "../data";

function NormalizedBarSVG({ width, height, year, onTooltip }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const axisColor = cssVar("--chart-axis");
    const textColor = cssVar("--chart-text");

    const countries = getCountries().filter((c) => c !== "World");
    const yearData = countries
      .map((country) => {
        const row = data.find((d) => d.country === country && d.year === year);
        if (!row) return null;
        const total = ENERGY_SOURCES.reduce(
          (sum, src) => sum + (row[src] ?? 0),
          0,
        );
        if (total === 0) return null;
        const result = { country, total };
        ENERGY_SOURCES.forEach((src) => {
          result[src] = ((row[src] ?? 0) / total) * 100;
        });
        return result;
      })
      .filter(Boolean)
      .sort((a, b) => {
        const fossilA = a.coal + a.oil + a.gas;
        const fossilB = b.coal + b.oil + b.gas;
        return fossilB - fossilA;
      });

    if (!yearData.length) return;

    const margin = { top: 5, right: 15, bottom: 25, left: 90 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return;

    const y = d3
      .scaleBand()
      .domain(yearData.map((d) => d.country))
      .range([0, h])
      .padding(0.15);

    const x = d3.scaleLinear().domain([0, 100]).range([0, w]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Stacked bars — store data on each rect for tooltip lookup
    yearData.forEach((row) => {
      let cumulative = 0;
      ENERGY_SOURCES.forEach((src) => {
        const val = row[src];
        if (val > 0.1) {
          g.append("rect")
            .attr("x", x(cumulative))
            .attr("y", y(row.country))
            .attr("width", Math.max(0, x(val) - x(0)))
            .attr("height", y.bandwidth())
            .attr("fill", ENERGY_COLORS[src])
            .attr("opacity", 0.85)
            .datum({ country: row.country, src, val, total: row.total });
        }
        cumulative += val;
      });
    });

    // Y axis (country names)
    g.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick text")
          .attr("fill", textColor)
          .attr("font-size", y.bandwidth() < 16 ? "8px" : "10px"),
      );

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat((d) => `${d}%`),
      )
      .call((g) => g.select(".domain").attr("stroke", axisColor))
      .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
      .call((g) =>
        g
          .selectAll(".tick text")
          .attr("fill", textColor)
          .attr("font-size", "10px"),
      );

    // Tooltip interaction on bar segments
    g.selectAll("rect[fill]")
      .on("mousemove", function (event) {
        const d = d3.select(this).datum();
        if (!d || !d.src) return;

        const [mx, my] = d3.pointer(event, svg.node());

        onTooltip({
          x: mx,
          y: my,
          title: d.country,
          rows: [
            {
              key: d.src,
              label: ENERGY_LABELS[d.src],
              color: ENERGY_COLORS[d.src],
              value: `${d.val.toFixed(1)}%`,
            },
          ],
        });
      })
      .on("mouseleave", () => onTooltip(null));
  }, [width, height, year, onTooltip]);

  return <svg ref={svgRef} width={width} height={height} />;
}

export function NormalizedBarChart() {
  const [minYear, maxYear] = getYearRange();
  const [year, setYear] = useState(2024);
  const [tooltip, setTooltip] = useState(null);

  const handleTooltip = useCallback((val) => setTooltip(val), []);

  const legendItems = ENERGY_SOURCES.map((src) => ({
    key: src,
    color: ENERGY_COLORS[src],
    label: ENERGY_LABELS[src],
  }));

  return (
    <ResponsiveChartWrapper
      title="Energy Mix by Country"
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
          <NormalizedBarSVG
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
