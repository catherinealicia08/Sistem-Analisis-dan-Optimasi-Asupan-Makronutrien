import { PublicShell } from "./public/PublicShell";

type Klass = "literature" | "guideline" | "proposed" | "heuristic";

const KLASS_LABEL: Record<Klass, string> = {
  literature: "Literature-supported",
  guideline:  "Guideline-supported",
  proposed:   "Proposed metric",
  heuristic:  "Heuristic",
};

const KLASS_TONE: Record<Klass, string> = {
  literature: "bg-brand-50 text-brand-700 border-brand-200",
  guideline:  "bg-cyan-50 text-cyan-700 border-cyan-200",
  proposed:   "bg-amber-50 text-amber-700 border-amber-200",
  heuristic:  "bg-ink-100 text-ink-700 border-ink-200",
};

interface Item {
  title: string;
  formula?: string;
  body: string;
  klass: Klass;
  refs: { label: string; href?: string }[];
}

const ITEMS: Item[] = [
  {
    title: "Basal Metabolic Rate — Mifflin–St Jeor",
    formula:
      "BMR (male)   = 10 W + 6.25 H − 5 A + 5\nBMR (female) = 10 W + 6.25 H − 5 A − 161",
    body:
      "Predicts resting metabolic rate from weight (kg), height (cm), and age (years). " +
      "Validated against modern populations as more accurate than Harris–Benedict.",
    klass: "literature",
    refs: [
      { label: "Mifflin et al., Am J Clin Nutr 51(2):241–247, 1990.", href: "https://doi.org/10.1093/ajcn/51.2.241" },
      { label: "Frankenfield et al., JADA 105(5):775–789, 2005.",     href: "https://doi.org/10.1016/j.jada.2005.02.005" },
    ],
  },
  {
    title: "Total Daily Energy Expenditure (TDEE)",
    formula: "TDEE = BMR × α,  α ∈ {1.2, 1.375, 1.55, 1.725, 1.9}",
    body:
      "Applies the standard five-bucket activity multiplier to BMR. The α mapping is the convention adopted by " +
      "ACSM and the AND/DC/ACSM Position Stand.",
    klass: "guideline",
    refs: [
      { label: "ACSM's Guidelines for Exercise Testing and Prescription, 10e, 2018." },
      { label: "Thomas et al., JAND 116(3):501–528, 2016.", href: "https://doi.org/10.1016/j.jand.2015.12.006" },
    ],
  },
  {
    title: "Acceptable Macronutrient Distribution Range (AMDR)",
    formula:
      "T_X = T_K · s_X / e_X\nDefault split:  carbs 50%  •  protein 25%  •  fat 25%",
    body:
      "The Institute of Medicine sets AMDR as carbs 45–65 %, protein 10–35 %, fat 20–35 % of energy. " +
      "MacroPlus uses a midpoint within all three ranges as the safe default.",
    klass: "guideline",
    refs: [
      { label: "Institute of Medicine, DRI: Energy, Carbohydrate, Fiber, Fat, Protein, 2005.", href: "https://doi.org/10.17226/10490" },
    ],
  },
  {
    title: "Goal-adjusted target calories",
    formula: "T_K = TDEE × (1 + δ),   δ ∈ {−0.15, 0, +0.10}",
    body:
      "Weight-loss applies a 15 % deficit, maintenance is at TDEE, muscle-gain applies a 10 % surplus. " +
      "The chosen magnitudes lie within published position-stand recommendations.",
    klass: "guideline",
    refs: [
      { label: "Thomas et al., JAND 116(3), 2016." },
      { label: "Hall et al., The Lancet 378(9793):826–837, 2011.", href: "https://doi.org/10.1016/S0140-6736(11)60812-X" },
    ],
  },
  {
    title: "Energy density",
    formula: "ρ_E = kcal_total / mass_total",
    body:
      "Surfaced as an informational quality marker. Lower-energy-density diets are associated with greater " +
      "weight-loss success in controlled studies (Rolls 2009).",
    klass: "literature",
    refs: [
      { label: "Rolls BJ, Physiology & Behavior 97(5):609–615, 2009.", href: "https://doi.org/10.1016/j.physbeh.2009.03.011" },
    ],
  },
  {
    title: "Protein density",
    formula: "ρ_P = protein_g / kcal",
    body:
      "Higher protein-per-kcal correlates with satiety and lean-mass retention during caloric deficits. " +
      "MacroPlus surfaces the ratio; it is not a clinical diagnostic.",
    klass: "heuristic",
    refs: [
      { label: "Hall et al., The Lancet 378(9793), 2011." },
      { label: "Thomas et al., JAND 116(3), 2016." },
    ],
  },
  {
    title: "Macro Balance Score (MBS)",
    formula:
      "MBS = (1 − ½ Σ_X |ŝ_X − s*_X|) × 100\ns* = (carbs 0.55, protein 0.225, fat 0.275)",
    body:
      "Total-variation distance between the user's actual macro share and the AMDR midpoint, mapped to 0–100. " +
      "Useful as a 'how balanced am I' summary, not as a clinical score.",
    klass: "proposed",
    refs: [{ label: "Derived from IOM AMDR 2005 midpoints." }],
  },
  {
    title: "Deficiency detection",
    body:
      "Surfaces a natural-language insight when intake breaches ±10 g protein, ±40–50 g carbs, +15 g fat, " +
      "or ±300 kcal vs target. Thresholds are project-tuned defaults, not clinical cutoffs.",
    klass: "heuristic",
    refs: [{ label: "Internal heuristics, defensible against AMDR ranges (IOM 2005)." }],
  },
  {
    title: "Multi-objective Integer Linear Programming",
    formula: "min  4 · e_P + 1.5 · e_C + 2 · e_F + 1 · e_K\nΣ y_i ≤ 4    (sparsity cap)",
    body:
      "Recommendations are computed by minimising weighted absolute deviation from per-macro targets, " +
      "subject to kcal budget, fat upper bound, and a half-deficit protein lower bound. " +
      "Solved by CBC via PuLP. The ILP form is literature-supported; the (4, 1.5, 2, 1) weights are " +
      "project-tuned to prioritise protein-gap closure.",
    klass: "literature",
    refs: [
      { label: "Stigler GJ, J Farm Economics 27(2):303–314, 1945." },
      { label: "Wolsey LA, Integer Programming, Wiley-Interscience, 1998." },
      { label: "Mitchell, O'Sullivan, Dunning (PuLP), 2011." },
      { label: "Forrest & Lougee-Heimer (CBC), INFORMS, 2005." },
    ],
  },
  {
    title: "Meal allocation",
    formula: "Default split: breakfast 25 % · lunch 35 % · dinner 30 % · snack 10 %",
    body:
      "MacroPlus runs an independent ILP per meal slot with σ_m · target as the slot target. The split is " +
      "configurable per user; the validator enforces Σ σ_m = 1.",
    klass: "guideline",
    refs: [
      { label: "USDA Dietary Guidelines for Americans, 2020–2025." },
      { label: "Institute of Medicine DRI, 2005." },
    ],
  },
  {
    title: "Nutrition Adherence Score (NAS)",
    formula: "NAS = 0.4·S_kcal + 0.3·S_protein + 0.2·S_carbs + 0.1·S_fat",
    body:
      "A composite 0–100 score over a rolling window, labelled Poor / Fair / Good / Excellent at 50 / 70 / 85. " +
      "Weights prioritise calorie adherence (dominant predictor of body-weight change per Hall 2011) and protein " +
      "adherence (Thomas 2016). Carbs and fat weight is lower because AMDR tolerates wider variation.",
    klass: "proposed",
    refs: [
      { label: "Project-derived weighting from cited literature (Hall 2011, Thomas 2016, IOM 2005)." },
    ],
  },
  {
    title: "Energy balance",
    formula: "EB(d) = intake_kcal(d) − target_kcal",
    body:
      "Negative EB means caloric deficit; positive EB means surplus. Conceptual framing follows Hall et al.'s " +
      "dynamic energy balance model.",
    klass: "literature",
    refs: [{ label: "Hall et al., The Lancet 378(9793):826–837, 2011." }],
  },
];

