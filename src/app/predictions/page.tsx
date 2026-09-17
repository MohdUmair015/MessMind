import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BrainCircuit, Sliders, ShieldCheck, FileText } from "lucide-react";

export default function PredictionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Demand Predictions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic prediction breakdown with individual resident attendance probabilities and Gemini explanations.
          </p>
        </div>
        <Badge variant="teal">Deterministic Engine Architecture</Badge>
      </div>

      {/* Methodology Overview Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              <span>Engine Factor Weighting Blueprint</span>
            </CardTitle>
            <Badge variant="outline">Defined in Specification</Badge>
          </div>
          <CardDescription>
            Target weights used by the deterministic algorithm to compute expected diners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-xl font-bold text-slate-900">40%</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">Personal History</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Historical attendance</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-xl font-bold text-slate-900">20%</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">Day-of-Week</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Weekday vs weekend</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-xl font-bold text-slate-900">15%</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">Meal-Type</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Breakfast/Lunch/Dinner</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-xl font-bold text-slate-900">15%</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">Recent Trend</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Last 2-3 weeks</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-xl font-bold text-slate-900">10%</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">Preference Signal</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Current opt-in status</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
            <span className="font-semibold text-slate-800 flex-shrink-0">Bounded Adjustments:</span>
            <span>
              Menu appeal adjustment (±10% max) and short-term trend adjustment (±10% max) are clamped to prevent anomalies from distorting predictions.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Two Columns: Prediction Engine vs Gemini AI Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-teal-600" />
              <span>Deterministic Prediction Engine</span>
            </CardTitle>
            <CardDescription>Mathematical probability aggregation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Computes individual resident attendance probability:
                <br />
                <code className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] block mt-1.5 font-mono">
                  Expected Diners = Σ(P(Resident_i))
                </code>
              </p>
              <div className="p-3 bg-slate-50 rounded border border-slate-100 text-[11px]">
                <span className="font-semibold text-slate-700">Sparse-Data Fallback Hierarchy:</span>
                <ol className="list-decimal list-inside mt-1 space-y-0.5 text-slate-500">
                  <li>Resident + day + meal + menu history</li>
                  <li>Resident + day + meal history</li>
                  <li>Resident + meal history</li>
                  <li>Overall comparable population history</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Gemini AI Explanation Layer</span>
            </CardTitle>
            <CardDescription>Natural-language reasoning & manager insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-teal-50/70 border border-teal-200/70 rounded text-[11px] text-teal-900">
                <span className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                  Privacy-First Aggregated Invariant:
                </span>
                <p className="mt-1 text-teal-800">
                  Gemini never receives resident names, IDs, room numbers, or individual meal records. Only aggregated factors (e.g. historical baseline 94, preference +4%, day Saturday) are provided to generate manager summaries.
                </p>
              </div>
              <p className="text-slate-500">
                Foundation interfaces defined in <code className="bg-slate-100 px-1 rounded font-mono">src/modules/gemini</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
