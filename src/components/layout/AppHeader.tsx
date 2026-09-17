"use client";

import React from "react";
import { useDemoAuth } from "@/modules/auth/client-context";
import { UserRole } from "@/modules/auth/types";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, UserCheck, AlertTriangle } from "lucide-react";

export function AppHeader() {
  const { currentRole, setRole, isAdmin } = useDemoAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm/50">
      {/* Left: Product title & Demo Banner */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 tracking-tight text-lg">
            Mess<span className="text-teal-600">Mind</span>
          </span>
          <span className="text-xs text-slate-400 font-normal hidden sm:inline">
            | Hostel Food-Demand Intelligence
          </span>
        </div>

        {/* Demo Disclaimer Badge */}
        <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200/80 px-2.5 py-1 rounded-full text-xs text-amber-900 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Demo environment — simulated data</span>
        </div>
      </div>

      {/* Right: Role Switcher (Development/Demo Mechanism only) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setRole("MESS_MANAGER")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              currentRole === "MESS_MANAGER"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Switch to Mess Manager role preview"
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Mess Manager</span>
          </button>

          <button
            onClick={() => setRole("HOSTEL_ADMIN")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              currentRole === "HOSTEL_ADMIN"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Switch to Hostel Admin role preview"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Hostel Admin</span>
          </button>
        </div>

        {/* User Pill */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-teal-400 font-semibold text-xs flex items-center justify-center">
            {isAdmin ? "HA" : "MM"}
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-900">
              {isAdmin ? "Hostel Admin" : "Mess Manager"}
            </div>
            <div className="text-[10px] text-slate-500">
              {isAdmin ? "All Privileges" : "Operations & Outcomes"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
