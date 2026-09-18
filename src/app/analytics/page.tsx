import { analyticsService } from "@/modules/analytics/analytics-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { BarChart3, TrendingDown, Target, Award, Utensils } from "lucide-react";

export default async function AnalyticsPage() {
  const analytics = await analyticsService.getAnalyticsSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligence & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Empirical accuracy metrics, food preparation efficiency, and historical outcome comparisons from PostgreSQL.
          </p>
        </div>
        <Badge variant="teal">Aggregated from PostgreSQL ({analytics.totalOutcomesRecorded} meals)</Badge>
      </div>

      {/* 4 Core KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Model MAPE</span>
            <Target className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{analytics.overallMapePercent}%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Mean Absolute % Error</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Accuracy Tolerance</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{analytics.accuracyWithinFivePercentRate}%</div>
          <div className="text-[11px] text-teal-600 font-medium mt-0.5">Within ±5% target tolerance</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Average Waste Rate</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{analytics.averageFoodWastePercent}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Wasted / prepared servings ratio</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Evaluated Meals</span>
            <BarChart3 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{analytics.totalOutcomesRecorded}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Historical meal outcomes logged</div>
        </div>
      </div>

      {/* Aggregate Volume Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">90-Day Aggregate Dining Volumes</CardTitle>
          <CardDescription>Total food prepared, consumed, and preserved across all historical meal services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500">Total Servings Prepared</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {analytics.totalServingsPrepared.toLocaleString()} servings
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500">Total Actual Diners Served</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {analytics.totalActualDinersServed.toLocaleString()} diners
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500">Total Food Waste Discarded</div>
              <div className="text-xl font-bold text-rose-700 mt-1">
                {analytics.totalServingsWasted.toLocaleString()} servings
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Meal Outcomes Comparison Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Recent Prediction vs Actual Outcome Records</CardTitle>
              <CardDescription>Granular feed demonstrating the closed feedback loop</CardDescription>
            </div>
            <Badge variant="outline">Last 20 Meals</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date & Meal</th>
                  <th className="py-2.5 px-3">Menu</th>
                  <th className="py-2.5 px-3 text-right">Predicted</th>
                  <th className="py-2.5 px-3 text-right">Prepared</th>
                  <th className="py-2.5 px-3 text-right">Actual</th>
                  <th className="py-2.5 px-3 text-right">Leftover</th>
                  <th className="py-2.5 px-3 text-right">Wasted</th>
                  <th className="py-2.5 px-3 text-right">Error %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.recentOutcomeComparisons.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {formatDate(row.mealDate)} ({row.mealType})
                    </td>
                    <td className="py-2.5 px-3">{row.menuName}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-teal-700">
                      {row.predictedDiners ?? "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                      {row.preparedServings}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                      {row.actualDiners}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{row.remainingServings}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-rose-600">{row.wastedServings}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {row.errorPercent !== null ? `${row.errorPercent}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
