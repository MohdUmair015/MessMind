"use client";

import React, { useState, useTransition } from "react";
import { recordOutcomeAction } from "@/app/actions/meal-actions";
import { CheckCircle2, AlertCircle, Loader2, Sparkles, ShieldAlert, QrCode } from "lucide-react";

interface OutcomeRecordingFormProps {
  mealId: string;
  predictedDiners?: number;
  recommendedServings?: number;
  authoritativeScansCount?: number;
  initialOutcome?: {
    preparedServings: number;
    actualDiners: number;
    remainingServings: number;
    wastedServings: number;
    attendanceSource?: string;
    estimatedSurplus?: number | null;
    recordedAt?: string;
  } | null;
}

export function OutcomeRecordingForm({
  mealId,
  predictedDiners,
  recommendedServings,
  authoritativeScansCount = 0,
  initialOutcome,
}: OutcomeRecordingFormProps) {
  const [isPending, startTransition] = useTransition();

  // Prepared servings defaults to existing outcome, or recommended prep with 5% safety buffer
  const [preparedServings, setPreparedServings] = useState<string>(
    initialOutcome
      ? String(initialOutcome.preparedServings)
      : recommendedServings
      ? String(recommendedServings)
      : "95"
  );

  // Authoritative diners count from hostel scanner
  const defaultActualDiners = initialOutcome
    ? String(initialOutcome.actualDiners)
    : authoritativeScansCount > 0
    ? String(authoritativeScansCount)
    : "99";

  const [actualDiners, setActualDiners] = useState<string>(defaultActualDiners);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(
    initialOutcome?.attendanceSource === "MANUAL_DEMO_OVERRIDE"
  );

  const [remainingServings, setRemainingServings] = useState<string>(
    initialOutcome ? String(initialOutcome.remainingServings) : "9"
  );
  const [wastedServings, setWastedServings] = useState<string>(
    initialOutcome ? String(initialOutcome.wastedServings) : "4"
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialOutcome ? "Outcome record is currently saved in PostgreSQL." : null
  );

  // Client-side calculations
  const numActual = parseInt(actualDiners, 10);
  const numPrepared = parseInt(preparedServings, 10);
  const numRemaining = parseInt(remainingServings, 10);
  const numWasted = parseInt(wastedServings, 10);

  const hasValidNumbers =
    !isNaN(numActual) && !isNaN(numPrepared) && !isNaN(numRemaining) && !isNaN(numWasted);

  let validationError = "";
  if (hasValidNumbers) {
    if (numPrepared < 0 || numActual < 0 || numRemaining < 0 || numWasted < 0) {
      validationError = "Servings and diners must be non-negative values.";
    } else if (numActual > numPrepared) {
      validationError = `Actual diners (${numActual}) cannot exceed prepared servings (${numPrepared}) without logged replenishment.`;
    } else if (numRemaining > numPrepared) {
      validationError = `Remaining servings (${numRemaining}) cannot exceed prepared servings (${numPrepared}).`;
    } else if (numWasted > numRemaining) {
      validationError = `Wasted servings (${numWasted}) cannot exceed remaining unconsumed servings (${numRemaining}).`;
    }
  }

  const fillDemoBenchmark = () => {
    setPreparedServings("108");
    setActualDiners("99");
    setRemainingServings("9");
    setWastedServings("4");
    setIsManualOverride(true);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!hasValidNumbers) {
      setErrorMessage("Please enter valid integers for all outcome fields.");
      return;
    }

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    startTransition(async () => {
      const res = await recordOutcomeAction({
        mealId,
        preparedServings: numPrepared,
        actualDiners: numActual,
        remainingServings: numRemaining,
        wastedServings: numWasted,
        isDemoOverride: isManualOverride,
      });

      if (res.success) {
        setSuccessMessage("Kitchen outcome and waste audit saved successfully!");
      } else {
        setErrorMessage(res.error || "Failed to save outcome record.");
      }
    });
  };

  const estimatedSurplus =
    hasValidNumbers && numPrepared >= numActual ? numPrepared - numActual : null;

  const predictionError =
    predictedDiners && !isNaN(numActual) && numActual > 0
      ? Math.round((Math.abs(numActual - predictedDiners) / predictedDiners) * 1000) / 10
      : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Architectural Notice: Manual Form Isolation */}
      <div className="p-3.5 bg-mango-50/80 border border-mango-200 rounded-2xl text-xs text-mango-950 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-mango-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-mango-950">
            Kitchen Waste & Surplus Audit (Demo Fallback)
          </span>
          <p className="text-[11px] text-mango-900 leading-relaxed">
            In standard operations, <strong>actual attendance is synchronized directly from the hostel app&apos;s meal scanner</strong>.
            This form is strictly for kitchen managers to log physical remaining food and discarded waste audits.
          </p>
        </div>
      </div>

      {/* Demo Benchmark Filler Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-surface-border min-w-0">
        <span className="text-xs text-charcoal-500 font-medium">Physical Kitchen Log</span>
        <button
          type="button"
          onClick={fillDemoBenchmark}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cream-100 hover:bg-cream-200 text-charcoal-800 text-xs font-semibold rounded-lg border border-surface-border transition-colors cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-coral-500" />
          <span>Fill Demo Benchmark (108 / 99 / 9 / 4)</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-coral-50 border border-coral-200 text-coral-900 rounded-xl text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-coral-600 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-mint-50 border border-mint-200 text-mint-900 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-mint-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-charcoal-800 mb-1">
            Prepared Servings *
          </label>
          <input
            type="number"
            min="0"
            required
            value={preparedServings}
            onChange={(e) => setPreparedServings(e.target.value)}
            placeholder="e.g. 95 or 108"
            className="w-full px-3 py-2 bg-white border border-surface-border rounded-xl text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent"
          />
          <span className="text-[11px] text-charcoal-500">Total food portions prepared by kitchen</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-charcoal-800">
              Attendance (Diners) *
            </label>
            <span className="text-[10px] text-mint-800 font-bold bg-mint-50 px-2 py-0.5 rounded-md border border-mint-200 flex items-center gap-1">
              <QrCode className="w-3 h-3 text-mint-600" />
              <span>{isManualOverride ? "Manual Override" : "Hostel Scanner"}</span>
            </span>
          </div>
          <input
            type="number"
            min="0"
            required
            readOnly={!isManualOverride}
            value={actualDiners}
            onChange={(e) => setActualDiners(e.target.value)}
            placeholder="e.g. 99"
            className={`w-full px-3 py-2 border rounded-xl text-sm ${
              isManualOverride
                ? "bg-white border-mango-300 text-charcoal-900 focus:ring-2 focus:ring-coral-500"
                : "bg-cream-100/70 border-surface-border text-charcoal-700 cursor-not-allowed"
            }`}
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-charcoal-500">
              {isManualOverride
                ? "Demo manual override enabled"
                : "Authoritative count from physical scans"}
            </span>
            <label className="inline-flex items-center gap-1 text-[11px] text-charcoal-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isManualOverride}
                onChange={(e) => setIsManualOverride(e.target.checked)}
                className="w-3 h-3 text-coral-600 rounded border-surface-border focus:ring-coral-500"
              />
              <span>Demo override</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-charcoal-800 mb-1">
            Remaining Servings (Unconsumed) *
          </label>
          <input
            type="number"
            min="0"
            required
            value={remainingServings}
            onChange={(e) => setRemainingServings(e.target.value)}
            placeholder="e.g. 9"
            className="w-full px-3 py-2 bg-white border border-surface-border rounded-xl text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent"
          />
          <span className="text-[11px] text-charcoal-500">Unconsumed portions left at counter</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-charcoal-800 mb-1">
            Actual Food Waste Discarded *
          </label>
          <input
            type="number"
            min="0"
            required
            value={wastedServings}
            onChange={(e) => setWastedServings(e.target.value)}
            placeholder="e.g. 4"
            className="w-full px-3 py-2 bg-white border border-surface-border rounded-xl text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent"
          />
          <span className="text-[11px] text-charcoal-500">Physical food thrown away (audit)</span>
        </div>
      </div>

      {validationError && (
        <div className="text-xs text-coral-700 font-semibold">{validationError}</div>
      )}

      {/* Semantic Distinction Panel: Attendance vs Surplus vs Waste */}
      {hasValidNumbers && !validationError && (
        <div className="p-3 bg-cream-50/90 border border-surface-border rounded-xl text-xs space-y-2 text-charcoal-700 min-w-0">
          <div className="font-bold text-charcoal-900 text-[11px] uppercase tracking-wider">
            Operational Semantics Breakdown
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] min-w-0">
            <div className="p-2.5 bg-white rounded-lg border border-surface-border min-w-0">
              <span className="text-charcoal-500 block">Attendance (Diners):</span>
              <span className="font-bold text-charcoal-950 break-words">{numActual} diners</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-surface-border min-w-0">
              <span className="text-charcoal-500 block">Estimated Surplus:</span>
              <span className="font-bold text-coral-600 break-words">
                {estimatedSurplus !== null ? `${estimatedSurplus} servings` : "—"}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-surface-border min-w-0">
              <span className="text-charcoal-500 block">Physical Discarded Waste:</span>
              <span className="font-bold text-coral-700 break-words">{numWasted} servings</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-surface-border min-w-0">
              <span className="text-charcoal-500 block">Prediction Accuracy Error:</span>
              <span className="font-bold text-charcoal-950 break-words">
                {predictionError !== null ? `${predictionError}%` : "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || (hasValidNumbers && !!validationError)}
        className="w-full py-3 px-4 bg-charcoal-950 hover:bg-charcoal-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-warm-card cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-coral-400" />
            <span>Saving Waste Audit to PostgreSQL...</span>
          </>
        ) : (
          <span>{initialOutcome ? "Update Waste Audit" : "Save Kitchen Waste Audit"}</span>
        )}
      </button>
    </form>
  );
}
