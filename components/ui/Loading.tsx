import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  text = "Cargando...",
  size = "md",
  className,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-8 text-center",
        className
      )}
    >
      <Loader2
        className={cn("animate-spin text-primary", sizeClasses[size])}
      />
      {text && (
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-mono">
          {text}
        </p>
      )}
    </div>
  );
};
