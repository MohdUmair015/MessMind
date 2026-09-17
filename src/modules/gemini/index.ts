import { IGeminiExplanationService } from "./gemini-service.interface";
import { AggregatedExplanationPayload, GeminiExplanationResult } from "./types";

/**
 * Gemini Natural Language Explanation Service
 * 
 * ROLE IN ARCHITECTURE:
 * - Deterministic engine performs 100% of mathematical prediction and buffer calculations.
 * - Gemini API translates aggregated factors into clean, manager-friendly explanations.
 * - Sensitive resident PII is strictly forbidden from reaching this layer.
 */
export class StubGeminiExplanationService implements IGeminiExplanationService {
  async generateExplanation(payload: AggregatedExplanationPayload): Promise<GeminiExplanationResult> {
    // Stub implementation for foundation stage
    return {
      summary: `Expected demand for ${payload.dayOfWeek} ${payload.mealType} is ${payload.expectedDiners} diners (historical baseline: ${payload.historicalBaselineDiners}). Recommendations factored in current preference (+${payload.preferenceSignalPercent}%) and menu history.`,
      actionableInsights: [
        `Recommended preparation is ${payload.recommendedServings} servings with ${payload.wasteRisk} waste risk.`,
        `Confidence level is ${payload.confidenceLevel}: ${payload.confidenceReason}.`,
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}

export * from "./types";
export * from "./gemini-service.interface";
