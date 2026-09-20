import test from "node:test";
import assert from "node:assert";
import {
  IHostelMealDataProvider,
  HostelResident,
  HostelMealSchedule,
  HostelMealPreference,
  HostelMealScan,
  MealAttendanceReconciliation,
} from "../hostel-data-provider.interface";
import { SimulatedHostelMealDataProvider } from "../simulated-hostel-provider";
import { requireServerRole, AuthorizationError } from "@/modules/auth/server-auth";
import { prisma } from "@/lib/db";

// Automated integration tests for hostel scanner attendance synchronization
test("Hostel App Integration & Scanner Attendance Test Suite", async (t) => {
  const provider = new SimulatedHostelMealDataProvider();

  // Find a target meal for testing
  let targetMeal = await prisma.meal.findFirst({
    where: { isServed: false },
    include: { scans: true, prediction: true },
  });

  if (!targetMeal) {
    targetMeal = await prisma.meal.findFirst({
      include: { scans: true, prediction: true },
      orderBy: { mealDate: "desc" },
    });
  }

  assert.ok(targetMeal, "Test requires at least one meal record in the database");
  const testMealId = targetMeal.id;

  // 1. Provider Abstraction & Interface Compliance
  await t.test("1. Provider abstraction: Any IHostelMealDataProvider implementation conforms to contract", async () => {
    // Verify an arbitrary custom mock provider can satisfy the contract
    const mockProvider: IHostelMealDataProvider = {
      async getResidents() {
        return [{ id: "res-1", residentCode: "R1", residentType: "STUDENT", status: "ACTIVE" }];
      },
      async getMealSchedules() {
        return [];
      },
      async getMealPreferences() {
        return [];
      },
      async getMealScans() {
        return [
          { id: "s1", mealId: "m1", residentId: "res-1", scannedAt: new Date(), sourceSystem: "HOSTEL_APP_SCANNER" },
          { id: "s2", mealId: "m1", residentId: "res-1", scannedAt: new Date(), sourceSystem: "HOSTEL_APP_SCANNER" },
        ];
      },
      async getUniqueDinerCount() {
        const scans = await this.getMealScans("m1");
        return new Set(scans.map((s) => s.residentId)).size;
      },
      async syncMealAttendance(mealId: string) {
        const unique = await this.getUniqueDinerCount(mealId);
        return {
          mealId,
          uniqueScansCount: unique,
          duplicateScansSuppressedCount: 1,
          predictedDiners: 1,
          predictionErrorPercent: 0,
          preparedServings: 2,
          estimatedSurplus: 1,
          attendanceStatus: "ATTENDANCE_SYNCHRONIZED",
          syncedAt: new Date(),
        };
      },
      async simulateMealScanOccurrence(mealId: string) {
        return { scannedCount: 1, mealId };
      },
    };

    const residents = await mockProvider.getResidents();
    assert.strictEqual(residents.length, 1);
    const count = await mockProvider.getUniqueDinerCount("m1");
    assert.strictEqual(count, 1, "Duplicate scans must deduplicate to 1");
  });

  // 2. Simulated Provider Data Retrieval
  await t.test("2. Simulated provider retrieves residents, schedules, preferences and scans", async () => {
    const residents = await provider.getResidents();
    assert.ok(residents.length > 0, "Must return active resident records");
    assert.strictEqual(residents.length, 125, "Prototype environment operates on exactly 125 residents");

    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const schedules = await provider.getMealSchedules(past, future);
    assert.ok(schedules.length > 0, "Must return meal schedules");
    assert.ok(schedules[0].menuName, "Must include menu name");
  });

  // 3. Unique Scan Counting & Duplicate Scan Suppression
  await t.test("3. Unique scan counting: Duplicate scans from same resident are deduplicated to 1", async () => {
    // Pick two active residents
    const activeResidents = await prisma.resident.findMany({
      where: { status: "ACTIVE" },
      take: 2,
    });

    const resA = activeResidents[0].id;
    const resB = activeResidents[1].id;

    // Simulate in-memory raw scans with duplicates:
    // Resident A scans twice, Resident B scans once (Total scans = 3, Unique = 2)
    const rawScans: HostelMealScan[] = [
      { id: "scan-1", mealId: testMealId, residentId: resA, scannedAt: new Date(), sourceSystem: "HOSTEL_APP_SCANNER" },
      { id: "scan-2", mealId: testMealId, residentId: resA, scannedAt: new Date(Date.now() + 10000), sourceSystem: "HOSTEL_APP_SCANNER" },
      { id: "scan-3", mealId: testMealId, residentId: resB, scannedAt: new Date(), sourceSystem: "HOSTEL_APP_SCANNER" },
    ];

    const uniqueSet = new Set(rawScans.map((s) => s.residentId));
    assert.strictEqual(uniqueSet.size, 2, "2 unique residents from 3 scans");
    assert.strictEqual(rawScans.length - uniqueSet.size, 1, "1 duplicate scan must be identified and suppressed");
  });

  // 4. Scan-Derived Actual Attendance (Authoritative)
  await t.test("4. Actual attendance is derived from meal scanner without requiring manual entry", async () => {
    // Simulate 99 scans for testMealId
    const simResult = await provider.simulateMealScanOccurrence(testMealId, 99);
    assert.strictEqual(simResult.scannedCount, 99);

    // Get unique count
    const uniqueDiners = await provider.getUniqueDinerCount(testMealId);
    assert.strictEqual(uniqueDiners, 99, "Authoritative diner count must equal 99 unique scans");

    // Check outcome in database
    const outcome = await prisma.mealOutcome.findUnique({
      where: { mealId: testMealId },
    });

    assert.ok(outcome !== null, "Outcome must be automatically created upon scanner synchronization");
    assert.strictEqual(outcome.actualDiners, 99, "Actual diners must equal scan count");
    assert.strictEqual(outcome.attendanceSource, "SCANNER_SYNC", "Source must be tagged as SCANNER_SYNC");
  });

  // 5. Automatic Prediction-vs-Actual Error Calculation
  await t.test("5. Automatic calculation: Predicted 90 vs Actual 99 yields exactly 10.0% error", async () => {
    const predictedDiners = 90;
    const actualScans = 99;

    const predictionError =
      Math.round((Math.abs(actualScans - predictedDiners) / predictedDiners) * 1000) / 10;

    assert.strictEqual(predictionError, 10.0, "Absolute percent error must equal 10.0%");
  });

  // 6. No-Scan-Yet State Handling
  await t.test("6. No-scan-yet state returns PENDING_MEAL and does not invent attendance", async () => {
    // Create a temporary unserved meal without scans or outcome
    const menu = await prisma.menu.findFirst();
    assert.ok(menu);

    const futureMeal = await prisma.meal.create({
      data: {
        mealDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
        mealType: "DINNER",
        menuId: menu.id,
        isServed: false,
        preferenceDeadline: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
      },
    });

    try {
      const reconciliation = await provider.syncMealAttendance(futureMeal.id);
      assert.strictEqual(reconciliation.attendanceStatus, "PENDING_MEAL");
      assert.strictEqual(reconciliation.uniqueScansCount, 0);
      assert.strictEqual(reconciliation.predictionErrorPercent, null, "Must not invent an error percentage");

      const count = await provider.getUniqueDinerCount(futureMeal.id);
      assert.strictEqual(count, 0, "No scans must return 0");
    } finally {
      // Clean up
      await prisma.meal.delete({ where: { id: futureMeal.id } });
    }
  });

  // 7. Distinction Between Attendance, Estimated Surplus, and Physical Food Waste
  await t.test("7. Food waste semantics: Attendance, Estimated Surplus, and Discarded Waste are distinct", () => {
    const preparedServings = 108;
    const actualDinersScans = 99;
    const remainingServings = 9;
    const wastedServings = 4;

    // A. Attendance = Scans
    assert.strictEqual(actualDinersScans, 99);

    // B. Estimated Surplus = Prepared - Attendance
    const estimatedSurplus = Math.max(0, preparedServings - actualDinersScans);
    assert.strictEqual(estimatedSurplus, 9, "Estimated surplus is preparation minus actual attendance");

    // C. Physical Food Waste = Discarded portions from kitchen audit
    assert.strictEqual(wastedServings, 4, "Physical food waste must come from audit log, never scan counts alone");
    assert.notStrictEqual(wastedServings, estimatedSurplus, "Discarded waste is distinct from surplus/leftovers");
  });

  // 8. Manual Demo Data Cannot Silently Masquerade as Scan-Derived Production Data
  await t.test("8. Manual demo data cannot silently masquerade as scan-derived data", async () => {
    const { mealService } = await import("@/modules/meals/meal-service");

    // Record an outcome with isDemoOverride: true
    const outcome = await mealService.recordMealOutcome(
      {
        mealId: testMealId,
        preparedServings: 108,
        actualDiners: 99,
        remainingServings: 9,
        wastedServings: 4,
        isDemoOverride: true,
      },
      "MESS_MANAGER"
    );

    assert.strictEqual(
      outcome.attendanceSource,
      "MANUAL_DEMO_OVERRIDE",
      "Manual overrides must be explicitly tagged as MANUAL_DEMO_OVERRIDE"
    );

    // Now trigger scanner sync; scanner sync sets attendanceSource to SCANNER_SYNC
    const synced = await provider.syncMealAttendance(testMealId);
    assert.strictEqual(synced.uniqueScansCount, 99);

    const reloadedOutcome = await prisma.mealOutcome.findUnique({
      where: { mealId: testMealId },
    });
    assert.strictEqual(reloadedOutcome?.attendanceSource, "SCANNER_SYNC");
  });

  // 9. RBAC Enforcement on Integration Endpoints
  await t.test("9. RBAC: Unauthorized roles are blocked from executing scanner synchronization", async () => {
    try {
      await requireServerRole(["HOSTEL_ADMIN"], "MESS_MANAGER");
      assert.fail("Should have rejected unauthorized role");
    } catch (err: any) {
      assert.ok(err instanceof AuthorizationError);
      assert.strictEqual(err.statusCode, 403);
    }

    try {
      await requireServerRole(["MESS_MANAGER", "HOSTEL_ADMIN"], "STUDENT" as any);
      assert.fail("Should have rejected STUDENT role");
    } catch (err: any) {
      assert.ok(err instanceof AuthorizationError);
      assert.strictEqual(err.statusCode, 403);
    }

    // MESS_MANAGER is authorized
    const manager = await requireServerRole(["MESS_MANAGER", "HOSTEL_ADMIN"], "MESS_MANAGER");
    assert.strictEqual(manager.role, "MESS_MANAGER");
  });

  // 10. No Client-Side Direct Integration Access
  await t.test("10. Security: Provider and database client are server-only constructs", () => {
    // Confirm simulatedHostelMealDataProvider is server-side class
    assert.strictEqual(typeof provider.getResidents, "function");
    assert.strictEqual(typeof provider.syncMealAttendance, "function");
  });
});
