import { DemoMeal, DemoPrediction, DemoAnalyticsSummary, DemoResident } from "@/modules/demo-data/types";
import { UserRole } from "@/modules/auth/types";
import { LifecycleStage } from "@/components/ui/LifecycleStepper";

/**
 * Scanner state for client-side demo simulation
 */
export interface DemoScannerState {
  status: "awaiting" | "synced" | "simulated";
  uniqueScansCount: number;
  duplicateScansCount: number;
  lastSyncedAt: string | null;
  isSimulated: boolean;
  simulatedNotice: string | null;
}

/**
 * Outcome recording input for client-side demo
 */
export interface DemoRecordOutcomeInput {
  mealId: string;
  preparedServings: number;
  actualDiners: number;
  remainingServings: number;
  wastedServings: number;
  isManualOverride?: boolean;
}

/**
 * Outcome recording validation result
 */
export interface DemoOutcomeValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Complete reactive demo state
 */
export interface DemoState {
  isDemoMode: boolean;
  targetMeal: DemoMeal;
  prediction: DemoPrediction;
  analytics: DemoAnalyticsSummary;
  mealsTimeline: DemoMeal[];
  residents: DemoResident[];
  scannerState: DemoScannerState;
  lifecycleStage: LifecycleStage;
  currentBufferPercent: number;
  activeRole: UserRole;
  feedbackNotice: string | null;
}

/**
 * Operations and actions provided by Demo Context
 */
export interface DemoActions {
  /**
   * Simulates arrival of dining hall entrance scans (idempotent, defaults to 99)
   */
  simulateScans: (count?: number) => {
    success: boolean;
    scannedCount: number;
    variance: number;
    percentOfForecast: number;
    forecastError: number;
    lifecycleStage: LifecycleStage;
  };

  /**
   * Deterministically restores initial pre-service state (0 scans, unserved, canonical baseline)
   */
  resetSimulation: () => void;

  /**
   * Simulates scanner refresh/sync without calling external server
   */
  syncScanner: () => {
    success: boolean;
    uniqueScansCount: number;
    lastSyncedAt: string;
    message: string;
  };

  /**
   * Validates and records post-meal outcome in browser session
   */
  recordOutcome: (input: DemoRecordOutcomeInput) => {
    success: boolean;
    error?: string;
    validationErrors?: string[];
    outcome?: NonNullable<DemoMeal["outcome"]>;
    surplus?: number;
    forecastError?: number;
  };

  /**
   * Recalculates demand prediction with custom safety buffer using Pure Deterministic Engine
   */
  recalculatePrediction: (customBufferPercent?: number) => {
    success: boolean;
    prediction: DemoPrediction;
  };

  /**
   * Sets client-side preview role (demo only, not real auth)
   */
  setActiveRole: (role: UserRole) => void;

  /**
   * Clears feedback notice
   */
  clearFeedbackNotice: () => void;
}

export type DemoContextValue = DemoState & DemoActions;
