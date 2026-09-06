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
 * Returns country-level total energy and the combined share from solar, wind,
 * biofuel, and other renewable sources. Hydro is not part of this calculation.
 * Excludes countries with null energy source data (e.g., Nigeria).
 */
function getBubbleData(year) {
  const countries = getCountries().filter((c) => c !== "World"); // Filter out the 'World' entry from the country list.
  return countries
    .map((country) => {
      const row = data.find((d) => d.country === country && d.year === year); // Find data for a specific country and year.
      if (!row) return null; // Exit early if no data found.

      // Skip countries with null source data
      if (row.coal === null || row.oil === null) return null;

      const total = row.primary_energy || 0;
      if (total <= 0) return null; // Exclude entries with non-positive energy totals.

      const selectedRenewablesTotal = RENEWABLE_KEYS.reduce(
        (sum, k) => sum + (row[k] ?? 0), // Calculate total renewable energy
        0,
      );
      const selectedRenewablesShare = (selectedRenewablesTotal / total) * 100;

      const region = getRegionForCountry(country);
      if (!region) return null; // Skip if no valid region is found for the country.

      return {
        country,
        region,
        color: getColorForCountry(country), // Color associated with the country.
        energy: total, // Total energy consumption
        selectedRenewablesShare,
        renewableBreakdown: {
          //Breakdown of each type of renewable energy.
          solar: row.solar ?? 0,
          wind: row.wind ?? 0,
          biofuel: row.biofuel ?? 0,
          other_renewable: row.other_renewable ?? 0,
        },
      };
    })
    .filter(Boolean) // Remove any null values from the result.
    .sort((a, b) => b.energy - a.energy); // larger bubbles render first
}

/**
 * Find the largest country per region for labeling purposes.
 */
function getLabelCountries(bubbleData) {
  const largest = {};
  bubbleData.forEach((d) => {
    if (!largest[d.region] || d.energy > largest[d.region].energy) {
      largest[d.region] = d; // Keep track of largest energy-consuming countries in each region.
    }
  });
  return Object.values(largest); // Return list of largest countries per region.
}

