import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { apiErrorMessage } from "../api/http";
import { AuthShell } from "./auth/AuthShell";
import { PasswordField } from "./auth/PasswordField";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { email: "", password: "", remember: true },
    });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const user = await login(values.email, values.password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(user.profile_complete === false ? "/profile-setup" : from ?? "/dashboard", { replace: true });
    } catch (e) {
      setServerError(apiErrorMessage(e));
    }
  }

  return (
    <AuthShell
      reverse
      topRight={
        <span>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">Sign up</Link>
        </span>
      }
      hero={<LoginHero />}
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-500">Log in to continue your nutrition journey</p>
      </motion.div>

      {serverError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="label-xs" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`input mt-1.5 ${errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500/15" : ""}`}
            {...register("email")}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label-xs" htmlFor="password">Password</label>
          <div className="mt-1.5">
            <PasswordField
              id="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register("password")}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-ink-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
              {...register("remember")}
            />
            Remember me
          </label>
          <button type="button" className="font-semibold text-brand-700 hover:underline">
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-3 text-base"
        >
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-ink-500">
        By logging in, you agree to our{" "}
        <a href="#" className="font-semibold text-ink-700 hover:underline">Terms of Service</a> and{" "}
        <a href="#" className="font-semibold text-ink-700 hover:underline">Privacy Policy</a>.
      </p>
    </AuthShell>
  );
}

function LoginHero() {
  return (
    <div className="relative h-full min-h-[260px] overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-card sm:min-h-[360px] lg:min-h-[520px]">
      <img
        src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80"
        alt=""
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-ink-200 bg-surface/95 p-4 shadow-card backdrop-blur sm:inset-x-6 sm:bottom-6 sm:p-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-white">
          <span className="text-base font-bold">✦</span>
        </div>
        <h2 className="mt-3 text-lg font-bold text-ink-900">Unlock your best self</h2>
        <p className="mt-1 text-sm text-ink-500">Track. Analyze. Optimize.<br />All in one powerful platform.</p>
      </div>
    </div>
  );
}

