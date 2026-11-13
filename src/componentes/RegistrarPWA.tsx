"use client";

/**
 * Registra el Service Worker para que la app sea instalable como PWA
 * y funcione sin conexión al recargar (solo en producción).
 */

import { useEffect } from "react";

export function RegistrarPWA() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return; // en desarrollo, sin caché
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sin service worker la app sigue funcionando online.
    });
  }, []);
  return null;
}
