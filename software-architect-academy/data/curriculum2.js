/* curriculum2.js — Level 3 (Advanced Architecture) lessons */
(function (D) {
  'use strict';
  D.lessons = (D.lessons || []).concat([

  {
    id: 'd1', title: 'Distributed Systems Fundamentals: CAP, PACELC, Consistency', level: 3, cat: 'distributed',
    difficulty: 'Advanced', duration: 50, prerequisites: ['a6'], glossCat: 'Distributed systems',
    objectives: ['Reason with CAP and PACELC correctly', 'Choose a consistency model per use case', 'Accept network unreliability as a design input'],
    sections: [
      { h: 'The network is the problem', md:
`Distributed systems exist because one machine isn't enough — and they inherit the network's physics: messages are delayed, reordered, duplicated, and lost; clocks drift; any node can fail **partially** (accepted your write, died before acknowledging). The defining skill of distributed design is assuming these failures as *normal inputs*, not exceptions.

Partial failure is the deep one: when a call times out you cannot know whether the operation happened. Every reliable distributed mechanism — retries with idempotency, acknowledgements, reconciliation — is a response to this single uncertainty.` },
      { h: 'CAP and PACELC without the folklore', md:
`**CAP**: when a network **P**artition happens, you must choose between **C**onsistency (refuse to answer rather than answer stale) and **A**vailability (answer, possibly stale). You don't "pick two of three" in general — partitions are not optional, so the real choice is C-or-A *during* partitions.

**PACELC** completes it: if **P**artition, choose **A** or **C**; **E**lse (normal operation), choose **L**atency or **C**onsistency. Even without partitions, synchronous replication for strong consistency costs latency. Examples: a bank ledger picks C over A (reject payments rather than double-spend); a product catalogue picks A (stale price display beats an error page); DynamoDB default is PA/EL, a CP-configured relational cluster is PC/EC.

Consistency models, strongest to weakest: **linearisable** (as if one copy), **sequential**, **causal** (causes before effects — often the sweet spot), **read-your-writes**, **eventual** (converges, eventually). Choose per *operation*, not per system: the same platform can serve linearisable balance checks and eventually-consistent statement views.` },
      { h: 'What this means for your designs', md:
`Practical consequences you'll apply through this level: (1) every remote call needs a timeout and a policy for "unknown outcome"; (2) exactly-once *delivery* is unachievable end-to-end — you build exactly-once *effect* with idempotency ([d3](#/lesson/d3)); (3) cross-service consistency is a workflow problem (sagas, outbox — [d2](#/lesson/d2)), not a transaction problem; (4) reconciliation jobs are not an admission of failure but a designed control, especially in banking ([b7](#/lesson/b7)).` }
    ],
    quiz: [], related: ['d2', 'd3'], refs: ['Kleppmann — Designing Data-Intensive Applications ch. 8–9', 'Abadi — PACELC paper (concept)']
  },
  {
    id: 'd2', title: 'Distributed Transactions: 2PC, Sagas, Outbox, Inbox', level: 3, cat: 'distributed',
    difficulty: 'Advanced', duration: 55, prerequisites: ['d1'], glossCat: 'Distributed systems',
    objectives: ['Explain why 2PC rarely fits modern systems', 'Design orchestrated and choreographed sagas with compensation', 'Apply transactional outbox and inbox correctly'],
    sections: [
      { h: 'Why not just a distributed transaction?', md:
`**Two-phase commit** gives atomicity across resources but at a price modern systems rarely accept: a blocking protocol (participants hold locks while waiting for the coordinator — a died coordinator freezes everyone), a coordinator single point of failure, poor throughput, and no support in most cloud services, message brokers, or vendor APIs. 2PC survives inside single vendor stacks (classic JEE + XA between one DB and one broker) but is a dead end for service-to-service consistency.

The modern stance: keep **atomicity local** (one service, one database, real ACID) and make **cross-service consistency a designed workflow** with explicit intermediate states.` },
      { h: 'Sagas: sequences with compensation', md:
`A **saga** splits a business transaction into local transactions, each with a **compensating action** to semantically undo it if a later step fails: reserve funds → screen payment → post → (on failure after reserve: release reservation).

- **Orchestration**: a coordinator (workflow engine or dedicated service) commands each step and tracks state. Pros: visible state, central error handling, easy to reason about. Cons: the orchestrator couples to every participant and can become a god-service.
- **Choreography**: each service reacts to the previous service's events. Pros: loose coupling, no central component. Cons: the workflow exists nowhere — tracing "where is payment 123 stuck?" spans five services; cyclic event chains emerge by accident.

Rule of thumb: choreography for short, stable, 2–3 step flows; orchestration when steps ≥ 4, when humans need visibility, or when compensation logic is rich (payments, onboarding). Design compensations as first-class business operations — "release reservation" has its own failure modes and audit trail. Some steps are **non-compensatable** (money left the bank): order the saga so those come last, or wrap them in pending states.` },
      { h: 'Outbox and inbox: the dual-write problem', md:
`You cannot atomically write to your database **and** publish to Kafka — one can succeed while the other fails, and both orders are bad (state without event = silent divergence; event without state = phantom fact). This *dual-write problem* is why banking systems reconcile.

**Transactional outbox**: write the business change *and* the event into the same database transaction (event goes to an outbox table); a relay (poller or CDC like Debezium) publishes from the outbox afterwards. Result: the event is published **at least once**, if and only if the state change committed.

**Inbox (idempotent consumer)**: the consumer records processed message IDs in its own database, in the same transaction as its state change; redelivered messages are detected and skipped. Outbox + inbox gives effectively-once *processing* over an at-least-once transport — the standard answer to "how do you keep Oracle and Kafka consistent?" in banking interviews ([full treatment in b7](#/lesson/b7)).` }
    ],
    exercise: { task: `A payment service posts a debit to its Oracle DB, then publishes PaymentPosted to Kafka. Deployment A does DB-then-publish, deployment B publish-then-DB. Describe the failure mode of each and the fix.`,
      answer: `A: DB commit succeeds, process crashes before publish → downstream (fraud, notifications, ledger consumers) never learn about a real payment; books diverge silently until reconciliation. B: event published, DB write fails → downstream reacts to a payment that never happened (notification sent, ledger consumer posts) — worse, because it's business-visible. Fix: transactional outbox — the debit and the outbox row commit atomically; a relay publishes with at-least-once semantics; consumers implement the inbox pattern to dedupe. Add a reconciliation job comparing posted payments to published events as the audit-grade backstop.` },
    quiz: [], related: ['d3', 'b7', 'k2'], refs: ['microservices.io — Saga, Outbox patterns (Richardson)', 'Debezium documentation — outbox event router']
  },
  {
    id: 'd3', title: 'Idempotency, Deduplication, Ordering and Delivery Semantics', level: 3, cat: 'distributed',
    difficulty: 'Advanced', duration: 50, prerequisites: ['d2'], glossCat: 'Distributed systems',
    objectives: ['Design idempotent operations end-to-end', 'Handle duplicate and out-of-order delivery', 'Debunk exactly-once claims accurately'],
    sections: [
      { h: 'Delivery semantics honestly stated', md:
`- **At-most-once**: fire and forget; loses messages on failure. Acceptable only when loss is cheaper than duplication (metrics ticks).
- **At-least-once**: retry until acknowledged; the default for anything that matters — and it *guarantees duplicates eventually*.
- **Exactly-once delivery** across independent systems is impossible (the acknowledgement itself can be lost). What's achievable is **exactly-once effect**: at-least-once delivery + idempotent processing. Kafka's "exactly-once semantics" is real but scoped: transactions across Kafka topics/partitions and Kafka Streams — it does not extend to your database, your emails, or the vendor API you call ([k2](#/lesson/k2)).

Interview trap: "we use exactly-once so we don't need idempotency" is precisely wrong and interviewers plant it deliberately.` },
      { h: 'Designing idempotency', md:
`An operation is idempotent when doing it twice has the effect of doing it once. Techniques by layer:

- **Natural idempotency**: "set status = CLOSED" is idempotent; "increment balance" is not. Prefer absolute state over deltas where the domain allows.
- **Idempotency keys**: caller supplies a unique key per logical operation (payment initiation); the service stores key → result and replays the stored result on retry. Scope the key storage with a TTL matched to the retry horizon, and store it **in the same transaction** as the effect.
- **Inbox pattern** for consumers: processed-message-ID table checked/inserted transactionally ([d2](#/lesson/d2)).
- **Conditional writes**: optimistic version checks ("update … where version = 41") make concurrent duplicates fail cleanly.

Deduplication needs a **dedupe window** decision: how long can a duplicate arrive? Replays ([k4](#/lesson/k4)) can bring day-old duplicates — banking-grade consumers keep processed IDs as long as replay is possible, or dedupe on business keys.` },
      { h: 'Ordering', md:
`Global ordering doesn't scale (one queue, one consumer); the design question is **what scope actually needs order**. Usually it's per-entity: all events for account 42 in order, but account 42 vs 43 interleaved freely. Kafka gives per-partition order, so **key by the entity** ([k1](#/lesson/k1)).

When order still breaks (rebalancing edge cases, producer retries without idempotence, replays), consumers defend themselves: version/sequence numbers in events ("ignore update v5 if I've seen v6"), last-write-wins with business timestamps where acceptable, or buffering-and-sorting within a small window. Out-of-order handling is a consumer responsibility — never assume the pipe is polite. Concurrency hazards (two consumers touching one entity) are handled with per-key serialisation via partitioning, or optimistic locking at the store.` }
    ],
    quiz: [], related: ['d2', 'k2', 'b8'], refs: ['Kafka documentation — idempotent producer, transactions', 'Kleppmann — ch. 11 (streams, delivery)']
  },
  {
    id: 'd4', title: 'Resilience Patterns: Timeouts, Retries, Circuit Breakers, Bulkheads, Backpressure', level: 3, cat: 'distributed',
    difficulty: 'Advanced', duration: 50, prerequisites: ['d1'], glossCat: 'Reliability',
    objectives: ['Compose resilience patterns into a coherent policy', 'Prevent retry storms and cascading failures', 'Design load shedding and backpressure deliberately'],
    sections: [
      { h: 'The failure chemistry set', md:
`- **Timeout**: the foundation — an unbounded wait is a resource leak that spreads. Set from the callee's p99 plus margin, not from hope. Every remote call has one, including to databases.
- **Retry**: only for transient failures, only for idempotent operations, always with **exponential backoff + jitter** and a budget (e.g., 3 attempts, or ≤10% extra load). Retrying a struggling service without backoff is a DDoS you run against yourself — the **retry storm**.
- **Circuit breaker**: after N failures, stop calling (open); periodically test (half-open); resume when healthy. Converts a slow, resource-consuming failure into a fast, cheap one, giving the callee air to recover. Define fallback behaviour per operation: cached data, default answer, queue for later, or honest error.
- **Bulkhead**: partition resources (thread pools, connection pools, pods) per dependency or tenant so one bad dependency can't drain everything. Named after ship compartments for the right reason.
- **Load shedding & rate limiting**: past saturation, serving fewer requests well beats serving all requests badly. Shed by priority (drop analytics before payments), signal with 429 + Retry-After.
- **Backpressure**: consumers signal producers to slow down rather than buffering to death — bounded queues, pull-based consumption (Kafka's model), reactive streams.` },
      { h: 'Composing them: order matters', md:
`A sane synchronous call stack, outermost first: bulkhead → rate limiter → circuit breaker → retry (with backoff) → timeout → the call. Retries sit *inside* the breaker so retried failures trip it; timeout inside retry so each attempt is bounded. In Java this is Resilience4j's decoration order ([j4](#/lesson/j4)).

**Cascading failure** anatomy — the scenario interviewers love: service C slows → B's threads block on C (no/loose timeout) → B's pool exhausts → A retries B aggressively → A dies too. Every pattern above cuts one link in that chain. Design review question: "show me the failure mode when your slowest dependency goes to 100% latency" — if the answer is a shrug, the review just found its finding ([review simulator](#/review-sim) drills this).` }
    ],
    quiz: [], related: ['d5', 'j4'], refs: ['Release It! (Nygard) — stability patterns', 'Resilience4j documentation', 'AWS builders\' library — timeouts/retries/jitter']
  },
  {
    id: 'd5', title: 'High Availability, Disaster Recovery, RTO/RPO and Multi-Region', level: 3, cat: 'distributed',
    difficulty: 'Advanced', duration: 50, prerequisites: ['d4'], glossCat: 'Reliability',
    objectives: ['Derive availability architecture from RTO/RPO numbers', 'Choose between active-active and active-passive', 'Design multi-region with data-residency awareness'],
    sections: [
      { h: 'From business numbers to architecture', md:
`Start with two business-owned numbers: **RTO** (how long may service be down) and **RPO** (how much data may be lost). They determine cost tiers:

| RTO / RPO | Architecture | Relative cost |
|---|---|---|
| Days / hours | Backups + restore runbook | € |
| Hours / minutes | Warm standby, replicated data | €€ |
| Minutes / seconds | Active-passive with automated failover | €€€ |
| ~0 / ~0 | Active-active multi-zone or multi-region | €€€€ |

Architects earn their pay pushing back on "RTO zero for everything": make the business price it ([RTO/RPO calculator](#/calculators)). Within one region, **multi-AZ** active-active is the modern default — zones give you independent failure domains with low latency, and most "DR" events (hardware, deploys, zone issues) are covered.` },
      { h: 'Active-active vs active-passive, and the data problem', md:
`Stateless compute is trivially active-active; **state is the whole problem**. Synchronous replication gives RPO 0 but adds write latency and couples regions (a slow peer slows you); asynchronous replication frees latency but loses the replication lag on failover (RPO > 0) — and someone must own the reconciliation of that lost tail ([b9](#/lesson/b9)).

Active-active across regions adds the hardest question: **who may write?** Options: partition writes by tenant/geography (each customer homed to one region — common in banking, aligns with residency), single-writer with fast failover, or true multi-master with conflict resolution (CRDTs, last-write-wins) — which most transactional domains cannot tolerate. Failover itself must be **rehearsed**: an untested DR plan is a document, not a capability. Watch for split-brain: fencing/quorum so the old primary can't keep accepting writes.` },
      { h: 'Disaster recovery as a discipline', md:
`DR = defined scenarios (zone loss, region loss, data corruption, ransomware — corruption replicates, so replication alone is not backup), documented runbooks, and **scheduled game days** that actually fail over production or a faithful copy. Measure achieved RTO/RPO against the promise, and report the gap honestly. Regulators in banking increasingly require evidenced operational-resilience testing, not paperwork ([b9](#/lesson/b9)).` }
    ],
    quiz: [], related: ['d4', 'b9', 'c1'], refs: ['Google SRE — availability math', 'AWS Well-Architected — reliability pillar']
  },
  {
    id: 'd6', title: 'Scaling: Horizontal, Vertical, Sharding, Replication, Partitioning', level: 3, cat: 'distributed',
    difficulty: 'Advanced', duration: 45, prerequisites: ['d1'], glossCat: 'Performance',
    objectives: ['Choose scaling strategies in the right order', 'Design sharding keys and understand resharding pain', 'Use replication for reads without consistency surprises'],
    sections: [
      { h: 'Scale in the right order', md:
`Cheapest first: (1) **measure and fix the actual bottleneck** — it's usually a query, an N+1, or a missing index, not "we need microservices"; (2) **cache** hot reads ([cache-aside](#/pattern/cache-aside)); (3) **vertical scaling** — bigger box; unfashionable, extremely effective, zero architectural cost until the ceiling; (4) **horizontal compute scaling** — requires statelessness: session/state externalised so any instance serves any request; (5) **read replicas** for read-heavy loads; (6) **sharding** the write path — last, because it's the one you can't easily undo.

Stateless vs stateful: push state to the edges (client tokens) and the stores; what must be stateful (databases, brokers) gets the serious engineering.` },
      { h: 'Replication and its lag', md:
`Read replicas multiply read throughput and provide failover material, but replication is asynchronous by default: a replica read after a write can see the past. Symptoms: user updates profile, refreshes, sees old data. Mitigations: read-your-writes routing (session pins reads to primary briefly), monotonic-read sessions, or accept and design the UX for it. Never mix "we need strong consistency" with "read anything from any replica" — pick per query.` },
      { h: 'Sharding: powerful, permanent-ish', md:
`Sharding partitions data across nodes by a **shard key**. Everything depends on that key: (1) it must distribute load evenly — beware hot keys (the mega-corporate customer, the celebrity account); (2) queries *within* one shard are cheap, cross-shard queries become scatter-gather (slow) or forbidden; (3) transactions across shards mostly don't exist — choose a key so that hot transactional paths are single-shard (account ID for banking transactions, tenant ID for SaaS); (4) **resharding is a migration project**, so plan key cardinality and growth up front (consistent hashing or directory-based schemes ease it).

Related choices: range vs hash partitioning (range gives locality for scans, risks hot ranges; hash gives even spread, kills range scans), and partition-aware IDs. The same reasoning governs [Kafka partition keys](#/lesson/k1) — one mental model, two systems.` }
    ],
    quiz: [], related: ['d5', 'k1', 'dt1'], refs: ['Kleppmann — partitioning & replication chapters', 'Vitess/Citus docs (sharding practice)']
  },
  {
    id: 'd7', title: 'CQRS and Event Sourcing', level: 3, cat: 'distributed',
    difficulty: 'Advanced', duration: 45, prerequisites: ['d2'], glossCat: 'Domain-driven design',
    objectives: ['Apply CQRS where read and write models genuinely diverge', 'Evaluate event sourcing costs honestly', 'Combine with outbox/CDC for pragmatic read models'],
    sections: [
      { h: 'CQRS: two models, one truth', md:
`**Command Query Responsibility Segregation** separates the write model (normalised, invariant-enforcing) from read models (denormalised, query-shaped). Justified when reads and writes have irreconcilable shapes or scale: a screening platform writes case decisions transactionally but serves investigators a search-optimised view (Elasticsearch), compliance a reporting view, and dashboards an aggregate view — three read models fed from one write model via events or CDC.

Costs: eventual consistency between write and read sides (UI must tolerate "your change appears shortly"), pipeline operations (lag monitoring, rebuild capability), and duplicated storage. **Not justified** for ordinary CRUD — CQRS-everywhere is a classic overengineering finding ([mistakes](#/mistakes)). Materialised views and read replicas are CQRS-lite and often enough.` },
      { h: 'Event sourcing: the ledger model', md:
`Event sourcing stores the **sequence of events** as the source of truth; current state is a fold over events (with snapshots for speed). Banking has done this for centuries — it's called a ledger: you never update a balance, you append entries.

Genuine strengths: complete audit trail by construction (huge for [auditability](#/lesson/a9)), temporal queries ("state as of March 3rd" — exactly what regulators ask), natural fit for event-driven integration, and bug recovery by replay with fixed logic.

Honest costs: schema evolution over years of stored events (upcasters, versioning discipline — harder than API versioning); queries need projections (you almost always end up with CQRS); deletion/GDPR is hard (crypto-shredding of per-subject keys is the usual answer); the skill floor is high and mistakes are permanent. Apply **selectively**: the ledger, the case history, the consent log — not the user-preferences table. Pragmatic middle: conventional state + [transactional outbox](#/pattern/outbox) events gives most integration benefits without the storage model change.` }
    ],
    quiz: [], related: ['d2', 'd8', 'b7'], refs: ['Fowler — CQRS, Event Sourcing articles', 'Greg Young — event sourcing talks (concepts)']
  },
  {
    id: 'd8', title: 'Domain-Driven Design: Bounded Contexts, Aggregates, Domain Events', level: 3, cat: 'distributed',
    difficulty: 'Advanced', duration: 55, prerequisites: ['f5'], glossCat: 'Domain-driven design',
    objectives: ['Find bounded contexts with language boundaries', 'Design aggregates as consistency boundaries', 'Use context mapping and anti-corruption layers between contexts'],
    sections: [
      { h: 'Strategic DDD: language draws the boundaries', md:
`DDD's core observation: large domains have no single consistent model. "Customer" to onboarding means an applicant with documents; to payments, an account holder with mandates; to screening, a party with risk attributes. Forcing one Customer model creates a coupling monster ([shared-database pattern's evil twin](#/pattern/shared-db)).

A **bounded context** is the boundary within which one model and one **ubiquitous language** hold consistently. Find boundaries where language shifts (the same word means different things, or different words mean the same thing), where processes hand off, and where team ownership changes. Bounded contexts are the *only* defensible basis for microservice boundaries — services cut against the domain grain generate chatty, transactional cross-service traffic forever ([ms1](#/lesson/ms1)). In banking, contexts typically include: party/customer, account, product, payment, screening, case management, notification, audit ([b6](#/lesson/b6)).` },
      { h: 'Tactical DDD: aggregates', md:
`An **aggregate** is a cluster of objects treated as one unit for changes: one root entity through which all modifications flow, one transaction per aggregate, invariants enforced inside ("account balance never below overdraft limit" lives in the Account aggregate). Rules that keep systems sane: keep aggregates **small** (the whole customer-with-all-accounts-and-history is not an aggregate; it's a query); reference other aggregates **by ID**, never object graphs; accept that cross-aggregate consistency is **eventual**, coordinated by domain events or sagas ([d2](#/lesson/d2)).

**Domain events** record business facts in the ubiquitous language — AccountOpened, ScreeningHitCreated — published when an aggregate commits ([outbox](#/pattern/outbox)). They are the currency of integration between contexts.` },
      { h: 'Context mapping and the ACL', md:
`Contexts relate in patterns worth naming in reviews: **customer/supplier** (downstream can negotiate), **conformist** (downstream just accepts upstream's model — typical with vendors), **shared kernel** (shared code/model — high coupling, use sparingly), **published language** (shared event/API contracts — the healthy default), and the **anti-corruption layer**: a translation layer protecting your model from an alien one. ACLs are mandatory equipment when integrating vendor screening platforms or legacy cores — without one, the vendor's data model quietly colonises your domain and you inherit their historical accidents ([pattern](#/pattern/acl)). Techniques for *discovering* all this collaboratively — event storming, domain storytelling, context mapping — are in [modelling lesson mo4](#/lesson/mo4).` }
    ],
    quiz: [], related: ['ms1', 'b6', 'mo4'], refs: ['Evans — Domain-Driven Design', 'Vernon — Implementing DDD', 'Fowler — BoundedContext']
  },
  {
    id: 'd9', title: 'Microservices vs Modular Monolith: The Honest Comparison', level: 3, cat: 'microservices',
    difficulty: 'Advanced', duration: 50, prerequisites: ['d8'], glossCat: 'Microservices',
    objectives: ['State what microservices actually buy and cost', 'Argue for a modular monolith where appropriate', 'Define the triggers that justify extraction'],
    sections: [
      { h: 'What microservices actually buy', md:
`Independent **deployability** (teams ship without coordinating releases), independent **scaling** (scale the hot path only), **failure isolation** (one service down ≠ all down, if designed for it), **technology freedom** per service, and organisational **parallelism** — many teams, low coordination. Note that every one of these is conditional: microservices *enable* them; sloppy boundaries destroy them (a "distributed monolith" must deploy services in lockstep and fails together — all cost, no benefit).

What they cost: network calls where function calls were (latency, partial failure, [the whole of d1–d4](#/lesson/d1)); eventual consistency and sagas where transactions were; operational surface (CI/CD × N, observability across hops, on-call maturity); contract governance; and a real platform (Kubernetes, service discovery, secrets, mesh — [d11](#/lesson/d11)). Microservices trade **development coupling for operational complexity**. That trade pays at organisational scale — multiple teams stepping on each other — and rarely before.` },
      { h: 'The modular monolith, stated positively', md:
`One deployable with **enforced** internal module boundaries: modules own their tables (no cross-module joins), communicate through in-process interfaces or an internal event bus, boundaries checked by fitness functions (ArchUnit, Spring Modulith). You keep: single deploy, real ACID transactions across the flow, function-call latency, trivial local dev, one on-call surface. You give up: independent scaling/deploy per module, per-module tech choices.

For a single team, a new product, or an unclear domain, this is usually the **right first architecture** — and because modules mirror bounded contexts, later extraction of a genuinely hot or organisationally contested module is a refactoring, not an archaeology dig. "Monolith-first" is not a compromise; it's how you learn the boundaries cheaply. When a banking system must remain one strongly consistent core (ledger posting), a modular monolith around the ledger with services at the edges is a defensible, common answer ([interview favourite](#/interview?q=modular%20monolith)).` },
      { h: 'Extraction triggers and the service-size spectrum', md:
`Extract a module to a service when a **specific pressure** demands it: divergent scaling (10× traffic on one module), divergent change cadence + team ownership conflicts, different compliance/isolation needs (PCI scope), or a technology mismatch. Extract along the existing module boundary, using the [strangler](#/pattern/strangler) approach and an [outbox](#/pattern/outbox) for events.

The spectrum — modular monolith → coarse-grained services (one per bounded context; the sane default) → fine-grained microservices (one per aggregate/capability; only with platform maturity) — plus vendor platforms and shared enterprise services in the mix. Choosing the point on this spectrum *per context*, not one dogma for the estate, is what "it depends" actually means when an architect says it.` }
    ],
    quiz: [], related: ['ms1', 'ms2', 'd10'], refs: ['Fowler — MonolithFirst, MicroservicePremium', 'Newman — Building Microservices', 'Spring Modulith docs']
  },
  {
    id: 'd10', title: 'Architecture Styles: Layered, Hexagonal, Clean, Pipes, Space-Based, Cell-Based, Serverless, Multi-Tenant', level: 3, cat: 'distributed',
    difficulty: 'Advanced', duration: 50, prerequisites: ['f6'], glossCat: 'General architecture',
    objectives: ['Match architecture styles to problem shapes', 'Explain hexagonal/clean dependency rules precisely', 'Design multi-tenancy with explicit isolation levels'],
    sections: [
      { h: 'The application-internal styles', md:
`**Layered** (presentation → business → persistence): simple, universally understood; risk is the "lasagna" where every change crosses all layers and business logic leaks into controllers or SQL. **Hexagonal (ports & adapters)** and **Clean architecture** share one rule: *dependencies point inward* — the domain core defines ports (interfaces); adapters (REST, Kafka, JPA) implement them at the edge. Payoff: the core is testable without infrastructure, and swapping Kafka for something else touches adapters only. Cost: more interfaces and mapping code — overkill for a CRUD admin tool, exactly right for a domain-rich banking service ([j1](#/lesson/j1) shows it in Spring).

**Pipes and filters**: independent processing stages connected by channels — the natural shape for file/stream processing (payment-file ingestion: parse → validate → enrich → screen → post), scaling and reordering stages independently.` },
      { h: 'The system-scale styles', md:
`**Space-based**: in-memory data grids with processing co-located, database asynchronously behind — for extreme low-latency/burst loads (trading, ticketing); costs consistency care and memory economics. **Cell-based**: partition the *entire stack* into independent cells (each serving a customer slice), limiting any failure's blast radius to one cell — how large platforms and increasingly banks cap correlated failure; costs cell routing, per-cell capacity management, and N-times deployment. **Serverless (FaaS)**: functions on managed platforms — genuine wins for spiky, event-triggered, glue workloads (file arrival → parse → publish); costs cold starts, execution limits, local-test friction, and per-invocation economics that flip against you at sustained volume. **SOA vs microservices** in one line: SOA centralised integration smarts in an ESB; microservices push smarts to the endpoints ("smart endpoints, dumb pipes") and make the pipe boring (Kafka, HTTP).` },
      { h: 'Multi-tenant architecture', md:
`One system, many customers (tenants). Isolation is a **spectrum you choose per layer**: shared everything with a tenant_id column (cheapest, weakest isolation — one bad query or bug leaks across tenants), shared app with schema-per-tenant or database-per-tenant (stronger data isolation, more ops), dedicated stack per tenant (strongest, most expensive — sometimes regulator-required for banks). Cross-cutting requirements people forget: per-tenant metrics/quotas (noisy-neighbour control), per-tenant keys/encryption, tenant-aware backups and restore ("restore *one* tenant to yesterday"), and tenancy in every authorisation decision. The [SaaS case study](#/case-study/cs8) builds one end-to-end.` }
    ],
    quiz: [], related: ['d9', 'j1', 'c1'], refs: ['Richards & Ford — Fundamentals of Software Architecture (style catalogue)', 'Cockburn — Hexagonal Architecture', 'Uncle Bob — Clean Architecture']
  },
  {
    id: 'd11', title: 'Cloud-Native and Kubernetes Architecture', level: 3, cat: 'cloud',
    difficulty: 'Advanced', duration: 50, prerequisites: ['d9'], glossCat: 'Kubernetes',
    objectives: ['Explain Kubernetes primitives an architect must know', 'Design workloads that are actually cloud-native', 'Decide what belongs on Kubernetes and what does not'],
    sections: [
      { h: 'Kubernetes for architects (not operators)', md:
`Kubernetes is a **declarative reconciliation engine**: you declare desired state (Deployments: N replicas of this container; Services: stable virtual IP/DNS over changing pods; Ingress/Gateway: HTTP routing in; ConfigMaps/Secrets: config injected, not baked into images; StatefulSets: stable identity/storage for the stateful few; HPA: scale on metrics; NetworkPolicies: which pods may talk — default-deny in banking; namespaces + RBAC + resource quotas: multi-team isolation). Controllers reconcile reality toward the declaration forever.

What the architect must design for: **pods are cattle** — they die and move, so workloads need real health probes (liveness/readiness — wrong probes cause self-inflicted outages), graceful shutdown (finish in-flight work on SIGTERM — critical for Kafka consumers to avoid rebalance chaos, [k4](#/lesson/k4)), externalised state, and resource requests/limits set from measurement, not folklore.` },
      { h: 'Cloud-native as a set of commitments', md:
`Cloud-native ≠ "runs in a container". The commitments: immutable images (never patch a running box), config from environment, horizontal scaling as the default reflex, infrastructure as code (the cluster itself is reproducible — [c1](#/lesson/c1)), observability built in (metrics/logs/traces per pod), and automation over runbooks-with-hands. Twelve-factor remains a decent checklist.

What *not* to put on Kubernetes without strong reasons: your Oracle RAC (managed database services or dedicated infrastructure usually beat DIY-stateful-on-k8s), anything the team can't operate at 3 a.m., and single small apps where a managed PaaS does the job — Kubernetes is a platform investment with a standing operational bill; it pays at fleet scale, not for one service.` }
    ],
    quiz: [], related: ['d12', 'c1'], refs: ['Kubernetes documentation — concepts', 'CNCF — cloud-native definition', '12factor.net']
  },
  {
    id: 'd12', title: 'API Gateways and Service Mesh', level: 3, cat: 'cloud',
    difficulty: 'Advanced', duration: 40, prerequisites: ['d11'], glossCat: 'Microservices',
    objectives: ['Separate gateway (north-south) from mesh (east-west) concerns', 'Decide when a mesh is worth its complexity', 'Avoid business logic in infrastructure'],
    sections: [
      { h: 'Gateway: the front door', md:
`An **API gateway** handles north-south traffic (clients → services): TLS termination, authentication (validate JWT/OIDC), coarse authorisation, rate limiting and quotas, routing/versioning, request validation, and API analytics. Variants: one enterprise gateway (governance-friendly, bottleneck-prone), gateway-per-domain (banking practice: external/partner/internal gateways with different policies — [b8](#/lesson/b8)), and [Backend-for-Frontend](#/pattern/bff) for client-shaped aggregation.

The classic failure: the gateway grows business logic (orchestration, data transformation with business meaning) and becomes an unversioned, team-less monolith in the middle — the ESB anti-pattern reborn. Keep gateways to *policy*; keep business logic in services with owners.` },
      { h: 'Mesh: the east-west fabric', md:
`A **service mesh** (Istio, Linkerd) injects a proxy sidecar next to every pod and moves service-to-service concerns into infrastructure: **mTLS everywhere** (encryption + workload identity — the big one for [Zero Trust](#/lesson/d15) and bank regulators), fine-grained traffic policy (retries, timeouts, outlier ejection, canary weighting), and uniform telemetry (per-hop metrics/traces for free).

Costs: a control plane to operate and upgrade (non-trivial), per-hop latency (small but real), debugging through proxies, and version-upgrade choreography across the fleet. Decision heuristic: **mesh earns its keep** when service count is high (dozens+), mTLS-everywhere is mandated, or traffic policy needs central enforcement across polyglot teams; below that, libraries (Resilience4j) plus gateway policies cover most needs with far less machinery. Don't adopt a mesh to fix a problem you could fix with three timeout settings.` }
    ],
    quiz: [], related: ['d11', 'd15'], refs: ['Istio / Linkerd docs', 'NIST SP 800-204 series — microservices security (mesh guidance)']
  },
  {
    id: 'd13', title: 'Kafka Fundamentals for Architects', level: 3, cat: 'kafka',
    difficulty: 'Advanced', duration: 55, prerequisites: ['a6'], glossCat: 'Kafka',
    objectives: ['Explain Kafka\'s storage and consumer model precisely', 'Reason about partitions, ordering, and consumer groups', 'Know what Kafka is and is not good for'],
    sections: [
      { h: 'The log, not a queue', md:
`Kafka is a **distributed, partitioned, replicated commit log**. Producers append records to **topics**; topics split into **partitions** (the unit of parallelism and ordering); each partition is an ordered, immutable sequence retained by **time/size policy or compaction** — consumption does *not* delete anything. **Consumers** track their own **offsets**; a **consumer group** shares a topic's partitions among members (each partition → exactly one member per group), so parallelism ≤ partition count. Multiple groups read the same data independently — this is the property that makes Kafka an *integration backbone* rather than a queue: the search indexer, the fraud engine, and the audit sink all read the same events at their own pace, and a new consumer next year replays history without asking the producer.

**Brokers** host partitions; each partition has a leader and followers (**replication factor**, typically 3); producers choose durability via acks (acks=all + min.insync.replicas=2 is the banking-grade setting). **Keys** route records to partitions (hash of key), giving **per-key ordering** — the design lever everything else hangs on ([k1](#/lesson/k1)).` },
      { h: 'The consumer group mechanics that bite', md:
`**Rebalancing**: when members join/leave (deploys! crashes!), partitions reassign; naive configurations pause the group and can cause duplicate processing around the switch — hence graceful shutdown, cooperative rebalancing, and [idempotent consumers](#/lesson/d3) as standard equipment. **Consumer lag** (how far behind the log end a group is) is *the* operational health metric — alert on lag growth, not absolute numbers. **Offsets commit** either automatically (risk: committed-but-not-processed or processed-but-not-committed windows) or manually after processing (at-least-once, the sane default).

Ecosystem in one line each: **Schema Registry** governs event contracts and compatibility ([k3](#/lesson/k3)); **Kafka Connect** moves data in/out with connectors (CDC via Debezium); **Kafka Streams** does stateful stream processing with exactly-once *within* the Kafka world ([k2](#/lesson/k2)).` },
      { h: 'What Kafka is not', md:
`Not a request/response medium (no reply semantics without contortions — use REST/gRPC); not a database (retention ≠ queryable system of record — though compacted topics make fine changelogs); not a job scheduler; not automatically "exactly-once end-to-end" ([k2](#/lesson/k2)); and not free — clusters, partitions, and schema governance carry real operational cost. "Kafka everywhere" is a listed [architect mistake](#/mistakes); the decision guides in the [Kafka designer](#/kafka-designer) train the *when*, not just the *how*.` }
    ],
    quiz: [], related: ['k1', 'k2', 'k3'], refs: ['Apache Kafka documentation', 'Confluent — Kafka: The Definitive Guide']
  },
  {
    id: 'd14', title: 'Event-Driven Architecture: Events, Commands, and Coupling', level: 3, cat: 'kafka',
    difficulty: 'Advanced', duration: 45, prerequisites: ['d13'], glossCat: 'Kafka',
    objectives: ['Distinguish events from commands and choose deliberately', 'Choose between notification and event-carried state transfer', 'Keep event-driven systems debuggable'],
    sections: [
      { h: 'Event vs command', md:
`An **event** states a fact: *CustomerAddressChanged* — past tense, owned by the producer, zero expectation about who reacts. A **command** requests an action: *ScreenCustomer* — directed, expects handling (and usually a result). The coupling directions are opposite: events couple consumers to the producer's contract; commands couple the sender to the handler's existence. Publishing "events" that are secretly commands ("OrderNeedsScreening" published *so that* screening acts) is coupling wearing a costume — name it honestly and manage it as a command, or restructure so screening subscribes to genuine facts.

**Domain events** (rich, internal to a bounded context, free to change) vs **integration events** (published contracts across contexts, versioned and governed — [k3](#/lesson/k3)): never leak your internal domain events as an enterprise contract; translate at the boundary.` },
      { h: 'Notification vs event-carried state transfer', md:
`**Event notification**: the event carries an ID and type ("Customer 42 updated"); consumers call back for data. Small, always-fresh, low leak risk — but creates read-traffic coupling and a availability dependency on the producer's API. **Event-carried state transfer**: the event carries the relevant state; consumers maintain local replicas. Autonomous consumers, no callback storm — but bigger payloads, staleness windows, versioning burden, and **sensitive data spread** (a serious banking concern — [k1's PII guidance](#/lesson/k1)). Hybrid (key fields + ID for the rest) is common and legitimate. Choose per event type based on consumer needs and data sensitivity, and record it in the [event catalogue](#/kafka-designer).` },
      { h: 'Keeping EDA debuggable', md:
`Event-driven systems fail differently: nothing errors — things just *don't happen*. Standard equipment: **correlation/causation IDs** in every event (trace a business flow across topics); an **event catalogue** with owners and schemas; **consumer-lag and missed-event monitoring** (detect "screening never consumed the update" — [b7 failure drills](#/lesson/b7)); [dead-letter topics with alerting and a replay path](#/pattern/dlq); and idempotent, order-tolerant consumers as a code standard, not an aspiration. Orchestration-vs-choreography guidance from [d2](#/lesson/d2) applies doubly here: past 3–4 steps, or when auditors ask "where is this payment?", explicit orchestration state beats archaeology across topics.` }
    ],
    quiz: [], related: ['d13', 'k1', 'd2'], refs: ['Fowler — What do you mean by "Event-Driven"?', 'Enterprise Integration Patterns — message semantics']
  },
  {
    id: 'd15', title: 'Security Architecture: IAM, OAuth2/OIDC, Zero Trust, Encryption', level: 3, cat: 'security',
    difficulty: 'Advanced', duration: 55, prerequisites: ['a8'], glossCat: 'Security',
    objectives: ['Design authentication and authorisation with standard protocols', 'Apply Zero Trust principles concretely', 'Make encryption and key management decisions'],
    sections: [
      { h: 'Identity: the modern stack', md:
`**Authentication** (who you are): humans via **OIDC** (an identity layer on OAuth 2.0 — ID tokens from a central IdP; SAML persists in enterprise SSO); services via **mTLS** (certificate = workload identity, often mesh-issued — [d12](#/lesson/d12)) or client-credentials OAuth. **Authorisation** (what you may do): **OAuth 2.0** delegates access via scoped tokens — resource servers validate JWTs (signature, expiry, audience — *always* audience) and enforce scopes; internally, **RBAC** (roles → permissions; simple, auditable, coarse) vs **ABAC** (policy over attributes: user, resource, context — powerful, harder to audit; banking uses both: RBAC for coarse entitlements + ABAC rules like "own-branch customers only").

Non-negotiables: **never build your own authentication**; centralise identity, keep authorisation decisions close to the data they protect; design **least privilege** and time-bound elevation for privileged access; log every authorisation denial (attack telemetry) and every privileged action (audit — [b3](#/lesson/b3)).` },
      { h: 'Zero Trust, concretely', md:
`Zero Trust = "the network location grants nothing": every request authenticated and authorised regardless of origin; workload identity everywhere (mTLS); **micro-segmentation** (NetworkPolicies/segments so lateral movement dies — assume the perimeter is already breached); short-lived credentials from a secrets platform (no static passwords in configs); device/user context in access decisions; and continuous verification rather than one login per day. It is a *direction*, adopted incrementally: mTLS + deny-by-default networking + centralised short-lived secrets already moves a platform most of the way. Interviewers want the concrete mechanisms, not the slogan.` },
      { h: 'Encryption and keys', md:
`**In transit**: TLS 1.2+ everywhere, mTLS where both parties need identity; internal traffic included (Zero Trust). **At rest**: platform/database encryption defends against lost disks; **field-level encryption or tokenisation** defends against application-level compromise and reduces exposure scope for high-value fields (PANs, national IDs) — with real key-management cost. **Key management**: keys live in KMS/HSM, never in code or config; rotation designed up front (envelope encryption makes it feasible); key custody = data custody (whoever holds keys can read data — relevant to cloud/residency debates). **Certificate management**: automate issuance/renewal (an expired cert is a self-inflicted outage with your name on it). Deeper threat-modelling practice: [d16](#/lesson/d16).` }
    ],
    quiz: [], related: ['d16', 'b3', 'j3'], refs: ['OAuth 2.0 / OIDC specifications', 'NIST SP 800-207 — Zero Trust Architecture', 'OWASP ASVS']
  },
  {
    id: 'd16', title: 'Threat Modelling, STRIDE, and Compliance by Design', level: 3, cat: 'security',
    difficulty: 'Advanced', duration: 45, prerequisites: ['d15'], glossCat: 'Security',
    objectives: ['Run a STRIDE threat-modelling session on a real design', 'Draw and use trust boundaries', 'Build privacy and compliance into architecture, not audits'],
    sections: [
      { h: 'Threat modelling: four questions', md:
`(1) **What are we building?** Draw the data-flow diagram with **trust boundaries** — every place data crosses between different privilege/trust levels (internet→gateway, app→database, us→vendor, zone→zone). Boundaries are where threats concentrate. (2) **What can go wrong?** Walk **STRIDE** per element: **S**poofing (fake identity), **T**ampering (modify data/messages), **R**epudiation ("I never did that" — countered by non-repudiable audit, [b3](#/lesson/b3)), **I**nformation disclosure, **D**enial of service, **E**levation of privilege. (3) **What do we do about it?** Mitigate (control), eliminate (remove the feature/data), transfer (vendor/insurance), or accept (documented, owned, time-boxed). (4) **Did we do it?** Verify: tests, scans, pentest scope tied to the model.

Do this **at design time** — an hour with the container diagram and STRIDE finds issues that cost 100× post-deployment. Practise on the [screening platform threat-model exercise](#/lab/lab19).` },
      { h: 'Attack surface thinking', md:
`Every interface is attack surface: APIs (authN/Z, input validation, rate limits), events (can a compromised producer poison a topic? topic ACLs), files (parser vulnerabilities, path traversal), admin planes (the most privileged, least reviewed interface — Kubernetes API, database consoles), and **dependencies** (supply chain: pin, scan, verify provenance; an npm/maven package is code you run with your credentials). Reduce surface by removing, not just protecting: unused endpoints, over-broad scopes, data you didn't need to store ([privacy by design's](#/lesson/b3) data minimisation — less data, less breach).` },
      { h: 'Compliance by design', md:
`Compliance retrofits are the most expensive kind. Build in from the architecture stage: **privacy by design** (minimise collection, purpose-bind usage, retention schedules with automated deletion, subject-access/erasure paths — hard with event logs, plan crypto-shredding); **security by design** (the controls above as requirements with NFR-style measures, not a final review gate — a listed [architect mistake](#/mistakes)); **auditability by design** ([a9](#/lesson/a9)); and evidence generation as a by-product (control execution logs, approval records) so audits read from the system instead of interviewing exhausted engineers. In banking this trio is table stakes — [b3](#/lesson/b3) extends it with banking-specific controls.` }
    ],
    quiz: [], related: ['d15', 'b3'], refs: ['Shostack — Threat Modeling: Designing for Security', 'OWASP Threat Modeling', 'Microsoft STRIDE documentation']
  }
  ]);
})(window.SAA.data);
