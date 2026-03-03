"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Confirme seu e-mail e faça login.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-xl font-semibold text-teal-700 dark:text-teal-400 text-center">
          Remind.me
        </h1>
        <form className="space-y-4" onSubmit={signIn}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
            required
          />
          {message && (
            <p className="text-sm text-amber-600 dark:text-amber-400">{message}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={signUp}
              disabled={loading}
              className="flex-1 py-2 rounded-lg border border-teal-600 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950 disabled:opacity-50"
            >
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
