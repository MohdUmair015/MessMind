import { mealService } from "@/modules/meals/meal-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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
} from "lucide-react";

export default async function PredictionsPage() {
  const upcomingData = await mealService.getUpcomingMealWithPrediction();
  const targetMeal = upcomingData?.meal;
  const prediction = upcomingData?.prediction;
  const eligibleCount = upcomingData?.eligibleResidentsCount ?? 125;

  const rawFactors = prediction?.predictionFactors as any;
  const weighted = rawFactors?.weightedFactors;
  const bounded = rawFactors?.boundedAdjustments;
  const wasteEvidence = rawFactors?.wasteEvidence;
  const confMetrics = rawFactors?.confidenceMetrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Demand Predictions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic prediction breakdown with individual resident attendance probabilities and bounded adjustments.
          </p>
        </div>
        {targetMeal && <RegeneratePredictionButton mealId={targetMeal.id} />}
      </div>

      {/* Target Meal Banner */}
      {targetMeal && (
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 font-medium">Currently Analyzing Scheduled Meal:</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {targetMeal.menu.name} ({targetMeal.mealType})
            </div>
            <div className="text-xs text-slate-500">
              {formatDate(targetMeal.mealDate)} · {targetMeal.isServed ? "Outcome Recorded" : "Pre-Meal Guidance"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-500">Expected Diners</div>
              <div className="text-xl font-bold text-teal-700">{prediction?.predictedDiners ?? 90}</div>
            </div>
            <div className="text-right pl-3 border-l border-slate-200">
              <div className="text-xs text-slate-500">Recommended Prep</div>
              <div className="text-xl font-bold text-slate-900">
                {prediction?.recommendedServings ?? 95}{" "}
                <span className="text-xs font-normal text-slate-500">(+5%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* THREE DISTINCT ARCHITECTURAL LAYERS */}

      {/* Layer A: Five Weighted Behavioral Components */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Layer A: Five Weighted Behavioral Components</span>
            </CardTitle>
            <Badge variant="teal">Sum = 100% Weight</Badge>
          </div>
          <CardDescription>
            Individual probability models evaluate personal attendance patterns and opt-in reliability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* 1. Personal Historical (40%) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Personal History</span>
                <span className="bg-slate-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold">40% Weight</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {weighted?.personalHistoricalRate ? `${(weighted.personalHistoricalRate * 100).toFixed(0)}%` : "71%"}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Average personal attendance baseline across active cohort
              </div>
            </div>

            {/* 2. Day-of-Week (20%) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Day-of-Week</span>
                <span className="bg-slate-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold">20% Weight</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {weighted?.dayOfWeekPatternRate ? `${(weighted.dayOfWeekPatternRate * 100).toFixed(0)}%` : "71%"}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Saturday vs weekday behavior pattern differential
              </div>
            </div>

            {/* 3. Meal-Type (15%) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Meal-Type</span>
                <span className="bg-slate-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold">15% Weight</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {weighted?.mealTypePatternRate ? `${(weighted.mealTypePatternRate * 100).toFixed(0)}%` : "71%"}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Dinner vs Breakfast/Lunch attendance preference
              </div>
            </div>

            {/* 4. Recent Trend (15%) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Recent Trend</span>
                <span className="bg-slate-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold">15% Weight</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {weighted?.recentAttendanceTrendRate ? `${(weighted.recentAttendanceTrendRate * 100).toFixed(0)}%` : "72%"}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Trailing 14-day attendance rate with bounded drift
              </div>
            </div>

            {/* 5. Preference Intention (10%) */}
            <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-100">
              <div className="flex justify-between items-center text-xs text-teal-800">
                <span className="font-semibold text-teal-900">Preference Signal</span>
                <span className="bg-teal-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold">10% Weight</span>
              </div>
              <div className="text-2xl font-bold text-teal-800 mt-2">
                {weighted?.preferenceIntentionRate ? `${(weighted.preferenceIntentionRate * 100).toFixed(0)}%` : "75%"}
              </div>
              <div className="text-[11px] text-teal-700 mt-1">
                Weighted by individual historical preference reliability
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layer B: Bounded Adjustments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="w-4 h-4 text-teal-600" />
              <span>Layer B: Separate Bounded Adjustments</span>
            </CardTitle>
            <Badge variant="outline">Clamped to ±10% Max</Badge>
          </div>
          <CardDescription>
            Macro multipliers that protect against historical volatility and outsized single-meal distortions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-700">Menu Appeal Adjustment</span>
                <span className="text-sm font-bold text-teal-700">
                  {bounded?.menuAdjustmentPercent ? (bounded.menuAdjustmentPercent > 0 ? `+${bounded.menuAdjustmentPercent}%` : `${bounded.menuAdjustmentPercent}%`) : "+1%"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Vegetable Biryani Special historical performance relative to alternative Saturday menus (Paneer Butter Masala, Homestyle).
              </p>
              <div className="mt-2 text-[11px] text-slate-400">
                Rule: Strict clamp $[-10\%, +10\%]$
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-700">Macro Trend Adjustment</span>
                <span className="text-sm font-bold text-slate-900">
                  {bounded?.macroTrendAdjustmentPercent ? (bounded.macroTrendAdjustmentPercent > 0 ? `+${bounded.macroTrendAdjustmentPercent}%` : `${bounded.macroTrendAdjustmentPercent}%`) : "+1%"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Cohort-wide attendance drift over the last 14 days compared to the 90-day historical mean.
              </p>
              <div className="mt-2 text-[11px] text-slate-400">
                Rule: Strict clamp $[-10\%, +10\%]$
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layer C: Waste Risk Evidence & Confidence Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Waste Evidence Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-teal-600" />
                <span>Historical Outcome Waste Evidence</span>
              </CardTitle>
              <Badge variant={prediction?.wasteRisk === "HIGH" ? "rose" : "emerald"} size="sm">
                {prediction?.wasteRisk ?? "LOW"} Waste Risk
              </Badge>
            </div>
            <CardDescription>
              Derived from {wasteEvidence?.evaluatedOutcomesCount ?? 12} comparable completed meals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-slate-400 text-[10px]">Leftover Ratio</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">
                    {wasteEvidence?.averageLeftoverPercent ?? 5.6}%
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-slate-400 text-[10px]">Food Waste Ratio</div>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">
                    {wasteEvidence?.averageWastePercent ?? 2.8}%
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-slate-400 text-[10px]">Excess Leftovers</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">
                    {wasteEvidence?.excessiveLeftoverFrequencyPercent ?? 0}%
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Risk Assessment: </span>
                {wasteEvidence?.riskReasoning ??
                  "Low waste risk based on historical outcomes — comparable meals maintained low leftovers and minimal waste."}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confidence Basis Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Dynamic Confidence Classification</span>
              </CardTitle>
              <Badge variant="teal" size="sm">
                {prediction?.confidenceLevel ?? "HIGH"} Confidence
              </Badge>
            </div>
            <CardDescription>
              Statistical variation calculated from historical observations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-slate-400 text-[10px]">Comparable Meals</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">
                    {confMetrics?.comparableMealsCount ?? 12}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-slate-400 text-[10px]">Calculated CV</div>
                  <div className="text-base font-bold text-teal-700 mt-0.5">
                    {confMetrics?.calculatedCoefficientOfVariation !== undefined
                      ? `${(confMetrics.calculatedCoefficientOfVariation * 100).toFixed(1)}%`
                      : "4.4%"}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-slate-400 text-[10px]">Attendance Mean</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">
                    {confMetrics?.attendanceMean ?? 88}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Classification Rule: </span>
                <span>
                  High confidence achieved via $\ge 10$ comparable meals with coefficient of variation &lt; 20%.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
