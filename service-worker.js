const CACHE_NAME = 'hokkaido-trip-v1';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// 安裝時快取必要檔案
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    }).then(()=> self.skipWaiting())
  );
});

// 啟用並清理舊快取
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(()=> self.clients.claim())
  );
});

// fetch 策略：先快取，若無再網路抓取，並在背景更新快取
self.addEventListener('fetch', (evt) => {
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    caches.match(evt.request).then((cached) => {
      if (cached) {
        // 背景更新快取
        evt.waitUntil(
          fetch(evt.request).then((res) => {
            if (!res || res.status !== 200) return;
            caches.open(CACHE_NAME).then((cache) => cache.put(evt.request, res.clone()));
          }).catch(()=>{})
        );
        return cached;
      }
      return fetch(evt.request).then((res) => {
        if (!res || res.status !== 200) return res;
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(evt.request, res.clone());
          return res;
        });
      }).catch(()=> caches.match('./'));
    })
  );
});
