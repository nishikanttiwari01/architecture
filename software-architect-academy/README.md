# Software Architect Academy

A complete, offline-first interactive learning application for software, solution, and
banking technology architects. Vanilla HTML/CSS/JavaScript — no build step, no backend,
no external dependencies, no internet required after the files are on your machine.

## What's inside

- **68 lessons** across 4 levels (Foundations → Applied → Advanced → Mastery) plus
  specialist tracks: Java/Spring, Kafka, Banking (9 lessons), Modelling, Data, Cloud, Microservices
- **304 glossary terms** with flashcards and spaced review
- **130 authored quiz questions** + questions generated from the glossary (pool > 400),
  across 6 question types, with post-submission explanations linked to lessons
- **209 interview questions** (107 banking-specific, 102 general) with testing intent,
  answer structure, key points, strong/weak answers, follow-ups and lesson links
- **10 general + 10 banking mock interview sets** (13 sections, 60–90 min, timed, scored)
- **10 guided system-design interview exercises** (18-step walkthrough with model answers)
- **22 case studies** (attempt-first: model solutions unlock after your attempt)
- **29 hands-on labs** with workspaces, hints, model answers and rubrics
- **45 architecture patterns** with trade-offs, risks, and interview questions
- **32 editable documentation templates** (fill in-browser, export MD/JSON/printable HTML)
- **10 architecture review scenarios** with scored findings, severities and decoys
- Interactive tools: **23-step ADR wizard**, **build-vs-buy matrix (28 criteria)**,
  **Quality Attribute Workshop**, **10 calculators**, **Kafka topic designer** with a
  19-event banking catalogue, **data-store selector**, **diagram challenge**
- Progress tracking, achievements, personalised learning paths with a diagnostic,
  bookmarks, notes, full-text search, dark/light themes, PWA offline support

## Running on Windows

The app is plain static files. Two ways to run it:

### Option A — with a local web server (recommended: enables PWA/offline caching)

1. Install [Python](https://www.python.org/downloads/) if you don't have it
   (or use any static server you like).
2. Open **Command Prompt** or **PowerShell** in this folder
   (in Explorer: Shift+Right-click → "Open PowerShell window here").
3. Run:

   ```
   python -m http.server 8080
   ```

4. Open **http://localhost:8080** in your browser.

Alternative with Node.js: `npx serve .` or `npx http-server -p 8080`.

### Option B — open directly

Double-click `index.html`. Everything works from the `file://` protocol except the
service worker (offline pre-caching), which browsers only allow over HTTP — the app
itself is still fully offline-capable since all content ships as local files.

## Verifying the installation

Open **http://localhost:8080/test.html** — a self-test page runs ~35 automated checks
(content minimums, referential integrity, renderer and storage logic) and shows
PASS/FAIL per check.

## Your data

All progress (lessons, quiz scores, interview history, notes, bookmarks, drafts) is
stored in your browser's `localStorage` under the `saa.state.v1` key. Nothing leaves
your machine.

- **Export/import:** Settings → Export progress (JSON) / Import progress.
- Corrupt or foreign data is rejected safely; a corrupted store is backed up and reset.
- Clearing browser site data erases progress — export first.

## Project structure

```
software-architect-academy/
├── index.html              application shell (script loading order)
├── test.html               browser-based self-test suite
├── manifest.webmanifest    PWA manifest
├── sw.js                   service worker (offline cache)
├── README.md
├── docs/PLAN.md            PRD, information architecture, curriculum map, tech design
├── css/main.css            all styling (themes, print, responsive)
├── js/
│   ├── core/
│   │   ├── utils.js        markdown-lite renderer, SVG diagram DSL, DOM helpers
│   │   ├── store.js        validated localStorage persistence, import/export, achievements
│   │   ├── router.js       hash router
│   │   └── search.js       full-text index across all content types
│   ├── components.js       quiz engine, cards, tabs, rings, bookmark/notes widgets
│   ├── app.js              navigation, theme, global search, SW registration
│   └── views/
│       ├── dashboard.js    dashboard, readiness score, recommendations
│       ├── learn.js        courses, lessons, tracks, learning paths + diagnostic
│       ├── library.js      patterns, glossary, flashcards, references, mistakes,
│       │                   communication, diagram challenge
│       ├── tools.js        ADR wizard, build-vs-buy, QAW, calculators, data-store
│       │                   selector, Kafka designer, templates, toolkit
│       ├── practice.js     case studies, labs, review simulator, interview bank,
│       │                   mock + system-design simulators, assessments
│       └── user.js         progress, bookmarks, notes, settings, search results
└── data/                   ALL content, strictly separated from logic
    ├── curriculum*.js      68 lessons (schema per docs/PLAN.md)
    ├── glossary*.js        304 terms
    ├── patterns.js         45 patterns
    ├── quiz.js             130 authored quiz questions
    ├── interview*.js       209 interview questions (incl. 107 banking)
    ├── mocks.js            20 mock interview sets
    ├── casestudies*.js     22 case studies
    ├── labs.js             29 labs
    ├── reviews.js          10 review scenarios
    ├── templates.js        32 templates
    ├── events.js           19-event banking catalogue + Kafka decision guides
    ├── sysdesign.js        10 system-design exercises (18 steps each)
    ├── toolkit.js          17 checklists + QAW data + diagram challenge
    ├── paths.js            12 learning paths
    ├── mistakes.js         28 architect mistakes
    ├── communication.js    audience translations + exercises
    └── references.js       ~50 authoritative sources
```

## Extending the content

Content is data, not code. To add a lesson, append an object to any `curriculum*.js`
file following the schema in `docs/PLAN.md`; it appears automatically in courses,
tracks, search, progress and assessments. The same applies to glossary terms, patterns,
questions, labs and case studies. If you add a new data file, register it in
`index.html` and `sw.js`.

## Notes on scoring

Free-text answers (mock interviews, system-design steps) are scored by **key-point
coverage**: each question defines the concepts a strong answer contains, and the
simulator checks which ones your answer mentioned. This is a study heuristic, clearly
labelled in the UI — it tells you what you missed, not how eloquent you were. Quizzes,
review scenarios and assessments are scored exactly.
