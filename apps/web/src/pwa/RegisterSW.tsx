"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("SW registered", reg.scope))
      .catch((err) => console.warn("SW registration failed", err));
  }, []);
  return null;
}
