/* curriculum3.js — Level 4 (Mastery) + specialist tracks: Java, Kafka, Banking, Modelling, Data, Cloud, Microservices */
(function (D) {
  'use strict';
  D.lessons = (D.lessons || []).concat([

  /* ================= LEVEL 4 — ARCHITECT MASTERY ================= */
  {
    id: 'm1', title: 'Architecture Strategy and Technology Roadmaps', level: 4, cat: 'mastery',
    difficulty: 'Expert', duration: 45, prerequisites: ['a2'], glossCat: 'Enterprise architecture',
    objectives: ['Connect architecture strategy to business strategy', 'Build capability and technology roadmaps', 'Sequence modernisation investments'],
    sections: [
      { h: 'Strategy is choosing what not to do', md:
`An architecture strategy answers: given the business's direction, what must our technology estate become, and in what order? It is built from **capability roadmaps** (which business capabilities need new/better technology, when — e.g. "instant payments capability by 2027 for scheme deadline") and **technology roadmaps** (lifecycle of platforms: invest / maintain / contain / retire). The "contain" and "retire" lanes matter most — strategy without explicit decommissioning is just accumulation.

Test each initiative against three questions: does it trace to a business goal? does it reduce a real constraint (cost, risk, speed)? and what breaks if we *don't* do it? Roadmaps are promises under uncertainty: version them, review quarterly, and mark confidence levels honestly. A roadmap where every item is "committed" three years out is fiction.` },
      { h: 'Sequencing: runway before features', md:
`Order investments so each phase de-risks the next: identity platform before open APIs; event backbone before event-driven modernisation; landing zone before cloud migration ([architecture runway](#/lesson/f7)). Fund **platform capabilities** through the value of the features they unblock — executives don't buy "Kafka"; they buy "screening decisions in seconds instead of overnight, and here's the dependency chain". Vendor replacement and data-centre exit programmes ([m2](#/lesson/m2)) get sequenced by contract dates and risk, not by engineering preference — an unglamorous truth of enterprise strategy.` }
    ],
    quiz: [], related: ['m2', 'm3'], refs: ['TOGAF — capability-based planning concepts', 'Wardley mapping (situational awareness)']
  },
  {
    id: 'm2', title: 'Legacy Modernisation: Strangler, Migration at Scale, Vendor Replacement', level: 4, cat: 'mastery',
    difficulty: 'Expert', duration: 50, prerequisites: ['a10', 'd9'], glossCat: 'Enterprise architecture',
    objectives: ['Plan strangler-based modernisation of a legacy core', 'Run large-scale migrations without big-bang risk', 'Manage vendor replacement and data-centre exit'],
    sections: [
      { h: 'Strangler fig as a programme, not a pattern', md:
`Modernising a legacy monolith (say, a 20-year-old banking core satellite) big-bang fails often enough to be malpractice. The [strangler approach](#/pattern/strangler): put a routing **facade** in front; carve off capabilities one at a time to new services; route traffic slice-by-slice; retire legacy code as slices complete. The pattern is easy; the programme is hard:

- **Data gravity**: each slice needs a data strategy — migrate ownership, or read legacy via an [anti-corruption layer](#/pattern/acl) until cutover. Dual-mastering data is where stranglers die; define one writer per entity per phase.
- **The last 20%**: the final slices are the weird ones (year-end jobs, regulatory reports, that one branch workflow). Budget as much for them as the first 80%.
- **Facade ownership**: the router becomes critical infrastructure; give it an owner, tests, and an exit date — a permanent facade is a new legacy layer.
- **Prove reversibility**: every slice has a rollback route until its parallel-run reconciliation ([b7](#/lesson/b7)) is clean for an agreed period.` },
      { h: 'Cloud migration and vendor replacement', md:
`**Cloud migration** paths per workload — rehost (lift-and-shift: fast, little benefit), replatform (managed DB/containers: the pragmatic middle), refactor (cloud-native: expensive, biggest payoff), replace (SaaS), retire, retain. Portfolio-triage all workloads first; migrate a low-risk wave to prove the landing zone, pipelines, and ops model before touching crown jewels. **Data-centre exit** adds a hard deadline — the classic trap is spending the whole runway refactoring the first system perfectly, then lift-and-shifting the remaining 200 in a panic.

**Vendor replacement** is a migration where the source fights back: data export at full fidelity (including history and audit evidence — regulators don't accept "the old vendor kept it"), contract-driven timelines, dual-run costs (paying both vendors during parallel run), and organisational retraining. Start the exit-data conversation while you still have renewal leverage, i.e. now.` }
    ],
    quiz: [], related: ['m1', 'a10'], refs: ['Fowler — StranglerFigApplication', 'AWS/Azure migration frameworks (concepts)']
  },
  {
    id: 'm3', title: 'Architecture Governance: Boards, Principles, Guardrails, Exceptions', level: 4, cat: 'mastery',
    difficulty: 'Expert', duration: 45, prerequisites: ['f10'], glossCat: 'Governance',
    objectives: ['Design governance that enables rather than blocks', 'Write useful architecture principles and guardrails', 'Run exception management that keeps the estate honest'],
    sections: [
      { h: 'Governance that teams don\'t route around', md:
`Governance exists to keep many teams' local decisions globally coherent: **design authorities / architecture review boards** review significant designs; **standards** define required choices; **reference architectures** show sanctioned shapes. It fails in two directions: too weak (estate fragments, every team a snowflake, security drift) or too strong (the board becomes a bottleneck, teams route around it, architecture loses touch — the [ivory tower mistake](#/mistakes)).

The modern posture: **guardrails over gates**. Encode as much as possible into platforms and pipelines (golden paths, policy-as-code, [fitness functions](#/lesson/f8)) so the compliant way is the easy way; reserve human review for genuinely novel decisions. Boards should be advisory-first, decision-scoped ("we review X, Y, Z; everything else is yours"), fast (days, not months), and staffed by people still close to delivery.` },
      { h: 'Principles and exceptions', md:
`**Architecture principles** are few (7–12), decision-guiding, and have teeth only if they state the trade-off accepted: "Buy before build *for non-differentiating capabilities*, accepting configuration constraints over customisation freedom." A principle nobody could disagree with ("be secure") is decoration. Each needs: statement, rationale, implications.

**Exception management** keeps governance honest: teams *will* need to deviate. A good exception process is fast, records the deviation with owner + expiry + remediation path, and feeds review — many exceptions against one standard means the standard is wrong, which is governance telemetry, not noise. Track exceptions like [technical debt](#/lesson/f7); expired unremediated exceptions escalate. This — not policing — is how the estate stays honest. **Technical-risk management** rounds it out: a risk register with owners, review cadence, and explicit risk acceptance by someone empowered to accept it (an unowned "accepted" risk is just an ignored one).` }
    ],
    quiz: [], related: ['m4', 'f8'], refs: ['TOGAF — governance concepts', 'Thoughtworks Tech Radar (format inspiration for lifecycle lanes)']
  },
  {
    id: 'm4', title: 'Cost Optimisation and FinOps for Architects', level: 4, cat: 'mastery',
    difficulty: 'Expert', duration: 40, prerequisites: ['a4'], glossCat: 'Cost management',
    objectives: ['Treat cost as a first-class quality attribute', 'Apply FinOps practices to architecture decisions', 'Find the classic cost anti-patterns'],
    sections: [
      { h: 'Cost is an NFR', md:
`Every architecture decision is a spend decision: multi-region doubles infrastructure; event retention is a storage bill; per-invocation serverless flips from cheap to expensive with sustained load; chatty microservices pay cross-AZ traffic tax. Treat cost like latency — with targets ("unit cost per payment ≤ €0.002"), measurement, and review. **Unit economics** beat absolute numbers: total spend growing while cost-per-transaction falls is success; the reverse is a smell even if totals look flat.

Classic anti-patterns to hunt in reviews: oversized "just in case" instances (measure, rightsize); dev/test environments running nights and weekends; unattached storage and forgotten snapshots; egress-heavy designs (moving data out of cloud repeatedly); premium DR tiers protecting systems whose real RTO tolerance is a day ([d5](#/lesson/d5)); and duplicate capability — three teams, three notification services.` },
      { h: 'FinOps: making cost visible and owned', md:
`FinOps is the operating model: **inform** (allocate every euro to a team/service via tagging discipline — untagged spend is unowned spend), **optimise** (rightsizing, commitment discounts for stable load, spot/preemptible for interruptible work, storage tiering), **operate** (budgets with alerts, cost review in the same meeting as reliability review, cost regression checks in pipelines). The architect's role: make cost consequences visible **at design time** — a one-page cost model per option in every [options paper](#/lesson/a3) — and design for cost observability (per-tenant, per-feature attribution) so optimisation is possible later. The [cloud-cost calculator](#/calculators) covers the arithmetic; the discipline is cultural.` }
    ],
    quiz: [], related: ['m1', 'c2'], refs: ['FinOps Foundation framework', 'AWS Well-Architected — cost optimisation pillar']
  },
  {
    id: 'm5', title: 'Conway\'s Law, Team Topologies and Socio-Technical Architecture', level: 4, cat: 'mastery',
    difficulty: 'Expert', duration: 45, prerequisites: ['d9'], glossCat: 'Leadership',
    objectives: ['Use Conway\'s Law as a design tool, not trivia', 'Apply Team Topologies team types and interaction modes', 'Manage cognitive load as an architectural constraint'],
    sections: [
      { h: 'Conway\'s Law is load-bearing', md:
`Systems mirror the communication structures of the organisations that build them — not as a curiosity but as a constraint you either use or fight. Three teams building a "single" platform will produce three subsystems with seams at the org chart. The **reverse Conway manoeuvre**: shape teams to match the architecture you want; if you need a clean payments/screening boundary, put them in different teams with a contract between them, and the boundary will hold. If one team owns both, the boundary will erode no matter what the diagram says.

Practical consequence for microservices: service boundaries that cross team boundaries generate coordination cost forever; boundaries aligned to teams make [independent deployability](#/lesson/d9) real. Architecture reviews should ask "who owns this?" as often as "how does this scale?"` },
      { h: 'Team Topologies vocabulary', md:
`Four team types: **stream-aligned** (own a product/flow end-to-end — the default; everything else exists to serve them), **platform** (make the underlying platform consumable as a product — golden paths, self-service; measured by adoption, not mandate), **enabling** (temporarily coach teams through new capability — DDD, observability), **complicated-subsystem** (own genuinely specialist components — matching engines, risk models). Three interaction modes: collaboration (temporary, expensive, for discovery), **X-as-a-service** (the scalable steady state), facilitating.

**Cognitive load** is the budget: a team can own only so much domain + technology + operations before quality collapses. Architectures that ignore this — one team owning 14 microservices, or a "platform" that's just tickets to a bottleneck team — fail socially before technically. Sizing service ownership to team cognitive capacity *is* architecture ([d9](#/lesson/d9)'s extraction triggers are often team triggers).` }
    ],
    quiz: [], related: ['d9', 'm7'], refs: ['Skelton & Pais — Team Topologies', 'Conway — How Do Committees Invent? (1968)']
  },
  {
    id: 'm6', title: 'Architecture Leadership: Influence Without Authority', level: 4, cat: 'mastery',
    difficulty: 'Expert', duration: 45, prerequisites: ['f10'], glossCat: 'Leadership',
    objectives: ['Influence decisions without line authority', 'Handle disagreement between senior engineers productively', 'Mentor teams while staying out of the bottleneck role'],
    sections: [
      { h: 'The architect\'s actual power', md:
`Architects rarely have line authority over the people who must implement their decisions — influence is the whole job. Its raw materials: **credibility** (technical judgement demonstrated over time; being visibly wrong gracefully — "I was wrong about X, here's what changed my mind" — builds more than being right loudly), **shared context** (people follow reasoning they were part of; decisions announced from above get complied with, decisions co-created get championed), and **framing** (translate positions into each stakeholder's currency: risk for compliance, velocity for delivery, cost for finance — see [communication skills](#/communication)).

Practical moves: socialise big decisions 1:1 before any meeting (nobody likes surprises with an audience); write options papers that steelman the alternatives; give away credit for shared decisions; and reserve "I strongly object" capital for the few decisions that genuinely warrant it — spent weekly, it's worthless.` },
      { h: 'Disagreement, mentoring, and the bottleneck trap', md:
`**Senior-engineer disagreement**: force the debate onto explicit criteria ("what would have to be true for A to beat B?"), time-box it, run a spike if evidence can settle it ([a11](#/lesson/a11)), and if genuinely balanced — decide, record the losing case in the [ADR](#/adr), set a review date, and commit. Endless consensus-seeking is a decision too, usually the worst one. Disagree-and-commit only works if the decision is honestly revisitable.

**Mentoring without bottlenecking**: an architect who approves everything becomes the constraint on every team's throughput ([mistake list](#/mistakes)). Scale judgement instead: decision frameworks and ADR templates teams use without you, guardrails in pipelines ([m3](#/lesson/m3)), pairing on the *first* instance of a new decision type and delegating the rest, and review-by-exception. Success metric: decisions get made well *in your absence*. Handling ambiguity — deciding with 60% of the data, labelling assumptions, building in reversibility — is the skill mentees most need modelled.` }
    ],
    quiz: [], related: ['m7', 'm5'], refs: ['Influence literature (Cialdini concepts)', 'Staff-plus engineering writing (Larson — concepts)']
  },
  {
    id: 'm7', title: 'Presenting to Executives and Defending Decisions', level: 4, cat: 'mastery',
    difficulty: 'Expert', duration: 40, prerequisites: ['m6'], glossCat: 'Leadership',
    objectives: ['Structure executive communication top-down', 'Defend decisions under hostile questioning', 'Challenge requirements without burning relationships'],
    sections: [
      { h: 'The executive format', md:
`Executives decide between options under time pressure; they don't review designs. Structure everything top-down (the "BLUF" / pyramid principle): **the ask first** ("I need a decision between A and B by Friday; I recommend A"), then the three reasons, then supporting detail only if pulled. One slide that works: decision needed | options with cost/risk/time | recommendation | what happens if we wait. Translate ruthlessly: not "we lack idempotency in the payment flow" but "a network blip can currently double-charge customers; fixing it costs 6 weeks; not fixing it costs us the first newspaper headline." Rehearse the 30-second version; you'll often get 30 seconds.

Anticipate the questions executives actually ask: what does it cost, what's the risk of doing nothing, why not the cheaper option, who else has done this, and when will we know it's working ([success criteria](#/adr)).` },
      { h: 'Defending and challenging', md:
`**Under challenge**, defend the *reasoning*, not your ego: restate the driver ("given the residency constraint…"), acknowledge the valid part of the objection, show it was weighed (this is why ADRs record rejected options), and name what would change your mind. If the challenge brings new information — change your position visibly; that's credibility, not defeat. Never bluff a number; "I'll confirm by tomorrow" beats a guess that unravels.

**Challenging requirements constructively**: attack the cost, not the person — "RTO of zero is achievable; it costs €4M/year and 9 months. RTO of 15 minutes costs €400K. What does the business case support?" Numbers turn confrontation into a shared optimisation problem. The same technique tames scope: make every "must have" carry its price tag, and watch the musts sort themselves.` }
    ],
    quiz: [], related: ['m6', 'f4'], refs: ['Minto — Pyramid Principle (concept)', 'This app\'s communication module']
  },
  {
    id: 'm8', title: 'Measuring Architecture Success and Maturity', level: 4, cat: 'mastery',
    difficulty: 'Expert', duration: 35, prerequisites: ['m3'], glossCat: 'Governance',
    objectives: ['Define measurable indicators of architectural health', 'Avoid vanity metrics', 'Assess and evolve architecture-practice maturity'],
    sections: [
      { h: 'What to measure', md:
`Architecture succeeds when the organisation can change software safely, quickly, and affordably — so measure that: **flow** (lead time for change, deployment frequency — the DORA set), **stability** (change-failure rate, MTTR), **quality-attribute compliance** (SLO attainment, [fitness-function](#/lesson/f8) pass rates), **economics** (unit cost per transaction trend, [m4](#/lesson/m4)), **coupling symptoms** (how many teams must coordinate for a typical change; cross-team lockstep deployments), and **decision health** (ADR coverage of significant decisions; age of unreviewed decisions; exception count per standard — [m3](#/lesson/m3)).

Vanity metrics to refuse: number of diagrams produced, review-board throughput, "% cloud", pattern adoption counts. Any metric detached from flow, stability, or cost measures the architecture *function*'s activity, not the architecture's value — and activity metrics get gamed.` },
      { h: 'Maturity honestly', md:
`A usable maturity ladder: (1) **ad hoc** — architecture happens implicitly, discovered in incidents; (2) **documented** — decisions recorded, reviews exist; (3) **governed** — principles, guardrails, exceptions managed; (4) **measured** — the metrics above drive investment; (5) **adaptive** — fitness functions and feedback loops evolve the estate continuously. Most enterprises sit at 2–3 while claiming 4. The honest assessment question per level: "show me the last three times this mechanism changed an outcome." Maturity models are compasses, not scorecards — the goal is the next bottleneck, not the badge.` }
    ],
    quiz: [], related: ['m3', 'f8'], refs: ['DORA — Accelerate metrics', 'Google SRE — SLO practice']
  },
  {
    id: 'm9', title: 'Ethical and Sustainable Architecture', level: 4, cat: 'mastery',
    difficulty: 'Expert', duration: 35, prerequisites: ['d16'], glossCat: 'Governance',
    objectives: ['Identify ethical dimensions in architecture decisions', 'Design for sustainability with measurable levers', 'Handle pressure to approve harmful shortcuts'],
    sections: [
      { h: 'Ethics is in the architecture', md:
`Ethical questions hide in technical decisions: data you collect "because we might need it" (minimisation — [d16](#/lesson/d16)); retention that outlives purpose; models and matching rules with disparate error rates across groups (screening false positives concentrating on certain name origins is an ethical *and* regulatory problem — [b5](#/lesson/b5)); dark-pattern flows an API makes easy; and audit trails that protect the institution but not the customer. The architect often sees these first, because they live in the data model and event flows.

Handling pressure to approve a risky/harmful shortcut: make the risk explicit in writing (a risk register entry with an owner is remarkably clarifying), propose the smallest safe alternative, escalate through the governance path you helped build ([m3](#/lesson/m3)) — and know your own red lines before you need them. "I can't approve this, and here is exactly why, and here is what I can approve" is a professional act, not a career-limiting one in any organisation worth staying at.` },
      { h: 'Sustainable software design', md:
`Software has a carbon and resource footprint with real levers: **efficiency** (rightsizing, autoscaling to zero for idle dev/test, efficient serialisation and query patterns — the [cost work in m4](#/lesson/m4) is 80% the same work), **placement** (regions/schedules with cleaner energy where latency allows; batch workloads are movable), **retention discipline** (data stored forever is energy spent forever — retention schedules are green *and* compliant), and **demand shaping** (do you need real-time for a report read weekly?). Measure via cloud carbon tooling and treat as an NFR with a target. Sustainability aligns unusually well with cost — it's the rare quality attribute that pays for itself.` }
    ],
    quiz: [], related: ['m4', 'm10'], refs: ['Green Software Foundation — patterns', 'GDPR — minimisation & retention principles']
  },
  {
    id: 'm10', title: 'AI and Architecture: Assisted Design, AI Systems, Responsible Use', level: 4, cat: 'mastery',
    difficulty: 'Expert', duration: 45, prerequisites: ['m9'], glossCat: 'Governance',
    objectives: ['Use AI assistance in architecture work without outsourcing judgement', 'Design architectures for AI/ML systems', 'Govern generative AI use responsibly'],
    sections: [
      { h: 'AI-assisted architecture', md:
`Generative AI is genuinely useful for architecture work: drafting options and ADR skeletons, generating the failure scenarios you didn't think of, reviewing designs against checklists, summarising vendor documentation, and producing diagram code. It is unreliable at the parts that are the actual job: your organisation's constraints, political context, data realities, and the accountability for consequences. Use it as a well-read but context-free colleague: everything it produces is a draft to be verified, and citations/claims get checked against primary sources. The failure mode is subtle — AI output is *fluent*, and fluent wrongness passes review more easily than clumsy wrongness. Keep the reasoning yours; record decisions in [ADRs](#/adr) with your name on them.` },
      { h: 'Architecture for AI systems', md:
`AI-bearing systems add components with unusual properties: **non-determinism** (same input, varying output — test with distributions and evals, not assertions), **model lifecycle** (training data → model versions → deployment → drift monitoring → retraining; treat models as versioned, auditable artefacts with lineage — banking model governance already requires this), **new failure modes** (hallucination, prompt injection, data leakage through prompts/embeddings — extend [threat modelling](#/lesson/d16)), and **cost/latency profiles** (inference is a metered dependency; cache, batch, and fall back). Standard architecture applies with new emphases: put a deterministic contract around every model call (validation, guardrails, timeouts, fallback to rules or humans), log inputs/outputs for audit *with* privacy controls, and keep a human decision in the loop where errors are irreversible — screening-case decisions, credit denial, anything a regulator will ask about ([b5](#/lesson/b5)).` },
      { h: 'Responsible generative-AI governance', md:
`Minimum governance for enterprise genAI use: an approved-tools list with data-handling classifications (what may never enter a prompt: customer data, secrets, unpublished financials); provenance expectations (AI-assisted code and documents reviewed like human-written, and material AI assistance disclosed where it matters); evaluation before automation (measure quality on your cases before wiring a model into a workflow); and incident paths for model-caused harm. The [AI customer-support case study](#/case-study/cs22) works through a full example, including the trade-off between capability and auditability.` }
    ],
    quiz: [], related: ['m9', 'd16'], refs: ['NIST AI Risk Management Framework', 'OWASP Top 10 for LLM Applications']
  },

  /* ================= JAVA & SPRING TRACK ================= */
  {
    id: 'j1', title: 'Java Application Architecture: Layers, Hexagonal, Modular Monoliths', level: 3, cat: 'java',
    difficulty: 'Advanced', duration: 50, prerequisites: ['d10'], glossCat: 'Java',
    objectives: ['Structure a Spring Boot service with clean dependencies', 'Contrast poor and improved Java service designs', 'Enforce module boundaries in a Java monolith'],
    sections: [
      { h: 'The poor design you have seen', md:
`The typical degraded Spring service: controllers calling repositories directly with business logic in between; JPA entities used as API DTOs (schema changes leak straight into the contract; lazy-loading exceptions in serialisers); one giant \`service\` package where everything calls everything; static utility classes holding domain rules; and \`@Transactional\` sprinkled until the errors stop. Symptoms: can't test business logic without the database, can't change the schema without breaking clients, and nobody can say what the service *does* without reading all of it.` },
      { h: 'The improved shape (hexagonal, pragmatically)', md:
`Package by **feature/domain**, not by layer: \`payment/\`, \`screening/\` — each with its \`domain\` (entities, domain services — no Spring, no JPA imports), \`application\` (use-case services, transaction boundaries), and \`adapter\` packages (\`web\`, \`persistence\`, \`kafka\`). Dependencies point inward: adapters implement **ports** (interfaces) the domain defines.

\`\`\`text
payment/
  domain/        Payment, PaymentPolicy, PaymentRepository (port)
  application/   InitiatePaymentService  (@Transactional here)
  adapter/
    web/         PaymentController + request/response DTOs
    persistence/ JpaPaymentRepository (implements port), JPA entities
    kafka/       PaymentEventPublisher (implements port)
\`\`\`

Payoffs: domain unit-testable in milliseconds; Kafka/JPA swappable at the edges; the package structure *is* the architecture diagram. Enforce it with ArchUnit or Spring Modulith so it survives contact with deadlines ([fitness functions](#/lesson/f8)). This structure is also exactly what makes later [service extraction](#/lesson/d9) a refactoring instead of a rewrite. Don't cargo-cult it onto a 5-endpoint CRUD admin tool — layering is fine there; the investment pays where domain logic is rich.` }
    ],
    quiz: [], related: ['j2', 'd10', 'd9'], refs: ['Spring Modulith documentation', 'ArchUnit user guide', 'Cockburn — Hexagonal Architecture']
  },
  {
    id: 'j2', title: 'Transactions, Locking, Isolation and Connection Pools in Spring', level: 3, cat: 'java',
    difficulty: 'Advanced', duration: 55, prerequisites: ['j1'], glossCat: 'Spring',
    objectives: ['Place transaction boundaries deliberately', 'Choose optimistic vs pessimistic locking', 'Configure pools and isolation for real workloads'],
    sections: [
      { h: 'Transaction boundaries are architecture', md:
`\`@Transactional\` belongs on **application-service methods** — one use case, one transaction — not on controllers (transactions spanning serialisation) or repositories (fragmented atomicity). The rules that bite in production: self-invocation bypasses the proxy (a \`@Transactional\` method called from the same class runs without a transaction — a classic silent bug); default rollback is unchecked-exceptions-only (checked exceptions commit! — configure \`rollbackFor\` or use unchecked); \`REQUIRES_NEW\` suspends the outer transaction and takes a **second connection** (pool-deadlock risk under load); and **never do remote calls inside a transaction** — a slow HTTP or Kafka call holds a DB connection and row locks hostage. Pattern: transaction commits state + [outbox row](#/pattern/outbox); publishing happens after/outside.` },
      { h: 'Locking and isolation', md:
`**Optimistic locking** (\`@Version\`): no locks held; concurrent modification throws \`OptimisticLockingFailureException\` — catch and retry the *whole use case* (or surface a conflict). Right default for low-contention business entities and required equipment for [idempotent, concurrent consumers](#/lesson/d3). **Pessimistic** (\`SELECT … FOR UPDATE\`): serialises access up front; use for genuinely hot rows where retry storms would be worse (account balance under concurrent posting) — with a lock timeout, and consistent lock ordering to avoid deadlocks.

**Isolation**: READ_COMMITTED (default in Oracle/Postgres) is right for most OLTP; know what it permits — non-repeatable reads mean two reads in one transaction can differ. Where an invariant spans a read-then-write ("read balance, then debit"), isolation alone won't save you: use optimistic version checks, database constraints, or \`FOR UPDATE\`. SERIALIZABLE fixes anomalies at the price of retries/throughput; use per-use-case, not globally.` },
      { h: 'Pools, threads, and async', md:
`**Connection pool** sizing (HikariCP): pool ≈ cores × small factor, *not* hundreds — more connections than the DB can service just queues inside the DB with locks held. Every pool needs: max size, connection timeout, leak detection. Match pool maths across layers: 200 Tomcat threads × 1 connection each vs a 20-connection pool = 180 threads queueing; size or decouple deliberately. **Async in Spring**: \`@Async\` and executors need explicit thread-pool configuration (defaults are unbounded queues = memory leaks under pressure — [bulkheads](#/lesson/d4) apply in-process too); propagate MDC/trace context to async threads or lose observability. \`@Scheduled\` jobs on multiple instances run **multiple times** — cluster-aware locking (ShedLock) or leader election required. **Spring Batch** for restartable, chunked, high-volume processing (file loads, [re-screening runs](#/lesson/b5)): chunk-oriented steps give checkpointed restart — exactly what "the list update failed midway" needs.` }
    ],
    quiz: [], related: ['j1', 'd3', 'b7'], refs: ['Spring Framework — transaction management docs', 'HikariCP — pool sizing wiki', 'Spring Batch documentation']
  },
  {
    id: 'j3', title: 'Spring REST APIs: Design, Validation, Errors, Versioning, Security', level: 3, cat: 'java',
    difficulty: 'Advanced', duration: 50, prerequisites: ['j1', 'a7'], glossCat: 'Spring',
    objectives: ['Build production-grade REST APIs in Spring Boot', 'Design consistent validation and error handling', 'Secure APIs with OAuth2/OIDC and mTLS'],
    sections: [
      { h: 'Contract-quality APIs', md:
`Dedicated request/response **DTOs** (never entities); **Bean Validation** on DTOs (\`@NotNull\`, \`@Size\`, custom validators for business formats like IBAN) validated at the edge; one **\`@RestControllerAdvice\`** translating exceptions into a consistent error model — RFC 7807 problem+json style: \`type\`, \`title\`, \`status\`, machine-readable \`code\`, \`correlationId\`, field errors. Never leak stack traces or SQL (information disclosure). **Versioning**: additive changes within v1 (consumers must ignore unknown fields — enforce with contract tests); breaking changes get /v2 with a deprecation period and telemetry on who still calls v1 ([b8](#/lesson/b8) adds banking deprecation discipline). Idempotency-Key support on POSTs that create money-relevant resources: key stored with result in the same transaction, replay returns the stored result ([d3](#/lesson/d3)).` },
      { h: 'Security in the Spring stack', md:
`Spring Security as **resource server**: validate JWTs (issuer, signature, expiry, **audience**), map scopes/claims to authorities, method-level checks (\`@PreAuthorize\`) for fine-grained rules close to the code. Humans arrive via **OIDC** at the edge; services call each other with **client-credentials** tokens and/or **mTLS** ([mesh-issued](#/lesson/d12) where available). **Secrets**: from a vault/platform (Kubernetes secrets + external secret stores), never in \`application.yml\` in git; rotate without redeploys where possible. **Config management**: environment-specific values externalised (Spring profiles + config trees); the same artifact promoted through environments ([a10](#/lesson/a10)). Add the boring controls that audits check: security headers, TLS-only, dependency scanning in CI ([d16](#/lesson/d16) supply chain), and logs that never contain tokens or PII ([b3](#/lesson/b3)).` }
    ],
    quiz: [], related: ['j4', 'd15', 'b8'], refs: ['Spring Security documentation', 'RFC 7807 — Problem Details', 'OWASP API Security Top 10']
  },
  {
    id: 'j4', title: 'Resilience4j, Observability and Production Readiness in Spring', level: 3, cat: 'java',
    difficulty: 'Advanced', duration: 45, prerequisites: ['j3', 'd4'], glossCat: 'Spring',
    objectives: ['Implement resilience patterns with Resilience4j correctly', 'Wire metrics, logs, traces and health checks', 'Define production readiness for a Java service'],
    sections: [
      { h: 'Resilience4j: the patterns made concrete', md:
`Resilience4j decorates calls with the [d4 patterns](#/lesson/d4): \`TimeLimiter\` (every remote call — also set client timeouts: connect + read on RestClient/WebClient, or the timeout guards a connection you never bounded), \`Retry\` (idempotent operations only; exponential backoff + jitter; retry on \`IOException\`/5xx, **never** on 4xx business errors), \`CircuitBreaker\` (failure-rate + slow-call-rate thresholds; a fallback per operation — cached value, default, queue, or clean error), \`Bulkhead\` (semaphore or thread-pool isolation per dependency), \`RateLimiter\` (protect yourself and honour downstream quotas). Order matters — Bulkhead(RateLimiter(CircuitBreaker(Retry(TimeLimiter(call))))) — and every decorator emits metrics: **alert on open circuit breakers**; they are your earliest outage signal.` },
      { h: 'Observability and readiness', md:
`Spring Boot Actuator + Micrometer: RED metrics per endpoint (rate, errors, duration percentiles) plus business metrics (\`payments.posted\`); **structured JSON logs** with correlation ID in MDC (propagated across async and Kafka boundaries); **OpenTelemetry tracing** with sensible sampling. Health: **liveness** = process alive (restart me); **readiness** = dependencies OK (route traffic away) — getting them backwards causes restart storms during a DB blip ([d11](#/lesson/d11)).

**JVM production readiness**: containers need JVM-aware memory settings (\`MaxRAMPercentage\`, headroom for metaspace/threads/direct buffers — an OOMKilled pod is usually a sizing error, not a leak); G1/ZGC defaults are fine until *measured* otherwise; know how to capture and read **heap dumps** (OOM analysis) and **thread dumps** (three dumps 10 s apart show what's stuck — pool exhaustion diagnosis in [j2](#/lesson/j2)). A readiness checklist per service: timeouts on every remote call, health probes correct, dashboards + alerts, runbook, resource limits from load-test evidence, graceful shutdown verified.` }
    ],
    quiz: [], related: ['d4', 'j5', 'd11'], refs: ['Resilience4j documentation', 'Micrometer / OpenTelemetry docs', 'Spring Boot Actuator docs']
  },
  {
    id: 'j5', title: 'Testing Strategies for Java Services: Contracts, Integration, Testcontainers', level: 3, cat: 'java',
    difficulty: 'Advanced', duration: 45, prerequisites: ['j4'], glossCat: 'Java',
    objectives: ['Design a test pyramid that catches integration bugs', 'Use Testcontainers for realistic integration tests', 'Apply consumer-driven contract testing between services'],
    sections: [
      { h: 'The pyramid, adjusted for services', md:
`For a Spring service the sane distribution: many fast **domain unit tests** (possible because [j1's structure](#/lesson/j1) freed the domain from Spring); focused **slice tests** (\`@WebMvcTest\` for controller + validation + error mapping, \`@DataJpaTest\` for repository queries); a solid layer of **integration tests with Testcontainers** — real Oracle/Postgres and real Kafka in disposable containers, testing the actual SQL, the actual serialisation, the actual transaction behaviour. H2-instead-of-Oracle tests pass while production fails: dialect differences, locking behaviour, sequence semantics. Test the ugly paths explicitly: duplicate event delivered ([inbox works?](#/lesson/d3)), optimistic-lock retry, outbox relay crash-and-resume, poison message to DLT. A handful of **end-to-end smoke tests** on the deployed stack — not hundreds; e2e suites that take an hour get skipped, and then lie.` },
      { h: 'Contract testing: the microservices glue', md:
`Integration between teams breaks at deploy time unless contracts are tested continuously. **Consumer-driven contracts** (Pact, Spring Cloud Contract): each consumer publishes the interactions it relies on; the provider's CI **verifies every consumer's contract on every change** — a breaking change fails the provider's build *before* deployment, replacing "coordinate the release calendar" with automation. Apply the same to **events**: schema-registry [compatibility checks](#/lesson/k3) are contract tests for Kafka; add consumer tests pinning the fields they actually read. Contract tests don't verify behaviour depth (integration tests do that); they verify the *seam* — which is where microservice systems actually break ([ms2](#/lesson/ms2)).` }
    ],
    quiz: [], related: ['ms2', 'k3'], refs: ['Testcontainers documentation', 'Pact / Spring Cloud Contract docs', 'Fowler — TestPyramid, ContractTest']
  },

  /* ================= KAFKA TRACK ================= */
  {
    id: 'k1', title: 'Kafka Topic and Key Design: Partitions, Ordering, Sensitive Data', level: 3, cat: 'kafka',
    difficulty: 'Advanced', duration: 50, prerequisites: ['d13'], glossCat: 'Kafka',
    objectives: ['Choose event keys and partition counts defensibly', 'Structure topics per domain with naming and versioning', 'Handle sensitive data in event payloads'],
    sections: [
      { h: 'Key selection is the design decision', md:
`The key determines partition → determines ordering scope and load distribution. Choose the **entity whose event order matters to consumers**: \`customerId\` for customer lifecycle events (all changes to one customer in order), \`accountId\` for postings, \`paymentId\` for payment-status flows. Consequences to check: **hot keys** (one mega-client generating 30% of events lands on one partition — mitigate by keying on a finer entity or accepting and capacity-planning it); **key stability** (rekeying later breaks ordering history and compaction — pick identifiers that never change, never emails); and **cardinality** (keys ≪ partitions = idle partitions).

**Partition count**: from throughput maths ([calculator](#/calculators)) with headroom — max parallelism per group = partitions, and increasing partitions later **remaps keys** (a key's events split across old/new partitions around the change, breaking order). Err generous; you cannot shrink.` },
      { h: 'Topic granularity and naming', md:
`**Topic per event type** (\`customer.address-changed.v1\`): fine-grained ACLs and retention, but consumers needing several event types for one entity lose cross-type ordering. **Topic per aggregate/domain stream** (\`customer.events.v1\`, key = customerId, event type in payload/header): preserves per-entity order across event types — usually right for entity lifecycles (this is the pattern the [banking event catalogue](#/kafka-designer) uses); costs coarser ACLs and consumers filtering irrelevant types. Decide per domain and record it.

Naming convention: \`<domain>.<stream-or-event>.v<major>\` — major version in the name lets breaking changes run as parallel topics during consumer migration ([k3](#/lesson/k3)). Set \`cleanup.policy\` deliberately: delete with business-justified retention, or compact for changelog/latest-state topics (requires keys, tombstones for deletion — also the GDPR-erasure lever).` },
      { h: 'Sensitive data in events', md:
`Events are **copied into every consumer's storage** and retained — a leaked topic is a leaked database with history. For PII/banking data: prefer **notification-style events** (IDs + non-sensitive facts; consumers fetch details via authorised APIs) or split streams (a restricted \`customer.pii.v1\` with tight ACLs alongside a broad \`customer.events.v1\`); consider field-level encryption/tokenisation for high-value fields; enforce **topic ACLs** and TLS as baseline; keep retention as short as the business allows; and never let payloads leak into logs ([b3](#/lesson/b3)). The [Kafka Topic Designer](#/kafka-designer) reviews your design against exactly these checks.` }
    ],
    quiz: [], related: ['k2', 'k3', 'd14'], refs: ['Apache Kafka docs — design section', 'Confluent — topic/partitioning guidance']
  },
  {
    id: 'k2', title: 'Kafka Delivery Semantics: Idempotence, Transactions, EOS Limits', level: 3, cat: 'kafka',
    difficulty: 'Advanced', duration: 50, prerequisites: ['k1', 'd3'], glossCat: 'Kafka',
    objectives: ['Configure producers and consumers for banking-grade delivery', 'State exactly what Kafka EOS does and does not cover', 'Design duplicate, loss and reorder defences end-to-end'],
    sections: [
      { h: 'Producer side: what the configs actually promise', md:
`\`acks=all\` + \`min.insync.replicas=2\` (on RF 3): a write is acknowledged only when the leader **and** at least one follower have it — no acknowledged-then-lost writes on single-broker failure. \`enable.idempotence=true\`: broker deduplicates producer retries (per producer session, per partition), eliminating the retry-duplicate and retry-reorder class. These are the baseline for anything financial; the cost is latency, which you pay happily.

**Kafka transactions** extend this: a producer atomically writes to multiple topics/partitions + commits consumer offsets — consumers set \`isolation.level=read_committed\`. This is what powers **exactly-once in Kafka Streams**: consume → process → produce, all inside Kafka, genuinely exactly-once.` },
      { h: 'The boundary of the guarantee', md:
`EOS holds **within the Kafka world**. The moment processing touches an external system — Oracle write, REST call to the screening vendor, an email — you are back to at-least-once + [idempotency](#/lesson/d3), because the external effect and the offset commit cannot be atomic. The standard architecture therefore remains: **outbox** on the produce side (DB state and event atomically recorded, [d2](#/lesson/d2)), **inbox/idempotent consumer** on the consume side (processed-ID check in the same DB transaction as the effect), and **reconciliation** as the audit-grade backstop ([b7](#/lesson/b7)). Interview one-liner worth memorising: *"Kafka gives me exactly-once between Kafka topics; between Kafka and Oracle I build exactly-once effect myself with outbox, inbox and reconciliation."*

Residual duplicate sources even with everything enabled: consumer reprocessing after crash-before-commit (inbox catches it), replays ([k4](#/lesson/k4)), and application-level retries above the producer. Duplicates are a *when*, not an *if* — design consumers accordingly, always.` }
    ],
    quiz: [], related: ['d2', 'd3', 'b7'], refs: ['Kafka docs — idempotent producer, transactions, EOS', 'Confluent — exactly-once semantics articles']
  },
  {
    id: 'k3', title: 'Schema Registry, Avro/Protobuf, and Event Evolution', level: 3, cat: 'kafka',
    difficulty: 'Advanced', duration: 45, prerequisites: ['k1'], glossCat: 'Kafka',
    objectives: ['Govern event contracts with a schema registry', 'Choose serialisation formats and compatibility modes', 'Evolve banking event schemas without breaking consumers'],
    sections: [
      { h: 'Contracts for events', md:
`An event without a governed schema is an API without a spec — it works until the first silent change corrupts a consumer. A **Schema Registry** stores versioned schemas per topic and **rejects incompatible changes at produce/CI time**, converting "consumer crashed at 2 a.m." into "build failed at 2 p.m."

Formats: **Avro** (compact binary, rich evolution rules, registry-native — the default in Kafka-heavy shops), **Protobuf** (great tooling, gRPC symmetry), **JSON Schema** (human-readable, weaker evolution semantics, larger). For banking event backbones Avro/Protobuf + registry is the defensible choice; bare JSON is acceptable only with contract tests standing in for the registry ([j5](#/lesson/j5)).` },
      { h: 'Compatibility modes and evolution discipline', md:
`**Backward compatible** = new-schema consumers read old events (needed to reprocess history/replays); **forward** = old consumers read new events (needed while consumers lag producers); **full** = both — the sane default for shared banking topics. What full compatibility permits: add optional fields with defaults, remove optional fields. What it forbids: renaming, retyping, adding required fields.

Evolution playbook: additive changes flow through normal releases (consumers ignore unknown fields — make that a consumer coding standard); **breaking changes get a new major topic** (\`customer.events.v2\`): dual-publish or transform v1→v2, migrate consumers at their own pace with lag monitoring, retire v1 by date. For **event-sourced/long-retention topics**, evolution is harder — you'll reread years-old events, so keep upcasters and never lose old schema versions. Also decide **event ownership** explicitly: the producing domain owns the schema; consumers file change requests — an event contract with three "owners" has none ([d14](#/lesson/d14)).` }
    ],
    quiz: [], related: ['k1', 'j5'], refs: ['Confluent Schema Registry docs', 'Avro specification — schema resolution']
  },
  {
    id: 'k4', title: 'Kafka Operations: DLTs, Replay, Lag, Rebalancing, DR and Multi-Region', level: 3, cat: 'kafka',
    difficulty: 'Advanced', duration: 50, prerequisites: ['k2'], glossCat: 'Kafka',
    objectives: ['Design retry topics, DLTs and replay procedures', 'Operate consumer groups: lag, rebalancing, poison messages', 'Plan Kafka DR and multi-region topologies'],
    sections: [
      { h: 'Failure handling topology', md:
`Per critical consumer: in-memory retries with backoff for transient errors → **retry topic(s)** (e.g. \`…retry.5m\`) for medium outages (vendor down 10 minutes — [b5's screening flows](#/lesson/b5)) so the main partition isn't blocked behind one bad message → **dead-letter topic** for poison messages (deserialisation failures, permanent business rejects) carrying original payload + headers + error cause + offset. A DLT **must** have: alerting (a silent DLT is data loss with paperwork), an owner, a triage runbook, and a **replay tool** back to the source topic after the defect is fixed. Warning honestly taught: retry topics sacrifice per-key ordering (a failed event's siblings overtake it) — where order is sacred, choose block-and-alert over retry-topics, or sequence-check in the consumer ([d3](#/lesson/d3)).

**Replay** is routine, not exotic: reset offsets (by timestamp) or re-consume to rebuild a projection, recover a consumer's bad deploy, or backfill a new consumer. Precondition: idempotent consumers — a replay against a non-idempotent consumer *creates* the incident ([the b5 failure drill](#/lesson/b5)). Decide replay-vs-database-correction per case: replay when the log is right and the projection is wrong; correct data (with audit) when the events themselves were wrong — and emit correction events rather than editing history.` },
      { h: 'Steady-state operations and DR', md:
`Operate by **consumer lag** (growth-rate alerts per group), under-replicated partitions, ISR shrink, and disk headroom. **Rebalancing hygiene**: cooperative-sticky assignor, graceful shutdown ([d11](#/lesson/d11)), sane \`max.poll.interval\` vs actual processing time (slow consumers that miss the poll deadline trigger rebalance storms). Watch **hot partitions** (per-partition throughput skew — [k1's key choices](#/lesson/k1) coming home) and **large messages** (>1 MB: claim-check pattern — store payload in object storage, event carries a reference).

**DR/multi-region**: Kafka's replication is *intra*-cluster; cross-region needs async mirroring (MirrorMaker 2 / vendor replicators) — offsets don't map 1:1, so failover is a **designed procedure** (offset translation, consumer restart points, dedupe window on the other side), not a DNS flip. Stretched clusters buy synchronous RPO≈0 within metro latency at the price of coupling zones. State the honest RPO of async mirroring (seconds of tail loss) in your [DR plan](#/lesson/d5) and let reconciliation own the tail. Secure the estate as a matter of course: TLS + SASL/mTLS auth, per-principal topic ACLs, no default-open clusters.` }
    ],
    quiz: [], related: ['k2', 'd5', 'b5'], refs: ['Kafka docs — operations', 'MirrorMaker 2 / cluster replication docs', 'Confluent — DLQ patterns']
  },

  /* ================= BANKING TRACK ================= */
  {
    id: 'b1', title: 'The Banking Landscape: Domains, Products, and How Money Moves', level: 3, cat: 'banking',
    difficulty: 'Intermediate', duration: 45, prerequisites: ['f3'], glossCat: 'Banking',
    objectives: ['Map the major banking business lines and their system landscapes', 'Understand core banking concepts: accounts, ledgers, products', 'Recognise where architecture complexity concentrates in banks'],
    sections: [
      { h: 'Business lines and their systems', md:
`**Retail banking** (mass-market accounts, cards, consumer lending, mortgages, deposits): high volumes, thin margins, digital channels — architecture skews to scale, self-service, and straight-through processing. **Private banking / wealth management** (high-net-worth clients, portfolios, advisory): low volume, deep relationships, complex household/entity structures — architecture skews to data richness, [relationship modelling](#/lesson/b6), and discretion. **Corporate banking** (business accounts, cash management, trade finance, syndicated lending): complex products, heavy file/host-to-host integration with client ERPs, mandates and multi-approver controls. **Investment banking** (markets, trading, custody): latency-sensitive front office, heavyweight post-trade processing.

A universal bank runs hundreds of systems across these lines, stitched by integration — which is why banks employ armies of integration and solution architects, and why [batch windows, cut-offs and end-of-day processing](#/lesson/b9) still rule operational life.` },
      { h: 'Core concepts every banking architect needs', md:
`The **core banking system** keeps accounts and the **ledger** — the append-only record of debits/credits where every business event ultimately lands as balanced **ledger entries** (banking invented [event sourcing](#/lesson/d7) centuries ago). **Products** define what an account *is* (interest, fees, limits — product master data); **agreements** bind customer to product under terms; **mandates** define who may operate an account (signing rules: "any two directors jointly" — a data-modelling puzzle worth respecting). **Transactions** move value; **payments** are transactions crossing banks, travelling through [clearing and settlement](#/lesson/b4).

Complexity concentrates at three places: the **customer/party layer** (identity, relationships, [KYC](#/lesson/b2)), the **payment path** (correctness under concurrency and failure — [b4](#/lesson/b4)), and **compliance controls** cross-cutting everything ([b3](#/lesson/b3), [b5](#/lesson/b5)). The lifecycle view: **onboarding** (identify, verify, screen, approve — [client lifecycle management](#/lesson/b2)) → in-life (transactions, reviews, changes) → offboarding (closure, retention obligations that outlive the relationship by 7+ years).` }
    ],
    quiz: [], related: ['b2', 'b4'], refs: ['BIS — payment systems concepts', 'ISO 20022 — business domain model (concepts)']
  },
  {
    id: 'b2', title: 'Banking Entities: Party, Customer, Account, Relationship — and Why Terminology Wars Matter', level: 3, cat: 'banking',
    difficulty: 'Advanced', duration: 50, prerequisites: ['b1', 'd8'], glossCat: 'Banking',
    objectives: ['Model the core banking entity set precisely', 'Handle party vs customer vs partner distinctions', 'Establish a domain glossary before drawing service boundaries'],
    sections: [
      { h: 'The entity set', md:
`- **Party**: any person or organisation the bank knows about — the umbrella. A party may be a **person** or an **organisation**.
- **Customer/Client**: a party with a business relationship with the bank (terminology varies: retail says customer, private banking says client).
- **Partner**: in many banks, a party related to a customer without being one themselves — a beneficial owner, an authorised signatory, a director, a guarantor. Partners get screened too ([b5](#/lesson/b5)); their data quality is chronically worse than customers'.
- **Relationship**: a typed, dated link between parties (owns, controls, represents, guarantees) or party-to-account (holder, signatory). Relationships have **roles**, validity periods, and expiry — "RelationshipExpired" is a real event with real downstream consequences (the [screening failure drills](#/lesson/b5) include it).
- **Beneficial owner**: the natural person(s) ultimately owning/controlling a customer — regulatory concept (UBO), requiring traversal of ownership chains across organisations: genuinely graph-shaped data.
- **Account / Product / Agreement / Mandate**: [b1's](#/lesson/b1) contractual layer. **Screening request/result/hit, case, investigation task**: the fincrime workflow chain ([b5](#/lesson/b5)).` },
      { h: 'Terminology differs everywhere — act accordingly', md:
`"Customer" in the CRM (anyone with a marketing consent), the core (an account holder), and the screening platform (any screenable party including partners) are **three different sets**. Systems disagree; departments disagree; regulators have their own definitions. This is not sloppiness to fix by decree — it's [bounded contexts](#/lesson/d8) in the wild.

The professional move: **build the domain glossary first** — for each term, per context: definition, identifying attributes, owning system, lifecycle. Only then draw service boundaries, because boundaries drawn on ambiguous terms put the same entity in two services with two masters ([data ownership](#/lesson/f5)) and produce the reconciliation nightmares of [b7](#/lesson/b7). In interviews, *"before designing the customer service I'd establish what 'customer' means across the involved systems — in my experience party, customer and partner differ, and the boundary follows the definitions"* is a senior answer.` }
    ],
    exercise: { task: `A private bank onboards "Alpine Holding AG", owned 60% by one person (also a director) and 40% by a trust. Model the parties, relationships and roles involved; mark which get screened.`,
      answer: `Parties: Alpine Holding AG (organisation, customer), Person P1 (person, partner), Trust T1 (organisation, partner) — plus the trust's own controlling persons if UBO traversal requires (jurisdiction-dependent). Relationships: P1 —owns 60%→ Alpine (beneficial ownership, dated); P1 —director-of→ Alpine (role: legal representative); T1 —owns 40%→ Alpine; P1/T1 relationships to accounts only if signatories. Screening: the customer (Alpine) and all partners in scope — P1 (as UBO ≥25% and as director) and T1, plus the trust's controllers per UBO rules. Note P1 holds two roles via two relationships — role-specific screening treatments and separate expiry apply, which is why relationship, not party, carries the role.` },
    quiz: [], related: ['b5', 'b6', 'd8'], refs: ['FATF — beneficial ownership guidance (concepts)', 'ISO 20022 party model (concepts)']
  },
  {
    id: 'b3', title: 'Banking Architecture Principles: Audit, Maker-Checker, Data Protection, Resilience', level: 3, cat: 'banking',
    difficulty: 'Advanced', duration: 50, prerequisites: ['b1', 'd16'], glossCat: 'Banking',
    objectives: ['Apply the non-negotiable banking control principles in design', 'Design maker-checker and segregation of duties into systems', 'Handle banking data protection: masking, secrecy, retention'],
    sections: [
      { h: 'The control principles', md:
`- **Auditability & traceability**: every business-relevant action reconstructible — who, what, when, why, under which authority, with which data version. Immutable, append-only audit records, retained 7–10+ years, surviving system replacement ([a9](#/lesson/a9)). Design consequence: audit events are part of every service's contract, not an afterthought.
- **Non-repudiation**: actors cannot deny actions — strong authentication + integrity-protected trails (hash chains/signing where stakes demand).
- **Segregation of duties / maker-checker / four-eyes**: the person initiating a sensitive action (payment above threshold, mandate change, sanctions-hit release) cannot approve it. Architecturally: pending-approval states in the domain model, approval workflows, and **enforcement in the backend** (never only UI), with the maker≠checker rule in the authorisation logic and both identities in the audit trail.
- **Least privilege & defence in depth**: [d15](#/lesson/d15), applied with more paranoia — privileged access time-bound and recorded; controls layered so one failure doesn't expose the estate.
- **Data integrity & transaction integrity**: balanced ledger entries, idempotent money movement ([b4](#/lesson/b4)), and [reconciliation as designed control](#/lesson/b7).` },
      { h: 'Data protection, banking-style', md:
`**Data classification** drives everything: public → internal → confidential → secret; banking secrecy (jurisdiction-dependent) can make even the *existence* of a client relationship protected. Concrete duties: **masking** in every non-production environment and in UIs beyond need-to-know; **logs never contain** PANs, national IDs, balances, or names-in-context ([j3](#/lesson/j3) — structured logging with an allowlist of loggable fields beats a denylist of forbidden ones); **tokenisation** for the highest-value identifiers; **consent management** for data-use purposes; **retention** both minimum (regulatory: keep 10 years) and maximum (privacy: delete after purpose) — the tension is real and the schedule must resolve it per data category; **residency/jurisdictional rules** constraining where data lives and which staff can see it ([case study cs21](#/case-study/cs21)). **Operational resilience** completes the set: regulators now require evidenced continuity of *important business services* — impact tolerances, mapped dependencies, tested scenarios ([b9](#/lesson/b9)).` }
    ],
    quiz: [], related: ['b7', 'b9', 'd16'], refs: ['Basel — operational resilience principles', 'GDPR (retention/minimisation)', 'Local banking-secrecy regimes (concept)']
  },
  {
    id: 'b4', title: 'Payments Architecture: From Initiation to Settlement', level: 3, cat: 'banking',
    difficulty: 'Advanced', duration: 55, prerequisites: ['b1', 'd2'], glossCat: 'Payments',
    objectives: ['Trace a payment through validation, checks, clearing, settlement, posting', 'Design duplicate prevention and idempotency for payments', 'Handle cut-offs, reversals, and reconciliation'],
    sections: [
      { h: 'The payment pipeline', md:
`A credit transfer's stations: **initiation** (channel/API — with an **idempotency key** from the very first hop) → **validation** (schema, IBAN, business rules) → **fraud check** (risk-score; may divert to review — [cs13](#/case-study/cs13)) → **sanctions check** (parties + remittance text screened; hits block — [b5](#/lesson/b5)) → **balance check & reservation** (earmark funds — the anti-double-spend control under concurrency) → **clearing** (exchange via the scheme/CSM: instant rails like SEPA Instant, batch ACH, high-value RTGS) → **settlement** (irrevocable inter-bank value transfer, often at the central bank) → **posting** (ledger entries — [b1](#/lesson/b1)) → **notification** and **reconciliation** (our records vs scheme/nostro records, every day, without exception — [b7](#/lesson/b7)).

**Status modelling** matters more than the happy path: a payment is a state machine (initiated → validated → reserved → sent → settled → posted | rejected | returned…); every state transition is an auditable event; and "unknown" after a timeout is a state you must handle, not a bug ([d1's partial failure](#/lesson/d1) with money attached).` },
      { h: 'The hard parts', md:
`**Duplicate prevention** end-to-end: idempotency key at the API ([j3](#/lesson/j3)); business-level dedupe (same debtor+creditor+amount+reference within a window → hold for confirmation — catches file re-submissions the technical key misses); [idempotent consumers](#/lesson/d3) on every event hop; and scheme-level duplicate checks. **Reversals/returns/refunds** are new compensating transactions with full audit — **never** deletions or edits ([saga compensation](#/lesson/d2) in its natural habitat); card **chargebacks** add scheme-arbitrated dispute flows.

**Cut-off times** shape architecture: batch rails have daily deadlines — miss the 16:30 cut-off and value dates shift, with real customer impact; month-end and [peak-day volumes](#/lesson/b9) size your capacity. **Instant rails** flip constraints: 24/7/365 (no maintenance windows — [zero-downtime deploys](#/lesson/a10) mandatory), seconds-level SLAs including the sanctions check (pre-computed screening decisions, tight vendor SLAs), and confirmed-or-rejected within the scheme timeout. **ISO 20022** is the message language (pain.001 initiation, pacs.008 interbank, camt.05x statements — rich structured data that improves screening and reconciliation); **SWIFT** the international network; **correspondent banking** (nostro/vostro accounts, FX conversion) the multi-hop path where fees, delays and an extra sanctions regime per hop live. The [payment platform case study](#/case-study/cs9) assembles all of this into one design.` }
    ],
    quiz: [], related: ['b5', 'b7', 'cs9'], refs: ['ISO 20022 message catalogue (concepts)', 'ECB/BIS — clearing & settlement primers', 'EPC — SEPA Instant rulebook (concepts)']
  },
  {
    id: 'b5', title: 'Screening and Financial-Crime Architecture', level: 3, cat: 'banking',
    difficulty: 'Expert', duration: 60, prerequisites: ['b2', 'k2'], glossCat: 'Financial crime',
    objectives: ['Design a customer/partner screening platform end-to-end', 'Handle vendor integration, list updates, and re-screening', 'Engineer the failure scenarios that define screening quality'],
    sections: [
      { h: 'The domain', md:
`**KYC/CDD** establishes who the customer is; **EDD** deepens it for higher-risk parties; **AML** monitors behaviour. Screening supports all three: **name screening** against **sanctions lists** (OFAC, EU, UN — blocking), **PEP lists** (risk-raising), and **adverse media** (news-based risk). Two triggers: **initial screening** at onboarding (interactive, seconds — [a1's exercise](#/lesson/a1)) and **ongoing screening** — re-screen when the *customer changes* (name/address events), when the *relationship changes* (new UBO — [b2](#/lesson/b2)), and when the *lists change* (delta screening of the whole affected book: a list update touching 40k names may require re-screening millions of parties overnight — a [Spring Batch](#/lesson/j2)-shaped problem).

The workflow chain: **ScreeningRequest** → vendor/engine matching → **ScreeningResult** with **potential matches (hits)** → false-positive reduction (rules/ML scoring — with [model governance](#/lesson/m10)) → surviving hits open a **Case** → **investigation tasks** → analyst decision (four-eyes for release — [b3](#/lesson/b3)) → outcome + **evidence retained** (what was screened, against which list *version*, what the analyst saw, who decided what and why — reconstructible for a decade). Evidence design pushes toward [event sourcing or immutable stores](#/lesson/d7) for the case history.` },
      { h: 'Reference architecture', md:
`Event-driven core on the stack this app assumes (Java/Spring, Kafka, Oracle, Elasticsearch, Kubernetes): **party/customer domain** publishes lifecycle events (\`customer.events.v1\`, key=partyId — [k1](#/lesson/k1)) → **screening-orchestration service** consumes ([inbox-deduped](#/lesson/d3)), decides screening scope (which parties, which list types — relationship traversal for partners), writes ScreeningRequest to Oracle **with [outbox](#/pattern/outbox)** → calls the **vendor** (REST with [Resilience4j](#/lesson/j4): timeout, retry, circuit breaker; queue-buffer requests during vendor outage and drain on recovery — never silently drop) → results to \`screening.results.v1\` → **case-management service** creates cases/tasks (idempotently: one case per hit — the failure drills below) → Elasticsearch as **read model** for investigator search ([CQRS](#/lesson/d7)). Batch lanes (list-update re-screening, bulk onboarding) run beside the interactive lane with separate capacity ([bulkheads](#/lesson/d4) at platform scale).

**Vendor integration** realities: rate limits (shape your batch throughput), their list-update cadence vs your evidence needs (record list version per decision), their outages (your SLA math must include theirs — [availability chain](#/calculators)), and an [ACL](#/pattern/acl) so their match-data model doesn't colonise your case domain ([a5's sourcing lens](#/lesson/a5) applies to the engine itself).` },
      { h: 'The failure scenarios that define the platform', md:
`Work through these — each is a [lab](#/lab/lab27) and an interview staple: **missed customer/partner update** (detection: reconciliation comparing party-change counts vs screening-request counts per window — [b7](#/lesson/b7); plus consumer-lag alerting); **event processed twice** (inbox dedupe; case-creation idempotent on hitId); **out-of-order events** (version checks — an old address update must not overwrite a newer one, [d3](#/lesson/d3)); **vendor down / request timeout** (circuit breaker + durable queue + backlog drain; onboarding policy decision: block or provisional-with-hold — a *business* call to surface, not bury); **list update fails midway** (restartable batch with checkpoints — [j2](#/lesson/j2); never half-applied silently); **hit without a task / duplicate tasks for one hit** (uniqueness on hitId + reconciliation between hits and cases); **DB-commits-but-Kafka-fails / Kafka-succeeds-but-DB-fails** (the [dual-write problem](#/lesson/d2) — outbox kills it); **replay creates duplicate screening requests** (idempotent request creation keyed on partyId+trigger+listVersion — [k4](#/lesson/k4)); **relationship expires but screening stays active** (expiry events consumed; periodic full-sync reconciliation as backstop); **re-screening after data correction** (correction events trigger scoped re-screen; audit links old and new decisions).` }
    ],
    quiz: [], related: ['b7', 'k4', 'cs11'], refs: ['FATF recommendations (concepts)', 'Wolfsberg Group — screening guidance (concepts)']
  },
  {
    id: 'b6', title: 'Banking Microservice Domains and Boundaries', level: 3, cat: 'banking',
    difficulty: 'Expert', duration: 50, prerequisites: ['b2', 'd9'], glossCat: 'Banking',
    objectives: ['Draw defensible service boundaries across banking domains', 'Assign data ownership per domain with integration contracts', 'Decide what stays strongly consistent'],
    sections: [
      { h: 'The domain map', md:
`A workable banking domain decomposition (bounded contexts, [d8](#/lesson/d8)): **party/customer** (identity, demographics, KYC status — master of party data), **relationship** (party-to-party links, roles, UBO — [b2](#/lesson/b2); graph-shaped, often separate from party because its change cadence and consumers differ), **account** (accounts, mandates, balances — usually wrapping the core), **product** (catalogue, terms), **payment** ([b4](#/lesson/b4) — the state machine), **screening** ([b5](#/lesson/b5)), **investigation/case**, **notification**, **document**, **audit** (append-only evidence sink — deliberately its own domain so nothing can "forget" to audit), **identity/access** (staff and customer authN/Z), **reference data** (currencies, countries, branch codes, list metadata — read-mostly, cached everywhere, one master).

Boundary tests: does one team own it ([Conway](#/lesson/m5))? does it master its data with others consuming via contract? do its terms mean one thing inside ([the glossary discipline](#/lesson/b2))? Payment and screening pass everywhere; "customer" is where banks argue — party vs customer vs relationship splits depend on your organisation's language and change patterns, which is the honest answer interviewers respect.` },
      { h: 'Consistency and integration decisions', md:
`Strong consistency stays **inside** domains: reservation+posting within payment; case+task within investigation. **Across** domains, eventual consistency via integration events (\`account.events.v1\`, \`screening.results.v1\` — the [event catalogue](#/kafka-designer)) with [outbox/inbox](#/lesson/d2) and per-domain [reconciliation](#/lesson/b7) as the control. APIs for queries/commands (mandate check before payment release is a sync call with a [circuit breaker and a defined degraded mode](#/lesson/d4)); events for propagation.

**Regulatory controls cut across**: every domain emits audit events to the audit domain (contract, not courtesy); maker-checker workflows live *in* the owning domain but assert against central identity; data-classification and masking policies applied per domain but governed centrally ([b3](#/lesson/b3)). Migration reality: these services usually grow by [strangling a core-adjacent monolith](#/lesson/m2) — the party domain is typically first (highest reuse), payments last (highest risk). And per [d9](#/lesson/d9): a bank that keeps ledger posting a strongly-consistent modular monolith while extracting the surrounding domains is making a defensible, common choice — not failing at microservices.` }
    ],
    quiz: [], related: ['b5', 'b7', 'd9'], refs: ['BIAN service landscape (concepts)', 'DDD strategic design references']
  },
  {
    id: 'b7', title: 'Banking Data Architecture: Consistency, Reconciliation, Audit Stores', level: 3, cat: 'banking',
    difficulty: 'Expert', duration: 55, prerequisites: ['b6', 'k2'], glossCat: 'Banking',
    objectives: ['Explain why Oracle+Kafka is not one transaction and what to do about it', 'Design reconciliation as a first-class control', 'Architect banking data stores: SoR, ODS, warehouse, audit, search'],
    sections: [
      { h: 'The consistency toolkit, assembled', md:
`The question every banking-architecture interview asks: *"how do you keep Oracle and Kafka consistent?"* The full answer stack: (1) **they are two systems — no shared transaction exists** ([dual-write problem](#/lesson/d2)); (2) **[transactional outbox](#/pattern/outbox)** on the write path (state + event atomically in Oracle; relay publishes — Debezium/CDC or poller); (3) **[inbox/idempotent consumers](#/lesson/d3)** on the read path; (4) **[CDC](#/pattern/cdc)** where the "producer" is a legacy system you can't modify — its committed changes *become* events (mind the coupling: CDC exposes schema unless you transform at the boundary); (5) **compensating transactions** for business-level undo ([d2](#/lesson/d2)); (6) **reconciliation** as the backstop that regulators actually examine.

**Reconciliation** is designed, not improvised: for each critical flow define — what two datasets are compared (payments posted vs events published; screening requests vs party changes; our ledger vs the scheme's settlement file), at what granularity (counts → totals → record-level), how often (daily minimum; hourly for payment flows), what triggers a **break**, and the workflow for investigating/repairing breaks with audit. A reconciliation with no owner and no break-workflow is a dashboard, not a control ([toolkit checklist](#/toolkit)).` },
      { h: 'The store landscape', md:
`Per data category, one **system of record** ([golden source](#/lesson/f5)) — core for accounts, party master for parties — everything else derived: **ODS** (operational data store — near-real-time consolidated copy for operational queries that would otherwise hammer the core), **warehouse/lake** (analytics, fed by CDC/streams; [slowly-changing dimensions](#/glossary?q=slowly) preserve history for time-travel queries regulators love), **regulatory-reporting stores** (point-in-time correct, versioned inputs — a report you can't reproduce is a finding), **audit store** (append-only, WORM where mandated, own retention schedule, survives everything — [b3](#/lesson/b3)), **event store** (if [event-sourcing](#/lesson/d7) case/decision history), **search indexes** (Elasticsearch as rebuildable read models — [CQRS](#/lesson/d7); "rebuildable" is the operative word: the index is never the truth).

Cross-cutting: **lineage** (where did this report figure come from — trace to source events; increasingly a regulatory expectation), **partitioning/archiving** (transaction tables grow forever; partition by date, archive by schedule, keep archived data *queryable* for its retention life), **masking/tokenisation** pipelines for non-prod ([b3](#/lesson/b3)), and **residency** shaping which stores exist per jurisdiction ([cs21](#/case-study/cs21)).` }
    ],
    quiz: [], related: ['b5', 'd2', 'dt2'], refs: ['Debezium docs — outbox & CDC', 'BCBS 239 — risk-data aggregation principles (concepts)']
  },
  {
    id: 'b8', title: 'Banking API Architecture: Internal, Partner, Open Banking', level: 3, cat: 'banking',
    difficulty: 'Advanced', duration: 45, prerequisites: ['j3', 'b3'], glossCat: 'Banking',
    objectives: ['Tier APIs by exposure with proportionate controls', 'Design open-banking-grade security and consent', 'Run API lifecycle: versioning, deprecation, contract testing'],
    sections: [
      { h: 'Three tiers, three postures', md:
`**Internal APIs** (service-to-service): mTLS/workload identity, [standard resilience](#/lesson/j4), still versioned and contract-tested — "internal" is not an excuse ([j5](#/lesson/j5)). **Partner APIs** (fintechs, corporates, vendors): contractual counterparties — mTLS + OAuth2 client credentials, per-partner rate limits and quotas, IP allowlisting where warranted, sandbox environments, and commercial SLAs. **Open banking APIs** (regulated third-party access — PSD2-style): the full regime — consent as a first-class resource (scoped, time-bound, revocable, auditable: *which data, for whom, until when*), strong customer authentication flows, third-party identity verification (directory certificates), and regulatory-grade availability reporting.

Per-tier gateways with different policy stacks ([d12](#/lesson/d12)) — one gateway for all three tiers means the strictest regime taxes every internal call, or worse, the loosest one leaks outward.` },
      { h: 'The non-negotiables on every banking API', md:
`**Idempotency keys** on all money-touching POSTs ([b4](#/lesson/b4)); **correlation IDs** in, propagated, returned ([a9](#/lesson/a9)) plus audit IDs linking API calls to audit-store entries; **pagination + filtering** on collections (an unpaginated /transactions endpoint is a self-DoS invitation); **rate limiting** with honest 429s; **timeouts/retries documented in the contract** (partners will retry — tell them how, or suffer their creativity); consistent **error models** that never leak internals ([j3](#/lesson/j3)); **field-level masking** by caller entitlement (the same /customers/{id} returns different views to a teller vs an auditor); request validation at the edge.

**Lifecycle**: every API has an owner ([f5](#/lesson/f5)); versioning policy published; deprecation = announce → telemetry on remaining callers → chase → sunset date enforced (an API you can't retire is [technical debt](#/lesson/f7) with a partner attached); breaking-change review with consumer representation. Contract tests in both directions keep the promises honest.` }
    ],
    quiz: [], related: ['j3', 'b4', 'd12'], refs: ['PSD2/RTS concepts', 'UK Open Banking standard (concepts)', 'OWASP API Security Top 10']
  },
  {
    id: 'b9', title: 'Banking Resilience and Operations: Peak Days, EOD, Runbooks, Incident Response', level: 3, cat: 'banking',
    difficulty: 'Advanced', duration: 50, prerequisites: ['b4', 'd5'], glossCat: 'Banking',
    objectives: ['Design for banking\'s operational calendar: EOD, month-end, peak days', 'Build graceful degradation and manual-recovery paths', 'Run banking-grade incident response and capacity planning'],
    sections: [
      { h: 'The operational calendar is architecture', md:
`Banking load is violently calendared: **end-of-day** processing (interest accrual, statement generation, GL posting, reconciliation — a dependency-ordered batch graph that *must* finish before market open; your online services may run degraded or read-only during it), **month/quarter/year-end** multiplying volumes, **peak days** (salary days, tax deadlines, Black Friday for cards — size for these, not averages: [peak-factor maths](#/calculators)), **regulatory deadlines** (a report due at 06:00 makes the 02:00 batch failure a compliance incident, not just an ops page — deadlines belong in alert priorities), and **cut-offs** ([b4](#/lesson/b4)) turning latency into value-date errors.

Design consequences: batch dependency graphs explicit and monitored (late-start alerts, not just failure alerts); reruns safe ([idempotent, checkpointed](#/lesson/j2)); capacity plans per calendar event with load tests to match; and instant-payment rails running 24/7 *through* all of it ([zero-downtime everything](#/lesson/a10)).` },
      { h: 'Degradation, recovery, incident discipline', md:
`**Graceful degradation** is a designed menu, agreed with the business *in advance*: vendor screening down → queue onboarding (never skip screening); core slow → serve balances from the ODS flagged "as of hh:mm"; fraud engine down → fall back to rule-set with lower thresholds — each with entry/exit criteria and audit ([the b5 drills](#/lesson/b5)). **Queue buffering + [backpressure](#/lesson/d4)** absorb bursts; **[load-shedding priority](#/lesson/d4)** is business-explicit (payments before statements). **Manual recovery paths** exist for the residue automation can't fix: break-repair workflows with four-eyes ([b3](#/lesson/b3)), documented in **runbooks** that are tested (a runbook nobody rehearsed is fiction), reachable from the alert.

**Incident response**: severity by *business impact* (customer money movement stopped = highest, regardless of which pod died), clear command roles, communication cadence to stakeholders/regulators (report-worthy incidents have clocks), and blameless **RCA** feeding the [incident-learning checklist](#/toolkit) — every incident either improves a control or confirms one. **SLIs/SLOs** per critical journey (not per service): payment-submission success rate, screening-decision latency, EOD-completion time — dashboards the [operational-readiness template](#/template/ops-readiness) makes standard.` }
    ],
    quiz: [], related: ['b4', 'd5', 'd4'], refs: ['Google SRE — incident management', 'Basel operational resilience (concepts)']
  },

  /* ================= MODELLING TRACK ================= */
  {
    id: 'mo1', title: 'The C4 Model: Context, Containers, Components, Code', level: 2, cat: 'modelling',
    difficulty: 'Intermediate', duration: 45, prerequisites: ['f1'], glossCat: 'General architecture',
    objectives: ['Draw all four C4 levels plus dynamic and deployment views', 'Choose the right level for each audience', 'Avoid the classic C4 mistakes'],
    sections: [
      { h: 'Four zoom levels', md:
`C4 is a zoom hierarchy with strict audience discipline:

1. **System Context**: your system as one box, surrounded by users and neighbouring systems. Audience: everyone, especially business. Answers "what is this and what does it talk to?" — the diagram to open every design discussion with.
2. **Container**: the separately deployable/runnable pieces *inside* your system — services, SPAs, databases, topics — with technology labels and interaction protocols. Audience: technical stakeholders. The workhorse diagram of solution design.
3. **Component**: major structural blocks inside one container ([j1's packages](#/lesson/j1) made visible). Audience: the owning team. Draw only for containers whose internals matter to the discussion.
4. **Code**: classes — rarely drawn; generate from code when needed.

Supplementary: **dynamic diagrams** (numbered interaction sequence over context/container elements — for one scenario like "payment initiation", where a static view can't show order) and **deployment diagrams** (containers mapped onto infrastructure: zones, clusters, nodes — where [HA design](#/lesson/d5) becomes visible).` },
      { h: 'Discipline and mistakes', md:
`Every element: **name, type, technology, one-line responsibility**. Every arrow: **direction and protocol/purpose** ("calls via REST/JSON", "publishes CustomerUpdated to"). A legend, always. Version and date.

Classic mistakes: mixing zoom levels on one diagram (a class next to a system); arrows without labels (an unlabeled line is a rumour); drawing every microservice in the estate on one "container diagram" (that's a landscape diagram — [mo3](#/lesson/mo3)); diagrams as decoration after decisions instead of tools during them ([the mistake list](#/mistakes)); and letting diagrams rot — a wrong diagram is worse than none. Practise in [lab 5 and 6](#/labs), then take the [diagram challenge](#/diagram-challenge).` }
    ],
    exercise: { task: `Sketch (in text) the System Context for the screening platform of lesson b5: name the system, 3 user types, and 6 neighbouring systems with labelled interactions.`,
      answer: `System: Customer & Partner Screening Platform. Users: compliance analyst (investigates cases), compliance manager (approves hit releases, four-eyes), MLRO (oversight/reporting). Neighbours: Party Master (publishes customer/partner change events → platform consumes); Relationship System (relationship/UBO events →); Screening Vendor (platform calls REST matching API →); Case-Management/Investigation UI (part of platform or neighbour, per scope decision — state it); Core Banking (platform notifies holds/blocks →); Audit Store (platform emits evidence events →); Identity Provider (authenticates staff →). Each arrow labelled with protocol + purpose, e.g. "consumes party events (Kafka, Avro)".` },
    quiz: [], related: ['mo2', 'mo3'], refs: ['c4model.com — Simon Brown\'s C4 documentation']
  },
  {
    id: 'mo2', title: 'UML That Architects Actually Use', level: 2, cat: 'modelling',
    difficulty: 'Intermediate', duration: 45, prerequisites: ['mo1'], glossCat: 'General architecture',
    objectives: ['Use sequence, state, class, activity, use-case, component and deployment diagrams appropriately', 'Pick the right level of detail per audience', 'Model banking flows with sequence and state diagrams'],
    sections: [
      { h: 'The useful seven', md:
`- **Sequence diagrams** — the architect's most-used UML: participants, ordered messages, activations, alt/opt fragments for error paths. Perfect for "what happens when a payment is initiated" *including the timeout and compensation paths* — a sequence diagram showing only the happy path is half a design ([mistake list](#/mistakes)). When not: more than ~8 participants or "everything the system does" — one scenario per diagram.
- **State diagrams** — for entities with lifecycle rules: [payment status](#/lesson/b4), case status, relationship validity. States, transitions with triggers/guards. If your domain has status columns, it has state machines; drawing them exposes the illegal transitions your code currently permits.
- **Class diagrams** — for the *domain model* ([b2's entities](#/lesson/b2)): entities, attributes that matter, multiplicities ("a Party has 0..* Relationships, each with exactly one RoleType"). Skip getters/setters; this is conceptual, not code-generation.
- **Activity diagrams** — business processes with decisions, parallelism, swim-lanes for who does what (maker-checker flows visualise beautifully).
- **Use-case diagrams** — quick actor/capability scoping; low information density, fine for kickoff context.
- **Component/deployment** — largely superseded by C4 container/deployment views; use whichever notation your organisation reads fluently.` },
      { h: 'Detail discipline', md:
`Model to answer a **question**, not to transcribe reality: "can two approvals interleave badly?" → sequence with the race; "what states can a case reach after escalation?" → state diagram. Include what bears on the question; ruthlessly omit the rest. For executives, none of these — [translate to a context diagram and a decision table](#/communication). Interview tip: offered a whiteboard, narrate *while* drawing a sequence diagram of your design's critical scenario — it demonstrates both the design and the communication skill in one act ([labs 7](#/labs)).` }
    ],
    quiz: [], related: ['mo1', 'b4'], refs: ['UML specification (OMG) — diagram taxonomy', 'Fowler — UML Distilled (pragmatic subset)']
  },
  {
    id: 'mo3', title: 'Enterprise Modelling: ArchiMate, Capability Maps, Landscapes, Data Flows', level: 2, cat: 'modelling',
    difficulty: 'Intermediate', duration: 45, prerequisites: ['mo1', 'a2'], glossCat: 'Enterprise architecture',
    objectives: ['Read and sketch ArchiMate-style layered views', 'Build capability maps, application landscapes and integration landscapes', 'Model data flows, lineage and information models'],
    sections: [
      { h: 'The enterprise viewpoints', md:
`- **ArchiMate basics**: three layers — business (actors, processes, services), application (components, services), technology (nodes, infrastructure) — with cross-layer "realises/serves" relations. Its power is showing *traceability*: which applications realise which business capabilities on which infrastructure. You need reading fluency more than authoring perfection.
- **Business capability maps** ([a1](#/lesson/a1)): the stable what-the-business-does grid, heat-mapped (investment need, system health) — the executive conversation piece for [strategy](#/lesson/m1).
- **Value streams**: stages from trigger to value ("onboard customer: capture → verify → screen → approve → activate"), mapped to capabilities — where the delays live is where the architecture case is.
- **Application landscape**: every application in scope, owners, lifecycle status (invest/maintain/contain/retire) — the portfolio X-ray. **Integration landscape**: the arrows between them (protocol, direction, frequency, data) — the diagram that reveals the point-to-point spaghetti and the [unowned integrations](#/lesson/a6).
- **Process models** (BPMN-style): swim-laned business processes; the bridge between business analysis and [workflow-engine design](#/lesson/a8).` },
      { h: 'Data-oriented views', md:
`**Data-flow diagrams**: processes, stores, flows — the input for [threat modelling's trust boundaries](#/lesson/d16). **Data lineage**: field-level source-to-report traces — regulatory expectation in banking ([b7](#/lesson/b7)). **Information models** at three altitudes: **conceptual** (business entities and relationships — [b2's model](#/lesson/b2), no attributes' types), **logical** (attributes, keys, normalisation — technology-neutral), **physical** (tables, indexes, partitions — per store). Keeping the three distinct prevents the classic failure of database-first design where the physical model *is* the business understanding. Also in the kit: **infrastructure/network diagrams** (zones, firewalls, load balancers — where [security segmentation](#/lesson/d15) is drawn) and **cloud architecture diagrams** (provider-styled deployment views — [c1](#/lesson/c1)).` }
    ],
    quiz: [], related: ['a2', 'd16', 'dt2'], refs: ['ArchiMate specification (The Open Group)', 'BPMN (OMG) — concepts']
  },
  {
    id: 'mo4', title: 'Collaborative Discovery: Event Storming, Context Mapping, Wardley, Story Mapping', level: 2, cat: 'modelling',
    difficulty: 'Intermediate', duration: 45, prerequisites: ['d8'], glossCat: 'Domain-driven design',
    objectives: ['Facilitate an event-storming session', 'Apply context mapping, domain storytelling and impact/story mapping', 'Use Wardley maps, dependency maps, risk heat maps and decision trees'],
    sections: [
      { h: 'Workshop techniques', md:
`- **Event storming**: the room maps a domain as **domain events** on a timeline (orange stickies: "PaymentInitiated", "HitCreated"), then adds commands, actors, systems, and **pivotal events** where the language shifts — those pivots are your [bounded-context](#/lesson/d8) candidates. The fastest known way to extract domain knowledge from experts' heads; the output feeds [b6-style boundary decisions](#/lesson/b6). Facilitator discipline: events in past tense, chaos first then structure, experts talk while architects listen.
- **Domain storytelling**: one concrete story ("Mrs Meier opens an account…") drawn as actors passing work objects — brutal at exposing the *actual* process versus the official one.
- **Context mapping**: the [d8 relationship patterns](#/lesson/d8) drawn between contexts — who conforms to whom, where ACLs guard, where shared kernels couple. The political map of your architecture.
- **User story mapping**: user activities left-to-right, stories vertically by priority — scope-slicing for delivery. **Impact mapping**: goal → actors → impacts → deliverables — kills features that trace to no goal ([f3](#/lesson/f3)).` },
      { h: 'Analysis visuals', md:
`- **Wardley maps**: value-chain components plotted by evolution (genesis → custom → product → commodity) — the strategic lens for [build-vs-buy](#/lesson/a5): building commodity (your own IAM) and buying genesis (your differentiator) are both strategy errors made visible.
- **Dependency maps**: teams/systems and what blocks what — programme-planning reality ([a2's sequencing](#/lesson/a2)).
- **Risk heat maps**: likelihood × impact grids — communicates a [risk register](#/template/risk-register) to executives in one glance; beware false precision, it's a conversation tool.
- **Decision trees**: branching choices with outcomes/probabilities — useful for migration options under uncertainty and for making "do nothing" costs explicit.

Each of these earns a place because it answers a question a static architecture diagram can't. The [diagram challenge](#/diagram-challenge) tests choosing among all of them.` }
    ],
    quiz: [], related: ['d8', 'a5', 'mo5'], refs: ['Brandolini — event storming', 'Wardley — mapping essays', 'Patton — User Story Mapping']
  },
  {
    id: 'mo5', title: 'Architecture Documentation That Gets Read', level: 2, cat: 'modelling',
    difficulty: 'Intermediate', duration: 40, prerequisites: ['mo1', 'a12'], glossCat: 'Governance',
    objectives: ['Assemble HLDs and solution documents from standard building blocks', 'Match document type to decision and audience', 'Keep documentation alive without heroics'],
    sections: [
      { h: 'The document set', md:
`The professional kit (all as [editable templates](#/templates) in this app): **architecture vision** (why + outline target, for sponsors), **solution overview / HLD** (context diagram + container diagram + key decisions + NFRs + integration list + deployment + risks: the workhorse — 10 readable pages beat 60 skimmed ones), **LLD** (per-component detail owned by teams — the architect reviews, doesn't write), **[NFR document](#/lesson/f4)** with measurable scenarios, **interface catalogue** and **event/Kafka catalogues** ([a6](#/lesson/a6), [k1](#/lesson/k1)), **[risk register](#/template/risk-register), assumption log, dependency register** ([f3's RAID](#/lesson/f3)), **[ADRs](#/adr)** for the decisions, **security assessment/threat model** ([d16](#/lesson/d16)), **migration strategy** and **runbooks/ops-readiness** ([a10](#/lesson/a10), [b9](#/lesson/b9)), and the **executive decision summary** ([m7's one-pager](#/lesson/m7)).` },
      { h: 'Keeping it alive', md:
`Documents rot at the speed of change minus the speed of maintenance. Countermeasures: **docs-as-code** (Markdown + diagrams-as-code in the repo, reviewed in PRs alongside the change that invalidates them); **generate where possible** (API docs from OpenAPI, catalogues from registries, deployment views from IaC); **one fact, one home** (the topic catalogue is *the* list of topics; the HLD links, never copies); date-and-owner on everything; and a conscious freshness tier — ADRs are immutable history, the container diagram is maintained, sequence diagrams are per-decision snapshots allowed to age. The test of documentation is behavioural: do people *reach* for it? Documents nobody uses is a [named architect mistake](#/mistakes) — write less, curate more.` }
    ],
    quiz: [], related: ['a12', 'mo1'], refs: ['arc42 — documentation structure (concepts)', 'Docs-as-code practice (Write the Docs)']
  },

  /* ================= DATA / CLOUD / MICROSERVICES SUPPLEMENTS ================= */
  {
    id: 'dt1', title: 'Data Store Families and Polyglot Persistence', level: 3, cat: 'data',
    difficulty: 'Advanced', duration: 45, prerequisites: ['a8'], glossCat: 'Data',
    objectives: ['Match store families to data shapes and access patterns', 'Design polyglot persistence without consistency chaos', 'Plan schema evolution and database migration'],
    sections: [
      { h: 'The families and their bargains', md:
`**Relational**: joins, constraints, transactions, ad-hoc SQL — the default system of record; scaling writes past one primary is where it strains. **Document**: self-contained aggregates, flexible schema — pays when your [DDD aggregate](#/lesson/d8) *is* the document; punishes cross-document joins and transactions. **Key-value**: microsecond lookups at scale — caches, sessions, feature flags; no queries beyond the key. **Wide-column** (Cassandra): massive write throughput, partition-key access — telemetry, feeds; you design tables per query, and ad-hoc analysis moves elsewhere. **Graph**: relationship-traversal as the primary question — [UBO chains](#/lesson/b2), fraud rings ([cs13](#/case-study/cs13)); niche but irreplaceable in its niche. **Time-series**: append-heavy, window-queried metrics/events. **Search**: relevance and aggregations as [rebuildable read models](#/lesson/b7). The [data store selector](#/datastore) drills the choice; the honest summary: relational until a *specific* pressure says otherwise, then add — don't replace.` },
      { h: 'Polyglot persistence, governed', md:
`Different stores for different jobs inside one solution is normal ([b7's landscape](#/lesson/b7)); chaos begins when ownership blurs. Rules: every entity has **one system of record**; every derived store is **rebuildable from it** (and you've tested the rebuild); flows between them are [CDC/events with lag monitoring](#/lesson/d14); and each added store family is an **operational commitment** (backups, upgrades, expertise, on-call) that must be argued, not defaulted. **Schema evolution** applies to databases as to [events](#/lesson/k3): expand → migrate → contract keeps deployments reversible ([a10](#/lesson/a10)); **database migrations** are versioned, automated (Flyway/Liquibase), rehearsed against production-scale copies, and — for the big ones — designed with dual-run and [reconciliation](#/lesson/b7) like any other migration.` }
    ],
    quiz: [], related: ['b7', 'a8', 'dt2'], refs: ['Kleppmann — DDIA storage chapters', 'Flyway/Liquibase docs']
  },
  {
    id: 'dt2', title: 'Data Governance: Ownership, Quality, Lineage, Mesh, Residency', level: 3, cat: 'data',
    difficulty: 'Advanced', duration: 45, prerequisites: ['dt1'], glossCat: 'Data',
    objectives: ['Assign data ownership and stewardship that sticks', 'Design data contracts, quality and lineage', 'Evaluate data mesh/fabric and handle residency'],
    sections: [
      { h: 'Ownership, contracts, quality', md:
`Governance = every important dataset has an **owner** (accountable for meaning, quality, access) and often a **steward** (does the daily curation). **Master data** (parties, products) gets the strongest regime ([b7](#/lesson/b7)); **reference data** (currencies, codes) gets one master and disciplined distribution; **metadata** (what data means, where it lives, its classification) gets a catalogue.

**Data contracts** extend [API/event contracts](#/lesson/k3) to datasets: schema, semantics, quality guarantees (completeness, freshness SLOs), and change process — producer-owned, consumer-relied-upon. **Quality** is measured (validity, completeness, uniqueness, timeliness) at the source with feedback loops, not "cleansed" downstream forever — cleansing downstream is [technical debt](#/lesson/f7) that regenerates. **Lineage** traces field-level provenance ([b7](#/lesson/b7)); automate capture from pipelines because manually maintained lineage is fiction by month three.` },
      { h: 'Mesh, fabric, residency', md:
`**Data mesh**: domain teams own and publish their data as products (discoverable, documented, quality-assured) on self-serve platform infrastructure with federated governance — organisationally hard ([m5's team lens](#/lesson/m5)), and the honest prerequisite is domain teams that already own their *operational* data well. **Data fabric**: the vendor-flavoured integration/metadata layer promising unified access — evaluate as [a5 sourcing](#/lesson/a5), watching lock-in. Neither replaces the basics above; both fail without them.

**Sovereignty/residency**: laws bind data to jurisdictions ([b3](#/lesson/b3)); architecture responses: regional deployments with data pinned ([cs21](#/case-study/cs21)), field-level segregation (global directory, local details), key-custody control (data abroad, keys at home — with legal review of whether that satisfies the regulator), and honest cross-border transfer registers. Residency decided late redraws the whole deployment map — it's a [driver](#/lesson/f3), discover it early.` }
    ],
    quiz: [], related: ['b7', 'm5'], refs: ['Dehghani — Data Mesh (concepts)', 'DAMA DMBOK (concepts)', 'GDPR transfer rules (concepts)']
  },
  {
    id: 'c1', title: 'Cloud Foundations: Service Models, Landing Zones, Networking, IaC', level: 3, cat: 'cloud',
    difficulty: 'Advanced', duration: 50, prerequisites: ['a10'], glossCat: 'Cloud',
    objectives: ['Choose between IaaS/PaaS/SaaS/serverless per workload', 'Design a landing zone with accounts, networks and guardrails', 'Practise infrastructure as code and immutable infrastructure'],
    sections: [
      { h: 'Service models and deployment models', md:
`The responsibility ladder — **IaaS** (VMs, disks, networks: you patch upward), **PaaS/managed services** (databases, brokers, runtimes: provider runs the machinery, you own config and data — usually the banking sweet spot for undifferentiated components), **serverless/FaaS** ([d10's trade-offs](#/lesson/d10)), **SaaS** (you own configuration, integration, and [exit strategy](#/lesson/a4)) — with the **shared responsibility model** cutting across all: the provider secures the cloud, you secure what's *in* it; misconfigured storage buckets are the canonical customer-side breach. Deployment models: **public** (default for scale/economics), **private** (control/residency — at real cost), **hybrid** (the realistic enterprise state for a decade: design the interconnect, identity federation, and data flows deliberately rather than accidentally). Regions and **availability zones** are your [failure-domain vocabulary](#/lesson/d5): multi-AZ is table stakes; multi-region is a business case.` },
      { h: 'Landing zones and IaC', md:
`A **landing zone** is the pre-built, governed foundation before workload one: account/subscription structure (separation by environment and domain — blast-radius and cost boundaries), **network topology** (hub-spoke VNets/VPCs, subnets, firewalls, private endpoints to managed services, egress control — banks default-deny egress), **identity integration** (federated to corporate IdP, role model, break-glass), **guardrails as policy-code** (deny public buckets, require encryption and tags — [m3's governance](#/lesson/m3) enforced by machine), central **logging/monitoring**, and shared services (DNS, secrets, CI/CD runners). Building workloads before the landing zone means rebuilding both.

**Infrastructure as code** (Terraform et al.): reviewed, versioned, repeatable environments — the [a10 environment strategy](#/lesson/a10) made real; **immutable infrastructure**: replace, never patch-in-place, killing config drift. Load balancers, DNS, CDNs, object vs block storage: the standard building blocks whose per-provider names matter less than knowing which problem each solves.` }
    ],
    quiz: [], related: ['d11', 'c2', 'd5'], refs: ['AWS Well-Architected / Azure Architecture Center / Google Cloud Architecture Framework', 'HashiCorp — IaC practice']
  },
  {
    id: 'c2', title: 'Cloud Economics and Lock-in: Making Cloud Decisions Defensible', level: 3, cat: 'cloud',
    difficulty: 'Advanced', duration: 40, prerequisites: ['c1', 'm4'], glossCat: 'Cloud',
    objectives: ['Model cloud costs before migration, not after the bill', 'Treat lock-in as a priced trade-off, not a phobia', 'Choose multi-cloud posture rationally'],
    sections: [
      { h: 'Cost realities', md:
`Cloud converts capex to opex and makes waste frictionless. The recurring surprises: **egress** (data out and cross-AZ/region traffic — chatty [microservices](#/lesson/d9) and analytics exports pay it daily), always-on non-prod, storage that only grows (lifecycle policies from day one), premium managed-service tiers defaulted without a decision, and lift-and-shifted servers sized like their on-prem ancestors. Counters: the [FinOps loop](#/lesson/m4) (tag → allocate → rightsize → commit → review), unit-economics targets per workload, and cost as a section in every [options paper](#/lesson/a3) — the [calculator](#/calculators) gives the arithmetic; the discipline is asking.` },
      { h: 'Lock-in as a priced decision', md:
`Every valuable managed service couples you to its provider; the *absence* of lock-in also has a price (running your own Kafka to stay "portable" is a standing tax paid against a hypothetical migration). Treat it like any [a5 trade-off](#/lesson/a5): for each dependency, note switching cost, and decide *deliberately* — deep integration where the service is commodity-shaped or the value is high (managed Postgres: fine — it speaks standard SQL); abstraction layers only where exit is a realistic scenario worth its ongoing cost.

**Multi-cloud** honestly: running *different workloads* on different clouds (by fit or by acquisition) is normal; running the *same workload* portably across clouds costs lowest-common-denominator services + double expertise + double landing zones, and is justified mainly by regulatory demands for exit capability (banking regulators increasingly ask for tested exit plans — which you can satisfy with documented, rehearsed migration paths rather than live symmetric multi-cloud). Concentration risk is real; answer it with the cheapest adequate instrument, not the most heroic one.` }
    ],
    quiz: [], related: ['m4', 'a5', 'c1'], refs: ['FinOps Foundation', 'EBA outsourcing guidelines (exit-plan concepts)']
  },
  {
    id: 'ms1', title: 'Microservice Boundaries and Data Ownership in Practice', level: 3, cat: 'microservices',
    difficulty: 'Advanced', duration: 45, prerequisites: ['d9', 'd8'], glossCat: 'Microservices',
    objectives: ['Apply boundary heuristics to concrete decompositions', 'Enforce database-per-service and manage data duplication', 'Version services and keep backward compatibility'],
    sections: [
      { h: 'Boundary heuristics, applied', md:
`Candidate boundary = [bounded context](#/lesson/d8) ∩ [team ownership](#/lesson/m5) ∩ change-cadence cluster. Checks before cutting: **transaction test** — if a single business operation would span the boundary transactionally every time, the boundary is wrong or the operation needs redesign as a [saga](#/lesson/d2); **chattiness test** — count the synchronous calls a common scenario would make across it (>2–3 hops: rethink — [availability math](#/calculators) is unforgiving); **data-gravity test** — who masters the entities it touches ([b6](#/lesson/b6))? **cognitive test** — can one team own it whole? Wrong-boundary symptoms downstream: lockstep deployments, shared libraries carrying domain logic, "orchestration" services that are just the old monolith's call graph with network in between.

**[Database per service](#/pattern/db-per-service)** is the enforcement mechanism: no shared tables, no cross-service joins, integration via API/events only. Consequence: **data duplication is normal** — screening keeps its own party snapshot ([b5](#/lesson/b5)); the discipline is knowing the master, subscribing to changes, tolerating staleness explicitly, and [reconciling](#/lesson/b7).` },
      { h: 'Evolution without breakage', md:
`**Service versioning**: contracts versioned ([j3](#/lesson/j3), [k3](#/lesson/k3)); expand-then-contract for every change; consumers tolerate unknown fields; [consumer-driven contracts](#/lesson/j5) verify continuously. **Deployment independence** is the whole point — protect it: no shared release trains, no "deploy A and B together" runbooks (each such runbook is a boundary bug report). **Service discovery and config**: platform-provided (Kubernetes DNS/service registry, config from the environment — [d11](#/lesson/d11)); **dependency management**: know your blast radius — a dependency graph of who calls whom, kept current from tracing data, reviewed for cycles (cyclic service dependencies are a merged-context smell). [Failure isolation](#/lesson/d4) per dependency, [observability](#/lesson/j4) per hop, and an owner per service — "operational ownership" means the building team carries the pager.` }
    ],
    quiz: [], related: ['ms2', 'b6', 'd9'], refs: ['Newman — Building Microservices', 'microservices.io — decomposition patterns']
  },
  {
    id: 'ms2', title: 'Monolith-to-Microservices Migration and Testing Strategy', level: 3, cat: 'microservices',
    difficulty: 'Advanced', duration: 45, prerequisites: ['ms1', 'm2'], glossCat: 'Microservices',
    objectives: ['Sequence a monolith decomposition with data extraction', 'Test a distributed system without an e2e bottleneck', 'Recognise when to stop decomposing'],
    sections: [
      { h: 'The extraction playbook', md:
`(1) **Modularise in place first** ([d9](#/lesson/d9)): boundaries as packages/modules with enforced dependencies — cheap to adjust while wrong. (2) Pick the first extraction for **learning value**: meaningful but non-critical, few inbound dependencies (notification, document generation — not payments). (3) [Strangler](#/pattern/strangler) route traffic; **[branch by abstraction](#/pattern/branch-abstraction)** inside the monolith puts an interface where the seam will be, letting old and new implementations swap safely. (4) **Data extraction is the hard 80%**: new service gets its own store; during transition either the monolith keeps mastering data (service reads via API/CDC) or ownership moves (monolith becomes a consumer) — pick per entity, avoid dual-writes, [reconcile](#/lesson/b7) during parallel run. (5) Retire monolith code per slice — an extraction that leaves the old path alive is a copy, not a migration. Repeat while the *pressures* ([d9's triggers](#/lesson/d9)) persist; **stop** when extraction stops paying — a modular core plus a handful of services is a success state, not a failure to finish.` },
      { h: 'Testing the distributed result', md:
`The e2e-test-everything reflex collapses at ~10 services (slow, flaky, ownerless). The working stack: per-service tests with **[Testcontainers](#/lesson/j5)** for real infrastructure; **[consumer-driven contracts](#/lesson/j5)** guarding every API and event seam (this is the load-bearing layer — it's what replaces the release train); a *thin* set of journey smoke tests in a staging environment; **[resilience testing](#/lesson/d4)** (kill dependencies, inject latency — verify the timeouts and fallbacks exist outside of diagrams); and **production-aware practices** — [canary + SLO monitoring](#/lesson/a10) catches what staging can't, because staging never has production's data shapes or traffic interleavings. Budget test-infrastructure work as part of the migration, not after it.` }
    ],
    quiz: [], related: ['ms1', 'm2', 'j5'], refs: ['Newman — Monolith to Microservices', 'Pact / Spring Cloud Contract docs']
  }
  ]);
})(window.SAA.data);
