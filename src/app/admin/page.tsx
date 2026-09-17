"use client";

import { useDemoAuth } from "@/modules/auth/client-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, ShieldAlert, Users, BookOpen, Sliders, History } from "lucide-react";

export default function AdminPage() {
  const { currentRole, isAdmin, setRole } = useDemoAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hostel Administration</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure system parameters, manage residents and menus, and review security audit logs.
          </p>
        </div>
        <Badge variant={isAdmin ? "navy" : "amber"}>
          {isAdmin ? "Hostel Admin Mode" : "Preview Restricted"}
        </Badge>
      </div>

      {/* Role State Alert */}
      {!isAdmin ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-900">
                Hostel Admin Access Only
              </div>
              <div className="text-xs text-amber-700 mt-0.5">
                Your current preview role is <strong className="font-semibold">Mess Manager</strong>. Administrative controls (resident management, algorithm tuning, and security logs) require <strong className="font-semibold">Hostel Admin</strong> privileges.
              </div>
            </div>
          </div>
          <button
            onClick={() => setRole("HOSTEL_ADMIN")}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex-shrink-0 transition-colors"
          >
            Switch to Admin Role
          </button>
        </div>
      ) : (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-xs text-teal-900">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>
            Logged in as <strong className="font-semibold">Hostel Admin</strong>. You have full access to management utilities and configuration settings.
          </span>
        </div>
      )}

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resident Management */}
        <Card className={!isAdmin ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Resident Management</span>
            </CardTitle>
            <CardDescription>Synthetic cohort controls (125 total residents)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100 flex justify-between">
                <span>Student Residents:</span>
                <span className="font-semibold text-slate-900">50 synthetic records</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100 flex justify-between">
                <span>Corporate Residents:</span>
                <span className="font-semibold text-slate-900">75 synthetic records</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Management */}
        <Card className={!isAdmin ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>Menu Catalog & Schedules</span>
            </CardTitle>
            <CardDescription>Configure breakfast, lunch, and dinner menus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs text-slate-600">
              Menu items and categories feed directly into the bounded menu appeal adjustment engine (±10% max).
            </div>
          </CardContent>
        </Card>

        {/* Prediction Settings */}
        <Card className={!isAdmin ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              <span>Prediction Engine Parameters</span>
            </CardTitle>
            <CardDescription>Buffer sizing & waste risk thresholds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100 flex justify-between">
                <span>Preparation Buffer:</span>
                <span className="font-semibold text-slate-900">5.0% (Default)</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100 flex justify-between">
                <span>High Waste Risk Threshold:</span>
                <span className="font-semibold text-slate-900">&gt;20.0% over-preparation</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit & Security Log */}
        <Card className={!isAdmin ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              <span>Audit & Security Logging</span>
            </CardTitle>
            <CardDescription>Server-side immutable log of management actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs text-slate-600">
              Captures outcome submissions, configuration updates, and permission checks.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
