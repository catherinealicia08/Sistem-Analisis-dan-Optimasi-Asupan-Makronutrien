import { useMemo } from "react";
import {
  Bell,
  Drop,
  Fire,
  Leaf,
  Lightbulb,
  Pulse,
} from "@phosphor-icons/react";
import type { Analysis, MacroIntake, User } from "../types";
import { Donut } from "../components/ui/Donut";
import { MacroCard } from "../components/ui/MacroCard";
import { Skeleton } from "../components/ui/Skeleton";
import { GoalBadge } from "../components/ui/GoalBadge";
import { WeeklyTrend } from "../components/charts/WeeklyTrend";
import { clamp, greetingFor, prettyDate } from "../lib/format";

interface Props {
  user: User | null;
  analysis: Analysis | null;
  weekly: MacroIntake[];
  date: string;
}

export function DashboardPage({ user, analysis, weekly, date }: Props) {
  const firstName = useMemo(
    () => user?.first_name?.trim() || (user?.name ?? "Athlete").split(" ")[0],
    [user],
  );

  const intake = analysis?.intake;
  const targets = analysis?.targets;
  const calPct = targets ? clamp((intake!.calories / targets.target_calories) * 100, 0, 130) : 0;
  const remaining = targets && intake
    ? Math.max(0, targets.target_calories - intake.calories)
    : 0;

  const primaryInsight = useMemo(() => {
    if (!analysis) return null;
    const high = analysis.insights.find((i) => i.severity === "high");
    return high ?? analysis.insights[0] ?? null;
  }, [analysis]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <span className="text-xs text-ink-500">{prettyDate(date)}</span>
            <button className="rounded-md p-2 text-ink-500 hover:bg-ink-100">
              <Bell size={18} />
            </button>
          </div>
          <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-4xl">
            Track your nutrition,
            <br />
            <span className="text-brand-600">optimize your metabolism.</span>
          </h1>
          <p className="mt-3 text-sm text-ink-700">
            {greetingFor()}, {firstName}! <span className="ml-0.5">👋</span>
          </p>
          <p className="text-sm text-ink-500">Here&apos;s your nutrition summary for today.</p>
        </div>
        <div className="flex items-start gap-2">
          {user && <GoalBadge goal={user.goal} />}
          <button className="hidden h-11 w-11 items-center justify-center rounded-xl border border-ink-200 bg-surface text-ink-500 shadow-card hover:bg-ink-50 lg:inline-flex">
            <Bell size={18} />
          </button>
        </div>
      </section>

      {/* Daily Progress + Macros */}
      <section className="grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center min-w-0 lg:col-span-1">
          <div className="flex w-full items-center justify-between">
            <h2 className="text-base font-semibold text-ink-900">Daily Progress</h2>
          </div>
          {targets && intake ? (
            <>
              <div className="mt-4">
                <Donut value={calPct / 100} size={196} stroke={16} color="#22C55E" track="#F3F4F6">
                  <div className="text-3xl font-bold text-ink-900 num">
                    {Math.round(intake.calories).toLocaleString()}
                  </div>
                  <div className="text-xs text-ink-500">kcal</div>
                  <div className="mt-2 text-xs text-ink-500 num">
                    of {Math.round(targets.target_calories).toLocaleString()} kcal
                  </div>
                  <div className="mt-1 text-xs font-semibold text-brand-600 num">
                    {Math.round(calPct)}%
                  </div>
                </Donut>
              </div>
              <div className="mt-4 w-full border-t border-ink-200 pt-3 text-center text-xs text-ink-500 num">
                Remaining: <span className="font-semibold text-ink-900">{Math.round(remaining)} kcal</span>
              </div>
            </>
          ) : (
            <Skeleton className="mt-4 h-48 w-48 rounded-full" />
          )}
        </div>

        {targets && intake ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <MacroCard
              label="Calories"
              Icon={Fire}
              current={intake.calories}
              target={targets.target_calories}
              unit="kcal"
              color="#22C55E"
              iconBg="bg-brand-100 text-brand-700"
            />
            <MacroCard
              label="Protein"
              Icon={Pulse}
              current={intake.protein}
              target={targets.target_protein_g}
              unit="g"
              color="#EF4444"
              iconBg="bg-red-50 text-red-600"
              precision={0}
            />
            <MacroCard
              label="Carbs"
              Icon={Leaf}
              current={intake.carbs}
              target={targets.target_carbs_g}
              unit="g"
              color="#F59E0B"
              iconBg="bg-amber-50 text-amber-600"
            />
            <MacroCard
              label="Fat"
              Icon={Drop}
              current={intake.fat}
              target={targets.target_fat_g}
              unit="g"
              color="#06B6D4"
              iconBg="bg-cyan-50 text-cyan-600"
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        )}
      </section>

      {/* Weekly + Insight */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink-900">Weekly Trend</h2>
              <p className="text-xs text-ink-500">kcal</p>
            </div>
            <span className="pill-brand">Last 7 days</span>
          </div>
          {weekly.length > 0 ? (
            <WeeklyTrend data={weekly} endDate={date} />
          ) : (
            <Skeleton className="h-56" />
          )}
        </div>

        <div className="card flex flex-col">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-ink-900">Nutritional Insight</h2>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${insightHeader(primaryInsight).iconBg}`}>
              <Lightbulb size={16} weight="fill" />
            </div>
          </div>
          {analysis && primaryInsight ? (
            <>
              {(() => {
                const head = insightHeader(primaryInsight);
                return (
                  <p className="text-sm leading-relaxed text-ink-700">
                    <span className={`font-semibold ${head.leadColor}`}>{head.lead} </span>
                    Your <span className="font-semibold text-ink-900">{primaryInsight.nutrient.toLowerCase()}</span> intake is{" "}
                    {head.statusLabel} this week.
                  </p>
                );
              })()}
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {primaryInsight.message}
              </p>
              <div className="mt-auto pt-4">
                <button className="btn-ghost w-full">View Full Analysis</button>
              </div>
            </>
          ) : analysis ? (
            <>
              <p className="text-sm leading-relaxed text-ink-700">
                <span className="font-semibold text-brand-700">Nice work — </span>
                your macros sit within target today. Keep this rhythm to stay on plan.
              </p>
              <div className="mt-auto pt-4">
                <button className="btn-ghost w-full">View Full Analysis</button>
              </div>
            </>
          ) : (
            <Skeleton className="h-32" />
          )}
        </div>
      </section>
    </div>
  );
}

interface InsightHeader {
  lead: string;
  leadColor: string;
  iconBg: string;
  statusLabel: string;
}

function insightHeader(insight: { severity: "low" | "medium" | "high" } | null): InsightHeader {
  if (!insight) {
    return {
      lead: "All good —",
      leadColor: "text-brand-700",
      iconBg: "bg-brand-50 text-brand-700",
      statusLabel: "on track",
    };
  }
  if (insight.severity === "high") {
    return {
      lead: "Heads up —",
      leadColor: "text-red-600",
      iconBg: "bg-red-50 text-red-600",
      statusLabel: "well below target",
    };
  }
  if (insight.severity === "medium") {
    return {
      lead: "Worth a tweak —",
      leadColor: "text-amber-600",
      iconBg: "bg-amber-50 text-amber-600",
      statusLabel: "off target",
    };
  }
  return {
    lead: "Nice work —",
    leadColor: "text-brand-700",
    iconBg: "bg-brand-50 text-brand-700",
    statusLabel: "close to target",
  };
}
