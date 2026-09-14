// Progress is capped at 100% for the bar's width and the percent label --
// display only. The caller's underlying numbers (percent, remaining) are
// never clamped, so an over-funded goal still reports its true amount
// elsewhere on the page; this component only controls how it *looks*.
export function GoalProgressBar({ percent }: { percent: number }) {
  const displayPercent = Math.max(0, Math.min(percent, 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${percent >= 100 ? "bg-green-600" : "bg-gray-900"}`}
        style={{ width: `${displayPercent}%` }}
      />
    </div>
  );
}
