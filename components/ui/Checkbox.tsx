import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked,
  onChange,
  label,
  error,
  disabled = false,
  className,
}) => {
  const checkboxId = id || Math.random().toString(36).substring(2, 9);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={checkboxId}
        className={cn(
          "flex items-start gap-3 cursor-pointer select-none group",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={(e) => !disabled && onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only"
          />
          <div
            className={cn(
              "w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200",
              checked
                ? "bg-primary border-primary text-black shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                : "border-gray-500 bg-surface group-hover:border-primary/60",
              disabled && "bg-gray-800 border-gray-700"
            )}
          >
            {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>
        <span className="text-sm text-gray-300 leading-snug group-hover:text-white transition-colors">
          {label}
        </span>
      </label>
      {error && <p className="text-xs text-rose-400 font-medium pl-8">{error}</p>}
    </div>
  );
};
