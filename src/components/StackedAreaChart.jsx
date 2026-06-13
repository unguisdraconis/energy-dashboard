import { useRef, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react"; // Hook to check if user perfers reduced motion.
import * as d3 from "d3"; // D3.js library for data visualization and manipulation.
import { ResponsiveChartWrapper } from "./ResponsiveChartWrapper"; // Custom wrapper component for responsive charts.
import { ChartTooltip } from "./ChartTooltip"; // Component to display tooltip on hover.
import { ChartLegend } from "./ChartLegend"; // Component for rendering a legend.
import { cssVar } from "../utils/cssVar"; // Utility function to access CSS custom properties.
import { ENERGY_SOURCES, ENERGY_COLORS, ENERGY_LABELS } from "../colorPalette"; // Import energy source data and color mappings.
import { getCountries, getCountryData } from "../data"; // Functions to retrieve country list and data.

/**
 * Function: StackedAreaSVG
 * This component renders the SVG for a stacked area chart using D3.js. It takes in dimensions,
 * selected country, a callback for tooltip handling, and an optional highlight key.
 */
function StackedAreaSVG({ width, height, country, onTooltip, highlightKey }) {
  const svgRef = useRef(null); // Reference to the SVG element
  const prefersReducedMotion = useReducedMotion(); // Check if user preferes reduced motion.

  useEffect(() => {
    if (!width || !height) return; // Exit early if dimensions are not provided.

    const transitionDuration = prefersReducedMotion ? 0 : 900; // Set transition duration based on motion preference.
    const chartTransition = transitionDuration
      ? d3.transition().duration(transitionDuration).ease(d3.easeCubicInOut)
      : null;

    const svg = d3.select(svgRef.current); // Select the SVG element.
    svg.selectAll("*").interrupt(); // Interrupt any ongoing transactions

    // Retrieve CSS variables for styling
    const axisColor = cssVar("--chart-axis");
    const textColor = cssVar("--chart-text");
    const crosshairColor = cssVar("--chart-crosshair");

    // Define margins and calculate inner dimensions.
    const margin = { top: 10, right: 15, bottom: 30, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return;

    // Fetch data for the selected country
    const rawData = getCountryData(country);
    if (!rawData.length) return;

    // Transform raw data into format suitable for stacking.
    const chartData = rawData.map((d) => {
      const row = { year: d.year };
      ENERGY_SOURCES.forEach((src) => {
        row[src] = d[src] ?? 0;
      });
      return row;
    });

    // Creae a D3 stack layout.
    const stack = d3
      .stack()
      .keys(ENERGY_SOURCES)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);
    const series = stack(chartData);

    // Define scales for x an y axes.
    const x = d3
      .scaleLinear()
      .domain(d3.extent(chartData, (d) => d.year))
      .range([0, w]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(series, (s) => d3.max(s, (d) => d[1]))])
      .nice()
      .range([h, 0]);

    // Create a bisector for finding the closest data point.
    const bisect = d3.bisector((d) => d.year).left;

    // Select or create the main chart group in the SVG
    const root = svg.select("g.chart-root");
    const chart = root.empty()
      ? svg.append("g").classed("chart-root", true)
      : root;
    chart.attr("transform", `translate(${margin.left},${margin.top})`);

    // Create or select groups for layers and axes.
    const layersGroup = chart
      .selectAll("g.layers")
      .data([null])
      .join("g")
      .classed("layers", true);

    const xAxisGroup = chart
      .selectAll("g.x-axis")
      .data([null])
      .join("g")
      .classed("x-axis", true)
      .attr("transform", `translate(0,${h})`);

    const yAxisGroup = chart
      .selectAll("g.y-axis")
      .data([null])
      .join("g")
      .classed("y-axis", true);

    // Add label for the y-axis
    chart
      .selectAll("text.y-label")
      .data([null])
      .join("text")
      .classed("y-label", true)
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("fill", textColor)
      .attr("font-size", "10px")
      .text("TWh");

    // Define area generator for the stacked areas.
    const areaGenerator = d3
      .area()
      .x((d) => x(d.data.year))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(d3.curveMonotoneX);

    // Define a baseline for the areas.
    const baseline = d3
      .area()
      .x((d) => x(d.data.year))
      .y0(h)
      .y1(h)
      .curve(d3.curveMonotoneX);
    // Create, update, or remove area layers based on data.
    const layerSelection = layersGroup
      .selectAll("path.area-layer")
      .data(series, (d) => d.key);

    const layerEnter = layerSelection
      .enter()
      .append("path")
      .attr("fill", (d) => ENERGY_COLORS[d.key])
      .attr("d", baseline);

    const layerMerge = layerEnter.merge(layerSelection);
    const layerTransition = chartTransition
      ? layerMerge.transition(chartTransition)
      : layerMerge;

    layerTransition
      .attr(
        "class",
        (d) =>
          `area-layer ${
            highlightKey
              ? d.key === highlightKey
                ? "highlight"
                : "dimmed"
              : ""
          }`,
      )
      .attr("fill", (d) => ENERGY_COLORS[d.key])
      .attr("opacity", (d) =>
        highlightKey ? (d.key === highlightKey ? 1 : 0.35) : 0.85,
      )
      .attr("d", areaGenerator);

    const layerExit = layerSelection.exit();
    if (chartTransition) {
      layerExit.transition(chartTransition).attr("opacity", 0).remove();
    } else {
      layerExit.remove();
    }

    // Define x and y axis functions.
    const xAxisFn = d3
      .axisBottom(x)
      .ticks(w < 300 ? 4 : w < 500 ? 6 : 8)
      .tickFormat(d3.format("d"));
    const yAxisFn = d3
      .axisLeft(y)
      .ticks(5)
      .tickFormat((d) => {
        if (d >= 1000) return `${d / 1000}k`;
        return d;
      });

    // Apply transitions to the axes.
    if (chartTransition) {
      xAxisGroup
        .transition(chartTransition)
        .call(xAxisFn)
        .call((g) => g.select(".domain").attr("stroke", axisColor))
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", "11px"),
        );

      yAxisGroup
        .transition(chartTransition)
        .call(yAxisFn)
        .call((g) => g.select(".domain").attr("stroke", axisColor))
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", "11px"),
        );
    } else {
      xAxisGroup
        .call(xAxisFn)
        .call((g) => g.select(".domain").attr("stroke", axisColor))
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", "11px"),
        );

      yAxisGroup
        .call(yAxisFn)
        .call((g) => g.select(".domain").attr("stroke", axisColor))
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", "11px"),
        );
    }

    // Create a crosshair line for tooltip interaction.
    const crosshair = chart
      .selectAll("line.crosshair")
      .data([null])
      .join("line")
      .classed("crosshair", true)
      .attr("y1", 0)
      .attr("y2", h)
      .attr("stroke", crosshairColor)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .style("display", "none");

    // Add a hover overlay to manage tooltip interactions
    svg
      .selectAll("rect.hover-overlay")
      .data([null])
      .join("rect")
      .classed("hover-overlay", true)
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

        crosshair
          .style("display", null)
          .attr("x1", x(d.year))
          .attr("x2", x(d.year));

        const total = ENERGY_SOURCES.reduce((sum, src) => sum + d[src], 0);
        const rows = ENERGY_SOURCES.filter((src) => d[src] > 0).map((src) => ({
          key: src,
          label: ENERGY_LABELS[src],
          color: ENERGY_COLORS[src],
          value: d[src],
        }));

        onTooltip({
          x: x(d.year) + margin.left,
          y: margin.top + 10,
          year: d.year,
          title: `${d.year} — ${total.toFixed(0)} TWh`,
          rows,
        });
      })
      .on("mouseleave", () => {
        crosshair.style("display", "none");
        onTooltip(null);
      });
  }, [width, height, country, onTooltip, highlightKey, prefersReducedMotion]);

  return <svg ref={svgRef} width={width} height={height} />;
}

