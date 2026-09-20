"use client";

import React from "react";
import { DemoAuthProvider } from "@/modules/auth/client-context";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <DemoAuthProvider>
      <div className="min-h-screen flex bg-cream-100 text-charcoal-900 overflow-x-hidden max-w-[100vw]">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 max-w-full">
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl w-full mx-auto animate-fade-up min-w-0">
            {children}
          </main>
        </div>
      </div>
    </DemoAuthProvider>
  );
}
