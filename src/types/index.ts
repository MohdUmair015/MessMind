export type ResidentType = 'STUDENT' | 'CORPORATE';
export type ResidentStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';
export type WasteRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type UserRole = 'MESS_MANAGER' | 'HOSTEL_ADMIN';

export interface Resident {
  id: string;
  residentCode: string;
  residentType: ResidentType;
  status: ResidentStatus;
  createdAt: Date;
}

export interface Menu {
  id: string;
  name: string;
  category: string;
  items: string[];
  createdAt: Date;
}

export interface Meal {
  id: string;
  mealDate: Date | string;
  mealType: MealType;
  menuId: string;
  isServed: boolean;
  preferenceDeadline: Date | string;
  createdAt: Date;
  menu?: Menu;
  prediction?: Prediction;
  outcome?: MealOutcome;
}

export interface MealPreference {
  id: string;
  mealId: string;
  residentId: string;
  // Flexible string identifier representing chosen meal option
  selectedOption: string;
  createdAt: Date;
}

export interface MealScan {
  id: string;
  mealId: string;
  residentId: string;
  scannedAt: Date;
}

export interface MealOutcome {
  id: string;
  mealId: string;
  preparedServings: number;
  actualDiners: number;
  remainingServings: number;
  wastedServings: number;
  recordedAt: Date;
}

export interface PredictionFactors {
  eligiblePopulation: number;
  historicalBaselineDiners: number;
  dayOfWeekPatternDeltaPercent: number;
  mealTypePatternDeltaPercent: number;
  recentAttendanceTrendPercent: number;
  currentPreferenceSignalPercent: number;
  menuAdjustmentPercent: number;
  comparableMealsCount: number;
}

export interface Prediction {
  id: string;
  mealId: string;
  predictedDiners: number;
  recommendedServings: number;
  wasteRisk: WasteRiskLevel;
  confidenceLevel: ConfidenceLevel;
  predictionFactors: PredictionFactors;
  algorithmVersion: string;
  explanation?: string | null;
  createdAt: Date;
}

export interface PredictionSetting {
  id: string;
  bufferPercentage: number;
  highWasteRiskThresholdPercent: number;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  action: string;
  userRole: UserRole;
  details: Record<string, unknown>;
  createdAt: Date;
}