/**
 * Function: StackedAreaChart
 * Main component for rendering a stacked area chart with selectable countries and interactivity.
 */
export function StackedAreaChart() {
  const countries = getCountries(); // Retrieve list of available countries.
  // State management for selected country, gighlighted energy source, and tooltip content.
  const [country, setCountry] = useState("World");
  const [highlightKey, setHighlightKey] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  // Generate legend items based on energy sources.
  const legendItems = ENERGY_SOURCES.map((src) => ({
    key: src,
    color: ENERGY_COLORS[src],
    label: ENERGY_LABELS[src],
  }));

  // Handle clicks on legend items to highlight specific energy sources.
  const handleLegendClick = (key) => {
    setHighlightKey((prev) => (prev === key ? null : key));
  };

  return (
    <ResponsiveChartWrapper
      title="Energy Mix Over Time"
      animationKey={`${country}-${highlightKey || "all"}`} // Unique key for managing transitions based on current state.
      controls={
        // Render a dropdown to select different countries.
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
      legend={
        // Render the chart legend with clickable items
        <ChartLegend
          items={legendItems}
          onItemClick={handleLegendClick}
          activeKey={highlightKey}
        />
      }
    >
      {({ width, height }) => (
        <>
          <StackedAreaSVG
            width={width} // Pass dimensions to the SVG component.
            height={height}
            country={country} // Pass selected country to the SVG componenet.
            onTooltip={setTooltip} // Function to handle tooltip display.
            highlightKey={highlightKey} // Highlight key for specific energy source
          />
          {tooltip && (
            <ChartTooltip
              x={tooltip.x} // Position of tooltip
              y={tooltip.y}
              containerWidth={width} // Container dimensions for positioning
              containerHeight={height}
            >
              <div className="tooltip-title">{tooltip.title}</div>
              {/* Render each row in the tooltip */}
              {tooltip.rows.map((row) => (
                <div key={row.key} className="tooltip-row">
                  <span
                    className="tooltip-swatch"
                    style={{ background: row.color }}
                  />
                  <span className="tooltip-label">{row.label}</span>
                  <span className="tooltip-value" style={{ color: row.color }}>
                    {row.value.toFixed(1)}
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
