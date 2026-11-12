import Link from "next/link";
import { UtensilsCrossed, ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-coral-100 text-coral-600 flex items-center justify-center shadow-warm-card">
        <UtensilsCrossed className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs font-black uppercase tracking-wider text-coral-600">
          Resource Not Found
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-charcoal-950 tracking-tight">
          Meal or Page Not Found
        </h1>
        <p className="text-sm text-charcoal-600 leading-relaxed">
          The requested service ID or page does not exist in the active kitchen operations schedule.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white rounded-2xl text-xs font-bold shadow-coral-glow transition-all"
        >
          <Compass className="w-4 h-4" />
          <span>Kitchen Decision Center</span>
        </Link>
        <Link
          href="/meals"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-cream-100 text-charcoal-800 rounded-2xl text-xs font-bold border border-surface-border shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Operations Timeline</span>
        </Link>
      </div>
    </div>
  );
}
