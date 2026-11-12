import {
  demoSnapshot,
  DEMO_TARGET_MEAL_ID,
  demoComparableHistoricalMeals,
  demoResidentHistoryRecords,
  demoTargetMealPreferences,
} from "./snapshot";
import {
  DemoSnapshot,
  DemoMeal,
  DemoMealDetailResult,
  DemoAnalyticsSummary,
} from "./types";
import { purePredictionEngine } from "@/modules/prediction/pure-deterministic-engine";
import { PredictionCalculationResult } from "@/modules/prediction/types";

/**
 * Pure Browser-Safe Static Demo Data Provider
 *
 * ARCHITECTURAL ROLE:
 * - Provides read and computation access to the synthetic demo dataset.
 * - ZERO Prisma, PostgreSQL, Docker, .env, or AWS dependencies.
 * - Safely runnable in both Next.js App Router pre-rendering and browser hydration.
 */
export class DemoDataProvider {
  private snapshot: DemoSnapshot;

  constructor(snapshot: DemoSnapshot = demoSnapshot) {
    this.snapshot = snapshot;
  }

  /**
   * Returns the complete typed snapshot.
   */
  public getSnapshot(): DemoSnapshot {
    return this.snapshot;
  }

  /**
   * Retrieves the upcoming benchmark meal with its attached prediction and resident count.
   * Mirrors `mealService.getUpcomingMealWithPrediction()`.
   */
  public getUpcomingMealWithPrediction(): {
    meal: DemoMeal;
    eligibleResidentsCount: number;
    prediction: DemoMeal["prediction"];
  } {
    return {
      meal: this.snapshot.targetMeal,
      eligibleResidentsCount: this.snapshot.eligibleResidentsCount,
      prediction: this.snapshot.targetPrediction,
    };
  }

  /**
   * Retrieves a filtered/paginated list of meals from the demo timeline.
   * Mirrors `mealService.getMealsList(options)`.
   */
  public getMealsList(options?: {
    filter?: "all" | "upcoming" | "completed";
    limit?: number;
    offset?: number;
  }): {
    meals: DemoMeal[];
    totalCount: number;
  } {
    let filtered = [...this.snapshot.mealsTimeline];

    if (options?.filter === "upcoming") {
      filtered = filtered.filter((m) => !m.isServed);
    } else if (options?.filter === "completed") {
      filtered = filtered.filter((m) => m.isServed);
    }

    const totalCount = filtered.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;

    return {
      meals: filtered.slice(offset, offset + limit),
      totalCount,
    };
  }

  /**
   * Retrieves full details for a single meal by ID.
   * Mirrors `mealService.getMealDetailById(id)`.
   */
  public getMealDetailById(mealId: string): DemoMealDetailResult | null {
    const meal = this.snapshot.mealsTimeline.find((m) => m.id === mealId);
    if (!meal) {
      return null;
    }

    const isUpcoming = !meal.isServed;
    const uniqueScansCount = meal._count.scans;
    const duplicateScansSuppressedCount = 0;

    let authoritativeActualDiners: number | null = null;
    let actualPreparedServings: number | null = null;
    let estimatedSurplus: number | null = null;
    let predictionError: number | null = null;

    if (meal.outcome) {
      authoritativeActualDiners = meal.outcome.actualDiners;
      actualPreparedServings = meal.outcome.preparedServings;
      estimatedSurplus = meal.outcome.estimatedSurplus;
    } else if (uniqueScansCount > 0) {
      authoritativeActualDiners = uniqueScansCount;
    }

    if (authoritativeActualDiners !== null && meal.prediction?.predictedDiners) {
      const pred = meal.prediction.predictedDiners;
      predictionError = Math.round((Math.abs(authoritativeActualDiners - pred) / pred) * 1000) / 10;
    }

    return {
      meal,
      eligibleCount: this.snapshot.eligibleResidentsCount,
      prediction: meal.prediction ?? null,
      predictionError,
      uniqueScansCount,
      duplicateScansSuppressedCount,
      authoritativeActualDiners,
      actualPreparedServings,
      estimatedSurplus,
      attendanceStatus: isUpcoming ? "UPCOMING_SERVICE" : "COMPLETED_AUDITED",
    };
  }

  /**
   * Retrieves aggregate KPI analytics and historical comparisons.
   * Mirrors `analyticsService.getAnalyticsSummary()`.
   */
  public getAnalyticsSummary(): DemoAnalyticsSummary {
    return this.snapshot.analytics;
  }

  /**
   * Retrieves unique scanner count for a meal.
   * Mirrors `hostelDataProvider.getUniqueDinerCount(mealId)`.
   */
  public getUniqueDinerCount(mealId: string): number {
    const meal = this.snapshot.mealsTimeline.find((m) => m.id === mealId);
    return meal?._count.scans ?? 0;
  }

  /**
   * Executes the pure deterministic prediction engine against the in-memory snapshot.
   * Preserves exact mathematical calculation logic without database access.
   */
  public runDeterministicPredictionOnSnapshot(
    mealId: string = DEMO_TARGET_MEAL_ID,
    customBufferPercent: number = 5.0
  ): PredictionCalculationResult {
    const meal = this.snapshot.mealsTimeline.find((m) => m.id === mealId) || this.snapshot.targetMeal;

    const prefMap = new Map<string, { selectedOption: string }>();
    for (const p of this.snapshot.targetMealPreferences) {
      prefMap.set(p.residentId, { selectedOption: p.selectedOption });
    }

    return purePredictionEngine.calculateDemand(
      {
        mealId: meal.id,
        mealDate: new Date(meal.mealDate),
        mealType: meal.mealType,
        menuId: meal.menuId,
        bufferPercentage: customBufferPercent,
      },
      this.snapshot.residents,
      this.snapshot.residentHistoryRecords,
      prefMap,
      this.snapshot.comparableHistoricalMeals,
      customBufferPercent
    );
  }
}

export const demoDataProvider = new DemoDataProvider();
