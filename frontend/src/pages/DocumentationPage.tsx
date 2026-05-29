import {
  Brain,
  Code,
  Database,
  FileArrowDown,
  GitBranch,
  Lightning,
  Stack,
} from "@phosphor-icons/react";
import { PublicShell } from "./public/PublicShell";

interface EndpointRow { method: "GET" | "POST" | "PUT" | "DELETE"; path: string; desc: string }

const ENDPOINTS: { group: string; rows: EndpointRow[] }[] = [
  {
    group: "Authentication",
    rows: [
      { method: "POST", path: "/auth/register",      desc: "Register, returns access token + user." },
      { method: "POST", path: "/auth/login",         desc: "Email + password login (JWT, HS256, 7-day TTL)." },
      { method: "GET",  path: "/auth/me",            desc: "Resolve token to the current user." },
    ],
  },
  {
    group: "Users",
    rows: [
      { method: "GET",  path: "/users/me",                 desc: "Authenticated user." },
      { method: "PUT",  path: "/users/me/profile",         desc: "Complete or update body + activity + goal profile." },
      { method: "PUT",  path: "/users/{id}",               desc: "Update user fields (self only)." },
      { method: "GET",  path: "/users/{id}/targets",       desc: "Compute BMR / TDEE / target macros." },
    ],
  },
  {
    group: "Foods + logs",
    rows: [
      { method: "GET",  path: "/foods",                                       desc: "Search foods by name / category." },
      { method: "GET",  path: "/foods/categories",                            desc: "Available category list." },
      { method: "GET",  path: "/users/{id}/logs/{day}",                       desc: "Daily food log." },
      { method: "POST", path: "/users/{id}/logs/{day}/items",                 desc: "Add a logged food item." },
      { method: "DELETE", path: "/users/{id}/logs/{day}/items/{item_id}",     desc: "Remove a logged item." },
      { method: "GET",  path: "/users/{id}/logs/weekly/{day}",                desc: "Trailing 7-day macro intake." },
    ],
  },
  {
    group: "Analysis + optimisation",
    rows: [
      { method: "GET",  path: "/users/{id}/analysis/{day}", desc: "Targets, intake, fulfillment, quality scores, insights." },
      { method: "POST", path: "/users/{id}/optimize/{day}", desc: "Multi-objective ILP recommendations (CBC via PuLP)." },
    ],
  },
  {
    group: "Meal Planner",
    rows: [
      { method: "GET",  path: "/me/meal-plan",            desc: "Persisted weekly plan." },
      { method: "GET",  path: "/me/meal-plan/{day}",      desc: "Single-day plan." },
      { method: "POST", path: "/me/meal-plan/generate",   desc: "Regenerate (per-meal ILP × N days)." },
      { method: "GET",  path: "/me/grocery-list",         desc: "Aggregated grocery list across stored plans." },
    ],
  },
  {
    group: "Progress + weight",
    rows: [
      { method: "GET",  path: "/me/progress",             desc: "Daily compliance, NAS, energy balance, weight history." },
      { method: "POST", path: "/me/weight",               desc: "Log a weight measurement." },
      { method: "GET",  path: "/me/weight-history",       desc: "Weight log history." },
    ],
  },
];

