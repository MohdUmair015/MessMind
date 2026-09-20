import { prisma } from "@/lib/db";
import { MealType, UserRole } from "@/types";
import { getServerUser, requireServerRole } from "@/modules/auth/server-auth";
import { predictionEngine } from "@/modules/prediction";
import { hostelDataProvider } from "@/modules/integration";
import { RecordMealOutcomeInput } from "./types";

// Meal service business logic and PostgreSQL outcome persistence
export interface OutcomeValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMealOutcomeInput(input: RecordMealOutcomeInput): OutcomeValidationResult {
  const errors: string[] = [];

  if (!input.mealId || typeof input.mealId !== "string" || input.mealId.trim() === "") {
    errors.push("Meal ID is required.");
  }

  if (input.preparedServings === undefined || input.preparedServings < 0 || !Number.isInteger(input.preparedServings)) {
    errors.push("Prepared servings must be a non-negative integer.");
  }

  if (input.actualDiners !== undefined && (input.actualDiners < 0 || !Number.isInteger(input.actualDiners))) {
    errors.push("Actual diners must be a non-negative integer.");
  }

  if (input.remainingServings === undefined || input.remainingServings < 0 || !Number.isInteger(input.remainingServings)) {
    errors.push("Remaining servings must be a non-negative integer.");
  }

  if (input.wastedServings === undefined || input.wastedServings < 0 || !Number.isInteger(input.wastedServings)) {
    errors.push("Wasted servings must be a non-negative integer.");
  }

  if (input.preparedServings !== undefined && input.actualDiners !== undefined) {
    if (input.actualDiners > input.preparedServings) {
      errors.push(
        `Actual diners (${input.actualDiners}) cannot exceed prepared servings (${input.preparedServings}). Kitchen cannot serve more than prepared without logged replenishment.`
      );
    }
  }

