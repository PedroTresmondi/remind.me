"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

type ToastItem = {
  id: number;
  message: string;
  undoLabel: string;
  onUndo: () => void;
};

type ToastContextValue = {
  show: (opts: { message: string; undoLabel?: string; onUndo?: () => void }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((toastId: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
    const t = timeoutRef.current.get(toastId);
    if (t) {
      clearTimeout(t);
      timeoutRef.current.delete(toastId);
    }
  }, []);

  const show = useCallback(
    (opts: { message: string; undoLabel?: string; onUndo?: () => void }) => {
      const toastId = ++id;
      const item: ToastItem = {
        id: toastId,
        message: opts.message,
        undoLabel: opts.undoLabel ?? "Desfazer",
        onUndo: opts.onUndo ?? (() => {}),
      };
      setToasts((prev) => [...prev, item]);
      const t = setTimeout(() => dismiss(toastId), 6000);
      timeoutRef.current.set(toastId, t);
    },
    [dismiss]
  );

  const toastContainer =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-md px-4 box-border"
            style={{ pointerEvents: "none" }}
            aria-live="polite"
          >
            <div className="flex flex-col gap-2" style={{ pointerEvents: "auto" }}>
              {toasts.map((toast) => (
                <div
                  key={toast.id}
                  className="toast-in flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--shadow-lg)] px-4 py-3 text-left"
                >
                  <span className="text-sm text-[var(--foreground)] flex-1 min-w-0">
                    {toast.message}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      toast.onUndo();
                      dismiss(toast.id);
                    }}
                    className="shrink-0 text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    {toast.undoLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    className="shrink-0 p-1 rounded-[var(--radius-sm)] text-[var(--muted)] hover:bg-[var(--muted)]/20"
                    aria-label="Fechar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toastContainer}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { show: () => {} };
  return ctx;
}
