/* library.js — patterns, glossary, flashcards, references, mistakes, communication, diagram challenge */
(function (S) {
  'use strict';

  /* ---------- Pattern library ---------- */
  S.router.add('/patterns', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Patterns' }]) +
      '<h1>Architecture Patterns</h1><p class="muted">' + (S.data.patterns || []).length + ' patterns. Every entry covers the problem, trade-offs, risks, when <em>not</em> to use it, and interview questions.</p>';
    var groups = [];
    (S.data.patterns || []).forEach(function (p) { if (groups.indexOf(p.group) < 0) groups.push(p.group); });
    var bar = S.h('<div class="toolbar"><input id="pf" type="search" placeholder="Search patterns…" aria-label="Search patterns"><select id="pg"><option value="">All groups</option>' +
      groups.map(function (g) { return '<option>' + S.esc(g) + '</option>'; }).join('') + '</select></div>');
    main.appendChild(bar);
    var listEl = S.h('<div></div>'); main.appendChild(listEl);
    function render() {
      var q = bar.querySelector('#pf').value.toLowerCase(), g = bar.querySelector('#pg').value;
      var items = (S.data.patterns || []).filter(function (p) {
        return (!g || p.group === g) && (!q || (p.name + ' ' + p.problem + ' ' + p.definition).toLowerCase().indexOf(q) >= 0);
      });
      listEl.innerHTML = '<div class="grid">' + items.map(function (p) {
        return S.ui.card({ route: '/pattern/' + p.id, title: p.name, desc: p.problem, chips: S.ui.chip(p.group), meta: '' });
      }).join('') + '</div>' + (items.length ? '' : '<p class="empty">No patterns match.</p>');
    }
    bar.addEventListener('input', render); render();
  });

  S.router.add('/pattern/:id', function (main, prm) {
    var p = (S.data.patterns || []).find(function (x) { return x.id === prm.id; });
    if (!p) { main.innerHTML = '<h1>Pattern not found</h1><p><a href="#/patterns">All patterns</a></p>'; return; }
    function list(arr) { return '<ul>' + arr.map(function (x) { return '<li>' + S.esc(x) + '</li>'; }).join('') + '</ul>'; }
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Patterns', href: '/patterns' }, { label: p.name }]) +
      '<h1>' + S.esc(p.name) + '</h1><p>' + S.ui.chip(p.group) + '</p>' +
      '<blockquote>' + S.esc(p.definition) + '</blockquote>' +
      '<h2>Problem it solves</h2><p>' + S.esc(p.problem) + '</p>' +
      '<h2>Context</h2><p>' + S.esc(p.context) + '</p>' +
      '<h2>How it works</h2>' + S.md(p.how);
    if (p.diagram) html += S.diagram(p.diagram, p.name);
    html += '<div class="two-col"><div><h2>Advantages</h2>' + list(p.pros) + '</div><div><h2>Disadvantages</h2>' + list(p.cons) + '</div></div>' +
      '<h2>Risks</h2>' + list(p.risks) +
      '<div class="callout good"><div class="co-title">When to use it</div>' + S.esc(p.use) + '</div>' +
      '<div class="callout bad"><div class="co-title">When NOT to use it</div>' + S.esc(p.avoid) + '</div>' +
      '<h2>Realistic example</h2>' + S.md(p.example) +
      '<h2>Common mistakes</h2>' + list(p.mistakes);
    if (p.related && p.related.length) {
      html += '<h2>Related patterns</h2><p>' + p.related.map(function (r) {
        var rp = (S.data.patterns || []).find(function (x) { return x.id === r; });
        return rp ? '<a class="chip" href="#/pattern/' + r + '">' + S.esc(rp.name) + '</a>' : '';
      }).join(' ') + '</p>';
    }
    html += '<h2>Interview questions</h2><ol>' + p.interviewQs.map(function (q) { return '<li>' + S.esc(q) + '</li>'; }).join('') + '</ol>';
    main.innerHTML = html;
    var actions = S.h('<div class="btn-row"></div>');
    actions.appendChild(S.ui.bookmarkBtn('pattern', p.id, p.name));
    main.insertBefore(actions, main.children[2]);
    main.appendChild(S.ui.noteBox('pattern.' + p.id));
  });

  /* ---------- Glossary ---------- */
  S.router.add('/glossary', function (main) {
    var params = new URLSearchParams((location.hash.split('?')[1] || ''));
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Glossary' }]) +
      '<h1>Glossary</h1><p class="muted">' + (S.data.glossary || []).length + ' terms with simple + technical definitions, examples, misconceptions, and interview relevance. Review them as <a href="#/flashcards">flashcards</a>.</p>';
    var cats = [];
    (S.data.glossary || []).forEach(function (g) { if (cats.indexOf(g.cat) < 0) cats.push(g.cat); });
    cats.sort();
    var bar = S.h('<div class="toolbar"><input id="gf" type="search" placeholder="Search terms…" aria-label="Search glossary" value="' + S.esc(params.get('q') || '') + '"><select id="gc"><option value="">All categories</option>' +
      cats.map(function (c) { return '<option>' + S.esc(c) + '</option>'; }).join('') + '</select><span class="muted small" id="gcount"></span></div>');
    main.appendChild(bar);
    var listEl = S.h('<div></div>'); main.appendChild(listEl);
    function render() {
      var q = bar.querySelector('#gf').value.toLowerCase(), c = bar.querySelector('#gc').value;
      var items = (S.data.glossary || []).filter(function (g) {
        return (!c || g.cat === c) && (!q || (g.term + ' ' + g.simple).toLowerCase().indexOf(q) >= 0);
      }).sort(function (a, b) { return a.term.localeCompare(b.term); });
      bar.querySelector('#gcount').textContent = items.length + ' terms';
      listEl.innerHTML = items.slice(0, 400).map(function (g) {
        return '<details><summary>' + S.esc(g.term) + ' <span class="chip">' + S.esc(g.cat) + '</span></summary>' +
          '<p><strong>Simply:</strong> ' + S.esc(g.simple) + '</p>' +
          '<p><strong>Technically:</strong> ' + S.esc(g.technical) + '</p>' +
          '<p><strong>Example:</strong> ' + S.esc(g.example) + '</p>' +
          (g.misconception ? '<p><strong>Common misunderstanding:</strong> ' + S.esc(g.misconception) + '</p>' : '') +
          (g.interview ? '<p><strong>Interview relevance:</strong> ' + S.esc(g.interview) + '</p>' : '') +
          (g.related && g.related.length ? '<p class="small muted">Related: ' + g.related.map(S.esc).join(', ') + '</p>' : '') +
          '</details>';
      }).join('') || '<p class="empty">No terms match.</p>';
    }
    bar.addEventListener('input', render); render();
  });

  /* ---------- Flashcards (Leitman-style spaced review, 5 boxes) ---------- */
  S.router.add('/flashcards', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Flashcards' }]) +
      '<h1>Flashcards</h1><p class="muted">Spaced review over the glossary. Cards you miss come back sooner (box 1 = daily, box 5 = every 3 weeks).</p>';
    var st = S.store.state;
    var cats = [];
    (S.data.glossary || []).forEach(function (g) { if (cats.indexOf(g.cat) < 0) cats.push(g.cat); });
    var bar = S.h('<div class="toolbar"><select id="fc-cat"><option value="">All categories</option>' + cats.sort().map(function (c) { return '<option>' + S.esc(c) + '</option>'; }).join('') + '</select><span class="muted small" id="fc-due"></span></div>');
    main.appendChild(bar);
    var area = S.h('<div></div>'); main.appendChild(area);

    function duePool(cat) {
      var today = S.today();
      return (S.data.glossary || []).filter(function (g) {
        if (cat && g.cat !== cat) return false;
        var f = st.flash[g.id];
        return !f || f.due <= today;
      });
    }
    function next() {
      var cat = bar.querySelector('#fc-cat').value;
      var pool = duePool(cat);
      bar.querySelector('#fc-due').textContent = pool.length + ' cards due';
      if (!pool.length) { area.innerHTML = '<p class="empty">🎉 Nothing due right now. Come back tomorrow, or pick another category.</p>'; return; }
      var g = pool[Math.floor(Math.random() * pool.length)];
      area.innerHTML = '';
      var card = S.h('<div class="flashcard" tabindex="0" role="button" aria-label="Flip card"><div class="fterm">' + S.esc(g.term) + '</div><p class="muted small">click or press Enter to flip</p></div>');
      var flipped = false;
      function flip() {
        if (flipped) return;
        flipped = true;
        card.innerHTML = '<div class="fterm" style="font-size:1.05rem">' + S.esc(g.term) + '</div><p>' + S.esc(g.simple) + '</p><p class="small muted">' + S.esc(g.technical) + '</p>';
        var row = S.h('<div class="btn-row" style="justify-content:center"><button class="btn danger">✗ Missed it</button><button class="btn secondary">≈ Hard</button><button class="btn" style="background:var(--good)">✓ Knew it</button></div>');
        var f = st.flash[g.id] || { box: 1 };
        var btns = row.querySelectorAll('button');
        btns[0].addEventListener('click', function () { grade(g, 1); });
        btns[1].addEventListener('click', function () { grade(g, Math.max(1, f.box)); });
        btns[2].addEventListener('click', function () { grade(g, Math.min(5, (f.box || 1) + 1)); });
        area.appendChild(row);
      }
      function grade(g2, box) {
        var days = [0, 1, 3, 7, 14, 21][box];
        var d = new Date(); d.setDate(d.getDate() + days);
        st.flash[g2.id] = { box: box, due: d.toISOString().slice(0, 10) };
        S.store.save(); S.store.touchActivity();
        next();
      }
      card.addEventListener('click', flip);
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
      area.appendChild(card);
    }
    bar.addEventListener('change', next);
    next();
  });

  /* ---------- References ---------- */
  S.router.add('/references', function (main) {
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'References' }]) +
      '<h1>References</h1><p class="muted">Authoritative sources behind this curriculum. The app works fully offline; these links are for optional deeper study when you are online.</p>';
    var groups = {};
    (S.data.references || []).forEach(function (r) { (groups[r.group] = groups[r.group] || []).push(r); });
    Object.keys(groups).forEach(function (g) {
      html += '<h2>' + S.esc(g) + '</h2><ul>' + groups[g].map(function (r) {
        return '<li><a href="' + S.esc(r.url) + '" target="_blank" rel="noopener">' + S.esc(r.title) + '</a> — <span class="muted small">' + S.esc(r.note) + '</span></li>';
      }).join('') + '</ul>';
    });
    main.innerHTML = html;
  });

  /* ---------- Common architect mistakes ---------- */
  S.router.add('/mistakes', function (main) {
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Common Mistakes' }]) +
      '<h1>Common Architect Mistakes</h1><p class="muted">Each mistake shows a realistic poor example, its consequence, and the improved approach. These are the failure modes interviewers probe for.</p>';
    (S.data.mistakes || []).forEach(function (m, i) {
      html += '<details' + (i === 0 ? ' open' : '') + '><summary>' + (i + 1) + '. ' + S.esc(m.title) + '</summary>' +
        '<div class="callout bad"><div class="co-title">Poor example</div>' + S.md(m.poor) + '</div>' +
        '<div class="callout warn"><div class="co-title">Consequence</div>' + S.md(m.consequence) + '</div>' +
        '<div class="callout good"><div class="co-title">Improved approach</div>' + S.md(m.improved) + '</div></details>';
    });
    main.innerHTML = html;
  });

  /* ---------- Communication skills ---------- */
  S.router.add('/communication', function (main) {
    var d = S.data.communication || {};
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Communication' }]) +
      '<h1>Communication Skills</h1><p class="muted">The same architecture must be explained differently to each audience. Master the translations below, then do the exercises.</p>';
    html += '<h2>Audience translations</h2><p>Worked example: <em>' + S.esc(d.scenario) + '</em></p>';
    (d.audiences || []).forEach(function (a) {
      html += '<details><summary>' + S.esc(a.who) + '</summary><p><strong>They care about:</strong> ' + S.esc(a.cares) + '</p>' +
        '<p><strong>Vocabulary to use / avoid:</strong> ' + S.esc(a.vocab) + '</p>' +
        '<div class="callout good"><div class="co-title">Example explanation</div>' + S.esc(a.example) + '</div></details>';
    });
    html += '<h2>Answer structures</h2>';
    (d.structures || []).forEach(function (s) {
      html += '<h3>' + S.esc(s.name) + '</h3>' + S.md(s.md);
    });
    html += '<h2>Exercises</h2>';
    (d.exercises || []).forEach(function (e, i) {
      html += '<div class="quiz-q"><p><strong>' + (i + 1) + '. ' + S.esc(e.task) + '</strong></p>' +
        '<textarea data-ck="comm.' + i + '" placeholder="Write your answer…"></textarea>' +
        '<details><summary>Show model answer</summary>' + S.md(e.model) + '</details></div>';
    });
    main.innerHTML = html;
    main.querySelectorAll('textarea[data-ck]').forEach(function (ta) {
      var key = ta.getAttribute('data-ck');
      ta.value = S.store.note(key);
      ta.addEventListener('input', function () { S.store.note(key, ta.value); });
    });
  });

  /* ---------- Choose the right diagram challenge ---------- */
  S.router.add('/diagram-challenge', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Diagram Challenge' }]) +
      '<h1>Choose the Right Diagram</h1><p class="muted">For each situation, pick the most appropriate modelling technique. Answers are explained after you submit.</p>';
    var qs = (S.data.diagramChallenge || []).map(function (c) {
      return { type: 'mc', q: c.q, options: c.options, answer: c.answer, explain: c.explain };
    });
    var wrap = S.h('<div></div>'); main.appendChild(wrap);
    S.ui.quiz(wrap, S.shuffle(qs).slice(0, 10), {
      onDone: function (s, t) {
        S.store.state.quizzes['diagram-challenge'] = { score: s, total: t, date: S.today() };
        S.store.save(); S.store.touchActivity();
        if (s / t >= 0.8) S.store.award('context-modeller');
      }
    });
  });
})(window.SAA);
