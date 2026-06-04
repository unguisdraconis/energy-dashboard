# Chart Design System — Agent Reference

> This document is a style guide and instruction set for AI models generating data visualizations.
> Follow these rules to produce charts with visual continuity across any project using this design system.

---

## 1. Architecture Overview

Every chart follows a **wrapper pattern** with three layers:

```
ResponsiveChartWrapper (layout, title, controls, legend)
  └─ useDimensions hook (measures container via ResizeObserver)
       └─ SVG chart component (receives { width, height } via render prop)
            └─ ChartTooltip (HTML, positioned absolutely over SVG)
```

**Key rules:**

- React owns state (selections, filters, sliders). D3 owns SVG rendering inside `useEffect`.
- The SVG is **absolutely positioned** inside the container so it cannot cause a resize feedback loop.
- Tooltips are **HTML `<div>` elements**, not SVG. They sit in the same absolutely-positioned wrapper as the SVG, layered on top via `z-index`.
- All theme colors are read from CSS custom properties at render time — never hardcode hex values for UI chrome.
- Data-encoding colors (category colors for chart series) come from a shared palette module — these are stable across themes.

---

## 2. Color System

### 2.1 Accent & UI Colors (from CSS custom properties)

These change between light and dark mode. Always read them at render time:

```javascript
import { cssVar } from "../utils/cssVar";
// cssVar('--chart-axis') → reads live value from :root
```

| Token             | Light                 | Dark                    | Use for                                          |
| ----------------- | --------------------- | ----------------------- | ------------------------------------------------ |
| `--accent`        | `#0072B2`             | `#56B4E9`               | Interactive elements, slider thumbs, focus rings |
| `--accent-bg`     | `rgba(0,114,178,0.1)` | `rgba(86,180,233,0.15)` | Hover/active backgrounds                         |
| `--accent-border` | `rgba(0,114,178,0.5)` | `rgba(86,180,233,0.5)`  | Focus borders                                    |
| `--text`          | `#6b6375`             | `#9ca3af`               | Body text, secondary labels                      |
| `--text-h`        | `#08060d`             | `#f3f4f6`               | Headings, primary labels                         |
| `--bg`            | `#fff`                | `#16171d`               | Page background                                  |
| `--bg-card`       | `#fff`                | `#1f2028`               | Card/widget background                           |
| `--border`        | `#e5e4e7`             | `#2e303a`               | Borders, dividers                                |

### 2.2 Chart-Specific Tokens (from CSS custom properties)

These are the **only** colors a chart should use for structural elements:

| Token                    | Light     | Dark      | Use for                  |
| ------------------------ | --------- | --------- | ------------------------ |
| `--chart-axis`           | `#d1d5db` | `#3f4150` | Axis lines, tick marks   |
| `--chart-text`           | `#6b6375` | `#9ca3af` | Tick labels, axis labels |
| `--chart-grid`           | `#e5e4e7` | `#2e303a` | Grid lines               |
| `--chart-tooltip-bg`     | `#ffffff` | `#1f2028` | Tooltip background       |
| `--chart-tooltip-border` | `#d1d5db` | `#3f4150` | Tooltip border           |
| `--chart-tooltip-text`   | `#08060d` | `#f3f4f6` | Tooltip text             |
| `--chart-crosshair`      | `#08060d` | `#f3f4f6` | Crosshair/hover lines    |

**Never hardcode these.** Always read via `cssVar('--chart-axis')` etc.

### 2.3 Data-Encoding Colors (from palette module — theme-stable)

The **Okabe-Ito** palette is used for categorical data. These do NOT change with light/dark mode.

#### Energy Sources (9 categories)

```
Coal:             #4a4a4a  (dark grey — visible on white and dark)
Oil:              #E69F00  (orange)
Gas:              #56B4E9  (sky blue)
Nuclear:          #009E73  (bluish green)
Hydro:            #0072B2  (blue)
Solar:            #F0E442  (yellow)
Wind:             #CC79A7  (reddish purple)
Biofuel:          #D55E00  (vermillion)
Other Renewable:  #999999  (grey)
```

#### General-Purpose Multi-Series Palette (up to 9 series)

Use this for country comparisons, multi-line charts, or any categorical encoding:

```
#E69F00  (orange)
#56B4E9  (sky blue)
#009E73  (bluish green)
#0072B2  (blue)
#D55E00  (vermillion)
#CC79A7  (reddish purple)
#8B6C5C  (warm brown)
#6A5ACD  (slate blue)
#2CA02C  (green)
```

