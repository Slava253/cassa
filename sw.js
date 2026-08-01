const CACHE_NAME = 'gusc-v1';
const urlsToCache = [
    '/',
    'index.html',
    'admin.html',
    'cashier.html',
    'client.html',
    'manifest.json',
    'css/style.css',
    'css/mobile.css',
    'js/firebase-config.js',
    'js/auth.js',
    'js/admin.js',
    'js/cashier.js',
    'js/client.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/qrious/2.2.2/qrious.min.js'
];

// Установка
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Активация
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Перехват запросов
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Кеш найден - возвращаем
                if (response) {
                    return response;
                }
                
                // Клонируем запрос
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest)
                    .then(response => {
                        // Проверяем валидность ответа
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Клонируем ответ
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                            
                        return response;
                    })
                    .catch(() => {
                        // Если сеть недоступна и нет кеша
                        if (event.request.url.includes('.html')) {
                            return caches.match('index.html');
                        }
                        return new Response('Оффлайн режим', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});
