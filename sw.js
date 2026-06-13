const CACHE_NAME = 'siontel-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('Opened cache');
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
                    // Hapus cache versi lama agar update JS/HTML terbaru bisa masuk
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Cache First, Network Fallback Strategy (Sangat Handal/Bulletproof)
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) return response;
            return fetch(event.request).then(
                function(response) {
                    if(!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    var responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            // Hanya simpan asset lokal/cdn spesifik untuk hindari overload
                            if(event.request.url.startsWith('http')) {
                                cache.put(event.request, responseToCache);
                            }
                        });
                    return response;
                }
            );
        }).catch(() => {
            // Error handling saat koneksi terputus total & file tidak ada di cache
            console.warn('Network request failed and no cache available for: ', event.request.url);
        })
    );
});