import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  prefixText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      prefixText,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-gray-300 tracking-wider uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center rounded-xl bg-[#131622] border border-white/15 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/25 transition-all duration-200 shadow-inner">
          {leftIcon && (
            <div className="pl-3.5 pr-1 text-gray-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          {prefixText && (
            <span className="pl-3.5 pr-1 text-cyan-400 font-mono font-bold select-none text-base">
              {prefixText}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full bg-[#131622] px-4 py-3.5 text-sm text-white placeholder:text-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-xl",
              leftIcon && "pl-2",
              prefixText && "pl-1.5",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
