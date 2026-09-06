// Import CSS for styling and Motion components for animations.
import "./App.css";
import { motion, useReducedMotion } from "motion/react";
// Import individual chart components to be used in the application.
import { StackedAreaChart } from "./components/StackedAreaChart";
import { CountryComparisonChart } from "./components/CountryComparisonChart";
import { NormalizedBarChart } from "./components/NormalizedBarChart";
import { BubbleChart } from "./components/BubbleChart";
import { TreemapChart } from "./components/TreemapChart";
import { RadarChart } from "./components/RadarChart";

// Define the main App component that renders the dashboard.
function App() {
  // Check if the user prefers reduced motion to accomodate accessibility settings.
  const prefersReducedMotion = useReducedMotion();
  // Set animation transition based on the user's preference for reduced motion.
  const motionTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: "easeOut" };

  return (
    <>
      {/* Animated header with Motion */}
      <motion.header
        className="dashboard-header"
        initial={{ y: 18 }}
        animate={{ y: 0 }}
        transition={motionTransition}
      >
        {/* Header content including title and description */}
        <h1>🌍 Global Energy Dashboard</h1>
        <p className="subtitle">
          How the world's energy mix has evolved over 60 years (1965–2024)
        </p>
        <p className="description">
          This D3 Loves React learning project explores historical energy data
          through six interactive charts. The stacked area, multi-line, and
          normalized bar views compare energy use over time and across selected
          entities. The bubble chart compares total primary energy with the
          combined share from solar, wind, biofuel, and other renewable sources;
          hydro is not included in that calculated share. The Voronoi view shows
          entities as cells colored by their dominant energy source, while the
          radar chart compares the source profile of a selected entity and year.
        </p>
      </motion.header>

      {/* Main content area displaying all charts */}
      <main className="dashboard-grid">
        <StackedAreaChart />
        <CountryComparisonChart />
        <NormalizedBarChart />
        <BubbleChart />
        <TreemapChart />
        <RadarChart />
      </main>

      {/* Animated footer with Motion */}
      <motion.footer
        className="dashboard-footer"
        initial={{ y: 12 }}
        animate={{ y: 0 }}
        transition={motionTransition}
      >
        {/* Footer data source and credits */}
        <p className="data-source">
          Data supplied through the D3 Loves React course; attributed source:{" "}
          <a href="https://github.com/owid/energy-data">
            Our World in Data energy-data
          </a>{" "}
          · Consult OWID's documentation for field-level provenance and terms ·
          Scaffolding by Claude Opus 4.6 · Visualization by Jeremiah King as
          part of D3 Loves React, taught by Yan Holtz
        </p>
      </motion.footer>
    </>
  );
}

// Export the App component as default for use in other parts of the application.
export default App;
