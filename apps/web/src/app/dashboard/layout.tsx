import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const GET_USER_TIMEOUT_MS = 5000;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  let user: { id: string } | null = null;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<{ data: { user: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null } }), GET_USER_TIMEOUT_MS)
      ),
    ]);
    user = result.data?.user ?? null;
  } catch {
    user = null;
  }
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <nav className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--card)]/95 backdrop-blur-md shadow-[var(--shadow)] px-3 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link
            href="/dashboard"
            className="font-semibold text-teal-700 dark:text-teal-400 text-base tracking-tight hover:text-teal-800 dark:hover:text-teal-300 transition-colors"
          >
            Remind.me
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/dashboard/calendar"
              className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--muted)]/10 hover:text-[var(--foreground)] transition-colors"
            >
              Calendário
            </Link>
            <Link
              href="/dashboard/settings"
              className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--muted)]/10 hover:text-[var(--foreground)] transition-colors"
            >
              Config
            </Link>
            <form action="/api/auth/signout" method="post" className="inline">
              <button
                type="submit"
                className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">{children}</main>
    </div>
  );
}