function BubbleSVG({
  width,
  height,
  year,
  isLog,
  onTooltip,
  rScale,
  titleId,
  descriptionId,
}) {
  const svgRef = useRef(null); // Reference to the SVG element in the DOM.
  const prefersReducedMotion = useReducedMotion(); // Check if user prefers reduced motion.

  useEffect(() => {
    if (!width || !height) return; // Early exit if no dimensions provided.

    const svg = d3.select(svgRef.current); // Select the referenced SVG container.
    const axisColor = cssVar("--chart-axis"); // Retrieve CSS variable for axis color.
    const textColor = cssVar("--chart-text"); // Retrieve CSS variable for text color.
    const gridColor = cssVar("--chart-grid"); // Retrieve CSS variable for grid line color.
    const transitionDuration = prefersReducedMotion ? 0 : 1200; // Transition duration, none if reduced motion is preferred.

    // Define margins and calculate height/width of the chart area.
    const margin = { top: 15, right: 20, bottom: 35, left: 55 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return; // Early exit if chart is too small.

    const bubbleData = getBubbleData(year); // Get filtered and processed data for the specified year.
    if (!bubbleData.length) return; // Exit if there is no data to display.

    svg.selectAll("*").interrupt(); // Interrupt any ongoinh transitions on SVG elements.
    const root = svg.select("g.chart-root"); // Select or create a group element with class 'chart-root' for all chart elements.
    const chartRoot = root.empty()
      ? svg
          .append("g") // If the chart does not exist, append a new g element and add necessary classes/attributes.
          .classed("chart-root", true)
          .attr("transform", `translate(${margin.left},${margin.top})`)
      : root.attr("transform", `translate(${margin.left},${margin.top})`); // If the chat does exist, update its transform atribute.

    const energyExtent = d3.extent(bubbleData, (d) => d.energy); // Calculate the extent of the 'energy' data for scaling purposes.

    // Define x-scale: Logarithmic or Linear based on 'isLog' prop
    const x = isLog
      ? d3
          .scaleLog()
          .domain([Math.max(10, energyExtent[0] * 0.5), energyExtent[1] * 1.2]) // Set domain with some padding.
          .range([0, w])
          .nice()
      : d3
          .scaleLinear() // Otherwise use a linear model
          .domain([0, energyExtent[1] * 1.1]) // Linear domain set to accomodate the maximum value with padding.
          .range([0, w])
          .nice();

    // Define y-scale for the selected-renewables share percentages.
    const y = d3
      .scaleLinear()
      .domain([
        0,
        Math.max(
          d3.max(bubbleData, (d) => d.selectedRenewablesShare) * 1.15,
          5,
        ),
      ])
      .range([h, 0])
      .nice();

    // Define r-scale for bubble radii.
    const r =
      rScale ||
      d3
        .scaleSqrt() // Sscale square root of energy values to determine circle radius.
        .domain(energyExtent)
        .range([3, Math.min(w, h) * 0.08]); // Set range with minimum and max sizes based on chart dimensions.

    const axisTransition = transitionDuration
      ? d3.transition().duration(transitionDuration).ease(d3.easeCubicInOut) // Create a transition if not in reduced motion
      : null;

    // Select or create necessary groups for different parts of the chart.
    const grid = chartRoot.select(".grid");
    let axisLeftGroup = chartRoot.select(".y-axis");
    let axisBottomGroup = chartRoot.select(".x-axis");
    let bubbleGroup = chartRoot.select(".bubble-group");
    let labelGroup = chartRoot.select(".labels");
    let leaderGroup = chartRoot.select(".leader-lines");

    chartRoot.selectAll("*").interrupt(); // Interrupt any ongoing transitions on these elements.
    bubbleGroup.selectAll(".bubble").interrupt();

    if (grid.empty()) {
      chartRoot.append("g").classed("grid", true); // Append groups for grid lines, axes, bubbles, labels, and leader lines.
      chartRoot.append("g").classed("y-axis", true);
      chartRoot
        .append("g")
        .classed("x-axis", true)
        .attr("transform", `translate(0,${h})`);
      chartRoot.append("g").classed("bubble-group", true);
      chartRoot.append("g").classed("leader-lines", true);
      chartRoot.append("g").classed("labels", true);

      // Select the newly created groups for further manipulation.
      axisLeftGroup = chartRoot.select(".y-axis");
      axisBottomGroup = chartRoot.select(".x-axis");
      bubbleGroup = chartRoot.select(".bubble-group");
      labelGroup = chartRoot.select(".labels");
      leaderGroup = chartRoot.select(".leader-lines");
    }

    // Define x and y axes generators with formatted ticks.
    const xAxisGen = isLog
      ? d3.axisBottom(x).ticks(w < 300 ? 3 : w < 500 ? 5 : 7, (d) => {
          // Number of ticks based on available width.
          if (d >= 1000) return `${d / 1000}k`; // Format large numbers as 'k' for thousands.
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
      .tickFormat((d) => `${d}%`); // y-axis with percentage format

    // Update grid lines, x, and y axes. Use transitions if applicable.
    const gridUpdate = chartRoot.select(".grid");
    const xAxisUpdate = axisBottomGroup;
    const yAxisUpdate = axisLeftGroup;

    if (axisTransition) {
      gridUpdate
        .transition(axisTransition)
        .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat("")) // Update grid with vertical lines.
        .call((g) => g.select(".domain").remove()) //Remove domain line for a cleaner look.
        .call((g) =>
          g
            .selectAll(".tick line") // Set styles for tick lines
            .attr("stroke", gridColor)
            .attr("stroke-dasharray", "2,2"),
        );

      xAxisUpdate
        .transition(axisTransition)
        .attr("transform", `translate(0,${h})`) // Ensure x-axis is at the bottom.
        .call(xAxisGen) // Update tick marks and labels on the x-axis.
        .call((g) => g.select(".domain").attr("stroke", axisColor)) // Style for domain line.
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor)) //Style for ticks
        .call(
          (g) =>
            g
              .selectAll(".tick text")
              .attr("fill", textColor)
              .attr("font-size", "10px"), // Set text style for x-axis labels
        );

      yAxisUpdate
        .transition(axisTransition)
        .call(yAxisGen)
        .call((g) => g.select(".domain").attr("stroke", axisColor)) // Style for domain line
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor)) //Style for ticks
        .call(
          (g) =>
            g
              .selectAll(".tick text")
              .attr("fill", textColor)
              .attr("font-size", "10px"), // Set text styles for y-axis labels.
        );
    } else {
      gridUpdate
        .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat("")) // Update grid without transition
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g
            .selectAll(".tick line")
            .attr("stroke", gridColor)
            .attr("stroke-dasharray", "2,2"),
        );

      xAxisUpdate
        .attr("transform", `translate(0,${h})`)
        .call(xAxisGen) // Update x-axis without transition
        .call((g) => g.select(".domain").attr("stroke", axisColor))
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", "10px"),
        );

      yAxisUpdate
        .call(yAxisGen) // Update y-axis without transition
        .call((g) => g.select(".domain").attr("stroke", axisColor))
        .call((g) => g.selectAll(".tick line").attr("stroke", axisColor))
        .call((g) =>
          g
            .selectAll(".tick text")
            .attr("fill", textColor)
            .attr("font-size", "10px"),
        );
    }

    // Update the x-axis to indicate total energy consumption.
    const xLabel = chartRoot.selectAll(".x-label").data([null]);
    xLabel
      .enter()
      .append("text")
      .classed("x-label", true)
      .attr("text-anchor", "middle") // Center-align text
      .attr("fill", textColor) // Set text color
      .attr("font-size", "10px") //Set font size for the label
      .merge(xLabel)
      .attr("x", w / 2) // Position in center of chart horizontally
      .attr("y", h + 28) // Slightly below the x-axis
      .text(isLog ? "Total Energy TWh (log scale)" : "Total Energy TWh"); // Conditional text based on scaling type

    const yLabel = chartRoot.selectAll(".y-label").data([null]);
    yLabel
      .enter()
      .append("text")
      .classed("y-label", true)
      .attr("text-anchor", "middle")
      .attr("fill", textColor)
      .attr("font-size", "10px")
      .merge(yLabel)
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -42)
      .text("Selected renewables (%)");

    // Create or update bubbles representing countries data points
    const bubbles = bubbleGroup
      .selectAll(".bubble")
      .data(bubbleData, (d) => d.country); // Bind data to circle elements with a key function for enter-update-exit pattern

    const bubblesEnter = bubbles
      .enter()
      .append("circle") // Enter selection: append new circles.
      .attr("class", "bubble")
      .attr("cx", (d) => x(d.energy)) // Set initial position on the x-axis based on energy data
      .attr("cy", (d) => y(d.selectedRenewablesShare))
      .attr("r", 0) // Start with a radius of zero for transition effect
      .attr("fill", (d) => d.color) // Fill color from data
      .attr("fill-opacity", 0.6)
      .attr("stroke", (d) => d.color) // Stroke color from data
      .attr("stroke-width", 1.2)
      .attr("stroke-opacity", 0.85);

    const bubblesMerge = bubblesEnter.merge(bubbles); // Merge enter and update selections
    const bubbleTransition = axisTransition
      ? bubblesMerge.transition(axisTransition) // Apply transition if applicable
      : bubblesMerge;
    bubbleTransition
      .attr("cx", (d) => x(d.energy)) // Update center positions on the x-axis based on energy data.
      .attr("cy", (d) => y(d.selectedRenewablesShare))
      .attr("r", (d) => r(d.energy)); // Update radius based on energy data.

    if (!prefersReducedMotion) {
      bubbles.exit().transition().duration(400).attr("r", 0).remove();
    } else {
      bubbles.exit().remove(); // Exit selection without animation if reduced motion is preferred
    }

    // Prepare label data for country names, ensuring they are positioned to avoid overlap
    const labelCountries = getLabelCountries(bubbleData);
    const labels = labelCountries.map((d) => {
      const cx = x(d.energy); // Calculate center position on the x-axis based on energy data
      const cy = y(d.selectedRenewablesShare);
      const radius = r(d.energy); // Radius of bubbles for positioning labels
      const displayName = // Adjust country name display (e.g., USA instead of United States)
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
        cx, // Center x position
        cy, // Center y position
        radius, // Bubble radius
        labelX: cx, // Initial label x position same as bubble center
        labelY: cy - radius - 10, // Initial label y position above the bubble
        displayName, // Display name for country
        width: displayName.length * 6, // Approximate label width based on character count
        height: 14,
      };
    });

    // Resolve any overlap between labels by adjusting ther positions iteratively
    for (let iter = 0; iter < 50; iter++) {
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const a = labels[i];
          const b = labels[j];

          // Calculate overlap in both x and y directions
          const overlapX =
            a.width / 2 + b.width / 2 + 6 - Math.abs(a.labelX - b.labelX);
          const overlapY =
            a.height / 2 + b.height / 2 + 2 - Math.abs(a.labelY - b.labelY);

          if (overlapX > 0 && overlapY > 0) {
            // Resolve overlap by shifting labels in the direction of greater overlap
            if (overlapX < overlapY) {
              const pushX = overlapX / 2 + 1;
              if (a.labelX < b.labelX) {
                a.labelX -= pushX; // Move left
                b.labelX += pushX; // Move right
              } else {
                a.labelX += pushX; // Move right
                b.labelX -= pushX; // Move left
              }
            } else {
              const pushY = overlapY / 2 + 1;
              if (a.labelY < b.labelY) {
                a.labelY -= pushY; // Move up
                b.labelY += pushY; // Move down
              } else {
                a.labelY += pushY; // Move down
                b.labelY -= pushY; // Move up
              }
            }
          }
        }
      }
    }

    // Clamp label positions within the chart boundaries.
    labels.forEach((d) => {
      d.labelX = Math.max(d.width / 2, Math.min(w - d.width / 2, d.labelX)); // Ensure horizontal positioining is within bounds.
      d.labelY = Math.max(8, Math.min(h - 8, d.labelY)); // Ensure vertical positioing is within bounds and avoids top/bottom margins.
    });

    const labelContainers = labelGroup
      .selectAll(".label-container")
      .data(labels, (d) => d.country); // Bind labels to group elements for each country.

    const labelContainersExit = labelContainers.exit();
    if (axisTransition) {
      labelContainersExit
        .transition(axisTransition)
        .attr("opacity", 0) // Fade out during transition
        .remove();
    } else {
      labelContainersExit.remove(); // Remove without animation if reduced motion is preferred.
    }

    const labelContainersEnter = labelContainers
      .enter()
      .append("g")
      .classed("label-container", true)
      .attr("transform", (d) => `translate(${d.cx},${d.cy - d.radius})`) // Initial position aligned with bubble center above its radius.
      .attr("opacity", 0); // Start with zero opacity for  transition effect.

    labelContainersEnter
      .append("text")
      .classed("label-back", true)
      .attr("text-anchor", "middle") // Center align text
      .attr("font-size", "9px") // Set font size
      .attr("font-weight", 500) // Set font weight
      .attr("fill", cssVar("--bg-card")) // Use background color for shadow effect.
      .attr("stroke", cssVar("--bg-card"))
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .style("pointer-events", "none") // Disable pointer events to avoid interaction
      .text((d) => d.displayName); // Set text content

    labelContainersEnter
      .append("text")
      .classed("label-front", true)
      .attr("text-anchor", "middle") // Center-align text
      .attr("font-size", "9px") // Set font size
      .attr("font-weight", 500) // Set font weight
      .attr("fill", textColor) // Use specified text color for the label
      .style("pointer-events", "none") // Disable pointer events to avoid interaction.
      .text((d) => d.displayName); // Set text content

    const labelContainersMerge = labelContainersEnter.merge(labelContainers);
    const labelTransition = axisTransition
      ? labelContainersMerge.transition(axisTransition) // Apply transition if available
      : labelContainersMerge;

    labelTransition
      .attr("transform", (d) => `translate(${d.labelX},${d.labelY})`) // Update position to the calculated non-overlapping label position.
      .attr("opacity", 1); // Fade in to full opacity

    // Draw leader lines connecting bubbles with their labels
    const leaders = leaderGroup
      .selectAll(".leader-line")
      .data(labels, (d) => d.country);

    const leadersExit = leaders.exit();
    if (axisTransition) {
      leadersExit.transition(axisTransition).attr("stroke-opacity", 0).remove(); // Fade out during transition and then remove
    } else {
      leadersExit.remove(); // Remove without animation if reduced motion is preferred.
    }

    const leadersEnter = leaders
      .enter()
      .append("line") // Enter selection: append new leader lines
      .classed("leader-line", true)
      .attr("x1", (d) => d.cx) // Start x position from bubble center
      .attr("y1", (d) => d.cy - d.radius) // Start y position just above the bubble edge
      .attr("x2", (d) => d.cx) // End x position same as start initially for transitionm effect.
      .attr("y2", (d) => d.cy - d.radius)
      .attr("stroke", axisColor) // Line color from CSS variable
      .attr("stroke-width", 0.75) // Set stroke width
      .attr("stroke-opacity", 0); // Start with zero opacity for transition effect

    const leadersMerge = leadersEnter.merge(leaders);
    const leadersTransition = axisTransition
      ? leadersMerge.transition(axisTransition) // Apply transition if available
      : leadersMerge;

    leadersTransition
      .attr("x1", (d) => d.cx) // Update start x position from the bubble center
      .attr("y1", (d) => d.cy - d.radius) // Update start y position from just above the bubble edge
      .attr("x2", (d) => d.labelX) // End x position matches label's x position
      .attr("y2", (d) => d.labelY + 4) // End y position aligns with label's y position plus a small offset
      .attr("stroke-opacity", 1); // Fade in to full opacity

    // Attach event handlers for tooltip interaction on bubble hover
    bubbleGroup
      .selectAll(".bubble")
      .on("mousemove", function (event) {
        const d = d3.select(this).datum(); // Get the data bound to the current circle element
        const [mx, my] = d3.pointer(event, svg.node()); // Calculate mouse position relative to SVG

        onTooltip({
          x: mx,
          y: my,
          title: `${d.country} (${year})`, // Tooltip title with country and year
          rows: [
            {
              key: "energy",
              label: "Total Energy",
              color: d.color, // Use bubble's fill color for the energy row in the tooltip.
              value: `${d.energy.toLocaleString()} TWh`, // Format total energy as a string the 'TWh' unit.
            },
            {
              key: "renewables",
              label: "Selected renewables",
              color: "#2CA02C", // Use consistent green for renewable percentage row
              value: `${d.selectedRenewablesShare.toFixed(1)}%`,
            },
            {
              key: "solar",
              label: "  Solar",
              color: "#F0E442", // Specific color for solar energy data
              value: `${d.renewableBreakdown.solar.toFixed(1)} TWh`, // Format solar energy as a string with 'TWh' unit and one decimal place.
            },
            {
              key: "wind",
              label: "  Wind",
              color: "#CC79A7", // Specific color for wind energy data.
              value: `${d.renewableBreakdown.wind.toFixed(1)} TWh`, // Format wind energy as a string with 'TWh' unit and one decimal place.
            },
            {
              key: "biofuel",
              label: "  Biofuel",
              color: "#D55E00", // Specific color for biofuel energy data
              value: `${d.renewableBreakdown.biofuel.toFixed(1)} TWh`, // Format biofuel energy as a string with 'TWh' unit and one decimal place.
            },
            {
              key: "other",
              label: "  Other Renew.",
              color: "#999999", // Specific color for other renewable sources
              value: `${d.renewableBreakdown.other_renewable.toFixed(1)} TWh`, // Format other renewables as a string with 'TWh' unit and one decimal place.
            },
          ],
        });
      })
      .on("mouseleave", () => onTooltip(null)); // Clear tooltip when mouse leaves a bubble
  }, [width, height, year, isLog, onTooltip, rScale, prefersReducedMotion]); // Re-run effect if any of these dependencies change.

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    />
  );
}

