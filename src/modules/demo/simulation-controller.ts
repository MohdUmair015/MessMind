import {
  DemoState,
  DemoScannerState,
  DemoRecordOutcomeInput,
  DemoOutcomeValidation,
} from "./types";
import { validateDemoOutcomeInput, calculateForecastErrorPercent } from "./validation";
import { demoSnapshot } from "@/modules/demo-data/snapshot";
import { purePredictionEngine } from "@/modules/prediction/pure-deterministic-engine";
import { generateDeterministicFallbackExplanation } from "@/modules/ai/deterministic-explainer";
import { UserRole } from "@/modules/auth/types";
import { LifecycleStage } from "@/components/ui/LifecycleStepper";
import { DemoMeal, DemoPrediction, DemoAnalyticsSummary } from "@/modules/demo-data/types";

/**
 * Creates the initial pre-service scanner state.
 */
function createInitialScannerState(): DemoScannerState {
  return {
    status: "awaiting",
    uniqueScansCount: 0,
    duplicateScansCount: 0,
    lastSyncedAt: null,
    isSimulated: false,
    simulatedNotice: null,
  };
}

/**
 * Derives the active lifecycle stage from the meal and scanner state.
 */
function deriveLifecycleStage(meal: DemoMeal, scanner: DemoScannerState): LifecycleStage {
  if (meal.isServed || meal.outcome !== null) {
    return "LEARN";
  }
  if (scanner.uniqueScansCount > 0) {
    return "OBSERVE";
  }
  return "PREPARE";
}

/**
 * Pure Browser-Safe Simulation Controller
 *
 * Implements the reactive state machine for MessMind client-side demo mode.
 * Decoupled from React internals so it is 100% testable in pure TypeScript/Node.js,
 * while seamlessly powering React components via useSyncExternalStore.
 */
export class DemoSimulationController {
  private state: DemoState;
  private listeners: Set<() => void> = new Set();

  constructor(isDemoMode: boolean = false) {
    this.state = this.createInitialState(isDemoMode);
  }

  private createInitialState(isDemoMode: boolean): DemoState {
    const targetMeal: DemoMeal = {
      ...demoSnapshot.targetMeal,
      _count: { ...demoSnapshot.targetMeal._count, scans: 0 },
      outcome: null,
      isServed: false,
    };

    const scannerState = createInitialScannerState();
    const prediction: DemoPrediction = { ...demoSnapshot.targetPrediction };
    const analytics: DemoAnalyticsSummary = {
      ...demoSnapshot.analytics,
      recentOutcomeComparisons: [...demoSnapshot.analytics.recentOutcomeComparisons],
    };

    return {
      isDemoMode,
      targetMeal,
      prediction,
      analytics,
      mealsTimeline: demoSnapshot.mealsTimeline,
      residents: demoSnapshot.residents,
      scannerState,
      lifecycleStage: deriveLifecycleStage(targetMeal, scannerState),
      currentBufferPercent: 5.0,
      activeRole: "MESS_MANAGER",
      feedbackNotice: null,
    };
  }

  /**
   * Returns a snapshot of the current reactive state.
   */
  public getState(): DemoState {
    return this.state;
  }

  /**
   * Subscribes a listener to state changes (React useSyncExternalStore compatible).
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifies all registered subscribers of state updates.
   */
  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Sets demo mode flag.
   */
  public setDemoMode(isDemoMode: boolean): void {
    if (this.state.isDemoMode !== isDemoMode) {
      this.state = { ...this.state, isDemoMode };
      this.notify();
    }
  }

  /**
   * Action: Simulate arrival of dining room scans (idempotent, defaults to 99).
   */
  public simulateScans(count: number = 99): {
    success: boolean;
    scannedCount: number;
    variance: number;
    percentOfForecast: number;
    forecastError: number;
    lifecycleStage: LifecycleStage;
  } {
    const forecast = this.state.prediction.predictedDiners;
    const variance = count - forecast;
    const percentOfForecast = forecast > 0 ? Math.round((count / forecast) * 100) : 100;
    const forecastError = calculateForecastErrorPercent(count, forecast);

    const updatedScannerState: DemoScannerState = {
      status: "simulated",
      uniqueScansCount: count,
      duplicateScansCount: 1, // Demonstration of suppressed re-entry scan
      lastSyncedAt: new Date().toISOString(),
      isSimulated: true,
      simulatedNotice: `Simulated Dining Room Scans (${count} unique check-ins reconciled automatically)`,
    };

    const updatedTargetMeal: DemoMeal = {
      ...this.state.targetMeal,
      _count: {
        ...this.state.targetMeal._count,
        scans: count,
      },
    };

    const updatedLifecycleStage = deriveLifecycleStage(updatedTargetMeal, updatedScannerState);

    this.state = {
      ...this.state,
      scannerState: updatedScannerState,
      targetMeal: updatedTargetMeal,
      lifecycleStage: updatedLifecycleStage,
      feedbackNotice: `Reconciled ${count} unique scans from dining scanner automatically (+${variance} above forecast, ${forecastError}% forecast error).`,
    };

    this.notify();

    return {
      success: true,
      scannedCount: count,
      variance,
      percentOfForecast,
      forecastError,
      lifecycleStage: updatedLifecycleStage,
    };
  }