#### Rules for choosing colors

- **Maximum 9 series** on any single chart. If you have more, use a dropdown or toggle to filter.
- **Assign colors by array index**, not by data value. This keeps colors stable as users toggle series on/off.
- **Never use pure black** (`#000000`) for data series — it conflicts with text. Use `#4a4a4a` instead.
- **Never use pure white** for data series — it disappears on light backgrounds.
- **Yellow** (`#F0E442`) should only be used for filled areas or large marks — it's hard to see as a thin line.

---

## 3. Typography

| Role                | Font             | Size      | Weight     | Color                           |
| ------------------- | ---------------- | --------- | ---------- | ------------------------------- |
| Dashboard title     | `var(--heading)` | `1.75rem` | 600        | `var(--text-h)`                 |
| Chart title         | `var(--heading)` | `0.95rem` | 600        | `var(--text-h)`                 |
| Axis tick labels    | (SVG text)       | `11px`    | normal     | `var(--chart-text)`             |
| Axis unit labels    | (SVG text)       | `10px`    | normal     | `var(--chart-text)`             |
| Tooltip title       | (HTML)           | `0.75rem` | 600        | `var(--chart-tooltip-text)`     |
| Tooltip labels      | (HTML)           | `0.72rem` | normal     | `var(--chart-tooltip-text)`     |
| Tooltip values      | (HTML)           | `0.68rem` | 600        | series color                    |
| Legend labels       | `var(--sans)`    | `0.72rem` | normal     | `var(--text)`                   |
| Year label (slider) | `var(--mono)`    | `0.85rem` | 700        | `var(--accent)`                 |
| Toggle buttons      | `var(--sans)`    | `0.68rem` | normal/600 | `var(--text)` / `var(--text-h)` |

Font stacks:

```css
--sans: system-ui, "Segoe UI", Roboto, sans-serif;
--heading: system-ui, "Segoe UI", Roboto, sans-serif;
--mono: ui-monospace, Consolas, monospace;
```

---

## 4. Layout & Sizing

### Dashboard Grid

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 2 columns on desktop */
  gap: 1rem;
  max-width: 1440px;
  margin: 0 auto;
}
```

Breakpoints:
| Breakpoint | Columns | Card Height | Behavior |
|---|---|---|---|
| >768px | 2 | 480px | Side-by-side |
| ≤768px | 1 | 420px | Stacked |
| ≤480px | 1 | 380px | Compact stacked |

### Chart Widget Card

```css
.chart-widget {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
  height: 480px; /* Fixed — prevents resize loops */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow);
}
```

### Chart Container (critical for responsiveness)

```css
.chart-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0; /* Required for flex children */
}

