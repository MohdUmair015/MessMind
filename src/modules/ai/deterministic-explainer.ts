import { AggregateExplanationInput } from "./explanation-types";

/**
 * Deterministic Natural Language Demand Explanation Generator (Browser-Safe)
 *
 * ARCHITECTURAL ROLE:
 * - 100% pure TypeScript with ZERO external cloud SDK or database dependencies.
 * - Safely runnable in any browser, static hosting environment, or server runtime.
 * - Translates aggregated prediction factors into a concise, professional 1-2 sentence
 *   operational explanation for mess/kitchen managers.
 * - Used as the reliable fallback when Amazon Bedrock is unconfigured, unreachable, or
 *   in static demo deployments (GitHub Pages).
 *
 * PRIVACY INVARIANT:
 * - Operates strictly on aggregate rates (e.g. recent attendance trend rate, preference opt-in rate).
 * - Zero resident PII (names, IDs, room numbers) is processed.
 */

/**
 * Deterministic explanation generator.
 * Produces clean, professional 1-2 sentence explanations directly from aggregate factors.
 *
 * Example output:
 * "Demand is expected to be 90 diners, slightly above the historical baseline of 86.
 *  Recent attendance momentum and current meal preferences are contributing to the increase."
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
