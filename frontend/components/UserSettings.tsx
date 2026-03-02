"use client";
import { useState } from "react";
import { usePermissions } from "../contexts/PermissionContext";
import { RoleSwitcher } from "./RoleSwitcher";
import { Button } from "./Button";

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
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="secondary"
        size="md"
        className="gap-2"
        icon={
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
        }
        iconPosition="left"
      >
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
      </Button>

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
                    <Button
                      onClick={handleSave}
                      variant="primary"
                      size="sm"
                      className="flex-1"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-white">
                    {userName || (
                      <span className="italic text-slate-500">Not set</span>
                    )}
                  </span>
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="primary"
                    size="sm"
                    className="px-2 py-1 text-xs"
                  >
                    Edit
                  </Button>
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
                💡 Your name will be tracked when you assign tasks. This will be
                replaced with Azure AD authentication in the future.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
