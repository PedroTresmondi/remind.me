"use client";

import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

export type FabAction = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
};

const defaultIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export interface FabProps {
  actions: FabAction[];
  icon?: React.ReactNode;
  className?: string;
}

export function Fab({ actions, icon = defaultIcon, className = "" }: FabProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [open]);

  return (
    <div
      ref={ref}
      className={`fixed z-30 flex flex-col items-end gap-2 ${
        isMobile
          ? "right-4 bottom-6 pb-[env(safe-area-inset-bottom)]"
          : "right-6 bottom-6"
      } ${className}`}
    >
      {open && (
        <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--shadow-lg)] py-1 min-w-[180px]">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                a.onClick();
                setOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors min-h-[var(--touch-min)]"
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[var(--shadow-lg)] hover:bg-[var(--accent-hover)] active:scale-95 transition-all min-w-[var(--touch-min)] min-h-[var(--touch-min)]"
        aria-label={open ? "Fechar menu" : "Adicionar"}
        aria-expanded={open}
      >
        {icon}
      </button>
    </div>
  );
}
