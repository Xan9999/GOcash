const CACHE_NAME = 'gocash-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',  // Adjust based on your build
  // Add more static files as needed
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
