"use client";
import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, Info } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "gold";
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "primary",
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex flex-col items-center text-center">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl mb-4 ${
            variant === "danger"
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
              : variant === "gold"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(255,183,3,0.2)]"
              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,229,255,0.2)]"
          }`}
        >
          {variant === "danger" ? (
            <AlertTriangle className="h-7 w-7" />
          ) : (
            <Info className="h-7 w-7" />
          )}
        </div>

        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <div className="text-sm text-gray-300 mb-6">{description}</div>

        <div className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "danger" : variant === "gold" ? "gold" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
