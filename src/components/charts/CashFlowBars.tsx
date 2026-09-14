import { money } from "@/lib/format";
import { CHART_COLORS } from "./palette";
import { verticalBarPath } from "./svg-utils";

export type CashFlowBarsDatum = { month: string; moneyIn: number; moneyOut: number };

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Sep" normally; "Sep '25" for January ticks (and the very first tick) so
// a chart spanning a year boundary still reads unambiguously without a
// label on every bar.
function monthLabel(monthIso: string, isFirst: boolean): string {
  const [yearStr, monthStr] = monthIso.slice(0, 7).split("-");
  const monthIdx = Number(monthStr) - 1;
  const short = SHORT_MONTHS[monthIdx] ?? monthStr;
  return monthIdx === 0 || isFirst ? `${short} '${yearStr.slice(-2)}` : short;
}

// Grouped column chart: money in vs money out per month, no client JS.
// Bars carry a native <title> tooltip (the only "hover" a static SVG can
// offer); the y-axis is unlabeled except for a single gridline at the
// chart's max value, which doubles as the scale reference.
export function CashFlowBars({ data }: { data: CashFlowBarsDatum[] }) {
  const W = 800;
  const H = 300;
  const marginTop = 28;
  const marginBottom = 34;
  const marginX = 12;
  const chartW = W - marginX * 2;
  const chartH = H - marginTop - marginBottom;
  const baselineY = marginTop + chartH;

  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.moneyIn, d.moneyOut)));
  const groupW = data.length > 0 ? chartW / data.length : chartW;
  const groupPad = Math.min(10, groupW * 0.18);
  const barGap = 3;
  const barW = Math.max(1, Math.min(24, (groupW - groupPad * 2 - barGap) / 2));

  const summary =
    data.length === 0
      ? "Cash flow by month: no data."
      : `Cash flow by month, ${data.length} months from ${data[0].month.slice(0, 7)} to ${data[data.length - 1].month.slice(0, 7)}. ` +
        data.map((d) => `${d.month.slice(0, 7)}: in ${money(d.moneyIn)}, out ${money(d.moneyOut)}`).join("; ") +
        ".";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={summary}>
      <title>{summary}</title>

      {/* single reference gridline at the chart's max value */}
      <line x1={marginX} y1={marginTop} x2={W - marginX} y2={marginTop} stroke={CHART_COLORS.gridline} strokeWidth={1} />
      <text x={marginX} y={marginTop - 6} fontSize={10} fill={CHART_COLORS.textMuted}>
        up to {money(maxVal)}
      </text>

      {/* baseline */}
      <line x1={marginX} y1={baselineY} x2={W - marginX} y2={baselineY} stroke={CHART_COLORS.axis} strokeWidth={1} />

      {data.map((d, i) => {
        const groupX = marginX + i * groupW;
        const inX = groupX + groupPad;
        const outX = inX + barW + barGap;
        const inH = (d.moneyIn / maxVal) * chartH;
        const outH = (d.moneyOut / maxVal) * chartH;
        return (
          <g key={d.month}>
            <path d={verticalBarPath(inX, baselineY - inH, barW, inH)} fill={CHART_COLORS.moneyIn}>
              <title>{`${d.month.slice(0, 7)} — In: ${money(d.moneyIn)}`}</title>
            </path>
            <path d={verticalBarPath(outX, baselineY - outH, barW, outH)} fill={CHART_COLORS.moneyOut}>
              <title>{`${d.month.slice(0, 7)} — Out: ${money(d.moneyOut)}`}</title>
            </path>
            <text
              x={groupX + groupW / 2}
              y={baselineY + 16}
              fontSize={10}
              textAnchor="middle"
              fill={CHART_COLORS.textMuted}
            >
              {monthLabel(d.month, i === 0)}
            </text>
          </g>
        );
      })}

      {/* legend: two series always get a legend, never color-alone identity */}
      <g transform={`translate(${W - marginX - 130}, 4)`}>
        <rect x={0} y={0} width={10} height={10} rx={2} fill={CHART_COLORS.moneyIn} />
        <text x={16} y={9} fontSize={11} fill={CHART_COLORS.textSecondary}>
          In
        </text>
        <rect x={50} y={0} width={10} height={10} rx={2} fill={CHART_COLORS.moneyOut} />
        <text x={66} y={9} fontSize={11} fill={CHART_COLORS.textSecondary}>
          Out
        </text>
      </g>
    </svg>
  );
}
