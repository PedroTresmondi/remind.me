"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
        Algo deu errado
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-center max-w-md">
        Ocorreu um erro ao carregar esta página. Tente novamente.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg border border-teal-600 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950"
        >
          Ir para início
        </Link>
      </div>
    </main>
  );
}
