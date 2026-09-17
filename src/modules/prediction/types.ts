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

export interface WeightedFactorsBreakdown {
  personalHistoricalRate: number;     // 40% weight
  dayOfWeekPatternRate: number;       // 20% weight
  mealTypePatternRate: number;        // 15% weight
  recentAttendanceTrendRate: number;  // 15% weight
  preferenceIntentionRate: number;    // 10% weight (intention signal)
}

export interface BoundedAdjustmentsBreakdown {
  menuAdjustmentPercent: number;      // Clamped to ±10% max
  macroTrendAdjustmentPercent: number;// Clamped to ±10% max
}

export interface HistoricalWasteEvidence {
  evaluatedOutcomesCount: number;
  averageLeftoverPercent: number;
  averageWastePercent: number;
  excessiveLeftoverFrequencyPercent: number;
  riskReasoning: string;
}

export interface ConfidenceMetrics {
  comparableMealsCount: number;
  calculatedCoefficientOfVariation: number;
  attendanceMean: number;
  attendanceStdDev: number;
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
    weightedFactors: WeightedFactorsBreakdown;
    boundedAdjustments: BoundedAdjustmentsBreakdown;
    wasteEvidence: HistoricalWasteEvidence;
    confidenceMetrics: ConfidenceMetrics;
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
  preparedServings?: number;
  remainingServings?: number;
  wastedServings?: number;
}
