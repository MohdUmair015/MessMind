"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemoAuth } from "@/modules/auth/client-context";
import {
  LayoutDashboard,
  BrainCircuit,
  UtensilsCrossed,
  BarChart3,
  ShieldAlert,
  Users,
  Info,
} from "lucide-react";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["MESS_MANAGER", "HOSTEL_ADMIN"],
  },
  {
    name: "Predictions",
    href: "/predictions",
    icon: BrainCircuit,
    roles: ["MESS_MANAGER", "HOSTEL_ADMIN"],
  },
  {
    name: "Meals & Records",
    href: "/meals",
    icon: UtensilsCrossed,
    roles: ["MESS_MANAGER", "HOSTEL_ADMIN"],
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["MESS_MANAGER", "HOSTEL_ADMIN"],
  },
  {
    name: "Admin",
    href: "/admin",
    icon: ShieldAlert,
    roles: ["HOSTEL_ADMIN"],
    adminOnly: true,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { currentRole, isAdmin } = useDemoAuth();

  return (
    <aside className="w-64 bg-[#0B192C] text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-bold text-base tracking-tight leading-tight">
              Mess<span className="text-teal-400">Mind</span>
            </div>
            <div className="text-[11px] text-slate-400">Demand Intelligence</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-500">
          Management
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          const isRestricted = item.adminOnly && !isAdmin;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-teal-600 text-white shadow-sm font-semibold"
                  : isRestricted
                  ? "opacity-40 text-slate-500 hover:opacity-60"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-4 h-4 ${
                    isActive ? "text-white" : isRestricted ? "text-slate-600" : "text-teal-400/80"
                  }`}
                />
                <span>{item.name}</span>
              </div>

              {item.adminOnly && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    isAdmin
                      ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                      : "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}
                >
                  Admin
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Population & Demo Notice Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#070F1B]/60 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-medium mb-1.5">
          <Users className="w-3.5 h-3.5 text-teal-400" />
          <span>Synthetic Population</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-md p-2.5 text-[11px] space-y-1">
          <div className="flex justify-between text-slate-300">
            <span>Total Residents:</span>
            <span className="font-semibold text-white">125</span>
          </div>
          <div className="flex justify-between text-slate-400 text-[10px]">
            <span>• Students:</span>
            <span>50</span>
          </div>
          <div className="flex justify-between text-slate-400 text-[10px]">
            <span>• Corporate:</span>
            <span>75</span>
          </div>
          <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-amber-400/80 flex items-center gap-1">
            <Info className="w-3 h-3 flex-shrink-0" />
            <span>Simulated hostel data</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
