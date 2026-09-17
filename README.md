# MessMind | Hostel Food-Demand Intelligence

> **DEMO ENVIRONMENT DISCLAIMER**  
> **Demo environment — simulated data.**  
> The prototype operates using a synthetic population of **125 simulated residents** (50 student residents and 75 corporate residents) and generated historical logs. These figures are for demonstration purposes and do NOT represent actual hostel residents.

---

## 1. Overview & Problem Statement

In modern student and corporate hostels, the existing resident application manages menus, food preferences, and dining scan logs when residents actually eat. However, the kitchen staff must decide **how much food to prepare hours BEFORE the meal service**. 

Existing hostel software tells management what *already happened*.  
**MessMind provides an intelligence layer that predicts what is *likely to happen*.**

MessMind computes:
1. **Expected Diners** (Sum of individual attendance probabilities)
2. **Recommended Food Preparation** (Calculated with a configurable buffer, default 5%)
3. **Waste Risk Level** (Low, Medium, High based on preparation-vs-demand gaps)
4. **Prediction Confidence** (High, Medium, Low with historical comparison context)
5. **Manager-Friendly Explanations** (Via Gemini API using strictly anonymized aggregated factors)

Post-meal, actual kitchen preparation and consumption logs are recorded to establish an active learning loop:
$$\text{PREDICT} \longrightarrow \text{PREPARE} \longrightarrow \text{OBSERVE} \longrightarrow \text{LEARN}$$

MessMind does **not** replace the existing hostel application. It is a management-side intelligence module designed to ingest data from and integrate with existing hostel platforms.

---

## 2. Technology Stack

- **Frontend & App Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS (with Deep Navy `#0B192C` and Mint/Teal `#0D9488` palette matching the existing hostel application ecosystem)
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Database**: PostgreSQL / Amazon RDS
- **ORM & Data Access**: Prisma ORM
- **Backend Architecture**: Modular Monolith via Next.js Server Actions & API Route Handlers
- **AI Explanation Layer**: Google Gemini API (Natural language explanation and manager insights only; never used for numerical prediction)
- **Target Deployment Platform**: AWS Amplify (Hosting) + Amazon RDS for PostgreSQL

---

## 3. Architecture

MessMind is structured as a **modular monolith** to provide maintainability and clean domain boundaries without the operational overhead of microservices, Kubernetes, Kafka, or distributed queues:

```
[Existing Hostel App] (External/Mock)
          │  (Preferences, Scans, Menus)
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   MessMind Modular Monolith                 │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 Next.js App Router (UI)             │   │
│   │   - Dashboard (Next meal, prep recommendation)      │   │
│   │   - Predictions (Probability breakdown & factors)   │   │
│   │   - Meals (Schedule & Outcome feedback recording)   │   │
│   │   - Analytics (Accuracy, demand & waste metrics)    │   │
│   │   - Admin (Cohorts, menus, settings, audit logs)    │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │               Server-Side Modules                   │   │
│   │                                                     │   │
│   │   ┌────────────────────────┐  ┌─────────────────┐   │   │
│   │   │   Prediction Engine    │  │   Gemini API    │   │   │
│   │   │ (Deterministic Engine) │  │  (NL Explainer) │   │   │
│   │   └───────────┬────────────┘  └────────┬────────┘   │   │
│   │               │                        │            │   │
│   │   ┌───────────▼────────────────────────▼────────┐   │   │
│   │   │           Domain & Security Layer           │   │   │
│   │   │       (RBAC server validation, Auditing)    │   │   │
│   │   └───────────────────────┬─────────────────────┘   │   │
│   └───────────────────────────┼─────────────────────────┘   │
│                               │                             │
│   ┌───────────────────────────▼─────────────────────────┐   │
│   │                   Prisma ORM Client                 │   │
│   └───────────────────────────┬─────────────────────────┘   │
└───────────────────────────────┼─────────────────────────────┘
                                ▼
              PostgreSQL / Amazon RDS (AWS Target)
```

---

## 4. Database Structure

The database schema (`prisma/schema.prisma`) models the core entities:

- **`Resident`**: Tracks `resident_code`, `resident_type` (`STUDENT`, `CORPORATE`), and status.
- **`Menu`**: Meal offerings with category and JSON item list.
- **`Meal`**: Scheduled meal by `meal_date` and `meal_type` (`BREAKFAST`, `LUNCH`, `DINNER`). Note: Lunch is served on weekends and holidays only.
- **`MealPreference`**: Flexible resident meal selection identifier (`selected_option` supports arbitrary meal options, not just binary opt-in/opt-out).
- **`MealScan`**: Physical attendance records captured at dining entry.
- **`MealOutcome`**: Actual kitchen preparation, diner attendance, leftovers, and wasted servings.
- **`Prediction`**: Predicted diners, recommended servings, waste risk (`LOW`, `MEDIUM`, `HIGH`), confidence rating, and structured JSON prediction factors.
- **`PredictionSetting`**: Configurable buffer percentage (default 5%) and waste risk thresholds.
- **`AuditLog`**: Server-side audit trail for administrative updates and outcome logging.

