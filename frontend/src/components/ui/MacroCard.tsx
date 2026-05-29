import type { ReactNode } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { clamp } from "../../lib/format";

interface Props {
  label: string;
  Icon: PhosphorIcon;
  current: number;
  target: number;
  unit: string;
  color: string;       // hex – progress bar fill
  iconBg: string;      // tailwind class, e.g. "bg-brand-100 text-brand-700"
  precision?: number;
  trailing?: ReactNode;
}

export function MacroCard({
  label,
  Icon,
  current,
  target,
  unit,
  color,
  iconBg,
  precision = 0,
  trailing,
}: Props) {
  const pct = target > 0 ? clamp((current / target) * 100, 0, 100) : 0;
  return (
    <div className="card-tight">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon size={18} weight="fill" />
          </div>
          <span className="text-sm font-semibold text-ink-900">{label}</span>
        </div>
        <span className="text-xs font-semibold text-ink-500 num">{Math.round(pct)}%</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-ink-900 num">
          {current.toFixed(precision)}
        </span>
        <span className="text-sm text-ink-500 num">
          / {target.toFixed(precision)} {unit}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color, transition: "width 600ms ease" }}
        />
      </div>
      {trailing}
    </div>
  );
}
