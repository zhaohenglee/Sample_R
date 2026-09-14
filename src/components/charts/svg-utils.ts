// Path builders for the fixed bar mark spec used across the dashboard
// charts: a 4px rounded "data end" with the baseline-adjacent corners left
// square, rather than a plain <rect> rounded on all four corners.

// A vertical (column) bar growing up from a baseline at `top + height`.
// Rounded top corners, square bottom.
export function verticalBarPath(x: number, top: number, width: number, height: number, radius = 4): string {
  const w = Math.max(width, 0);
  const h = Math.max(height, 0);
  if (w <= 0 || h <= 0) return "";
  const r = Math.min(radius, h, w / 2);
  return [
    `M ${x} ${top + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${top}`,
    `L ${x + w - r} ${top}`,
    `A ${r} ${r} 0 0 1 ${x + w} ${top + r}`,
    `L ${x + w} ${top + h}`,
    `L ${x} ${top + h}`,
    "Z",
  ].join(" ");
}

// A horizontal bar growing right from a baseline at `x`. Rounded right
// corners, square left (baseline) edge.
export function horizontalBarPath(x: number, top: number, width: number, height: number, radius = 4): string {
  const w = Math.max(width, 0);
  const h = Math.max(height, 0);
  if (w <= 0 || h <= 0) return "";
  const r = Math.min(radius, h / 2, w);
  return [
    `M ${x} ${top}`,
    `L ${x + w - r} ${top}`,
    `A ${r} ${r} 0 0 1 ${x + w} ${top + r}`,
    `L ${x + w} ${top + h - r}`,
    `A ${r} ${r} 0 0 1 ${x + w - r} ${top + h}`,
    `L ${x} ${top + h}`,
    "Z",
  ].join(" ");
}
