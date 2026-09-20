import { MealType, WasteRiskLevel, ConfidenceLevel } from "@/types";

export interface MealListItem {
  id: string;
  mealDate: string;
  mealType: MealType;
  menuName: string;
  menuItems: string[];
  isServed: boolean;
  predictedDiners?: number;
  recommendedServings?: number;
  wasteRisk?: WasteRiskLevel;
  confidenceLevel?: ConfidenceLevel;
  actualDiners?: number;
  wastedServings?: number;
}

export interface RecordMealOutcomeInput {
  mealId: string;
  preparedServings: number;
  actualDiners?: number;
  remainingServings: number;
  wastedServings: number;
  isDemoOverride?: boolean;
}

export interface MealDetailDTO {
  id: string;
  mealDate: string;
  mealType: MealType;
  menuId: string;
  menuName: string;
  menuItems: string[];
  isServed: boolean;
  preferenceDeadline: string;
  prediction?: {
    predictedDiners: number;
    recommendedServings: number;
    wasteRisk: WasteRiskLevel;
    confidenceLevel: ConfidenceLevel;
    explanation?: string | null;
    factors: {
      historicalBaseline: number;
      preferenceSignal: number;
      recentTrend: number;
      menuEffect: number;
      comparableMealsCount: number;
    };
  };
  outcome?: {
    preparedServings: number;
    actualDiners: number;
    remainingServings: number;
    wastedServings: number;
    estimatedSurplus?: number | null;
    attendanceSource?: string;
    uniqueScansCount?: number;
    recordedAt: string;
    predictionError: number | null;
  };
}

