import { Drop, Fire, Leaf, Pulse, Sparkle, UserCircle } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="relative w-full"
    >
      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-lift">
        <div className="grid grid-cols-[44px_1fr] sm:grid-cols-[56px_1fr]">
          {/* Mini sidebar */}
          <div className="flex flex-col items-center gap-3 border-r border-ink-200 bg-ink-50/60 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-white">
              <Sparkle size={12} weight="fill" />
            </div>
            <SideDot tone="active" />
            <SideDot />
            <SideDot />
            <SideDot />
            <SideDot />
            <SideDot />
            <SideDot />
          </div>

          {/* Body */}
          <div className="p-3 sm:p-5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-ink-500">
              <span>Dashboard</span>
            </div>

            <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink-900">Good morning, Alex! <span>👋</span></p>
                <p className="text-[11px] text-ink-500">Here&apos;s your nutrition summary for today.</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700">
                <Sparkle size={10} weight="fill" /> Goal · Muscle Gain
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {/* Donut */}
              <div className="rounded-lg border border-ink-200 p-3">
                <div className="mx-auto h-28 w-28 sm:h-32 sm:w-32">
                  <Donut percent={67} />
                </div>
                <div className="mt-2 text-center">
                  <div className="text-base font-bold text-ink-900">1,892</div>
                  <div className="text-[10px] text-ink-500">of 2,800 kcal</div>
                </div>
              </div>

              {/* Macro mini */}
              <div className="space-y-2">
                <MiniMacro Icon={Pulse} label="Protein" current="123" target="150 g" pct={82} color="#EF4444" bg="bg-red-50 text-red-600" />
                <MiniMacro Icon={Leaf}  label="Carbs"   current="210" target="350 g" pct={60} color="#F59E0B" bg="bg-amber-50 text-amber-600" />
                <MiniMacro Icon={Drop}  label="Fat"     current="65"  target="80 g"  pct={81} color="#06B6D4" bg="bg-cyan-50 text-cyan-600" />
                <MiniMacro Icon={Fire}  label="Calories" current="1,892" target="2,800" pct={67} color="#22C55E" bg="bg-brand-100 text-brand-700" />
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-ink-200 p-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-ink-700">
                <span>Weekly Trend</span>
                <span className="text-ink-500">kcal</span>
              </div>
              <svg viewBox="0 0 240 70" className="mt-1 h-16 w-full">
                <defs>
                  <linearGradient id="lpArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 50 L40 38 L80 44 L120 30 L160 36 L200 22 L240 18 L240 70 L0 70 Z" fill="url(#lpArea)" />
                <path d="M0 50 L40 38 L80 44 L120 30 L160 36 L200 22 L240 18" fill="none" stroke="#22C55E" strokeWidth="2" />
              </svg>
              <div className="mt-1 flex justify-between text-[9px] text-ink-400">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <UserCircle size={14} weight="fill" />
              </div>
              <div className="text-[10px] text-ink-500">Alex Johnson · Premium</div>
            </div>
          </div>
        </div>
      </div>

      {/* floating brand chip */}
      <div className="absolute -left-3 -top-3 hidden items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-card sm:flex">
        <Sparkle size={12} weight="fill" /> Live preview
      </div>
    </motion.div>
  );
}

function SideDot({ tone }: { tone?: "active" }) {
  return (
    <span className={`block h-1.5 w-6 rounded-full ${tone === "active" ? "bg-brand-500" : "bg-ink-200"}`} />
  );
}

function MiniMacro({
  Icon, label, current, target, pct, color, bg,
}: {
  Icon: typeof Fire; label: string; current: string; target: string; pct: number; color: string; bg: string;
}) {
  return (
    <div className="rounded-lg border border-ink-200 p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`flex h-5 w-5 items-center justify-center rounded ${bg}`}>
            <Icon size={11} weight="fill" />
          </span>
          <span className="text-[10px] font-semibold text-ink-900">{label}</span>
        </div>
        <span className="text-[10px] font-semibold text-ink-500 num">{pct}%</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xs font-bold text-ink-900 num">{current}</span>
        <span className="text-[10px] text-ink-500 num">/ {target}</span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function Donut({ percent }: { percent: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - percent / 100);
  return (
    <svg viewBox="0 0 100 100" className="-rotate-90">
      <circle cx="50" cy="50" r={r} stroke="#F3F4F6" strokeWidth="10" fill="none" />
      <circle
        cx="50" cy="50" r={r}
        stroke="#22C55E" strokeWidth="10" fill="none"
        strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
      />
    </svg>
  );
}
