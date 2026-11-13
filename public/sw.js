/**
 * Service Worker de PokéCubata Hoenn (PWA).
 * Estrategia:
 *  - Recursos estáticos (sprites, iconos, JS/CSS de Next): caché primero.
 *  - Navegaciones (páginas): red primero, con la portada como respaldo sin conexión.
 *  - Socket.IO y demás peticiones: pasan directas (nunca se cachean).
 */

const NOMBRE_CACHE = "pokecubata-v2";
const RECURSOS_INICIALES = [
  "/",
  "/manifest.json",
  "/iconos/icono-192.png",
  "/iconos/icono-512.png",
  "/iconos/maskable-512.png",
  "/iconos/apple-touch-icon.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(NOMBRE_CACHE).then((cache) => cache.addAll(RECURSOS_INICIALES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves.filter((clave) => clave !== NOMBRE_CACHE).map((clave) => caches.delete(clave))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;

  // Solo GET y nunca socket.io (el tiempo real pasa siempre por la red).
  if (peticion.method !== "GET" || peticion.url.includes("/socket.io")) return;

  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  // Recursos estáticos: caché primero
  const esEstatico =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/sprites/") ||
    url.pathname.startsWith("/iconos/") ||
    url.pathname === "/manifest.json";

  if (esEstatico) {
    evento.respondWith(
      caches.match(peticion).then(
        (respuesta) =>
          respuesta ??
          fetch(peticion).then((respuestaRed) => {
            const copia = respuestaRed.clone();
            caches.open(NOMBRE_CACHE).then((cache) => cache.put(peticion, copia));
            return respuestaRed;
          })
      )
    );
    return;
  }

  // Navegaciones: red primero, caché POR URL (cada ruta se guarda con su clave
  // para no pisar la portada) y respaldo: primero su URL, después la portada.
  if (peticion.mode === "navigate") {
    evento.respondWith(
      fetch(peticion)
        .then((respuestaRed) => {
          const copia = respuestaRed.clone();
          caches.open(NOMBRE_CACHE).then((cache) => cache.put(peticion, copia));
          return respuestaRed;
        })
        .catch(() =>
          caches.match(peticion).then((enCache) => enCache || caches.match("/"))
        )
    );
  }
});
