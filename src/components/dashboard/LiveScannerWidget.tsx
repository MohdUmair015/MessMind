"use client";

import React, { useState, useTransition } from "react";
import { syncMealAttendanceAction, simulateScannerSyncAction, resetMealDemoScansAction } from "@/app/actions/meal-actions";
import { StatusRing } from "@/components/ui/StatusRing";
import { QrCode, RefreshCw, RotateCcw, Loader2, CheckCircle2, AlertCircle, Sparkles, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveScannerWidgetProps {
  mealId: string;
  isServed: boolean;
  predictedDiners: number;
  recommendedServings: number;
  initialScansCount: number;
  duplicateScansCount: number;
  className?: string;
}

export function LiveScannerWidget({
  mealId,
  isServed,
  predictedDiners,
  recommendedServings,
  initialScansCount,
  duplicateScansCount,
  className,
}: LiveScannerWidgetProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scansCount, setScansCount] = useState<number>(initialScansCount);

  React.useEffect(() => {
    setScansCount(initialScansCount);
  }, [initialScansCount]);

  const hasScans = scansCount > 0;
  const variance = hasScans ? scansCount - predictedDiners : null;
  const percentOfForecast = hasScans && predictedDiners > 0
    ? Math.round((scansCount / predictedDiners) * 100)
    : null;

  const handleFetchScans = () => {
    setFeedback(null);
    setErrorMessage(null);
    startTransition(async () => {
      const res = await syncMealAttendanceAction(mealId);
      if (res.success && res.reconciliation) {
        setScansCount(res.reconciliation.uniqueScansCount);
        setFeedback(`Synchronized ${res.reconciliation.uniqueScansCount} scans from hostel scanner.`);
      } else {
        setErrorMessage(res.error || "Failed to fetch scanner entries.");
      }
    });
  };

  const handleSimulateDemo = () => {
    setFeedback(null);
    setErrorMessage(null);
    startTransition(async () => {
      const res = await simulateScannerSyncAction(mealId, 99);
      if (res.success && typeof res.scannedCount === "number") {
        setScansCount(res.scannedCount);
        setFeedback(`Reconciled ${res.scannedCount} unique scans from dining scanner automatically.`);
      } else {
        setErrorMessage(res.error || "Failed to simulate scans.");
      }
    });
  };

  const handleResetDemo = () => {
    setFeedback(null);
    setErrorMessage(null);
    startTransition(async () => {
      const res = await resetMealDemoScansAction(mealId);
      if (res.success) {
        setScansCount(0);
        setFeedback("Reset demo to initial pre-service state (0 scans).");
      } else {
        setErrorMessage(res.error || "Failed to reset demo.");
      }
    });
  };

  return (
    <section className={cn("p-6 md:p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card flex flex-col justify-between h-full min-w-0", className)}>
      <div className="min-w-0 w-full">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border/70 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-mint-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-charcoal-900 truncate">
              Dining Room Live
            </span>
          </div>

          <span className="text-xs font-semibold text-charcoal-600 bg-cream-100 px-3 py-0.5 rounded-full border border-surface-border/70 shrink-0">
            Synced from Hostel App
          </span>
        </div>

        {feedback && (
          <div className="mt-4 p-3 bg-mint-50 border border-mint-200 rounded-2xl text-xs text-mint-900 flex items-center gap-2.5 animate-fade-in break-words">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-mint-600" />
            <span className="font-semibold">{feedback}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-coral-50 border border-coral-200 rounded-2xl text-xs text-coral-900 flex items-center gap-2.5 break-words">
            <AlertCircle className="w-4 h-4 shrink-0 text-coral-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Primary Story: Ring + Attendance + Variance */}
        {hasScans ? (
          <div className="mt-6 flex flex-col items-center gap-5 min-w-0 w-full">
            {/* Status Ring - centered */}
            <div className="w-full flex justify-center py-1 shrink-0">
              <StatusRing
                current={scansCount}
                total={predictedDiners}
                size={144}
                strokeWidth={11}
                label="residents"
                sublabel={`of ${predictedDiners} expected`}
                color={scansCount >= predictedDiners ? "mint" : "coral"}
              />
            </div>

            {/* Concise Attendance Narrative */}
            <div className="space-y-2 text-center w-full min-w-0">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-mint-100 text-mint-800 border border-mint-200">
                  {variance !== null && variance > 0 ? `+${variance}` : variance} above forecast ({percentOfForecast}%)
                </span>
              </div>

              <div>
                <h4 className="text-xl sm:text-2xl font-black text-charcoal-950 tracking-tight break-words">
                  {scansCount} Unique Residents
                </h4>
                <p className="text-xs text-charcoal-600 mt-0.5 leading-relaxed break-words">
                  Checked in at dining entrance of {predictedDiners} expected diners.
                </p>
              </div>
            </div>

            {/* Authoritative Reassurance Card */}
            <div className="p-3.5 rounded-2xl bg-cream-50/70 border border-surface-border/60 space-y-1.5 text-xs text-charcoal-600 w-full">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-mint-600 shrink-0" />
                <span className="font-semibold text-charcoal-800 break-words">Authoritative hostel app scanner data</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-charcoal-500">
                <Radio className="w-3 h-3 text-mint-500 shrink-0 animate-pulse" />
                <span>Zero manual attendance entry required</span>
              </div>
              {duplicateScansCount > 0 && (
                <div className="text-[11px] text-charcoal-400 pl-5.5">
                  {duplicateScansCount} re-entry duplicate suppressed
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="my-6 p-8 text-center bg-cream-50/60 rounded-2xl border border-surface-border/60 space-y-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white border border-surface-border text-coral-500 flex items-center justify-center mx-auto shadow-2xs shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-charcoal-900">
              Dining scanner will sync live when service starts.
            </h4>
            <p className="text-xs text-charcoal-600 max-w-xs mx-auto leading-relaxed">
              Residents scan upon entering the dining hall. Mess managers do not need to manually count attendees.
            </p>
          </div>
        )}
      </div>

      {/* Subtle Demo Disclosure & Action Buttons (Reflows & Wraps without Overflow) */}
      <div className="mt-8 pt-4 border-t border-surface-border/60 flex flex-col gap-3 min-w-0 w-full">
        <span className="text-[11px] text-charcoal-500 font-medium break-words">
          Demo mode · Simulated scanner activity
        </span>

        <div className="flex flex-wrap items-center gap-2.5 w-full min-w-0">
          {hasScans && (
            <>
              <button
                type="button"
                onClick={handleFetchScans}
                disabled={isPending}
                className="flex-1 min-w-[85px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-cream-50 text-charcoal-700 text-xs font-semibold rounded-xl border border-surface-border shadow-2xs transition-colors disabled:opacity-50 cursor-pointer focus:outline-none"
                title="Fetch latest scans from hostel app integration"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-coral-500" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-charcoal-500" />
                )}
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleResetDemo}
                disabled={isPending}
                className="flex-1 min-w-[85px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-cream-50 text-charcoal-700 text-xs font-semibold rounded-xl border border-surface-border shadow-2xs transition-colors disabled:opacity-50 cursor-pointer focus:outline-none"
                title="Reset demo scans to start presentation again from 0 scans"
              >
                <RotateCcw className="w-3.5 h-3.5 text-charcoal-500" />
                <span>Reset</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleSimulateDemo}
            disabled={isPending}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold rounded-xl shadow-coral-glow transition-all duration-150 disabled:opacity-50 cursor-pointer focus:outline-none active:scale-95 text-center"
            title="Simulate 99 dining scans from hostel app scanner (Hackathon demo)"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-mango-200" />
            )}
            <span className="whitespace-nowrap">Simulate Scans (99)</span>
          </button>
        </div>
      </div>
    </section>
  );
}
