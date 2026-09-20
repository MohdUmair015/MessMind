"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { BrainCircuit, ChefHat, QrCode, TrendingUp, CheckCircle2, Sparkles, ArrowRight, RefreshCw } from "lucide-react";

export type LifecycleStage = "PREDICT" | "PREPARE" | "OBSERVE" | "LEARN";

interface LifecycleStepperProps {
  currentStage: LifecycleStage;
  predictedDiners?: number;
  recommendedServings?: number;
  actualScans?: number | null;
  predictionError?: number | null;
  className?: string;
}

export function LifecycleStepper({
  currentStage,
  predictedDiners = 90,
  recommendedServings = 95,
  actualScans,
  predictionError,
  className,
}: LifecycleStepperProps) {
  const [inspectedStage, setInspectedStage] = useState<LifecycleStage | "NEXT">(currentStage);

  const stages: Array<{
    id: LifecycleStage | "NEXT";
    label: string;
    sublabel: string;
    description: string;
    detail: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: "PREDICT",
      label: "Predict",
      sublabel: `${predictedDiners} expected diners`,
      description: "Deterministic demand prediction",
      detail: `Aggregates 40% personal history, 20% day pattern, 15% dinner service, 15% recent trend, and 10% opt-in intention to compute ${predictedDiners} expected diners.`,
      icon: BrainCircuit,
    },
    {
      id: "PREPARE",
      label: "Prepare",
      sublabel: `${recommendedServings} servings (+5%)`,
      description: "Kitchen safety guidance",
      detail: `Adds a calibrated +5% safety buffer (${recommendedServings} portions) to prevent food shortages during unexpected diner rushes without overcooking.`,
      icon: ChefHat,
    },
    {
      id: "OBSERVE",
      label: "Observe",
      sublabel: actualScans !== null && actualScans !== undefined ? `${actualScans} scans verified` : "Dining room syncing",
      description: "Dining room scanner sync",
      detail: actualScans !== null && actualScans !== undefined
        ? `Hostel app scanner captured ${actualScans} unique dining scans upon entry. Management enters zero manual counts.`
        : "Residents scan upon entering the mess hall via the hostel mobile app. Actual attendance syncs automatically.",
      icon: QrCode,
    },
    {
      id: "LEARN",
      label: "Learn",
      sublabel: predictionError !== null && predictionError !== undefined ? `${predictionError}% variance` : "Awaiting meal audit",
      description: "Closed feedback loop",
      detail: predictionError !== null && predictionError !== undefined
        ? `Observed attendance variance of ${predictionError}% is logged to PostgreSQL, updating individual and cohort rolling weights.`
        : "Post-meal leftovers and scanner attendance calculate the model error and update behavioral parameters.",
      icon: TrendingUp,
    },
    {
      id: "NEXT",
      label: "Next Forecast",
      sublabel: "Self-correcting model",
      description: "Continuous intelligence",
      detail: "Today's meal scan data directly calibrates tomorrow's dinner forecast. The system learns continuously without manual retraining.",
      icon: RefreshCw,
    },
  ];

  const stageOrder: Record<LifecycleStage | "NEXT", number> = {
    PREDICT: 0,
    PREPARE: 1,
    OBSERVE: 2,
    LEARN: 3,
    NEXT: 4,
  };

  const currentOrder = stageOrder[currentStage];
  const activeInspected = stages.find((s) => s.id === inspectedStage) || stages[currentOrder];

  return (
    <section
      className={cn(
        "p-6 md:p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card transition-all min-w-0",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-surface-border/70 min-w-0">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold tracking-wider uppercase text-coral-600 block">
            Closed Operational Intelligence Loop
          </span>
          <h3 className="text-lg md:text-xl font-black text-charcoal-900 tracking-tight break-words">
            Predict → Prepare → Observe → Learn → Next Forecast
          </h3>
          <p className="text-xs md:text-sm text-charcoal-600 mt-0.5 break-words">
            Click or tap any stage to inspect how today&apos;s meal teaches tomorrow&apos;s prediction.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="text-xs font-bold text-coral-700 bg-coral-50 border border-coral-200/80 px-3 py-1 rounded-full">
            Active: {stages[currentOrder].label} Stage
          </span>
        </div>
      </div>

      {/* Stepper Grid (Clickable/Tappable) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 min-w-0">
        {stages.map((stage, idx) => {
          const isCurrent = idx === currentOrder;
          const isDone = idx < currentOrder;
          const isInspected = stage.id === inspectedStage;
          const Icon = stage.icon;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setInspectedStage(stage.id)}
              className={cn(
                "p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer group focus:outline-none min-w-0 last:col-span-2 sm:last:col-span-1 lg:last:col-span-1",
                isInspected
                  ? "bg-coral-50/60 border-coral-400 shadow-sm ring-2 ring-coral-300/60"
                  : isCurrent
                  ? "bg-coral-50/30 border-coral-300/80"
                  : isDone
                  ? "bg-cream-50/80 border-surface-border hover:bg-cream-100"
                  : "bg-white border-surface-border/80 hover:bg-cream-50/50 opacity-70"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                    isCurrent || isInspected
                      ? "bg-coral-500 text-white shadow-coral-glow"
                      : isDone
                      ? "bg-mint-100 text-mint-700"
                      : "bg-charcoal-100 text-charcoal-500"
                  )}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-600">
                  0{idx + 1}
                </span>
              </div>

              <div className="mt-3">
                <div className="text-xs md:text-sm font-bold text-charcoal-900 group-hover:text-coral-600 transition-colors">
                  {stage.label}
                </div>
                <div className="text-[11px] font-medium text-charcoal-600 truncate mt-0.5">
                  {stage.sublabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Detail Reveal Panel */}
      <div className="mt-5 p-4 md:p-5 rounded-2xl bg-cream-50 border border-surface-border flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white border border-surface-border flex items-center justify-center flex-shrink-0 text-coral-600 shadow-2xs">
          <activeInspected.icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-charcoal-900">
              Stage: {activeInspected.label} — {activeInspected.description}
            </h4>
            <span className="text-[11px] font-bold text-coral-700 bg-coral-100/70 px-2.5 py-0.5 rounded-md border border-coral-200">
              {activeInspected.sublabel}
            </span>
          </div>
          <p className="text-xs md:text-sm text-charcoal-700 mt-1 leading-relaxed">
            {activeInspected.detail}
          </p>
        </div>
      </div>
    </section>
  );
}