.chart-svg-wrapper {
  position: absolute; /* Prevents SVG from inflating container */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

### Standard Margins for SVG Charts

```javascript
// Line charts, area charts
const margin = { top: 10, right: 75, bottom: 30, left: 50 };

// Line charts with end labels — wider right margin
const margin = { top: 10, right: 80, bottom: 30, left: 55 };

// Horizontal bar charts — wider left margin for labels
const margin = { top: 5, right: 15, bottom: 25, left: 90 };
```

---

## 5. Tooltip System (HTML)

Tooltips are **HTML elements**, not SVG. They are rendered by React and positioned absolutely inside `.chart-svg-wrapper`, overlaying the SVG chart.

### Architecture

```
.chart-svg-wrapper (position: absolute)
  ├─ <svg> ... </svg>           ← D3 draws chart here
  └─ <ChartTooltip>             ← React renders tooltip here
       ├─ .tooltip-title
       └─ .tooltip-row (×N)
            ├─ .tooltip-swatch
            ├─ .tooltip-label
            └─ .tooltip-value
```

### How data flows

1. **D3** handles `mousemove` on a transparent overlay `<rect>`
2. D3 calls `onTooltip({ x, y, title, rows })` — a React setState callback
3. **React** conditionally renders `<ChartTooltip>` with the data
4. On `mouseleave`, D3 calls `onTooltip(null)` to hide it

```jsx
// In the SVG component (inside useEffect):
svg
  .append("rect")
  .attr("width", w)
  .attr("height", h)
  .attr("fill", "transparent")
  .on("mousemove", (event) => {
    const [mx] = d3.pointer(event);
    // ... find data point ...
    onTooltip({
      x: mx + margin.left, // position relative to wrapper
      y: margin.top + 10,
      title: `${d.year} — ${total.toFixed(0)} TWh`,
      rows: [{ key: "oil", label: "Oil", color: "#E69F00", value: "1234.5" }],
    });
  })
  .on("mouseleave", () => onTooltip(null));
```

```jsx
// In the outer chart component (JSX):
{
  tooltip && (
    <ChartTooltip
      x={tooltip.x}
      y={tooltip.y}
      containerWidth={width}
      containerHeight={height}
    >
      <div className="tooltip-title">{tooltip.title}</div>
      {tooltip.rows.map((row) => (
        <div key={row.key} className="tooltip-row">
          <span className="tooltip-swatch" style={{ background: row.color }} />
          <span className="tooltip-label">{row.label}</span>
          <span className="tooltip-value" style={{ color: row.color }}>
            {row.value}
          </span>
        </div>
      ))}
    </ChartTooltip>
  );
}
```

### ChartTooltip Props

| Prop              | Type      | Description                                     |
| ----------------- | --------- | ----------------------------------------------- |
| `x`               | number    | X position relative to the SVG wrapper (pixels) |
| `y`               | number    | Y position relative to the SVG wrapper (pixels) |
| `containerWidth`  | number    | Width of the SVG wrapper (for clamping)         |
| `containerHeight` | number    | Height of the SVG wrapper (for clamping)        |
| `children`        | ReactNode | Any HTML content to display                     |

### Clamping behavior

- Tooltip flips **left** when it would overflow the right edge
- Clamped to **left edge** with 8px padding
- Clamped **vertically** to stay within the container
- Smooth CSS transition on `left`/`top` for fluid movement

### CSS classes

| Class             | Purpose                                                                           |
| ----------------- | --------------------------------------------------------------------------------- |
| `.chart-tooltip`  | Container — absolute position, background, border, shadow, `pointer-events: none` |
| `.tooltip-title`  | Bold header line                                                                  |
| `.tooltip-row`    | Flex row for one data series                                                      |
| `.tooltip-swatch` | 8×8 colored square                                                                |
| `.tooltip-label`  | Series name                                                                       |
| `.tooltip-value`  | Monospace value, colored to match the series                                      |

### Rules

- **Never build tooltips in SVG.** Always use the HTML `<ChartTooltip>` component.
- **Content is free-form** — pass any JSX as children. The component only handles positioning.
- **Color values in tooltip** are the data-encoding colors (from palette), not theme colors.
- The tooltip title and labels inherit color from `--chart-tooltip-text`.

---

## 6. Shared Components

### 6.1 `cssVar(name)` — Theme color reader

Location: `src/utils/cssVar.js`

```javascript
import { cssVar } from "../utils/cssVar";
const axisColor = cssVar("--chart-axis");
```

**Always use this** to read CSS custom properties inside D3 `useEffect` blocks. Never hardcode UI chrome colors.

### 6.2 `<ChartLegend>` — Reusable legend

Location: `src/components/ChartLegend.jsx`

```jsx
import { ChartLegend } from "./ChartLegend";

const items = [
  { key: "coal", color: "#4a4a4a", label: "Coal" },
  { key: "oil", color: "#E69F00", label: "Oil" },
  // ...
];

<ChartLegend items={items} />;
```

Props:
| Prop | Type | Description |
|---|---|---|
| `items` | `Array<{ key, color, label }>` | Legend entries |

Renders a flex-wrap row of color swatches + labels. Styled by `.legend-items`, `.legend-item`, `.legend-swatch`, `.legend-label` in `App.css`.

### 6.3 `<CountryToggles>` — Multi-select toggle buttons

Location: `src/components/CountryToggles.jsx`

```jsx
import { CountryToggles } from './CountryToggles';

<CountryToggles
  countries={['China', 'India', 'Brazil', ...]}
  selected={['China', 'India']}
  onToggle={(country) => toggleSelection(country)}
  palette={COUNTRY_PALETTE}
/>
```

Props:
| Prop | Type | Description |
|---|---|---|
| `countries` | `string[]` | All available country names |
| `selected` | `string[]` | Currently active countries |
| `onToggle` | `(country: string) => void` | Click handler |
| `palette` | `string[]` | Color array — active buttons get border color from `palette[selectedIndex]` |

Renders scrollable button group. Active buttons show a 2px colored border matching their assigned palette color.

### 6.4 `<ResponsiveChartWrapper>` — Layout shell

Location: `src/components/ResponsiveChartWrapper.jsx`

```jsx
<ResponsiveChartWrapper
  title="Chart Title"
  controls={<select>...</select>}
  legend={<ChartLegend items={...} />}
>
  {({ width, height }) => (
    <>
      <MySVGComponent width={width} height={height} />
      {tooltip && <ChartTooltip ...>{...}</ChartTooltip>}
    </>
  )}
</ResponsiveChartWrapper>
```

Props:
| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Chart heading |
| `controls` | `ReactNode` | Optional — dropdowns, sliders, toggles |
| `legend` | `ReactNode` | Optional — rendered below the chart |
| `children` | `(dims: { width, height }) => ReactNode` | **Render prop** — receives measured dimensions |

---

## 7. Chart Type Guidelines

### Line Charts

```javascript
const line = d3
  .line()
  .x((d) => x(d.year))
  .y((d) => y(d.value))
  .curve(d3.curveMonotoneX); // Always monotoneX for time series

// Stroke widths
// Single emphasis line: 2.5px
// Multi-line comparison: 2px
// De-emphasized / context: 1px
```

### Area Charts (stacked)

```javascript
const area = d3
  .area()
  .x((d) => x(d.data.year))
  .y0((d) => y(d[0]))
  .y1((d) => y(d[1]))
  .curve(d3.curveMonotoneX);

// Stack order: d3.stackOrderNone (preserves input order)
// Stack offset: d3.stackOffsetNone (standard stacking)
// Opacity: 0.85 (allows slight transparency for layering)
```

### Bar Charts (horizontal, normalized)

```javascript
const y = d3.scaleBand().domain(countries).range([0, h]).padding(0.15); // 15% gap between bars

// Minimum bar segment width: clip values below 0.1% to avoid sub-pixel rendering
// Sort by a meaningful metric (e.g., fossil share descending)
```

### Scatter / Bubble

```javascript
// Not yet implemented — guidelines for future use:
// Circle radius: 3–8px (fixed) or scaled via d3.scaleSqrt (bubble)
// Opacity: 0.7 for overlap visibility
// Stroke: 1px white for separation on dense plots
```

### Grouped Bar

```javascript
// Not yet implemented — guidelines for future use:
// Use d3.scaleBand for groups, nested d3.scaleBand for items within groups
// Maximum 5 groups visible without scrolling
// Bar gap within group: 2px
// Group gap: band.padding(0.2)
```

---

## 8. Axis & Grid Conventions

### X Axis (time)

```javascript
const tickCount = w < 300 ? 4 : w < 500 ? 6 : 8; // Responsive tick count
d3.axisBottom(x).ticks(tickCount).tickFormat(d3.format("d"));
```

### Y Axis (values)

```javascript
d3.axisLeft(y)
  .ticks(5)
  .tickFormat((d) => {
    if (d >= 1000) return `${d / 1000}k`; // 1000 → "1k"
    return d;
  });
```

### Grid Lines

```javascript
g.append("g")
  .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""))
  .call((g) => g.select(".domain").remove())
  .call((g) =>
    g
      .selectAll(".tick line")
      .attr("stroke", cssVar("--chart-grid"))
      .attr("stroke-dasharray", "2,2"),
  );
```

### Crosshair

```javascript
const crosshair = g
  .append("line")
  .attr("y1", 0)
  .attr("y2", h)
  .attr("stroke", cssVar("--chart-crosshair"))
  .attr("stroke-width", 1)
  .attr("stroke-dasharray", "3,3")
  .style("display", "none");
```

### Y Axis Label

```javascript
g.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -h / 2)
  .attr("y", -40) // Adjust based on left margin
  .attr("text-anchor", "middle")
  .attr("fill", cssVar("--chart-text"))
  .attr("font-size", "10px")
  .text("TWh");
```

---

## 9. File Structure

```
src/
├── main.jsx                          ← Entry point
├── App.jsx                           ← Dashboard layout (grid)
├── App.css                           ← All CSS (theme tokens, layout, tooltip styles)
├── data.js                           ← Dataset + helper functions
├── colorPalette.js                   ← Okabe-Ito colors (energy + country palettes)
├── utils/
│   └── cssVar.js                     ← CSS custom property reader
├── hooks/
│   └── useDimensions.js              ← ResizeObserver hook
└── components/
    ├── ResponsiveChartWrapper.jsx    ← Layout shell (render prop)
    ├── ChartTooltip.jsx              ← HTML tooltip (absolute positioned)
    ├── ChartLegend.jsx               ← Reusable color legend
    ├── CountryToggles.jsx            ← Multi-select toggle buttons
    ├── StackedAreaChart.jsx          ← Energy mix over time
    ├── CountryComparisonChart.jsx    ← Total energy multi-line
    ├── NormalizedBarChart.jsx        ← 100% stacked horizontal bars
    └── RenewablesGrowthChart.jsx     ← Renewables share multi-line
```

---

## 10. New Chart Template

When creating a new chart, follow this exact structure:

```jsx
import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ResponsiveChartWrapper } from './ResponsiveChartWrapper';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';
import { cssVar } from '../utils/cssVar';
// Import palette colors and data as needed

// Inner SVG component — D3 rendering only
function MyChartSVG({ width, height, /* data props */, onTooltip }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Read ALL chrome colors from CSS — never hardcode
    const axisColor = cssVar('--chart-axis');
    const textColor = cssVar('--chart-text');
    const gridColor = cssVar('--chart-grid');
    const crosshairColor = cssVar('--chart-crosshair');

    const margin = { top: 10, right: 15, bottom: 30, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // ... D3 scales, axes, drawing ...

    // Tooltip: call onTooltip with position + data
    svg.append('rect')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('width', w).attr('height', h)
      .attr('fill', 'transparent')
      .on('mousemove', (event) => {
        const [mx, my] = d3.pointer(event);
        onTooltip({ x: mx + margin.left, y: my + margin.top, title: '...', rows: [...] });
      })
      .on('mouseleave', () => onTooltip(null));

  }, [width, height, /* data deps */, onTooltip]);

  return <svg ref={svgRef} width={width} height={height} />;
}

// Outer component — React state + wrapper
export function MyChart() {
  const [tooltip, setTooltip] = useState(null);
  const handleTooltip = useCallback((val) => setTooltip(val), []);

  return (
    <ResponsiveChartWrapper
      title="My Chart Title"
      controls={/* optional dropdowns, sliders, toggles */}
      legend={<ChartLegend items={[...]} />}
    >
      {({ width, height }) => (
        <>
          <MyChartSVG
            width={width}
            height={height}
            onTooltip={handleTooltip}
          />
          {tooltip && (
            <ChartTooltip
              x={tooltip.x} y={tooltip.y}
              containerWidth={width} containerHeight={height}
            >
              <div className="tooltip-title">{tooltip.title}</div>
              {tooltip.rows.map((row) => (
                <div key={row.key} className="tooltip-row">
                  <span className="tooltip-swatch" style={{ background: row.color }} />
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
```

---

## 11. Common Mistakes to Avoid

| Mistake                                    | Why it's wrong                                    | Correct approach                            |
| ------------------------------------------ | ------------------------------------------------- | ------------------------------------------- |
| Hardcoding `'#374151'` in D3 code          | Breaks in the other theme                         | `cssVar('--chart-axis')`                    |
| Using SVG `<text>` + `<rect>` for tooltips | Hard to style, can't wrap text, clips at SVG edge | Use `<ChartTooltip>` HTML component         |
| Rendering SVG in normal flow               | Causes infinite resize loop                       | `.chart-svg-wrapper { position: absolute }` |
| Using `min-height` on chart widget         | Container can grow infinitely                     | Use fixed `height: 480px`                   |
| Putting 12 lines on one chart              | Colors become indistinguishable                   | Cap at 9 series, use toggles                |
| Using `#000000` for a data series          | Conflicts with text/axis colors                   | Use `#4a4a4a` (dark grey)                   |
| Using `#F0E442` yellow as a thin line      | Invisible on white background                     | Only use yellow for filled areas            |
| Duplicating `cssVar()` in each file        | Violates single source of truth                   | Import from `../utils/cssVar`               |
| Inline legend markup in chart files        | Duplicated across charts                          | Use `<ChartLegend items={...} />`           |
| Inline toggle buttons in chart files       | Duplicated across charts                          | Use `<CountryToggles ... />`                |
| Using a non-Okabe-Ito accent color         | Breaks palette consistency                        | `--accent: #0072B2` (Okabe-Ito blue)        |
