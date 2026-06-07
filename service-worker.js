const CACHE = 'gamehub-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/jump_game.html',
  '/memory_game.html',
  '/balance_game.html',
  '/pacman_game.html',
  '/escape_game.html',
  '/reaction_battle.html',
  '/color_grid_game.html',
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 정리
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', e => {
  // Firebase Realtime DB 요청은 캐시 안 함
  if (e.request.url.includes('firebaseio.com') ||
      e.request.url.includes('firebase.googleapis.com')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
