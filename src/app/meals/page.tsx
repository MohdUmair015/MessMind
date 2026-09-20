import Link from "next/link";
import { mealService } from "@/modules/meals/meal-service";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import {
  UtensilsCrossed,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  QrCode,
  Scale,
  Sparkles,
  ChefHat,
  ChevronRight,
  Minus,
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

  const upcomingMeals = meals.filter((m) => !m.isServed);
  const completedMeals = meals.filter((m) => m.isServed);

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <span className="text-xs font-black uppercase tracking-wider text-coral-600">
            Kitchen Operations Schedule
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-charcoal-950 tracking-tight mt-1 break-words">
            Meal Operations Timeline
          </h1>
          <p className="text-base text-charcoal-600 mt-1 break-words">
            Track preparation guidance for upcoming meals and review scanner attendance accuracy for past services.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-cream-200/80 p-1.5 rounded-2xl border border-surface-border text-xs self-start sm:self-auto shadow-2xs shrink-0">
          <Link
            href="/meals"
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              currentFilter === "all"
                ? "bg-coral-500 text-white shadow-coral-glow"
                : "text-charcoal-700 hover:text-charcoal-950"
            }`}
          >
            All Services ({totalCount})
          </Link>
          <Link
            href="/meals?filter=upcoming"
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              currentFilter === "upcoming"
                ? "bg-coral-500 text-white shadow-coral-glow"
                : "text-charcoal-700 hover:text-charcoal-950"
            }`}
          >
            Upcoming ({upcomingMeals.length})
          </Link>
          <Link
            href="/meals?filter=completed"
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              currentFilter === "completed"
                ? "bg-coral-500 text-white shadow-coral-glow"
                : "text-charcoal-700 hover:text-charcoal-950"
            }`}
          >
            Completed ({completedMeals.length})
          </Link>
        </div>
      </div>

      {/* TODAY'S OPERATIONAL RHYTHM TIMELINE */}
      <section className="p-6 md:p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border/70 mb-5">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-coral-500" />
            <span className="text-xs font-black uppercase tracking-wider text-charcoal-900">
              Today&apos;s Service Rhythm
            </span>
          </div>
          <span className="text-xs font-bold text-charcoal-600 bg-cream-100 px-3 py-1 rounded-full border border-surface-border">
            Saturday Schedule
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
          {/* Breakfast */}
          <div className="p-4 rounded-2xl bg-cream-50 border border-surface-border flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-mint-100 text-mint-700 flex items-center justify-center font-bold text-xs shrink-0">
                BF
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-charcoal-900 truncate">Breakfast (7:30 AM)</div>
                <div className="text-xs text-charcoal-500 truncate">Masala Dosa & Sambar</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-mint-700 bg-mint-50 px-2.5 py-1 rounded-full border border-mint-200 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Completed</span>
            </span>
          </div>

          {/* Lunch */}
          <div className="p-4 rounded-2xl bg-cream-50/60 border border-surface-border/70 flex items-center justify-between gap-3 min-w-0 opacity-75">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-charcoal-100 text-charcoal-500 flex items-center justify-center font-bold text-xs shrink-0">
                LU
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-charcoal-700 truncate">Lunch (12:30 PM)</div>
                <div className="text-xs text-charcoal-500 truncate">Weekend self-service</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-charcoal-500 bg-charcoal-100 px-2.5 py-1 rounded-full shrink-0">
              <Minus className="w-3.5 h-3.5 shrink-0" />
              <span>Not served</span>
            </span>
          </div>

          {/* Dinner */}
          <div className="p-4 rounded-2xl bg-coral-50/70 border border-coral-200 flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-coral-500 text-white flex items-center justify-center font-bold text-xs shadow-coral-glow shrink-0">
                DN
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-charcoal-900 truncate">Dinner (7:30 PM)</div>
                <div className="text-xs text-coral-700 font-semibold truncate">Vegetable Biryani Special</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-coral-700 bg-white px-2.5 py-1 rounded-full border border-coral-200 shadow-2xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-coral-500 animate-pulse shrink-0" />
              <span>Upcoming</span>
            </span>
          </div>
        </div>
      </section>

      {/* OPERATIONS TIMELINE CARDS */}
      <div className="space-y-4">
        {meals.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-surface-border shadow-warm-card text-charcoal-500 text-base">
            No meal records found matching the selected filter.
          </div>
        ) : (
          meals.map((meal) => {
            const hasOutcome = !!meal.outcome;
            const hasPrediction = !!meal.prediction;
            const items = Array.isArray(meal.menu.items)
              ? (meal.menu.items as string[])
              : [];

            const isUpcoming = !meal.isServed;
            const actualScans = meal.outcome?.actualDiners ?? (meal._count.scans > 0 ? meal._count.scans : null);
            const predDiners = meal.prediction?.predictedDiners;

            let errorPercent: number | null = null;
            if (actualScans !== null && predDiners) {
              errorPercent = Math.round((Math.abs(actualScans - predDiners) / predDiners) * 1000) / 10;
            }

            return (
              <div
                key={meal.id}
                className={`p-6 md:p-7 rounded-3xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  isUpcoming
                    ? "bg-white border-coral-300 shadow-warm-card hover:shadow-warm-hover"
                    : "bg-white border-surface-border shadow-warm-card hover:shadow-warm-hover"
                }`}
              >
                {/* Left: Meal Identity & Dishes */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 font-black text-sm border ${
                      isUpcoming
                        ? "bg-coral-500 text-white border-coral-400 shadow-coral-glow"
                        : "bg-cream-100 text-charcoal-800 border-surface-border"
                    }`}
                  >
                    <span>{meal.mealType === "BREAKFAST" ? "BF" : meal.mealType === "LUNCH" ? "LU" : "DN"}</span>
                    <span className="text-[10px] font-bold opacity-80">
                      {meal.mealType === "BREAKFAST" ? "AM" : "PM"}
                    </span>
                  </div>

                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-black text-charcoal-950 text-lg md:text-xl tracking-tight break-words">
                        {meal.menu.name}
                      </h3>
                      <Badge
                        variant={isUpcoming ? "coral" : "mint"}
                        size="xs"
                        dot={isUpcoming}
                        className="shrink-0"
                      >
                        {isUpcoming ? "Upcoming Service" : "Attendance Verified"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-charcoal-600">
                      <span className="font-bold text-charcoal-800">
                        {formatDate(meal.mealDate)}
                      </span>
                      <span>·</span>
                      <span>{meal.mealType} Service</span>
                      <span>·</span>
                      <span className="truncate max-w-md text-charcoal-500">
                        {items.slice(0, 4).join(", ")}{items.length > 4 ? "..." : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Operational Metrics & Action */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-surface-border/70 w-full md:w-auto justify-between md:justify-end min-w-0">
                  {/* Metric 1: Expected Diners & Prep Guidance */}
                  {hasPrediction && (
                    <div className="text-left sm:text-right min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500 block">
                        Expected Demand
                      </span>
                      <div className="text-base sm:text-lg font-black text-charcoal-950 tabular-nums">
                        {meal.prediction!.predictedDiners} diners
                        <span className="text-xs font-semibold text-coral-600 ml-1.5 block sm:inline">
                          (Prep: {meal.prediction!.recommendedServings})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Metric 2: Scanner Attendance */}
                  <div className="text-left sm:text-right sm:pl-5 sm:border-l border-surface-border min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500 block">
                      {hasOutcome || actualScans !== null ? "Scanner Attendance" : "Resident Opt-ins"}
                    </span>
                    {actualScans !== null ? (
                      <div className="text-base sm:text-lg font-black text-charcoal-950 tabular-nums flex flex-wrap items-center gap-1.5 sm:gap-2 justify-start sm:justify-end">
                        <span>{actualScans} scans</span>
                        {errorPercent !== null && (
                          <span className="text-xs font-black text-mint-700 bg-mint-100 px-2 py-0.5 rounded-md border border-mint-200 shrink-0">
                            {errorPercent}% error
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-charcoal-700">
                        {meal._count.preferences} opt-ins
                      </div>
                    )}
                  </div>

                  {/* Navigation CTA */}
                  <Link
                    href={`/meals/${meal.id}`}
                    className="p-3 rounded-2xl bg-cream-100 hover:bg-coral-500 hover:text-white text-charcoal-800 transition-all duration-150 shadow-2xs group shrink-0"
                    title="View meal lifecycle and details"
                  >
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
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

