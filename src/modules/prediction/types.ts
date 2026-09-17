import { MealType, WasteRiskLevel, ConfidenceLevel } from "@/types";

export interface ResidentAttendanceProbability {
  residentId: string;
  residentType: 'STUDENT' | 'CORPORATE';
  probability: number;
  factors: {
    personalHistoricalWeight: number;
    dayOfWeekWeight: number;
    mealTypeWeight: number;
    recentTrendWeight: number;
    preferenceWeight: number;
    menuAdjustment: number;
  };
}

export interface PredictionCalculationInput {
  mealId: string;
  mealDate: Date;
  mealType: MealType;
  menuId: string;
  bufferPercentage?: number;
}

export interface PredictionCalculationResult {
  mealId: string;
  expectedDiners: number;
  recommendedServings: number;
  wasteRisk: WasteRiskLevel;
  confidenceLevel: ConfidenceLevel;
  confidenceReason: string;
  breakdown: {
    eligiblePopulation: number;
    historicalBaselineDiners: number;
    dayOfWeekEffectPercent: number;
    mealTypeEffectPercent: number;
    recentTrendPercent: number;
    preferenceSignalPercent: number;
    menuAdjustmentPercent: number;
    comparableMealsCount: number;
  };
  individualProbabilities?: ResidentAttendanceProbability[];
  algorithmVersion: string;
}
