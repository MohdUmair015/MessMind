import {
  MealType,
  ResidentType,
  WasteRiskLevel,
  ConfidenceLevel,
} from "@/types";
import {
  PredictionCalculationInput,
  PredictionCalculationResult,
  ResidentAttendanceProbability,
  ResidentHistoryRecord,
  ComparableMealMetric,
  HistoricalWasteEvidence,
  ConfidenceMetrics,
} from "./types";
import { IPredictionEngine } from "./prediction-engine.interface";

export class DeterministicPredictionEngine implements IPredictionEngine {
  public readonly algorithmVersion = "v1.1-deterministic";

  /**
   * Five Weighted Behavioral Components (Sum = 100%):
   * 1. Personal historical behavior: 40% (0.40)
   * 2. Day-of-week pattern:          20% (0.20)
   * 3. Meal-type pattern:            15% (0.15)
   * 4. Recent attendance trend:      15% (0.15)
   * 5. Current preference behavior:  10% (0.10) - intention signal
   */
  public readonly WEIGHT_PERSONAL_HIST = 0.40;
  public readonly WEIGHT_DAY_OF_WEEK = 0.20;
  public readonly WEIGHT_MEAL_TYPE = 0.15;
  public readonly WEIGHT_RECENT_TREND = 0.15;
  public readonly WEIGHT_CURRENT_PREF = 0.10;

  /**
   * Bounded Adjustments (Separate from weighted probability components, strictly clamped to ±10%):
   */
  public readonly MAX_MENU_ADJUSTMENT = 0.10;   // ±10% bounded adjustment
  public readonly MAX_TREND_ADJUSTMENT = 0.10;  // ±10% bounded adjustment

  /**
   * Configurable Preparation Buffer (Default 5%):
   * recommended_servings = ceil(expected_diners * (1 + buffer))
   */
  public readonly DEFAULT_BUFFER_PERCENT = 5.0;

