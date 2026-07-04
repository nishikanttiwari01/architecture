/* components.js — reusable UI: quiz engine, cards, breadcrumbs, rings, tabs */
(function (S) {
  'use strict';
  S.ui = {};

  S.ui.crumbs = function (parts) {
    return '<nav class="crumbs" aria-label="Breadcrumb">' + parts.map(function (p, i) {
      return p.href && i < parts.length - 1 ? '<a href="#' + p.href + '">' + S.esc(p.label) + '</a>' : S.esc(p.label);
    }).join(' › ') + '</nav>';
  };

  S.ui.chip = function (text, cls) { return '<span class="chip ' + (cls || '') + '">' + S.esc(text) + '</span>'; };

  S.ui.card = function (o) {
    return '<a class="card" href="#' + o.route + '">' +
      (o.chips ? '<div>' + o.chips + '</div>' : '') +
      '<h3>' + S.esc(o.title) + '</h3>' +
      (o.desc ? '<p class="small muted">' + S.esc(o.desc) + '</p>' : '') +
      (o.meta ? '<div class="meta">' + o.meta + '</div>' : '') + '</a>';
  };

  S.ui.ring = function (pct, size, label) {
    size = size || 84;
    var r = (size - 10) / 2, c = 2 * Math.PI * r;
    return '<span class="ring" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg width="' + size + '" height="' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--bg3)" stroke-width="8"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c * (1 - pct / 100) + '"/></svg>' +
      '<span class="ring-label">' + (label !== undefined ? label : Math.round(pct) + '%') + '</span></span>';
  };

  S.ui.bar = function (pct) {
    return '<div class="bar"><div style="width:' + Math.max(0, Math.min(100, pct)) + '%"></div></div>';
  };

  S.ui.tabs = function (container, tabs, onSelect) {
    var bar = S.h('<div class="tabs" role="tablist"></div>');
    var body = S.h('<div></div>');
    tabs.forEach(function (t, i) {
      var b = S.h('<button role="tab" aria-selected="' + (i === 0) + '">' + S.esc(t.label) + '</button>');
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', function () {
        bar.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
        b.classList.add('active'); b.setAttribute('aria-selected', 'true');
        body.innerHTML = '';
        t.render(body);
        if (onSelect) onSelect(t);
      });
      bar.appendChild(b);
    });
    container.appendChild(bar); container.appendChild(body);
    tabs[0].render(body);
    return { bar: bar, body: body };
  };

  S.ui.bookmarkBtn = function (type, id, title) {
    var marked = S.store.isBookmarked(type, id);
    var b = S.h('<button class="btn small secondary" aria-pressed="' + marked + '">' + (marked ? '★ Bookmarked' : '☆ Bookmark') + '</button>');
    b.addEventListener('click', function () {
      var now = S.store.toggleBookmark(type, id, title);
      b.textContent = now ? '★ Bookmarked' : '☆ Bookmark';
      b.setAttribute('aria-pressed', now);
      S.toast(now ? 'Bookmarked.' : 'Bookmark removed.');
    });
    return b;
  };

  S.ui.noteBox = function (key, placeholder) {
    var wrap = S.h('<details><summary>📝 My notes</summary></details>');
    var ta = document.createElement('textarea');
    ta.placeholder = placeholder || 'Your private notes for this page (saved automatically)…';
    ta.value = S.store.note(key);
    ta.addEventListener('input', function () { S.store.note(key, ta.value); });
    wrap.appendChild(ta);
    return wrap;
  };

  /* ---------- Quiz engine ----------
     questions: array of question objects {type, q, options, answer, explain, lessonId}
     Renders form; answers & explanations hidden until submit; returns score via onDone. */
  S.ui.quiz = function (container, questions, opts) {
    opts = opts || {};
    var form = S.h('<form novalidate></form>');
    questions.forEach(function (q, qi) {
      var box = S.h('<div class="quiz-q" data-qi="' + qi + '"></div>');
      box.innerHTML = '<div class="qnum">Question ' + (qi + 1) + ' of ' + questions.length +
        (q.type === 'ms' ? ' — select all that apply' : q.type === 'tf' ? ' — true or false' : '') + '</div>' +
        '<p><strong>' + S.esc(q.q) + '</strong></p>';
      if (q.type === 'fib' || q.type === 'short') {
        var inp = S.h('<input type="text" style="width:100%" aria-label="Your answer" autocomplete="off">');
        box.appendChild(inp);
      } else if (q.type === 'order') {
        var list = S.h('<div class="order-list"></div>');
        S.shuffle(q.options.map(function (o, i) { return { o: o, i: i }; })).forEach(function (item) {
          var row = S.h('<div class="quiz-opt" data-oi="' + item.i + '" style="justify-content:space-between"><span>' + S.esc(item.o) + '</span><span><button type="button" class="btn small secondary mv-up" aria-label="Move up">↑</button> <button type="button" class="btn small secondary mv-dn" aria-label="Move down">↓</button></span></div>');
          list.appendChild(row);
        });
        list.addEventListener('click', function (e) {
          var row = e.target.closest('.quiz-opt'); if (!row) return;
          if (e.target.classList.contains('mv-up') && row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
          if (e.target.classList.contains('mv-dn') && row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
        });
        box.appendChild(list);
      } else if (q.type === 'match') {
        // options: [[left,right],...]; render selects
        var rights = S.shuffle(q.options.map(function (p) { return p[1]; }));
        q.options.forEach(function (pair, pi) {
          var row = S.h('<div class="quiz-opt" style="justify-content:space-between"><span>' + S.esc(pair[0]) + '</span></div>');
          var sel = S.h('<select data-pi="' + pi + '" aria-label="Match for ' + S.esc(pair[0]) + '"><option value="">— choose —</option>' +
            rights.map(function (r) { return '<option>' + S.esc(r) + '</option>'; }).join('') + '</select>');
          row.appendChild(sel);
          box.appendChild(row);
        });
      } else {
        var isMulti = q.type === 'ms';
        var options = q.type === 'tf' ? ['True', 'False'] : q.options;
        options.forEach(function (opt, oi) {
          var lab = S.h('<label class="quiz-opt"><input type="' + (isMulti ? 'checkbox' : 'radio') + '" name="q' + qi + '" value="' + oi + '"><span>' + S.esc(opt) + '</span></label>');
          box.appendChild(lab);
        });
      }
      form.appendChild(box);
    });
    var submit = S.h('<button type="submit" class="btn">Submit answers</button>');
    form.appendChild(submit);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var score = 0;
      questions.forEach(function (q, qi) {
        var box = form.querySelector('[data-qi="' + qi + '"]');
        var correct = false, userDisplay = '';
        if (q.type === 'fib' || q.type === 'short') {
          var val = box.querySelector('input').value.trim().toLowerCase();
          var accepted = Array.isArray(q.answer) ? q.answer : [q.answer];
          correct = accepted.some(function (a) { return val === String(a).toLowerCase() || (val.length > 2 && String(a).toLowerCase().indexOf(val) === 0); });
          box.querySelector('input').style.borderColor = correct ? 'var(--good)' : 'var(--bad)';
          userDisplay = 'Accepted answer: <strong>' + S.esc(accepted[0]) + '</strong>';
        } else if (q.type === 'order') {
          var rows = Array.prototype.slice.call(box.querySelectorAll('.quiz-opt'));
          correct = rows.every(function (r, i) { return +r.getAttribute('data-oi') === i; });
          rows.forEach(function (r, i) { r.classList.add(+r.getAttribute('data-oi') === i ? 'correct' : 'wrong'); });
          userDisplay = 'Correct order: ' + q.options.map(S.esc).join(' → ');
        } else if (q.type === 'match') {
          correct = true;
          box.querySelectorAll('select').forEach(function (sel) {
            var pi = +sel.getAttribute('data-pi');
            var ok = sel.value === q.options[pi][1];
            if (!ok) correct = false;
            sel.closest('.quiz-opt').classList.add(ok ? 'correct' : 'wrong');
          });
          userDisplay = q.options.map(function (p) { return S.esc(p[0]) + ' → ' + S.esc(p[1]); }).join('<br>');
        } else {
          var ansArr = q.type === 'tf' ? [q.answer ? 0 : 1] : (Array.isArray(q.answer) ? q.answer : [q.answer]);
          var chosen = Array.prototype.slice.call(box.querySelectorAll('input:checked')).map(function (i) { return +i.value; });
          correct = chosen.length === ansArr.length && chosen.every(function (c) { return ansArr.indexOf(c) >= 0; });
          box.querySelectorAll('.quiz-opt').forEach(function (optEl, oi) {
            if (ansArr.indexOf(oi) >= 0) optEl.classList.add('correct');
            else if (chosen.indexOf(oi) >= 0) optEl.classList.add('wrong');
            optEl.querySelector('input').disabled = true;
          });
        }
        if (correct) score++;
        var ex = S.h('<div class="quiz-explain">' + (correct ? '✅ <strong>Correct.</strong> ' : '❌ <strong>Incorrect.</strong> ' + (userDisplay ? userDisplay + '<br>' : '')) +
          S.esc(q.explain || '') +
          (q.lessonId ? ' <a href="#/lesson/' + q.lessonId + '">Review the related lesson →</a>' : '') + '</div>');
        box.appendChild(ex);
      });
      submit.remove();
      var pct = Math.round(score / questions.length * 100);
      var banner = S.h('<div class="score-banner">Score: ' + score + ' / ' + questions.length + ' (' + pct + '%) — ' +
        (pct >= 80 ? 'Strong. ✅' : pct >= 60 ? 'Solid, review the misses.' : 'Revisit this material before moving on.') + '</div>');
      form.insertBefore(banner, form.firstChild);
      banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (opts.onDone) opts.onDone(score, questions.length);
    });
    container.appendChild(form);
  };

  /* Generated quiz questions from glossary (definition → term MCQ) */
  S.ui.genGlossaryQs = function (count, cat) {
    var pool = (S.data.glossary || []).filter(function (g) { return !cat || g.cat === cat; });
    if (pool.length < 4) pool = S.data.glossary || [];
    return S.shuffle(pool).slice(0, count).map(function (g) {
      var distract = S.shuffle(pool.filter(function (x) { return x.id !== g.id; })).slice(0, 3).map(function (x) { return x.term; });
      var options = S.shuffle([g.term].concat(distract));
      return { type: 'mc', q: 'Which term matches this definition: "' + g.simple + '"', options: options, answer: options.indexOf(g.term), explain: g.term + ': ' + g.technical };
    });
  };
})(window.SAA);
