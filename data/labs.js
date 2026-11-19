/* Hands-on Labs, Progressive Learning Roadmaps & Google Cloud Architecture Resource Hub */
window.ATLAS.labs = {
  "title": "Hands-on Labs & Learning Roadmaps",
  "lede": "Practical implementation exercises, structured role-based learning roadmaps, and direct links to authoritative Google Cloud architecture documentation.",
  "learningPaths": [
    {
      "id": "path-em",
      "role": "AI Engineering Manager",
      "duration": "4-Week Progressive Curriculum",
      "objective": "Master the operating rhythm: build vs buy evaluation, risk appetite, team staffing, unit economics, and production launch gates.",
      "modules": [
        {
          "week": "Week 1: AI Strategy & Governance",
          "topics": "Build vs buy framework, Google Cloud Architecture Framework for AI, resource hierarchy, IAM zero-trust identity."
        },
        {
          "week": "Week 2: RAG & Agent Architecture Foundations",
          "topics": "Classic vs agentic RAG trade-offs, deterministic workflows vs autonomous agents, human-in-the-loop controls."
        },
        {
          "week": "Week 3: GenAIOps & Quality Engineering",
          "topics": "Evaluation sets, statistical quality indicators (Recall@K, Groundedness), automated CI/CD release gates."
        },
        {
          "week": "Week 4: FinOps, Capacity & Production Operations",
          "topics": "Unit economics (cost per task), Provisioned Throughput vs Pay-As-You-Go, 429 quota mitigation, executive reporting."
        }
      ]
    },
    {
      "id": "path-pe",
      "role": "Principal AI Architect",
      "duration": "6-Week Advanced Architecture Curriculum",
      "objective": "Design scalable, multi-tenant AI systems with fault tolerance, low-latency streaming, and strict compliance boundaries.",
      "modules": [
        {
          "week": "Weeks 1-2: Advanced Retrieval & Graph Architecture",
          "topics": "Document cracking via Document AI, layout chunking, hybrid search tuning (RRF), Google Semantic Ranker, Spanner Graph extraction."
        },
        {
          "week": "Weeks 3-4: Multi-Agent Systems & State Persistence",
          "topics": "Vertex AI Agent Runtime, supervisor and handoff patterns, state persistence in Firestore, MCP tool servers, agent failure recovery."
        },
        {
          "week": "Weeks 5-6: Enterprise Security & Multi-Region Resilience",
          "topics": "Document-level security trimming, Private Service Connect networking, Apigee multi-region failover, zero customer data retention."
        }
      ]
    },
    {
      "id": "path-eng",
      "role": "Production AI Engineer",
      "duration": "4-Week Practical Implementation Curriculum",
      "objective": "Build, test, evaluate, and deploy production-grade RAG and agent applications using Google GenAI SDKs.",
      "modules": [
        {
          "week": "Week 1: SDK Fundamentals & Ingestion",
          "topics": "Google GenAI SDK, text-embedding-004 models, Document AI SDK, structuring Markdown output."
        },
        {
          "week": "Week 2: Indexing & Search Implementation",
          "topics": "Vertex AI Search SDK, vector index schemas, ScaNN parameters, implementing hybrid BM25 + vector queries."
        },
        {
          "week": "Week 3: Agent Development & MCP Tools",
          "topics": "Vertex AI Agent Development Kit (ADK) in Python, defining JSON tool schemas, managing conversation history, connecting Cloud Run endpoints."
        },
        {
          "week": "Week 4: Automated Testing & Evaluation",
          "topics": "Vertex AI Evaluation Service SDK, synthetic test generation, writing PyTest evaluation suites, GitHub Actions automation."
        }
      ]
    }
  ],
  "exercises": [
    {
      "id": "lab-rag-vertex-search",
      "title": "Lab 1: End-to-End Enterprise RAG with Vertex AI Search & Gemini",
      "level": "Intermediate",
      "time": "60 mins",
      "goal": "Build a production RAG pipeline using Document AI for layout extraction and Vertex AI Search for hybrid vector search with the Google Semantic Ranker.",
      "steps": [
        "Upload sample enterprise PDF policies with tables and headers to a Cloud Storage bucket.",
        "Run Document AI layout analysis to extract Markdown tables and hierarchical sections.",
        "Chunk text using layout boundaries and generate embeddings using text-embedding-004.",
        "Create a Vertex AI Search datastore configured with BM25 text fields, vector fields, and metadata filters.",
        "Execute a hybrid query combining vector similarity and keyword search; inspect Reciprocal Rank Fusion (RRF) scores.",
        "Enable the Google Semantic Ranker and verify that top-ranked passages contain verified table data.",
        "Send retrieved passages with citation instructions to Gemini 1.5 Pro; verify answer groundedness and footnote citations."
      ]
    },
    {
      "id": "lab-multiagent-runtime",
      "title": "Lab 2: Building Autonomous Multi-Agent Workflows with Vertex AI Agent Runtime",
      "level": "Advanced",
      "time": "90 mins",
      "goal": "Implement a Supervisor-Worker agentic system with state persistence in Firestore, typed tool endpoints on Cloud Run, and human approval steps.",
      "steps": [
        "Define a Supervisor Agent in Vertex AI Agent Runtime with explicit routing instructions and tool schemas.",
        "Create two specialist worker agents: a Financial Data Extractor and a Compliance Policy Reviewer.",
        "Implement agent tools as Cloud Run microservices validating input schemas and enforcing Cloud IAM least privilege.",
        "Configure session state persistence in Cloud Firestore storing conversation turns and checkpointed variables.",
        "Add a Cloud Workflows approval task requiring human sign-off before executing financial writes.",
        "Test execution trace in Cloud Monitoring; verify that intermediate tool calls appear in the distributed trace."
      ]
    },
    {
      "id": "lab-security-trimming",
      "title": "Lab 3: Document-Level Security Trimming with Cloud Identity Claims",
      "level": "Advanced",
      "time": "45 mins",
      "goal": "Enforce document-level access control in Vertex AI Search so users only retrieve documents matching their security group memberships.",
      "steps": [
        "Index documents in Vertex AI Search with security ACL metadata: `security_groups: [\"finance\", \"executive\"]`.",
        "Simulate two user identities with different Cloud Identity security group claims in JWT tokens.",
        "Construct an Apigee proxy that extracts caller security claims from the authorization header.",
        "Inject a mandatory server-side filter: `security_groups: ANY(\"finance\")` into the search request.",
        "Verify that user A (finance) retrieves financial data while user B (marketing) receives zero results on identical queries.",
        "Verify that semantic caching keys include user security hashes to prevent cache leakage."
      ]
    },
    {
      "id": "lab-genaiops-pipeline",
      "title": "Lab 4: GenAIOps: Automated PR Evaluation Pipeline with Cloud Build",
      "level": "Intermediate",
      "time": "60 mins",
      "goal": "Set up a continuous integration pipeline that runs automated LLM evaluation gates on every prompt pull request.",
      "steps": [
        "Create a repository containing prompt templates, a golden dataset of 50 test queries, and ground-truth references.",
        "Configure Cloud Build or GitHub Actions with Workload Identity Federation to authenticate without service account keys.",
        "Write an evaluation script using the Vertex AI Evaluation Service SDK measuring Groundedness and Relevance.",
        "Configure the workflow to run evaluations on every pull request targeting `main`.",
        "Add a quality gate check: fail the build if Groundedness drops below 92%.",
        "Simulate a prompt regression that introduces hallucinations; verify that the pipeline automatically blocks the merge."
      ]
    },
    {
      "id": "lab-resilient-gateway",
      "title": "Lab 5: Resilient AI Gateway with Apigee & Multi-Region Failover",
      "level": "Intermediate",
      "time": "45 mins",
      "goal": "Configure Apigee as an AI Gateway with rate limiting, context caching, and multi-region failover pools.",
      "steps": [
        "Configure two Gemini endpoints in different regions (e.g. us-central1 and europe-west1).",
        "Deploy an Apigee API proxy fronting the Vertex AI prediction endpoints.",
        "Apply an Apigee Spike Arrest and Quota policy enforcing per-client rate limits and burst thresholds.",
        "Implement context caching policies with Memorystore Redis to cache answers for repeated queries.",
        "Simulate heavy traffic to force HTTP 429 quota exhaustion; verify that Apigee automatically fails over to the secondary region with zero dropped requests."
      ]
    }
  ],
  "officialResources": [
    {
      "title": "Google Cloud Generative AI Architecture Center",
      "url": "https://cloud.google.com/architecture/ai-ml",
      "desc": "Official Google Cloud reference architectures, design patterns, and deployment guides for generative AI and machine learning."
    },
    {
      "title": "Vertex AI Documentation",
      "url": "https://cloud.google.com/vertex-ai/docs",
      "desc": "Authoritative documentation for Gemini foundation models, Agent Runtime, Vertex AI Search, and Model Garden."
    },
    {
      "title": "Vertex AI Search and Conversation",
      "url": "https://cloud.google.com/generative-ai-app-builder/docs",
      "desc": "Technical guide to building high-scale vector search, hybrid search, and enterprise RAG with Vertex AI Search."
    },
    {
      "title": "Google Cloud Architecture Framework — AI & ML Perspective",
      "url": "https://cloud.google.com/architecture/framework",
      "desc": "Architectural pillars, security baselines, resilience patterns, and operational standards for enterprise AI workloads."
    },
    {
      "title": "Vertex AI Gen AI Evaluation Service",
      "url": "https://cloud.google.com/vertex-ai/generative-ai/docs/models/evaluation-overview",
      "desc": "Comprehensive guide to offline evaluation datasets, statistical metrics (groundedness, relevance), and automated benchmarking."
    },
    {
      "title": "Google Cloud Security Foundations Guide — AI Security",
      "url": "https://cloud.google.com/security/infrastructure/design",
      "desc": "Enterprise security controls, IAM least privilege, data protection, and prompt defense guidelines for AI systems."
    }
  ]
};
