import React from "react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";

interface StatusRingProps {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: "coral" | "mint" | "mango" | "emerald" | "amber" | "rose";
  className?: string;
}

export function StatusRing({
  current,
  total,
  size = 140,
  strokeWidth = 10,
  label = "scanned",
  sublabel,
  color = "mint",
  className,
}: StatusRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(1.25, Math.max(0, current / total)) : 0;
  const strokeDashoffset = circumference - Math.min(1, ratio) * circumference;

  const colorMap = {
    coral: "text-coral-500",
    mint: "text-mint-500",
    mango: "text-mango-500",
    emerald: "text-mint-500",
    amber: "text-mango-500",
    rose: "text-coral-500",
  };

  const bgStrokeMap = {
    coral: "text-coral-100",
    mint: "text-mint-100",
    mango: "text-mango-100",
    emerald: "text-mint-100",
    amber: "text-mango-100",
    rose: "text-coral-100",
  };

  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className={bgStrokeMap[color]}
        />
        {/* Animated progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className={cn("transition-all duration-700 ease-out", colorMap[color])}
        />
      </svg>

      {/* Centered value and metrics */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        <span className="text-3xl md:text-4xl font-black text-charcoal-900 tracking-tight tabular-nums">
          <AnimatedNumber value={current} duration={600} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500 mt-0.5">
          {label}
        </span>
        {sublabel && (
          <span className="text-xs font-semibold text-charcoal-600 mt-0.5 tabular-nums">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

