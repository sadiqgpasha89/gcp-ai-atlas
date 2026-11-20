/* AI Engineering Manager's Toolkit: Delivery, Governance, Templates & Frameworks */
window.ATLAS.toolkit = {
  "title": "AI Engineering Manager's Toolkit",
  "lede": "Practical artifacts, calculators, and decision templates designed for engineering managers and principal engineers delivering production AI systems on Google Cloud.",
  "useCaseAssessment": {
    "title": "AI Use-Case Assessment Matrix (Value vs Feasibility)",
    "intro": "Evaluate candidate AI initiatives across business impact and technical feasibility before committing engineering headcount. Score each dimension 1 to 5.",
    "dimensions": [
      {
        "category": "Business Value (Weight: 50%)",
        "criteria": [
          {
            "name": "Direct ROI / Cost Savings",
            "desc": "Measurable labor hours saved, operational cost reduced, or cycle time shortened."
          },
          {
            "name": "Revenue & Competitive Differentiation",
            "desc": "Direct revenue generation, customer retention, or unique market advantage."
          },
          {
            "name": "Strategic Alignment",
            "desc": "Directly supports primary corporate executive OKRs and board priorities."
          },
          {
            "name": "Stakeholder & Executive Sponsorship",
            "desc": "Committed business unit owner ready to test and champion user adoption."
          }
        ]
      },
      {
        "category": "Technical Feasibility (Weight: 50%)",
        "criteria": [
          {
            "name": "Data Readiness & Quality",
            "desc": "Curated, clean, permissioned enterprise documents and structured data exist in [[gcs]]."
          },
          {
            "name": "Deterministic Accuracy Tolerance",
            "desc": "Can business tolerate 95% accuracy with human fallback, or is 100% precision required?"
          },
          {
            "name": "Reasoning Complexity",
            "desc": "Simple lookup/summary (high feasibility) vs autonomous multi-step reasoning (lower feasibility)."
          },
          {
            "name": "Security & Regulatory Risk",
            "desc": "Low risk (internal FAQ) vs high risk (financial transactions, healthcare PII)."
          }
        ]
      }
    ],
    "scoringMatrix": [
      {
        "range": "Score 18-20",
        "verdict": "Priority 1: Immediate Win",
        "action": "Fund immediately. High value, low technical complexity. Start rapid prototype."
      },
      {
        "range": "Score 14-17",
        "verdict": "Priority 2: Strategic Investment",
        "action": "Plan for next quarter. Requires data curation or architecture spike first."
      },
      {
        "range": "Score 10-13",
        "verdict": "Caution: Re-scope or Simplify",
        "action": "Complexity exceeds near-term value. Re-scope into a narrow deterministic workflow."
      },
      {
        "range": "Below 10",
        "verdict": "Reject / Deprioritize",
        "action": "Do not fund. Unclear value or extreme technical/regulatory risk."
      }
    ]
  },
  "projectEstimation": {
    "title": "AI Project Estimation Framework",
    "intro": "Standard software estimation models fail on AI projects because data preparation, prompt experimentation, and evaluation sweeps consume more time than writing application glue.",
    "phases": [
      {
        "name": "Phase 1: Discovery & Eval Set Curation (2-3 Weeks)",
        "alloc": "20% Headcount",
        "deliverables": "Curating 100-200 representative test questions; labeling ground truth; establishing baseline score on simple prompt."
      },
      {
        "name": "Phase 2: RAG / Tool Architecture Spike (3-4 Weeks)",
        "alloc": "35% Headcount",
        "deliverables": "Document cracking via Document AI; datastore indexing in Vertex AI Search; building tool Cloud Run services; testing hybrid search recall."
      },
      {
        "name": "Phase 3: Security & Enterprise Hardening (2-3 Weeks)",
        "alloc": "25% Headcount",
        "deliverables": "Cloud IAM identity propagation; Private Service Connect networking; document security trimming; Model Armor; Apigee rate limits."
      },
      {
        "name": "Phase 4: Operations & Launch Readiness (2 Weeks)",
        "alloc": "20% Headcount",
        "deliverables": "Canary deployment setup; Cloud Monitoring dashboards; on-call runbooks; quota approvals; load and failure testing."
      }
    ]
  },
  "architectureReview": {
    "title": "AI Architecture Review Template",
    "intro": "Standardized questionnaire to evaluate AI solution designs during formal engineering architecture reviews.",
    "templateMarkdown": "# AI Architecture Review: [System Name]\n\n**Review Date:** YYYY-MM-DD\n**Engineering Manager:** [Name]\n**Principal Engineer / Lead Architect:** [Name]\n**Product Manager:** [Name]\n**Review Status:** [Approved / Approved with Conditions / Rejected]\n\n---\n\n## 1. System Overview & Problem Statement\n- What business problem does this solve, and why is an AI model required over deterministic code?\n- Target user personas, expected concurrent users, and peak query volume (requests per second).\n\n## 2. Model & Hosting Strategy\n- **Selected Models:** (e.g. Gemini 1.5 Pro, Gemini 1.5 Flash, text-embedding-004).\n- **Deployment Type:** [Gemini Pay-As-You-Go / Provisioned Throughput / Multi-Region / GKE Self-Hosted].\n- **Residency & Sovereignty:** Does this workload process data outside the primary Google Cloud Region?\n- **Quota & Capacity:** Are approved tokens per minute (TPM) sufficient for 3x anticipated launch peak?\n\n## 3. Data & Retrieval Layer (RAG)\n- **Document Ingestion:** How are documents cracked and chunked? Is Document AI used for tables?\n- **Search Strategy:** Pure vector or Hybrid (BM25 + Dense Vectors) + Google Semantic Ranker?\n- **Tenancy & Security Trimming:** How are document-level permissions enforced? Are filters injected server-side?\n\n## 4. Agentic Architecture & Autonomy Controls\n- **Orchestration Pattern:** [Sequential / Supervisor / Handoff / Deterministic Workflow with LLM].\n- **Tool Authorization:** Do tools execute with user-delegated tokens or shared service credentials?\n- **Blast Radius & Approval Gates:** Which tools perform writes, and how is human authorization enforced via Cloud Workflows?\n- **Safety Budgets:** What are the hard caps on tool iterations (max turns) and wall-clock timeout?\n\n## 5. Security & Governance\n- **Network Isolation:** Are all AI endpoints on Private Service Connect with public access disabled?\n- **Guardrails:** Are Model Armor and Vertex AI safety filters enabled for both input and retrieved context?\n- **Zero Customer Data Retention (ZCDR):** Is contractual zero data retention confirmed?\n\n## 6. Observability, Evals & Operations\n- **Evaluation Baseline:** What is the current Recall@K, Groundedness, and Relevance score on the golden dataset?\n- **Production Dashboard:** Are P95 TTFT, 429 quota spikes, and tool error rates instrumented in Cloud Monitoring?\n- **Cost per Task:** What is the modeled unit economics cost per successful task?\n- **Rollback Mechanism:** How is a broken prompt or bad model version rolled back within 5 minutes?\n"
  },
  "raciMatrix": {
    "title": "AI Engineering RACI Matrix",
    "intro": "Clarifies engineering accountability, ownership, and advisory roles across AI projects.",
    "roles": [
      "Engineering Manager (EM)",
      "Principal Engineer (PE)",
      "AI / ML Engineer",
      "Data Engineer",
      "Product Manager (PM)",
      "InfoSec / Compliance"
    ],
    "matrix": [
      {
        "task": "Use-case scoping and business ROI definition",
        "raci": [
          "A",
          "C",
          "I",
          "I",
          "R",
          "C"
        ]
      },
      {
        "task": "Golden evaluation dataset creation & labeling",
        "raci": [
          "A",
          "C",
          "R",
          "C",
          "R",
          "I"
        ]
      },
      {
        "task": "Model selection & deployment type (PT vs Pay-As-You-Go)",
        "raci": [
          "A",
          "R",
          "C",
          "I",
          "I",
          "C"
        ]
      },
      {
        "task": "RAG retrieval architecture (hybrid, reranking, chunking)",
        "raci": [
          "I",
          "A",
          "R",
          "C",
          "I",
          "I"
        ]
      },
      {
        "task": "Data pipeline ingestion & document cracking",
        "raci": [
          "I",
          "C",
          "C",
          "R/A",
          "I",
          "I"
        ]
      },
      {
        "task": "Agent tool authorization & security boundary design",
        "raci": [
          "A",
          "R",
          "C",
          "I",
          "I",
          "C"
        ]
      },
      {
        "task": "Data privacy, PII masking & residency compliance",
        "raci": [
          "A",
          "C",
          "I",
          "I",
          "I",
          "R/A"
        ]
      },
      {
        "task": "CI/CD pipeline & automated evaluation gates",
        "raci": [
          "I",
          "A",
          "R",
          "I",
          "I",
          "I"
        ]
      },
      {
        "task": "Operational dashboards, runbooks & on-call rota",
        "raci": [
          "A",
          "R",
          "C",
          "I",
          "I",
          "I"
        ]
      },
      {
        "task": "Cost per task optimization & FinOps levers",
        "raci": [
          "A",
          "R",
          "C",
          "I",
          "C",
          "I"
        ]
      }
    ]
  },
  "raidTracker": {
    "title": "AI Project RAID Tracker (Risks, Assumptions, Issues, Dependencies)",
    "intro": "Pre-populated RAID template highlighting the typical failure modes in enterprise generative AI initiatives on Google Cloud.",
    "items": [
      {
        "type": "Risk",
        "title": "HTTP 429 ResourceExhausted quota errors at launch",
        "mitigation": "Request quota 4 weeks prior; implement multi-region failover endpoints."
      },
      {
        "type": "Risk",
        "title": "Prompt injection via retrieved customer documents",
        "mitigation": "Deploy Model Armor; delimit untrusted text in system prompt."
      },
      {
        "type": "Risk",
        "title": "Uncontrolled cost explosion from multi-agent loops",
        "mitigation": "Enforce hard limits on maximum tool turns (max 5) and session timeout."
      },
      {
        "type": "Assumption",
        "title": "Enterprise documents contain accurate, up-to-date knowledge",
        "validation": "Audit document owners and Cloud Storage lifecycle policies before ingestion."
      },
      {
        "type": "Assumption",
        "title": "End users accept 95% accuracy with human escalation path",
        "validation": "Confirm with product stakeholders and user research in pre-pilot phase."
      },
      {
        "type": "Issue",
        "title": "Naive chunker destroys tables in financial PDF reports",
        "resolution": "Replace standard text splitter with Google Cloud Document AI layout models."
      },
      {
        "type": "Dependency",
        "title": "Enterprise Cloud Identity group sync for document ACLs",
        "resolution": "Coordinate with Identity Team to ensure group claims are present in OAuth tokens."
      },
      {
        "type": "Dependency",
        "title": "Provisioned Throughput quota approval for Gemini",
        "resolution": "Submit Google Cloud Quota increase request across candidate regions."
      }
    ]
  },
  "qualityGates": {
    "title": "Maturity Quality Gates & Exit Criteria",
    "intro": "Measurable acceptance criteria required to promote an AI feature across stages.",
    "stages": [
      {
        "stage": "Gate 1: Prototype -> Pilot",
        "criteria": [
          "Golden evaluation dataset of at least 100 representative cases exists in Git.",
          "Baseline Groundedness score exceeds 90% on golden evaluation set.",
          "Initial cost per task modeled and accepted by business owner.",
          "All tool actions are read-only or gated behind manual human approvals.",
          "Basic prompt injection defense verified with red-team test suite."
        ]
      },
      {
        "stage": "Gate 2: Pilot -> Production",
        "criteria": [
          "Evaluation dataset expanded to 500+ real-world cases; Groundedness >95%, Relevance >90%.",
          "Automated evaluation gates integrated into CI/CD build pipeline.",
          "Model quota approved for 3x peak; multi-region failover verified under load.",
          "Document-level security trimming verified with zero cross-tenant query leakage.",
          "Zero Customer Data Retention (ZCDR) confirmed with Google Cloud.",
          "Production dashboard active in Cloud Monitoring; on-call rota and runbooks staffed."
        ]
      },
      {
        "stage": "Gate 3: Production -> Scale",
        "criteria": [
          "Unit economics optimized: context caching active (>35% hit rate) and batch prediction utilized for offline tasks.",
          "Cost per successful task is stable under 10x traffic projections.",
          "Continuous drift monitoring detects quality regression within 1 hour.",
          "Quarterly model retirement and upgrade evaluation schedule established."
        ]
      }
    ]
  },
  "vendorMatrix": {
    "title": "Model & Platform Assessment Matrix",
    "intro": "Comparing foundation model options and deployment paths available on Vertex AI.",
    "models": [
      {
        "family": "Gemini Frontier Models (Gemini 1.5 Pro)",
        "strengths": "Massive 2M token context window, multimodal audio/video/text reasoning, excellent code generation.",
        "tradeoffs": "Higher cost per token, subject to regional quota allocations.",
        "bestFit": "Multi-agent supervisors, long-document contract synthesis, complex multimodal video/audio analysis."
      },
      {
        "family": "Gemini High-Speed Models (Gemini 1.5 Flash)",
        "strengths": "Sub-second TTFT, fraction of the cost, 1M token context, high concurrency.",
        "tradeoffs": "Lower multi-step reasoning depth; prone to drift on complex open-ended instructions.",
        "bestFit": "High-volume chatbot triage, real-time summarization, classification, query routing."
      },
      {
        "family": "Partner Models on Vertex (Anthropic Claude 3.5 Sonnet on Vertex)",
        "strengths": "Available in Model Garden; native Google Cloud billing and IAM integration.",
        "tradeoffs": "Subject to partner regional availability.",
        "bestFit": "Multi-vendor redundancy, complex coding tasks, compliance mandates."
      },
      {
        "family": "Open-Weight Models (Gemma 2, Llama 3 on Model Garden / GKE)",
        "strengths": "Deployable on dedicated TPU/GPU GKE clusters; prevents vendor lock-in.",
        "tradeoffs": "Self-hosting requires managing GKE infrastructure and vLLM runtimes.",
        "bestFit": "On-premises locality, strict regulatory privacy mandates, bespoke domain fine-tuning."
      }
    ]
  },
  "skillsMatrix": {
    "title": "AI Engineering Team Skills & Capability Matrix",
    "intro": "Assess current team capabilities and identify hiring or training gaps across the AI engineering lifecycle.",
    "competencies": [
      {
        "area": "RAG & Search Engineering",
        "skills": "Document parsing, layout analysis, vector indexing algorithms (ScaNN), hybrid search, semantic reranking, metadata filtering.",
        "levelTarget": "Advanced (Essential for all knowledge assistants)"
      },
      {
        "area": "Agent Architecture & Orchestration",
        "skills": "Vertex AI Agent Runtime, ADK, state persistence in Firestore, tool interface design, MCP protocol, human-in-the-loop flows.",
        "levelTarget": "Intermediate to Advanced (Essential for multi-agent systems)"
      },
      {
        "area": "GenAIOps & Evaluation",
        "skills": "Vertex AI Evaluation Service, synthetic dataset generation, automated LLM-as-a-judge scoring, CI/CD evaluation gates, drift detection.",
        "levelTarget": "Advanced (Mandatory for production release confidence)"
      },
      {
        "area": "AI Security & Governance",
        "skills": "Cloud IAM Workload Identity, Model Armor, indirect injection mitigations, document ACLs, Private Service Connect.",
        "levelTarget": "Intermediate (Essential for enterprise compliance)"
      },
      {
        "area": "Cloud Platform & FinOps",
        "skills": "Terraform / Infra Manager, Apigee AI gateway policies, Provisioned Throughput sizing, context caching economics, Cloud Monitoring.",
        "levelTarget": "Intermediate to Advanced (Essential for scalability and budget control)"
      }
    ]
  },
  "executiveReportTemplate": {
    "title": "Executive AI Status Report Template",
    "intro": "One-page monthly executive reporting template for leadership, steering committees, and business sponsors.",
    "templateMarkdown": "# Executive AI Status Report: [Project Name]\n\n**Reporting Period:** [Month, Year]\n**Engineering Manager:** [Name]\n**Product Sponsor:** [Name]\n**Overall Health:** [Green / Amber / Red]\n\n---\n\n## 1. Business Value & Milestone Highlights\n- **Key Achievements:** [Top 2-3 business outcomes delivered this month].\n- **Production Adoption:** [Active users, tasks completed, user satisfaction rating].\n- **Efficiency Impact:** [Hours saved or revenue influenced].\n\n## 2. Quality & Reliability Scorecard\n| Metric | Target | Current | Trend | Status |\n| :--- | :--- | :--- | :--- | :--- |\n| Task Completion Rate | >95% | 98.5% | +0.7% | On Target |\n| Groundedness (Evals) | >95% | 96.5% | +0.5% | On Target |\n| P95 Response Latency | <2,000ms | 1,390ms | -150ms | On Target |\n| HTTP 429 Quota Error Rate | <0.1% | 0.06% | -0.01% | On Target |\n\n## 3. Financial Performance (FinOps)\n- **Monthly Cloud & Token Spend:** $X,XXX (Budget: $Y,YYY · Variance: Z%).\n- **Unit Economics (Cost per Task):** $0.0138 (Target: <$0.020).\n- **Optimization Impact:** Context caching and multi-region routing saved $X,XXX this month.\n\n## 4. Key Risks & Delivery Blockers\n- **Blocker 1:** [Description, business impact, owner, required leadership decision].\n- **Risk 1:** [Upcoming risk e.g. quota limit, vendor model retirement, or compliance review].\n\n## 5. Next Month Priorities\n1. [Milestone 1: e.g. Expanding pilot to 500 business users].\n2. [Milestone 2: e.g. Deploying automated PR evaluation gate in Cloud Build].\n3. [Milestone 3: e.g. Integrating document security trimming with Cloud Identity group claims].\n"
  }
,
  "templates": [
  {
    "id": "ai-sdd",
    "title": "1. AI Solution Design Document (SDD)",
    "badge": "Architecture Template",
    "desc": "Standardized enterprise technical design document for GenAI, RAG, and agentic systems on Google Cloud.",
    "markdown": "# AI Solution Design Document: [Project Name]\n\n**Document Version:** 1.0  \n**Author / Tech Lead:** [Name]  \n**Engineering Manager:** [Name]  \n**Principal Architect:** [Name]  \n**Target Release Date:** [YYYY-MM-DD]  \n**System Classification:** [Internal Copilot / External Customer-Facing / Autonomous Agent / Analytical Pipeline]\n\n---\n\n## 1. Executive Summary & Business Problem\n- **Problem Statement:** What specific enterprise bottleneck does this system address?\n- **Target Users & Volume:** Who uses it? Expected QPS, DAU, and concurrency.\n- **Business KPIs:** Measured labor savings, conversion lift, or cycle-time reduction.\n\n## 2. Architecture & Service Selection\n- **Architecture Pattern:** [[a:traditional-rag|Traditional RAG]] / [[a:agentic-rag|Agentic RAG]] / [[a:multiagent-orchestration|Multi-Agent]] / [[a:sql-rag|NL2SQL]].\n- **Foundation Models:** Gemini 1.5 Flash (routing/classification) + Gemini 1.5 Pro (complex reasoning).\n- **Compute & Runtime:** Cloud Run (serverless container) / Vertex AI Agent Runtime / GKE.\n- **Data & Retrieval:** Vertex AI Search / Vector Search / BigQuery / AlloyDB / Cloud Storage.\n- **Network Path:** External Load Balancer -> Cloud Armor -> Cloud Run -> Private Service Connect -> Model.\n\n## 3. Data Architecture & Ingestion\n- **Source Documents:** Format (PDF, DOCX, HTML, DB), storage location, and total corpus size.\n- **Cracking & Chunking:** Document AI layout parser; Markdown chunking with section header prepending.\n- **Vector Embeddings:** Multimodal or text embedding model version; ScaNN index parameters.\n- **Freshness & Sync:** Incremental ingestion schedule, tombstoning, and document deletion propagation.\n\n## 4. Agent & Tool Integration (if applicable)\n- **Agent Framework:** Google Agent Development Kit (ADK) / Vertex AI Agent Runtime.\n- **Tool Catalog:** List of registered tools with schemas, permissions, and timeout budgets.\n- **Human-in-the-Loop:** Checkpoints where irreversible write actions require human sign-off.\n- **Autonomy Bounds:** Hard iteration limit (max 5 turns) and session token budget cap.\n\n## 5. Security & Governance\n- **Authentication & Identity:** Cloud IAM Workload Identity; verified end-user JWT token propagation.\n- **Threat Mitigations:** Model Armor prompt injection filters; Sensitive Data Protection PII masking.\n- **Perimeter Security:** VPC Service Controls perimeter; CMEK encryption in Cloud KMS.\n- **Document-Level ACLs:** User claim tags enforced at vector retrieval layer.\n\n## 6. Evaluation & Quality Gates\n- **Golden Evaluation Dataset:** 200+ curated QA pairs with ground-truth passages.\n- **Retrieval Metrics:** Target Recall@5 > 88%, MRR > 0.80.\n- **Generation Metrics:** Target Groundedness > 95%, Answer Relevance > 92%.\n- **Automated CI Release Gates:** Build failure thresholds configured in Cloud Build.\n\n## 7. Observability & Operations\n- **Telemetry Stack:** Cloud Monitoring dashboards, Cloud Logging, and OpenTelemetry tracing.\n- **Key SLOs:** Time to First Token (TTFT) P95 < 1,500ms; HTTP 429 quota errors < 0.1%.\n- **Incident Response:** Runbook for model API degradation, prompt circuit breakers, and on-call rota.\n\n## 8. FinOps & Unit Economics\n- **Cost per Successful Task:** Target budget per completed user transaction.\n- **Optimization Levers:** Gemini Context Caching, Redis semantic caching, prompt compression.\n- **Monthly Run-Rate Forecast:** Expected spend at 1x, 5x, and 10x volume."
  },
  {
    "id": "adr",
    "title": "2. Architecture Decision Record (ADR)",
    "badge": "Decision Record",
    "desc": "Lightweight format for recording technical decisions, rationale, trade-offs, and reversibility.",
    "markdown": "# ADR-[NNN]: [Title of Decision]\n\n**Status:** [Proposed | Accepted | Superseded by ADR-xxx]  \n**Date:** [YYYY-MM-DD]  \n**Decision Owners:** Engineering Manager: [Name] · Principal Engineer: [Name]  \n**Reversibility:** [Two-Way Door (Easy to reverse) | One-Way Door (Hard to reverse)]  \n**Revisit Date:** [Quarter / Date]\n\n---\n\n## 1. Context & Problem Statement\nWhat is the specific architectural dilemma? (e.g. Choosing between Vertex AI Search vs AlloyDB with ScaNN, or choosing between a single agent vs multi-agent hierarchy). What are the business and technical constraints?\n\n## 2. Considered Alternatives\n1. **Option A:** [Description, pros, cons]\n2. **Option B:** [Description, pros, cons]\n3. **Option C:** [Description, pros, cons]\n\n## 3. Decision & Rationale\nWe decided to adopt **[Option X]** because:\n- Rationale 1: [Alignment with business SLA and latency budget]\n- Rationale 2: [Operational simplicity and team skill alignment]\n- Rationale 3: [Unit economics and cost per task at scale]\n\n## 4. Consequences & Trade-offs\n- **Positive:** [What do we gain in speed, quality, or simplicity?]\n- **Negative / Risks:** [What technical debt, vendor dependency, or operational constraints are introduced?]\n- **Mitigation:** [How will we mitigate the identified trade-offs?]\n\n## 5. Review & Rollback Plan\nIf this decision must be reversed (e.g. latency exceeds budget or scale limits hit), the migration trigger is [Specific Metric / Event] and the transition path is [Alternative Path]."
  },
  {
    "id": "readiness-checklist",
    "title": "3. Production Readiness Review Checklist",
    "badge": "Launch Checklist",
    "desc": "15-category operational launch review to prevent premature deployments and production outages.",
    "markdown": "# AI Production Readiness Review (PRR)\n\n**Project Name:** [Name]  \n**Review Date:** [YYYY-MM-DD]  \n**Overall Readiness Score:** [Pass / Conditional Pass / Fail]\n\n---\n\n### Category 1: Business & Value Alignment\n- [ ] Measurable business outcome and KPI target defined and agreed with product sponsor.\n- [ ] User feedback mechanism (thumbs up/down + correction field) integrated into UI.\n\n### Category 2: Data Quality & Governance\n- [ ] Source documents cataloged with verified data owners.\n- [ ] Document cracking handles multi-column layouts and tables without corruption.\n- [ ] Incremental ingestion and deletion synchronization (tombstoning) verified.\n\n### Category 3: Model & Prompt Engineering\n- [ ] Model versions pinned in configuration (no unversioned latest tags).\n- [ ] System prompts isolated with clear XML delimiters for untrusted context.\n- [ ] Few-shot examples tested against negative and edge cases.\n\n### Category 4: Retrieval Quality (RAG)\n- [ ] Recall@K measured on versioned golden test set (Target: Recall@5 > 85%).\n- [ ] Hybrid search (dense vectors + BM25 keyword) configured with Reciprocal Rank Fusion.\n- [ ] Semantic reranker deployed and latency overhead benchmarked.\n\n### Category 5: Agent Governance & Bounds\n- [ ] Hard step iteration cap enforced (max 5 tool calls per turn).\n- [ ] Write operations and financial transactions require human approval.\n- [ ] Deadlock and infinite delegation circuit breakers verified.\n\n### Category 6: AI Security & Guardrails\n- [ ] Model Armor prompt injection and jailbreak filters active on inputs and outputs.\n- [ ] Sensitive Data Protection (DLP) masks PII before prompts enter model context.\n- [ ] Document-level security trimming (ACLs) verified with cross-tenant penetration test.\n\n### Category 7: Evaluation & Quality Gates\n- [ ] Golden test set of 200+ cases evaluated; Groundedness score > 95%.\n- [ ] Automated evaluation step integrated into Cloud Build CI pipeline.\n- [ ] Regression threshold configured to block builds if quality drops > 1%.\n\n### Category 8: Reliability & Quotas\n- [ ] Peak concurrency load test executed; HTTP 429 error rate < 0.1%.\n- [ ] Multi-region fallback endpoints configured in client SDK.\n- [ ] Exponential backoff with full jitter configured on all model API calls.\n\n### Category 9: Observability & Tracing\n- [ ] Cloud Monitoring dashboard displaying the 10 core operational indicators.\n- [ ] Distributed tracing captures root span, model latency, and serialized tool calls.\n- [ ] Alerting policies configured with on-call rota in PagerDuty / Cloud Alerting.\n\n### Category 10: FinOps & Cost Controls\n- [ ] Cost per successful task measured and validated against budget model.\n- [ ] Budget alerts configured in Cloud Billing with automated alert notifications.\n- [ ] Context caching or semantic Redis cache enabled for high-frequency queries.\n\n### Category 11: Deployment & Rollback\n- [ ] Infrastructure defined as code in Terraform or Infrastructure Manager.\n- [ ] Canary traffic splitting (10% / 90%) tested on Vertex AI Endpoints or Cloud Run.\n- [ ] Tested 60-second one-click rollback script available to on-call engineer."
  },
  {
    "id": "threat-model",
    "title": "4. AI Threat Model & STRIDE Matrix",
    "badge": "Security Template",
    "desc": "Structured security risk assessment evaluating AI systems against prompt injection, exfiltration, and tool abuse.",
    "markdown": "# AI Architecture Threat Model (STRIDE)\n\n**System Name:** [Name]  \n**Lead Security Engineer:** [Name]  \n**Review Date:** [YYYY-MM-DD]\n\n---\n\n## 1. Trust Boundaries & Data Flow Diagram\n- **Boundary 1 (User to Gateway):** Public internet / corporate intranet to Cloud Armor & API Gateway.\n- **Boundary 2 (Gateway to Backend):** Application microservice to Cloud Run / Agent Runtime.\n- **Boundary 3 (Agent to Tools):** Agent invoking internal databases, microservices, and external SaaS APIs.\n- **Boundary 4 (Retrieval to Model):** Untrusted document passages injected into LLM context window.\n\n## 2. STRIDE Assessment for AI Systems\n\n| Threat Category | AI Attack Vector | Impact | Mitigation Strategy | Status |\n| :--- | :--- | :--- | :--- | :--- |\n| **Spoofing** | Attacker spoofs agent identity to execute tools | Unauthorized tool execution | Enforce mutual TLS (mTLS) and OAuth token exchange in [[agent-governance]] | Mitigated |\n| **Tampering** | Indirect prompt injection hidden in uploaded PDF | Agent hijacked into unintended actions | Model Armor input screening + XML context delimiters | Mitigated |\n| **Repudiation** | User denies authorizing automated financial transaction | Legal liability, audit failure | Immutable audit logging of user approvals in [[audit-logs]] | Mitigated |\n| **Information Disclosure** | RAG retrieval leaks confidential salary data to peer | Privacy violation, GDPR breach | Document-level ACL pre-filtering via verified user JWT claims | Mitigated |\n| **Denial of Service** | Crafted prompt causes infinite tool recursion and quota crash | Production outage, $10k token bill | Hard step cap (max 5) + Cloud Tasks rate limiting | Mitigated |\n| **Elevation of Privilege** | Agent calls database administrative tools | Database dropped or corrupted | Least-privilege IAM service account; read-only credentials | Mitigated |\n\n## 3. High-Priority Risk Treatment Plan\n1. **Risk:** Indirect prompt injection via retrieved web content.  \n   *Action:* Deploy [[model-armor]] and treat all retrieved passages as untrusted data blocks.\n2. **Risk:** Runaway billing loops during API outages.  \n   *Action:* Configure strict session token limits and Cloud Billing budget kill-switches."
  },
  {
    "id": "eval-report",
    "title": "5. AI Evaluation Report & Benchmark",
    "badge": "Evaluation Template",
    "desc": "Empirical quality report benchmarking accuracy, Groundedness, retrieval recall, and latency across releases.",
    "markdown": "# AI Quality Evaluation Benchmark Report\n\n**Evaluation Run ID:** [eval-2026-xxx]  \n**Date:** [YYYY-MM-DD]  \n**Model Version:** Gemini 1.5 Pro vs Gemini 1.5 Flash  \n**Dataset:** Golden Eval Set v2.4 (350 enterprise QA pairs)  \n**Evaluator Tool:** [[ap-evals|Vertex AI Evaluation Service]]\n\n---\n\n## 1. Executive Evaluation Summary\n- **Overall Verdict:** [PASS / FAIL] — Release meets production quality gates.\n- **Key Takeaway:** Gemini 1.5 Pro achieved 96.8% Groundedness with zero detected hallucinations on legal queries. Gemini 1.5 Flash achieved 92.1% Groundedness at 5x lower latency and 15x lower cost.\n\n## 2. Retrieval Evaluation (Component Level)\n| Metric | Baseline (v1.0) | Current Run (v2.0) | Target | Delta | Status |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n| **Recall@3** | 78.2% | 86.4% | >85% | +8.2% | PASS |\n| **Recall@5** | 84.1% | 91.8% | >90% | +7.7% | PASS |\n| **MRR (Mean Recip. Rank)** | 0.72 | 0.84 | >0.80 | +0.12 | PASS |\n| **NDCG@10** | 0.79 | 0.89 | >0.85 | +0.10 | PASS |\n| **Context Relevance** | 82.5% | 89.2% | >88% | +6.7% | PASS |\n\n## 3. Generation & Grounding Evaluation (End-to-End)\n| Metric | Baseline | Current Run | Target | Delta | Status |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n| **Groundedness / Faithfulness** | 91.2% | 96.8% | >95% | +5.6% | PASS |\n| **Answer Relevance** | 89.0% | 94.2% | >92% | +5.2% | PASS |\n| **Citation Accuracy** | 93.5% | 99.1% | >98% | +5.6% | PASS |\n| **Hallucination Rate** | 4.8% | 0.9% | <2.0% | -3.9% | PASS |\n| **Safety Violation Rate** | 0.0% | 0.0% | 0.0% | 0.0% | PASS |\n\n## 4. Latency & Token Economics\n- **Time to First Token (TTFT):** P50: 380ms · P95: 1,120ms (Target: <1,500ms).\n- **Total Request Latency:** P50: 1.8s · P95: 3.4s.\n- **Average Cost per Query:** $0.0034 (Flash) · $0.0182 (Pro).\n\n## 5. Failure Analysis & Remediation\n- **Top Failure Mode:** 4 queries failed due to tables containing merged cells that Document AI flattened incorrectly.\n- **Action Item:** Upgrade Document AI layout parser to latest version with specialized table structure extraction."
  },
  {
    "id": "cost-estimation",
    "title": "6. AI Cost Estimation & FinOps Template",
    "badge": "FinOps Template",
    "desc": "Spreadsheet-ready formula model to forecast token costs, infrastructure hosting, and cost per successful task.",
    "markdown": "# AI Financial Model & Cost Estimation (FinOps)\n\n**Project Name:** [Name]  \n**Forecast Period:** 12 Months  \n**Target Workload:** [e.g. 50,000 active employees · 15 queries/day/user]\n\n---\n\n## 1. Workload Sizing Assumptions\n- **Monthly Active Users (MAU):** 50,000\n- **Daily Tasks per User:** 10\n- **Total Monthly Tasks:** 15,000,000\n- **Average Input Tokens per Turn:** 1,200 tokens\n- **Average Output Tokens per Turn:** 350 tokens\n- **Context Caching Hit Rate:** 35%\n- **Task Success Rate:** 96.5%\n\n## 2. Monthly Cost Breakdown\n\n### A. Inference Costs (Gemini API)\n- *Input Tokens (18 Billion tokens/mo):* $2,250 (Gemini 1.5 Flash @ $0.075/1M, adjusted for 35% cache discount)\n- *Output Tokens (5.25 Billion tokens/mo):* $1,575 (Gemini 1.5 Flash @ $0.30/1M)\n- *Cross-Encoder Reranker:* $450 (Top-20 candidates per query)\n- **Subtotal Inference:** $4,275 / month\n\n### B. Infrastructure & Data Costs\n- *Cloud Run Microservices (8 vCPU / 32GB instances):* $680 / month\n- *Vertex AI Vector Search (1 replica ScaNN index):* $420 / month\n- *Cloud Storage & BigQuery Storage (2 TB dual-region):* $95 / month\n- *Cloud Armor & Load Balancing:* $120 / month\n- **Subtotal Infrastructure:** $1,315 / month\n\n### C. Operational & Tooling Costs\n- *Cloud Monitoring & Logging Telemetry:* $210 / month\n- *CI/CD Automated Evaluation Runs:* $180 / month\n- **Subtotal Operations:** $390 / month\n\n---\n\n## 3. Total Monthly System Cost & Unit Economics\n- **Total Monthly System Cost:** $5,980\n- **Successfully Completed Tasks:** 14,475,000\n- **Cost per Successful Task:**\n  $$\\text{Cost per Task} = \\frac{\\$5,980}{14,475,000} = \\mathbf{\\$0.000413} \\text{ (approx. } \\$0.41 \\text{ per 1,000 tasks)}$$\n\n## 4. Sensitivity Analysis & Scale Breakers\n- **If Volume 5x (75M tasks/mo):** Total cost scales to $26,400/mo ($0.35 per 1,000 tasks).\n- **If Model Upgraded to Pro for 100% of queries:** Total cost surges to $38,500/mo.\n- **FinOps Recommendation:** Maintain hybrid routing (85% Flash / 15% Pro) to keep unit cost under $0.001."
  },
  {
    "id": "incident-response",
    "title": "7. AI Incident Response & Runbook",
    "badge": "Operations Runbook",
    "desc": "SRE incident management runbook for generative AI outages, hallucination cascades, and prompt injection attacks.",
    "markdown": "# Production AI Incident Response Runbook\n\n**Service Name:** [e.g. Enterprise RAG Assistant]  \n**Severity Levels:** SEV-1 (Critical outage / Safety violation) · SEV-2 (Degraded accuracy / High latency) · SEV-3 (Minor regression)\n\n---\n\n## 1. Immediate Triage & Circuit Breakers (First 15 Minutes)\n\n### Scenario A: High Model API Error Rate (HTTP 429 Quota Exhaustion)\n1. **Check Dashboard:** Verify Vertex AI QPM / TPM consumption in Cloud Monitoring.\n2. **Engage Fallback Model:** Update Cloud Run environment variable ACTIVE_MODEL=gemini-1.5-flash or activate secondary region endpoint.\n3. **Throttle Non-Critical Clients:** Apply rate limit reduction in [[apigee|Apigee Gateway]].\n4. **Notify Stakeholders:** Post incident status update on internal Slack channel #ai-incidents.\n\n### Scenario B: Severe Hallucination Cascade / Toxic Output Reported\n1. **Kill Switch:** Enable emergency prompt circuit breaker in [[secret-manager|Secret Manager]] (CIRCUIT_BREAKER_TRIPPED=true). The system will return a graceful fallback: *\"Our assistant is temporarily undergoing maintenance. Please consult human support.\"*\n2. **Collect Evidence:** Export the offending conversation ID, prompt trace, and retrieved document IDs from [[audit-logs]].\n3. **Isolate Root Cause:**\n   - Did source documents contain erroneous text? -> Purge chunk from vector index.\n   - Was the prompt manipulated? -> Add adversarial pattern to [[model-armor]] blocklist.\n   - Did temperature setting drift? -> Reset temperature parameter to 0.0.\n\n### Scenario C: Prompt Injection / Data Exfiltration Attempt Detected\n1. **Revoke User Token:** Invalidate offending user session in [[identity-platform]].\n2. **Inspect Audit Log:** Query BigQuery trace logs for all tools called during the session to verify no unauthorized write actions occurred.\n3. **Update Model Armor Filter:** Add regex and semantic rule to Model Armor policy.\n\n---\n\n## 2. Post-Incident Review (5 Whys for AI)\nEvery SEV-1 or SEV-2 incident requires a blameless postmortem answering:\n1. *Why did the failure reach production?* (Evaluation dataset lacked this edge case).\n2. *Why did retrieval surface misleading context?* (Keyword search overwhelmed semantic vector).\n3. *Why did the model fail to abstain?* (System instruction lacked explicit refusal instructions).\n4. *How do we guarantee this never repeats?* (Add offending query to golden eval suite in CI)."
  },
  {
    "id": "skills-matrix-template",
    "title": "8. Team Skill Matrix & Capability Assessment",
    "badge": "Leadership Template",
    "desc": "Comprehensive framework for assessing AI engineering capabilities, hiring, and structuring production teams.",
    "markdown": "# AI Engineering Team Competency Matrix\n\n**Evaluation Level:** 1 (Awareness) · 2 (Working Knowledge) · 3 (Engineering Proficiency) · 4 (Architecture Proficiency) · 5 (Leadership Mastery)\n\n---\n\n| Competency Domain | Level 1: Awareness | Level 2: Working Knowledge | Level 3: Engineering Proficiency | Level 4: Architecture Proficiency | Level 5: Leadership Mastery |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n| **Foundation Models** | Knows model names (Gemini, Claude, Llama) | Can call APIs via SDK with basic prompts | Tunes system instructions, structured JSON, and few-shot examples | Selects optimal model family based on cost/latency/quality trade-offs | Establishes organizational model routing standards and evaluations |\n| **RAG Engineering** | Understands naive vector search concept | Can chunk text and generate basic embeddings | Implements hybrid search (RRF) and semantic reranking | Designs multi-tenant RAG with document ACLs and custom chunkers | Authors enterprise knowledge retrieval platform strategy |\n| **Agentic AI & ADK** | Can explain agent vs workflow terminology | Can run single tool-calling tutorials | Builds stateful agents with ADK and custom function tools | Architectures multi-agent supervisor hierarchies and MCP servers | Defines organizational autonomy limits and governance gates |\n| **AI Security & Governance** | Knows prompt injection exists | Uses basic regex keyword filters | Configures Model Armor and Sensitive Data Protection (DLP) | Implements VPC-SC perimeters, CMEK, and zero-trust identity | Establishes AI risk taxonomy, compliance, and red-team audits |\n| **Evaluation & Quality** | Tests prompts with manual eyeball checks | Tracks single accuracy metric on CSV | Builds golden datasets and runs automated LLM-as-a-judge | Integrates automated CI/CD release gates and regression tests | Drives statistical quality culture and acceptance criteria |\n| **AI FinOps & Economics** | Checks monthly GCP bill after the fact | Calculates cost per 1M tokens | Implements prompt compression and context caching | Models cost per successful task and rightsizes capacity | Owns multi-million dollar AI budget and ROI attribution |\n| **AI Platform & SRE** | Deploys on local machine or test VM | Deploys containers on basic Cloud Run | Instruments distributed tracing and Cloud Monitoring SLOs | Designs multi-region active-active failover with Private Connect | Sets organizational platform golden paths and SRE standards |"
  }
],
  "useCaseCatalog": [
  {
    "domain": "Retail & E-Commerce",
    "title": "Competitive Intelligence & Dynamic Pricing Assistant",
    "kpi": "3-5% margin improvement · 40% faster pricing response to competitor promotions",
    "suitability": "High (Combines web crawling, tabular sales history, and competitive reasoning)",
    "arch": "hybrid-rag",
    "services": [
      "gcs",
      "document-ai",
      "vector-search",
      "bigquery",
      "gemini"
    ],
    "desc": "Autonomous agent that monitors competitor e-commerce catalogs, parses promotions, queries historical sales elasticities in BigQuery, and proposes dynamic price optimizations to category managers."
  },
  {
    "domain": "Banking & Financial Services",
    "title": "Anti-Money Laundering (AML) & Fraud Ring Investigator",
    "kpi": "65% reduction in manual investigator review time · 28% increase in detected syndicates",
    "suitability": "High (Complex multi-entity relational patterns across disparate transactional records)",
    "arch": "graph-rag",
    "services": [
      "spanner-graph",
      "dataflow",
      "bigquery-ai",
      "gemini",
      "audit-logs"
    ],
    "desc": "GraphRAG assistant that extracts corporate ownership records, maps transaction paths in Spanner Graph, detects circular payments, and synthesizes suspicious activity reports (SARs) with full audit trails."
  },
  {
    "domain": "Insurance",
    "title": "Automated Claims Processing & Damage Extraction",
    "kpi": "75% reduction in claims turnaround (from 7 days to 4 hours) · 18% fraud detection lift",
    "suitability": "High (Multimodal reasoning over photos, police reports, and repair estimates)",
    "arch": "multimodal-rag",
    "services": [
      "gcs",
      "document-ai",
      "vision-ai",
      "vector-search",
      "gemini"
    ],
    "desc": "Multimodal system that ingests vehicle damage photos, estimates repair costs, cross-checks policy coverage clauses, and drafts adjuster settlement packages."
  },
  {
    "domain": "Healthcare & Life Sciences",
    "title": "Clinical Documentation & SOAP Notes Assistant",
    "kpi": "2 hours saved per clinician per day · 99.4% factual alignment with patient dialogue",
    "suitability": "High (Audio transcription + complex medical terminology extraction)",
    "arch": "multimodal-intelligence",
    "services": [
      "speech-to-text",
      "gemini",
      "sdp",
      "firestore",
      "cloud-monitoring"
    ],
    "desc": "Ambient clinical intelligence assistant that transcribes patient-doctor consultations, scrubs protected health information (PHI) via SDP, and formats compliant medical records for physician review."
  },
  {
    "domain": "Manufacturing & Industrial",
    "title": "Predictive Equipment Maintenance & Troubleshooting Co-Pilot",
    "kpi": "32% reduction in unplanned factory downtime · 45% faster mean-time-to-repair (MTTR)",
    "suitability": "High (Sensor telemetry anomaly detection + dense PDF technical manuals)",
    "arch": "agentic-rag",
    "services": [
      "pubsub",
      "dataflow",
      "bigquery",
      "ai-search",
      "gemini"
    ],
    "desc": "IoT-connected agent that correlates real-time machine vibration anomalies with historical maintenance logs and equipment schematics to guide technicians through repairs."
  },
  {
    "domain": "Supply Chain & Logistics",
    "title": "Autonomous Global Disruption Rerouting Agent",
    "kpi": "14% reduction in expedited freight costs · 90% faster incident response to port delays",
    "suitability": "High (Real-time external news + ERP inventory tracking + route optimization)",
    "arch": "multiagent-orchestration",
    "services": [
      "adk",
      "agent-runtime",
      "workflows",
      "gemini",
      "cloud-tasks"
    ],
    "desc": "Multi-agent system monitoring port congestion and weather events, automatically modeling alternative maritime/air routes, and submitting re-booking proposals to logistics leads."
  },
  {
    "domain": "Customer Service & Support",
    "title": "Tier-1 Autonomous Resolution & Escalation Agent",
    "kpi": "62% first-contact autonomous resolution · P95 response time < 1.2s · CSAT 4.6/5.0",
    "suitability": "High (Conversational FAQ + authorized CRM account lookups and mutations)",
    "arch": "single-agent",
    "services": [
      "cloud-run",
      "adk",
      "ai-search",
      "gemini",
      "model-armor"
    ],
    "desc": "Grounded customer service co-pilot that resolves tier-1 order issues, processes returns, and seamlessly escalates complex edge cases to human agents with full context."
  },
  {
    "domain": "Human Resources",
    "title": "Employee Policy, Benefits & Onboarding Co-Pilot",
    "kpi": "80% reduction in routine HR tickets · 100% cited answers from company handbooks",
    "suitability": "High (Internal document RAG with role-based security permissions)",
    "arch": "secure-multitenant-rag",
    "services": [
      "identity-platform",
      "ai-search",
      "gcs",
      "gemini",
      "model-armor"
    ],
    "desc": "Workplace assistant answering employee queries regarding parental leave, healthcare tiers, and 401(k) vesting, strictly filtering answers by employee location and department clearance."
  },
  {
    "domain": "IT Operations & Engineering",
    "title": "Autonomous Incident Triage & Runbook Co-Pilot",
    "kpi": "50% reduction in Mean-Time-to-Identify (MTTI) · 35% automated diagnostic execution",
    "suitability": "High (Log pattern correlation + code comprehension + runbook execution)",
    "arch": "governed-agent-workflow",
    "services": [
      "cloud-monitoring",
      "audit-logs",
      "workflows",
      "cloud-run",
      "gemini"
    ],
    "desc": "SRE co-pilot that ingests error spikes during outages, matches stack traces to known runbooks, executes diagnostic read-only commands, and drafts postmortem summaries."
  },
  {
    "domain": "Legal & Compliance",
    "title": "Automated Commercial Contract Redlining & Risk Auditor",
    "kpi": "85% faster contract initial review · 100% detection of non-standard indemnification clauses",
    "suitability": "High (Dense semantic analysis against institutional playbook standards)",
    "arch": "sequential-agents",
    "services": [
      "document-ai",
      "vector-search",
      "adk",
      "gemini",
      "agent-memory"
    ],
    "desc": "Sequential agent pipeline that parses incoming 100-page vendor MSAs, flags clauses deviating from corporate legal standards, and generates redline recommendations with rationale."
  },
  {
    "domain": "Sales & Business Development",
    "title": "RFP Proposal Generator & Account Intelligence Agent",
    "kpi": "70% reduction in RFP response time · 15% increase in technical win rate",
    "suitability": "High (Product knowledge retrieval + CRM integration + tailored synthesis)",
    "arch": "agentic-rag",
    "services": [
      "ai-search",
      "bigquery",
      "adk",
      "gemini",
      "cloud-run"
    ],
    "desc": "Sales intelligence agent that parses complex customer RFP questionnaires, retrieves approved product security answers from historical bids, and drafts executive proposals."
  },
  {
    "domain": "Marketing & Brand Strategy",
    "title": "Multilingual Campaign Localization & Visual Asset Generator",
    "kpi": "4x faster global campaign rollout · 100% brand tone and legal compliance",
    "suitability": "High (Creative text adaptation + cultural localization + brand compliance checks)",
    "arch": "prompt-engine",
    "services": [
      "model-garden",
      "gemini",
      "memorystore",
      "cloud-run",
      "model-armor"
    ],
    "desc": "Creative co-pilot that adapts core marketing campaigns into 20+ localized languages, checking translations against cultural nuances and trademark guidelines."
  }
],
  "dailyCockpit": {
  "title": "Daily AI Engineering Manager Cockpit",
  "intro": "Essential daily operating checklists for engineering managers and principal architects leading AI delivery on Google Cloud.",
  "domains": [
    {
      "title": "Architecture Review Check",
      "questions": [
        "Is the proposed architecture appropriate for the specific business problem, or is it over-engineered with unnecessary multi-agent complexity?",
        "Are we using the optimal GCP services (e.g. Vertex AI Search vs Vector Search vs AlloyDB) based on verified scale and latency constraints?",
        "Does the architecture implement deterministic boundaries for write actions and irreversible side effects?",
        "What are the identified single points of failure, and how does the system degrade gracefully when model APIs fail?"
      ]
    },
    {
      "title": "AI Quality & Evaluation Check",
      "questions": [
        "Do we have an empirical golden evaluation dataset with ground-truth labels and verified pass thresholds?",
        "Is retrieval quality (Recall@K, MRR) measured separately from generation quality (Groundedness, Faithfulness)?",
        "Are automated evaluation gates running in CI/CD to block prompt and model regressions before code reaches staging?",
        "Is the tool selection precision and argument accuracy monitored separately from final conversational text?"
      ]
    },
    {
      "title": "Production Readiness & Reliability Check",
      "questions": [
        "Are HTTP 429 quota exhaustion risks mitigated via multi-region endpoints, client jitter, and asynchronous task queues?",
        "Are step caps (max 5 turns) and session token budgets strictly enforced to prevent runaway infinite loops?",
        "Is there a tested, one-click 60-second rollback mechanism for prompts, models, and embeddings?",
        "Are all failure modes documented with user-facing graceful error messages rather than raw API stack traces?"
      ]
    },
    {
      "title": "Security & Zero-Trust Check",
      "questions": [
        "Are untrusted documents and user inputs screened by Model Armor before entering model context?",
        "Is document-level security trimming enforced so users only retrieve content matching verified Cloud Identity claims?",
        "Do agent tools execute with least-privilege IAM service accounts rather than full administrative permissions?",
        "Are Customer-Managed Encryption Keys (CMEK) and VPC Service Controls perimeters configured for regulated data?"
      ]
    },
    {
      "title": "Business & FinOps Economics Check",
      "questions": [
        "What is our current and projected Cost per Successful Task? Is it sustainable at 10x current user volume?",
        "Have we applied the 6 cost-optimization levers (prompt compression, semantic caching, model routing, context caching)?",
        "Are billing budget alerts and automated quota kill-switches configured to prevent surprise six-figure overages?",
        "Is the business sponsor measuring active adoption, completion rates, and tangible operational time saved?"
      ]
    }
  ]
}
};
