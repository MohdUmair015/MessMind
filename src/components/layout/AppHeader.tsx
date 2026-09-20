"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemoAuth } from "@/modules/auth/client-context";
import {
  ShieldCheck,
  UserCheck,
  Menu,
  X,
  Compass,
  BrainCircuit,
  UtensilsCrossed,
  BarChart3,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { name: "Overview", href: "/", icon: Compass },
  { name: "Forecasts", href: "/predictions", icon: BrainCircuit },
  { name: "Meals", href: "/meals", icon: UtensilsCrossed },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Administration", href: "/admin", icon: ShieldAlert, adminOnly: true },
];

export function AppHeader() {
  const { currentRole, setRole, isAdmin } = useDemoAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="h-16 sm:h-18 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-surface-border px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs min-w-0 max-w-full">
        {/* Left: Mobile Menu Toggle + Product title & Demo Banner */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-charcoal-700 hover:bg-cream-200/80 transition-colors cursor-pointer focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2 min-w-0">
            <span className="font-black text-charcoal-950 tracking-tight text-lg sm:text-xl truncate">
              Mess<span className="text-coral-500">Mind</span>
            </span>
            <span className="text-xs text-charcoal-500 font-medium hidden lg:inline">
              | Food Demand Intelligence
            </span>
          </Link>

          {/* Demo Disclaimer Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-mango-50/90 border border-mango-200/80 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs text-mango-900 font-semibold shrink-0">
            <span className="w-2 h-2 rounded-full bg-mango-500 animate-pulse shrink-0" />
            <span className="truncate max-w-[180px] md:max-w-none">
              Demo environment — simulated data
            </span>
          </div>
        </div>

        {/* Right: Role Switcher & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center bg-cream-200/80 p-0.5 sm:p-1 rounded-2xl border border-surface-border text-xs">
            <button
              onClick={() => setRole("MESS_MANAGER")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                currentRole === "MESS_MANAGER"
                  ? "bg-coral-500 text-white shadow-coral-glow"
                  : "text-charcoal-700 hover:text-charcoal-950"
              }`}
              title="Switch to Mess Manager role preview (Operations)"
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Mess Manager</span>
              <span className="sm:hidden text-[11px]">Manager</span>
            </button>

            <button
              onClick={() => setRole("HOSTEL_ADMIN")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                currentRole === "HOSTEL_ADMIN"
                  ? "bg-charcoal-900 text-white shadow-2xs"
                  : "text-charcoal-700 hover:text-charcoal-950"
              }`}
              title="Switch to Hostel Admin role preview (Full Settings)"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Hostel Admin</span>
              <span className="sm:hidden text-[11px]">Admin</span>
            </button>
          </div>

          {/* User Avatar */}
          <div className="hidden sm:flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-surface-border">
            <div className="w-8 h-8 rounded-xl bg-coral-50 border border-coral-200 text-coral-700 font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
              {isAdmin ? "HA" : "MM"}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-charcoal-950/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FAF6F0] border-b border-surface-border p-4 shadow-xl space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-charcoal-500">
              Navigation
            </div>
            {MOBILE_NAV_ITEMS.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-coral-500 text-white shadow-coral-glow"
                      : "text-charcoal-700 hover:bg-cream-200/80"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
