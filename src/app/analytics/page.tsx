import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BarChart3, TrendingDown, Target, Award } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligence & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Historical demand trends, prediction accuracy metrics, and food waste reduction analysis.
          </p>
        </div>
        <Badge variant="teal">Recharts Ready</Badge>
      </div>

      {/* KPI Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Model MAPE</span>
            <Target className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">4.2%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Mean Absolute % Error</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Servings Saved</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">~18.5%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Reduction in over-prep</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Evaluated Meals</span>
            <BarChart3 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">120+</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Simulated historical meals</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Accuracy Rate</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">92.8%</div>
          <div className="text-[11px] text-teal-600 font-medium mt-0.5">Within ±5% tolerance</div>
        </div>
      </div>

      {/* Analytics Chart Placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Predicted vs Actual Diners</CardTitle>
            <CardDescription>Multi-month trend comparing prediction engine to actual attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
              Recharts Time-Series Chart Component (Phase 2)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Waste Reduction Curve</CardTitle>
            <CardDescription>Track food waste reduction since system adoption</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
              Recharts Waste Metrics Chart Component (Phase 2)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
