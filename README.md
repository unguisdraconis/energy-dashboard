# Energy Dashboard

Energy Dashboard began as a **D3 Loves React** learning exercise and was deliberately extended beyond the original assignment. It explores historical energy data through a modular collection of interactive React and D3 visualizations. It is a learning artifact, not a production analytics system.

## Live demo

[Explore the Global Energy Dashboard](https://unguisdraconis.github.io/energy-dashboard/)

## Project goals

Jeremiah used the project to experiment with modular visualization architecture: shared responsive layout, controls, legends, tooltips, color tokens, and chart modules that can be recomposed around a bundled dataset. A design goal was to make chart or dataset substitution require only a small number of composition-level changes, while keeping chart-specific transformations and interaction logic within each module.

The experiment was motivated in part by earlier `gapminder` / `gapminder2` work and the question of how visualization approaches could be recreated and adapted more systematically. It also became Jeremiah's first experiment using agents and reusable skills as directed development tools for a more efficient, reproducible, and modular visualization workflow.

## What it demonstrates

The active dashboard mounts six visual forms:

- a stacked area chart for an entity's energy-source history;
- a multi-line comparison of total primary energy across selected countries;
- normalized stacked bars for comparing energy composition in a selected year;
- a bubble plot comparing total energy with the combined share from solar, wind, biofuel, and other renewable sources, grouped by region;
- a Voronoi energy view whose cells are colored by dominant energy source (cell area is not a quantitative encoding); and
- a radar chart for inspecting one entity's energy-source profile.

Shared infrastructure includes `ResponsiveChartWrapper`, HTML tooltips, reusable legends, country controls, centralized color tokens, light/dark theming, and reduced-motion handling. Interactive legends support keyboard activation and coordinate highlighting or sorting with their charts.

## Alternate visualization modules

The repository intentionally retains unmounted `DonutChart`, `HeatmapChart`, and `RenewablesGrowthChart` modules, along with an alternate `BubbleLegend`. They record the experiment in swapping and adapting visualization modules; their presence does not imply that every alternate is equally polished or part of the current dashboard composition.

## Data

The dataset used for this project was supplied as part of the **D3 Loves React** course with attribution to **Our World in Data**.

The bundled course dataset used by the dashboard contains 29 selected entities, including World, covering 1965–2024. Each record contains an entity, year, total primary energy, and measurements for coal, oil, gas, nuclear, hydro, solar, wind, biofuel, and other renewable sources. Values are represented to one decimal place. Null values are retained for some entity/year/source combinations, and individual charts handle those missing values according to their visual comparison.

This repository preserves the course-provided subset used for the visualization. The exact upstream OWID snapshot represented by the course-provided extract is not identified in this repository; the bundled file should not be read as the complete current OWID dataset.

The course materials attributed the data to the [Our World in Data energy-data project](https://github.com/owid/energy-data). OWID documents source and reuse information for its energy data, including underlying data providers; consult OWID's [documentation](https://github.com/owid/energy-data/blob/master/README.md) and [codebook](https://github.com/owid/energy-data/blob/master/owid-energy-codebook.csv) for applicable field-level provenance and terms.

## Learning and AI context

The project began in **D3 Loves React**, taught by **Yan Holtz**, and then expanded beyond the course assignment. Repository and application history credit **Claude Opus 4.6** with scaffolding and **Jeremiah King** with visualization work.

Agents were used as directed implementation and problem-solving tools rather than as an undocumented substitute for authorship. [`SKILL.md`](SKILL.md) records the reusable AI-facing visualization guidance developed during that experiment. The repository does not assign line-by-line provenance or an authorship percentage where the available evidence does not establish one.

## Accessibility and interaction

The active charts provide associated headings and concise descriptions, programmatically named controls, visible keyboard focus, responsive sizing, and reduced-motion behavior. Shared interactive legends support keyboard operation. The Bubble and Voronoi views include expandable HTML tables for exact values that would otherwise depend heavily on pointer hover.

These features are targeted improvements for a learning project, not a claim of formal WCAG conformance. Some exact-value interactions in the other charts remain pointer-oriented.

## Known limitations and future exploration

- The exact upstream OWID version represented by the course-provided dataset is not identified.
- Some chart details remain available primarily through pointer tooltips.
- Some pointer-driven interactions could be refined in future to reduce work during rapid pointer movement; performance tuning is intentionally outside this curation pass.
- Alternate chart modules are retained as learning and architecture evidence, not presented as production-ready features.

## Local use

```sh
npm ci
npm run dev
npm run build
```

The project uses Vite and requires a current Node.js/npm environment capable of installing the versions recorded in `package-lock.json`.

## Licensing

**Data:** The course materials attributed the supplied dataset to Our World in Data. OWID's energy-data documentation and codebook describe field-level underlying provenance and reuse terms.

**Application code:** No separate repository software license is currently specified.
