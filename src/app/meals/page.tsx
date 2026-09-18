import Link from "next/link";
import { mealService } from "@/modules/meals/meal-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  UtensilsCrossed,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: "all" | "upcoming" | "completed" }>;
}) {
  const { filter } = await searchParams;
  const currentFilter = filter ?? "all";

  const { meals, totalCount } = await mealService.getMealsList({
    filter: currentFilter,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Meals & Kitchen Operations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Access predictive meal recommendations, track kitchen preparation schedules, and log dining outcomes.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <Link
            href="/meals"
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              currentFilter === "all" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Meals ({totalCount})
          </Link>
          <Link
            href="/meals?filter=upcoming"
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              currentFilter === "upcoming" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Upcoming
          </Link>
          <Link
            href="/meals?filter=completed"
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              currentFilter === "completed" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Completed
          </Link>
        </div>
      </div>

      {/* Meals Table / Card List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {meals.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No meals found matching the selected filter.
          </div>
        ) : (
          meals.map((meal) => {
            const hasOutcome = !!meal.outcome;
            const hasPrediction = !!meal.prediction;
            const items = Array.isArray(meal.menu.items)
              ? (meal.menu.items as string[]).slice(0, 3).join(", ")
              : "";

            return (
              <div
                key={meal.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Meal Identity */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs border border-slate-200/70">
                    {meal.mealType === "BREAKFAST" ? "BF" : meal.mealType === "LUNCH" ? "LU" : "DN"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{meal.menu.name}</span>
                      <Badge
                        variant={
                          hasOutcome
                            ? "default"
                            : meal.isServed
                            ? "outline"
                            : "teal"
                        }
                        size="sm"
                      >
                        {hasOutcome
                          ? "Outcome Recorded"
                          : meal.isServed
                          ? "Served (Awaiting Outcome)"
                          : "Upcoming Target"}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatDate(meal.mealDate)} · <span className="font-medium text-slate-600">{meal.mealType}</span> · {items}
                    </div>
                  </div>
                </div>

                {/* Right: Predictive & Outcome Metrics */}
                <div className="flex items-center gap-4 self-end md:self-auto">
                  {hasPrediction && (
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Predicted Diners</div>
                      <div className="text-sm font-bold text-teal-700">
                        {meal.prediction!.predictedDiners}
                        <span className="text-xs font-normal text-slate-500 ml-1">
                          (Prep: {meal.prediction!.recommendedServings})
                        </span>
                      </div>
                    </div>
                  )}

                  {hasOutcome ? (
                    <div className="text-right pl-3 border-l border-slate-200">
                      <div className="text-[11px] text-slate-400">Actual Diners</div>
                      <div className="text-sm font-bold text-slate-900">
                        {meal.outcome!.actualDiners}
                        <span className="text-xs font-normal text-rose-600 ml-1">
                          (Waste: {meal.outcome!.wastedServings})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right pl-3 border-l border-slate-200">
                      <div className="text-[11px] text-slate-400">Preferences Logged</div>
                      <div className="text-sm font-semibold text-slate-700">
                        {meal._count.preferences} opt-ins
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/meals/${meal.id}`}
                    className="p-2 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition-colors ml-1"
                    title="View meal detail and outcomes"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