export function BubbleChart() {
  const [minYear, maxYear] = getYearRange(); // Retrieve the range of available years in the dataset.
  const [year, setYear] = useState(2024); // State to manage selected year.
  const [isLog, setIsLog] = useState(true); // State to toggle between log and linear scale.
  const [tooltip, setTooltip] = useState(null); // State for managing tooltip content.

  const handleTooltip = useCallback((val) => setTooltip(val), []); // Memoized callback function to update tooltip state
  const bubbleData = getBubbleData(year);

  // Generate legend items based on regional data.
  const legendItems = REGION_NAMES.map((name) => ({
    key: name, // Unique identifier
    color: REGION_COLORS[name], // Associated color from the region color mapping.
    label: name, // Label text matching the region name.
  }));

  return (
    <ResponsiveChartWrapper
      title="Energy vs Selected Renewables — by Region" // Set chart title.
      description="Bubbles compare total primary energy on the horizontal axis with the combined share from solar, wind, biofuel, and other renewable sources on the vertical axis. Bubble size repeats total energy and color identifies region. Use the year slider and scale toggle to change the view. Exact values are available in the table below the chart."
      animationKey={`${year}-${isLog}`} // Unique key for managing transitions based on current year and scale type.
      controls={
        // Render control elements for user interaction:
        <div className="bubble-controls">
          <div className="year-slider-container">
            <input
              type="range"
              className="year-slider" // Style class for the range input.
              aria-label="Year for energy and selected renewables comparison"
              aria-valuetext={String(year)}
              min={minYear} // Minimum year available in the dataset
              max={maxYear} // Maximum year available in the dataset.
              value={year} // Currently selected year.
              onChange={(e) => setYear(Number(e.target.value))} // Update state on change event
            />
            <span className="year-label">{year}</span>
          </div>
          <button
            type="button"
            className={`toggle-btn scale-toggle ${isLog ? "active" : ""}`} // Toggle button with conditional class based on 'isLog'.
            aria-label="Use logarithmic energy scale"
            aria-pressed={isLog}
            style={isLog ? { borderColor: cssVar("--accent") } : {}} // Conditional border color
            onClick={() => setIsLog((v) => !v)} // Toggle log/linear state.
          >
            {isLog ? "Log" : "Linear"}{" "}
            {/* Button label reflecting the current scaling mode*/}
          </button>
        </div>
      }
      legend={<ChartLegend items={legendItems} />} // Render chart legend using 'ChartLegend' component and the generated legend items.
      supplementary={
        <details className="chart-data-details">
          <summary>View bubble chart values for {year}</summary>
          <div className="chart-data-table-wrapper">
            <table className="chart-data-table">
              <caption className="sr-only">
                Bubble chart values for {year}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Entity</th>
                  <th scope="col">Total energy (TWh)</th>
                  <th scope="col">Selected renewables (%)</th>
                  <th scope="col">Region</th>
                </tr>
              </thead>
              <tbody>
                {bubbleData.map((row) => (
                  <tr key={row.country}>
                    <th scope="row">{row.country}</th>
                    <td>{row.energy.toLocaleString()}</td>
                    <td>{row.selectedRenewablesShare.toFixed(1)}</td>
                    <td>{row.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      }
    >
      {({ width, height, titleId, descriptionId }) => {
        const energyExtent = d3.extent(bubbleData, (d) => d.energy); // Calculate extent of 'energy' values
        // Define radius scale based on available chart dimensions and energy range data.
        const rScale = d3
          .scaleSqrt()
          .domain(energyExtent)
          .range([3, Math.min(width, height) * 0.08]);

        return (
          <>
            <BubbleSVG
              width={width} // Pass the current chart width to 'BubbleSVG'.
              height={height}
              year={year}
              isLog={isLog}
              onTooltip={handleTooltip}
              rScale={rScale}
              titleId={titleId}
              descriptionId={descriptionId}
            />

            {/* Bubble size legend removed per request; BubbleLegend component preserved in src/components/BubbleLegend.jsx */}

            {tooltip && (
              <ChartTooltip
                x={tooltip.x}
                y={tooltip.y}
                containerWidth={width}
                containerHeight={height}
              >
                <div className="tooltip-title">{tooltip.title}</div>{" "}
                {/* Tooltip title */}
                {tooltip.rows.map(
                  (
                    row, // Map over tooltip rows to render each data point.
                  ) => (
                    <div key={row.key} className="tooltip-row">
                      <span
                        className="tooltip-swatch"
                        style={{ background: row.color }}
                      />
                      <span className="tooltip-label">{row.label}</span>{" "}
                      {/* Tooltip Label */}
                      <span
                        className="tooltip-value"
                        style={{ color: row.color }}
                      >
                        {row.value} {/* Tooltip Value */}
                      </span>
                    </div>
                  ),
                )}
              </ChartTooltip>
            )}
          </>
        );
      }}
    </ResponsiveChartWrapper>
  );
}
