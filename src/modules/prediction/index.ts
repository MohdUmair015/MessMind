import { IPredictionEngine } from "./prediction-engine.interface";
import { PredictionCalculationInput, PredictionCalculationResult, ResidentAttendanceProbability } from "./types";

/**
 * Deterministic Prediction Engine
 * 
 * NOTE: As part of Phase 1 (Foundation Setup), this module establishes the typed interfaces
 * and architecture. The mathematical calculations (40% personal, 20% day, 15% meal, 15% trend,
 * 10% preference + bounded menu/trend adjustments + sparse-data fallback) will be implemented
 * and unit-tested in Phase 2.
 */
export class StubPredictionEngine implements IPredictionEngine {
  async predictDemand(input: PredictionCalculationInput): Promise<PredictionCalculationResult> {
    throw new Error(
      `Prediction Engine is in foundation setup stage. Deterministic calculation for meal ${input.mealId} will be executed in Phase 2.`
    );
  }

  async calculateResidentProbabilities(mealId: string): Promise<ResidentAttendanceProbability[]> {
    throw new Error(
      `Resident probability calculation for meal ${mealId} will be executed in Phase 2.`
    );
  }
}

export * from "./types";
export * from "./prediction-engine.interface";
