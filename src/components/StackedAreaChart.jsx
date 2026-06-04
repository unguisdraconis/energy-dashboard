import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { ResponsiveChartWrapper } from "./ResponsiveChartWrapper";
import { ENERGY_SOURCES, ENERGY_COLORS, ENERGY_LABELS } from "../colorPalette";
import { getCountries, getCountryData } from "../data";

/** Read a CSS custom property from :root */
function cssVar(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

function StackedAreaSVG({ width, height, country }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Read theme colors from CSS custom properties — single source of truth
    const axisColor = cssVar("--chart-axis");
    const textColor = cssVar("--chart-text");
    const tooltipBg = cssVar("--chart-tooltip-bg");
    const tooltipBorder = cssVar("--chart-tooltip-border");
    const tooltipText = cssVar("--chart-tooltip-text");
    const crosshairColor = cssVar("--chart-crosshair");

    const margin = { top: 10, right: 15, bottom: 30, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return;

    const rawData = getCountryData(country);
    if (!rawData.length) return;

    const chartData = rawData.map((d) => {
      const row = { year: d.year };
      ENERGY_SOURCES.forEach((src) => {
        row[src] = d[src] ?? 0;
      });
      return row;
    });

    const stack = d3
      .stack()
      .keys(ENERGY_SOURCES)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);
    const series = stack(chartData);

    const x = d3
      .scaleLinear()
      .domain(d3.extent(chartData, (d) => d.year))
      .range([0, w]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(series, (s) => d3.max(s, (d) => d[1]))])
      .nice()
      .range([h, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const area = d3
      .area()
      .x((d) => x(d.data.year))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(d3.curveMonotoneX);

    g.selectAll(".area-layer")
      .data(series)
      .join("path")
      .attr("class", "area-layer")
      .attr("d", area)
      .attr("fill", (d) => ENERGY_COLORS[d.key])
      .attr("opacity", 0.85);

    // X axis
    const tickCount = w < 300 ? 4 : w < 500 ? 6 : 8;
    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(tickCount).tickFormat(d3.format("d")))
      .call((g) => g.select(".domain").attr("stroke", axisColor))
      .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
      .call((g) =>
        g
          .selectAll(".tick text")
          .attr("fill", textColor)
          .attr("font-size", "11px"),
      );

    // Y axis
    g.append("g")
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d) => {
            if (d >= 1000) return `${d / 1000}k`;
            return d;
          }),
      )
      .call((g) => g.select(".domain").attr("stroke", axisColor))
      .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
      .call((g) =>
        g
          .selectAll(".tick text")
          .attr("fill", textColor)
          .attr("font-size", "11px"),
      );

    // Y label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("fill", textColor)
      .attr("font-size", "10px")
      .text("TWh");

    // Tooltip overlay
    const tooltip = g.append("g").style("display", "none");
    tooltip
      .append("line")
      .attr("y1", 0)
      .attr("y2", h)
      .attr("stroke", crosshairColor)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");
    const tooltipBox = tooltip.append("g");

    const bisect = d3.bisector((d) => d.year).left;

    svg
      .append("rect")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .attr("width", w)
      .attr("height", h)
      .attr("fill", "transparent")
      .on("mousemove", (event) => {
        const [mx] = d3.pointer(event);
        const year = x.invert(mx);
        const idx = bisect(chartData, year, 1);
        const d0 = chartData[idx - 1];
        const d1 = chartData[idx];
        if (!d0) return;
        const d = d1 && year - d0.year > d1.year - year ? d1 : d0;

        tooltip.style("display", null);
        tooltip.select("line").attr("x1", x(d.year)).attr("x2", x(d.year));

        tooltipBox.selectAll("*").remove();
        const total = ENERGY_SOURCES.reduce((sum, src) => sum + d[src], 0);
        const tx = x(d.year) + 10;
        const ty = 10;

        tooltipBox
          .append("rect")
          .attr("x", Math.min(tx, w - 115))
          .attr("y", ty)
          .attr("width", 110)
          .attr(
            "height",
            16 + ENERGY_SOURCES.filter((s) => d[s] > 0).length * 13,
          )
          .attr("rx", 4)
          .attr("fill", tooltipBg)
          .attr("stroke", tooltipBorder)
          .attr("opacity", 0.95);

        tooltipBox
          .append("text")
          .attr("x", Math.min(tx, w - 115) + 6)
          .attr("y", ty + 12)
          .attr("fill", tooltipText)
          .attr("font-size", "10px")
          .attr("font-weight", "600")
          .text(`${d.year} — ${total.toFixed(0)} TWh`);

        let row = 0;
        ENERGY_SOURCES.filter((s) => d[s] > 0).forEach((src) => {
          tooltipBox
            .append("text")
            .attr("x", Math.min(tx, w - 115) + 6)
            .attr("y", ty + 25 + row * 13)
            .attr("fill", ENERGY_COLORS[src])
            .attr("font-size", "9px")
            .text(`${ENERGY_LABELS[src]}: ${d[src].toFixed(1)}`);
          row++;
        });
      })
      .on("mouseleave", () => tooltip.style("display", "none"));
  }, [width, height, country]);

  return <svg ref={svgRef} width={width} height={height} />;
}

export function StackedAreaChart() {
  const countries = getCountries();
  const [country, setCountry] = useState("World");

  const legend = (
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
  );

  return (
    <ResponsiveChartWrapper
      title="Energy Mix Over Time"
      controls={
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
      }
      legend={legend}
    >
      {({ width, height }) => (
        <StackedAreaSVG width={width} height={height} country={country} />
      )}
    </ResponsiveChartWrapper>
  );
}
