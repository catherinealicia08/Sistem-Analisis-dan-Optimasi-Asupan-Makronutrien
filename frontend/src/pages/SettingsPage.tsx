import { useEffect, useState } from "react";
import { CaretRight, FloppyDisk, UserCircle } from "@phosphor-icons/react";
import type { ActivityLevel, Goal, MetabolicTargets, Sex, User } from "../types";
import { api } from "../api/client";
import { Skeleton } from "../components/ui/Skeleton";

interface Props {
  user: User | null;
  targets: MetabolicTargets | null;
  onSaved: (u: User) => void;
}

const ACTIVITY: Record<ActivityLevel, string> = {
  sedentary:   "Sedentary · ~1 day / week",
  light:       "Light · 1–3 days / week",
  moderate:    "Moderate · 3–5 days / week",
  very_active: "Very Active · 6–7 days / week",
  athlete:     "Athlete · 2x daily",
};

const ACTIVITY_DESC: Record<ActivityLevel, string> = {
  sedentary:   "Little or no exercise",
  light:       "Light exercise / sports",
  moderate:    "3–5 days of exercise per week",
  very_active: "Intense exercise 6–7 days / week",
  athlete:     "Twice a day, very hard exercise",
};

const GOAL_TITLE: Record<Goal, string> = {
  weight_loss: "Weight Loss",
  maintenance: "Maintenance",
  muscle_gain: "Muscle Gain",
};

const GOAL_DESC: Record<Goal, string> = {
  weight_loss: "Focus on a sustainable calorie deficit",
  maintenance: "Keep your current body composition",
  muscle_gain: "Focus on building lean muscle mass",
};

export function SettingsPage({ user, targets, onSaved }: Props) {
  const [form, setForm] = useState<User | null>(user);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setForm(user), [user]);

  function field<K extends keyof User>(k: K, v: User[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  async function save() {
    if (!form || !user) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateUser(user.id, {
        name: form.name, age: form.age, sex: form.sex,
        weight: form.weight, height: form.height,
        activity_level: form.activity_level, goal: form.goal,
      });
      onSaved(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Profile &amp; Metabolic Settings</h1>
        <button onClick={save} disabled={!form || saving} className="btn-primary">
          <FloppyDisk size={16} weight="bold" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <section className="card">
          <h2 className="text-base font-semibold text-ink-900">Profile Information</h2>
          {!form ? (
            <Skeleton className="mt-4 h-64" />
          ) : (
            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <UserCircle size={64} weight="fill" />
                </div>
                <button className="btn-ghost px-3 py-1.5 text-xs">Edit Profile</button>
              </div>
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input className="input" value={form.name} onChange={(e) => field("name", e.target.value)} />
                </Field>
                <Field label="Gender">
                  <select className="input" value={form.sex} onChange={(e) => field("sex", e.target.value as Sex)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </Field>
                <Field label="Age">
                  <input type="number" className="input" value={form.age} onChange={(e) => field("age", Number(e.target.value))} />
                </Field>
                <Field label="Weight (kg)">
                  <input type="number" step="0.1" className="input" value={form.weight} onChange={(e) => field("weight", Number(e.target.value))} />
                </Field>
                <Field label="Height (cm)">
                  <input type="number" step="0.1" className="input" value={form.height} onChange={(e) => field("height", Number(e.target.value))} />
                </Field>
              </div>
            </div>
          )}
        </section>

        {/* Metabolic settings */}
        <section className="card">
          <h2 className="text-base font-semibold text-ink-900">Metabolic Settings</h2>
          {!form ? (
            <Skeleton className="mt-4 h-64" />
          ) : (
            <div className="mt-5 space-y-4">
              <SelectRow
                label="Activity Level"
                description={ACTIVITY_DESC[form.activity_level]}
                value={ACTIVITY[form.activity_level].split(" · ")[0]}
              >
                <select
                  className="input"
                  value={form.activity_level}
                  onChange={(e) => field("activity_level", e.target.value as ActivityLevel)}
                >
                  {(Object.keys(ACTIVITY) as ActivityLevel[]).map((k) => (
                    <option key={k} value={k}>{ACTIVITY[k]}</option>
                  ))}
                </select>
              </SelectRow>
              <SelectRow
                label="Goal"
                description={GOAL_DESC[form.goal]}
                value={GOAL_TITLE[form.goal]}
              >
                <select
                  className="input"
                  value={form.goal}
                  onChange={(e) => field("goal", e.target.value as Goal)}
                >
                  {(Object.keys(GOAL_TITLE) as Goal[]).map((k) => (
                    <option key={k} value={k}>{GOAL_TITLE[k]}</option>
                  ))}
                </select>
              </SelectRow>

              <div className="divider" />

              <MetabolicRow label="BMR (Basal Metabolic Rate)" value={targets ? `${Math.round(targets.bmr)} kcal` : "—"} />
              <MetabolicRow label="TDEE (Total Daily Energy Expenditure)" value={targets ? `${Math.round(targets.tdee)} kcal` : "—"} />
              <MetabolicRow label="Target Calories" value={targets ? `${Math.round(targets.target_calories)} kcal / day` : "—"} highlight />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-xs">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function SelectRow({
  label, description, value, children,
}: { label: string; description: string; value: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-ink-200 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink-900">{label}</div>
          <p className="mt-0.5 text-xs text-ink-500">{description}</p>
        </div>
        <button
          onClick={() => setOpen((s) => !s)}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-ink-700 hover:text-ink-900"
        >
          {value}
          <CaretRight size={14} weight="bold" className={open ? "rotate-90 transition" : "transition"} />
        </button>
      </div>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function MetabolicRow({
  label, value, highlight,
}: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-ink-700">{label}</div>
      <div className={`text-sm font-bold num ${highlight ? "text-brand-700" : "text-ink-900"}`}>{value}</div>
    </div>
  );
}
