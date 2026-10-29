/* Lingua Aberta / Campus 2026
 * Local, scoped and deterministic offline course distribution.
 * An installed service worker is not a promise of offline availability
 * until its installation has completed successfully under HTTPS/localhost.
 */
const CACHE = "lingua-aberta-campus-v4";
const PREFIX = "lingua-aberta-campus-";
const ROOT = self.registration.scope;
const CONTENT = [
  "./", "./index.html", "./empezar.html", "./metodo.html", "./tokens.css", "./institutional.css", "./app.js", "./course-data.mjs",
  "./icon.svg", "./manifest.webmanifest",
  "./cursos/falsos-amigos-pt-es/syllabus.md",
  "./cursos/falsos-amigos-pt-es/semana-01.md",
  "./cursos/falsos-amigos-pt-es/semana-02.md",
  "./cursos/falsos-amigos-pt-es/semana-03.md",
  "./cursos/falsos-amigos-pt-es/semana-04.md",
  "./cursos/falsos-amigos-pt-es/recursos.md",
  "./cursos/falsos-amigos-pt-es/quiz.json",
  "./cursos/catalan-a1-brasileiros/syllabus.md",
  "./cursos/catalan-a1-brasileiros/semana-01.md",
  "./cursos/catalan-a1-brasileiros/semana-02.md",
  "./cursos/catalan-a1-brasileiros/semana-03.md",
  "./cursos/catalan-a1-brasileiros/semana-04.md",
  "./cursos/catalan-a1-brasileiros/recursos.md",
  "./cursos/catalan-a1-brasileiros/quiz.json",
  "./cursos/espanol-academico-eso/syllabus.md",
  "./cursos/espanol-academico-eso/semana-01.md",
  "./cursos/espanol-academico-eso/semana-02.md",
  "./cursos/espanol-academico-eso/semana-03.md",
  "./cursos/espanol-academico-eso/recursos.md",
  "./cursos/espanol-academico-eso/quiz.json",
  "./voces/bienvenida-pt.mp3",
  "./voces/bienvenida-es.mp3",
  "./voces/bienvenida-en.mp3",
  "./voces/bienvenida-ca.mp3",
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CONTENT.map(resource => new URL(resource, ROOT).href));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(PREFIX) && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const scope = new URL(ROOT);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      // No unrestricted runtime caching: only the known teaching pack is precached.
      return response;
    } catch {
      if (request.mode === "navigate") {
        const index = await cache.match(new URL("./index.html", ROOT).href);
        if (index) return index;
      }
      return new Response("Este material no está disponible sin conexión.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  })());
});