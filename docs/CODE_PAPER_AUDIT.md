# Code vs Paper Audit

Three-column mapping between the implementation, the REST contract, and the
paper sections. Three findings are surfaced:

- **A. Implemented in Code but Missing in Paper** — must be added.
- **B. Present in Paper but Missing in Code** — must be implemented or removed.
- **C. Requires Revision** — drift between code and paper that requires the
  paper to be updated.

---

## 1. Mapping

| Concept                  | Code (file)                                            | REST endpoint                                                  | Paper section                              | Status |
| ------------------------ | ------------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------ | ------ |
| BMR                      | `calculations.py::mifflin_st_jeor`                     | derived inside `/analysis/{day}` & `/targets`                  | II-E (Perhitungan Metabolik)               | OK     |
| TDEE                     | `calculations.py::tdee`                                | same                                                           | II-E + eq. (3)                             | OK     |
| Goal adjustment          | `calculations.py::goal_calories`                       | same                                                           | II-F + eq. (4)                             | OK     |
| AMDR macro targets       | `calculations.py::macro_targets`                       | same                                                           | II-G + eq. (5)                             | OK     |
| Quality scores           | `analysis_service.py` (densities + MBS)                | `GET /users/{id}/analysis/{day}`                               | II-H + eq. (6)                             | OK     |
| Deficiency insights      | `analysis_service.py::_compute_insights`               | same                                                           | II-I                                       | OK     |
| ILP optimiser            | `optimizer.py::optimize_meal`                          | `POST /users/{id}/optimize/{day}`                              | II-J + eq. (7–13)                          | OK     |
| **Authentication (JWT)** | `auth/security.py`, `controllers/auth.py`              | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`      | *missing*                                  | **A**  |
| **Profile setup**        | `services/user_service.py::apply_profile_setup`        | `PUT /users/me/profile`                                        | *missing*                                  | **A**  |
| **Meal Planner**         | `services/meal_plan_service.py`                        | `GET/POST /me/meal-plan`, `GET /me/meal-plan/{day}`            | III-* (added in this revision)             | **A**  |
| **Grocery aggregation**  | `services/meal_plan_service.py::grocery_list`          | `GET /me/grocery-list`                                         | III-* (added)                              | **A**  |
| **Progress + NAS**       | `services/progress_service.py`                         | `GET /me/progress`                                             | IV-* (added)                               | **A**  |
| **Weight tracking**      | `services/progress_service.py::log_weight`             | `POST /me/weight`, `GET /me/weight-history`                    | IV-* (added)                               | **A**  |
| **Landing page**         | `frontend/src/pages/LandingPage.tsx`                   | n/a                                                            | not required to appear                     | OK     |
| SQLAlchemy / SQLite      | *replaced by Firestore*                                | n/a                                                            | II-A (abstract & II-A mention SQLite)      | **C**  |
| ER diagram (4 tables)    | n/a — Firestore is document-store                      | n/a                                                            | II-B (describes 4 SQL tables)              | **C**  |

---

## 2. Implemented in Code but Missing in Paper (`A`)

The paper *prior to* this revision did not describe:

1. JWT-based authentication and profile-setup flow.
2. Meal Planner (per-meal ILP solved across a 7-day window, persisted, fetched).
3. Grocery aggregation across the persisted plans.
4. Progress tracking: daily compliance, NAS, energy balance, weight history.

This revision **adds two new methodology subsections** (Meal Planning
Optimisation; Nutritional Adherence Analysis) and a corresponding results
paragraph, and updates the architecture / flowchart figures.

## 3. Present in Paper but Missing in Code (`B`)

None at the time of this audit. The original paper described an ILP
formulation that is fully present in `optimizer.py`. All paper claims about
the metabolic stack, AMDR split, and quality scores correspond 1:1 with the
implementation.

## 4. Requires Revision (`C`)

| Paper claim                                              | Reality                                                | Action                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| "FastAPI–SQLAlchemy–SQLite" (Abstract)                   | FastAPI + Firestore (NoSQL document store)             | Reword to "FastAPI + Firestore"; update architecture figure caption.                   |
| "Skema basis data terdiri atas empat tabel relasional"   | Four Firestore collections + sub-collections           | Replace ERD figure with collection map; describe relations textually.                  |
| "9 komponen React"                                       | 7 routed pages + many composable components            | Reword as "7 routed pages and a shared component library".                             |
| "21 endpoint REST"                                       | 31 endpoints after this revision                       | Update count to "31 endpoints across 9 routers".                                       |

All four C-class items are addressed in `paper/main.tex` in this revision.

---

## 5. Test plan

| Area               | Verification step                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Auth round-trip    | `POST /auth/register` → returns token → `GET /auth/me` with token returns the same user.                                     |
| Profile complete   | After `PUT /users/me/profile`, `profile_complete` flips to `true` and `/analysis/{day}` returns non-zero `target_calories`.  |
| Meal plan          | `POST /me/meal-plan/generate` with `{ days: 7 }` writes 7 docs under `users/{uid}/meal_plans/*`; `GET /me/meal-plan` returns them. |
| Grocery            | `GET /me/grocery-list` aggregates non-zero grams for every food appearing in a saved plan.                                   |
| Progress           | After two `POST /me/weight` entries on different days, `GET /me/progress` exposes `weight_change_kg` ≠ null.                 |
| Frontend wiring    | `npm run build` passes; `/meal-planner` and `/progress` are fully reachable from sidebar and bottom nav.                     |
