import { Link } from "react-router-dom";
import {
  ChartLineUp,
  Heart,
  Lightbulb,
  Play,
  Sparkle,
  Target,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Navbar } from "./landing/Navbar";
import { DashboardPreview } from "./landing/DashboardPreview";

export function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-canvas">
      <Navbar />
      <Hero />
      <Features />
      <ScienceStrip />
      <Footer />
    </div>
  );
}

/* ----- Hero ----- */
function Hero() {
  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1280px] px-4 pt-10 pb-16 sm:px-6 lg:px-8 lg:pt-16 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
            >
              <Sparkle size={12} weight="fill" />
              AI-Powered Nutrition Optimization
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-[56px]"
            >
              Track your nutrition,
              <br />
              <span className="text-brand-600">optimize your metabolism.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="mt-5 max-w-xl text-base text-ink-500 sm:text-lg"
            >
              MacroPlus helps you understand your body, track your macros, and make
              smarter nutrition decisions to achieve your goals faster.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <Link to="/register" className="btn-primary px-5 py-3 text-base">
                Start Your Journey
              </Link>
              <button onClick={scrollToFeatures} className="btn-ghost px-5 py-3 text-base">
                <Play size={16} weight="fill" />
                How It Works
              </button>
            </motion.div>
          </div>

          <div className="lg:pl-4">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----- Features ----- */
function Features() {
  const items = [
    { Icon: Heart,         title: "Smart Tracking",     desc: "Easily track your meals and macros with our intelligent food database." },
    { Icon: ChartLineUp,   title: "In-Depth Analytics", desc: "Gain insights into your nutrition patterns and body response over time." },
    { Icon: Sparkle,       title: "AI Recommendations", desc: "Get personalized suggestions to optimize your nutrition and accelerate results." },
    { Icon: Target,        title: "Goal Optimization",  desc: "Adjust and refine your plan as your body and goals evolve." },
  ];
  return (
    <section id="features" className="bg-canvas">
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Everything you need to reach <span className="text-brand-600">your goals</span>
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4 }}
              className="card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <it.Icon size={20} weight="fill" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink-900">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{it.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----- Science strip (honest, no fabricated metrics) ----- */
function ScienceStrip() {
  return (
    <section id="how-it-works" className="border-t border-ink-200 bg-surface">
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <span className="label-xs">Built on cited research</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Every number traces back to{" "}
              <span className="text-brand-600">a published source</span>
            </h2>
            <p className="mt-4 max-w-md text-sm text-ink-500">
              No fabricated ratings or unverified claims. MacroPlus is an academic
              implementation: every metric is classified as literature-supported,
              guideline-supported, heuristic, or a transparently-disclosed proposed
              metric.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/science" className="btn-primary">
                Read the science
              </Link>
              <Link to="/docs" className="btn-ghost">
                Documentation
              </Link>
            </div>
          </div>
          <ul className="space-y-3">
            <SciRow title="Mifflin–St Jeor equation" body="BMR estimator, AJCN 1990; validated against modern populations." />
            <SciRow title="ACSM activity multipliers" body="TDEE α ∈ {1.2 … 1.9}, ACSM Guidelines 10e (2018)." />
            <SciRow title="AMDR macronutrient split" body="Institute of Medicine DRI, 2005." />
            <SciRow title="Multi-objective ILP" body="Stigler 1945, Wolsey 1998; CBC via PuLP." />
          </ul>
        </div>
      </div>
    </section>
  );
}

function SciRow({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-ink-200 bg-canvas px-4 py-3">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Sparkle size={14} weight="fill" />
      </span>
      <div>
        <div className="text-sm font-semibold text-ink-900">{title}</div>
        <p className="mt-0.5 text-xs text-ink-500">{body}</p>
      </div>
    </li>
  );
}

/* ----- Footer ----- */
function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-canvas">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-white">
            <Sparkle size={14} weight="fill" />
          </div>
          <span className="text-sm font-bold tracking-tight text-ink-900">MacroPlus</span>
          <span className="text-xs text-ink-400">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-5 text-sm text-ink-500">
          <Link to="/science" className="hover:text-ink-900">Scientific Basis</Link>
          <Link to="/docs" className="hover:text-ink-900">Documentation</Link>
        </div>
      </div>
    </footer>
  );
}