---

## 5. Prediction Methodology

The prediction engine is strictly **deterministic and data-driven**. 

1. **Individual Attendance Probabilities**:
   For each eligible resident, an attendance probability $P(R_i)$ is computed using established weights:
   - **Personal Historical Attendance**: 40%
   - **Day-of-Week Pattern**: 20%
   - **Meal-Type Pattern**: 15%
   - **Recent Trend (Last 2–3 weeks)**: 15%
   - **Current Preference Signal**: 10%

2. **Bounded Adjustments**:
   - Menu appeal impact is clamped to $\pm 10\%$.
   - Short-term macro attendance trends are clamped to $\pm 10\%$.

3. **Sparse-Data Fallback Hierarchy**:
   When new residents or new menus lack deep history, the engine falls back in order:
   $$\text{Resident + Day + Meal + Menu} \longrightarrow \text{Resident + Day + Meal} \longrightarrow \text{Resident + Meal} \longrightarrow \text{Comparable Population Baseline}$$

4. **Aggregation & Recommendation**:
   $$\text{Expected Diners} = \sum_{i=1}^{N} P(R_i)$$
   $$\text{Recommended Servings} = \lceil \text{Expected Diners} \times (1 + \text{Buffer}) \rceil \quad (\text{Default buffer} = 5\%)$$

---

## 6. Gemini's Role & Privacy Safeguards

- **Gemini is NOT used for numerical prediction.** All numbers and buffer recommendations are calculated deterministically.
- **Role**: Translating structured, aggregated factors into concise, manager-friendly explanations (e.g., explaining why a Saturday dinner has higher demand due to Biryani menu appeal and corporate resident weekend leave patterns).
- **Privacy Invariant**:
  Under no circumstances is resident PII transmitted to Gemini. The payload is strictly limited to aggregated metrics:
  ```json
  {
    "expected_diners": 101,
    "historical_average": 94,
    "recent_average": 99,
    "preference_signal": "+4%",
    "menu_signal": "+2%",
    "day": "Saturday",
    "meal": "Dinner"
  }
  ```

---

## 7. Security & Role-Based Authorization

1. **Server-Side Enforcement**: The frontend role switch (`MESS_MANAGER` vs `HOSTEL_ADMIN`) is strictly a demo/development preview mechanism. All protected server actions and API routes enforce authorization server-side via `requireServerRole()`.
2. **Student Isolation**: Students have zero access to MessMind management dashboards; they continue interacting solely with the resident hostel app.
3. **Database Security**: Direct database connections are restricted to server-side code through Prisma.
4. **Audit Logging**: Sensitive actions (outcome recording, algorithm parameter adjustments) are logged to the `audit_logs` table.
5. **Secrets Management**: Credentials (`DATABASE_URL`, `GEMINI_API_KEY`, `AUTH_SECRET`) are managed via environment variables in development and AWS Secrets Manager / Amplify Console in production.

---

## 8. Local Development Setup

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)
- Docker (optional, for local PostgreSQL)

### Installation
1. Clone the repository and install dependencies:
   ```bash
   git init
   npm install
   ```
2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
3. (Optional) Launch local PostgreSQL container:
   ```bash
   docker compose up -d
   ```
4. Generate the Prisma Client:
   ```bash
   npm run db:generate
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to access MessMind.

---

## 9. Current Implementation Status vs Production Roadmap

| Component | Current Status (Phase 1 Foundation) | Production Target |
| :--- | :--- | :--- |
| **Architecture** | Modular Monolith established | Modular Monolith on AWS Amplify |
| **Database Schema** | Prisma PostgreSQL models defined | Amazon RDS for PostgreSQL |
| **Application Shell** | Responsive layout, theme, demo banners | Production responsive UI |
| **Routes** | Dashboard, Predictions, Meals, Meal Detail, Analytics, Admin | Full feature interactive workflows |
| **Auth System** | Abstract server-side check with demo selector | AWS Cognito / NextAuth JWT |
| **Prediction Engine** | Typed contracts & interfaces (`src/modules/prediction`) | Deterministic calculation engine & tests (Phase 2) |
| **AI Explanation** | Interface & prompt contract (`src/modules/gemini`) | Server-side Gemini API integration (Phase 2) |
| **Demo Data** | Synthetic resident model (125 residents) | Synthetic multi-month seed script (Phase 2) |

---

## 10. AWS Deployment Guide (Target Architecture)

1. **Compute & Frontend**: Deploy the Next.js application to **AWS Amplify Hosting** via GitHub continuous integration.
2. **Database**: Provision **Amazon RDS for PostgreSQL** (db.t4g.micro for cost-efficient staging/production).
3. **Environment Configuration**: Set `DATABASE_URL`, `GEMINI_API_KEY`, and `AUTH_SECRET` in the AWS Amplify App Settings environment variables.
4. **Build Settings**: Configure `amplify.yml` to run `npx prisma generate && npm run build`.
