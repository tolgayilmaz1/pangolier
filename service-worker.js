// ═══════════════════════════════════════════════════
// PANGOLIER — Service Worker (PWA Offline Cache)
// ═══════════════════════════════════════════════════
const CACHE = 'pangolier-v4-audio-map-settings-lang';

// Offline çalışması için önbelleğe alınacak dosyalar
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/worlds.js',
  '/game.js',
  '/audio.js',
  '/firebase.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/assets/audio/ana_menu.ogg',
  '/assets/audio/bolumler.ogg',
  '/assets/audio/ara_dunya_harita.ogg'
];

// Install — tüm asset'leri önbelleğe al
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — eski cache'leri temizle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — önce cache, yoksa network
// Firebase istekleri her zaman network'ten gider (online skor)
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Firebase Realtime DB isteklerini cache'leme
  if (url.includes('firebaseio.com') || url.includes('firebase') || url.includes('gstatic')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Diğer her şey: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Başarılı response'u cache'e ekle
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
