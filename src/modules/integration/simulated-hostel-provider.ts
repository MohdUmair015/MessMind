import { prisma } from "@/lib/db";
import {
  IHostelMealDataProvider,
  HostelResident,
  HostelMealSchedule,
  HostelMealPreference,
  HostelMealScan,
  MealAttendanceReconciliation,
} from "./hostel-data-provider.interface";

/**
 * SimulatedHostelMealDataProvider - authoritative scanner attendance integration provider
 * 
 * ARCHITECTURAL NOTICE:
 * For the hackathon demonstration, the existing hostel application's data feed is simulated
 * using synthetic PostgreSQL records.
 * 
 * In production, an authorized adapter implementing `IHostelMealDataProvider` would connect
 * via authenticated mTLS/OAuth2 REST or GraphQL endpoints to the production hostel app.
 */
export class SimulatedHostelMealDataProvider implements IHostelMealDataProvider {
  async getResidents(): Promise<HostelResident[]> {
    const residents = await prisma.resident.findMany({
      select: { id: true, residentCode: true, residentType: true, status: true },
    });
    return residents as HostelResident[];
  }

  async getMealSchedules(startDate: Date, endDate: Date): Promise<HostelMealSchedule[]> {
    const meals = await prisma.meal.findMany({
      where: {
        mealDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { menu: true },
      orderBy: { mealDate: "asc" },
    });

    return meals.map((m) => ({
      id: m.id,
      mealDate: m.mealDate,
      mealType: m.mealType,
      menuId: m.menuId,
      menuName: m.menu.name,
      menuItems: Array.isArray(m.menu.items) ? (m.menu.items as string[]) : [],
      isServed: m.isServed,
      preferenceDeadline: m.preferenceDeadline,
    }));
  }

  async getMealPreferences(mealId: string): Promise<HostelMealPreference[]> {
    const prefs = await prisma.mealPreference.findMany({
      where: { mealId },
    });

    return prefs.map((p) => ({
      id: p.id,
      mealId: p.mealId,
      residentId: p.residentId,
      selectedOption: p.selectedOption,
      createdAt: p.createdAt,
    }));
  }

  async getMealScans(mealId: string): Promise<HostelMealScan[]> {
    const scans = await prisma.mealScan.findMany({
      where: { mealId },
    });

    return scans.map((s) => ({
      id: s.id,
      mealId: s.mealId,
      residentId: s.residentId,
      scannedAt: s.scannedAt,
      sourceSystem: s.sourceSystem,
    }));
  }

  /**
   * Authoritative count of diners: Computes the number of UNIQUE resident meal scans.
   * If any resident has multiple scan timestamps for the same meal, duplicates are suppressed.
   */
  async getUniqueDinerCount(mealId: string): Promise<number> {
    const scans = await prisma.mealScan.findMany({
      where: { mealId },
      select: { residentId: true },
    });

    // In-memory Set ensures absolute deduplication
    const uniqueResidents = new Set<string>();
    for (const scan of scans) {
      uniqueResidents.add(scan.residentId);
    }

    return uniqueResidents.size;
  }

  /**
   * Automated post-meal reconciliation:
   * 1. Ingests scanner data from hostel app.
   * 2. Deduplicates scans to calculate authoritative actualDiners.
   * 3. Calculates prediction error against deterministic forecast.
   * 4. Calculates estimated surplus (Prepared - Actual Scans).
   * 5. No manual entry of attendance is required!
   */
  async syncMealAttendance(mealId: string): Promise<MealAttendanceReconciliation> {
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
      include: {
        prediction: true,
        outcome: true,
        scans: { select: { id: true, residentId: true, scannedAt: true } },
      },
    });

    if (!meal) {
      throw new Error(`Meal with id '${mealId}' not found.`);
    }

    const rawScans = meal.scans;
    const uniqueResidentIds = new Set<string>();
    for (const s of rawScans) {
      uniqueResidentIds.add(s.residentId);
    }

    const uniqueScansCount = uniqueResidentIds.size;
    const duplicateScansSuppressedCount = rawScans.length - uniqueScansCount;

