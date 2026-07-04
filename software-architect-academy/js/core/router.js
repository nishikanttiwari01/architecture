/* router.js — hash router with params */
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
    resolve: function () {
      var path = this.current();
      var main = S.el('#main');
      for (var i = 0; i < routes.length; i++) {
        var m = path.match(routes[i].rx);
        if (m) {
          var params = {};
          routes[i].keys.forEach(function (k, idx) { params[k] = decodeURIComponent(m[idx + 1]); });
          main.innerHTML = '';
          try { routes[i].handler(main, params); }
          catch (e) {
            console.error(e);
            main.innerHTML = '<h1>Something went wrong</h1><p class="muted">' + S.esc(e.message) + '</p><p><a href="#/dashboard">Back to dashboard</a></p>';
          }
          main.focus({ preventScroll: true });
          window.scrollTo(0, 0);
          S.app && S.app.markNav(path);
          return;
        }
      }
      main.innerHTML = '<h1>Page not found</h1><p>No page at <code>' + S.esc(path) + '</code>.</p><p><a href="#/dashboard">Back to dashboard</a></p>';
    },
    init: function () {
      window.addEventListener('hashchange', this.resolve.bind(this));
      if (!location.hash) location.hash = '#/dashboard';
      this.resolve();
    }
  };
})(window.SAA);
