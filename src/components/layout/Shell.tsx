"use client";

import React from "react";
import { DemoAuthProvider } from "@/modules/auth/client-context";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <DemoAuthProvider>
      <div className="min-h-screen flex bg-slate-50 text-slate-900">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </DemoAuthProvider>
  );
}
