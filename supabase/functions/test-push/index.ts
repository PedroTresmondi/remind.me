import "jsr:@supabase/functions-js/edge_runtime.d.ts";
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

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing Bearer token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const token = authHeader.slice(7);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  if (!subs?.length) {
    return new Response(JSON.stringify({ error: "No subscription" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = JSON.stringify({
    title: "Remind.me",
    body: "Notificação de teste",
    tag: "test-push",
    url: "/dashboard/settings",
  });

  try {
    await webpush.sendNotification(
      { endpoint: subs[0].endpoint, keys: { p256dh: subs[0].p256dh, auth: subs[0].auth } },
      payload
    );
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
