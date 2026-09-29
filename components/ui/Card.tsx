import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glow = false,
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface-card/90 border border-white/10 p-6 backdrop-blur-xl shadow-xl transition-all duration-300",
        glow && "border-cyan-500/40 shadow-[0_0_30px_rgba(0,229,255,0.12)]",
        hoverEffect && "hover:border-white/20 hover:shadow-2xl hover:translate-y-[-2px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