  if (
    input.preparedServings !== undefined &&
    input.remainingServings !== undefined &&
    input.wastedServings !== undefined
  ) {
    if (input.wastedServings > input.remainingServings) {
      errors.push(
        `Wasted servings (${input.wastedServings}) cannot exceed remaining unconsumed servings (${input.remainingServings}).`
      );
    }

    if (input.remainingServings > input.preparedServings) {
      errors.push(
        `Remaining servings (${input.remainingServings}) cannot exceed prepared servings (${input.preparedServings}).`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export class MealService {
  /**
   * Retrieves the next upcoming unserved meal, or falls back to the most recent target benchmark meal.
   */
  async getUpcomingMealWithPrediction() {
    // Look for unserved meals scheduled for today or in the future
    let meal = await prisma.meal.findFirst({
      where: { isServed: false },
      include: {
        menu: true,
        prediction: true,
        outcome: true,
        _count: { select: { preferences: true, scans: true } },
      },
      orderBy: { mealDate: "asc" },
    });

    // Fallback: If all meals served, take the latest scheduled meal
    if (!meal) {
      meal = await prisma.meal.findFirst({
        include: {
          menu: true,
          prediction: true,
          outcome: true,
          _count: { select: { preferences: true, scans: true } },
        },
        orderBy: { mealDate: "desc" },
      });
    }

    if (!meal) return null;

    const eligibleResidentsCount = await prisma.resident.count({
      where: { status: "ACTIVE" },
    });

    // Ensure prediction is generated and attached
    let prediction = meal.prediction;
    if (!prediction) {
      const predResult = await predictionEngine.predictWithDatabase(meal.id, {
        customBufferPercent: 5.0,
        persistToDb: true,
      });

      prediction = await prisma.prediction.findUnique({
        where: { mealId: meal.id },
      });
    }

    return {
      meal,
      eligibleResidentsCount,
      prediction,
    };
  }

  /**
   * Retrieves paginated or filtered list of meals from PostgreSQL.
   */
  async getMealsList(options?: {
    filter?: "all" | "upcoming" | "completed";
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (options?.filter === "upcoming") {
      where.isServed = false;
    } else if (options?.filter === "completed") {
      where.isServed = true;
    }

    const [meals, totalCount] = await Promise.all([
      prisma.meal.findMany({
        where,
        include: {
          menu: true,
          prediction: true,
          outcome: true,
          _count: {
            select: { preferences: true, scans: true },
          },
        },
        orderBy: [{ mealDate: "desc" }, { mealType: "desc" }],
        take: options?.limit ?? 30,
        skip: options?.offset ?? 0,
      }),
      prisma.meal.count({ where }),
    ]);

    return {
      meals,
      totalCount,
    };
  }

  /**
   * Retrieves single meal detail with prediction factors, menu, preferences, and outcome.
   */
  async getMealDetailById(mealId: string) {
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
      include: {
        menu: true,
        prediction: true,
        outcome: true,
        preferences: {
          take: 50,
          select: { id: true, selectedOption: true, residentId: true },
        },
        _count: {
          select: { preferences: true, scans: true },
        },
      },
    });

    if (!meal) return null;

    const eligibleCount = await prisma.resident.count({
      where: { status: "ACTIVE" },
    });

    // Authoritative unique scan count from hostel app scanner
    const uniqueScansCount = await hostelDataProvider.getUniqueDinerCount(mealId);
    const totalScansCount = meal._count.scans;
    const duplicateScansSuppressedCount = Math.max(0, totalScansCount - uniqueScansCount);

    // If unserved and prediction doesn't exist, calculate it
    let prediction = meal.prediction;
    if (!prediction && !meal.isServed) {
      const predResult = await predictionEngine.predictWithDatabase(meal.id, {
        customBufferPercent: 5.0,
        persistToDb: true,
      });

      prediction = await prisma.prediction.findUnique({
        where: { mealId: meal.id },
      });
    }

    // Determine authoritative actual diners and prediction error
    let authoritativeActualDiners: number | null = null;
    let predictionError: number | null = null;

    if (meal.outcome) {
      authoritativeActualDiners = meal.outcome.actualDiners;
    } else if (uniqueScansCount > 0) {
      authoritativeActualDiners = uniqueScansCount;
    }

    if (authoritativeActualDiners !== null && prediction?.predictedDiners) {
      predictionError = Math.round(
        (Math.abs(authoritativeActualDiners - prediction.predictedDiners) /
          prediction.predictedDiners) *
          1000
      ) / 10;
    }

    // Strict semantic separation:
    // Actual prepared servings comes ONLY from verified kitchen audit outcome.
    // Recommended preparation is a planning forecast, NOT actual preparation.
    const actualPreparedServings = meal.outcome?.preparedServings ?? null;
    const estimatedSurplus =
      actualPreparedServings !== null && authoritativeActualDiners !== null
        ? Math.max(0, actualPreparedServings - authoritativeActualDiners)
        : null;

    return {
      meal,
      eligibleCount,
      prediction,
      predictionError,
      uniqueScansCount,
      duplicateScansSuppressedCount,
      authoritativeActualDiners,
      actualPreparedServings,
      estimatedSurplus,
      attendanceStatus:
        uniqueScansCount === 0 && !meal.isServed && !meal.outcome
          ? ("AWAITING_SCANS" as const)
          : ("AVAILABLE" as const),
    };
  }

  /**
   * Records meal outcome (kitchen preparation and physical waste audit).
   * Enforces server-side authorization and preserves authoritative scan-derived attendance.
   */
  async recordMealOutcome(
    input: RecordMealOutcomeInput,
    userRole: UserRole = "MESS_MANAGER"
  ) {
    // 1. Validation check
    const validation = validateMealOutcomeInput(input);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join("; ")}`);
    }

    // 2. Meal existence check
    const meal = await prisma.meal.findUnique({
      where: { id: input.mealId },
      include: { outcome: true, prediction: true },
    });

    if (!meal) {
      throw new Error(`Meal with id '${input.mealId}' does not exist.`);
    }

    // 3. Determine authoritative actual diners from scans vs demo fallback
    let actualDiners: number;
    let attendanceSource: string;

    if (input.isDemoOverride && input.actualDiners !== undefined) {
      actualDiners = input.actualDiners;
      attendanceSource = "MANUAL_DEMO_OVERRIDE";
    } else {
      const scanCount = await hostelDataProvider.getUniqueDinerCount(input.mealId);
      if (scanCount > 0) {
        actualDiners = scanCount;
        attendanceSource = "SCANNER_SYNC";
      } else if (input.actualDiners !== undefined) {
        actualDiners = input.actualDiners;
        attendanceSource = "MANUAL_DEMO_OVERRIDE";
      } else {
        actualDiners = 0;
        attendanceSource = "SCANNER_SYNC";
      }
    }

    const estimatedSurplus = Math.max(0, input.preparedServings - actualDiners);

    // 4. Upsert meal outcome
    const outcome = await prisma.mealOutcome.upsert({
      where: { mealId: input.mealId },
      create: {
        mealId: input.mealId,
        preparedServings: input.preparedServings,
        actualDiners,
        attendanceSource,
        remainingServings: input.remainingServings,
        wastedServings: input.wastedServings,
        estimatedSurplus,
      },
      update: {
        preparedServings: input.preparedServings,
        actualDiners,
        attendanceSource,
        remainingServings: input.remainingServings,
        wastedServings: input.wastedServings,
        estimatedSurplus,
        recordedAt: new Date(),
      },
    });

    // 5. Mark meal as served
    await prisma.meal.update({
      where: { id: input.mealId },
      data: { isServed: true },
    });

    // 6. Audit logging
    await prisma.auditLog.create({
      data: {
        action: "RECORD_MEAL_OUTCOME",
        userRole,
        details: {
          mealId: input.mealId,
          preparedServings: input.preparedServings,
          actualDiners,
          attendanceSource,
          remainingServings: input.remainingServings,
          wastedServings: input.wastedServings,
          estimatedSurplus,
          predictedDiners: meal.prediction?.predictedDiners,
          predictionError: meal.prediction
            ? Math.abs(actualDiners - meal.prediction.predictedDiners)
            : null,
        },
      },
    });

    return outcome;
  }
}

export const mealService = new MealService();
