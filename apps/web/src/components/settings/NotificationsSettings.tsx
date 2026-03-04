"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type PushStatus = {
  permission: NotificationPermission | "unsupported";
  hasSubscription: boolean;
  loading: boolean;
};

export function NotificationsSettings() {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<PushStatus>({
    permission: "unsupported",
    hasSubscription: false,
    loading: true,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkStatus() {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setStatus({ permission: "unsupported", hasSubscription: false, loading: false });
        return;
      }
      const permission = Notification.permission;
      let hasSubscription = false;
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        hasSubscription = !!sub;
      } catch {
        // ignore
      }
      setStatus({ permission, hasSubscription, loading: false });
    }
    checkStatus();
  }, []);

  async function requestPermissionAndSubscribe() {
    setLoading(true);
    setMessage("");
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setMessage("Seu navegador não suporta notificações ou PWA.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Permissão de notificação negada.");
        setStatus((s) => ({ ...s, permission }));
        setLoading(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setMessage("Você já está inscrito.");
        setStatus((s) => ({ ...s, permission, hasSubscription: true }));
        setLoading(false);
        return;
      }
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        setMessage("Configure NEXT_PUBLIC_VAPID_PUBLIC_KEY para ativar push.");
        return;
      }
      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapid,
      });
      const payload = {
        endpoint: newSub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(newSub.getKey("p256dh")!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(newSub.getKey("auth")!))),
        },
      };
      const { error } = await supabase.from("push_subscriptions").insert({
        endpoint: payload.endpoint,
        p256dh: payload.keys.p256dh,
        auth: payload.keys.auth,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Inscrição salva. Você receberá lembretes.");
      setStatus((s) => ({ ...s, permission, hasSubscription: true }));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function sendTestNotification() {
    setTestLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/notifications/test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage("Notificação de teste enviada. Verifique se chegou.");
      } else {
        setMessage(data.error || "Falha ao enviar. Verifique a Edge Function test-push.");
      }
    } catch (e) {
      setMessage("Erro de rede.");
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-[var(--foreground)]">
        Notificações (Web Push)
      </h2>
      <p className="text-sm text-[var(--muted)]">
        Para receber lembretes no dispositivo, ative as notificações e adicione o app à tela inicial (PWA).
      </p>

      {/* Status */}
      {!status.loading && (
        <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-3 text-sm space-y-1">
          <p>
            <span className="text-[var(--muted)]">Permissão:</span>{" "}
            {status.permission === "unsupported"
              ? "Não suportado"
              : status.permission === "granted"
                ? "Concedida"
                : status.permission === "denied"
                  ? "Negada"
                  : "Não definida"}
          </p>
          <p>
            <span className="text-[var(--muted)]">Inscrição ativa:</span>{" "}
            {status.hasSubscription ? "Sim" : "Não"}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={requestPermissionAndSubscribe}
          disabled={loading}
          className="px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? "..." : "Ativar notificações"}
        </button>
        {status.hasSubscription && (
          <button
            type="button"
            onClick={sendTestNotification}
            disabled={testLoading}
            className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]/10 disabled:opacity-50 text-sm"
          >
            {testLoading ? "..." : "Enviar notificação de teste"}
          </button>
        )}
      </div>
      {message && (
        <p className="text-sm text-[var(--warning)]">{message}</p>
      )}
    </section>
  );
}
