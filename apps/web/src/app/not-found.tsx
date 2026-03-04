import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-semibold text-teal-700 dark:text-teal-400 mb-2">
        Página não encontrada
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-center">
        A URL que você acessou não existe.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
