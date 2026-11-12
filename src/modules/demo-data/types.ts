import { MealType, ResidentType, WasteRiskLevel, ConfidenceLevel } from "@/types";
import {
  WeightedFactorsBreakdown,
  BoundedAdjustmentsBreakdown,
  HistoricalWasteEvidence,
  ConfidenceMetrics,
  ResidentAttendanceProbability,
  ResidentHistoryRecord,
  ComparableMealMetric,
} from "@/modules/prediction/types";

/**
 * Privacy-safe synthetic resident model.
 * Contains ZERO real PII.
 */
export interface DemoResident {
  id: string;
  residentCode: string; // STU-001..050, CORP-001..075
  residentType: ResidentType;
  archetype:
    | "consistent"
    | "weekend_heavy"
    | "weekday_heavy"
    | "dinner_heavy"
    | "breakfast_heavy"
    | "flaky_preference"
    | "occasional"
    | "sparse";
  baselineAttendanceRate: number;
  preferenceReliability: number;
}

export interface DemoMenu {
  id: string;
  name: string;
  category: string;
  items: string[];
}

export interface DemoMealOutcome {
  id: string;
  mealId: string;
  preparedServings: number;
  actualDiners: number;
  attendanceSource: string; // "SCANNER_SYNC" | "MANUAL_DEMO_OVERRIDE"
  remainingServings: number;
  wastedServings: number;
  estimatedSurplus: number | null;
  recordedAt: string;
}

export interface DemoPredictionBreakdown {
  eligiblePopulation: number;
  historicalBaselineDiners: number;
  weightedFactors: WeightedFactorsBreakdown;
  boundedAdjustments: BoundedAdjustmentsBreakdown;
  wasteEvidence: HistoricalWasteEvidence;
  confidenceMetrics: ConfidenceMetrics;
}

export interface DemoPrediction {
  id: string;
  mealId: string;
  predictedDiners: number;
  recommendedServings: number;
  wasteRisk: WasteRiskLevel;
  confidenceLevel: ConfidenceLevel;
  confidenceReason: string;
  predictionFactors: DemoPredictionBreakdown;
  algorithmVersion: string;
  explanation: string;
  explanationSource: "bedrock" | "fallback";
  createdAt: string;
}

export interface DemoMeal {
  id: string;
  mealDate: string; // ISO string
  mealType: MealType;
  menuId: string;
  isServed: boolean;
  preferenceDeadline: string;
  menu: DemoMenu;
  prediction?: DemoPrediction;
  outcome?: DemoMealOutcome | null;
  _count: {
    scans: number;
    preferences: number;
  };
}

export interface DemoOutcomeComparisonRow {
  mealId: string;
  mealDate: string;
  mealType: string;
  menuName: string;
  predictedDiners: number | null;
  actualDiners: number;
  preparedServings: number;
  remainingServings: number;
  wastedServings: number;
  errorPercent: number | null;
}

export interface DemoAnalyticsSummary {
  totalHistoricalMeals: number;
  totalOutcomesRecorded: number;
  overallMapePercent: number;
  accuracyWithinFivePercentRate: number;
  averageFoodWastePercent: number;
  averageLeftoverPercent: number;
  totalServingsWasted: number;
  totalServingsPrepared: number;
  totalActualDinersServed: number;
  recentOutcomeComparisons: DemoOutcomeComparisonRow[];
}

export interface DemoMealDetailResult {
  meal: DemoMeal;
  eligibleCount: number;
  prediction: DemoPrediction | null;
  predictionError: number | null;
  uniqueScansCount: number;
  duplicateScansSuppressedCount: number;
  authoritativeActualDiners: number | null;
  actualPreparedServings: number | null;
  estimatedSurplus: number | null;
  attendanceStatus: string;
}

/**
 * Complete typed static demo snapshot container.
 */
export interface DemoSnapshot {
  disclaimer: string;
  generatedBenchmarkDate: string;
  targetMealId: string;
  eligibleResidentsCount: number;
  studentCount: number;
  corporateCount: number;
  residents: DemoResident[];
  menus: DemoMenu[];
  targetMeal: DemoMeal;
  mealsTimeline: DemoMeal[];
  targetPrediction: DemoPrediction;
  analytics: DemoAnalyticsSummary;
  comparableHistoricalMeals: ComparableMealMetric[];
  residentHistoryRecords: ResidentHistoryRecord[];
  targetMealPreferences: Array<{ residentId: string; selectedOption: string }>;
}
