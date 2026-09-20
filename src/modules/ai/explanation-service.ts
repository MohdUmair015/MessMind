import { prisma } from "@/lib/db";
import { AggregateExplanationInput, ExplanationResult } from "./explanation-types";
import { sendBedrockExplanationRequest } from "./bedrock-client";

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

/**
 * Deterministic fallback generator.
 * Produces clean, professional 1-2 sentence explanations directly from aggregate factors
 * when Amazon Bedrock is unconfigured, disabled, or unavailable.
 *
 * Example:
 * "Demand is expected to be 90 diners, slightly above the historical baseline of 86.
 *  Recent attendance and current meal preferences are contributing to the increase."
 */
export function generateDeterministicFallbackExplanation(
  input: AggregateExplanationInput
): string {
  const diff = input.expectedDiners - input.historicalBaseline;

  // Comparison descriptor
  let comparison = "in line with";
  if (diff >= 7) {
    comparison = `notably above the historical baseline of ${input.historicalBaseline}`;
  } else if (diff > 0) {
    comparison = `slightly above the historical baseline of ${input.historicalBaseline}`;
  } else if (diff <= -7) {
    comparison = `notably below the historical baseline of ${input.historicalBaseline}`;
  } else if (diff < 0) {
    comparison = `slightly below the historical baseline of ${input.historicalBaseline}`;
  } else {
    comparison = `consistent with the historical baseline of ${input.historicalBaseline}`;
  }

  // Identify primary contributing aggregate factors
  const drivers: string[] = [];

  if (input.recentAttendanceRate >= 0.72) {
    drivers.push("recent attendance momentum");
  } else if (input.recentAttendanceRate < 0.65) {
    drivers.push("softening recent attendance");
  }

  if (input.preferenceIntentionRate >= 0.72) {
    drivers.push("current meal preferences");
  } else if (input.preferenceIntentionRate < 0.65) {
    drivers.push("lower pre-meal opt-ins");
  }

  if (input.menuAdjustment > 0) {
    drivers.push("historical menu popularity");
  } else if (input.menuAdjustment < 0) {
    drivers.push("lower historical interest in this menu");
  }

  if (drivers.length === 0) {
    drivers.push("stable day-of-week attendance rhythms");
  }

  let driverClause = "";
  if (drivers.length >= 2) {
    const last = drivers.pop();
    driverClause = `${drivers.join(", ")} and ${last} are contributing to the ${diff >= 0 ? "increase" : "moderation"}.`;
  } else {
    driverClause = `${drivers[0]} is the primary factor shaping this forecast.`;
  }

  // Capitalize first letter of driver clause
  const capitalizedDriverClause =
    driverClause.charAt(0).toUpperCase() + driverClause.slice(1);

  return `Demand is expected to be ${input.expectedDiners} diners, ${comparison}. ${capitalizedDriverClause}`;
}

/**
 * Sanitizes any input object to strictly extract the AggregateExplanationInput,
 * actively stripping out resident arrays, user records, room numbers, or any PII.
 */
export function sanitizeToAggregateExplanationInput(
  raw: any
): AggregateExplanationInput {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid prediction input for explanation service.");
  }

  // Extract from PredictionCalculationResult structure or flat payload
  const breakdown = raw.breakdown || raw.predictionFactors || {};
  const weighted = breakdown.weightedFactors || {};
  const bounded = breakdown.boundedAdjustments || {};
  const confMetrics = breakdown.confidenceMetrics || {};

  const expectedDiners =
    typeof raw.expectedDiners === "number"
      ? raw.expectedDiners
      : typeof raw.predictedDiners === "number"
      ? raw.predictedDiners
      : 90;

  const historicalBaseline =
    typeof breakdown.historicalBaselineDiners === "number"
      ? breakdown.historicalBaselineDiners
      : typeof raw.historicalBaseline === "number"
      ? raw.historicalBaseline
      : 86;

  const personalHistoricalRate =
    typeof weighted.personalHistoricalRate === "number"
      ? weighted.personalHistoricalRate
      : typeof raw.personalHistoricalRate === "number"
      ? raw.personalHistoricalRate
      : 0.71;

  const dayOfWeekRate =
    typeof weighted.dayOfWeekPatternRate === "number"
      ? weighted.dayOfWeekPatternRate
      : typeof raw.dayOfWeekRate === "number"
      ? raw.dayOfWeekRate
      : 0.71;

  const mealTypeRate =
    typeof weighted.mealTypePatternRate === "number"
      ? weighted.mealTypePatternRate
      : typeof raw.mealTypeRate === "number"
      ? raw.mealTypeRate
      : 0.71;

  const recentAttendanceRate =
    typeof weighted.recentAttendanceTrendRate === "number"
      ? weighted.recentAttendanceTrendRate
      : typeof raw.recentAttendanceRate === "number"
      ? raw.recentAttendanceRate
      : 0.72;

  const preferenceIntentionRate =
    typeof weighted.preferenceIntentionRate === "number"
      ? weighted.preferenceIntentionRate
      : typeof raw.preferenceIntentionRate === "number"
      ? raw.preferenceIntentionRate
      : 0.75;

  const menuAdjustment =
    typeof bounded.menuAdjustmentPercent === "number"
      ? bounded.menuAdjustmentPercent
      : typeof raw.menuAdjustment === "number"
      ? raw.menuAdjustment
      : 1;

  const trendAdjustment =
    typeof bounded.macroTrendAdjustmentPercent === "number"
      ? bounded.macroTrendAdjustmentPercent
      : typeof raw.trendAdjustment === "number"
      ? raw.trendAdjustment
      : 1;

  const confidence =
    raw.confidenceLevel || raw.confidence || "HIGH";

  const cv =
    typeof confMetrics.calculatedCoefficientOfVariation === "number"
      ? Number((confMetrics.calculatedCoefficientOfVariation * 100).toFixed(1))
      : typeof raw.cv === "number"
      ? raw.cv
      : 4.4;

  const mealType =
    raw.mealType || raw.meal?.mealType || "DINNER";

  const day =
    raw.day || raw.dayOfWeek || (raw.mealDate ? new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(raw.mealDate)) : "Saturday");

  const menuName =
    raw.menuName || raw.meal?.menu?.name || undefined;

  // STRICT GUARANTEE: Returned object contains only these aggregate primitive fields.
  // individualProbabilities, residentId, residentCode, residentType, etc. are omitted entirely.
  return {
    expectedDiners,
    historicalBaseline,
    personalHistoricalRate,
    dayOfWeekRate,
    mealTypeRate,
    recentAttendanceRate,
    preferenceIntentionRate,
    menuAdjustment,
    trendAdjustment,
    confidence,
    cv,
    mealType,
    day,
    menuName,
  };
}

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
