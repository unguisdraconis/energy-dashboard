// Import necessary modules from React and ReactDOM libraries */
import React from "react";
import ReactDOM from "react-dom/client";

// Import the main App component to be rendered in the browser */
import App from "./App";

/* Creates a root container for rendering the React application */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
