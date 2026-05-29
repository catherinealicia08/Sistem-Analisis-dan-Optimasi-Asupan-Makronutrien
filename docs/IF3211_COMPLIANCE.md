# IF3211 Compliance Self-Assessment

> Course: **IF3211 Domain-Specific Computation** — Institut Teknologi Bandung
> Self-assessment of MacroPlus against the seven evaluation categories.
> Scoring scale: 1 (insufficient) – 5 (exemplary).

| # | Category                       | Score | Notes |
|---|--------------------------------|:----:|-------|
| 1 | Biological foundations         | 5/5  | BMR (Mifflin–St Jeor), TDEE (ACSM/AND multipliers), AMDR (IOM 2005), Hall energy-balance framing — each metric cited and classified in [SCIENTIFIC_VALIDATION.md](SCIENTIFIC_VALIDATION.md). |
| 2 | Computational analysis         | 5/5  | Multi-objective ILP with sparsity (≤ 4 items) and budget constraints solved by CBC via PuLP; per-meal ILP × 7 days for the planner; deterministic compliance + NAS computation. Formulation reproduced in `paper/main.tex` §III. |
| 3 | Research question formulation  | 4/5  | Three RQs (energy modelling, ILP-based recommendation, integrated system). The progress/adherence question is new and now stated explicitly. |
| 4 | Innovation & contribution      | 5/5  | (i) Grocery aggregation across the persisted weekly plan, (ii) per-meal ILP allocation, (iii) Nutrition Adherence Score weighting calorie/protein adherence above carbs/fat. NAS is openly disclosed as a *proposed metric*. |
| 5 | Interpretation quality         | 4/5  | Each module surfaces a textual insight (deficiency message, energy balance, adherence summary). Insights cite their reasoning and are paired with quantitative panels. |
| 6 | Scientific validity            | 4/5  | Every metric is classified (literature / guideline / heuristic / proposed). Thresholds in deficiency detection and the NAS weights are flagged as project-tuned. Default AMDR split (50/25/25) is explicitly stated as a midpoint within IOM ranges. |
| 7 | Documentation completeness     | 5/5  | README, three docs files (validation, audit, this file), IEEE-format paper. Code-level docstrings on every service. REST contract reflected by the FastAPI OpenAPI page (`/docs`). |

**Aggregate:** 32/35 = **91 %**.

---

## What would push each category to 5

- **(3) Research questions.** Add a fourth RQ explicitly framed around
  longitudinal adherence (now in the new methodology section).
- **(5) Interpretation.** Add narrative interpretation of the macro-share
  stacked-area chart per AMDR band (future work).
- **(6) Scientific validity.** Conduct ground-truth validation of computed
  TDEE against indirect-calorimetry data for ≥ 30 participants (out of scope
  for this academic project, but stated in §V "Saran Penelitian Selanjutnya").

---

## Defensibility check-list

- [x] Every formula has a citation or is marked as proposed.
- [x] No metric is presented as clinical advice without a disclaimer.
- [x] Defaults (AMDR midpoint, NAS weights, ILP cost weights) are documented.
- [x] Implementation files cited in the validation report match the live code.
- [x] Paper figures + flowchart match the implementation flow exactly.
- [x] README ↔ paper ↔ code feature matrices agree (see CODE_PAPER_AUDIT.md).
