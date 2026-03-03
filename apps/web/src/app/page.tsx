import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-semibold text-teal-700 dark:text-teal-400 mb-2">
        Remind.me
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-center">
        PWA de organização — projetos, tarefas, lembretes e calendário
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
        >
          Dashboard
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg border border-teal-600 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950"
        >
          Entrar
        </Link>
      </div>
    </main>
  );
}
