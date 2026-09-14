// Shared palette for the dashboard's inline-SVG charts. Values are the
// validated categorical/chrome steps from the dataviz skill's reference
// palette (see docs/BUILD-PROCESS.md T4.2): blue/orange is categorical
// slots 1-2, which pass the CVD and normal-vision separation checks
// (`node scripts/validate_palette.js "#2a78d6,#eb6834" --mode light`).
// This app has no dark mode (src/app/layout.tsx renders one fixed light
// theme), so charts only ever need the light-surface steps.
export const CHART_COLORS = {
  moneyIn: "#2a78d6", // categorical slot 1 (blue)
  moneyOut: "#eb6834", // categorical slot 2 (orange)
  single: "#2a78d6", // single-series bars/lines (category spend, balance line)
  areaFill: "#2a78d6",
  gridline: "#e1e0d9", // hairline
  axis: "#c3c2b7", // baseline/axis
  textPrimary: "#0b0b0b",
  textSecondary: "#52514e",
  textMuted: "#898781", // axis/labels
} as const;
