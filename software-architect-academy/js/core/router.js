/* router.js — hash router with params and query-string support.
   Routes match on the PATH only; '#/search?q=kafka' matches the '/search' route,
   and the parsed query is passed to the handler as a URLSearchParams. */
(function (S) {
  'use strict';
  var routes = [];

  S.router = {
    add: function (pattern, handler) {
      // pattern like '/lesson/:id' → regex
      var keys = [];
      var rx = new RegExp('^' + pattern.replace(/:[^/]+/g, function (m) { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
      routes.push({ rx: rx, keys: keys, handler: handler });
    },
    go: function (path) { location.hash = '#' + path; },
    current: function () { return location.hash.replace(/^#/, '') || '/dashboard'; },

    /* Find the route entry matching a raw hash path (query ignored). Used by resolve() and tests. */
    find: function (raw) {
      var path = String(raw).split('?')[0];
      for (var i = 0; i < routes.length; i++) {
        var m = path.match(routes[i].rx);
        if (m) return { route: routes[i], m: m, path: path };
      }
      return null;
    },

    resolve: function () {
      var raw = this.current();
      var qIdx = raw.indexOf('?');
      var query = new URLSearchParams(qIdx >= 0 ? raw.slice(qIdx + 1) : '');
      var main = S.el('#main');
      var hit = this.find(raw);
      if (hit) {
        var params = {};
        hit.route.keys.forEach(function (k, idx) { params[k] = decodeURIComponent(hit.m[idx + 1]); });
        main.innerHTML = '';
        try { hit.route.handler(main, params, query); }
        catch (e) {
          console.error(e);
          main.innerHTML = '<h1>Something went wrong</h1><p class="muted">' + S.esc(e.message) + '</p><p><a href="#/dashboard">Back to dashboard</a></p>';
        }
        main.focus({ preventScroll: true });
        window.scrollTo(0, 0);
        S.app && S.app.markNav(hit.path);
        return;
      }
      main.innerHTML = '<h1>Page not found</h1><p>No page at <code>' + S.esc(raw) + '</code>.</p><p><a href="#/dashboard">Back to dashboard</a></p>';
    },
    init: function () {
      window.addEventListener('hashchange', this.resolve.bind(this));
      if (!location.hash) location.hash = '#/dashboard';
      this.resolve();
    }
  };
})(window.SAA);
