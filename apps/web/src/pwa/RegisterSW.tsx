"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function RegisterSW() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (reg.waiting) setWaitingWorker(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(reg.waiting);
            }
          });
        });
      })
      .catch((err) => console.warn("SW registration failed", err));

    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  function handleUpdate() {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      setWaitingWorker(null);
    }
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const updateBar =
    mounted &&
    waitingWorker &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] max-w-md w-full mx-4 px-4 py-3 rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent-muted)] flex items-center justify-between gap-3 shadow-[var(--shadow-lg)]"
            role="alert"
          >
            <span className="text-sm text-[var(--foreground)]">Nova versão disponível.</span>
            <button
              type="button"
              onClick={handleUpdate}
              className="shrink-0 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-medium hover:opacity-90"
            >
              Atualizar
            </button>
          </div>,
          document.body
        )
      : null;

  const offlineBar =
    mounted &&
    !isOnline &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed top-0 left-0 right-0 z-[9997] px-4 py-2 bg-[var(--warning-muted)] border-b border-[var(--warning)] text-center text-sm text-[var(--foreground)]"
            role="status"
          >
            Você está offline. Algumas ações podem não funcionar.
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {updateBar}
      {offlineBar}
    </>
  );
}
