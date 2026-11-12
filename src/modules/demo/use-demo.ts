"use client";

import { useOptionalDemoContext } from "./demo-context";
import { isStaticDemoMode } from "./config";
import { DemoContextValue } from "./types";

/**
 * Hook to access reactive client demo state and simulation operations.
 *
 * In static demo mode (NEXT_PUBLIC_DEMO_MODE=true), provides direct access to
 * the shared DemoContext.
 *
 * If invoked outside a DemoProvider in full-stack mode, gracefully returns a safe fallback
 * with isDemoMode = false so components can safely branch to server actions without crashing.
 */
export function useDemo(): {
  isDemoMode: boolean;
  demo: DemoContextValue | null;
} {
  const context = useOptionalDemoContext();
  const isDemo = context?.isDemoMode ?? isStaticDemoMode();

  return {
    isDemoMode: isDemo,
    demo: context,
  };
}
