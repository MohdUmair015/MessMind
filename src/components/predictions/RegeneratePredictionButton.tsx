"use client";

import React, { useState, useTransition } from "react";
import { useDemo } from "@/modules/demo";
import { RotateCw, Check, AlertCircle, Sliders } from "lucide-react";

interface RegeneratePredictionButtonProps {
  mealId: string;
}

const SUPPORTED_BUFFERS = [0, 5, 8, 10, 15];

export function RegeneratePredictionButton({ mealId }: RegeneratePredictionButtonProps) {
  const { demo } = useDemo();
  const [isPending, startTransition] = useTransition();
  const [selectedBuffer, setSelectedBuffer] = useState<number>(demo?.currentBufferPercent ?? 5);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const handleRegenerate = () => {
    startTransition(async () => {
      setStatus("idle");
      setStatusMessage(null);

      if (demo?.isDemoMode) {
        const res = demo.recalculatePrediction(selectedBuffer);
        if (res.success) {
          setStatus("success");
          setStatusMessage(`${res.prediction.recommendedServings} servings (${selectedBuffer}% buffer)`);
          setTimeout(() => setStatus("idle"), 4000);
        } else {
          setStatus("error");
        }
        return;
      }

      // Dynamic import keeps the static demo path 100% decoupled from server actions
      const { regeneratePredictionAction } = await import("@/app/actions/meal-actions");
      const res = await regeneratePredictionAction(mealId, selectedBuffer);
      if (res.success) {
        setStatus("success");
        setStatusMessage("Recalculated");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Interactive Safety Buffer Selector */}
      <div className="flex items-center gap-1.5 bg-cream-100 border border-surface-border px-2.5 py-1 rounded-2xl text-xs">
        <Sliders className="w-3.5 h-3.5 text-charcoal-500 shrink-0" />
        <span className="text-charcoal-600 font-semibold text-[11px]">Buffer:</span>
        <select
          value={selectedBuffer}
          onChange={(e) => setSelectedBuffer(Number(e.target.value))}
          disabled={isPending}
          className="bg-transparent font-bold text-charcoal-900 focus:outline-none cursor-pointer text-xs"
          title="Safety buffer percentage for kitchen preparation calculation"
        >
          {SUPPORTED_BUFFERS.map((b) => (
            <option key={b} value={b}>
              {b}% {b === 5 ? "(Recommended)" : ""}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleRegenerate}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-cream-100 border border-surface-border text-charcoal-800 text-xs font-bold rounded-2xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
      >
        <RotateCw className={`w-3.5 h-3.5 text-coral-600 ${isPending ? "animate-spin" : ""}`} />
        <span>{isPending ? "Recalculating..." : "Recalculate Prediction"}</span>
      </button>

      {status === "success" && (
        <span className="inline-flex items-center gap-1 text-xs text-mint-800 font-bold bg-mint-50 px-2.5 py-1 rounded-full border border-mint-200 animate-fade-in">
          <Check className="w-3.5 h-3.5 text-mint-600" />
          <span>{statusMessage || "Updated"}</span>
        </span>
      )}

      {status === "error" && (
        <span className="inline-flex items-center gap-1 text-xs text-coral-800 font-bold bg-coral-50 px-2.5 py-1 rounded-full border border-coral-200">
          <AlertCircle className="w-3.5 h-3.5 text-coral-600" />
          <span>Failed</span>
        </span>
      )}
    </div>
  );
}
