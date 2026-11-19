# Plan: evolve the GCP AI Atlas into a production AI engineering and management playbook

Source: the review "GCP AI Atlas review" (verdict: strong learning atlas, 8/10; as a daily AI Engineering Manager tool, 6/10).
Goal: keep the current site as **Layer 1, the GCP AI Knowledge Base**, and add **Layer 2, the AI Architecture and Engineering Playbook** and **Layer 3, the AI Engineering Manager Cockpit**.

Status legend: `[ ]` to do, `[x]` done. This file is updated as work completes.

## Ground rules

1. **Accuracy first.** Product names, status (GA / Preview), limits and doc links are verified against Google Cloud documentation before they are written. Anything not verified is marked "Check" in the UI rather than stated as fact. No invented quotas, prices or regions.
2. **Keep the architecture of the site.** Static, no build step, no dependencies, hash routing, `window.ATLAS` data files, a Node `vm` validator in CI. New content is data-driven, so it is validated by `scripts/check.mjs`.
3. **Preserve ids.** Renamed products keep their existing service ids (so links and the checklist `see` refs do not break). The old name is kept as an `aka` alias and is searchable.
4. **Manager-first writing.** Every new page answers a decision: what to choose, what it costs, what breaks, who owns it.
5. **One branch, one PR.** Branch `feat/p0-p2-review-upgrades` from the merged `main`. Commit per phase.

## Design of the change

| Concern | Decision |
|---|---|
| Service metadata (current name, status, regions, pricing, limits, last reviewed, alternatives) | New `data/meta.js`, keyed by service id, merged into `ATLAS.services` at load. Keeps the 71 service files untouched apart from renames. |
| Architectures with extra teaching content | Extend the architecture schema with optional `sections` (tables, lists, callouts). Reused by the new architectures. |
| Long-form guides (governance, AgentOps, evals, data lifecycle, platform engineering, compliance matrix, runbooks) | New `data/guides.js` and a generic section renderer. Route `#/p/<id>`. |
| Retrieval choice and GraphRAG | New decision guide in `data/decisions.js` using the existing guide format. |
| FinOps | New component-based cost model tool at `#/d/finops`. Existing calculator stays. |
| Evaluation scorecard | New tool at `#/d/scorecard`: candidates against a dataset, release gates, copy as markdown. |
| Manager cockpit | New page at `#/m`. Browser-local (localStorage), schema-driven tables with CSV/JSON import and export, derived KPIs, sample data you can load and clear. A static site cannot read live systems, so the cockpit is built to ingest exports from them. |
| Templates | New `data/templates.js` and page `#/t`: 12 copy-ready markdown templates. |
| Navigation | Sidebar and home page regrouped into the three layers. Search index covers all new content. |

## Phase 0: setup and research

- [x] **0.1 Branch.** Fast-forward `main` (contains the merged PR plus the home-link commit), branch `feat/p0-p2-review-upgrades`.
- [x] **0.2 Verify names and facts against Google Cloud docs** (web search, because the shell cannot reach the docs site):
  - [x] Agent Search (formerly Vertex AI Search): current name, doc path.
  - [x] Agent Platform Evals (formerly Gen AI Evaluation service): current name, doc path, what it covers (agent trajectories, simulated users, multi-turn).
  - [x] Vector Search (formerly Vertex AI Vector Search): Vector Search 2.0 and **Agent Retrieval**: what each is, relationship, status.
  - [x] Agent Runtime (formerly Agent Engine), Memory Bank, Sessions: current names and status.
  - [x] RAG Engine security support (VPC-SC, CMEK) and what it does not support (data residency, AXT).
  - [x] Agent Identity, Agent Registry, Agent Gateway: what each does, auth mechanisms (OAuth, mTLS, DPoP), default-deny policy.
  - [x] Google Cloud reference architectures: multi-agent, agentic RAG, GraphRAG with Spanner Graph, doc paths.
  - [x] Evaluation guidance: conversation-level and simulated-user evaluation.
- [x] **0.3 Record verified facts and doc URLs** in a scratch note used while writing (not shipped).

**Acceptance:** every name and doc path used in later phases traces to a verified source, or is labelled "Check".

