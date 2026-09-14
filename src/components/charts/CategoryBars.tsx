import { money } from "@/lib/format";
import { CHART_COLORS } from "./palette";
import { horizontalBarPath } from "./svg-utils";

export type CategoryBarsDatum = { categoryId: number | null; name: string; amount: number };

// Horizontal bar list: one category per row, name on the left, bar, amount
// at the bar's end. A single series needs no legend box (the chart's own
// heading names what's plotted); the amount is always placed outside the
// bar's end rather than measured for fit, so it's never clipped.
// `periodLabel` names the period being shown (e.g. "this month" or
// "2026-03") so the summary/title follow whatever month the dashboard has
// selected instead of always saying "this month".
export function CategoryBars({ data, periodLabel }: { data: CategoryBarsDatum[]; periodLabel: string }) {
  const W = 800;
  const rowH = 30;
  const barThickness = 16;
  const labelColW = 170;
  const rightPad = 90;
  const topPad = 8;
  const H = topPad * 2 + Math.max(1, data.length) * rowH;
  const barAreaW = W - labelColW - rightPad;
  const maxAmount = Math.max(1, ...data.map((d) => d.amount));

  const summary =
    data.length === 0
      ? `Spend by category ${periodLabel}: no spending yet.`
      : `Spend by category ${periodLabel}: ${data.map((d) => `${d.name}: ${money(d.amount)}`).join("; ")}.`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={summary}>
      <title>{summary}</title>
      {data.length === 0 && (
        <text x={labelColW} y={topPad + rowH / 2 + 4} fontSize={12} fill={CHART_COLORS.textMuted}>
          No spending yet.
        </text>
      )}
      {data.map((d, i) => {
        const rowY = topPad + i * rowH;
        const barY = rowY + (rowH - barThickness) / 2;
        const barW = (d.amount / maxAmount) * barAreaW;
        const key = d.categoryId !== null ? `cat-${d.categoryId}` : `idx-${i}`;
        return (
          <g key={key}>
            <text x={0} y={rowY + rowH / 2 + 4} fontSize={12} fill={CHART_COLORS.textPrimary}>
              {d.name}
            </text>
            <path d={horizontalBarPath(labelColW, barY, barW, barThickness)} fill={CHART_COLORS.single}>
              <title>{`${d.name}: ${money(d.amount)}`}</title>
            </path>
            <text x={labelColW + barW + 8} y={rowY + rowH / 2 + 4} fontSize={12} fill={CHART_COLORS.textSecondary}>
              {money(d.amount)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
