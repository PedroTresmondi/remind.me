"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      setLoading(false);
      router.refresh();
      window.location.href = "/dashboard";
    } catch (err) {
      setLoading(false);
      setMessage(err instanceof Error ? err.message : "Erro ao entrar. Tente de novo.");
    }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      setLoading(false);
      setMessage("Confirme seu e-mail e faça login.");
    } catch (err) {
      setLoading(false);
      setMessage(err instanceof Error ? err.message : "Erro ao cadastrar. Tente de novo.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-sm card rounded-[var(--radius)] p-8 shadow-[var(--shadow-lg)] space-y-6">
        <h1 className="text-2xl font-semibold text-teal-700 dark:text-teal-400 text-center tracking-tight">
          Remind.me
        </h1>
        <p className="text-sm text-[var(--muted)] text-center -mt-4">
          Organize projetos, tarefas e lembretes
        </p>
        <form className="space-y-4" onSubmit={signIn}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
            required
          />
          {message && (
            <p className="text-sm text-amber-600 dark:text-amber-400" role="alert">
              {message}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
            <button
              type="button"
              onClick={signUp}
              disabled={loading}
              className="flex-1 py-2.5 rounded-[var(--radius-sm)] border-2 border-[var(--accent)] text-[var(--accent)] font-medium text-sm hover:bg-[var(--accent)]/10 transition-colors disabled:opacity-50"
            >
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
