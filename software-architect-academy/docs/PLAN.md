# Software Architect Academy — Product Requirements & Technical Design

## 1. Product Requirements Document (PRD)

### 1.1 Purpose
An offline-first, browser-based learning application that takes software engineers from
beginner to expert readiness for Software / Solution / Application / Integration / Cloud /
Data / Security / Platform / Enterprise Architect roles, with a deep banking-technology
specialisation (payments, screening, financial crime, customer master data).

### 1.2 Target users
- Senior developers and tech leads moving into architecture roles
- Practising architects preparing for interviews or new domains
- Engineers with Java / Spring Boot / Kafka / Oracle / Kubernetes backgrounds
- Beginners who need foundations before applied material

### 1.3 Success criteria
- Every navigation item leads to a working, content-complete page
- Learner can study lessons, take quizzes with post-submission feedback, run labs,
  attempt case studies before seeing model answers, run mock interviews with timers
  and scoring, generate ADRs and build-vs-buy assessments, and export everything
- All progress persists locally (localStorage) and survives refresh; import/export as JSON
- Works fully offline after first load; PWA service worker when served over HTTP

### 1.4 Non-goals
- No backend, accounts, paid services, or network dependency
- No AI grading (scoring uses rubrics + key-point coverage heuristics, clearly labelled)

## 2. Information Architecture

Routes (hash-based):
- `#/dashboard` — progress overview, streak, readiness score, recommendations
- `#/paths` — personalised learning paths + diagnostic assessment
- `#/courses` — all lessons by level (1–4) and by track
- `#/lesson/{id}` — lesson view with sections, diagrams, exercises, quiz
- `#/track/{id}` — topic tracks: foundations, patterns, modelling, distributed, cloud,
  security, data, integration, banking, java, kafka, microservices
- `#/patterns`, `#/pattern/{id}` — searchable pattern library
- `#/case-studies`, `#/case-study/{id}` — attempt-first case studies
- `#/labs`, `#/lab/{id}` — hands-on labs with workspace, hints, rubric
- `#/review-sim`, `#/review-sim/{id}` — architecture review simulator
- `#/interview` — question bank by role/difficulty/type
- `#/mock`, `#/mock/run/{id}` — configurable mock interviews with timer
- `#/sysdesign`, `#/sysdesign/run/{id}` — guided system-design simulator
- `#/assessments` — quizzes, module tests, level exams, readiness assessment
- `#/glossary`, `#/flashcards` — glossary + spaced review
- `#/toolkit` — checklists and question banks
- `#/calculators` — capacity/availability/Kafka/cost calculators
- `#/adr` — ADR decision wizard (23-step) with MD/JSON/HTML export
- `#/bvb` — build/buy/reuse/extend/integrate/replace/retire weighted matrix
- `#/qaw` — Quality Attribute Workshop (scenario builder + NFR improvement drills)
- `#/datastore` — "choose the right data store" simulator
- `#/kafka-designer` — Kafka topic design tool + event catalogue
- `#/diagram-challenge` — "choose the right diagram" challenge
- `#/mistakes` — common architect mistakes module
- `#/communication` — audience-specific communication training
- `#/templates`, `#/template/{id}` — 15+ editable, exportable documentation templates
- `#/progress`, `#/bookmarks`, `#/notes`, `#/references`, `#/settings`, `#/search`

## 3. Curriculum map (60+ lessons)

Level 1 Foundations (f1..f10): what architecture is; architect roles; drivers &
requirements; quality attributes; stakeholders & RAID; coupling/cohesion/modularity;
design principles (SOLID/DRY/KISS/YAGNI); technical debt & evolutionary architecture;
boundaries & ownership; terminology.

Level 2 Applied (a1..a12): requirement discovery; capability & process analysis;
current/target/gap; options & trade-off analysis; sourcing decisions; integration styles;
API styles; technology selection; observability & auditability; deployment & environments;
migration & rollback; PoCs, spikes & ADRs.