  /**
   * Pure deterministic calculation from in-memory records.
   * Completely decoupled from database I/O for direct unit testing and repeatable simulation.
   */
  public calculateDemand(
    input: PredictionCalculationInput,
    eligibleResidents: Array<{ id: string; residentCode: string; residentType: ResidentType }>,
    historyRecords: ResidentHistoryRecord[],
    currentMealPreferences: Map<string, { selectedOption: string }>,
    comparableHistoricalMeals: ComparableMealMetric[],
    customBufferPercent?: number
  ): PredictionCalculationResult {
    const targetDayOfWeek = input.mealDate.getDay();
    const targetMealType = input.mealType;
    const targetMenuId = input.menuId;
    const buffer = (customBufferPercent ?? input.bufferPercentage ?? this.DEFAULT_BUFFER_PERCENT) / 100;

    // 1. Calculate Population Baselines for Fallbacks
    const populationBaselines = this.computePopulationBaselines(historyRecords, targetDayOfWeek, targetMealType);

    // 2. Calculate Menu Historical Adjustment (Bounded to ±10%)
    const menuAdjustment = this.computeMenuAdjustment(
      historyRecords,
      targetMenuId,
      targetDayOfWeek,
      targetMealType,
      populationBaselines.overallAverageAttendanceRate
    );

    // 3. Compute Per-Resident Attendance Probability (combining 5 weighted factors + bounded menu adjustment)
    const individualProbabilities: ResidentAttendanceProbability[] = eligibleResidents.map((resident) => {
      const residentHistory = historyRecords.filter((h) => h.residentId === resident.id);
      const preference = currentMealPreferences.get(resident.id);

      return this.computeResidentProbability(
        resident,
        residentHistory,
        input.mealDate,
        targetDayOfWeek,
        targetMealType,
        targetMenuId,
        preference ? { hasPreference: true, selectedOption: preference.selectedOption } : { hasPreference: false },
        populationBaselines,
        menuAdjustment
      );
    });

    // 4. Aggregate Expected Diners = SUM of individual attendance probabilities
    const rawExpectedDiners = individualProbabilities.reduce((sum, p) => sum + p.probability, 0);
    const expectedDiners = Math.round(rawExpectedDiners);

    // 5. Recommended Servings = ceil(expected_diners * (1 + buffer))
    // Clean precision to avoid IEEE 754 floating point epsilon errors (e.g. 100 * 1.1 = 110.00000000000001)
    const rawRecommended = expectedDiners * (1 + buffer);
    const recommendedServings = Math.ceil(Number(rawRecommended.toFixed(6)));

    // 6. Confidence Level & Basis (Calculated dynamically from historical attendance observations)
    const { confidenceLevel, confidenceReason, metrics: confidenceMetrics } = this.evaluateConfidence(
      comparableHistoricalMeals,
      targetDayOfWeek,
      targetMealType
    );

    // 7. Waste Risk evaluated from historical MealOutcome evidence
    const planned = input.plannedServings;
    const { wasteRisk, evidence: wasteEvidence } = this.evaluateWasteRisk(
      expectedDiners,
      planned,
      comparableHistoricalMeals
    );

    // 8. Distinct breakdown separating:
    // (a) Weighted Behavioral Factors (averages across population)
    // (b) Bounded Adjustments (clamped to ±10%)
    // (c) Historical Waste Evidence
    // (d) Confidence Metrics
    const totalResidents = eligibleResidents.length || 1;
    const avgPersonalRate = individualProbabilities.reduce((acc, p) => acc + p.factors.personalHistoricalRate, 0) / totalResidents;
    const avgDayRate = individualProbabilities.reduce((acc, p) => acc + p.factors.dayOfWeekRate, 0) / totalResidents;
    const avgMealRate = individualProbabilities.reduce((acc, p) => acc + p.factors.mealTypeRate, 0) / totalResidents;
    const avgRecentRate = individualProbabilities.reduce((acc, p) => acc + p.factors.recentTrendRate, 0) / totalResidents;
    const avgPrefRate = individualProbabilities.reduce((acc, p) => acc + p.factors.preferenceSignalRate, 0) / totalResidents;

    const macroTrendDelta = Math.max(-this.MAX_TREND_ADJUSTMENT, Math.min(this.MAX_TREND_ADJUSTMENT, avgRecentRate - avgPersonalRate));

    const historicalBaselineDiners = Math.round(populationBaselines.dayMealAverageAttendanceRate * eligibleResidents.length);

    return {
      mealId: input.mealId,
      expectedDiners,
      recommendedServings,
      plannedServings: planned,
      wasteRisk,
      confidenceLevel,
      confidenceReason,
      breakdown: {
        eligiblePopulation: eligibleResidents.length,
        historicalBaselineDiners,
        weightedFactors: {
          personalHistoricalRate: Math.round(avgPersonalRate * 100) / 100,
          dayOfWeekPatternRate: Math.round(avgDayRate * 100) / 100,
          mealTypePatternRate: Math.round(avgMealRate * 100) / 100,
          recentAttendanceTrendRate: Math.round(avgRecentRate * 100) / 100,
          preferenceIntentionRate: Math.round(avgPrefRate * 100) / 100,
        },
        boundedAdjustments: {
          menuAdjustmentPercent: Math.round(menuAdjustment * 100),
          macroTrendAdjustmentPercent: Math.round(macroTrendDelta * 100),
        },
        wasteEvidence,
        confidenceMetrics,
      },
      individualProbabilities,
      algorithmVersion: this.algorithmVersion,
    };
  }

