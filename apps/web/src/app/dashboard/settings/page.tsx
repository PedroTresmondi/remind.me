import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .single();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
        Configurações
      </h1>
      <section>
        <h2 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
          Hora padrão para lembretes
        </h2>
        <p className="text-sm text-neutral-500">
          {settings?.default_reminder_time ?? "09:00"} — timezone: {settings?.timezone ?? "America/Sao_Paulo"}
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          (Edição em breve)
        </p>
      </section>
      <NotificationsSettings />
      <p className="text-sm">
        <Link href="/dashboard/integrations/github" className="text-teal-600 dark:text-teal-400">
          Integrações → GitHub
        </Link>
      </p>
    </div>
  );
}
