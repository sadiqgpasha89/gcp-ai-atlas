# Google Cloud AI Atlas — The AI Engineering Management Operating System

A static, zero-dependency, client-side web application designed for AI Engineering Managers, Principal Architects, and Staff Engineers delivering enterprise generative AI and multi-agent systems on Google Cloud Platform (GCP).

Live site: [https://sadiqgpasha89.github.io/gcp-ai-atlas/](https://sadiqgpasha89.github.io/gcp-ai-atlas/)

---

## How the site is organised

The top bar links to the six most-used sections. The sidebar groups every section by intent and opens the sub-pages of the section you are in:

| Group | Sections |
|---|---|
| Learn | Services (`#/s`), Architectures (`#/a`), Glossary (`#/glossary`), Labs (`#/labs`) |
| Decide | Decision guides (`#/d`), Interactive tools (`#/tools`) |
| Build and operate | Playbooks (`#/p`), Security and governance (`#/gov`), Operations (`#/ops`) |
| Lead | Start here: reading paths by role (`#/start`), Manager toolkit (`#/toolkit`), Content freshness (`#/freshness`) |

New readers can start at `#/start`, which gives an ordered path for engineering managers, principal engineers, AI engineers, and platform or security engineers.

---

## The 8 Pillars of the AI Engineering Operating System

The Atlas is structured around eight foundational operational pillars that span the entire lifecycle of enterprise AI delivery:

### 1. Google Cloud Services Catalogue (73 Services across 11 Categories)
Comprehensive coverage of the core Google Cloud AI/ML ecosystem across compute, storage, databases, analytics, streaming, generative AI, ML platform, AI services, networking, security, and observability.
- Each service contains: what it is, interactive animated isometric workflow, step-by-step technical execution, production gotchas, edge cases, agent & ML integration patterns, architecture pairings, and cost model notes.
- Covers key Google Cloud services: **Gemini (1.5 Pro / Flash)**, **Vertex AI Search (RAG Engine)**, **Agent Studio**, **Agent Development Kit (ADK)**, **Agent Runtime**, **Agent Memory & Governance**, **Vertex AI Vector Search**, **AlloyDB with pgvector & ScaNN**, **BigQuery & BigQuery ML**, **Cloud Run**, **GKE Enterprise**, **Google Cloud TPU (v5e/v5p)**, **Cloud Storage**, **Document AI**, **Model Armor**, **Sensitive Data Protection (SDP)**, **VPC Service Controls**, and **Cloud Monitoring / Logging**.

### 2. Architecture Reference Library (13 Reference Architectures)
End-to-end interactive blueprints for production AI systems with step-through packet animations:
1. **Traditional RAG**: Ingestion, document cracking via Document AI, chunking, embeddings, hybrid search (dense + lexical), Reciprocal Rank Fusion (RRF), semantic reranking, grounded generation.
2. **Agentic RAG**: Multi-query decomposition, parallel retrieval tools, iterative reflection, reranking, and answer synthesis via Agent Development Kit (ADK) and Agent Memory.
3. **GraphRAG**: Knowledge graph construction, entity extraction, relationship triples, community summaries in Spanner Graph, and graph-guided retrieval.
4. **Multimodal RAG**: Document AI layout extraction, table Markdown conversion, Vision AI visual bounds, and multimodal Gemini embeddings.
5. **Secure Multi-Tenant RAG**: Cloud IAM / Identity Platform token propagation, document-level security trimming (ACLs), tenant isolation, and Private Service Connect (PSC) endpoint routing.
6. **Multi-Agent Orchestration**: Agent Development Kit (ADK) & Agent Runtime implementing sequential, supervisor, handoff, and group-chat patterns with state persistence in Agent Memory.
7. **GenAIOps & MLOps Lifecycle**: 8-stage operational pipeline: prompt versioning in Git, automated evaluation gates via Vertex AI Evaluation, canary releases, and Cloud Monitoring online telemetry.
8. **RAG on Vertex AI Search**: Classic pattern connecting Cloud Run, Vertex AI Search, and Gemini models.
9. **High-Throughput LLM Serving on GKE**: vLLM or TensorRT-LLM on GKE GPU/TPU instances with autoscaling and Cloud Load Balancing.
10. **Enterprise MLOps on Vertex AI Pipelines**: Vertex AI Pipelines orchestrating distributed GPU/TPU compute, Model Registry, and managed endpoints.
11. **Governed Agentic Workflows**: Agent Studio and Cloud Run tools with Cloud Workflows state persistence.
12. **Multimodal Document Processing**: Large-scale asynchronous document extraction into structured schemas via Document AI and Gemini.
13. **Real-time Feature Store**: Low-latency feature serving and streaming inference with BigQuery, Datastream, and Vertex AI Feature Store.

### 3. Architecture Decision Centre (23 Decision Guides)
Exhaustive decision guides across Strategy, Architecture, and Risk, marked with one-way and two-way door reversibility markers:
- **Dedicated Role Lenses**:
  - *Engineering Manager Lens*: Default call, what to decide, team operating rhythm, quick calls, budget implications, and evidence to ask for.
  - *Principal Engineer Lens*: Default design, what to own, design trade-offs, quick calls, and evidence to demand in design reviews.
- **Includes 9 Mission-Critical AI Decisions**:
  - `vector-hybrid-search`: Vector vs Hybrid Search (Dense Vector + BM25 Lexical)
  - `classic-vs-agentic-rag`: Classic vs Agentic RAG
  - `search-vs-alloydb`: Vertex AI Vector Search vs AlloyDB PostgreSQL (ScaNN/pgvector)
  - `chunking-strategy`: Fixed vs Semantic vs Hierarchical Chunking
  - `reranking-tradeoff`: Semantic Reranking Quality vs Latency
  - `graphrag-vs-vector`: GraphRAG vs Vector RAG (Spanner Graph vs Vector Search)
  - `index-tenancy`: Shared vs Isolated Search Indexes
  - `workflow-vs-agent`: Deterministic Workflows vs Autonomous Agents
  - `model-deployment-capacity`: Gemini Pay-as-you-go vs Provisioned Throughput vs Regional Failover
- Plus interactive tools: **Solution Shaper**, **Readiness Checklists**, and **Cost-per-Task Calculator**.

### 4. AI Engineering Playbooks (`#/p`)
In-depth production playbooks providing technical guidelines, measurable metrics, and engineering rules:
1. **RAG Engineering Playbook**: Document cracking via Document AI layout analysis, layout-aware Markdown chunking, hybrid search tuning (RRF), semantic cross-encoder reranking, and measurable quality indicators (Recall@K, MRR, NDCG, Groundedness, Answer Relevance, Citation Quality).
2. **Multi-Agent Engineering Playbook**: Three orchestration patterns (Supervisor-Worker, Sequential Pipeline, Hierarchical Consensus), runtime comparisons (Agent Runtime vs ADK vs Workflows), memory lifecycles, and tool authorization.
3. **GenAIOps & Production MLOps Playbook**: 8-stage lifecycle, prompt versioning in Git, automated PR evaluation gates via Vertex AI Evaluation, canary releases, and model drift monitoring.
4. **Enterprise AI Security & Hardening Playbook**: Identity delegation, document security trimming, Model Armor prompt shields, VPC Service Controls perimeters, and egress filtering.
5. **Performance, Reliability & SRE Playbook**: Latency budgets (TTFT < 1.5s), token economics (context caching, multi-region routing, batch prediction), 429 throttling mitigation, and capacity planning.

### 5. Enterprise Security & Governance (`#/gov`)
Architecture frameworks aligning Google Cloud AI workloads with corporate enterprise standards:
- **Google Cloud AI Landing Zones & Resource Manager Hierarchy**: Folder-based organization hierarchy, separating platform shared services projects from decentralized workload projects.
- **Zero-Trust Network Topology**: Hub-and-spoke with Shared VPC, Cloud Armor WAF, Private Service Connect (PSC) for all PaaS services, and VPC Service Controls (VPC-SC) perimeters.
- **8-Pillar Security Framework**: Identity, Authorization, Data Protection, Network Isolation, Prompt Defense, Agent Boundaries, Model & IP Protection, and Continuous Red Teaming.
- **Tenancy Architecture Models**: Pooled/Shared Index vs Index-per-Tenant vs Project-per-Tenant evaluation.
- **Recommended Organization Policies & Guardrails**: Programmatic guardrails enforcing private networking, CMEK encryption, approved model catalogs, and Cloud Audit logging.

### 6. Production Operations Centre (`#/ops`)
Telemetry, incident management, and SRE runbooks for stochastic AI systems:
- **Mandatory 10-Widget Operations Dashboard**: Real-time widgets tracking Task Throughput, Time to First Token (TTFT), Token Consumption, HTTP 429 Throttling, RAG Groundedness, Tool Failure Rate, Unit Cost per Task, Evaluation Trends, Guardrail Triggers, and Dependency Availability.
- **Ready-to-Run Cloud Monitoring / Logging Queries**: Expandable logging filter and metric queries with copy buttons for direct deployment to Cloud Monitoring dashboards.
- **Production SRE Runbooks**: Actionable remediation procedures for 429 throttling outages, Groundedness regressions, agent infinite loops, and model deprecation upgrades.
- **AI Incident Postmortem Template**: Specialized postmortem template with AI-specific 5 Whys and probabilistic failure classification.

### 7. AI Engineering Manager Toolkit (`#/toolkit`)
Leadership artifacts, frameworks, and copyable templates:
- **AI Use-Case Assessment Matrix**: Value vs Feasibility scoring framework across 8 dimensions.
- **AI Project Estimation Framework**: 4-phase headcount allocation model (Discovery, Architecture Spike, Hardening, Launch Readiness).
- **AI Team RACI Matrix**: Clear role ownership across EM, PE, AI Engineer, MLOps, Security, Product, and Business Stakeholders.
- **AI RAID Tracker**: Core enterprise risks, assumptions, issues, and dependencies with mitigation strategies.
- **Production Quality Gates**: Formal exit criteria across Prototype, Pilot, Production, and Scale.
- **AI Vendor & Platform Evaluation Matrix**: Evaluation rubric covering model variety, latency, enterprise security, and TCO.
- **Team Skills & Capability Matrix**: Essential skill competencies across Prompt Engineering, RAG Architectures, Fine-Tuning, Multi-Agent Systems, GenAIOps, and AI Security.
- **Architecture Review Checklist**: Copyable markdown template for production design sign-off.
- **Executive Status Report Template**: Weekly progress template for C-suite and leadership reporting.

### 8. Hands-on Labs & Learning Roadmaps (`#/labs`)
Structured skill advancement pathways and production lab scenarios:
- **3 Role-Based Curricula**:
  - *Engineering Managers (4 Weeks)*: Strategy, ROI estimation, operating rhythms, and delivery risk governance.
  - *Principal Engineers & Architects (6 Weeks)*: Advanced retrieval architectures, zero-trust network boundaries, multi-agent frameworks, and resilient systems design.
  - *AI Engineers & Builders (8 Weeks)*: Hands-on implementation of RAG pipelines, agent tools, eval frameworks, and production operations.
- **5 End-to-End Implementation Labs**:
  1. Production RAG with Vertex AI Search, Document AI, and Gemini
  2. Multi-Agent System with Agent Development Kit (ADK) and Agent Runtime
  3. Automated GenAIOps Pipeline with Vertex AI Evaluation and Cloud Build
  4. Enterprise Security Hardening with VPC Service Controls, Model Armor, and Private Service Connect
  5. SRE Observability Dashboard with Cloud Monitoring and Automated Remediation
- **Official Google Cloud Architecture Resources**: Direct links to official Google Cloud Architecture Center, Vertex AI documentation, and security best practices.

---

## Technical Stack & Principles

- **Zero Build Step, Zero Dependencies**: Pure standards-based ES6+, CSS custom properties, and semantic HTML5. No build bundler, compiler, or npm packages required at runtime.
- **Instant Client-Side Hash Routing**: Instant navigation across all pillars via hash routing (`#/s`, `#/s/...`, `#/a/...`, `#/d/...`, `#/p/...`, `#/glossary`, `#/start`, `#/gov`, `#/ops`, `#/toolkit`, `#/labs`).
- **Minimal theme**: one sans-serif typeface, light and dark modes, hairline borders and one accent colour, defined as CSS custom properties at the top of `assets/style.css`.
- **Deep Search & Fast Filtering**: Instant client-side search across all 73 services (including previous names), 42 architectures, 23 decisions, 16 playbooks, governance controls, templates, and labs.
- **Strict Data Integrity Testing**: Validated via `scripts/check.mjs`, ensuring zero broken cross-references, complete stepper node coverage, valid see links, and exhaustive solution shaper path execution.

## Verification status and honesty policy

Every service has a metadata record (`data/meta.js`). Today all 73 are marked **needs-verification** with lifecycle **unknown**: nobody has yet compared them with official Google documentation, and the site says so on each service page. A record can only become `verified` with an ISO date and a Google documentation URL; the validator enforces it. Engineering guidance added in the latest upgrade is labelled "Atlas guidance, not an official Google recommendation". See `docs/content-governance.md` and `docs/known-limitations.md`.

## Runnable local labs

Two labs run with Node only (no cloud account, no network, no cost), using mock tools and a synthetic corpus:

```bash
node labs/rag-eval/run.mjs            # access-controlled retrieval, deletion, evaluation gate
node labs/bounded-agent/run.mjs       # budgets, approvals, failure injection, trajectory evaluation
```

They demonstrate engineering controls. They do not benchmark any Google service.

## Tests

```bash
node scripts/check.mjs
node --test "tests/*.test.mjs"
node --test labs/rag-eval/test.mjs labs/bounded-agent/test.mjs
npm run smoke      # browser smoke test over every route (needs Playwright; see docs/testing-and-release.md)
npm run verify     # check + tests + smoke
```

See `CHANGELOG.md` for what changed and why.

## Documentation

`docs/implementation-status.md` (task-by-task ledger), `docs/audit/`, `docs/architecture/`, `docs/decisions/`, `docs/content-governance.md`, `docs/contributing-content.md`, `docs/testing-and-release.md`, `docs/known-limitations.md`.

## Run Locally

```bash
python3 -m http.server 8000
# Navigate to http://localhost:8000
```
