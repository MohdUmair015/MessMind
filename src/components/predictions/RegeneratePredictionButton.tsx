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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
      >
        <RotateCw className={`w-3.5 h-3.5 text-teal-600 ${isPending ? "animate-spin" : ""}`} />
        <span>{isPending ? "Recalculating..." : "Recalculate Prediction"}</span>
      </button>

      {status === "success" && (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
          <Check className="w-3.5 h-3.5" />
          <span>Updated</span>
        </span>
      )}

      {status === "error" && (
        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed</span>
        </span>
      )}
    </div>
  );
}
