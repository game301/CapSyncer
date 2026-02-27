"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type UserRole = "admin" | "user";

interface PermissionContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userName: string;
  setUserName: (name: string) => void;
  canManageProjects: boolean;
  canManageCoworkers: boolean;
  canDeleteCoworkers: boolean;
  canManageTasks: boolean;
  canManageAssignments: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined,
);

export function PermissionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize with default values (same for server and client to avoid hydration errors)
  const [role, setRole] = useState<UserRole>("user");
  const [userName, setUserNameState] = useState<string>("");

  // Load from localStorage after mount (client-side only)
  useEffect(() => {
    const savedRole = localStorage.getItem("userRole") as UserRole;
    if (savedRole === "admin" || savedRole === "user") {
      setRole(savedRole);
    }

    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setUserNameState(savedName);
    }
  }, []);

  // Save role to localStorage when it changes
  const handleSetRole = (newRole: UserRole) => {
    setRole(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem("userRole", newRole);
    }
  };

  // Save userName to localStorage when it changes
  const handleSetUserName = (name: string) => {
    setUserNameState(name);
    if (typeof window !== "undefined") {
      localStorage.setItem("userName", name);
    }
  };

  const permissions = {
    role,
    setRole: handleSetRole,
    userName,
    setUserName: handleSetUserName,
    canManageProjects: role === "admin",
    canManageCoworkers: role === "admin",
    canDeleteCoworkers: role === "admin", // Admins can soft-delete coworkers
    canManageTasks: true, // Both roles can manage tasks
    canManageAssignments: true, // Both roles can manage assignments
  };

  return (
    <PermissionContext.Provider value={permissions}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}
