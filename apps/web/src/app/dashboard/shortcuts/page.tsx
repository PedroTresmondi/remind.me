import Link from "next/link";
import { ShortcutsHelp } from "@/components/hub/ShortcutsHelp";

export default function ShortcutsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link
        href="/dashboard"
        className="text-sm text-[var(--accent)] hover:underline mb-4 inline-block"
      >
        ← Voltar ao hub
      </Link>
      <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-6">
        <ShortcutsHelp />
      </div>
    </div>
  );
}
