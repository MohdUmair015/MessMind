"use client";

import React, { useState, useTransition } from "react";
import { useDemo } from "@/modules/demo";
import { RefreshCw, QrCode, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface SyncScannerButtonProps {
  mealId: string;
  hasScans: boolean;
  uniqueScansCount: number;
}

export function SyncScannerButton({
  mealId,
  hasScans,
  uniqueScansCount,
}: SyncScannerButtonProps) {
  const { demo } = useDemo();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFetchScans = () => {
    setStatusMessage(null);
    setErrorMessage(null);
    startTransition(async () => {
      if (demo?.isDemoMode) {
        const res = demo.syncScanner();
        setStatusMessage(res.message);
        return;
      }

      // Dynamic import keeps the static demo path 100% decoupled from server actions
      const { syncMealAttendanceAction } = await import("@/app/actions/meal-actions");
      const res = await syncMealAttendanceAction(mealId);
      if (res.success && res.reconciliation) {
        setStatusMessage(
          `Successfully fetched ${res.reconciliation.uniqueScansCount} unique scans from hostel scanner.`
        );
      } else {
        setErrorMessage(res.error || "Failed to fetch scanner attendance.");
      }
    });
  };

  const handleSimulateDemoScans = () => {
    setStatusMessage(null);
    setErrorMessage(null);
    startTransition(async () => {
      if (demo?.isDemoMode) {
        const res = demo.simulateScans(99);
        setStatusMessage(
          `Demo Scanner Feed: ${res.scannedCount} dining scans recorded and reconciled (+${res.variance} above forecast)!`
        );
        return;
      }

      // Dynamic import keeps the static demo path 100% decoupled from server actions
      const { simulateScannerSyncAction } = await import("@/app/actions/meal-actions");
      const res = await simulateScannerSyncAction(mealId, 99);
      if (res.success) {
        setStatusMessage("Demo Scanner Feed: 99 dining scans recorded and reconciled automatically!");
      } else {
        setErrorMessage(res.error || "Failed to simulate scanner ingestion.");
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
      {statusMessage && (
        <div className="text-xs text-mint-800 bg-mint-50 px-3 py-1 rounded-xl border border-mint-200 flex items-center gap-1.5 animate-fade-in font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-mint-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="text-xs text-coral-800 bg-coral-50 px-3 py-1 rounded-xl border border-coral-200 flex items-center gap-1.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5 text-coral-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleFetchScans}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-cream-100 text-charcoal-800 text-xs font-bold rounded-2xl border border-surface-border shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          title={
            demo?.isDemoMode
              ? "Reconcile dining scans with prediction using simulated scanner integration"
              : "Fetch authoritative meal scans from the hostel dining scanner integration"
          }
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-coral-500" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 text-charcoal-500" />
          )}
          <span>{demo?.isDemoMode ? "Reconcile Demo Scans" : "Fetch Hostel Scans"}</span>
        </button>

        <button
          type="button"
          onClick={handleSimulateDemoScans}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold rounded-2xl shadow-coral-glow transition-all disabled:opacity-50 cursor-pointer"
          title="Simulate 99 physical resident scans arriving from the hostel dining room scanner"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <QrCode className="w-3.5 h-3.5 text-white/90" />
          )}
          <span>Simulate Scans (99)</span>
        </button>
      </div>
    </div>
  );
}
