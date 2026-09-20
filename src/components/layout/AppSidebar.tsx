"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemoAuth } from "@/modules/auth/client-context";
import {
  Compass,
  BrainCircuit,
  UtensilsCrossed,
  BarChart3,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  Database,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavSection {
  title: string;
  items: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    adminOnly?: boolean;
  }>;
}

const NAVIGATION: NavSection[] = [
  {
    title: "OPERATIONS",
    items: [
      {
        name: "Overview",
        href: "/",
        icon: Compass,
      },
      {
        name: "Forecasts",
        href: "/predictions",
        icon: BrainCircuit,
      },
      {
        name: "Meals",
        href: "/meals",
        icon: UtensilsCrossed,
      },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      {
        name: "Analytics",
        href: "/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "GOVERNANCE",
    items: [
      {
        name: "Administration",
        href: "/admin",
        icon: ShieldAlert,
        adminOnly: true,
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isAdmin } = useDemoAuth();

  return (
    <aside className="hidden md:flex w-64 lg:w-68 bg-[#FAF6F0] text-charcoal-800 flex-col flex-shrink-0 min-h-screen border-r border-surface-border select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-surface-border/80">
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-2xl bg-coral-500 text-white flex items-center justify-center shadow-coral-glow group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="text-charcoal-950 font-black text-xl tracking-tight leading-none flex items-center gap-0.5">
              <span>Mess</span>
              <span className="text-coral-500">Mind</span>
            </div>
            <div className="text-[11px] font-bold tracking-wider text-charcoal-600 mt-1 uppercase">
              Food Intelligence
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {NAVIGATION.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <div className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-charcoal-600">
              {section.title}
            </div>

            {section.items.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              const isRestricted = item.adminOnly && !isAdmin;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[15px] font-medium transition-all duration-150 group",
                    isActive
                      ? "bg-coral-500 text-white shadow-coral-glow font-bold"
                      : isRestricted
                      ? "opacity-40 text-charcoal-400 hover:opacity-70 hover:bg-cream-200/50"
                      : "text-charcoal-700 hover:bg-cream-200/80 hover:text-charcoal-950"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <item.icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : isRestricted
                          ? "text-charcoal-400"
                          : "text-charcoal-500 group-hover:text-coral-500"
                      )}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-coral-100 text-coral-800 border border-coral-200">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-white/90" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Status / Demo Info */}
      <div className="p-4 border-t border-surface-border/80 bg-[#F4EDE2]/50">
        <div className="p-3 bg-white rounded-2xl border border-surface-border/90 shadow-2xs flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-mint-500 flex-shrink-0 animate-pulse" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-charcoal-900 truncate">
              Dining Scanner Connected
            </div>
            <div className="text-[11px] text-charcoal-600 truncate">
              PostgreSQL · 125 Residents
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
