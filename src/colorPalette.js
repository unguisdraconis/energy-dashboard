/**
 * Okabe-Ito accessible color palette for energy sources.
 * Coal uses a dark grey that's visible on both light and dark backgrounds.
 */

export const ENERGY_SOURCES = [
  "coal",
  "oil",
  "gas",
  "nuclear",
  "hydro",
  "solar",
  "wind",
  "biofuel",
  "other_renewable",
];

export const ENERGY_COLORS = {
  coal: "#4a4a4a",
  oil: "#E69F00",
  gas: "#56B4E9",
  nuclear: "#009E73",
  hydro: "#0072B2",
  solar: "#F0E442",
  wind: "#CC79A7",
  biofuel: "#D55E00",
  other_renewable: "#999999",
};

export const ENERGY_LABELS = {
  coal: "Coal",
  oil: "Oil",
  gas: "Gas",
  nuclear: "Nuclear",
  hydro: "Hydro",
  solar: "Solar",
  wind: "Wind",
  biofuel: "Biofuel",
  other_renewable: "Other Renew.",
};

/**
 * Country palette for multi-line charts.
 * High-contrast subset that works on both light and dark backgrounds.
 */
export const COUNTRY_PALETTE = [
  "#E69F00",
  "#56B4E9",
  "#009E73",
  "#0072B2",
  "#D55E00",
  "#CC79A7",
  "#8B6C5C",
  "#6A5ACD",
  "#2CA02C",
];
