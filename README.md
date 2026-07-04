# Software Architect Academy

An offline-first, interactive learning platform for **software, solution, and banking
technology architects** — built entirely in vanilla HTML/CSS/JavaScript. No build step,
no backend, no external services.

**➡ Application source: [`software-architect-academy/`](./software-architect-academy/)**
(full documentation in its [README](./software-architect-academy/README.md))

## Quick start (Windows)

```powershell
cd software-architect-academy
python -m http.server 8080
# open http://localhost:8080        — the app
# open http://localhost:8080/test.html — ~45 automated self-checks
```

## What's inside

| Area | Content |
|---|---|
| Curriculum | 68 lessons across 4 levels + Java/Spring, Kafka, Banking, Modelling, Data, Cloud, Microservices tracks |
| Banking depth | Payments pipeline, screening & financial-crime architecture, Oracle↔Kafka consistency, maker-checker, reconciliation, evidence retention, 19-event banking catalogue |
| Practice | 22 attempt-first case studies · 29 labs · 10 architecture-review scenarios · 20 timed mock interviews · 10 guided system-design exercises |
| Question banks | 209 interview questions (107 banking-specific) · 130 authored quiz questions + glossary-generated pool · 304 glossary terms with spaced-repetition flashcards |
| Tools | 23-step ADR wizard · build-vs-buy matrix (28 criteria) · Quality Attribute Workshop · 10 capacity/availability calculators · Kafka topic designer · data-store selector · 32 exportable document templates |
| Platform | Progress tracking & achievements · personalised learning paths with diagnostic · full-text search · dark/light themes · JSON import/export · PWA offline support |

## Testing

- **Browser self-test**: `test.html` runs ~45 checks — content minimums, referential
  integrity across all content types, routing (including query-string routes),
  markdown link safety, import validation, and storage round-trips.
- **E2E smoke tests**: Playwright specs in [`e2e/`](./e2e/) cover navigation of every
  major route, global search, theme persistence across reload, and a complete mock
  interview including answer feedback. Run locally with:

  ```powershell
  npm install
  npx playwright install chromium
  npm test
  ```

  CI runs them on every push (`.github/workflows/ci.yml`).

## Honest notes

- Free-text answers (mock interviews, system design) are scored by **key-point
  coverage** — the UI labels it as such: it tells you which expected concepts your
  answer mentioned, not whether your answer was correct or well-structured.
- All progress lives in your browser's localStorage; export it from Settings.

## Suggested repository topics

`software-architecture` · `system-design` · `kafka` · `java` · `spring-boot` ·
`banking` · `interview-preparation` · `learning-platform` · `offline-first` · `pwa`

## License

[MIT](./LICENSE)
