# MessMind — Hostel Food Demand Intelligence

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.3-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/Tests-60_Passing-10B981)](#8-automated-testing--verification)
[![Deployment Target](https://img.shields.io/badge/GitHub_Pages-Deployment_Target-FF6B4A?logo=github-pages)](https://mohdumair015.github.io/MessMind/)

> **Deployment Target Notice**:<br />
> The intended GitHub Pages deployment target for the static demonstration is:<br />
> **[`https://mohdumair015.github.io/MessMind/`](https://mohdumair015.github.io/MessMind/)**<br />
> *(Current status: NOT DEPLOYED / BUILD-VERIFIED ONLY. This URL represents the configured publication target; see [Deployment Guide](DEPLOYMENT.md) for workflow details.)*

---

## Table of Contents
- [1. Project Overview & Problem Statement](#1-project-overview--problem-statement)
  - [Authoritative Attendance vs. Food Waste Semantics](#authoritative-attendance-vs-food-waste-semantics)
- [2. Dual-Mode Architecture](#2-dual-mode-architecture)
  - [Capability Comparison](#capability-comparison)
- [3. Core Features & Application Views](#3-core-features--application-views)
- [4. Deterministic Prediction Methodology](#4-deterministic-prediction-methodology)
- [5. Explainable AI & Privacy Boundaries](#5-explainable-ai--privacy-boundaries)
- [6. Synthetic Data & Simulation Disclosures](#6-synthetic-data--simulation-disclosures)
  - [Verified Benchmark Data](#verified-benchmark-data)
- [7. Local Development Instructions](#7-local-development-instructions)
  - [Option A: Static Demo Mode (Zero Database)](#option-a-static-demo-mode-zero-database-required)
  - [Option B: Full-Stack Mode (PostgreSQL + Prisma)](#option-b-full-stack-mode-postgresql--prisma)
- [8. Automated Testing & Verification](#8-automated-testing--verification)
- [9. GitHub Pages Static Build & CI/CD Pipeline](#9-github-pages-static-build--cicd-pipeline)
- [10. Database Schema & Full-Stack Reference](#10-database-schema--full-stack-reference)
- [11. License & Project Disclosures](#11-license--project-disclosures)

---

## 1. Project Overview & Problem Statement

In student and corporate hostel accommodations, kitchen teams face a daily operational dilemma: **they must decide how much food to prepare hours before meal service begins**.

Traditional hostel management software only records dining hall entry logs after residents scan their cards or QR codes. However, attendance records only indicate what *already happened*. Cooking too much food results in unnecessary operational costs and discarded food; cooking too little leads to food shortages, resident dissatisfaction, and emergency cooking.

**MessMind** is a management-side demand intelligence module that predicts what is *likely to happen*. It ingests historical attendance logs, menu characteristics, and pre-meal resident opt-ins to compute deterministic demand forecasts and recommended cooking quantities.

```mermaid
flowchart LR
    A["1. PREDICT<br/>Individual probabilities<br/>Expected diners computed"] --> B["2. PREPARE<br/>Apply 5% safety buffer<br/>Kitchen cooks recommendation"]
    B --> C["3. OBSERVE<br/>Physical scanner sync<br/>Unique attendance captured"]
    C --> D["4. RECONCILE<br/>Variance computed<br/>Waste audit logged"]
    D --> E["5. LEARN<br/>Residual error evaluated<br/>Closed-loop model update"]
    E --> A
```

### Authoritative Attendance vs. Food Waste Semantics
MessMind enforces strict domain semantics across all calculations:
- **Predicted Demand**: The statistical expectation $\sum_{i=1}^{N} P(R_i)$ of resident attendance.
- **Recommended Preparation**: Predicted demand plus a configurable kitchen safety buffer (default $5\%$).
- **Actual Attendance**: The count of **authoritative, unique resident meal scans** recorded at the dining room entrance. Duplicate scans by the same resident are automatically suppressed.
- **Estimated Surplus / Leftover Portions**: $\text{Prepared Servings} - \text{Actual Diners}$. These represent unserved food portions.
- **Physical Food Waste**: Food discarded after service, verified through physical kitchen audit measurements. **Remaining food portions are never assumed to be wasted food**; unconsumed portions can often be repurposed or preserved under food-safety protocols.

---

## 2. Dual-Mode Architecture

MessMind is architected to operate in two distinct modes without code divergence:

1. **Static Demo Mode (GitHub Pages Target)**: A completely decoupled, browser-safe static deployment. It runs on synthetic benchmark data (125 residents, 205 historical meals) with an in-memory simulation controller and pure deterministic calculation engine. It requires **no PostgreSQL database, no Docker containers, no AWS credentials, and no Node.js runtime**.
2. **Full-Stack Application Mode**: The comprehensive enterprise implementation backed by PostgreSQL, Prisma ORM, Next.js Server Actions, role-based access control, and an optional Amazon Bedrock Converse API integration for natural language explanation generation.

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Presentation (Next.js 15 App Router & React 19)"]
        UI["Application Views: Overview · Meals · Predictions · Analytics · Admin"]
        SimCtrl["Client Simulation Controller<br/>(In-Memory React Context)"]
        RoleSwitch["Client Role Switcher<br/>(MESS_MANAGER / HOSTEL_ADMIN)"]
    end

    subgraph StaticPath["Static Demo Mode (NEXT_PUBLIC_DEMO_MODE=true)"]
        Snapshot["Canonical Static Snapshot<br/>(125 Residents · 205 Evaluated Meals)"]
        PureEngine["Pure Deterministic Engine<br/>(Browser-Safe Math)"]
        PureExplainer["Deterministic Fallback Explainer<br/>(Zero-Network Template Engine)"]
    end

    subgraph FullStackPath["Full-Stack Production Mode (Default / Node.js Runtime)"]
        ServerActions["Server Actions & API Routes<br/>(requireServerRole RBAC)"]
        DBEngine["Deterministic Prediction Engine<br/>(Prisma Data Ingestion)"]
        Bedrock["Amazon Bedrock Converse API<br/>(Aggregate Factor NL Explainer)"]
        Prisma["Prisma ORM Client"]
        Postgres[("PostgreSQL Database / Amazon RDS")]
    end

    UI -->|Demo Mode| SimCtrl
    SimCtrl --> Snapshot
    SimCtrl --> PureEngine
    SimCtrl --> PureExplainer

    UI -->|Full-Stack Mode| ServerActions
    ServerActions --> DBEngine
    ServerActions --> Bedrock
    DBEngine --> Prisma
    Prisma --> Postgres
```

### Capability Comparison

| Operational Feature | Static Demo Mode (GitHub Pages) | Full-Stack Application Mode |
| :--- | :--- | :--- |
| **Execution Environment** | Client browser CDN (Static Export) | Node.js Server Runtime (Next.js App Router) |
| **Database Dependency** | **None** (Zero PostgreSQL / Docker) | PostgreSQL 16 (Local or Amazon RDS) |
| **ORM & Persistence** | Static snapshot + in-memory state | Prisma ORM with relational schema |
| **Prediction Calculation** | `PureDeterministicPredictionEngine` | `DeterministicPredictionEngine` (DB queries) |
| **Target Saturday Dinner Forecast** | 90 expected diners, 95 prep (canonical) | Computed dynamically from PostgreSQL logs |
| **Safety Buffer Recalculation** | Interactive browser recalculation (0%–15%) | Recalculated and persisted to PostgreSQL |
| **Attendance Ingestion** | Simulated feed (99 scans, +9 variance) | Authoritative hardware scanner integration |
| **Waste Audit Recording** | Validated in active browser session | Persisted to `meal_outcomes` table |
| **Natural Language Explanations** | Deterministic browser template explainer | Amazon Bedrock Converse API (with fallback) |
| **Authentication & RBAC** | Client presentation preview toggle | Server-enforced role verification |

---

## 3. Core Features & Application Views

MessMind features six distinct operational views:

### 1. Operations Overview (`/MessMind/`)
The daily command center for kitchen managers.
- **Hero Recommendation**: Displays the primary decision metric: expected diners (90) and recommended preparation (95 servings) with active buffer percentage.
- **Live Dining Room Scanner**: Shows real-time attendee pacing via an animated SVG status ring, tracking arrival count versus forecast and variance.
- **Closed Learning Loop Highlights**: Displays top-level historical performance (4.2% MAPE, 92.5% accuracy rate, 2.6% average waste).

### 2. Meals Timeline (`/MessMind/meals/`)
A chronological schedule of hostel dining services.
- **Service Schedule**: Lists 21 canonical services spanning breakfast, lunch, and dinner.
- **Interactive Filtering**: Client-side filtering across *All Services (21)*, *Upcoming (1)*, and *Completed (20)* with synchronized query parameters (`?filter=upcoming`) and zero page reload.
- **Saturday Rhythm Callout**: Highlights operational trends specific to weekend services.

### 3. Meal Details & Service Reconciliation (`/MessMind/meals/[id]/`)
Deep-dive view for specific scheduled or historical services.
- **Target Saturday Dinner Benchmark**: Complete inspection of the canonical showcase service (`meal-target-saturday-dinner`).
- **Scanner Ingestion**: Interactive simulation of physical scanner sync (reconciling 99 resident check-ins).
- **Kitchen Outcome Audit Form**: Domain-validated form capturing prepared servings, actual attendees, remaining unserved portions, and discarded food waste.

### 4. Demand Predictions & Factor Architecture (`/MessMind/predictions/`)
Transparent mathematical explanation of the prediction model.
- **Mathematical Formula**: Clear visualization of individual resident probability calculations.
- **Five Weighted Factor Cards**: Population-level breakdown of personal history, day pattern, meal type, 14-day trend, and preference opt-ins.
- **Statistical Confidence**: Displays the dynamic Coefficient of Variation ($CV = 4.4\%$) and sample size rating.

### 5. Analytics & Closed Learning Loop (`/MessMind/analytics/`)
Macro-level evaluation of long-term model performance.
- **Key Metrics**: 4.2% Mean Absolute Percentage Error (MAPE), 92.5% within $\pm 5\%$ tolerance, 2.6% physical waste across 205 historical meals.
- **Leftover vs. Waste Separation**: Explicit tracking separating unserved remaining portions (5.6% average) from verified physical discarded waste (2.6%).
- **Historical Distribution**: Interactive Recharts visualizations of residual errors and service-by-service accuracy.

### 6. Hostel Administration & Governance (`/MessMind/admin/`)
System governance, population cohort review, and access control policies.
- **Resident Cohorts**: Inspection of the 125 active residents (50 student residents and 75 corporate residents).
- **Algorithm Configuration**: Buffer percentage controls and high-waste risk threshold settings.
- **Server Audit Policy**: Audit trail specifications tracking management overrides and synchronization actions.

---

## 4. Deterministic Prediction Methodology

MessMind strictly separates **numerical prediction** from **textual explanation**. Numerical forecasts are 100% deterministic, reproducible, and explainable. No generative AI or large language model generates dining quantities or cooking recommendations.

### 1. Individual Attendance Probability $P(R_i)$
For each active resident $R_i$, an individual attendance probability is computed using five weighted behavioral components:

$$\begin{aligned}
P_{\text{raw}}(R_i) = &\; 0.40 \times P_{\text{hist}}(R_i) \\
&+ 0.20 \times P_{\text{day}}(R_i, \text{day}) \\
&+ 0.15 \times P_{\text{meal}}(R_i, \text{mealType}) \\
&+ 0.15 \times P_{\text{trend}}(R_i, 14\text{d}) \\
&+ 0.10 \times P_{\text{pref}}(R_i, \text{optIn})
\end{aligned}$$

### 2. Bounded Adjustments & Clamping
- **Menu Appeal Adjustment**: Clamped strictly to $[-0.10, +0.10]$ based on historical attendance for the specific menu.
- **Recent Trend Delta**: Bounded to $[-0.10, +0.10]$ to prevent short-term anomalies from skewing baseline expectations.
- **Probability Clamping**: Every individual probability is bounded between $[0.01, 0.99]$:

$$P(R_i) = \text{clamp}\Big(P_{\text{raw}}(R_i) \times (1 + \text{menuAdjustment}), \; 0.01, \; 0.99\Big)$$

### 3. Aggregation & Recommended Cooking Servings
Expected diners is the sum of individual probabilities. Recommended preparation applies the configurable kitchen safety buffer (default $5\%$):

$$\text{Expected Diners} = \text{round}\left(\sum_{i=1}^{N} P(R_i)\right)$$

$$\text{Recommended Servings} = \left\lceil \text{Expected Diners} \times (1 + \text{buffer}) \right\rceil$$

### 4. Sparse-Data Fallback Hierarchy
When resident history is limited, the engine falls back gracefully:
1. **Full History**: Resident + Day + Meal + Menu history ($\ge 2$ observations).
2. **Day/Meal Pattern**: Resident + Day + Meal history ($\ge 2$ observations).
3. **Meal-Type Baseline**: Resident general attendance for that meal type ($\ge 3$ observations).
4. **Cohort Population Baseline**: Fallback to student ($71\%$) or corporate ($69\%$) population baselines.

### 5. Statistical Confidence Rating (Empirical CV)
Confidence is calculated from actual historical variance across comparable services (e.g. past 12 Saturday Dinners):

$$CV = \frac{\sigma}{\mu} = \frac{\sqrt{\frac{1}{M}\sum (D_j - \mu)^2}}{\mu}$$

- **High Confidence**: $M \ge 10$ comparable meals and $CV < 0.20$ (e.g. Target Saturday Dinner has $CV = 4.4\%$).
- **Medium Confidence**: $M \ge 5$ meals or $0.20 \le CV < 0.35$.
- **Low Confidence**: $M < 5$ meals or high attendance dispersion.

---

## 5. Explainable AI & Privacy Boundaries

MessMind incorporates an explainability layer to convert complex statistical factors into concise, 1–2 sentence operational summaries for kitchen managers.

### Amazon Bedrock Converse API (Full-Stack Mode)
In full-stack mode, MessMind can invoke Amazon Bedrock using the Converse API (`@aws-sdk/client-bedrock-runtime`).
- **Strict Privacy Guarantee**: **Zero resident PII is ever transmitted to AWS.** Names, resident codes, room numbers, and individual attendance histories are never sent.
- **Aggregate Payload Only**: Bedrock receives solely anonymized population-level rates:
  ```json
  {
    "meal": "Saturday DINNER (Vegetable Biryani Special)",
    "expected_diners": 90,
    "historical_baseline": 86,
    "personal_history_factor": 71,
    "day_of_week_factor": 71,
    "recent_attendance_trend": 72,
    "preference_intention_factor": 75,
    "menu_adjustment": 3,
    "confidence": "HIGH",
    "cv": 4.4
  }
  ```
- **Caching**: Generated explanations are cached in the PostgreSQL `predictions` table to prevent redundant API calls.

### Pure Deterministic Browser Explainer (Static Demo Mode)
In static demo mode and whenever Bedrock is unconfigured or unreachable, MessMind automatically uses its **deterministic template explainer** (`src/modules/ai/deterministic-explainer.ts`).
- Generates professional, driver-focused summaries (e.g., *"Demand is expected to be 90 diners, slightly above the historical baseline of 86. Recent attendance momentum, current meal preferences and historical menu popularity are contributing to the increase."*).
- **Makes zero external network calls, requires zero cloud credentials, and executes in 0.04ms.**

---

## 6. Synthetic Data & Simulation Disclosures

To maintain academic and professional transparency, all demonstration figures are synthetic:

> **SIMULATION NOTICE**<br />
> All resident records, attendance histories, scan timestamps, and waste audits represent a **synthetic demonstration dataset**. They do not reflect real-world individuals, physical hostel facilities, or actual student populations.

### Verified Benchmark Data

| Benchmark Metric | Canonical Value | Operational Definition |
| :--- | :---: | :--- |
| **Synthetic Residents** | **125** | Total registered residents in hostel directory |
| **Resident Breakdown** | **50 Students / 75 Corporate** | Two distinct behavioral archetypes |
| **Historical Evaluation Window** | **90 Days** | Duration of historical learning records |
| **Evaluated Historical Meals** | **205 Meals** | Complete historical dataset used for accuracy evaluation |
| **Displayed Timeline Entries** | **21 Meals** | Active 7-day operational schedule visible in timeline |
| **Target Saturday Dinner Forecast** | **90 Diners** | Sum of individual attendance probabilities ($\sum P(R_i)$) |
| **Target Recommended Preparation** | **95 Servings** | Expected diners (90) + 5% default safety buffer |
| **Target Historical Baseline** | **86 Diners** | 12-week historical average for Saturday Dinner |
| **Model Accuracy (MAPE)** | **4.2%** | Mean Absolute Percentage Error across 205 evaluated meals |
| **Accuracy Within $\pm 5\%$** | **92.5%** | Percentage of services where error was $\le 5\%$ |
| **Average Physical Food Waste** | **2.6%** | Discarded food waste verified by physical kitchen audits |
| **Saturday Dinner Physical Waste** | **2.8%** | 12-week average physical waste for comparable Saturday Dinners |
| **Average Unconsumed Leftovers** | **5.6%** | Unserved portions remaining in kitchen vessels |

### In-Memory State Persistence
- **Client Role Selector**: Selected role (`MESS_MANAGER` or `HOSTEL_ADMIN`) is saved in browser `localStorage` (`messmind_demo_role`).
- **Simulation State**: Simulated entrance scans (99 check-ins), safety buffer overrides, and logged kitchen waste audits are managed in-memory via React external stores (`useSyncExternalStore`). **They reside solely within the active browser session and reset to initial benchmark values upon browser page reload.**

---

## 7. Local Development Instructions

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- *(Optional for Full-Stack Mode)*: Docker or a local PostgreSQL 16 instance

---

### Option A: Static Demo Mode (Zero Database Required)
Run the complete interactive demo locally without PostgreSQL, Prisma, Docker, or AWS credentials:

```bash
# 1. Clone the repository
git clone https://github.com/MohdUmair015/MessMind.git
cd MessMind

# 2. Install dependencies from lockfile
npm ci

# 3. Generate Prisma client types (needed for TypeScript compilation)
npx prisma generate

# 4. Start the demo development server
npm run dev:demo
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. The server automatically routes requests to `/MessMind/`.

---

### Option B: Full-Stack Mode (PostgreSQL + Prisma)
Run the full-stack version with persistent database storage and server actions:

```bash
# 1. Start local PostgreSQL via Docker Compose
docker compose up -d

# 2. Configure environment variables
cp .env.example .env
# Edit .env and ensure DATABASE_URL matches your PostgreSQL credentials:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/messmind?schema=public"

# 3. Push schema to database
npm run db:push

# 4. Seed 90-day synthetic dataset (125 residents, 205 meals)
npm run db:seed

# 5. Start standard development server
npm run dev
```

---

## 8. Automated Testing & Verification

MessMind maintains a comprehensive automated test suite.

### 1. Zero-Database Demo Regression Suite (60 Tests)
To execute the database-independent verification suite:

```bash
npm run test:demo
```

This executes **60 automated tests** across three core modules:
- `src/modules/prediction/__tests__/deterministic-engine.test.ts` (**11 tests**): Validates attendance probability weights, bounded multipliers, sparse fallback hierarchies, dynamic CV calculation, and deterministic repeatability.
- `src/modules/demo-data/__tests__/demo-data.test.ts` (**35 tests**): Validates snapshot benchmark values, pure deterministic engine execution, dependency isolation (zero database imports), read APIs, and mathematical parity with the original database engine.
- `src/modules/demo/__tests__/demo-simulation.test.ts` (**14 tests**): Validates in-memory simulation controller, scan ingestion, safety buffer recalculations, domain outcome form validation, truthful scanner indicators, and static export redirect safety.

### 2. Full Test Suite (Full-Stack Integration)
```bash
# Runs all unit and database integration tests (requires running PostgreSQL)
npm test
```

### 3. TypeScript Type Safety Check
```bash
npx tsc --noEmit
```

### 4. Static Production Build Verification
```bash
npm run build:static
```

---

## 9. GitHub Pages Static Build & CI/CD Pipeline

The static demonstration build for GitHub Pages is configured in Next.js and automated via GitHub Actions:

- **Next.js Configuration**: Configured with `output: "export"`, `basePath: "/MessMind"`, and `trailingSlash: true` when `NEXT_PUBLIC_DEMO_MODE=true`.
- **Pre-Rendered Output**: Generates **30 static HTML pages** into `./out/` (including all 21 meal routes and a branded `404.html`).
- **Zero Redirect Dependency**: In static export mode, server-side redirects are omitted entirely to prevent runtime 404s on static CDNs.

### GitHub Actions Workflow (`.github/workflows/static-demo.yml`)
> **Workflow Presence Notice**:<br />
> The workflow file `.github/workflows/static-demo.yml` is currently prepared and verified in the **local working tree** (uncommitted). It is **not yet present on `origin/main`**, meaning GitHub is not currently executing these jobs remotely. Once committed and pushed in a future publication step, it will operate according to the following design:

1. **Automated Build & Verify Job (`build`)**: Runs on every `push` and `pull_request` to `main`. It installs dependencies (`npm ci`), runs all 60 regression tests, executes `npm run build:static`, validates the `./out` artifact, and uploads a downloadable inspection artifact (`messmind-static-build`). **Zero deployment is performed automatically on code changes.**
2. **Manual Deploy Job (`deploy`)**: Dormant by default. Runs **only when manually dispatched** through GitHub Actions with `deploy: true` after the workflow is pushed to the remote repository and repository settings (GitHub Actions as Pages source) are configured by an administrator.

---

## 10. Database Schema & Full-Stack Reference

In full-stack mode, data is modeled via Prisma (`prisma/schema.prisma`):

```text
┌──────────────┐       1:N       ┌────────────────┐       N:1       ┌──────────────┐
│   Resident   │────────────────<│ MealPreference │>────────────────│     Meal     │
└──────┬───────┘                 └────────────────┘                 └──────┬───────┘
       │                                                                   │
       │ 1:N                     ┌────────────────┐                        │ 1:1
       └────────────────────────<│    MealScan    │>───────────────────────┤
                                 └────────────────┘                        │
                                                                           ├─ 1:1 ── [ Prediction ]
                                                                           ├─ 1:1 ── [ MealOutcome ]
                                                                           └─ N:1 ── [ Menu ]
```

- **`Resident`**: Tracks resident code, type (`STUDENT`, `CORPORATE`), and status (`ACTIVE`, `INACTIVE`, `ON_LEAVE`).
- **`Menu`**: Meal offerings with category and JSON array of dishes.
- **`Meal`**: Scheduled service by date and type (`BREAKFAST`, `LUNCH`, `DINNER`).
- **`MealPreference`**: Pre-meal resident opt-ins (`REGULAR`, `OPT_OUT`, etc.) used as intention signals.
- **`MealScan`**: Authoritative timestamped physical scan check-ins captured at dining entrance.
- **`MealOutcome`**: Verified kitchen metrics: prepared servings, actual attendees, remaining portions, and discarded food waste.
- **`Prediction`**: Predicted diners, recommended servings, waste risk (`LOW`, `MEDIUM`, `HIGH`), confidence rating, JSON prediction factors, and cached explanation text.
- **`PredictionSetting`**: Configurable buffer percentage (default 5%) and risk thresholds.
- **`AuditLog`**: Immutable server-side audit trail for administrative actions and sync events.

---

## 11. License & Project Disclosures

- **Project Status**: Academic and technical demonstration prototype.
- **Production Readiness**: This repository is designed to demonstrate predictive kitchen intelligence, explainable forecasting, and closed-loop learning. Deploying to real-world commercial kitchens requires integration with authorized hostel dining hardware, certified food-safety recording protocols, and local infrastructure provisioning.
- **Licensing Status**: No standalone repository license is currently provided. You should not assume permission to reuse, modify, or redistribute this project's original materials. Third-party dependencies remain subject to their respective licenses.
