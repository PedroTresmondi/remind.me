import "jsr:@supabase/functions-js/edge_runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalizeText(s).split(" ").filter(Boolean);
}

function scoreContains(targetNorm: string, sourceNorm: string): number {
  if (!sourceNorm || !targetNorm) return 0;
  return sourceNorm.includes(targetNorm) ? 95 : 0;
}

function scoreAllTokens(targetTokens: string[], sourceNorm: string): number {
  if (targetTokens.length === 0) return 0;
  const found = targetTokens.filter((t) => sourceNorm.includes(t)).length;
  return Math.round((found / targetTokens.length) * 85);
}

function scoreExplicitTag(targetNorm: string, source: string): number {
  const tag = "#todo:" + targetNorm.replace(/\s+/g, "-");
  return source.toLowerCase().includes(tag) ? 100 : 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const event = req.headers.get("X-GitHub-Event");
  const deliveryId = req.headers.get("X-GitHub-Delivery");
  const sig = req.headers.get("X-Hub-Signature-256");

  if (!deliveryId || !event) {
    return new Response("Missing headers", { status: 400 });
  }

  const body = await req.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const repo = payload.repository as { full_name?: string; name?: string; owner?: { login?: string } };
  const repoFullName = repo?.full_name ?? (repo?.owner?.login && repo?.name ? `${repo.owner.login}/${repo.name}` : "");
  if (!repoFullName) {
    return new Response("No repo", { status: 400 });
  }

  const { data: repoRow } = await supabase
    .from("github_repos")
    .select("id, webhook_secret_hash")
    .eq("full_name", repoFullName)
    .single();

  if (repoRow?.webhook_secret_hash && sig) {
    const secret = Deno.env.get("GITHUB_WEBHOOK_SECRET_" + repoRow.id.replace(/-/g, "_")) ?? repoRow.webhook_secret_hash;
    const [algo, hash] = sig.split("=");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigPayload = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(body)
    );
    const hex = Array.from(new Uint8Array(sigPayload))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (algo !== "sha256" || hex !== hash) {
      return new Response("Invalid signature", { status: 401 });
    }
  }

  const eventType = event === "push" ? "push" : event === "release" ? "release" : null;
  if (!eventType) {
    return new Response(JSON.stringify({ ok: true, skipped: "event type" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  if (!repoRow?.id) {
    return new Response(JSON.stringify({ ok: true, skipped: "repo not linked" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  const { data: logRow, error: logErr } = await supabase
    .from("github_events_log")
    .insert({
      github_delivery_id: deliveryId,
      github_event: eventType,
      repo_full_name: repoFullName,
      action: (payload as { action?: string }).action,
      payload: payload as object,
    })
    .select("id")
    .single();

  if (logErr) {
    return new Response(JSON.stringify({ error: logErr.message }), { status: 500 });
  }

  let texts: string[] = [];
  if (eventType === "push") {
    const commits = (payload as { commits?: { message?: string }[] }).commits ?? [];
    texts = commits.map((c) => c.message ?? "").filter(Boolean);
  } else if (eventType === "release") {
    const r = (payload as { release?: { name?: string; body?: string; tag_name?: string } }).release;
    if (r) {
      texts = [r.name ?? "", r.body ?? "", r.tag_name ?? ""].filter(Boolean);
    }
  }

  const combined = texts.join(" ");
  const combinedNorm = normalizeText(combined);

  const { data: rules } = await supabase
    .from("github_task_rules")
    .select("id, user_id, task_id, task_item_id, normalized_target_phrase, match_mode, min_score, action_mode")
    .eq("github_repo_id", repoRow.id)
    .eq("is_active", true);

  if (!rules?.length) {
    await supabase.from("github_events_log").update({ processed_at: new Date().toISOString() }).eq("id", logRow.id);
    return new Response(JSON.stringify({ ok: true, rules: 0 }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  for (const rule of rules) {
    const targetNorm = rule.normalized_target_phrase;
    const targetTokens = tokenize(targetNorm);
    let score = 0;
    score = Math.max(score, scoreExplicitTag(targetNorm, combined));
    if (score === 0) score = Math.max(score, scoreContains(targetNorm, combinedNorm));
    if (score === 0) score = Math.max(score, scoreAllTokens(targetTokens, combinedNorm));

    if (score < rule.min_score) continue;

    const { error: matchErr } = await supabase.from("github_matches").upsert(
      {
        github_event_log_id: logRow.id,
        github_task_rule_id: rule.id,
        matched_text: combined.slice(0, 500),
        score,
        applied: score >= 85 && rule.action_mode === "auto_tick",
        applied_at: score >= 85 && rule.action_mode === "auto_tick" ? new Date().toISOString() : null,
        reason: score >= 85 ? "auto_tick" : "suggest_only",
      },
      { onConflict: "github_event_log_id,github_task_rule_id" }
    );
    if (matchErr) continue;

    if (score >= 85 && rule.action_mode === "auto_tick") {
      if (rule.task_item_id) {
        await supabase
          .from("task_items")
          .update({ is_done: true, done_at: new Date().toISOString() })
          .eq("id", rule.task_item_id);
      } else if (rule.task_id) {
        await supabase
          .from("tasks")
          .update({ status: "done", completed_at: new Date().toISOString() })
          .eq("id", rule.task_id);
      }
      await supabase.from("task_automation_audit").insert({
        user_id: rule.user_id,
        task_id: rule.task_id,
        task_item_id: rule.task_item_id,
        source: "github_" + eventType,
        message: "Item marcado automaticamente por match GitHub",
        metadata: { score, repo: repoFullName },
      });
    }
  }

  await supabase.from("github_events_log").update({ processed_at: new Date().toISOString() }).eq("id", logRow.id);

  return new Response(JSON.stringify({ ok: true, rules: rules.length }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
