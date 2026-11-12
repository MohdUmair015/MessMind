"use client";

import React, { useState } from "react";
import { useDemoAuth } from "@/modules/auth/client-context";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  BookOpen,
  Sliders,
  History,
  Lock,
  Database,
  CheckCircle2,
  ChevronRight,
  Info,
} from "lucide-react";

export default function AdminPage() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const { currentRole, isAdmin, setRole } = useDemoAuth();
  const [activeTab, setActiveTab] = useState<"governance" | "residents" | "algorithm" | "security">("governance");

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-coral-600">
            System Administration
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-charcoal-950 tracking-tight mt-1">
            Hostel Administration & Governance
          </h1>
          <p className="text-base text-charcoal-600 mt-1">
            Configure system parameters, review population cohorts, and inspect access control policies.
          </p>
        </div>
        <Badge variant={isAdmin ? "charcoal" : "mango"} size="sm" dot>
          {isAdmin ? "Hostel Admin Mode" : "Preview Restricted"}
        </Badge>
      </div>

      {/* Role State Banner */}
      {!isAdmin ? (
        <div className="p-5 rounded-3xl bg-mango-50 border border-mango-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <ShieldAlert className="w-6 h-6 text-mango-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-base font-black text-mango-950">
                Hostel Admin Access Only
              </div>
              <p className="text-xs md:text-sm text-mango-800 mt-0.5 leading-relaxed">
                Your current preview role is <strong>Mess Manager</strong>. Administrative controls require <strong>Hostel Admin</strong> privileges.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRole("HOSTEL_ADMIN")}
            className="px-5 py-2.5 bg-mango-600 hover:bg-mango-700 text-white rounded-xl text-xs font-bold flex-shrink-0 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
          >
            Switch to Admin Role
          </button>
        </div>
      ) : (
        <div className="p-5 rounded-3xl bg-mint-50/80 border border-mint-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs md:text-sm text-mint-950 shadow-2xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-mint-600 flex-shrink-0" />
            <span>
              Authenticated with <strong>Hostel Admin</strong> privileges. Full configuration and governance access active.
            </span>
          </div>
          <span className="text-xs font-black px-3 py-1 bg-mint-200/80 rounded-full text-mint-900 border border-mint-300 self-start sm:self-auto shrink-0">
            RBAC Active
          </span>
        </div>
      )}

      {/* Governance Tabs */}
      <div className="flex flex-wrap gap-2.5 border-b border-surface-border pb-4">
        {[
          { id: "governance", label: "Access Control & Security", icon: Lock },
          { id: "residents", label: "Resident Cohorts", icon: Users },
          { id: "algorithm", label: "Algorithm Parameters", icon: Sliders },
          { id: "security", label: "Audit Log Policy", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isSelected
                  ? "bg-coral-500 text-white shadow-coral-glow"
                  : "bg-white text-charcoal-700 hover:bg-cream-100 border border-surface-border"
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-charcoal-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ACCESS CONTROL & SECURITY */}
      {activeTab === "governance" && (
        <div className="space-y-6">
          <section className="p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border/70">
              <div>
                <h3 className="text-base font-black text-charcoal-900">
                  Role-Based Access Control (RBAC) Matrix
                </h3>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Enforced server-side via session context; role preview switcher allows testing both operational roles
                </p>
              </div>
              <Badge variant="coral" size="xs">
                Server Enforced
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl bg-cream-50 border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-charcoal-900 text-sm">Mess Manager</span>
                  <Badge variant="coral" size="xs">Operational</Badge>
                </div>
                <p className="text-xs md:text-sm text-charcoal-700 leading-relaxed">
                  Authorized to view pre-meal demand forecasts, synchronize dining scanner records, and log physical kitchen leftover audits.
                </p>
                <div className="pt-3 text-xs text-charcoal-600 space-y-1.5 border-t border-surface-border/70">
                  <div>✓ View Predictions & Recommendations</div>
                  <div>✓ Trigger Dining Scanner Ingestion</div>
                  <div>✓ Record Kitchen Waste Audits</div>
                  <div className="text-charcoal-400">✗ Manage Resident Population</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-cream-50 border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-charcoal-900 text-sm">Hostel Admin</span>
                  <Badge variant="charcoal" size="xs">Governance</Badge>
                </div>
                <p className="text-xs md:text-sm text-charcoal-700 leading-relaxed">
                  Full administrative authority over cohort demographics, preparation safety buffers, waste risk thresholds, and security audit logs.
                </p>
                <div className="pt-3 text-xs text-charcoal-600 space-y-1.5 border-t border-surface-border/70">
                  <div>✓ All Mess Manager Privileges</div>
                  <div>✓ Tune Prediction Buffer Percentage</div>
                  <div>✓ Configure Menu Appeal Modifiers</div>
                  <div>✓ Inspect Server Audit Trail</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-mango-50/80 border border-mango-200 rounded-2xl text-xs text-mango-950 flex items-start gap-3">
              <Info className="w-5 h-5 text-mango-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong>Security Architecture Notice:</strong> In production, authentication connects to AWS Cognito or institutional SSO. Residents do not have access to MessMind and interact exclusively with the resident hostel mobile app.
              </span>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: RESIDENT COHORTS */}
      {activeTab === "residents" && (
        <div className="space-y-6">
          <section className="p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border/70">
              <div>
                <h3 className="text-base font-black text-charcoal-900">
                  Synthetic Resident Population Breakdown
                </h3>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Operates with exactly 125 synthetic residents partitioned across 2 core cohorts
                </p>
              </div>
              <Badge variant="outline" size="xs">
                125 Active Residents
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl bg-cream-50 border border-surface-border space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-charcoal-900">Student Residents</span>
                  <span className="text-2xl font-black text-coral-600 tabular-nums">50</span>
                </div>
                <p className="text-xs md:text-sm text-charcoal-700 leading-relaxed">
                  Higher breakfast attendance consistency and weekday dinner presence; high preference opt-in reliability (85%).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-cream-50 border border-surface-border space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-charcoal-900">Corporate Residents</span>
                  <span className="text-2xl font-black text-coral-600 tabular-nums">75</span>
                </div>
                <p className="text-xs md:text-sm text-charcoal-700 leading-relaxed">
                  Late evening return pattern; dinner-heavy attendance with weekend leaves and higher menu-appeal sensitivity (+5% for specials).
                </p>
              </div>
            </div>

            <p className="text-xs text-charcoal-500 italic">
              * Note: These records are synthetic demo assumptions and must never be presented as real hostel statistics.
            </p>
          </section>
        </div>
      )}

      {/* TAB 3: ALGORITHM PARAMETERS */}
      {activeTab === "algorithm" && (
        <div className="space-y-6">
          <section className="p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border/70">
              <div>
                <h3 className="text-base font-black text-charcoal-900">
                  Deterministic Engine Tunables
                </h3>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Configure safety margins and waste risk classifications
                </p>
              </div>
              <Badge variant="coral" size="xs">
                Active Parameters
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="p-5 rounded-2xl bg-cream-50 border border-surface-border space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-charcoal-900 text-sm">Preparation Buffer Percentage</span>
                  <strong className="text-coral-600 text-base font-black">+5.0%</strong>
                </div>
                <p className="text-xs md:text-sm text-charcoal-700 leading-relaxed">
                  Formula: ceil(Expected Diners × 1.05). Adds a 5% kitchen safety buffer to avoid food shortages during unexpected diner rushes.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-cream-50 border border-surface-border space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-charcoal-900 text-sm">High Waste Risk Threshold</span>
                  <strong className="text-coral-600 text-base font-black">&gt; 20.0%</strong>
                </div>
                <p className="text-xs md:text-sm text-charcoal-700 leading-relaxed">
                  Flags kitchen staff if planned preparation exceeds predicted demand by more than 20%, or if historical waste rates exceed 8%.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: AUDIT LOG POLICY */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <section className="p-8 rounded-3xl bg-white border border-surface-border shadow-warm-card space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border/70">
              <div>
                <h3 className="text-base font-black text-charcoal-900">
                  Server-Side Audit Trail Policy
                </h3>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  {isDemo
                    ? "Simulated audit trail tracking every management action and scanner reconciliation"
                    : "Immutable PostgreSQL records tracking every management action and scanner reconciliation"}
                </p>
              </div>
              <Badge variant="charcoal" size="xs">
                Audit Trail Active
              </Badge>
            </div>

            <div className="space-y-3 text-xs text-charcoal-700 min-w-0">
              <div className="p-4 bg-cream-50 rounded-2xl border border-surface-border flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-charcoal-900 text-sm block break-all sm:break-normal">SYNC_HOSTEL_SCANNER_ATTENDANCE</span>
                  <div className="text-xs text-charcoal-500 mt-0.5 break-words">Captures unique scans, suppressed duplicates, and prediction variance</div>
                </div>
                <Badge variant="mint" size="xs">Automated</Badge>
              </div>

              <div className="p-4 bg-cream-50 rounded-2xl border border-surface-border flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-charcoal-900 text-sm block break-all sm:break-normal">RECORD_MEAL_OUTCOME</span>
                  <div className="text-xs text-charcoal-500 mt-0.5 break-words">Logs physical kitchen leftover and discarded waste audits</div>
                </div>
                <Badge variant="default" size="xs">Manager Log</Badge>
              </div>

              <div className="p-4 bg-cream-50 rounded-2xl border border-surface-border flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-charcoal-900 text-sm block break-all sm:break-normal">RECALCULATE_PREDICTION</span>
                  <div className="text-xs text-charcoal-500 mt-0.5 break-words">Tracks parameter overrides and recalculation timestamps</div>
                </div>
                <Badge variant="coral" size="xs">Admin</Badge>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

