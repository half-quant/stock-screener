"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (opts: { title: string; description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const variantStyles: Record<ToastVariant, string> = {
  success:
    "border-emerald-500/30 bg-emerald-950/90 text-emerald-100",
  error:
    "border-red-500/30 bg-red-950/90 text-red-100",
  info:
    "border-blue-500/30 bg-blue-950/90 text-blue-100",
};

const variantTitleStyles: Record<ToastVariant, string> = {
  success: "text-emerald-50",
  error: "text-red-50",
  info: "text-blue-50",
};

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({
      title,
      description,
      variant = "info",
    }: {
      title: string;
      description?: string;
      variant?: ToastVariant;
    }) => {
      const id = `toast-${++toastCounter}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}

        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            open
            onOpenChange={(open) => {
              if (!open) removeToast(t.id);
            }}
            className={cn(
              "rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-full",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-full",
              "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
              "data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform",
              "data-[swipe=end]:animate-out data-[swipe=end]:fade-out-0 data-[swipe=end]:slide-out-to-right-full",
              variantStyles[t.variant]
            )}
          >
            <ToastPrimitive.Title
              className={cn(
                "text-sm font-semibold",
                variantTitleStyles[t.variant]
              )}
            >
              {t.title}
            </ToastPrimitive.Title>

            {t.description && (
              <ToastPrimitive.Description className="mt-1 text-sm opacity-90">
                {t.description}
              </ToastPrimitive.Description>
            )}

            <ToastPrimitive.Close
              className="absolute right-2 top-2 rounded p-1 opacity-50 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-white/30"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}

        <ToastPrimitive.Viewport
          className={cn(
            "fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4",
            "sm:max-w-[420px]"
          )}
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
