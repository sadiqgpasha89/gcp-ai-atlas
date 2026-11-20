/* Hands-on Labs, Progressive Learning Roadmaps & Google Cloud Architecture Resource Hub */
window.ATLAS.labs = {
  "title": "Hands-on Labs, Learning Roadmaps & Project Portfolio",
  "lede": "12 comprehensive production projects, 16-week progressive curriculum, 3-tier competency model, and executive capability radar for AI Engineering Managers.",
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
      "id": "project-gemini-assistant",
      "title": "Project 1: Gemini Enterprise Workplace Assistant",
      "level": "Level 1: Core AI Engineering",
      "time": "2 hours",
      "goal": "Build a production-grade conversational workplace assistant using Gemini 1.5 Pro, session persistence in Cloud Firestore, and Server-Sent Events (SSE) token streaming on Cloud Run.",
      "arch": "gemini-enterprise",
      "techStack": "Cloud Run, Gemini 1.5 Pro, Memorystore Redis, Cloud Firestore, Identity Platform, Google Gen AI SDK",
      "repoStructure": "gemini-assistant/\n├── app/\n│   ├── main.py              # FastAPI application with SSE streaming\n│   ├── session.py           # Redis session cache & Firestore history\n│   ├── security.py          # JWT authentication & claims extraction\n│   └── prompts.py           # Versioned system instructions\n├── tests/\n│   └── test_stream.py       # Async streaming test suite\n├── Dockerfile               # Multi-stage lightweight container\n└── cloudbuild.yaml          # Continuous deployment pipeline",
      "steps": [
        "Initialize a FastAPI application implementing Server-Sent Events (SSE) using the `google-genai` SDK.",
        "Configure Cloud Run with minimum 1 instance to eliminate cold-start latency for corporate users.",
        "Mount Secret Manager secrets securely as environment variables for Vertex AI project authentication.",
        "Implement session caching in Memorystore Redis for the last 6 turns and durable persistence in Firestore.",
        "Configure Cloud Load Balancing with Identity-Aware Proxy (IAP) to enforce corporate Single Sign-On (SSO).",
        "Verify Time to First Token (TTFT) is under 500ms and session context is retained across browser refreshes."
      ],
      "codeSnippet": "from google import genai\nfrom google.genai import types\nfrom fastapi import FastAPI\nfrom fastapi.responses import StreamingResponse\n\napp = FastAPI()\nclient = genai.Client()\n\nasync def stream_gemini(prompt: str, history: list):\n    response = client.models.generate_content_stream(\n        model=\"gemini-1.5-pro\",\n        contents=[*history, prompt],\n        config=types.GenerateContentConfig(\n            temperature=0.2,\n            system_instruction=\"You are a helpful enterprise workplace assistant.\"\n        )\n    )\n    for chunk in response:\n        yield f\"data: {chunk.text}\\n\\n\"",
      "security": "IAM Workload Identity ensures zero static service account keys; Cloud Armor mitigates Layer 7 attacks.",
      "evalPlan": "Evaluate 50 golden conversational turns using Vertex AI Evaluation; target answer relevance > 92%.",
      "costEstimate": "$0.0018 per user turn using Flash for classification and Pro for generation.",
      "checklist": [
        "SSE connection timeout set to 60s",
        "Redis volatile-lru eviction configured",
        "Firestore composite indexes deployed",
        "Cloud Monitoring TTFT alert active"
      ]
    },
    {
      "id": "project-enterprise-rag",
      "title": "Project 2: Enterprise RAG Chatbot on Vertex AI Search",
      "level": "Level 1: Core AI Engineering",
      "time": "2.5 hours",
      "goal": "Build an enterprise document search assistant over company PDF manuals and policies using Vertex AI Search and Gemini with grounded citations.",
      "arch": "traditional-rag",
      "techStack": "Cloud Storage, Vertex AI Search (RAG Engine), Gemini 1.5 Flash, Cloud Run, Document AI",
      "repoStructure": "enterprise-rag/\n├── ingestion/\n│   ├── upload.py            # GCS upload pipeline with metadata tags\n│   └── crack_docs.py        # Document AI layout extraction\n├── api/\n│   ├── server.py            # Search proxy with citation formatting\n│   └── search_client.py     # Vertex AI Search client\n├── eval/\n│   └── benchmark.py         # Golden set evaluation script\n└── terraform/               # Datastore & GCS bucket IaC",
      "steps": [
        "Upload enterprise PDF policies to a versioned Cloud Storage bucket.",
        "Create a Vertex AI Search unstructured data store configured with chunking and metadata tags.",
        "Configure Document AI layout parsing to extract Markdown tables without losing column alignment.",
        "Build a Cloud Run API proxy that executes queries against the search datastore with metadata filtering.",
        "Send retrieved passages to Gemini 1.5 Flash with strict XML delimiter instructions to prevent hallucinations.",
        "Format output with verified clickable markdown citations referencing source page numbers."
      ],
      "codeSnippet": "from google.cloud import discoveryengine_v1 as discoveryengine\n\ndef search_documents(project_id, search_engine_id, query):\n    client = discoveryengine.SearchServiceClient()\n    serving_config = client.serving_config_path(\n        project=project_id, location=\"global\",\n        data_store=search_engine_id, serving_config=\"default_config\"\n    )\n    request = discoveryengine.SearchRequest(\n        serving_config=serving_config, query=query, page_size=5\n    )\n    return client.search(request)",
      "security": "Documents encrypted at rest with CMEK; search requests restricted by Cloud IAM.",
      "evalPlan": "Measure Recall@5 on 100 benchmark queries; target Groundedness > 95%.",
      "costEstimate": "$0.0035 per search query including retrieval and generation.",
      "checklist": [
        "Search datastore sync verified",
        "Document layout parsing validated",
        "Citation links validated against GCS URLs",
        "Rate limits configured on proxy"
      ]
    },
    {
      "id": "project-hybrid-rag",
      "title": "Project 3: Hybrid Search RAG with Reciprocal Rank Fusion & Reranking",
      "level": "Level 1: Core AI Engineering",
      "time": "3 hours",
      "goal": "Implement a high-precision hybrid retrieval system combining dense semantic vectors, BM25 keyword matching, and Google Semantic Ranker.",
      "arch": "hybrid-rag",
      "techStack": "Vertex AI Vector Search, Vertex AI Search, Google Semantic Ranker, Gemini 1.5 Pro, Cloud Run",
      "repoStructure": "hybrid-rag/\n├── pipeline/\n│   ├── embed.py             # text-embedding-004 vectorizer\n│   └── index_builder.py     # ScaNN index deployer\n├── retriever/\n│   ├── hybrid_search.py     # Parallel vector + keyword dispatcher\n│   └── rrf.py               # Reciprocal Rank Fusion implementation\n└── reranker/\n    └── ranker.py            # Cross-encoder semantic ranker client",
      "steps": [
        "Generate dense vector embeddings using `text-embedding-004` and index in Vertex AI Vector Search.",
        "Index full-text lexical keywords, product SKUs, and error codes in Vertex AI Search BM25 datastore.",
        "Build a parallel query dispatcher that fires dense and lexical queries concurrently using asyncio.",
        "Implement Reciprocal Rank Fusion (RRF) with constant k=60 to fuse candidate lists.",
        "Pass top 50 candidates through the Google Semantic Ranker to boost relevant passages to top 5.",
        "Benchmark hybrid retrieval against pure vector search; verify 20%+ improvement on alphanumeric queries."
      ],
      "codeSnippet": "def reciprocal_rank_fusion(vector_results, keyword_results, k=60):\n    scores = {}\n    for rank, doc_id in enumerate(vector_results):\n        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)\n    for rank, doc_id in enumerate(keyword_results):\n        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)\n    return sorted(scores.items(), key=lambda x: x[1], reverse=True)",
      "security": "PSC endpoint connects Cloud Run to Vector Search index; private networking enforced.",
      "evalPlan": "NDCG@10 and Recall@5 on mixed semantic + keyword golden dataset.",
      "costEstimate": "$0.0052 per query with dual-index lookup and reranking.",
      "checklist": [
        "Parallel dispatch latency under 150ms",
        "RRF constant validated",
        "Reranker cross-encoder tested",
        "ScaNN index deployed with PSC"
      ]
    },
    {
      "id": "project-sql-analyst",
      "title": "Project 4: Natural Language to SQL (NL2SQL) AI Analyst on BigQuery",
      "level": "Level 1: Core AI Engineering",
      "time": "2.5 hours",
      "goal": "Build an autonomous business intelligence co-pilot that converts user questions into validated BigQuery SQL with dry-run cost verification.",
      "arch": "sql-rag",
      "techStack": "BigQuery, Knowledge Catalog, Gemini 1.5 Pro, Cloud Run, Cloud Audit Logs",
      "repoStructure": "sql-analyst/\n├── catalog/\n│   └── fetch_schema.py      # Extract table schemas from Dataplex\n├── generator/\n│   ├── sql_prompt.py        # Few-shot schema-grounded generator\n│   └── validator.py         # Dry-run query cost & safety checker\n└── app/\n    └── main.py              # User API with natural language explanations",
      "steps": [
        "Extract table schemas, column descriptions, and business metrics from Dataplex Knowledge Catalog.",
        "Construct a few-shot prompt for Gemini 1.5 Pro incorporating schema definitions and valid joins.",
        "Implement dry-run query validation via the BigQuery SDK to verify SQL syntax and calculate scanned bytes.",
        "Enforce safety guardrails: block mutating keywords (DROP, DELETE, UPDATE) and cap scans at 5GB.",
        "Execute approved SQL queries in BigQuery and feed results back to Gemini for natural language synthesis.",
        "Generate interactive Markdown charts and tables for business stakeholders."
      ],
      "codeSnippet": "from google.cloud import bigquery\n\ndef validate_and_dry_run(sql_query, client):\n    # Reject mutating statements\n    forbidden = [\"DROP\", \"DELETE\", \"UPDATE\", \"INSERT\", \"ALTER\", \"TRUNCATE\"]\n    if any(word in sql_query.upper().split() for word in forbidden):\n        raise ValueError(\"Mutating SQL statements are strictly forbidden.\")\n    \n    job_config = bigquery.QueryJobConfig(dry_run=True, use_query_cache=True)\n    query_job = client.query(sql_query, job_config=job_config)\n    scanned_gb = query_job.total_bytes_processed / (1024 ** 3)\n    if scanned_gb > 5.0:\n        raise ValueError(f\"Query exceeds byte scan ceiling: {scanned_gb:.2f} GB\")\n    return query_job.total_bytes_processed",
      "security": "Service account granted read-only access to specific BigQuery datasets; column masking applied to PII.",
      "evalPlan": "Measure SQL execution validity and accuracy across 80 benchmark business questions.",
      "costEstimate": "$0.008 per analytical query, dominated by BigQuery byte scan volume.",
      "checklist": [
        "Dry-run byte limit enforced",
        "Read-only IAM verified",
        "Column descriptions populated in catalog",
        "Few-shot library tested"
      ]
    },
    {
      "id": "project-multiagent-research",
      "title": "Project 5: Multi-Agent Autonomous Research & Fact-Checking Swarm",
      "level": "Level 2: Advanced AI Systems",
      "time": "3.5 hours",
      "goal": "Build a multi-agent research team using Google Agent Development Kit (ADK) featuring Coordinator, Specialist Researcher, and Critic agents.",
      "arch": "multiagent-orchestration",
      "techStack": "Agent Development Kit (ADK), Vertex AI Agent Runtime, Gemini 1.5 Pro, Agent Memory, Cloud Monitoring",
      "repoStructure": "research-swarm/\n├── agents/\n│   ├── coordinator.py       # Task decomposition & final synthesis\n│   ├── researcher.py        # Parallel domain research specialist\n│   └── critic.py            # Hallucination & fact-checking reviewer\n├── tools/\n│   └── search_tools.py      # Google Search & document tools\n└── run.py                   # ADK multi-agent execution orchestrator",
      "steps": [
        "Define specialized agents using the Google Agent Development Kit (ADK) primitives.",
        "Coordinator Agent analyzes user research objective and creates a 3-part research breakdown.",
        "Specialist Researcher Agents execute parallel research tasks using Google Search and document tools.",
        "Critic Agent inspects preliminary findings against a strict factuality rubric, flagging unsupported claims.",
        "Coordinator Agent synthesizes the finalized research dossier with verified citations.",
        "Monitor inter-agent communication, token usage, and trajectory in Cloud Monitoring."
      ],
      "codeSnippet": "# Using Google Agent Development Kit (ADK)\nfrom google.adk.agents import Agent, Coordinator\nfrom google.adk.tools import GoogleSearchTool\n\nresearcher = Agent(\n    name=\"Researcher\",\n    model=\"gemini-1.5-flash\",\n    tools=[GoogleSearchTool()],\n    instructions=\"Research specific sub-topics thoroughly with source URLs.\"\n)\n\ncritic = Agent(\n    name=\"Critic\",\n    model=\"gemini-1.5-pro\",\n    instructions=\"Review drafts. Challenge unverified claims and flag missing citations.\"\n)\n\ncoordinator = Coordinator(\n    name=\"LeadAnalyst\",\n    workers=[researcher, critic],\n    instructions=\"Coordinate research, route tasks, and synthesize final executive brief.\"\n)",
      "security": "Agents run in isolated sandboxes; tool permissions bounded by Agent Governance.",
      "evalPlan": "Measure factuality and citation completeness on 30 complex research prompts.",
      "costEstimate": "$0.045 per comprehensive multi-page research brief.",
      "checklist": [
        "Agent loop limit set to 5",
        "Critic rejection threshold tuned",
        "Deadlock timeout configured",
        "Trajectory tracing verified"
      ]
    },
    {
      "id": "project-agentic-rag",
      "title": "Project 6: Agentic RAG with Dynamic Query Decomposition & Reflection",
      "level": "Level 2: Advanced AI Systems",
      "time": "3 hours",
      "goal": "Implement an agentic RAG assistant that decomposes complex multi-part queries, retrieves from multiple datastores, and reflects on answer quality.",
      "arch": "agentic-rag",
      "techStack": "ADK, Agent Runtime, Vertex AI Search, BigQuery, Gemini 1.5 Pro, Agent Memory",
      "repoStructure": "agentic-rag/\n├── agent/\n│   ├── planner.py           # Multi-step query decomposer\n│   ├── retriever_tool.py    # Dynamic tool wrapper for AI Search\n│   └── evaluator.py         # Self-reflection & verification agent\n├── state/\n│   └── session.py           # Agent memory context manager\n└── app.py                   # Streamlit interactive UI",
      "steps": [
        "Configure ADK agent with dynamic retrieval tools connected to Vertex AI Search and BigQuery.",
        "Implement query decomposition: complex questions are broken into atomic retrieval steps.",
        "The agent selects whether to query unstructured documents, query structured SQL tables, or both.",
        "Implement a self-reflection loop: agent inspects retrieved context and determines if additional retrieval is necessary.",
        "Synthesize the final answer, explicitly identifying which facts came from documents and which from database records.",
        "Record trajectory and intermediate tool results in Agent Memory for session persistence."
      ],
      "codeSnippet": "async def agentic_rag_step(agent, user_query):\n    # Step 1: Decompose query\n    sub_tasks = await agent.decompose(user_query)\n    context = []\n    for task in sub_tasks:\n        if task.type == \"unstructured\":\n            docs = await agent.call_tool(\"vertex_search\", query=task.query)\n            context.append(docs)\n        elif task.type == \"structured\":\n            records = await agent.call_tool(\"bigquery_sql\", query=task.query)\n            context.append(records)\n    # Step 2: Synthesize and reflect\n    return await agent.synthesize(user_query, context)",
      "security": "Tool calls strictly validate parameter boundaries; read-only service account credentials.",
      "evalPlan": "Benchmark on multi-hop QA dataset; target answer completeness > 90%.",
      "costEstimate": "$0.012 per multi-hop query including multiple retrieval passes.",
      "checklist": [
        "Maximum reflection iterations capped at 2",
        "Tool schemas strictly typed",
        "Agent memory persistence verified",
        "User cancellation handled"
      ]
    },
    {
      "id": "project-graph-rag",
      "title": "Project 7: GraphRAG Knowledge Graph Extraction & Spanner Graph Traversal",
      "level": "Level 2: Advanced AI Systems",
      "time": "4 hours",
      "goal": "Build an enterprise GraphRAG pipeline that extracts entities and relationships into Spanner Graph, enabling multi-hop relationship reasoning.",
      "arch": "graph-rag",
      "techStack": "Spanner Graph, Dataflow, Vertex AI Vector Search, Gemini 1.5 Pro, Cloud Storage",
      "repoStructure": "graph-rag/\n├── extractor/\n│   ├── entity_prompt.py     # Few-shot entity & relationship extraction\n│   └── dataflow_job.py      # Batch extraction pipeline\n├── graph/\n│   ├── schema.sql           # Spanner Graph DDL (Nodes & Edges)\n│   └── gql_queries.py       # Graph Query Language (GQL) templates\n└── retriever/\n    └── hybrid_graph_rag.py  # Graph traversal + vector search fusion",
      "steps": [
        "Define an enterprise graph ontology (e.g. Company, Person, Product, Regulation, Vendor).",
        "Create a Spanner Graph schema with Node tables and Edge tables supporting GQL queries.",
        "Run a Dataflow pipeline that processes enterprise text with Gemini to extract entity-relationship-entity triples.",
        "Execute entity resolution to merge duplicate nodes and resolve ambiguous corporate entities.",
        "Build a hybrid retriever combining Spanner Graph GQL graph traversals with Vector Search dense similarity.",
        "Answer multi-hop queries (e.g. \"which suppliers share board members with sanctioned entities?\")."
      ],
      "codeSnippet": "-- Spanner Graph Schema DDL\nCREATE PROPERTY GRAPH EnterpriseGraph\n  VERTEX TABLES (\n    Companies KEY (company_id) LABEL Company,\n    Persons KEY (person_id) LABEL Person\n  )\n  EDGE TABLES (\n    BoardMembers KEY (company_id, person_id)\n      SOURCE KEY (company_id) REFERENCES Companies\n      DESTINATION KEY (person_id) REFERENCES Persons\n      LABEL SERVES_ON_BOARD\n  );",
      "security": "Spanner Graph protected by IAM roles; extraction pipeline runs in private VPC.",
      "evalPlan": "Evaluate multi-hop relational question accuracy against vector-only baseline.",
      "costEstimate": "$0.022 per hybrid GraphRAG query; Spanner node costs amortized across workloads.",
      "checklist": [
        "Spanner Graph schema validated",
        "Entity resolution deduplication tested",
        "GQL query templates optimized",
        "Vector fallback configured"
      ]
    },
    {
      "id": "project-multimodal-intel",
      "title": "Project 8: Multimodal Intelligence System for Documents, Video & Audio",
      "level": "Level 2: Advanced AI Systems",
      "time": "3 hours",
      "goal": "Ingest and analyze complex multi-page PDF schematics, video clips, and customer service audio calls using unified multimodal Gemini models.",
      "arch": "multimodal-intelligence",
      "techStack": "Cloud Storage, Document AI, Vision AI, Speech-to-Text, Gemini 1.5 Pro, BigQuery",
      "repoStructure": "multimodal-intel/\n├── parsers/\n│   ├── pdf_processor.py     # Document AI layout parser\n│   ├── video_sampler.py     # Keyframe extraction & audio strip\n│   └── audio_transcribe.py  # Speech-to-Text pipeline\n├── analyzer/\n│   └── multimodal_gemini.py # Unified multimodal Gemini reasoning\n└── export/\n    └── bq_writer.py         # Structured BigQuery export",
      "steps": [
        "Set up Cloud Storage buckets with partitioned directories for documents, videos, and audio files.",
        "Process high-resolution scanned PDFs with Document AI layout parser to extract tables and diagrams.",
        "Sample video files into keyframes and transcribe audio tracks using Speech-to-Text.",
        "Pass multi-modal inputs (images, audio transcripts, text) to Gemini 1.5 Pro with structured JSON extraction schemas.",
        "Extract structured defect logs, sentiment scores, and compliance flags into BigQuery.",
        "Build a Looker Studio dashboard visualizing operational insights extracted from unstructured media."
      ],
      "codeSnippet": "from google import genai\nfrom google.genai import types\n\nclient = genai.Client()\nwith open(\"wiring_diagram.png\", \"rb\") as f:\n    image_bytes = f.read()\n\nresponse = client.models.generate_content(\n    model=\"gemini-1.5-pro\",\n    contents=[\n        types.Part.from_bytes(data=image_bytes, mime_type=\"image/png\"),\n        \"Analyze this wiring diagram. Identify any single points of failure in the circuit.\"\n    ]\n)",
      "security": "Sensitive Data Protection masks confidential PII in extracted text and audio transcripts.",
      "evalPlan": "Measure extraction accuracy against manual human annotations across 50 mixed media files.",
      "costEstimate": "$0.015 per multi-page document or video minute analyzed.",
      "checklist": [
        "Image downsampling configured to 1024x1024",
        "Audio format normalized to 16kHz",
        "BigQuery destination table partitioned",
        "SDP inspection rules attached"
      ]
    },
    {
      "id": "project-secure-platform",
      "title": "Project 9: Zero-Egress Secure Enterprise AI Platform",
      "level": "Level 3: Production & Enterprise Leadership",
      "time": "4 hours",
      "goal": "Architect a fortified enterprise AI environment with VPC Service Controls, Private Service Connect, Customer-Managed Keys (CMEK), and Model Armor.",
      "arch": "private-ai",
      "techStack": "VPC, Private Service Connect (PSC), VPC Service Controls, Cloud KMS, Model Armor, Cloud IAM",
      "repoStructure": "secure-platform/\n├── terraform/\n│   ├── vpc.tf               # Private VPC without internet gateway\n│   ├── psc.tf               # Private Service Connect forwarding rules\n│   ├── vpc_sc.tf            # Service perimeter specification\n│   ├── kms.tf               # Customer-Managed Encryption Keys\n│   └── model_armor.tf       # Safety policy rules\n└── scripts/\n    └── audit_perimeter.sh   # Automated egress penetration test",
      "steps": [
        "Author Terraform modules provisioning a private VPC with zero public IP addresses or NAT gateways.",
        "Configure Private Service Connect (PSC) endpoints for Vertex AI, Cloud Storage, and BigQuery.",
        "Deploy a VPC Service Controls (VPC-SC) security perimeter surrounding all AI data and compute resources.",
        "Configure Customer-Managed Encryption Keys (CMEK) in Cloud KMS for all storage buckets and vector indexes.",
        "Deploy Model Armor filter policies to screen prompts for jailbreaks, PII, and sensitive corporate keywords.",
        "Execute automated penetration testing to prove that data exfiltration is mathematically blocked by the perimeter."
      ],
      "codeSnippet": "# Terraform snippet for PSC Endpoint\nresource \"google_compute_address\" \"psc_vertex\" {\n  name         = \"psc-vertex-address\"\n  subnetwork   = google_compute_subnetwork.ai_subnet.id\n  address_type = \"INTERNAL\"\n  purpose      = \"GCE_ENDPOINT\"\n}\n\nresource \"google_compute_forwarding_rule\" \"psc_vertex_rule\" {\n  name                  = \"psc-vertex-forwarding-rule\"\n  target                = \"all-apis\"\n  network               = google_compute_network.ai_vpc.id\n  ip_address            = google_compute_address.psc_vertex.id\n  load_balancing_scheme = \"\"\n}",
      "security": "Zero public internet egress; VPC-SC perimeter enforced; CMEK rotation every 90 days.",
      "evalPlan": "100% pass on security penetration tests; zero egress packets detected.",
      "costEstimate": "$120/month base infrastructure for PSC endpoints and KMS key operations.",
      "checklist": [
        "VPC-SC dry-run testing completed",
        "PSC internal DNS zones validated",
        "CMEK key access verified",
        "Model Armor filter rules active"
      ]
    },
    {
      "id": "project-eval-platform",
      "title": "Project 10: Automated AI Evaluation Platform & CI/CD Release Gates",
      "level": "Level 3: Production & Enterprise Leadership",
      "time": "3.5 hours",
      "goal": "Build an automated quality evaluation pipeline in Cloud Build that runs golden test suites and enforces release gates before production deployments.",
      "arch": "genaiops-lifecycle",
      "techStack": "Cloud Build, Vertex AI Evaluation Service, BigQuery, Artifact Registry, Gemini 1.5 Pro",
      "repoStructure": "eval-platform/\n├── golden_sets/\n│   └── enterprise_qa.jsonl  # 200 curated test cases with ground truth\n├── evaluators/\n│   ├── groundedness.py      # LLM-as-a-judge Groundedness scorer\n│   └── latency_bench.py     # TTFT and throughput benchmark\n├── ci/\n│   ├── cloudbuild.yaml      # Automated pull request evaluation pipeline\n│   └── gate_checker.py      # Release gate threshold validator\n└── dashboard/\n    └── eval_trend.sql       # BigQuery SQL for historical quality trends",
      "steps": [
        "Curate a versioned golden evaluation dataset of 200+ enterprise queries with verified ground truth.",
        "Implement custom evaluators using Vertex AI Evaluation Service to score Groundedness, Relevance, and Safety.",
        "Configure a Cloud Build CI pipeline that triggers automated evaluation runs on every GitHub pull request.",
        "Implement an automated quality gate script that fails the build if Groundedness drops below 95% or latency exceeds 2.0s.",
        "Stream all evaluation metrics into BigQuery to track model and prompt performance trends over time.",
        "Simulate an intentional prompt regression and verify that the Cloud Build pipeline blocks the merge."
      ],
      "codeSnippet": "# CI/CD Release Gate Script\nimport sys, json\n\ndef check_quality_gates(eval_results_file):\n    with open(eval_results_file) as f:\n        metrics = json.load(f)\n    \n    groundedness = metrics.get(\"groundedness_score\", 0.0)\n    relevance = metrics.get(\"answer_relevance_score\", 0.0)\n    p95_latency = metrics.get(\"p95_latency_ms\", 9999)\n    \n    print(f\"Eval Results: Groundedness={groundedness:.1%}, Relevance={relevance:.1%}, P95={p95_latency}ms\")\n    \n    if groundedness < 0.95:\n        print(\"FAIL: Groundedness below 95% threshold!\")\n        sys.exit(1)\n    if relevance < 0.90:\n        print(\"FAIL: Relevance below 90% threshold!\")\n        sys.exit(1)\n    if p95_latency > 2000:\n        print(\"FAIL: P95 latency exceeds 2,000ms threshold!\")\n        sys.exit(1)\n    print(\"PASS: All AI release gates satisfied!\")",
      "security": "Cloud Build authenticates via Workload Identity Federation with zero stored service account keys.",
      "evalPlan": "Evaluate 100% of pull requests; block all regressions exceeding 1% delta.",
      "costEstimate": "$0.80 per automated PR evaluation run.",
      "checklist": [
        "Golden dataset versioned in Git",
        "Cloud Build trigger configured on PRs",
        "BigQuery metrics sink created",
        "Branch protection rules enforced"
      ]
    },
    {
      "id": "project-observability-platform",
      "title": "Project 11: Production AI Observability & Distributed Agent Tracing",
      "level": "Level 3: Production & Enterprise Leadership",
      "time": "3.5 hours",
      "goal": "Deploy an end-to-end telemetry and tracing pipeline capturing agent trajectories, tool call latencies, and token spend with SLO alerting.",
      "arch": "agent-observability-platform",
      "techStack": "Cloud Monitoring, Cloud Logging, Cloud Trace, OpenTelemetry, BigQuery, Looker Studio",
      "repoStructure": "ai-observability/\n├── telemetry/\n│   ├── tracer.py            # OpenTelemetry agent span decorator\n│   └── metrics.py           # Custom metric emitters for tokens & TTFT\n├── dashboards/\n│   └── monitoring_dash.json # 10-widget Cloud Monitoring dashboard template\n├── terraform/\n│   └── alerting_rules.tf    # SLO alert policies for 429 errors & latency\n└── analytics/\n    └── token_finops.sql     # Cost attribution query by user & feature",
      "steps": [
        "Instrument agent application code with OpenTelemetry Python SDK, creating child spans for every tool call and model invocation.",
        "Deploy the 10 mandatory production operational metrics in Cloud Monitoring (TTFT, token volume, 429 errors, tool failure rate).",
        "Export detailed execution logs to BigQuery via Cloud Logging sinks for deep analytical queries.",
        "Configure Cloud Monitoring alerting policies with notification channels for HTTP 429 quota spikes and latency breaches.",
        "Build a Looker Studio executive dashboard visualizing cost per task, user feedback trends, and model error rates.",
        "Execute synthetic load testing to simulate a model quota breach and verify that on-call alerts fire within 60 seconds."
      ],
      "codeSnippet": "from opentelemetry import trace\nfrom opentelemetry.trace import Status, StatusCode\n\ntracer = trace.get_tracer(\"agent_tracer\")\n\ndef trace_tool_execution(tool_name, tool_func, *args, **kwargs):\n    with tracer.start_as_current_span(f\"ToolCall:{tool_name}\") as span:\n        span.set_attribute(\"tool.name\", tool_name)\n        span.set_attribute(\"tool.args\", str(args))\n        try:\n            result = tool_func(*args, **kwargs)\n            span.set_status(Status(StatusCode.OK))\n            return result\n        except Exception as e:\n            span.record_exception(e)\n            span.set_status(Status(StatusCode.ERROR, str(e)))\n            raise",
      "security": "Sensitive Data Protection de-identification ensures no customer PII enters Cloud Trace spans.",
      "evalPlan": "Zero latency overhead (>5ms) introduced by telemetry instrumentation.",
      "costEstimate": "$45/month for Cloud Monitoring ingestion and BigQuery telemetry storage.",
      "checklist": [
        "OpenTelemetry sampling configured to 10% success / 100% error",
        "Cloud Logging log sink active",
        "Alerting policies attached to PagerDuty",
        "Dashboard imported into GCP console"
      ]
    },
    {
      "id": "project-agent-platform",
      "title": "Project 12: Enterprise Agent Platform with Governance & A2A Gateway",
      "level": "Level 3: Production & Enterprise Leadership",
      "time": "4.5 hours",
      "goal": "Build an enterprise-wide agent platform featuring Agent Identity, Agent Registry, Agent Gateway, Model Armor, and Agent2Agent (A2A) interoperability.",
      "arch": "enterprise-platform",
      "techStack": "Vertex AI Agent Runtime, Agent Governance, ADK, Apigee, Cloud Run, Model Armor, Cloud IAM",
      "repoStructure": "enterprise-agent-platform/\n├── platform/\n│   ├── agent_registry.py    # Centralized agent catalog and metadata\n│   ├── gateway.py           # Ingress proxy with OAuth & policy checks\n│   └── a2a_protocol.py      # Inter-enterprise Agent2Agent contract\n├── governance/\n│   ├── identity_sync.py     # Map corporate users to agent credentials\n│   └── audit_sink.py        # Non-repudiation audit logging\n└── samples/\n    └── b2b_procurement.py   # Multi-agent cross-company negotiation",
      "steps": [
        "Configure Vertex AI Agent Runtime as the unified hosting platform for all corporate AI agents.",
        "Implement an Agent Registry where engineering teams publish agent capabilities, input schemas, and SLAs.",
        "Deploy the Agent Gateway fronted by Apigee, enforcing mutual TLS (mTLS), token quotas, and rate limiting.",
        "Configure Agent Identity with distinct service account clearances so agents cannot access unauthorized tools.",
        "Implement the Agent2Agent (A2A) protocol engine supporting decentralized task delegation with external partner agents.",
        "Establish enterprise Model Armor firewalls screening all inter-agent messages for prompt injection and data exfiltration."
      ],
      "codeSnippet": "# Enterprise Agent Gateway Policy\nasync def agent_gateway_dispatch(caller_id, target_agent_id, task_payload):\n    # 1. Verify caller identity and token\n    claims = verify_caller_token(caller_id)\n    # 2. Check access permissions\n    if not check_agent_access(claims.role, target_agent_id):\n        raise PermissionError(f\"Access to agent {target_agent_id} denied for role {claims.role}\")\n    # 3. Screen payload through Model Armor\n    screen_prompt_armor(task_payload)\n    # 4. Dispatch to Agent Runtime with audit trace\n    log_agent_action(caller_id, target_agent_id, task_payload)\n    return await execute_in_agent_runtime(target_agent_id, task_payload)",
      "security": "Zero-trust agent architecture: verified identity, authorized delegation, encrypted inter-agent channels.",
      "evalPlan": "Pass enterprise architectural security review; 100% compliance on tool authorization checks.",
      "costEstimate": "Shared platform infrastructure supporting 50+ enterprise agents with centralized cost allocation.",
      "checklist": [
        "Agent Registry deployed",
        "Agent Gateway proxy active in Apigee",
        "mTLS certificates distributed",
        "Model Armor enterprise firewall enabled",
        "Quarterly compliance audit scheduled"
      ]
    }
  ],
  "curriculum16Week": {
    "title": "16-Week AI Engineering Leadership Roadmap",
    "intro": "A progressive, structured curriculum designed to transform software leaders into proficient AI Engineering Managers on Google Cloud.",
    "phases": [
      {
        "phase": "Phase 1: Cloud & AI Foundations",
        "weeks": "Weeks 1–2",
        "focus": "GCP architecture, IAM least privilege, Cloud Storage, BigQuery data platforms, Cloud Run serverless, VPC networking, and ML/statistical fundamentals."
      },
      {
        "phase": "Phase 2: Gemini & Vertex AI Deep Dive",
        "weeks": "Weeks 3–4",
        "focus": "Gemini model family trade-offs, model selection criteria, structured JSON prompting, context caching economics, and Vertex AI platform capabilities."
      },
      {
        "phase": "Phase 3: Production RAG Engineering",
        "weeks": "Weeks 5–7",
        "focus": "Document cracking via Document AI, layout chunking, hybrid search tuning (RRF), Google Semantic Ranker, GraphRAG with Spanner Graph, and statistical RAG evaluation."
      },
      {
        "phase": "Phase 4: Agentic AI & ADK Systems",
        "weeks": "Weeks 8–10",
        "focus": "Google Agent Development Kit (ADK), Vertex AI Agent Runtime, tool interface design, MCP protocol, multi-agent hierarchies, Agent2Agent (A2A), and human-in-the-loop workflows."
      },
      {
        "phase": "Phase 5: Production AI Engineering & Operations",
        "weeks": "Weeks 11–13",
        "focus": "Model Armor, zero-trust security perimeters (VPC-SC), GenAIOps CI/CD release gates, distributed agent tracing, latency optimization, and AI FinOps unit economics."
      },
      {
        "phase": "Phase 6: AI Engineering Leadership & Delivery",
        "weeks": "Weeks 14–16",
        "focus": "Leading technical design reviews, AI feasibility qualification, risk assessments, team staffing and competency evaluation, production readiness reviews, and executive strategy."
      }
    ]
  },
  "competencyModel": {
    "title": "The 3-Tier Competency Model for AI Engineering Managers",
    "intro": "You do not need to master every GCP service at the same depth. Use this 3-tier competency model to optimize your technical focus.",
    "tiers": [
      {
        "tier": "Tier 1: Deep Expertise (Understand, Design, Review, Troubleshoot)",
        "services": "Gemini 1.5 Pro/Flash, Vertex AI Agent Platform, Agent Development Kit (ADK), Enterprise RAG, Vector Search, Agentic Architectures, AI Quality Evaluation, AI Security (Model Armor/SDP), Cloud Run, BigQuery, AI Observability."
      },
      {
        "tier": "Tier 2: Architecture Proficiency (Design, Compare, Make Decisions, Challenge Solutions)",
        "services": "GKE Enterprise, Cloud Pub/Sub, Dataflow, AlloyDB with ScaNN, Spanner Graph, Cloud IAM, VPC Networking & PSC, Terraform / Infrastructure Manager, Cloud Build CI/CD, FinOps."
      },
      {
        "tier": "Tier 3: Awareness & Specialization (Understand Capabilities, Limitations, and When to Engage Specialists)",
        "services": "Advanced Distributed Systems, TPU v5e/v5p Pod Architecture, Deep Custom Distributed Training, Kubernetes Internals, Advanced Graph Database Algorithms, Low-Level Model Quantization."
      }
    ]
  },
  "radarBenchmark": {
    "title": "AI Engineering Manager Capability Benchmark Radar",
    "intro": "Self-assessment framework across the 8 foundational domains of enterprise AI leadership. Score yourself 1 to 5 to identify personal upskilling priorities.",
    "dimensions": [
      {
        "name": "Architecture & Design",
        "target": 5,
        "desc": "Selecting patterns, RAG vs fine-tuning, deterministic vs probabilistic boundaries, and challenging over-engineered designs."
      },
      {
        "name": "RAG Engineering",
        "target": 5,
        "desc": "Document cracking, chunking strategies, hybrid search (RRF), semantic reranking, GraphRAG, and retrieval recall tuning."
      },
      {
        "name": "Agentic AI & ADK",
        "target": 4,
        "desc": "ADK constructs, tool interfaces, supervisor-worker hierarchies, state persistence, MCP protocols, and human approval workflows."
      },
      {
        "name": "AI Security & Zero Trust",
        "target": 5,
        "desc": "Prompt injection mitigation, Model Armor, document ACL security trimming, VPC Service Controls, and IAM least privilege."
      },
      {
        "name": "Evaluation & Quality",
        "target": 5,
        "desc": "Curating golden datasets, automated LLM-as-a-judge, Groundedness scoring, agent trajectory tests, and CI/CD release gates."
      },
      {
        "name": "GenAIOps & Operations",
        "target": 4,
        "desc": "Canary deployments, 429 quota mitigation, distributed agent tracing, Cloud Monitoring dashboards, and incident runbooks."
      },
      {
        "name": "GCP Platform Depth",
        "target": 4,
        "desc": "Cloud Run, BigQuery, Spanner Graph, Private Service Connect, Terraform IaC, and cloud networking topology."
      },
      {
        "name": "FinOps & Economics",
        "target": 5,
        "desc": "Cost per successful task modeling, token optimization levers, semantic caching, model routing, and executive ROI attribution."
      }
    ]
  },
  "officialResources": [
    {
      "title": "Google Cloud Generative AI Architecture Center",
      "url": "https://cloud.google.com/architecture/ai-ml",
      "desc": "Official Google Cloud reference architectures, design patterns, and deployment guides for generative AI and machine learning."
    },
    {
      "title": "Choose Agentic AI Architecture Components",
      "url": "https://docs.cloud.google.com/architecture/choose-agentic-ai-architecture-components",
      "desc": "Authoritative Google Cloud guide on choosing ADK, agent workflows, tools, agent security, orchestration, and design choices."
    },
    {
      "title": "Multi-Agent AI System on Google Cloud",
      "url": "https://docs.cloud.google.com/architecture/multiagent-ai-system",
      "desc": "Official enterprise multi-agent design guide: security, interaction patterns, and architecture considerations."
    },
    {
      "title": "Single-Agent AI System Using ADK and Cloud Run",
      "url": "https://docs.cloud.google.com/architecture/single-agent-ai-system-adk-cloud-run",
      "desc": "Official Google Cloud architecture for agent deployment, tool integrations, runtime, and production design."
    },
    {
      "title": "RAG Infrastructure with Agent Platform & Vector Search",
      "url": "https://docs.cloud.google.com/architecture/gen-ai-rag-vertex-ai-vector-search",
      "desc": "Data ingestion, embedding, vector retrieval, serving, and design trade-offs on Google Cloud."
    },
    {
      "title": "Vertex AI Documentation",
      "url": "https://cloud.google.com/vertex-ai/docs",
      "desc": "Authoritative documentation for Gemini foundation models, Agent Runtime, Vertex AI Search, and Model Garden."
    },
    {
      "title": "Google Cloud Architecture Framework — AI & ML Perspective",
      "url": "https://cloud.google.com/architecture/framework",
      "desc": "Architectural pillars, security baselines, resilience patterns, and operational standards for enterprise AI workloads."
    }
  ]
};
