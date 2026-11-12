# MessMind GitHub Pages Static Demo — Deployment & Build Verification Guide

This document describes the architecture, local build procedures, simulation boundaries, and CI/CD workflow configuration for the static export of MessMind targeted for GitHub Pages.

---

## 1. Static Demo Overview & Publication Status

MessMind's static demo mode is a zero-database, browser-safe pre-rendered static export of the MessMind hostel mess demand intelligence dashboard. It allows evaluators, judges, and developers to experience the complete predictive kitchen workflow, explainable demand forecasts, scanner reconciliation simulation, and analytics reporting without requiring:
* A running PostgreSQL database instance
* Docker containers or local background daemons
* AWS credentials or an active Amazon Bedrock connection
* Node.js server component runtime or Next.js Server Actions execution

When compiled with `NEXT_PUBLIC_DEMO_MODE=true`, Next.js exports standard static HTML, CSS, client-side JavaScript bundles, and pre-rendered JSON payloads into the `out/` directory, configured with the base path `/MessMind/`.

### Deployment Target & Current Publication Status
```text
https://mohdumair015.github.io/MessMind/
```
> **IMPORTANT PUBLICATION & WORKFLOW STATUS NOTICE**<br />
> * **Deployment Status**: **NOT DEPLOYED / BUILD-VERIFIED ONLY.**<br />
>   The URL above represents the configured **intended deployment target** on GitHub Pages. The static demonstration is **not currently published or live** on the web.<br />
> * **Workflow Status**: **LOCAL WORKING TREE ONLY.**<br />
>   The workflow file `.github/workflows/static-demo.yml` is currently prepared in the local workspace as an untracked file and has **not yet been committed or pushed to `origin/main`**. GitHub is not currently executing CI runs or deployment actions. The manual deployment path described in this document is configured locally but will only become available on GitHub after the workflow is committed, pushed, and repository settings are enabled.

---

## 2. Feature Matrix: Static Demo vs. Full-Stack Production

| Capability | Static Demo Mode (GitHub Pages Target) | Full-Stack Production Mode |
| :--- | :--- | :--- |
| **Execution Environment** | Client browser CDN (Static Export) | Node.js Server Runtime (Next.js App Router) |
| **Current Deployment Status** | **Not Deployed** (Build-verified locally & in CI) | Local development / Self-hosted Node.js |
| **Visual Design & Layout** | Complete responsive UI with warm design system | Identical |
| **Target Saturday Dinner Forecast** | 90 expected diners, 95 prep, 86 baseline | Computed from PostgreSQL records |
| **Prediction Engine** | Dynamic execution via `PureDeterministicPredictionEngine` | Deterministic engine with Prisma DB queries |
| **Safety Buffer Recalculation** | Interactive (0%, 5%, 8%, 10%, 15%) in browser | Recalculated and persisted to PostgreSQL |
| **Prediction Explanation** | Deterministic browser-safe fallback explainer | Amazon Bedrock Converse API with fallback |
| **Dining Scanner Attendance** | In-memory simulation (99 check-ins, +9 variance) | Real-time sync from hostel scanner feed |
| **Kitchen Outcome Recording** | In-browser validation and session logging | Persistent audit write to PostgreSQL |
| **Operations Timeline** | 21 canonical scheduled and historical meals | Dynamic database-queried timeline |
| **Historical Analytics** | 205 evaluated meals, 4.2% MAPE, 92.5% tolerance | Aggregated live PostgreSQL outcomes |
| **Role Selector** | Client preview toggle (`MESS_MANAGER` / `HOSTEL_ADMIN`) | Server-enforced session authorization |
| **Health Check Endpoint** | Pre-rendered static JSON artifact | Dynamic route handler checking DB status |

---

## 3. Explicit Simulation Disclosures

