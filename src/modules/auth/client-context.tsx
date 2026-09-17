"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole } from "./types";

interface DemoAuthContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  isAdmin: boolean;
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

const DEMO_ROLE_STORAGE_KEY = "messmind_demo_role";

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>("MESS_MANAGER");

  useEffect(() => {
    const saved = localStorage.getItem(DEMO_ROLE_STORAGE_KEY) as UserRole | null;
    if (saved === "HOSTEL_ADMIN" || saved === "MESS_MANAGER") {
      setCurrentRole(saved);
    }
  }, []);

  const setRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role);
    // Refresh document cookie or trigger soft revalidation if needed
    document.cookie = `messmind_demo_role=${role}; path=/; max-age=86400; SameSite=Lax`;
  };

  return (
    <DemoAuthContext.Provider
      value={{
        currentRole,
        setRole,
        isAdmin: currentRole === "HOSTEL_ADMIN",
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext);
  if (!context) {
    throw new Error("useDemoAuth must be used within a DemoAuthProvider");
  }
  return context;
}
