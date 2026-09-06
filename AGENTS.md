# Agent Instructions for energy-dashboard

## Project overview

- D3 Loves React learning project built with Vite.
- Visualizes a course-provided historical energy dataset using D3 and custom reusable React chart components.
- The active dashboard mounts six charts. Additional unmounted chart components are intentional alternate or experimental visualization modules used to explore interchangeable composition.
- No backend or API integration; the course-provided data used by the dashboard lives in `src/data.js`.

## Important files

- `package.json` — project metadata and scripts.
- `vite.config.js` — Vite configuration for React.
- `src/App.jsx` — app layout and dashboard composition.
- `src/data.js` — data source for charts.
- `src/components/` — chart components that render D3 visualizations.
- `src/components/ChartLegend.jsx` and `src/components/ChartTooltip.jsx` — shared interaction and presentation components.
- `src/hooks/useDimensions/` — hook used by `ResponsiveChartWrapper` for responsive SVG sizing.
- `src/App.css` — global dashboard styles.
- `SKILL.md` — reusable AI-facing visualization guidance retained as evidence of the agent/skill-assisted workflow experiment.

## Build and run

Use the existing npm scripts from `package.json`:

- `npm run dev` — start local development server.
- `npm run build` — build production output.
- `npm run preview` — preview the built app locally.
- `npm run deploy` — build and deploy to GitHub Pages.

## Conventions and guidance

- Prefer React function components and hooks.
- Keep chart logic inside components under `src/components/`.
- Use `ResponsiveChartWrapper` for any responsive chart layout.
- Avoid adding unnecessary state or routing; this is a single-page dashboard.
- Keep visual styling in `src/App.css` unless a new component needs specialized styles.
- Preserve unmounted chart modules unless a task explicitly changes the interchangeable-visualization experiment.

## When modifying the app

- Confirm component imports are relative and consistent with the existing structure.
- Ensure D3 charts render only after dimensions are measured.
- Preserve the dashboard grid layout used in `App.jsx`.
- Keep data-driven behavior localized to the chart component that consumes it.
- Give active charts concise accessible names and descriptions, label their controls, preserve visible keyboard focus, and respect reduced-motion preferences.
- Prefer small structured value alternatives for charts whose exact values otherwise depend heavily on pointer hover.
- Describe the bundled dataset as supplied through the D3 Loves React course with attribution to Our World in Data. Do not infer who created the original subset or an unrecorded upstream snapshot, retrieval date, or extraction process.

## Notes for agents

- There is no test suite in this repo.
- This is a learning artifact that deliberately extended beyond the original course assignment, not a production analytics system or general-purpose visualization framework.
- The active composition and retained alternate modules are documented in the README; rely on source files for exact behavior and architecture.
- Do not add new frameworks or major architectural changes unless the user requests them explicitly.
