/* reviews.js — architecture review simulator scenarios.
   Each: description of a flawed proposal, real findings (with severity/risk/remediation), decoys, model priority. */
(function (D) {
  'use strict';
  function F(t, s, r, m) { return { title: t, severity: s, risk: r, remediation: m }; }

  D.reviewScenarios = [
  { id: 'rv1', title: 'The Onboarding "Microservices" Proposal',
    description:
`A team proposes splitting customer onboarding into six microservices: form-service, validation-service, document-service, screening-service, approval-service and account-service. All six share one Oracle schema "to keep data consistent". The flow is a synchronous chain: form → validation → document → screening → approval → account, each calling the next via REST. No timeouts are configured ("the calls are internal"). The screening-service calls the external vendor synchronously inside the chain. Deployment is coordinated: all six release together every second Thursday.`,
    findings: [
      F('All six services share one database schema', 'Critical', 'Schema coupling makes services a distributed monolith: any table change is a six-team negotiation; services can corrupt each other\'s data and bypass each other\'s rules.', 'Database per service with defined ownership — or honestly merge back into a modular monolith, which this actually is.'),
      F('Long synchronous chain (6 hops) including an external vendor', 'Critical', 'Availability multiplies: six 99.9% services + a vendor yield ~99.2% before counting latency stacking; the vendor\'s slowness becomes everyone\'s outage.', 'Break the chain: orchestrate as an async workflow with explicit states; the vendor call gets queue-buffering and a breaker.'),
      F('No timeouts on inter-service calls', 'Critical', 'A single slow call chains thread-pool exhaustion backwards through all services — the textbook cascading failure.', 'Timeouts on every remote call, sized from callee p99; bulkheads per dependency.'),
      F('Lockstep fortnightly releases of all six services', 'High', 'Independent deployability — the main microservice benefit — does not exist; all cost, no payoff.', 'Contract tests + independent pipelines; or accept the monolith conclusion.'),
      F('No idempotency anywhere in the flow', 'High', 'Retries or double-submits create duplicate applications, duplicate screening requests, potentially duplicate accounts.', 'Idempotency keys at the API; business-key dedupe (applicant) internally.'),
      F('Six services for one team and one business capability', 'Medium', 'Operational surface (6 pipelines, 6 on-call surfaces) for a single team exceeds its cognitive load without any organisational driver.', 'A modular monolith with enforced module boundaries fits the team; extract later under real pressure.')],
    decoys: [
      'REST was chosen instead of gRPC for the internal calls',
      'The services are written in Java 17 rather than Java 21',
      'Oracle is used instead of PostgreSQL',
      'The team has no dedicated frontend framework standard'],
    priority: 'Fix the availability killers first (timeouts — cheap and immediate), then the structural call: merge to a modular monolith or genuinely decouple (own data, async workflow). The shared schema and sync chain are the load-bearing findings; release trains and idempotency follow from the structural decision.' },

  { id: 'rv2', title: 'The Payment Event Pipeline',
    description:
`Payments are processed by a service that writes to its database and then publishes PaymentPosted to Kafka (in that order, two separate operations). Consumers include the ledger-sync, notification and fraud services, all in **one consumer group** "to save resources". The topic has 3 partitions keyed by a random UUID "for even distribution". Retries are infinite with a fixed 1-second interval. There is no dead-letter topic ("we retry until it works") and no reconciliation ("Kafka is reliable"). Schema is raw JSON with no registry; the payments team "coordinates changes by email".`,
    findings: [
      F('Dual write: DB commit then Kafka publish, non-atomic', 'Critical', 'A crash between the two silently loses events: ledger, fraud and notifications never learn about real payments; books diverge undetectably.', 'Transactional outbox with a monitored relay (poller or Debezium).'),
      F('One consumer group shared by three different consumers', 'Critical', 'Ledger, notification and fraud COMPETE for messages — each payment reaches only one of them. This is a correctness bug, not a tuning choice.', 'One group per logical consumer; instances scale within each group.'),
      F('Random UUID event key', 'High', 'No per-payment or per-account ordering: state transitions can be consumed out of order; fraud velocity logic and ledger sequencing break.', 'Key by paymentId (state-machine order) or accountId (per-account order), chosen by consumer needs.'),
      F('Infinite fixed-interval retries, no DLT', 'High', 'A poison message blocks its partition forever; fixed-interval retries synchronise into load spikes; failures are invisible.', 'Tiered retries with backoff; DLT with alerting, owner, runbook and replay path (mind ordering on the payment stream — prefer block-and-alert there).'),
      F('No reconciliation between payments and events', 'High', 'When (not if) divergence happens, nothing detects it; in banking this is a missing detective control, i.e. an audit finding.', 'Daily (hourly for payments) reconciliation: DB state changes vs events consumed, with a break workflow.'),
      F('Ungoverned JSON schema, changes by email', 'Medium', 'The first silent field change corrupts a consumer at 2 a.m.; email coordination does not scale past two teams.', 'Schema registry (Avro/Protobuf) with FULL compatibility enforced in CI, or at minimum consumer contract tests.')],
    decoys: [
      'Kafka is self-managed instead of using a cloud provider\'s managed service',
      'Only 3 partitions were configured (may be perfectly adequate for the volume)',
      'The consumers are written in different languages',
      'Notifications are sent by email rather than push'],
    priority: 'The consumer-group bug first — payments are being missed by two of three consumers today. Then the dual-write (outbox), because silent event loss compounds daily. Ordering key and DLT next; schema governance and reconciliation close the control gaps.' },

  { id: 'rv3', title: 'The Screening Platform Refresh',
    description:
`A proposal to modernise sanctions screening: the vendor is called synchronously during onboarding with a 60-second timeout and no fallback ("screening is mandatory, so we must wait"). Screening results are stored, but hit details are also published to a company-wide Kafka topic consumed by 14 teams "for transparency" — payloads include full match details and party names. List updates are applied by a script a compliance officer runs from her laptop when the vendor emails a new file. If case creation fails after a hit, the error is logged at WARN. Decisions store the outcome but not the list version. There is no re-screening when customer data changes ("they were screened at onboarding").`,
    findings: [
      F('No re-screening on customer data changes or list updates', 'Critical', 'The book silently rots: a customer renamed after onboarding, or a new list entry, is never re-checked — a core compliance control simply absent.', 'Event-driven re-screening on party changes + delta-driven re-screening on list updates (restartable batch).'),
      F('Screening hit details broadcast to 14 teams with full PII', 'Critical', 'Being a potential sanctions match is toxic data; 14 consumer stores now hold it. Breach surface and banking-secrecy exposure are enormous.', 'Restricted hits topic with minimal consumers and ACLs; broad events carry outcome flags only, details via authorised API.'),
      F('Decisions stored without list version', 'High', '"Prove what you screened against" cannot be answered — evidence requirement failed; re-screening scope after list issues cannot be computed.', 'Record list version, matching-logic version and input-data version on every decision.'),
      F('Hit-without-case failures logged at WARN only', 'High', 'A match nobody investigates is the worst screening failure mode; here it is a log line nobody reads.', 'Idempotent case creation with uniqueness on hitId, DLT + paging on failure, plus hit↔case reconciliation.'),
      F('Manual laptop-based list updates', 'High', 'Key-person dependency, no integrity verification, no evidence of when lists were applied, fails silently on holiday.', 'Automated ingestion with checksums, version tracking, alerting on missed updates, and applied-version evidence.'),
      F('60-second synchronous vendor wait with no fallback', 'Medium', 'Onboarding hangs for a minute per applicant when the vendor slows; a vendor outage stops onboarding entirely with no queue.', 'Timeout ~5s + breaker + durable queue; business-agreed policy for pending screening (block or provisional).')],
    decoys: [
      'The vendor API uses XML rather than JSON',
      'Screening results are stored in Oracle rather than PostgreSQL',
      'The case-management UI is a legacy Angular version',
      'The vendor is hosted in the EU'],
    priority: 'Re-screening absence is the finding to lead with — it is a regulatory control gap live today. The PII broadcast is the second headline (breach surface). Evidence (list versions) and the hit-without-case path complete the compliance story; vendor-call resilience is important but a smaller fire.' },

  { id: 'rv4', title: 'The "Cloud-Ready" Lift and Shift',
    description:
`A department moved its loan-servicing system to the cloud: the same three VMs, now on EC2, in one availability zone ("latency between zones worried us"). The Oracle database runs on one of the VMs with nightly backups to the same zone's storage. Secrets are in a config file on each VM ("the VPC is private"). Deployment is manual via SSH ("we know the servers"). RTO and RPO were never defined ("we have backups"). Monthly cost tripled versus on-prem and nobody knows why. The internet-facing app server and the database share a subnet with no internal firewalling.`,
    findings: [
      F('Single availability zone for everything', 'Critical', 'A zone event takes the whole system down — cloud\'s primary resilience primitive is unused; this is on-prem risk at cloud prices.', 'Multi-AZ: spread instances, move the DB to a managed multi-AZ service.'),
      F('Backups stored in the same zone as the database', 'Critical', 'The scenario backups exist for (zone/storage failure) also destroys the backups; effective RPO is unbounded.', 'Cross-zone (and ideally cross-region) backup storage; restore testing.'),
      F('Secrets in plaintext config files', 'High', '"Private VPC" is not a secrets strategy: any instance compromise or AMI copy leaks credentials; rotation is impossible.', 'Secrets manager with runtime injection and rotation; remove secrets from disk and images.'),
      F('Flat network: internet-facing app and DB in one subnet', 'High', 'One compromised app server has direct network reach to the database — no defence in depth.', 'Subnet tiers with security groups: public ingress → app tier → data tier, default-deny.'),
      F('No defined RTO/RPO', 'High', 'Recovery capability is unknown and untested; "we have backups" has never been timed or restored.', 'Define RTO/RPO with the business, test a restore, document the achieved numbers.'),
      F('Manual SSH deployment, no IaC', 'Medium', 'Config drift guaranteed; environments unreproducible; the next migration (or recovery!) is archaeology.', 'IaC for infrastructure, pipeline deploys, immutable images.'),
      F('Unexplained 3× cost with no allocation', 'Medium', 'Untagged, unrightsized lift-and-shift: paying cloud premiums for on-prem architecture with none of the benefits.', 'Tagging, rightsizing from utilisation data, schedules for non-prod, storage lifecycle policies.')],
    decoys: [
      'EC2 was chosen over containers/Kubernetes',
      'The team did not adopt a service mesh',
      'Oracle was retained instead of migrating to an open-source database',
      'The application is a monolith'],
    priority: 'Backups-in-zone plus single-AZ is an existential pairing — fix the backup location this week, multi-AZ this quarter. Secrets and network segmentation are the security fires. RTO/RPO definition frames all further investment; IaC and cost hygiene follow. Note what is NOT a finding: EC2, Oracle and the monolith are legitimate choices — modernisation theatre is not the remediation.' },

  { id: 'rv5', title: 'The Customer 360 Data Hub',
    description:
`A "Customer 360" hub is proposed: a new central database that copies customer data nightly from the CRM, the core, and the onboarding system via SQL extracts directly against their production tables. Any team may write to the hub too ("it's everyone's data"). The hub then syncs corrections BACK to the source systems ("bi-directional keeps everyone aligned"). There is no record of which system wins on conflict. GDPR deletion requests are handled "in the sources" — the hub is not in scope, "it's just a copy". Marketing queries run directly on the hub, which is also planned to serve the new mobile app's customer screens in real time.`,
    findings: [
      F('Bi-directional sync with no conflict rules or master', 'Critical', 'Two-way sync between four systems with no defined system of record guarantees divergence and oscillating corrections; nobody can answer "which value is true".', 'Define one system of record per attribute set; the hub becomes a read-only derived store; corrections flow to the SoR only, via its API.'),
      F('Anyone may write to the hub', 'Critical', 'Unowned writes destroy any hope of data quality or lineage; the hub becomes a second (contested) master by stealth.', 'Read-only consumers; a single owning team; writes only via the pipeline from sources.'),
      F('Hub excluded from GDPR deletion scope', 'High', '"Just a copy" holds personal data: deletion requests that skip it leave the data live — a direct compliance breach.', 'Include the hub (and its backups) in subject-rights flows; propagate deletions from the SoR.'),
      F('Raw SQL extracts against production tables', 'High', 'Couples the hub to every source schema (breaks on any change), adds unmanaged load to production databases, and bypasses source business rules and masking.', 'CDC or published events/APIs with governed contracts; transforms at the boundary.'),
      F('Nightly batch feeding a real-time mobile use case', 'Medium', 'The mobile app will show day-old data and the hub\'s batch window becomes a customer-visible freshness problem.', 'Either accept and label the staleness, or feed the serving layer from CDC/events with a stated freshness SLO.'),
      F('Analytics and operational serving on one store', 'Medium', 'Marketing table scans will contend with the app\'s latency-sensitive reads.', 'Separate read models: warehouse-style for analytics, an operational serving view for the app.')],
    decoys: [
      'The hub uses PostgreSQL rather than a document database',
      'Customer IDs differ across the source systems (a reality every MDM design must handle, not a flaw of this one)',
      'The nightly job runs at 02:00 rather than midnight',
      'The team plans to use dbt for transformations'],
    priority: 'Stop the bi-directional sync before it launches — divergence is irreversible reputationally. Establish SoR-per-attribute and make the hub read-only (one decision solves findings 1 and 2). GDPR scope is the compliance fire. Then re-plumb ingestion (CDC/events) and split the serving concerns.' },

  { id: 'rv6', title: 'The Instant Payments Bolt-On',
    description:
`To join the instant-payments scheme (24/7, confirm-or-reject in 10 seconds), the bank proposes reusing the existing batch payment engine: instant payments are written to the same intake table and a poller picks them up "every few seconds". Sanctions screening reuses the overnight batch process, "prioritised" for instant items. The core posts balances only during business hours, so instant payments received at night are approved against the morning's balance snapshot. Maintenance windows (Sunday 00:00–04:00) are retained — "volume is low then". If the 10-second scheme deadline is missed, the payment "probably gets rejected by the scheme, we should check". There is one node for the new intake adapter ("we can add more later").`,
    findings: [
      F('Overnight-batch screening reused for a 10-second SLA', 'Critical', 'Sanctions screening cannot take hours on an instant rail; either payments go out unscreened (regulatory breach) or all miss the deadline.', 'Inline screening with a strict latency budget: pre-computed party status + fast payment-data checks, tight vendor SLA.'),
      F('Night-time approvals against stale morning balances', 'Critical', 'Authorising against a day-old snapshot invites overdrafts and double-spends across the unposted window.', 'Shadow-balance/ODS maintained in real time from accepted payments, with a business-agreed risk policy for the residual window.'),
      F('Retained maintenance windows on a 24/7 scheme', 'High', 'Four hours of weekly scheme downtime violates scheme rules and customer expectations.', 'Zero-downtime deployment (rolling/blue-green) and elimination of planned windows for the instant path.'),
      F('Unknown behaviour on missed scheme deadline', 'High', '"Probably rejected, we should check" for a money-moving edge is not a design; timeout states must resolve definitively.', 'Explicit state machine incl. scheme-timeout handling and status inquiry; customers never see "maybe".'),
      F('Single-node intake adapter', 'High', 'The entry point of a 24/7 payment rail is a single point of failure.', 'At least active-active pair across zones with health-checked routing.'),
      F('Polling a batch intake table for instant payments', 'Medium', 'Poll interval eats seconds of a 10-second budget and the shared table couples instant latency to batch load.', 'Dedicated event-driven intake path for the instant rail; keep batch separate.')],
    decoys: [
      'The scheme adapter is bought from a vendor rather than built',
      'ISO 20022 messages are translated to an internal canonical format',
      'The batch engine remains in place for regular SEPA payments',
      'Java was chosen over a more "real-time" language'],
    priority: 'Screening and stale-balance authorisation are the two findings that make the design non-launchable (regulatory + financial loss). The deadline-miss behaviour and SPOF follow. Structural recommendation: a dedicated instant-payments path sharing the batch engine\'s periphery, not its spine.' },

  { id: 'rv7', title: 'The Vendor-Locked Wealth Platform',
    description:
`A wealth-management platform will be bought from a vendor. The proposal: adopt the vendor\'s data model as the bank\'s canonical customer model ("saves mapping work"); let the vendor host it in their single data centre abroad ("their standard offering"); customise workflows heavily in the vendor\'s proprietary scripting language (an estimated 4,000 script-lines, "their consultants will write it"); interface everything else point-to-point to the vendor\'s internal database views, which the vendor "generally keeps stable". The contract has no data-export clause beyond "PDF statements on request", no renewal price cap, and support is best-effort. Exit was not analysed: "we don\'t plan to leave".`,
    findings: [
      F('No data-export capability in the contract', 'Critical', 'Client data effectively imprisoned: exit cost approaches infinite, and regulators increasingly require demonstrable exit plans for material outsourcing.', 'Contractual machine-readable full export (schema-documented), tested annually; exit-assistance obligations; negotiate before signature — leverage never improves.'),
      F('Vendor\'s single foreign data centre for client data', 'Critical', 'Residency/banking-secrecy exposure plus a single-site availability risk for the whole wealth business.', 'Residency review with legal; require in-jurisdiction or multi-site hosting tier; document data-transfer basis.'),
      F('Adopting the vendor data model as the bank\'s canonical model', 'High', 'The vendor\'s historical accidents colonise every integrated system; switching vendors later means re-modelling the estate.', 'Anti-corruption layer: bank-owned canonical model, mapped to the vendor at the boundary.'),
      F('4,000 lines of proprietary-language customisation', 'High', 'Customisation debt: upgrades become projects, the consultants become permanent, and the "product" is now bespoke software with a licence fee.', 'Configuration-first policy; build genuinely custom needs OUTSIDE the product against its APIs; cap customisation contractually.'),
      F('Integration against vendor internal database views', 'High', '"Generally stable" internal views are an unversioned contract; every vendor patch risks breaking every integration.', 'Integrate only via supported, versioned APIs/exports; contract the interface stability.'),
      F('No renewal cap with high switching cost', 'Medium', 'The vendor can reprice at renewal to just under the (enormous) exit cost — a predictable commercial trap.', 'Renewal caps and multi-year pricing negotiated now, alongside the export clause.')],
    decoys: [
      'Buying instead of building the wealth platform (the buy itself is reasonable for a commodity capability)',
      'The vendor\'s technology stack is .NET while the bank is Java-centric',
      'The vendor release cycle is quarterly',
      'Consultants are involved in the implementation'],
    priority: 'Contract findings first — export, residency, renewal caps are negotiable only before signature and irreversible after. Then the architectural insulation: ACL and API-only integration determine whether the bank can ever leave. Customisation policy prevents the debt from accumulating. Note: buying is fine; buying naked is the finding.' },

  { id: 'rv8', title: 'The Notification "Quick Win"',
    description:
`Notifications (email/SMS/push) are sent inline by every service: the payment service calls the email provider directly after posting, onboarding calls SMS mid-workflow, and so on across nine services — each with its own provider account and credentials in application.yml. No retry exists ("the provider is reliable"), no dedup ("why would it send twice?"), no preference/consent checks ("marketing handles that somewhere"), and regulatory notices share the same best-effort path as marketing. During last month\'s provider outage, payment posting FAILED because the email call threw — payments and notifications share fate. One service logs full message bodies including balances.`,
    findings: [
      F('Notification calls inline in business transactions (shared fate)', 'Critical', 'A notification-provider outage stopped payment posting — a decorative feature took down a core function; coupling direction is exactly backwards.', 'Fire-and-forget via durable events: business transaction commits, notification service consumes and delivers async.'),
      F('Regulatory notices on a best-effort, unevidenced path', 'High', 'Some notices are legally required with proof-of-delivery expectations; today they can silently fail with no evidence either way.', 'Delivery-state tracking, retries, escalation channel, and per-notice evidence retention in the notification domain.'),
      F('No consent/preference checking anywhere', 'High', 'Marketing to opted-out customers is a direct compliance violation; nine services each "handling it somewhere" means nowhere.', 'Central preference/consent store consulted by the notification service — one enforcement point.'),
      F('Message bodies with balances logged in plaintext', 'High', 'PII and financial data in logs: classification breach, banking-secrecy exposure, and a gift to any log-access attacker.', 'Allowlist-based structured logging; message bodies never logged; scanner in CI.'),
      F('No retries or dedupe for deliveries', 'Medium', 'Transient provider blips silently drop customer communication; naive retry-adding later will double-send without dedupe.', 'Notification service with retry tiers, idempotency keys per logical notification, DLT with alerting.'),
      F('Nine provider accounts with credentials in application.yml', 'Medium', 'Credential sprawl in source control; rotation practically impossible.', 'Central notification service, vault-issued credentials, provider failover in one place.')],
    decoys: [
      'Email is used where push might be more modern',
      'The provider is a single vendor (multi-provider failover is a nice-to-have AFTER centralisation)',
      'Templates are stored in the database rather than in git',
      'SMS costs are not volume-discounted'],
    priority: 'Decouple the shared fate first — it is a live availability defect on the payment path. Then the compliance pair: regulatory-notice evidence and consent enforcement. The structural remedy for almost everything is one owned notification domain consuming events; sequence the rest inside that move.' },

  { id: 'rv9', title: 'The Legacy Modernisation Big Bang',
    description:
`The 19-year-old branch-banking monolith will be rewritten as microservices over 24 months, released "all at once at the end, because the systems are too entangled for partial migration". Requirements are being reverse-engineered "from the code, since documentation is outdated". The old system will be frozen (no changes for two years) "to hold the target still". Data migration is scheduled for the final month, and the plan\'s rollback section reads "N/A — the old system will be decommissioned that weekend". Twelve teams have been hired; the domain model was drawn by the architecture group in six weeks without business workshops. Success is defined as "feature parity".`,
    findings: [
      F('Big-bang cutover with rollback "N/A"', 'Critical', 'A single weekend bets the branch business on the first production run of two years of untested-in-anger software, with no way back.', 'Strangler approach: slice-by-slice migration with parallel-run reconciliation and per-slice rollback; the facade goes in first.'),
      F('Two-year change freeze on the live system', 'Critical', 'The business cannot freeze for two years (regulation alone forbids it); the freeze will break, the target will drift, and the "parity" goal becomes a moving fiction.', 'Plan for coexistence and dual-track change; freezing is not an option, so the migration must absorb change.'),
      F('Data migration scheduled once, at the end', 'High', 'Data quality surprises (guaranteed in a 19-year system) will be discovered in the final month with no room to react.', 'Profile data now; migrate/reconcile iteratively per slice; rehearse repeatedly.'),
      F('Domain model designed without business involvement', 'High', 'Reverse-engineering code recovers the old system\'s accidents, not the business\'s language; boundaries will be wrong and expensive.', 'Event-storming workshops with business experts; boundaries from language, validated by slices.'),
      F('"Feature parity" as the success definition', 'Medium', 'Parity replicates 19 years of workarounds nobody wants, inflates scope, and delivers zero business value until 100% done.', 'Value-based slicing: each migrated slice must deliver measurable improvement; retire features consciously.'),
      F('Twelve teams staffed before boundaries are validated', 'Medium', 'Conway\'s Law will freeze the six-week guess: twelve teams will produce twelve services whether or not the domain has twelve seams.', 'Start with 2–3 teams on the first slices; scale staffing as validated boundaries emerge.')],
    decoys: [
      'Microservices as the target style (defensible for a multi-team estate — the flaw is the path, not the destination)',
      'The choice of Kubernetes as the runtime platform',
      '24 months duration (long programmes exist; unphased ones fail)',
      'Hiring external engineers for the programme'],
    priority: 'The big-bang-plus-freeze combination is the programme-killer — reshape to strangler slices before any other spend. Data profiling starts immediately (longest lead time). Business workshops fix the boundary risk before twelve teams concretise it. Everything else inherits from the phasing decision.' },

  { id: 'rv10', title: 'The Fraud Scoring Platform',
    description:
`Real-time fraud scoring will run on the payment path. The model is retrained weekly and deployed directly to production "because fraud moves fast" — no evaluation gate, no versioning ("we keep the latest"). Scores above a threshold auto-block payments; the threshold is tuned in production by the data-science team "based on feel". Blocked customers are told "technical error". Features are computed by querying the core banking DB synchronously per payment (adding ~400 ms). Decisions are not logged with their features or model version ("storage costs"). The fallback when the scorer is down: allow all payments through silently. One analyst reviews all alerts; volumes are unknown.`,
    findings: [
      F('Silent fail-open when the scorer is down', 'Critical', 'Fraudsters need only cause (or await) scorer downtime for a free window; nobody is alerted that protection is off.', 'Conservative rule-based fallback + loud alerting; degraded-mode is a designed, monitored state.'),
      F('Unversioned models deployed without evaluation gates', 'Critical', 'A bad training run can block thousands of customers (or admit fraud waves) with no rollback target and no way to know which model did what.', 'Model registry with versions, offline evaluation + shadow mode gates, staged rollout, instant rollback.'),
      F('Decisions stored without features or model version', 'High', 'Disputes and regulators ask "why was this blocked?" — unanswerable; model governance (mandatory in banking) impossible.', 'Log decision + feature vector hash + model/threshold versions per decision; retention per schedule.'),
      F('Thresholds tuned in production by feel', 'High', 'The block/annoy trade-off is a risk-appetite decision made invisibly by engineers; no evidence trail, no approval.', 'Threshold changes as governed, versioned, approved changes with backtesting evidence.'),
      F('Synchronous core-DB feature queries adding 400 ms', 'Medium', 'Latency budget blown on the payment path and load added to the core; the design will not survive instant rails.', 'Precomputed feature store maintained by streaming aggregation; in-flight features only for payment-intrinsic data.'),
      F('Single analyst with unknown alert volumes', 'Medium', 'Alert queues will silently grow; genuine fraud ages in a backlog nobody measures.', 'Volume forecasting, queue SLAs and monitoring, prioritised worklists — case-management discipline.')],
    decoys: [
      'Telling blocked customers "technical error" (actually partially defensible — fraud-control opacity is deliberate; the real issue is the missing appeal path, not the wording)',
      'Weekly retraining cadence',
      'Using a gradient-boosted model rather than a neural network',
      'The data-science team using Python while services are Java'],
    priority: 'Fail-open is the exploitable hole — fix the fallback this sprint. Model governance (versioning, gates, decision evidence) is the structural block for a regulated bank and unblocks everything else. Threshold governance rides on it. Latency and analyst capacity are real but schedulable.' }
  ];
})(window.SAA.data);
