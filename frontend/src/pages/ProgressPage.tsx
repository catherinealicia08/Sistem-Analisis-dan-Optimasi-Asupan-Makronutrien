import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle,
  Drop,
  Fire,
  Leaf,
  Plus,
  Pulse,
  Scales,
  Sparkle,
  TrendDown,
  TrendUp,
} from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import type { AdherenceSummary, DailyCompliance, ProgressData, WeightLog } from "../types";
import { progressApi } from "../api/progress";
import { apiErrorMessage } from "../api/http";
import { Donut } from "../components/ui/Donut";
import { Skeleton } from "../components/ui/Skeleton";

const NAS_TONE: Record<AdherenceSummary["classification"], string> = {
  Excellent: "text-brand-700",
  Good:      "text-brand-700",
  Fair:      "text-amber-600",
  Poor:      "text-red-600",
};

const NAS_TRACK: Record<AdherenceSummary["classification"], string> = {
  Excellent: "#22C55E",
  Good:      "#22C55E",
  Fair:      "#F59E0B",
  Poor:      "#EF4444",
};

const WINDOW_OPTIONS = [7, 14, 30];

export function ProgressPage() {
  const [windowDays, setWindowDays] = useState<number>(7);
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(days: number) {
    setLoading(true);
    setError(null);
    try {
      const p = await progressApi.get(days);
      setData(p);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(windowDays); }, [windowDays]);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Progress</h1>
          <p className="mt-1 text-sm text-ink-500">
            Longitudinal nutritional adherence and weight trajectory.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-surface p-1 shadow-card">
          {WINDOW_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setWindowDays(d)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                windowDays === d
                  ? "bg-brand-500 text-white"
                  : "text-ink-700 hover:bg-ink-100"
              }`}
            >
              {d} d
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* NAS + summary */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center lg:col-span-1">
          <h2 className="self-start text-base font-semibold text-ink-900">Nutrition Adherence Score</h2>
          <p className="self-start text-xs text-ink-500">Composite 0–100 (derived metric)</p>
          {summary ? (
            <Donut
              value={summary.nas / 100}
              size={196}
              stroke={16}
              color={NAS_TRACK[summary.classification]}
              track="#F3F4F6"
            >
              <div className="text-3xl font-bold text-ink-900 num">{Math.round(summary.nas)}</div>
              <div className="text-xs text-ink-500">/ 100</div>
              <div className={`mt-2 text-xs font-semibold ${NAS_TONE[summary.classification]}`}>
                {summary.classification}
              </div>
            </Donut>
          ) : (
            <Skeleton className="mt-4 h-48 w-48 rounded-full" />
          )}
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-900">Weekly Compliance</h2>
            <Sparkle size={14} weight="fill" className="text-brand-600" />
          </div>
          {summary ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ScoreRow Icon={Fire}  label="Calorie score" value={summary.calorie_score} color="#22C55E" />
              <ScoreRow Icon={Pulse} label="Protein score" value={summary.protein_score} color="#EF4444" />
              <ScoreRow Icon={Leaf}  label="Carbs score"   value={summary.carbs_score}   color="#F59E0B" />
              <ScoreRow Icon={Drop}  label="Fat score"     value={summary.fat_score}     color="#06B6D4" />
            </div>
          ) : (
            <Skeleton className="mt-4 h-32" />
          )}
          {summary && summary.insights.length > 0 && (
            <ul className="mt-5 space-y-2 border-t border-ink-200 pt-4">
              {summary.insights.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                  <CheckCircle size={16} weight="fill" className="mt-0.5 text-brand-600" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Trends */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <ChartHeader title="Calories Trend" sub={`vs target · last ${windowDays} days`} />
          {data ? (
            <CaloriesChart daily={data.daily} />
          ) : (
            <Skeleton className="mt-4 h-56" />
          )}
        </div>
        <div className="card">
          <ChartHeader title="Protein Trend" sub={`vs target · last ${windowDays} days`} />
          {data ? (
            <ProteinChart daily={data.daily} />
          ) : (
            <Skeleton className="mt-4 h-56" />
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <ChartHeader title="Macro Balance Trend" sub="% of energy by macro" />
          {data ? (
            <MacroShareChart daily={data.daily} />
          ) : (
            <Skeleton className="mt-4 h-56" />
          )}
        </div>
        <WeightCard
          history={data?.weight_history ?? null}
          change={data?.weight_change_kg ?? null}
          loading={loading}
          onLogged={() => load(windowDays)}
        />
      </section>
    </div>
  );
}

function ScoreRow({
  Icon, label, value, color,
}: { Icon: typeof Fire; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-ink-200 px-3 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-ink-700">
          <Icon size={14} weight="fill" />
          <span className="text-xs font-semibold">{label}</span>
        </div>
        <span className="text-sm font-bold text-ink-900 num">{value.toFixed(0)}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
    </div>
  );
}

function ChartHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      {sub && <p className="text-xs text-ink-500">{sub}</p>}
    </div>
  );
}

function CaloriesChart({ daily }: { daily: DailyCompliance[] }) {
  const data = daily.map((d) => ({
    day: shortDayLabel(d.date),
    intake: Math.round(d.intake.calories),
    target: Math.round(d.target_calories),
  }));
  return (
    <div className="mt-3 h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="prgKcal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11, color: "#374151" }} iconType="circle" />
          <Area type="monotone" dataKey="intake" name="Intake" stroke="#22C55E" strokeWidth={2.5} fill="url(#prgKcal)" />
          <Area type="monotone" dataKey="target" name="Target" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProteinChart({ daily }: { daily: DailyCompliance[] }) {
  const data = daily.map((d) => ({
    day: shortDayLabel(d.date),
    intake: Math.round(d.intake.protein),
    target: Math.round(d.target_protein),
  }));
  return (
    <div className="mt-3 h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="prgPro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11, color: "#374151" }} iconType="circle" />
          <Area type="monotone" dataKey="intake" name="Intake" stroke="#EF4444" strokeWidth={2.5} fill="url(#prgPro)" />
          <Area type="monotone" dataKey="target" name="Target" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MacroShareChart({ daily }: { daily: DailyCompliance[] }) {
  const data = daily.map((d) => ({
    day: shortDayLabel(d.date),
    protein: d.macro_share.protein,
    carbs:   d.macro_share.carbs,
    fat:     d.macro_share.fat,
  }));
  return (
    <div className="mt-3 h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} stackOffset="expand" margin={{ top: 10, right: 10, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} width={44}
                 tickFormatter={(v) => `${Math.round(v * 100)}%`} />
          <Tooltip formatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#374151" }} iconType="circle" />
          <Area type="monotone" stackId="1" dataKey="protein" name="Protein" stroke="#EF4444" fill="#EF4444" fillOpacity={0.55} />
          <Area type="monotone" stackId="1" dataKey="carbs"   name="Carbs"   stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.55} />
          <Area type="monotone" stackId="1" dataKey="fat"     name="Fat"     stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.55} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const weightSchema = z.object({
  weight: z.coerce.number().min(20, "Min 20 kg").max(400, "Max 400 kg"),
  note:   z.string().max(200).optional(),
});

function WeightCard({
  history, change, loading, onLogged,
}: {
  history: WeightLog[] | null;
  change: number | null;
  loading: boolean;
  onLogged: () => void;
}) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<{ weight: number; note?: string }>({ resolver: zodResolver(weightSchema), defaultValues: { weight: 70 } });
  const [err, setErr] = useState<string | null>(null);

  const trendData = useMemo(
    () => (history ?? []).map((w) => ({ day: shortDayLabel(w.date), weight: w.weight })),
    [history],
  );

  async function onSubmit(values: { weight: number; note?: string }) {
    setErr(null);
    try {
      await progressApi.logWeight(values);
      reset({ weight: values.weight });
      onLogged();
    } catch (e) {
      setErr(apiErrorMessage(e));
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <ChartHeader title="Weight Trend" sub="kg" />
        {change !== null && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            change < 0 ? "bg-brand-50 text-brand-700" : change > 0 ? "bg-amber-50 text-amber-700" : "bg-ink-100 text-ink-700"
          }`}>
            {change < 0 ? <TrendDown size={12} weight="bold" /> : <TrendUp size={12} weight="bold" />}
            {change > 0 ? "+" : ""}{change.toFixed(1)} kg
          </span>
        )}
      </div>

      {loading && !history ? (
        <Skeleton className="mt-4 h-40" />
      ) : trendData.length >= 2 ? (
        <div className="mt-3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} width={36} domain={["auto", "auto"]} />
              <Tooltip />
              <Area type="monotone" dataKey="weight" stroke="#6366F1" strokeWidth={2.5} fill="url(#weightArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-500">
          Log at least two weight measurements to see your trend.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <label>
          <span className="label-xs">Weight (kg)</span>
          <input
            type="number" step="0.1"
            className={`input mt-1 ${errors.weight ? "border-red-300 focus:border-red-500 focus:ring-red-500/15" : ""}`}
            {...register("weight")}
          />
        </label>
        <label>
          <span className="label-xs">Note (optional)</span>
          <input
            className="input mt-1"
            placeholder="Morning, fasted"
            {...register("note")}
          />
        </label>
        <button type="submit" disabled={isSubmitting} className="btn-primary self-end">
          <Scales size={16} weight="bold" />
          {isSubmitting ? "Saving…" : "Log Weight"}
        </button>
      </form>
      {errors.weight && <p className="mt-2 text-xs text-red-600">{errors.weight.message}</p>}
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}

      <p className="mt-3 text-[11px] text-ink-500">
        <Plus size={10} className="mb-0.5 inline" weight="bold" />
        Latest weight automatically updates your target calories.
      </p>
    </div>
  );
}

function shortDayLabel(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { weekday: "short" }) + " " + d.getDate();
  } catch {
    return iso;
  }
}
