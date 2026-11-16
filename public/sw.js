// Service Worker de Orienta IA (PWA)
const CACHE_VERSION = 'orienta-ia-v3.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/favicon.ico',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/assets/aistudio/logo_transparent.png'
];

// Instalación inmediata del Service Worker y precaching de recursos fundamentales
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Usar allSettled para asegurar que la falla de un recurso opcional no aborte la instalación
      const promises = PRECACHE_ASSETS.map((asset) =>
        cache.add(asset).catch((err) => {
          console.warn(`[SW] Precache no crítico omitido: ${asset}`, err);
        })
      );
      await Promise.all(promises);
    })
  );
});

// Activación y limpieza exhaustiva de versiones obsoletas de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            console.log(`[SW] Eliminando caché obsoleta: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategias de fetch adaptativas para PWA en Android, iOS Safari y Escritorio
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorar métodos no GET o esquemas no HTTP (ej. chrome-extension)
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Las peticiones al backend o a la API Gemini nunca se almacenan en caché para asegurar respuestas en tiempo real
  if (request.url.includes('/api/')) {
    return;
  }

  // 1. Navegación (HTML de páginas): Network First con fallback a Cache para offline 100% garantizado
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const indexFallback = await caches.match('/index.html');
          if (indexFallback) return indexFallback;
          return caches.match('/');
        })
    );
    return;
  }

  // 2. Recursos estáticos (Imágenes, Fuentes, CSS, JS): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Escuchar mensaje para forzar actualización inmediata
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
