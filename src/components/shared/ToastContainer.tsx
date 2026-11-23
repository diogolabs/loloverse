"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { ToastItem } from "@/types";

const VARIANT_STYLES: Record<
  ToastItem["variant"],
  { bg: string; icon: React.ReactNode }
> = {
  success: {
    bg: "bg-[#10B981] text-zinc-950",
    icon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
  },
  warning: {
    bg: "bg-[#FACC15] text-zinc-950",
    icon: <Sparkles className="w-5 h-5 shrink-0" />,
  },
  danger: {
    bg: "bg-[#F43F5E] text-white",
    icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
  },
  info: {
    bg: "bg-[#3B82F6] text-white",
    icon: <Info className="w-5 h-5 shrink-0" />,
  },
};

export function ToastContainer() {
  const { toasts, dismissToast } = useLoloverse();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)]"
    >
      {toasts.map((toast) => {
        const style = VARIANT_STYLES[toast.variant];
        return (
          <div
            key={toast.id}
            className={`animate-slide-in-right flex items-start gap-3 p-3.5 rounded-xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] ${style.bg}`}
          >
            <div className="mt-0.5">{style.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-hand text-lg leading-tight font-bold">
                {toast.title}
              </p>
              {toast.description && (
                <p className="text-xs font-medium opacity-95 mt-0.5">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="p-0.5 rounded-md hover:bg-black/10 transition-colors"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
