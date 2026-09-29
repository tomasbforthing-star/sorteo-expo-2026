import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost" | "glow" | "gold";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5 font-medium",
      md: "h-10 px-4 text-sm rounded-xl gap-2 font-semibold",
      lg: "h-12 px-6 text-base rounded-xl gap-2.5 font-bold",
      xl: "h-14 px-8 text-lg rounded-2xl gap-3 font-extrabold tracking-wide",
    };

    const variantClasses = {
      primary:
        "bg-primary text-black hover:bg-primary-hover active:scale-[0.98] shadow-lg shadow-cyan-500/20 border border-cyan-400/40",
      glow:
        "bg-gradient-to-r from-cyan-500 to-teal-400 text-black hover:from-cyan-400 hover:to-teal-300 active:scale-[0.98] shadow-[0_0_25px_rgba(0,229,255,0.4)] font-bold border border-cyan-300/50",
      gold:
        "bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-black hover:from-amber-300 hover:to-yellow-400 active:scale-[0.98] shadow-[0_0_30px_rgba(255,183,3,0.45)] font-black border border-amber-200",
      secondary:
        "bg-surface-light hover:bg-[#282e3d] text-white border border-white/10 active:scale-[0.98]",
      danger:
        "bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white shadow-lg shadow-rose-900/30 border border-rose-500/30",
      outline:
        "bg-transparent hover:bg-white/5 text-gray-200 border border-white/20 active:scale-[0.98]",
      ghost:
        "bg-transparent hover:bg-white/5 text-gray-300 hover:text-white active:scale-[0.98]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