  /**
   * Action: Deterministically reset simulation to initial pre-service state.
   */
  public resetSimulation(): void {
    const targetMeal: DemoMeal = {
      ...demoSnapshot.targetMeal,
      _count: { ...demoSnapshot.targetMeal._count, scans: 0 },
      outcome: null,
      isServed: false,
    };

    const scannerState = createInitialScannerState();

    this.state = {
      ...this.state,
      targetMeal,
      prediction: { ...demoSnapshot.targetPrediction },
      analytics: {
        ...demoSnapshot.analytics,
        recentOutcomeComparisons: [...demoSnapshot.analytics.recentOutcomeComparisons],
      },
      scannerState,
      lifecycleStage: deriveLifecycleStage(targetMeal, scannerState),
      currentBufferPercent: 5.0,
      feedbackNotice: "Reset demo to initial pre-service state (0 scans, unserved).",
    };

    this.notify();
  }

  /**
   * Action: Simulate scanner synchronization without contacting external servers.
   */
  public syncScanner(): {
    success: boolean;
    uniqueScansCount: number;
    lastSyncedAt: string;
    message: string;
  } {
    const now = new Date().toISOString();
    const count = this.state.scannerState.uniqueScansCount;
    const isSimulated = this.state.scannerState.isSimulated;

    const status = count > 0 ? (isSimulated ? "simulated" : "synced") : "awaiting";

    const message =
      count > 0
        ? `Scanner feed synchronized: ${count} unique scans verified.`
        : "Scanner feed synchronized: 0 scans recorded (Awaiting meal service entrance).";

    this.state = {
      ...this.state,
      scannerState: {
        ...this.state.scannerState,
        lastSyncedAt: now,
        status,
      },
      feedbackNotice: message,
    };

    this.notify();

    return {
      success: true,
      uniqueScansCount: count,
      lastSyncedAt: now,
      message,
    };
  }

