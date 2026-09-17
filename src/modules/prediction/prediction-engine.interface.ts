import { PredictionCalculationInput, PredictionCalculationResult, ResidentAttendanceProbability } from "./types";

export interface IPredictionEngine {
  /**
   * Calculates deterministic meal demand by aggregating individual resident attendance probabilities
   * plus bounded adjustments for menu history and recent trends.
   */
  predictDemand(input: PredictionCalculationInput): Promise<PredictionCalculationResult>;

  /**
   * Calculates individual attendance probability for each eligible resident
   * using the 40/20/15/15/10 weighting and sparse-data fallback hierarchy.
   */
  calculateResidentProbabilities(mealId: string): Promise<ResidentAttendanceProbability[]>;
}
