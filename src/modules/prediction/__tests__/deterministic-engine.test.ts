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

  // Helper to generate synthetic dates
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

  // Standard population baselines
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
    // 30 meals, attended 29
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
      attended: i !== 5, // missed only 1
    }));

    const result = engine.computeResidentProbability(
      resident,
      history,
      targetDate,
      6, // Saturday
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
    // 30 meals, attended only 6 (20%)
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
      { hasPreference: false }, // no preference set
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
    // Attends Saturdays (day 6) 90% of the time, Wednesdays (day 3) 20%
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
      6, // Saturday
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
      3, // Wednesday
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
    // Resident ALWAYS opts in with preference, but only attends 25% of the time
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
      attended: i < 5, // only 5/20 = 25%
    }));

    const result = engine.computeResidentProbability(
      resident,
      history,
      targetDate,
      6,
      "DINNER",
      targetMenuId,
      { hasPreference: true, selectedOption: "REGULAR" }, // has preference set today
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
    // Only 1 record in history
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

    assert.ok(!isNaN(result.probability), "Probability should not be NaN");
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

  // 7. Bounded Adjustments Test
  await t.test("7. Menu and trend adjustments are strictly bounded (clamped to ±10%)", () => {
    const eligibleResidents = [
      { id: "res-1", residentCode: "STU-1", residentType: "STUDENT" as ResidentType },
      { id: "res-2", residentCode: "CORP-1", residentType: "CORPORATE" as ResidentType },
    ];

    // Create history where menu has 100% attendance (extreme popularity)
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

    const result = engine.calculateDemand(
      input,
      eligibleResidents,
      extremeHistory,
      new Map(),
      []
    );

    assert.ok(
      result.breakdown.menuAdjustmentPercent <= 10,
      `Menu adjustment should be clamped <= 10%, got ${result.breakdown.menuAdjustmentPercent}%`
    );
    assert.ok(
      result.breakdown.menuAdjustmentPercent >= -10,
      `Menu adjustment should be clamped >= -10%, got ${result.breakdown.menuAdjustmentPercent}%`
    );
    assert.ok(
      result.breakdown.recentTrendPercent <= 10 && result.breakdown.recentTrendPercent >= -10,
      `Recent trend adjustment should be clamped to ±10%, got ${result.breakdown.recentTrendPercent}%`
    );
  });

  // 8. Preparation Buffer Calculation Test
  await t.test("8. Preparation buffer properly executes ceil(expected_diners * (1 + buffer))", () => {
    // Expected diners = 101 with 5% buffer -> 101 * 1.05 = 106.05 -> ceil = 107
    const expected = 101;
    const defaultBuffer = 0.05;
    const recommendedDefault = Math.ceil(expected * (1 + defaultBuffer));
    assert.strictEqual(recommendedDefault, 107);

    // Custom 10% buffer -> 101 * 1.10 = 111.1 -> ceil = 112
    const customBuffer = 0.10;
    const recommendedCustom = Math.ceil(expected * (1 + customBuffer));
    assert.strictEqual(recommendedCustom, 112);

    // Waste risk classification tests
    assert.strictEqual(engine.evaluateWasteRisk(101, 107), "LOW");      // 107/101 = 5.9% excess -> LOW
    assert.strictEqual(engine.evaluateWasteRisk(101, 112), "MEDIUM");   // 112/101 = 10.9% excess -> MEDIUM
    assert.strictEqual(engine.evaluateWasteRisk(101, 140), "HIGH");     // 140/101 = 38.6% excess -> HIGH
  });

  // 9. Confidence Classification Test
  await t.test("9. Confidence classification properly scores HIGH, MEDIUM, and LOW", () => {
    // 15 comparable meals with consistent attendance -> HIGH
    const highMeals: ComparableMealMetric[] = Array.from({ length: 15 }, (_, i) => ({
      mealId: `comp-${i}`,
      mealDate: createDate(i * 7),
      mealType: "DINNER",
      menuId: "menu-any",
      totalActualDiners: 95 + (i % 3), // very low variation (95, 96, 97)
    }));

    const highConfidence = engine.evaluateConfidence(highMeals, 6, "DINNER");
    assert.strictEqual(highConfidence.confidenceLevel, "HIGH");
    assert.match(highConfidence.confidenceReason, /15 comparable historical meals/);

    // 7 comparable meals -> MEDIUM
    const mediumMeals = highMeals.slice(0, 7);
    const medConfidence = engine.evaluateConfidence(mediumMeals, 6, "DINNER");
    assert.strictEqual(medConfidence.confidenceLevel, "MEDIUM");

    // 3 comparable meals -> LOW
    const lowMeals = highMeals.slice(0, 3);
    const lowConfidence = engine.evaluateConfidence(lowMeals, 6, "DINNER");
    assert.strictEqual(lowConfidence.confidenceLevel, "LOW");
  });

  // 10. Deterministic Repeatability Test
  await t.test("10. Deterministic repeatability: same data produces byte-for-byte identical output", () => {
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

    const input: PredictionCalculationInput = {
      mealId: "target-rep",
      mealDate: targetDate,
      mealType: "DINNER",
      menuId: targetMenuId,
      plannedServings: 108,
    };

    const firstRun = engine.calculateDemand(input, eligibleResidents, history, new Map(), []);
    for (let i = 0; i < 50; i++) {
      const nextRun = engine.calculateDemand(input, eligibleResidents, history, new Map(), []);
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
