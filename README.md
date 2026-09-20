# MessMind | Hostel Food-Demand Intelligence

> **DEMO ENVIRONMENT DISCLAIMER**  
> **Demo environment — simulated data.**  
> The prototype operates using a synthetic population of **125 simulated residents** (50 student residents and 75 corporate residents) and generated historical logs across a 90-day window. These figures are for demonstration purposes and do NOT represent actual hostel residents.

---

## 1. Overview & Problem Statement

In student and corporate hostel accommodations, kitchen teams must decide **how much food to cook hours BEFORE meal service begins**. 

Traditional hostel management software records dining hall entry logs when residents actually eat. However, this only tells management what *already happened*.
**MessMind provides a management-side intelligence layer that predicts what is *likely to happen*.**

MessMind provides kitchen managers with:
1. **Expected Diners**: Sum of individual resident attendance probabilities computed deterministically.
2. **Recommended Preparation**: Actionable cook volume incorporating a configurable safety buffer (default 5%).
3. **Waste Risk Classification**: Early detection of overpreparation risk (`LOW`, `MEDIUM`, `HIGH`) based on historical variance and leftover audits.
4. **Prediction Confidence Rating**: Dynamic confidence assessment using the empirical Coefficient of Variation (CV) from comparable historical services.
5. **Manager-Friendly Explanations**: Natural language operational summaries generated via **Amazon Bedrock** (using strictly anonymized aggregate factors with a deterministic fallback).

Post-meal, actual unique scanner attendance and physical kitchen waste audits are recorded to establish a closed learning loop:
$$\text{PREDICT} \longrightarrow \text{PREPARE} \longrightarrow \text{OBSERVE} \longrightarrow \text{RECONCILE} \longrightarrow \text{LEARN}$$

MessMind does **not** replace the existing hostel application. It is a management-side intelligence module designed to ingest data from and integrate with existing hostel platforms.

---

## 2. Technology Stack

- **Frontend & App Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS (Warm Ivory, Coral `#FF6B4A`, and Mint `#10B981` palette tailored for food operations)
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Database**: PostgreSQL / Amazon RDS
- **ORM & Data Access**: Prisma ORM
- **Backend Architecture**: Modular Monolith via Next.js Server Actions & API Route Handlers
- **AI Explanation Layer**: **Amazon Bedrock** (Converse API) using standard AWS credential provider chain (strictly for natural language explanation; never used for numerical prediction; equipped with deterministic fallback)
- **Target Deployment Platform**: AWS Amplify (Hosting) + Amazon RDS for PostgreSQL

---

## 3. Architecture & Integration Boundary

MessMind is structured as a **modular monolith** with a decoupled server-side integration boundary:

```
┌─────────────────────────────────────────────────────────────┐
│                    Existing Hostel App                      │
│      (Dining Scanner QR/RFID, Resident Preferences, Menus)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                IHostelMealDataProvider Interface
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
   SimulatedHostelMealDataProvider   FutureRealHostelAppProvider
   (Synthetic PostgreSQL Stand-In)   (mTLS/OAuth2 REST API Adapter)
                └──────────────┬──────────────┘
                               │ Normalized Domain DTOs
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   MessMind Modular Monolith                 │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 Next.js App Router (UI)             │   │
│   │   - Dashboard (Current service, prep guidance)      │   │
│   │   - Predictions (Probability breakdown & factors)   │   │
│   │   - Meals (Timeline schedule, scanner sync, audit)  │   │
│   │   - Analytics (Accuracy story, MAPE, surplus/waste) │   │
│   │   - Admin (Cohorts, algorithms, RBAC, audit policy) │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │               Server-Side Modules                   │   │
│   │                                                     │   │
│   │   ┌────────────────────────┐  ┌─────────────────┐   │   │
│   │   │   Prediction Engine    │  │ Amazon Bedrock  │   │   │
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
│   │   └───────────────────────┬─────────────────────────┘   │
└───────────────────────────────┼─────────────────────────────┘
                                ▼
              PostgreSQL / Amazon RDS (AWS Target)
```

### Data Feed Simulation Disclaimer
> **IMPORTANT ARCHITECTURAL NOTICE:**  
> For demonstration and local testing, the hostel application's data feed is simulated using synthetic PostgreSQL records. In production, the provider connects to authorized hostel dining hardware/APIs. We do NOT claim that a live production hostel API integration exists yet.

### Authoritative Attendance vs Food Waste Semantics
1. **Source of Truth for Attendance**:
   - `actualDiners` = Count of **unique resident meal scans** captured at dining entry.
   - Mess managers **never manually type attendance**.
   - If a resident scans multiple times, duplicates are automatically suppressed ($Set<ResidentId>$).
2. **Clear Separation of Semantics**:
   - **A. Predicted Demand**: Expected diners $\sum P(R_i)$.
   - **B. Recommended Preparation**: Expected diners $+ 5\%$ safety buffer.
   - **C. Attendance**: Actual unique meal scans recorded at dining entrance.
   - **D. Estimated Surplus**: $\text{Prepared Servings} - \text{Actual Scans}$ (when preparation is known).
   - **E. Physical Food Waste**: Only calculated when a physical kitchen audit or smart scale provides leftover/discarded measurements. **Meal scans alone are NEVER claimed to measure physical food waste.**

---

## 4. Database Structure

The database schema (`prisma/schema.prisma`) models the operational entities:

