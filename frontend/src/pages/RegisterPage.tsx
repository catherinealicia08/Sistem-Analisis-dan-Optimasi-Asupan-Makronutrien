import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ChartLineUp, Heart, Sparkle } from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext";
import { apiErrorMessage } from "../api/http";
import { AuthShell } from "./auth/AuthShell";
import { PasswordField } from "./auth/PasswordField";

const passwordRule = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number");

const schema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email"),
    password: passwordRule,
    confirm_password: z.string(),
    accept_terms: z.boolean().refine((v) => v === true, { message: "You must accept the Terms" }),
  })
  .refine((d) => d.password === d.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: doRegister } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        first_name: "", last_name: "", email: "",
        password: "", confirm_password: "", accept_terms: false,
      },
    });

  async function onSubmit(v: FormValues) {
    setServerError(null);
    try {
      await doRegister({
        first_name: v.first_name,
        last_name: v.last_name,
        email: v.email,
        password: v.password,
      });
      navigate("/profile-setup", { replace: true });
    } catch (e) {
      setServerError(apiErrorMessage(e));
    }
  }

  return (
    <AuthShell
      topRight={
        <span>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link>
        </span>
      }
      hero={<RegisterHero />}
    >
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Create your account</h1>
        <p className="mt-1 text-sm text-ink-500">Get started with MacroPlus today</p>
      </motion.div>

      {serverError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FieldText
            label="First name" placeholder="John" autoComplete="given-name"
            registration={register("first_name")} error={errors.first_name?.message}
          />
          <FieldText
            label="Last name" placeholder="Doe" autoComplete="family-name"
            registration={register("last_name")} error={errors.last_name?.message}
          />
        </div>

        <div>
          <label className="label-xs">Email address</label>
          <input
            type="email" autoComplete="email" placeholder="you@example.com"
            className={`input mt-1.5 ${errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500/15" : ""}`}
            {...register("email")}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label-xs">Password</label>
          <div className="mt-1.5">
            <PasswordField
              placeholder="Create a password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
          </div>
        </div>

        <div>
          <label className="label-xs">Confirm password</label>
          <div className="mt-1.5">
            <PasswordField
              placeholder="Confirm your password"
              autoComplete="new-password"
              error={errors.confirm_password?.message}
              {...register("confirm_password")}
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-ink-700">
          <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500" {...register("accept_terms")} />
          <span>
            I agree to the{" "}
            <a href="#" className="font-semibold text-ink-900 hover:underline">Terms of Service</a> and{" "}
            <a href="#" className="font-semibold text-ink-900 hover:underline">Privacy Policy</a>
          </span>
        </label>
        {errors.accept_terms && <p className="-mt-2 text-xs text-red-600">{errors.accept_terms.message}</p>}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base">
          {isSubmitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

    </AuthShell>
  );
}

function FieldText({
  label, placeholder, autoComplete, registration, error,
}: {
  label: string;
  placeholder?: string;
  autoComplete?: string;
  registration: ReturnType<ReturnType<typeof useForm<FormValues>>["register"]>;
  error?: string;
}) {
  return (
    <div>
      <label className="label-xs">{label}</label>
      <input
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`input mt-1.5 ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500/15" : ""}`}
        {...registration}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function RegisterHero() {
  return (
    <div className="relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-brand-50 p-6 sm:min-h-[420px] sm:p-8 lg:min-h-[640px]">
      <h2 className="text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-4xl">
        Start your journey
        <br />
        to a <span className="text-brand-600">better you</span>
      </h2>
      <ul className="mt-8 space-y-5">
        <Pitch Icon={Heart} title="Personalized for you" desc="Get customized nutrition plans based on your body and goals." />
        <Pitch Icon={Sparkle} title="Backed by science" desc="Our recommendations are based on proven research." />
        <Pitch Icon={ChartLineUp} title="Track & improve" desc="Monitor your progress and optimize every day." />
      </ul>
      <div className="pointer-events-none mt-auto hidden h-40 w-full overflow-hidden rounded-xl sm:block">
        <img
          src="https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

function Pitch({ Icon, title, desc }: { Icon: typeof Heart; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-brand-700 shadow-card">
        <Icon size={18} weight="fill" />
      </span>
      <div>
        <div className="text-sm font-semibold text-ink-900">{title}</div>
        <p className="mt-0.5 text-sm text-ink-500">{desc}</p>
      </div>
    </li>
  );
}


