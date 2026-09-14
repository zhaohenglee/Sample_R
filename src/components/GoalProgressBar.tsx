// The bar's width is capped at 100%; the percentage text rendered beside it
// by the caller is not. See progressBarWidth in src/lib/goals.ts for why,
// and for the clamp itself, which lives there so it can be tested.
import { progressBarWidth } from "@/lib/goals";

export function GoalProgressBar({ percent }: { percent: number }) {
  const displayPercent = progressBarWidth(percent);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${percent >= 100 ? "bg-green-600" : "bg-gray-900"}`}
        style={{ width: `${displayPercent}%` }}
      />
    </div>
  );
}
