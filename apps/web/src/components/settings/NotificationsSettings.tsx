"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function NotificationsSettings() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

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
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setMessage("Você já está inscrito.");
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
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
        Notificações (Web Push)
      </h2>
      <p className="text-sm text-neutral-500 mb-2">
        Para receber lembretes no dispositivo, ative as notificações e adicione o app à tela inicial (PWA).
      </p>
      <button
        type="button"
        onClick={requestPermissionAndSubscribe}
        disabled={loading}
        className="px-3 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 text-sm"
      >
        {loading ? "..." : "Ativar notificações"}
      </button>
      {message && <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">{message}</p>}
    </section>
  );
}
