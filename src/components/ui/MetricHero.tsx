import React from "react";
import { cn } from "@/lib/utils";

interface MetricHeroProps {
  label: string;
  value: number | string;
  unit?: string;
  sublabel?: string;
  badgeText?: string;
  badgeVariant?: "teal" | "emerald" | "amber" | "rose" | "neutral";
  highlight?: boolean;
  className?: string;
}

export function MetricHero({
  label,
  value,
  unit,
  sublabel,
  badgeText,
  badgeVariant = "teal",
  highlight = false,
  className,
}: MetricHeroProps) {
  const badgeColors = {
    teal: "bg-mint-50 text-mint-800 border-mint-200/80",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    amber: "bg-amber-50 text-amber-900 border-amber-200/80",
    rose: "bg-rose-50 text-rose-800 border-rose-200/80",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div
      className={cn(
        "p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between",
        highlight
          ? "bg-gradient-to-br from-white via-mint-50/20 to-mint-50/40 border-mint-200/90 shadow-card"
          : "bg-white border-slate-200/80 shadow-card",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {badgeText && (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
              badgeColors[badgeVariant]
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div className="my-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="text-sm md:text-base font-semibold text-slate-500">
              {unit}
            </span>
          )}
        </div>
      </div>

      {sublabel && (
        <div className="text-xs text-slate-500 leading-tight pt-2 border-t border-slate-100">
          {sublabel}
        </div>
      )}
    </div>
  );
}
