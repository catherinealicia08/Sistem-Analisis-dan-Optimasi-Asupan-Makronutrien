# Scientific Validation Report

> **Purpose.** Every computational metric used by MacroPlus is classified here
> as **literature-supported**, **guideline-supported**, **heuristic**, or
> **proposed metric**, with the implementation file/line and the source it can
> be defended from. No metric appears to the user as "scientific fact" unless
> this report can defend it.

## 1. Resting metabolic rate — BMR

- **Formula.** Mifflin–St Jeor equation:
  - Male:   `BMR = 10W + 6.25H − 5A + 5`
  - Female: `BMR = 10W + 6.25H − 5A − 161`
- **Implementation.** `backend/app/calculations.py::mifflin_st_jeor`
- **Classification.** Literature-supported.
- **Reference.** Mifflin et al., *Am J Clin Nutr*, 51(2):241–247, 1990;
  validated against modern populations by Frankenfield et al., *JAND*, 2005.

## 2. Total Daily Energy Expenditure — TDEE

- **Formula.** `TDEE = BMR × α`, α ∈ {1.2, 1.375, 1.55, 1.725, 1.9}.
- **Implementation.** `backend/app/calculations.py::tdee` (with table
  `ACTIVITY_FACTORS`).
- **Classification.** Guideline-supported.
- **Reference.** ACSM Guidelines for Exercise Testing and Prescription, 10e,
  2018; AND/DC/ACSM Position Stand (Thomas et al., *JAND*, 116(3), 2016).
- **Note.** The five-bucket α mapping is the convention adopted by the
  position stands cited above; the precise α values are guideline-level rather
  than the output of a single peer-reviewed study.

## 3. Goal-adjusted target calories

- **Formula.** `T_K = TDEE × (1 + δ)`, δ ∈ {−0.15, 0, +0.10} for
  weight-loss / maintenance / muscle-gain respectively.
- **Implementation.** `backend/app/calculations.py::goal_calories`.
- **Classification.** Guideline-supported.
- **Reference.** −15 % deficit and +10 % surplus are the central tendencies
  recommended in Thomas et al. (*JAND*, 2016) for endurance/strength athletes;
  the −15 % deficit also lies within the safe-deficit envelope discussed by
  Hall et al., *Lancet*, 2011.

## 4. AMDR macronutrient split

- **Formula.** `T_X = (T_K × s_X) / e_X`, where `e_protein = e_carbs = 4`,
  `e_fat = 9` kcal/g.
- **Default split.** `carbs 50 % / protein 25 % / fat 25 %` —
  `DEFAULT_MACRO_SPLIT` in `calculations.py`.
- **Classification.** Guideline-supported.
- **Reference.** Institute of Medicine, *DRI: Energy, Carbohydrate, Fiber,
  Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids*, 2005:
  AMDR carbs 45–65 %, protein 10–35 %, fat 20–35 %.
- **Note.** The chosen split is a safe midpoint within all three AMDR ranges.
  Users with clinical needs (renal, diabetic) should not rely on the default.

## 5. Quality scores

### 5a. Protein density `ρ_P = P / kcal`

- **Implementation.** `analysis_service.py` (line near `protein_density=`).
- **Classification.** Heuristic, supported by guideline intent.
- **Note.** Higher protein-per-kcal correlates with satiety and lean-mass
  retention in caloric deficits (Hall et al., 2011); the **ratio itself** is a
  derived convenience metric.

### 5b. Energy density `ρ_E = kcal / g`

- **Implementation.** Same file.
- **Classification.** Literature-supported.
- **Reference.** Rolls BJ. *The relationship between dietary energy density and
  energy intake.* Physiol Behav 97(5):609–615, 2009 — controlled-feeding evidence
  that lower-energy-density meals reduce ad-libitum intake.
- **Note.** Surfaced as an informational marker; not a clinical prescription.

### 5c. Macro Balance Score (MBS)

- **Formula.** `MBS = (1 − ½ Σ_X |ŝ_X − s*_X|) × 100`, with
  `s* = (carbs 0.55, protein 0.225, fat 0.275)` — AMDR midpoints.
- **Implementation.** `calculations.py::macro_balance_score`.
- **Classification.** Proposed metric, anchored on AMDR.
- **Note.** Total variation distance to the AMDR midpoint. We surface it as
  *"balance"*, not as a clinical score.

## 6. Deficiency detection

- **Thresholds.** ±10 g protein, ±40–50 g carbs, +15 g fat, ±300 kcal.
- **Implementation.** `analysis_service.py::_compute_insights`.
- **Classification.** Heuristic.
- **Note.** Thresholds are tunable defaults — they are *not* drawn from a
  single clinical standard. They produce useful UX feedback but should not be
  read as diagnoses.

## 7. ILP optimisation

