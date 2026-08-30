/* Europe 2026 · V1.0
   network first for our own files, so a push to GitHub always wins.
   cache is only a fallback, which is what makes the app open on a plane.
   fonts are cache first: they never change and they are the slow part.
   the Supabase, weather and rates calls are never touched.            */

const V = "eu26-v1.0";
const SHELL = ["./", "./index.html", "./trip.enc.json"];
const isFont = (h) => h === "fonts.googleapis.com" || h === "fonts.gstatic.com";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(V)
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  const own = url.origin === self.location.origin;
  if (!own && !isFont(url.hostname)) return;

  if (isFont(url.hostname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(V).then((c) => c.put(req, copy));
        }
        return res;
      }))
    );
    return;
  }

  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(V).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
