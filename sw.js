// sw.js - Service Worker Básico EDP Solar
const CACHE_NAME = 'edp-solar-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/obrigado.html',
    '/css/style.css',
    '/js/script.js',
    '/img/edp-logo.png', // Adicione logos e imagens principais
    // Adicione aqui outros assets importantes
    'https://logodownload.org/wp-content/uploads/2017/08/edp-logo-1.png',
    'https://logodownload.org/wp-content/uploads/2017/08/edp-logo-0.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    // Ignorar requisições para o PHP e para o Facebook Pixel
    if (event.request.url.includes('/php/') || event.request.url.includes('connect.facebook.net')) {
        return; // Deixa a requisição seguir para a rede
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    networkResponse => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                );
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});