  /**
   * Action: Validates and records post-meal kitchen outcome in browser demo session.
   */
  public recordOutcome(input: DemoRecordOutcomeInput): {
    success: boolean;
    error?: string;
    validationErrors?: string[];
    outcome?: NonNullable<DemoMeal["outcome"]>;
    surplus?: number;
    forecastError?: number;
  } {
    const validation: DemoOutcomeValidation = validateDemoOutcomeInput(input);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(". "),
        validationErrors: validation.errors,
      };
    }

    const surplus = Math.max(0, input.preparedServings - input.actualDiners);
    const forecastError = calculateForecastErrorPercent(
      input.actualDiners,
      this.state.prediction.predictedDiners
    );

    const outcomeRecord: NonNullable<DemoMeal["outcome"]> = {
      id: `outcome-${input.mealId}`,
      mealId: input.mealId,
      preparedServings: input.preparedServings,
      actualDiners: input.actualDiners,
      remainingServings: input.remainingServings,
      wastedServings: input.wastedServings,
      estimatedSurplus: surplus,
      attendanceSource: input.isManualOverride ? "MANUAL_DEMO_OVERRIDE" : "SCANNER_SYNC",
      recordedAt: new Date().toISOString(),
    };

    const updatedTargetMeal: DemoMeal = {
      ...this.state.targetMeal,
      isServed: true,
      outcome: outcomeRecord,
      _count: {
        ...this.state.targetMeal._count,
        scans: input.actualDiners,
      },
    };

    const newComparison = {
      mealId: input.mealId,
      mealDate: this.state.targetMeal.mealDate,
      mealType: this.state.targetMeal.mealType,
      menuName: this.state.targetMeal.menu.name,
      predictedDiners: this.state.prediction.predictedDiners,
      actualDiners: input.actualDiners,
      preparedServings: input.preparedServings,
      remainingServings: input.remainingServings,
      wastedServings: input.wastedServings,
      errorPercent: forecastError,
    };

    const updatedAnalytics: DemoAnalyticsSummary = {
      ...this.state.analytics,
      totalOutcomesRecorded: this.state.analytics.totalOutcomesRecorded + 1,
      totalServingsPrepared: this.state.analytics.totalServingsPrepared + input.preparedServings,
      totalActualDinersServed: this.state.analytics.totalActualDinersServed + input.actualDiners,
      totalServingsWasted: this.state.analytics.totalServingsWasted + input.wastedServings,
      recentOutcomeComparisons: [newComparison, ...this.state.analytics.recentOutcomeComparisons.slice(0, 19)],
    };

    const updatedLifecycleStage = deriveLifecycleStage(updatedTargetMeal, this.state.scannerState);

    this.state = {
      ...this.state,
      targetMeal: updatedTargetMeal,
      analytics: updatedAnalytics,
      lifecycleStage: updatedLifecycleStage,
      feedbackNotice: "Kitchen outcome recorded in browser demo session (not persisted to server).",
    };

    this.notify();

    return {
      success: true,
      outcome: outcomeRecord,
      surplus,
      forecastError,
    };
  }

  /**
   * Action: Recalculates demand prediction with custom safety buffer using Pure Deterministic Engine.
   */
  public recalculatePrediction(customBufferPercent?: number): {
    success: boolean;
    prediction: DemoPrediction;
  } {
    const buffer = customBufferPercent ?? this.state.currentBufferPercent;

    const eligible = demoSnapshot.residents.map((r) => ({
      id: r.id,
      residentCode: r.residentCode,
      residentType: r.residentType,
    }));

    const prefMap = new Map<string, { selectedOption: string }>();
    for (const p of demoSnapshot.targetMealPreferences) {
      prefMap.set(p.residentId, { selectedOption: p.selectedOption });
    }

    const input = {
      mealId: this.state.targetMeal.id,
      mealDate: new Date(this.state.targetMeal.mealDate),
      mealType: this.state.targetMeal.mealType,
      menuId: this.state.targetMeal.menuId,
      bufferPercentage: buffer,
    };

    const result = purePredictionEngine.calculateDemand(
      input,
      eligible,
      demoSnapshot.residentHistoryRecords,
      prefMap,
      demoSnapshot.comparableHistoricalMeals,
      buffer
    );

    const explanation = generateDeterministicFallbackExplanation({
      expectedDiners: result.expectedDiners,
      historicalBaseline: result.breakdown.historicalBaselineDiners,
      personalHistoricalRate: result.breakdown.weightedFactors.personalHistoricalRate,
      dayOfWeekRate: result.breakdown.weightedFactors.dayOfWeekPatternRate,
      mealTypeRate: result.breakdown.weightedFactors.mealTypePatternRate,
      recentAttendanceRate: result.breakdown.weightedFactors.recentAttendanceTrendRate,
      preferenceIntentionRate: result.breakdown.weightedFactors.preferenceIntentionRate,
      menuAdjustment: result.breakdown.boundedAdjustments.menuAdjustmentPercent,
      trendAdjustment: result.breakdown.boundedAdjustments.macroTrendAdjustmentPercent,
      confidence: result.confidenceLevel,
      cv: Math.round(result.breakdown.confidenceMetrics.calculatedCoefficientOfVariation * 1000) / 10,
      mealType: this.state.targetMeal.mealType,
      day: "Saturday",
      menuName: this.state.targetMeal.menu.name,
    });

    const updatedPrediction: DemoPrediction = {
      id: `pred-${this.state.targetMeal.id}`,
      mealId: this.state.targetMeal.id,
      predictedDiners: result.expectedDiners,
      recommendedServings: result.recommendedServings,
      wasteRisk: result.wasteRisk,
      confidenceLevel: result.confidenceLevel,
      confidenceReason: result.confidenceReason,
      algorithmVersion: result.algorithmVersion,
      explanation,
      explanationSource: "fallback",
      createdAt: new Date().toISOString(),
      predictionFactors: result.breakdown,
    };

    const updatedTargetMeal: DemoMeal = {
      ...this.state.targetMeal,
      prediction: updatedPrediction,
    };

    this.state = {
      ...this.state,
      prediction: updatedPrediction,
      targetMeal: updatedTargetMeal,
      currentBufferPercent: buffer,
      feedbackNotice: `Prediction recalculated with ${buffer}% buffer (${result.recommendedServings} servings recommended).`,
    };

    this.notify();

    return {
      success: true,
      prediction: updatedPrediction,
    };
  }

  /**
   * Action: Sets client-side preview role (demo only, not real auth).
   */
  public setActiveRole(role: UserRole): void {
    if (this.state.activeRole !== role) {
      this.state = { ...this.state, activeRole: role };
      this.notify();
    }
  }

  /**
   * Action: Clears feedback banner message.
   */
  public clearFeedbackNotice(): void {
    if (this.state.feedbackNotice !== null) {
      this.state = { ...this.state, feedbackNotice: null };
      this.notify();
    }
  }
}