## Phase 1 (P0): correctness of the existing atlas

### P0-1 Product names, links, status and service limitations

- [x] 1.1 **Renames** (ids unchanged, `aka` added, old name searchable):
  - [x] `ai-search`: "Vertex AI Search" becomes **Agent Search**.
  - [x] `ap-evals`: "Gen AI Evaluation" becomes **Agent Platform Evals**.
  - [x] `vector-search`: confirm current name wording, add Vertex AI Vector Search / Matching Engine as aka.
  - [x] `agent-runtime`: current name, keep "Agent Engine" as aka.
  - [x] Replace stale names in all prose: `data/*.js` text, decision guides, shaper, README, hero text.
- [x] 1.2 **New service cards**: Agent Retrieval (distinct from Vector Search, with the relationship explained), and Spanner Graph if it is not already covered inside the Spanner card (add a dedicated card if it is a distinct decision).
- [x] 1.3 **`data/meta.js`** with, per service: `now` (current name), `was` (previous names), `status` (GA / Preview / Mixed / Check), `regions` (note), `pricing` (URL), `quotas` (note or pointer), `reviewed` (date), `alt` (alternatives and migration notes).
  - [x] Populate all 71+ services. Items not verified are `status: 'Check'` with a docs pointer, never a guess.
- [x] 1.4 **Render** a "Product facts" panel on every service page: current name, previous names, status badge, regions, pricing link, quotas, alternatives, last reviewed.
- [x] 1.5 **Search** indexes `aka` and previous names (searching "Vertex AI Search" finds Agent Search).
- [x] 1.6 **RAG Engine card**: add a "Service constraints" note (VPC-SC and CMEK supported; data residency and AXT not supported) once verified in 0.2.
- [x] 1.7 **Data residency and compliance matrix** across AI, data, retrieval and agent services (becomes guide `compliance-matrix` in Phase 3, linked from the RAG Engine card).
- [x] 1.8 **Validator**: `meta` required fields, valid status, valid URL shape, `reviewed` date format, every service has meta.

**Acceptance:** searching any old name finds the new card; no stale name remains in the repo (`grep` check); every service page shows the product-facts panel; `check.mjs` passes.

### P0-2 Production multi-agent architecture

New architecture `multi-agent-system` using the stepper plus extra sections.

- [x] 2.1 **Stepper flow** (supervisor, specialists, A2A, MCP tools, memory, identity/registry/gateway, approval, tracing) with steps, "why this shape", "how it fails".
- [x] 2.2 **Section: four orchestration patterns** (sequential, parallel, supervisor delegation, iterative refinement): when to use, cost and latency shape, failure mode, ADK construct.
- [x] 2.3 **Section: one agent, many agents, or no agent** decision table with explicit "when not to use agents".
- [x] 2.4 **Section: guardrails for multi-agent runs**: retry, timeout, fallback, idempotency; loop limits, token budgets, maximum steps.
- [x] 2.5 **Section: shared versus isolated memory and session state.**
- [x] 2.6 **Section: per-agent tracing and evaluation** (what to log, what to score).
- [x] 2.7 Link from the existing Agent Platform architecture, ADK, A2A and governance cards.

**Acceptance:** all 10 items in the review's list are present; the four patterns are present; the "when not to use agents" guidance is explicit.

### P0-3 Advanced agentic RAG architecture

New architecture `agentic-rag`.

- [x] 3.1 **Stepper flow**: query understanding and rewriting, planning and strategy selection, routing across sources, hybrid dense plus keyword retrieval, metadata and permission filtering, reranking and context compression, iterative retrieval and tool calls, citation and grounding verification, refusal or escalation, feedback-driven ingestion.
- [x] 3.2 **Section: retrieval option decision matrix** (RAG Engine, Agent Search, Vector Search, Agent Retrieval, AlloyDB, BigQuery, Spanner Graph): data model, operational burden, workload fit, "do not choose when". Explicitly not presented as interchangeable.
- [x] 3.3 **Section: baseline RAG versus agentic RAG** (what changes, what it costs in latency and tokens, when baseline is enough).
- [x] 3.4 **Section: failure modes** (permission leakage, stale index, over-retrieval, loops).

