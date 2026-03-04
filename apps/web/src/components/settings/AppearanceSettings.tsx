"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-[var(--foreground)]">
        Aparência
      </h2>
      <p className="text-sm text-[var(--muted)]">
        Escolha o tema da interface.
      </p>
      <div className="flex flex-wrap gap-2">
        {(["dark", "light", "auto"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            className={`px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
              theme === id
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--muted)]/10 hover:text-[var(--foreground)]"
            }`}
          >
            {id === "dark" ? "Escuro" : id === "light" ? "Claro" : "Automático"}
          </button>
        ))}
      </div>
    </section>
  );
}
