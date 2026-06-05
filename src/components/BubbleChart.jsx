import { useRef, useEffect, useState, useCallback } from "react";
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

function BubbleSVG({ width, height, year, isLog, onTooltip }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const axisColor = cssVar("--chart-axis");
    const textColor = cssVar("--chart-text");
    const gridColor = cssVar("--chart-grid");

    const margin = { top: 15, right: 20, bottom: 35, left: 55 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return;

    const bubbleData = getBubbleData(year);
    if (!bubbleData.length) return;

    // --- Scales ---
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

    const r = d3
      .scaleSqrt()
      .domain(energyExtent)
      .range([3, Math.min(w, h) * 0.08]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- Grid lines ---
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", gridColor)
          .attr("stroke-dasharray", "2,2"),
      );

    // --- X axis ---
    const xTickCount = w < 300 ? 3 : w < 500 ? 5 : 7;
    const xAxisGen = isLog
      ? d3.axisBottom(x).ticks(xTickCount, (d) => {
          if (d >= 1000) return `${d / 1000}k`;
          return d;
        })
      : d3
          .axisBottom(x)
          .ticks(xTickCount)
          .tickFormat((d) => {
            if (d >= 1000) return `${d / 1000}k`;
            return d;
          });

    g.append("g")
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

    // X label
    g.append("text")
      .attr("x", w / 2)
      .attr("y", h + 28)
      .attr("text-anchor", "middle")
      .attr("fill", textColor)
      .attr("font-size", "10px")
      .text(isLog ? "Total Energy TWh (log scale)" : "Total Energy TWh");

    // --- Y axis ---
    g.append("g")
      .call(
        d3
          .axisLeft(y)
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

    // Y label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("fill", textColor)
      .attr("font-size", "10px")
      .text("Renewables Share (%)");

    // --- Bubbles ---
    g.selectAll(".bubble")
      .data(bubbleData)
      .join("circle")
      .attr("class", "bubble")
      .attr("cx", (d) => x(d.energy))
      .attr("cy", (d) => y(d.renewableShare))
      .attr("r", (d) => r(d.energy))
      .attr("fill", (d) => d.color)
      .attr("fill-opacity", 0.6)
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 1.2)
      .attr("stroke-opacity", 0.85);

    // --- Country labels (largest per region) with collision avoidance ---
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

    // Collision avoidance — iterative push
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

    // Clamp labels within chart bounds
    labels.forEach((d) => {
      d.labelX = Math.max(d.width / 2, Math.min(w - d.width / 2, d.labelX));
      d.labelY = Math.max(8, Math.min(h - 8, d.labelY));
    });

    // Draw leader lines
    labels.forEach((d) => {
      g.append("line")
        .attr("x1", d.cx)
        .attr("y1", d.cy - d.radius)
        .attr("x2", d.labelX)
        .attr("y2", d.labelY + 4)
        .attr("stroke", axisColor)
        .attr("stroke-width", 0.75);
    });

    // Draw label text with white halo for readability
    const bgColor = cssVar("--bg-card");
    labels.forEach((d) => {
      // Halo (white stroke behind text)
      g.append("text")
        .attr("x", d.labelX)
        .attr("y", d.labelY)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-weight", 500)
        .attr("fill", bgColor)
        .attr("stroke", bgColor)
        .attr("stroke-width", 3)
        .attr("stroke-linejoin", "round")
        .style("pointer-events", "none")
        .text(d.displayName);

      // Actual label
      g.append("text")
        .attr("x", d.labelX)
        .attr("y", d.labelY)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-weight", 500)
        .attr("fill", textColor)
        .style("pointer-events", "none")
        .text(d.displayName);
    });

    // --- Tooltip interaction ---
    // Transparent overlay for hit detection
    g.selectAll(".bubble")
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
  }, [width, height, year, isLog, onTooltip]);

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
      {({ width, height }) => (
        <>
          <BubbleSVG
            width={width}
            height={height}
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
