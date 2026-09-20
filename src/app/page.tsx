import Link from "next/link";
import { mealService } from "@/modules/meals/meal-service";
import { analyticsService } from "@/modules/analytics/analytics-service";
import { hostelDataProvider } from "@/modules/integration";
import { explanationService } from "@/modules/ai";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { LifecycleStepper, LifecycleStage } from "@/components/ui/LifecycleStepper";
import { InteractiveFactorBreakdown } from "@/components/predictions/InteractiveFactorBreakdown";
import { LiveScannerWidget } from "@/components/dashboard/LiveScannerWidget";
import {
  Utensils,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Target,
  Sparkles,
  Users,
  Clock,
  ChevronRight,
  Scale,
  ChefHat,
} from "lucide-react";

export default async function DashboardPage() {
  const upcomingData = await mealService.getUpcomingMealWithPrediction();
  const analytics = await analyticsService.getAnalyticsSummary();

  const targetMeal = upcomingData?.meal;
  const prediction = upcomingData?.prediction;
  const eligibleCount = upcomingData?.eligibleResidentsCount ?? 125;

  const rawFactors = prediction?.predictionFactors as any;
  const weighted = rawFactors?.weightedFactors;
  const bounded = rawFactors?.boundedAdjustments;

  const menuItems = Array.isArray(targetMeal?.menu?.items)
    ? (targetMeal.menu.items as string[])
    : [];

  let uniqueScansCount = 0;
  let duplicateScansCount = 0;
  let explanationResult = null;

  if (targetMeal) {
    uniqueScansCount = await hostelDataProvider.getUniqueDinerCount(targetMeal.id);
    const totalScans = targetMeal._count.scans;
    duplicateScansCount = Math.max(0, totalScans - uniqueScansCount);

    try {
      explanationResult = await explanationService.getExplanationForMeal(targetMeal.id);
    } catch {
      // ExplanationService already handles fallback internally
    }
  }

  // Determine current lifecycle stage
  let currentStage: LifecycleStage = "PREDICT";
  if (targetMeal?.isServed || targetMeal?.outcome) {
    currentStage = "LEARN";
  } else if (uniqueScansCount > 0) {
    currentStage = "OBSERVE";
  } else {
    currentStage = "PREPARE";
  }

  const expectedDiners = prediction?.predictedDiners ?? 90;
  const recommendedServings = prediction?.recommendedServings ?? 95;
  const baselineDiners = rawFactors?.historicalBaselineDiners ?? 86;

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Top Welcome & Service Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <span className="text-xs font-black uppercase tracking-wider text-coral-600">
            Hostel Mess Intelligence Command
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-charcoal-950 tracking-tight mt-1 break-words">
            Kitchen Decision Center
          </h1>
          <p className="text-base text-charcoal-600 mt-1 break-words">
            Predict kitchen demand before cooking · Reconcile attendance automatically via dining scanner.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto bg-white px-4 py-2 rounded-2xl border border-surface-border shadow-2xs shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-coral-500 animate-pulse shrink-0" />
          <span className="text-sm font-bold text-charcoal-800 whitespace-nowrap">
            Next Service Scheduled
          </span>
          <span className="text-xs text-charcoal-500 font-medium whitespace-nowrap">
            ({eligibleCount} Residents)
          </span>
        </div>
      </div>

      {/* SHOWCASE HERO: WHAT SHOULD THE KITCHEN PREPARE? */}
      {targetMeal ? (
        <section className="relative rounded-3xl bg-white border border-surface-border p-8 md:p-12 shadow-warm-hero overflow-hidden">
          {/* Subtle Warm Radiant Glow */}
          <div
            className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 rounded-full bg-gradient-to-br from-mango-200/40 via-coral-200/20 to-transparent blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-10 min-w-0">
            {/* Left: Meal Identity & Dishes */}
            <div className="space-y-5 max-w-xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-black tracking-wider uppercase text-coral-600 bg-coral-50 border border-coral-200/80 px-3.5 py-1.5 rounded-full">
                  GOOD EVENING 👋
                </span>
                <span className="text-sm font-bold text-charcoal-700">
                  {targetMeal.mealDate ? formatDate(targetMeal.mealDate) : "Saturday"} · {targetMeal.mealType}
                </span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-charcoal-950 leading-tight">
                  {targetMeal.menu.name}
                </h2>

                <div className="flex flex-wrap gap-2.5 mt-4">
                  {menuItems.map((dish, i) => (
                    <span
                      key={i}
                      className="px-3.5 py-1.5 bg-cream-100 hover:bg-cream-200/80 text-charcoal-800 text-sm font-semibold rounded-xl border border-surface-border transition-colors"
                    >
                      {dish}
                    </span>
                  ))}
                </div>
              </div>

              {/* Confidence & Risk Pills */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-mint-50 text-mint-800 border border-mint-200 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-mint-600" />
                  <span>{prediction?.confidenceLevel ?? "HIGH"} CONFIDENCE</span>
                  <span className="text-[11px] font-medium text-mint-600">
                    (CV: {(rawFactors?.confidenceMetrics?.calculatedCoefficientOfVariation ? rawFactors.confidenceMetrics.calculatedCoefficientOfVariation * 100 : 4.4).toFixed(1)}%)
                  </span>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-coral-50 text-coral-800 border border-coral-200 font-bold text-xs">
                  <Scale className="w-4 h-4 text-coral-600" />
                  <span>{prediction?.wasteRisk ?? "LOW"} WASTE RISK</span>
                </div>
              </div>
            </div>

            {/* Right: THE DOMINANT DECISION HERO (Expected Diners 90 -> Prepare 95) */}
            <div className="p-6 sm:p-7 md:p-8 rounded-3xl bg-cream-50/90 border border-coral-200/80 flex flex-col justify-between w-full lg:w-auto sm:min-w-[320px] lg:min-w-[340px] xl:min-w-[360px] max-w-md shadow-warm-card min-w-0">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <span className="text-xs font-black uppercase tracking-wider text-charcoal-500">
                  Primary Kitchen Decision
                </span>
                <span className="text-xs font-bold text-coral-600 bg-coral-100/70 px-2.5 py-0.5 rounded-md">
                  Deterministic Model
                </span>
              </div>

              {/* Giant Expected Diners Number */}
              <div className="my-5 text-center sm:text-left">
                <div className="text-xs font-black uppercase tracking-wider text-charcoal-600 mb-1">
                  EXPECTED DINERS
                </div>
                <div className="text-7xl sm:text-8xl md:text-9xl font-black text-charcoal-950 tracking-tight leading-none tabular-nums">
                  <AnimatedNumber value={expectedDiners} duration={850} />
                </div>
              </div>

              {/* Actionable Kitchen Preparation Decision */}
              <div className="p-4 bg-coral-500 text-white rounded-2xl shadow-coral-glow space-y-1.5">
                <div className="text-xs font-semibold text-coral-100 uppercase tracking-wider">
                  Prepare Approximately
                </div>
                <div className="text-3xl font-black tracking-tight text-white flex items-baseline gap-1.5">
                  <AnimatedNumber value={recommendedServings} duration={850} />
                  <span className="text-base font-bold text-coral-100">servings</span>
                </div>
                <div className="text-xs text-coral-100/90 pt-1 border-t border-white/20">
                  {expectedDiners} expected diners + 5% safety buffer
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-surface-border flex flex-wrap items-center justify-between gap-2">
                <Link
                  href="/predictions"
                  className="text-xs font-bold text-coral-600 hover:text-coral-700 inline-flex items-center gap-1.5 group shrink-0"
                >
                  <span>Inspect forecast factors</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <span className="text-xs text-charcoal-500 font-medium">
                  Baseline: {baselineDiners} diners
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* OPERATIONAL LIFECYCLE PROGRESSION */}
      <LifecycleStepper
        currentStage={currentStage}
        predictedDiners={expectedDiners}
        recommendedServings={recommendedServings}
        actualScans={uniqueScansCount > 0 ? uniqueScansCount : null}
        predictionError={
          uniqueScansCount > 0
            ? Math.round((Math.abs(uniqueScansCount - expectedDiners) / expectedDiners) * 1000) / 10
            : null
        }
      />

      {/* TWO-COLUMN INTEL GRID: "Why 90?" vs Live Dining Scanner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-w-0">
        {/* Left Column (7 cols): Interactive Visual Explanation */}
        <div className="lg:col-span-7 min-w-0">
          <InteractiveFactorBreakdown
            weightedFactors={weighted}
            boundedAdjustments={bounded}
            historicalBaselineDiners={baselineDiners}
            expectedDiners={expectedDiners}
            confidenceCV={
              rawFactors?.confidenceMetrics?.calculatedCoefficientOfVariation
                ? Number((rawFactors.confidenceMetrics.calculatedCoefficientOfVariation * 100).toFixed(1))
                : 4.4
            }
            explanation={explanationResult?.explanation}
            explanationSource={explanationResult?.source}
          />
        </div>

        {/* Right Column (5 cols): Live Dining Room Scanner */}
        <div className="lg:col-span-5 min-w-0">
          {targetMeal && (
            <LiveScannerWidget
              mealId={targetMeal.id}
              isServed={targetMeal.isServed}
              predictedDiners={expectedDiners}
              recommendedServings={recommendedServings}
              initialScansCount={uniqueScansCount}
              duplicateScansCount={duplicateScansCount}
            />
          )}
        </div>
      </div>

      {/* CLOSED LEARNING LOOP: Empirical Performance Highlights */}
      <section className="p-6 md:p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-surface-border/70 min-w-0">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-coral-600 block">
              Closed Learning Feedback Loop
            </span>
            <h3 className="text-lg md:text-xl font-black text-charcoal-900 tracking-tight break-words">
              Long-Term Prediction Accuracy & Efficiency
            </h3>
            <p className="text-xs md:text-sm text-charcoal-600 mt-0.5 break-words">
              Verified historical accuracy evaluated strictly from recorded scanner outcomes in PostgreSQL.
            </p>
          </div>
          <Link
            href="/analytics"
            className="text-xs font-bold text-coral-600 hover:text-coral-700 inline-flex items-center gap-1 self-start sm:self-auto group shrink-0"
          >
            <span>Explore full analytics</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 min-w-0">
          <div className="p-4 md:p-5 bg-cream-50/80 rounded-2xl border border-surface-border min-w-0">
            <span className="text-xs font-bold text-charcoal-600 block">
              Model MAPE
            </span>
            <div className="text-3xl font-black text-charcoal-900 mt-2 tabular-nums">
              {analytics.overallMapePercent}%
            </div>
            <span className="text-xs text-mint-700 font-bold mt-1 block">
              Mean Absolute % Error
            </span>
          </div>

          <div className="p-4 md:p-5 bg-cream-50/80 rounded-2xl border border-surface-border min-w-0">
            <span className="text-xs font-bold text-charcoal-600 block">
              Within ±5% Tolerance
            </span>
            <div className="text-3xl font-black text-charcoal-900 mt-2 tabular-nums">
              {analytics.accuracyWithinFivePercentRate}%
            </div>
            <span className="text-xs text-coral-600 font-bold mt-1 block">
              Target accuracy rate
            </span>
          </div>

          <div className="p-4 md:p-5 bg-cream-50/80 rounded-2xl border border-surface-border min-w-0">
            <span className="text-xs font-bold text-charcoal-600 block">
              Average Food Waste
            </span>
            <div className="text-3xl font-black text-mint-700 mt-2 tabular-nums">
              {analytics.averageFoodWastePercent}%
            </div>
            <span className="text-xs text-charcoal-600 font-medium mt-1 block">
              Physical discarded audit
            </span>
          </div>

          <div className="p-4 md:p-5 bg-cream-50/80 rounded-2xl border border-surface-border min-w-0">
            <span className="text-xs font-bold text-charcoal-600 block">
              Evaluated Meals
            </span>
            <div className="text-3xl font-black text-charcoal-900 mt-2 tabular-nums">
              {analytics.totalOutcomesRecorded}
            </div>
            <span className="text-xs text-charcoal-600 font-medium mt-1 block">
              Historical learning records
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