  /**
   * Compute probability for a single resident following the 40/20/15/15/10 weighting
   * and sparse-data fallback hierarchy.
   */
  public computeResidentProbability(
    resident: { id: string; residentCode: string; residentType: ResidentType },
    history: ResidentHistoryRecord[],
    targetDate: Date,
    targetDayOfWeek: number,
    targetMealType: MealType,
    targetMenuId: string,
    currentPreference: { hasPreference: boolean; selectedOption?: string },
    populationBaselines: {
      studentBaseline: number;
      corporateBaseline: number;
      dayMealAverageAttendanceRate: number;
      studentPrefReliability: number;
      corporatePrefReliability: number;
    },
    menuAdjustment: number
  ): ResidentAttendanceProbability {
    const cohortBaseline = resident.residentType === "STUDENT"
      ? populationBaselines.studentBaseline
      : populationBaselines.corporateBaseline;

    let fallbackLevel: 'resident_full' | 'resident_day_meal' | 'resident_meal' | 'population_baseline' = 'population_baseline';

    // 1. Personal Historical Attendance (40% Weight)
    let personalHistRate = cohortBaseline;
    if (history.length >= 3) {
      const attendedCount = history.filter((h) => h.attended).length;
      personalHistRate = attendedCount / history.length;
      fallbackLevel = 'resident_meal';
    }

    // 2. Day-of-Week Pattern (20% Weight)
    const dayRecords = history.filter((h) => h.mealDate.getDay() === targetDayOfWeek);
    let dayOfWeekRate = personalHistRate;
    if (dayRecords.length >= 2) {
      const dayAttended = dayRecords.filter((h) => h.attended).length;
      dayOfWeekRate = dayAttended / dayRecords.length;
      fallbackLevel = 'resident_day_meal';
    }

    // 3. Meal-Type Pattern (15% Weight)
    const mealTypeRecords = history.filter((h) => h.mealType === targetMealType);
    let mealTypeRate = personalHistRate;
    if (mealTypeRecords.length >= 2) {
      const mealTypeAttended = mealTypeRecords.filter((h) => h.attended).length;
      mealTypeRate = mealTypeAttended / mealTypeRecords.length;
    }

    // Menu specific history for resident (if abundant)
    const menuRecords = history.filter((h) => h.menuId === targetMenuId);
    if (menuRecords.length >= 2 && dayRecords.length >= 2) {
      fallbackLevel = 'resident_full';
    }

    // 4. Recent Attendance Trend (15% Weight) - Last 14 days with bounded trend delta
    const fourteenDaysAgo = new Date(targetDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    const recentRecords = history.filter((h) => h.mealDate >= fourteenDaysAgo);
    let recentTrendRate = personalHistRate;
    if (recentRecords.length >= 2) {
      const recentAttended = recentRecords.filter((h) => h.attended).length;
      const rawRecentRate = recentAttended / recentRecords.length;
      // Bounded personal trend delta: ±10% from personal baseline
      const trendDelta = Math.max(-this.MAX_TREND_ADJUSTMENT, Math.min(this.MAX_TREND_ADJUSTMENT, rawRecentRate - personalHistRate));
      recentTrendRate = Math.max(0, Math.min(1, personalHistRate + trendDelta));
    }

    // 5. Current Preference Behavior (10% Weight - Intention Signal)
    // Preference is an intention signal. Learn how reliable resident's preference is historically.
    const cohortReliability = resident.residentType === "STUDENT"
      ? populationBaselines.studentPrefReliability
      : populationBaselines.corporatePrefReliability;

    const prefHistory = history.filter((h) => h.hasPreference);
    let preferenceSignalRate = cohortBaseline;

    if (currentPreference.hasPreference) {
      if (prefHistory.length >= 3) {
        const prefAttended = prefHistory.filter((h) => h.attended).length;
        preferenceSignalRate = prefAttended / prefHistory.length;
      } else {
        preferenceSignalRate = cohortReliability;
      }
    } else {
      // Resident did NOT set a preference: what is their probability of showing up anyway?
      const noPrefHistory = history.filter((h) => !h.hasPreference);
      if (noPrefHistory.length >= 3) {
        const noPrefAttended = noPrefHistory.filter((h) => h.attended).length;
        preferenceSignalRate = noPrefAttended / noPrefHistory.length;
      } else {
        preferenceSignalRate = cohortBaseline * 0.25; // Default low probability for unannounced walk-in
      }
    }

    // Weighted raw probability from the 5 components (40/20/15/15/10)
    const rawWeighted =
      this.WEIGHT_PERSONAL_HIST * personalHistRate +
      this.WEIGHT_DAY_OF_WEEK * dayOfWeekRate +
      this.WEIGHT_MEAL_TYPE * mealTypeRate +
      this.WEIGHT_RECENT_TREND * recentTrendRate +
      this.WEIGHT_CURRENT_PREF * preferenceSignalRate;

    // Apply bounded menu adjustment (±10% max)
    const finalProbability = Math.max(0.01, Math.min(0.99, rawWeighted * (1 + menuAdjustment)));

    return {
      residentId: resident.id,
      residentCode: resident.residentCode,
      residentType: resident.residentType,
      probability: Math.round(finalProbability * 1000) / 1000,
      factors: {
        personalHistoricalRate: Math.round(personalHistRate * 100) / 100,
        dayOfWeekRate: Math.round(dayOfWeekRate * 100) / 100,
        mealTypeRate: Math.round(mealTypeRate * 100) / 100,
        recentTrendRate: Math.round(recentTrendRate * 100) / 100,
        preferenceSignalRate: Math.round(preferenceSignalRate * 100) / 100,
        menuAdjustment: Math.round(menuAdjustment * 100) / 100,
        fallbackLevel,
      },
    };
  }

  /**
   * Bounded Menu Historical Adjustment (±10% maximum).
   */
  private computeMenuAdjustment(
    history: ResidentHistoryRecord[],
    targetMenuId: string,
    targetDayOfWeek: number,
    targetMealType: MealType,
    overallBaseline: number
  ): number {
    const menuRecords = history.filter((h) => h.menuId === targetMenuId);
    if (menuRecords.length < 5) {
      return 0.0; // Sparse data fallback: no adjustment for new/infrequent menu
    }

    const menuAttended = menuRecords.filter((h) => h.attended).length;
    const menuRate = menuAttended / menuRecords.length;

    const comparableRecords = history.filter(
      (h) => h.mealDate.getDay() === targetDayOfWeek && h.mealType === targetMealType
    );
    const baseRate = comparableRecords.length >= 10
      ? comparableRecords.filter((h) => h.attended).length / comparableRecords.length
      : overallBaseline;

    if (baseRate <= 0) return 0.0;

    const delta = (menuRate - baseRate) / baseRate;
    return Math.max(-this.MAX_MENU_ADJUSTMENT, Math.min(this.MAX_MENU_ADJUSTMENT, delta));
  }

  /**
   * Compute cohort and population fallback baselines.
   */
  private computePopulationBaselines(
    history: ResidentHistoryRecord[],
    targetDayOfWeek: number,
    targetMealType: MealType
  ) {
    const overallAttended = history.filter((h) => h.attended).length;
    const overallAverageAttendanceRate = history.length > 0 ? overallAttended / history.length : 0.75;

    const studentHistory = history.filter((h) => h.residentType === "STUDENT");
    const studentBaseline = studentHistory.length > 0
      ? studentHistory.filter((h) => h.attended).length / studentHistory.length
      : 0.72;

    const corporateHistory = history.filter((h) => h.residentType === "CORPORATE");
    const corporateBaseline = corporateHistory.length > 0
      ? corporateHistory.filter((h) => h.attended).length / corporateHistory.length
      : 0.78;

    const dayHistory = history.filter((h) => h.mealDate.getDay() === targetDayOfWeek);
    const dayAverageAttendanceRate = dayHistory.length > 0
      ? dayHistory.filter((h) => h.attended).length / dayHistory.length
      : overallAverageAttendanceRate;

    const mealHistory = history.filter((h) => h.mealType === targetMealType);
    const mealTypeAverageAttendanceRate = mealHistory.length > 0
      ? mealHistory.filter((h) => h.attended).length / mealHistory.length
      : overallAverageAttendanceRate;

    const dayMealHistory = history.filter(
      (h) => h.mealDate.getDay() === targetDayOfWeek && h.mealType === targetMealType
    );
    const dayMealAverageAttendanceRate = dayMealHistory.length > 0
      ? dayMealHistory.filter((h) => h.attended).length / dayMealHistory.length
      : overallAverageAttendanceRate;

    const studentPref = studentHistory.filter((h) => h.hasPreference);
    const studentPrefReliability = studentPref.length > 0
      ? studentPref.filter((h) => h.attended).length / studentPref.length
      : 0.85;

    const corpPref = corporateHistory.filter((h) => h.hasPreference);
    const corporatePrefReliability = corpPref.length > 0
      ? corpPref.filter((h) => h.attended).length / corpPref.length
      : 0.80;

    return {
      overallAverageAttendanceRate,
      studentBaseline,
      corporateBaseline,
      dayAverageAttendanceRate,
      mealTypeAverageAttendanceRate,
      dayMealAverageAttendanceRate,
      studentPrefReliability,
      corporatePrefReliability,
    };
  }

  /**
   * Waste Risk Classification incorporating historical MealOutcome evidence.
   * 
   * Prototype business rules:
   * 1. If planned preparation is known:
   *    - Planned excess > 20% OR (planned excess > 12% AND historical waste > 5%) -> HIGH
   *    - Planned excess > 8% OR (planned excess > 5% AND excessive leftover freq > 25%) -> MEDIUM
   *    - Otherwise -> LOW
   * 2. If planned preparation is not yet entered (kitchen seeking prediction guidance):
   *    - Evaluates historical outcome evidence for comparable meals:
   *      - Historical waste > 8% OR excessive leftover freq >= 35% -> HIGH
   *      - Historical waste > 4% OR historical leftover ratio > 10% -> MEDIUM
   *      - Otherwise -> LOW
   */
  public evaluateWasteRisk(
    expectedDiners: number,
    plannedServings: number | undefined,
    comparableHistoricalMeals: ComparableMealMetric[]
  ): { wasteRisk: WasteRiskLevel; evidence: HistoricalWasteEvidence } {
    // Collect historical outcome records
    const outcomesWithData = comparableHistoricalMeals.filter(
      (m) => m.preparedServings !== undefined && m.preparedServings > 0
    );

    let totalPrepared = 0;
    let totalRemaining = 0;
    let totalWasted = 0;
    let excessiveLeftoverCount = 0;

    for (const m of outcomesWithData) {
      const prepared = m.preparedServings || 0;
      const remaining = m.remainingServings ?? Math.max(0, prepared - m.totalActualDiners);
      const wasted = m.wastedServings ?? Math.round(remaining * 0.45);

      totalPrepared += prepared;
      totalRemaining += remaining;
      totalWasted += wasted;

      if (prepared > 0 && remaining / prepared > 0.15) {
        excessiveLeftoverCount++;
      }
    }

    const evaluatedCount = outcomesWithData.length;
    const avgLeftoverPercent = totalPrepared > 0 ? (totalRemaining / totalPrepared) * 100 : 6.0;
    const avgWastePercent = totalPrepared > 0 ? (totalWasted / totalPrepared) * 100 : 2.5;
    const excessiveFreqPercent = evaluatedCount > 0 ? (excessiveLeftoverCount / evaluatedCount) * 100 : 0;

    let wasteRisk: WasteRiskLevel = "LOW";
    let riskReasoning = "";

    if (plannedServings !== undefined && plannedServings > 0 && expectedDiners > 0) {
      const plannedExcessPercent = ((plannedServings - expectedDiners) / expectedDiners) * 100;

      if (plannedExcessPercent > 20 || (plannedExcessPercent > 12 && avgWastePercent > 5)) {
        wasteRisk = "HIGH";
        riskReasoning = `High waste risk — planned preparation (${plannedServings}) exceeds predicted demand (${expectedDiners}) by +${plannedExcessPercent.toFixed(1)}%, compounded by historical waste rate of ${avgWastePercent.toFixed(1)}%.`;
      } else if (plannedExcessPercent > 8 || (plannedExcessPercent > 5 && excessiveFreqPercent > 25)) {
        wasteRisk = "MEDIUM";
        riskReasoning = `Medium waste risk — planned preparation (${plannedServings}) carries moderate excess (+${plannedExcessPercent.toFixed(1)}%) above predicted demand.`;
      } else {
        wasteRisk = "LOW";
        riskReasoning = `Low waste risk — planned preparation (${plannedServings}) tightly aligns with predicted demand (+${plannedExcessPercent.toFixed(1)}% buffer).`;
      }
    } else {
      // Planned prep not specified: evaluate risk based on historical outcome evidence
      if (avgWastePercent > 8 || excessiveFreqPercent >= 35) {
        wasteRisk = "HIGH";
        riskReasoning = `High waste risk based on historical outcomes — comparable meals averaged ${avgWastePercent.toFixed(1)}% food waste with ${excessiveFreqPercent.toFixed(0)}% frequency of excessive leftovers.`;
      } else if (avgWastePercent > 4 || avgLeftoverPercent > 10) {
        wasteRisk = "MEDIUM";
        riskReasoning = `Medium waste risk based on historical outcomes — comparable meals averaged ${avgLeftoverPercent.toFixed(1)}% unconsumed leftovers (${avgWastePercent.toFixed(1)}% wasted).`;
      } else {
        wasteRisk = "LOW";
        riskReasoning = `Low waste risk based on historical outcomes — comparable meals maintained low leftovers (${avgLeftoverPercent.toFixed(1)}%) and minimal waste (${avgWastePercent.toFixed(1)}%).`;
      }
    }

    return {
      wasteRisk,
      evidence: {
        evaluatedOutcomesCount: evaluatedCount,
        averageLeftoverPercent: Math.round(avgLeftoverPercent * 10) / 10,
        averageWastePercent: Math.round(avgWastePercent * 10) / 10,
        excessiveLeftoverFrequencyPercent: Math.round(excessiveFreqPercent * 10) / 10,
        riskReasoning,
      },
    };
  }

  /**
   * Prediction Confidence classification dynamically calculated from actual historical attendance observations.
   */
  public evaluateConfidence(
    comparableHistoricalMeals: ComparableMealMetric[],
    dayOfWeek: number,
    mealType: MealType
  ): { confidenceLevel: ConfidenceLevel; confidenceReason: string; metrics: ConfidenceMetrics } {
    const count = comparableHistoricalMeals.length;

    if (count === 0) {
      return {
        confidenceLevel: "LOW",
        confidenceReason: "Low confidence — zero comparable historical meals found. Prediction relies entirely on cohort population defaults.",
        metrics: {
          comparableMealsCount: 0,
          calculatedCoefficientOfVariation: 0,
          attendanceMean: 0,
          attendanceStdDev: 0,
        },
      };
    }

    // Dynamic statistical variance calculation across historical attendance
    const dinersList = comparableHistoricalMeals.map((m) => m.totalActualDiners);
    const mean = dinersList.reduce((sum, val) => sum + val, 0) / count;
    const variance = dinersList.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;

    const metrics: ConfidenceMetrics = {
      comparableMealsCount: count,
      calculatedCoefficientOfVariation: Math.round(cv * 1000) / 1000,
      attendanceMean: Math.round(mean * 10) / 10,
      attendanceStdDev: Math.round(stdDev * 10) / 10,
    };

    // In a 90-day dataset, weekly meals (e.g. Saturday Dinner) occur ~12-13 times
    if (count >= 10) {
      if (cv < 0.20) {
        return {
          confidenceLevel: "HIGH",
          confidenceReason: `High confidence — based on ${count} comparable historical meals with consistent attendance (CV: ${(cv * 100).toFixed(1)}%).`,
          metrics,
        };
      }
      return {
        confidenceLevel: "MEDIUM",
        confidenceReason: `Medium confidence — based on ${count} comparable meals with moderate attendance variation (CV: ${(cv * 100).toFixed(1)}%).`,
        metrics,
      };
    }

    if (count >= 5) {
      return {
        confidenceLevel: "MEDIUM",
        confidenceReason: `Medium confidence — based on ${count} comparable historical meals (CV: ${(cv * 100).toFixed(1)}%).`,
        metrics,
      };
    }

    return {
      confidenceLevel: "LOW",
      confidenceReason: `Low confidence — limited historical sample (${count} comparable meals). Model relies on broader cohort baselines.`,
      metrics,
    };
  }

  /**
   * Database-backed prediction execution using Prisma ORM.
   */
  async predictWithDatabase(
    mealId: string,
    options?: { customBufferPercent?: number; plannedServings?: number; persistToDb?: boolean }
  ): Promise<PredictionCalculationResult> {
    const { prisma } = await import("@/lib/db");

    const targetMeal = await prisma.meal.findUnique({
      where: { id: mealId },
      include: { menu: true, preferences: true },
    });

    if (!targetMeal) {
      throw new Error(`Meal with id ${mealId} not found`);
    }

    const eligibleResidents = await prisma.resident.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, residentCode: true, residentType: true },
    });

    // 90 days historical window
    const targetDate = new Date(targetMeal.mealDate);
    const ninetyDaysAgo = new Date(targetDate.getTime() - 90 * 24 * 60 * 60 * 1000);

    const pastMeals = await prisma.meal.findMany({
      where: {
        mealDate: {
          lt: targetMeal.mealDate,
          gte: ninetyDaysAgo,
        },
      },
      include: {
        preferences: true,
        scans: true,
        outcome: true,
      },
      orderBy: { mealDate: "asc" },
    });

    // Build history records for each resident
    const historyRecords: ResidentHistoryRecord[] = [];
    for (const pm of pastMeals) {
      const scannedResidentIds = new Set(pm.scans.map((s) => s.residentId));
      const prefMap = new Map(pm.preferences.map((p) => [p.residentId, p.selectedOption]));

      for (const res of eligibleResidents) {
        historyRecords.push({
          residentId: res.id,
          residentCode: res.residentCode,
          residentType: res.residentType,
          mealId: pm.id,
          mealDate: new Date(pm.mealDate),
          mealType: pm.mealType,
          menuId: pm.menuId,
          hasPreference: prefMap.has(res.id),
          selectedOption: prefMap.get(res.id),
          attended: scannedResidentIds.has(res.id),
        });
      }
    }

    // Current meal preferences map
    const currentPrefMap = new Map<string, { selectedOption: string }>();
    for (const p of targetMeal.preferences) {
      currentPrefMap.set(p.residentId, { selectedOption: p.selectedOption });
    }

    // Comparable meals (same day-of-week + meal-type) with full MealOutcome evidence
    const targetDayOfWeek = targetDate.getDay();
    const comparableHistoricalMeals: ComparableMealMetric[] = pastMeals
      .filter((pm) => new Date(pm.mealDate).getDay() === targetDayOfWeek && pm.mealType === targetMeal.mealType)
      .map((pm) => ({
        mealId: pm.id,
        mealDate: new Date(pm.mealDate),
        mealType: pm.mealType,
        menuId: pm.menuId,
        totalActualDiners: pm.outcome?.actualDiners ?? pm.scans.length,
        preparedServings: pm.outcome?.preparedServings,
        remainingServings: pm.outcome?.remainingServings,
        wastedServings: pm.outcome?.wastedServings,
      }));

    const result = this.calculateDemand(
      {
        mealId: targetMeal.id,
        mealDate: targetDate,
        mealType: targetMeal.mealType,
        menuId: targetMeal.menuId,
        plannedServings: options?.plannedServings,
        bufferPercentage: options?.customBufferPercent,
      },
      eligibleResidents,
      historyRecords,
      currentPrefMap,
      comparableHistoricalMeals,
      options?.customBufferPercent
    );

    if (options?.persistToDb) {
      await prisma.prediction.upsert({
        where: { mealId: targetMeal.id },
        create: {
          mealId: targetMeal.id,
          predictedDiners: result.expectedDiners,
          recommendedServings: result.recommendedServings,
          wasteRisk: result.wasteRisk,
          confidenceLevel: result.confidenceLevel,
          predictionFactors: result.breakdown as any,
          algorithmVersion: result.algorithmVersion,
        },
        update: {
          predictedDiners: result.expectedDiners,
          recommendedServings: result.recommendedServings,
          wasteRisk: result.wasteRisk,
          confidenceLevel: result.confidenceLevel,
          predictionFactors: result.breakdown as any,
          algorithmVersion: result.algorithmVersion,
        },
      });
    }

    return result;
  }

  async predictDemand(input: PredictionCalculationInput): Promise<PredictionCalculationResult> {
    return this.predictWithDatabase(input.mealId, {
      customBufferPercent: input.bufferPercentage,
      plannedServings: input.plannedServings,
      persistToDb: true,
    });
  }

  async calculateResidentProbabilities(mealId: string): Promise<ResidentAttendanceProbability[]> {
    const result = await this.predictWithDatabase(mealId);
    return result.individualProbabilities;
  }
}
