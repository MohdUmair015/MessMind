import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowLeft, Clock, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div>
        <Link
          href="/meals"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Meals</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Meal Detail & Outcome Feedback
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Target ID: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs text-slate-700">{id}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="teal">Demo Target Scenario</Badge>
          </div>
        </div>
      </div>

      {/* Two Stages: Before Meal vs After Meal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stage 1: Before Meal (Prediction & Prep) */}
        <Card className="border-teal-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Before Meal: Prediction Guidance</span>
              </CardTitle>
              <Badge variant="teal">Pre-Meal</Badge>
            </div>
            <CardDescription>
              Kitchen guidance generated prior to food preparation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Predicted Diners:</span>
                  <span className="font-bold text-slate-900">101</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recommended Servings:</span>
                  <span className="font-bold text-slate-900">106 (with 5% buffer)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waste Risk:</span>
                  <span className="font-bold text-emerald-700">LOW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Confidence Level:</span>
                  <span className="font-bold text-teal-700">HIGH (42 comparable meals)</span>
                </div>
              </div>

              <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-100 text-xs text-teal-900">
                <span className="font-semibold block mb-1">Prediction Factors:</span>
                <ul className="space-y-1 text-[11px] text-teal-800 list-disc list-inside">
                  <li>Historical Saturday Baseline: 94 diners</li>
                  <li>Current Preference Opt-in Signal: +4%</li>
                  <li>Recent 2-Week Attendance Trend: +3%</li>
                  <li>Vegetable Biryani Menu Effect: +2%</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stage 2: After Meal (Outcome & Feedback Loop) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-900" />
                <span>After Meal: Outcome Recording</span>
              </CardTitle>
              <Badge variant="outline">Feedback Loop</Badge>
            </div>
            <CardDescription>
              Record actual attendance & waste to complete the learning loop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Prepared Servings:</span>
                  <span className="font-semibold text-slate-800">108 servings</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Observed Actual Diners:</span>
                  <span className="font-semibold text-slate-800">99 diners</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Servings:</span>
                  <span className="font-semibold text-slate-800">9 servings</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wasted Servings:</span>
                  <span className="font-semibold text-rose-700">4 servings</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
                <div className="flex items-center justify-between font-medium">
                  <span>Prediction Error:</span>
                  <span className="text-emerald-700 font-bold">2.0% (99 actual vs 101 predicted)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Feeding observed actuals back into the model refines future weekend dinner predictions.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
