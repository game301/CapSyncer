"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type UserRole = "admin" | "user";

interface PermissionContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
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
  const [role, setRole] = useState<UserRole>("user");

  // Load role from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("userRole") as UserRole;
    if (savedRole === "admin" || savedRole === "user") {
      setRole(savedRole);
    }
  }, []);

  // Save role to localStorage when it changes
  const handleSetRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem("userRole", newRole);
  };

  const permissions = {
    role,
    setRole: handleSetRole,
    canManageProjects: role === "admin",
    canManageCoworkers: role === "admin",
    canDeleteCoworkers: false, // No one can delete coworkers
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
