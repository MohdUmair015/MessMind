"use client";

import React, { useTransition } from "react";
import { regeneratePredictionAction } from "@/app/actions/meal-actions";
import { RotateCw, Check, AlertCircle } from "lucide-react";

interface RegeneratePredictionButtonProps {
  mealId: string;
}

export function RegeneratePredictionButton({ mealId }: RegeneratePredictionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");

  const handleRegenerate = () => {
    startTransition(async () => {
      setStatus("idle");
      const res = await regeneratePredictionAction(mealId);
      if (res.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRegenerate}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-cream-100 border border-surface-border text-charcoal-800 text-xs font-bold rounded-2xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
      >
        <RotateCw className={`w-3.5 h-3.5 text-coral-600 ${isPending ? "animate-spin" : ""}`} />
        <span>{isPending ? "Recalculating..." : "Recalculate Prediction"}</span>
      </button>

      {status === "success" && (
        <span className="inline-flex items-center gap-1 text-xs text-mint-800 font-bold bg-mint-50 px-2.5 py-1 rounded-full border border-mint-200">
          <Check className="w-3.5 h-3.5" />
          <span>Updated</span>
        </span>
      )}

      {status === "error" && (
        <span className="inline-flex items-center gap-1 text-xs text-coral-800 font-bold bg-coral-50 px-2.5 py-1 rounded-full border border-coral-200">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed</span>
        </span>
      )}
    </div>
  );
}
