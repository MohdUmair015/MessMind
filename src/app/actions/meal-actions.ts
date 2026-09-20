"use server";

import { revalidatePath } from "next/cache";
import { requireServerRole } from "@/modules/auth/server-auth";
import { mealService, validateMealOutcomeInput } from "@/modules/meals/meal-service";
import { predictionService } from "@/modules/prediction/prediction-service";
import { hostelDataProvider } from "@/modules/integration";
import { RecordMealOutcomeInput } from "@/modules/meals/types";

function safeRevalidatePaths(paths: string[]) {
  try {
    for (const p of paths) {
      revalidatePath(p);
    }
  } catch {
    // Non-blocking if invoked outside Next.js request context
  }
}

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

    safeRevalidatePaths([
      `/meals/${input.mealId}`,
      "/meals",
      "/",
      "/analytics",
    ]);

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

    safeRevalidatePaths([
      `/meals/${mealId}`,
      "/predictions",
      "/",
    ]);

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

/**
 * Server Action: Sync meal attendance from hostel app scanner
 * Automatically reconciles actual unique scans without manual entry.
 * Enforces server-side authorization: MESS_MANAGER or HOSTEL_ADMIN only.
 */
export async function syncMealAttendanceAction(mealId: string) {
  try {
    await requireServerRole(["MESS_MANAGER", "HOSTEL_ADMIN"]);

    const reconciliation = await hostelDataProvider.syncMealAttendance(mealId);

    safeRevalidatePaths([
      `/meals/${mealId}`,
      "/meals",
      "/",
      "/analytics",
    ]);

    return {
      success: true,
      reconciliation,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to synchronize attendance from hostel scanner.",
    };
  }
}

/**
 * Server Action: Demo Hook to simulate hostel scanner activity for a meal.
 * Simulates real-time scans synced from the hostel dining room scanner.
 * Enforces server-side authorization.
 */
export async function simulateScannerSyncAction(mealId: string, count = 99) {
  try {
    await requireServerRole(["MESS_MANAGER", "HOSTEL_ADMIN"]);

    const result = await hostelDataProvider.simulateMealScanOccurrence(mealId, count);

    safeRevalidatePaths([
      `/meals/${mealId}`,
      "/meals",
      "/",
      "/analytics",
    ]);

    return {
      success: true,
      scannedCount: result.scannedCount,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to simulate scanner data ingestion.",
    };
  }
}

/**
 * Server Action: Reset demo scanner activity for a meal.
 * Non-destructive: Clears only the simulated scans and outcome for this specific meal
 * so presenters can replay the initial "PREPARE" to "RECONCILE" flow reliably.
 */
export async function resetMealDemoScansAction(mealId: string) {
  try {
    await requireServerRole(["MESS_MANAGER", "HOSTEL_ADMIN"]);

    const { prisma } = await import("@/lib/db");

    // Remove scans and outcome for this target meal only
    await prisma.mealScan.deleteMany({ where: { mealId } });
    await prisma.mealOutcome.deleteMany({ where: { mealId } });
    await prisma.meal.update({
      where: { id: mealId },
      data: { isServed: false },
    });

    safeRevalidatePaths([
      `/meals/${mealId}`,
      "/meals",
      "/",
      "/analytics",
    ]);

    return {
      success: true,
      scannedCount: 0,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to reset demo scanner state.",
    };
  }
}


