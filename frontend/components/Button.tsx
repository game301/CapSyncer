import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "purple"
    | "outline-primary"
    | "outline-danger"
    | "outline-success";
  size?: "sm" | "md" | "lg" | "icon";
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  icon,
  iconPosition = "left",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-slate-700 text-slate-200 hover:bg-slate-600 focus:ring-slate-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    purple:
      "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500",
    "outline-primary":
      "border border-blue-500 text-blue-400 hover:bg-blue-500/10 focus:ring-blue-500",
    "outline-danger":
      "border border-red-500 text-red-400 hover:bg-red-500/10 focus:ring-red-500",
    "outline-success":
      "border border-green-500 text-green-400 hover:bg-green-500/10 focus:ring-green-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "p-1",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className={children ? "mr-2" : ""}>{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className={children ? "ml-2" : ""}>{icon}</span>
      )}
    </button>
  );
}
