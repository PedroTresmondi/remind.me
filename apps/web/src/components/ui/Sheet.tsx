"use client";

import { useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  headerLeft?: React.ReactNode;
}

export function Sheet({ open, onClose, title, headerLeft, children }: SheetProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const panelClasses = isMobile
    ? "fixed inset-x-0 bottom-0 z-50 max-h-[90vh] rounded-t-[var(--radius-lg)] border-t border-[var(--card-border)] bg-[var(--card)] shadow-[var(--shadow-lg)] flex flex-col sheet-panel pb-[env(safe-area-inset-bottom)]"
    : "fixed top-0 right-0 z-50 h-full w-full max-w-md border-l border-[var(--card-border)] bg-[var(--card)] shadow-[var(--shadow-lg)] flex flex-col drawer-panel";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className={panelClasses}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Painel"}
      >
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--card-border)] min-h-[var(--touch-min)]">
          <div className="min-w-0 flex-1">{headerLeft}</div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-[var(--radius-sm)] text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)] transition-colors min-w-[var(--touch-min)] min-h-[var(--touch-min)] flex items-center justify-center -mr-2"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
      </aside>
    </>
  );
}
