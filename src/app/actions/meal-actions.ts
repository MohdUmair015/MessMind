"use server";

import { revalidatePath } from "next/cache";
import { requireServerRole } from "@/modules/auth/server-auth";
import { mealService, validateMealOutcomeInput } from "@/modules/meals/meal-service";
import { predictionService } from "@/modules/prediction/prediction-service";
import { RecordMealOutcomeInput } from "@/modules/meals/types";

/**
 * Server Action: Record Post-Meal Outcome
 * Enforces server-side authorization: MESS_MANAGER or HOSTEL_ADMIN only.
 */
export async function recordOutcomeAction(input: RecordMealOutcomeInput) {
  try {
    const user = await requireServerRole(["MESS_MANAGER", "HOSTEL_ADMIN"]);

    const validation = validateMealOutcomeInput(input);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(". "),
      };
    }

    const outcome = await mealService.recordMealOutcome(input, user.role);

    revalidatePath(`/meals/${input.mealId}`);
    revalidatePath("/meals");
    revalidatePath("/");
    revalidatePath("/analytics");

    return {
      success: true,
      outcome: {
        id: outcome.id,
        mealId: outcome.mealId,
        preparedServings: outcome.preparedServings,
        actualDiners: outcome.actualDiners,
        remainingServings: outcome.remainingServings,
        wastedServings: outcome.wastedServings,
        recordedAt: outcome.recordedAt.toISOString(),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "An unexpected error occurred while saving the meal outcome.",
    };
  }
}

/**
 * Server Action: Recalculate / Regenerate Deterministic Prediction
 * Enforces server-side authorization.
 */
export async function regeneratePredictionAction(
  mealId: string,
  customBufferPercent?: number
) {
  try {
    await requireServerRole(["MESS_MANAGER", "HOSTEL_ADMIN"]);

    const prediction = await predictionService.getOrGeneratePrediction(mealId, {
      forceRefresh: true,
      customBufferPercent,
    });

    revalidatePath(`/meals/${mealId}`);
    revalidatePath("/predictions");
    revalidatePath("/");

    return {
      success: true,
      prediction,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to recalculate demand prediction.",
    };
  }
}
