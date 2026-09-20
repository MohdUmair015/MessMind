import Link from "next/link";
import { notFound } from "next/navigation";
import { mealService } from "@/modules/meals/meal-service";
import { Badge } from "@/components/ui/Badge";
import { formatDate, cn } from "@/lib/utils";
import { OutcomeRecordingForm } from "@/components/meals/OutcomeRecordingForm";
import { RegeneratePredictionButton } from "@/components/predictions/RegeneratePredictionButton";
import { SyncScannerButton } from "@/components/meals/SyncScannerButton";
import { LifecycleStepper, LifecycleStage } from "@/components/ui/LifecycleStepper";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Utensils,
  ShieldCheck,
  Sparkles,
  QrCode,
  Info,
  Scale,
  ChefHat,
} from "lucide-react";

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await mealService.getMealDetailById(id);

  if (!data) {
    notFound();
  }

  const {
    meal,
    eligibleCount,
    prediction,
    predictionError,
    uniqueScansCount,
    duplicateScansSuppressedCount,
    authoritativeActualDiners,
    actualPreparedServings,
    estimatedSurplus,
    attendanceStatus,
  } = data;

  const rawFactors = prediction?.predictionFactors as any;
  const menuItems = Array.isArray(meal.menu.items)
    ? (meal.menu.items as string[])
    : [];

  const hasAuthoritativeScans = authoritativeActualDiners !== null && authoritativeActualDiners > 0;

  // Determine current lifecycle stage
  let currentStage: LifecycleStage = "PREDICT";
  if (meal.outcome?.wastedServings !== undefined) {
    currentStage = "LEARN";
  } else if (hasAuthoritativeScans) {
    currentStage = "OBSERVE";
  } else {
    currentStage = "PREPARE";
  }

  const expectedDiners = prediction?.predictedDiners ?? 90;
  const recommendedServings = prediction?.recommendedServings ?? 95;

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Top Header & Breadcrumb */}
      <div>
        <Link
          href="/meals"
          className="inline-flex items-center gap-2 text-xs font-bold text-coral-600 hover:text-coral-700 transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Operations Timeline</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-5xl font-black text-charcoal-950 tracking-tight break-words">
                {meal.menu.name}
              </h1>
              <Badge variant={meal.isServed ? "charcoal" : "coral"} size="sm" dot className="shrink-0">
                {meal.isServed ? "Service Completed" : "Upcoming Service"}
              </Badge>
            </div>
            <p className="text-sm md:text-base text-charcoal-600 mt-1 break-words">
              {formatDate(meal.mealDate)} · {meal.mealType} Service · Category: {meal.menu.category} · {eligibleCount} Active Residents
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SyncScannerButton
              mealId={meal.id}
              hasScans={uniqueScansCount > 0}
              uniqueScansCount={uniqueScansCount}
            />
            <RegeneratePredictionButton mealId={meal.id} />
          </div>
        </div>
      </div>

      {/* 5-STAGE LIFECYCLE PROGRESSION */}
      <LifecycleStepper
        currentStage={currentStage}
        predictedDiners={expectedDiners}
        recommendedServings={recommendedServings}
        actualScans={authoritativeActualDiners}
        predictionError={predictionError}
      />

      {/* TWO MAIN JOURNEY COLUMNS: Pre-Meal Guidance vs Dining Scanner & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (6 cols): Stage 1 & 2 Pre-Meal Preparation Guidance */}
        <div className="lg:col-span-6 space-y-8">
          <section className="p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border/70">
              <div className="flex items-center gap-2.5">
                <ChefHat className="w-5 h-5 text-coral-500" />
                <h3 className="text-base font-black text-charcoal-900">
                  Pre-Meal Preparation Guidance
                </h3>
              </div>
              <Badge variant="coral" size="xs">
                Deterministic Guidance
              </Badge>
            </div>

            {/* Metric Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="p-5 bg-cream-50 rounded-2xl border border-surface-border min-w-0">
                <span className="text-xs font-black uppercase tracking-wider text-charcoal-500 block">
                  Expected Diners
                </span>
                <div className="text-4xl font-black text-charcoal-950 mt-1 tabular-nums">
                  {expectedDiners}
                </div>
                <span className="text-xs text-charcoal-600 mt-1 block">
                  Baseline: {rawFactors?.historicalBaselineDiners ?? 86} diners
                </span>
              </div>

              <div className="p-5 bg-coral-50/60 rounded-2xl border border-coral-200 min-w-0">
                <span className="text-xs font-black uppercase tracking-wider text-coral-600 block">
                  Recommended Prep
                </span>
                <div className="text-4xl font-black text-coral-600 mt-1 tabular-nums">
                  {recommendedServings}
                </div>
                <span className="text-xs text-coral-700 mt-1 block font-semibold">
                  Includes +5% safety buffer
                </span>
              </div>
            </div>

            {/* Confidence & Waste Risk Row */}
            <div className="p-5 bg-cream-50 rounded-2xl border border-surface-border space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-charcoal-600 font-medium">Prediction Confidence:</span>
                <Badge variant="mint" size="sm">
                  {prediction?.confidenceLevel ?? "HIGH"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-charcoal-600 font-medium">Food Waste Risk:</span>
                <Badge
                  variant={
                    prediction?.wasteRisk === "HIGH"
                      ? "coral"
                      : prediction?.wasteRisk === "MEDIUM"
                      ? "mango"
                      : "mint"
                  }
                  size="sm"
                >
                  {prediction?.wasteRisk ?? "LOW"}
                </Badge>
              </div>
              <p className="text-xs text-charcoal-600 pt-3 border-t border-surface-border/70 leading-relaxed">
                {rawFactors?.wasteEvidence?.riskReasoning ??
                  "Comparable services maintained low leftover and waste ratios without shortages."}
              </p>
            </div>

            {/* Planned Menu Dishes */}
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-charcoal-500 block mb-3">
                Planned Menu Dishes
              </span>
              <div className="flex flex-wrap gap-2">
                {menuItems.map((dish, i) => (
                  <span
                    key={i}
                    className="px-3.5 py-1.5 bg-cream-100 text-charcoal-800 text-xs font-bold rounded-xl border border-surface-border"
                  >
                    {dish}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (6 cols): Stage 3, 4 & 5 Dining Scanner & Waste Audit */}
        <div className="lg:col-span-6 space-y-8">
          {/* Post-Meal Dining Scanner Synchronization Card */}
          <section className="p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border/70">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-coral-500" />
                <h3 className="text-base font-black text-charcoal-900">
                  Hostel Dining Scanner Integration
                </h3>
              </div>
              <Badge variant={hasAuthoritativeScans ? "mint" : "outline"} size="xs">
                {hasAuthoritativeScans ? "Scanner Synchronized" : "Awaiting Scanner Feed"}
              </Badge>
            </div>

            {hasAuthoritativeScans ? (
              <div className="space-y-5">
                {/* 3-Column Comparison Box */}
                <div className="p-5 bg-cream-50 rounded-2xl border border-surface-border min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center min-w-0">
                    <div className="p-3.5 bg-white rounded-2xl border border-surface-border shadow-2xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                        Predicted
                      </span>
                      <div className="text-3xl font-black text-charcoal-900 mt-1 tabular-nums">
                        {expectedDiners}
                      </div>
                      <span className="text-[11px] text-charcoal-500">expected</span>
                    </div>

                    <div className="p-3.5 bg-white rounded-2xl border border-coral-200 shadow-2xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-coral-600 block">
                        Actual Scans
                      </span>
                      <div className="text-3xl font-black text-coral-600 mt-1 tabular-nums">
                        {authoritativeActualDiners}
                      </div>
                      <span className="text-[11px] text-charcoal-500">unique residents</span>
                    </div>

                    <div className="p-3.5 bg-white rounded-2xl border border-mint-200 shadow-2xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                        Model Error
                      </span>
                      <div className="text-3xl font-black text-mint-700 mt-1 tabular-nums">
                        {predictionError !== null ? `${predictionError}%` : "—"}
                      </div>
                      <span className="text-[11px] text-charcoal-500">absolute error</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-xs text-charcoal-600">
                    <span className="flex items-center gap-1.5 text-charcoal-900 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-mint-600" />
                      <span>Authoritative source: Hostel App Dining Scanner</span>
                    </span>
                    {duplicateScansSuppressedCount > 0 && (
                      <span className="text-xs text-charcoal-500">
                        ({duplicateScansSuppressedCount} duplicate suppressed)
                      </span>
                    )}
                  </div>
                </div>

                {/* Clear Semantics Breakdown Card */}
                <div className="p-5 bg-cream-50 rounded-2xl border border-surface-border space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-charcoal-900 text-sm">
                      <Scale className="w-4 h-4 text-coral-500" />
                      <span>Food Intelligence Outcome Semantics</span>
                    </div>
                    <Badge variant={actualPreparedServings !== null ? "mint" : "outline"} size="xs">
                      {actualPreparedServings !== null ? "Preparation Audited" : "Actual Prep Not Recorded"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3 text-xs pt-1 min-w-0">
                    <div className="p-3.5 bg-white rounded-xl border border-surface-border min-w-0">
                      <span className="text-charcoal-500 text-xs uppercase font-bold tracking-wider block">
                        Actual Preparation
                      </span>
                      <span className="font-black text-charcoal-900 text-base mt-1 block break-words">
                        {actualPreparedServings !== null ? `${actualPreparedServings} servings` : "Actual preparation: Not recorded"}
                      </span>
                      <span className="text-[11px] text-charcoal-500 block mt-1 break-words">
                        {actualPreparedServings !== null ? "Verified kitchen audit" : "Recommended prep ≠ actual prep"}
                      </span>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-surface-border min-w-0">
                      <span className="text-charcoal-500 text-xs uppercase font-bold tracking-wider block">
                        Scanner Attendance
                      </span>
                      <span className="font-black text-charcoal-900 text-base mt-1 block break-words">
                        {authoritativeActualDiners !== null ? `${authoritativeActualDiners} unique scans` : "Pending scans"}
                      </span>
                      <span className="text-[11px] text-charcoal-500 block mt-1 break-words">
                        Synced from Hostel App
                      </span>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-surface-border min-w-0">
                      <span className="text-charcoal-500 text-xs uppercase font-bold tracking-wider block">
                        Estimated Surplus
                      </span>
                      <span className={cn("text-base font-black mt-1 block break-words", estimatedSurplus !== null ? "text-coral-600" : "text-charcoal-400")}>
                        {estimatedSurplus !== null ? `${estimatedSurplus} servings` : "—"}
                      </span>
                      <span className="text-[11px] text-charcoal-500 block mt-1 break-words">
                        {actualPreparedServings !== null ? "max(0, Actual Prep - Attendance)" : "Requires actual prep record"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-charcoal-600 pt-2 leading-relaxed border-t border-surface-border/70 break-words">
                    Recommended preparation ({recommendedServings} servings) is purely a planning forecast. Surplus is calculated strictly from verified kitchen preparation minus scanner attendance. Discarded food waste requires an explicit kitchen scale audit.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center bg-cream-50 rounded-2xl border border-surface-border space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-surface-border text-coral-500 flex items-center justify-center mx-auto shadow-2xs">
                  <QrCode className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-charcoal-900">
                  Attendance data is still being collected by hostel app scanner.
                </h4>
                <p className="text-xs text-charcoal-600 max-w-sm mx-auto leading-relaxed">
                  Residents scan via the hostel dining app upon entering. Actual diner count will automatically populate when sync occurs.
                </p>
              </div>
            )}
          </section>

          {/* Kitchen Waste & Surplus Audit */}
          <section className="p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border/70 mb-5">
              <div>
                <h4 className="text-base font-black text-charcoal-900">
                  Kitchen Waste & Surplus Audit
                </h4>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Physical leftovers and discarded food audit (Attendance locked to scans)
                </p>
              </div>
              <Badge variant="outline" size="xs">
                Physical Audit Log
              </Badge>
            </div>

            <OutcomeRecordingForm
              mealId={meal.id}
              predictedDiners={prediction?.predictedDiners}
              recommendedServings={prediction?.recommendedServings}
              authoritativeScansCount={uniqueScansCount}
              initialOutcome={
                meal.outcome
                  ? {
                      preparedServings: meal.outcome.preparedServings,
                      actualDiners: meal.outcome.actualDiners,
                      remainingServings: meal.outcome.remainingServings,
                      wastedServings: meal.outcome.wastedServings,
                      attendanceSource: meal.outcome.attendanceSource,
                      estimatedSurplus: meal.outcome.estimatedSurplus,
                      recordedAt: meal.outcome.recordedAt.toISOString(),
                    }
                  : null
              }
            />
          </section>
        </div>
      </div>
    </div>
  );
}

