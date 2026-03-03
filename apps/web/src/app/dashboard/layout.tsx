import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold text-teal-700 dark:text-teal-400">
          Remind.me
        </Link>
        <div className="flex gap-4">
          <Link href="/dashboard" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-teal-600">
            Início
          </Link>
          <Link href="/dashboard/projects" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-teal-600">
            Projetos
          </Link>
          <Link href="/dashboard/tasks" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-teal-600">
            Tarefas
          </Link>
          <Link href="/dashboard/calendar" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-teal-600">
            Calendário
          </Link>
          <Link href="/dashboard/settings" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-teal-600">
            Config
          </Link>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="text-sm text-neutral-500 hover:text-red-600">
              Sair
            </button>
          </form>
        </div>
      </nav>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
