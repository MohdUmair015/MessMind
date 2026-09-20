import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "obsidian" | "glass" | "warm";
  children: React.ReactNode;
}

export function Card({
  className,
  variant = "default",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-white border border-surface-border shadow-warm-card",
    hover: "bg-white border border-surface-border shadow-warm-card hover:shadow-warm-hover hover:border-coral-200 transition-all duration-200",
    warm: "bg-surface-warm border border-surface-border shadow-warm-card",
    obsidian: "bg-charcoal-900 border border-charcoal-800 text-cream-50 shadow-warm-card",
    glass: "bg-white/90 backdrop-blur-md border border-surface-border shadow-warm-card",
  };

  return (
    <div
      className={cn(
        "rounded-3xl p-6 md:p-8 transition-all duration-200",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 pb-4 border-b border-surface-border/60",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base md:text-lg font-black text-charcoal-900 tracking-tight flex items-center justify-between",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-charcoal-600 leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("pt-4", className)} {...props}>
      {children}
    </div>
  );
}

