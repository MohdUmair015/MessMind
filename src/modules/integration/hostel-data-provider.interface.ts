import { MealType, ResidentType } from "@/types";

export interface HostelResident {
  id: string;
  residentCode: string;
  residentType: ResidentType;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
}

export interface HostelMealSchedule {
  id: string;
  mealDate: Date;
  mealType: MealType;
  menuId: string;
  menuName: string;
  menuItems: string[];
  isServed: boolean;
  preferenceDeadline: Date;
}

export interface HostelMealPreference {
  id: string;
  mealId: string;
  residentId: string;
  selectedOption: string;
  createdAt: Date;
}

export interface HostelMealScan {
  id: string;
  mealId: string;
  residentId: string;
  scannedAt: Date;
  sourceSystem: string;
}

export interface MealAttendanceReconciliation {
  mealId: string;
  uniqueScansCount: number;
  duplicateScansSuppressedCount: number;
  predictedDiners: number | null;
  predictionErrorPercent: number | null;
  preparedServings: number | null;
  estimatedSurplus: number | null;
  attendanceStatus: "PENDING_MEAL" | "ATTENDANCE_SYNCHRONIZED" | "OUTCOME_RECORDED";
  syncedAt: Date;
}

export interface IHostelMealDataProvider {
  /**
   * Retrieves active resident records from the hostel ecosystem.
   */
  getResidents(): Promise<HostelResident[]>;

  /**
   * Retrieves meal schedules and menu information for a specified timeframe.
   */
  getMealSchedules(startDate: Date, endDate: Date): Promise<HostelMealSchedule[]>;

  /**
   * Retrieves resident preference choices for a given meal.
   */
  getMealPreferences(mealId: string): Promise<HostelMealPreference[]>;

  /**
   * Retrieves raw physical meal scans recorded by the hostel dining room scanner.
   */
  getMealScans(mealId: string): Promise<HostelMealScan[]>;

  /**
   * Calculates the authoritative actual diners count by counting UNIQUE resident scans for a meal.
   * Duplicate scans from the same resident are automatically deduplicated.
   */
  getUniqueDinerCount(mealId: string): Promise<number>;

  /**
   * Automatically reconciles actual diner attendance from scanner data against predicted demand.
   * Does NOT require any manual entry of attendance.
   */
  syncMealAttendance(mealId: string): Promise<MealAttendanceReconciliation>;

  /**
   * Prototype Demo Hook: Simulates the hostel app scanner recording dining entries for a live meal.
   */
  simulateMealScanOccurrence(
    mealId: string,
    targetAttendeeCount?: number
  ): Promise<{ scannedCount: number; mealId: string }>;
}
