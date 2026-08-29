// Service Worker for Push Notifications
const CACHE_NAME = 'pmd-v3';
const urlsToCache = [
    '/vite.svg'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .catch((err) => {
                console.error('SW cache install failed:', err);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Never cache navigation/HTML requests or JS/CSS module scripts — always
    // go to the network so users get the current build's index.html and
    // hashed asset filenames. Falling back to a stale cached index.html
    // after a new deploy causes "Expected a JavaScript module" MIME errors,
    // because it references JS/CSS files that no longer exist on the server.
    if (
        event.request.mode === 'navigate' ||
        event.request.destination === 'script' ||
        event.request.destination === 'style'
    ) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/vite.svg',
        badge: '/vite.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('PMD Notification', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
