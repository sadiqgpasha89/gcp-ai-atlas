/* Deliver and data guides: platform engineering, data and knowledge lifecycle. */
window.ATLAS.guides.push({
  id: 'platform-engineering', group: 'deliver', title: 'Platform engineering for AI workloads',
  short: 'Infrastructure as code, pipelines, supply-chain controls, runtime patterns, environment promotion and disaster recovery for agent and ML systems.',
  when: 'You are standing up the paved road for several AI teams, or one team is about to move from a prototype to something that must survive audits, releases and a regional outage. Read it with the [[a:agent-cicd|CI/CD architecture]].',
  blocks: [
    { t: 'h2', text: 'The paved road in one view' },
    { t: 'table', cols: ['Layer', 'Choose', 'Why', 'Service pages'], rows: [
      ['**Infrastructure as code**', 'Terraform (or Infrastructure Manager) for projects, networks, IAM, gateway and registry entries, quotas alerts, datasets and indexes', 'Reviewable, repeatable, auditable; the answer to "who changed the policy?"', '[[infra-manager|Terraform & Infrastructure Manager]]'],
      ['**Build and test**', 'Cloud Build or GitHub Actions; one pipeline template reused by every agent', 'Teams do not hand-roll pipelines; gates are the same everywhere', '[[cloud-run|Cloud Run jobs]]'],
      ['**Artefacts**', 'Artifact Registry for container images and packages; digests, not tags, in manifests', 'Immutable references; supply-chain provenance', '—'],
      ['**Runtime**', 'Agent Runtime for managed agents; Cloud Run for stateless tool servers and frontends; GKE for custom serving and accelerators', 'Match the runtime to the operational burden you can carry ([[d:agent-runtime|how to host the agent]])', '[[agent-runtime]], [[cloud-run]], [[gke]]'],
      ['**Identity and secrets**', 'Per-agent identity, workload identity federation for CI, Secret Manager for credentials, no keys in repositories', 'Least privilege and no long-lived keys', '[[iam]], [[secret-manager]], [[agent-governance]]'],
      ['**Observability**', 'Traces, logs and metrics with release markers; budgets and quota alerts defined in code', 'Alerts that exist in every environment from day one', '[[cloud-monitoring]], [[quotas]], [[billing]]']
    ] },

    { t: 'h2', text: 'Terraform and environments' },
    { t: 'ul', items: [
      '**One module per capability:** a "governed agent" module that creates the identity, registry entry, IAM bindings, log sink, dashboards and alerts together, so no agent ships without them.',
      '**Separate state per environment** and per team boundary; a shared state file becomes a lock contention and a blast radius.',
      '**Separate projects for dev, staging and production,** each with its own quotas, keys and perimeter. Name them consistently so policies can match on labels.',
      '**Plan in review, apply from the pipeline.** Humans do not apply to production from a laptop; the pipeline identity does, after approval.',
      '**Detect drift:** a scheduled plan that alerts on changes made outside the pipeline.',
      '**Organisation policy as guard rails:** restrict regions, require CMEK where mandated, block external IPs and service-account key creation ([[iam]]).'
    ] },

    { t: 'h2', text: 'Pipelines: Cloud Build or GitHub Actions' },
    { t: 'table', cols: ['Concern', 'Cloud Build', 'GitHub Actions'], rows: [
      ['Identity to Google Cloud', 'Runs as a service account you choose; scope it per pipeline', 'Use workload identity federation (OIDC). Do not store service-account keys as secrets.'],
      ['Where it fits', 'Teams that want builds inside Google Cloud with private pools and VPC-SC', 'Teams whose code and reviews already live in GitHub'],
      ['Private network access', 'Private pools', 'Self-hosted runners in your network, or reach private resources through a bastion or Private Service Connect'],
      ['Shared templates', 'Templates in a shared repository', 'Reusable workflows in a shared repository'],
      ['Either way', 'Pipeline definition in the repository and reviewed; main branch protected', 'The evaluation gate is a required status check; deploy credentials are never stored as long-lived keys']
    ] },

    { t: 'h2', text: 'Supply chain for containers and tools' },
    { t: 'ul', items: [
      '**Build once, promote the same digest.** Never rebuild between staging and production.',
      '**Scan images and dependencies** on build and on a schedule; new vulnerabilities appear after the image ships.',
      '**Sign images and record provenance;** enforce at deploy time that only signed images from your pipeline can run (Binary Authorization for GKE and Cloud Run).',
      '**Pin and review MCP servers and tool packages.** A third-party tool is code that runs with your agent\'s credentials; vet it like a dependency, and register it ([[p:agent-governance-guide|governance guide]]).',
      '**Keep an SBOM** for each agent image so a disclosed vulnerability can be traced to the agents it affects.',
      '**Restrict who can push** to the registry and who can change the pipeline.'
    ] },

    { t: 'h2', text: 'Runtime patterns' },
    { t: 'table', cols: ['Pattern', 'Use when', 'Notes'], rows: [
      ['**Agent Runtime (managed)**', 'Agents built with ADK or other frameworks that need sessions, memory, identity and gateway routing without running the platform yourself', 'Fastest path. Check region and security-control support first ([[p:compliance-matrix|matrix]]).'],
      ['**Cloud Run services**', 'Stateless agent APIs, MCP tool servers, webhooks, frontends; scale to zero; concurrency tuned for model latency', 'Set a max-instance cap to bound cost and downstream load; use a min instance for latency-critical paths.'],
      ['**Cloud Run jobs**', 'Index builds, batch evals, graph extraction, backfills', 'Retries and parallelism are configurable; keep jobs idempotent.'],
      ['**GKE**', 'Custom model serving, accelerators, sidecars, strict network control, existing platform team', 'Highest control and highest operations load ([[d:where-model-runs|where the model runs]]).'],
      ['**Workflows / Pub/Sub**', 'Long-running or human-approved flows, fan-out, decoupling', 'Idempotent handlers, dead-letter topics, and visible backlogs ([[workflows]], [[pubsub]]).']
    ] },

    { t: 'h2', text: 'Environment promotion' },
    { t: 'steps', items: [
      ['1', '**Dev:** fast iteration, synthetic or sanitised data, no production credentials, relaxed quotas.'],
      ['2', '**Staging:** production-like identities, policies, network and quotas; sanitised copy of data; full evaluation suite; the rehearsal ground for rollback and failover.'],
      ['3', '**Production:** the same manifest as staging; deploy by canary; automated rollback; change record linked to the evaluation report ([[t:launch-go-no-go|Go/No-Go template]]).'],
      ['4', '**Promotion rule:** nothing reaches production that was not deployed and tested in staging with the same artefacts and configuration.']
    ] },

    { t: 'h2', text: 'Blue/green and canary' },
    { t: 'table', cols: ['Strategy', 'How it works', 'Best for', 'Cost and catch'], rows: [
      ['**Blue/green**', 'Run the new revision beside the old; switch all traffic at once; switch back to roll back', 'Infrastructure and runtime changes where partial exposure is awkward', 'Two copies running; needs backwards-compatible data and schemas.'],
      ['**Canary**', 'Send a small, growing share of traffic to the new revision; compare metrics; widen or stop', 'Prompt, model, retrieval and agent changes where quality is the risk', 'Needs enough traffic and time to see a rare failure; needs automated comparison.'],
      ['**Shadow**', 'Copy live traffic to the new revision, score it, show nothing', 'Big changes (model swap, new index) before any user exposure', 'Doubles model spend for the shadowed share; side effects must be disabled.'],
      ['**Feature flag**', 'Turn a behaviour on per user, tenant or percentage', 'Gradual launches, kill switches, tenant opt-in', 'Flags rot; set an owner and an expiry.']
    ], note: 'On Cloud Run, traffic splitting between revisions supports canary and instant rollback. Cloud Deploy adds managed promotion and rollout strategies for Cloud Run and GKE.' },

    { t: 'h2', text: 'Disaster recovery and regional availability' },
    { t: 'table', cols: ['Question', 'Decide', 'Watch for'], rows: [
      ['What are the recovery targets?', 'Recovery time and recovery point objectives per tier: user-facing agent, retrieval store, evaluation system, build pipeline', 'Not everything needs the same target. Tier-1 flows get a second region; tier-3 can restore from backup.'],
      ['Which regions?', 'A primary and a secondary region that both support your models and services, and both satisfy residency requirements', 'Model and feature availability differs by region and by model; residency may rule out some pairs ([[p:compliance-matrix|matrix]]).'],
      ['What fails over?', 'Model endpoint (fallback model or region), agent runtime, retrieval store, session and memory stores', 'Indexes and memory stores are data: replicate or rebuild them, and measure how long a rebuild takes.'],
      ['How is capacity secured?', 'Quota in the secondary region, or Provisioned Throughput ([[d:capacity-strategy|capacity strategy]])', 'A secondary region with no quota is not a failover.'],
      ['Is it rehearsed?', 'A scheduled game day: fail the primary, measure, fix', 'Untested failover plans fail. Record the result in the [[t:launch-go-no-go|launch checklist]].']
    ] },

    { t: 'h2', text: 'Automated gates summary' },
    { t: 'ul', items: [
      'Plan and policy checks on infrastructure changes; no apply without review.',
      'Image and dependency scans; signed images only.',
      'Smoke evaluation on every pull request; full evaluation on release candidates.',
      'Permission and "direct call must fail" tests on every agent release.',
      'Canary comparison with automatic rollback.',
      'Cost estimate attached to the change when it alters model, context size or step count ([[d:finops|FinOps tool]]).'
    ] }
  ],
  src: [
    ['Cloud Build documentation', 'https://docs.cloud.google.com/build/docs'],
    ['Cloud Deploy documentation', 'https://docs.cloud.google.com/deploy/docs'],
    ['Cloud Run: rollouts, rollbacks and traffic migration', 'https://docs.cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration'],
    ['Terraform on Google Cloud', 'https://docs.cloud.google.com/docs/terraform'],
    ['Binary Authorization', 'https://docs.cloud.google.com/binary-authorization/docs']
  ],
  related: ['infra-manager', 'cloud-run', 'gke', 'agent-runtime', 'iam', 'secret-manager', 'cloud-monitoring', 'quotas', 'workflows', 'pubsub'],
  see: ['a:agent-cicd', 'p:agent-governance-guide', 'p:compliance-matrix', 'd:capacity-strategy', 't:launch-go-no-go']
});

