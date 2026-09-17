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
} from "./types";
import { IPredictionEngine } from "./prediction-engine.interface";

export class DeterministicPredictionEngine implements IPredictionEngine {
  private readonly algorithmVersion = "v1.0-deterministic";

  /**
   * Weights defined in specification:
   * Personal historical behavior: 40%
   * Day-of-week pattern:          20%
   * Meal-type pattern:            15%
   * Recent attendance trend:      15%
   * Current preference behavior:  10%
   */
  private readonly WEIGHT_PERSONAL_HIST = 0.40;
  private readonly WEIGHT_DAY_OF_WEEK = 0.20;
  private readonly WEIGHT_MEAL_TYPE = 0.15;
  private readonly WEIGHT_RECENT_TREND = 0.15;
  private readonly WEIGHT_CURRENT_PREF = 0.10;

  private readonly MAX_MENU_ADJUSTMENT = 0.10;   // ±10% bounded adjustment
  private readonly MAX_TREND_ADJUSTMENT = 0.10;  // ±10% bounded adjustment
  private readonly DEFAULT_BUFFER_PERCENT = 5.0; // 5% configurable buffer

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

    // 3. Compute Per-Resident Attendance Probability
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
    const recommendedServings = Math.ceil(expectedDiners * (1 + buffer));

    // 6. Confidence Level & Basis
    const { confidenceLevel, confidenceReason } = this.evaluateConfidence(
      comparableHistoricalMeals,
      targetDayOfWeek,
      targetMealType
    );

    // 7. Waste Risk
    const planned = input.plannedServings;
    const wasteRisk = this.evaluateWasteRisk(expectedDiners, planned ?? recommendedServings);

    // 8. Structured Prediction Factors for Manager UI & Gemini
    const historicalBaselineDiners = Math.round(populationBaselines.dayMealAverageAttendanceRate * eligibleResidents.length);
    const recentTrendPercent = Math.round(
      individualProbabilities.reduce((acc, p) => acc + (p.factors.recentTrendRate - p.factors.personalHistoricalRate), 0) /
        (eligibleResidents.length || 1) * 100
    );

    const preferenceCount = currentMealPreferences.size;
    const preferenceSignalPercent = preferenceCount > 0
      ? Math.round(((preferenceCount / eligibleResidents.length) - populationBaselines.dayMealAverageAttendanceRate) * 100)
      : 0;

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
        dayOfWeekEffectPercent: Math.round((populationBaselines.dayAverageAttendanceRate - populationBaselines.overallAverageAttendanceRate) * 100),
        mealTypeEffectPercent: Math.round((populationBaselines.mealTypeAverageAttendanceRate - populationBaselines.overallAverageAttendanceRate) * 100),
        recentTrendPercent: Math.max(-10, Math.min(10, recentTrendPercent)),
        preferenceSignalPercent: Math.max(-15, Math.min(15, preferenceSignalPercent)),
        menuAdjustmentPercent: Math.round(menuAdjustment * 100),
        comparableMealsCount: comparableHistoricalMeals.length,
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

    // 1. Personal Historical Attendance (40%)
    let personalHistRate = cohortBaseline;
    if (history.length >= 3) {
      const attendedCount = history.filter((h) => h.attended).length;
      personalHistRate = attendedCount / history.length;
      fallbackLevel = 'resident_meal';
    }

    // 2. Day-of-Week Pattern (20%)
    const dayRecords = history.filter((h) => h.mealDate.getDay() === targetDayOfWeek);
    let dayOfWeekRate = personalHistRate;
    if (dayRecords.length >= 2) {
      const dayAttended = dayRecords.filter((h) => h.attended).length;
      dayOfWeekRate = dayAttended / dayRecords.length;
      fallbackLevel = 'resident_day_meal';
    }

    // 3. Meal-Type Pattern (15%)
    const mealTypeRecords = history.filter((h) => h.mealType === targetMealType);
    let mealTypeRate = personalHistRate;
    if (mealTypeRecords.length >= 2) {
      const mealTypeAttended = mealTypeRecords.filter((h) => h.attended).length;
      mealTypeRate = mealTypeAttended / mealTypeRecords.length;
    }

    // Menu specific history for resident
    const menuRecords = history.filter((h) => h.menuId === targetMenuId);
    if (menuRecords.length >= 2 && dayRecords.length >= 2) {
      fallbackLevel = 'resident_full';
    }

