/* learn.js — courses, lesson view, tracks, learning paths + diagnostic */
(function (S) {
  'use strict';

  var LEVEL_NAMES = { 1: 'Architecture Foundations', 2: 'Applied Solution Architecture', 3: 'Advanced Architecture', 4: 'Architect Mastery' };

  var TRACKS = {
    foundations: { title: 'Architecture Foundations', desc: 'What architecture is, architect roles, drivers, principles, and core terminology.', cats: ['foundations'] },
    modelling: { title: 'Modelling & Diagramming', desc: 'C4, UML, ArchiMate, capability maps, event storming, and choosing the right diagram.', cats: ['modelling'] },
    distributed: { title: 'Distributed Systems', desc: 'CAP, consistency, transactions, resilience, scaling, and failure handling.', cats: ['distributed'] },
    cloud: { title: 'Cloud Architecture', desc: 'Provider-neutral cloud principles, landing zones, IaC, cost, and lock-in.', cats: ['cloud'] },
    security: { title: 'Security Architecture', desc: 'IAM, Zero Trust, threat modelling, encryption, and compliance by design.', cats: ['security'] },
    data: { title: 'Data Architecture', desc: 'Data ownership, store selection, governance, lineage, mesh, and reconciliation.', cats: ['data'] },
    integration: { title: 'Integration Architecture', desc: 'Sync/async styles, APIs, messaging, streaming, and integration ownership.', cats: ['integration'] },
    banking: { title: 'Banking Technology Architecture', desc: 'Banking domains, entities, payments, screening, financial crime, and regulatory controls.', cats: ['banking'] },
    java: { title: 'Java & Spring Architecture', desc: 'Application architecture, transactions, resilience, security, and JVM performance.', cats: ['java'] },
    kafka: { title: 'Kafka & Event-Driven Architecture', desc: 'Topics, partitions, delivery semantics, schema evolution, and operations.', cats: ['kafka'] },
    microservices: { title: 'Microservices Architecture', desc: 'Boundaries, data ownership, communication, migration — and when not to use them.', cats: ['microservices'] }
  };
  S.TRACKS = TRACKS;

  function lessonCard(l) {
    var done = S.store.lessonDone(l.id);
    return S.ui.card({
      route: '/lesson/' + l.id, title: (done ? '✓ ' : '') + l.title,
      desc: (l.objectives || [])[0],
      chips: S.ui.chip('Level ' + l.level) + ' ' + S.ui.chip(l.difficulty, l.difficulty === 'Beginner' ? 'good' : l.difficulty === 'Expert' ? 'bad' : ''),
      meta: '<span>' + S.fmtDur(l.duration) + '</span><span>' + S.esc(l.cat) + '</span>' + (done ? '<span class="badge-done">Completed</span>' : '')
    });
  }

  /* ---------- Courses ---------- */
  S.router.add('/courses', function (main) {
    var params = new URLSearchParams((location.hash.split('?')[1] || ''));
    var lv = params.get('level');
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Courses' }]) + '<h1>Courses</h1>' +
      '<p class="muted">Sixty-plus lessons across four levels plus specialist tracks. Work top-down, or follow your <a href="#/paths">personalised path</a>.</p>';
    main.innerHTML = html;
    var filter = S.h('<div class="toolbar"><label style="margin:0">Level</label><select id="lv-f"><option value="">All levels</option>' +
      [1, 2, 3, 4].map(function (n) { return '<option value="' + n + '"' + (lv == n ? ' selected' : '') + '>Level ' + n + ' — ' + LEVEL_NAMES[n] + '</option>'; }).join('') +
      '</select><label style="margin:0">Category</label><select id="cat-f"><option value="">All categories</option>' +
      Object.keys(TRACKS).map(function (t) { return '<option value="' + TRACKS[t].cats[0] + '">' + TRACKS[t].title + '</option>'; }).join('') +
      '<option value="applied">Applied practice</option><option value="mastery">Mastery & leadership</option></select>' +
      '<input id="txt-f" type="search" placeholder="Filter by title…" aria-label="Filter lessons"></div>');
    main.appendChild(filter);
    var listEl = S.h('<div></div>');
    main.appendChild(listEl);
    function render() {
      var lvv = filter.querySelector('#lv-f').value, cat = filter.querySelector('#cat-f').value, txt = filter.querySelector('#txt-f').value.toLowerCase();
      var lessons = (S.data.lessons || []).filter(function (l) {
        return (!lvv || l.level == lvv) && (!cat || l.cat === cat) && (!txt || l.title.toLowerCase().indexOf(txt) >= 0);
      });
      var byLevel = {};
      lessons.forEach(function (l) { (byLevel[l.level] = byLevel[l.level] || []).push(l); });
      listEl.innerHTML = Object.keys(byLevel).sort().map(function (k) {
        return '<h2>Level ' + k + ': ' + LEVEL_NAMES[k] + '</h2><div class="grid">' + byLevel[k].map(lessonCard).join('') + '</div>';
      }).join('') || '<p class="empty">No lessons match the filter.</p>';
    }
    filter.addEventListener('input', render);
    render();
  });

  /* ---------- Track ---------- */
  S.router.add('/track/:id', function (main, p) {
    var t = TRACKS[p.id];
    if (!t) { main.innerHTML = '<h1>Unknown track</h1><p><a href="#/courses">All courses</a></p>'; return; }
    var lessons = (S.data.lessons || []).filter(function (l) { return t.cats.indexOf(l.cat) >= 0; })
      .sort(function (a, b) { return a.level - b.level; });
    var done = lessons.filter(function (l) { return S.store.lessonDone(l.id); }).length;
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Courses', href: '/courses' }, { label: t.title }]) +
      '<h1>' + S.esc(t.title) + '</h1><p class="muted">' + S.esc(t.desc) + '</p>' +
      '<p>' + done + ' of ' + lessons.length + ' lessons complete</p>' + S.ui.bar(lessons.length ? done / lessons.length * 100 : 0) +
      '<div class="grid" style="margin-top:16px">' + lessons.map(lessonCard).join('') + '</div>';
    // related resources per track
    var rel = { banking: ['/case-studies', 'Case studies 9–17 are banking-specific'], kafka: ['/kafka-designer', 'Design topics in the Kafka Topic Designer'], microservices: ['/patterns', 'See the pattern library for decomposition patterns'] }[p.id];
    if (rel) html += '<div class="callout"><div class="co-title">Related</div><a href="#' + rel[0] + '">' + rel[1] + ' →</a></div>';
    main.innerHTML = html;
  });

  /* ---------- Lesson ---------- */
  S.router.add('/lesson/:id', function (main, p) {
    var l = (S.data.lessons || []).find(function (x) { return x.id === p.id; });
    if (!l) { main.innerHTML = '<h1>Lesson not found</h1><p><a href="#/courses">All courses</a></p>'; return; }
    var done = S.store.lessonDone(l.id);
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Courses', href: '/courses' }, { label: 'Level ' + l.level, href: '/courses?level=' + l.level }, { label: l.title }]) +
      '<h1>' + S.esc(l.title) + '</h1>' +
      '<p>' + S.ui.chip('Level ' + l.level) + ' ' + S.ui.chip(l.difficulty) + ' ' + S.ui.chip(S.fmtDur(l.duration)) +
      (done ? ' ' + S.ui.chip('✓ Completed', 'good') : '') + '</p>';
    if (l.prerequisites && l.prerequisites.length) {
      html += '<p class="small muted">Prerequisites: ' + l.prerequisites.map(function (pid) {
        var pl = (S.data.lessons || []).find(function (x) { return x.id === pid; });
        return pl ? '<a href="#/lesson/' + pid + '">' + S.esc(pl.title) + '</a>' : pid;
      }).join(' · ') + '</p>';
    }
    html += '<div class="callout"><div class="co-title">Learning objectives</div><ul>' +
      (l.objectives || []).map(function (o) { return '<li>' + S.esc(o) + '</li>'; }).join('') + '</ul></div>';
    (l.sections || []).forEach(function (sec) {
      html += '<h2>' + S.esc(sec.h) + '</h2>' + S.md(sec.md);
    });
    if (l.diagram) html += S.diagram(l.diagram, l.diagramCaption);
    if (l.exercise) {
      html += '<h2>Exercise</h2>' + S.md(l.exercise.task) +
        '<details><summary>Show model answer</summary>' + S.md(l.exercise.answer) + '</details>';
    }
    if (l.refs && l.refs.length) {
      html += '<h2>Further reading</h2><ul>' + l.refs.map(function (r) { return '<li>' + S.esc(r) + '</li>'; }).join('') + '</ul>' +
        '<p class="small muted">Full links in <a href="#/references">References</a>.</p>';
    }
    main.innerHTML = html;

    var actions = S.h('<div class="btn-row"></div>');
    actions.appendChild(S.ui.bookmarkBtn('lesson', l.id, l.title));
    var printBtn = S.h('<button class="btn small secondary">🖨 Print</button>');
    printBtn.addEventListener('click', function () { window.print(); });
    actions.appendChild(printBtn);
    main.insertBefore(actions, main.children[2]);
    main.appendChild(S.ui.noteBox('lesson.' + l.id));

    // Quiz: authored questions for this lesson + generated from glossary category
    var authored = (S.data.quizQs || []).filter(function (q) { return q.lessonId === l.id; });
    var gen = S.ui.genGlossaryQs(Math.max(0, 5 - authored.length), l.glossCat || null);
    var questions = authored.concat(gen);
    if (questions.length) {
      var qh = S.h('<h2>Check your understanding</h2>');
      main.appendChild(qh);
      main.appendChild(S.h('<p class="muted small">Answers and explanations are revealed only after you submit.</p>'));
      var qwrap = S.h('<div></div>');
      main.appendChild(qwrap);
      S.ui.quiz(qwrap, questions, {
        onDone: function (score, total) {
          S.store.completeLesson(l.id, score, total);
          qwrap.appendChild(S.h('<p>Lesson marked complete. ' +
            (S.nextLesson() ? '<a class="btn" href="#/lesson/' + S.nextLesson().id + '">Next lesson →</a>' : '') + '</p>'));
        }
      });
    } else {
      var doneBtn = S.h('<button class="btn">Mark lesson complete</button>');
      doneBtn.addEventListener('click', function () { S.store.completeLesson(l.id, null, null); S.toast('Lesson complete.'); S.router.resolve(); });
      main.appendChild(doneBtn);
    }

    if (l.related && l.related.length) {
      var relHtml = '<h2>Related lessons</h2><div class="grid">' + l.related.map(function (rid) {
        var rl = (S.data.lessons || []).find(function (x) { return x.id === rid; });
        return rl ? lessonCard(rl) : '';
      }).join('') + '</div>';
      main.appendChild(S.h('<div>' + relHtml + '</div>'));
    }
  });

  /* ---------- Learning paths + diagnostic ---------- */
  S.router.add('/paths', function (main) {
    var st = S.store.state;
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Learning Paths' }]) + '<h1>Learning Paths</h1>';
    main.innerHTML = html;

    if (!st.profile) {
      main.appendChild(S.h('<p class="muted">Answer a few questions and we will recommend the right path. You can change it at any time.</p>'));
      renderDiagnostic(main);
    } else {
      var cur = (S.data.paths || []).find(function (p) { return p.id === st.profile.pathId; });
      main.appendChild(S.h('<div class="callout good"><div class="co-title">Your recommended path</div>' +
        (cur ? '<strong>' + S.esc(cur.title) + '</strong> — ' + S.esc(cur.desc) : 'None selected') +
        ' <button class="btn small secondary" id="redo-diag">Retake diagnostic</button></div>'));
      main.querySelector('#redo-diag').addEventListener('click', function () {
        st.profile = null; S.store.save(); S.router.resolve();
      });
    }

    var grid = S.h('<div><h2>All paths</h2><div class="grid"></div></div>');
    var g = grid.querySelector('.grid');
    (S.data.paths || []).forEach(function (p) {
      var done = p.lessonIds.filter(function (id) { return S.store.lessonDone(id); }).length;
      var card = S.h(S.ui.card({
        route: '/path/' + p.id, title: p.title, desc: p.desc,
        chips: S.ui.chip(p.audience), meta: '<span>' + p.lessonIds.length + ' lessons</span><span>' + done + ' done</span>'
      }));
      g.appendChild(card);
    });
    main.appendChild(grid);
  });

  S.router.add('/path/:id', function (main, p) {
    var path = (S.data.paths || []).find(function (x) { return x.id === p.id; });
    if (!path) { main.innerHTML = '<h1>Path not found</h1>'; return; }
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Learning Paths', href: '/paths' }, { label: path.title }]) +
      '<h1>' + S.esc(path.title) + '</h1><p class="muted">' + S.esc(path.desc) + '</p>';
    html += '<div class="btn-row"><button class="btn" id="set-path">Set as my path</button></div><ol>';
    path.lessonIds.forEach(function (id) {
      var l = (S.data.lessons || []).find(function (x) { return x.id === id; });
      if (l) html += '<li>' + (S.store.lessonDone(id) ? '✓ ' : '') + '<a href="#/lesson/' + id + '">' + S.esc(l.title) + '</a> <span class="muted small">(' + S.fmtDur(l.duration) + ')</span></li>';
    });
    html += '</ol>';
    if (path.extras) html += '<h2>Also practise</h2>' + S.md(path.extras);
    main.innerHTML = html;
    main.querySelector('#set-path').addEventListener('click', function () {
      S.store.state.profile = S.store.state.profile || {};
      S.store.state.profile.pathId = path.id;
      S.store.save(); S.toast('Path set. The dashboard now recommends lessons from this path.');
    });
  });

  function renderDiagnostic(main) {
    var QS = [
      { k: 'exp', q: 'Years of software development experience?', o: ['0–2', '3–5', '6–10', '10+'] },
      { k: 'role', q: 'Current role?', o: ['Developer', 'Senior developer', 'Tech lead', 'Architect', 'Other'] },
      { k: 'java', q: 'Java / Spring Boot experience?', o: ['None', 'Basic', 'Strong', 'Expert'] },
      { k: 'micro', q: 'Microservices experience?', o: ['None', 'Used them', 'Designed them', 'Migrated a monolith'] },
      { k: 'kafka', q: 'Kafka / messaging experience?', o: ['None', 'Consumer/producer basics', 'Designed topics & consumers', 'Operated clusters'] },
      { k: 'cloud', q: 'Cloud & Kubernetes experience?', o: ['None', 'Deployed apps', 'Designed cloud architectures', 'Multi-region / landing zones'] },
      { k: 'sec', q: 'Security architecture experience?', o: ['None', 'Applied basics (TLS, OAuth)', 'Threat modelling', 'Led security reviews'] },
      { k: 'data', q: 'Data architecture experience?', o: ['None', 'Schema design', 'Multiple store types / CDC', 'Enterprise data platforms'] },
      { k: 'bank', q: 'Banking / financial services experience?', o: ['None', 'Some exposure', 'Worked in banking tech', 'Deep domain expertise'] },
      { k: 'model', q: 'Modelling experience (C4, UML)?', o: ['None', 'Read diagrams', 'Draw diagrams regularly', 'Teach others'] },
      { k: 'arch', q: 'Architecture experience?', o: ['None', 'Contributed to designs', 'Owned designs', 'Own architecture across teams'] },
      { k: 'target', q: 'What is your goal?', o: ['Become a software/solution architect', 'Banking technology architect role', 'Pass an architecture interview soon', 'Deepen a specialist area (Kafka, cloud, data)'] },
      { k: 'time', q: 'Available study time per week?', o: ['< 2 hours', '2–5 hours', '5–10 hours', '10+ hours'] }
    ];
    var form = S.h('<form class="card"></form>');
    QS.forEach(function (q, i) {
      form.appendChild(S.h('<label for="dq' + i + '">' + (i + 1) + '. ' + S.esc(q.q) + '</label>'));
      form.appendChild(S.h('<select id="dq' + i + '" data-k="' + q.k + '">' + q.o.map(function (o, oi) { return '<option value="' + oi + '">' + S.esc(o) + '</option>'; }).join('') + '</select>'));
    });
    form.appendChild(S.h('<div class="btn-row"><button class="btn" type="submit">Get my recommended path</button></div>'));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ans = {};
      form.querySelectorAll('select').forEach(function (s) { ans[s.getAttribute('data-k')] = +s.value; });
      var pathId = recommend(ans);
      S.store.state.profile = { answers: ans, pathId: pathId, date: S.today() };
      S.store.save();
      S.toast('Diagnostic complete — path recommended.');
      S.router.resolve();
    });
    main.appendChild(form);
  }

  function recommend(a) {
    if (a.target === 2) return 'interview-sprint';
    if (a.target === 1 || a.bank >= 2) return a.arch >= 2 ? 'fincrime-architect' : 'banking-architect';
    if (a.target === 3) {
      if (a.kafka >= 2) return 'kafka-integration';
      if (a.cloud >= 2) return 'cloud-architect';
      return 'microservices-path';
    }
    if (a.arch === 0 && a.exp <= 1) return 'fundamentals-refresh';
    if (a.role <= 1) return 'dev-to-architect';
    if (a.role === 2) return 'lead-to-solution';
    if (a.java >= 2) return 'java-to-app-architect';
    if (a.arch >= 2) return 'solution-to-enterprise';
    return 'dev-to-architect';
  }
})(window.SAA);
