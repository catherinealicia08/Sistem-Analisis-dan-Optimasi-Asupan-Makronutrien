import { CaretLeft, CaretRight, DownloadSimple, WarningCircle } from "@phosphor-icons/react";
import type { Analysis } from "../types";
import { MacroDonut } from "../components/charts/MacroDonut";
import { NutrientRadar } from "../components/charts/NutrientRadar";
import { Skeleton } from "../components/ui/Skeleton";
import { prettyDate } from "../lib/format";

interface Props {
  analysis: Analysis | null;
  date: string;
  onChangeDate: (iso: string) => void;
}

export function AnalyticsPage({ analysis, date, onChangeDate }: Props) {
  const shift = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    onChangeDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Nutrition Analysis</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-surface px-2 py-1 text-sm shadow-card">
            <button onClick={() => shift(-7)} className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100" aria-label="Previous week">
              <CaretLeft size={14} weight="bold" />
            </button>
            <span className="px-2 text-xs font-semibold text-ink-700">{prettyDate(date)}</span>
            <button onClick={() => shift(7)} className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100" aria-label="Next week">
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
          <button className="btn-primary">
            <DownloadSimple size={16} weight="bold" />
            Export Report
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-base font-semibold text-ink-900">Macronutrient Distribution</h2>
          <p className="mt-1 text-xs text-ink-500">% of total kcal</p>
          {analysis ? (
            <div className="mt-2">
              <MacroDonut
                protein={analysis.intake.protein}
                carbs={analysis.intake.carbs}
                fat={analysis.intake.fat}
              />
            </div>
          ) : (
            <Skeleton className="mt-4 h-56" />
          )}
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-ink-900">Nutrient Balance <span className="text-ink-500">(vs Target)</span></h2>
          {analysis ? (
            <div className="mt-2">
              <NutrientRadar
                actual={analysis.intake}
                target={{
                  calories: analysis.targets.target_calories,
                  protein:  analysis.targets.target_protein_g,
                  carbs:    analysis.targets.target_carbs_g,
                  fat:      analysis.targets.target_fat_g,
                }}
              />
            </div>
          ) : (
            <Skeleton className="mt-4 h-56" />
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Macro Balance Score"
          value={analysis ? `${Math.round(analysis.quality.macro_balance_score)}` : "—"}
          suffix={analysis ? "/ 100" : ""}
          sub={analysis ? scoreVerdict(analysis.quality.macro_balance_score) : ""}
          tone={analysis && analysis.quality.macro_balance_score >= 70 ? "good" : "warn"}
        />
        <MetricTile
          label="Protein Density"
          value={analysis ? analysis.quality.protein_density.toFixed(1) : "—"}
          suffix="g / kcal × 100"
          sub="Optimal"
          tone="good"
        />
        <MetricTile
          label="Energy Density"
          value={analysis ? analysis.quality.energy_density.toFixed(1) : "—"}
          suffix="kcal / g"
          sub="Optimal"
          tone="good"
        />
        <DeficiencyTile analysis={analysis} />
      </section>
    </div>
  );
}

function scoreVerdict(score: number): string {
  if (score >= 85) return "Excellent Balance";
  if (score >= 70) return "Good Balance";
  if (score >= 50) return "Needs Tuning";
  return "Imbalanced";
}

function MetricTile({
  label, value, suffix, sub, tone,
}: { label: string; value: string; suffix?: string; sub?: string; tone: "good" | "warn" | "danger" }) {
  const toneClass =
    tone === "good"   ? "text-brand-700" :
    tone === "warn"   ? "text-amber-600" :
                        "text-red-600";
  return (
    <div className="card-tight">
      <div className="label-xs">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-2xl font-bold num ${toneClass}`}>{value}</span>
        {suffix && <span className="text-xs font-medium text-ink-500">{suffix}</span>}
      </div>
      {sub && (
        <div className={`mt-1.5 text-xs font-semibold ${toneClass}`}>{sub}</div>
      )}
    </div>
  );
}

function DeficiencyTile({ analysis }: { analysis: Analysis | null }) {
  const def = analysis?.insights.find((i) => i.severity === "high")
            ?? analysis?.insights[0];

  if (!def) {
    return (
      <div className="card-tight">
        <div className="label-xs">Deficiency Detection</div>
        <div className="mt-3 text-sm font-semibold text-brand-700">All macros on target</div>
        <p className="mt-1 text-xs text-ink-500">No deficiency detected.</p>
      </div>
    );
  }

  return (
    <div className="card-tight border-red-200 bg-red-50/50">
      <div className="label-xs flex items-center gap-1.5 text-red-700">
        <WarningCircle size={12} weight="fill" />
        Deficiency Detection
      </div>
      <div className="mt-2 text-sm font-semibold text-red-700">
        {def.nutrient} intake is{" "}
        <span className="num">{Math.abs(def.delta).toFixed(0)}{def.nutrient.toLowerCase().includes("kalori") ? "kcal" : "g"}</span>{" "}
        below target.
      </div>
      <p className="mt-1 text-xs text-red-600/90">Increase {def.nutrient.toLowerCase()} sources to meet your goal.</p>
    </div>
  );
}
