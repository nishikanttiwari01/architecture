/* Service worker — cache-first offline support */
var CACHE = 'saa-v1';
var ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/main.css',
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
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    });
  }));
});
