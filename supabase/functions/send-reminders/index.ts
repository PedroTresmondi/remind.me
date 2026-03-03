import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { webpush } from "https://esm.sh/web-push@3.6.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(
  "mailto:remind@example.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  vapidPrivateKey
);

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: reminders } = await supabase
    .from("reminders")
    .select("id, user_id, entity_type, entity_id, trigger_at")
    .eq("status", "pending")
    .lte("trigger_at", new Date().toISOString());

  if (!reminders?.length) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  let sent = 0;
  for (const rem of reminders) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", rem.user_id)
      .eq("is_active", true);

    const payload = JSON.stringify({
      title: "Lembrete",
      body: `Lembrete agendado para ${new Date(rem.trigger_at).toLocaleString("pt-BR")}`,
      tag: rem.id,
      url: "/dashboard/tasks/" + rem.entity_id,
    });

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent++;
        await supabase
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("endpoint", sub.endpoint);
      } catch (e) {
        console.error("Push failed", sub.endpoint, e);
      }
    }

    await supabase
      .from("reminders")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", rem.id);
  }

  return new Response(JSON.stringify({ processed: reminders.length, sent }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
