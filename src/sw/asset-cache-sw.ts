
// This is a basic service worker for asset caching.
// In a real app, this would be more robust, likely using a library like Workbox.

const CACHE_NAME = 'asset-cache-v1';
const ASSET_URL_PATTERN = /firebasestorage\.googleapis\.com/;

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  // @ts-ignore
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  // @ts-ignore
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event: any) => {
  if (event.request.method !== 'GET' || !ASSET_URL_PATTERN.test(event.request.url)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        console.log('[Service Worker] Cache hit:', event.request.url);
        return cachedResponse;
      }

      console.log('[Service Worker] Cache miss, fetching:', event.request.url);
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);
        // We could return a placeholder asset here
        throw error;
      }
    })
  );
});

self.addEventListener('message', (event: any) => {
    if (event.data && event.data.type === 'PRECACHE') {
        const { urls } = event.data;
        console.log('[Service Worker] Pre-caching assets:', urls);
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return Promise.all(
                    urls.map((url: string) => {
                        return cache.match(url).then(res => {
                            if (!res) {
                                return fetch(url).then(networkResponse => {
                                    if(networkResponse.ok) cache.put(url, networkResponse);
                                })
                            }
                        })
                    })
                )
            })
        );
    }
})
