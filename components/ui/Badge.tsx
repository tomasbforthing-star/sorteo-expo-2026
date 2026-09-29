import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "cyan" | "emerald" | "amber" | "rose" | "slate" | "purple";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "slate",
  size = "md",
  dot = false,
  className,
}) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold gap-1.5 rounded-full",
    md: "px-2.5 py-1 text-xs font-semibold gap-2 rounded-full",
  };

  const variantClasses = {
    cyan: "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,229,255,0.1)]",
    emerald: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    amber: "bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
    rose: "bg-rose-500/10 text-rose-300 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]",
    slate: "bg-gray-800/60 text-gray-300 border border-gray-700",
    purple: "bg-purple-500/10 text-purple-300 border border-purple-500/30",
  };

  const dotClasses = {
    cyan: "bg-cyan-400 animate-pulse",
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
    slate: "bg-gray-400",
    purple: "bg-purple-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center tracking-wide uppercase select-none",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dotClasses[variant])} />}
      {children}
    </span>
  );
};
