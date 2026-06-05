import "./App.css";
import { StackedAreaChart } from "./components/StackedAreaChart";
import { CountryComparisonChart } from "./components/CountryComparisonChart";
import { NormalizedBarChart } from "./components/NormalizedBarChart";
import { BubbleChart } from "./components/BubbleChart";

function App() {
  return (
    <>
      <header className="dashboard-header">
        <h1>🌍 Global Energy Dashboard</h1>
        <p className="subtitle">
          How the world's energy mix has evolved over 60 years (1965–2024)
        </p>
        <p className="description">
          The Global Energy Dashboard offers an exploration of global energy
          trends through four interactive charts. The Stacked Area Chart
          visualizes a country's shifting energy mix over time, emphasizing the
          decline in coal and rise in renewables. Meanwhile, the Multi-Line
          Chart compares total primary energy consumption across countries,
          highlighting distinct patterns such as China’s growth (production)
          versus Europe’s stagnation. A Normalized Stacked Bar Chart provides
          snapshots of each country's energy structure for selected years,
          underscoring differences like France’s nuclear focus or Brazil’s hydro
          reliance. The Bubble Chart maps data in three dimensions—energy
          consumption on the X-axis, renewables share on the Y-axis, and fossil
          fuel dependency by bubble size—with color-coded regions and a year
          slider to illustrate transitions over time. This Gapminder-style
          visualization reveals relationships between energy usage and
          sustainability.
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
      </main>
    </>
  );
}

export default App;
