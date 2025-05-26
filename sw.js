/**
 * EDP Solar - Service Worker Otimizado para Alta Performance
 * Features: Cache Inteligente, Offline Support, Background Sync, Push Notifications
 * @version 2.0
 */

// ==================== CONFIGURATION ====================
const CACHE_VERSION = 'edp-solar-v2.1';
const CACHE_NAME = `${CACHE_VERSION}-${Date.now()}`;

// Cache Categories for Better Management
const CACHES = {
    STATIC: `${CACHE_NAME}-static`,
    DYNAMIC: `${CACHE_NAME}-dynamic`,
    IMAGES: `${CACHE_NAME}-images`,
    API: `${CACHE_NAME}-api`,
    FONTS: `${CACHE_NAME}-fonts`
};

// Critical Resources (Cache First Strategy)
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/script.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// Static Assets (Cache First with Network Fallback)
const STATIC_ASSETS = [
    '/obrigado.html',
    '/politica-privacidade.html',
    '/termos-rgpd.html',
    '/manifest.json'
];

// Image Resources
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];

// External Resources (Network First with Cache Fallback)
const EXTERNAL_RESOURCES = [
    'https://logodownload.org',
    'https://randomuser.me',
    'https://cdnjs.cloudflare.com'
];

// API Endpoints (Network First)
const API_ENDPOINTS = [
    '/php/',
    '/api/',
    'https://graph.facebook.com',
    'https://www.google-analytics.com',
    'https://connect.facebook.net'
];

// Resources to Never Cache
const NEVER_CACHE = [
    '/php/send_lead_meta.php', // Dynamic form submission
    'chrome-extension://',
    'moz-extension://',
    'safari-extension://'
];

// ==================== UTILITY FUNCTIONS ====================
class CacheManager {
    /**
     * Check if URL should be cached
     */
    static shouldCache(url) {
        // Never cache certain resources
        if (NEVER_CACHE.some(pattern => url.includes(pattern))) {
            return false;
        }
        
        // Don't cache external analytics/tracking
        if (url.includes('google-analytics.com') || 
            url.includes('googletagmanager.com') ||
            url.includes('facebook.com/tr')) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Determine cache strategy based on URL
     */
    static getCacheStrategy(url) {
        // Critical resources: Cache First
        if (CRITICAL_RESOURCES.some(resource => url.includes(resource))) {
            return 'cache-first';
        }
        
        // API endpoints: Network First
        if (API_ENDPOINTS.some(endpoint => url.includes(endpoint))) {
            return 'network-first';
        }
        
        // Images: Cache First with expiration
        if (IMAGE_EXTENSIONS.some(ext => url.includes(ext))) {
            return 'cache-first-images';
        }
        
        // External resources: Stale While Revalidate
        if (EXTERNAL_RESOURCES.some(domain => url.includes(domain))) {
            return 'stale-while-revalidate';
        }
        
        // Default: Network First with Cache Fallback
        return 'network-first';
    }
    
    /**
     * Get appropriate cache name for resource
     */
    static getCacheName(url) {
        if (API_ENDPOINTS.some(endpoint => url.includes(endpoint))) {
            return CACHES.API;
        }
        
        if (IMAGE_EXTENSIONS.some(ext => url.includes(ext))) {
            return CACHES.IMAGES;
        }
        
        if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
            return CACHES.FONTS;
        }
        
        if (CRITICAL_RESOURCES.some(resource => url.includes(resource))) {
            return CACHES.STATIC;
        }
        
        return CACHES.DYNAMIC;
    }
    
    /**
     * Clean old caches
     */
    static async cleanOldCaches() {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
            name.startsWith('edp-solar-') && !Object.values(CACHES).includes(name)
        );
        
        return Promise.all(
            oldCaches.map(cacheName => {
                console.log('SW: Deleting old cache:', cacheName);
                return caches.delete(cacheName);
            })
        );
    }
    
    /**
     * Check if response is valid for caching
     */
    static isValidResponse(response) {
        return response &&
               response.status === 200 &&
               response.type === 'basic' ||
               response.type === 'cors';
    }
}

