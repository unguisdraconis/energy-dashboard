---
name: d3-react-renderer
description: "Generate React components that use D3 for math, geometry, and data processing while keeping rendering in React."
argument-hint: Describe the chart or visualization, the data shape, and any interactive or responsive requirements.
disable-model-invocation: true
---

This skill helps create clean, maintainable code where D3 is responsible for the math and layout, and React is responsible for DOM rendering, state, and lifecycle.

Use this skill when you want:

- chart or visualization components in React
- D3 utilities for scales, extents, shape generators, stacks, areas, and interpolation
- React-managed rendering, event handling, and responsive behavior

Workflow:

1. Clarify the expected output:
   - chart type (bar, line, area, stacked area, normalized bar, comparison chart, etc.)
   - data shape and key fields
   - axes, legends, and interactions
2. Compute geometry with D3 in pure functions or React hooks:
   - `d3.scaleLinear`, `d3.scaleBand`, `d3.extent`, `d3.max`, `d3.stack`, `d3.area`, `d3.line`
   - use `useMemo` for derived values and layout math
3. Keep DOM rendering in React:
   - render `svg`, `path`, `rect`, `text` and interactive elements via JSX
   - avoid D3 selections or direct DOM mutations
4. Add responsive behavior:
   - measure container size with a custom hook or wrapper component
   - recalc scales on resize and update JSX accordingly
5. Validate output:
   - ensure chart is accessible, readable, and matches the requested form
   - include descriptive labels, axis ticks, and hover/focus states if needed

If the request is ambiguous, ask:

- What chart type should this component render?
- What are the input data properties and expected output values?
- Should the component support resizing or interactions?

Example prompt to use this skill:
"Create a responsive React chart that uses D3 scales and area generators to render renewable energy growth over time."
