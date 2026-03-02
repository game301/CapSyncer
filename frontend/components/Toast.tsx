"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose?: () => void;
  index?: number;
}

export function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
  index = 0,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        setTimeout(onClose, 300); // Wait for fade-out animation
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: "bg-green-600 border-green-500",
    error: "bg-red-600 border-red-500",
    info: "bg-blue-600 border-blue-500",
    warning: "bg-yellow-600 border-yellow-500",
  };

  const icons = {
    success: (
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
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    error: (
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
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    info: (
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
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    warning: (
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
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  };

  const bottomPosition = 16 + index * 72; // 16px base (bottom-4) + 72px spacing per toast

  return (
    <div
      style={{ bottom: `${bottomPosition}px` }}
      className={`fixed right-4 z-50 transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`flex items-center gap-3 rounded-lg border ${colors[type]} px-4 py-3 text-white shadow-lg min-w-75 max-w-md`}
      >
        <div className="shrink-0">{icons[type]}</div>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <Button
          onClick={() => {
            setIsVisible(false);
            if (onClose) {
              setTimeout(onClose, 300);
            }
          }}
          variant="secondary"
          size="icon"
          className="shrink-0 bg-transparent hover:bg-white/10"
          icon={
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          }
        />
      </div>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: number }>>([]);

  const showToast = (toast: ToastProps) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
  };
}