To maintain absolute transparency, the static demo clearly delineates simulated interactions from live backend services:
1. **Dining Hall Scanner**: The "Simulate Scans (99)" and "Reconcile Demo Scans" buttons simulate the arrival and reconciliation of 99 resident check-in scans using in-memory React state (`useSyncExternalStore`). No live physical QR scanner, external hostel application, or socket feed is contacted.
2. **Kitchen Waste Audits**: Submitting the post-meal outcome form validates and records data strictly within the user's active browser session. Data is **not** written to a server or persistent database and will reset upon page reload.
3. **AI Demand Explanations**: Explanations are generated deterministically by the pure fallback template engine using the five weighted factors and contextual adjustments. **Amazon Bedrock is not active in the static demo**, and no AWS SDK network calls are made.
4. **Health Check Endpoint (`/api/health`)**: The static export generates a static JSON payload indicating `mode: "static_demo"`. It is a build artifact, not an active server health probe.
5. **Role Selector**: The role switcher in the header is a client-side presentation preview tool (persisted via browser `localStorage`) and does not provide authentication or secure authorization.

---

## 4. Local Build & Verification

### Prerequisites
* **Node.js**: 20.x or higher
* **npm**: 10.x or higher

### Local Development Commands

```bash
# 1. Clean install dependencies from lockfile
npm ci

# 2. Generate Prisma client types (required for TypeScript compilation)
npx prisma generate

# 3. Start local demo development server
npm run dev:demo
# Server starts at http://localhost:3000/ (auto-redirecting to /MessMind/)
```

### Verification & Build Commands

```bash
# Execute the 60 standalone zero-database regression tests
npm run test:demo

# Verify TypeScript type safety
npx tsc --noEmit

# Compile the static production export for GitHub Pages
npm run build:static
```

### Inspecting the Generated `out/` Directory
The static export emits 30 static pages into `out/`:
```text
out/
├── index.html                                 # Operations Overview / Decision Center
├── 404.html                                   # Branded GitHub Pages 404 handler
├── api/
│   └── health                                 # Pre-rendered static demo payload (JSON)
├── admin/
│   └── index.html                             # Administration Preview & Cohorts
├── analytics/
│   └── index.html                             # Accuracy & Food Waste Analytics
├── predictions/
│   └── index.html                             # Prediction Factor Architecture
└── meals/
    ├── index.html                             # Operations Timeline (All 21 services)
    ├── meal-target-saturday-dinner/
    │   └── index.html                         # Target Saturday Dinner benchmark
    └── meal-hist-01/ through meal-hist-20/
        └── index.html                         # 20 historical audited meals
```

To verify asset paths and link integrity locally:
```bash
# Verify all script and stylesheet references start with /MessMind/
grep -o '/MessMind/[^"'"'"' >]*' out/index.html | head -n 15

# Verify zero root-relative asset bypasses
grep -o 'href="/[^M][^"]*"' out/index.html || echo "All links properly use /MessMind/ prefix."
```

### Next.js Phase-Aware Redirect Configuration
Next.js static export (`output: "export"`) does not support server-side HTTP redirects on static CDNs. In `next.config.ts`, MessMind distinguishes execution phases:
- **`PHASE_DEVELOPMENT_SERVER` (`npm run dev:demo`)**: Includes convenient `basePath: false` redirects from `/`, `/meals`, `/predictions`, etc., to `/MessMind/...` so developers navigating to `http://localhost:3000/` are routed seamlessly.
- **`PHASE_PRODUCTION_BUILD` (`npm run build:static`)**: Omits redirects entirely. This prevents Next.js static export warnings and guarantees that GitHub Pages relies strictly on direct static file paths (`/MessMind/`, `/MessMind/meals/`, etc.) without server redirect dependencies.

---

## 5. GitHub Actions Workflow Behavior (`.github/workflows/static-demo.yml`)

> **Local vs. Remote Workflow State**:<br />
> The workflow file [`.github/workflows/static-demo.yml`](.github/workflows/static-demo.yml) is currently prepared in the local workspace and verified via local build tests. It is **not yet present on the remote GitHub repository (`origin/main`)**, so remote execution has not yet run. When committed and pushed in a future deployment phase, the workflow implements a strict build-and-test verification pipeline:

