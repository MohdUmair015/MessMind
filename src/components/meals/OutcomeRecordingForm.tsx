"use client";

import React, { useState, useTransition } from "react";
import { recordOutcomeAction } from "@/app/actions/meal-actions";
import { CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";

interface OutcomeRecordingFormProps {
  mealId: string;
  predictedDiners?: number;
  initialOutcome?: {
    preparedServings: number;
    actualDiners: number;
    remainingServings: number;
    wastedServings: number;
    recordedAt?: string;
  } | null;
}

export function OutcomeRecordingForm({
  mealId,
  predictedDiners,
  initialOutcome,
}: OutcomeRecordingFormProps) {
  const [isPending, startTransition] = useTransition();

  const [preparedServings, setPreparedServings] = useState<string>(
    initialOutcome ? String(initialOutcome.preparedServings) : ""
  );
  const [actualDiners, setActualDiners] = useState<string>(
    initialOutcome ? String(initialOutcome.actualDiners) : ""
  );
  const [remainingServings, setRemainingServings] = useState<string>(
    initialOutcome ? String(initialOutcome.remainingServings) : ""
  );
  const [wastedServings, setWastedServings] = useState<string>(
    initialOutcome ? String(initialOutcome.wastedServings) : ""
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialOutcome ? "Outcome record is currently saved in PostgreSQL." : null
  );

  // Client-side quick calculation of prediction error
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
      });

      if (res.success) {
        setSuccessMessage("Outcome successfully recorded and synchronized with analytics!");
      } else {
        setErrorMessage(res.error || "Failed to save outcome record.");
      }
    });
  };

  const predictionError =
    predictedDiners && !isNaN(numActual) && numActual > 0
      ? Math.round((Math.abs(numActual - predictedDiners) / predictedDiners) * 1000) / 10
      : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Demo Benchmark Filler Button */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <span className="text-xs text-slate-500 font-medium">Post-Meal Kitchen Data</span>
        <button
          type="button"
          onClick={fillDemoBenchmark}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-md border border-teal-200/80 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Load Demo Saturday Benchmark (108/99/9/4)</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Prepared Servings *
          </label>
          <input
            type="number"
            min="0"
            required
            value={preparedServings}
            onChange={(e) => setPreparedServings(e.target.value)}
            placeholder="e.g. 108"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <span className="text-[11px] text-slate-400">Total food portions prepared by kitchen</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Observed Actual Diners *
          </label>
          <input
            type="number"
            min="0"
            required
            value={actualDiners}
            onChange={(e) => setActualDiners(e.target.value)}
            placeholder="e.g. 99"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <span className="text-[11px] text-slate-400">Total physical diner scans captured</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Remaining Servings *
          </label>
          <input
            type="number"
            min="0"
            required
            value={remainingServings}
            onChange={(e) => setRemainingServings(e.target.value)}
            placeholder="e.g. 9"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <span className="text-[11px] text-slate-400">Unconsumed portions left at counter</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Wasted Servings *
          </label>
          <input
            type="number"
            min="0"
            required
            value={wastedServings}
            onChange={(e) => setWastedServings(e.target.value)}
            placeholder="e.g. 4"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <span className="text-[11px] text-slate-400">Portions discarded/unusable</span>
        </div>
      </div>

      {validationError && (
        <div className="text-xs text-rose-600 font-medium">{validationError}</div>
      )}

      {/* Outcome Feedback Preview */}
      {hasValidNumbers && !validationError && (
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-1.5 text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-500">Leftover Ratio:</span>
            <span className="font-semibold text-slate-800">
              {numPrepared > 0 ? ((numRemaining / numPrepared) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Waste Ratio:</span>
            <span className="font-semibold text-slate-800">
              {numPrepared > 0 ? ((numWasted / numPrepared) * 100).toFixed(1) : 0}%
            </span>
          </div>
          {predictionError !== null && (
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="font-medium text-slate-700">Prediction Accuracy Error:</span>
              <span className="font-bold text-teal-700">{predictionError}%</span>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || (hasValidNumbers && !!validationError)}
        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
            <span>Saving Outcome to PostgreSQL...</span>
          </>
        ) : (
          <span>{initialOutcome ? "Update Outcome Record" : "Confirm & Save Outcome Record"}</span>
        )}
      </button>
    </form>
  );
}