**Acceptance:** the matrix covers all seven options with trade-offs; the page states when baseline RAG is sufficient.

## Phase 2 (P1): advanced retrieval, governance, operations, release

### P1-1 GraphRAG and the retrieval decision guide

- [x] 4.1 **Architecture `graphrag`**: extraction, graph construction, entity resolution, graph storage and traversal (Spanner Graph), hybrid vector plus graph retrieval, context assembly, grounded generation, graph updates and freshness.
- [x] 4.2 **Decision guide `retrieval-strategy`** (architecture theme): vector only, hybrid, agentic RAG, GraphRAG, Agent Retrieval, with if/then rules, red flags, review questions, one-way/two-way door.
- [x] 4.3 Wire into `vector-store` guide, shaper, related services.

### P1-2 Agent governance implementation guide

Guide `agent-governance-guide` (do not duplicate the service card; expand it).

- [x] 5.1 Identity: **agent identity versus the human user's identity**, delegated access, on-behalf-of flow, with a worked example.
- [x] 5.2 Registry: registration, discovery, approved agents and tool endpoints.
- [x] 5.3 Gateway: ingress and egress, routing, policy enforcement.
- [x] 5.4 Authentication table: OAuth, API keys, workload identity, delegated credentials; transport security (mTLS, DPoP where applicable).
- [x] 5.5 Access policy: default-deny, least privilege, boundaries.
- [x] 5.6 Tool governance: approved MCP servers, API tools, agent endpoints.
- [x] 5.7 Content protection with Model Armor; auditability (identity, tool invocation, traces, policy decisions).
- [x] 5.8 Implementation checklist and a rollout order.

### P1-3 AgentOps, evaluation lifecycle and incident runbooks

- [x] 6.1 **Guide `agentops`**: metric dimensions table (business outcome, quality, retrieval, agent execution, latency, reliability, cost, user experience), SLO examples, dashboards, alert design. The three questions: is it healthy, is it good, is it affordable.
- [x] 6.2 **Guide `incident-runbooks`**: eight runbooks (model or agent outage; quota exhaustion and 429s; runaway loops and token consumption; prompt injection or malicious tool output; RAG permission leakage; stale or wrongly indexed documents; poor retrieval after a data refresh; failed prompt, model or agent release). Each: symptoms, triage, mitigate, root-cause checks, prevent.
- [x] 6.3 **Guide `evaluation-lifecycle`**: offline datasets, golden Q&A, retrieval eval, model eval, trajectory eval, tool selection and arguments, multi-turn, adversarial and security, synthetic user simulation, online evaluation, release-blocking thresholds.
- [x] 6.4 **Tool `scorecard`** at `#/d/scorecard`: compare models, prompts, agent configs and retrieval strategies on one dataset; thresholds as release gates; copy as markdown.

### P1-4 RAG and agent CI/CD architecture

- [x] 7.1 **Architecture `agent-cicd`**: version prompts and agent config, datasets and documents, embeddings and indexes; automated retrieval and answer-quality evals; security and prompt-injection tests; build and deploy pipelines; canary and shadow; rollback of agents, models, prompts and indexes.
- [x] 7.2 Section: "what can change in production" table (prompt, tool, model, retrieval, data, orchestration) with how each is versioned, tested and rolled back.
- [x] 7.3 **Guide `platform-engineering`**: Terraform, Cloud Build or GitHub Actions, Artifact Registry and supply chain, Cloud Run and GKE patterns, workload identity and secrets, environment promotion, blue/green and canary, automated gates, DR and regional availability.

## Phase 3 (P2): FinOps, data lifecycle, cockpit, templates

### P2-1 AI FinOps

- [x] 8.1 **Tool `finops`** at `#/d/finops`: component cost model (every model call across every agent, input/output/reasoning tokens, embeddings, reranking, vector indexing and queries, Agent Runtime compute, memory and session storage, tool and API calls, retries and failed runs, logging/tracing/eval, storage and egress, dev/test/eval environments).
- [x] 8.2 **Comparisons** computed live: one agent versus several; model routing versus one larger model; RAG Engine versus custom retrieval; caching versus repeated retrieval; parallel versus sequential; chunk size and retrieval depth.
- [x] 8.3 Headline metric is **cost per successful business task**; show it first.
- [x] 8.4 Prices are explicit placeholders, same disclaimer as the existing calculator.

