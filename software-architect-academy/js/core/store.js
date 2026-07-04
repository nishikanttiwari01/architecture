/* store.js — validated localStorage persistence, progress model, import/export */
(function (S) {
  'use strict';
  var KEY = 'saa.state.v1';

  var DEFAULTS = {
    version: 1,
    settings: { theme: 'dark', fontSize: 'normal' },
    profile: null,                    // diagnostic answers → recommended path
    lessons: {},                      // lessonId → { done, quizScore, quizTotal, date }
    quizzes: {},                      // quizId → { score, total, date, answers }
    labs: {},                         // labId → { status, work, score, date }
    cases: {},                       // caseId → { attempt, revealed, selfScore, date }
    reviews: {},                      // reviewId → { findings, score, date }
    interviews: [],                   // [{ id, setId, kind, date, scores, answers }]
    flash: {},                        // termId → { box (1-5), due }
    bookmarks: [],                    // [{ type, id, title, date }]
    notes: {},                        // key → text
    adrs: [],                         // saved ADR documents
    bvbs: [],                         // saved build-vs-buy assessments
    templatesSaved: {},               // templateId → field values
    achievements: {},                 // id → date
    activity: {},                     // date → count (for streak)
    lastVisited: []                   // [{route, title, date}]
  };

  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULTS);
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) throw new Error('bad version');
      return merge(clone(DEFAULTS), parsed);
    } catch (e) {
      console.warn('SAA: corrupt saved state, starting fresh.', e);
      try { localStorage.setItem(KEY + '.corrupt', localStorage.getItem(KEY) || ''); } catch (e2) {}
      return clone(DEFAULTS);
    }
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(base, over) {
    Object.keys(over).forEach(function (k) {
      if (Object.prototype.toString.call(base[k]) === '[object Object]' &&
          Object.prototype.toString.call(over[k]) === '[object Object]') merge(base[k], over[k]);
      else base[k] = over[k];
    });
    return base;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { S.toast('Warning: could not save progress (storage full or blocked).'); }
  }

  /* Allow-list validation of imported state: known keys, correct types, sane values.
     Returns an error string or null. Unknown top-level keys are rejected outright. */
  function validateImport(data) {
    var isObj = function (v) { return Object.prototype.toString.call(v) === '[object Object]'; };
    var TYPES = {
      version: 'number', settings: 'object', profile: 'objectOrNull',
      lessons: 'object', quizzes: 'object', labs: 'object', cases: 'object', reviews: 'object',
      interviews: 'array', flash: 'object', bookmarks: 'array', notes: 'object',
      adrs: 'array', bvbs: 'array', templatesSaved: 'object', achievements: 'object',
      activity: 'object', lastVisited: 'array'
    };
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i], want = TYPES[k], v = data[k];
      if (!want) return 'Unknown field in import: "' + k + '".';
      if (want === 'number' && typeof v !== 'number') return 'Field "' + k + '" must be a number.';
      if (want === 'array' && !Array.isArray(v)) return 'Field "' + k + '" must be an array.';
      if (want === 'object' && !isObj(v)) return 'Field "' + k + '" must be an object.';
      if (want === 'objectOrNull' && v !== null && !isObj(v)) return 'Field "' + k + '" must be an object or null.';
    }
    // Value-level checks on the fields views iterate over.
    if (data.notes) {
      var nk = Object.keys(data.notes);
      for (var n = 0; n < nk.length; n++) {
        if (typeof data.notes[nk[n]] !== 'string' || data.notes[nk[n]].length > 200000) return 'Invalid note content in import.';
      }
    }
    if (data.bookmarks && data.bookmarks.some(function (b) { return !isObj(b) || typeof b.id !== 'string' || typeof b.type !== 'string'; })) return 'Invalid bookmark entry in import.';
    if (data.interviews && data.interviews.some(function (x) { return !isObj(x); })) return 'Invalid interview entry in import.';
    if (data.adrs && data.adrs.some(function (x) { return !isObj(x); })) return 'Invalid ADR entry in import.';
    if (data.bvbs && data.bvbs.some(function (x) { return !isObj(x); })) return 'Invalid assessment entry in import.';
    if (data.lastVisited && data.lastVisited.some(function (x) { return !isObj(x) || typeof x.route !== 'string'; })) return 'Invalid history entry in import.';
    var perRecord = [['lessons', null], ['quizzes', null], ['labs', null], ['cases', null], ['reviews', null], ['flash', null], ['achievements', 'string'], ['activity', 'number']];
    for (var p = 0; p < perRecord.length; p++) {
      var field = perRecord[p][0], leaf = perRecord[p][1];
      if (!data[field]) continue;
      var rk = Object.keys(data[field]);
      for (var r = 0; r < rk.length; r++) {
        var rv = data[field][rk[r]];
        if (leaf === 'string' && typeof rv !== 'string') return 'Invalid value in "' + field + '".';
        if (leaf === 'number' && typeof rv !== 'number') return 'Invalid value in "' + field + '".';
        if (leaf === null && !isObj(rv)) return 'Invalid record in "' + field + '".';
      }
    }
    return null;
  }

  S.store = {
    get state() { return state; },
    save: save,

    touchActivity: function () {
      var d = S.today();
      state.activity[d] = (state.activity[d] || 0) + 1;
      save();
    },
    streak: function () {
      var n = 0, d = new Date();
      for (;;) {
        var key = S.localDate(d);
        if (state.activity[key]) { n++; d.setDate(d.getDate() - 1); }
        else if (n === 0 && key === S.today()) { d.setDate(d.getDate() - 1); } // today not studied yet
        else break;
        if (n > 3650) break;
      }
      return n;
    },

    completeLesson: function (id, quizScore, quizTotal) {
      state.lessons[id] = { done: true, quizScore: quizScore, quizTotal: quizTotal, date: S.today() };
      this.touchActivity();
      S.store.checkAchievements();
    },
    lessonDone: function (id) { return !!(state.lessons[id] && state.lessons[id].done); },

    toggleBookmark: function (type, id, title) {
      var i = state.bookmarks.findIndex(function (b) { return b.type === type && b.id === id; });
      if (i >= 0) { state.bookmarks.splice(i, 1); save(); return false; }
      state.bookmarks.push({ type: type, id: id, title: title, date: S.today() });
      save(); return true;
    },
    isBookmarked: function (type, id) {
      return state.bookmarks.some(function (b) { return b.type === type && b.id === id; });
    },

    note: function (key, val) {
      if (val === undefined) return state.notes[key] || '';
      if (val === '') delete state.notes[key]; else state.notes[key] = val;
      save();
    },

    award: function (id) {
      if (!state.achievements[id]) { state.achievements[id] = S.today(); save(); S.toast('Achievement earned: ' + (S.ACHIEVEMENTS[id] || id)); }
    },
    checkAchievements: function () {
      var st = state;
      if (st.adrs.length >= 1) this.award('first-adr');
      if (Object.keys(st.lessons).length >= 10) this.award('committed-learner');
      if (st.bvbs.length >= 1) this.award('tradeoff-thinker');
      var mo = Object.keys(st.lessons).filter(function (id) { return id.indexOf('mo') === 0; });
      if (mo.length >= 3) this.award('context-modeller');
      var bank = st.interviews.filter(function (i) { return i.kind === 'banking'; });
      if (bank.length >= 1) this.award('banking-specialist');
      if (st.interviews.length >= 3) this.award('interview-ready');
      if (Object.keys(st.reviews).length >= 3) this.award('review-expert');
      var kafkaLessons = ['d13', 'd14', 'k1', 'k2', 'k3', 'k4'].filter(this.lessonDone.bind(this));
      if (kafkaLessons.length >= 4) this.award('kafka-architect');
      var secLessons = ['d15', 'd16'].filter(this.lessonDone.bind(this));
      if (secLessons.length >= 2) this.award('security-champion');
      var resilLessons = ['d4', 'd5'].filter(this.lessonDone.bind(this));
      if (resilLessons.length >= 2) this.award('resilience-reviewer');
      var intLessons = ['a6', 'a7'].filter(this.lessonDone.bind(this));
      if (intLessons.length >= 2) this.award('integration-architect');
    },

    exportJSON: function () {
      return JSON.stringify({ exportedAt: new Date().toISOString(), app: 'software-architect-academy', data: state }, null, 2);
    },
    importJSON: function (text) {
      var parsed;
      if (typeof text !== 'string' || text.length > 20 * 1024 * 1024) return 'File too large or unreadable.';
      try { parsed = JSON.parse(text); } catch (e) { return 'Invalid JSON file.'; }
      var data = parsed && parsed.data;
      if (!data || typeof data !== 'object' || data.version !== 1) return 'Not a valid Software Architect Academy export.';
      var err = validateImport(data);
      if (err) return err;
      // Build the candidate state fully, then swap only on success (never mutate live state mid-import).
      var candidate = merge(clone(DEFAULTS), data);
      if (['dark', 'light'].indexOf(candidate.settings.theme) < 0) candidate.settings.theme = 'dark';
      state = candidate;
      save();
      return null;
    },
    reset: function () { state = clone(DEFAULTS); save(); }
  };

  S.ACHIEVEMENTS = {
    'first-adr': 'First ADR',
    'context-modeller': 'Context Modeller',
    'tradeoff-thinker': 'Trade-off Thinker',
    'resilience-reviewer': 'Resilience Reviewer',
    'security-champion': 'Security Champion',
    'kafka-architect': 'Kafka Architect',
    'integration-architect': 'Integration Architect',
    'banking-specialist': 'Banking Architecture Specialist',
    'interview-ready': 'Interview Ready',
    'review-expert': 'Architecture Review Expert',
    'committed-learner': 'Committed Learner'
  };
})(window.SAA);
