import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "coral"
    | "mango"
    | "mint"
    | "charcoal"
    | "cream"
    | "teal"
    | "emerald"
    | "amber"
    | "rose"
    | "outline"
    | "navy"
    | "obsidian";
  size?: "xs" | "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "sm",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-charcoal-50 text-charcoal-700 border-surface-border",
    coral: "bg-coral-50 text-coral-700 border-coral-200/80",
    mango: "bg-mango-50 text-mango-800 border-mango-200/80",
    mint: "bg-mint-50 text-mint-700 border-mint-200/80",
    charcoal: "bg-charcoal-900 text-cream-50 border-charcoal-800 shadow-2xs",
    cream: "bg-cream-200 text-charcoal-800 border-cream-300",
    navy: "bg-charcoal-900 text-cream-100 border-charcoal-800 shadow-2xs",
    obsidian: "bg-charcoal-900 text-coral-300 border-charcoal-800",
    teal: "bg-mint-50 text-mint-800 border-mint-200/80",
    emerald: "bg-mint-50 text-mint-800 border-mint-200/80",
    amber: "bg-mango-50 text-mango-800 border-mango-200/90",
    rose: "bg-coral-50 text-coral-800 border-coral-200/80",
    outline: "bg-white/90 text-charcoal-700 border-surface-border",
  };

  const dotStyles = {
    default: "bg-charcoal-400",
    coral: "bg-coral-500",
    mango: "bg-mango-500",
    mint: "bg-mint-500",
    charcoal: "bg-coral-400",
    cream: "bg-coral-500",
    navy: "bg-coral-400",
    obsidian: "bg-coral-400",
    teal: "bg-mint-500",
    emerald: "bg-mint-500",
    amber: "bg-mango-500",
    rose: "bg-coral-500",
    outline: "bg-charcoal-400",
  };

  const sizeStyles = {
    xs: "px-2 py-0.5 text-[11px] font-bold rounded-md tracking-wider uppercase",
    sm: "px-2.5 py-1 text-xs font-semibold rounded-full",
    md: "px-3.5 py-1.5 text-xs font-semibold rounded-full",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border transition-all duration-150 leading-tight shrink-0 max-w-full",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotStyles[variant])}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}