    // If no scans recorded yet and meal is not served
    if (uniqueScansCount === 0 && !meal.isServed && !meal.outcome) {
      return {
        mealId,
        uniqueScansCount: 0,
        duplicateScansSuppressedCount: 0,
        predictedDiners: meal.prediction?.predictedDiners ?? null,
        predictionErrorPercent: null,
        preparedServings: null,
        estimatedSurplus: null,
        attendanceStatus: "PENDING_MEAL",
        syncedAt: new Date(),
      };
    }

    const predictedDiners = meal.prediction?.predictedDiners ?? null;
    const predictionErrorPercent =
      predictedDiners && uniqueScansCount > 0
        ? Math.round((Math.abs(uniqueScansCount - predictedDiners) / predictedDiners) * 1000) / 10
        : null;

    // Prepared servings from existing outcome, or fallback to recommended servings with buffer
    const prepared = meal.outcome?.preparedServings ?? (meal.prediction?.recommendedServings ?? uniqueScansCount);
    const estimatedSurplus = Math.max(0, prepared - uniqueScansCount);
    const remaining = meal.outcome?.remainingServings ?? estimatedSurplus;
    const wasted = meal.outcome?.wastedServings ?? 0;

    // Upsert authoritative scan-derived outcome record in PostgreSQL
    await prisma.mealOutcome.upsert({
      where: { mealId },
      create: {
        mealId,
        preparedServings: prepared,
        actualDiners: uniqueScansCount,
        attendanceSource: "SCANNER_SYNC",
        remainingServings: remaining,
        wastedServings: wasted,
        estimatedSurplus,
      },
      update: {
        actualDiners: uniqueScansCount,
        attendanceSource: "SCANNER_SYNC",
        estimatedSurplus,
        recordedAt: new Date(),
      },
    });

    await prisma.meal.update({
      where: { id: mealId },
      data: { isServed: true },
    });

    await prisma.auditLog.create({
      data: {
        action: "SYNC_HOSTEL_SCANNER_ATTENDANCE",
        userRole: "MESS_MANAGER",
        details: {
          mealId,
          uniqueScansCount,
          duplicateScansSuppressedCount,
          predictedDiners,
          predictionErrorPercent,
          attendanceSource: "HOSTEL_APP_SCANNER",
        },
      },
    });

    return {
      mealId,
      uniqueScansCount,
      duplicateScansSuppressedCount,
      predictedDiners,
      predictionErrorPercent,
      preparedServings: prepared,
      estimatedSurplus,
      attendanceStatus: meal.outcome?.wastedServings !== undefined ? "OUTCOME_RECORDED" : "ATTENDANCE_SYNCHRONIZED",
      syncedAt: new Date(),
    };
  }

  /**
   * Prototype Demo Hook: Simulates physical dining scans arriving from the hostel app.
   * For the target Saturday Dinner, generates the benchmark 99 scans from active residents.
   */
  async simulateMealScanOccurrence(
    mealId: string,
    targetAttendeeCount = 99
  ): Promise<{ scannedCount: number; mealId: string }> {
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
      include: { scans: true },
    });

    if (!meal) {
      throw new Error(`Meal with id '${mealId}' not found.`);
    }

    const activeResidents = await prisma.resident.findMany({
      where: { status: "ACTIVE" },
      take: targetAttendeeCount,
      orderBy: { createdAt: "asc" },
    });

    const mealDate = new Date(meal.mealDate);

    // Create scans in PostgreSQL
    const scansData = activeResidents.map((res, index) => ({
      mealId,
      residentId: res.id,
      sourceSystem: "HOSTEL_APP_SCANNER",
      scannedAt: new Date(mealDate.getTime() + index * 45 * 1000), // realistic scan timestamps
    }));

    // Insert or ignore if duplicate
    for (const scan of scansData) {
      await prisma.mealScan.upsert({
        where: {
          mealId_residentId: {
            mealId: scan.mealId,
            residentId: scan.residentId,
          },
        },
        create: scan,
        update: { scannedAt: scan.scannedAt },
      });
    }

    // Automatically trigger reconciliation
    await this.syncMealAttendance(mealId);

    return {
      scannedCount: activeResidents.length,
      mealId,
    };
  }
}

export const simulatedHostelMealDataProvider = new SimulatedHostelMealDataProvider();
