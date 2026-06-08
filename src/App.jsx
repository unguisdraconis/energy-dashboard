import "./App.css";
import { StackedAreaChart } from "./components/StackedAreaChart";
import { CountryComparisonChart } from "./components/CountryComparisonChart";
import { NormalizedBarChart } from "./components/NormalizedBarChart";
import { BubbleChart } from "./components/BubbleChart";
import { RadarChart } from "./components/RadarChart";
import { TreemapChart } from "./components/TreemapChart";

function App() {
  return (
    <>
      <header className="dashboard-header">
        <h1>🌍 Global Energy Dashboard</h1>
        <p className="subtitle">
          How the world's energy mix has evolved over 60 years (1965–2024)
        </p>
        <p className="description">
          The Global Energy Dashboard offers a playground to explore global
          energy trends through six interactive charts. The Stacked Area Chart
          visualizes a country's shifting energy mix over time, revealing a rise
          in the percentage of renewables, but also a continued reliance on
          fossil fuels. The Multi-Line Chart compares total primary energy
          consumption across countries, while the Normalized Stacked Bar Chart
          snapshots energy structure for selected years. The Bubble Chart maps
          energy consumption, renewables share, and fossil dependency, and the
          Donut Chart clearly shows that in 2024, while the world is still
          powered by fossil fuels, renewables are playing an increasingly
          important role. The Voronoi Treemap shows country-level energy totals
          using year-slider interaction, with color indicating each country's
          primary energy source.
        </p>
        <p className="data-source">
          Source: Our World in Data · Energy consumption by source (TWh) ·
          Scaffolding by Claude Opus 4.6 · Visualization by Jeremiah King as
          part of D3 Loves React course taught by Yan Holtz
        </p>
      </header>
      <main className="dashboard-grid">
        <StackedAreaChart />
        <CountryComparisonChart />
        <NormalizedBarChart />
        <BubbleChart />
        <RadarChart />
        <TreemapChart />
      </main>
    </>
  );
}

export default App;
