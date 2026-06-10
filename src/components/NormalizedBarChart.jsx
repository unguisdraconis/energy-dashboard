import { useRef, useEffect, useState, useCallback } from "react";
import { useReducedMotion } from "motion/react";
import * as d3 from "d3";
import { ResponsiveChartWrapper } from "./ResponsiveChartWrapper";
import { ChartTooltip } from "./ChartTooltip";
import { ChartLegend } from "./ChartLegend";
import { cssVar } from "../utils/cssVar";
import { ENERGY_SOURCES, ENERGY_COLORS, ENERGY_LABELS } from "../colorPalette";
import { data, getCountries, getYearRange } from "../data";

function NormalizedBarSVG({ width, height, year, onTooltip, orderBy }) {
  const svgRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!width || !height) return;

    const transitionDuration = prefersReducedMotion ? 0 : 900;
    const chartTransition = transitionDuration
      ? d3.transition().duration(transitionDuration).ease(d3.easeCubicInOut)
      : null;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").interrupt();

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
        if (orderBy) {
          return b[orderBy] - a[orderBy];
        }
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

    const root = svg.select("g.chart-root");
    const chart = root.empty()
      ? svg.append("g").classed("chart-root", true)
      : root;
    chart.attr("transform", `translate(${margin.left},${margin.top})`);

    const chartGroup = chart
      .selectAll("g.chart-group")
      .data([null])
      .join("g")
      .classed("chart-group", true);

    const barsData = [];
    yearData.forEach((row) => {
      let cumulative = 0;
      ENERGY_SOURCES.forEach((src) => {
        const val = row[src];
        if (val > 0.1) {
          barsData.push({
            country: row.country,
            src,
            val,
            total: row.total,
            x0: cumulative,
            x1: cumulative + val,
          });
        }
        cumulative += val;
      });
    });

    const bars = chartGroup
      .selectAll("rect.bar-segment")
      .data(barsData, (d) => `${d.country}-${d.src}`);

    const barsEnter = bars
      .enter()
      .append("rect")
      .classed("bar-segment", true)
      .attr("fill", (d) => ENERGY_COLORS[d.src])
      .attr("opacity", 0.85)
      .attr("x", (d) => x(d.x0))
      .attr("y", (d) => y(d.country))
      .attr("width", 0)
      .attr("height", y.bandwidth())
      .datum((d) => d);

    const barsMerge = barsEnter.merge(bars);
    const barsTransition = chartTransition
      ? barsMerge.transition(chartTransition)
      : barsMerge;

    barsTransition
      .attr("fill", (d) => ENERGY_COLORS[d.src])
      .attr("opacity", 0.85)
      .attr("y", (d) => y(d.country))
      .attr("height", y.bandwidth())
      .attr("x", (d) => x(d.x0))
      .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0)));

    const barsExit = bars.exit();
    if (chartTransition) {
      barsExit.transition(chartTransition).attr("width", 0).remove();
    } else {
      barsExit.remove();
    }

    const yAxisGroup = chartGroup
      .selectAll("g.y-axis")
      .data([null])
      .join("g")
      .classed("y-axis", true);

    const xAxisGroup = chartGroup
      .selectAll("g.x-axis")
      .data([null])
      .join("g")
      .classed("x-axis", true)
      .attr("transform", `translate(0,${h})`);

    const yAxisFn = d3.axisLeft(y).tickSize(0);
    const xAxisFn = d3
      .axisBottom(x)
      .ticks(5)
      .tickFormat((d) => `${d}%`);

    if (chartTransition) {
      yAxisGroup
        .transition(chartTransition)
        .call(yAxisFn)
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", y.bandwidth() < 16 ? "8px" : "10px"),
        );

      xAxisGroup
        .transition(chartTransition)
        .call(xAxisFn)
        .call((g) => g.select(".domain").attr("stroke", axisColor))
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", "10px"),
        );
    } else {
      yAxisGroup
        .call(yAxisFn)
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", y.bandwidth() < 16 ? "8px" : "10px"),
        );

      xAxisGroup
        .call(xAxisFn)
        .call((g) => g.select(".domain").attr("stroke", axisColor))
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", "10px"),
        );
    }

    barsMerge
      .on("mousemove", function (event, d) {
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
  }, [width, height, year, onTooltip, orderBy, prefersReducedMotion]);

  return <svg ref={svgRef} width={width} height={height} />;
}

export function NormalizedBarChart() {
  const [minYear, maxYear] = getYearRange();
  const [year, setYear] = useState(2024);
  const [orderBy, setOrderBy] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const handleTooltip = useCallback((val) => setTooltip(val), []);

  const legendItems = ENERGY_SOURCES.map((src) => ({
    key: src,
    color: ENERGY_COLORS[src],
    label: ENERGY_LABELS[src],
  }));

  const handleLegendClick = useCallback((key) => {
    setOrderBy((prev) => (prev === key ? null : key));
  }, []);

  return (
    <ResponsiveChartWrapper
      title="Energy Mix by Country"
      animationKey={`${year}-${orderBy || "none"}`}
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
        <ChartLegend
          items={legendItems}
          onItemClick={handleLegendClick}
          activeKey={orderBy}
        />
      }
    >
      {({ width, height }) => (
        <>
          <NormalizedBarSVG
            width={width}
            height={height}
            year={year}
            onTooltip={handleTooltip}
            orderBy={orderBy}
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
