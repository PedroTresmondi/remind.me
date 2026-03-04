"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Hoje" },
  { href: "/dashboard/projects", label: "Projetos" },
  { href: "/dashboard/tasks", label: "Tarefas" },
  { href: "/dashboard/calendar", label: "Calendário" },
  { href: "/dashboard/settings", label: "Config" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
      {links.map(({ href, label }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            {label}
          </Link>
        );
      })}
      <form action="/api/auth/signout" method="post" className="inline">
        <button
          type="submit"
          className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
