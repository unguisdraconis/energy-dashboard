import { useRef, useEffect, useState, useCallback } from "react";
import { useReducedMotion } from "motion/react";
import * as d3 from "d3";
import { ResponsiveChartWrapper } from "./ResponsiveChartWrapper";
import { ChartTooltip } from "./ChartTooltip";
import { ChartLegend } from "./ChartLegend";
import { cssVar } from "../utils/cssVar";
import {
  REGION_NAMES,
  REGION_COLORS,
  getRegionForCountry,
  getColorForCountry,
} from "../colorPalette";
import { data, getCountries, getYearRange } from "../data";

const RENEWABLE_KEYS = ["solar", "wind", "biofuel", "other_renewable"];

/**
 * Prepare bubble data for a given year.
 * Returns array of { country, region, color, energy, renewableShare, renewableBreakdown }.
 * Excludes countries with null energy source data (e.g., Nigeria).
 */
function getBubbleData(year) {
  const countries = getCountries().filter((c) => c !== "World");
  return countries
    .map((country) => {
      const row = data.find((d) => d.country === country && d.year === year);
      if (!row) return null;

      // Skip countries with null source data
      if (row.coal === null || row.oil === null) return null;

      const total = row.primary_energy || 0;
      if (total <= 0) return null;

      const renewableTotal = RENEWABLE_KEYS.reduce(
        (sum, k) => sum + (row[k] ?? 0),
        0,
      );
      const renewableShare = (renewableTotal / total) * 100;

      const region = getRegionForCountry(country);
      if (!region) return null;

      return {
        country,
        region,
        color: getColorForCountry(country),
        energy: total,
        renewableShare,
        renewableBreakdown: {
          solar: row.solar ?? 0,
          wind: row.wind ?? 0,
          biofuel: row.biofuel ?? 0,
          other_renewable: row.other_renewable ?? 0,
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.energy - a.energy); // larger bubbles render first
}

/**
 * Find the largest country per region for labeling.
 */
function getLabelCountries(bubbleData) {
  const largest = {};
  bubbleData.forEach((d) => {
    if (!largest[d.region] || d.energy > largest[d.region].energy) {
      largest[d.region] = d;
    }
  });
  return Object.values(largest);
}

function BubbleSVG({ width, height, year, isLog, onTooltip, rScale }) {
  const svgRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    const axisColor = cssVar("--chart-axis");
    const textColor = cssVar("--chart-text");
    const gridColor = cssVar("--chart-grid");
    const transitionDuration = prefersReducedMotion ? 0 : 1200;

    const margin = { top: 15, right: 20, bottom: 35, left: 55 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return;

    const bubbleData = getBubbleData(year);
    if (!bubbleData.length) return;

    svg.selectAll("*").interrupt();
    const root = svg.select("g.chart-root");
    const chartRoot = root.empty()
      ? svg
          .append("g")
          .classed("chart-root", true)
          .attr("transform", `translate(${margin.left},${margin.top})`)
      : root.attr("transform", `translate(${margin.left},${margin.top})`);

    const energyExtent = d3.extent(bubbleData, (d) => d.energy);

    const x = isLog
      ? d3
          .scaleLog()
          .domain([Math.max(10, energyExtent[0] * 0.5), energyExtent[1] * 1.2])
          .range([0, w])
          .nice()
      : d3
          .scaleLinear()
          .domain([0, energyExtent[1] * 1.1])
          .range([0, w])
          .nice();

    const y = d3
      .scaleLinear()
      .domain([
        0,
        Math.max(d3.max(bubbleData, (d) => d.renewableShare) * 1.15, 5),
      ])
      .range([h, 0])
      .nice();

    const r =
      rScale ||
      d3
        .scaleSqrt()
        .domain(energyExtent)
        .range([3, Math.min(w, h) * 0.08]);

    const axisTransition = transitionDuration
      ? d3.transition().duration(transitionDuration).ease(d3.easeCubicInOut)
      : null;

    const grid = chartRoot.select(".grid");
    let axisLeftGroup = chartRoot.select(".y-axis");
    let axisBottomGroup = chartRoot.select(".x-axis");
    let bubbleGroup = chartRoot.select(".bubble-group");
    let labelGroup = chartRoot.select(".labels");
    let leaderGroup = chartRoot.select(".leader-lines");

    chartRoot.selectAll("*").interrupt();
    bubbleGroup.selectAll(".bubble").interrupt();

    if (grid.empty()) {
      chartRoot.append("g").classed("grid", true);
      chartRoot.append("g").classed("y-axis", true);
      chartRoot
        .append("g")
        .classed("x-axis", true)
        .attr("transform", `translate(0,${h})`);
      chartRoot.append("g").classed("bubble-group", true);
      chartRoot.append("g").classed("leader-lines", true);
      chartRoot.append("g").classed("labels", true);

      axisLeftGroup = chartRoot.select(".y-axis");
      axisBottomGroup = chartRoot.select(".x-axis");
      bubbleGroup = chartRoot.select(".bubble-group");
      labelGroup = chartRoot.select(".labels");
      leaderGroup = chartRoot.select(".leader-lines");
    }

    const xAxisGen = isLog
      ? d3.axisBottom(x).ticks(w < 300 ? 3 : w < 500 ? 5 : 7, (d) => {
          if (d >= 1000) return `${d / 1000}k`;
          return d;
        })
      : d3
          .axisBottom(x)
          .ticks(w < 300 ? 3 : w < 500 ? 5 : 7)
          .tickFormat((d) => {
            if (d >= 1000) return `${d / 1000}k`;
            return d;
          });

    const yAxisGen = d3
      .axisLeft(y)
      .ticks(5)
      .tickFormat((d) => `${d}%`);

    const gridUpdate = chartRoot.select(".grid");
    const xAxisUpdate = axisBottomGroup;
    const yAxisUpdate = axisLeftGroup;

    if (axisTransition) {
      gridUpdate
        .transition(axisTransition)
        .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""))
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g
            .selectAll(".tick line")
            .attr("stroke", gridColor)
            .attr("stroke-dasharray", "2,2"),
        );

      xAxisUpdate
        .transition(axisTransition)
        .attr("transform", `translate(0,${h})`)
        .call(xAxisGen)
        .call((g) => g.select(".domain").attr("stroke", axisColor))
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", "10px"),
        );

      yAxisUpdate
        .transition(axisTransition)
        .call(yAxisGen)
        .call((g) => g.select(".domain").attr("stroke", axisColor))
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", "10px"),
        );
    } else {
      gridUpdate
        .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""))
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g
            .selectAll(".tick line")
            .attr("stroke", gridColor)
            .attr("stroke-dasharray", "2,2"),
        );

      xAxisUpdate
        .attr("transform", `translate(0,${h})`)
        .call(xAxisGen)
        .call((g) => g.select(".domain").attr("stroke", axisColor))
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", "10px"),
        );

      yAxisUpdate
        .call(yAxisGen)
        .call((g) => g.select(".domain").attr("stroke", axisColor))
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", "10px"),
        );
    }

    const xLabel = chartRoot.selectAll(".x-label").data([null]);
    xLabel
      .enter()
      .append("text")
      .classed("x-label", true)
      .attr("text-anchor", "middle")
      .attr("fill", textColor)
      .attr("font-size", "10px")
      .merge(xLabel)
      .attr("x", w / 2)
      .attr("y", h + 28)
      .text(isLog ? "Total Energy TWh (log scale)" : "Total Energy TWh");

    const bubbles = bubbleGroup
      .selectAll(".bubble")
      .data(bubbleData, (d) => d.country);

    const bubblesEnter = bubbles
      .enter()
      .append("circle")
      .attr("class", "bubble")
      .attr("cx", (d) => x(d.energy))
      .attr("cy", (d) => y(d.renewableShare))
      .attr("r", 0)
      .attr("fill", (d) => d.color)
      .attr("fill-opacity", 0.6)
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 1.2)
      .attr("stroke-opacity", 0.85);

    const bubblesMerge = bubblesEnter.merge(bubbles);
    const bubbleTransition = axisTransition
      ? bubblesMerge.transition(axisTransition)
      : bubblesMerge;
    bubbleTransition
      .attr("cx", (d) => x(d.energy))
      .attr("cy", (d) => y(d.renewableShare))
      .attr("r", (d) => r(d.energy));

    if (!prefersReducedMotion) {
      bubbles.exit().transition().duration(400).attr("r", 0).remove();
    } else {
      bubbles.exit().remove();
    }

    const labelCountries = getLabelCountries(bubbleData);
    const labels = labelCountries.map((d) => {
      const cx = x(d.energy);
      const cy = y(d.renewableShare);
      const radius = r(d.energy);
      const displayName =
        d.country === "United States"
          ? "USA"
          : d.country === "United Kingdom"
            ? "UK"
            : d.country === "South Korea"
              ? "S. Korea"
              : d.country === "Saudi Arabia"
                ? "Saudi"
                : d.country === "United Arab Emirates"
                  ? "UAE"
                  : d.country;

      return {
        ...d,
        cx,
        cy,
        radius,
        labelX: cx,
        labelY: cy - radius - 10,
        displayName,
        width: displayName.length * 6,
        height: 14,
      };
    });

    for (let iter = 0; iter < 50; iter++) {
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const a = labels[i];
          const b = labels[j];

          const overlapX =
            a.width / 2 + b.width / 2 + 6 - Math.abs(a.labelX - b.labelX);
          const overlapY =
            a.height / 2 + b.height / 2 + 2 - Math.abs(a.labelY - b.labelY);

          if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
              const pushX = overlapX / 2 + 1;
              if (a.labelX < b.labelX) {
                a.labelX -= pushX;
                b.labelX += pushX;
              } else {
                a.labelX += pushX;
                b.labelX -= pushX;
              }
            } else {
              const pushY = overlapY / 2 + 1;
              if (a.labelY < b.labelY) {
                a.labelY -= pushY;
                b.labelY += pushY;
              } else {
                a.labelY += pushY;
                b.labelY -= pushY;
              }
            }
          }
        }
      }
    }

    labels.forEach((d) => {
      d.labelX = Math.max(d.width / 2, Math.min(w - d.width / 2, d.labelX));
      d.labelY = Math.max(8, Math.min(h - 8, d.labelY));
    });

    const labelContainers = labelGroup
      .selectAll(".label-container")
      .data(labels, (d) => d.country);

    const labelContainersExit = labelContainers.exit();
    if (axisTransition) {
      labelContainersExit
        .transition(axisTransition)
        .attr("opacity", 0)
        .remove();
    } else {
      labelContainersExit.remove();
    }

    const labelContainersEnter = labelContainers
      .enter()
      .append("g")
      .classed("label-container", true)
      .attr("transform", (d) => `translate(${d.cx},${d.cy - d.radius})`)
      .attr("opacity", 0);

    labelContainersEnter
      .append("text")
      .classed("label-back", true)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("font-weight", 500)
      .attr("fill", cssVar("--bg-card"))
      .attr("stroke", cssVar("--bg-card"))
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .style("pointer-events", "none")
      .text((d) => d.displayName);

    labelContainersEnter
      .append("text")
      .classed("label-front", true)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("font-weight", 500)
      .attr("fill", textColor)
      .style("pointer-events", "none")
      .text((d) => d.displayName);

    const labelContainersMerge = labelContainersEnter.merge(labelContainers);
    const labelTransition = axisTransition
      ? labelContainersMerge.transition(axisTransition)
      : labelContainersMerge;

    labelTransition
      .attr("transform", (d) => `translate(${d.labelX},${d.labelY})`)
      .attr("opacity", 1);

    const leaders = leaderGroup
      .selectAll(".leader-line")
      .data(labels, (d) => d.country);

    const leadersExit = leaders.exit();
    if (axisTransition) {
      leadersExit.transition(axisTransition).attr("stroke-opacity", 0).remove();
    } else {
      leadersExit.remove();
    }

    const leadersEnter = leaders
      .enter()
      .append("line")
      .classed("leader-line", true)
      .attr("x1", (d) => d.cx)
      .attr("y1", (d) => d.cy - d.radius)
      .attr("x2", (d) => d.cx)
      .attr("y2", (d) => d.cy - d.radius)
      .attr("stroke", axisColor)
      .attr("stroke-width", 0.75)
      .attr("stroke-opacity", 0);

    const leadersMerge = leadersEnter.merge(leaders);
    const leadersTransition = axisTransition
      ? leadersMerge.transition(axisTransition)
      : leadersMerge;

    leadersTransition
      .attr("x1", (d) => d.cx)
      .attr("y1", (d) => d.cy - d.radius)
      .attr("x2", (d) => d.labelX)
      .attr("y2", (d) => d.labelY + 4)
      .attr("stroke-opacity", 1);

    bubbleGroup
      .selectAll(".bubble")
      .on("mousemove", function (event) {
        const d = d3.select(this).datum();
        const [mx, my] = d3.pointer(event, svg.node());

        onTooltip({
          x: mx,
          y: my,
          title: `${d.country} (${year})`,
          rows: [
            {
              key: "energy",
              label: "Total Energy",
              color: d.color,
              value: `${d.energy.toLocaleString()} TWh`,
            },
            {
              key: "renewables",
              label: "Renewables",
              color: "#2CA02C",
              value: `${d.renewableShare.toFixed(1)}%`,
            },
            {
              key: "solar",
              label: "  Solar",
              color: "#F0E442",
              value: `${d.renewableBreakdown.solar.toFixed(1)} TWh`,
            },
            {
              key: "wind",
              label: "  Wind",
              color: "#CC79A7",
              value: `${d.renewableBreakdown.wind.toFixed(1)} TWh`,
            },
            {
              key: "biofuel",
              label: "  Biofuel",
              color: "#D55E00",
              value: `${d.renewableBreakdown.biofuel.toFixed(1)} TWh`,
            },
            {
              key: "other",
              label: "  Other Renew.",
              color: "#999999",
              value: `${d.renewableBreakdown.other_renewable.toFixed(1)} TWh`,
            },
          ],
        });
      })
      .on("mouseleave", () => onTooltip(null));
  }, [width, height, year, isLog, onTooltip, rScale, prefersReducedMotion]);

  return <svg ref={svgRef} width={width} height={height} />;
}

