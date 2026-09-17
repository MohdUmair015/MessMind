import { ConfidenceLevel, MealType, WasteRiskLevel } from "@/types";

/**
 * Strictly aggregated, anonymized payload passed to Gemini for natural-language explanations.
 * 
 * PRIVACY INVARIANT:
 * Never include resident names, resident IDs, individual attendance rows, room numbers,
 * or PII in this payload.
 */
export interface AggregatedExplanationPayload {
  dayOfWeek: string;
  mealType: MealType;
  mealDate: string;
  menuName: string;
  menuItems: string[];
  expectedDiners: number;
  recommendedServings: number;
  historicalBaselineDiners: number;
  dayOfWeekEffectPercent: number;
  recentTrendPercent: number;
  preferenceSignalPercent: number;
  menuAdjustmentPercent: number;
  wasteRisk: WasteRiskLevel;
  confidenceLevel: ConfidenceLevel;
  confidenceReason: string;
}

export interface GeminiExplanationResult {
  summary: string;
  actionableInsights: string[];
  generatedAt: string;
}
