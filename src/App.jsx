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
        <p className="data-source">
          Source: Our World in Data · Energy consumption by source (TWh)
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
