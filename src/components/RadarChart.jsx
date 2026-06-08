import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { ResponsiveChartWrapper } from "./ResponsiveChartWrapper";
import { ChartTooltip } from "./ChartTooltip";
import { ChartLegend } from "./ChartLegend";
import { cssVar } from "../utils/cssVar";
import { ENERGY_SOURCES, ENERGY_COLORS, ENERGY_LABELS } from "../colorPalette";
import { getCountries, getCountryData, getYearRange } from "../data";

function RadarSVG({ width, height, country, year, isLog, onTooltip }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const axisColor = cssVar("--chart-axis");
    const textColor = cssVar("--chart-text");
    const gridColor = cssVar("--chart-grid");
    const accentColor = cssVar("--accent");

    const margin = { top: 18, right: 18, bottom: 18, left: 18 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return;

    const rawData = getCountryData(country).find((d) => d.year === year);
    if (!rawData) return;

    const total = rawData.primary_energy || 0;
    const values = ENERGY_SOURCES.map((source) => ({
      source,
      value: rawData[source] ?? 0,
      percent: total ? ((rawData[source] ?? 0) / total) * 100 : 0,
    }));

    const radius = Math.min(w, h) * 0.43;
    const cx = margin.left + w / 2;
    const cy = margin.top + h / 2;

    const angleStep = (Math.PI * 2) / values.length;
    const maxValue = d3.max(values, (d) => d.value) || 1;
    const minPositive =
      d3.min(
        values.filter((d) => d.value > 0),
        (d) => d.value,
      ) || 1;
    const radiusScale = isLog
      ? d3
          .scaleLog()
          .domain([Math.max(1, minPositive), maxValue])
          .range([0, radius])
          .clamp(true)
      : d3.scaleLinear().domain([0, maxValue]).range([0, radius]);

    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1].map((d) => d * maxValue);
    const formatValue = d3.format("~s");

    const g = svg.append("g").attr("transform", "translate(0,0)");

    g.selectAll(".radar-grid")
      .data(gridLevels)
      .join("circle")
      .attr("class", "radar-grid")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", (d) => radiusScale(d))
      .attr("fill", "none")
      .attr("stroke", gridColor)
      .attr("stroke-width", 1)
      .attr("opacity", 0.55);

    g.selectAll(".radar-grid-label")
      .data(gridLevels)
      .join("text")
      .attr("class", "radar-grid-label")
      .attr("x", cx)
      .attr("y", (d) => cy - radiusScale(d) - 6)
      .attr("text-anchor", "middle")
      .attr("fill", textColor)
      .attr("font-size", "10px")
      .text((d) => `${formatValue(d)} TWh`);

    const axis = g
      .selectAll(".radar-axis")
      .data(values)
      .join("g")
      .attr("class", "radar-axis");

    axis
      .append("line")
      .attr("x1", cx)
      .attr("y1", cy)
      .attr("x2", (_, i) => cx + Math.cos(i * angleStep - Math.PI / 2) * radius)
      .attr("y2", (_, i) => cy + Math.sin(i * angleStep - Math.PI / 2) * radius)
      .attr("stroke", axisColor)
      .attr("stroke-width", 1)
      .attr("opacity", 0.9);

    axis
      .append("text")
      .attr(
        "x",
        (_, i) => cx + Math.cos(i * angleStep - Math.PI / 2) * (radius + 20),
      )
      .attr(
        "y",
        (_, i) => cy + Math.sin(i * angleStep - Math.PI / 2) * (radius + 20),
      )
      .attr("fill", textColor)
      .attr("font-size", "10px")
      .attr("text-anchor", (d, i) => {
        const angle = i * angleStep;
        return angle > Math.PI * 0.25 && angle < Math.PI * 0.75
          ? "start"
          : angle > Math.PI * 1.25 && angle < Math.PI * 1.75
            ? "end"
            : "middle";
      })
      .attr("dy", (d, i) => {
        const angle = i * angleStep;
        return angle < Math.PI ? "0" : "0.75em";
      })
      .text((d) => ENERGY_LABELS[d.source]);

    const radarPoints = values.map((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const valueRadius = d.value === 0 ? 0 : radiusScale(d.value);
      return {
        ...d,
        angle,
        x: cx + Math.cos(angle) * valueRadius,
        y: cy + Math.sin(angle) * valueRadius,
      };
    });

    const radarLine = d3
      .line()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveLinearClosed);

    g.append("path")
      .datum(radarPoints)
      .attr("d", radarLine)
      .attr("fill", accentColor)
      .attr("fill-opacity", 0.18)
      .attr("stroke", accentColor)
      .attr("stroke-width", 2);

    g.selectAll(".radar-point")
      .data(radarPoints)
      .join("circle")
      .attr("class", "radar-point")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 6)
      .attr("fill", (d) => ENERGY_COLORS[d.source])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        const [x, y] = d3.pointer(event, svg.node());
        onTooltip({
          x,
          y,
          title: `${d.source.replace(/_/g, " ")} — ${country} ${year}`,
          rows: [
            {
              key: `${d.source}-value`,
              label: ENERGY_LABELS[d.source],
              color: ENERGY_COLORS[d.source],
              value: `${d.value.toLocaleString()} TWh`,
            },
            {
              key: `${d.source}-percent`,
              label: "Share",
              color: ENERGY_COLORS[d.source],
              value: `${d.percent.toFixed(1)}%`,
            },
          ],
        });
      })
      .on("mouseleave", () => onTooltip(null));
  }, [width, height, country, year, isLog, onTooltip]);

  return <svg ref={svgRef} width={width} height={height} />;
}

export function RadarChart() {
  const [countries] = useState(() =>
    getCountries().filter((c) => c !== "World"),
  );
  const [minYear, maxYear] = getYearRange();
  const [year, setYear] = useState(maxYear);
  const [isLog, setIsLog] = useState(true);
  const [country, setCountry] = useState(countries[0]);
  const [tooltip, setTooltip] = useState(null);

  const handleTooltip = useCallback((val) => setTooltip(val), []);

  const legendItems = ENERGY_SOURCES.map((src) => ({
    key: src,
    color: ENERGY_COLORS[src],
    label: ENERGY_LABELS[src],
  }));

  return (
    <ResponsiveChartWrapper
      title="Country Energy Mix Radar"
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
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
            <span className="year-label">{year}</span>
          </div>
          <button
            className={`toggle-btn scale-toggle ${isLog ? "active" : ""}`}
            style={isLog ? { borderColor: cssVar("--accent") } : {}}
            onClick={() => setIsLog((v) => !v)}
          >
            {isLog ? "Log" : "Linear"}
          </button>
        </>
      }
      legend={<ChartLegend items={legendItems} />}
    >
      {({ width, height }) => (
        <>
          <RadarSVG
            width={width}
            height={height}
            country={country}
            year={year}
            isLog={isLog}
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
                  <span className="tooltip-value">{row.value}</span>
                </div>
              ))}
            </ChartTooltip>
          )}
        </>
      )}
    </ResponsiveChartWrapper>
  );
}
