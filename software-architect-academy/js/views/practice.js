/* practice.js — case studies, labs, review simulator, interview bank,
   mock interview simulator, system-design simulator, assessments hub */
(function (S) {
  'use strict';

  /* ---------------- Case studies ---------------- */
  S.router.add('/case-studies', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Case Studies' }]) +
      '<h1>Case Studies</h1><p class="muted">Progressively harder, attempt-first: write your own design before the model solution unlocks. Banking cases build on the general ones.</p>' +
      '<div class="grid">' + (S.data.caseStudies || []).map(function (c, i) {
        var st = S.store.state.cases[c.id];
        return S.ui.card({
          route: '/case-study/' + c.id, title: (i + 1) + '. ' + c.title, desc: c.problem.slice(0, 110) + '…',
          chips: S.ui.chip(c.difficulty, c.difficulty === 'Beginner' ? 'good' : c.difficulty === 'Expert' ? 'bad' : '') + (c.banking ? ' ' + S.ui.chip('Banking', 'warn') : ''),
          meta: st && st.revealed ? '<span class="badge-done">Attempted</span>' : '<span>Not attempted</span>'
        });
      }).join('') + '</div>';
  });

  S.router.add('/case-study/:id', function (main, p) {
    var c = (S.data.caseStudies || []).find(function (x) { return x.id === p.id; });
    if (!c) { main.innerHTML = '<h1>Case study not found</h1><p><a href="#/case-studies">All case studies</a></p>'; return; }
    var st = S.store.state.cases[c.id] = S.store.state.cases[c.id] || {};
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Case Studies', href: '/case-studies' }, { label: c.title }]) +
      '<h1>' + S.esc(c.title) + '</h1><p>' + S.ui.chip(c.difficulty) + (c.banking ? ' ' + S.ui.chip('Banking', 'warn') : '') + '</p>' +
      '<h2>Problem statement</h2>' + S.md(c.problem) +
      '<h2>Clarifying questions you should ask</h2><ul>' + c.clarifying.map(function (q) { return '<li>' + S.esc(q) + '</li>'; }).join('') + '</ul>' +
      '<div class="two-col"><div><h2>Requirements</h2>' + S.md(c.requirements) + '</div>' +
      '<div><h2>Scale & constraints</h2>' + S.md(c.scale) + '</div></div>';
    main.innerHTML = html;
    main.appendChild(S.ui.bookmarkBtn('case', c.id, c.title));

    // Attempt area
    var attempt = S.h('<div><h2>Your design attempt</h2><p class="muted small">Work through: assumptions → entities → APIs/events → high-level architecture → failure handling → trade-offs. The model solution unlocks after you submit a genuine attempt (min 300 characters).</p>' +
      '<textarea id="cs-attempt" style="min-height:220px" placeholder="Write your design here…"></textarea>' +
      '<div class="btn-row"><button class="btn" id="cs-submit">Submit attempt & unlock model solution</button></div></div>');
    attempt.querySelector('#cs-attempt').value = st.attempt || '';
    attempt.querySelector('#cs-attempt').addEventListener('input', function (e) { st.attempt = e.target.value; S.store.save(); });
    main.appendChild(attempt);
    var solWrap = S.h('<div></div>');
    main.appendChild(solWrap);

    function renderSolution() {
      var html2 = '<hr><h2>📖 Model solution</h2>' +
        '<h3>Architecture options considered</h3>' + S.md(c.options) +
        '<h3>Recommended architecture</h3>' + S.md(c.recommended);
      if (c.diagram) html2 += S.diagram(c.diagram, 'Recommended architecture (container level)');
      html2 += '<h3>Trade-offs</h3>' + S.md(c.tradeoffs) +
        '<h3>Data model & APIs</h3>' + S.md(c.dataApis) +
        (c.kafka ? '<h3>Events & Kafka topics</h3>' + S.md(c.kafka) : '') +
        '<h3>Security</h3>' + S.md(c.security) +
        '<h3>Failure scenarios & resilience</h3>' + S.md(c.failures) +
        '<h3>Operations: deployment, monitoring, cost</h3>' + S.md(c.operations) +
        (c.migration ? '<h3>Migration, rollback & reconciliation</h3>' + S.md(c.migration) : '') +
        '<h3>Key ADRs for this design</h3>' + S.md(c.adrs) +
        '<h3>Interview follow-up questions</h3><ol>' + c.followups.map(function (f) { return '<li>' + S.esc(f) + '</li>'; }).join('') + '</ol>' +
        '<h3>Score yourself against the rubric</h3>';
      solWrap.innerHTML = html2;
      var rubric = S.h('<div class="card"></div>');
      var total = 0;
      c.rubric.forEach(function (r, i) {
        var row = S.h('<div style="margin:8px 0"><div class="small"><strong>' + S.esc(r) + '</strong></div>' +
          '<select data-r="' + i + '"><option value="0">0 — missed entirely</option><option value="1">1 — mentioned</option><option value="2">2 — covered adequately</option><option value="3">3 — covered with trade-offs</option></select></div>');
        rubric.appendChild(row);
      });
      var out = S.h('<div class="btn-row"><button class="btn">Save self-score</button></div>');
      out.querySelector('button').addEventListener('click', function () {
        var sc = 0;
        rubric.querySelectorAll('select').forEach(function (s) { sc += +s.value; });
        st.selfScore = Math.round(sc / (c.rubric.length * 3) * 100);
        st.date = S.today(); S.store.save(); S.store.touchActivity();
        S.toast('Self-score saved: ' + st.selfScore + '%');
      });
      rubric.appendChild(out);
      solWrap.appendChild(rubric);
      solWrap.appendChild(S.ui.noteBox('case.' + c.id));
    }

    attempt.querySelector('#cs-submit').addEventListener('click', function () {
      if ((st.attempt || '').length < 300) { S.toast('Write a fuller attempt first (at least ~300 characters) — the value is in trying before looking.'); return; }
      st.revealed = true; S.store.save(); S.store.touchActivity();
      renderSolution();
      attempt.querySelector('#cs-submit').disabled = true;
    });
    if (st.revealed) { renderSolution(); attempt.querySelector('#cs-submit').disabled = true; }
  });

  /* ---------------- Labs ---------------- */
  S.router.add('/labs', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Labs' }]) +
      '<h1>Hands-on Labs</h1><p class="muted">Practical exercises with a workspace, hints, model answers, and scoring rubrics.</p>' +
      '<div class="grid">' + (S.data.labs || []).map(function (l, i) {
        var st = S.store.state.labs[l.id];
        return S.ui.card({
          route: '/lab/' + l.id, title: (i + 1) + '. ' + l.title, desc: l.scenario.slice(0, 100) + '…',
          chips: S.ui.chip(l.difficulty || 'Intermediate'),
          meta: st && st.status === 'done' ? '<span class="badge-done">Completed</span>' : '<span>' + S.fmtDur(l.duration || 45) + '</span>'
        });
      }).join('') + '</div>';
  });

  S.router.add('/lab/:id', function (main, p) {
    var l = (S.data.labs || []).find(function (x) { return x.id === p.id; });
    if (!l) { main.innerHTML = '<h1>Lab not found</h1><p><a href="#/labs">All labs</a></p>'; return; }
    var st = S.store.state.labs[l.id] = S.store.state.labs[l.id] || {};
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Labs', href: '/labs' }, { label: l.title }]) +
      '<h1>' + S.esc(l.title) + '</h1>' +
      '<h2>Scenario</h2>' + S.md(l.scenario) +
      '<h2>Input information</h2>' + S.md(l.input) +
      '<h2>Instructions</h2><ol>' + l.instructions.map(function (i2) { return '<li>' + S.esc(i2) + '</li>'; }).join('') + '</ol>' +
      '<h2>Expected deliverables</h2><ul>' + l.deliverables.map(function (d) { return '<li>' + S.esc(d) + '</li>'; }).join('') + '</ul>';
    main.innerHTML = html;

    // Hints (progressive)
    var hintWrap = S.h('<div><h2>Hints</h2></div>');
    l.hints.forEach(function (h, i) {
      hintWrap.appendChild(S.h('<details><summary>Hint ' + (i + 1) + '</summary><p>' + S.esc(h) + '</p></details>'));
    });
    main.appendChild(hintWrap);

    var ws = S.h('<div><h2>Workspace</h2><textarea style="min-height:240px" placeholder="Do the lab work here — lists, tables, pseudo-diagrams (text), decisions and reasons…"></textarea></div>');
    ws.querySelector('textarea').value = st.work || '';
    ws.querySelector('textarea').addEventListener('input', function (e) { st.work = e.target.value; S.store.save(); });
    main.appendChild(ws);

    var revealWrap = S.h('<div></div>');
    var btn = S.h('<div class="btn-row"><button class="btn">Reveal model answer & rubric</button></div>');
    btn.querySelector('button').addEventListener('click', function () {
      if ((st.work || '').length < 150) { S.toast('Attempt the lab first — write at least a rough answer in the workspace.'); return; }
      renderAnswer();
      btn.querySelector('button').disabled = true;
    });
    main.appendChild(btn);
    main.appendChild(revealWrap);

    function renderAnswer() {
      revealWrap.innerHTML = '<hr><h2>Model answer</h2>' + S.md(l.modelAnswer) +
        '<h2>Common mistakes</h2><ul>' + l.mistakes.map(function (m) { return '<li>' + S.esc(m) + '</li>'; }).join('') + '</ul>' +
        '<h2>Reflection questions</h2><ul>' + l.reflection.map(function (r) { return '<li>' + S.esc(r) + '</li>'; }).join('') + '</ul>' +
        '<h2>Scoring rubric — rate your work</h2>';
      var rb = S.h('<div class="card"></div>');
      l.rubric.forEach(function (r, i) {
        rb.appendChild(S.h('<div style="margin:8px 0"><div class="small"><strong>' + S.esc(r) + '</strong></div><select data-i="' + i + '"><option value="0">0 — missed</option><option value="1">1 — partial</option><option value="2">2 — solid</option></select></div>'));
      });
      var done = S.h('<div class="btn-row"><button class="btn">Complete lab</button></div>');
      done.querySelector('button').addEventListener('click', function () {
        var sc = 0;
        rb.querySelectorAll('select').forEach(function (s) { sc += +s.value; });
        st.status = 'done'; st.score = Math.round(sc / (l.rubric.length * 2) * 100); st.date = S.today();
        S.store.save(); S.store.touchActivity(); S.store.checkAchievements();
        S.toast('Lab completed — self-score ' + st.score + '%');
      });
      rb.appendChild(done);
      revealWrap.appendChild(rb);
    }
    if (st.status === 'done') { renderAnswer(); btn.querySelector('button').disabled = true; }
  });

  /* ---------------- Architecture review simulator ---------------- */
  S.router.add('/review-sim', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Review Simulator' }]) +
      '<h1>Architecture Review Simulator</h1><p class="muted">Each scenario is an intentionally flawed architecture. Identify the genuine problems, classify severity, and prioritise. Distractor findings are mixed in — selecting them costs points, just like raising non-issues in a real review board.</p>' +
      '<div class="grid">' + (S.data.reviewScenarios || []).map(function (r, i) {
        var st = S.store.state.reviews[r.id];
        return S.ui.card({
          route: '/review-sim/' + r.id, title: (i + 1) + '. ' + r.title, desc: r.description.slice(0, 110) + '…',
          meta: st ? '<span class="badge-done">Score ' + st.score + '%</span>' : '<span>Not reviewed</span>'
        });
      }).join('') + '</div>';
  });

  S.router.add('/review-sim/:id', function (main, p) {
    var r = (S.data.reviewScenarios || []).find(function (x) { return x.id === p.id; });
    if (!r) { main.innerHTML = '<h1>Scenario not found</h1><p><a href="#/review-sim">All scenarios</a></p>'; return; }
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Review Simulator', href: '/review-sim' }, { label: r.title }]) +
      '<h1>' + S.esc(r.title) + '</h1><h2>The proposal under review</h2>' + S.md(r.description);
    if (r.diagram) html += S.diagram(r.diagram, 'Proposed architecture');
    html += '<h2>Your review</h2><p class="muted small">Select every statement you believe is a genuine finding, set its severity, then pick your top three priorities. Some statements are decoys.</p>';
    main.innerHTML = html;

    var candidates = S.shuffle(r.findings.map(function (f, i) { return { text: f.title, real: true, idx: i }; })
      .concat(r.decoys.map(function (d) { return { text: d, real: false }; })));
    var form = S.h('<form class="card"></form>');
    candidates.forEach(function (c2, i) {
      form.appendChild(S.h('<div class="quiz-opt" style="flex-wrap:wrap"><label style="display:flex;gap:8px;margin:0;flex:1;font-weight:400;color:var(--text)"><input type="checkbox" data-i="' + i + '"> <span>' + S.esc(c2.text) + '</span></label>' +
        '<select data-sev="' + i + '" aria-label="Severity" disabled><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>'));
    });
    form.addEventListener('change', function (e) {
      if (e.target.type === 'checkbox') {
        form.querySelector('[data-sev="' + e.target.getAttribute('data-i') + '"]').disabled = !e.target.checked;
      }
    });
    form.appendChild(S.h('<label>Your top-3 priorities (comma-separated numbers of the findings you selected, in order)</label><input type="text" id="rv-prio" placeholder="e.g. 4, 9, 2" style="width:100%">'));
    form.appendChild(S.h('<label>Recommended remediations (free text — you will self-check against the model)</label><textarea id="rv-remed"></textarea>'));
    form.appendChild(S.h('<div class="btn-row"><button class="btn" type="submit">Submit review</button></div>'));
    main.appendChild(form);
    var out = S.h('<div></div>'); main.appendChild(out);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var picked = [];
      form.querySelectorAll('input[type=checkbox]').forEach(function (cb, i) { if (cb.checked) picked.push(i); });
      var hits = picked.filter(function (i) { return candidates[i].real; });
      var falsePos = picked.length - hits.length;
      var coverage = hits.length / r.findings.length;
      var precision = picked.length ? hits.length / picked.length : 0;
      // severity accuracy
      var sevOk = 0;
      hits.forEach(function (i) {
        var sel = form.querySelector('[data-sev="' + i + '"]').value;
        var want = r.findings[candidates[i].idx].severity;
        if (sel === want) sevOk++;
        else if ((sel === 'High' && want === 'Critical') || (sel === 'Critical' && want === 'High') || (sel === 'Medium' && want === 'High') || (sel === 'Low' && want === 'Medium')) sevOk += 0.5;
      });
      var sevScore = hits.length ? sevOk / hits.length : 0;
      var score = Math.round((coverage * 0.45 + precision * 0.3 + sevScore * 0.25) * 100);
      S.store.state.reviews[r.id] = { score: score, date: S.today() };
      S.store.save(); S.store.touchActivity(); S.store.checkAchievements();

      var html2 = '<div class="score-banner">Review score: ' + score + '% — coverage ' + Math.round(coverage * 100) + '%, precision ' + Math.round(precision * 100) + '%, severity accuracy ' + Math.round(sevScore * 100) + '%</div>';
      if (falsePos) html2 += '<div class="callout warn"><div class="co-title">' + falsePos + ' decoy(s) selected</div>In a real review board, raising non-issues burns credibility and meeting time. Re-read the ones marked below.</div>';
      html2 += '<h2>Model findings</h2>';
      r.findings.forEach(function (f) {
        var found = hits.some(function (i) { return candidates[i].idx === r.findings.indexOf(f); });
        html2 += '<div class="callout ' + (found ? 'good' : 'bad') + '"><div class="co-title">' + (found ? '✅ Found' : '❌ Missed') + ' — <span class="severity-' + f.severity.toLowerCase() + '">' + f.severity + '</span>: ' + S.esc(f.title) + '</div>' +
          '<p class="small"><strong>Risk:</strong> ' + S.esc(f.risk) + '</p><p class="small"><strong>Remediation:</strong> ' + S.esc(f.remediation) + '</p></div>';
      });
      html2 += '<h2>Decoys (correctly ignored = good judgement)</h2><ul>' + r.decoys.map(function (d) { return '<li>' + S.esc(d) + '</li>'; }).join('') + '</ul>';
      html2 += '<div class="callout"><div class="co-title">Model prioritisation</div>' + S.esc(r.priority) + '</div>';
      out.innerHTML = html2;
      out.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* Revision links: lesson ids link to lessons, cs* ids link to case studies */
  function revLink(id) {
    return id.indexOf('cs') === 0
      ? '<a href="#/case-study/' + id + '">case study ' + id + '</a>'
      : '<a href="#/lesson/' + id + '">lesson ' + id + '</a>';
  }

  /* ---------------- Interview question bank ---------------- */
  S.router.add('/interview', function (main) {
    var all = (S.data.interviewQs || []);
    var params = new URLSearchParams((location.hash.split('?')[1] || ''));
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Interview Practice' }]) +
      '<h1>Interview Question Bank</h1><p class="muted">' + all.length + ' original questions. Filter by role, category, and difficulty. Try answering aloud before expanding the guidance — that is how interviews work. For timed practice use the <a href="#/mock">mock interviews</a>.</p>';
    var roles = [], cats = [], diffs = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    all.forEach(function (q) {
      (q.role || []).forEach(function (r) { if (roles.indexOf(r) < 0) roles.push(r); });
      if (cats.indexOf(q.cat) < 0) cats.push(q.cat);
    });
    roles.sort(); cats.sort();
    var bar = S.h('<div class="toolbar"><input id="iq" type="search" placeholder="Search questions…" value="' + S.esc(params.get('q') || '') + '"><select id="ir"><option value="">All roles</option>' + roles.map(function (r) { return '<option>' + S.esc(r) + '</option>'; }).join('') + '</select>' +
      '<select id="ic"><option value="">All categories</option>' + cats.map(function (c) { return '<option>' + S.esc(c) + '</option>'; }).join('') + '</select>' +
      '<select id="id"><option value="">All difficulties</option>' + diffs.map(function (d) { return '<option>' + d + '</option>'; }).join('') + '</select><span class="muted small" id="icount"></span></div>');
    main.appendChild(bar);
    var listEl = S.h('<div></div>'); main.appendChild(listEl);
    function render() {
      var q = bar.querySelector('#iq').value.toLowerCase(), rr = bar.querySelector('#ir').value, cc = bar.querySelector('#ic').value, dd = bar.querySelector('#id').value;
      var items = all.filter(function (x) {
        return (!q || x.q.toLowerCase().indexOf(q) >= 0) && (!rr || (x.role || []).indexOf(rr) >= 0) && (!cc || x.cat === cc) && (!dd || x.difficulty === dd);
      });
      bar.querySelector('#icount').textContent = items.length + ' questions';
      listEl.innerHTML = items.slice(0, 60).map(qCard).join('') + (items.length > 60 ? '<p class="muted small">Showing first 60 — narrow the filter for more.</p>' : '') || '<p class="empty">No questions match.</p>';
    }
    function qCard(x) {
      return '<details class="quiz-q" style="padding:12px 16px"><summary><strong>' + S.esc(x.q) + '</strong><br><span class="small muted">' + S.ui.chip(x.cat) + ' ' + S.ui.chip(x.difficulty) + ' ' + (x.role || []).slice(0, 3).map(function (r) { return S.ui.chip(r); }).join(' ') + '</span></summary>' +
        '<p><strong>What the interviewer is testing:</strong> ' + S.esc(x.testing) + '</p>' +
        '<p><strong>Recommended structure:</strong> ' + S.esc(x.structure) + '</p>' +
        '<p><strong>Key points expected:</strong></p><ul>' + x.kp.map(function (k) { return '<li>' + S.esc(k[0]) + '</li>'; }).join('') + '</ul>' +
        '<div class="callout good"><div class="co-title">Sample strong answer</div>' + S.esc(x.strong) + '</div>' +
        '<div class="callout bad"><div class="co-title">Weak-answer warning signs</div>' + S.esc(x.weak) + '</div>' +
        (x.followups && x.followups.length ? '<p><strong>Likely follow-ups:</strong> ' + x.followups.map(S.esc).join(' · ') + '</p>' : '') +
        (x.lessons && x.lessons.length ? '<p class="small">Revise: ' + x.lessons.map(revLink).join(', ') + '</p>' : '') +
        '</details>';
    }
    bar.addEventListener('input', render); render();
  });

  /* ---------------- Mock interview simulator ---------------- */
  function keywordScore(answer, kp) {
    // kp: array of keyword groups; group matched if any keyword appears
    var a = (answer || '').toLowerCase();
    var matched = [], missed = [];
    kp.forEach(function (g) {
      var kws = g.slice(1);
      if (!kws.length) kws = g[0].toLowerCase().split(/[\s,/]+/).filter(function (w) { return w.length > 4; }).slice(0, 3);
      var hit = kws.some(function (k) { return a.indexOf(String(k).toLowerCase()) >= 0; });
      (hit ? matched : missed).push(g[0]);
    });
    return { matched: matched, missed: missed, pct: kp.length ? Math.round(matched.length / kp.length * 100) : 0 };
  }

  S.router.add('/mock', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Mock Interviews' }]) +
      '<h1>Mock Interviews</h1><p class="muted">Timed, structured interviews. Answers are scored by key-point coverage (clearly a heuristic — it checks whether you mentioned the concepts a strong answer contains) plus your self-review. No answers are shown until you submit.</p>';
    var sets = S.data.mockSets || [];
    var general = sets.filter(function (s) { return s.kind === 'general'; });
    var banking = sets.filter(function (s) { return s.kind === 'banking'; });
    function setCard(s) {
      var qCount = s.sections.reduce(function (a, sec) { return a + sec.qIds.length; }, 0);
      return S.ui.card({
        route: '/mock/run/' + s.id, title: s.title,
        desc: s.sections.map(function (x) { return x.name; }).join(' → '),
        chips: S.ui.chip(s.kind === 'banking' ? 'Banking' : 'General', s.kind === 'banking' ? 'warn' : '') + ' ' + S.ui.chip(s.difficulty),
        meta: '<span>' + qCount + ' questions</span><span>' + s.duration + ' min</span>'
      });
    }
    main.innerHTML += '<h2>General architecture interviews (' + general.length + ')</h2><div class="grid">' + general.map(setCard).join('') + '</div>' +
      '<h2>Banking architecture interviews (' + banking.length + ')</h2><div class="grid">' + banking.map(setCard).join('') + '</div>';
  });

  S.router.add('/mock/run/:id', function (main, p) {
    var set = (S.data.mockSets || []).find(function (x) { return x.id === p.id; });
    if (!set) { main.innerHTML = '<h1>Interview set not found</h1><p><a href="#/mock">All mock interviews</a></p>'; return; }
    var qs = [];
    set.sections.forEach(function (sec) {
      sec.qIds.forEach(function (qid) {
        var q = (S.data.interviewQs || []).find(function (x) { return x.id === qid; });
        if (q) qs.push({ section: sec.name, q: q });
      });
    });
    var idx = -1, answers = {}, notes = '', remaining = set.duration * 60, timerHandle = null;

    /* Save whatever is in the visible textarea — called on nav, timer expiry, and hash-leave,
       so a running answer is never lost (review finding: timer expiry discarded the current answer). */
    function saveCurrentAnswer() {
      if (idx < 0 || idx >= qs.length) return;
      var box = body.querySelector('#mi-a');
      if (!box) return;
      var item = qs[idx];
      var prev = answers[item.q.id] || {};
      answers[item.q.id] = { text: box.value, hint: !!prev.hint };
      var hintEl = body.querySelector('#mi-hint');
      if (hintEl && hintEl.open) answers[item.q.id].hint = true;
      var notesBox = body.querySelector('#mi-notes');
      if (notesBox) notes = notesBox.value;
    }
    window.addEventListener('hashchange', saveCurrentAnswer, { once: true });

    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Mock Interviews', href: '/mock' }, { label: set.title }]);
    var head = S.h('<div class="toolbar"><h1 style="margin:0;flex:1;font-size:1.2rem">' + S.esc(set.title) + '</h1><span class="timer" id="mi-timer">' + fmtT(remaining) + '</span></div>');
    main.appendChild(head);
    var body = S.h('<div></div>'); main.appendChild(body);

    function fmtT(s) { return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
    function startTimer() {
      timerHandle = setInterval(function () {
        remaining--;
        var t = S.el('#mi-timer');
        if (!t) { clearInterval(timerHandle); return; }
        t.textContent = fmtT(Math.max(0, remaining));
        if (remaining <= 300) t.classList.add('low');
        if (remaining <= 0) { clearInterval(timerHandle); S.toast('Time is up — the interview will be scored now.'); finish(); }
      }, 1000);
    }

    function renderIntro() {
      body.innerHTML = '<div class="card"><h2>Before you start</h2><ul>' +
        '<li>' + qs.length + ' questions across ' + set.sections.length + ' sections: ' + set.sections.map(function (s2) { return S.esc(s2.name); }).join(', ') + '.</li>' +
        '<li>Time limit: <strong>' + set.duration + ' minutes</strong>. The timer starts when you begin.</li>' +
        '<li>Type your answers as you would speak them. Optional hints cost 10% of that question\'s score.</li>' +
        '<li>No model answers are shown until the whole interview is submitted.</li></ul>' +
        '<div class="btn-row"><button class="btn" id="mi-start">Start interview</button></div></div>';
      body.querySelector('#mi-start').addEventListener('click', function () { idx = 0; startTimer(); renderQ(); });
    }

    function renderQ() {
      if (idx >= qs.length) { finish(); return; }
      var item = qs[idx];
      body.innerHTML = '<div class="small muted">' + S.esc(item.section) + ' — question ' + (idx + 1) + ' of ' + qs.length + '</div>' + S.ui.bar(idx / qs.length * 100) +
        '<div class="quiz-q"><p><strong>' + S.esc(item.q.q) + '</strong></p>' +
        '<textarea id="mi-a" style="min-height:170px" placeholder="Answer as you would speak — structure first, then depth…">' + S.esc(answers[item.q.id] ? answers[item.q.id].text : '') + '</textarea>' +
        '<details id="mi-hint"><summary>💡 Optional hint (costs 10%)</summary><p>' + S.esc(item.q.structure) + '</p></details>' +
        '<label>Interview notes (private)</label><textarea id="mi-notes" style="min-height:60px">' + S.esc(notes) + '</textarea>' +
        '<div class="btn-row">' + (idx > 0 ? '<button class="btn secondary" id="mi-prev">← Previous</button>' : '') +
        '<button class="btn" id="mi-next">' + (idx === qs.length - 1 ? 'Finish & score' : 'Next →') + '</button></div></div>';
      var hintUsed = false;
      body.querySelector('#mi-hint').addEventListener('toggle', function (e) { if (e.target.open) hintUsed = true; });
      function saveA() {
        answers[item.q.id] = { text: body.querySelector('#mi-a').value, hint: hintUsed || (answers[item.q.id] && answers[item.q.id].hint) };
        notes = body.querySelector('#mi-notes').value;
      }
      var prev = body.querySelector('#mi-prev');
      if (prev) prev.addEventListener('click', function () { saveA(); idx--; renderQ(); });
      body.querySelector('#mi-next').addEventListener('click', function () { saveA(); idx++; renderQ(); });
    }

    function finish() {
      saveCurrentAnswer();
      clearInterval(timerHandle);
      // score = key-point coverage (a study heuristic, presented as such — never as a verdict)
      var perQ = qs.map(function (item) {
        var a = answers[item.q.id] || { text: '' };
        var ks = keywordScore(a.text, item.q.kp);
        var pct = Math.max(0, ks.pct - (a.hint ? 10 : 0));
        return { item: item, ks: ks, pct: pct, ans: a.text };
      });
      var catScores = {};
      perQ.forEach(function (r) {
        var c = r.item.q.cat;
        catScores[c] = catScores[c] || { s: 0, n: 0 };
        catScores[c].s += r.pct; catScores[c].n++;
      });
      var overall = Math.round(perQ.reduce(function (a, r) { return a + r.pct; }, 0) / (perQ.length || 1));
      var rec = {
        id: S.uid(), setId: set.id, title: set.title, kind: set.kind, date: S.today(),
        durationSeconds: set.duration * 60 - Math.max(0, remaining),
        scores: { overall: overall },
        answers: answers, notes: notes,
        feedback: perQ.map(function (r) {
          return { qId: r.item.q.id, section: r.item.section, pct: r.pct, matched: r.ks.matched, missed: r.ks.missed };
        })
      };
      Object.keys(catScores).forEach(function (c) { rec.scores[c] = Math.round(catScores[c].s / catScores[c].n); });
      S.store.state.interviews.push(rec);
      S.store.save(); S.store.touchActivity(); S.store.checkAchievements();

      var strengths = Object.keys(rec.scores).filter(function (k) { return k !== 'overall' && rec.scores[k] >= 70; });
      var weaknesses = Object.keys(rec.scores).filter(function (k) { return k !== 'overall' && rec.scores[k] < 50; });
      var guidance = overall >= 75 ? 'High coverage — now compare your answers against the model answers for structure and trade-off quality, then try a harder set.' :
        overall >= 55 ? 'Moderate coverage — revise the weak categories below and retake.' :
        'Low coverage — revisit the linked lessons before your next attempt.';

      var html = '<div class="score-banner">Key-point coverage: ' + overall + '%</div>' +
        '<div class="callout"><div class="co-title">What this number means</div>Your answers mentioned ' + overall + '% of the concepts a strong answer contains. This is <strong>not</strong> a judgement of correctness, clarity, structure or interview performance — it cannot detect misused terms, contradictions, or reasoning quality. ' + guidance + '</div>' +
        '<h2>Coverage by category</h2>' + Object.keys(rec.scores).filter(function (k) { return k !== 'overall'; }).map(function (k) {
          return '<div class="small" style="display:flex;justify-content:space-between"><span>' + S.esc(k) + '</span><span>' + rec.scores[k] + '%</span></div>' + S.ui.bar(rec.scores[k]);
        }).join('');
      if (strengths.length) html += '<p><strong>Highest coverage:</strong> ' + strengths.map(function (s2) { return S.ui.chip(s2, 'good'); }).join(' ') + '</p>';
      if (weaknesses.length) html += '<p><strong>Focus areas:</strong> ' + weaknesses.map(function (s2) { return S.ui.chip(s2, 'warn'); }).join(' ') + '</p>';
      html += '<h2>Question-by-question feedback</h2><p class="muted small">This attempt (answers, notes, feedback) is saved — reopen it any time from <a href="#/progress">Progress</a>.</p>';
      perQ.forEach(function (r, i) {
        html += '<details class="quiz-q" style="padding:12px 16px"><summary><strong>Q' + (i + 1) + '.</strong> ' + S.esc(r.item.q.q) + ' — <strong>' + r.pct + '%</strong></summary>' +
          '<p><strong>Your answer:</strong></p><blockquote>' + (S.esc(r.ans) || '<em>no answer</em>') + '</blockquote>' +
          (r.ks.matched.length ? '<p><strong>✅ Covered:</strong> ' + r.ks.matched.map(S.esc).join(' · ') + '</p>' : '') +
          (r.ks.missed.length ? '<p><strong>❌ Missed considerations:</strong> ' + r.ks.missed.map(S.esc).join(' · ') + '</p>' : '') +
          '<div class="callout good"><div class="co-title">Suggested improved answer</div>' + S.esc(r.item.q.strong) + '</div>' +
          (r.item.q.lessons && r.item.q.lessons.length ? '<p class="small">Recommended revision: ' + r.item.q.lessons.map(revLink).join(', ') + '</p>' : '') +
          '</details>';
      });
      html += '<div class="btn-row"><button class="btn" id="mi-retake">Retake this interview</button><a class="btn secondary" href="#/mock">All mock interviews</a><a class="btn secondary" href="#/progress">Progress</a></div>';
      body.innerHTML = html;
      var retake = body.querySelector('#mi-retake');
      if (retake) retake.addEventListener('click', function () { location.reload(); });
      window.scrollTo(0, 0);
    }
    renderIntro();
  });

  /* ---------------- Interview history (review a saved attempt) ---------------- */
  S.router.add('/interview-history/:id', function (main, p) {
    var rec = (S.store.state.interviews || []).find(function (x) { return x.id === p.id; });
    if (!rec) { main.innerHTML = '<h1>Attempt not found</h1><p><a href="#/progress">Back to progress</a></p>'; return; }
    var html = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Progress', href: '/progress' }, { label: rec.title }]) +
      '<h1>' + S.esc(rec.title) + '</h1>' +
      '<p>' + S.ui.chip(rec.kind === 'banking' ? 'Banking' : 'General') + ' ' + S.ui.chip(rec.date) +
      (rec.durationSeconds ? ' ' + S.ui.chip(Math.round(rec.durationSeconds / 60) + ' min used') : '') + '</p>' +
      '<div class="score-banner">Key-point coverage: ' + (rec.scores ? rec.scores.overall : '—') + '%</div>';
    if (rec.scores) {
      html += '<h2>Coverage by category</h2>' + Object.keys(rec.scores).filter(function (k) { return k !== 'overall'; }).map(function (k) {
        return '<div class="small" style="display:flex;justify-content:space-between"><span>' + S.esc(k) + '</span><span>' + rec.scores[k] + '%</span></div>' + S.ui.bar(rec.scores[k]);
      }).join('');
    }
    if (rec.feedback && rec.feedback.length) {
      html += '<h2>Your answers</h2>';
      rec.feedback.forEach(function (f, i) {
        var q = (S.data.interviewQs || []).find(function (x) { return x.id === f.qId; });
        var ans = rec.answers && rec.answers[f.qId] ? rec.answers[f.qId].text : '';
        html += '<details class="quiz-q" style="padding:12px 16px"><summary><strong>Q' + (i + 1) + '.</strong> ' +
          S.esc(q ? q.q : f.qId) + ' — ' + f.pct + '%</summary>' +
          '<p><strong>Your answer:</strong></p><blockquote>' + (S.esc(ans) || '<em>no answer</em>') + '</blockquote>' +
          (f.matched && f.matched.length ? '<p><strong>✅ Covered:</strong> ' + f.matched.map(S.esc).join(' · ') + '</p>' : '') +
          (f.missed && f.missed.length ? '<p><strong>❌ Missed:</strong> ' + f.missed.map(S.esc).join(' · ') + '</p>' : '') +
          (q ? '<div class="callout good"><div class="co-title">Suggested improved answer</div>' + S.esc(q.strong) + '</div>' +
            (q.lessons && q.lessons.length ? '<p class="small">Revise: ' + q.lessons.map(revLink).join(', ') + '</p>' : '') : '') +
          '</details>';
      });
    } else if (rec.steps) {
      html += '<h2>Your answers</h2>';
      rec.steps.forEach(function (st2, i) {
        html += '<details class="quiz-q" style="padding:12px 16px"><summary><strong>' + (i + 1) + '. ' + S.esc(st2.name) + '</strong> — ' + st2.pct + '%</summary>' +
          '<p><strong>Your answer:</strong></p><blockquote>' + (S.esc(st2.answer) || '<em>no answer</em>') + '</blockquote>' +
          (st2.missed && st2.missed.length ? '<p><strong>❌ Missed:</strong> ' + st2.missed.map(S.esc).join(' · ') + '</p>' : '<p>✅ All key points covered.</p>') +
          '</details>';
      });
    } else {
      html += '<p class="muted">This attempt was recorded before answer persistence was added — only the scores are available.</p>';
    }
    if (rec.notes) html += '<h2>Your interview notes</h2><blockquote>' + S.esc(rec.notes) + '</blockquote>';
    main.innerHTML = html;
  });

  /* ---------------- System-design simulator ---------------- */
  var SD_STEPS = [
    ['clarify', 'Clarify requirements', 'What questions do you ask before designing anything? List functional scope, out-of-scope, and the NFRs you need numbers for.'],
    ['stakeholders', 'Identify stakeholders', 'Who cares about this system? Users, operations, compliance, downstream consumers…'],
    ['assumptions', 'Define assumptions', 'State the assumptions you are designing under (traffic, growth, team, budget).'],
    ['scale', 'Estimate scale', 'Do the arithmetic: RPS, storage growth, peak factors. Use the calculators if needed.'],
    ['entities', 'Identify entities', 'The core domain objects and their relationships.'],
    ['apis', 'Define APIs', 'The key API operations, their idempotency, and error behaviour.'],
    ['events', 'Define events', 'Domain/integration events, their keys, and ownership.'],
    ['storage', 'Design data storage', 'Store choices per data type, and why. System of record vs derived views.'],
    ['hla', 'High-level architecture', 'Describe the containers and their responsibilities (a C4 container view in words).'],
    ['boundaries', 'Service boundaries', 'Where are the boundaries and why there? What stays together?'],
    ['deepdive', 'Deep-dive a critical component', 'Pick the riskiest component and design it in detail.'],
    ['security', 'Security', 'AuthN/Z, data protection, trust boundaries, threat highlights.'],
    ['failures', 'Failure scenarios', 'What fails, how you detect it, how the system degrades and recovers.'],
    ['audit', 'Auditability', 'What must be evidenced, retained, and reconstructible — and how.'],
    ['operations', 'Operations', 'Deployment, monitoring, alerting, capacity, runbooks.'],
    ['cost', 'Cost', 'Main cost drivers and one concrete optimisation.'],
    ['tradeoffs', 'Trade-offs', 'The two or three biggest trade-offs you made and the alternatives you rejected.'],
    ['summary', 'Final summary', 'Summarise the design in five sentences, as you would close an interview.']
  ];

  S.router.add('/sysdesign', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'System Design' }]) +
      '<h1>System-Design Interview Simulator</h1><p class="muted">A guided 18-step walkthrough of a system-design interview. Each step is scored on key-point coverage and compared with a model answer at the end.</p>' +
      '<div class="grid">' + (S.data.sysdesign || []).map(function (s) {
        return S.ui.card({ route: '/sysdesign/run/' + s.id, title: s.title, desc: s.brief.slice(0, 120) + '…', chips: S.ui.chip(s.banking ? 'Banking' : 'General', s.banking ? 'warn' : '') });
      }).join('') + '</div>';
  });

  S.router.add('/sysdesign/run/:id', function (main, p) {
    var ex = (S.data.sysdesign || []).find(function (x) { return x.id === p.id; });
    if (!ex) { main.innerHTML = '<h1>Exercise not found</h1><p><a href="#/sysdesign">All exercises</a></p>'; return; }
    var idx = 0, answers = {};
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'System Design', href: '/sysdesign' }, { label: ex.title }]) +
      '<h1>' + S.esc(ex.title) + '</h1><div class="callout"><div class="co-title">Brief</div>' + S.md(ex.brief) + '</div>';
    var body = S.h('<div></div>'); main.appendChild(body);

    function render() {
      if (idx >= SD_STEPS.length) { finish(); return; }
      var st = SD_STEPS[idx];
      body.innerHTML = '<div class="small muted">Step ' + (idx + 1) + ' of ' + SD_STEPS.length + '</div>' + S.ui.bar(idx / SD_STEPS.length * 100) +
        '<div class="quiz-q"><h2 style="margin-top:0">' + (idx + 1) + '. ' + S.esc(st[1]) + '</h2><p class="muted small">' + S.esc(st[2]) + '</p>' +
        '<textarea id="sd-a" style="min-height:150px">' + S.esc(answers[st[0]] || '') + '</textarea>' +
        '<div class="btn-row">' + (idx > 0 ? '<button class="btn secondary" id="sd-prev">← Back</button>' : '') +
        '<button class="btn" id="sd-next">' + (idx === SD_STEPS.length - 1 ? 'Finish & score' : 'Next →') + '</button></div></div>';
      function save() { answers[st[0]] = body.querySelector('#sd-a').value; }
      var pv = body.querySelector('#sd-prev');
      if (pv) pv.addEventListener('click', function () { save(); idx--; render(); });
      body.querySelector('#sd-next').addEventListener('click', function () { save(); idx++; render(); });
    }

    function finish() {
      var dims = { architecture: [], domain: [], security: [], data: [], communication: [], tradeoffs: [] };
      var stepScores = {}, total = 0, n = 0;
      SD_STEPS.forEach(function (st) {
        var model = ex.steps[st[0]];
        if (!model) return;
        var ks = keywordScore(answers[st[0]], model.kp);
        stepScores[st[0]] = ks;
        total += ks.pct; n++;
        (model.dims || ['architecture']).forEach(function (d) { if (dims[d]) dims[d].push(ks.pct); });
      });
      var overall = Math.round(total / (n || 1));
      var scores = { overall: overall };
      Object.keys(dims).forEach(function (d) {
        scores[d] = dims[d].length ? Math.round(dims[d].reduce(function (a, b) { return a + b; }, 0) / dims[d].length) : null;
      });
      // Persist the full attempt (answers + per-step feedback), reviewable from Progress.
      var stepRecords = SD_STEPS.filter(function (st2) { return ex.steps[st2[0]]; }).map(function (st2) {
        var ks = stepScores[st2[0]];
        return { key: st2[0], name: st2[1], pct: ks.pct, answer: answers[st2[0]] || '', missed: ks.missed };
      });
      var savedScores = { overall: overall };
      Object.keys(scores).forEach(function (k) { if (k !== 'overall' && scores[k] !== null) savedScores[k] = scores[k]; });
      S.store.state.interviews.push({
        id: S.uid(), setId: ex.id, title: 'System design: ' + ex.title,
        kind: ex.banking ? 'banking' : 'general', date: S.today(),
        scores: savedScores, steps: stepRecords
      });
      S.store.save(); S.store.touchActivity(); S.store.checkAchievements();

      var guidance = overall >= 75 ? 'High coverage — now compare your reasoning against the model answers for structure and trade-off quality.' : overall >= 55 ? 'Moderate coverage — tighten the weak steps below.' : 'Low coverage — study the model answers and retry.';
      var html = '<div class="score-banner">Key-point coverage: ' + overall + '%</div>' +
        '<div class="callout"><div class="co-title">What this number means</div>Your answers mentioned ' + overall + '% of the expected concepts. It is not a judgement of correctness, structure or communication quality — compare against the model answers below for that. ' + guidance + '</div><h2>Coverage by dimension</h2>';
      Object.keys(scores).forEach(function (k) {
        if (k === 'overall' || scores[k] === null) return;
        html += '<div class="small" style="display:flex;justify-content:space-between"><span>' + k + '</span><span>' + scores[k] + '%</span></div>' + S.ui.bar(scores[k]);
      });
      html += '<h2>Step-by-step comparison</h2>';
      SD_STEPS.forEach(function (st, i) {
        var model = ex.steps[st[0]];
        if (!model) return;
        var ks = stepScores[st[0]];
        html += '<details class="quiz-q" style="padding:12px 16px"><summary><strong>' + (i + 1) + '. ' + S.esc(st[1]) + '</strong> — ' + ks.pct + '%</summary>' +
          '<p><strong>Your answer:</strong></p><blockquote>' + (S.esc(answers[st[0]]) || '<em>no answer</em>') + '</blockquote>' +
          (ks.missed.length ? '<p><strong>❌ Missed:</strong> ' + ks.missed.map(S.esc).join(' · ') + '</p>' : '<p>✅ All key points covered.</p>') +
          '<div class="callout good"><div class="co-title">Model answer</div>' + S.md(model.model) + '</div></details>';
      });
      html += '<div class="btn-row"><a class="btn secondary" href="#/sysdesign">All exercises</a><a class="btn secondary" href="#/progress">Progress</a></div>';
      body.innerHTML = html;
      window.scrollTo(0, 0);
    }
    render();
  });

  /* ---------------- Assessments hub ---------------- */
  S.router.add('/assessments', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Assessments' }]) +
      '<h1>Assessments</h1><p class="muted">All scoring happens after submission; every wrong answer is explained and linked to the lesson to revise.</p>';
    var wrap = S.h('<div class="grid"></div>');
    var defs = [
      { id: 'level-1', title: 'Level 1 exam — Foundations', desc: '15 questions on architecture fundamentals.', level: 1, n: 15 },
      { id: 'level-2', title: 'Level 2 exam — Applied Solution Architecture', desc: '15 questions on applied practice.', level: 2, n: 15 },
      { id: 'level-3', title: 'Level 3 exam — Advanced Architecture', desc: '18 questions on distributed systems, styles, Kafka, security.', level: 3, n: 18 },
      { id: 'level-4', title: 'Level 4 exam — Architect Mastery', desc: '12 questions on strategy, governance, leadership.', level: 4, n: 12 },
      { id: 'banking-test', title: 'Banking architecture module test', desc: '15 questions on banking domains, payments, screening.', cat: 'banking', n: 15 },
      { id: 'kafka-test', title: 'Kafka module test', desc: '12 questions on Kafka and event-driven design.', cat: 'kafka', n: 12 },
      { id: 'readiness', title: 'Final architect-readiness assessment', desc: '30 mixed questions across the whole curriculum.', n: 30 }
    ];
    defs.forEach(function (d) {
      var prev = S.store.state.quizzes[d.id];
      wrap.appendChild(S.h(S.ui.card({
        route: '/assessment/' + d.id, title: d.title, desc: d.desc,
        meta: prev ? '<span class="badge-done">Best: ' + Math.round(prev.score / prev.total * 100) + '%</span>' : '<span>Not taken</span>'
      })));
    });
    main.appendChild(wrap);
    main.appendChild(S.h('<h2>Also</h2><div class="grid">' +
      S.ui.card({ route: '/diagram-challenge', title: 'Diagram interpretation challenge', desc: 'Choose the right modelling technique for each situation.' }) +
      S.ui.card({ route: '/mock', title: 'Timed mock interviews', desc: 'Full interview simulations with scoring and feedback.' }) +
      S.ui.card({ route: '/review-sim', title: 'Architecture-review exercises', desc: 'Find and prioritise flaws in broken designs.' }) + '</div>'));
    main._defs = defs;
  });

  S.router.add('/assessment/:id', function (main, p) {
    var defs = {
      'level-1': { title: 'Level 1 exam — Foundations', level: 1, n: 15 },
      'level-2': { title: 'Level 2 exam — Applied Solution Architecture', level: 2, n: 15 },
      'level-3': { title: 'Level 3 exam — Advanced Architecture', level: 3, n: 18 },
      'level-4': { title: 'Level 4 exam — Architect Mastery', level: 4, n: 12 },
      'banking-test': { title: 'Banking module test', cat: 'banking', n: 15 },
      'kafka-test': { title: 'Kafka module test', cat: 'kafka', n: 12 },
      'readiness': { title: 'Final architect-readiness assessment', n: 30 }
    };
    var d = defs[p.id];
    if (!d) { main.innerHTML = '<h1>Assessment not found</h1>'; return; }
    var lessonsIn = (S.data.lessons || []).filter(function (l) {
      return (!d.level || l.level === d.level) && (!d.cat || l.cat === d.cat);
    }).map(function (l) { return l.id; });
    var pool = (S.data.quizQs || []).filter(function (q) {
      return !q.lessonId || lessonsIn.indexOf(q.lessonId) >= 0 || (!d.level && !d.cat);
    });
    var qs = S.shuffle(pool).slice(0, d.n);
    if (qs.length < d.n) qs = qs.concat(S.ui.genGlossaryQs(d.n - qs.length, d.cat === 'banking' ? 'Banking' : d.cat === 'kafka' ? 'Kafka' : null));
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Assessments', href: '/assessments' }, { label: d.title }]) +
      '<h1>' + S.esc(d.title) + '</h1><p class="muted">' + qs.length + ' questions. Answers are hidden until you submit. Incorrect answers are explained with links to revise.</p>';
    var wrap = S.h('<div></div>'); main.appendChild(wrap);
    S.ui.quiz(wrap, qs, {
      onDone: function (score, total) {
        var prev = S.store.state.quizzes[p.id];
        if (!prev || score / total > prev.score / prev.total) S.store.state.quizzes[p.id] = { score: score, total: total, date: S.today() };
        S.store.save(); S.store.touchActivity();
        var weakLessons = {};
        // recommend revision: lessons of wrong answers listed in explanations already
        wrap.appendChild(S.h('<div class="callout"><div class="co-title">Next step</div>' +
          (score / total >= 0.8 ? 'Strong result. Move to the next level or try a <a href="#/mock">mock interview</a>.' :
            'Review the explanations above — each links to the lesson to revise — then retake for a better score.') + '</div>'));
      }
    });
  });
})(window.SAA);