- **`Resident`**: Tracks `residentCode`, `residentType` (`STUDENT`, `CORPORATE`), and status.
- **`Menu`**: Meal offerings with category and item list.
- **`Meal`**: Scheduled meal by `mealDate` and `mealType` (`BREAKFAST`, `LUNCH`, `DINNER`).
- **`MealPreference`**: Resident pre-meal selections and opt-in indicators.
- **`MealScan`**: Timestamped physical scan events captured at dining entry.
- **`MealOutcome`**: Verified kitchen preparation, attendance count, remaining servings, and wasted servings.
- **`Prediction`**: Predicted diners, recommended servings, waste risk, confidence rating, structured JSON factors, and cached natural language explanations.
- **`PredictionSetting`**: Configurable buffer percentage (default 5%) and waste risk thresholds.
- **`AuditLog`**: Server-side audit trail for administrative updates, sync actions, and outcome logs.

---

## 5. Prediction Methodology

The prediction engine is strictly **deterministic and data-driven**. 

1. **Individual Attendance Probabilities**:
   For each active resident, an attendance probability $P(R_i)$ is computed using established weights:
   - **Personal Historical Attendance**: 40%
   - **Day-of-Week Pattern**: 20%
   - **Meal-Type Pattern**: 15%
   - **Recent Trend (Last 14 days)**: 15%
   - **Current Preference Signal**: 10%

2. **Bounded Adjustments**:
   - Menu appeal impact is clamped strictly to $[-10\%, +10\%]$.
   - Macro attendance trend drift is clamped strictly to $[-10\%, +10\%]$.

3. **Sparse-Data Fallback Hierarchy**:
   When residents lack deep history, the engine falls back gracefully:
   $$\text{Resident + Day + Meal + Menu} \longrightarrow \text{Resident + Day + Meal} \longrightarrow \text{Resident + Meal} \longrightarrow \text{Cohort Baseline}$$

4. **Aggregation & Recommendation**:
   $$\text{Expected Diners} = \sum_{i=1}^{N} P(R_i)$$
   $$\text{Recommended Servings} = \lceil \text{Expected Diners} \times (1 + \text{Buffer}) \rceil \quad (\text{Default buffer} = 5\%)$$

---

## 6. Amazon Bedrock Explanation Layer & Privacy

- **Bedrock is NEVER used for numerical prediction.** All numbers, diners, and buffer recommendations are calculated deterministically.
- **Role**: Translating structured, aggregated factors into concise 1-2 sentence manager-friendly explanations.
- **Converse API Integration**: Uses `@aws-sdk/client-bedrock-runtime` with standard credential provider chain (local AWS credentials or IAM execution roles).
- **Privacy Boundary**:
  Under no circumstances is resident PII transmitted to Bedrock. The payload is strictly limited to aggregated metrics:
  ```json
  {
    "expected_diners": 90,
    "historical_baseline": 86,
    "recent_attendance_rate": 0.72,
    "preference_intention_rate": 0.75,
    "menu_adjustment": 1,
    "trend_adjustment": 1,
    "confidence": "HIGH",
    "cv": 4.4,
    "meal_type": "DINNER",
    "day": "Saturday"
  }
  ```
- **Resilient Fallback**: If Bedrock is unconfigured, disabled, or unreachable, MessMind automatically generates a deterministic natural language explanation without degrading application functionality.
- **Explanation Caching**: Generated explanations are cached to PostgreSQL so repeated page loads do not invoke the Bedrock API unnecessarily.

---

## 7. Security & Role-Based Authorization

1. **Server-Side Enforcement**: The frontend role switch (`MESS_MANAGER` vs `HOSTEL_ADMIN`) is a development preview tool. All protected server actions and API routes enforce authorization server-side via `requireServerRole()`.
2. **Student Isolation**: Students have zero access to MessMind management dashboards; they interact solely with the resident hostel app.
3. **Client-Side Safety**: Zero AWS credentials, database secrets, or resident PII are exposed to client-side bundles.
4. **Audit Logging**: Sensitive actions (scanner sync, outcome recording, recalculation) are recorded to the `audit_logs` table.

---

## 8. Local Development Setup

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)
- PostgreSQL (local instance or Docker)

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
3. Generate the Prisma Client:
   ```bash
   npm run db:generate
   ```
4. Push database schema & seed synthetic demo dataset:
   ```bash
   npm run db:push
   npm run db:seed
   ```
5. Run unit & integration tests:
   ```bash
   npm test
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to access MessMind.

---

## 9. Current Implementation Status

| Component | Status | Details |
| :--- | :--- | :--- |
| **Architecture** | **Complete** | Modular monolith with typed domain modules and server actions |
| **Database Schema** | **Complete** | Full Prisma models for residents, meals, scans, outcomes, and audit logs |
| **Prediction Engine** | **Complete** | Deterministic 5-factor calculation with bounded multipliers and 47 tests |
| **Scanner Attendance** | **Complete** | Scanner integration abstraction with duplicate suppression and reconciliation |
| **AI Explanation** | **Complete** | Amazon Bedrock Converse API integration with deterministic fallback & caching |
| **Visual Interface** | **Complete** | 5 operational views with responsive layout and real-time scan simulation |
| **Demo Replay** | **Complete** | Non-destructive reset server action for deterministic showcase repeatability |

---

## 10. AWS Deployment Architecture (Production Target)

1. **Compute & Frontend**: Deploy the Next.js application to **AWS Amplify Hosting**.
2. **Database**: Provision **Amazon RDS for PostgreSQL**.
3. **AI Explanation**: Enable an Amazon Bedrock foundation model (e.g. `amazon.nova-micro-v1:0` or `anthropic.claude-3-haiku-20240307-v1:0`) in the AWS region.
4. **IAM Role**: Attach `bedrock:InvokeModel` permissions to the hosting compute environment execution role.

