import { money } from "@/lib/format";
import { CHART_COLORS } from "./palette";

export type BalanceLineDatum = { date: string; net: number };

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function shortDate(iso: string): string {
  const [, monthStr, dayStr] = iso.split("-");
  return `${SHORT_MONTHS[Number(monthStr) - 1] ?? monthStr} ${Number(dayStr)}`;
}

// Net balance trend: a single-series line with a light area fill under it.
// A single series needs no legend (the chart heading names it). Callouts
// mark the first/last date and the min/max value; when one point plays more
// than one role (e.g. the last point is also the max) its callouts stack.
export function BalanceLine({ data }: { data: BalanceLineDatum[] }) {
  const W = 800;
  const H = 260;
  const marginTop = 32;
  const marginBottom = 34;
  const marginX = 16;
  const chartW = W - marginX * 2;
  const chartH = H - marginTop - marginBottom;
  const baselineY = marginTop + chartH;

  const summary =
    data.length === 0
      ? "Net balance trend: no snapshots yet."
      : `Net balance trend from ${shortDate(data[0].date)} to ${shortDate(data[data.length - 1].date)}, ` +
        `ranging from ${money(Math.min(...data.map((d) => d.net)))} to ${money(Math.max(...data.map((d) => d.net)))}, ` +
        `currently ${money(data[data.length - 1].net)}.`;

  if (data.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={summary}>
        <title>{summary}</title>
        <line x1={marginX} y1={baselineY} x2={W - marginX} y2={baselineY} stroke={CHART_COLORS.axis} strokeWidth={1} />
      </svg>
    );
  }

  const values = data.map((d) => d.net);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const range = Math.max(1, rawMax - rawMin);
  const padded = { min: rawMin - range * 0.12, max: rawMax + range * 0.12 };
  const paddedRange = padded.max - padded.min;

  const n = data.length;
  const xFor = (i: number) => (n === 1 ? marginX + chartW / 2 : marginX + (i / (n - 1)) * chartW);
  const yFor = (v: number) => marginTop + chartH - ((v - padded.min) / paddedRange) * chartH;

  const points = data.map((d, i) => ({ x: xFor(i), y: yFor(d.net) }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[n - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

  const minIdx = values.indexOf(rawMin);
  const maxIdx = values.indexOf(rawMax);

  const roleLabels = new Map<number, string[]>();
  const addRole = (idx: number, label: string) => {
    const arr = roleLabels.get(idx) ?? [];
    arr.push(label);
    roleLabels.set(idx, arr);
  };
  addRole(0, `First: ${shortDate(data[0].date)}`);
  addRole(n - 1, `Last: ${shortDate(data[n - 1].date)}`);
  addRole(minIdx, `Min: ${money(rawMin)}`);
  addRole(maxIdx, `Max: ${money(rawMax)}`);

  // 0 crossing, drawn as a light reference gridline when it falls inside
  // the padded range (net worth trends commonly cross zero).
  const showZeroLine = padded.min < 0 && padded.max > 0;
  const zeroY = yFor(0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={summary}>
      <title>{summary}</title>

      {showZeroLine && (
        <line x1={marginX} y1={zeroY} x2={W - marginX} y2={zeroY} stroke={CHART_COLORS.gridline} strokeWidth={1} />
      )}
      <line x1={marginX} y1={baselineY} x2={W - marginX} y2={baselineY} stroke={CHART_COLORS.axis} strokeWidth={1} />

      <path d={areaPath} fill={CHART_COLORS.areaFill} fillOpacity={0.1} stroke="none" />
      <path d={linePath} fill="none" stroke={CHART_COLORS.single} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {[...roleLabels.entries()].map(([idx, labels]) => {
        const p = points[idx];
        const labelAbove = p.y > marginTop + chartH * 0.3;
        return (
          <g key={idx}>
            {/* surface ring: a white ring behind the dot keeps it legible where it meets the line */}
            <circle cx={p.x} cy={p.y} r={6} fill="#fff" />
            <circle cx={p.x} cy={p.y} r={4} fill={CHART_COLORS.single} />
            <text
              x={Math.min(Math.max(p.x, marginX + 40), W - marginX - 40)}
              y={labelAbove ? p.y - 12 - (labels.length - 1) * 12 : p.y + 16}
              fontSize={10}
              textAnchor="middle"
              fill={CHART_COLORS.textSecondary}
            >
              {labels.map((label, i) => (
                <tspan key={label} x={Math.min(Math.max(p.x, marginX + 40), W - marginX - 40)} dy={i === 0 ? 0 : 12}>
                  {label}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