    // 4. Recent Attendance Trend (15%) - Last 14 days
    const fourteenDaysAgo = new Date(targetDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    const recentRecords = history.filter((h) => h.mealDate >= fourteenDaysAgo);
    let recentTrendRate = personalHistRate;
    if (recentRecords.length >= 2) {
      const recentAttended = recentRecords.filter((h) => h.attended).length;
      const rawRecentRate = recentAttended / recentRecords.length;
      // Bounded trend adjustment: ±10% from baseline
      const trendDelta = Math.max(-this.MAX_TREND_ADJUSTMENT, Math.min(this.MAX_TREND_ADJUSTMENT, rawRecentRate - personalHistRate));
      recentTrendRate = Math.max(0, Math.min(1, personalHistRate + trendDelta));
    }

    // 5. Current Preference Behavior (10%)
    // Preference is an intention signal. Evaluate historical preference reliability.
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
        preferenceSignalRate = cohortBaseline * 0.25; // Default low probability for no preference
      }
    }

    // Weighted raw probability
    const rawWeighted =
      this.WEIGHT_PERSONAL_HIST * personalHistRate +
      this.WEIGHT_DAY_OF_WEEK * dayOfWeekRate +
      this.WEIGHT_MEAL_TYPE * mealTypeRate +
      this.WEIGHT_RECENT_TREND * recentTrendRate +
      this.WEIGHT_CURRENT_PREF * preferenceSignalRate;

    // Apply bounded menu adjustment (±10%)
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
      return 0.0; // Sparse data fallback: no menu adjustment for new/infrequent menu
    }

    const menuAttended = menuRecords.filter((h) => h.attended).length;
    const menuRate = menuAttended / menuRecords.length;

    // Day/Meal baseline
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

    // Student baseline
    const studentHistory = history.filter((h) => h.residentType === "STUDENT");
    const studentBaseline = studentHistory.length > 0
      ? studentHistory.filter((h) => h.attended).length / studentHistory.length
      : 0.72;

    // Corporate baseline
    const corporateHistory = history.filter((h) => h.residentType === "CORPORATE");
    const corporateBaseline = corporateHistory.length > 0
      ? corporateHistory.filter((h) => h.attended).length / corporateHistory.length
      : 0.78;

    // Day average
    const dayHistory = history.filter((h) => h.mealDate.getDay() === targetDayOfWeek);
    const dayAverageAttendanceRate = dayHistory.length > 0
      ? dayHistory.filter((h) => h.attended).length / dayHistory.length
      : overallAverageAttendanceRate;

    // Meal type average
    const mealHistory = history.filter((h) => h.mealType === targetMealType);
    const mealTypeAverageAttendanceRate = mealHistory.length > 0
      ? mealHistory.filter((h) => h.attended).length / mealHistory.length
      : overallAverageAttendanceRate;

    // Day + Meal average
    const dayMealHistory = history.filter(
      (h) => h.mealDate.getDay() === targetDayOfWeek && h.mealType === targetMealType
    );
    const dayMealAverageAttendanceRate = dayMealHistory.length > 0
      ? dayMealHistory.filter((h) => h.attended).length / dayMealHistory.length
      : overallAverageAttendanceRate;

    // Student Preference Reliability
    const studentPref = studentHistory.filter((h) => h.hasPreference);
    const studentPrefReliability = studentPref.length > 0
      ? studentPref.filter((h) => h.attended).length / studentPref.length
      : 0.85;

    // Corporate Preference Reliability
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
   * Prototype Waste Risk Classification based on planned vs predicted.
   * Documented as prototype business rules.
   */
  public evaluateWasteRisk(expectedDiners: number, plannedServings: number): WasteRiskLevel {
    if (expectedDiners <= 0) return "LOW";
    const excessPercentage = (plannedServings - expectedDiners) / expectedDiners;

    if (excessPercentage > 0.20) {
      return "HIGH"; // >20% over-preparation
    }
    if (excessPercentage > 0.08) {
      return "MEDIUM"; // 8% to 20% over-preparation
    }
    return "LOW"; // <=8% buffer
  }

  /**
   * Prediction Confidence classification based on historical volume & consistency.
   */
  public evaluateConfidence(
    comparableHistoricalMeals: ComparableMealMetric[],
    dayOfWeek: number,
    mealType: MealType
  ): { confidenceLevel: ConfidenceLevel; confidenceReason: string } {
    const count = comparableHistoricalMeals.length;

    // In a 90-day historical window, a specific day-of-week meal (e.g. Saturday Dinner) occurs ~12 times.
    if (count >= 10) {
      // Check variation
      const dinersList = comparableHistoricalMeals.map((m) => m.totalActualDiners);
      const mean = dinersList.reduce((sum, val) => sum + val, 0) / count;
      const variance = dinersList.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? stdDev / mean : 0;

      if (cv < 0.20) {
        return {
          confidenceLevel: "HIGH",
          confidenceReason: `High confidence — based on ${count} comparable historical meals with consistent attendance (CV: ${(cv * 100).toFixed(1)}%).`,
        };
      }
      return {
        confidenceLevel: "MEDIUM",
        confidenceReason: `Medium confidence — based on ${count} comparable meals with moderate attendance variation.`,
      };
    }

    if (count >= 5) {
      return {
        confidenceLevel: "MEDIUM",
        confidenceReason: `Medium confidence — based on ${count} comparable historical meals.`,
      };
    }

    return {
      confidenceLevel: "LOW",
      confidenceReason: `Low confidence — limited historical data (${count} comparable meals). Model relies on general cohort baselines.`,
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

    // Comparable meals (same day-of-week + meal-type)
    const targetDayOfWeek = targetDate.getDay();
    const comparableHistoricalMeals: ComparableMealMetric[] = pastMeals
      .filter((pm) => new Date(pm.mealDate).getDay() === targetDayOfWeek && pm.mealType === targetMeal.mealType)
      .map((pm) => ({
        mealId: pm.id,
        mealDate: new Date(pm.mealDate),
        mealType: pm.mealType,
        menuId: pm.menuId,
        totalActualDiners: pm.outcome?.actualDiners ?? pm.scans.length,
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
