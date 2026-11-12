"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { DemoContextValue } from "./types";
import { isStaticDemoMode } from "./config";
import { DemoSimulationController } from "./simulation-controller";

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({
  children,
  forcedDemoMode,
}: {
  children: React.ReactNode;
  forcedDemoMode?: boolean;
}) {
  const isDemo = forcedDemoMode ?? isStaticDemoMode();
  const [controller] = useState(() => new DemoSimulationController(isDemo));

  // Sync forcedDemoMode prop updates if changed dynamically
  useEffect(() => {
    if (forcedDemoMode !== undefined) {
      controller.setDemoMode(forcedDemoMode);
    }
  }, [forcedDemoMode, controller]);

  // Subscribe to reactive controller updates without tearing or stale state
  const state = useSyncExternalStore(
    controller.subscribe.bind(controller),
    controller.getState.bind(controller),
    controller.getState.bind(controller)
  );

  const value: DemoContextValue = useMemo(
    () => ({
      ...state,
      simulateScans: controller.simulateScans.bind(controller),
      resetSimulation: controller.resetSimulation.bind(controller),
      syncScanner: controller.syncScanner.bind(controller),
      recordOutcome: controller.recordOutcome.bind(controller),
      recalculatePrediction: controller.recalculatePrediction.bind(controller),
      setActiveRole: controller.setActiveRole.bind(controller),
      clearFeedbackNotice: controller.clearFeedbackNotice.bind(controller),
    }),
    [state, controller]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoContext(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemoContext must be used within a DemoProvider");
  }
  return context;
}

export function useOptionalDemoContext(): DemoContextValue | null {
  return useContext(DemoContext);
}
