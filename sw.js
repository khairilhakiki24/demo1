const CACHE_NAME = 'siontel-cache-v2';

// PERBAIKAN: Hanya cache file lokal di awal. 
// Memasukkan CDN ke cache.addAll sering menggagalkan instalasi SW karena isu CORS.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('[Service Worker] Caching App Shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Abaikan request yang bukan HTTP/HTTPS (seperti chrome-extension://) atau method selain GET
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

    // Cache First, Network Fallback dengan Dynamic Caching
    event.respondWith(
        caches.match(event.request)
        .then(cachedResponse => {
            // Jika ada di cache, langsung kembalikan
            if (cachedResponse) {
                return cachedResponse;
            }

            // Jika tidak ada di cache, ambil dari internet
            return fetch(event.request).then(networkResponse => {
                // Validasi response jaringan
                if(!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
                    return networkResponse;
                }

                // Simpan ke cache secara dinamis (termasuk CDN Tailwind, ChartJS dll saat pertama kali diload)
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                return networkResponse;
            }).catch(() => {
                console.warn('[Service Worker] Offline & tidak ada di cache: ', event.request.url);
            });
        })
    );
});