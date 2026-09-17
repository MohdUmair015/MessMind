import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { UtensilsCrossed, Calendar, ArrowRight, Clock } from "lucide-react";

export default function MealsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Meals & Kitchen Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track scheduled meals, access predictive recommendations, and log post-meal outcomes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Schedule & Outcomes</Badge>
        </div>
      </div>

      {/* Target Demo Scenario Quick Access */}
      <Card className="border-teal-300/80 bg-teal-50/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-teal-600" />
              <span>Benchmark Demo Meal: Saturday Dinner</span>
            </CardTitle>
            <Badge variant="teal">Demo Highlight</Badge>
          </div>
          <CardDescription>
            Target scenario: 125 residents, expected ~101 diners, recommended ~106-107 servings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-lg border border-slate-200/80">
            <div>
              <div className="font-semibold text-slate-900 text-sm">Special Saturday Dinner Menu</div>
              <div className="text-xs text-slate-500 mt-0.5">Vegetable Biryani, Raita, Gulab Jamun</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Status: Ready for outcome recording</span>
              </div>
            </div>
            <Link
              href="/meals/saturday-dinner-benchmark"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <span>Inspect Meal Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Meals Schedule Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Meal Schedule Logic</span>
          </CardTitle>
          <CardDescription>Rules established in specification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="font-semibold text-slate-800 mb-1">Breakfast</div>
              <div className="text-slate-500">Daily service across both students and corporate residents.</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="font-semibold text-slate-800 mb-1">Lunch</div>
              <div className="text-slate-500">Weekends and public holidays only (corporate residents offsite weekdays).</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="font-semibold text-slate-800 mb-1">Dinner</div>
              <div className="text-slate-500">Daily service with high weekend variation based on menu popularity.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
