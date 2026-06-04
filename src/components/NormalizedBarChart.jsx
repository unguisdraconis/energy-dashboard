import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { ResponsiveChartWrapper } from "./ResponsiveChartWrapper";
import { ENERGY_SOURCES, ENERGY_COLORS, ENERGY_LABELS } from "../colorPalette";
import { data, getCountries, getYearRange } from "../data";

function cssVar(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

function NormalizedBarSVG({ width, height, year }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const axisColor = cssVar("--chart-axis");
    const textColor = cssVar("--chart-text");
    const tooltipBg = cssVar("--chart-tooltip-bg");
    const tooltipBorder = cssVar("--chart-tooltip-border");
    const tooltipText = cssVar("--chart-tooltip-text");

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

    // Stacked bars
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
            .attr("opacity", 0.85);
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

    // Tooltip
    const tooltipG = g.append("g").style("display", "none");
    const tooltipRect = tooltipG
      .append("rect")
      .attr("rx", 4)
      .attr("fill", tooltipBg)
      .attr("stroke", tooltipBorder)
      .attr("opacity", 0.95);
    const tooltipTextEl = tooltipG
      .append("text")
      .attr("fill", tooltipText)
      .attr("font-size", "10px");

    svg
      .selectAll('rect[fill]:not([fill="transparent"])')
      .on("mousemove", function (event) {
        const rect = d3.select(this);
        const fill = rect.attr("fill");
        const cy = parseFloat(rect.attr("y"));
        const row = yearData.find((d) => Math.abs(y(d.country) - cy) < 1);
        if (!row) return;
        const src = Object.entries(ENERGY_COLORS).find(
          ([, c]) => c === fill,
        )?.[0];
        if (!src) return;

        tooltipG.style("display", null);
        const label = `${ENERGY_LABELS[src]}: ${row[src].toFixed(1)}%`;
        tooltipTextEl.text(label).attr("x", 6).attr("y", 14);
        const bbox = tooltipTextEl.node().getBBox();
        tooltipRect
          .attr("width", bbox.width + 12)
          .attr("height", bbox.height + 8);

        const [mx, my] = d3.pointer(event, g.node());
        tooltipG.attr(
          "transform",
          `translate(${Math.min(mx + 10, w - bbox.width - 15)},${my - 20})`,
        );
      })
      .on("mouseleave", () => tooltipG.style("display", "none"));
  }, [width, height, year]);

  return <svg ref={svgRef} width={width} height={height} />;
}

export function NormalizedBarChart() {
  const [minYear, maxYear] = getYearRange();
  const [year, setYear] = useState(2024);

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
      legend={
        <div className="legend-items">
          {ENERGY_SOURCES.map((src) => (
            <div key={src} className="legend-item">
              <span
                className="legend-swatch"
                style={{ background: ENERGY_COLORS[src] }}
              />
              <span className="legend-label">{ENERGY_LABELS[src]}</span>
            </div>
          ))}
        </div>
      }
    >
      {({ width, height }) => (
        <NormalizedBarSVG width={width} height={height} year={year} />
      )}
    </ResponsiveChartWrapper>
  );
}