export function ScientificBasisPage() {
  return (
    <PublicShell current="science">
      <header className="max-w-2xl">
        <span className="pill-brand">Scientific Basis</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Every metric, classified and cited
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          MacroPlus is an academic implementation. Each computational metric is
          tagged as <strong>literature-supported</strong>, <strong>guideline-supported</strong>,
          <strong> heuristic</strong>, or a transparently disclosed{" "}
          <strong>proposed metric</strong>. We surface no unverified claims.
        </p>
      </header>

      <section className="mt-10 space-y-5">
        {ITEMS.map((it) => (
          <article key={it.title} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink-900">{it.title}</h2>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${KLASS_TONE[it.klass]}`}>
                {KLASS_LABEL[it.klass]}
              </span>
            </div>
            {it.formula && (
              <pre className="mt-3 overflow-x-auto rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-xs leading-relaxed text-ink-900 scroll-thin">
                {it.formula}
              </pre>
            )}
            <p className="mt-3 text-sm leading-relaxed text-ink-700">{it.body}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-ink-500">
              {it.refs.map((r) => (
                <li key={r.label}>
                  {r.href ? (
                    <a href={r.href} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                      {r.label}
                    </a>
                  ) : (
                    r.label
                  )}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <aside className="mt-10 rounded-2xl border border-ink-200 bg-surface p-6">
        <h3 className="text-base font-semibold text-ink-900">No clinical advice</h3>
        <p className="mt-2 text-sm text-ink-500">
          MacroPlus does not provide medical, dietary, or clinical advice and is not validated
          for renal, diabetic, or other clinical populations. Defaults reflect AMDR midpoints
          for healthy adults.
        </p>
      </aside>
    </PublicShell>
  );
}
