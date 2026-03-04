"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; name: string; color: string };

export function ProjectsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!open) return;
    createClient()
      .from("projects")
      .select("id, name, color")
      .order("name")
      .then(({ data }) => setProjects(data ?? []));
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[var(--card)] border-l border-[var(--card-border)] shadow-[var(--shadow-lg)] flex flex-col"
        role="dialog"
        aria-label="Projetos"
      >
        <div className="flex items-center justify-between shrink-0 border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Projetos</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-[var(--radius-sm)] text-[var(--muted)] hover:bg-[var(--muted)]/20 hover:text-[var(--foreground)] transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/projects/${p.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] hover:bg-[var(--muted)]/10 transition-colors"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: p.color || "var(--muted)" }}
                  />
                  <span className="text-[var(--foreground)]">{p.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
            <Link
              href="/dashboard/projects"
              onClick={onClose}
              className="block w-full py-2.5 rounded-[var(--radius-sm)] border-2 border-dashed border-[var(--card-border)] text-center text-sm font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              Gerenciar projetos
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
