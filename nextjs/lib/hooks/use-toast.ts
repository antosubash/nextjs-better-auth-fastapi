"use client";

import { toast as sonnerToast } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
  duration?: number;
  description?: string;
}

export function useToast() {
  const toast = {
    success: (message: string, options?: ToastOptions) => {
      return sonnerToast.success(message, {
        description: options?.description,
        duration: options?.duration ?? 4000,
      });
    },
    error: (message: string, options?: ToastOptions) => {
      return sonnerToast.error(message, {
        description: options?.description,
        duration: options?.duration ?? 5000,
      });
    },
    info: (message: string, options?: ToastOptions) => {
      return sonnerToast.info(message, {
        description: options?.description,
        duration: options?.duration ?? 4000,
      });
    },
    warning: (message: string, options?: ToastOptions) => {
      return sonnerToast.warning(message, {
        description: options?.description,
        duration: options?.duration ?? 4000,
      });
    },
  };

  return toast;
}
