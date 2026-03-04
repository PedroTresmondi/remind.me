import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { ExportSettings } from "@/components/settings/ExportSettings";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .single();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-xl font-semibold text-[var(--foreground)]">
        Configurações
      </h1>

      {/* Aparência */}
      <section className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4">
        <AppearanceSettings />
      </section>

      {/* Data e hora */}
      <section className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4">
        <h2 className="text-sm font-medium text-[var(--foreground)] mb-2">
          Data e hora
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Hora padrão para lembretes: {settings?.default_reminder_time ?? "09:00"}
        </p>
        <p className="text-sm text-[var(--muted)]">
          Timezone: {settings?.timezone ?? "America/Sao_Paulo"}
        </p>
        <p className="text-xs text-[var(--muted)] mt-1">
          (Edição em breve)
        </p>
      </section>

      {/* Notificações */}
      <section className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4">
        <NotificationsSettings />
      </section>

      {/* Integrações */}
      <section className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4">
        <h2 className="text-sm font-medium text-[var(--foreground)] mb-2">
          Integrações
        </h2>
        <p className="text-sm">
          <Link href="/dashboard/integrations/github" className="text-[var(--accent)] hover:underline">
            GitHub — automação com commits e releases
          </Link>
        </p>
      </section>

      {/* Backup / Exportar dados */}
      <section className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4">
        <ExportSettings />
      </section>

      <section className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4">
        <h2 className="text-sm font-medium text-[var(--foreground)] mb-2">
          Ajuda
        </h2>
        <p className="text-sm">
          <Link href="/dashboard/shortcuts" className="text-[var(--accent)] hover:underline">
            Atalhos de teclado — Q, /, N, Esc
          </Link>
        </p>
      </section>
    </div>
  );
}
