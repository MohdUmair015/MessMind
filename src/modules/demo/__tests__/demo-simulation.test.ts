import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  DemoSimulationController,
  validateDemoOutcomeInput,
  calculateForecastErrorPercent,
  isStaticDemoMode,
  DemoRecordOutcomeInput,
} from "../index";
import { demoSnapshot, DEMO_TARGET_MEAL_ID } from "@/modules/demo-data";
import { purePredictionEngine } from "@/modules/prediction/pure-deterministic-engine";
import { DeterministicPredictionEngine } from "@/modules/prediction/deterministic-engine";
import { ExplanationService } from "@/modules/ai/explanation-service";

test("Phase 2 — Client Simulation Layer & Reactive State Adapter Test Suite", async (t) => {
  // 1. Initial State Verification
  await t.test("1. Initial state verification matches canonical benchmark pre-service state", () => {
    const controller = new DemoSimulationController(true);
    const state = controller.getState();

    assert.strictEqual(state.isDemoMode, true, "isDemoMode must be true when instantiated in demo mode");
    assert.strictEqual(state.targetMeal.id, DEMO_TARGET_MEAL_ID);
    assert.strictEqual(state.targetMeal.menu.name, "Vegetable Biryani Special");
    assert.strictEqual(state.targetMeal.isServed, false, "Initial meal isServed must be false");
    assert.strictEqual(state.targetMeal.outcome, null, "Initial meal outcome must be null");
    assert.strictEqual(state.targetMeal._count.scans, 0, "Initial meal scans count must be 0");

    assert.strictEqual(state.prediction.predictedDiners, 90, "Expected diners must be 90");
    assert.strictEqual(state.prediction.recommendedServings, 95, "Recommended servings must be 95 (5% buffer)");
    assert.strictEqual(state.prediction.predictionFactors.historicalBaselineDiners, 86, "Baseline must be 86");
    assert.strictEqual(state.prediction.wasteRisk, "LOW");
    assert.strictEqual(state.prediction.confidenceLevel, "HIGH");

    assert.strictEqual(state.scannerState.status, "awaiting", "Scanner status must be 'awaiting'");
    assert.strictEqual(state.scannerState.uniqueScansCount, 0, "Scanner scans count must be 0");
    assert.strictEqual(state.scannerState.duplicateScansCount, 0);
    assert.strictEqual(state.scannerState.lastSyncedAt, null);
    assert.strictEqual(state.scannerState.isSimulated, false);

    assert.strictEqual(state.lifecycleStage, "PREPARE", "Initial lifecycle stage must be 'PREPARE'");
    assert.strictEqual(state.currentBufferPercent, 5.0, "Initial buffer percent must be 5.0%");
    assert.strictEqual(state.activeRole, "MESS_MANAGER");
    assert.strictEqual(state.residents.length, 125, "Must have 125 synthetic residents");
    assert.strictEqual(state.analytics.totalOutcomesRecorded, 205, "Must reflect 205 evaluated meals");
  });

  // 2. Simulate Scans (99)
  await t.test("2. Simulate entrance scans (99) updates metrics, variance, and lifecycle stage", () => {
    const controller = new DemoSimulationController(true);

    const res = controller.simulateScans(99);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.scannedCount, 99);
    assert.strictEqual(res.variance, 9, "Variance must be +9 above forecast (99 - 90)");
    assert.strictEqual(res.percentOfForecast, 110, "Percent of forecast must be 110% (99 / 90 * 100)");
    assert.strictEqual(res.forecastError, 10.0, "Forecast error must be exactly 10.0%");
    assert.strictEqual(res.lifecycleStage, "OBSERVE", "Lifecycle stage must advance to 'OBSERVE'");

    const state = controller.getState();
    assert.strictEqual(state.scannerState.status, "simulated");
    assert.strictEqual(state.scannerState.uniqueScansCount, 99);
    assert.strictEqual(state.scannerState.duplicateScansCount, 1);
    assert.strictEqual(state.scannerState.isSimulated, true);
    assert.ok(state.scannerState.simulatedNotice?.includes("99 unique check-ins"));
    assert.ok(state.scannerState.lastSyncedAt !== null);

    assert.strictEqual(state.targetMeal._count.scans, 99, "Target meal scan count must be 99");
    assert.strictEqual(state.lifecycleStage, "OBSERVE", "Reactive lifecycle stage must be 'OBSERVE'");
    assert.ok(state.feedbackNotice?.includes("+9 above forecast"));
    assert.ok(state.feedbackNotice?.includes("10% forecast error") || state.feedbackNotice?.includes("10.0%"));
  });

  // 3. Reset After Simulated Scans
  await t.test("3. Reset simulation restores initial pre-service state deterministically", () => {
    const controller = new DemoSimulationController(true);

    // First simulate scans
    controller.simulateScans(99);
    assert.strictEqual(controller.getState().scannerState.uniqueScansCount, 99);
    assert.strictEqual(controller.getState().lifecycleStage, "OBSERVE");

    // Now reset
    controller.resetSimulation();
    const state = controller.getState();

    assert.strictEqual(state.scannerState.status, "awaiting");
    assert.strictEqual(state.scannerState.uniqueScansCount, 0);
    assert.strictEqual(state.scannerState.duplicateScansCount, 0);
    assert.strictEqual(state.scannerState.lastSyncedAt, null);
    assert.strictEqual(state.scannerState.isSimulated, false);

    assert.strictEqual(state.targetMeal.isServed, false);
    assert.strictEqual(state.targetMeal.outcome, null);
    assert.strictEqual(state.targetMeal._count.scans, 0);

    assert.strictEqual(state.prediction.predictedDiners, 90);
    assert.strictEqual(state.prediction.recommendedServings, 95);
    assert.strictEqual(state.currentBufferPercent, 5.0);
    assert.strictEqual(state.lifecycleStage, "PREPARE");
    assert.ok(state.feedbackNotice?.includes("Reset demo to initial pre-service state"));
  });

  // 4. Repeated Simulation Without Duplicate Scans (Idempotency)
  await t.test("4. Repeated simulation calls are idempotent and do not duplicate scans", () => {
    const controller = new DemoSimulationController(true);

    // Call simulateScans(99) 3 times consecutively
    controller.simulateScans(99);
    controller.simulateScans(99);
    const res = controller.simulateScans(99);

    assert.strictEqual(res.scannedCount, 99);
    assert.strictEqual(controller.getState().scannerState.uniqueScansCount, 99, "Must remain 99 unique scans");
    assert.strictEqual(controller.getState().targetMeal._count.scans, 99, "Meal scan count must remain 99");
    assert.strictEqual(controller.getState().scannerState.duplicateScansCount, 1, "Duplicate count must remain 1");
  });

  // 5. Simulated Scanner Refresh / Sync
  await t.test("5. Scanner refresh simulates synchronization without external network I/O", () => {
    const controller = new DemoSimulationController(true);

    // Sync before any scans arrive
    const preSync = controller.syncScanner();
    assert.strictEqual(preSync.success, true);
    assert.strictEqual(preSync.uniqueScansCount, 0);
    assert.ok(preSync.message.includes("0 scans recorded"));
    assert.strictEqual(controller.getState().scannerState.status, "awaiting");

    // Simulate scans, then sync
    controller.simulateScans(99);
    const postSync = controller.syncScanner();
    assert.strictEqual(postSync.success, true);
    assert.strictEqual(postSync.uniqueScansCount, 99);
    assert.ok(postSync.message.includes("99 unique scans verified"));
    assert.strictEqual(controller.getState().scannerState.status, "simulated");
    assert.ok(postSync.lastSyncedAt.length > 0);
  });

  // 6. Outcome Form Input Validation
  await t.test("6. Outcome form validation strictly enforces domain invariants", () => {
    // 6.1 Empty meal ID
    const r1 = validateDemoOutcomeInput({
      mealId: "",
      preparedServings: 100,
      actualDiners: 90,
      remainingServings: 10,
      wastedServings: 5,
    });
    assert.strictEqual(r1.valid, false);
    assert.ok(r1.errors.some((e) => e.includes("Meal ID is required")));

    // 6.2 Negative values
    const r2 = validateDemoOutcomeInput({
      mealId: "meal-1",
      preparedServings: -5,
      actualDiners: 90,
      remainingServings: 10,
      wastedServings: 5,
    });
    assert.strictEqual(r2.valid, false);
    assert.ok(r2.errors.some((e) => e.includes("Prepared servings must be a non-negative integer")));

    // 6.3 Non-integer values
    const r3 = validateDemoOutcomeInput({
      mealId: "meal-1",
      preparedServings: 100.5,
      actualDiners: 90,
      remainingServings: 10,
      wastedServings: 5,
    });
    assert.strictEqual(r3.valid, false);
    assert.ok(r3.errors.some((e) => e.includes("non-negative integer")));

    // 6.4 Actual diners > prepared servings
    const r4 = validateDemoOutcomeInput({
      mealId: "meal-1",
      preparedServings: 90,
      actualDiners: 99,
      remainingServings: 5,
      wastedServings: 2,
    });
    assert.strictEqual(r4.valid, false);
    assert.ok(r4.errors.some((e) => e.includes("cannot exceed prepared servings")));

    // 6.5 Remaining servings > prepared servings
    const r5 = validateDemoOutcomeInput({
      mealId: "meal-1",
      preparedServings: 100,
      actualDiners: 90,
      remainingServings: 105,
      wastedServings: 2,
    });
    assert.strictEqual(r5.valid, false);
    assert.ok(r5.errors.some((e) => e.includes("Remaining servings (105) cannot exceed prepared servings (100)")));

    // 6.6 Wasted servings > remaining servings
    const r6 = validateDemoOutcomeInput({
      mealId: "meal-1",
      preparedServings: 100,
      actualDiners: 90,
      remainingServings: 10,
      wastedServings: 15,
    });
    assert.strictEqual(r6.valid, false);
    assert.ok(r6.errors.some((e) => e.includes("Wasted servings (15) cannot exceed remaining unconsumed servings (10)")));

    // 6.7 Valid input
    const r7 = validateDemoOutcomeInput({
      mealId: "meal-1",
      preparedServings: 108,
      actualDiners: 99,
      remainingServings: 9,
      wastedServings: 4,
    });
    assert.strictEqual(r7.valid, true);
    assert.strictEqual(r7.errors.length, 0);
  });

  // 7. Separation of Leftover, Surplus, and Physical Waste
  await t.test("7. Separation of unconsumed leftovers, estimated surplus, and physical discarded waste", () => {
    const controller = new DemoSimulationController(true);

    const input: DemoRecordOutcomeInput = {
      mealId: DEMO_TARGET_MEAL_ID,
      preparedServings: 108,
      actualDiners: 99,
      remainingServings: 9,
      wastedServings: 4,
      isManualOverride: true,
    };

    const res = controller.recordOutcome(input);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.surplus, 9, "Estimated surplus must be 9 (108 prepared - 99 actual)");
    assert.strictEqual(res.forecastError, 10.0, "Forecast error must be 10.0% (|99 - 90| / 90 * 100)");

    const state = controller.getState();
    assert.strictEqual(state.targetMeal.isServed, true);
    assert.strictEqual(state.lifecycleStage, "LEARN", "Lifecycle stage must advance to 'LEARN'");

    const outcome = state.targetMeal.outcome;
    assert.ok(outcome !== null);
    assert.strictEqual(outcome?.preparedServings, 108);
    assert.strictEqual(outcome?.actualDiners, 99);
    assert.strictEqual(outcome?.remainingServings, 9, "Unconsumed leftovers is 9");
    assert.strictEqual(outcome?.wastedServings, 4, "Physical discarded waste is 4");
    assert.strictEqual(outcome?.estimatedSurplus, 9, "Surplus is 9");
    assert.strictEqual(outcome?.attendanceSource, "MANUAL_DEMO_OVERRIDE");

    // Verify missing attendance is NOT equated with physical food waste
    // If prepared = 108 and actual = 99, 9 portions were unconsumed. But physical waste discarded was only 4.
    assert.notStrictEqual(outcome?.wastedServings, outcome?.estimatedSurplus);
    assert.strictEqual(outcome?.wastedServings, 4);

    // Verify analytics summary updated
    assert.strictEqual(state.analytics.totalOutcomesRecorded, 206);
    assert.strictEqual(state.analytics.totalServingsPrepared, demoSnapshot.analytics.totalServingsPrepared + 108);
    assert.strictEqual(state.analytics.totalActualDinersServed, demoSnapshot.analytics.totalActualDinersServed + 99);
    assert.strictEqual(state.analytics.totalServingsWasted, demoSnapshot.analytics.totalServingsWasted + 4);
    assert.strictEqual(state.analytics.recentOutcomeComparisons[0].mealId, DEMO_TARGET_MEAL_ID);
    assert.strictEqual(state.analytics.recentOutcomeComparisons[0].errorPercent, 10.0);
  });

  // 8. Safety-Buffer Changes and Dynamic Recalculation
  await t.test("8. Safety-buffer adjustments recalculate recommended servings dynamically using Pure Deterministic Engine", () => {
    const controller = new DemoSimulationController(true);

    // Buffer: 0% -> recommended = 90
    const r0 = controller.recalculatePrediction(0);
    assert.strictEqual(r0.success, true);
    assert.strictEqual(r0.prediction.predictedDiners, 90, "Expected diners remains 90");
    assert.strictEqual(r0.prediction.recommendedServings, 90, "Recommended servings with 0% buffer is 90");
    assert.strictEqual(controller.getState().currentBufferPercent, 0);

    // Buffer: 5% (canonical recommended benchmark) -> recommended = 95
    const r5 = controller.recalculatePrediction(5);
    assert.strictEqual(r5.success, true);
    assert.strictEqual(r5.prediction.predictedDiners, 90, "Expected diners remains 90");
    assert.strictEqual(r5.prediction.recommendedServings, 95, "Recommended servings with 5% buffer is 95");
    assert.strictEqual(controller.getState().currentBufferPercent, 5);

    // Buffer: 8% -> recommended = 98 (90 * 1.08 = 97.2 -> 98)
    const r8 = controller.recalculatePrediction(8);
    assert.strictEqual(r8.success, true);
    assert.strictEqual(r8.prediction.predictedDiners, 90, "Expected diners remains 90");
    assert.strictEqual(r8.prediction.recommendedServings, 98, "Recommended servings with 8% buffer is 98");
    assert.strictEqual(controller.getState().currentBufferPercent, 8);

    // Buffer: 10% -> recommended = 99 (90 * 1.10 = 99)
    const r10 = controller.recalculatePrediction(10);
    assert.strictEqual(r10.success, true);
    assert.strictEqual(r10.prediction.predictedDiners, 90, "Expected diners remains 90");
    assert.strictEqual(r10.prediction.recommendedServings, 99, "Recommended servings with 10% buffer is 99");
    assert.strictEqual(controller.getState().currentBufferPercent, 10);

    // Buffer: 15% -> recommended = 104 (90 * 1.15 = 103.5 -> 104)
    const r15 = controller.recalculatePrediction(15);
    assert.strictEqual(r15.success, true);
    assert.strictEqual(r15.prediction.predictedDiners, 90, "Expected diners remains 90");
    assert.strictEqual(r15.prediction.recommendedServings, 104, "Recommended servings with 15% buffer is 104");
    assert.strictEqual(controller.getState().currentBufferPercent, 15);

    // Verify explanation generated deterministically
    assert.strictEqual(r15.prediction.explanationSource, "fallback");
    assert.ok(r15.prediction.explanation.includes("historical baseline of 86"));
    assert.ok(r15.prediction.explanation.includes("Recent attendance momentum"));
  });

  // 9. Shared State Consistency & Subscription Pattern
  await t.test("9. State changes trigger subscribers and maintain single source of truth", () => {
    const controller = new DemoSimulationController(true);

    let notifyCount = 0;
    const unsubscribe = controller.subscribe(() => {
      notifyCount++;
    });

    // 1. Simulate scans
    controller.simulateScans(99);
    assert.strictEqual(notifyCount, 1);
    assert.strictEqual(controller.getState().lifecycleStage, "OBSERVE");
    assert.strictEqual(controller.getState().targetMeal._count.scans, 99);

    // 2. Change role
    controller.setActiveRole("HOSTEL_ADMIN");
    assert.strictEqual(notifyCount, 2);
    assert.strictEqual(controller.getState().activeRole, "HOSTEL_ADMIN");

    // 3. Clear notice
    controller.clearFeedbackNotice();
    assert.strictEqual(notifyCount, 3);
    assert.strictEqual(controller.getState().feedbackNotice, null);

    // 4. Record outcome
    controller.recordOutcome({
      mealId: DEMO_TARGET_MEAL_ID,
      preparedServings: 108,
      actualDiners: 99,
      remainingServings: 9,
      wastedServings: 4,
    });
    assert.strictEqual(notifyCount, 4);
    assert.strictEqual(controller.getState().lifecycleStage, "LEARN");

    // 5. Unsubscribe
    unsubscribe();
    controller.resetSimulation();
    assert.strictEqual(notifyCount, 4, "Listener must not be notified after unsubscribing");
  });

  // 10. Static Demo Mode Never Invokes Server Actions (Static & Architectural Audit)
  await t.test("10. Static demo path contains zero imports of server actions, Prisma, or AWS SDK", () => {
    const demoDir = path.resolve(process.cwd(), "src/modules/demo");
    const demoFiles = fs.readdirSync(demoDir).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));

    const forbiddenPatterns = [
      /@prisma\/client/,
      /@aws-sdk/,
      /"use server"/,
      /'use server'/,
      /@\/app\/actions/,
      /server-actions/,
    ];

    for (const file of demoFiles) {
      const filePath = path.join(demoDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      for (const pattern of forbiddenPatterns) {
        assert.ok(
          !pattern.test(content),
          `File src/modules/demo/${file} must NOT contain forbidden dependency matching ${pattern}`
        );
      }
    }
  });

  // 11. Client Components Isolate Server Actions to Non-Demo Branches
  await t.test("11. Client components dynamically import server actions only in full-stack mode", () => {
    const clientComponentPaths = [
      "src/components/dashboard/LiveScannerWidget.tsx",
      "src/components/meals/SyncScannerButton.tsx",
      "src/components/meals/OutcomeRecordingForm.tsx",
      "src/components/predictions/RegeneratePredictionButton.tsx",
    ];

    for (const relPath of clientComponentPaths) {
      const absPath = path.resolve(process.cwd(), relPath);
      const content = fs.readFileSync(absPath, "utf-8");

      // Verify that static import of server actions is NOT present
      assert.ok(
        !content.includes('from "@/app/actions/meal-actions"'),
        `Component ${relPath} must NOT statically import from "@/app/actions/meal-actions"`
      );

      // Verify dynamic import is used
      assert.ok(
        content.includes('import("@/app/actions/meal-actions")'),
        `Component ${relPath} must use dynamic import for server actions`
      );

      // Verify demo branching is present
      assert.ok(
        content.includes("demo?.isDemoMode") || content.includes("demo.isDemoMode"),
        `Component ${relPath} must check demo?.isDemoMode before server action invocation`
      );
    }
  });

  // 12. Full-Stack Services and Actions Remain 100% Intact
  await t.test("12. Original full-stack services and inheritance relationships remain intact", () => {
    // DeterministicPredictionEngine extends PureDeterministicPredictionEngine
    const originalEngine = new DeterministicPredictionEngine();
    assert.ok(originalEngine instanceof DeterministicPredictionEngine);
    assert.strictEqual(typeof originalEngine.calculateDemand, "function");
    assert.strictEqual(typeof originalEngine.predictWithDatabase, "function");

    // Pure engine works independently
    assert.strictEqual(typeof purePredictionEngine.calculateDemand, "function");

    // ExplanationService preserves Bedrock SDK structure
    const explainer = new ExplanationService();
    assert.strictEqual(typeof explainer.generateExplanation, "function");

    // Calculation helper validation
    assert.strictEqual(calculateForecastErrorPercent(99, 90), 10.0);
    assert.strictEqual(calculateForecastErrorPercent(90, 90), 0.0);
    assert.strictEqual(calculateForecastErrorPercent(0, 0), 0.0);
  });

  // 13. Meals Timeline Filtering (All Services, Upcoming, Completed)
  await t.test("13. Meals timeline filtering correctly partitions services and preserves accurate counts", () => {
    const { demoSnapshot } = require("@/modules/demo-data");
    const allMeals = demoSnapshot.mealsTimeline;

    // Total count must be 21
    assert.strictEqual(allMeals.length, 21, "Total timeline meals must be 21");

    // Upcoming filter partitions
    const upcomingMeals = allMeals.filter((m: any) => !m.isServed);
    assert.strictEqual(upcomingMeals.length, 1, "Upcoming filter must contain exactly 1 meal");
    assert.strictEqual(upcomingMeals[0].id, DEMO_TARGET_MEAL_ID, "Upcoming meal must be target Saturday dinner");
    assert.strictEqual(upcomingMeals[0].isServed, false);

    // Completed filter partitions
    const completedMeals = allMeals.filter((m: any) => m.isServed);
    assert.strictEqual(completedMeals.length, 20, "Completed filter must contain exactly 20 historical meals");
    for (const m of completedMeals) {
      assert.strictEqual(m.isServed, true, `Meal ${m.id} in completed filter must be served`);
      assert.notStrictEqual(m.id, DEMO_TARGET_MEAL_ID, "Completed filter must not contain target upcoming meal");
    }

    // Disjoint partition check: upcoming + completed = all
    assert.strictEqual(
      upcomingMeals.length + completedMeals.length,
      allMeals.length,
      "Upcoming and completed partitions must sum to total meals"
    );

    // Verification of filter simulation function logic
    const filterTimeline = (filter: "all" | "upcoming" | "completed") => {
      const total = allMeals.length;
      const upCount = allMeals.filter((m: any) => !m.isServed).length;
      const compCount = allMeals.filter((m: any) => m.isServed).length;
      const visible =
        filter === "upcoming"
          ? allMeals.filter((m: any) => !m.isServed)
          : filter === "completed"
          ? allMeals.filter((m: any) => m.isServed)
          : allMeals;

      return { total, upCount, compCount, visibleCount: visible.length };
    };

    // Test All Services filter
    const allResult = filterTimeline("all");
    assert.strictEqual(allResult.total, 21);
    assert.strictEqual(allResult.upCount, 1);
    assert.strictEqual(allResult.compCount, 20);
    assert.strictEqual(allResult.visibleCount, 21);

    // Test Upcoming filter: visible changes to 1, tab counts stay 21, 1, 20
    const upResult = filterTimeline("upcoming");
    assert.strictEqual(upResult.total, 21);
    assert.strictEqual(upResult.upCount, 1);
    assert.strictEqual(upResult.compCount, 20);
    assert.strictEqual(upResult.visibleCount, 1);

    // Test Completed filter: visible changes to 20, tab counts stay 21, 1, 20
    const compResult = filterTimeline("completed");
    assert.strictEqual(compResult.total, 21);
    assert.strictEqual(compResult.upCount, 1);
    assert.strictEqual(compResult.compCount, 20);
    assert.strictEqual(compResult.visibleCount, 20);
  });

  // 14. Truthful Scanner Status, PostgreSQL Decoupling, and Static Export Redirect Safety
  await t.test("14. Scanner status is truthful and static export omits redirects without database leakage", () => {
    const sidebarPath = path.resolve(process.cwd(), "src/components/layout/AppSidebar.tsx");
    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

    // In demo mode: must communicate simulated feed and no live database
    assert.ok(sidebarContent.includes("Simulated Dining Scanner"), "Sidebar must define simulated scanner title");
    assert.ok(sidebarContent.includes("Simulated Feed · No Live Database"), "Sidebar must explicitly state no live database in demo mode");

    // In full-stack mode: must preserve original PostgreSQL scanner status
    assert.ok(sidebarContent.includes("Dining Scanner Connected"), "Sidebar must preserve full-stack scanner title");
    assert.ok(sidebarContent.includes("PostgreSQL · 125 Residents"), "Sidebar must preserve PostgreSQL subtitle in full-stack mode");

    // Must conditionally toggle based on isDemo
    assert.ok(sidebarContent.includes("isDemo ?"), "Sidebar must branch conditionally on demo mode");

    // LiveScannerWidget must branch truthfully
    const scannerWidgetPath = path.resolve(process.cwd(), "src/components/dashboard/LiveScannerWidget.tsx");
    const scannerWidgetContent = fs.readFileSync(scannerWidgetPath, "utf-8");
    assert.ok(scannerWidgetContent.includes('isDemoMode ? "Simulated Scanner Feed" : "Synced from Hostel App"'), "LiveScannerWidget must branch truthfully on demo mode");

    // Page-level truthful disclaimers
    const homePageContent = fs.readFileSync(path.resolve(process.cwd(), "src/app/page.tsx"), "utf-8");
    assert.ok(homePageContent.includes("isDemo"), "Home page must branch on isDemo for PostgreSQL mention");

    const predictionsPageContent = fs.readFileSync(path.resolve(process.cwd(), "src/app/predictions/page.tsx"), "utf-8");
    assert.ok(predictionsPageContent.includes("isDemo"), "Predictions page must branch on isDemo for PostgreSQL mention");

    const adminPageContent = fs.readFileSync(path.resolve(process.cwd(), "src/app/admin/page.tsx"), "utf-8");
    assert.ok(adminPageContent.includes("isDemo"), "Admin page must branch on isDemo for PostgreSQL mention");

    // next.config.ts must distinguish PHASE_DEVELOPMENT_SERVER from static export
    const nextConfigPath = path.resolve(process.cwd(), "next.config.ts");
    const nextConfigContent = fs.readFileSync(nextConfigPath, "utf-8");
    assert.ok(nextConfigContent.includes("PHASE_DEVELOPMENT_SERVER"), "next.config.ts must import and check PHASE_DEVELOPMENT_SERVER");
    assert.ok(nextConfigContent.includes("isDev"), "next.config.ts must conditionally include redirects only for dev");
  });
});
