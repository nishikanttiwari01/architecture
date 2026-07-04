/* search.js — in-memory full-text index across all content types */
(function (S) {
  'use strict';
  var index = [];

  S.search = {
    build: function () {
      index = [];
      var D = S.data;
      (D.lessons || []).forEach(function (l) {
        index.push({ kind: 'Lesson', title: l.title, route: '/lesson/' + l.id,
          text: (l.title + ' ' + (l.objectives || []).join(' ') + ' ' + (l.sections || []).map(function (s) { return s.h + ' ' + s.md; }).join(' ')).toLowerCase() });
      });
      (D.patterns || []).forEach(function (p) {
        index.push({ kind: 'Pattern', title: p.name, route: '/pattern/' + p.id,
          text: (p.name + ' ' + p.definition + ' ' + p.problem + ' ' + p.use).toLowerCase() });
      });
      (D.glossary || []).forEach(function (g) {
        index.push({ kind: 'Glossary', title: g.term, route: '/glossary?q=' + encodeURIComponent(g.term),
          text: (g.term + ' ' + g.simple + ' ' + g.technical + ' ' + g.cat).toLowerCase() });
      });
      (D.caseStudies || []).forEach(function (c) {
        index.push({ kind: 'Case study', title: c.title, route: '/case-study/' + c.id, text: (c.title + ' ' + c.problem).toLowerCase() });
      });
      (D.labs || []).forEach(function (l) {
        index.push({ kind: 'Lab', title: l.title, route: '/lab/' + l.id, text: (l.title + ' ' + l.scenario).toLowerCase() });
      });
      (D.interviewQs || []).forEach(function (q) {
        index.push({ kind: 'Interview question', title: q.q.slice(0, 90), route: '/interview?q=' + encodeURIComponent(q.q.slice(0, 40)), text: (q.q + ' ' + q.cat + ' ' + (q.role || []).join(' ')).toLowerCase() });
      });
      (D.templates || []).forEach(function (t) {
        index.push({ kind: 'Template', title: t.name, route: '/template/' + t.id, text: t.name.toLowerCase() });
      });
      (D.reviewScenarios || []).forEach(function (r) {
        index.push({ kind: 'Review scenario', title: r.title, route: '/review-sim/' + r.id, text: (r.title + ' ' + r.description).toLowerCase() });
      });
    },
    query: function (q) {
      q = (q || '').toLowerCase().trim();
      if (q.length < 2) return [];
      var terms = q.split(/\s+/);
      return index
        .map(function (item) {
          var score = 0;
          terms.forEach(function (t) {
            if (item.title.toLowerCase().indexOf(t) >= 0) score += 5;
            if (item.text.indexOf(t) >= 0) score += 1;
          });
          return { item: item, score: score };
        })
        .filter(function (r) { return r.score >= terms.length; })
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, 40)
        .map(function (r) { return r.item; });
    }
  };
})(window.SAA);
