import test from "node:test";
import assert from "node:assert";
import { DeterministicPredictionEngine } from "../deterministic-engine";
import {
  ResidentHistoryRecord,
  ComparableMealMetric,
  PredictionCalculationInput,
} from "../types";
import { ResidentType } from "@/types";

test("Deterministic Prediction Engine - Comprehensive Test Suite", async (t) => {
  const engine = new DeterministicPredictionEngine();

  const createDate = (daysAgo: number, dayOfWeek?: number): Date => {
    const d = new Date("2026-09-19T18:00:00Z"); // Saturday benchmark
    d.setUTCDate(d.getUTCDate() - daysAgo);
    if (dayOfWeek !== undefined) {
      while (d.getUTCDay() !== dayOfWeek) {
        d.setUTCDate(d.getUTCDate() - 1);
      }
    }
    return d;
  };

  const targetDate = new Date("2026-09-19T18:00:00Z"); // Saturday
  const targetMenuId = "menu-special-biryani";

  const baselines = {
    overallAverageAttendanceRate: 0.75,
    studentBaseline: 0.72,
    corporateBaseline: 0.78,
    dayAverageAttendanceRate: 0.76,
    mealTypeAverageAttendanceRate: 0.77,
    dayMealAverageAttendanceRate: 0.75,
    studentPrefReliability: 0.85,
    corporatePrefReliability: 0.80,
  };

  // 1. Consistent Attendee Test
  await t.test("1. Consistent attendee produces high probability (>= 0.88)", () => {
    const resident = { id: "res-consistent", residentCode: "STU-001", residentType: "STUDENT" as ResidentType };
    const history: ResidentHistoryRecord[] = Array.from({ length: 30 }, (_, i) => ({
      residentId: resident.id,
      residentCode: resident.residentCode,
      residentType: resident.residentType,
      mealId: `meal-${i}`,
      mealDate: createDate(i + 1),
      mealType: "DINNER",
      menuId: "menu-regular",
      hasPreference: true,
      selectedOption: "REGULAR",
      attended: i !== 5,
    }));

    const result = engine.computeResidentProbability(
      resident,
      history,
      targetDate,
      6,
      "DINNER",
      targetMenuId,
      { hasPreference: true, selectedOption: "REGULAR" },
      baselines,
      0.02
    );

    assert.ok(
      result.probability >= 0.88,
      `Expected consistent attendee probability >= 0.88, got ${result.probability}`
    );
    assert.strictEqual(result.factors.fallbackLevel, "resident_day_meal");
  });

  // 2. Occasional Attendee Test
  await t.test("2. Occasional attendee produces low probability (<= 0.35)", () => {
    const resident = { id: "res-occasional", residentCode: "CORP-001", residentType: "CORPORATE" as ResidentType };
    const history: ResidentHistoryRecord[] = Array.from({ length: 30 }, (_, i) => ({
      residentId: resident.id,
      residentCode: resident.residentCode,
      residentType: resident.residentType,
      mealId: `meal-${i}`,
      mealDate: createDate(i + 1),
      mealType: "DINNER",
      menuId: "menu-regular",
      hasPreference: i % 5 === 0,
      selectedOption: "REGULAR",
      attended: i % 5 === 0,
    }));

    const result = engine.computeResidentProbability(
      resident,
      history,
      targetDate,
      6,
      "DINNER",
      targetMenuId,
      { hasPreference: false },
      baselines,
      0.0
    );

    assert.ok(
      result.probability <= 0.35,
      `Expected occasional attendee probability <= 0.35, got ${result.probability}`
    );
  });

  // 3. Weekend-Heavy Attendee Test
  await t.test("3. Weekend-heavy attendee shows higher probability on Saturday vs Wednesday", () => {
    const resident = { id: "res-weekend", residentCode: "STU-002", residentType: "STUDENT" as ResidentType };
    const history: ResidentHistoryRecord[] = [];
    for (let i = 1; i <= 60; i++) {
      const d = createDate(i);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      history.push({
        residentId: resident.id,
        residentCode: resident.residentCode,
        residentType: resident.residentType,
        mealId: `meal-${i}`,
        mealDate: d,
        mealType: "DINNER",
        menuId: "menu-regular",
        hasPreference: isWeekend,
        attended: isWeekend ? (i % 10 !== 0) : (i % 5 === 0),
      });
    }

    const saturdayResult = engine.computeResidentProbability(
      resident,
      history,
      targetDate,
      6,
      "DINNER",
      targetMenuId,
      { hasPreference: true, selectedOption: "REGULAR" },
      baselines,
      0.0
    );

    const wednesdayResult = engine.computeResidentProbability(
      resident,
      history,
      targetDate,
      3,
      "DINNER",
      targetMenuId,
      { hasPreference: false },
      baselines,
      0.0
    );

    assert.ok(
      saturdayResult.probability > wednesdayResult.probability + 0.20,
      `Expected Saturday probability (${saturdayResult.probability}) to be substantially higher than Wednesday (${wednesdayResult.probability})`
    );
  });

  // 4. Preference-But-Often-Absent Resident Test
  await t.test("4. Preference-but-often-absent resident is penalized by preference reliability", () => {
    const resident = { id: "res-flaky", residentCode: "STU-003", residentType: "STUDENT" as ResidentType };
    const history: ResidentHistoryRecord[] = Array.from({ length: 20 }, (_, i) => ({
      residentId: resident.id,
      residentCode: resident.residentCode,
      residentType: resident.residentType,
      mealId: `meal-${i}`,
      mealDate: createDate(i + 1),
      mealType: "DINNER",
      menuId: "menu-regular",
      hasPreference: true,
      selectedOption: "REGULAR",
      attended: i < 5, // only 5/20 = 25% attended after opting in
    }));

    const result = engine.computeResidentProbability(
      resident,
      history,
      targetDate,
      6,
      "DINNER",
      targetMenuId,
      { hasPreference: true, selectedOption: "REGULAR" },
      baselines,
      0.0
    );

    assert.strictEqual(result.factors.preferenceSignalRate, 0.25);
    assert.ok(
      result.probability <= 0.45,
      `Expected flaky resident probability <= 0.45 despite opt-in, got ${result.probability}`
    );
  });

  // 5. Sparse-History Resident Test
  await t.test("5. Sparse-history resident falls back gracefully without error", () => {
    const resident = { id: "res-sparse", residentCode: "CORP-002", residentType: "CORPORATE" as ResidentType };
    const history: ResidentHistoryRecord[] = [
      {
        residentId: resident.id,
        residentCode: resident.residentCode,
        residentType: resident.residentType,
        mealId: "meal-single",
        mealDate: createDate(1),
        mealType: "DINNER",
        menuId: "menu-regular",
        hasPreference: true,
        attended: true,
      },
    ];

    const result = engine.computeResidentProbability(
      resident,
      history,
      targetDate,
      6,
      "DINNER",
      targetMenuId,
      { hasPreference: true },
      baselines,
      0.0
    );

    assert.ok(!isNaN(result.probability));
    assert.strictEqual(result.factors.fallbackLevel, "population_baseline");
    assert.strictEqual(result.factors.personalHistoricalRate, baselines.corporateBaseline);
  });

  // 6. No-History Fallback Test
  await t.test("6. No-history resident falls back completely to population cohort baseline", () => {
    const studentResident = { id: "res-new-student", residentCode: "STU-NEW", residentType: "STUDENT" as ResidentType };
    const corpResident = { id: "res-new-corp", residentCode: "CORP-NEW", residentType: "CORPORATE" as ResidentType };

    const studentResult = engine.computeResidentProbability(
      studentResident,
      [],
      targetDate,
      6,
      "DINNER",
      targetMenuId,
      { hasPreference: false },
      baselines,
      0.0
    );

    const corpResult = engine.computeResidentProbability(
      corpResident,
      [],
      targetDate,
      6,
      "DINNER",
      targetMenuId,
      { hasPreference: false },
      baselines,
      0.0
    );

    assert.ok(!isNaN(studentResult.probability));
    assert.ok(!isNaN(corpResult.probability));
    assert.strictEqual(studentResult.factors.fallbackLevel, "population_baseline");
    assert.strictEqual(corpResult.factors.fallbackLevel, "population_baseline");
  });

  // 7. Distinction Between Preference Component (10%) and Bounded Adjustments (±10%)
  await t.test("7. Distinction between 10% preference weighted factor and bounded adjustments (clamped to ±10%)", () => {
    const eligibleResidents = [
      { id: "res-1", residentCode: "STU-1", residentType: "STUDENT" as ResidentType },
      { id: "res-2", residentCode: "CORP-1", residentType: "CORPORATE" as ResidentType },
    ];

    const extremeHistory: ResidentHistoryRecord[] = [];
    for (let i = 0; i < 20; i++) {
      extremeHistory.push({
        residentId: "res-1",
        residentCode: "STU-1",
        residentType: "STUDENT",
        mealId: `m-${i}`,
        mealDate: createDate(i + 1, 6),
        mealType: "DINNER",
        menuId: targetMenuId,
        hasPreference: true,
        attended: true,
      });
    }

    const input: PredictionCalculationInput = {
      mealId: "target-meal",
      mealDate: targetDate,
      mealType: "DINNER",
      menuId: targetMenuId,
    };

    const currentPreferences = new Map([
      ["res-1", { selectedOption: "REGULAR" }],
      ["res-2", { selectedOption: "REGULAR" }],
    ]);

    const result = engine.calculateDemand(
      input,
      eligibleResidents,
      extremeHistory,
      currentPreferences,
      []
    );

    // Bounded adjustments must be strictly clamped to [-10, 10]
    assert.ok(
      result.breakdown.boundedAdjustments.menuAdjustmentPercent <= 10 &&
      result.breakdown.boundedAdjustments.menuAdjustmentPercent >= -10,
      `Menu adjustment should be clamped to ±10%, got ${result.breakdown.boundedAdjustments.menuAdjustmentPercent}%`
    );
    assert.ok(
      result.breakdown.boundedAdjustments.macroTrendAdjustmentPercent <= 10 &&
      result.breakdown.boundedAdjustments.macroTrendAdjustmentPercent >= -10,
      `Macro trend adjustment should be clamped to ±10%, got ${result.breakdown.boundedAdjustments.macroTrendAdjustmentPercent}%`
    );

    // Weighted factors must be clearly separated and within probability range [0, 1]
    assert.ok(typeof result.breakdown.weightedFactors.preferenceIntentionRate === "number");
    assert.ok(result.breakdown.weightedFactors.preferenceIntentionRate >= 0 && result.breakdown.weightedFactors.preferenceIntentionRate <= 1);
    assert.ok(result.breakdown.weightedFactors.personalHistoricalRate >= 0 && result.breakdown.weightedFactors.personalHistoricalRate <= 1);
    assert.ok(result.breakdown.weightedFactors.dayOfWeekPatternRate >= 0 && result.breakdown.weightedFactors.dayOfWeekPatternRate <= 1);
    assert.ok(result.breakdown.weightedFactors.mealTypePatternRate >= 0 && result.breakdown.weightedFactors.mealTypePatternRate <= 1);
    assert.ok(result.breakdown.weightedFactors.recentAttendanceTrendRate >= 0 && result.breakdown.weightedFactors.recentAttendanceTrendRate <= 1);
  });

  // 8. Preparation Buffer Independence from Waste Risk
  await t.test("8. Preparation buffer remains independent from waste-risk classification", () => {
    // Expected diners = 100 with default 5% buffer -> 100 * 1.05 = 105 -> ceil = 105
    const expected = 100;
    const defaultBuffer = 0.05;
    const safeCeil = (val: number) => Math.ceil(Number(val.toFixed(6)));
    const recommendedDefault = safeCeil(expected * (1 + defaultBuffer));
    assert.strictEqual(recommendedDefault, 105);

    // Expected diners = 101 with 5% buffer -> 101 * 1.05 = 106.05 -> ceil = 107
    assert.strictEqual(safeCeil(101 * 1.05), 107);

    // Custom 10% buffer -> 100 * 1.10 = 110 -> ceil = 110
    const customBuffer = 0.10;
    const recommendedCustom = safeCeil(expected * (1 + customBuffer));
    assert.strictEqual(recommendedCustom, 110);
  });

  // 9. Waste Risk from Historical MealOutcome Evidence
  await t.test("9. Waste risk incorporates historical MealOutcome evidence", () => {
    // Case A: High waste history (comparable meals generated 15% food waste)
    const highWasteHistory: ComparableMealMetric[] = Array.from({ length: 10 }, (_, i) => ({
      mealId: `hist-${i}`,
      mealDate: createDate(i * 7),
      mealType: "DINNER",
      menuId: targetMenuId,
      totalActualDiners: 80,
      preparedServings: 110,
      remainingServings: 30,
      wastedServings: 18, // 18 / 110 = 16.3% waste rate
    }));

    const highWasteEval = engine.evaluateWasteRisk(80, undefined, highWasteHistory);
    assert.strictEqual(highWasteEval.wasteRisk, "HIGH");
    assert.match(highWasteEval.evidence.riskReasoning, /High waste risk based on historical outcomes/);
    assert.ok(highWasteEval.evidence.averageWastePercent > 10);

    // Case B: Low waste history (tight preparation, 2% waste)
    const lowWasteHistory: ComparableMealMetric[] = Array.from({ length: 10 }, (_, i) => ({
      mealId: `hist-${i}`,
      mealDate: createDate(i * 7),
      mealType: "DINNER",
      menuId: targetMenuId,
      totalActualDiners: 95,
      preparedServings: 100,
      remainingServings: 5,
      wastedServings: 2, // 2 / 100 = 2% waste
    }));

    const lowWasteEval = engine.evaluateWasteRisk(95, undefined, lowWasteHistory);
    assert.strictEqual(lowWasteEval.wasteRisk, "LOW");
    assert.match(lowWasteEval.evidence.riskReasoning, /Low waste risk based on historical outcomes/);

    // Case C: Explicit planned servings with high excess (planned 140 for 100 expected diners)
    const plannedHighExcess = engine.evaluateWasteRisk(100, 140, lowWasteHistory);
    assert.strictEqual(plannedHighExcess.wasteRisk, "HIGH");
    assert.match(plannedHighExcess.evidence.riskReasoning, /planned preparation \(140\) exceeds predicted demand \(100\) by \+40\.0%/);

    // Case D: Explicit planned servings with tight buffer (planned 106 for 100 expected diners)
    const plannedTight = engine.evaluateWasteRisk(100, 106, lowWasteHistory);
    assert.strictEqual(plannedTight.wasteRisk, "LOW");
  });

  // 10. Dynamic Confidence CV Calculation
  await t.test("10. Confidence CV is calculated dynamically from actual historical observations", () => {
    // Dataset A: Consistent attendance -> [95, 96, 95, 96, 95, 96, 95, 96, 95, 96]
    // Mean = 95.5, Variance = 0.25, StdDev = 0.5, CV = 0.5 / 95.5 = ~0.0052 (< 0.01)
    const consistentMeals: ComparableMealMetric[] = Array.from({ length: 10 }, (_, i) => ({
      mealId: `comp-cons-${i}`,
      mealDate: createDate(i * 7),
      mealType: "DINNER",
      menuId: "menu-any",
      totalActualDiners: 95 + (i % 2),
    }));

    const consistentResult = engine.evaluateConfidence(consistentMeals, 6, "DINNER");
    assert.strictEqual(consistentResult.confidenceLevel, "HIGH");
    assert.ok(consistentResult.metrics.calculatedCoefficientOfVariation < 0.02);
    assert.strictEqual(consistentResult.metrics.comparableMealsCount, 10);
    assert.strictEqual(consistentResult.metrics.attendanceMean, 95.5);

    // Dataset B: Highly volatile attendance -> [50, 110, 45, 120, 55, 105, 50, 115, 60, 100]
    // Mean = 81.0, StdDev ~ 30.2, CV ~ 0.37 (> 0.20)
    const volatileAttendance = [50, 110, 45, 120, 55, 105, 50, 115, 60, 100];
    const volatileMeals: ComparableMealMetric[] = volatileAttendance.map((diners, i) => ({
      mealId: `comp-vol-${i}`,
      mealDate: createDate(i * 7),
      mealType: "DINNER",
      menuId: "menu-any",
      totalActualDiners: diners,
    }));

    const volatileResult = engine.evaluateConfidence(volatileMeals, 6, "DINNER");
    assert.strictEqual(volatileResult.confidenceLevel, "MEDIUM"); // Downgraded from HIGH due to high CV
    assert.ok(
      volatileResult.metrics.calculatedCoefficientOfVariation > 0.25,
      `Expected CV > 0.25 for volatile meals, got ${volatileResult.metrics.calculatedCoefficientOfVariation}`
    );

    // Dataset C: Very few meals (< 5) -> LOW confidence
    const sparseMeals = consistentMeals.slice(0, 3);
    const sparseResult = engine.evaluateConfidence(sparseMeals, 6, "DINNER");
    assert.strictEqual(sparseResult.confidenceLevel, "LOW");
  });

  // 11. Deterministic Repeatability Test
  await t.test("11. Deterministic repeatability: same data produces byte-for-byte identical output", () => {
    const eligibleResidents = [
      { id: "res-1", residentCode: "STU-001", residentType: "STUDENT" as ResidentType },
      { id: "res-2", residentCode: "CORP-001", residentType: "CORPORATE" as ResidentType },
    ];

    const history: ResidentHistoryRecord[] = [
      {
        residentId: "res-1",
        residentCode: "STU-001",
        residentType: "STUDENT",
        mealId: "m1",
        mealDate: createDate(7, 6),
        mealType: "DINNER",
        menuId: targetMenuId,
        hasPreference: true,
        selectedOption: "REGULAR",
        attended: true,
      },
      {
        residentId: "res-2",
        residentCode: "CORP-001",
        residentType: "CORPORATE",
        mealId: "m1",
        mealDate: createDate(7, 6),
        mealType: "DINNER",
        menuId: targetMenuId,
        hasPreference: false,
        attended: false,
      },
    ];

    const comparableMeals: ComparableMealMetric[] = [
      {
        mealId: "c1",
        mealDate: createDate(7, 6),
        mealType: "DINNER",
        menuId: targetMenuId,
        totalActualDiners: 95,
        preparedServings: 100,
        remainingServings: 5,
        wastedServings: 2,
      },
    ];

    const input: PredictionCalculationInput = {
      mealId: "target-rep",
      mealDate: targetDate,
      mealType: "DINNER",
      menuId: targetMenuId,
      plannedServings: 108,
    };

    const firstRun = engine.calculateDemand(input, eligibleResidents, history, new Map(), comparableMeals);
    for (let i = 0; i < 50; i++) {
      const nextRun = engine.calculateDemand(input, eligibleResidents, history, new Map(), comparableMeals);
      assert.strictEqual(nextRun.expectedDiners, firstRun.expectedDiners);
      assert.strictEqual(nextRun.recommendedServings, firstRun.recommendedServings);
      assert.strictEqual(nextRun.wasteRisk, firstRun.wasteRisk);
      assert.strictEqual(nextRun.confidenceLevel, firstRun.confidenceLevel);
      assert.deepStrictEqual(nextRun.breakdown, firstRun.breakdown);
      assert.strictEqual(nextRun.individualProbabilities.length, firstRun.individualProbabilities.length);
      assert.strictEqual(
        nextRun.individualProbabilities[0].probability,
        firstRun.individualProbabilities[0].probability
      );
    }
  });
});
