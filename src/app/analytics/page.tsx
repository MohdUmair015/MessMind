import { analyticsService } from "@/modules/analytics/analytics-service";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { DemandAccuracyChart } from "@/components/analytics/DemandAccuracyChart";
import { SurplusWasteDivergenceChart } from "@/components/analytics/SurplusWasteDivergenceChart";
import {
  BarChart3,
  TrendingDown,
  Target,
  Award,
  Scale,
  ShieldCheck,
  Sparkles,
  Info,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

export default async function AnalyticsPage() {
  const analytics = await analyticsService.getAnalyticsSummary();

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <span className="text-xs font-black uppercase tracking-wider text-coral-600">
            Empirical Intelligence
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-charcoal-950 tracking-tight mt-1 break-words">
            Analytics & Accuracy Story
          </h1>
          <p className="text-base text-charcoal-600 mt-1 break-words">
            Empirical prediction accuracy, kitchen preparation efficiency, and food waste trends from PostgreSQL.
          </p>
        </div>
        <Badge variant="coral" size="sm" className="shrink-0 self-start sm:self-auto">
          Aggregated from PostgreSQL ({analytics.totalOutcomesRecorded} meals)
        </Badge>
      </div>

      {/* 4 CORE KPI STORY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-0">
        <div className="p-6 rounded-3xl bg-white border border-surface-border shadow-warm-card min-w-0">
          <div className="flex items-center justify-between text-charcoal-500 text-xs">
            <span className="font-black uppercase tracking-wider text-[11px] text-charcoal-500">
              Model MAPE
            </span>
            <Target className="w-5 h-5 text-coral-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-charcoal-950 mt-2 tabular-nums">
            {analytics.overallMapePercent}%
          </div>
          <div className="text-xs text-mint-700 font-bold mt-1">
            Mean Absolute % Error
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-surface-border shadow-warm-card min-w-0">
          <div className="flex items-center justify-between text-charcoal-500 text-xs">
            <span className="font-black uppercase tracking-wider text-[11px] text-charcoal-500">
              Target Tolerance
            </span>
            <Award className="w-5 h-5 text-mango-500 shrink-0" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-charcoal-950 mt-2 tabular-nums">
            {analytics.accuracyWithinFivePercentRate}%
          </div>
          <div className="text-xs text-coral-600 font-bold mt-1">
            Within ±5% target tolerance
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-surface-border shadow-warm-card min-w-0">
          <div className="flex items-center justify-between text-charcoal-500 text-xs">
            <span className="font-black uppercase tracking-wider text-[11px] text-charcoal-500">
              Avg Food Waste
            </span>
            <TrendingDown className="w-5 h-5 text-mint-600 shrink-0" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-mint-700 mt-2 tabular-nums">
            {analytics.averageFoodWastePercent}%
          </div>
          <div className="text-xs text-charcoal-600 font-medium mt-1">
            Wasted / prepared ratio (audit)
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-surface-border shadow-warm-card min-w-0">
          <div className="flex items-center justify-between text-charcoal-500 text-xs">
            <span className="font-black uppercase tracking-wider text-[11px] text-charcoal-500">
              Evaluated Services
            </span>
            <BarChart3 className="w-5 h-5 text-charcoal-700 shrink-0" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-charcoal-950 mt-2 tabular-nums">
            {analytics.totalOutcomesRecorded}
          </div>
          <div className="text-xs text-charcoal-600 font-medium mt-1">
            Historical outcomes logged
          </div>
        </div>
      </div>

      {/* VISUAL STORY 1: "How close are we getting?" */}
      <section className="p-8 md:p-10 rounded-3xl bg-white border border-surface-border shadow-warm-card space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-surface-border/70">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-coral-600">
              ACCURACY STORY 1
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-charcoal-950 tracking-tight mt-1">
              &ldquo;How close are we getting?&rdquo;
            </h3>
            <p className="text-sm text-charcoal-600 mt-1">
              Comparison of predicted demand (coral solid curve) against authoritative scanner attendance (charcoal dashed curve).
            </p>
          </div>
          <Badge variant="mint" size="sm">
            {analytics.accuracyWithinFivePercentRate}% within ±5% tolerance
          </Badge>
        </div>

        <DemandAccuracyChart data={analytics.recentOutcomeComparisons} />

        <div className="p-5 bg-cream-50 rounded-2xl border border-surface-border text-sm text-charcoal-700 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-coral-500 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong className="text-charcoal-900">Interpretation:</strong> The deterministic model tightly tracks actual diner attendance across weekday and weekend services with an average error of only {analytics.overallMapePercent}%, preventing both food shortages and systematic overpreparation.
          </span>
        </div>
      </section>

      {/* VISUAL STORY 2: "Where are we seeing surplus?" */}
      <section className="p-8 md:p-10 rounded-3xl bg-white border border-surface-border shadow-warm-card space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-surface-border/70 min-w-0">
          <div className="min-w-0">
            <span className="text-xs font-black uppercase tracking-wider text-mango-600">
              ACCURACY STORY 2
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-charcoal-950 tracking-tight mt-1 break-words">
              &ldquo;Where are we seeing surplus?&rdquo;
            </h3>
            <p className="text-sm text-charcoal-600 mt-1 break-words">
              Strictly distinguishing kitchen prepared food, diner attendance, and audited discarded waste.
            </p>
          </div>
          <Badge variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
            Audited Food Volumes
          </Badge>
        </div>

        <SurplusWasteDivergenceChart data={analytics.recentOutcomeComparisons} />

        <div className="p-5 bg-coral-50/60 rounded-2xl border border-coral-200/80 text-sm text-charcoal-800 flex items-start gap-3 min-w-0">
          <Scale className="w-5 h-5 text-coral-600 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed break-words">
            <strong className="text-charcoal-950">Food Waste Semantics:</strong> Meal scans determine attendance, not discarded food. Estimated surplus is food prepared beyond attendees. Actual food waste is logged only when kitchen staff record a discarded food audit.
          </span>
        </div>
      </section>

      {/* VISUAL STORY 3: "Are we actually reducing waste?" */}
      <section className="p-8 md:p-10 rounded-3xl bg-white border border-surface-border shadow-warm-card space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-surface-border/70 min-w-0">
          <div className="min-w-0">
            <span className="text-xs font-black uppercase tracking-wider text-mint-700">
              ACCURACY STORY 3
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-charcoal-950 tracking-tight mt-1 break-words">
              &ldquo;Are we actually reducing waste?&rdquo;
            </h3>
            <p className="text-sm text-charcoal-600 mt-1 break-words">
              Historical closed feedback loop records evaluating prediction error against scanner data.
            </p>
          </div>
          <span className="text-xs font-bold text-charcoal-600 bg-cream-100 px-3 py-1 rounded-full border border-surface-border shrink-0 self-start sm:self-auto">
            Last 20 Services
          </span>
        </div>

        <div className="divide-y divide-surface-border overflow-x-auto min-w-0">
          {analytics.recentOutcomeComparisons.slice(0, 10).map((row, idx) => {
            const isAccurate = row.errorPercent !== null && row.errorPercent <= 5.0;

            return (
              <div
                key={row.mealId || idx}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 text-sm hover:bg-cream-50 transition-colors px-3 rounded-2xl min-w-0"
              >
                <div className="min-w-[160px] sm:min-w-[200px]">
                  <div className="font-bold text-charcoal-950 text-base break-words">{row.menuName}</div>
                  <div className="text-xs text-charcoal-500 mt-0.5 break-words">
                    {formatDate(row.mealDate)} · {row.mealType}
                  </div>
                </div>

                <div className="text-left sm:text-right min-w-0">
                  <span className="text-charcoal-500 text-xs uppercase font-bold block">
                    Predicted vs Actual
                  </span>
                  <span className="font-semibold text-charcoal-800 break-words">
                    {row.predictedDiners ?? "—"} pred / <strong className="text-charcoal-950">{row.actualDiners} scans</strong>
                  </span>
                </div>

                <div className="text-left sm:text-right min-w-0">
                  <span className="text-charcoal-500 text-xs uppercase font-bold block">
                    Preparation & Waste
                  </span>
                  <span className="text-charcoal-700 break-words">
                    {row.preparedServings} prep / <span className="text-coral-600 font-bold">{row.wastedServings} wasted</span>
                  </span>
                </div>

                <div className="text-left sm:text-right min-w-[70px] shrink-0">
                  <span
                    className={`inline-block font-black px-2.5 py-1 rounded-lg text-xs ${
                      isAccurate
                        ? "bg-mint-50 text-mint-800 border border-mint-200"
                        : "bg-cream-100 text-charcoal-700 border border-surface-border"
                    }`}
                  >
                    {row.errorPercent !== null ? `${row.errorPercent}%` : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

