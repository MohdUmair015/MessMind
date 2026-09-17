import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "teal" | "emerald" | "amber" | "rose" | "outline" | "navy";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    navy: "bg-slate-900 text-slate-100 border-slate-800",
    teal: "bg-teal-50 text-teal-800 border-teal-200/80",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    amber: "bg-amber-50 text-amber-800 border-amber-200/80",
    rose: "bg-rose-50 text-rose-800 border-rose-200/80",
    outline: "bg-transparent text-slate-600 border-slate-300",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium rounded-md",
    md: "px-2.5 py-1 text-xs font-semibold rounded-full",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
