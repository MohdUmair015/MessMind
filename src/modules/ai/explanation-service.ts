import { prisma } from "@/lib/db";
import { AggregateExplanationInput, ExplanationResult } from "./explanation-types";
import { sendBedrockExplanationRequest } from "./bedrock-client";
import {
  generateDeterministicFallbackExplanation,
  sanitizeToAggregateExplanationInput,
} from "./deterministic-explainer";

export {
  generateDeterministicFallbackExplanation,
  sanitizeToAggregateExplanationInput,
};

/**
 * Amazon Bedrock Explanation Service
 *
 * ARCHITECTURAL ROLE:
 * - Deterministic engine performs 100% of mathematical prediction and buffer calculations.
 * - This service provides concise (1-2 sentence) manager-friendly natural language explanations.
 * - Bedrock is strictly an explanation layer; it never calculates diners, prep, or waste metrics.
 * - Resilient fallback: If Bedrock is unconfigured, unreachable, or fails, the service returns
 *   a deterministic natural language explanation without breaking the application.
 * - Privacy: Absolutely zero resident PII (names, IDs, room numbers, individual records) is sent.
 */

export class ExplanationService {
  /**
   * Generates a concise manager-friendly explanation for a prediction.
   * Calls Amazon Bedrock via Converse API; falls back gracefully to the deterministic
   * fallback on any Bedrock failure or missing configuration.
   */
  async generateExplanation(
    input: AggregateExplanationInput
  ): Promise<ExplanationResult> {
    const startTime = Date.now();

    // Verify input is clean aggregate data
    const aggregateData = sanitizeToAggregateExplanationInput(input);

    try {
      // Attempt Bedrock Converse call
      const { text, modelId } = await sendBedrockExplanationRequest(aggregateData);
      const latencyMs = Date.now() - startTime;

      return {
        explanation: text,
        source: "bedrock",
        modelId,
        latencyMs,
      };
    } catch (err: any) {
      // Graceful fallback on any failure: missing BEDROCK_MODEL_ID, unconfigured credentials,
      // network timeout, rate limit, or AWS service error.
      const fallbackText = generateDeterministicFallbackExplanation(aggregateData);
      const latencyMs = Date.now() - startTime;

      return {
        explanation: fallbackText,
        source: "fallback",
        latencyMs,
      };
    }
  }

  /**
   * High-level helper: Retrieves prediction data for a meal from PostgreSQL,
   * generates or retrieves the explanation, and updates the database cache if needed.
   */
  async getExplanationForMeal(mealId: string): Promise<ExplanationResult> {
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
      include: {
        menu: true,
        prediction: true,
      },
    });

    if (!meal || !meal.prediction) {
      // Return default deterministic fallback for empty/not-found meal
      const fallback = generateDeterministicFallbackExplanation({
        expectedDiners: 90,
        historicalBaseline: 86,
        personalHistoricalRate: 0.71,
        dayOfWeekRate: 0.71,
        mealTypeRate: 0.71,
        recentAttendanceRate: 0.72,
        preferenceIntentionRate: 0.75,
        menuAdjustment: 1,
        trendAdjustment: 1,
        confidence: "HIGH",
        cv: 4.4,
        mealType: "DINNER",
        day: "Saturday",
      });

      return {
        explanation: fallback,
        source: "fallback",
      };
    }

    const prediction = meal.prediction;

    // 1. Check whether prediction.explanation is non-null and non-empty (cache hit)
    if (prediction.explanation && prediction.explanation.trim().length > 0) {
      const source: "bedrock" | "fallback" =
        prediction.explanationSource === "bedrock" ? "bedrock" : "fallback";

      return {
        explanation: prediction.explanation.trim(),
        source,
        cached: true,
      };
    }

    // 2. If no cached explanation exists, build aggregate input
    const aggregateInput = sanitizeToAggregateExplanationInput({
      expectedDiners: prediction.predictedDiners,
      confidenceLevel: prediction.confidenceLevel,
      predictionFactors: prediction.predictionFactors,
      mealType: meal.mealType,
      mealDate: meal.mealDate,
      menuName: meal.menu.name,
    });

    // 3. Call the existing generateExplanation() flow (Bedrock with resilient fallback)
    const result = await this.generateExplanation(aggregateInput);

    // 4. Preserve existing non-blocking database cache write for newly generated explanations
    try {
      if (result.explanation) {
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            explanation: result.explanation,
            explanationSource: result.source,
          },
        });
      }
    } catch (dbErr) {
      // Non-blocking: failure to cache to DB should never fail the explanation delivery
      console.warn("Could not cache explanation to database:", dbErr);
    }

    return result;
  }
}

export const explanationService = new ExplanationService();