### P2-2 Data and knowledge lifecycle

- [x] 9.1 **Guide `data-lifecycle`**: the ten stages (source discovery and access; ingestion and change detection; parsing and document understanding; chunking and enrichment; metadata and ACL extraction; embedding and indexing; incremental update and deletion; data quality validation; index freshness monitoring; reconciliation and reprocessing).
- [x] 9.2 Multimodal data, scanned PDFs, tables, diagrams, structured data, layout understanding; link to Document AI and data services.
- [x] 9.3 Quality gates and freshness SLO examples.

### P2-3 AI Engineering Manager Cockpit

Page `#/m`, tabs, browser-local data, import and export.

- [x] 10.1 **Engine**: schema-driven editable tables (text, select, number, date, percent, status); add, edit, delete rows; localStorage; export and import JSON and CSV; load sample data; clear.
- [x] 10.2 **Tabs** (ten): AI portfolio, Architecture review, Project health, Quality, Reliability, Cost, Security and compliance, Team capability matrix, Technology radar, Decision log.
- [x] 10.3 **Derived KPIs** per tab (for example: portfolio by stage and total value at risk; quality metrics below threshold; SLO attainment and error-budget burn; forecast versus actual variance and unit cost; open controls by severity; skill gaps by person and by skill).
- [x] 10.4 **Technology radar** seeded from the atlas service catalogue (adopt, trial, assess, hold) with status from `meta.js`.
- [x] 10.5 Clear statement on the page: data stays in the browser; how to feed it from Cloud Monitoring, BigQuery billing export and eval runs (CSV import).
- [x] 10.6 Accessible tables (labels, keyboard, focus), responsive layout.

### P2-4 Management templates and team skills matrix

- [x] 11.1 **Page `#/t`** with 12 copy-ready markdown templates: discovery and problem statement; business value and feasibility; architecture review checklist; model and agent selection record; RAG design review; threat model and risk assessment; evaluation report; production launch Go/No-Go; SLO and incident runbook; post-incident review; cost optimisation review; technical debt and improvement backlog.
- [x] 11.2 Each template has: when to use it, who fills it in, the template body, copy button, links to related atlas pages.
- [x] 11.3 **Skills matrix**: delivered in the cockpit (10.2) with a seeded skill list for AI engineering and a gap summary.

## Phase 4: integration, quality and delivery

- [ ] 12.1 **Navigation**: sidebar and home regrouped into Knowledge Base, Playbook, Manager Cockpit; new routes `#/p`, `#/p/<id>`, `#/m`, `#/t`, `#/d/finops`, `#/d/scorecard`.
- [x] 12.2 **Search** covers guides, templates, tools and cockpit.
- [x] 12.3 **Validator** extended: guides, templates, architecture `sections`, cross-references (`[[id]]`), new decision guide, meta.
- [ ] 12.4 **Readiness checklist**: add items that point to the new guides (governance, runbooks, evals, CI/CD, data freshness).
- [ ] 12.5 **Shaper**: point agent and RAG results at the new architectures where they fit.
- [ ] 12.6 **Browser smoke test** of every route: no console errors, key elements present, cockpit add/edit/export round trip, FinOps and scorecard calculations match hand-computed values, light and dark, narrow viewport.
- [ ] 12.7 **README** updated (three layers, new routes, how to add content, accuracy policy).
- [ ] 12.8 **Stale-name grep** shows nothing outside the alias lists.
- [ ] 12.9 **Commit per phase, push, open PR** against `main`. Describe what could not be verified.
- [ ] 12.10 Note in the PR: Pages must be enabled (Settings, Pages, Source: GitHub Actions).

## Out of scope (stated honestly)

- Live data from deployed agents: a static site cannot call a customer's Cloud Monitoring or BigQuery. The cockpit ingests exports instead.
- A GitHub issue backlog: the review suggests turning P0 and P1 into issues. This file contains the page specs and acceptance criteria that would become those issues.
- Per-service regional availability and quotas for all services: only stated where verified; otherwise the card links to the authoritative page and says "Check".