### 1. Automated Build & Verification Pipeline (`build` Job)
* **Triggered by**: Every `push` to `main`, every `pull_request` to `main`, and manual `workflow_dispatch`.
* **Deployment Behavior**: **Zero deployment is performed.** Pushes and pull requests execute build verification only.
* **Verification Steps Executed**:
  1. Checks out repository source code (`actions/checkout@v4`).
  2. Sets up Node.js 20 with npm caching (`actions/setup-node@v4`).
  3. Installs exact dependencies from lockfile (`npm ci`).
  4. Generates Prisma client types for type checking (`npx prisma generate`).
  5. Runs all 60 automated standalone regression tests (`npm run test:demo`).
  6. Compiles the static export with `NEXT_PUBLIC_DEMO_MODE=true` (`npm run build`).
  7. Audits the `./out` directory to verify all 30 canonical route files and index files exist.
  8. Packages and uploads `messmind-static-build` as a downloadable inspection artifact via `actions/upload-artifact@v4` (retained for 7 days).
  9. Packages the GitHub Pages deployment artifact via `actions/upload-pages-artifact@v3` **only** if manually triggered with `deploy == true`.

### 2. Manual Deployment Job (`deploy` Job)
* **Default State**: **Dormant.** Normal commits and pull requests never trigger deployment.
* **Execution Trigger**: Can only execute when manually dispatched through the GitHub Actions web interface via `workflow_dispatch` with the input `deploy: true`.
* **Prerequisites**: Requires repository settings to be pre-configured by an administrator (see Section 6 below).
* **Action**: Consumes the verified artifact from the `build` job and deploys via `actions/deploy-pages@v4` to the `github-pages` environment.

---

## 6. Required GitHub Repository Configuration Before Any Future Deployment

The workflow alone cannot publish or deploy to GitHub Pages without explicit repository configuration and publication:

1. **Commit & Push Workflow File**:
   - The workflow file `.github/workflows/static-demo.yml` must first be committed and pushed to the `main` branch of the remote repository before GitHub Actions will recognize or display it in the Actions tab.
2. **Configure GitHub Pages Source**:
   - Navigate to repository **Settings** $\to$ **Pages**.
   - Under **Build and deployment** $\to$ **Source**, select **"GitHub Actions"** (do NOT choose "Deploy from a branch").
3. **Environment Protection Rules (Optional Governance)**:
   - Navigate to repository **Settings** $\to$ **Environments**.
   - Under the `github-pages` environment, administrators can optionally configure **"Required reviewers"** to require manual sign-off before the deployment step runs.
   - *Technical Note*: GitHub Actions workflow YAML cannot enforce interactive reviewer approvals without this external repository environment setting.
4. **Triggering Manual Deployment**:
   - Once pushed and configured, navigate to **Actions** $\to$ **Build & Deploy Static Demo**.
   - Click **Run workflow**, select branch `main`, check `Deploy verified static build to GitHub Pages` (`true`), and click **Run workflow**.

---

## 7. Limitations of Static Hosting

1. **No Runtime Node.js Server**: GitHub Pages serves static files over a CDN. Server-side rendering (SSR), dynamic Route Handlers reading request headers/cookies, and Next.js Server Actions cannot execute.
2. **Session-Only Mutability**: Interactive state modifications (simulated scans, logged waste audits, updated buffer calculations) reside in client-side React Context (`useSyncExternalStore`) and will reset to initial canonical benchmark values upon browser page reload.
3. **Dual-Mode Preservation**: The full-stack application code remains completely intact. To run the full-stack version with live PostgreSQL and Amazon Bedrock, run `npm run dev` with `NEXT_PUBLIC_DEMO_MODE=false` alongside a configured `.env` file and PostgreSQL database.
