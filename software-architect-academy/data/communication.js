/* communication.js — audience translations, answer structures, exercises */
(function (D) {
  'use strict';
  D.communication = {
    scenario: 'The bank is replacing point-to-point customer-data integration with an event backbone (Kafka): party service publishes customer changes; screening, CRM and audit consume them. Transactional outbox guarantees no lost events; a reconciliation control detects gaps.',
    audiences: [
      { who: 'Developers', cares: 'Contracts, local development, failure handling, testing, what changes in their daily work.',
        vocab: 'Full technical vocabulary. Avoid: business fluff, strategy talk without concrete impact.',
        example: 'Your service consumes customer.events.v1 — Avro, FULL compatibility, key = partyId so per-customer order holds. Implement the inbox pattern (there\'s a starter in the template repo); dedupe retention is 7 days. Contract tests run in CI; breaking the schema fails your build, not their weekend. DLT alerts route to your team channel with a replay runbook.' },
      { who: 'Testers / QA', cares: 'What to verify, how to simulate failures, test data, what "correct" means under eventual consistency.',
        vocab: 'Behavioural language: given/when/then, observable outcomes. Avoid: implementation internals they cannot observe.',
        example: 'Key scenarios: a customer update must appear in screening within 60 s (freshness SLO); the same event delivered twice must produce exactly one screening request; events arriving out of order must not overwrite newer data. Testcontainers gives you real Kafka locally; the chaos suite can delay and duplicate deliveries on demand.' },
      { who: 'Operations', cares: 'Dashboards, alerts, runbooks, capacity, what breaks and how to fix it at 3 a.m.',
        vocab: 'Signals, thresholds, procedures. Avoid: design rationale beyond what aids diagnosis.',
        example: 'Three dashboards: consumer lag per group (alert on growth, not absolutes), outbox backlog (rows older than 5 min pages), DLT depth (any message pages with a runbook link). Rebalance storms usually mean a deploy without graceful shutdown — the runbook\'s first check. Capacity: month-end runs 4× volume; the consumers autoscale on lag.' },
      { who: 'Cybersecurity', cares: 'Data exposure, identities, encryption, attack surface, evidence.',
        vocab: 'Controls, boundaries, classifications. Avoid: performance talk unless security-relevant.',
        example: 'Events carry party IDs and change types — PII stays in the party service, fetched via authorised APIs (notification pattern). Topics have per-principal ACLs; the broad stream has no names or addresses. All traffic mTLS via the mesh; the restricted PII stream has five consumers, each justified and access-audited. Threat model on file — tampering and disclosure were the drivers of these choices.' },
      { who: 'Product owners', cares: 'Features enabled, timelines, user-visible behaviour, what becomes possible.',
        vocab: 'Capabilities and outcomes. Avoid: mechanism talk (outbox, partitions).',
        example: 'After this, a customer\'s address change reaches screening and CRM in under a minute instead of overnight — so compliance checks run same-day and your onboarding flow can show live status. New consumers (say, a personalisation feature) plug in without a project on the party team\'s side. Cost: two sprints of platform work before feature work resumes.' },
      { who: 'Project managers', cares: 'Dependencies, sequence, risks to the plan, who is blocked by what.',
        vocab: 'Milestones, dependencies, risk. Avoid: architecture philosophy.',
        example: 'Sequence: schema agreed (week 1, blocks everything) → party service publishes (week 3) → screening consumes in shadow mode (week 5) → cutover (week 7) with the old feed running in parallel until reconciliation is clean for two weeks. Risk: the schema-agreement workshop needs all three consuming teams — that is the critical-path meeting to protect.' },
      { who: 'Risk & compliance', cares: 'Control gaps, evidence, regulatory exposure, what could go wrong and how it is detected.',
        vocab: 'Controls (preventive/detective), evidence, exposure. Avoid: technology names without control meaning.',
        example: 'Two controls address the risk of a customer change never being screened: preventive — the outbox mechanism makes losing an event technically impossible if the database commit succeeded; detective — a daily reconciliation compares customer changes to screening requests, with breaks worked within one business day and evidenced. The audit trail records which data version was screened against which list version.' },
      { who: 'Senior management', cares: 'Outcome, cost, risk, decision needed. Thirty seconds of attention.',
        vocab: 'Money, risk, time, customers. Nothing else.',
        example: 'We\'re replacing 14 fragile point-to-point customer-data feeds with one reliable distribution backbone. Compliance checks move from overnight to same-minute, and two audit findings close. Cost: 6 weeks across three teams, ~€8k/year infrastructure. Risk of not doing it: the next missed feed is a screening gap — the kind that becomes a finding. I need the three teams\' capacity protected for six weeks.' },
      { who: 'Vendors', cares: 'Interface contracts, SLAs, boundaries of responsibility.',
        vocab: 'Contracts and obligations. Avoid: internal architecture beyond the interface.',
        example: 'You will receive screening requests via REST at up to 100 req/s sustained with an Idempotency-Key header — duplicate keys must return the original result. We need p99 < 2 s, 99.9% monthly availability, list-version in every response, and delta files for list updates by 05:00 CET. Our retry policy: 3 attempts with backoff; beyond that, requests queue on our side.' },
      { who: 'Architecture review board', cares: 'Drivers, options considered, trade-offs, risks, conformance to standards.',
        vocab: 'ADR structure. Avoid: sales pitch — boards trust shown work.',
        example: 'Driver: eliminate silent customer-data divergence (2 incidents, 1 audit finding). Options: (A) harden point-to-point ×14, (B) event backbone with outbox — recommended, (C) nightly batch sync — rejected on freshness. Trade-off accepted with B: eventual consistency (≤60 s) and consumer idempotency obligations, versus the eliminated loss class. Conforms to the integration standard; one exception requested: PII-stream retention 3 days vs standard 7, rationale attached. Review date set for +12 months.' }
    ],
    structures: [
      { name: 'STAR (behavioural answers)', md:
`**S**ituation — one sentence of context. **T**ask — what you were responsible for. **A**ction — what *you* did (not the team; interviewers listen for "I"). **R**esult — measurable outcome, plus one reflection line.

Discipline: 30% situation/task, 50% action, 20% result. The classic failure is drowning in situation and rushing the action.` },
      { name: 'CAR (compact variant)', md:
`**C**ontext → **A**ction → **R**esult. Same skeleton, faster — right for follow-ups and second examples where the full STAR would drag.` },
      { name: 'Problem–Decision–Impact–Reflection (architecture decisions)', md:
`For "tell me about a decision" questions: the **problem** with its drivers, the **decision** with the options that lost, the **impact** measured honestly (including negatives), and the **reflection** — what you would do differently. That last quarter is where senior candidates separate: it shows the learning loop, not just the war story.` }
    ],
    exercises: [
      { task: 'Explain the event-backbone solution above in ONE sentence for an executive.',
        model: `"We're replacing 14 fragile customer-data feeds with one reliable pipeline, so compliance checks run in minutes instead of overnight and a whole class of audit findings disappears — for six weeks of work." One sentence carries: what changes, the business benefit, the compliance angle, and the price.` },
      { task: 'Now explain the same solution in one paragraph for a new developer joining a consuming team.',
        model: `"Customer changes are published to customer.events.v1 — Avro-governed, keyed by partyId so each customer's events stay ordered. You consume with your own group, implement the inbox pattern for dedupe (redelivery is normal, duplicates are guaranteed eventually), and tolerate unknown fields. If your processing fails transiently it goes through retry topics; poison messages land in your DLT, which pages you with a runbook. Schema changes that would break you fail the producer's build, not your consumer — that's what the registry compatibility check is for."` },
      { task: 'Write the risk statement for the situation BEFORE this solution existed (for the risk register).',
        model: `"Risk: customer data changes propagate through 14 unmonitored point-to-point feeds; a silent feed failure means downstream systems (including sanctions screening) operate on stale data with no detective control. Likelihood: medium (2 occurrences in 18 months). Impact: high — potential screening gap constitutes regulatory exposure. Mitigation: event backbone with guaranteed publication (preventive) + daily reconciliation (detective), target Q3. Owner: Head of Integration. Accepted interim: manual weekly spot checks."` },
      { task: 'Prepare the 5-minute version as five bullet headlines you would speak to.',
        model: `1) Today: 14 point-to-point feeds, two silent failures in 18 months, one audit finding. 2) Proposal: one event backbone; publisher guarantees delivery via outbox; consumers independent. 3) What it buys: same-minute propagation, new consumers without projects, the loss-class eliminated plus a detective control. 4) Costs & trade-offs: six weeks across three teams; consumers must handle duplicates — a coding standard we'll template. 5) Ask: schema workshop next week, capacity protected, decision today.` },
      { task: 'A board member asks: "Why not just fix the existing feeds?" Answer in three sentences.',
        model: `"Hardening 14 feeds means paying the reliability cost 14 times and still owning 14 different failure modes — and feed 15 arrives next quarter with the same problem. The backbone pays the reliability cost once, centrally, and every future consumer inherits it for free. We scored both options: hardening is cheaper this quarter and more expensive every quarter after."` },
      { task: 'Turn the core decision into a mini-ADR (context, decision, consequences) in under 120 words.',
        model: `**Context:** Customer changes reach 14 consumers via unmonitored point-to-point feeds; silent failures caused screening gaps (audit finding 2025-07). **Decision:** Publish customer lifecycle events on a governed Kafka stream (customer.events.v1, keyed by partyId), with transactional outbox at the party service and mandatory idempotent consumption. **Consequences:** (+) event loss eliminated as a class; new consumers self-serve; daily reconciliation provides detective control. (−) consumers accept eventual consistency (≤60 s) and must implement inbox dedupe; the team takes on Kafka operational ownership. Review: 2027-06. Rejected: per-feed hardening (cost scales with feed count), nightly batch (freshness fails compliance need).` }
    ]
  };
})(window.SAA.data);
