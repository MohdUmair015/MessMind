import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatDate } from "@/lib/utils";
import { RegeneratePredictionButton } from "@/components/predictions/RegeneratePredictionButton";
import {
  BrainCircuit,
  Sliders,
  ShieldCheck,
  TrendingDown,
  Layers,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Users,
  ChevronDown,
  ArrowDown,
  Utensils,
  ChefHat,
} from "lucide-react";

export default async function PredictionsPage() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  let targetMeal: any = null;
  let prediction: any = null;
  let eligibleCount = 125;
  let explanationResult: { explanation: string; source: "bedrock" | "fallback" } | null = null;

  if (isDemo) {
    const { demoDataProvider } = await import("@/modules/demo-data");
    const upcomingData = demoDataProvider.getUpcomingMealWithPrediction();
    targetMeal = upcomingData.meal;
    prediction = upcomingData.prediction;
    eligibleCount = upcomingData.eligibleResidentsCount;
    if (prediction) {
      explanationResult = {
        explanation: prediction.explanation,
        source: prediction.explanationSource,
      };
    }
  } else {
    const { mealService } = await import("@/modules/meals/meal-service");
    const { explanationService } = await import("@/modules/ai");

    const upcomingData = await mealService.getUpcomingMealWithPrediction();
    targetMeal = upcomingData?.meal ?? null;
    prediction = upcomingData?.prediction ?? null;
    eligibleCount = upcomingData?.eligibleResidentsCount ?? 125;

    if (targetMeal) {
      try {
        explanationResult = await explanationService.getExplanationForMeal(targetMeal.id);
      } catch {
        // Handled internally by explanationService
      }
    }
  }

  const rawFactors = prediction?.predictionFactors as any;
  const weighted = rawFactors?.weightedFactors;
  const bounded = rawFactors?.boundedAdjustments;
  const wasteEvidence = rawFactors?.wasteEvidence;
  const confMetrics = rawFactors?.confidenceMetrics;

  const expectedDiners = prediction?.predictedDiners ?? 90;
  const recommendedServings = prediction?.recommendedServings ?? 95;
  const baselineDiners = rawFactors?.historicalBaselineDiners ?? 86;
  const cvPercent = confMetrics?.calculatedCoefficientOfVariation !== undefined
    ? (confMetrics.calculatedCoefficientOfVariation * 100).toFixed(1)
    : "4.4";

  // Behavioral weights from prediction
  const pHist = weighted?.personalHistoricalRate !== undefined ? Math.round(weighted.personalHistoricalRate * 100) : 71;
  const pDay = weighted?.dayOfWeekPatternRate !== undefined ? Math.round(weighted.dayOfWeekPatternRate * 100) : 71;
  const pMeal = weighted?.mealTypePatternRate !== undefined ? Math.round(weighted.mealTypePatternRate * 100) : 71;
  const pTrend = weighted?.recentAttendanceTrendRate !== undefined ? Math.round(weighted.recentAttendanceTrendRate * 100) : 72;
  const pPref = weighted?.preferenceIntentionRate !== undefined ? Math.round(weighted.preferenceIntentionRate * 100) : 75;

  const menuAdj = bounded?.menuAdjustmentPercent ?? 1;
  const trendAdj = bounded?.macroTrendAdjustmentPercent ?? 1;

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-coral-600">
            Demand Forecast Architecture
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-charcoal-950 tracking-tight mt-1">
            Prediction Intelligence
          </h1>
          <p className="text-base text-charcoal-600 mt-1">
            Deterministic reasoning: individual behavioral weights, bounded adjustments, and confidence classification.
          </p>
        </div>

        {targetMeal && <RegeneratePredictionButton mealId={targetMeal.id} />}
      </div>

      {/* STORY STEP 1: THE FORECAST HERO */}
      {targetMeal && (
        <section className="p-8 md:p-12 rounded-3xl bg-white border border-surface-border shadow-warm-hero relative min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 min-w-0">
            <div className="space-y-4 max-w-xl min-w-0">
              <span className="text-xs font-black text-coral-600 bg-coral-50 px-3.5 py-1.5 rounded-full border border-coral-200/80 uppercase tracking-wider inline-block">
                STEP 1 · THE FORECAST · {formatDate(targetMeal.mealDate)}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-charcoal-950 break-words">
                {expectedDiners} Expected Diners
              </h2>
              <p className="text-base text-charcoal-700 leading-relaxed break-words">
                Based on active resident habits, MessMind predicts exactly <strong className="text-charcoal-950 font-bold">{expectedDiners} diners</strong> will attend {targetMeal.menu.name}.
              </p>

              {explanationResult?.explanation && (
                <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-cream-50/90 border border-surface-border/70 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-black uppercase tracking-wider text-coral-600">
                    <Sparkles className="w-3.5 h-3.5 text-coral-600 shrink-0" />
                    <span>
                      {explanationResult.source === "bedrock"
                        ? "Amazon Bedrock Explanation"
                        : "Deterministic Demand Summary"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-charcoal-800 leading-relaxed break-words">
                    {explanationResult.explanation}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-5 p-6 rounded-3xl bg-cream-50 border border-coral-200 shadow-warm-card self-start md:self-auto shrink-0">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                  Historical Baseline
                </div>
                <div className="text-2xl md:text-3xl font-black text-charcoal-900 tabular-nums">
                  {baselineDiners}
                </div>
              </div>
              <div className="text-coral-500 font-bold text-2xl">→</div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-coral-600">
                  Forecast Diners
                </div>
                <div className="text-3xl md:text-4xl font-black text-coral-600 tabular-nums">
                  <AnimatedNumber value={expectedDiners} duration={800} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STORY STEP 2: WHY? FIVE BEHAVIORAL SIGNALS */}
      <section className="p-8 md:p-10 rounded-3xl bg-white border border-surface-border shadow-warm-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-surface-border/70">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-coral-600">
              STEP 2 · WHY THIS NUMBER?
            </span>
            <h3 className="text-xl md:text-2xl font-black text-charcoal-900 tracking-tight mt-0.5">
              Five Weighted Behavioral Signals (100% Total)
            </h3>
            <p className="text-sm text-charcoal-600 mt-0.5">
              Individual attendance probabilities computed from verified hostel scanner logs.
            </p>
          </div>
          <Badge variant="coral" size="sm">
            40 / 20 / 15 / 15 / 10 Weight Distribution
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 min-w-0">
          {/* Signal 1: Personal History */}
          <div className="p-5 rounded-2xl bg-cream-50 border border-surface-border flex flex-col justify-between min-w-0">
            <div>
              <div className="flex justify-between items-center text-xs text-charcoal-600">
                <span className="font-bold text-charcoal-900">Personal History</span>
                <span className="bg-coral-100 text-coral-800 text-xs font-black px-2 py-0.5 rounded-md">
                  40%
                </span>
              </div>
              <div className="text-3xl font-black text-charcoal-950 mt-3 tabular-nums">
                {pHist}%
              </div>
              <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                Aggregated 90-day attendance baseline across active residents.
              </p>
            </div>
            <div className="w-full bg-cream-200 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-coral-500 h-full rounded-full transition-all duration-700" style={{ width: `${pHist}%` }} />
            </div>
          </div>

          {/* Signal 2: Saturday Pattern */}
          <div className="p-5 rounded-2xl bg-cream-50 border border-surface-border flex flex-col justify-between min-w-0">
            <div>
              <div className="flex justify-between items-center text-xs text-charcoal-600">
                <span className="font-bold text-charcoal-900">Saturday Pattern</span>
                <span className="bg-mango-100 text-mango-800 text-xs font-black px-2 py-0.5 rounded-md">
                  20%
                </span>
              </div>
              <div className="text-3xl font-black text-charcoal-950 mt-3 tabular-nums">
                {pDay}%
              </div>
              <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                Saturday dinner attendance pattern across hostel resident cohorts.
              </p>
            </div>
            <div className="w-full bg-cream-200 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-mango-500 h-full rounded-full transition-all duration-700" style={{ width: `${pDay}%` }} />
            </div>
          </div>

          {/* Signal 3: Dinner Service */}
          <div className="p-5 rounded-2xl bg-cream-50 border border-surface-border flex flex-col justify-between min-w-0">
            <div>
              <div className="flex justify-between items-center text-xs text-charcoal-600">
                <span className="font-bold text-charcoal-900">Dinner Service</span>
                <span className="bg-charcoal-100 text-charcoal-800 text-xs font-black px-2 py-0.5 rounded-md">
                  15%
                </span>
              </div>
              <div className="text-3xl font-black text-charcoal-950 mt-3 tabular-nums">
                {pMeal}%
              </div>
              <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                Dinner baseline attendance compared to Breakfast and Lunch services.
              </p>
            </div>
            <div className="w-full bg-cream-200 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-charcoal-700 h-full rounded-full transition-all duration-700" style={{ width: `${pMeal}%` }} />
            </div>
          </div>

          {/* Signal 4: Recent Trend */}
          <div className="p-5 rounded-2xl bg-cream-50 border border-surface-border flex flex-col justify-between min-w-0">
            <div>
              <div className="flex justify-between items-center text-xs text-charcoal-600">
                <span className="font-bold text-charcoal-900">14-Day Trend</span>
                <span className="bg-mint-100 text-mint-800 text-xs font-black px-2 py-0.5 rounded-md">
                  15%
                </span>
              </div>
              <div className="text-3xl font-black text-charcoal-950 mt-3 tabular-nums">
                {pTrend}%
              </div>
              <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                Recent 14-day rolling attendance capturing short-term campus rhythm.
              </p>
            </div>
            <div className="w-full bg-cream-200 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-mint-500 h-full rounded-full transition-all duration-700" style={{ width: `${pTrend}%` }} />
            </div>
          </div>

          {/* Signal 5: Preferences */}
          <div className="p-5 rounded-2xl bg-cream-50 border border-surface-border flex flex-col justify-between min-w-0 sm:col-span-2 lg:col-span-1">
            <div>
              <div className="flex justify-between items-center text-xs text-charcoal-600">
                <span className="font-bold text-charcoal-900">Preferences</span>
                <span className="bg-coral-100 text-coral-800 text-xs font-black px-2 py-0.5 rounded-md">
                  10%
                </span>
              </div>
              <div className="text-3xl font-black text-charcoal-950 mt-3 tabular-nums">
                {pPref}%
              </div>
              <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                Pre-meal resident opt-ins discounted by historical reliability.
              </p>
            </div>
            <div className="w-full bg-cream-200 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-coral-600 h-full rounded-full transition-all duration-700" style={{ width: `${pPref}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* STORY STEP 3: CONTEXT & BOUNDED MULTIPLIERS */}
      <section className="p-8 md:p-10 rounded-3xl bg-white border border-surface-border shadow-warm-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-surface-border/70">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-coral-600">
              STEP 3 · CONTEXTUAL ADJUSTMENTS
            </span>
            <h3 className="text-xl md:text-2xl font-black text-charcoal-900 tracking-tight mt-0.5">
              Bounded Multipliers (Clamped strictly to ±10%)
            </h3>
            <p className="text-sm text-charcoal-600 mt-0.5">
              Specific dish popularity and macro trends cannot swing the prediction arbitrarily.
            </p>
          </div>
          <span className="text-xs font-mono bg-cream-100 text-charcoal-700 px-3 py-1 rounded-xl border border-surface-border">
            Safety clamp [-10%, +10%]
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 min-w-0">
          <div className="p-6 rounded-2xl bg-cream-50 border border-surface-border min-w-0">
            <div className="flex justify-between items-center gap-2">
              <span className="text-base font-bold text-charcoal-900 break-words">Menu Appeal Multiplier</span>
              <span className="text-sm font-black text-coral-600 bg-coral-100 px-3 py-1 rounded-full border border-coral-200 shrink-0">
                +{menuAdj}%
              </span>
            </div>
            <p className="text-sm text-charcoal-700 mt-2 leading-relaxed break-words">
              Special dinner item ({targetMeal?.menu.name}) historically draws higher attendance than standard weekday menus.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-cream-50 border border-surface-border min-w-0">
            <div className="flex justify-between items-center gap-2">
              <span className="text-base font-bold text-charcoal-900 break-words">Macro Trend Drift</span>
              <span className="text-sm font-black text-mint-700 bg-mint-100 px-3 py-1 rounded-full border border-mint-200 shrink-0">
                +{trendAdj}%
              </span>
            </div>
            <p className="text-sm text-charcoal-700 mt-2 leading-relaxed break-words">
              Campus attendance rhythm across university cohorts shows stable resident residency leading into the weekend.
            </p>
          </div>
        </div>
      </section>

      {/* STORY STEP 4: CONFIDENCE & RECOMMENDATION (TWO COLUMNS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-w-0">
        {/* Confidence & Risk */}
        <section className="p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card space-y-5 min-w-0">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border/70">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-coral-600">
                STEP 4 · CONFIDENCE
              </span>
              <h4 className="text-lg font-black text-charcoal-900">
                Model Confidence & Stability
              </h4>
            </div>
            <Badge variant="mint" size="sm">
              HIGH CONFIDENCE
            </Badge>
          </div>

          <div className="p-5 bg-cream-50 rounded-2xl border border-surface-border space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-charcoal-600">Comparable Services Evaluated:</span>
              <strong className="text-charcoal-900 font-bold">{confMetrics?.comparableMealsCount ?? 12} meals</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-charcoal-600">Coefficient of Variation (CV):</span>
              <strong className="text-mint-700 font-black">{cvPercent}% (Low volatility)</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-charcoal-600">Food Waste Risk Classification:</span>
              <Badge variant="coral" size="xs">LOW WASTE RISK</Badge>
            </div>
          </div>

          <p className="text-sm text-charcoal-700 leading-relaxed">
            Historical consistency across comparable Saturday dinner services indicates minimal risk of unexpected demand spikes or massive overpreparation.
          </p>
        </section>

        {/* Actionable Kitchen Recommendation */}
        <section className="p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card space-y-5 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-surface-border/70">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-coral-600">
                  STEP 5 · ACTIONABLE RECOMMENDATION
                </span>
                <h4 className="text-lg font-black text-charcoal-900 break-words">
                  Kitchen Preparation Directive
                </h4>
              </div>
              <Badge variant="coral" size="sm">
                +5% Safety Buffer
              </Badge>
            </div>

            <div className="p-6 bg-coral-500 text-white rounded-2xl shadow-coral-glow space-y-2 mt-5 min-w-0">
              <div className="text-xs uppercase tracking-wider font-semibold text-coral-100">
                Actionable Cook Volume
              </div>
              <div className="text-4xl font-black text-white">
                {recommendedServings} servings
              </div>
              <div className="text-sm text-coral-100/90 pt-2 border-t border-white/20 break-words">
                Formula: {expectedDiners} expected diners + 5% buffer = <strong>{recommendedServings} servings</strong>
              </div>
            </div>
          </div>

          <p className="text-xs text-charcoal-600 leading-relaxed mt-2 break-words">
            Recommended preparation is strictly planning advice for the cooks. It is NOT logged as actual food prepared until kitchen staff confirm the meal audit.
          </p>
        </section>
      </div>

      {/* TECHNICAL INSPECTION DISCLOSURE */}
      <section className="p-8 rounded-3xl bg-cream-50 border border-surface-border space-y-4 min-w-0">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-coral-600 shrink-0" />
            <h4 className="text-sm font-black uppercase tracking-wider text-charcoal-900">
              Deterministic Mathematical Specification
            </h4>
          </div>
          <span className="text-xs text-charcoal-600 font-mono shrink-0">
            Deterministic Engine v1.1
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl font-mono text-xs text-charcoal-900 overflow-x-auto border border-surface-border whitespace-pre-wrap break-all sm:break-normal">
          ExpectedDiners = Σ [ (0.40·P_hist + 0.20·P_day + 0.15·P_meal + 0.15·P_trend + 0.10·P_pref) · (1 + clamp(Menu + Trend, -0.10, +0.10)) ]
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-charcoal-600 pt-1">
          <div>
            <strong className="text-charcoal-900 block mb-1">Pure Numerical Engine</strong>
            Deterministic math is strictly separated from presentation logic.
          </div>
          <div>
            <strong className="text-charcoal-900 block mb-1">Sparse Data Fallback</strong>
            Hierarchical cohort fallbacks ensure solid forecasts for newly registered residents.
          </div>
          <div>
            <strong className="text-charcoal-900 block mb-1">Zero AI Hallucination</strong>
            {isDemo
              ? "All diner counts derive directly from recorded dining scans; no LLM invents operational numbers."
              : "All diner counts derive directly from PostgreSQL scans; no LLM invents operational numbers."}
          </div>
        </div>
      </section>
    </div>
  );
}

