"use client";
import { useState } from "react";
import { usePermissions } from "../contexts/PermissionContext";
import { RoleSwitcher } from "./RoleSwitcher";

export function UserSettings() {
  const { userName, setUserName } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTempName(userName);
    setIsEditing(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span>{userName || "Set Name"}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-xl z-50">
            {/* User Name Section */}
            <div className="mb-4 border-b border-slate-700 pb-4">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Your Name
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-white">
                    {userName || (
                      <span className="italic text-slate-500">Not set</span>
                    )}
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rounded px-2 py-1 text-xs text-blue-400 hover:bg-slate-700"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Role Switcher Section */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Role
              </label>
              <RoleSwitcher />
            </div>

            {/* Info Note */}
            <div className="mt-4 rounded-lg bg-blue-900/20 border border-blue-800/30 p-3">
              <p className="text-xs text-slate-400">
                💡 Your name will be tracked when you assign tasks. This will be replaced with Azure AD authentication in the future.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
