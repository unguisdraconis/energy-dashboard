# Agent Instructions for energy-dashboard

## Project overview

- Small React dashboard built with Vite.
- Visualizes global energy data using D3 and custom reusable chart components.
- No backend or API integration; all data lives in `src/data.js`.

## Important files

- `package.json` — project metadata and scripts.
- `vite.config.js` — Vite configuration for React.
- `src/App.jsx` — app layout and dashboard composition.
- `src/data.js` — data source for charts.
- `src/components/` — chart components that render D3 visualizations.
- `src/hooks/useDimensions/` — hook used by `ResponsiveChartWrapper` for responsive SVG sizing.
- `src/App.css` — global dashboard styles.

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

## When modifying the app

- Confirm component imports are relative and consistent with the existing structure.
- Ensure D3 charts render only after dimensions are measured.
- Preserve the dashboard grid layout used in `App.jsx`.
- Keep data-driven behavior localized to the chart component that consumes it.

## Notes for agents

- There is no test suite in this repo.
- The README is minimal; rely on source files for behavior and architecture.
- Do not add new frameworks or major architectural changes unless the user requests them explicitly.
