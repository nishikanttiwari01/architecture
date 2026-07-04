/* mocks.js — 10 general + 10 banking mock interview sets.
   Sets are composed from the interview-question bank by rotating through per-category
   pools, so every set is a distinct, coherent 13-section interview. */
(function (D) {
  'use strict';

  // Category pools (question IDs authored in interview*.js)
  var GEN = {
    intro:      ['gi1', 'gi2'],
    experience: ['gi3', 'gi4', 'gx29', 'gx30', 'gi50'],
    fundamentals: ['gi5', 'gi6', 'gi7', 'gi8', 'gi9', 'gi10', 'gx1', 'gx2', 'gx3', 'gx4', 'gx5', 'gi51', 'gi52'],
    domain:     ['gi35', 'gi36', 'gi37', 'gi38', 'gi39', 'gx20', 'gx21', 'gx22', 'gx23', 'gx24'],
    java:       ['gi26', 'gi27', 'gi28', 'gi29', 'gi30', 'gx15', 'gx16', 'gx17'],
    micro:      ['gi16', 'gi17', 'gi18', 'gi19', 'gi20', 'gx9', 'gx10', 'gx11'],
    kafka:      ['gi21', 'gi22', 'gi23', 'gi24', 'gi25', 'gx12', 'gx13', 'gx14'],
    security:   ['gi31', 'gi32', 'gi33', 'gi34', 'gx18', 'gx19'],
    sysdesign:  ['gi40', 'gi41', 'gi42', 'gx25', 'gx26'],
    failure:    ['gi43', 'gi44', 'gi45', 'gx27'],
    tradeoffs:  ['gi11', 'gi12', 'gi13', 'gi14', 'gi15', 'gx6', 'gx7', 'gx8', 'gi53', 'gi54'],
    leadership: ['gi46', 'gi47', 'gi48', 'gi49', 'gx28'],
    summary:    ['gi55']
  };
  var BNK = {
    intro:      ['bk61', 'bx1'],
    experience: ['bk62', 'bx18'],
    fundamentals: ['bx19', 'bx2', 'bk1', 'bk12', 'bk3'],
    domain:     ['bk2', 'bk4', 'bk5', 'bk6', 'bk7', 'bk8', 'bk9', 'bk10', 'bk11', 'bk13', 'bk14', 'bk55', 'bk56', 'bk57', 'bx3', 'bx5', 'bx6', 'bx7'],
    java:       ['bk34', 'bk35', 'bk36', 'bx11', 'bk59'],
    micro:      ['bk63', 'bx9', 'bk6'],
    kafka:      ['bk29', 'bk30', 'bk31', 'bk32', 'bk33', 'bk58', 'bx10', 'bx4'],
    security:   ['bk37', 'bk38', 'bk39', 'bk64', 'bx8'],
    sysdesign:  ['bk45', 'bk46', 'bk47', 'bk48', 'bk49', 'bk50', 'bx15', 'bx16', 'bx17', 'bk15', 'bk24'],
    failure:    ['bk51', 'bk52', 'bk53', 'bk54', 'bx13', 'bk16', 'bk17', 'bk18'],
    tradeoffs:  ['bk60', 'bx12', 'bx20', 'bk19', 'bk20', 'bk21', 'bk22', 'bk23', 'bk26'],
    leadership: ['bk40', 'bk41', 'bk42', 'bk43', 'bk44', 'bx14'],
    summary:    ['bk65']
  };

  var SECTIONS = [
    ['Introduction', 'intro', 1], ['Experience', 'experience', 1], ['Architecture fundamentals', 'fundamentals', 2],
    ['Domain', 'domain', 2], ['Java & Spring Boot', 'java', 1], ['Microservices', 'micro', 1],
    ['Kafka', 'kafka', 1], ['Security', 'security', 1], ['System design', 'sysdesign', 1],
    ['Failure & recovery', 'failure', 1], ['Trade-offs', 'tradeoffs', 1], ['Leadership', 'leadership', 1],
    ['Final summary', 'summary', 1]
  ];

  function pick(pool, setIdx, n) {
    var out = [];
    for (var k = 0; k < n; k++) out.push(pool[(setIdx * 3 + k * 5 + Math.floor(setIdx / pool.length)) % pool.length]);
    // de-duplicate within a section
    return out.filter(function (v, i) { return out.indexOf(v) === i; });
  }

  function buildSets(pools, kind, titles) {
    var sets = [];
    for (var i = 0; i < 10; i++) {
      var sections = SECTIONS.map(function (s) {
        return { name: s[0], qIds: pick(pools[s[1]], i, s[2]) };
      });
      sets.push({
        id: kind + '-' + (i + 1),
        title: titles[i],
        kind: kind,
        difficulty: i < 3 ? 'Intermediate' : i < 7 ? 'Advanced' : 'Expert',
        duration: [60, 75, 90, 60, 75, 90, 75, 90, 90, 75][i],
        sections: sections
      });
    }
    return sets;
  }

  var genTitles = [
    'General Architect Interview 1 — Foundations Focus',
    'General Architect Interview 2 — Integration Focus',
    'General Architect Interview 3 — Cloud & Platform Focus',
    'General Architect Interview 4 — Distributed Systems Focus',
    'General Architect Interview 5 — Microservices Focus',
    'General Architect Interview 6 — Kafka & Events Focus',
    'General Architect Interview 7 — Security Focus',
    'General Architect Interview 8 — Senior/Staff Level',
    'General Architect Interview 9 — Leadership & Strategy',
    'General Architect Interview 10 — Full Gauntlet'
  ];
  var bnkTitles = [
    'Banking Architect Interview 1 — Domain Foundations',
    'Banking Architect Interview 2 — Payments Focus',
    'Banking Architect Interview 3 — Screening & FinCrime Focus',
    'Banking Architect Interview 4 — Data & Consistency Focus',
    'Banking Architect Interview 5 — Kafka in Banking',
    'Banking Architect Interview 6 — Resilience & Operations',
    'Banking Architect Interview 7 — Security & Controls',
    'Banking Architect Interview 8 — Modernisation & Migration',
    'Banking Architect Interview 9 — Leadership in the Bank',
    'Banking Architect Interview 10 — Full Gauntlet'
  ];

  D.mockSets = buildSets(GEN, 'general', genTitles).concat(buildSets(BNK, 'banking', bnkTitles));
})(window.SAA.data);