export function DocumentationPage() {
  return (
    <PublicShell current="docs">
      <header className="max-w-2xl">
        <span className="pill-brand">Documentation</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Architecture, contract, and references
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          A compact tour of how MacroPlus is put together — from the data model to the
          optimisation engine to the IEEE paper.
        </p>
      </header>

      {/* Architecture */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <ArchCard
          Icon={Stack}
          title="Frontend"
          rows={[
            "Vite + React 18 + TypeScript",
            "TailwindCSS design system",
            "React Router (public + protected routes)",
            "React Hook Form + Zod validation",
            "Recharts + Framer Motion",
          ]}
        />
        <ArchCard
          Icon={Brain}
          title="Backend"
          rows={[
            "FastAPI on Python 3.13",
            "Firestore document persistence",
            "JWT auth (HS256, 7-day TTL)",
            "PuLP → CBC ILP solver",
            "9 routers, 31 endpoints",
          ]}
        />
      </section>

      {/* Data model */}
      <section className="mt-10 card">
        <div className="flex items-center gap-2">
          <Database size={18} weight="fill" className="text-brand-600" />
          <h2 className="text-base font-semibold text-ink-900">Data model (Firestore)</h2>
        </div>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-xs leading-relaxed text-ink-900 scroll-thin">
{`users/{uid}
  ├─ email, first_name, last_name, password_hash
  ├─ age, sex, weight, height, activity_level, goal
  ├─ profile_complete, created_at, updated_at
  ├─ logs/{YYYY-MM-DD}/items/{auto}        ← daily food log
  ├─ meal_plans/{YYYY-MM-DD}               ← stored ILP plan per day
  └─ weight_logs/{auto}                    ← weight measurements

foods/{auto}
  └─ name, category, image_url, calories, protein, carbs, fat,
     serving_size, [fiber, sugar, sodium, subcategory, source]`}
        </pre>
        <p className="mt-3 text-xs text-ink-500">
          Bracketed fields are optional and present on dishes seeded after the database expansion.
        </p>
      </section>

      {/* ILP */}
      <section className="mt-6 card">
        <div className="flex items-center gap-2">
          <Lightning size={18} weight="fill" className="text-brand-600" />
          <h2 className="text-base font-semibold text-ink-900">Optimisation model</h2>
        </div>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-xs leading-relaxed text-ink-900 scroll-thin">
{`Decision    x_i ∈ ℤ≥0   units of 10 g of food i  (0 ≤ x_i ≤ 30)
             y_i ∈ {0,1} indicator
             e_K, e_P, e_C, e_F ≥ 0  absolute deviations

Objective    min  4·e_P + 1.5·e_C + 2·e_F + 1·e_K

Constraints  e_X ≥ Δ_X − Σᵢ x̃ᵢ ,   e_X ≥ Σᵢ x̃ᵢ − Δ_X
             Σᵢ c̃ᵢ xᵢ  ≤  1.05·Δ_K + 50
             Σᵢ f̃ᵢ xᵢ  ≤  1.05·Δ_F + 5
             Σᵢ p̃ᵢ xᵢ  ≥  0.5·Δ_P   (if Δ_P > 5)
             xᵢ ≤ U·yᵢ, xᵢ ≥ yᵢ, 1 ≤ Σᵢ yᵢ ≤ 4`}
        </pre>
      </section>

      {/* API */}
      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Code size={18} weight="fill" className="text-brand-600" />
          <h2 className="text-base font-semibold text-ink-900">REST API overview</h2>
        </div>
        <div className="space-y-4">
          {ENDPOINTS.map((g) => (
            <div key={g.group} className="card overflow-hidden p-0">
              <div className="border-b border-ink-200 bg-ink-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-700">
                {g.group}
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {g.rows.map((r) => (
                    <tr key={r.method + r.path} className="border-b border-ink-200 last:border-b-0">
                      <td className="px-4 py-2.5 align-top">
                        <span className={methodBadge(r.method)}>{r.method}</span>
                      </td>
                      <td className="px-4 py-2.5 align-top">
                        <code className="text-[12.5px] text-ink-900">{r.path}</code>
                        <div className="text-xs text-ink-500">{r.desc}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* Paper + repo */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <ResourceCard
          Icon={FileArrowDown}
          title="Research paper"
          desc="IEEE conference format, ≤6 pages. Includes flowchart, ILP formulation, validation case study, planner + adherence sections."
          cta="paper/main.tex"
          href="https://github.com/aqmarfayyaz/IF3050_Tugas-Besar_Kel07_Sistem-Analisis-dan-Optimasi-Asupan-Makronutrien/blob/main/paper/main.tex"
        />
        <ResourceCard
          Icon={GitBranch}
          title="Source repository"
          desc="Full backend + frontend + paper + docs. Run instructions in README."
          cta="github.com/…/MacroPlus"
          href="https://github.com/aqmarfayyaz/IF3050_Tugas-Besar_Kel07_Sistem-Analisis-dan-Optimasi-Asupan-Makronutrien"
        />
      </section>

      {/* References */}
      <section className="mt-10 card">
        <h2 className="text-base font-semibold text-ink-900">Scientific references</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-xs text-ink-500">
          <li>Mifflin MD et al. (1990). Am J Clin Nutr 51(2):241–247.</li>
          <li>Frankenfield D et al. (2005). J Am Diet Assoc 105(5):775–789.</li>
          <li>Institute of Medicine (2005). Dietary Reference Intakes — Energy, Carbohydrate, Fiber, Fat, Protein.</li>
          <li>ACSM (2018). Guidelines for Exercise Testing and Prescription, 10e.</li>
          <li>Thomas DT, Erdman KA, Burke LM (2016). JAND 116(3):501–528.</li>
          <li>Rodriguez NR et al. (2009). JADA 109(3):509–527.</li>
          <li>Hall KD et al. (2011). The Lancet 378(9793):826–837.</li>
          <li>Rolls BJ (2009). Physiology &amp; Behavior 97(5):609–615.</li>
          <li>Stigler GJ (1945). The Cost of Subsistence. J Farm Economics 27(2):303–314.</li>
          <li>Wolsey LA (1998). Integer Programming. Wiley-Interscience.</li>
          <li>Tran TNT et al. (2018). J Intelligent Information Systems 50(3):501–526.</li>
          <li>Mitchell S, O'Sullivan M, Dunning I (2011). PuLP.</li>
          <li>Forrest J, Lougee-Heimer R (2005). CBC User Guide, INFORMS TutORials.</li>
          <li>USDA & HHS (2020). Dietary Guidelines for Americans, 2020–2025.</li>
          <li>Jones M, Bradley J, Sakimura N (2015). RFC 7519 JSON Web Token.</li>
        </ul>
      </section>
    </PublicShell>
  );
}

function ArchCard({
  Icon, title, rows,
}: { Icon: typeof Stack; title: string; rows: string[] }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <Icon size={18} weight="fill" className="text-brand-600" />
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-ink-700">
        {rows.map((r) => <li key={r}>• {r}</li>)}
      </ul>
    </div>
  );
}

function ResourceCard({
  Icon, title, desc, cta, href,
}: { Icon: typeof FileArrowDown; title: string; desc: string; cta: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="card block transition hover:bg-ink-50"
    >
      <div className="flex items-center gap-2">
        <Icon size={18} weight="fill" className="text-brand-600" />
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      </div>
      <p className="mt-2 text-sm text-ink-500">{desc}</p>
      <div className="mt-3 text-xs font-semibold text-brand-700">{cta} →</div>
    </a>
  );
}

function methodBadge(m: "GET" | "POST" | "PUT" | "DELETE"): string {
  const base = "inline-flex w-14 justify-center rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide";
  switch (m) {
    case "GET":    return `${base} bg-brand-50 text-brand-700`;
    case "POST":   return `${base} bg-cyan-50 text-cyan-700`;
    case "PUT":    return `${base} bg-amber-50 text-amber-700`;
    case "DELETE": return `${base} bg-red-50 text-red-700`;
  }
}
