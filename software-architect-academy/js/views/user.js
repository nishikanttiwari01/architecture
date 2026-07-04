/* user.js — progress, bookmarks, notes, settings, search results */
(function (S) {
  'use strict';

  /* ---------- Progress ---------- */
  S.router.add('/progress', function (main) {
    var st = S.store.state, D = S.data, r = S.readiness();
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Progress' }]) + '<h1>Progress</h1>';
    html += '<div style="display:flex;gap:26px;align-items:center;flex-wrap:wrap;margin:16px 0">' +
      S.ui.ring(r.overall, 110, r.overall + '<div style="font-size:.6rem;font-weight:400">readiness</div>') +
      '<div class="stat-grid" style="flex:1">' +
      '<div class="stat"><div class="val">' + Object.keys(st.lessons).length + '</div><div class="lbl">Lessons done</div></div>' +
      '<div class="stat"><div class="val">' + Object.keys(st.labs).filter(function (k) { return st.labs[k].status === 'done'; }).length + '</div><div class="lbl">Labs completed</div></div>' +
      '<div class="stat"><div class="val">' + Object.keys(st.cases).filter(function (k) { return st.cases[k].revealed; }).length + '</div><div class="lbl">Case studies</div></div>' +
      '<div class="stat"><div class="val">' + st.interviews.length + '</div><div class="lbl">Interviews</div></div>' +
      '<div class="stat"><div class="val">' + S.store.streak() + '</div><div class="lbl">Day streak</div></div>' +
      '</div></div>';

    // Per-level completion
    html += '<h2>Level completion</h2>';
    [1, 2, 3, 4].forEach(function (lv) {
      var lessons = (D.lessons || []).filter(function (l) { return l.level === lv; });
      var done = lessons.filter(function (l) { return S.store.lessonDone(l.id); }).length;
      html += '<div class="small" style="display:flex;justify-content:space-between"><span>Level ' + lv + '</span><span>' + done + '/' + lessons.length + '</span></div>' + S.ui.bar(lessons.length ? done / lessons.length * 100 : 0);
    });

    // Topic mastery from quiz scores by category
    html += '<h2>Topic mastery (quiz average)</h2>';
    var cats = {};
    (D.lessons || []).forEach(function (l) {
      var rec = st.lessons[l.id];
      if (rec && rec.quizTotal) {
        cats[l.cat] = cats[l.cat] || { s: 0, t: 0 };
        cats[l.cat].s += rec.quizScore; cats[l.cat].t += rec.quizTotal;
      }
    });
    var catKeys = Object.keys(cats);
    if (!catKeys.length) html += '<p class="muted">Complete some lesson quizzes to see mastery per topic.</p>';
    else {
      var rows = catKeys.map(function (c) { return { c: c, pct: Math.round(cats[c].s / cats[c].t * 100) }; }).sort(function (a, b) { return b.pct - a.pct; });
      rows.forEach(function (x) {
        html += '<div class="small" style="display:flex;justify-content:space-between"><span>' + S.esc(x.c) + '</span><span>' + x.pct + '%</span></div>' + S.ui.bar(x.pct);
      });
      var strong = rows.filter(function (x) { return x.pct >= 80; }).map(function (x) { return x.c; });
      var weak = rows.filter(function (x) { return x.pct < 60; }).map(function (x) { return x.c; });
      if (strong.length) html += '<p><strong>Strong areas:</strong> ' + strong.map(function (c) { return S.ui.chip(c, 'good'); }).join(' ') + '</p>';
      if (weak.length) html += '<p><strong>Focus areas:</strong> ' + weak.map(function (c) { return S.ui.chip(c, 'warn'); }).join(' ') + ' — revisit these tracks and retake the quizzes.</p>';
    }

    // Interview history
    if (st.interviews.length) {
      html += '<h2>Interview history</h2><p class="muted small">Scores are key-point coverage — click an attempt to review your answers and the feedback.</p>' +
        '<table><tr><th>Date</th><th>Set</th><th>Kind</th><th>Coverage</th><th></th></tr>' +
        st.interviews.slice().reverse().map(function (i) {
          return '<tr><td>' + i.date + '</td><td>' + S.esc(i.title || i.setId) + '</td><td>' + i.kind + '</td><td>' + (i.scores ? i.scores.overall + '%' : '—') + '</td>' +
            '<td><a href="#/interview-history/' + i.id + '">Review →</a></td></tr>';
        }).join('') + '</table>';
    }

    // Achievements
    html += '<h2>Achievements</h2><div class="grid">';
    Object.keys(S.ACHIEVEMENTS).forEach(function (a) {
      var got = st.achievements[a];
      html += '<div class="card" style="opacity:' + (got ? 1 : 0.45) + '"><h3>' + (got ? '🏅' : '🔒') + ' ' + S.esc(S.ACHIEVEMENTS[a]) + '</h3>' +
        '<p class="small muted">' + (got ? 'Earned ' + got : 'Not yet earned') + '</p></div>';
    });
    html += '</div>';
    var nl = S.nextLesson();
    if (nl) html += '<div class="callout"><div class="co-title">Recommended next</div><a href="#/lesson/' + nl.id + '">' + S.esc(nl.title) + ' →</a></div>';
    main.innerHTML = html;
  });

  /* ---------- Bookmarks ---------- */
  S.router.add('/bookmarks', function (main) {
    var st = S.store.state;
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Bookmarks' }]) + '<h1>Bookmarks</h1>';
    if (!st.bookmarks.length) html += '<p class="empty">No bookmarks yet. Use the ☆ Bookmark button on lessons, patterns, and case studies.</p>';
    else {
      var routes = { lesson: '/lesson/', pattern: '/pattern/', 'case': '/case-study/', lab: '/lab/' };
      html += '<div class="grid">' + st.bookmarks.map(function (b) {
        return S.ui.card({ route: (routes[b.type] || '/') + b.id, title: b.title, chips: S.ui.chip(b.type), meta: '<span>added ' + b.date + '</span>' });
      }).join('') + '</div>';
    }
    main.innerHTML = html;
  });

  /* ---------- Notes ---------- */
  S.router.add('/notes', function (main) {
    var st = S.store.state;
    var keys = Object.keys(st.notes);
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Notes' }]) + '<h1>Notes</h1>' +
      '<p class="muted">Everything you have written in note boxes across the app, in one place.</p>';
    main.innerHTML = html;
    var scratch = S.h('<div class="card"><h3>Scratchpad</h3><textarea data-nk="scratchpad" placeholder="General notes…" style="min-height:140px"></textarea></div>');
    main.appendChild(scratch);
    if (keys.filter(function (k) { return k !== 'scratchpad'; }).length) {
      var list = S.h('<div><h2>Page notes</h2></div>');
      keys.filter(function (k) { return k !== 'scratchpad'; }).sort().forEach(function (k) {
        var pretty = k.replace(/^lesson\./, 'Lesson: ').replace(/^pattern\./, 'Pattern: ').replace(/^lab\./, 'Lab: ').replace(/^case\./, 'Case study: ').replace(/^comm\./, 'Communication exercise ');
        var d = S.h('<details><summary>' + S.esc(pretty) + '</summary></details>');
        var ta = document.createElement('textarea');
        ta.setAttribute('data-nk', k);
        d.appendChild(ta);
        list.appendChild(d);
      });
      main.appendChild(list);
    }
    main.querySelectorAll('textarea[data-nk]').forEach(function (ta) {
      var k = ta.getAttribute('data-nk');
      ta.value = S.store.note(k);
      ta.addEventListener('input', function () { S.store.note(k, ta.value); });
    });
    var exp = S.h('<div class="btn-row"><button class="btn secondary">Export all notes (Markdown)</button></div>');
    exp.querySelector('button').addEventListener('click', function () {
      var md = '# My Notes — Software Architect Academy\n\n' + Object.keys(st.notes).map(function (k) {
        return '## ' + k + '\n\n' + st.notes[k] + '\n';
      }).join('\n');
      S.download('saa-notes.md', md, 'text/markdown');
    });
    main.appendChild(exp);
  });

  /* ---------- Settings ---------- */
  S.router.add('/settings', function (main) {
    var st = S.store.state;
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Settings' }]) + '<h1>Settings</h1>';
    var card = S.h('<div class="card">' +
      '<label for="set-theme">Theme</label><select id="set-theme"><option value="dark">Dark</option><option value="light">Light</option></select>' +
      '<h2>Progress data</h2><p class="small muted">All progress is stored locally in your browser (localStorage). Export regularly if you clear browser data.</p>' +
      '<div class="btn-row"><button class="btn" id="btn-export">⬇ Export progress (JSON)</button>' +
      '<label class="btn secondary" style="margin:0">⬆ Import progress<input type="file" id="btn-import" accept=".json" style="display:none"></label>' +
      '<button class="btn danger" id="btn-reset">Reset all progress</button></div>' +
      '<h2>About</h2><p class="small muted">Software Architect Academy — a fully offline learning application. No data leaves your machine. Version 1.0.</p>' +
      '</div>');
    main.appendChild(card);
    var sel = card.querySelector('#set-theme');
    sel.value = st.settings.theme;
    sel.addEventListener('change', function () { st.settings.theme = sel.value; S.store.save(); S.app.applyTheme(); });
    card.querySelector('#btn-export').addEventListener('click', function () {
      S.download('saa-progress-' + S.today() + '.json', S.store.exportJSON(), 'application/json');
    });
    card.querySelector('#btn-import').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var err = S.store.importJSON(reader.result);
        if (err) S.toast('Import failed: ' + err);
        else { S.toast('Progress imported.'); S.app.applyTheme(); S.router.resolve(); }
      };
      reader.readAsText(f);
    });
    card.querySelector('#btn-reset').addEventListener('click', function () {
      if (confirm('Really reset ALL progress? This cannot be undone. Consider exporting first.')) {
        S.store.reset(); S.toast('Progress reset.'); S.router.resolve();
      }
    });
  });

  /* ---------- Search results ---------- */
  S.router.add('/search', function (main) {
    var params = new URLSearchParams((location.hash.split('?')[1] || ''));
    var q = params.get('q') || '';
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Search' }]) +
      '<h1>Search</h1>';
    var input = S.h('<div class="toolbar"><input type="search" id="sr-q" style="flex:1;max-width:480px" value="' + S.esc(q) + '" placeholder="Search everything…" aria-label="Search"></div>');
    main.appendChild(input);
    var results = S.h('<div></div>'); main.appendChild(results);
    function render(qq) {
      var items = S.search.query(qq);
      results.innerHTML = items.length ?
        '<p class="muted small">' + items.length + ' results</p>' + items.map(function (r) {
          return '<div class="sr-item"><div class="sr-kind">' + S.esc(r.kind) + '</div><a href="#' + r.route + '">' + S.esc(r.title) + '</a></div>';
        }).join('') :
        (qq.length >= 2 ? '<p class="empty">No results for “' + S.esc(qq) + '”.</p>' : '<p class="muted">Type at least two characters.</p>');
    }
    input.querySelector('input').addEventListener('input', function (e) { render(e.target.value); });
    render(q);
  });
})(window.SAA);
