"use server";

import { explanationService } from "@/modules/ai";
import { ExplanationResult } from "@/modules/ai/explanation-types";

/**
 * Server Action: Get Bedrock/Fallback natural language explanation for a meal prediction.
 *
 * Runs strictly server-side.
 * AWS credentials, SDK instances, and secrets are NEVER exposed to client-side code.
 */
export async function getMealExplanationAction(
  mealId: string
): Promise<{ success: boolean; data?: ExplanationResult; error?: string }> {
  try {
    if (!mealId || typeof mealId !== "string") {
      return { success: false, error: "Valid meal ID is required." };
    }

    const result = await explanationService.getExplanationForMeal(mealId);
    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to retrieve explanation for meal prediction.",
    };
  }
}