// ==================== CACHE STRATEGIES ====================
class CacheStrategies {
    /**
     * Cache First Strategy - Good for static assets
     */
    static async cacheFirst(request, cacheName) {
        try {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
            
            const networkResponse = await fetch(request);
            if (CacheManager.isValidResponse(networkResponse)) {
                const cache = await caches.open(cacheName);
                cache.put(request, networkResponse.clone());
            }
            
            return networkResponse;
        } catch (error) {
            console.warn('SW: Cache First failed:', error);
            // Try to serve from cache as fallback
            return caches.match(request) || caches.match('/offline.html');
        }
    }
    
    /**
     * Network First Strategy - Good for dynamic content
     */
    static async networkFirst(request, cacheName) {
        try {
            const networkResponse = await fetch(request);
            
            if (CacheManager.isValidResponse(networkResponse)) {
                const cache = await caches.open(cacheName);
                cache.put(request, networkResponse.clone());
            }
            
            return networkResponse;
        } catch (error) {
            console.warn('SW: Network First failed, trying cache:', error);
            const cachedResponse = await caches.match(request);
            
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // Return offline page for HTML requests
            if (request.headers.get('accept').includes('text/html')) {
                return caches.match('/offline.html');
            }
            
            throw error;
        }
    }
    
    /**
     * Stale While Revalidate - Good for external resources
     */
    static async staleWhileRevalidate(request, cacheName) {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        // Fetch fresh version in background
        const networkResponsePromise = fetch(request).then(response => {
            if (CacheManager.isValidResponse(response)) {
                cache.put(request, response.clone());
            }
            return response;
        }).catch(() => null);
        
        // Return cached version immediately if available
        return cachedResponse || networkResponsePromise;
    }
    
    /**
     * Cache First for Images with expiration
     */
    static async cacheFirstImages(request, cacheName) {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        // Check if cached response is still fresh (24 hours)
        if (cachedResponse) {
            const dateHeader = cachedResponse.headers.get('date');
            const cachedDate = dateHeader ? new Date(dateHeader) : new Date(0);
            const now = new Date();
            const dayInMs = 24 * 60 * 60 * 1000;
            
            if (now - cachedDate < dayInMs) {
                return cachedResponse;
            }
        }
        
        // Fetch fresh image
        try {
            const networkResponse = await fetch(request);
            if (CacheManager.isValidResponse(networkResponse)) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        } catch (error) {
            return cachedResponse || null;
        }
    }
}

// ==================== SERVICE WORKER EVENTS ====================

/**
 * Install Event - Cache critical resources
 */
self.addEventListener('install', event => {
    console.log('SW: Installing Service Worker v2.0');
    
    event.waitUntil(
        Promise.all([
            // Cache critical resources
            caches.open(CACHES.STATIC).then(cache => {
                console.log('SW: Caching critical resources');
                return cache.addAll(CRITICAL_RESOURCES);
            }),
            
            // Cache static assets
            caches.open(CACHES.DYNAMIC).then(cache => {
                console.log('SW: Caching static assets');
                return cache.addAll(STATIC_ASSETS.filter(asset => asset !== '/'));
            })
        ]).then(() => {
            console.log('SW: Installation complete');
            // Skip waiting to activate immediately
            return self.skipWaiting();
        }).catch(error => {
            console.error('SW: Installation failed:', error);
        })
    );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', event => {
    console.log('SW: Activating Service Worker v2.0');
    
    event.waitUntil(
        Promise.all([
            // Clean old caches
            CacheManager.cleanOldCaches(),
            
            // Claim all clients
            self.clients.claim()
        ]).then(() => {
            console.log('SW: Service Worker activated and claimed clients');
        }).catch(error => {
            console.error('SW: Activation failed:', error);
        })
    );
});

