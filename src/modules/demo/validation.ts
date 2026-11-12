import { DemoRecordOutcomeInput, DemoOutcomeValidation } from "./types";

/**
 * Pure Browser-Safe Kitchen Outcome Validation
 *
 * Enforces domain business invariants:
 * 1. Meal ID is required.
 * 2. Prepared servings, actual diners, remaining servings, and wasted servings must be non-negative integers.
 * 3. Actual diners cannot exceed prepared servings (kitchen cannot serve more than prepared without replenishment).
 * 4. Remaining servings cannot exceed prepared servings.
 * 5. Wasted servings cannot exceed remaining unconsumed servings.
 */
export function validateDemoOutcomeInput(input: DemoRecordOutcomeInput): DemoOutcomeValidation {
  const errors: string[] = [];

  if (!input.mealId || typeof input.mealId !== "string" || input.mealId.trim() === "") {
    errors.push("Meal ID is required.");
  }

  if (
    input.preparedServings === undefined ||
    input.preparedServings < 0 ||
    !Number.isInteger(input.preparedServings)
  ) {
    errors.push("Prepared servings must be a non-negative integer.");
  }

  if (
    input.actualDiners === undefined ||
    input.actualDiners < 0 ||
    !Number.isInteger(input.actualDiners)
  ) {
    errors.push("Actual diners must be a non-negative integer.");
  }

  if (
    input.remainingServings === undefined ||
    input.remainingServings < 0 ||
    !Number.isInteger(input.remainingServings)
  ) {
    errors.push("Remaining servings must be a non-negative integer.");
  }

  if (
    input.wastedServings === undefined ||
    input.wastedServings < 0 ||
    !Number.isInteger(input.wastedServings)
  ) {
    errors.push("Wasted servings must be a non-negative integer.");
  }

  if (
    input.preparedServings !== undefined &&
    input.actualDiners !== undefined &&
    input.actualDiners > input.preparedServings
  ) {
    errors.push(
      `Actual diners (${input.actualDiners}) cannot exceed prepared servings (${input.preparedServings}). Kitchen cannot serve more than prepared without logged replenishment.`
    );
  }

  if (input.preparedServings !== undefined && input.remainingServings !== undefined) {
    if (input.remainingServings > input.preparedServings) {
      errors.push(
        `Remaining servings (${input.remainingServings}) cannot exceed prepared servings (${input.preparedServings}).`
      );
    }
  }

  if (input.remainingServings !== undefined && input.wastedServings !== undefined) {
    if (input.wastedServings > input.remainingServings) {
      errors.push(
        `Wasted servings (${input.wastedServings}) cannot exceed remaining unconsumed servings (${input.remainingServings}).`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates forecast error percentage following canonical project convention:
 * errorPercent = round((|actual - predicted| / predicted) * 1000) / 10
 */
export function calculateForecastErrorPercent(actualDiners: number, predictedDiners: number): number {
  if (predictedDiners <= 0) return 0;
  return Math.round((Math.abs(actualDiners - predictedDiners) / predictedDiners) * 1000) / 10;
}
