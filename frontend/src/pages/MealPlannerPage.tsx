import { useEffect, useMemo, useState } from "react";
import {
  ArrowsClockwise,
  CaretLeft,
  CaretRight,
  Drop,
  Fire,
  ForkKnife,
  Leaf,
  Lightning,
  Pulse,
  ShoppingCart,
  Sparkle,
  Sun,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  DailyMealPlan,
  GroceryList,
  MealKey,
  MealSlot,
  WeeklyMealPlan,
} from "../types";
import { mealPlanApi } from "../api/mealPlan";
import { apiErrorMessage } from "../api/http";
import { Skeleton } from "../components/ui/Skeleton";
import { MacroDonut } from "../components/charts/MacroDonut";
import { foodImageSrc, onFoodImgError } from "../lib/foodImage";
import { prettyDate, todayISO } from "../lib/format";

const MEAL_LABEL: Record<MealKey, string> = {
  breakfast: "Breakfast",
  lunch:     "Lunch",
  dinner:    "Dinner",
  snack:     "Snack",
};

const MEAL_ORDER: MealKey[] = ["breakfast", "lunch", "dinner", "snack"];

export function MealPlannerPage() {
  const [week, setWeek] = useState<WeeklyMealPlan | null>(null);
  const [grocery, setGrocery] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [activeDate, setActiveDate] = useState<string>(todayISO());

  async function loadWeek(start: string) {
    setLoading(true);
    setError(null);
    try {
      const [w, g] = await Promise.all([
        mealPlanApi.week(start, 7),
        mealPlanApi.grocery(start, 7),
      ]);
      setWeek(w);
      setGrocery(g);
      if (w.days.length > 0 && !w.days.find((d) => d.date === activeDate)) {
        setActiveDate(w.days[0].date);
      }
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadWeek(startDate); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [startDate]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const w = await mealPlanApi.generate({ start_date: startDate, days: 7, overwrite: true });
      setWeek(w);
      const g = await mealPlanApi.grocery(startDate, 7);
      setGrocery(g);
      setActiveDate(w.days[0]?.date ?? startDate);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setGenerating(false);
    }
  }

  const activePlan = useMemo<DailyMealPlan | undefined>(
    () => week?.days.find((d) => d.date === activeDate) ?? week?.days[0],
    [week, activeDate],
  );

  const shift = (delta: number) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + delta);
    setStartDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Meal Planner</h1>
          <p className="mt-1 text-sm text-ink-500">
            ILP-generated weekly meal plan calibrated to your daily targets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-surface px-2 py-1 shadow-card">
            <button onClick={() => shift(-7)} className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100" aria-label="Previous week">
              <CaretLeft size={14} weight="bold" />
            </button>
            <span className="px-2 text-xs font-semibold text-ink-700 num">{prettyDate(startDate)}</span>
            <button onClick={() => shift(7)} className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100" aria-label="Next week">
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
          <button onClick={generate} disabled={generating || loading} className="btn-primary">
            <ArrowsClockwise size={16} weight="bold" />
            {generating ? "Generating…" : "Generate New Plan"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* Day chips */}
      <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 scroll-thin">
        {(loading && !week ? Array.from({ length: 7 }) : week?.days ?? []).map((d, i) => {
          if (loading && !week) return <Skeleton key={i} className="h-14 w-24 shrink-0" />;
          const plan = d as DailyMealPlan;
          const active = plan.date === activeDate;
          return (
            <button
              key={plan.date}
              onClick={() => setActiveDate(plan.date)}
              className={`shrink-0 rounded-xl border px-4 py-2 text-left transition ${
                active
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-surface text-ink-700 hover:bg-ink-50"
              }`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide">
                {new Date(plan.date).toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className="text-sm font-bold num">
                {new Date(plan.date).getDate()}
              </div>
              <div className="text-[10px] num">{Math.round(plan.totals.calories)} kcal</div>
            </button>
          );
        })}
        {!loading && week && week.days.length === 0 && (
          <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-3 text-sm text-ink-500">
            No plan yet — hit <strong>Generate New Plan</strong>.
          </div>
        )}
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        {/* Today's plan */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun size={18} weight="fill" className="text-amber-500" />
              <h2 className="text-base font-semibold text-ink-900">
                {activePlan ? `${prettyDate(activePlan.date)}'s Meal Plan` : "Today's Meal Plan"}
              </h2>
            </div>
            {activePlan && (
              <span className="pill-brand">
                Total {Math.round(activePlan.totals.calories)} / {Math.round(activePlan.targets.target_calories)} kcal
              </span>
            )}
          </div>

          <div className="mt-4 space-y-4">
            {!activePlan && loading && (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            )}
            {activePlan && MEAL_ORDER.map((meal) => {
              const slot = activePlan.meals.find((m) => m.meal === meal);
              if (!slot) return null;
              return <MealSlotCard key={meal} slot={slot} />;
            })}
            {!loading && !activePlan && (
              <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-10 text-center text-sm text-ink-500">
                No plan generated for the selected day yet.
              </div>
            )}
          </div>
        </div>

        {/* Donut + Compliance */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-base font-semibold text-ink-900">Daily Macro Distribution</h2>
            {activePlan ? (
              <MacroDonut
                protein={activePlan.totals.protein}
                carbs={activePlan.totals.carbs}
                fat={activePlan.totals.fat}
              />
            ) : (
              <Skeleton className="mt-4 h-56" />
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-900">Meal Compliance</h2>
              <Sparkle size={14} weight="fill" className="text-brand-600" />
            </div>
            {activePlan ? (
              <div className="mt-4 space-y-3">
                <ComplianceRow Icon={Fire}  label="Calories" actual={activePlan.totals.calories} target={activePlan.targets.target_calories}    color="#22C55E" />
                <ComplianceRow Icon={Pulse} label="Protein"  actual={activePlan.totals.protein}  target={activePlan.targets.target_protein_g} color="#EF4444" />
                <ComplianceRow Icon={Leaf}  label="Carbs"    actual={activePlan.totals.carbs}    target={activePlan.targets.target_carbs_g}   color="#F59E0B" />
                <ComplianceRow Icon={Drop}  label="Fat"      actual={activePlan.totals.fat}      target={activePlan.targets.target_fat_g}     color="#06B6D4" />
              </div>
            ) : (
              <Skeleton className="mt-4 h-40" />
            )}
          </div>
        </div>
      </section>

      <GrocerySection grocery={grocery} loading={loading} />

      <AnimatePresence>
        {generating && <GeneratingOverlay />}
      </AnimatePresence>
    </div>
  );
}

const STEP_LABELS = [
  "Reading your metabolic targets",
  "Splitting daily calories into meal slots",
  "Solving 28 ILP problems for the week",
  "Aggregating the grocery list",
];

function GeneratingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Generating meal plan"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 6 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mx-4 w-full max-w-md rounded-2xl border border-ink-200 bg-surface p-7 shadow-lift"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Lightning size={20} weight="fill" />
            <span className="absolute inset-0 animate-ping rounded-xl bg-brand-300/50" />
          </span>
          <div>
            <h3 className="text-base font-bold text-ink-900">Generating your week</h3>
            <p className="text-xs text-ink-500">CBC solver is balancing macros across 28 slots</p>
          </div>
        </div>

        <ol className="mt-5 space-y-2">
          {STEP_LABELS.map((label, i) => (
            <li key={label} className="flex items-center gap-2.5 text-sm text-ink-700">
              <motion.span
                className="inline-block h-2 w-2 shrink-0 rounded-full bg-brand-500"
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
              />
              {label}
            </li>
          ))}
        </ol>

        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <motion.div
            className="h-full rounded-full bg-brand-500"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "40%" }}
          />
        </div>

        <p className="mt-4 text-[11px] text-ink-500">
          This usually takes 3–5 seconds. Heavier optimisations may take longer.
        </p>
      </motion.div>
    </motion.div>
  );
}