/**
 * Fetch Event - Intelligent caching strategies
 */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip requests that shouldn't be cached
    if (!CacheManager.shouldCache(request.url)) {
        return;
    }
    
    // Determine strategy and cache
    const strategy = CacheManager.getCacheStrategy(request.url);
    const cacheName = CacheManager.getCacheName(request.url);
    
    event.respondWith(
        (async () => {
            try {
                switch (strategy) {
                    case 'cache-first':
                        return await CacheStrategies.cacheFirst(request, cacheName);
                    
                    case 'cache-first-images':
                        return await CacheStrategies.cacheFirstImages(request, cacheName);
                    
                    case 'network-first':
                        return await CacheStrategies.networkFirst(request, cacheName);
                    
                    case 'stale-while-revalidate':
                        return await CacheStrategies.staleWhileRevalidate(request, cacheName);
                    
                    default:
                        return await CacheStrategies.networkFirst(request, cacheName);
                }
            } catch (error) {
                console.error('SW: Fetch failed:', error);
                
                // Try to serve from any cache as last resort
                const cachedResponse = await caches.match(request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Return offline page for navigation requests
                if (request.mode === 'navigate') {
                    return caches.match('/offline.html') || 
                           new Response('Offline - No cached content available', {
                               status: 503,
                               statusText: 'Service Unavailable'
                           });
                }
                
                throw error;
            }
        })()
    );
});

/**
 * Background Sync - For form submissions when offline
 */
self.addEventListener('sync', event => {
    console.log('SW: Background sync triggered:', event.tag);
    
    if (event.tag === 'lead-form-sync') {
        event.waitUntil(syncLeadForms());
    }
});

async function syncLeadForms() {
    try {
        // Get stored form data from IndexedDB
        const db = await openDB();
        const transaction = db.transaction(['leads'], 'readonly');
        const store = transaction.objectStore('leads');
        const leads = await store.getAll();
        
        for (const lead of leads) {
            try {
                const response = await fetch('/php/send_lead_meta.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(lead.data)
                });
                
                if (response.ok) {
                    // Remove synced lead from storage
                    const deleteTransaction = db.transaction(['leads'], 'readwrite');
                    const deleteStore = deleteTransaction.objectStore('leads');
                    await deleteStore.delete(lead.id);
                    
                    console.log('SW: Lead synced successfully:', lead.id);
                } else {
                    console.warn('SW: Lead sync failed:', response.status);
                }
            } catch (error) {
                console.error('SW: Lead sync error:', error);
            }
        }
    } catch (error) {
        console.error('SW: Background sync failed:', error);
    }
}

/**
 * Push Event - Handle push notifications
 */