export function BubbleChart() {
  const [minYear, maxYear] = getYearRange();
  const [year, setYear] = useState(2024);
  const [isLog, setIsLog] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  const handleTooltip = useCallback((val) => setTooltip(val), []);

  const legendItems = REGION_NAMES.map((name) => ({
    key: name,
    color: REGION_COLORS[name],
    label: name,
  }));

  return (
    <ResponsiveChartWrapper
      title="Energy vs Renewables — by Region"
      animationKey={`${year}-${isLog}`}
      controls={
        <div className="bubble-controls">
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
        </div>
      }
      legend={<ChartLegend items={legendItems} />}
    >
      {({ width, height }) => {
        const bubbleData = getBubbleData(year);
        const energyExtent = d3.extent(bubbleData, (d) => d.energy);
        const rScale = d3
          .scaleSqrt()
          .domain(energyExtent)
          .range([3, Math.min(width, height) * 0.08]);

        return (
          <>
            <BubbleSVG
              width={width}
              height={height}
              year={year}
              isLog={isLog}
              onTooltip={handleTooltip}
              rScale={rScale}
            />

            {/* Bubble size legend removed per request; BubbleLegend component preserved in src/components/BubbleLegend.jsx */}

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
                    <span
                      className="tooltip-value"
                      style={{ color: row.color }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </ChartTooltip>
            )}
          </>
        );
      }}
    </ResponsiveChartWrapper>
  );
}
