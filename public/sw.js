const CACHE_NAME = 'hilos-ancestrales-v2';
const STATIC_ASSETS = ['/', '/index.html'];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Network-first con timeout: intenta la red primero para que la navegación
// siempre traiga el index.html (y por lo tanto el bundle) más reciente. Si
// la red falla o no responde a tiempo, cae a la copia cacheada (soporte
// offline sin quedar nunca atascado esperando una red muerta).
function networkFirst(request) {
  return new Promise((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      caches.match(request).then(resolve);
    }, NETWORK_TIMEOUT_MS);

    fetch(request).then((response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (response.ok && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      resolve(response);
    }).catch(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      caches.match(request).then(resolve);
    });
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // No cachear llamadas a Supabase/API
  if (
    url.hostname.includes('supabase') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/')
  ) {
    return;
  }

  // Navegación (index.html): network-first, para que cada apertura de la
  // app traiga la versión desplegada más reciente en vez de una copia
  // cacheada indefinidamente.
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Assets con hash de Vite (JS/CSS) y otros estáticos: cache-first. Es
  // seguro porque su URL cambia cuando su contenido cambia — nunca sirven
  // una versión vieja bajo una URL nueva.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
