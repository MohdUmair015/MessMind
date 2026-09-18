import Link from "next/link";
import { notFound } from "next/navigation";
import { mealService } from "@/modules/meals/meal-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { OutcomeRecordingForm } from "@/components/meals/OutcomeRecordingForm";
import { RegeneratePredictionButton } from "@/components/predictions/RegeneratePredictionButton";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Utensils,
  ShieldCheck,
  Sparkles,
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

  const { meal, eligibleCount, prediction, predictionError } = data;
  const rawFactors = prediction?.predictionFactors as any;
  const menuItems = Array.isArray(meal.menu.items)
    ? (meal.menu.items as string[])
    : [];

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div>
        <Link
          href="/meals"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Meals List</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {meal.menu.name}
              </h1>
              <Badge variant={meal.isServed ? "default" : "teal"}>
                {meal.isServed ? "Outcome Recorded" : "Upcoming Guidance"}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {formatDate(meal.mealDate)} · {meal.mealType} Service · Category: {meal.menu.category}
            </p>
          </div>

          <RegeneratePredictionButton mealId={meal.id} />
        </div>
      </div>

      {/* Two Columns: Before Meal Guidance vs After Meal Outcome Recording */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage 1: Before Meal Prediction Guidance */}
        <div className="space-y-6">
          <Card className="border-teal-100/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>Pre-Meal Preparation Guidance</span>
                </CardTitle>
                <Badge variant="teal">Deterministic Engine</Badge>
              </div>
              <CardDescription>
                Food-demand forecast calculated before meal preparation starts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prediction ? (
                <div className="space-y-4">
                  {/* Metric highlights */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium">Expected Diners</div>
                      <div className="text-2xl font-bold text-teal-700 mt-0.5">
                        {prediction.predictedDiners}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Baseline: {rawFactors?.historicalBaselineDiners ?? 86} diners
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium">Recommended Prep</div>
                      <div className="text-2xl font-bold text-slate-900 mt-0.5">
                        {prediction.recommendedServings}
                      </div>
                      <div className="text-[11px] text-slate-400">+5% safety buffer</div>
                    </div>
                  </div>

                  {/* Confidence & Waste Risk Row */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Prediction Confidence:</span>
                      <Badge variant="teal" size="sm">
                        {prediction.confidenceLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Food Waste Risk:</span>
                      <Badge
                        variant={
                          prediction.wasteRisk === "HIGH"
                            ? "rose"
                            : prediction.wasteRisk === "MEDIUM"
                            ? "amber"
                            : "emerald"
                        }
                        size="sm"
                      >
                        {prediction.wasteRisk}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/80">
                      {rawFactors?.wasteEvidence?.riskReasoning ??
                        "Comparable meals maintained low leftover and waste ratios."}
                    </div>
                  </div>

                  {/* Five Weighted Factors Summary */}
                  {rawFactors?.weightedFactors && (
                    <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-teal-950 space-y-2">
                      <div className="font-semibold text-teal-900 flex items-center justify-between">
                        <span>Weighted Behavioral Factors</span>
                        <span className="text-[10px] bg-teal-200/60 px-1.5 py-0.5 rounded font-bold">
                          40/20/15/15/10
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-teal-800">
                        <div>• Personal History: {(rawFactors.weightedFactors.personalHistoricalRate * 100).toFixed(0)}%</div>
                        <div>• Day-of-Week: {(rawFactors.weightedFactors.dayOfWeekPatternRate * 100).toFixed(0)}%</div>
                        <div>• Meal-Type: {(rawFactors.weightedFactors.mealTypePatternRate * 100).toFixed(0)}%</div>
                        <div>• Recent Trend: {(rawFactors.weightedFactors.recentAttendanceTrendRate * 100).toFixed(0)}%</div>
                        <div className="col-span-2">• Preference Intention: {(rawFactors.weightedFactors.preferenceIntentionRate * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  )}

                  {/* Natural Language Explanation Placeholder (Phase 3BSeam) */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div className="text-[11px]">
                      <span className="font-semibold text-slate-800">Manager Insight: </span>
                      {prediction.explanation ??
                        `Expected demand for ${formatDate(meal.mealDate)} ${meal.mealType} is ${prediction.predictedDiners} diners. Recommended kitchen preparation is ${prediction.recommendedServings} servings with ${prediction.wasteRisk} waste risk.`}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No prediction calculated for this meal yet. Click Recalculate above.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Menu Items Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Utensils className="w-4 h-4 text-teal-600" />
                <span>Menu Dish Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {menuItems.map((dish, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-full border border-slate-200"
                  >
                    {dish}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stage 2: After Meal Outcome Recording Form & Feedback Loop */}
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-900" />
                  <span>Post-Meal Outcome Recording</span>
                </CardTitle>
                <Badge variant={meal.outcome ? "default" : "outline"}>
                  {meal.outcome ? "Saved to PostgreSQL" : "Awaiting Manager Log"}
                </Badge>
              </div>
              <CardDescription>
                Record kitchen preparation and observed consumption to complete the learning feedback loop
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OutcomeRecordingForm
                mealId={meal.id}
                predictedDiners={prediction?.predictedDiners}
                initialOutcome={
                  meal.outcome
                    ? {
                        preparedServings: meal.outcome.preparedServings,
                        actualDiners: meal.outcome.actualDiners,
                        remainingServings: meal.outcome.remainingServings,
                        wastedServings: meal.outcome.wastedServings,
                        recordedAt: meal.outcome.recordedAt.toISOString(),
                      }
                    : null
                }
              />
            </CardContent>
          </Card>

          {/* Outcome Comparison Summary if Already Recorded */}
          {meal.outcome && (
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <span>Observed Prediction vs Actual Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                    <span>Predicted vs Actual Diners:</span>
                    <span className="font-bold text-slate-900">
                      {prediction?.predictedDiners ?? "—"} predicted vs {meal.outcome.actualDiners} actual
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                    <span>Prediction Error:</span>
                    <span className="font-bold text-emerald-700">
                      {predictionError !== null ? `${predictionError}%` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                    <span>Unconsumed Remaining Portions:</span>
                    <span className="font-semibold text-slate-800">{meal.outcome.remainingServings} servings</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                    <span>Food Waste Discarded:</span>
                    <span className="font-semibold text-rose-700">{meal.outcome.wastedServings} servings</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
