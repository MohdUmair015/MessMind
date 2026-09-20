"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  UserCheck,
  Calendar,
  Utensils,
  TrendingUp,
  HeartHandshake,
  ChevronDown,
  ArrowRight,
  Calculator,
  Sparkles,
} from "lucide-react";

interface WeightedFactors {
  personalHistoricalRate?: number;
  dayOfWeekPatternRate?: number;
  mealTypePatternRate?: number;
  recentAttendanceTrendRate?: number;
  preferenceIntentionRate?: number;
}

interface BoundedAdjustments {
  menuAdjustmentPercent?: number;
  macroTrendAdjustmentPercent?: number;
}

interface InteractiveFactorBreakdownProps {
  weightedFactors?: WeightedFactors;
  boundedAdjustments?: BoundedAdjustments;
  historicalBaselineDiners?: number;
  expectedDiners?: number;
  confidenceCV?: number;
  explanation?: string | null;
  explanationSource?: "bedrock" | "fallback" | null;
  className?: string;
}

export function InteractiveFactorBreakdown({
  weightedFactors,
  boundedAdjustments,
  historicalBaselineDiners = 86,
  expectedDiners = 90,
  confidenceCV = 4.4,
  explanation,
  explanationSource,
  className,
}: InteractiveFactorBreakdownProps) {
  // Open the primary signal by default to demonstrate the disclosure immediately
  const [expandedFactor, setExpandedFactor] = useState<string | null>("personal");
  const [showTechnicalMath, setShowTechnicalMath] = useState(false);

  // Dynamic rates extracted from actual prediction object
  const pHist = weightedFactors?.personalHistoricalRate ?? null;
  const pDay = weightedFactors?.dayOfWeekPatternRate ?? null;
  const pMeal = weightedFactors?.mealTypePatternRate ?? null;
  const pTrend = weightedFactors?.recentAttendanceTrendRate ?? null;
  const pPref = weightedFactors?.preferenceIntentionRate ?? null;

  const menuAdj = boundedAdjustments?.menuAdjustmentPercent ?? null;
  const trendAdj = boundedAdjustments?.macroTrendAdjustmentPercent ?? null;

  const factors = [
    {
      id: "personal",
      name: "Personal History",
      weight: "40% weight",
      weightNum: 40,
      ratePercent: pHist !== null ? Math.round(pHist * 100) : 71,
      color: "bg-coral-500",
      iconBg: "bg-coral-50 text-coral-600",
      icon: UserCheck,
      plainExplanation:
        "How often this resident population actually attends similar meals based on verified past scans.",
      contribution: "Primary individual baseline derived from 90 days of scanned attendance logs.",
      technicalDetail:
        "Weight: 40% (0.40). Aggregates individual Bernoulli trials P(R_i) from 90 days of scanned hostel attendance. Sparse profiles automatically fall back to cohort-level baselines.",
    },
    {
      id: "day",
      name: "Day of Week",
      weight: "20% weight",
      weightNum: 20,
      ratePercent: pDay !== null ? Math.round(pDay * 100) : 71,
      color: "bg-mango-500",
      iconBg: "bg-mango-50 text-mango-600",
      icon: Calendar,
      plainExplanation:
        "Saturday dinners consistently draw strong dining attendance as residents stay on campus for weekend dinner specials.",
      contribution: "Evaluates conditional day-of-week attendance patterns across Saturday dinners.",
      technicalDetail:
        "Weight: 20% (0.20). Evaluates Saturday evening conditional attendance rate across identical historical day-of-week services.",
    },
    {
      id: "meal",
      name: "Meal Type",
      weight: "15% weight",
      weightNum: 15,
      ratePercent: pMeal !== null ? Math.round(pMeal * 100) : 71,
      color: "bg-charcoal-700",
      iconBg: "bg-cream-100 text-charcoal-700",
      icon: Utensils,
      plainExplanation:
        "Dinner is the mess hall's highest-attended service, with students and corporate residents returning in the evening.",
      contribution: "Calibrates for dinner service baseline versus breakfast and lunch averages.",
      technicalDetail:
        "Weight: 15% (0.15). Meal-type base frequency calibrates against Breakfast (lower) and Lunch services.",
    },
    {
      id: "trend",
      name: "Recent Attendance",
      weight: "15% weight",
      weightNum: 15,
      ratePercent: pTrend !== null ? Math.round(pTrend * 100) : 72,
      color: "bg-mint-500",
      iconBg: "bg-mint-50 text-mint-600",
      icon: TrendingUp,
      plainExplanation:
        "Dining attendance over the past two weeks is trending slightly higher than the long-term hostel average.",
      contribution: "Rolling 14-day exponential attendance rate capturing immediate campus rhythm.",
      technicalDetail:
        "Weight: 15% (0.15). Rolling 14-day exponential attendance rate captures immediate campus rhythm and residency shifts.",
    },
    {
      id: "preference",
      name: "Preference Intention",
      weight: "10% weight",
      weightNum: 10,
      ratePercent: pPref !== null ? Math.round(pPref * 100) : 75,
      color: "bg-coral-600",
      iconBg: "bg-coral-50 text-coral-600",
      icon: HeartHandshake,
      plainExplanation:
        "Resident meal opt-ins logged through the hostel application indicate a positive intention to attend tonight.",
      contribution: "Pre-meal resident opt-ins discounted by historical intention reliability.",
      technicalDetail:
        "Weight: 10% (0.10). Pre-meal opt-in votes discounted by each cohort's historical intention-to-attendance reliability factor.",
    },
  ];

  const toggleFactor = (id: string) => {
    setExpandedFactor((prev) => (prev === id ? null : id));
  };

  return (
    <section className={cn("p-6 md:p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card min-w-0", className)}>
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-5 border-b border-surface-border/70">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-coral-600 block">
            Why {expectedDiners} Diners?
          </span>
          <h3 className="text-xl md:text-2xl font-black text-charcoal-900 tracking-tight mt-1 break-words">
            How the model predicts {expectedDiners} expected diners
          </h3>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1 leading-relaxed max-w-xl break-words">
            Five weighted behavioral signals evaluated dynamically from verified hostel scanner history.
          </p>
        </div>

        <div className="text-xs text-charcoal-600 font-medium shrink-0 bg-cream-100/90 px-3 py-1.5 rounded-2xl border border-surface-border/70 self-start">
          Historical baseline: <span className="font-bold text-charcoal-900">{historicalBaselineDiners} diners</span>
        </div>
      </div>

      {/* Executive Explanation Narrative (Amazon Bedrock / Deterministic Fallback) */}
      {explanation && (
        <div className="mt-4 p-4 rounded-2xl bg-cream-50/90 border border-surface-border/70 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase",
                explanationSource === "bedrock"
                  ? "bg-coral-100 text-coral-800 border border-coral-200"
                  : "bg-charcoal-100 text-charcoal-700 border border-surface-border"
              )}
            >
              <Sparkles className="w-3 h-3 text-coral-600" />
              {explanationSource === "bedrock" ? "Amazon Bedrock Explanation" : "Demand Summary"}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-charcoal-800 leading-relaxed break-words">
            {explanation}
          </p>
        </div>
      )}

      {/* Spacious Editorial Signal List */}
      <div className="divide-y divide-surface-border/60 mt-2 min-w-0">
        {factors.map((f) => {
          const isExpanded = expandedFactor === f.id;
          const Icon = f.icon;

          return (
            <div key={f.id} className="transition-colors duration-150 min-w-0">
              <button
                type="button"
                onClick={() => toggleFactor(f.id)}
                className={cn(
                  "w-full py-4 px-2 sm:px-3 flex items-center justify-between text-left transition-all duration-150 cursor-pointer rounded-2xl focus:outline-none min-w-0",
                  isExpanded ? "bg-cream-50/80" : "hover:bg-cream-50/50"
                )}
                aria-expanded={isExpanded}
              >
                {/* Left: Icon, Readable Signal Name, Small Weight Indicator */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pr-2">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs", f.iconBg)}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm sm:text-base font-bold text-charcoal-900 break-words">
                        {f.name}
                      </span>
                      <span className="text-xs text-charcoal-500 font-medium whitespace-nowrap">
                        {f.weight}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Subtle Visual Bar, Large Rate, Expand Chevron */}
                <div className="flex items-center gap-2 sm:gap-3.5 shrink-0 pl-1 sm:pl-2">
                  {/* Subtle Visual Bar - shown on viewports with sufficient width */}
                  <div className="hidden xl:block w-16 2xl:w-20 h-1.5 rounded-full bg-cream-200/80 overflow-hidden shrink-0">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", f.color)}
                      style={{ width: `${f.ratePercent}%` }}
                    />
                  </div>

                  {/* Large Rate */}
                  <span className="text-xl sm:text-2xl font-black text-charcoal-950 tabular-nums min-w-[3rem] text-right">
                    {f.ratePercent}%
                  </span>

                  {/* Expand Chevron */}
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-charcoal-400 transition-transform duration-200 shrink-0",
                      isExpanded && "rotate-180 text-coral-600"
                    )}
                  />
                </div>
              </button>

              {/* Expanded Plain-English Explanation (With Safe Content Boundaries) */}
              {isExpanded && (
                <div className="my-1.5 p-3.5 sm:p-4 rounded-2xl bg-cream-50/90 border border-surface-border/60 text-xs sm:text-sm text-charcoal-700 leading-relaxed animate-fade-in min-w-0">
                  <p className="break-words font-medium">{f.plainExplanation}</p>
                  <div className="text-xs text-charcoal-500 mt-2 pt-2 border-t border-surface-border/50 font-medium break-words flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-coral-500 shrink-0" />
                    <span>{f.contribution}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quiet Technical Disclosure Control */}
      <button
        type="button"
        onClick={() => setShowTechnicalMath(!showTechnicalMath)}
        className="mt-6 pt-4 border-t border-surface-border/60 flex flex-wrap items-center justify-between gap-2 w-full text-xs font-semibold text-charcoal-600 hover:text-coral-600 group transition-colors cursor-pointer focus:outline-none min-w-0"
      >
        <span className="font-bold text-charcoal-800 group-hover:text-coral-600 transition-colors break-words">
          How was this forecast calculated? →
        </span>
        <span className="text-xs text-coral-600 font-bold shrink-0">
          {showTechnicalMath ? "Hide formula & weights" : "Inspect formula & weights"}
        </span>
      </button>

      {/* Technical Details Panel (With Safe Monospace Overflow Containment) */}
      {showTechnicalMath && (
        <div className="mt-4 pt-4 border-t border-surface-border/40 space-y-3.5 text-xs text-charcoal-700 animate-fade-in min-w-0">
          <div className="p-4 bg-cream-50/80 rounded-2xl border border-surface-border/70 space-y-2 min-w-0">
            <div className="font-bold text-charcoal-900 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5 text-coral-600 shrink-0" />
              <span>Deterministic Scoring Formulation</span>
            </div>
            <div className="font-mono text-[11px] text-charcoal-900 bg-white p-3 rounded-xl border border-surface-border/60 leading-relaxed shadow-2xs overflow-x-auto whitespace-pre-wrap break-all sm:break-normal">
              P(R_i) = 0.40·Personal + 0.20·DayOfWeek + 0.15·MealType + 0.15·RecentTrend + 0.10·Preference
            </div>
            <p className="text-charcoal-600 leading-relaxed break-words">
              Expected Diners = ∑ P(R_i) × (1 + MenuAdj + MacroTrendAdj), where bounded multipliers are clamped strictly to ±10%.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <div className="p-3.5 bg-cream-50/60 rounded-xl border border-surface-border/60 min-w-0">
              <span className="text-charcoal-500 font-medium block text-[11px]">Contextual Multipliers (±10% max)</span>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold text-charcoal-900">
                <span>Menu Appeal: <strong className="text-coral-600">{menuAdj !== null ? `+${menuAdj}%` : "+1%"}</strong></span>
                <span>Macro Drift: <strong className="text-mint-600">{trendAdj !== null ? `+${trendAdj}%` : "+1%"}</strong></span>
              </div>
            </div>

            <div className="p-3.5 bg-cream-50/60 rounded-xl border border-surface-border/60 min-w-0">
              <span className="text-charcoal-500 font-medium block text-[11px]">Population & Variance</span>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold text-charcoal-900">
                <span>Baseline: <strong>{historicalBaselineDiners} diners</strong></span>
                <span>Variance CV: <strong className="text-mint-700">{confidenceCV}%</strong></span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-charcoal-500 leading-relaxed italic break-words">
            Cohort Fallback Logic: Residents with fewer than 5 historical scans automatically inherit cohort baseline attendance probabilities (125 residents: 50 Students, 75 Corporate).
          </p>
        </div>
      )}
    </section>
  );
}
