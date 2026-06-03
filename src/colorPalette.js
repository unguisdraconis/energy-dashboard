/**
 * Okabe-Ito accessible color palette for energy sources.
 * Black (#000000) is replaced with #555555 for visibility on dark backgrounds.
 */

export const ENERGY_SOURCES = [
  'coal',
  'oil',
  'gas',
  'nuclear',
  'hydro',
  'solar',
  'wind',
  'biofuel',
  'other_renewable',
];

export const ENERGY_COLORS = {
  coal: '#555555',
  oil: '#E69F00',
  gas: '#56B4E9',
  nuclear: '#009E73',
  hydro: '#0072B2',
  solar: '#F0E442',
  wind: '#CC79A7',
  biofuel: '#D55E00',
  other_renewable: '#999999',
};

export const ENERGY_LABELS = {
  coal: 'Coal',
  oil: 'Oil',
  gas: 'Gas',
  nuclear: 'Nuclear',
  hydro: 'Hydro',
  solar: 'Solar',
  wind: 'Wind',
  biofuel: 'Biofuel',
  other_renewable: 'Other Renew.',
};

/**
 * Country palette for multi-line charts.
 * Uses Okabe-Ito colors (with darker adjustments for dark backgrounds).
 */
export const COUNTRY_PALETTE = [
  '#E69F00',
  '#56B4E9',
  '#009E73',
  '#0072B2',
  '#D55E00',
  '#CC79A7',
  '#F0E442',
  '#888888',
  '#66CCEE',
];
