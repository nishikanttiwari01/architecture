/* dashboard.js — overview, readiness score, recommendations */
(function (S) {
  'use strict';

  S.readiness = function () {
    var st = S.store.state, D = S.data;
    var lessonPct = Math.min(100, Object.keys(st.lessons).length / (D.lessons || []).length * 100);
    var scores = Object.keys(st.lessons).map(function (k) {
      var l = st.lessons[k];
      return l.quizTotal ? l.quizScore / l.quizTotal * 100 : null;
    }).filter(function (x) { return x !== null; });
    var quizAvg = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : 0;
    var labPct = Math.min(100, Object.keys(st.labs).filter(function (k) { return st.labs[k].status === 'done'; }).length / 10 * 100);
    var casePct = Math.min(100, Object.keys(st.cases).filter(function (k) { return st.cases[k].revealed; }).length / 8 * 100);
    var revPct = Math.min(100, Object.keys(st.reviews).length / 5 * 100);
    var intCount = st.interviews.length;
    var intAvg = intCount ? st.interviews.reduce(function (a, i) { return a + (i.scores && i.scores.overall || 0); }, 0) / intCount : 0;
    var intPct = Math.min(100, intCount / 4 * 100) * 0.5 + intAvg * 0.5;
    return {
      overall: Math.round(lessonPct * 0.3 + quizAvg * 0.2 + labPct * 0.15 + casePct * 0.12 + revPct * 0.08 + intPct * 0.15),
      lessons: Math.round(lessonPct), quizzes: Math.round(quizAvg), labs: Math.round(labPct),
      cases: Math.round(casePct), reviews: Math.round(revPct), interviews: Math.round(intPct)
    };
  };

  S.nextLesson = function () {
    var st = S.store.state, D = S.data;
    var order = (D.lessons || []).slice().sort(function (a, b) { return a.level - b.level; });
    // prefer the learner's recommended path if set
    if (st.profile && st.profile.pathId) {
      var path = (D.paths || []).find(function (p) { return p.id === st.profile.pathId; });
      if (path) {
        for (var i = 0; i < path.lessonIds.length; i++) {
          var l = order.find(function (x) { return x.id === path.lessonIds[i]; });
          if (l && !S.store.lessonDone(l.id)) return l;
        }
      }
    }
    return order.find(function (l) { return !S.store.lessonDone(l.id); }) || null;
  };

  S.router.add('/dashboard', function (main) {
    var st = S.store.state, D = S.data;
    var r = S.readiness();
    var next = S.nextLesson();
    var streak = S.store.streak();
    var doneLessons = Object.keys(st.lessons).length;
    var achieved = Object.keys(st.achievements);

    var html = '<h1>Dashboard</h1>';
    if (!st.profile) {
      html += '<div class="callout"><div class="co-title">👋 Welcome to Software Architect Academy</div>' +
        'Take the 2-minute <a href="#/paths">diagnostic assessment</a> to get a personalised learning path — or jump straight into <a href="#/courses">the courses</a>.</div>';
    }
    html += '<div class="stat-grid">' +
      '<div class="stat"><div class="val">' + r.overall + '</div><div class="lbl">Architect-readiness score</div></div>' +
      '<div class="stat"><div class="val">' + doneLessons + '/' + (D.lessons || []).length + '</div><div class="lbl">Lessons completed</div></div>' +
      '<div class="stat"><div class="val">' + streak + '🔥</div><div class="lbl">Day streak</div></div>' +
      '<div class="stat"><div class="val">' + st.interviews.length + '</div><div class="lbl">Mock interviews taken</div></div>' +
      '<div class="stat"><div class="val">' + achieved.length + '/' + Object.keys(S.ACHIEVEMENTS).length + '</div><div class="lbl">Achievements</div></div>' +
      '</div>';

    html += '<div class="two-col"><div class="card"><h3>Continue learning</h3>';
    if (next) {
      html += '<p>Next recommended lesson:</p><p><a class="btn" href="#/lesson/' + next.id + '">' + S.esc(next.title) + ' →</a></p>' +
        '<p class="small muted">Level ' + next.level + ' · ' + S.fmtDur(next.duration) + ' · ' + S.esc(next.difficulty) + '</p>';
    } else {
      html += '<p>All lessons complete — impressive. Try the <a href="#/mock">mock interviews</a> or <a href="#/review-sim">review simulator</a>.</p>';
    }
    html += '</div><div class="card"><h3>Skill areas</h3>' +
      ['lessons', 'quizzes', 'labs', 'cases', 'reviews', 'interviews'].map(function (k) {
        return '<div class="small" style="display:flex;justify-content:space-between"><span>' + k[0].toUpperCase() + k.slice(1) + '</span><span>' + r[k] + '%</span></div>' + S.ui.bar(r[k]);
      }).join('') + '<p class="small"><a href="#/progress">Full progress report →</a></p></div></div>';

    // Levels overview
    html += '<h2>Curriculum levels</h2><div class="grid">';
    [1, 2, 3, 4].forEach(function (lv) {
      var lessons = (D.lessons || []).filter(function (l) { return l.level === lv; });
      var done = lessons.filter(function (l) { return S.store.lessonDone(l.id); }).length;
      var names = ['Architecture Foundations', 'Applied Solution Architecture', 'Advanced Architecture', 'Architect Mastery'];
      html += S.ui.card({
        route: '/courses?level=' + lv, title: 'Level ' + lv + ': ' + names[lv - 1],
        desc: done + ' of ' + lessons.length + ' lessons complete',
        chips: S.ui.chip('Level ' + lv), meta: S.ui.bar(lessons.length ? done / lessons.length * 100 : 0)
      });
    });
    html += '</div>';

    // Quick links
    html += '<h2>Practice & tools</h2><div class="grid">' +
      S.ui.card({ route: '/case-studies', title: 'Case Studies', desc: (D.caseStudies || []).length + ' progressively harder design problems, attempt-first.' }) +
      S.ui.card({ route: '/labs', title: 'Hands-on Labs', desc: (D.labs || []).length + ' labs with workspaces, hints, model answers, rubrics.' }) +
      S.ui.card({ route: '/mock', title: 'Mock Interviews', desc: (D.mockSets || []).length + ' full timed interview sets — general and banking.' }) +
      S.ui.card({ route: '/adr', title: 'ADR Wizard', desc: '23-step decision wizard with Markdown/JSON/HTML export.' }) +
      S.ui.card({ route: '/bvb', title: 'Build vs Buy vs Reuse', desc: 'Weighted comparison across 28 criteria.' }) +
      S.ui.card({ route: '/review-sim', title: 'Review Simulator', desc: 'Find the flaws in intentionally broken architectures.' }) +
      '</div>';

    if (achieved.length) {
      html += '<h2>Achievements</h2><p>' + achieved.map(function (a) {
        return S.ui.chip('🏅 ' + (S.ACHIEVEMENTS[a] || a), 'good');
      }).join(' ') + '</p>';
    }
    main.innerHTML = html;
  });
})(window.SAA);
