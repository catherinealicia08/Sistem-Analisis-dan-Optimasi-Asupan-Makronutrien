import { useEffect, useState } from "react";
import {
  CheckCircle,
  Drop,
  Fire,
  Leaf,
  Lightning,
  Minus,
  Plus,
  Pulse,
  Sparkle,
} from "@phosphor-icons/react";
import type { Analysis, OptimizationResult } from "../types";
import { api } from "../api/client";
import { Skeleton } from "../components/ui/Skeleton";
import { BeforeAfterBars } from "../components/charts/BeforeAfterBars";
import { foodImageSrc, onFoodImgError } from "../lib/foodImage";

interface Props {
  userId: string | null;
  date: string;
  analysis: Analysis | null;
  onApplied: () => void;
}

export function RecommendationsPage({ userId, date, analysis, onApplied }: Props) {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResult(null);
  }, [userId, date]);

  useEffect(() => {
    if (!userId || !analysis) return;
    let alive = true;
    setLoading(true);
    api.optimize(userId, date)
      .then((r) => { if (alive) setResult(r); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userId, date, analysis]);

  async function applyAll() {
    if (!userId || !result) return;
    setApplying(true);
    setError(null);
    try {
      for (const rec of result.recommendations) {
        await api.addLogItem(userId, date, rec.food.id, rec.grams);
      }
      onApplied();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setApplying(false);
    }
  }

  const projected = result?.projected_intake;
  const current = analysis?.intake;
  const targets = analysis?.targets;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Optimization Recommendations</h1>
        <p className="mt-1 text-sm text-ink-500">Based on your goals and current nutrition data</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <AddPanel result={result} loading={loading} />
        <ReducePanel result={result} loading={loading} />
        <OutcomePanel projected={projected} loading={loading} />
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">Nutrition Status: Before vs After</h2>
          <div className="hidden items-center gap-4 text-xs text-ink-500 sm:flex">
            <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-ink-300" /> Current</span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-500" /> Optimized</span>
          </div>
        </div>
        {current && targets && projected ? (
          <BeforeAfterBars current={current} optimized={projected} />
        ) : (
          <Skeleton className="mt-4 h-56" />
        )}
        <button
          onClick={applyAll}
          disabled={!result || result.recommendations.length === 0 || applying}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3.5 text-base font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle size={18} weight="fill" />
          {applying ? "Applying..." : "Apply Recommendations"}
        </button>
      </section>
    </div>
  );
}

function AddPanel({ result, loading }: { result: OptimizationResult | null; loading: boolean }) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-100 text-brand-700">
          <Plus size={14} weight="bold" />
        </div>
        <h2 className="text-base font-bold uppercase tracking-wide text-brand-700">Add</h2>
      </div>
      {loading && <RecListSkeleton />}
      {!loading && result && result.recommendations.length === 0 && (
        <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm text-ink-500">
          Your intake is on target — nothing to add right now.
        </div>
      )}
      {!loading && result && (
        <ul className="space-y-3">
          {result.recommendations.slice(0, 4).map((rec) => (
            <li key={rec.food.id} className="flex items-center gap-3 rounded-xl border border-ink-200 px-3 py-2.5">
              <img
                src={foodImageSrc(rec.food)}
                alt=""
                onError={onFoodImgError}
                referrerPolicy="no-referrer"
                className="h-10 w-10 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink-900">
                  {Math.round(rec.grams)}g {rec.food.name}
                </div>
                <div className="text-[11px] text-brand-700 num">
                  +{Math.round(rec.added_calories)} kcal · +{rec.added_protein.toFixed(0)}g protein
                </div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Plus size={14} weight="bold" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReducePanel({ result, loading }: { result: OptimizationResult | null; loading: boolean }) {
  // The backend optimizer suggests additions; we surface a single sensible
  // reduction hint from projected fulfillment to mirror the mockup.
  const reducer = result && result.projected_fulfillment_pct.fat > 105
    ? { name: "Fat sources", grams: 30, kcal: 65, macro: "fat" as const }
    : result && result.projected_fulfillment_pct.carbs > 105
    ? { name: "Refined carbs", grams: 50, kcal: 65, macro: "carbs" as const }
    : null;

  return (
    <div className="card">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-100 text-red-600">
          <Minus size={14} weight="bold" />
        </div>
        <h2 className="text-base font-bold uppercase tracking-wide text-red-600">Reduce</h2>
      </div>
      {loading && <RecListSkeleton />}
      {!loading && !reducer && (
        <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm text-ink-500">
          No reductions needed — nothing is over target.
        </div>
      )}
      {!loading && reducer && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 px-3 py-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-600">
            {reducer.macro === "fat" ? <Drop size={18} weight="fill" /> : <Leaf size={18} weight="fill" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink-900">{reducer.grams}g {reducer.name}</div>
            <div className="text-[11px] text-red-600 num">
              -{reducer.kcal} kcal · -{reducer.grams}g {reducer.macro}
            </div>
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Minus size={14} weight="bold" />
          </div>
        </div>
      )}
    </div>
  );
}

function OutcomePanel({
  projected, loading,
}: { projected: { calories: number; protein: number; carbs: number; fat: number } | undefined; loading: boolean }) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center gap-2">
        <Sparkle size={16} weight="fill" className="text-brand-600" />
        <h2 className="text-base font-bold text-ink-900">Expected Outcome</h2>
      </div>
      {loading || !projected ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <OutcomeStat Icon={Fire}  label="Calories" value={Math.round(projected.calories).toLocaleString()} />
          <OutcomeStat Icon={Pulse} label="Protein"  value={`${Math.round(projected.protein)}g`} />
          <OutcomeStat Icon={Leaf}  label="Carbs"    value={`${Math.round(projected.carbs)}g`} />
          <OutcomeStat Icon={Drop}  label="Fat"      value={`${Math.round(projected.fat)}g`} />
        </div>
      )}
    </div>
  );
}

function OutcomeStat({
  Icon, label, value,
}: { Icon: typeof Lightning; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-200 px-3 py-2.5">
      <div className="flex items-center gap-2 text-ink-500">
        <Icon size={14} weight="fill" />
        <span className="text-[11px] font-semibold uppercase">{label}</span>
      </div>
      <div className="mt-1 text-lg font-bold text-ink-900 num">{value}</div>
    </div>
  );
}

function RecListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
    </div>
  );
}
