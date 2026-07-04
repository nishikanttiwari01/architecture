/* curriculum.js — Level 1 (Foundations) and Level 2 (Applied Solution Architecture) lessons */
(function (D) {
  'use strict';
  D.lessons = (D.lessons || []).concat([

  /* ================= LEVEL 1 — FOUNDATIONS ================= */
  {
    id: 'f1', title: 'What Software Architecture Is (and Is Not)', level: 1, cat: 'foundations',
    difficulty: 'Beginner', duration: 30, prerequisites: [], glossCat: 'General architecture',
    objectives: ['Define software architecture in terms of significant decisions', 'Distinguish architecture from design and implementation', 'Explain why architecture exists even when nobody designs it'],
    sections: [
      { h: 'A working definition', md:
`Software architecture is the set of **significant design decisions** about a system: the ones that are expensive to change, that shape everything built afterwards, and that determine whether the system meets its quality goals. Structure matters — components, their relationships, and the principles governing them — but the decisions and their reasons matter more than the boxes.

A useful test for "is this architectural?": *if we get this wrong, how expensive is it to fix in a year?* Choosing a database paradigm, deciding sync vs async integration, and drawing service boundaries are expensive to reverse. Choosing a logging library rarely is.

Every system **has** an architecture, whether or not anyone deliberately designed it. Undesigned architectures are accidental accumulations of local decisions — and usually show it.` },
      { h: 'Architecture vs design vs implementation', md:
`- **Architecture** answers: what are the parts, how do they interact, what qualities must the whole achieve, and what trade-offs did we accept? It is cross-cutting and hard to reverse.
- **Design** answers: how does this part work internally? Class structures, algorithms, module APIs. Reversible with local effort.
- **Implementation** is the code that realises the design. Cheapest to change (though "cheap" compounds into technical debt when done carelessly).

The boundary is fuzzy and shifts by context: for a small tool, choosing a framework is architecture; for a bank, it may be a pre-decided standard, so it isn't a decision at all — it's a constraint.` },
      { h: 'Architect vs senior developer', md:
`A senior developer optimises within a given frame; an architect chooses the frame. The differences that matter in practice:

| Dimension | Senior developer | Architect |
|---|---|---|
| Horizon | This release | 2–5 years, including run costs |
| Scope | Their codebase | System + neighbours + organisation |
| Currency | Code quality | Decisions, trade-offs, risk |
| Stakeholders | Team, PO | Business, security, ops, vendors, governance |
| Failure mode | Bugs | Wrong system built well |

The role is not "developer plus seniority". It adds requirement discovery, trade-off analysis, cross-team communication, and accountability for qualities like availability and auditability that no single class or service owns.` }
    ],
    exercise: { task: `Your team built a well-tested, clean-code order service. It fails in production every Black Friday because it synchronously calls five downstream services. Was this a design failure or an architecture failure? Justify in 3–4 sentences.`,
      answer: `An architecture failure. Code quality (design/implementation) was fine; the failure is in the interaction structure — a long synchronous chain multiplies failure probability and couples the service's availability to five others (see [the availability calculator](#/calculators)). The decision "call dependencies synchronously" is expensive to reverse and shapes system-wide behaviour under load, which makes it architectural. A design review of the codebase would never have caught it; an architecture review of the interaction model would.` },
    quiz: [], related: ['f2', 'f3'], refs: ['Martin Fowler — "Who Needs an Architect?" (IEEE Software)', 'ISO/IEC/IEEE 42010 — Architecture description']
  },
  {
    id: 'f2', title: 'Architect Roles: Software, Solution, Enterprise and the Specialists', level: 1, cat: 'foundations',
    difficulty: 'Beginner', duration: 35, prerequisites: ['f1'], glossCat: 'General architecture',
    objectives: ['Distinguish the main architect role types and their scopes', 'Map responsibilities to organisational altitude', 'Choose which role fits a given problem'],
    sections: [
      { h: 'The altitude model', md:
`Architect titles differ wildly between companies, but roles reliably separate by **altitude** — how much of the organisation a decision spans:

| Role | Typical scope | Typical outputs |
|---|---|---|
| **Application architect** | One application or product | Internal structure, framework choices, API design |
| **Software architect** | One or a few systems | System structure, patterns, NFRs, technical leadership |
| **Solution architect** | One business problem, many systems | End-to-end solution design, integration, vendor fit, costs |
| **Enterprise architect** | Whole organisation | Capability maps, standards, roadmaps, portfolio decisions |

Specialists cut across altitudes: **integration architects** own how systems talk (APIs, events, files); **cloud architects** own platform/landing-zone design; **data architects** own data ownership, stores, and flows; **security architects** own threat models, controls, and compliance-by-design; **platform architects** build the internal platforms other teams stand on.` },
      { h: 'What they share and where they differ', md:
`All architect roles share the same core loop: **understand drivers → identify options → analyse trade-offs → decide → communicate → verify**. What differs is the subject matter and the audience.

A solution architect in a bank might spend a week on: stakeholder workshops for a screening platform (business), an options paper comparing a vendor engine vs in-house build (commercial + technical), a review of a team's Kafka topic design (deep technical), and a risk summary for a governance board (communication). The breadth is the job.

**Anti-pattern to avoid:** the "ivory tower" enterprise architect who issues standards without feedback from delivery. Standards divorced from delivery reality get bypassed, and the architecture function loses credibility. Good architects keep one foot in delivery.` },
      { h: 'Choosing your target role', md:
`If you love deep technical work and one product: application/software architect. If you enjoy stitching business problems to multi-system solutions and talking to vendors and stakeholders: solution architect. If you think in portfolios, capabilities, and multi-year roadmaps: enterprise architect. Banking adds domain-heavy variants — payments architect, financial-crime technology architect — where domain knowledge is worth as much as technology skill. Set your target in the [learning paths](#/paths) diagnostic and this app will sequence lessons accordingly.` }
    ],
    quiz: [], related: ['f1', 'm7'], refs: ['TOGAF Standard — role definitions (concepts)', 'Gregor Hohpe — "The Architect Elevator"']
  },
  {
    id: 'f3', title: 'Architecture Drivers: Goals, Requirements, Constraints', level: 1, cat: 'foundations',
    difficulty: 'Beginner', duration: 40, prerequisites: ['f1'], glossCat: 'General architecture',
    objectives: ['Identify the four kinds of architecture drivers', 'Separate functional from non-functional requirements', 'Recognise constraints and treat them differently from requirements'],
    sections: [
      { h: 'The four drivers', md:
`Architecture is not driven by fashion; it is driven by four inputs:

1. **Business goals** — why the system exists: revenue, cost reduction, compliance, market entry, risk reduction. Every architectural decision should trace to one.
2. **Functional requirements** — what the system must do: "accept a payment", "screen a customer against sanctions lists".
3. **Quality attributes (non-functional requirements)** — how well it must do it: latency, availability, security, auditability. These, more than features, determine the architecture. Two systems with identical features and different NFRs can require completely different architectures.
4. **Constraints** — decisions already made for you: mandated technology standards, budget, deadline, team skills, regulation, data residency. You don't trade off constraints; you design within them (or explicitly negotiate them).` },
      { h: 'RAID: risks, assumptions, issues, dependencies', md:
`Professional architecture work keeps an explicit **RAID log**:

- **Risks** — things that might hurt you: "vendor API rate limits unknown". Assess likelihood × impact, define mitigation.
- **Assumptions** — things you're treating as true without proof: "peak traffic won't exceed 3× average". Every assumption is a risk in disguise; document them so they can be challenged and validated.
- **Issues** — risks that have materialised.
- **Dependencies** — teams, systems, vendors, decisions you rely on: "requires the identity platform's OIDC support, due Q3".

Interviewers frequently probe this: a candidate who designs confidently without stating assumptions is a red flag. The habit of saying *"I'm assuming X — I'd validate that"* is a hallmark of real architects.` },
      { h: 'Stakeholders', md:
`Stakeholders are everyone with a legitimate interest in the system: end users, business owner/sponsor, developers, testers, operations, security, risk & compliance, data protection, vendors, and downstream system owners. Each cares about different qualities — ops about observability and runbooks, compliance about evidence and retention, developers about buildability. Requirements discovery ([lesson a1](#/lesson/a1)) is largely the craft of interviewing stakeholders and converting their concerns into measurable drivers. Missing a stakeholder is the classic root cause of late-stage redesign: the system that passed every test but failed its audit.` }
    ],
    exercise: { task: `A product owner says: "We need the new loan-origination system live by March, it must be fast, and Group standards say we must use the corporate Kafka platform." Classify each part as goal, functional requirement, NFR, or constraint — and identify what's missing.`,
      answer: `"Live by March" — constraint (deadline). "Must be fast" — an NFR, but unusable until made measurable (see [QAW](#/qaw)): fast at what percentile, under what load? "Use corporate Kafka" — constraint (technology standard). Missing: the business goal (why March? regulatory deadline? campaign?), the functional scope, and every other quality attribute — availability, auditability, security — which for a loan system will dominate the design.` },
    quiz: [], related: ['f4', 'a1'], refs: ['SEI — Software Architecture in Practice (Bass, Clements, Kazman) — drivers & QA scenarios']
  },
  {
    id: 'f4', title: 'Quality Attributes: The Real Shapers of Architecture', level: 1, cat: 'foundations',
    difficulty: 'Beginner', duration: 40, prerequisites: ['f3'], glossCat: 'Performance',
    objectives: ['Name the major quality attributes and their tensions', 'Write a measurable quality-attribute scenario', 'Explain why NFRs drive architecture more than features'],
    sections: [
      { h: 'Why qualities dominate', md:
`Features tell you what boxes to build; qualities tell you how the boxes must be arranged. A payment API that must handle 50 requests/second with 99.5% availability is an ordinary three-tier application. The same API at 20,000 requests/second with 99.99% availability and full audit reconstruction is a different architecture: partitioned data, async pipelines, multi-zone deployment, idempotency everywhere.

The major attributes: **performance** (latency/throughput), **scalability**, **availability**, **reliability**, **resilience**, **security**, **privacy**, **maintainability/modifiability**, **testability**, **interoperability**, **portability**, **usability**, **accessibility**, **observability**, **auditability**, **recoverability**, **data integrity**, **compliance**, **cost efficiency**, **sustainability**.` },
      { h: 'Qualities conflict — that is the job', md:
`You cannot maximise everything. Classic tensions: strong consistency vs availability under partition; security controls vs usability and latency; time-to-market vs maintainability; cost vs resilience (multi-region doubles infrastructure). Architecture is the discipline of choosing which qualities win, explicitly, with stakeholder agreement — not pretending there's no conflict.

A practical technique: ask the business to **rank** the top three qualities for the system, and to name one they're willing to sacrifice. If everything is "critical", nothing is, and the design has no direction.` },
      { h: 'Measurable scenarios', md:
`"The system must be fast" is not a requirement — it's a wish. The six-part scenario format makes qualities testable: **source of stimulus → stimulus → environment → artefact → expected response → measurable response.**

Bad: *"The system must be fast."*
Improved: *"Under a sustained load of 2,000 requests per second (source/stimulus), during normal operation (environment), 95% of payment-submission responses (artefact/response) complete within 300 ms and 99% within 800 ms (measure)."*

Practise this in the [Quality Attribute Workshop](#/qaw) — it includes a drill for repairing weak NFRs.` }
    ],
    quiz: [], related: ['f3', 'a1'], refs: ['SEI — quality attribute scenarios', 'Google SRE Book — SLOs and error budgets']
  },
  {
    id: 'f5', title: 'Coupling, Cohesion, Modularity and Boundaries', level: 1, cat: 'foundations',
    difficulty: 'Beginner', duration: 40, prerequisites: ['f1'], glossCat: 'General architecture',
    objectives: ['Define coupling and cohesion precisely', 'Use system boundaries and ownership to control coupling', 'Recognise high coupling in real systems'],
    sections: [
      { h: 'The two forces', md:
`**Cohesion**: how strongly the responsibilities inside a module belong together. **Coupling**: how much modules depend on each other's internals, data, or timing. Good architecture maximises cohesion within boundaries and minimises coupling across them — this single principle underlies microservices, DDD bounded contexts, clean architecture, and modular monoliths alike.

Coupling has flavours, from worst to least bad: **shared database** coupling (another team can break you with an ALTER TABLE), **temporal** coupling (you're down when they're down — every synchronous call), **contract** coupling (you depend on their API/schema — manageable with versioning), and **conceptual** coupling (you share a domain language — unavoidable and fine).` },
      { h: 'Boundaries and ownership', md:
`A **system boundary** defines what is inside (you control it) and what is outside (you integrate with it). Every boundary needs an **owner** — a team accountable for its behaviour, data, and evolution. Unowned components rot; doubly-owned components generate conflict.

**Data ownership** is the sharpest boundary question: exactly one system should be the *system of record* for each entity. In banking this is critical — if the CRM, the core banking system, and the screening platform each hold "customer" with no defined master, reconciliation breaks and regulators notice. [Lesson b2](#/lesson/b2) goes deep on this.` },
      { h: 'Separation of concerns, abstraction, encapsulation', md:
`**Separation of concerns**: different reasons-to-change live in different places (UI vs business rules vs persistence). **Abstraction**: depend on what something does, not how (an interface, an API contract, an event schema). **Encapsulation**: hide internals so they can change freely — applies to services exactly as to classes: a service that lets others read its tables has no encapsulation.

These aren't academic: every integration decision in [Level 2](#/courses?level=2) is an application of them at system scale.` }
    ],
    exercise: { task: `Service A reads Service B's database tables directly "because it was faster to build". List three concrete failure modes this creates.`,
      answer: `1) Schema coupling: B cannot change its tables without breaking A — B's team loses the freedom to refactor, and migrations become cross-team events. 2) Hidden contract: there is no versioned interface, so nothing signals compatibility; breakage is discovered in production. 3) Load and security bleed: A's queries add unpredictable load to B's database and bypass B's business rules and access controls (e.g., masking, audit logging). Remediation: expose an API or published events, or extract a shared read model owned by B.` },
    quiz: [], related: ['f6', 'd9'], refs: ['Structured Design (Yourdon & Constantine) — coupling/cohesion origins', 'Martin Fowler — bounded context, encapsulation writings']
  },
  {
    id: 'f6', title: 'Design Principles: SOLID, DRY, KISS, YAGNI — at Architecture Scale', level: 1, cat: 'foundations',
    difficulty: 'Beginner', duration: 35, prerequisites: ['f5'], glossCat: 'General architecture',
    objectives: ['Apply SOLID principles beyond classes, to services and systems', 'Know when DRY harms and when duplication is cheaper', 'Use KISS and YAGNI as trade-off tools, not slogans'],
    sections: [
      { h: 'SOLID at system scale', md:
`SOLID was written for classes, but each principle scales up:

- **S**ingle responsibility → a service should have one reason to change: one business capability, one owning team.
- **O**pen/closed → extend behaviour by adding consumers/plugins/events, not by modifying shared components everyone depends on.
- **L**iskov substitution → a new version of an API must honour the old contract (backward compatibility); consumers must not need to know which version they got.
- **I**nterface segregation → publish small, purpose-specific APIs and events rather than one giant "get everything" endpoint that couples all consumers to all fields.
- **D**ependency inversion → business capabilities should not depend on infrastructure details: the domain doesn't import the Kafka client; adapters do ([hexagonal architecture](#/pattern/hexagonal)).` },
      { h: 'DRY, and when duplication is right', md:
`**DRY** (don't repeat yourself) targets duplicated *knowledge* — the same business rule in two places will drift and disagree. But at architecture scale, forced deduplication creates coupling: a "shared customer library" used by ten services means ten services redeploy when it changes.

Rule of thumb: deduplicate **within** a boundary; tolerate duplication **across** boundaries when the alternative is coupling. Two services each having their own "Address" representation is usually healthier than a shared model both must agree on — that's the reasoning behind DDD's bounded contexts ([lesson d8](#/lesson/d8)).` },
      { h: 'KISS and YAGNI as economic statements', md:
`**KISS**: the simplest architecture that meets the drivers wins, because every element you add must be operated, secured, monitored, and understood at 3 a.m. **YAGNI**: don't build for imagined future requirements — you'll pay maintenance on speculation, and the future requirement will arrive shaped differently anyway.

The tension to manage: some decisions are genuinely hard to retrofit (multi-tenancy, audit trails, idempotency, data model). YAGNI applies to *features*; it does not excuse skipping *hard-to-reverse quality decisions*. An experienced architect distinguishes "we might need X feature" (defer it) from "we will never be able to add X later" (decide now). This judgement is exactly what [evolutionary architecture](#/lesson/f8) formalises.` }
    ],
    quiz: [], related: ['f5', 'd10'], refs: ['Robert C. Martin — SOLID principles', 'Martin Fowler — Yagni essay']
  },
  {
    id: 'f7', title: 'Technical Debt and the Architecture Runway', level: 1, cat: 'foundations',
    difficulty: 'Beginner', duration: 35, prerequisites: ['f1'], glossCat: 'Governance',
    objectives: ['Define technical debt without moralising', 'Classify debt as deliberate/inadvertent and prudent/reckless', 'Manage debt with a register and runway thinking'],
    sections: [
      { h: 'Debt is a financial metaphor — use it that way', md:
`Technical debt is the future cost created when we choose a faster-now option over a better-later option. Like financial debt it has **principal** (the rework needed) and **interest** (the ongoing drag: slower features, more incidents, harder onboarding). Debt is not automatically bad: shipping a hard-coded integration to hit a regulatory deadline can be a rational loan. Debt becomes toxic when it's invisible, unowned, and interest compounds silently.

Martin Fowler's quadrant classifies debt by intent: **deliberate–prudent** ("ship now, refactor next quarter — documented"), **deliberate–reckless** ("we don't have time for design"), **inadvertent–prudent** ("now we know how we should have done it"), **inadvertent–reckless** ("what's layering?").` },
      { h: 'Managing debt like an architect', md:
`1. **Make it visible**: a technical-debt register (there's a [template](#/template/tech-debt-register)) with item, interest being paid, remediation cost, and owner.
2. **Price it in business terms**: "this debt costs us ~2 days per release and caused 3 of the last 10 incidents" beats "the code is ugly".
3. **Budget repayment**: a fixed capacity share (commonly 10–20%) or debt paydown attached to feature work in the same area.
4. **Prevent silent accrual**: architecture reviews and ADRs make shortcuts explicit decisions with review dates, not accidents.

**Architecture runway** (from SAFe, but useful anywhere): the technical foundation that must exist *before* upcoming features can be built quickly — platform capabilities, integration infrastructure, data models. Runway is built deliberately, slightly ahead of need; too little and every feature is slow, too much and you've violated YAGNI at scale.` }
    ],
    quiz: [], related: ['f6', 'm4'], refs: ['Martin Fowler — Technical Debt Quadrant', 'SAFe — architectural runway (concept)']
  },
  {
    id: 'f8', title: 'Evolutionary Architecture and Fitness Functions', level: 1, cat: 'foundations',
    difficulty: 'Intermediate', duration: 35, prerequisites: ['f7'], glossCat: 'Governance',
    objectives: ['Explain why architectures must support guided change', 'Define architecture fitness functions with examples', 'Balance up-front decisions against deferred ones'],
    sections: [
      { h: 'Architecture as a changing thing', md:
`The classical image of architecture — decide everything up front, then build — fails because requirements, traffic, teams, and technology all change faster than systems are replaced. **Evolutionary architecture** treats changeability itself as a first-class quality: make the *hard-to-reverse* decisions carefully, keep everything else cheap to change, and verify continuously that the architecture still holds its intended properties.

The practical toolkit: incremental change (small, frequent, reversible steps), appropriate coupling (boundaries along business capabilities), and **fitness functions**.` },
      { h: 'Fitness functions', md:
`A fitness function is an automated (or regularly executed) check that measures whether the architecture retains a desired characteristic — unit tests for the architecture itself. Examples:

- **Dependency rules**: build fails if the domain layer imports an infrastructure package (ArchUnit does this for Java).
- **Performance**: nightly load test asserts p95 < 300 ms at 2,000 RPS; regression fails the pipeline.
- **Resilience**: chaos experiment verifies the payment flow survives loss of one availability zone.
- **Security**: dependency scan blocks known-critical CVEs; secrets scanner blocks committed credentials.
- **Operational**: alert if any service lacks a health endpoint or emits no traces.

Fitness functions convert architecture from documents into executable, continuously verified constraints — which is also how architects scale themselves beyond reviewing every PR.` }
    ],
    quiz: [], related: ['f7', 'm3'], refs: ['Building Evolutionary Architectures (Ford, Parsons, Kua)', 'ArchUnit documentation']
  },
  {
    id: 'f9', title: 'Reading and Speaking Architecture: Core Terminology', level: 1, cat: 'foundations',
    difficulty: 'Beginner', duration: 30, prerequisites: ['f1'], glossCat: 'General architecture',
    objectives: ['Use core architecture vocabulary correctly', 'Distinguish commonly confused term pairs', 'Know where to find precise definitions'],
    sections: [
      { h: 'Terms professionals get wrong', md:
`- **Availability vs reliability**: availability = fraction of time the system answers; reliability = probability it answers *correctly* over an interval. A system returning fast garbage is available but unreliable.
- **Latency vs throughput**: time per request vs requests per time. Optimising one often degrades the other (batching raises throughput and latency together).
- **Scalability vs performance**: performance = how fast now; scalability = what happens to performance as load grows. A fast system can be unscalable.
- **Resilience vs robustness**: robustness resists anticipated faults; resilience recovers from unanticipated ones.
- **Authentication vs authorisation**: who you are vs what you may do.
- **SLA vs SLO vs SLI**: the contract, the internal target, the measurement.
- **RTO vs RPO**: how long until service is restored vs how much data you may lose.` },
      { h: 'Building your working vocabulary', md:
`Architecture interviews test vocabulary implicitly: using "idempotent", "bounded context", or "backpressure" precisely signals experience; misusing them signals the opposite. The [glossary](#/glossary) in this app holds 300+ terms with simple and technical definitions, examples, and the common misunderstanding for each — and the [flashcards](#/flashcards) system schedules spaced review so they stick.

A tip for the workplace: when a term is ambiguous in your organisation (in banking, "customer", "client", "party" and "partner" may all differ), don't argue about the "right" meaning — **establish a project glossary** and move on. [Lesson b2](#/lesson/b2) shows why this matters for service boundaries.` }
    ],
    quiz: [], related: ['f4', 'b2'], refs: ['This app\'s glossary (300+ terms)', 'Google SRE Book — SLI/SLO/SLA definitions']
  },
  {
    id: 'f10', title: 'How Architects Work: Decisions, Documentation, Reviews', level: 1, cat: 'foundations',
    difficulty: 'Beginner', duration: 35, prerequisites: ['f3'], glossCat: 'Governance',
    objectives: ['Describe the architect\'s working loop', 'Explain what ADRs capture and why', 'Know what an architecture review checks'],
    sections: [
      { h: 'The working loop', md:
`Strip away the tooling and every architect runs the same loop: **understand the drivers** (goals, requirements, constraints — [lesson f3](#/lesson/f3)) → **explore options** (always more than one) → **analyse trade-offs** against the drivers → **decide and record** → **communicate** to each audience in its own language → **verify** the built system matches the decision (reviews, fitness functions) → **revisit** when context changes.

Notice what's *not* the loop: drawing diagrams all day, approving other people's PRs, or picking technologies by preference. Diagrams and documents are outputs of decisions, not substitutes for them.` },
      { h: 'Architecture Decision Records', md:
`An **ADR** is a short document capturing one significant decision: context, options considered, decision, and consequences (including the negative ones — an ADR with no downsides is marketing). ADRs live with the code or in a decision log, are immutable once accepted (superseded, not edited), and answer the question every future engineer asks: *"why on earth is it built this way?"*

Without ADRs, organisations relitigate old decisions endlessly, or worse, preserve them superstitiously after the constraints that justified them are gone. This app has a [23-step ADR wizard](#/adr) that teaches the full professional structure — options, trade-offs, rejected alternatives, review date, success criteria.` },
      { h: 'Architecture reviews', md:
`A review checks a design against drivers before (or after) it's built: are the NFRs measurable and met? Are failure modes handled? Is ownership clear? Are security, audit, cost, and operations addressed? Good reviews are collaborative and evidence-based, not gate-keeping theatre. You'll practise finding real flaws in the [Architecture Review Simulator](#/review-sim) — including learning *not* to raise non-issues, which burns credibility in real boards.` }
    ],
    quiz: [], related: ['a12', 'm3'], refs: ['Michael Nygard — "Documenting Architecture Decisions" (ADR origin)', 'AWS Well-Architected — review approach']
  },

  /* ================= LEVEL 2 — APPLIED SOLUTION ARCHITECTURE ================= */
  {
    id: 'a1', title: 'Requirement Discovery and Stakeholder Interviews', level: 2, cat: 'applied',
    difficulty: 'Intermediate', duration: 45, prerequisites: ['f3'], glossCat: 'General architecture',
    objectives: ['Run structured stakeholder interviews', 'Convert vague statements into verifiable requirements', 'Detect the requirements nobody states'],
    sections: [
      { h: 'Requirements are discovered, not collected', md:
`Stakeholders don't hand you requirements; they hand you opinions, solutions-in-disguise ("we need a Kafka topic for this"), and silence about the things they consider obvious. Discovery is active work:

- **Ask for outcomes, not features**: "what changes for the business when this works?" A stated feature ("dashboard") often hides the actual need ("detect missed screening events within an hour").
- **Chase the numbers**: every "fast", "many", "always" must become a figure. "How many per day? What's the worst day of the year? What happens if it's late?"
- **Ask what must never happen**: the negative space — duplicate payments, lost audit records, sanctioned customer onboarded — defines more architecture than the features do.
- **Interview the unglamorous stakeholders**: operations ("how do you restart it at 3 a.m.?"), compliance ("what evidence must exist?"), downstream consumers ("what breaks if our format changes?").` },
      { h: 'The questions architects always ask', md:
`A reusable interview skeleton (full version in the [toolkit](#/toolkit)):

1. What business outcome defines success? By when? Measured how?
2. Who uses it, how often, and what varies at peak (day, month-end, year-end)?
3. What data is created/read? Who owns it today? How sensitive is it?
4. What must be provable later (audit, dispute, regulator)?
5. What existing systems must this talk to? Who owns them? How stable are they?
6. What happens when this system is down for 5 minutes? An hour? A day?
7. What's fixed — budget, deadline, standards, vendors, residency?
8. What's the most similar thing the organisation has done, and what went wrong?

Question 6 is the cheapest way to derive availability and RTO/RPO honestly; question 8 surfaces organisational constraints no document mentions.` },
      { h: 'Business capabilities and processes', md:
`Two mapping tools structure discovery at solution scale. A **business capability map** lists what the business does (stable — "customer onboarding", "sanctions screening") independent of how or with what systems (volatile). Architecture aligned to capabilities survives reorganisations. **Business process analysis** traces one flow end-to-end across systems — every handoff is an integration and every wait is a queue in disguise. Together they expose the current-state landscape you'll formalise in [lesson a2](#/lesson/a2).` }
    ],
    exercise: { task: `A compliance officer says: "Screening must be instant." Write the three follow-up questions that turn this into a measurable requirement, and draft the requirement you expect to end up with.`,
      answer: `Questions: (1) Instant for whom — the onboarding advisor waiting on-screen, or the batch that rescreens the book overnight? (2) What is the business tolerance — may an account open provisionally pending screening, or is it blocking? (3) What volume — peak onboardings/hour and full-book rescreen size? Likely result: "Interactive screening requests return a decision or a pending-case reference within 5 seconds for p99 at 200 requests/hour; onboarding is blocked until a response or explicit manual override (four-eyes) occurs; full-book re-screening of 3M parties completes within 8 hours." Note the discovered requirement — the manual override with four-eyes — that "instant" completely hid.` },
    quiz: [], related: ['a2', 'f4'], refs: ['Karl Wiegers — Software Requirements', 'Business capability mapping (TOGAF concepts)']
  },
  {
    id: 'a2', title: 'Current State, Target State, and Gap Analysis', level: 2, cat: 'applied',
    difficulty: 'Intermediate', duration: 40, prerequisites: ['a1'], glossCat: 'Enterprise architecture',
    objectives: ['Document a current-state architecture honestly', 'Define target state at the right level of detail', 'Produce a gap analysis that drives a roadmap'],
    sections: [
      { h: 'Current state: archaeology, not idealism', md:
`Before proposing anything, document what exists: systems, owners, integrations (protocol, direction, frequency, data), data masters, known pain points, and run costs. Rules of honest current-state work:

- Draw what **is**, not what the 2019 diagram claims. Interview operators; inspect actual integration configs; look at the firewall rules if you must.
- Record the **undocumented workarounds** — the shared spreadsheet, the manual re-key, the cron job on someone's VM. They are requirements in disguise.
- Capture **why** the current state is the way it is. Systems that look absurd usually made sense under old constraints; knowing which constraints are gone tells you what can change.` },
      { h: 'Target state and the gap', md:
`The target state describes the destination at capability/container level — detailed enough to derive work, loose enough to survive learning. Pin down: system boundaries and owners, integration styles ([a6](#/lesson/a6)), data masters, and the NFR posture. Avoid over-specifying internals you'll learn more about during delivery.

**Gap analysis** is then a table: capability → current → target → gap → actions → dependencies → sequence. The sequencing question is the architectural one: which gaps block which? What must exist first (identity platform, event backbone, landing zone) — that's your [architecture runway](#/lesson/f7)? Which moves deliver value alone, and which only in combination?

Output: a phased roadmap where each phase leaves the estate in a *stable, operable, reversible* state. "Big bang in month 18" is not a roadmap; it's a bet.` }
    ],
    quiz: [], related: ['a1', 'a10'], refs: ['TOGAF ADM — baseline/target architecture concepts']
  },
  {
    id: 'a3', title: 'Architecture Options and Trade-off Analysis', level: 2, cat: 'applied',
    difficulty: 'Intermediate', duration: 45, prerequisites: ['a2'], glossCat: 'General architecture',
    objectives: ['Generate genuinely distinct options', 'Run a structured trade-off analysis', 'Present options without pre-cooking the answer'],
    sections: [
      { h: 'One option is no option', md:
`A recommendation without alternatives is an opinion. Professional options papers present **2–4 genuinely different options** — not one real option plus two strawmen. Include "do nothing / minimal change" when credible: it's the baseline every option must beat, and pricing it exposes the cost of the status quo.

Options should differ on a real axis: build vs buy, sync vs async, centralise vs federate, big-bang vs incremental. If your options only differ in vendor logo, you've decided the architecture already and are just procuring.` },
      { h: 'Structured trade-off analysis', md:
`For each option, score against the **evaluation criteria derived from your drivers** (never invent criteria after seeing the options — that's how you rationalise a favourite):

| Criterion | Opt A: Extend monolith | Opt B: New service | Opt C: Vendor |
|---|---|---|---|
| Time to first value | ✅ 6 wks | ⚠ 4 mo | ⚠ 3–6 mo (procurement) |
| Long-run maintainability | ❌ worsens hotspot | ✅ | ⚠ vendor roadmap |
| Ops complexity | ✅ none new | ❌ new deployable | ⚠ new vendor mgmt |
| Exit/reversibility | ✅ | ✅ | ❌ contract + data egress |

Then write the narrative: what each option **optimises for** and what it **sacrifices**. Numbers summarise; sentences persuade. Quantified weighting works too — the [build-vs-buy matrix](#/bvb) implements a 28-criteria version — but always sanity-check the arithmetic against judgement: a matrix that contradicts every experienced person's instinct usually has wrong weights, not wrong people.` },
      { h: 'Presenting honestly', md:
`State your recommendation and your confidence, show the losing options with the *real* reasons they lost, and name the conditions under which you'd change your mind ("if the vendor confirms on-prem deployment, Option C reopens"). Decision-makers trust architects who show their working and survive challenge; they distrust single-option papers. Record the outcome in an [ADR](#/adr) including rejected options — future teams will ask.` }
    ],
    quiz: [], related: ['a5', 'a12'], refs: ['SEI ATAM — architecture trade-off analysis method (concept)']
  },
  {
    id: 'a5', title: 'Sourcing Decisions: Build, Buy, Reuse, Extend, Integrate, Replace, Retire', level: 2, cat: 'applied',
    difficulty: 'Intermediate', duration: 50, prerequisites: ['a3'], glossCat: 'Governance',
    objectives: ['Enumerate the full sourcing option space beyond build-vs-buy', 'Price hidden costs: integration, exit, operations, licensing', 'Apply organisational constraints that matrices miss'],
    sections: [
      { h: 'The real option space', md:
`"Build vs buy" is a false binary. The real menu: **build** new; **buy** commercial (SaaS or on-prem); **adopt open source** (you still own operations and upgrades); **reuse** an internal service; **extend** an existing platform; **integrate** an external partner's capability; **re-engineer** what you have; **replace**; **retire** (the forgotten option — some capabilities should just stop); **do nothing** (the baseline).

Hybrids dominate in practice: buy a screening engine, build the orchestration and case-management integration around it; reuse the enterprise customer master, extend it with a new attribute set.` },
      { h: 'Hidden costs — where sourcing decisions actually fail', md:
`- **Integration**: the vendor demo never includes your identity platform, your data model, or your batch windows. Integration commonly costs 1–3× the licence.
- **Customisation debt**: every vendor-product customisation is code you own with an upgrade tax; heavily customised products become unupgradeable — the worst of build and buy combined.
- **Licensing dynamics**: per-seat becomes per-core becomes per-transaction at renewal; price the 5-year path and negotiate caps before you're locked in.
- **Exit cost**: how do you get your data out, at what fidelity, with how much notice? If you can't answer, the switching cost is infinite and your negotiating position at renewal is zero.
- **Open source ≠ free**: you pay in operations, security response, upgrade labour, and scarce skills. Compare a managed offering honestly.
- **Reuse ≠ free**: the internal service you reuse has a roadmap and a team with their own priorities; your requirements queue behind theirs. Get commitments, not vibes.
- **Operational ownership**: someone runs it at 3 a.m. Which team? Do they have capacity and skills? "The vendor runs it" still leaves incident coordination, data quality, and regulatory accountability with you.` },
      { h: 'Organisational constraints decide more than scores', md:
`Funding model (capex vs opex), procurement lead time (3–9 months in enterprises), vendor-risk policy, regulatory approval, data residency, and available skills routinely eliminate the "best" option. Score with the [weighted matrix](#/bvb) — 28 criteria including strategic alignment, lock-in, data portability, TCO — but treat hard constraints as filters *before* scoring, and present them explicitly. A decision that ignores procurement reality isn't a decision; it's a delay with extra steps.` }
    ],
    exercise: { task: `Your bank needs adverse-media screening. Option A: extend the incumbent sanctions-screening vendor's module. Option B: a specialist SaaS. Option C: build on an open-source search stack. Name the two hidden costs most likely to dominate each option.`,
      answer: `A: customisation debt on an ageing platform (upgrades become projects) and vendor leverage at renewal (they know you're deepening lock-in). B: data-egress/exit cost (case history and match decisions trapped in the SaaS; regulators require evidence retention) and integration cost to your case-management and audit stores — plus residency review if it's cloud-hosted abroad. C: operational ownership (you now run and tune a search/matching platform with scarce skills, and own false-positive rates with no vendor to blame) and compliance validation cost — model governance for matching logic falls entirely on you.` },
    quiz: [], related: ['a3', 'm1'], refs: ['Gartner TCO concepts (referenced, not reproduced)', 'Vendor evaluation template in this app']
  },
  {
    id: 'a6', title: 'Integration Styles: Sync, Async, Batch, Files, Events', level: 2, cat: 'integration',
    difficulty: 'Intermediate', duration: 45, prerequisites: ['f5'], glossCat: 'Integration',
    objectives: ['Choose between synchronous, asynchronous, batch and file integration', 'Understand coupling and failure implications of each style', 'Define integration ownership'],
    sections: [
      { h: 'The four styles and what they couple', md:
`| Style | Coupling | Latency | Failure behaviour | Typical use |
|---|---|---|---|---|
| **Synchronous request/response** | Temporal + contract | ms | Caller fails when callee fails | Queries, commands needing immediate answer |
| **Asynchronous messaging/events** | Contract only | ms–s | Buffer absorbs outages; eventual consistency | State propagation, workflows, decoupling |
| **Batch** | Schedule + format | hours | Rerun the batch; watch cut-offs | Reconciliation, reporting, bulk loads |
| **File transfer** | Format + naming + timing | hours | Partial-file and duplicate-file hazards | Legacy, cross-organisation, regulators |

Synchronous chains multiply unavailability (see the [chain calculator](#/calculators)) and propagate latency spikes; async decouples availability but buys you duplicate delivery, ordering questions, and eventual consistency — handled in [Level 3](#/lesson/d3). Batch never died: banking runs on end-of-day processing, and your design must respect batch windows and cut-off times ([lesson b9](#/lesson/b9)).` },
      { h: 'Choosing deliberately', md:
`Ask: (1) Does the caller need the answer *now* to proceed? If yes, sync. (2) Is this a fact that happened (event) or a request to act (command)? Events favour async publication. (3) What happens if the consumer is down for an hour — must the interaction survive? Async with durable transport. (4) Is volume periodic and huge? Batch may beat streaming on cost and simplicity. (5) Does a third party dictate files? You still wrap them: validate, checksum, dedupe, and reconcile.

**Integration ownership**: every integration needs one owner for the contract (schema, SLA, versioning policy) and a support path. Unowned integrations are where enterprises rot — nobody dares change either side. Maintain an interface catalogue ([template](#/template/interface-catalogue)).` },
      { h: 'API-first and event-driven as postures', md:
`**API-first**: design and publish the contract before implementation; consumers build against a stable, versioned interface, not your internals. **Event-driven design**: publish significant business facts as events so future consumers subscribe without asking the producer to change — this inverts the dependency direction and is the seed of an event backbone. The two combine naturally: APIs for queries and commands, events for propagation. What to avoid: point-to-point spaghetti where each new consumer means new custom work on the producer.` }
    ],
    quiz: [], related: ['a7', 'd13'], refs: ['Enterprise Integration Patterns (Hohpe & Woolf)', 'Martin Fowler — event-driven articles']
  },
  {
    id: 'a7', title: 'API Styles: REST, GraphQL, gRPC, Messaging, Streaming', level: 2, cat: 'integration',
    difficulty: 'Intermediate', duration: 45, prerequisites: ['a6'], glossCat: 'Integration',
    objectives: ['Compare REST, GraphQL, gRPC and messaging on real criteria', 'Design idiomatic, versionable REST APIs', 'Know when streaming beats request/response'],
    sections: [
      { h: 'Comparison that matters', md:
`| | REST | GraphQL | gRPC | Messaging/Streaming |
|---|---|---|---|---|
| Contract | OpenAPI | Schema (SDL) | Protobuf IDL | Event schema (Avro/JSON/Protobuf) |
| Strengths | Ubiquity, caching, simplicity | Client-shaped queries, one round trip | Performance, streaming, strict typing | Decoupling, fan-out, replay (Kafka) |
| Weaknesses | Over/under-fetching, N+1 round trips | Server complexity, cache/authz per field, runaway queries | Browser support, human debuggability | Eventual consistency, operational weight |
| Sweet spot | Public/partner APIs, CRUD-ish domains | BFFs and UI aggregation | Internal service-to-service, low latency | State propagation, integration backbone |

Default sanely: REST for external and most internal APIs; gRPC where latency/typing across polyglot internal services pays; GraphQL where one team owns a UI aggregating many sources ([BFF pattern](#/pattern/bff)); events for propagation. Mixing is normal — dogma is not an architecture.` },
      { h: 'REST design that survives production', md:
`- Resources and identifiers: **/customers/{id}/accounts**, nouns not verbs; stable IDs, never database keys with meaning.
- Idempotency: GET/PUT/DELETE are naturally idempotent; POST needs an **Idempotency-Key** header for anything money-related ([lesson b8](#/lesson/b8)).
- Errors: a consistent error model (machine-readable code, human message, correlationId); 4xx = caller's problem, 5xx = yours.
- Versioning: version the contract (URL /v1 or media type), add fields freely (consumers must tolerate unknown fields), never repurpose or remove without a deprecation cycle.
- Pagination, filtering, and rate limits from day one on collection endpoints — retrofitting them breaks clients.
- Document with OpenAPI; validate requests at the edge; contract-test consumers ([lesson j5](#/lesson/j5)).` },
      { h: 'When streaming wins', md:
`Request/response asks "what is the state now?"; streaming says "tell me every change". When multiple consumers need the same changes (search index, cache, analytics, compliance), publishing a stream once beats N polls: fresher data, lower producer load, and consumers you never planned for. The cost: an event backbone to run, schema governance, and consumers that must handle duplicates and gaps — the whole [Kafka track](#/track/kafka) exists for this trade.` }
    ],
    quiz: [], related: ['a6', 'k1', 'b8'], refs: ['REST — Fielding dissertation (concepts)', 'gRPC docs', 'GraphQL docs']
  },
  {
    id: 'a8', title: 'Technology Selection: Databases, Caches, Search, Workflow, Rules, IAM', level: 2, cat: 'applied',
    difficulty: 'Intermediate', duration: 45, prerequisites: ['a3'], glossCat: 'Data',
    objectives: ['Run a defensible technology selection', 'Know the major component categories and their selection criteria', 'Avoid résumé-driven and fashion-driven choices'],
    sections: [
      { h: 'A defensible selection process', md:
`1. Write the requirements **before** looking at products (data shape, volume, latency, consistency, security, ops constraints).
2. Longlist from what the organisation already runs (skills and ops maturity are worth 30% latency), plus credible alternatives.
3. Shortlist 2–3; score against your criteria; **prototype the riskiest assumption** — a two-day spike beats twenty pages of vendor PDF.
4. Record as an ADR with rejected options.

Anti-patterns: choosing tech before understanding the problem (the number-one [architect mistake](#/mistakes)); "we saw it at a conference"; ignoring the ops team's ability to run it; benchmarking the vendor's happy path instead of your workload.` },
      { h: 'Component categories in one tour', md:
`- **Databases**: relational for transactional systems of record and ad-hoc queries; document/key-value/wide-column when scale or shape demands ([data store selector](#/datastore) drills this).
- **Caches** (Redis, etc.): buy latency and offload reads; every cache adds an invalidation problem and a consistency caveat — cache-aside with TTLs is the sane default ([pattern](#/pattern/cache-aside)).
- **Search platforms** (Elasticsearch/OpenSearch): relevance-ranked text and aggregations; treat as a *derived index*, never the system of record; plan reindexing from day one.
- **Workflow engines** (Camunda, Temporal, step functions): long-running, stateful business processes with human steps, timers, retries. Use when the process is the product (onboarding, case management); avoid embedding business flow invisibly in queues and cron jobs.
- **Rules engines**: externalise volatile business rules (screening thresholds, routing) for business-editable change; beware turning them into an unversioned second codebase — govern rules like code.
- **IAM** (Keycloak, cloud IdPs): never build authentication; integrate OIDC/OAuth2 ([lesson d15](#/lesson/d15)); centralise identity, decentralise authorisation decisions where latency demands.` }
    ],
    quiz: [], related: ['dt1', 'd15'], refs: ['Designing Data-Intensive Applications (Kleppmann)', 'OWASP ASVS — IAM requirements']
  },
  {
    id: 'a9', title: 'Observability and Auditability by Design', level: 2, cat: 'applied',
    difficulty: 'Intermediate', duration: 40, prerequisites: ['f4'], glossCat: 'Reliability',
    objectives: ['Design the three observability signals with intent', 'Distinguish observability from auditability and design both', 'Define SLIs and SLOs that reflect user experience'],
    sections: [
      { h: 'Observability: designed, not sprinkled', md:
`Observability is the ability to ask new questions of a running system without shipping new code. Three signals, each with a design decision:

- **Metrics**: cheap, aggregated, alertable. Design the *user-facing* SLIs first: request rate, error rate, latency percentiles (p95/p99 — averages lie), saturation. Business metrics too: payments-posted/minute detects what CPU graphs can't.
- **Logs**: structured (JSON), levelled, with **correlation IDs** propagated across every hop — the ID is what turns 40 services' logs into one story. Never log secrets or personal data ([lesson b3](#/lesson/b3)).
- **Traces**: distributed tracing (OpenTelemetry) shows where the 800 ms went across services. Sample intelligently; keep error traces.

Define **SLOs** from user experience ("99.9% of payments confirm < 2 s") and alert on burn rate, not on every blip. An alert that isn't actionable trains people to ignore alerts.` },
      { h: 'Auditability is a different requirement', md:
`Observability serves engineers; **auditability** serves compliance, disputes, and regulators — and it changes the design, not just the logging config:

- Audit events are **business facts** ("payment X authorised by user Y under mandate Z at T"), immutable, retained for years (7+ in banking), and must survive system replacement.
- They need **integrity** (append-only stores, hashing/chaining where non-repudiation matters) and **completeness** (an audit trail with gaps is evidence against you).
- Reconstruction: can you show *why* the system decided what it decided — the rule version, the list version, the input data as-of that moment? That requirement drives event sourcing or versioned reference data in screening platforms ([lesson b5](#/lesson/b5)).

Retrofit cost is brutal: audit trails, like idempotency, are day-one decisions.` }
    ],
    quiz: [], related: ['b3', 'd4'], refs: ['Google SRE Book — SLOs, alerting', 'OpenTelemetry documentation']
  },
  {
    id: 'a10', title: 'Deployment Architecture, Environments, Migration and Rollback', level: 2, cat: 'applied',
    difficulty: 'Intermediate', duration: 45, prerequisites: ['a2'], glossCat: 'DevOps',
    objectives: ['Design an environment strategy that catches problems before production', 'Plan migrations with coexistence and cutover', 'Make rollback a designed capability, not a hope'],
    sections: [
      { h: 'Environments and paths to production', md:
`A typical enterprise path: dev → integration/test → UAT/staging → production, with staging as production-like as budget allows (same topology, scrubbed data, same configs by pattern). Principles: **build once, promote the same artifact** with per-environment config; automate provisioning (IaC) so environments can't drift; and treat test-data management as a first-class problem — in banking, production data in test environments is a compliance incident, so invest in synthetic and masked datasets.

Release techniques reduce blast radius: **blue-green** (two identical stacks, switch traffic), **canary** (small percentage first, watch SLIs, ramp), **feature flags** (decouple deploy from release; kill switches for risky features). Each is a [pattern with trade-offs](#/pattern/canary) — canary needs good SLIs to be meaningful; flags accumulate as debt if never removed.` },
      { h: 'Migration planning', md:
`Any serious change is a migration, and migrations fail on the parts that aren't the new system: data migration, coexistence, and cutover.

- **Coexistence**: old and new run together for a period — who masters which data during it? How do you keep them consistent (dual-write is dangerous; prefer one-way sync or CDC with reconciliation)?
- **Data migration**: profile source data quality early (it's always worse than believed); migrate in rehearsed, measured batches; define validation — record counts are not enough, reconcile balances/business totals.
- **Cutover**: a written runbook with go/no-go criteria, timings, owners, and communication. Rehearse it. Twice.
- The [strangler-fig pattern](#/pattern/strangler) turns big-bang migrations into incremental ones by routing traffic slice-by-slice — the default approach for legacy modernisation ([lesson m2](#/lesson/m2)).` },
      { h: 'Rollback is designed', md:
`Every change needs a written answer to "how do we undo this?" *before* it ships. Rollback is easy for stateless code, hard for data: schema changes must be **backward-compatible for one release** (expand → migrate → contract) so the previous version still runs; events already published can't be unpublished, so consumers must tolerate both versions ([schema evolution, k3](#/lesson/k3)). When true rollback is impossible (money moved), design **roll-forward**: compensating actions and reconciliation ([lesson d2](#/lesson/d2)). Define rollback *triggers* in advance — "error rate > 2% for 10 minutes" — because during an incident nobody wants to decide thresholds.` }
    ],
    quiz: [], related: ['m2', 'd2'], refs: ['Continuous Delivery (Humble & Farley)', 'Database Reliability Engineering — migration patterns']
  },
  {
    id: 'a11', title: 'Proofs of Concept and Technical Spikes', level: 2, cat: 'applied',
    difficulty: 'Intermediate', duration: 30, prerequisites: ['a3'], glossCat: 'Governance',
    objectives: ['Scope PoCs to answer specific questions', 'Distinguish spike, PoC, prototype, and pilot', 'Prevent PoCs from silently becoming production'],
    sections: [
      { h: 'Four tools, four purposes', md:
`- **Spike**: hours-to-days, answers one technical question ("can the vendor API return decisions in <500 ms at our volume?"). Output: an answer and throwaway code.
- **Proof of concept**: days-to-weeks, tests whether an approach works *for your critical requirements* — not whether the technology works in general (it does; the vendor demoed it).
- **Prototype**: explores UX/shape with stakeholders; optimised for feedback speed, not correctness.
- **Pilot**: real users, limited scope, production controls. A pilot is production with a small blast radius — it needs security, support, and audit like production.

The discipline: write the **questions and success criteria before starting**. "PoC Kafka" is not a plan; "verify we can process 5k events/s with p99 < 200 ms, survive broker loss without message loss, and replay 24 h in under 2 h" is. A PoC that cannot fail is marketing.` },
      { h: 'The PoC-to-production trap', md:
`The most expensive words in enterprise IT: *"the PoC already works — just ship it."* PoCs legitimately skip hardening: error handling, security, observability, data migration, NFR validation. Shipping one converts every shortcut into production debt at once.

Defences: label PoC repos and environments clearly; time-box and archive; write the [PoC report](#/template/poc-report) stating what was and wasn't validated; and estimate productionisation honestly in the options paper — "PoC proved feasibility; production build is 4 months" is a normal and healthy statement.` }
    ],
    quiz: [], related: ['a3', 'a12'], refs: ['Agile spike (XP origins)', 'This app\'s PoC report template']
  },
  {
    id: 'a12', title: 'Architecture Decision Records in Practice', level: 2, cat: 'applied',
    difficulty: 'Intermediate', duration: 35, prerequisites: ['f10'], glossCat: 'Governance',
    objectives: ['Write an ADR that survives scrutiny', 'Decide what deserves an ADR', 'Run a lightweight ADR process in a team'],
    sections: [
      { h: 'Anatomy of a strong ADR', md:
`Minimum viable ADR: **Title** (the decision, not the topic: "Use transactional outbox for screening events", not "Eventing"); **Status** (proposed/accepted/superseded); **Context** (the forces: drivers, constraints, and the problem — written so a newcomer in two years understands why this mattered); **Decision** (one clear statement, active voice); **Options considered** with honest pros/cons; **Consequences** — including the negative ones you're accepting ("consumers must handle duplicates") and any follow-up obligations; **Review date**.

The [ADR wizard](#/adr) in this app extends this to the full professional 23-section form used for major decisions — stakeholders, risks, migration, cost, success criteria. Use the long form for big decisions, the short form for everyday ones. The worst ADR length is zero.` },
      { h: 'What gets an ADR, and process', md:
`Write one when a decision is **hard to reverse, affects multiple teams, trades off qualities, or will be asked about later**: integration style, data ownership, technology selection, security model, consistency model. Skip trivia — an ADR for every library update destroys the signal.

Process that works: anyone drafts; review async or in a 30-minute session with the affected teams; accepted ADRs are immutable — new context means a new ADR that *supersedes* the old (keeping the historical chain). Store ADRs next to code or in one indexed repo. Number them. In interviews, walking through a real trade-off in ADR structure — context, options, decision, consequences — is one of the strongest signals you can send.` }
    ],
    quiz: [], related: ['f10', 'a3'], refs: ['Michael Nygard — ADR post', 'adr.github.io — formats and tooling']
  },
  {
    id: 'a4', title: 'Vendor Evaluation, TCO and Licensing', level: 2, cat: 'applied',
    difficulty: 'Intermediate', duration: 40, prerequisites: ['a5'], glossCat: 'Cost management',
    objectives: ['Run a structured vendor evaluation', 'Calculate total cost of ownership over 5 years', 'Spot licensing and lock-in traps before signing'],
    sections: [
      { h: 'Evaluating vendors like an engineer', md:
`RFP theatre selects for good bid writers. Add engineering evidence: a **scripted demo on your scenarios** (your data shapes, your volumes, your edge cases — not their happy path); a **time-boxed PoC** with success criteria ([a11](#/lesson/a11)); **reference calls** with customers your size in your industry, asking "what surprised you after signing?" and "how did the last major upgrade go?"; and an **operations review** — how do you monitor it, patch it, get support at 3 a.m., and what did their last security incident disclosure look like?

Score functional fit, but weight the boring criteria that dominate the lived experience: upgrade path, support quality, API completeness (can you automate everything the UI does?), data export fidelity, and roadmap credibility (roadmaps are promises; look at their delivery history).` },
      { h: 'TCO and licensing traps', md:
`Five-year TCO = licence/subscription + infrastructure + **integration build** + customisation + **internal run cost** (the FTEs who administer it) + training + upgrade projects + **exit cost**. The licence is often under a third of it.

Licensing traps to negotiate before signature: metrics that scale badly (per-core on hardware you'll grow, per-transaction in a growing business); audit clauses; renewal uplift caps (uncapped renewals + high switching cost = future you gets robbed); ownership of *your* data and derived data (match decisions, models); termination assistance obligations; and what happens to fees during a dispute. Involve procurement early, but own the technical consequences yourself — procurement optimises price, not architecture.` }
    ],
    quiz: [], related: ['a5', 'm1'], refs: ['This app\'s vendor evaluation template', 'FinOps Foundation — cost concepts']
  }
  ]);
})(window.SAA.data);
