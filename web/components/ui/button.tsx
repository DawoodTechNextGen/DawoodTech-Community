"use client";

import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "ghost" | "danger";
}

export function Button({
  loading,
  variant = "primary",
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary:
      "bg-brand text-brand-foreground shadow-lg shadow-brand/25 hover:brightness-110 active:scale-[0.98]",
    ghost: "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className ?? ""}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
