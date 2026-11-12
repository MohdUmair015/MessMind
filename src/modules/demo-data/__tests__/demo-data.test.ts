import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  demoSnapshot,
  DEMO_TARGET_MEAL_ID,
  demoDataProvider,
  DemoDataProvider,
} from "../index";
import { purePredictionEngine, PureDeterministicPredictionEngine } from "@/modules/prediction/pure-deterministic-engine";
import { DeterministicPredictionEngine } from "@/modules/prediction/deterministic-engine";
import { generateDeterministicFallbackExplanation } from "@/modules/ai/deterministic-explainer";
import { ResidentHistoryRecord, ComparableMealMetric, PredictionCalculationInput } from "@/modules/prediction/types";
import { ResidentType, MealType } from "@/types";

test("Phase 1 — Static Demo Data Foundation & Parity Audit Test Suite", async (t) => {
  // Test Group 1: Snapshot Structure and Expected Benchmark Values
  await t.test("1. Snapshot Structure & Benchmark Values Verification", async (tSub) => {
    await tSub.test("1.1. Contains exactly 125 synthetic residents (50 student, 75 corporate)", () => {
      assert.strictEqual(demoSnapshot.residents.length, 125);
      assert.strictEqual(demoSnapshot.eligibleResidentsCount, 125);
      assert.strictEqual(demoSnapshot.studentCount, 50);
      assert.strictEqual(demoSnapshot.corporateCount, 75);

      const students = demoSnapshot.residents.filter((r) => r.residentType === "STUDENT");
      const corporate = demoSnapshot.residents.filter((r) => r.residentType === "CORPORATE");

      assert.strictEqual(students.length, 50);
      assert.strictEqual(corporate.length, 75);
      assert.strictEqual(students[0].residentCode, "STU-001");
      assert.strictEqual(corporate[0].residentCode, "CORP-001");
    });

    await tSub.test("1.2. Target Saturday Dinner benchmark values match exact canonical specification", () => {
      const target = demoSnapshot.targetMeal;
      assert.strictEqual(target.id, DEMO_TARGET_MEAL_ID);
      assert.strictEqual(target.menu.name, "Vegetable Biryani Special");
      assert.strictEqual(target.mealType, "DINNER");
      assert.strictEqual(target.isServed, false);

      const pred = demoSnapshot.targetPrediction;
      assert.strictEqual(pred.predictedDiners, 90, "Expected Diners must be exactly 90");
      assert.strictEqual(pred.recommendedServings, 95, "Recommended Servings must be 95 (with 5% buffer)");
      assert.strictEqual(pred.predictionFactors.historicalBaselineDiners, 86, "Historical Baseline must be 86");
      assert.strictEqual(pred.wasteRisk, "LOW", "Waste Risk must be LOW");
      assert.strictEqual(pred.confidenceLevel, "HIGH", "Confidence Level must be HIGH");

      // Verify Five Weighted Factors
      const wf = pred.predictionFactors.weightedFactors;
      assert.strictEqual(wf.personalHistoricalRate, 0.71, "Personal History factor rate must be 0.71 (71%)");
      assert.strictEqual(wf.dayOfWeekPatternRate, 0.71, "Day-of-Week factor rate must be 0.71 (71%)");
      assert.strictEqual(wf.mealTypePatternRate, 0.71, "Meal-Type factor rate must be 0.71 (71%)");
      assert.strictEqual(wf.recentAttendanceTrendRate, 0.72, "Recent Trend factor rate must be 0.72 (72%)");
      assert.strictEqual(wf.preferenceIntentionRate, 0.75, "Preference Intention factor rate must be 0.75 (75%)");

      // Verify Bounded Adjustments (±10% bounds)
      const ba = pred.predictionFactors.boundedAdjustments;
      assert.strictEqual(ba.menuAdjustmentPercent, 1, "Menu appeal adjustment must be +1%");
      assert.strictEqual(ba.macroTrendAdjustmentPercent, 1, "Macro trend drift adjustment must be +1%");

      // Verify Confidence Metrics
      const cm = pred.predictionFactors.confidenceMetrics;
      assert.strictEqual(cm.calculatedCoefficientOfVariation, 0.044, "Calculated CV must be 0.044 (4.4%)");
      assert.strictEqual(cm.comparableMealsCount, 12, "Comparable meals count must be 12");
      assert.strictEqual(cm.attendanceMean, 86.4, "Attendance mean must be 86.4 diners");
      assert.strictEqual(cm.attendanceStdDev, 3.8, "Attendance standard deviation must be 3.8 diners");

      // Verify Waste Evidence on Target Meal
      const we = pred.predictionFactors.wasteEvidence;
      assert.strictEqual(we.evaluatedOutcomesCount, 12, "Evaluated outcomes count must be 12");
      assert.strictEqual(we.averageLeftoverPercent, 5.6, "Average leftover percent must be 5.6%");
      assert.strictEqual(we.averageWastePercent, 2.8, "Detailed target benchmark physical food waste must be 2.8%");
      assert.strictEqual(we.excessiveLeftoverFrequencyPercent, 0.0, "Excessive leftover frequency must be 0.0%");

      // Verify explanation text includes benchmark numbers
      assert.ok(pred.explanation.includes("90 diners"));
      assert.ok(pred.explanation.includes("baseline of 86"));
      assert.strictEqual(pred.explanationSource, "fallback");
    });

    await tSub.test("1.3. Analytics KPIs reflect 90-day synthetic history (205 evaluated meals)", () => {
      const analytics = demoSnapshot.analytics;
      assert.strictEqual(analytics.totalHistoricalMeals, 205, "Total historical meals must be 205");
      assert.strictEqual(analytics.totalOutcomesRecorded, 205, "Evaluated meals count must be 205");
      assert.strictEqual(analytics.overallMapePercent, 4.2, "Model MAPE must be 4.2%");
      assert.strictEqual(analytics.accuracyWithinFivePercentRate, 92.5, "Tolerance within ±5% must be 92.5%");
      assert.strictEqual(
        analytics.averageFoodWastePercent,
        2.6,
        "Dashboard historical analytics card average food waste must be 2.6% (distinct from target meal 2.8%)"
      );
      assert.strictEqual(analytics.averageLeftoverPercent, 5.6, "Average leftover percent must be 5.6%");
      assert.strictEqual(analytics.recentOutcomeComparisons.length, 20);

      // Verify chronological chart data structure
      const firstRow = analytics.recentOutcomeComparisons[0];
      assert.ok(firstRow.mealId);
      assert.ok(firstRow.mealDate);
      assert.ok(typeof firstRow.actualDiners === "number");
      assert.ok(typeof firstRow.preparedServings === "number");
    });

    await tSub.test("1.4. Timeline contains scheduled services for meals navigation", () => {
      assert.ok(demoSnapshot.mealsTimeline.length >= 20);
      const upcoming = demoSnapshot.mealsTimeline.filter((m) => !m.isServed);
      const completed = demoSnapshot.mealsTimeline.filter((m) => m.isServed);

      assert.strictEqual(upcoming.length, 1, "Target Saturday dinner is the active upcoming service");
      assert.ok(completed.length >= 19, "Completed services populate operations schedule");
    });
  });

  // Test Group 2: Mathematical Prediction Engine Execution Against Snapshot
  await t.test("2. Pure Deterministic Prediction Engine Execution Against Snapshot", async (tSub) => {
    await tSub.test("2.1. calculateDemand executes against snapshot and reproduces canonical benchmark", () => {
      const result = demoDataProvider.runDeterministicPredictionOnSnapshot(
        DEMO_TARGET_MEAL_ID,
        5.0
      );

      assert.strictEqual(result.expectedDiners, 90, "Engine must compute 90 expected diners");
      assert.strictEqual(result.recommendedServings, 95, "Engine must compute 95 recommended servings");
      assert.strictEqual(result.breakdown.historicalBaselineDiners, 86, "Engine must compute 86 baseline diners");
      assert.strictEqual(result.confidenceLevel, "HIGH", "Confidence must classify as HIGH");
      assert.strictEqual(result.wasteRisk, "LOW", "Waste risk must classify as LOW");
      assert.strictEqual(result.breakdown.confidenceMetrics.calculatedCoefficientOfVariation, 0.044);
      assert.strictEqual(result.breakdown.confidenceMetrics.comparableMealsCount, 12);
      assert.strictEqual(result.breakdown.confidenceMetrics.attendanceMean, 86.4);
      assert.strictEqual(result.breakdown.confidenceMetrics.attendanceStdDev, 3.8);

      // Verify factor rates produced dynamically by pure calculation
      assert.strictEqual(result.breakdown.weightedFactors.personalHistoricalRate, 0.71);
      assert.strictEqual(result.breakdown.weightedFactors.dayOfWeekPatternRate, 0.71);
      assert.strictEqual(result.breakdown.weightedFactors.mealTypePatternRate, 0.71);
      assert.strictEqual(result.breakdown.weightedFactors.recentAttendanceTrendRate, 0.72);
      assert.strictEqual(result.breakdown.weightedFactors.preferenceIntentionRate, 0.75);

      // Verify bounded adjustments produced dynamically
      assert.strictEqual(result.breakdown.boundedAdjustments.menuAdjustmentPercent, 1);
      assert.strictEqual(result.breakdown.boundedAdjustments.macroTrendAdjustmentPercent, 1);

      // Verify waste evidence
      assert.strictEqual(result.breakdown.wasteEvidence.averageLeftoverPercent, 5.6);
      assert.strictEqual(result.breakdown.wasteEvidence.averageWastePercent, 2.8);
      assert.strictEqual(result.breakdown.wasteEvidence.excessiveLeftoverFrequencyPercent, 0.0);
    });

    await tSub.test("2.2. Deterministic repeatability check (50 consecutive executions)", () => {
      const firstRun = demoDataProvider.runDeterministicPredictionOnSnapshot();
      for (let i = 0; i < 50; i++) {
        const nextRun = demoDataProvider.runDeterministicPredictionOnSnapshot();
        assert.strictEqual(nextRun.expectedDiners, firstRun.expectedDiners);
        assert.strictEqual(nextRun.recommendedServings, firstRun.recommendedServings);
        assert.strictEqual(nextRun.breakdown.historicalBaselineDiners, firstRun.breakdown.historicalBaselineDiners);
        assert.deepStrictEqual(nextRun.breakdown.weightedFactors, firstRun.breakdown.weightedFactors);
        assert.deepStrictEqual(nextRun.breakdown.boundedAdjustments, firstRun.breakdown.boundedAdjustments);
        assert.deepStrictEqual(nextRun.breakdown.confidenceMetrics, firstRun.breakdown.confidenceMetrics);
        assert.deepStrictEqual(nextRun.breakdown.wasteEvidence, firstRun.breakdown.wasteEvidence);
      }
    });

    await tSub.test("2.3. Buffer adjustment functions dynamically without altering expected diners", () => {
      const buff0 = demoDataProvider.runDeterministicPredictionOnSnapshot(DEMO_TARGET_MEAL_ID, 0.0);
      assert.strictEqual(buff0.expectedDiners, 90);
      assert.strictEqual(buff0.recommendedServings, 90); // 90 * 1.0 = 90

      const buff10 = demoDataProvider.runDeterministicPredictionOnSnapshot(DEMO_TARGET_MEAL_ID, 10.0);
      assert.strictEqual(buff10.expectedDiners, 90);
      assert.strictEqual(buff10.recommendedServings, 99); // ceil(90 * 1.10) = 99

      const buff15 = demoDataProvider.runDeterministicPredictionOnSnapshot(DEMO_TARGET_MEAL_ID, 15.0);
      assert.strictEqual(buff15.expectedDiners, 90);
      assert.strictEqual(buff15.recommendedServings, 104); // ceil(90 * 1.15) = 104
    });
  });

  // Test Group 3: Browser-Safe Independence Verification (No Prisma or AWS SDK)
  await t.test("3. Dependency Isolation & Static Safety Verification", async (tSub) => {
    const browserSafeFiles = [
      "src/modules/demo-data/types.ts",
      "src/modules/demo-data/snapshot.ts",
      "src/modules/demo-data/demo-data-provider.ts",
      "src/modules/demo-data/index.ts",
      "src/modules/prediction/pure-deterministic-engine.ts",
      "src/modules/ai/deterministic-explainer.ts",
    ];

    for (const relPath of browserSafeFiles) {
      await tSub.test(`3.x File ${relPath} contains zero forbidden server/database imports`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
        const content = fs.readFileSync(fullPath, "utf-8");

        assert.ok(!content.includes("@prisma/client"), `${relPath} must not import @prisma/client`);
        assert.ok(!content.includes("@/lib/db"), `${relPath} must not import @/lib/db`);
        assert.ok(!content.includes("@aws-sdk"), `${relPath} must not import @aws-sdk`);
        assert.ok(!content.includes("next/headers"), `${relPath} must not import next/headers`);
        assert.ok(!content.includes('"use server"'), `${relPath} must not be a server action`);
      });
    }

    await tSub.test("3.4. Deterministic explainer produces expected output without AWS SDK", () => {
      const explanation = generateDeterministicFallbackExplanation({
        expectedDiners: 90,
        historicalBaseline: 86,
        personalHistoricalRate: 0.71,
        dayOfWeekRate: 0.71,
        mealTypeRate: 0.71,
        recentAttendanceRate: 0.72,
        preferenceIntentionRate: 0.75,
        menuAdjustment: 1,
        trendAdjustment: 1,
        confidence: "HIGH",
        cv: 4.4,
        mealType: "DINNER",
        day: "Saturday",
        menuName: "Vegetable Biryani Special",
      });

      assert.ok(explanation.includes("90 diners"));
      assert.ok(explanation.includes("baseline of 86"));
      assert.ok(explanation.includes("Recent attendance momentum"));
    });
  });

  // Test Group 4: Data Provider API Access Without Database
  await t.test("4. Demo Data Provider Read APIs Function Without Database Connection", async (tSub) => {
    const provider = new DemoDataProvider();

    await tSub.test("4.1. getUpcomingMealWithPrediction returns target meal and prediction", () => {
      const upcoming = provider.getUpcomingMealWithPrediction();
      assert.ok(upcoming.meal);
      assert.strictEqual(upcoming.meal.id, DEMO_TARGET_MEAL_ID);
      assert.strictEqual(upcoming.eligibleResidentsCount, 125);
      assert.strictEqual(upcoming.prediction?.predictedDiners, 90);
      assert.strictEqual(upcoming.prediction?.recommendedServings, 95);
      assert.strictEqual(upcoming.prediction?.predictionFactors.historicalBaselineDiners, 86);
    });

    await tSub.test("4.2. getMealsList filters correctly", () => {
      const all = provider.getMealsList();
      assert.ok(all.totalCount >= 20);

      const upcoming = provider.getMealsList({ filter: "upcoming" });
      assert.strictEqual(upcoming.totalCount, 1);
      assert.strictEqual(upcoming.meals[0].id, DEMO_TARGET_MEAL_ID);

      const completed = provider.getMealsList({ filter: "completed" });
      assert.ok(completed.totalCount >= 19);
    });

    await tSub.test("4.3. getMealDetailById retrieves meal details and computes errors", () => {
      const detail = provider.getMealDetailById(DEMO_TARGET_MEAL_ID);
      assert.ok(detail);
      assert.strictEqual(detail.meal.id, DEMO_TARGET_MEAL_ID);
      assert.strictEqual(detail.eligibleCount, 125);
      assert.strictEqual(detail.prediction?.predictedDiners, 90);

      const pastDetail = provider.getMealDetailById("meal-hist-01");
      assert.ok(pastDetail);
      assert.strictEqual(pastDetail.meal.isServed, true);
      assert.strictEqual(pastDetail.authoritativeActualDiners, 52);
    });

    await tSub.test("4.4. getAnalyticsSummary returns all KPI fields matching 205 evaluated meals", () => {
      const analytics = provider.getAnalyticsSummary();
      assert.strictEqual(analytics.overallMapePercent, 4.2);
      assert.strictEqual(analytics.accuracyWithinFivePercentRate, 92.5);
      assert.strictEqual(analytics.averageFoodWastePercent, 2.6);
      assert.strictEqual(analytics.totalHistoricalMeals, 205);
      assert.strictEqual(analytics.totalOutcomesRecorded, 205);
      assert.strictEqual(analytics.recentOutcomeComparisons.length, 20);
    });
  });

  // Test Group 5: Mathematical Parity Audit: PureDeterministicPredictionEngine vs DeterministicPredictionEngine
  await t.test("5. Mathematical Parity Audit: Pure Engine vs Original Engine", async (tSub) => {
    const pureEngine = new PureDeterministicPredictionEngine();
    const origEngine = new DeterministicPredictionEngine();

    // Verify inheritance relationship
    await tSub.test("5.0. DeterministicPredictionEngine extends PureDeterministicPredictionEngine", () => {
      assert.ok(origEngine instanceof PureDeterministicPredictionEngine);
      assert.strictEqual(pureEngine.algorithmVersion, origEngine.algorithmVersion);
      assert.strictEqual(pureEngine.WEIGHT_PERSONAL_HIST, origEngine.WEIGHT_PERSONAL_HIST);
      assert.strictEqual(pureEngine.WEIGHT_DAY_OF_WEEK, origEngine.WEIGHT_DAY_OF_WEEK);
      assert.strictEqual(pureEngine.WEIGHT_MEAL_TYPE, origEngine.WEIGHT_MEAL_TYPE);
      assert.strictEqual(pureEngine.WEIGHT_RECENT_TREND, origEngine.WEIGHT_RECENT_TREND);
      assert.strictEqual(pureEngine.WEIGHT_CURRENT_PREF, origEngine.WEIGHT_CURRENT_PREF);
      assert.strictEqual(pureEngine.MAX_MENU_ADJUSTMENT, origEngine.MAX_MENU_ADJUSTMENT);
      assert.strictEqual(pureEngine.MAX_TREND_ADJUSTMENT, origEngine.MAX_TREND_ADJUSTMENT);
      assert.strictEqual(pureEngine.DEFAULT_BUFFER_PERCENT, origEngine.DEFAULT_BUFFER_PERCENT);
    });

    // 5.1. Standard Prediction Parity
    await tSub.test("5.1. Standard prediction on snapshot fixture produces byte-for-byte identical output", () => {
      const eligible = demoSnapshot.residents.map((r) => ({
        id: r.id,
        residentCode: r.residentCode,
        residentType: r.residentType,
      }));
      const prefMap = new Map(demoSnapshot.targetMealPreferences.map((p) => [p.residentId, { selectedOption: p.selectedOption }]));
      const input: PredictionCalculationInput = {
        mealId: DEMO_TARGET_MEAL_ID,
        mealDate: new Date(demoSnapshot.generatedBenchmarkDate),
        mealType: "DINNER",
        menuId: "menu-biryani-special",
        bufferPercentage: 5.0,
      };

      const pureResult = pureEngine.calculateDemand(
        input,
        eligible,
        demoSnapshot.residentHistoryRecords,
        prefMap,
        demoSnapshot.comparableHistoricalMeals,
        5.0
      );

      const origResult = origEngine.calculateDemand(
        input,
        eligible,
        demoSnapshot.residentHistoryRecords,
        prefMap,
        demoSnapshot.comparableHistoricalMeals,
        5.0
      );

      assert.strictEqual(pureResult.expectedDiners, origResult.expectedDiners);
      assert.strictEqual(pureResult.recommendedServings, origResult.recommendedServings);
      assert.strictEqual(pureResult.wasteRisk, origResult.wasteRisk);
      assert.strictEqual(pureResult.confidenceLevel, origResult.confidenceLevel);
      assert.strictEqual(pureResult.confidenceReason, origResult.confidenceReason);
      assert.deepStrictEqual(pureResult.breakdown, origResult.breakdown);
      assert.deepStrictEqual(pureResult.individualProbabilities, origResult.individualProbabilities);
    });

    // 5.2. Sparse Resident History Parity
    await tSub.test("5.2. Sparse resident history falls back identically to cohort baselines", () => {
      const baselines = pureEngine.computePopulationBaselines(
        demoSnapshot.residentHistoryRecords,
        6,
        "DINNER"
      );

      const sparseStudent = { id: "sparse-stu", residentCode: "STU-999", residentType: "STUDENT" as ResidentType };
      const sparseCorporate = { id: "sparse-corp", residentCode: "CORP-999", residentType: "CORPORATE" as ResidentType };

      // Case A: 0 history records
      const pureZero = pureEngine.computeResidentProbability(
        sparseStudent,
        [],
        new Date("2026-09-19T18:00:00Z"),
        6,
        "DINNER",
        "menu-biryani-special",
        { hasPreference: false },
        baselines,
        0.01
      );
      const origZero = origEngine.computeResidentProbability(
        sparseStudent,
        [],
        new Date("2026-09-19T18:00:00Z"),
        6,
        "DINNER",
        "menu-biryani-special",
        { hasPreference: false },
        baselines,
        0.01
      );
      assert.deepStrictEqual(pureZero, origZero);
      assert.strictEqual(pureZero.factors.fallbackLevel, "population_baseline");

      // Case B: 1 history record (< 3 threshold)
      const oneHistory: ResidentHistoryRecord[] = [{
        residentId: sparseCorporate.id,
        residentCode: sparseCorporate.residentCode,
        residentType: sparseCorporate.residentType,
        mealId: "meal-single",
        mealDate: new Date("2026-09-12T18:00:00Z"),
        mealType: "DINNER",
        menuId: "menu-biryani-special",
        hasPreference: true,
        selectedOption: "REGULAR",
        attended: true,
      }];
      const pureOne = pureEngine.computeResidentProbability(
        sparseCorporate,
        oneHistory,
        new Date("2026-09-19T18:00:00Z"),
        6,
        "DINNER",
        "menu-biryani-special",
        { hasPreference: true, selectedOption: "REGULAR" },
        baselines,
        0.02
      );
      const origOne = origEngine.computeResidentProbability(
        sparseCorporate,
        oneHistory,
        new Date("2026-09-19T18:00:00Z"),
        6,
        "DINNER",
        "menu-biryani-special",
        { hasPreference: true, selectedOption: "REGULAR" },
        baselines,
        0.02
      );
      assert.deepStrictEqual(pureOne, origOne);
      assert.strictEqual(pureOne.factors.fallbackLevel, "population_baseline");
    });

    // 5.3. Different Meal Types Parity
    await tSub.test("5.3. Meal-type variations (BREAKFAST, LUNCH, DINNER) produce identical results", () => {
      const mealTypes: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];
      const eligible = demoSnapshot.residents.slice(0, 20).map((r) => ({
        id: r.id,
        residentCode: r.residentCode,
        residentType: r.residentType,
      }));
      const prefMap = new Map<string, { selectedOption: string }>();

      for (const mt of mealTypes) {
        const input: PredictionCalculationInput = {
          mealId: `test-${mt.toLowerCase()}`,
          mealDate: new Date("2026-09-19T12:00:00Z"),
          mealType: mt,
          menuId: "menu-paneer-butter",
          bufferPercentage: 5.0,
        };

        const pureRes = pureEngine.calculateDemand(input, eligible, demoSnapshot.residentHistoryRecords, prefMap, [], 5.0);
        const origRes = origEngine.calculateDemand(input, eligible, demoSnapshot.residentHistoryRecords, prefMap, [], 5.0);

        assert.strictEqual(pureRes.expectedDiners, origRes.expectedDiners);
        assert.strictEqual(pureRes.recommendedServings, origRes.recommendedServings);
        assert.deepStrictEqual(pureRes.breakdown.weightedFactors, origRes.breakdown.weightedFactors);
      }
    });

    // 5.4. Different Days of the Week Parity
    await tSub.test("5.4. Day-of-week pattern variations (Saturday vs Wednesday) produce identical results", () => {
      const satDate = new Date("2026-09-19T18:00:00Z"); // Saturday = 6
      const wedDate = new Date("2026-09-16T18:00:00Z"); // Wednesday = 3

      const eligible = demoSnapshot.residents.slice(0, 30).map((r) => ({
        id: r.id,
        residentCode: r.residentCode,
        residentType: r.residentType,
      }));
      const prefMap = new Map<string, { selectedOption: string }>();

      for (const targetDate of [satDate, wedDate]) {
        const input: PredictionCalculationInput = {
          mealId: `test-day-${targetDate.getDay()}`,
          mealDate: targetDate,
          mealType: "DINNER",
          menuId: "menu-dal-tadka",
          bufferPercentage: 5.0,
        };

        const pureRes = pureEngine.calculateDemand(input, eligible, demoSnapshot.residentHistoryRecords, prefMap, [], 5.0);
        const origRes = origEngine.calculateDemand(input, eligible, demoSnapshot.residentHistoryRecords, prefMap, [], 5.0);

        assert.strictEqual(pureRes.expectedDiners, origRes.expectedDiners);
        assert.strictEqual(pureRes.recommendedServings, origRes.recommendedServings);
        assert.deepStrictEqual(pureRes.breakdown.weightedFactors, origRes.breakdown.weightedFactors);
      }
    });

    // 5.5. Custom Safety Buffers Parity
    await tSub.test("5.5. Custom safety buffer calculations (0%, 5%, 10%, 15%) produce identical recommended servings", () => {
      const buffers = [0, 5, 10, 15];
      const eligible = demoSnapshot.residents.slice(0, 50).map((r) => ({
        id: r.id,
        residentCode: r.residentCode,
        residentType: r.residentType,
      }));
      const input: PredictionCalculationInput = {
        mealId: "test-buffer",
        mealDate: new Date("2026-09-19T18:00:00Z"),
        mealType: "DINNER",
        menuId: "menu-biryani-special",
      };

      for (const b of buffers) {
        const pureRes = pureEngine.calculateDemand(input, eligible, demoSnapshot.residentHistoryRecords, new Map(), [], b);
        const origRes = origEngine.calculateDemand(input, eligible, demoSnapshot.residentHistoryRecords, new Map(), [], b);

        assert.strictEqual(pureRes.expectedDiners, origRes.expectedDiners);
        assert.strictEqual(pureRes.recommendedServings, origRes.recommendedServings);
      }
    });

    // 5.6. Confidence Classification Parity
    await tSub.test("5.6. Confidence classification and CV calculations are identical across historical counts", () => {
      // Scenario A: 0 comparable meals -> LOW
      const pure0 = pureEngine.evaluateConfidence([], 6, "DINNER");
      const orig0 = origEngine.evaluateConfidence([], 6, "DINNER");
      assert.deepStrictEqual(pure0, orig0);
      assert.strictEqual(pure0.confidenceLevel, "LOW");

      // Scenario B: 5 comparable meals -> MEDIUM
      const meals5 = demoSnapshot.comparableHistoricalMeals.slice(0, 5);
      const pure5 = pureEngine.evaluateConfidence(meals5, 6, "DINNER");
      const orig5 = origEngine.evaluateConfidence(meals5, 6, "DINNER");
      assert.deepStrictEqual(pure5, orig5);
      assert.strictEqual(pure5.confidenceLevel, "MEDIUM");

      // Scenario C: 12 comparable meals with CV = 0.044 -> HIGH
      const meals12 = demoSnapshot.comparableHistoricalMeals;
      const pure12 = pureEngine.evaluateConfidence(meals12, 6, "DINNER");
      const orig12 = origEngine.evaluateConfidence(meals12, 6, "DINNER");
      assert.deepStrictEqual(pure12, orig12);
      assert.strictEqual(pure12.confidenceLevel, "HIGH");
      assert.strictEqual(pure12.metrics.calculatedCoefficientOfVariation, 0.044);
    });

    // 5.7. Waste-Risk Classification Parity
    await tSub.test("5.7. Waste-risk classification evaluates planned prep and outcome evidence identically", () => {
      const meals = demoSnapshot.comparableHistoricalMeals;

      // Planned 120 vs Expected 90 (+33.3% excess) -> HIGH risk
      const pureHigh = pureEngine.evaluateWasteRisk(90, 120, meals);
      const origHigh = origEngine.evaluateWasteRisk(90, 120, meals);
      assert.deepStrictEqual(pureHigh, origHigh);
      assert.strictEqual(pureHigh.wasteRisk, "HIGH");

      // Planned 99 vs Expected 90 (+10% excess) -> MEDIUM risk
      const pureMed = pureEngine.evaluateWasteRisk(90, 99, meals);
      const origMed = origEngine.evaluateWasteRisk(90, 99, meals);
      assert.deepStrictEqual(pureMed, origMed);
      assert.strictEqual(pureMed.wasteRisk, "MEDIUM");

      // Planned 94 vs Expected 90 (+4.4% excess) -> LOW risk
      const pureLow = pureEngine.evaluateWasteRisk(90, 94, meals);
      const origLow = origEngine.evaluateWasteRisk(90, 94, meals);
      assert.deepStrictEqual(pureLow, origLow);
      assert.strictEqual(pureLow.wasteRisk, "LOW");

      // No planned servings specified: uses historical evidence (avgWaste 2.8%, leftover 5.6%) -> LOW risk
      const pureHist = pureEngine.evaluateWasteRisk(90, undefined, meals);
      const origHist = origEngine.evaluateWasteRisk(90, undefined, meals);
      assert.deepStrictEqual(pureHist, origHist);
      assert.strictEqual(pureHist.wasteRisk, "LOW");
      assert.strictEqual(pureHist.evidence.averageWastePercent, 2.8);
      assert.strictEqual(pureHist.evidence.averageLeftoverPercent, 5.6);
    });

    // 5.8. Rounding Behavior and Clamping Parity
    await tSub.test("5.8. Probability clamping strictly confines individual probabilities between 0.01 and 0.99", () => {
      const baselines = pureEngine.computePopulationBaselines(demoSnapshot.residentHistoryRecords, 6, "DINNER");
      const resident = { id: "res-test", residentCode: "STU-001", residentType: "STUDENT" as ResidentType };

      // Force high probability
      const highHistory: ResidentHistoryRecord[] = Array.from({ length: 20 }, (_, i) => ({
        residentId: resident.id,
        residentCode: resident.residentCode,
        residentType: resident.residentType,
        mealId: `meal-${i}`,
        mealDate: new Date("2026-09-12T18:00:00Z"),
        mealType: "DINNER",
        menuId: "menu-biryani-special",
        hasPreference: true,
        selectedOption: "REGULAR",
        attended: true,
      }));

      const pureHighProb = pureEngine.computeResidentProbability(
        resident,
        highHistory,
        new Date("2026-09-19T18:00:00Z"),
        6,
        "DINNER",
        "menu-biryani-special",
        { hasPreference: true, selectedOption: "REGULAR" },
        baselines,
        0.10 // Max +10% menu adjustment
      );
      const origHighProb = origEngine.computeResidentProbability(
        resident,
        highHistory,
        new Date("2026-09-19T18:00:00Z"),
        6,
        "DINNER",
        "menu-biryani-special",
        { hasPreference: true, selectedOption: "REGULAR" },
        baselines,
        0.10
      );

      assert.deepStrictEqual(pureHighProb, origHighProb);
      assert.ok(pureHighProb.probability <= 0.99, `Probability must not exceed 0.99: got ${pureHighProb.probability}`);

      // Force low probability
      const lowHistory: ResidentHistoryRecord[] = Array.from({ length: 20 }, (_, i) => ({
        residentId: resident.id,
        residentCode: resident.residentCode,
        residentType: resident.residentType,
        mealId: `meal-${i}`,
        mealDate: new Date("2026-09-12T18:00:00Z"),
        mealType: "DINNER",
        menuId: "menu-biryani-special",
        hasPreference: false,
        attended: false,
      }));

      const pureLowProb = pureEngine.computeResidentProbability(
        resident,
        lowHistory,
        new Date("2026-09-19T18:00:00Z"),
        6,
        "DINNER",
        "menu-biryani-special",
        { hasPreference: false },
        baselines,
        -0.10 // Max -10% menu adjustment
      );
      const origLowProb = origEngine.computeResidentProbability(
        resident,
        lowHistory,
        new Date("2026-09-19T18:00:00Z"),
        6,
        "DINNER",
        "menu-biryani-special",
        { hasPreference: false },
        baselines,
        -0.10
      );

      assert.deepStrictEqual(pureLowProb, origLowProb);
      assert.ok(pureLowProb.probability >= 0.01, `Probability must not fall below 0.01: got ${pureLowProb.probability}`);
    });
  });
});
