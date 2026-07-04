/* app.js — bootstraps navigation, theme, global search, service worker */
(function (S) {
  'use strict';

  var NAV = [
    { group: 'Home', items: [
      { route: '/dashboard', icon: '⌂', label: 'Dashboard' },
      { route: '/paths', icon: '🧭', label: 'Learning Paths' },
      { route: '/courses', icon: '🎓', label: 'Courses' },
      { route: '/progress', icon: '📈', label: 'Progress' }
    ]},
    { group: 'Curriculum', items: [
      { route: '/track/foundations', icon: '⚑', label: 'Architecture Foundations' },
      { route: '/patterns', icon: '⬡', label: 'Architecture Patterns' },
      { route: '/track/modelling', icon: '✎', label: 'Modelling' },
      { route: '/track/distributed', icon: '⇄', label: 'Distributed Systems' },
      { route: '/track/cloud', icon: '☁', label: 'Cloud Architecture' },
      { route: '/track/security', icon: '🛡', label: 'Security Architecture' },
      { route: '/track/data', icon: '⛁', label: 'Data Architecture' },
      { route: '/track/integration', icon: '⇆', label: 'Integration Architecture' },
      { route: '/track/banking', icon: '🏦', label: 'Banking Architecture' },
      { route: '/track/java', icon: '☕', label: 'Java & Spring Architecture' },
      { route: '/track/kafka', icon: '𝕂', label: 'Kafka Architecture' },
      { route: '/track/microservices', icon: '▦', label: 'Microservices' }
    ]},
    { group: 'Practice', items: [
      { route: '/case-studies', icon: '🗂', label: 'Case Studies' },
      { route: '/labs', icon: '🔬', label: 'Hands-on Labs' },
      { route: '/review-sim', icon: '🔍', label: 'Architecture Review Simulator' },
      { route: '/assessments', icon: '☑', label: 'Assessments' },
      { route: '/mistakes', icon: '⚠', label: 'Common Architect Mistakes' },
      { route: '/communication', icon: '🗣', label: 'Communication Skills' }
    ]},
    { group: 'Interviews', items: [
      { route: '/interview', icon: '❓', label: 'Interview Practice' },
      { route: '/mock', icon: '⏱', label: 'Mock Interviews' },
      { route: '/sysdesign', icon: '🏗', label: 'System-Design Simulator' }
    ]},
    { group: 'Tools', items: [
      { route: '/toolkit', icon: '🧰', label: 'Architecture Toolkit' },
      { route: '/adr', icon: '📋', label: 'ADR Decision Wizard' },
      { route: '/bvb', icon: '⚖', label: 'Build vs Buy vs Reuse' },
      { route: '/qaw', icon: '🎯', label: 'Quality Attribute Workshop' },
      { route: '/calculators', icon: '🖩', label: 'Calculators' },
      { route: '/datastore', icon: '🗄', label: 'Data Store Selector' },
      { route: '/kafka-designer', icon: '🧩', label: 'Kafka Topic Designer' },
      { route: '/diagram-challenge', icon: '📐', label: 'Diagram Challenge' },
      { route: '/templates', icon: '📄', label: 'Templates' }
    ]},
    { group: 'Reference', items: [
      { route: '/glossary', icon: '📖', label: 'Glossary' },
      { route: '/flashcards', icon: '🃏', label: 'Flashcards' },
      { route: '/references', icon: '🔗', label: 'References' },
      { route: '/bookmarks', icon: '★', label: 'Bookmarks' },
      { route: '/notes', icon: '📝', label: 'Notes' },
      { route: '/settings', icon: '⚙', label: 'Settings' }
    ]}
  ];

  S.app = {
    renderNav: function () {
      var nav = S.el('#sidenav');
      nav.innerHTML = NAV.map(function (g, gi) {
        return '<div class="nav-group" data-gi="' + gi + '"><button aria-expanded="true">' + S.esc(g.group) + '</button><div class="nav-items">' +
          g.items.map(function (it) {
            return '<a href="#' + it.route + '" data-route="' + it.route + '"><span class="ni">' + it.icon + '</span>' + S.esc(it.label) + '</a>';
          }).join('') + '</div></div>';
      }).join('');
      nav.addEventListener('click', function (e) {
        var btn = e.target.closest('.nav-group>button');
        if (btn) {
          var grp = btn.parentNode;
          grp.classList.toggle('closed');
          btn.setAttribute('aria-expanded', !grp.classList.contains('closed'));
        }
        if (e.target.closest('a') && window.innerWidth < 900) nav.classList.add('collapsed');
      });
    },
    markNav: function (path) {
      S.els('#sidenav a').forEach(function (a) {
        var r = a.getAttribute('data-route');
        a.classList.toggle('active', path === r || (r !== '/dashboard' && path.indexOf(r) === 0));
      });
      // track recently visited
      var st = S.store.state;
      st.lastVisited = [{ route: path, date: S.today() }].concat(
        st.lastVisited.filter(function (v) { return v.route !== path; })).slice(0, 8);
      S.store.save();
    },
    applyTheme: function () {
      document.documentElement.setAttribute('data-theme', S.store.state.settings.theme);
    },
    init: function () {
      this.renderNav();
      this.applyTheme();

      S.el('#theme-toggle').addEventListener('click', function () {
        var st = S.store.state.settings;
        st.theme = st.theme === 'dark' ? 'light' : 'dark';
        S.store.save(); S.app.applyTheme();
      });
      S.el('#nav-toggle').addEventListener('click', function () {
        var nav = S.el('#sidenav');
        nav.classList.toggle('collapsed');
        this.setAttribute('aria-expanded', !nav.classList.contains('collapsed'));
      });
      if (window.innerWidth < 900) S.el('#sidenav').classList.add('collapsed');

      // Global search
      var gs = S.el('#global-search');
      gs.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && gs.value.trim()) {
          S.router.go('/search?q=' + encodeURIComponent(gs.value.trim()));
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'SELECT') {
          e.preventDefault(); gs.focus();
        }
      });

      S.search.build();
      S.router.init();

      // Service worker: only meaningful over http(s)
      if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
        navigator.serviceWorker.register('sw.js').catch(function () { /* offline caching unavailable */ });
        // A new service worker took control → new version is cached; offer a refresh.
        var hadController = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.addEventListener('controllerchange', function () {
          if (hadController) S.toast('Update available — refresh the page to load the newest version.');
          hadController = true;
        });
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () { S.app.init(); });
})(window.SAA);