window.ATLAS.guides.push({
  id: 'data-lifecycle', group: 'data', title: 'Data and knowledge lifecycle for RAG and agents',
  short: 'Ten stages from source discovery to reconciliation, with the quality gates and freshness objectives that keep retrieval correct.',
  when: 'Your agent answers from company documents, tickets, wikis or databases, and its quality depends on what is in the index, how fresh it is, and who may see it. Most "model problems" in RAG are data problems.',
  blocks: [
    { t: 'h2', text: 'Why a lifecycle, not a one-off load' },
    { t: 'p', text: 'A RAG system is a data product with a model on top. The index decays: documents change, people leave, permissions move, formats vary. The ten stages below are the jobs somebody has to own. The usual failure is that the first load is careful and nothing after it is.' },
    { t: 'h2', text: 'The ten stages' },
    { t: 'table', cols: ['#', 'Stage', 'What happens', 'Design decisions', 'Gate or SLO'], rows: [
      ['1', '**Source discovery and access**', 'Find the systems of record; get read access; classify each source', 'Owner per source; data class; whether to use a connector, an export or an API; who approves access', 'Source register complete; owner named; data class recorded'],
      ['2', '**Ingestion and change detection**', 'Pull new and changed content; detect deletions', 'Events or webhooks where possible, polling with a cursor otherwise; content hashes; handling of renames and moves', 'Missed-change rate; lag from change to ingestion'],
      ['3', '**Parsing and document understanding**', 'Turn files into clean text and structure', 'Layout-aware parsing for tables, headings, scanned pages and forms ([[document-ai|Document AI]]); OCR; language detection', 'Parse failure rate; sampled human check of tables and scans'],
      ['4', '**Chunking and enrichment**', 'Split into retrievable units; add context', 'Structure-aware chunks (by heading or section) over fixed size; overlap; contextual prefix (title, section); summaries; entity tags', 'Retrieval recall on the golden set for each strategy'],
      ['5', '**Metadata and ACL extraction**', 'Capture who may see each chunk and what it is about', 'Source, owner, date, version, language, data class, and the access list or group at ingestion time', 'Share of chunks with ACLs; permission test passes'],
      ['6', '**Embedding and indexing**', 'Create vectors and keyword indexes', 'One embedding model per index and its version recorded; hybrid (vector plus keyword); batch versus streaming writes', 'Index build time; mixed-model check'],
      ['7', '**Incremental update and deletion**', 'Apply changes without a full rebuild; remove what no longer exists', 'Replace chunks by document id; tombstones; propagation of permission changes; retention rules', 'Deletion propagation time; no stale duplicates'],
      ['8', '**Data quality validation**', 'Check content before it is trusted', 'Empty, duplicate and near-duplicate detection; language and format checks; sensitive data scan ([[sdp|Sensitive Data Protection]]); freshness stamps', 'Quality gate must pass before an index is promoted'],
      ['9', '**Index freshness monitoring**', 'Measure how far behind the index is', 'Per-source "age of newest unindexed change"; dashboards; alerts', 'Freshness objective per tier (see below)'],
      ['10', '**Reconciliation and reprocessing**', 'Compare source and index; fix drift; re-run with new parsers or models', 'Scheduled full count and sample compare; blue/green re-index; backfill procedure', 'Drift rate under threshold; reprocess completes within the window']
    ] },

    { t: 'h2', text: 'Multimodal, scanned and structured data' },
    { t: 'table', cols: ['Content', 'Challenge', 'Approach', 'Services'], rows: [
      ['**Scanned PDFs and images of text**', 'No text layer; skew; handwriting', 'OCR and layout analysis, then treat as text; keep the page image for citation', '[[document-ai]], [[vision-ai]]'],
      ['**Tables**', 'Flattened text loses row and column meaning', 'Extract as structured tables; embed rows with their headers; or store in BigQuery and query with SQL', '[[document-ai]], [[bigquery]]'],
      ['**Diagrams and charts**', 'Meaning is in the picture', 'Generate a caption or structured description with a multimodal model; store both; cite the image', '[[gemini]]'],
      ['**Slides and layout-heavy documents**', 'Reading order and sections', 'Layout-aware parsing; chunk by slide or section; keep titles in context', '[[document-ai]]'],
      ['**Audio and video**', 'Time-based content', 'Transcribe with timestamps; chunk by topic; link back to the time offset', '[[speech-to-text]], [[gemini]]'],
      ['**Structured data**', 'Retrieval by similarity is wrong for exact lookups and aggregates', 'Query it as data: SQL or an API tool, not chunks. Use semantic search only to find the right table or field', '[[bigquery]], [[alloydb]], [[spanner]]'],
      ['**Code and configuration**', 'Syntax and structure matter', 'Chunk by function or file; index symbols; keep paths and versions as metadata', '[[vector-search]]']
    ] },

    { t: 'h2', text: 'Quality gates' },
    { t: 'table', cols: ['Gate', 'Checked when', 'Example rule', 'Action on failure'], rows: [
      ['**Parse quality**', 'After parsing a new source or parser version', 'Sampled pages: table and heading fidelity above the agreed rate; parse failures below 1 percent', 'Do not index the source; fix the parser'],
      ['**Duplicate control**', 'Before indexing', 'Near-duplicate chunks below 5 percent of the corpus', 'Deduplicate by hash and similarity'],
      ['**ACL coverage**', 'Before indexing', '100 percent of chunks carry an owner group', 'Quarantine chunks without ACLs'],
      ['**Sensitive data**', 'Before indexing', 'No unapproved sensitive data classes in the index', 'Redact or exclude; notify the owner'],
      ['**Retrieval regression**', 'Before promoting a new index', 'Recall at k within the margin of the current index; permission tests pass', 'Keep the old index serving ([[a:agent-cicd|CI/CD architecture]])'],
      ['**Freshness**', 'Continuously', 'Per-tier objective met', 'Alert the data owner; run reconciliation']
    ], note: 'Thresholds are examples. Set them from the golden set and the risk of a wrong answer for each source.' },

    { t: 'h2', text: 'Freshness objectives' },
    { t: 'table', cols: ['Tier', 'Examples', 'Example objective', 'Mechanism'], rows: [
      ['**Tier 1: changes the answer now**', 'Policies, prices, incident status, entitlements', 'Newest change indexed within 15 minutes to 4 hours', 'Event-driven ingestion; deletion propagation; alert on breach'],
      ['**Tier 2: changes weekly**', 'Product docs, runbooks, knowledge base', 'Within 24 hours', 'Scheduled incremental sync'],
      ['**Tier 3: archival**', 'Reports, historical records', 'Within a week or on demand', 'Batch load; periodic reconciliation']
    ], note: 'State the objective in the answer where staleness is risky: show the "last updated" date of each cited source.' },

    { t: 'h2', text: 'Which Google Cloud services do which stage' },
    { t: 'table', cols: ['Stage', 'Options'], rows: [
      ['Sources and ingestion', '[[gcs|Cloud Storage]] events, [[pubsub]], [[dataflow]] for streaming and large batch, connectors in [[ai-search|Agent Search]] and [[gemini-enterprise]], [[rag-engine|RAG Engine]] import'],
      ['Parsing and understanding', '[[document-ai|Document AI]] (Layout Parser, OCR, form and table extraction); [[gemini]] for multimodal descriptions'],
      ['Orchestration of the jobs', '[[workflows]], [[composer|Cloud Composer]], [[ap-pipelines|Pipelines]], Cloud Run jobs'],
      ['Embedding and indexing', 'Embedding models on [[gemini|Agent Platform]]; [[vector-search]], [[agent-retrieval]], [[alloydb]], [[spanner-graph]], [[bigquery|BigQuery]] vector search'],
      ['Catalogue, lineage and quality', '[[knowledge-catalog|Knowledge Catalog (Dataplex)]] for metadata, lineage and data-quality rules'],
      ['Sensitive data', '[[sdp|Sensitive Data Protection]] to find and mask personal data before indexing']
    ] }
  ],
  src: [
    ['RAG reference architectures on Google Cloud', 'https://docs.cloud.google.com/architecture/rag-reference-architectures'],
    ['Where your data lives and is processed', 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/resources/data-residency'],
    ['Spanner vector search overview', 'https://docs.cloud.google.com/spanner/docs/vector-search-overview']
  ],
  related: ['document-ai', 'gcs', 'pubsub', 'dataflow', 'rag-engine', 'ai-search', 'vector-search', 'agent-retrieval', 'knowledge-catalog', 'sdp'],
  see: ['a:agentic-rag', 'a:graphrag', 'a:agent-cicd', 'p:incident-runbooks', 'd:vector-store']
});
