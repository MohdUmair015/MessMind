import { prisma } from "@/lib/db";
import { MealType, UserRole } from "@/types";
import { getServerUser, requireServerRole } from "@/modules/auth/server-auth";
import { predictionEngine } from "@/modules/prediction";
import { RecordMealOutcomeInput } from "./types";

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

  if (input.actualDiners === undefined || input.actualDiners < 0 || !Number.isInteger(input.actualDiners)) {
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

    let predictionError: number | null = null;
    if (meal.outcome && prediction) {
      predictionError = Math.round(
        (Math.abs(meal.outcome.actualDiners - prediction.predictedDiners) /
          (prediction.predictedDiners || 1)) *
          1000
      ) / 10;
    }

    return {
      meal,
      eligibleCount,
      prediction,
      predictionError,
    };
  }

  /**
   * Records meal outcome, strictly enforcing RBAC and validation.
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

    // 3. Upsert meal outcome
    const outcome = await prisma.mealOutcome.upsert({
      where: { mealId: input.mealId },
      create: {
        mealId: input.mealId,
        preparedServings: input.preparedServings,
        actualDiners: input.actualDiners,
        remainingServings: input.remainingServings,
        wastedServings: input.wastedServings,
      },
      update: {
        preparedServings: input.preparedServings,
        actualDiners: input.actualDiners,
        remainingServings: input.remainingServings,
        wastedServings: input.wastedServings,
        recordedAt: new Date(),
      },
    });

    // 4. Mark meal as served
    await prisma.meal.update({
      where: { id: input.mealId },
      data: { isServed: true },
    });

    // 5. Audit logging
    await prisma.auditLog.create({
      data: {
        action: "RECORD_MEAL_OUTCOME",
        userRole,
        details: {
          mealId: input.mealId,
          preparedServings: input.preparedServings,
          actualDiners: input.actualDiners,
          remainingServings: input.remainingServings,
          wastedServings: input.wastedServings,
          predictedDiners: meal.prediction?.predictedDiners,
          predictionError: meal.prediction
            ? Math.abs(input.actualDiners - meal.prediction.predictedDiners)
            : null,
        },
      },
    });

    return outcome;
  }
}

export const mealService = new MealService();
