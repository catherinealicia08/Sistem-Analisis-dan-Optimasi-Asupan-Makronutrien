import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Barbell,
  Check,
  Heartbeat,
  PersonSimpleRun,
  Scales,
  Sparkle,
} from "@phosphor-icons/react";
import type { ActivityLevel, Goal, Sex } from "../types";
import { useAuth } from "../auth/AuthContext";
import { authApi } from "../api/auth";
import { apiErrorMessage } from "../api/http";

const schema = z.object({
  age: z.coerce.number().min(10, "Min 10").max(120, "Max 120"),
  sex: z.enum(["male", "female"]),
  weight: z.coerce.number().min(20, "Min 20kg").max(400, "Max 400kg"),
  height: z.coerce.number().min(80, "Min 80cm").max(260, "Max 260cm"),
  activity_level: z.enum(["sedentary", "light", "moderate", "very_active", "athlete"]),
  goal: z.enum(["weight_loss", "maintenance", "muscle_gain"]),
});

type FormValues = z.infer<typeof schema>;

const ACTIVITY_OPTIONS: { value: ActivityLevel; title: string; desc: string }[] = [
  { value: "sedentary",   title: "Sedentary",   desc: "Little or no exercise" },
  { value: "light",       title: "Light",       desc: "1–3 days / week" },
  { value: "moderate",    title: "Moderate",    desc: "3–5 days / week" },
  { value: "very_active", title: "Very Active", desc: "6–7 days / week" },
  { value: "athlete",     title: "Athlete",     desc: "Twice daily, very hard" },
];

const GOAL_OPTIONS: { value: Goal; title: string; desc: string; Icon: typeof Barbell }[] = [
  { value: "weight_loss", title: "Weight Loss", desc: "Sustainable calorie deficit", Icon: Scales },
  { value: "maintenance", title: "Maintenance", desc: "Keep current composition",   Icon: Heartbeat },
  { value: "muscle_gain", title: "Muscle Gain", desc: "Build lean muscle mass",     Icon: Barbell },
];

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        age: 25, sex: "male", weight: 70, height: 175,
        activity_level: "moderate", goal: "maintenance",
      },
    });

  const sex = watch("sex");
  const activity = watch("activity_level");
  const goal = watch("goal");

  async function next() {
    const ok = await trigger(STEPS[step].fields);
    if (ok) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const updated = await authApi.setupProfile(values);
      setUser(updated);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setServerError(apiErrorMessage(e));
    }
  }

  const firstName = user?.first_name ?? (user?.name ?? "there").split(" ")[0];

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <header className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Sparkle size={18} weight="fill" />
          </div>
          <span className="text-lg font-bold tracking-tight text-ink-900">MacroPlus</span>
        </div>
        <span className="text-sm text-ink-500">Step {step + 1} of {STEPS.length}</span>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <span className="pill-brand">Profile Setup</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Welcome, {firstName}! <span>👋</span>
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Tell us a bit about you so we can personalize your nutrition plan.
          </p>
        </div>

        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <motion.div
            className="h-full rounded-full bg-brand-500"
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>

        {serverError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
          <div className="card">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {step === 0 && (
                <BodyStep
                  register={register}
                  errors={errors}
                  sex={sex}
                  onSelectSex={(v) => setValue("sex", v, { shouldValidate: true })}
                />
              )}
              {step === 1 && (
                <ActivityStep activity={activity} onSelect={(v) => setValue("activity_level", v, { shouldValidate: true })} />
              )}
              {step === 2 && (
                <GoalStep goal={goal} onSelect={(v) => setValue("goal", v, { shouldValidate: true })} />
              )}
            </motion.div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-ghost disabled:opacity-40"
            >
              <ArrowLeft size={16} weight="bold" />
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="btn-primary">
                Continue
                <ArrowRight size={16} weight="bold" />
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                <Check size={16} weight="bold" />
                {isSubmitting ? "Saving…" : "Finish setup"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

const STEPS: { title: string; fields: (keyof FormValues)[] }[] = [
  { title: "Body",     fields: ["age", "sex", "weight", "height"] },
  { title: "Activity", fields: ["activity_level"] },
  { title: "Goal",     fields: ["goal"] },
];

function BodyStep({
  register, errors, sex, onSelectSex,
}: {
  register: ReturnType<typeof useForm<FormValues>>["register"];
  errors: Partial<Record<keyof FormValues, { message?: string }>>;
  sex: Sex;
  onSelectSex: (s: Sex) => void;
}) {
  return (
    <>
      <h2 className="text-lg font-semibold text-ink-900">Your body metrics</h2>
      <p className="mt-1 text-sm text-ink-500">We use this to calculate your basal metabolic rate.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Age" error={errors.age?.message}>
          <input type="number" className="input" {...register("age")} />
        </Field>
        <Field label="Gender">
          <div className="grid grid-cols-2 gap-2">
            {(["male", "female"] as Sex[]).map((opt) => (
              <button
                key={opt} type="button"
                onClick={() => onSelectSex(opt)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                  sex === opt
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-surface text-ink-700 hover:bg-ink-50"
                }`}
              >
                {opt === "male" ? "Male" : "Female"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Weight (kg)" error={errors.weight?.message}>
          <input type="number" step="0.1" className="input" {...register("weight")} />
        </Field>
        <Field label="Height (cm)" error={errors.height?.message}>
          <input type="number" step="0.1" className="input" {...register("height")} />
        </Field>
      </div>
    </>
  );
}

function ActivityStep({ activity, onSelect }: { activity: ActivityLevel; onSelect: (v: ActivityLevel) => void }) {
  return (
    <>
      <h2 className="text-lg font-semibold text-ink-900">How active are you?</h2>
      <p className="mt-1 text-sm text-ink-500">Pick the option closest to your weekly routine.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {ACTIVITY_OPTIONS.map((opt) => (
          <button
            key={opt.value} type="button"
            onClick={() => onSelect(opt.value)}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
              activity === opt.value
                ? "border-brand-500 bg-brand-50"
                : "border-ink-200 bg-surface hover:bg-ink-50"
            }`}
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              activity === opt.value ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-500"
            }`}>
              <PersonSimpleRun size={18} weight="fill" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink-900">{opt.title}</span>
              <span className="mt-0.5 block text-xs text-ink-500">{opt.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function GoalStep({ goal, onSelect }: { goal: Goal; onSelect: (v: Goal) => void }) {
  return (
    <>
      <h2 className="text-lg font-semibold text-ink-900">What&apos;s your primary goal?</h2>
      <p className="mt-1 text-sm text-ink-500">Your goal sets your daily target calories and macro split.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {GOAL_OPTIONS.map((opt) => (
          <button
            key={opt.value} type="button"
            onClick={() => onSelect(opt.value)}
            className={`flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition ${
              goal === opt.value
                ? "border-brand-500 bg-brand-50"
                : "border-ink-200 bg-surface hover:bg-ink-50"
            }`}
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              goal === opt.value ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-500"
            }`}>
              <opt.Icon size={20} weight="fill" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink-900">{opt.title}</span>
              <span className="mt-0.5 block text-xs text-ink-500">{opt.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-xs">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </label>
  );
}
