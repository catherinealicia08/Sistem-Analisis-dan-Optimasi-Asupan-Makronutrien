import { Barbell, Heartbeat, Scales } from "@phosphor-icons/react";
import type { Goal } from "../../types";

const META: Record<Goal, { label: string; Icon: typeof Barbell }> = {
  weight_loss:  { label: "Weight Loss", Icon: Scales },
  maintenance:  { label: "Maintenance", Icon: Heartbeat },
  muscle_gain:  { label: "Muscle Gain", Icon: Barbell },
};

export function GoalBadge({ goal }: { goal: Goal }) {
  const { label, Icon } = META[goal];
  return (
    <div className="inline-flex items-center gap-2.5 rounded-xl border border-ink-200 bg-surface px-3.5 py-2 shadow-card">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Icon size={18} weight="fill" />
      </div>
      <div className="text-left">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Goal</div>
        <div className="text-sm font-semibold text-ink-900">{label}</div>
      </div>
    </div>
  );
}
