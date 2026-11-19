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
};
