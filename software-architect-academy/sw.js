/* Service worker — offline support.
   Strategy: network-first for the HTML shell (so updates arrive), cache-first for
   versioned static assets, and only successful GET responses are ever cached.
   BUMP CACHE_VERSION whenever any asset changes. */
var CACHE_VERSION = 'saa-v2';
var ASSETS = [
  './', 'index.html', 'test.html', 'manifest.webmanifest', 'css/main.css',
  'js/core/utils.js', 'js/core/store.js', 'js/core/router.js', 'js/core/search.js',
  'js/components.js', 'js/app.js',
  'js/views/dashboard.js', 'js/views/learn.js', 'js/views/library.js',
  'js/views/tools.js', 'js/views/practice.js', 'js/views/user.js',
  'data/curriculum.js', 'data/curriculum2.js', 'data/curriculum3.js',
  'data/glossary.js', 'data/glossary2.js', 'data/glossary3.js', 'data/patterns.js', 'data/quiz.js',
  'data/interview.js', 'data/interview-banking.js', 'data/interview2.js', 'data/interview3.js', 'data/mocks.js',
  'data/casestudies.js', 'data/casestudies2.js', 'data/labs.js', 'data/reviews.js', 'data/templates.js',
  'data/events.js', 'data/toolkit.js', 'data/references.js', 'data/paths.js',
  'data/mistakes.js', 'data/communication.js', 'data/sysdesign.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE_VERSION).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE_VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  var isShell = e.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/');

  if (isShell) {
    // Network-first: fresh shell when online, cached shell offline.
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) { return hit || caches.match('index.html'); });
      })
    );
    return;
  }

  // Static assets: cache-first, populate from network on miss, cache only 200s.
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        if (res && res.ok && url.origin === location.origin) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
