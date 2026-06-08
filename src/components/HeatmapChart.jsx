import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { ResponsiveChartWrapper } from "./ResponsiveChartWrapper";
import { ChartTooltip } from "./ChartTooltip";
import { ChartLegend } from "./ChartLegend";
import { cssVar } from "../utils/cssVar";
import { ENERGY_SOURCES, ENERGY_COLORS, ENERGY_LABELS } from "../colorPalette";
import { data, getCountries, getYearRange } from "../data";

function HeatmapSVG({ width, height, country, endYear, onTooltip }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const axisColor = cssVar("--chart-axis");
    const textColor = cssVar("--chart-text");
    const gridColor = cssVar("--chart-grid");

    const margin = { top: 28, right: 24, bottom: 36, left: 100 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return;

    const [minYear] = getYearRange();
    const years = d3.range(minYear, endYear + 1);
    const sourceRows = ENERGY_SOURCES;

    const countryRows = data.filter(
      (d) => d.country === country && d.year <= endYear,
    );

    const cells = years.flatMap((year) => {
      const row = countryRows.find((d) => d.year === year);
      return sourceRows.map((source) => {
        const value = row ? (row[source] ?? 0) : 0;
        return {
          source,
          year,
          value,
          share:
            row && row.primary_energy ? (value / row.primary_energy) * 100 : 0,
        };
      });
    });

    const maxValue = d3.max(cells, (d) => d.value) || 1;
    const opacityScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range([0.15, 0.95]);

    const x = d3
      .scaleBand()
      .domain(years.map(String))
      .range([0, w])
      .paddingInner(0.05)
      .paddingOuter(0.03);

    const y = d3.scaleBand().domain(sourceRows).range([0, h]).padding(0.12);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xTicks = years.filter(
      (_, i) => i % Math.max(1, Math.floor(years.length / 8)) === 0,
    );

    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(xTicks.map(String))
          .tickSize(-4)
          .tickFormat((d) => d),
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
      .call((g) =>
        g
          .selectAll(".tick text")
          .attr("fill", textColor)
          .attr("font-size", "10px"),
      );

    g.append("g")
      .call(
        d3
          .axisLeft(y)
          .tickSize(0)
          .tickFormat((value) => ENERGY_LABELS[value]),
      )
      .call((g) =>
        g
          .selectAll(".tick text")
          .attr("fill", textColor)
          .attr("font-size", "10px"),
      );

    g.append("g")
      .selectAll(".heatmap-cell")
      .data(cells)
      .join("rect")
      .attr("class", "heatmap-cell")
      .attr("x", (d) => x(String(d.year)) || 0)
      .attr("y", (d) => y(d.source) || 0)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", (d) => ENERGY_COLORS[d.source])
      .attr("fill-opacity", (d) => opacityScale(d.value))
      .attr("stroke", gridColor)
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        const [xPos, yPos] = d3.pointer(event, svg.node());
        onTooltip({
          x: xPos,
          y: yPos,
          title: `${ENERGY_LABELS[d.source]} — ${country} ${d.year}`,
          rows: [
            {
              key: "value",
              label: "Energy",
              color: ENERGY_COLORS[d.source],
              value: `${d.value.toLocaleString()} TWh`,
            },
            {
              key: "share",
              label: "Share",
              color: ENERGY_COLORS[d.source],
              value: `${d.share.toFixed(1)}%`,
            },
          ],
        });
      })
      .on("mouseleave", () => onTooltip(null));

    g.append("text")
      .attr("x", w / 2)
      .attr("y", h + 30)
      .attr("text-anchor", "middle")
      .attr("fill", textColor)
      .attr("font-size", "10px")
      .text("Year");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -margin.left + 18)
      .attr("text-anchor", "middle")
      .attr("fill", textColor)
      .attr("font-size", "10px")
      .text("Energy Source");
  }, [width, height, country, endYear, onTooltip]);

  return <svg ref={svgRef} width={width} height={height} />;
}

export function HeatmapChart() {
  const [countries] = useState(() =>
    getCountries().filter((c) => c !== "World"),
  );
  const [minYear, maxYear] = getYearRange();
  const [country, setCountry] = useState(countries[0]);
  const [endYear, setEndYear] = useState(maxYear);
  const [tooltip, setTooltip] = useState(null);

  const handleTooltip = useCallback((val) => setTooltip(val), []);

  const legendItems = ENERGY_SOURCES.map((src) => ({
    key: src,
    color: ENERGY_COLORS[src],
    label: ENERGY_LABELS[src],
  }));

  return (
    <ResponsiveChartWrapper
      title="Energy Heatmap — Country Source Intensity"
      controls={
        <>
          <select
            className="chart-select"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="year-slider-container">
            <input
              type="range"
              className="year-slider"
              min={minYear}
              max={maxYear}
              value={endYear}
              onChange={(e) => setEndYear(Number(e.target.value))}
            />
            <span className="year-label">{endYear}</span>
          </div>
        </>
      }
      legend={<ChartLegend items={legendItems} />}
    >
      {({ width, height }) => (
        <>
          <HeatmapSVG
            width={width}
            height={height}
            country={country}
            endYear={endYear}
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
