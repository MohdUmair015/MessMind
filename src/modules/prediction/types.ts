import { MealType, WasteRiskLevel, ConfidenceLevel, ResidentType } from "@/types";

export interface ResidentAttendanceProbability {
  residentId: string;
  residentCode: string;
  residentType: ResidentType;
  probability: number;
  factors: {
    personalHistoricalRate: number;
    dayOfWeekRate: number;
    mealTypeRate: number;
    recentTrendRate: number;
    preferenceSignalRate: number;
    menuAdjustment: number;
    fallbackLevel: 'resident_full' | 'resident_day_meal' | 'resident_meal' | 'population_baseline';
  };
}

export interface PredictionCalculationInput {
  mealId: string;
  mealDate: Date;
  mealType: MealType;
  menuId: string;
  plannedServings?: number;
  bufferPercentage?: number;
}

export interface PredictionCalculationResult {
  mealId: string;
  expectedDiners: number;
  recommendedServings: number;
  plannedServings?: number;
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
  individualProbabilities: ResidentAttendanceProbability[];
  algorithmVersion: string;
}

/**
 * Clean data structures for testable deterministic prediction
 */
export interface ResidentHistoryRecord {
  residentId: string;
  residentCode: string;
  residentType: ResidentType;
  mealId: string;
  mealDate: Date;
  mealType: MealType;
  menuId: string;
  hasPreference: boolean;
  selectedOption?: string;
  attended: boolean;
}

export interface ComparableMealMetric {
  mealId: string;
  mealDate: Date;
  mealType: MealType;
  menuId: string;
  totalActualDiners: number;
}
