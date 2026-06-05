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

/**
 * Region definitions — Gapminder-style groupings.
 * Each region gets one Okabe-Ito color. Countries are colored by region.
 */
export const REGIONS = {
  Africa: { color: "#E69F00", countries: ["Egypt", "Nigeria", "South Africa"] },
  Americas: {
    color: "#009E73",
    countries: ["Argentina", "Brazil", "Canada", "Mexico", "United States"],
  },
  Asia: {
    color: "#D55E00",
    countries: [
      "China",
      "India",
      "Indonesia",
      "Japan",
      "Malaysia",
      "South Korea",
      "Thailand",
      "Vietnam",
    ],
  },
  Europe: {
    color: "#0072B2",
    countries: [
      "France",
      "Germany",
      "Italy",
      "Poland",
      "Russia",
      "Spain",
      "United Kingdom",
    ],
  },
  "Middle East & Oceania": {
    color: "#CC79A7",
    countries: [
      "Australia",
      "Iran",
      "Saudi Arabia",
      "Turkey",
      "United Arab Emirates",
    ],
  },
};

/**
 * Lookup helpers for region data.
 */
export function getRegionForCountry(country) {
  for (const [region, info] of Object.entries(REGIONS)) {
    if (info.countries.includes(country)) return region;
  }
  return null;
}

export function getColorForCountry(country) {
  for (const info of Object.values(REGIONS)) {
    if (info.countries.includes(country)) return info.color;
  }
  return "#999999";
}

export const REGION_NAMES = Object.keys(REGIONS);

export const REGION_COLORS = Object.fromEntries(
  Object.entries(REGIONS).map(([name, info]) => [name, info.color]),
);
