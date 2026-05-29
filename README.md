# MacroPlus — Computational Nutrition Decision Support System

> **IF3211 Domain-Specific Computation – Kelompok 07**
> Institut Teknologi Bandung, 2026

MacroPlus is not a calorie counter. It is an integrated computational platform
that combines metabolic modelling, macronutrient analysis, multi-objective
Integer Linear Programming optimisation, weekly meal planning, grocery
aggregation, and longitudinal nutritional adherence tracking — wrapped in a
production-quality SaaS UI.

---

## 1. Scientific stack

| Layer                | Model / standard                                            | Reference                          |
| -------------------- | ----------------------------------------------------------- | ---------------------------------- |
| BMR                  | Mifflin–St Jeor equation                                    | Mifflin et al., *AJCN* 1990        |
| TDEE                 | Activity multipliers (1.2 → 1.9)                            | ACSM, AND/DC Position Stand 2016   |
| Macronutrient target | Acceptable Macronutrient Distribution Range (AMDR)          | Institute of Medicine, DRI 2005    |
| Goal adjustment      | TDEE × {0.85, 1.00, 1.10}                                   | Thomas et al., *JAND* 2016         |
| Quality scores       | Protein density, energy density, macro balance score        | Derived from AMDR midpoint         |
| Optimisation         | Multi-objective ILP, weighted absolute deviation, sparsity  | Stigler 1945; Wolsey 1998          |
| Solver               | PuLP → CBC branch-and-cut                                   | Mitchell 2011; Forrest 2005        |
| Energy balance       | EB = Intake − Target (Hall framing)                         | Hall et al., *Lancet* 2011         |
| Adherence            | Nutrition Adherence Score (proposed metric, see docs)       | Project-derived                    |

Each metric is classified in [docs/SCIENTIFIC_VALIDATION.md](docs/SCIENTIFIC_VALIDATION.md)
as **literature-supported**, **guideline-supported**, **heuristic**, or
**proposed metric**.

---

## 2. Feature matrix

| Module                       | Status | Key endpoints                                          |
| ---------------------------- | ------ | ------------------------------------------------------ |
| Authentication (JWT)         |  Done  | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Profile setup wizard         |  Done  | `PUT /users/me/profile`                                |
| Dashboard                    |  Done  | `GET /users/{id}/analysis/{day}`, `GET /users/{id}/logs/weekly/{day}` |
| Food Logger                  |  Done  | `GET /foods`, `POST/DELETE /users/{id}/logs/{day}/items`|
| Nutrition Analysis           |  Done  | `GET /users/{id}/analysis/{day}`                       |
| Recommendations (ILP)        |  Done  | `POST /users/{id}/optimize/{day}`                      |
| **Meal Planner** (new)       |  Done  | `GET/POST /me/meal-plan`, `GET /me/meal-plan/{day}`    |
| **Grocery Aggregation** (new)|  Done  | `GET /me/grocery-list`                                 |
| **Progress** (new)           |  Done  | `GET /me/progress`                                     |
| **Weight Tracking** (new)    |  Done  | `POST /me/weight`, `GET /me/weight-history`            |
| Settings (profile + metabolic)|  Done | `PUT /users/{id}`                                      |
| Landing page                 |  Done  | —                                                      |

---

## 3. Architecture

```
+----------------------------------------------------------------+
|                    Frontend (Vite + React)                     |
|                                                                |
|  Landing  ->  Login / Register  ->  Profile Setup              |
|                            |                                   |
|                            v                                   |
|  AppShell (sidebar + bottom nav)                               |
|    +- Dashboard       +- Meal Planner      (new)               |
|    +- Food Logger     +- Progress          (new)               |
|    +- Analytics       +- Settings                              |
|    +- Recommendations                                          |
+----------------------------------------------------------------+
                              | Axios + Bearer JWT
                              v
+----------------------------------------------------------------+
|                Backend (FastAPI + Firestore)                   |
|                                                                |
|  /auth        JWT (HS256, 7d TTL), bcrypt password hashing     |
|  /users       profile CRUD, /me/profile setup                  |
|  /foods       catalogue + categories                           |
|  /logs        daily food log (per user/day)                    |
|  /analysis    metabolic + AMDR + quality scores                |
|  /optimize    PuLP/CBC ILP (multi-objective)                   |
|  /meal-plan   per-meal ILP x 7 days, persists to Firestore     |
|  /grocery     aggregates planned meals                         |
|  /progress    daily compliance + NAS + weight history          |
|  /weight      log measurement                                  |
+----------------------------------------------------------------+
                              |
                              v
                  Firestore (users/foods/logs/
                  meal_plans/weight_logs)
```

See [docs/CODE_PAPER_AUDIT.md](docs/CODE_PAPER_AUDIT.md) for a full mapping
between implementation, REST contract, and paper sections.

---

## 4. Running locally

### Backend

```bash
cd backend
pip install -r requirements.txt

# Set a strong secret in production
export MACROPLUS_JWT_SECRET="change-me"

# Firestore credentials:
# - deployment: set FIREBASE_CREDENTIALS_JSON to the service-account JSON blob
# - local: set FIREBASE_KEY_PATH or place serviceAccountKey.json in backend/
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173, proxies /api -> :8000
```

### Seeding the food database (first run)

```bash
cd backend
python seed_firestore.py
```

---

## 5. Documentation

| File                                                          | Purpose                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| [docs/SCIENTIFIC_VALIDATION.md](docs/SCIENTIFIC_VALIDATION.md) | Every computational metric classified + cited.                |
| [docs/CODE_PAPER_AUDIT.md](docs/CODE_PAPER_AUDIT.md)           | Implemented-vs-paper synchronisation matrix.                  |
| [docs/IF3211_COMPLIANCE.md](docs/IF3211_COMPLIANCE.md)         | 7-criterion self-assessment against the course rubric.        |
| [docs/FINAL_AUDIT_REPORT.md](docs/FINAL_AUDIT_REPORT.md)       | Final polishing + consistency audit (5-section report).       |
| [paper/main.tex](paper/main.tex)                               | IEEE conference paper (<= 6 pages including refs).            |

---

## 6. Team

| Name                                | NIM       |
| ----------------------------------- | --------- |
| Muhammad Adam Mirza                 | 18223015  |
| Devon Wiraditya Tanumihardja        | 18223039  |
| Muhammad Aqmar Fayyaz Zakaria       | 18223043  |
| Catherine Alicia Putri              | 18223069  |

Institut Teknologi Bandung — Program Studi Sistem dan Teknologi Informasi.
