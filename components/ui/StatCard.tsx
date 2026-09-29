import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  variant?: "cyan" | "gold" | "emerald" | "purple" | "default";
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "cyan",
  className,
}) => {
  const variantStyles = {
    cyan: "border-cyan-500/30 shadow-[0_0_20px_rgba(0,229,255,0.08)] group-hover:border-cyan-400/50",
    gold: "border-amber-500/30 shadow-[0_0_20px_rgba(255,183,3,0.08)] group-hover:border-amber-400/50",
    emerald: "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)] group-hover:border-emerald-400/50",
    purple: "border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.08)] group-hover:border-purple-400/50",
    default: "border-white/10 group-hover:border-white/20",
  };

  const iconBgStyles = {
    cyan: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    gold: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    default: "bg-surface-light text-gray-300 border border-white/10",
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-surface-card/90 p-6 backdrop-blur-xl border transition-all duration-300 hover:translate-y-[-2px]",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {title}
          </p>
          <div className="mt-2 text-3xl font-extrabold text-white tracking-tight font-mono">
            {value}
          </div>
          {(subtitle || trend) && (
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              {trend && (
                <span className="font-semibold text-emerald-400">{trend}</span>
              )}
              {subtitle && <span className="text-gray-400">{subtitle}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 duration-300",
              iconBgStyles[variant]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
