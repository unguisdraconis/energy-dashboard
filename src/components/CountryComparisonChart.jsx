import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { ResponsiveChartWrapper } from "./ResponsiveChartWrapper";
import { ChartTooltip } from "./ChartTooltip";
import { CountryToggles } from "./CountryToggles";
import { cssVar } from "../utils/cssVar";
import { COUNTRY_PALETTE } from "../colorPalette";
import { data, getCountries } from "../data";

const DEFAULT_COUNTRIES = [
  "United States",
  "China",
  "India",
  "Germany",
  "Brazil",
];

function ComparisonSVG({ width, height, selectedCountries, onTooltip }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const axisColor = cssVar("--chart-axis");
    const textColor = cssVar("--chart-text");
    const gridColor = cssVar("--chart-grid");
    const crosshairColor = cssVar("--chart-crosshair");

    const margin = { top: 10, right: 75, bottom: 30, left: 55 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return;

    const countryData = selectedCountries.map((country) => ({
      country,
      values: data
        .filter((d) => d.country === country)
        .sort((a, b) => a.year - b.year),
    }));

    const allYears = countryData.flatMap((c) => c.values.map((d) => d.year));
    const allValues = countryData.flatMap((c) =>
      c.values.map((d) => d.primary_energy),
    );

    if (!allYears.length) return;

    const x = d3.scaleLinear().domain(d3.extent(allYears)).range([0, w]);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(allValues)])
      .nice()
      .range([h, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", gridColor)
          .attr("stroke-dasharray", "2,2"),
      );

    const line = d3
      .line()
      .x((d) => x(d.year))
      .y((d) => y(d.primary_energy))
      .curve(d3.curveMonotoneX);

    countryData.forEach((c, i) => {
      const color = COUNTRY_PALETTE[i % COUNTRY_PALETTE.length];

      g.append("path")
        .datum(c.values)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("opacity", 0.9);

      // End label
      const last = c.values[c.values.length - 1];
      if (last) {
        g.append("text")
          .attr("x", x(last.year) + 5)
          .attr("y", y(last.primary_energy))
          .attr("fill", color)
          .attr("font-size", "9px")
          .attr("alignment-baseline", "middle")
          .text(
            c.country.length > 10 ? c.country.slice(0, 10) + "…" : c.country,
          );
      }
    });

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
      .attr("y", -42)
      .attr("text-anchor", "middle")
      .attr("fill", textColor)
      .attr("font-size", "10px")
      .text("TWh");

    // Crosshair line
    const crosshair = g
      .append("line")
      .attr("y1", 0)
      .attr("y2", h)
      .attr("stroke", crosshairColor)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .style("display", "none");

    // Hover overlay
    svg
      .append("rect")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .attr("width", w)
      .attr("height", h)
      .attr("fill", "transparent")
      .on("mousemove", (event) => {
        const [mx] = d3.pointer(event);
        const yearExact = x.invert(mx);

        crosshair.style("display", null).attr("x1", mx).attr("x2", mx);

        // Find closest data point for each country
        const rows = countryData
          .map((c, i) => {
            const bisect = d3.bisector((d) => d.year).left;
            const idx = bisect(c.values, yearExact, 1);
            const d0 = c.values[idx - 1];
            const d1 = c.values[idx];
            if (!d0) return null;
            const d = d1 && yearExact - d0.year > d1.year - yearExact ? d1 : d0;
            return {
              key: c.country,
              label:
                c.country.length > 14
                  ? c.country.slice(0, 14) + "…"
                  : c.country,
              color: COUNTRY_PALETTE[i % COUNTRY_PALETTE.length],
              value: `${d.primary_energy.toLocaleString()} TWh`,
              year: d.year,
            };
          })
          .filter(Boolean);

        if (rows.length) {
          onTooltip({
            x: mx + margin.left,
            y: margin.top + 10,
            title: `${rows[0].year}`,
            rows,
          });
        }
      })
      .on("mouseleave", () => {
        crosshair.style("display", "none");
        onTooltip(null);
      });
  }, [width, height, selectedCountries, onTooltip]);

  return <svg ref={svgRef} width={width} height={height} />;
}

export function CountryComparisonChart() {
  const allCountries = getCountries().filter((c) => c !== "World");
  const [selected, setSelected] = useState(DEFAULT_COUNTRIES);
  const [tooltip, setTooltip] = useState(null);

  const handleTooltip = useCallback((val) => setTooltip(val), []);

  const toggle = (country) => {
    setSelected((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : prev.length < 9
          ? [...prev, country]
          : prev,
    );
  };

  return (
    <ResponsiveChartWrapper
      title="Country Comparison — Total Energy"
      controls={
        <CountryToggles
          countries={allCountries}
          selected={selected}
          onToggle={toggle}
          palette={COUNTRY_PALETTE}
        />
      }
    >
      {({ width, height }) => (
        <>
          <ComparisonSVG
            width={width}
            height={height}
            selectedCountries={selected}
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