function MealSlotCard({ slot }: { slot: MealSlot }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-ink-200 bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <ForkKnife size={16} weight="fill" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-900">{MEAL_LABEL[slot.meal]}</h3>
            <p className="text-[11px] text-ink-500 num">
              Target {Math.round(slot.target_calories)} kcal · {(slot.share * 100).toFixed(0)}% of day
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-ink-900 num">{Math.round(slot.totals.calories)} kcal</div>
          <div className="text-[11px] text-ink-500 num">
            P {slot.totals.protein.toFixed(0)} · C {slot.totals.carbs.toFixed(0)} · F {slot.totals.fat.toFixed(0)}
          </div>
        </div>
      </div>

      {slot.items.length === 0 ? (
        <p className="mt-3 text-xs text-ink-500">
          Solver could not find a viable combination for this slot.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {slot.items.map((it) => (
            <li key={it.food.id} className="flex items-center gap-3 rounded-lg border border-ink-200 px-2.5 py-2">
              <img
                src={foodImageSrc(it.food)}
                alt=""
                onError={onFoodImgError}
                referrerPolicy="no-referrer"
                className="h-10 w-10 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink-900">
                  {Math.round(it.grams)}g {it.food.name}
                </div>
                <div className="text-[11px] text-ink-500 num">
                  {Math.round(it.added_calories)} kcal · {it.added_protein.toFixed(0)}g protein
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

function ComplianceRow({
  Icon, label, actual, target, color,
}: {
  Icon: typeof Fire;
  label: string; actual: number; target: number; color: string;
}) {
  const pct = target > 0 ? Math.min(120, (actual / target) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-ink-700">
          <Icon size={13} weight="fill" />
          {label}
        </span>
        <span className="font-semibold text-ink-700 num">
          {Math.round(actual)} / {Math.round(target)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
      <div className="mt-1 text-right text-[10px] text-ink-500 num">{pct.toFixed(0)}%</div>
    </div>
  );
}

function GrocerySection({ grocery, loading }: { grocery: GroceryList | null; loading: boolean }) {
  return (
    <section className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} weight="fill" className="text-brand-600" />
          <h2 className="text-base font-semibold text-ink-900">Weekly Grocery Summary</h2>
        </div>
        {grocery && (
          <span className="text-xs text-ink-500">
            {grocery.days_covered} day{grocery.days_covered === 1 ? "" : "s"} · {grocery.entries.length} items
          </span>
        )}
      </div>

      {loading && !grocery && <Skeleton className="mt-4 h-32" />}
      {grocery && grocery.entries.length === 0 && (
        <p className="mt-4 text-sm text-ink-500">
          Generate a meal plan to populate your grocery list.
        </p>
      )}

      {grocery && grocery.entries.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {grocery.entries.map((e) => (
            <div key={e.food.id} className="flex items-center gap-3 rounded-xl border border-ink-200 px-3 py-2.5">
              <img
                src={foodImageSrc(e.food)}
                alt=""
                onError={onFoodImgError}
                referrerPolicy="no-referrer"
                className="h-12 w-12 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink-900">{e.food.name}</div>
                <div className="text-[11px] text-ink-500">{e.food.category}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-ink-900 num">{formatGrocery(e.total_grams, e.pieces)}</div>
                <div className="text-[10px] text-ink-500">× {e.appearances} meals</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatGrocery(grams: number, pieces: number | null): string {
  if (pieces !== null && pieces >= 1) {
    return `${pieces.toFixed(pieces % 1 === 0 ? 0 : 1)} pcs`;
  }
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
  return `${Math.round(grams)} g`;
}