self.addEventListener('push', event => {
    console.log('SW: Push message received');
    
    let notificationData = {
        title: 'EDP Solar',
        body: 'Tem uma nova mensagem!',
        icon: '/img/icon-192x192.png',
        badge: '/img/badge-72x72.png',
        tag: 'edp-solar-notification',
        renotify: true,
        requireInteraction: false,
        actions: [
            {
                action: 'view',
                title: 'Ver',
                icon: '/img/action-view.png'
            },
            {
                action: 'close',
                title: 'Fechar',
                icon: '/img/action-close.png'
            }
        ]
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
        } catch (error) {
            console.error('SW: Push data parsing failed:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

/**
 * Notification Click Event
 */
self.addEventListener('notificationclick', event => {
    console.log('SW: Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view' || !event.action) {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

/**
 * Message Event - Communication with main thread
 */
self.addEventListener('message', event => {
    console.log('SW: Message received:', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
                
            case 'GET_VERSION':
                event.ports[0].postMessage({ version: CACHE_VERSION });
                break;
                
            case 'CACHE_URLS':
                event.waitUntil(cacheUrls(event.data.urls));
                break;
                
            case 'CLEAR_CACHE':
                event.waitUntil(clearSpecificCache(event.data.cacheName));
                break;
                
            default:
                console.warn('SW: Unknown message type:', event.data.type);
        }
    }
});

async function cacheUrls(urls) {
    const cache = await caches.open(CACHES.DYNAMIC);
    return Promise.all(
        urls.map(url => 
            fetch(url).then(response => {
                if (CacheManager.isValidResponse(response)) {
                    return cache.put(url, response);
                }
            }).catch(error => {
                console.warn('SW: Failed to cache URL:', url, error);
            })
        )
    );
}

async function clearSpecificCache(cacheName) {
    if (Object.values(CACHES).includes(cacheName)) {
        return caches.delete(cacheName);
    }
}

// ==================== INDEXEDDB UTILITIES ====================
async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('EDPSolarDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = event => {
            const db = event.target.result;
            
            // Create object store for offline form submissions
            if (!db.objectStoreNames.contains('leads')) {
                const store = db.createObjectStore('leads', { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// ==================== CACHE MANAGEMENT ====================
/**
 * Periodic cache cleanup (runs on activate and periodically)
 */
async function performCacheMaintenance() {
    console.log('SW: Performing cache maintenance');
    
    try {
        // Clean old caches
        await CacheManager.cleanOldCaches();
        
        // Limit cache sizes
        await limitCacheSize(CACHES.IMAGES, 50); // Max 50 images
        await limitCacheSize(CACHES.DYNAMIC, 100); // Max 100 dynamic resources
        await limitCacheSize(CACHES.API, 20); // Max 20 API responses
        
        console.log('SW: Cache maintenance completed');
    } catch (error) {
        console.error('SW: Cache maintenance failed:', error);
    }
}

async function limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
        // Remove oldest items (FIFO)
        const keysToDelete = keys.slice(0, keys.length - maxItems);
        await Promise.all(keysToDelete.map(key => cache.delete(key)));
        console.log(`SW: Cleaned ${keysToDelete.length} items from ${cacheName}`);
    }
}

// ==================== ERROR HANDLING ====================
self.addEventListener('error', event => {
    console.error('SW: Global error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('SW: Unhandled promise rejection:', event.reason);
});

// ==================== INITIALIZATION ====================
console.log('SW: Service Worker v2.0 loaded');

// Perform cache maintenance on activation
self.addEventListener('activate', event => {
    event.waitUntil(performCacheMaintenance());
});

// Set up periodic cache maintenance (every 24 hours)
setInterval(() => {
    performCacheMaintenance();
}, 24 * 60 * 60 * 1000);

// ==================== ANALYTICS TRACKING ====================
/**
 * Track Service Worker performance
 */
function trackSWEvent(eventName, data = {}) {
    // Send analytics data to main thread
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'SW_ANALYTICS',
                event: eventName,
                data: {
                    timestamp: Date.now(),
                    cache_version: CACHE_VERSION,
                    ...data
                }
            });
        });
    });
}

// Track cache hits/misses
const originalCacheMatch = caches.match;
caches.match = function(request, options) {
    return originalCacheMatch.call(this, request, options).then(response => {
        if (response) {
            trackSWEvent('cache_hit', { url: request.url });
        } else {
            trackSWEvent('cache_miss', { url: request.url });
        }
        return response;
    });
};

// ==================== OFFLINE SUPPORT ====================
/**
 * Create offline page if not cached
 */
async function createOfflinePage() {
    const offlineHTML = `
        <!DOCTYPE html>
        <html lang="pt-PT">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - EDP Solar</title>
            <style>
                body {
                    font-family: 'Inter', Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #0066CC, #004499);
                    color: white;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .offline-container {
                    text-align: center;
                    max-width: 500px;
                }
                .offline-icon {
                    font-size: 4rem;
                    margin-bottom: 2rem;
                }
                h1 {
                    font-size: 2rem;
                    margin-bottom: 1rem;
                }
                p {
                    font-size: 1.1rem;
                    margin-bottom: 2rem;
                    opacity: 0.9;
                }
                .retry-button {
                    background: #00CC66;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 50px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .retry-button:hover {
                    background: #00b359;
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <div class="offline-icon">📱⚡</div>
                <h1>Está Offline</h1>
                <p>Não conseguimos contactar os nossos servidores. Verifique a sua ligação à internet e tente novamente.</p>
                <button class="retry-button" onclick="window.location.reload()">
                    Tentar Novamente
                </button>
            </div>
        </body>
        </html>
    `;
    
    const cache = await caches.open(CACHES.STATIC);
    await cache.put('/offline.html', new Response(offlineHTML, {
        headers: { 'Content-Type': 'text/html' }
    }));
}

// Create offline page during installation
self.addEventListener('install', event => {
    event.waitUntil(createOfflinePage());
});s