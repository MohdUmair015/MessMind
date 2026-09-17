import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Utensils, TrendingUp, AlertCircle, Clock, Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Top Welcome & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mess Demand Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time meal intelligence and preparation guidance for hostel operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="navy" size="md">
            Phase 1: Foundation Established
          </Badge>
        </div>
      </div>

      {/* Target Demo Scenario Preview Card */}
      <Card className="border-teal-200/80 bg-gradient-to-r from-teal-50/50 via-white to-slate-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <CardTitle className="text-base">Upcoming Target Meal: Saturday Dinner</CardTitle>
                <CardDescription>Demo benchmark scenario for the deterministic prediction engine</CardDescription>
              </div>
            </div>
            <Badge variant="teal" size="md">Planned Target</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-3 bg-white rounded-lg border border-slate-200/60">
              <div className="text-xs text-slate-500 font-medium">Eligible Residents</div>
              <div className="text-xl font-bold text-slate-900 mt-1">125</div>
              <div className="text-[11px] text-slate-400">50 Student · 75 Corporate</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/60">
              <div className="text-xs text-slate-500 font-medium">Expected Diners</div>
              <div className="text-xl font-bold text-teal-700 mt-1">~101</div>
              <div className="text-[11px] text-teal-600 font-medium">Sum of probabilities</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/60">
              <div className="text-xs text-slate-500 font-medium">Recommended Prep</div>
              <div className="text-xl font-bold text-slate-900 mt-1">~106-107</div>
              <div className="text-[11px] text-slate-500">+5% buffer formula</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/60">
              <div className="text-xs text-slate-500 font-medium">Waste Risk</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">LOW</div>
              <div className="text-[11px] text-emerald-600 font-medium">High Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Key Dashboard Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Meal & Menu Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Utensils className="w-4 h-4 text-teal-600" />
              <span>Next Meal Focus</span>
            </CardTitle>
            <CardDescription>Scheduled menu and timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
                <div className="font-semibold text-slate-800">Vegetable Biryani Special</div>
                <div className="text-slate-500 mt-0.5">Vegetable Biryani, Cucumber Raita, Gulab Jamun</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Preference cutoff: 4:00 PM</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prediction vs Actual Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>Prediction vs Actuals</span>
            </CardTitle>
            <CardDescription>Feedback loop: Predict → Prepare → Observe → Learn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-slate-500 space-y-2">
              <p>
                Outcome feedback recording connects actual attendance with historical prediction factors.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                Awaiting synthetic data seed & Phase 2 engine activation.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Waste Intelligence Indicator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-teal-600" />
              <span>Waste Intelligence</span>
            </CardTitle>
            <CardDescription>Over-preparation risk thresholds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-slate-500 space-y-2">
              <p>
                Compares kitchen planned servings against predicted resident attendance to flag high-risk preparation gaps.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-teal-700 bg-teal-50/60 p-2 rounded border border-teal-100">
                Target: &lt;5% average servings wasted
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