- **Objective.** `min 4·e_P + 1.5·e_C + 2·e_F + 1·e_K`.
- **Constraints.** Per-unit non-negativity, sparsity cap (`Σ y_i ≤ 4`), kcal
  budget, fat upper bound, half-deficit protein lower bound.
- **Implementation.** `backend/app/optimizer.py`.
- **Classification.**
  - The ILP **formulation** of the diet problem is literature-supported
    (Stigler 1945; Wolsey 1998).
  - The **specific weights (4, 1.5, 2, 1)** are a project-tuned **heuristic**,
    chosen so the solver prioritises protein-deficit closure (the hardest gap
    to cover without exceeding kcal) over carb deviation.
- **Solver.** CBC via PuLP (Mitchell 2011; Forrest & Lougee-Heimer 2005).

## 8. Meal-plan allocation

- **Default split.** Breakfast 25 % / Lunch 35 % / Dinner 30 % / Snack 10 %.
- **Implementation.** `services/meal_plan_service.py::DEFAULT_DISTRIBUTION`.
- **Classification.** Guideline-supported.
- **Reference.** USDA Dietary Guidelines for Americans, 2020–2025
  (consistent 3-meal-plus-snack pattern); also reflected in the IOM 2005 DRI
  application examples.
- **Note.** Users can override the split via `distribution` in the generate
  payload; the validator enforces shares that sum to 1.

## 9. Grocery aggregation

- **Method.** Sum grams per food across every meal slot of every persisted
  plan in the requested window; convert to pieces when the food appears in
  `PIECE_FOODS` (FAO household-measure heuristic).
- **Implementation.** `meal_plan_service.py::grocery_list`.
- **Classification.** Engineering / heuristic — no clinical claim.

## 10. Daily compliance score

- **Formula.** Per macro: `e_X = |intake − target| / target × 100`. Composite
  daily score: `100 − mean(e_K, e_P, e_C, e_F)`, bounded to [0, 100].
- **Implementation.** `services/progress_service.py::_build_daily`.
- **Classification.** Heuristic (mean-percentage-error against target).

## 11. Nutrition Adherence Score (NAS)

- **Formula.**
  `NAS = 0.4 × S_calories + 0.3 × S_protein + 0.2 × S_carbs + 0.1 × S_fat`
- **Classification mapping.** Poor < 50 ≤ Fair < 70 ≤ Good < 85 ≤ Excellent.
- **Implementation.** `services/progress_service.py::_build_summary`.
- **Classification.** **Proposed metric** (project-derived).
- **Justification of weights.** Calorie adherence is the dominant predictor of
  body-weight outcome under the Hall dynamic-energy-balance model
  (*Lancet*, 2011), hence the largest weight. Protein adherence is the next
  largest because protein turnover and lean-mass retention drive most
  goal-relevant clinical outcomes (Thomas et al., 2016). Carbs and fat are
  weighted lower because the body can tolerate substantial AMDR-range shifts
  between them without adverse effect (IOM 2005). **These weights are *not*
  drawn from a single peer-reviewed source verbatim**; they are a defensible
  *prioritisation* of cited evidence.

## 12. Energy balance

- **Formula.** `EB(d) = intake_calories(d) − target_calories`.
- **Implementation.** `progress_service.py::_build_daily`.
- **Classification.** Literature-supported as a concept.
- **Reference.** Hall et al., *Lancet*, 378(9793):826–837, 2011.

## 13. Weight tracking

- **Storage.** `users/{uid}/weight_logs/{auto_id}`.
- **Latest-weight write-through.** Each new entry also updates `users/{uid}.weight`
  so the next analyse-day recomputes BMR/TDEE/targets.
- **Implementation.** `progress_service.py::log_weight`.
- **Classification.** Engineering; no clinical claim.

---

## Summary table

| Metric                | File                                | Class                    |
| --------------------- | ----------------------------------- | ------------------------ |
| BMR (Mifflin–St Jeor) | `calculations.py`                   | Literature-supported     |
| TDEE multipliers      | `calculations.py`                   | Guideline-supported      |
| Goal adjustment       | `calculations.py`                   | Guideline-supported      |
| AMDR split            | `calculations.py`                   | Guideline-supported      |
| Protein density       | `analysis_service.py`               | Heuristic                |
| Energy density        | `analysis_service.py`               | Literature-supported (Rolls 2009) |
| Macro Balance Score   | `calculations.py`                   | Proposed metric          |
| Deficiency thresholds | `analysis_service.py`               | Heuristic                |
| ILP optimiser         | `optimizer.py`                      | Literature-supported (form) / Heuristic (weights) |
| Meal allocation       | `meal_plan_service.py`              | Guideline-supported      |
| Grocery aggregation   | `meal_plan_service.py`              | Engineering              |
| Compliance score      | `progress_service.py`               | Heuristic                |
| Nutrition Adherence   | `progress_service.py`               | **Proposed metric**      |
| Energy balance        | `progress_service.py`               | Literature-supported     |
