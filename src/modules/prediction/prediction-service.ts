import { prisma } from "@/lib/db";
import { predictionEngine } from "./index";
import { PredictionCalculationResult } from "./types";

export class PredictionService {
  /**
   * Retrieves an existing prediction from PostgreSQL or generates and persists one if missing or forceRefresh is requested.
   */
  async getOrGeneratePrediction(
    mealId: string,
    options?: { forceRefresh?: boolean; customBufferPercent?: number; plannedServings?: number }
  ): Promise<PredictionCalculationResult> {
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
      include: { prediction: true, menu: true },
    });

    if (!meal) {
      throw new Error(`Meal with id '${mealId}' not found.`);
    }

    // Return existing cached prediction if available and forceRefresh is false
    if (meal.prediction && !options?.forceRefresh && options?.customBufferPercent === undefined) {
      const pred = meal.prediction;
      const rawFactors = pred.predictionFactors as any;

      return {
        mealId: pred.mealId,
        expectedDiners: pred.predictedDiners,
        recommendedServings: pred.recommendedServings,
        wasteRisk: pred.wasteRisk,
        confidenceLevel: pred.confidenceLevel,
        confidenceReason: rawFactors?.confidenceMetrics?.confidenceReason ?? `Historical confidence based on ${rawFactors?.confidenceMetrics?.comparableMealsCount ?? 12} comparable meals`,
        breakdown: rawFactors,
        individualProbabilities: [],
        algorithmVersion: pred.algorithmVersion,
      };
    }

    // Otherwise calculate fresh prediction using the deterministic engine and persist
    return predictionEngine.predictWithDatabase(mealId, {
      customBufferPercent: options?.customBufferPercent,
      plannedServings: options?.plannedServings,
      persistToDb: true,
    });
  }

  /**
   * Fetches latest predictions with associated meal and menu metadata.
   */
  async getRecentPredictions(limit = 10) {
    return prisma.prediction.findMany({
      include: {
        meal: {
          include: {
            menu: true,
            outcome: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export const predictionService = new PredictionService();
