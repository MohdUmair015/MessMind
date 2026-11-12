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
import { PureDeterministicPredictionEngine } from "./pure-deterministic-engine";

export { PureDeterministicPredictionEngine };

export class DeterministicPredictionEngine
  extends PureDeterministicPredictionEngine
  implements IPredictionEngine
{
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
