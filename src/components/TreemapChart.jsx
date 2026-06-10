import { useRef, useEffect, useState, useCallback } from "react";
import { useReducedMotion } from "motion/react";
import * as d3 from "d3";
import { ResponsiveChartWrapper } from "./ResponsiveChartWrapper";
import { ChartTooltip } from "./ChartTooltip";
import { ChartLegend } from "./ChartLegend";
import { cssVar } from "../utils/cssVar";
import { ENERGY_SOURCES, ENERGY_COLORS, ENERGY_LABELS } from "../colorPalette";
import { data, getCountries, getYearRange } from "../data";

function getCountrySummary(year) {
  return getCountries()
    .filter((c) => c !== "World")
    .map((country) => {
      const row = data.find((d) => d.country === country && d.year === year);
      const total = row?.primary_energy ?? 0;
      const sources = ENERGY_SOURCES.map((source) => ({
        source,
        value: row?.[source] ?? 0,
      })).filter((item) => item.value > 0);
      const dominantSource = sources.reduce(
        (best, current) => (current.value > best.value ? current : best),
        { source: ENERGY_SOURCES[0], value: 0 },
      );

      return {
        country,
        total,
        dominantSource: dominantSource.source,
        sources: sources.sort((a, b) => b.value - a.value),
      };
    })
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total);
}

function initializePoints(items, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const totalValue = d3.sum(items, (item) => item.total);
  const maxRadius = Math.min(width, height) * 0.43;
  let angle = 0;

  return items.map((item, index) => {
    const fraction = item.total / totalValue;
    const radius =
      maxRadius * Math.sqrt(fraction) * (0.65 + 0.35 * (index / items.length));
    const theta = angle + (index / items.length) * Math.PI * 1.25;
    angle += 2 * Math.PI * fraction;
    return [
      centerX + Math.cos(theta) * radius,
      centerY + Math.sin(theta) * radius,
    ];
  });
}

function pathFromPolygon(polygon) {
  if (!polygon || polygon.length === 0) return null;
  return `M${polygon.map(([x, y]) => `${x},${y}`).join("L")}Z`;
}

function TreemapSVG({ width, height, year, onTooltip }) {
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

    const textColor = cssVar("--chart-text");
    const axisColor = cssVar("--chart-axis");
    const backgroundColor = cssVar("--bg-card");

    const countries = getCountrySummary(year);
    if (!countries.length) return;

    const margin = { top: 12, right: 12, bottom: 12, left: 12 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return;

    const root = svg.select("g.chart-root");
    const chart = root.empty()
      ? svg.append("g").classed("chart-root", true)
      : root;
    chart.attr("transform", `translate(${margin.left},${margin.top})`);

    chart
      .selectAll("rect.background")
      .data([null])
      .join("rect")
      .classed("background", true)
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", w)
      .attr("height", h)
      .attr("fill", backgroundColor);

    const points = initializePoints(countries, w, h).filter((point) =>
      point.every((value) => Number.isFinite(value)),
    );
    if (points.length < 3) return;

    const delaunay = d3.Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, w, h]);

    const cells = countries
      .map((country, index) => {
        const polygon = voronoi.cellPolygon(index);
        return {
          ...country,
          polygon: polygon || [],
          index,
        };
      })
      .filter((cell) => cell.polygon.length > 0);

    const cellsGroup = chart
      .selectAll("g.voronoi-cells")
      .data([null])
      .join("g")
      .classed("voronoi-cells", true);

    const cellSelection = cellsGroup
      .selectAll("path.cell")
      .data(cells, (d) => d.country);

    const cellEnter = cellSelection
      .enter()
      .append("path")
      .classed("cell", true)
      .attr("fill", (d) => ENERGY_COLORS[d.dominantSource])
      .attr("stroke", axisColor)
      .attr("stroke-width", 1)
      .attr("opacity", 0)
      .attr("d", (d) => pathFromPolygon(d.polygon));

    const cellMerge = cellEnter.merge(cellSelection);
    const cellTransition = chartTransition
      ? cellMerge.transition(chartTransition)
      : cellMerge;

    cellTransition
      .attr("fill", (d) => ENERGY_COLORS[d.dominantSource])
      .attr("stroke", axisColor)
      .attr("d", (d) => pathFromPolygon(d.polygon))
      .attr("opacity", 0.96);

    const cellExit = cellSelection.exit();
    if (chartTransition) {
      cellExit.transition(chartTransition).attr("opacity", 0).remove();
    } else {
      cellExit.remove();
    }

    const labelData = cells.filter(
      (cell) => Math.abs(d3.polygonArea(cell.polygon)) > 700,
    );

    const labelSelection = chart
      .selectAll("text.cell-label")
      .data(labelData, (d) => d.country);

    const labelEnter = labelSelection
      .enter()
      .append("text")
      .classed("cell-label", true)
      .attr("fill", textColor)
      .attr("font-size", "11px")
      .attr("font-weight", 700)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .style("pointer-events", "none")
      .attr("opacity", 0)
      .text((d) => d.country);

    const labelMerge = labelEnter.merge(labelSelection);
    const labelTransition = chartTransition
      ? labelMerge.transition(chartTransition)
      : labelMerge;

    labelTransition
      .attr("x", (d) => d3.polygonCentroid(d.polygon)[0])
      .attr("y", (d) => d3.polygonCentroid(d.polygon)[1])
      .attr("opacity", 1);

    const labelExit = labelSelection.exit();
    if (chartTransition) {
      labelExit.transition(chartTransition).attr("opacity", 0).remove();
    } else {
      labelExit.remove();
    }

    const applyTooltip = (selection) => {
      selection
        .on("mousemove", function (event, d) {
          const [mx, my] = d3.pointer(event, svg.node());
          const total = d.total;
          onTooltip({
            x: mx,
            y: my,
            title: d.country,
            rows: [
              {
                key: `${d.country}-total`,
                label: "Total energy",
                color: ENERGY_COLORS[d.dominantSource],
                value: `${total.toLocaleString()} TWh`,
              },
              ...d.sources.slice(0, 3).map((source) => ({
                key: `${d.country}-${source.source}`,
                label: ENERGY_LABELS[source.source],
                color: ENERGY_COLORS[source.source],
                value: `${source.value.toLocaleString()} TWh`,
              })),
            ],
          });
        })
        .on("mouseleave", () => onTooltip(null));
    };

    applyTooltip(cellMerge);
  }, [width, height, year, onTooltip, prefersReducedMotion]);

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
      title="Voronoi Energy Treemap"
      animationKey={year}
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
