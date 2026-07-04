/* tools.js — ADR wizard, build-vs-buy matrix, QAW, calculators, data store selector,
   Kafka topic designer, templates, toolkit */
(function (S) {
  'use strict';

  /* =============== ADR Decision Wizard =============== */
  var ADR_STEPS = [
    { k: 'objective', t: 'Business objective', hint: 'What business outcome does this decision support? e.g. "Reduce onboarding time from 5 days to 1 day."' },
    { k: 'problem', t: 'Problem statement', hint: 'The specific problem in one or two sentences. Avoid embedding the solution in the problem.' },
    { k: 'stakeholders', t: 'Stakeholders', hint: 'Who is affected or must be consulted? Business owner, dev teams, operations, security, compliance, vendors…' },
    { k: 'functional', t: 'Functional requirements', hint: 'What must the solution do? List the essential capabilities.' },
    { k: 'nonfunctional', t: 'Non-functional requirements', hint: 'Measurable NFRs: throughput, latency percentiles, availability, RTO/RPO, retention…' },
    { k: 'quality', t: 'Quality attributes', hint: 'Which quality attributes dominate this decision (and which are you willing to trade away)?' },
    { k: 'constraints', t: 'Constraints', hint: 'Fixed technology standards, budget, deadlines, regulation, team skills, data residency…' },
    { k: 'assumptions', t: 'Assumptions', hint: 'What are you assuming that, if wrong, would change the decision? Document these — they will be challenged.' },
    { k: 'currentState', t: 'Current-state analysis', hint: 'What exists today? Systems, integrations, data flows, pain points.' },
    { k: 'risks', t: 'Risks', hint: 'Delivery, technical, operational, vendor, and compliance risks — with likelihood and impact.' },
    { k: 'dependencies', t: 'Dependencies', hint: 'Teams, systems, vendors, and programmes this decision depends on or blocks.' },
    { k: 'options', t: 'Options considered', hint: 'At least 2–3 genuine options, each described neutrally. Include "do nothing" if credible.' },
    { k: 'criteria', t: 'Evaluation criteria', hint: 'How will you compare options? Cost, time-to-market, operability, skills fit, lock-in, compliance…' },
    { k: 'tradeoffs', t: 'Trade-off analysis', hint: 'For each option: what you gain, what you give up. Be explicit — this is the heart of the ADR.' },
    { k: 'recommended', t: 'Recommended option', hint: 'The decision, stated clearly, with the primary reasons.' },
    { k: 'rejected', t: 'Rejected options and reasons', hint: 'Why each other option was rejected. Future readers need this to avoid relitigating.' },
    { k: 'roadmap', t: 'Implementation roadmap', hint: 'Phases, milestones, and what "done" means for each.' },
    { k: 'migration', t: 'Migration strategy', hint: 'How you get from current to target state: coexistence, cutover, rollback triggers.' },
    { k: 'security', t: 'Security considerations', hint: 'AuthN/Z, data classification, encryption, threat model highlights, audit requirements.' },
    { k: 'operations', t: 'Operational considerations', hint: 'Who runs it, monitoring, alerting, runbooks, capacity, on-call impact.' },
    { k: 'cost', t: 'Cost implications', hint: 'Build cost, run cost, licences, infrastructure, and the cost of the rejected options.' },
    { k: 'reviewDate', t: 'Review date', hint: 'When should this decision be revisited? Decisions rot — set a date.' },
    { k: 'success', t: 'Success criteria', hint: 'Measurable signals that the decision worked. Tie back to the business objective.' }
  ];

  S.router.add('/adr', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'ADR Wizard' }]) +
      '<h1>Architecture Decision Record Wizard</h1>' +
      '<p class="muted">A 23-step guided flow. Work through each step — the hints teach you what a strong ADR contains. Export as Markdown, JSON, or printable HTML.</p>';
    var st = S.store.state;

    // saved ADRs
    if (st.adrs.length) {
      var saved = S.h('<details><summary>My saved ADRs (' + st.adrs.length + ')</summary></details>');
      st.adrs.forEach(function (a, i) {
        var row = S.h('<div class="btn-row"><strong style="flex:1">' + S.esc(a.title || 'Untitled') + '</strong><span class="muted small">' + a.date + '</span>' +
          '<button class="btn small secondary" data-load="' + i + '">Load</button><button class="btn small danger" data-del="' + i + '">Delete</button></div>');
        saved.appendChild(row);
      });
      saved.addEventListener('click', function (e) {
        if (e.target.hasAttribute('data-load')) { draft = JSON.parse(JSON.stringify(st.adrs[+e.target.getAttribute('data-load')])); step = 0; render(); }
        if (e.target.hasAttribute('data-del')) { st.adrs.splice(+e.target.getAttribute('data-del'), 1); S.store.save(); S.router.resolve(); }
      });
      main.appendChild(saved);
    }

    var draft = { title: '', status: 'Proposed', date: S.today(), fields: {} };
    var step = -1; // -1 = title screen
    var wiz = S.h('<div class="card"></div>');
    main.appendChild(wiz);

    function render() {
      if (step === -1) {
        wiz.innerHTML = '<label for="adr-title">Decision title</label><input id="adr-title" type="text" style="width:100%" placeholder="e.g. Use Kafka for customer-event distribution" value="' + S.esc(draft.title) + '">' +
          '<label for="adr-status">Status</label><select id="adr-status"><option>Proposed</option><option>Accepted</option><option>Superseded</option><option>Rejected</option></select>' +
          '<div class="btn-row"><button class="btn" id="adr-next">Start the 23 steps →</button></div>';
        wiz.querySelector('#adr-status').value = draft.status;
        wiz.querySelector('#adr-next').addEventListener('click', function () {
          draft.title = wiz.querySelector('#adr-title').value.trim();
          draft.status = wiz.querySelector('#adr-status').value;
          if (!draft.title) { S.toast('Give the decision a title first.'); return; }
          step = 0; render();
        });
        return;
      }
      if (step >= ADR_STEPS.length) { renderDone(); return; }
      var s = ADR_STEPS[step];
      wiz.innerHTML = '<div class="small muted">Step ' + (step + 1) + ' of ' + ADR_STEPS.length + '</div>' + S.ui.bar((step) / ADR_STEPS.length * 100) +
        '<h2>' + (step + 1) + '. ' + S.esc(s.t) + '</h2>' +
        '<div class="callout"><div class="co-title">Guidance</div>' + S.esc(s.hint) + '</div>' +
        '<textarea id="adr-field" style="min-height:130px" placeholder="Write here…">' + S.esc(draft.fields[s.k] || '') + '</textarea>' +
        '<div class="btn-row"><button class="btn secondary" id="adr-back">← Back</button><button class="btn" id="adr-fwd">' + (step === ADR_STEPS.length - 1 ? 'Finish' : 'Next →') + '</button></div>';
      function saveField() { draft.fields[s.k] = wiz.querySelector('#adr-field').value; }
      wiz.querySelector('#adr-back').addEventListener('click', function () { saveField(); step--; render(); });
      wiz.querySelector('#adr-fwd').addEventListener('click', function () { saveField(); step++; render(); });
    }

    function adrMarkdown() {
      var md = '# ADR: ' + draft.title + '\n\n- **Status:** ' + draft.status + '\n- **Date:** ' + draft.date + '\n';
      ADR_STEPS.forEach(function (s) {
        md += '\n## ' + s.t + '\n\n' + (draft.fields[s.k] || '_Not documented._') + '\n';
      });
      return md;
    }
    function renderDone() {
      wiz.innerHTML = '<h2>✅ ADR complete: ' + S.esc(draft.title) + '</h2>' +
        '<p class="muted">Review the preview, then save or export.</p>' +
        '<div class="btn-row">' +
        '<button class="btn" id="adr-save">💾 Save in app</button>' +
        '<button class="btn secondary" id="exp-md">⬇ Markdown</button>' +
        '<button class="btn secondary" id="exp-json">⬇ JSON</button>' +
        '<button class="btn secondary" id="exp-html">🖨 Printable HTML</button>' +
        '<button class="btn secondary" id="adr-edit">← Edit</button></div>' +
        '<hr><div id="adr-preview">' + S.md(adrMarkdown()) + '</div>';
      wiz.querySelector('#adr-save').addEventListener('click', function () {
        st.adrs.push(JSON.parse(JSON.stringify(draft)));
        S.store.save(); S.store.checkAchievements(); S.toast('ADR saved.');
      });
      wiz.querySelector('#exp-md').addEventListener('click', function () { S.download(slug(draft.title) + '.md', adrMarkdown(), 'text/markdown'); });
      wiz.querySelector('#exp-json').addEventListener('click', function () { S.download(slug(draft.title) + '.json', JSON.stringify(draft, null, 2), 'application/json'); });
      wiz.querySelector('#exp-html').addEventListener('click', function () { S.printable('ADR: ' + draft.title, S.md(adrMarkdown())); });
      wiz.querySelector('#adr-edit').addEventListener('click', function () { step = 0; render(); });
    }
    render();
  });

  function slug(s) { return (s || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60); }

  /* =============== Build vs Buy vs Reuse matrix =============== */
  var BVB_CRITERIA = ['Business fit', 'Functional fit', 'Strategic alignment', 'Delivery time', 'Initial cost', 'Long-term cost', 'Licensing', 'Vendor cost', 'Integration complexity', 'Migration complexity', 'Vendor lock-in', 'Exit strategy', 'Security', 'Compliance', 'Scalability', 'Reliability', 'Maintainability', 'Internal skills', 'Operational ownership', 'Product roadmap', 'Customisation', 'Support model', 'Data ownership', 'Data portability', 'Regulatory impact', 'Time-to-market', 'Technical debt', 'Total cost of ownership'];
  var BVB_OPTIONS = ['Build new', 'Buy commercial', 'Adopt open source', 'Reuse internal service', 'Extend existing platform', 'Integrate external platform', 'Re-engineer existing', 'Replace capability', 'Retire capability', 'No action'];

  S.router.add('/bvb', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Build vs Buy' }]) +
      '<h1>Build / Buy / Reuse / Extend / Integrate / Replace / Retire</h1>';
    main.appendChild(S.h('<div class="callout warn"><div class="co-title">This is not a simple build-versus-buy choice</div>' +
      '<p>Real sourcing decisions hide costs everywhere: <strong>buy</strong> looks fast but brings licence escalation, upgrade cycles, customisation debt, integration effort, and exit costs that can exceed the build cost you avoided. <strong>Build</strong> looks flexible but you pay forever in maintenance, security patching, on-call, and the opportunity cost of engineers not working on differentiating features. <strong>Reuse</strong> looks free but couples you to another team\'s roadmap and priorities. <strong>Open source</strong> is not free — you own operations, upgrades, and security response.</p>' +
      '<p>Organisational constraints often dominate: available skills, funding model (capex vs opex), procurement timelines, vendor risk policies, and regulatory approval can eliminate options that score well technically. Score honestly, then sanity-check the winner against the constraints no matrix captures. Study the full lesson: <a href="#/lesson/a5">Sourcing decisions</a>.</p></div>'));

    var tool = S.h('<div class="card"></div>');
    main.appendChild(tool);

    var sel = { options: ['Build new', 'Buy commercial', 'Reuse internal service'], weights: {}, scores: {} };
    BVB_CRITERIA.forEach(function (c) { sel.weights[c] = 3; });

    function render() {
      var html = '<h2>1. Decision context</h2><input type="text" id="bvb-name" placeholder="What capability are you sourcing? e.g. Sanctions screening engine" style="width:100%">' +
        '<h2>2. Options in scope</h2><div>' + BVB_OPTIONS.map(function (o) {
          return '<label class="quiz-opt" style="display:inline-flex;width:auto;margin-right:8px"><input type="checkbox" value="' + S.esc(o) + '"' + (sel.options.indexOf(o) >= 0 ? ' checked' : '') + '> ' + S.esc(o) + '</label>';
        }).join('') + '</div>' +
        '<h2>3. Weight the criteria (0 = ignore, 5 = critical) and score each option (1–5)</h2>' +
        '<div style="overflow-x:auto"><table class="matrix"><tr><th>Criterion</th><th>Weight</th>' +
        sel.options.map(function (o) { return '<th>' + S.esc(o) + '</th>'; }).join('') + '</tr>';
      BVB_CRITERIA.forEach(function (c) {
        html += '<tr><td>' + S.esc(c) + '</td><td><input type="number" min="0" max="5" value="' + (sel.weights[c] || 0) + '" data-w="' + S.esc(c) + '" aria-label="Weight for ' + S.esc(c) + '"></td>';
        sel.options.forEach(function (o) {
          var v = (sel.scores[o] && sel.scores[o][c]) || 3;
          html += '<td><input type="number" min="1" max="5" value="' + v + '" data-o="' + S.esc(o) + '" data-c="' + S.esc(c) + '" aria-label="Score ' + S.esc(o) + ' on ' + S.esc(c) + '"></td>';
        });
        html += '</tr>';
      });
      html += '<tr id="bvb-totals"><th>Weighted total</th><th></th>' + sel.options.map(function () { return '<th>—</th>'; }).join('') + '</tr></table></div>' +
        '<div class="btn-row"><button class="btn" id="bvb-calc">Calculate</button><button class="btn secondary" id="bvb-save">💾 Save assessment</button><button class="btn secondary" id="bvb-md">⬇ Export Markdown</button></div>' +
        '<div id="bvb-result"></div>';
      tool.innerHTML = html;

      tool.querySelectorAll('input[type=checkbox]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          sel.options = Array.prototype.slice.call(tool.querySelectorAll('input[type=checkbox]:checked')).map(function (x) { return x.value; });
          if (!sel.options.length) sel.options = ['Build new'];
          harvest(); render();
        });
      });
      tool.querySelector('#bvb-calc').addEventListener('click', function () { harvest(); calc(); });
      tool.querySelector('#bvb-save').addEventListener('click', function () {
        harvest();
        S.store.state.bvbs.push({ name: tool.querySelector('#bvb-name').value, date: S.today(), sel: JSON.parse(JSON.stringify(sel)) });
        S.store.save(); S.store.checkAchievements(); S.toast('Assessment saved.');
      });
      tool.querySelector('#bvb-md').addEventListener('click', function () { harvest(); S.download('build-vs-buy.md', exportMd(), 'text/markdown'); });
    }
    function harvest() {
      tool.querySelectorAll('input[data-w]').forEach(function (i) { sel.weights[i.getAttribute('data-w')] = +i.value || 0; });
      tool.querySelectorAll('input[data-o]').forEach(function (i) {
        var o = i.getAttribute('data-o'), c = i.getAttribute('data-c');
        sel.scores[o] = sel.scores[o] || {}; sel.scores[o][c] = +i.value || 0;
      });
    }
    function totals() {
      return sel.options.map(function (o) {
        var t = 0;
        BVB_CRITERIA.forEach(function (c) { t += (sel.weights[c] || 0) * ((sel.scores[o] && sel.scores[o][c]) || 0); });
        return t;
      });
    }
    function calc() {
      var ts = totals(), max = Math.max.apply(null, ts);
      var row = tool.querySelector('#bvb-totals');
      row.innerHTML = '<th>Weighted total</th><th></th>' + ts.map(function (t) {
        return '<th class="' + (t === max ? 'winner' : '') + '">' + t + '</th>';
      }).join('');
      var winner = sel.options[ts.indexOf(max)];
      tool.querySelector('#bvb-result').innerHTML = '<div class="callout good"><div class="co-title">Leading option: ' + S.esc(winner) + '</div>' +
        'Before committing, challenge the result: Which single criterion, if re-weighted, would flip the outcome? Have you priced exit and integration honestly? Does the winner survive your hard constraints (regulation, skills, funding, procurement)? A matrix informs the decision — it does not make it.</div>';
    }
    function exportMd() {
      var ts = totals();
      var md = '# Sourcing assessment: ' + (tool.querySelector('#bvb-name').value || 'Untitled') + '\n\nDate: ' + S.today() + '\n\n| Criterion | Weight |' + sel.options.join(' | ') + ' |\n|---|---|' + sel.options.map(function () { return '---|'; }).join('') + '\n';
      BVB_CRITERIA.forEach(function (c) {
        md += '| ' + c + ' | ' + sel.weights[c] + ' | ' + sel.options.map(function (o) { return (sel.scores[o] && sel.scores[o][c]) || ''; }).join(' | ') + ' |\n';
      });
      md += '| **Total** | | ' + ts.join(' | ') + ' |\n';
      return md;
    }
    render();
  });

  /* =============== Quality Attribute Workshop =============== */
  S.router.add('/qaw', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Quality Attribute Workshop' }]) +
      '<h1>Quality Attribute Workshop</h1>' +
      '<p class="muted">Vague requirements cannot be designed for or tested. This workshop teaches the six-part quality-attribute scenario format, then drills you on improving weak NFRs.</p>';
    var qa = S.data.qualityAttributes || [];
    S.ui.tabs(main, [
      { label: 'Quality attributes', render: function (body) {
        var html = '<div class="grid">' + qa.map(function (q) {
          return '<div class="card"><h3>' + S.esc(q.name) + '</h3><p class="small">' + S.esc(q.def) + '</p>' +
            '<p class="small muted"><strong>Typical measures:</strong> ' + S.esc(q.measures) + '</p>' +
            '<p class="small muted"><strong>Tension with:</strong> ' + S.esc(q.tension) + '</p></div>';
        }).join('') + '</div>';
        body.innerHTML = html;
      }},
      { label: 'Scenario builder', render: function (body) {
        body.innerHTML = '<p>A testable quality-attribute scenario has six parts. Build one:</p>';
        var parts = [
          ['source', 'Source of stimulus', 'e.g. 2,000 concurrent mobile-app users'],
          ['stimulus', 'Stimulus', 'e.g. submit a payment during peak hour'],
          ['environment', 'Environment', 'e.g. normal operation / degraded mode / month-end batch window'],
          ['artefact', 'Affected system or artefact', 'e.g. Payment API and posting service'],
          ['response', 'Expected response', 'e.g. payment accepted, validated, and queued for clearing'],
          ['measure', 'Measurable response', 'e.g. p95 < 300 ms, p99 < 800 ms, zero accepted duplicates']
        ];
        var form = S.h('<div class="card"></div>');
        parts.forEach(function (p) {
          form.appendChild(S.h('<label for="qaw-' + p[0] + '">' + p[1] + '</label>'));
          form.appendChild(S.h('<input id="qaw-' + p[0] + '" type="text" style="width:100%" placeholder="' + S.esc(p[2]) + '">'));
        });
        var out = S.h('<div></div>');
        var btn = S.h('<div class="btn-row"><button class="btn">Compose scenario</button></div>');
        btn.querySelector('button').addEventListener('click', function () {
          var v = {};
          parts.forEach(function (p) { v[p[0]] = form.querySelector('#qaw-' + p[0]).value.trim(); });
          if (!v.measure) { S.toast('The measurable response is the part most people skip — fill it in.'); return; }
          out.innerHTML = '<div class="callout good"><div class="co-title">Your scenario</div>When <strong>' + S.esc(v.source || 'a source') + '</strong> ' +
            '<strong>' + S.esc(v.stimulus || 'triggers a stimulus') + '</strong> during <strong>' + S.esc(v.environment || 'normal operation') + '</strong>, ' +
            'the <strong>' + S.esc(v.artefact || 'system') + '</strong> shall <strong>' + S.esc(v.response || 'respond') + '</strong>, measured as: <strong>' + S.esc(v.measure) + '</strong>.</div>';
        });
        form.appendChild(btn);
        body.appendChild(form); body.appendChild(out);
      }},
      { label: 'Improve weak NFRs (drill)', render: function (body) {
        body.innerHTML = '<p>Each requirement below is vague. Rewrite it to be measurable, then compare with the model answer.</p>';
        (S.data.weakNfrs || []).forEach(function (w, i) {
          var box = S.h('<div class="quiz-q"><p><strong>' + (i + 1) + '. Weak:</strong> “' + S.esc(w.bad) + '”</p>' +
            '<textarea placeholder="Your measurable version…"></textarea>' +
            '<details><summary>Model answer & why</summary><div class="callout good"><div class="co-title">Improved</div>' + S.esc(w.good) + '</div><p class="small">' + S.esc(w.why) + '</p></details></div>');
          body.appendChild(box);
        });
      }}
    ]);
  });

  /* =============== Calculators =============== */
  S.router.add('/calculators', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Calculators' }]) +
      '<h1>Architecture Calculators</h1><p class="muted">Back-of-envelope estimation is a core interview and design skill. Every calculator shows its formula.</p>';
    var wrap = S.h('<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))"></div>');
    main.appendChild(wrap);

    function calcCard(title, formula, inputs, compute) {
      var c = S.h('<div class="card"><h3>' + S.esc(title) + '</h3><p class="small muted">' + S.esc(formula) + '</p></div>');
      var els = {};
      inputs.forEach(function (inp) {
        c.appendChild(S.h('<label>' + S.esc(inp.label) + '</label>'));
        var e = S.h('<input type="number" value="' + inp.value + '" step="any" style="width:100%">');
        els[inp.k] = e; c.appendChild(e);
      });
      var out = S.h('<div class="callout" style="margin-top:10px"><div class="co-title">Result</div><div class="calc-out">—</div></div>');
      c.appendChild(out);
      function upd() {
        var v = {};
        Object.keys(els).forEach(function (k) { v[k] = parseFloat(els[k].value) || 0; });
        out.querySelector('.calc-out').innerHTML = compute(v);
      }
      c.addEventListener('input', upd); upd();
      return c;
    }
    var fmt = function (n, d) { return Number(n.toFixed(d === undefined ? 2 : d)).toLocaleString('en-US'); };

    wrap.appendChild(calcCard('Requests per second from DAU', 'RPS = DAU × actions/user ÷ 86,400 s; peak = avg × peak factor',
      [{ k: 'dau', label: 'Daily active users', value: 1000000 }, { k: 'act', label: 'Requests per user per day', value: 20 }, { k: 'pk', label: 'Peak factor (× average)', value: 3 }],
      function (v) { var avg = v.dau * v.act / 86400; return 'Average: <strong>' + fmt(avg) + ' RPS</strong><br>Peak: <strong>' + fmt(avg * v.pk) + ' RPS</strong>'; }));

    wrap.appendChild(calcCard('Storage growth', 'Storage/year = records/day × size × 365 × replication',
      [{ k: 'rec', label: 'New records per day', value: 500000 }, { k: 'sz', label: 'Average record size (KB)', value: 2 }, { k: 'rep', label: 'Replication factor', value: 3 }, { k: 'yrs', label: 'Retention (years)', value: 7 }],
      function (v) {
        var gbYear = v.rec * v.sz * 365 / 1024 / 1024 * v.rep;
        return 'Per year: <strong>' + fmt(gbYear) + ' GB</strong><br>Over retention: <strong>' + fmt(gbYear * v.yrs / 1024, 2) + ' TB</strong>';
      }));

    wrap.appendChild(calcCard('Network bandwidth', 'Bandwidth = RPS × payload size × 8 bits',
      [{ k: 'rps', label: 'Requests per second', value: 2000 }, { k: 'kb', label: 'Average payload (KB)', value: 8 }],
      function (v) { var mbps = v.rps * v.kb * 8 / 1000; return 'Sustained: <strong>' + fmt(mbps) + ' Mbps</strong> (' + fmt(mbps / 1000, 2) + ' Gbps)'; }));

    wrap.appendChild(calcCard('Kafka throughput & partitions', 'Partitions ≥ max(target ÷ producer MB/s, target ÷ consumer MB/s); add headroom',
      [{ k: 'msgs', label: 'Messages per second (peak)', value: 50000 }, { k: 'sz', label: 'Average message size (KB)', value: 1 }, { k: 'cons', label: 'Per-partition consumer throughput (MB/s)', value: 10 }, { k: 'head', label: 'Headroom factor', value: 2 }],
      function (v) {
        var mbs = v.msgs * v.sz / 1024;
        var parts = Math.ceil(mbs / (v.cons || 1) * v.head);
        return 'Peak volume: <strong>' + fmt(mbs) + ' MB/s</strong><br>Suggested partitions: <strong>' + Math.max(parts, 1) + '</strong><br><span class="small muted">Also consider: key cardinality, ordering scope, max consumers in a group = partition count.</span>';
      }));

    wrap.appendChild(calcCard('Availability of a chain (series)', 'A_total = A₁ × A₂ × … (dependent services multiply failure exposure)',
      [{ k: 'a', label: 'Service A availability (%)', value: 99.9 }, { k: 'b', label: 'Service B availability (%)', value: 99.9 }, { k: 'c', label: 'Service C availability (%)', value: 99.5 }],
      function (v) {
        var t = v.a / 100 * v.b / 100 * v.c / 100 * 100;
        var downMin = (100 - t) / 100 * 365 * 24 * 60;
        return 'Chain availability: <strong>' + fmt(t, 3) + '%</strong><br>Expected downtime: <strong>' + fmt(downMin / 60, 1) + ' h/year</strong><br><span class="small muted">A long synchronous chain is an availability multiplier — this is why we cut chains with async messaging and caches.</span>';
      }));

    wrap.appendChild(calcCard('Redundancy (parallel)', 'A = 1 − (1 − A₁)ⁿ for n independent replicas',
      [{ k: 'a', label: 'Single instance availability (%)', value: 99 }, { k: 'n', label: 'Replicas', value: 3 }],
      function (v) {
        var t = (1 - Math.pow(1 - v.a / 100, v.n)) * 100;
        return 'Combined: <strong>' + fmt(Math.min(t, 99.999999), 5) + '%</strong><br><span class="small muted">Assumes independent failures — shared dependencies (same AZ, same DB) break this assumption.</span>';
      }));

    wrap.appendChild(calcCard('Availability → downtime budget', 'Downtime = (1 − A) × period',
      [{ k: 'a', label: 'Availability target (%)', value: 99.95 }],
      function (v) {
        var minYear = (100 - v.a) / 100 * 365.25 * 24 * 60;
        return 'Per year: <strong>' + fmt(minYear, 1) + ' min</strong><br>Per month: <strong>' + fmt(minYear / 12, 1) + ' min</strong><br>Per week: <strong>' + fmt(minYear / 52.18, 1) + ' min</strong>';
      }));

    wrap.appendChild(calcCard('Cache sizing', 'Cache = hot objects × size × overhead',
      [{ k: 'obj', label: 'Hot objects (thousands)', value: 500 }, { k: 'sz', label: 'Average object size (KB)', value: 4 }, { k: 'ov', label: 'Overhead factor', value: 1.3 }],
      function (v) { return 'Cache size: <strong>' + fmt(v.obj * 1000 * v.sz * v.ov / 1024 / 1024, 2) + ' GB</strong><br><span class="small muted">Then check the hit-rate assumption: 80/20 access skew is common but must be validated.</span>'; }));

    wrap.appendChild(calcCard('RTO / RPO cost trade-off', 'Tighter objectives ⇒ higher run cost; compare loss vs spend',
      [{ k: 'rpoM', label: 'RPO (minutes of data loss tolerated)', value: 5 }, { k: 'val', label: 'Value of data per minute (€)', value: 2000 }, { k: 'cost', label: 'Annual cost of DR tier (€)', value: 150000 }],
      function (v) {
        var exposure = v.rpoM * v.val;
        return 'Worst-case loss per incident: <strong>€' + fmt(exposure, 0) + '</strong><br>Annual DR spend: <strong>€' + fmt(v.cost, 0) + '</strong><br><span class="small muted">Justify DR tiers with numbers like these, not fear. See the [resilience lesson](#/lesson/d5).</span>';
      }));

    wrap.appendChild(calcCard('Cloud cost comparison (basic)', 'Monthly = instances × hours × rate + storage + egress',
      [{ k: 'n', label: 'Instances', value: 6 }, { k: 'hr', label: 'Rate per instance-hour (€)', value: 0.20 }, { k: 'st', label: 'Storage (GB)', value: 2000 }, { k: 'sr', label: 'Storage €/GB-month', value: 0.08 }, { k: 'eg', label: 'Egress (GB)', value: 500 }, { k: 'er', label: 'Egress €/GB', value: 0.09 }],
      function (v) {
        var m = v.n * 730 * v.hr + v.st * v.sr + v.eg * v.er;
        return 'Monthly: <strong>€' + fmt(m, 0) + '</strong> · Annual: <strong>€' + fmt(m * 12, 0) + '</strong><br><span class="small muted">Egress and cross-AZ traffic are the classic surprise costs.</span>';
      }));
  });

  /* =============== Data store selector =============== */
  S.router.add('/datastore', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Data Store Selector' }]) +
      '<h1>Choose the Right Data Store</h1><p class="muted">Answer the questions; the simulator ranks store families and — more importantly — explains why. There is rarely one right answer.</p>';
    var qs = [
      { k: 'model', q: 'Dominant data shape?', o: ['Highly relational, many joins', 'Self-contained documents', 'Simple key → value lookups', 'Relationships/graphs are the queries', 'Time-stamped measurements', 'Free-text search'] },
      { k: 'consistency', q: 'Consistency need?', o: ['Strict ACID transactions', 'Read-your-writes is enough', 'Eventual consistency acceptable'] },
      { k: 'scale', q: 'Scale expectation?', o: ['Fits comfortably on one primary + replicas', 'Must scale writes horizontally', 'Massive reads, modest writes'] },
      { k: 'query', q: 'Query pattern?', o: ['Ad-hoc/analytical queries', 'Known access paths only', 'Text relevance ranking', 'Aggregations over time windows'] },
      { k: 'audit', q: 'Regulatory/audit posture?', o: ['Strong audit & integrity (banking-grade)', 'Standard'] }
    ];
    var form = S.h('<div class="card"></div>');
    qs.forEach(function (q, i) {
      form.appendChild(S.h('<label for="ds' + i + '">' + S.esc(q.q) + '</label>'));
      form.appendChild(S.h('<select id="ds' + i + '" data-k="' + q.k + '">' + q.o.map(function (o, oi) { return '<option value="' + oi + '">' + S.esc(o) + '</option>'; }).join('') + '</select>'));
    });
    var btn = S.h('<div class="btn-row"><button class="btn">Recommend</button></div>');
    var out = S.h('<div></div>');
    btn.querySelector('button').addEventListener('click', function () {
      var v = {};
      form.querySelectorAll('select').forEach(function (s) { v[s.getAttribute('data-k')] = +s.value; });
      var scores = { 'Relational (PostgreSQL, Oracle)': 0, 'Document (MongoDB)': 0, 'Key-value (Redis, DynamoDB)': 0, 'Graph (Neo4j)': 0, 'Time-series (InfluxDB, Timescale)': 0, 'Search (Elasticsearch, OpenSearch)': 0, 'Wide-column (Cassandra)': 0 };
      var why = [];
      [['Relational (PostgreSQL, Oracle)', 0], ['Document (MongoDB)', 1], ['Key-value (Redis, DynamoDB)', 2], ['Graph (Neo4j)', 3], ['Time-series (InfluxDB, Timescale)', 4], ['Search (Elasticsearch, OpenSearch)', 5]].forEach(function (p) {
        if (v.model === p[1]) { scores[p[0]] += 4; why.push('Data shape points to ' + p[0] + '.'); }
      });
      if (v.consistency === 0) { scores['Relational (PostgreSQL, Oracle)'] += 3; why.push('Strict ACID favours a relational engine; distributed stores make multi-row transactions harder.'); }
      if (v.consistency === 2) { scores['Wide-column (Cassandra)'] += 2; scores['Key-value (Redis, DynamoDB)'] += 1; }
      if (v.scale === 1) { scores['Wide-column (Cassandra)'] += 3; scores['Key-value (Redis, DynamoDB)'] += 2; scores['Document (MongoDB)'] += 1; why.push('Horizontal write scaling favours partitioned stores (Cassandra, DynamoDB) — at the price of query flexibility.'); }
      if (v.scale === 2) { scores['Relational (PostgreSQL, Oracle)'] += 1; why.push('Read-heavy load is often solved with read replicas and caching before changing store family.'); }
      if (v.query === 0) { scores['Relational (PostgreSQL, Oracle)'] += 3; why.push('Ad-hoc queries need a rich query engine — relational wins; key-value and wide-column punish unknown access paths.'); }
      if (v.query === 2) { scores['Search (Elasticsearch, OpenSearch)'] += 4; why.push('Relevance-ranked text search is what search engines exist for — but treat them as an index, not a system of record.'); }
      if (v.query === 3) { scores['Time-series (InfluxDB, Timescale)'] += 3; }
      if (v.audit === 0) { scores['Relational (PostgreSQL, Oracle)'] += 2; why.push('Banking-grade audit and integrity usually keeps the system of record relational, with other stores as derived read models (CQRS).'); }
      var ranked = Object.keys(scores).map(function (k) { return { k: k, s: scores[k] }; }).sort(function (a, b) { return b.s - a.s; });
      out.innerHTML = '<div class="callout good"><div class="co-title">Ranking</div><ol>' + ranked.slice(0, 4).map(function (r) { return '<li><strong>' + S.esc(r.k) + '</strong> (score ' + r.s + ')</li>'; }).join('') + '</ol></div>' +
        '<div class="callout"><div class="co-title">Reasoning</div><ul>' + why.map(function (w) { return '<li>' + S.esc(w) + '</li>'; }).join('') + '</ul>' +
        '<p class="small">Remember polyglot persistence: the system of record and derived read models can use different stores — see [the data lesson](#/lesson/dt1).</p></div>'.replace(/\[([^\]]+)\]\((#[^)]+)\)/g, '<a href="$2">$1</a>');
    });
    form.appendChild(btn);
    main.appendChild(form); main.appendChild(out);
  });

  /* =============== Kafka topic designer =============== */
  S.router.add('/kafka-designer', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Kafka Topic Designer' }]) +
      '<h1>Kafka Topic Designer</h1><p class="muted">Design a topic and get a review against event-architecture good practice. Browse the <strong>banking event catalogue</strong> below for realistic examples.</p>';
    S.ui.tabs(main, [
      { label: 'Design a topic', render: function (body) {
        var form = S.h('<div class="card">' +
          '<label>Topic name</label><input id="kt-name" type="text" style="width:100%" placeholder="e.g. customer.customer-updated.v1">' +
          '<div class="field-row"><div><label>Event type</label><select id="kt-type"><option>Domain event (owned by one context)</option><option>Integration event (published contract)</option><option>Command (directed request)</option><option>Event-carried state transfer</option></select></div>' +
          '<div><label>Event key</label><input id="kt-key" type="text" placeholder="e.g. customerId"></div></div>' +
          '<div class="field-row"><div><label>Peak events/second</label><input id="kt-eps" type="number" value="500"></div>' +
          '<div><label>Avg message size (KB)</label><input id="kt-size" type="number" value="2"></div>' +
          '<div><label>Consumer throughput per partition (MB/s)</label><input id="kt-cons" type="number" value="10"></div></div>' +
          '<div class="field-row"><div><label>Ordering requirement</label><select id="kt-ord"><option>Per key (typical)</option><option>Global (rare, expensive)</option><option>None</option></select></div>' +
          '<div><label>Contains personal/sensitive data?</label><select id="kt-pii"><option>No</option><option>Yes</option></select></div>' +
          '<div><label>Retention</label><select id="kt-ret"><option>7 days</option><option>30 days</option><option>Compacted (latest per key)</option><option>Long-term (audit)</option></select></div></div>' +
          '<div class="btn-row"><button class="btn" id="kt-review">Review my design</button></div><div id="kt-out"></div></div>');
        body.appendChild(form);
        form.querySelector('#kt-review').addEventListener('click', function () {
          var name = form.querySelector('#kt-name').value.trim();
          var key = form.querySelector('#kt-key').value.trim();
          var eps = +form.querySelector('#kt-eps').value || 0;
          var size = +form.querySelector('#kt-size').value || 1;
          var cons = +form.querySelector('#kt-cons').value || 10;
          var ord = form.querySelector('#kt-ord').selectedIndex;
          var pii = form.querySelector('#kt-pii').selectedIndex === 1;
          var ret = form.querySelector('#kt-ret').selectedIndex;
          var mbs = eps * size / 1024;
          var parts = Math.max(1, Math.ceil(mbs / cons * 2));
          var notes = [];
          if (!name) notes.push(['bad', 'Name the topic. Convention: <domain>.<event-name>.v<major> — the version suffix lets you run breaking changes side-by-side.']);
          else if (!/^[a-z0-9.-]+$/.test(name)) notes.push(['warn', 'Prefer lowercase dot/hyphen names: domain.event-name.v1.']);
          else if (!/v\d+$/.test(name)) notes.push(['warn', 'No version suffix. Adding .v1 now makes breaking schema changes survivable later.']);
          else notes.push(['good', 'Naming looks sound (domain-scoped, versioned).']);
          if (!key) notes.push(['bad', 'No event key. Without a key you lose per-entity ordering and log compaction becomes impossible. Choose the entity identifier consumers partition their logic by.']);
          else notes.push(['good', 'Key "' + key + '": all events for the same ' + key + ' land on one partition, preserving their order.']);
          if (ord === 1) notes.push(['warn', 'Global ordering forces a single partition → throughput capped at one consumer. Challenge this requirement; per-key ordering is nearly always what the business actually needs.']);
          notes.push(['info', 'Estimated peak ' + mbs.toFixed(2) + ' MB/s → suggest ~' + parts + ' partitions (2× headroom). Max parallel consumers in one group = partition count; repartitioning later breaks key→partition mapping, so err generously.']);
          if (pii) notes.push(['warn', 'Sensitive data in events: consider referencing data by ID instead (event notification), field-level encryption or tokenisation, strict topic ACLs, and short retention. Events are copied everywhere — leaked topics are leaked databases. GDPR erasure is hard on immutable logs; compaction with tombstones is one pattern.']);
          if (ret === 3) notes.push(['warn', 'Long-term audit retention on Kafka: consider sinking to an immutable audit store instead; Kafka retention is an operational cost and not an audit-grade evidence store by itself.']);
          if (ret === 2 && !key) notes.push(['bad', 'Compaction requires a key.']);
          form.querySelector('#kt-out').innerHTML = notes.map(function (n) {
            var cls = { bad: 'bad', warn: 'warn', good: 'good', info: '' }[n[0]];
            return '<div class="callout ' + cls + '">' + n[1] + '</div>';
          }).join('');
          S.store.touchActivity();
        });
      }},
      { label: 'Banking event catalogue', render: function (body) {
        var evs = S.data.bankingEvents || [];
        body.innerHTML = '<p class="muted">' + evs.length + ' realistic banking events with ownership, keys, and design notes.</p>';
        evs.forEach(function (e) {
          body.appendChild(S.h('<details><summary><code>' + S.esc(e.name) + '</code> <span class="chip">' + S.esc(e.domain) + '</span></summary>' +
            '<table>' +
            '<tr><th>Producer / owner</th><td>' + S.esc(e.producer) + '</td></tr>' +
            '<tr><th>Typical consumers</th><td>' + S.esc(e.consumers) + '</td></tr>' +
            '<tr><th>Event key</th><td><code>' + S.esc(e.key) + '</code></td></tr>' +
            '<tr><th>Partition strategy</th><td>' + S.esc(e.partition) + '</td></tr>' +
            '<tr><th>Payload (summary)</th><td>' + S.esc(e.payload) + '</td></tr>' +
            '<tr><th>Sensitive data</th><td>' + S.esc(e.sensitive) + '</td></tr>' +
            '<tr><th>Ordering</th><td>' + S.esc(e.ordering) + '</td></tr>' +
            '<tr><th>Idempotency</th><td>' + S.esc(e.idempotency) + '</td></tr>' +
            '<tr><th>Retry strategy</th><td>' + S.esc(e.retry) + '</td></tr>' +
            '<tr><th>Audit</th><td>' + S.esc(e.audit) + '</td></tr>' +
            '<tr><th>Schema evolution</th><td>' + S.esc(e.evolution) + '</td></tr>' +
            '<tr><th>Reconciliation</th><td>' + S.esc(e.reconciliation) + '</td></tr>' +
            '</table></details>'));
        });
      }},
      { label: 'Decision guides', render: function (body) {
        body.innerHTML = (S.data.kafkaDecisions || []).map(function (d) {
          return '<details><summary>' + S.esc(d.q) + '</summary>' + S.md(d.a) + '</details>';
        }).join('');
      }}
    ]);
  });

  /* =============== Templates =============== */
  S.router.add('/templates', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Templates' }]) +
      '<h1>Architecture Documentation Templates</h1><p class="muted">' + (S.data.templates || []).length + ' professional templates. Fill them in the browser; your drafts save automatically. Export as Markdown, JSON, or printable HTML.</p>' +
      '<div class="grid">' + (S.data.templates || []).map(function (t) {
        var saved = S.store.state.templatesSaved[t.id];
        return S.ui.card({ route: '/template/' + t.id, title: t.name, desc: t.desc, meta: saved ? '<span class="badge-done">Draft saved</span>' : '<span>' + t.fields.length + ' sections</span>' });
      }).join('') + '</div>';
  });

  S.router.add('/template/:id', function (main, p) {
    var t = (S.data.templates || []).find(function (x) { return x.id === p.id; });
    if (!t) { main.innerHTML = '<h1>Template not found</h1><p><a href="#/templates">All templates</a></p>'; return; }
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Templates', href: '/templates' }, { label: t.name }]) +
      '<h1>' + S.esc(t.name) + '</h1><p class="muted">' + S.esc(t.desc) + '</p>';
    var saved = S.store.state.templatesSaved[t.id] || {};
    var form = S.h('<div class="card"></div>');
    t.fields.forEach(function (f, i) {
      form.appendChild(S.h('<label for="tf' + i + '">' + S.esc(f.label) + '</label>'));
      if (f.hint) form.appendChild(S.h('<p class="small muted" style="margin:2px 0 4px">' + S.esc(f.hint) + '</p>'));
      var ta = S.h('<textarea id="tf' + i + '" data-f="' + S.esc(f.label) + '" style="min-height:' + (f.kind === 'short' ? 44 : 90) + 'px"></textarea>');
      ta.value = saved[f.label] || '';
      form.appendChild(ta);
    });
    var btns = S.h('<div class="btn-row"><button class="btn" id="t-save">💾 Save draft</button><button class="btn secondary" id="t-md">⬇ Markdown</button><button class="btn secondary" id="t-json">⬇ JSON</button><button class="btn secondary" id="t-html">🖨 Printable HTML</button></div>');
    form.appendChild(btns);
    main.appendChild(form);
    function harvest() {
      var v = {};
      form.querySelectorAll('textarea[data-f]').forEach(function (ta) { v[ta.getAttribute('data-f')] = ta.value; });
      return v;
    }
    function toMd() {
      var v = harvest();
      return '# ' + t.name + '\n\n_Generated ' + S.today() + ' — Software Architect Academy_\n\n' +
        t.fields.map(function (f) { return '## ' + f.label + '\n\n' + (v[f.label] || '_Not completed._') + '\n'; }).join('\n');
    }
    btns.querySelector('#t-save').addEventListener('click', function () {
      S.store.state.templatesSaved[t.id] = harvest(); S.store.save(); S.toast('Draft saved.');
    });
    btns.querySelector('#t-md').addEventListener('click', function () { S.download(t.id + '.md', toMd(), 'text/markdown'); });
    btns.querySelector('#t-json').addEventListener('click', function () { S.download(t.id + '.json', JSON.stringify({ template: t.name, date: S.today(), fields: harvest() }, null, 2), 'application/json'); });
    btns.querySelector('#t-html').addEventListener('click', function () { S.printable(t.name, S.md(toMd())); });
  });

  /* =============== Toolkit =============== */
  S.router.add('/toolkit', function (main) {
    main.innerHTML = S.ui.crumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Toolkit' }]) +
      '<h1>Architecture Toolkit</h1><p class="muted">Working checklists and question banks. Tick items as you go — state is saved per checklist. Interactive tools: ' +
      '<a href="#/calculators">Calculators</a> · <a href="#/adr">ADR Wizard</a> · <a href="#/bvb">Build-vs-Buy Matrix</a> · <a href="#/kafka-designer">Kafka Topic Designer</a> · <a href="#/datastore">Data Store Selector</a> · <a href="#/qaw">QAW</a>.</p>';
    (S.data.toolkit || []).forEach(function (tk) {
      var d = S.h('<details><summary>' + S.esc(tk.name) + ' <span class="chip">' + tk.items.length + ' items</span></summary></details>');
      var key = 'tk.' + tk.id;
      var savedRaw = S.store.note(key);
      var saved = {};
      try { saved = savedRaw ? JSON.parse(savedRaw) : {}; } catch (e) { saved = {}; }
      tk.items.forEach(function (item, i) {
        var row = S.h('<label class="quiz-opt"><input type="checkbox" data-i="' + i + '"' + (saved[i] ? ' checked' : '') + '><span>' + S.esc(item) + '</span></label>');
        d.appendChild(row);
      });
      d.addEventListener('change', function () {
        var v = {};
        d.querySelectorAll('input').forEach(function (cb) { if (cb.checked) v[cb.getAttribute('data-i')] = 1; });
        S.store.note(key, JSON.stringify(v));
      });
      var reset = S.h('<div class="btn-row"><button class="btn small secondary">Reset</button></div>');
      reset.querySelector('button').addEventListener('click', function () {
        S.store.note(key, ''); d.querySelectorAll('input').forEach(function (cb) { cb.checked = false; });
      });
      d.appendChild(reset);
      main.appendChild(d);
    });
  });
})(window.SAA);
