"use client";

import { useState } from "react";

export function ExportSettings() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Falha ao exportar");
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `remind-me-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao exportar dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-sm font-medium text-[var(--foreground)] mb-2">
        Backup dos dados
      </h2>
      <p className="text-sm text-[var(--muted)] mb-3">
        Baixe uma cópia das suas tarefas, eventos, projetos e configurações em
        JSON. Útil para backup ou migração.
      </p>
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Exportando…" : "Exportar meus dados (JSON)"}
      </button>
    </div>
  );
}
