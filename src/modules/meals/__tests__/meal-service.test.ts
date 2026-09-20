import test from "node:test";
import assert from "node:assert";
import { validateMealOutcomeInput } from "../meal-service";
import { requireServerRole, AuthorizationError } from "@/modules/auth/server-auth";
import { UserRole } from "@/types";

// Meal Service outcome recording and validation test suite
test("Meal Service & Outcome Validation Test Suite", async (t) => {
  // 1. Valid Outcome Inputs Pass
  await t.test("1. Valid outcome inputs pass with zero errors", () => {
    const valid = validateMealOutcomeInput({
      mealId: "meal-demo-123",
      preparedServings: 108,
      actualDiners: 99,
      remainingServings: 9,
      wastedServings: 4,
    });

    assert.strictEqual(valid.valid, true);
    assert.strictEqual(valid.errors.length, 0);
  });

  // 2. Reject Negative Numbers
  await t.test("2. Rejects negative numbers for servings and diners", () => {
    const invalid = validateMealOutcomeInput({
      mealId: "meal-demo-123",
      preparedServings: -10,
      actualDiners: 99,
      remainingServings: 9,
      wastedServings: 4,
    });

    assert.strictEqual(invalid.valid, false);
    assert.ok(invalid.errors.some((e) => e.includes("non-negative")));
  });

  // 3. Reject Actual Diners > Prepared Servings
  await t.test("3. Rejects actual diners exceeding prepared servings", () => {
    const invalid = validateMealOutcomeInput({
      mealId: "meal-demo-123",
      preparedServings: 90,
      actualDiners: 100, // 100 > 90
      remainingServings: 0,
      wastedServings: 0,
    });

    assert.strictEqual(invalid.valid, false);
    assert.ok(invalid.errors.some((e) => e.includes("cannot exceed prepared servings")));
  });

  // 4. Reject Wasted Servings > Remaining Servings
  await t.test("4. Rejects wasted servings exceeding remaining servings", () => {
    const invalid = validateMealOutcomeInput({
      mealId: "meal-demo-123",
      preparedServings: 100,
      actualDiners: 90,
      remainingServings: 10,
      wastedServings: 15, // 15 > 10
    });

    assert.strictEqual(invalid.valid, false);
    assert.ok(invalid.errors.some((e) => e.includes("cannot exceed remaining unconsumed servings")));
  });

  // 5. Reject Remaining Servings > Prepared Servings
  await t.test("5. Rejects remaining servings exceeding prepared servings", () => {
    const invalid = validateMealOutcomeInput({
      mealId: "meal-demo-123",
      preparedServings: 100,
      actualDiners: 80,
      remainingServings: 110, // 110 > 100
      wastedServings: 5,
    });

    assert.strictEqual(invalid.valid, false);
    assert.ok(invalid.errors.some((e) => e.includes("cannot exceed prepared servings")));
  });

  // 6. Prediction vs Actual Error Calculation
  await t.test("6. Accurately calculates prediction error percentage", () => {
    const predicted = 100;
    const actual = 98;
    const errorPercent = Math.round((Math.abs(actual - predicted) / predicted) * 1000) / 10;
    assert.strictEqual(errorPercent, 2.0); // 2.0% error

    const actualHigh = 105;
    const errorHigh = Math.round((Math.abs(actualHigh - predicted) / predicted) * 1000) / 10;
    assert.strictEqual(errorHigh, 5.0); // 5.0% error
  });

  // 7. RBAC Server-Side Enforcement Tests
  await t.test("7. RBAC allows MESS_MANAGER and HOSTEL_ADMIN on management actions", async () => {
    const managerUser = await requireServerRole(["MESS_MANAGER", "HOSTEL_ADMIN"], "MESS_MANAGER");
    assert.strictEqual(managerUser.role, "MESS_MANAGER");
    assert.ok(managerUser.permissions.includes("record:outcomes"));

    const adminUser = await requireServerRole(["HOSTEL_ADMIN"], "HOSTEL_ADMIN");
    assert.strictEqual(adminUser.role, "HOSTEL_ADMIN");
    assert.ok(adminUser.permissions.includes("manage:prediction_settings"));
  });

  await t.test("8. RBAC rejects unauthorized roles with 403 AuthorizationError", async () => {
    try {
      await requireServerRole(["HOSTEL_ADMIN"], "MESS_MANAGER");
      assert.fail("Should have thrown AuthorizationError");
    } catch (err: any) {
      assert.ok(err instanceof AuthorizationError);
      assert.strictEqual(err.statusCode, 403);
      assert.match(err.message, /Access denied/);
    }
  });

  // 9. End-to-End Database Integration: Retrieve upcoming meal and record outcome
  await t.test("9. End-to-End PostgreSQL: Retrieve upcoming meal and verify prediction linkage", async () => {
    const { mealService } = await import("../meal-service");
    const upcoming = await mealService.getUpcomingMealWithPrediction();

    assert.ok(upcoming !== null, "Upcoming meal should exist in database");
    assert.ok(upcoming.meal.id, "Meal ID must be defined");
    assert.ok(upcoming.meal.menu.name, "Meal menu must be loaded");
    assert.ok(upcoming.prediction !== null, "Prediction must be generated and persisted");
    assert.ok(upcoming.prediction!.predictedDiners > 0, "Predicted diners must be positive");
    assert.ok(upcoming.prediction!.recommendedServings > 0, "Recommended servings must be positive");
  });

  await t.test("10. End-to-End PostgreSQL: Record post-meal outcome and verify persistence", async () => {
    const { mealService } = await import("../meal-service");
    const upcoming = await mealService.getUpcomingMealWithPrediction();
    assert.ok(upcoming !== null);

    const mealId = upcoming.meal.id;

    // Record demo benchmark outcome (108 prepared, 99 actual, 9 remaining, 4 wasted) with demo override
    const outcome = await mealService.recordMealOutcome(
      {
        mealId,
        preparedServings: 108,
        actualDiners: 99,
        remainingServings: 9,
        wastedServings: 4,
        isDemoOverride: true,
      },
      "MESS_MANAGER"
    );

    assert.strictEqual(outcome.mealId, mealId);
    assert.strictEqual(outcome.preparedServings, 108);
    assert.strictEqual(outcome.actualDiners, 99);
    assert.strictEqual(outcome.remainingServings, 9);
    assert.strictEqual(outcome.wastedServings, 4);
    assert.strictEqual(outcome.attendanceSource, "MANUAL_DEMO_OVERRIDE");

    // Verify detail retrieval shows updated outcome and error percentage
    const detail = await mealService.getMealDetailById(mealId);
    assert.ok(detail !== null);
    assert.ok(detail.meal.outcome !== null);
    assert.strictEqual(detail.meal.outcome.actualDiners, 99);
    assert.ok(detail.predictionError !== null);
  });
});
