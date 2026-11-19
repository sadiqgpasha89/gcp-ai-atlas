/* Reference architectures for AI and ML systems on Google Cloud.
   Each architecture: id, name, short, when, flow:[{s:service-id, l:label}],
   steps:[[node-index, description]], why:[], fails:[] */
window.ATLAS.architectures = [
  {
    "id": "rag-assistant",
    "name": "RAG assistant on the Agent Platform",
    "short": "Ground Gemini in your own documents, with citations, per-user access control and screening.",
    "when": "You need answers grounded in private or fast-changing content, and fine-tuning is the wrong tool. Start here for most enterprise assistants. When questions need several lookups or verification, see [[a:agentic-rag|agentic RAG]]; for relationship questions, [[a:graphrag|GraphRAG]]; to choose, [[d:retrieval-strategy|retrieval strategy]].",
    "flow": [
      {
        "l": "Documents",
        "s": "gcs"
      },
      {
        "l": "Parse + chunk + embed",
        "s": "rag-engine"
      },
      {
        "l": "Vector index",
        "s": "vector-search"
      },
      {
        "l": "User + auth",
        "s": "identity-platform"
      },
      {
        "l": "Prompt screening",
        "s": "model-armor"
      },
      {
        "l": "LLM answer",
        "s": "gemini"
      }
    ],
    "steps": [
      [
        0,
        "Source documents (manuals, policies, tickets) are stored in [[gcs]]. An upload event or a schedule triggers an import."
      ],
      [
        1,
        "[[rag-engine|RAG Engine]] parses and chunks each document and calls an embedding model for each chunk."
      ],
      [
        2,
        "Vectors and metadata (tenant, department, document ID) are written to a vector index such as [[vector-search]] (or [[alloydb]] when the data is relational)."
      ],
      [
        3,
        "A user signs in through [[identity-platform]]; their verified group claims travel with each request."
      ],
      [
        1,
        "The question is embedded and the index is searched, with a **metadata filter** derived from the user's claims so they only retrieve documents they may see."
      ],
      [
        4,
        "The prompt, with the retrieved passages, is screened by [[model-armor|Model Armor]] for injection, sensitive data and unsafe content."
      ],
      [
        5,
        "[[gemini|Gemini]] generates the answer from the retrieved chunks and returns it with citations; the response is screened again on the way out."
      ]
    ],
    "why": [
      "Knowledge stays outside the model, so updating a document updates answers without retraining.",
      "Citations make answers verifiable, which builds user trust and eases compliance.",
      "Metadata filtering gives per-user access control without a separate index per user.",
      "Every component is managed, so the team spends its time on quality, not servers."
    ],
    "fails": [
      "Bad chunking or parsing: the right document is indexed but the right passage never surfaces. Measure retrieval recall on a test set.",
      "Stale index: import lag means new policies are not yet searchable.",
      "Access-control leak: a missing filter returns restricted chunks. Test with users from different groups.",
      "Throttling at launch when model quotas were not raised ahead of time, or when pay-as-you-go capacity is contended."
    ]
  },
  {
    "id": "llm-serving",
    "name": "Self-hosted LLM serving at scale",
    "short": "Serve an open-weight or tuned model on GPUs or TPUs, with LLM-aware routing and reserved capacity.",
    "when": "You need a specific open model, locality, or unit economics that the managed APIs cannot meet, and you have a team that can own the fleet.",
    "flow": [
      {
        "l": "Clients",
        "s": "load-balancing"
      },
      {
        "l": "Inference Gateway",
        "s": "gke"
      },
      {
        "l": "Model servers (GPU)",
        "s": "gce"
      },
      {
        "l": "Model servers (TPU)",
        "s": "tpu"
      },
      {
        "l": "Weights + cache",
        "s": "gcs"
      },
      {
        "l": "Capacity + scale",
        "s": "dws"
      }
    ],
    "steps": [
      [
        0,
        "Requests arrive at a [[load-balancing|load balancer]] with TLS, WAF and a backend timeout set long enough for streaming."
      ],
      [
        1,
        "The [[gke|GKE Inference Gateway]] picks a replica by queue depth, KV-cache use and prefix match, with priorities between models and request classes."
      ],
      [
        2,
        "GPU model-server pods (vLLM, SGLang, Triton) run on [[gce|GPU nodes]] and stream tokens back."
      ],
      [
        3,
        "Or the same service runs on [[tpu|TPU]] node pools, using a TPU-capable serving engine, where tokens-per-dollar at steady volume justifies it."
      ],
      [
        4,
        "Weights load from [[gcs]] (through a cache) when a replica starts, so cold start is a function of the cache, not the bucket."
      ],
      [
        5,
        "Reserved capacity covers the baseline; [[dws|Dynamic Workload Scheduler]] and Spot cover bursts and batch, and the autoscaler follows queue depth."
      ]
    ],
    "why": [
      "Full control over the model, the serving engine and the cost curve.",
      "LLM-aware routing improves latency and throughput over plain round-robin.",
      "GPUs and TPUs can be mixed behind one service as economics change.",
      "Data and prompts stay entirely within your project and perimeter."
    ],
    "fails": [
      "Slow scale-out: a new GPU node plus image pull plus weight load takes many minutes, so a spike hits before capacity arrives. Keep headroom and cache weights.",
      "Capacity not available: quota is granted but no accelerators exist in the zone. Reserve the baseline.",
      "Streaming cut off by a short timeout on some hop in the path.",
      "A bad node stalls a replica and no health check catches it, so tail latency rises silently."
    ]
  },
  {
    "id": "training-mlops",
    "name": "Train, evaluate and promote (MLOps)",
    "short": "A repeatable pipeline from data to a monitored production model, with a gate before promotion.",
    "when": "You own a predictive or custom model, retraining is routine, and you need an auditable path from data to production.",
    "flow": [
      {
        "l": "Warehouse data",
        "s": "bigquery"
      },
      {
        "l": "Features",
        "s": "ap-feature-store"
      },
      {
        "l": "Pipeline",
        "s": "ap-pipelines"
      },
      {
        "l": "Training",
        "s": "ap-training"
      },
      {
        "l": "Evaluate + gate",
        "s": "ap-evals"
      },
      {
        "l": "Registry + endpoint",
        "s": "ap-inference"
      },
      {
        "l": "Monitor",
        "s": "ap-monitoring"
      }
    ],
    "steps": [
      [
        0,
        "Curated tables in [[bigquery]] hold the labelled history, built from raw data by SQL or [[dataflow]]."
      ],
      [
        1,
        "Features are defined once in [[ap-feature-store|Feature Store]] so training and serving use the same definitions."
      ],
      [
        2,
        "A scheduled or event-triggered [[ap-pipelines|pipeline]] starts a run and records lineage for each artifact."
      ],
      [
        3,
        "[[ap-training|Managed Training]] trains the candidate on the accelerators it requested, checkpointing to [[gcs]]."
      ],
      [
        4,
        "An evaluation step scores the candidate on a held-out set and compares it with the current production model; a condition gates promotion."
      ],
      [
        5,
        "If it wins, the model is registered and deployed to an [[ap-inference|endpoint]] with a canary traffic split and a one-step rollback."
      ],
      [
        6,
        "[[ap-monitoring|Model Monitoring]] watches skew and drift; a threshold or a schedule triggers the next run."
      ]
    ],
    "why": [
      "Retraining becomes routine and auditable instead of a heroic notebook session.",
      "One feature definition for training and serving removes a whole class of silent bugs.",
      "The gate stops a worse model from reaching users.",
      "Lineage answers \"which data and code made this model\" for audits and incidents."
    ],
    "fails": [
      "Training-serving skew: features are computed differently online and offline. Define them once.",
      "Labels arrive late, so the gate scores against stale truth. Use proxy metrics and track label delay.",
      "Pipeline caching hides a changed upstream table. Disable caching where inputs are not captured.",
      "No owner for drift alerts, so they are ignored until a failure."
    ]
  },
  {
    "id": "agent-platform",
    "name": "Tool-using agent platform",
    "short": "An agent that reads, decides and acts through narrow, governed tools, with memory and an audit trail.",
    "when": "The path to the answer varies with what the system finds, and the system must call internal APIs or data. If you can write the steps down, use a workflow instead. For several cooperating agents, see [[a:multi-agent-system|the production multi-agent architecture]]; for governance and release practice, see [[p:agent-governance-guide|governance]] and [[a:agent-cicd|CI/CD]].",
    "flow": [
      {
        "l": "User + auth",
        "s": "identity-platform"
      },
      {
        "l": "API front door",
        "s": "apigee"
      },
      {
        "l": "Agent runtime",
        "s": "agent-runtime"
      },
      {
        "l": "Reasoning model",
        "s": "gemini"
      },
      {
        "l": "Tools (MCP)",
        "s": "agent-protocols"
      },
      {
        "l": "Sessions + memory",
        "s": "agent-memory"
      },
      {
        "l": "Governance",
        "s": "agent-governance"
      }
    ],
    "steps": [
      [
        0,
        "The user signs in through [[identity-platform]]; a verified identity travels with every request."
      ],
      [
        1,
        "Requests enter through [[apigee]], which applies authentication, per-user rate and token limits, and screening."
      ],
      [
        2,
        "The agent, written with [[adk]], runs on [[agent-runtime|Agent Runtime]], which loads the session and scales it."
      ],
      [
        5,
        "[[agent-memory|Sessions and Memory Bank]] restore conversation state and relevant long-term memories."
      ],
      [
        3,
        "[[gemini|Gemini]] reasons over the request and decides which tool to call."
      ],
      [
        4,
        "Each tool is a narrow function behind an [[agent-protocols|MCP server]], such as \"get order status\", running with the user's authority or the agent's least-privilege identity."
      ],
      [
        6,
        "[[agent-governance|Agent Gateway]] enforces which tools the agent may reach and runs [[model-armor|Model Armor]]; every action is logged under the agent's identity."
      ],
      [
        2,
        "For actions that change state, a [[workflows|Workflows]] callback pauses for human approval before the tool runs."
      ]
    ],
    "why": [
      "Narrow tools and scoped identities bound the damage when the model is wrong or manipulated.",
      "Managed runtime and memory mean the team writes agent logic, not infrastructure.",
      "A single gateway gives one place for policy, screening and audit.",
      "Approval gates make it safe to start with real actions and earn autonomy later."
    ],
    "fails": [
      "Prompt injection through retrieved text or tool output steers the agent. Treat both as untrusted data and screen them.",
      "Loops burn tokens. Cap steps, tokens and wall-clock time per session.",
      "Vague tool descriptions cause wrong tool choices. Test tool selection on its own.",
      "The agent uses a broad service account, so one error can touch everything. Use per-tool identities."
    ]
  },
  {
    "id": "document-intelligence",
    "name": "Intelligent document processing",
    "short": "Turn scans, forms and PDFs into validated, structured records, with confidence-based human review.",
    "when": "You process high volumes of invoices, forms, claims or contracts and need auditable extraction, not a fluent summary.",
    "flow": [
      {
        "l": "Upload",
        "s": "gcs"
      },
      {
        "l": "Event",
        "s": "eventarc"
      },
      {
        "l": "Workflow",
        "s": "workflows"
      },
      {
        "l": "Extract",
        "s": "document-ai"
      },
      {
        "l": "Redact",
        "s": "sdp"
      },
      {
        "l": "Validate",
        "s": "gemini"
      },
      {
        "l": "Store",
        "s": "bigquery"
      }
    ],
    "steps": [
      [
        0,
        "A document lands in a [[gcs|Cloud Storage]] bucket from users, email ingestion or a partner feed."
      ],
      [
        1,
        "[[eventarc]] turns the object event into a trigger."
      ],
      [
        2,
        "[[workflows]] starts an execution that passes the object reference (not the document) between steps."
      ],
      [
        3,
        "[[document-ai]] runs OCR, layout analysis and extraction, returning fields with confidence and source locations."
      ],
      [
        4,
        "[[sdp|Sensitive Data Protection]] redacts or tokenises personal data before any generative step."
      ],
      [
        5,
        "[[gemini]] maps messy values to your schema and checks business rules, and each value must appear in the source text."
      ],
      [
        2,
        "Low-confidence or rule-failing documents branch to a human review step, which waits on a callback."
      ],
      [
        6,
        "Validated records are written to [[bigquery]] (or [[spanner]] for transactional use), with status and the review trail."
      ]
    ],
    "why": [
      "A specialist extractor gives confidence scores and locations, which an LLM alone does not.",
      "The LLM is used only for judgement, which keeps cost and risk low.",
      "Workflows retries and human review make the pipeline robust to bad inputs.",
      "Redaction before generation reduces privacy exposure."
    ],
    "fails": [
      "An LLM invents a value that is not in the document. Require each extracted value to be found in the source.",
      "Workflow payload limits exceeded by passing document text. Pass references.",
      "Backfills hit processor quotas. Use a queue and a concurrency limit ([[cloud-tasks]]).",
      "Confidence thresholds set without calibration auto-approve bad extractions."
    ]
  },
  {
    "id": "realtime-features",
    "name": "Real-time features and scoring",
    "short": "Stream events into fresh features and score requests in milliseconds, for ranking, fraud and recommendations.",
    "when": "A prediction must use what the user did seconds ago, and latency is measured in tens of milliseconds.",
    "flow": [
      {
        "l": "Events",
        "s": "pubsub"
      },
      {
        "l": "Stream processing",
        "s": "dataflow"
      },
      {
        "l": "Offline store",
        "s": "bigquery"
      },
      {
        "l": "Online store",
        "s": "ap-feature-store"
      },
      {
        "l": "Scoring endpoint",
        "s": "ap-inference"
      },
      {
        "l": "Monitor + feedback",
        "s": "ap-monitoring"
      }
    ],
    "steps": [
      [
        0,
        "Clicks, transactions and other events are published to [[pubsub]]."
      ],
      [
        1,
        "[[dataflow]] windows and aggregates the stream into features (counts, recency, rolling averages)."
      ],
      [
        2,
        "Features and raw events are also written to [[bigquery]], the offline store used to build point-in-time-correct training sets."
      ],
      [
        3,
        "The latest values are published to the [[ap-feature-store|online store]] for millisecond lookup by entity id."
      ],
      [
        4,
        "A request calls the [[ap-inference|endpoint]]; the service fetches features, scores the model and returns a result."
      ],
      [
        5,
        "Requests, predictions and later outcomes are logged, and [[ap-monitoring|monitoring]] compares live inputs with training."
      ]
    ],
    "why": [
      "Fresh behaviour improves prediction quality, especially for fraud and ranking.",
      "The same feature definitions serve training and live scoring, preventing skew.",
      "Streaming and serving scale independently.",
      "Logged outcomes become the next training data."
    ],
    "fails": [
      "Late or out-of-order events produce wrong windows. Set allowed lateness deliberately.",
      "A hot entity key overloads one worker or one tablet.",
      "Online store and offline store diverge. Reconcile on a schedule.",
      "Cold start: new users and items have no features. Use metadata and a fallback model."
    ]
  },
  {
    "id": "traditional-rag",
    "name": "Enterprise Traditional RAG Pipeline",
    "short": "Two-stage retrieval pipeline using Document AI for layout analysis, Vertex AI Search for hybrid BM25 and vector search, and Gemini.",
    "when": "Question-answering over enterprise documents (PDFs, policies, contracts) where layout structure and tabular precision are critical.",
    "flow": [
      {
        "s": "gcs",
        "l": "Raw documents"
      },
      {
        "s": "document-ai",
        "l": "Layout analysis"
      },
      {
        "s": "gemini",
        "l": "Chunk & embed"
      },
      {
        "s": "ai-search",
        "l": "Hybrid + rerank"
      },
      {
        "s": "apigee",
        "l": "AI gateway"
      },
      {
        "s": "gemini",
        "l": "Grounded model"
      }
    ],
    "steps": [
      [
        0,
        "Enterprise PDFs, forms, and manuals land in an encrypted [[gcs|Cloud Storage]] bucket with versioning and Pub/Sub notifications."
      ],
      [
        1,
        "A storage event triggers [[document-ai|Document AI]] layout analysis, extracting headers, reading order across multi-column pages, and Markdown tables."
      ],
      [
        2,
        "Text is split into layout-aware chunks with prepended document paths, then embedded into high-dimensional vectors via [[gemini|Vertex AI text-embedding-004]]."
      ],
      [
        3,
        "Chunks are indexed in [[ai-search|Vertex AI Search]] using hybrid search (BM25 keyword search + dense vector search fused via RRF) and scored by the Google Semantic Ranker."
      ],
      [
        4,
        "User applications query via [[apigee|Apigee API Management]], which enforces rate limits, verifies IAM OAuth2 tokens, and routes to search."
      ],
      [
        5,
        "The top 3-5 reranked passages are injected into [[gemini|Gemini 1.5 Pro or Flash]] with system instructions to cite sources and refuse unsupported claims."
      ]
    ],
    "why": [
      "Naive text extraction destroys tables and column hierarchies; Document AI layout analysis preserves Markdown tables so embeddings retain spatial relationships.",
      "Hybrid search in Vertex AI Search balances keyword accuracy (acronyms, SKUs) with dense vector semantic understanding.",
      "Google Semantic Ranker lifts Recall@5 by 15-25% without requiring expensive model fine-tuning."
    ],
    "fails": [
      "Document AI asynchronous processing latency on 100+ page documents delays ingestion if batch pipelines lack backpressure.",
      "Vertex AI Search datastore indexing latency during bulk initial corpus ingestion."
    ]
  },
  {
    "id": "agentic-rag",
    "name": "Agentic RAG and Multi-Tool Retrieval",
    "short": "Autonomous query decomposition, reflection, and iterative multi-source retrieval across datastores and operational databases.",
    "when": "Complex user questions requiring multi-hop reasoning, cross-system synthesis, and dynamic tool invocation rather than single-shot document search.",
    "flow": [
      {
        "s": "apigee",
        "l": "User inquiry"
      },
      {
        "s": "agent-runtime",
        "l": "Planner agent"
      },
      {
        "s": "adk",
        "l": "Orchestration tools"
      },
      {
        "s": "ai-search",
        "l": "Agent Search"
      },
      {
        "s": "bigquery",
        "l": "Operational data"
      },
      {
        "s": "gemini",
        "l": "Reflective synthesis"
      }
    ],
    "steps": [
      [
        0,
        "User queries arrive via [[apigee|Apigee]] with user identity and session headers."
      ],
      [
        1,
        "[[agent-runtime|Vertex AI Agent Runtime]] analyzes the prompt, evaluates conversation memory, and devises an execution plan with sub-queries."
      ],
      [
        2,
        "The orchestrator invokes tools built with [[adk|Agent Development Kit]] or hosted on [[cloud-run]] using typed schemas and parameter validation."
      ],
      [
        3,
        "The agent queries [[ai-search|Vertex AI Search]] for unstructured document evidence and cross-source literature."
      ],
      [
        4,
        "The agent invokes a tool against [[bigquery]] to query real-time transactional analytics and business metrics."
      ],
      [
        5,
        "[[gemini]] reflects on intermediate findings, checks if the question is satisfied, and synthesizes the verified answer."
      ]
    ],
    "why": [
      "Single-shot RAG cannot resolve comparative questions that require cross-referencing multiple disparate datasets.",
      "Separating tool execution into narrow Cloud Run microservices protects database credentials and bounds tool blast radius.",
      "Session persistence allows multi-turn conversational memory and agent state resumption."
    ],
    "fails": [
      "Unbounded reasoning loops if the model fails to detect that requested information does not exist in any knowledge source.",
      "High token consumption and latency if query decomposition fans out into too many redundant search queries."
    ]
  },
  {
    "id": "graph-rag",
    "name": "GraphRAG and Knowledge Graph Summarization",
    "short": "Extracts entities, relationships, and claims into Spanner Graph to generate hierarchical community summaries for global corpus synthesis.",
    "when": "Global, holistic queries over massive document corpora (\"What are the recurring supply chain risks across all supplier audits?\") where vector search alone fails.",
    "flow": [
      {
        "s": "gcs",
        "l": "Document corpus"
      },
      {
        "s": "dataflow",
        "l": "Graph extraction"
      },
      {
        "s": "spanner-graph",
        "l": "Graph communities"
      },
      {
        "s": "vector-search",
        "l": "Thematic index"
      },
      {
        "s": "gemini",
        "l": "Global synthesis"
      }
    ],
    "steps": [
      [
        0,
        "Unstructured corporate filings, audit reports, and contracts reside in [[gcs|Cloud Storage]]."
      ],
      [
        1,
        "[[dataflow]] and [[gemini]] extract named entities, semantic relationships, and factual claims from document chunks using structured prompts."
      ],
      [
        2,
        "Extracted knowledge graph nodes and edges are loaded into [[spanner-graph|Spanner Graph]], where hierarchical community detection algorithms group related entities."
      ],
      [
        3,
        "Community summaries are indexed in [[vector-search|Vertex AI Vector Search]] alongside embeddings of entity claims."
      ],
      [
        4,
        "Global user questions trigger community report retrieval, and [[gemini]] aggregates sub-community summaries into an executive synthesis with audit links."
      ]
    ],
    "why": [
      "Vector similarity cannot answer holistic corpus questions because no single chunk contains the global answer.",
      "Graph communities group related entities regardless of which document or folder they originated from.",
      "Pre-computed community summaries reduce query-time latency and token spend for high-level executive questions."
    ],
    "fails": [
      "High upfront token cost during the offline entity extraction phase across hundreds of thousands of document chunks.",
      "Graph drift if newly ingested documents are not incrementally incorporated into community clusters."
    ]
  },
  {
    "id": "multimodal-rag",
    "name": "Multimodal RAG with Document and Vision Intelligence",
    "short": "Ingestion and retrieval pipeline handling mixed text, images, charts, and diagrams using Document AI, Vision AI, and Gemini.",
    "when": "Engineering manuals, patent filings, financial charts, and medical reports where understanding images, plots, and blueprints is essential.",
    "flow": [
      {
        "s": "gcs",
        "l": "Mixed media files"
      },
      {
        "s": "document-ai",
        "l": "Document extraction"
      },
      {
        "s": "vision-ai",
        "l": "Vision & image analysis"
      },
      {
        "s": "vector-search",
        "l": "Multimodal index"
      },
      {
        "s": "gemini",
        "l": "Multimodal model"
      }
    ],
    "steps": [
      [
        0,
        "Mixed PDF reports, architectural drawings, and image attachments land in [[gcs|Cloud Storage]]."
      ],
      [
        1,
        "[[document-ai|Document AI]] extracts structured text and Markdown tables, identifying image and diagram bounding boxes."
      ],
      [
        2,
        "Embedded figures and visual diagrams are analyzed via [[vision-ai|Cloud Vision API]] and multimodal Gemini models to generate dense descriptive captions."
      ],
      [
        3,
        "Both text chunks and image visual embeddings are indexed in [[vector-search|Vertex AI Vector Search]] with cross-modal vector fields."
      ],
      [
        4,
        "User queries retrieve both textual passages and diagram visual artifacts; [[gemini|Gemini 1.5 Pro]] reasons over text and images simultaneously."
      ]
    ],
    "why": [
      "Text-only RAG discards charts, architectural blueprints, and graphs that contain the primary data payload in technical documents.",
      "Cross-modal indexing enables searching for diagrams using natural language queries.",
      "Multimodal Gemini models directly interpret visual relationships that cannot be represented in plain ASCII text."
    ],
    "fails": [
      "High processing costs if high-resolution images are embedded without resolution downsampling.",
      "Token consumption multiplies rapidly when high-resolution image tokens are passed into model context."
    ]
  },
  {
    "id": "secure-multitenant-rag",
    "name": "Secure Multi-Tenant RAG with Document ACLs",
    "short": "Enterprise multi-tenant RAG architecture with user-level security trimming, customer-managed encryption keys, and zero cross-tenant leakage.",
    "when": "Regulated enterprise B2B applications where users must only retrieve documents matching their corporate security group permissions.",
    "flow": [
      {
        "s": "iam",
        "l": "Cloud IAM identity"
      },
      {
        "s": "apigee",
        "l": "Tenant AI gateway"
      },
      {
        "s": "ai-search",
        "l": "Security trimming"
      },
      {
        "s": "kms",
        "l": "Customer keys (CMEK)"
      },
      {
        "s": "gcs",
        "l": "Encrypted tenant data"
      },
      {
        "s": "gemini",
        "l": "Isolated generation"
      }
    ],
    "steps": [
      [
        0,
        "Users authenticate against Google Cloud [[iam]] or Identity Platform, receiving a signed JWT containing user identity and security group claims."
      ],
      [
        1,
        "[[apigee|Apigee]] validates caller identity, extracts verified group claims, and enforces tenant rate limits."
      ],
      [
        2,
        "The search query injects a mandatory server-side document-level filter in [[ai-search|Vertex AI Search]] matching the caller security groups."
      ],
      [
        3,
        "All underlying documents and vector indexes are encrypted at rest with dedicated customer-managed keys in [[kms|Cloud KMS]]."
      ],
      [
        4,
        "Retrieved document passages are verified against tenant boundaries in [[gcs]] before inclusion in prompts."
      ],
      [
        5,
        "[[gemini]] generates responses with contractual Zero Data Retention and tenant-isolated context windows."
      ]
    ],
    "why": [
      "Frontend security filtering is easily bypassed; server-side security trimming at the search layer prevents cross-tenant data leaks.",
      "Customer-Managed Encryption Keys (CMEK) in Cloud KMS ensure tenants can cryptographically revoke data access instantly.",
      "Contractual zero customer data retention guarantees enterprise prompts and completions are never logged or stored for model training."
    ],
    "fails": [
      "Performance degradation if security group filter clauses contain thousands of individual user SIDs.",
      "Cache poisoning if semantic caches do not partition cache entries by tenant ID and security hash."
    ]
  },
  {
    "id": "multiagent-orchestration",
    "name": "Multi-Agent Orchestration Patterns",
    "short": "Specialized autonomous agents collaborating via Supervisor-Worker, Sequential Handoff, and Cloud Workflows approval flows.",
    "when": "Complex enterprise tasks requiring specialized expertise (researcher, coder, compliance reviewer) with human approval gates.",
    "flow": [
      {
        "s": "apigee",
        "l": "Task entrypoint"
      },
      {
        "s": "agent-runtime",
        "l": "Orchestrator agent"
      },
      {
        "s": "adk",
        "l": "Worker agents"
      },
      {
        "s": "cloud-run",
        "l": "Tool microservices"
      },
      {
        "s": "workflows",
        "l": "Approval workflow"
      },
      {
        "s": "cloud-monitoring",
        "l": "Distributed trace"
      }
    ],
    "steps": [
      [
        0,
        "Complex user task requests enter through [[apigee|Apigee]] with traceability headers."
      ],
      [
        1,
        "The primary supervisor agent in [[agent-runtime|Vertex AI Agent Runtime]] evaluates the objective and breaks it into sub-tasks for specialist workers."
      ],
      [
        2,
        "Worker agents built with [[adk|Agent Development Kit]] execute domain tasks (retrieval, code generation, mathematical analysis) in parallel."
      ],
      [
        3,
        "Agents invoke external APIs and business logic through secure [[cloud-run]] tool microservices."
      ],
      [
        4,
        "Irreversible actions (financial transfers, database writes) trigger [[workflows|Cloud Workflows]] pause states for human approval."
      ],
      [
        5,
        "Every agent turn, thought trace, tool execution, and approval event is streamed to [[cloud-monitoring]] for distributed auditing."
      ]
    ],
    "why": [
      "Single prompts degrade in reasoning quality when overloaded with dozens of contradictory tool instructions; specialized agents keep contexts focused.",
      "Supervisor agents enforce quality verification before presenting aggregated results to end users.",
      "Cloud Workflows provides reliable distributed state persistence and pause-for-human approval capabilities."
    ],
    "fails": [
      "Agent conversational ping-pong if supervisor and worker agents enter a circular delegation loop without hard turn caps.",
      "Cascading latency delays when multi-agent steps are executed sequentially rather than in parallel."
    ]
  },
  {
    "id": "genaiops-lifecycle",
    "name": "GenAIOps and Continuous Evaluation Pipeline",
    "short": "Continuous integration and evaluation pipeline running automated LLM evaluations and canary deployments on prompt changes.",
    "when": "Production teams deploying regular prompt, retrieval, or model updates requiring regression testing and automated release gates.",
    "flow": [
      {
        "s": "infra-manager",
        "l": "Infrastructure as code"
      },
      {
        "s": "ap-evals",
        "l": "Automated evals"
      },
      {
        "s": "model-garden",
        "l": "Model registry"
      },
      {
        "s": "ap-inference",
        "l": "Canary endpoint"
      },
      {
        "s": "cloud-monitoring",
        "l": "Online telemetry"
      }
    ],
    "steps": [
      [
        0,
        "Developers commit prompt templates, configuration parameters, and evaluation datasets versioned in Git managed via [[infra-manager|Infrastructure Manager]]."
      ],
      [
        1,
        "CI/CD pipeline triggers automated evaluation suites using [[ap-evals|Vertex AI Evaluation Service]] across 500+ golden test cases."
      ],
      [
        2,
        "Passing configurations are registered with cryptographic hashes in [[model-garden|Vertex AI Model Garden]] or the internal model catalog."
      ],
      [
        3,
        "The approved pipeline deploys a canary deployment on [[ap-inference|Vertex AI Endpoints]] routing 10% of live traffic."
      ],
      [
        4,
        "[[cloud-monitoring]] continuously monitors online Groundedness, P95 latency, token cost per task, and 429 quota spikes."
      ]
    ],
    "why": [
      "Small prompt edits frequently introduce catastrophic regressions; automated evaluation gates in CI prevent broken releases.",
      "Synthetic evaluation datasets test adversarial inputs and jailbreak attempts before code reaches production.",
      "Canary traffic splitting catches production data distribution drift before 100% rollout."
    ],
    "fails": [
      "Flaky LLM-as-a-judge evaluators if evaluation prompts are underspecified or temperature is not set to 0.0.",
      "High CI build times and costs if entire 5,000-case test sets are run on every minor pull request commit."
    ]
  }
];