Level 3 Advanced (d1..d16): distributed fundamentals; distributed transactions;
idempotency & ordering; resilience patterns; HA/DR/multi-region; scaling & data
distribution; CQRS & event sourcing; DDD; microservices vs modular monolith;
architecture styles; cloud-native & Kubernetes; mesh & gateways; Kafka fundamentals;
Kafka design decisions; security architecture; threat modelling & compliance by design.

Level 4 Mastery (m1..m10): strategy & roadmaps; modernisation & strangler;
governance & review boards; risk & exception management; cost & FinOps;
Conway & Team Topologies; leadership & influence; executive communication;
measuring success & maturity; ethics, sustainability & AI.

Tracks: Java/Spring (j1..j5), Kafka deep-dive (k1..k4), Banking (b1..b9),
Modelling (mo1..mo5), Data (dt1..dt2), Cloud (c1..c2), Microservices (ms1..ms2).

## 4. Data model / content schema

All content in `data/*.js` files registering onto `window.SAA.data` (script-tag loading —
works from file:// and http://, no fetch/CORS issues, fully offline).

Lesson: { id, title, level, category, difficulty, duration, prerequisites[], objectives[],
sections[{h, md}], diagram?, exercise?, quiz[qIds], related[], refs[] }

Pattern: { id, name, group, definition, problem, context, how, pros[], cons[], risks[],
use, avoid, example, diagram, related[], mistakes[], interviewQs[] }

Glossary term: { id, term, cat, simple, technical, example, related[], misconception, interview }

Quiz question: { id, type(mc|ms|tf|match|fib|order), q, options[], answer, explain, lessonId }
plus runtime-generated questions derived from glossary/pattern data.

Interview question: { id, role[], cat, difficulty, q, testing, structure, keyPoints[],
strong, weak, followups[], scoring, lessons[] }

Case study: { id, title, difficulty, problem, clarifying[], requirements{...}, traffic, data,
options[], recommended, tradeoffs, security, dataModel, apis[], events[], kafka, deployment,
failures[], monitoring, cost, migration, rollback, reconciliation, diagram, adrs[],
followups[], rubric[] } — model solution hidden until learner submits an attempt.

Lab: { id, title, scenario, instructions[], input, hints[], deliverables[], modelAnswer,
rubric[], mistakes[], reflection[] }

Review scenario: { id, title, description, diagram, findings[{id, title, severity, risk,
remediation, keywords[]}] } — learner findings matched by keyword coverage.

Mock set: { id, title, kind(general|banking), duration, sections[{name, qIds[]}] }

Template: { id, name, fields[{label, hint, kind}] } → fill in browser, export MD/JSON/HTML.

## 5. Technical architecture

- Vanilla JS SPA, no build step, no dependencies. ES2020.
- `js/core/`: store.js (validated localStorage wrapper + import/export), router.js
  (hash router), utils.js (markdown-lite renderer, SVG box-diagram renderer, DOM helpers),
  search.js (in-memory full-text index built at boot).
- `js/views/`: one module per feature area; each registers routes with the router.
- `js/components.js`: quiz engine, cards, breadcrumbs, progress rings, tabs, toasts.
- Theme: CSS custom properties, `data-theme` attribute, print stylesheet.
- Diagrams: hand-authored inline SVG + a compact box/arrow diagram DSL rendered to SVG
  (no Mermaid dependency → truly offline).
- Service worker `sw.js` caches all assets (registered only on http/https).
- State keys namespaced `saa.*`; corrupt JSON handled by validation + reset fallback.

## 6. Phased implementation plan
1. Planning docs (this file)
2. Shell: index.html, css, core js, settings, import/export, sw
3. Core learning: lessons, quizzes, glossary, patterns, notes, bookmarks, progress
4. Tools: ADR wizard, BvB matrix, QAW, calculators, Kafka designer, templates, toolkit
5. Practice: case studies, labs, review sim, interview bank, mock + sysdesign simulators
6. Content expansion to minimum counts
7. Testing: syntax checks, headless smoke tests of all routes, persistence, scoring
