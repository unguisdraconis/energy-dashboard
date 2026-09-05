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
          The Global Energy Dashboard offers a playground for exploring global
          energy trends through six interactive charts. The Stacked Area Chart
          visualizes a country's shifting energy mix over time, revealing a rise
          in the percentage of renewables, but also a continued reliance on
          fossil fuels. The Multi-Line Chart compares total primary energy
          consumption across countries, while the Normalized Stacked Bar Chart
          snapshots energy structure for selected years. The Bubble Chart maps
          energy consumption, renewables share, and fossil dependency. The
          Voronoi Treemap shows country-level energy totals using year-slider
          interaction, with color indicating each country's primary energy
          source, and the Radar Chart allows us to visualize the imbalanced
          energy profiles of different countries.
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
        {/* Footer content including data source and social links */}
        <p className="data-source">
          Source:{" "}
          <a href="https://github.com/owid/energy-data">
            Our World in Data--Energy Dataset (CC BY 4.0)
          </a>{" "}
          · Energy consumption by source (TWh) · Scaffolding by Claude Opus 4.6
          · Visualization by Jeremiah King as part of D3 Loves React course
          taught by Yan Holtz
        </p>
        {/* Social media link for Github */}
        <a
          className="social-button"
          href="https://github.com/unguisdraconis"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub page"
          title="GitHub"
        >
          🐙
        </a>

        {/* Social media link for LinkedIn */}
        <a
          className="social-button"
          href="https://www.linkedin.com/in/jeremiahjking"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn profile"
          title="LinkedIn"
        >
          🔗
        </a>
      </motion.footer>
    </>
  );
}

// Export the App component as default for use in other parts of the application.
export default App;
