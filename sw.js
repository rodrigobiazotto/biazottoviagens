// Biazotto Viagens - Service Worker
const CACHE_NAME = 'biazotto-pwa-v3';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/sobre/',
  '/servicos/',
  '/como-funciona/',
  '/privacidade/',
  '/termos/',
  '/assets/site.css',
  '/assets/site.js',
  '/assets/favicon.png',
  '/assets/logo-branca.png',
  '/assets/logo-padrao.png',
  '/assets/marca-quadrada.png',
  '/assets/hero.webp',
  '/assets/icon-180.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-maskable-512.png',
  '/assets/screenshot-desktop.png',
  '/assets/screenshot-mobile.png',
  '/manifest.webmanifest'
];

// Instalação: Pré-cache dos ativos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Ativação: Limpeza de versões antigas do cache e controle imediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Apenas métodos GET são armazenados em cache
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Apenas requisições da mesma origem
  if (url.origin !== location.origin) {
    return;
  }

  // Estratégia para navegação (páginas HTML): Network First com fallback para Cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // Estratégia para ativos estáticos (CSS, JS, Imagens, Fontes): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Em caso de falha de rede e sem cache
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
