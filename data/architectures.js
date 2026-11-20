/* Reference architectures for AI and ML systems on Google Cloud.
   Each architecture follows the standardized 12-section AI Engineering Manager blueprint:
   id, cat, name, short, when, flow:[{s, l}], steps:[[nodeIdx, text]], why:[], fails:[],
   problem, whenNot, security, costModel, evalMetrics, checklist:[] */
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
    ],
    "cat": "rag",
    "problem": "Enterprise teams need factual, cited answers from internal repositories without hallucinations or leaking confidential documents across departments.",
    "whenNot": "When content is completely public and static (use cached LLM prompts) or when queries require complex multi-step reasoning across multiple external APIs (use [[a:agentic-rag|Agentic RAG]]).",
    "security": "Cloud IAM group claims are verified via [[identity-platform]]; documents are partitioned with metadata filters; prompts and retrieved context pass through [[model-armor]].",
    "costModel": "Primary cost is embedding generation and LLM context tokens. Semantic caching with Redis/[[memorystore]] and small chunk retrieval reduces input token bills by up to 60%.",
    "evalMetrics": "Target Recall@5 > 88%, Groundedness score > 94%, and Answer Relevance > 90% via automated [[ap-evals|Evaluation Service]].",
    "checklist": [
      "Gold evaluation dataset of 200+ QA pairs verified",
      "Metadata filtering security test passed",
      "Model Armor screening enabled for prompt injection",
      "429 rate limit fallback configured",
      "Streaming TTFT latency under 800ms"
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
    ],
    "cat": "production",
    "problem": "Enterprises hosting open-source or custom fine-tuned models (e.g. Llama 3, Gemma 2, Mistral) struggle with GPU utilization, high idle costs, and slow cold-start autoscaling.",
    "whenNot": "When standard Gemini models via Google Gen AI SDK satisfy quality and privacy requirements at 10x lower operational overhead.",
    "security": "Endpoints deployed within a private VPC with Private Service Connect; container images cryptographically signed and stored in Artifact Registry.",
    "costModel": "Dominated by continuous GPU/TPU reservation costs. Using Dynamic Workload Scheduler ([[dws]]) and vLLM continuous batching achieves 3-4x throughput per accelerator.",
    "evalMetrics": "Time To First Token (TTFT) < 150ms, generation throughput > 45 tokens/sec per stream, GPU memory utilization > 85%.",
    "checklist": [
      "vLLM or TensorRT-LLM container benchmarked",
      "HPA autoscaling on QPS and queue depth configured",
      "Spot instance preemption recovery tested",
      "Model weights pre-loaded from fast GCS bucket",
      "Cloud Monitoring GPU temperature & memory alerts active"
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
    ],
    "cat": "foundation-ml",
    "problem": "Data science teams lack standardized CI/CD for retraining custom models, causing silent data drift, unreproducible weights, and risky manual production deployments.",
    "whenNot": "When pre-trained foundation models or few-shot in-context learning with Gemini achieve target performance without bespoke weights.",
    "security": "Pipeline runs execute with service account least privilege; training datasets encrypted with Customer-Managed Encryption Keys ([[kms]]).",
    "costModel": "Compute costs incurred only during active training runs via [[ap-training]] serverless worker pools; spot accelerators reduce experiment bills by 60%.",
    "evalMetrics": "Model accuracy/F1 lift > 2.5% over production baseline, zero data schema anomalies, inference latency regression < 5%.",
    "checklist": [
      "Training data lineage tracked in Knowledge Catalog",
      "Hyperparameter tuning budget capped",
      "Automated model promotion gate in CI/CD",
      "Model registry rollback tested",
      "Continuous drift detection configured in Vertex Monitoring"
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
    ],
    "cat": "agents",
    "problem": "Autonomous agents accessing enterprise databases risk hallucinating parameters, running destructive queries, or leaking credentials without bounded governance.",
    "whenNot": "When the business process follows a deterministic sequential checklist that does not require generative planning or open-ended reasoning.",
    "security": "OAuth token exchange propagates end-user identity to tool execution; [[agent-governance]] enforces write approval policies; [[audit-logs]] records all invocations.",
    "costModel": "Token consumption scales with agent step count and tool call loops. Capping maximum iterations to 5 and utilizing prompt compression restricts unexpected billing spikes.",
    "evalMetrics": "Tool selection precision > 95%, tool argument accuracy > 98%, trajectory completion rate > 92%, human intervention rate < 8%.",
    "checklist": [
      "Tool execution sandboxed on Cloud Run",
      "Human-in-the-loop approval step configured for mutations",
      "Agent loop limit set to 5 iterations",
      "Session state persisted in Agent Memory",
      "Distributed trace context propagated to Cloud Monitoring"
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
    ],
    "cat": "genai",
    "problem": "Manual extraction of data from complex multi-page financial statements, medical records, and scanned forms is slow, expensive, and prone to human error.",
    "whenNot": "When documents are already cleanly structured as JSON, CSV, or relational tables (use standard ELT pipelines into BigQuery).",
    "security": "Sensitive PII scanned and masked via [[sdp|Sensitive Data Protection]]; documents processed within isolated VPC-SC perimeters.",
    "costModel": "Document AI per-page fee plus Gemini multimodal token costs. Batch document processing reduces API call costs compared to real-time synchronous calls.",
    "evalMetrics": "Field extraction accuracy > 99.2%, table cell alignment fidelity 100%, processing time < 3.5s per page.",
    "checklist": [
      "Document AI layout parser processor trained",
      "Sensitive Data Protection de-identification configured",
      "Eventarc trigger retry policy configured",
      "BigQuery schema validation in place",
      "DLQ for unparseable documents created"
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
    ],
    "cat": "foundation-ml",
    "problem": "Fraud detection and recommendation models fail when relying on stale daily batch features, missing fraudulent transactions happening in sub-second windows.",
    "whenNot": "When prediction decisions tolerate hours of feature latency (e.g. churn predictions or monthly risk scoring).",
    "security": "Pub/Sub topics encrypted with CMEK; VPC peering between Dataflow workers and BigQuery storage.",
    "costModel": "Continuous streaming Dataflow worker vCPUs and Vertex AI Feature Store online serving nodes. Rightsizing feature cache memory avoids over-provisioning.",
    "evalMetrics": "End-to-end feature ingestion latency < 200ms, online serving lookup latency < 10ms (P99), zero dropped events.",
    "checklist": [
      "Dataflow streaming pipeline autoscaling tested",
      "Feature Store online sync frequency validated",
      "Dead letter topic for malformed event payloads",
      "Cloud Monitoring lag alerts on Pub/Sub subscriptions",
      "Fallback default feature values defined in inference service"
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
    ],
    "cat": "rag",
    "problem": "Organizations need accurate internal documentation search without the engineering complexity of deploying custom vector infrastructure and chunking pipelines.",
    "whenNot": "When data is relational/graph-structured, or when complex multi-hop agentic reasoning across multiple databases is required.",
    "security": "Access controlled by Cloud IAM; documents encrypted at rest and in transit; no customer data used for model foundation training.",
    "costModel": "Managed query pricing based on Vertex AI Search query volume; predictable cost compared to self-hosted vector clusters.",
    "evalMetrics": "Search NDCG@10 > 0.85, Groundedness > 92%, citation accuracy 100%.",
    "checklist": [
      "Data store connector sync schedule tested",
      "Gemini summarization prompt configured",
      "Search filter attributes indexed",
      "Citations mapped to original URLs",
      "Search widget embedded with IAM auth"
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
    ],
    "cat": "rag",
    "problem": "Complex user questions require multiple search steps, comparison across distinct documents, and structured database queries that single-step RAG cannot resolve.",
    "whenNot": "When 90%+ of queries are simple FAQ lookups or single-passage retrievals where naive RAG is 5x faster and 80% cheaper.",
    "security": "Tool calls inherit caller identity; query generation validated against SQL injection; output checked by Model Armor.",
    "costModel": "Higher token consumption due to multi-step reasoning loops. Using Gemini Flash for routing and planning and Gemini Pro only for synthesis minimizes cost.",
    "evalMetrics": "Multi-hop question accuracy > 88%, unnecessary tool call rate < 5%, answer completeness score > 90%.",
    "checklist": [
      "Query decomposition prompt tuned with few-shot examples",
      "Tool call schemas validated with strict JSON Schema",
      "Maximum reasoning steps capped at 4",
      "Agent memory persistence configured",
      "User cancellation handler implemented"
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
    ],
    "cat": "rag",
    "problem": "Standard vector search fails on multi-hop relationship queries (e.g. \"which subsidiaries of vendor X share board members with competitor Y?\") because vectors miss structural connectivity.",
    "whenNot": "When content is purely descriptive text without entities, hierarchies, or network relationships.",
    "security": "Spanner Graph database protected by IAM and private endpoints; graph extraction pipeline runs in secure Dataflow boundary.",
    "costModel": "Spanner compute nodes and offline graph construction extraction costs with Gemini. Incremental graph updates avoid re-indexing whole corpora.",
    "evalMetrics": "Graph traversal precision > 92%, relationship extraction accuracy > 95%, multi-hop query recall > 85%.",
    "checklist": [
      "Graph ontology and entity types defined",
      "Spanner Graph schema with node and edge tables validated",
      "Entity resolution and deduplication pipeline running",
      "GQL query templates tested",
      "Fallback to vector search on disconnected entities"
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
    ],
    "cat": "rag",
    "problem": "Information trapped in technical schematics, architectural drawings, presentation charts, and financial tables is completely invisible to text-only embeddings.",
    "whenNot": "When source documents contain plain narrative text without diagrams, tables, or visual evidence.",
    "security": "Media files stored in private Cloud Storage buckets; presigned URLs with short expiry for client preview; VPC Service Controls enforced.",
    "costModel": "Multimodal embedding calls and Gemini vision token pricing. Generating text summaries of complex images during ingestion reduces downstream retrieval costs.",
    "evalMetrics": "Visual context relevance > 88%, table extraction fidelity > 95%, multimodal answer factual alignment > 92%.",
    "checklist": [
      "Document AI layout parser configured for tables",
      "Vision AI labels and OCR bounding boxes indexed",
      "Multimodal embedding model selected",
      "Image thumbnail storage pipeline established",
      "User interface renders image evidence alongside text"
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
    ],
    "cat": "rag",
    "problem": "SaaS platforms serving hundreds of corporate clients must guarantee complete data isolation so Tenant A never retrieves or glimpses Tenant B proprietary data.",
    "whenNot": "Single-tenant internal enterprise deployments where all users share the same access clearance.",
    "security": "Hard tenant partitioning via metadata filtering, IAM token validation at Apigee gateway, Customer-Managed Encryption Keys per tenant, and VPC-SC.",
    "costModel": "Shared index infrastructure with per-tenant metadata filtering provides 10x cost savings over spinning up dedicated vector clusters per tenant.",
    "evalMetrics": "Cross-tenant leakage rate: exactly 0.000%, tenant filter enforcement 100%, P95 search latency < 250ms.",
    "checklist": [
      "Tenant ID injection enforced at API gateway",
      "Vector search metadata filter strictly non-bypassable",
      "Automated red-team cross-tenant penetration test passing",
      "Tenant-specific audit logging verified",
      "Tenant offboarding data purge procedure tested"
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
    ],
    "cat": "agents",
    "problem": "Large enterprise workflows require collaboration across specialized domains (e.g. data analysis, legal compliance, and report drafting) that overwhelm a single monolithic prompt.",
    "whenNot": "When tasks can be executed with a single prompt or a straightforward deterministic script.",
    "security": "Agents run with distinct service accounts; inter-agent communication authenticated via mTLS; write actions require human verification.",
    "costModel": "Token multiplication across multiple agents. Implementing supervisor early-exit conditions and shared scratchpad context limits token inflation.",
    "evalMetrics": "End-to-end task success rate > 90%, inter-agent handoff accuracy > 96%, average execution duration < 12s.",
    "checklist": [
      "ADK agent definitions and system instructions reviewed",
      "Inter-agent message protocol defined",
      "Deadlock and infinite delegation circuit breaker active",
      "Human escalation webhook configured",
      "End-to-end trace viewable in Cloud Monitoring"
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
    ],
    "cat": "production",
    "problem": "Prompts, embeddings, and models degrade or introduce unexpected regressions when updated, breaking downstream applications without warning.",
    "whenNot": "One-off static hackathon prototypes or exploratory sandbox scripts.",
    "security": "Automated CI/CD runs via Cloud Build using Workload Identity Federation; release artifacts cryptographically signed in Artifact Registry.",
    "costModel": "Cost of running evaluation datasets in CI pipeline. Tiered evaluation (50 test cases on PR, 1,000 cases before production release) optimizes CI spend.",
    "evalMetrics": "Eval suite regression detection sensitivity 100%, zero unverified model promotions to production, automated canary rollback time < 60s.",
    "checklist": [
      "Golden evaluation dataset versioned in Git",
      "Vertex AI Evaluation gates integrated in Cloud Build",
      "Canary traffic splitting on Vertex Endpoints configured",
      "Cloud Monitoring SLO alerts for latency and Groundedness active",
      "One-click rollback script tested"
    ]
  },
  {
    "id": "traditional-ml",
    "cat": "foundation-ml",
    "name": "Classical ML Training and Serving Pipeline",
    "short": "End-to-end tabular machine learning pipeline from BigQuery data extraction to Vertex AI Model Registry and managed endpoints.",
    "when": "Structured tabular data where gradient boosted trees (XGBoost, LightGBM) or logistic regression outperform LLMs on latency, operational cost, and explainability.",
    "flow": [
      {
        "s": "bigquery",
        "l": "Warehouse data"
      },
      {
        "s": "ap-feature-store",
        "l": "Feature store"
      },
      {
        "s": "ap-training",
        "l": "Custom training"
      },
      {
        "s": "model-garden",
        "l": "Model registry"
      },
      {
        "s": "ap-inference",
        "l": "Managed endpoint"
      },
      {
        "s": "ap-monitoring",
        "l": "Drift detection"
      }
    ],
    "steps": [
      [
        0,
        "Raw transactions and customer features are stored in [[bigquery]], where SQL transformations create cleaned training datasets."
      ],
      [
        1,
        "Curated features are registered in [[ap-feature-store|Vertex AI Feature Store]] to prevent train-serve feature skew."
      ],
      [
        2,
        "Distributed training runs in [[ap-training|Vertex AI Training]] using custom container images with XGBoost or LightGBM."
      ],
      [
        3,
        "Trained model weights and evaluation metrics are versioned in [[model-garden|Vertex AI Model Garden]] and Model Registry."
      ],
      [
        4,
        "Approved models deploy to [[ap-inference|Vertex AI Endpoints]] with automatic horizontal pod autoscaling based on traffic."
      ],
      [
        5,
        "Production inference inputs and predictions are logged for drift analysis in [[ap-monitoring|Vertex AI Model Monitoring]]."
      ]
    ],
    "why": [
      "Tabular algorithms process predictions in under 10ms at a tiny fraction of LLM inference cost.",
      "Feature store guarantees exact feature parity between offline training and real-time online inference.",
      "Model Registry enables zero-downtime blue-green deployments and immediate rollbacks if data drift occurs."
    ],
    "fails": [
      "Silent data drift when upstream database schemas change without updating feature store pipelines.",
      "Over-provisioning endpoint machine types during low-traffic periods leading to unnecessary compute expenditure."
    ],
    "problem": "Enterprises using LLMs for numerical tabular predictions suffer from high latency, non-deterministic outputs, and exorbitant token bills.",
    "whenNot": "Unstructured text, images, or audio where deep neural networks and multimodal models are necessary.",
    "security": "Training data encrypted with CMEK via [[kms]]; VPC peering ensures data never traverses public networks.",
    "costModel": "Predictable compute pricing: spot VMs for training runs, autoscaled CPU endpoints for inference.",
    "evalMetrics": "ROC-AUC > 0.88, F1 Score > 0.82, P99 inference latency < 15ms.",
    "checklist": [
      "Baseline evaluation metrics established",
      "Feature store sync verified",
      "Model monitoring drift thresholds configured",
      "Automated deployment pipeline tested",
      "Rollback runbook verified"
    ]
  },
  {
    "id": "ml-inference",
    "cat": "foundation-ml",
    "name": "Low-Latency Real-Time ML Inference on Cloud Run",
    "short": "Serverless containerized model inference with fast scale-to-zero, concurrency tuning, and global edge routing.",
    "when": "Sub-50ms inference requirements for lightweight models (ONNX, Scikit-learn, small transformers) with variable or spiky traffic.",
    "flow": [
      {
        "s": "load-balancing",
        "l": "Global HTTPS LB"
      },
      {
        "s": "cloud-armor",
        "l": "DDoS and WAF"
      },
      {
        "s": "cloud-run",
        "l": "Serverless inference"
      },
      {
        "s": "secret-manager",
        "l": "API keys"
      },
      {
        "s": "cloud-monitoring",
        "l": "Latency metrics"
      }
    ],
    "steps": [
      [
        0,
        "Client requests arrive at [[load-balancing|Cloud Load Balancing]] with Anycast IP for low-latency global routing."
      ],
      [
        1,
        "[[cloud-armor|Cloud Armor]] filters malicious requests, mitigates Layer 7 attacks, and enforces rate limits."
      ],
      [
        2,
        "Requests are dispatched to [[cloud-run|Cloud Run]] instances running optimized ONNX Runtime or TensorRT containers."
      ],
      [
        3,
        "Microservice authenticates upstream tool requests using credentials retrieved securely from [[secret-manager]]."
      ],
      [
        4,
        "Request latency, error rates, and container CPU utilization are streamed to [[cloud-monitoring|Cloud Monitoring]]."
      ]
    ],
    "why": [
      "Cloud Run scales to zero during off-peak hours, eliminating idle compute costs of dedicated VM endpoints.",
      "Global Anycast load balancing terminates TLS close to the user, saving 40-100ms in handshake latency.",
      "Container portability allows local debugging and consistent deployment across test and production environments."
    ],
    "fails": [
      "Cold start latency when scaling from zero instances if container image exceeds 2GB in size.",
      "Concurrency contention if multi-threading in the inference container is misconfigured."
    ],
    "problem": "Dedicated VM endpoints incur massive idle costs for spiky or low-volume microservices requiring fast real-time scoring.",
    "whenNot": "Multi-GPU LLM inference requiring 80GB+ VRAM (use [[a:llm-serving|GKE LLM Serving]] instead).",
    "security": "Container executes in isolated gVisor sandbox; secret access granted via IAM service account.",
    "costModel": "Pay-per-request and pay-per-second execution; zero idle cost when traffic is absent.",
    "evalMetrics": "P95 latency < 35ms, cold start < 1.2s, 99.99% availability.",
    "checklist": [
      "Minimum instances tuned to prevent cold starts",
      "Container image optimized under 500MB",
      "Cloud Armor security rules active",
      "Health check endpoints configured",
      "Alerting on 5xx error rate enabled"
    ]
  },
  {
    "id": "batch-ml",
    "cat": "foundation-ml",
    "name": "High-Throughput Batch ML Scoring with BigQuery ML & Batch",
    "short": "Asynchronous scoring of millions of records using in-warehouse BigQuery ML or serverless Cloud Batch jobs.",
    "when": "Nightly batch scoring, customer segmentation, or risk scoring where real-time latency is unnecessary and cost efficiency is paramount.",
    "flow": [
      {
        "s": "gcs",
        "l": "Raw batch files"
      },
      {
        "s": "bigquery",
        "l": "Warehouse tables"
      },
      {
        "s": "bigquery-ai",
        "l": "BQML scoring"
      },
      {
        "s": "batch",
        "l": "Cloud Batch worker"
      },
      {
        "s": "composer",
        "l": "Orchestrator"
      }
    ],
    "steps": [
      [
        0,
        "Raw input files (JSON, CSV, Parquet) land in [[gcs|Cloud Storage]] from transactional database exports."
      ],
      [
        1,
        "Data is ingested and partitioned in [[bigquery]] tables for optimized analytical querying."
      ],
      [
        2,
        "Standard models execute directly in SQL using [[bigquery-ai|BigQuery ML]] `ML.PREDICT` with zero data movement."
      ],
      [
        3,
        "Complex deep learning models execute asynchronously via [[batch|Cloud Batch]] running parallel spot worker nodes."
      ],
      [
        4,
        "The end-to-end batch workflow, dependency checks, and notifications are managed by [[composer|Cloud Composer]]."
      ]
    ],
    "why": [
      "Scoring inside BigQuery eliminates network egress and serialisation overhead for millions of rows.",
      "Cloud Batch provisions spot instances dynamically, reducing compute costs by up to 70% compared to standard VMs.",
      "Airflow DAGs provide declarative retry semantics and dependency management."
    ],
    "fails": [
      "Slot contention in BigQuery during peak corporate reporting hours slowing down batch jobs.",
      "Spot instance preemption in Cloud Batch if checkpointing is not implemented."
    ],
    "problem": "Exporting millions of database rows to standalone servers for batch predictions causes network bottlenecks and high VM bills.",
    "whenNot": "Interactive real-time user requests requiring response times under 500ms.",
    "security": "Data processed within BigQuery IAM boundaries; Cloud Batch workers run in private VPC.",
    "costModel": "Cost driven by BigQuery slots and spot compute seconds; orders of magnitude cheaper than persistent clusters.",
    "evalMetrics": "Batch job completion time < 45 minutes for 10M records, zero data corruption, spot recovery rate 100%.",
    "checklist": [
      "BigQuery table partitioning verified",
      "Cloud Batch task retry policy set",
      "Composer alerting configured",
      "Cost allocation labels applied",
      "Output table permissions restricted"
    ]
  },
  {
    "id": "basic-llm",
    "cat": "genai",
    "name": "Stateless LLM Application on Cloud Run",
    "short": "Production containerized web API calling Gemini with API key management, streaming responses, and Model Armor screening.",
    "when": "Building conversational microservices, text summarizers, or generative utilities where state is client-managed and ops overhead must be zero.",
    "flow": [
      {
        "s": "load-balancing",
        "l": "Cloud LB"
      },
      {
        "s": "cloud-run",
        "l": "FastAPI backend"
      },
      {
        "s": "secret-manager",
        "l": "API credentials"
      },
      {
        "s": "model-armor",
        "l": "Prompt filter"
      },
      {
        "s": "gemini",
        "l": "Gemini model"
      },
      {
        "s": "audit-logs",
        "l": "Audit trails"
      }
    ],
    "steps": [
      [
        0,
        "User requests arrive at [[load-balancing|Cloud Load Balancing]] with SSL termination and global routing."
      ],
      [
        1,
        "[[cloud-run|Cloud Run]] hosts a lightweight FastAPI backend implementing Server-Sent Events (SSE) for token streaming."
      ],
      [
        2,
        "The service authenticates securely by mounting Vertex AI credentials from [[secret-manager]]."
      ],
      [
        3,
        "Input prompts are screened for jailbreaks, prompt injections, and sensitive PII by [[model-armor|Model Armor]]."
      ],
      [
        4,
        "Sanitized prompts are processed by [[gemini|Gemini 1.5 Flash/Pro]] using the official `google-genai` SDK."
      ],
      [
        5,
        "Interaction metadata, token usage, and latency are recorded in [[audit-logs|Cloud Audit Logs]] for compliance."
      ]
    ],
    "why": [
      "Serverless architecture scales automatically with user traffic while requiring zero infrastructure maintenance.",
      "SSE streaming delivers the first token in under 400ms, creating a responsive user experience.",
      "Model Armor ensures corporate safety guardrails are enforced before queries touch foundation models."
    ],
    "fails": [
      "HTTP 429 quota exhaustion during traffic spikes if quota reservations are not configured.",
      "Client timeout disconnects if streaming connections drop on mobile networks."
    ],
    "problem": "Engineering teams building simple AI utilities often over-engineer complex agent frameworks when a clean stateless API is sufficient.",
    "whenNot": "Complex workflows requiring multi-step tool calls, database lookups, or long-term multi-session memory.",
    "security": "Least-privilege IAM service account; Model Armor filters malicious injections; zero customer data retained for training.",
    "costModel": "Pay-as-you-go per million tokens; Cloud Run scales to zero when inactive.",
    "evalMetrics": "Time to first token (TTFT) < 450ms, 429 rate < 0.1%, prompt injection catch rate > 98%.",
    "checklist": [
      "Streaming SSE connection tested",
      "Model Armor filter rules validated",
      "Quota alerts configured in Cloud Monitoring",
      "Service account IAM scoped to Vertex AI User",
      "Client retry with exponential backoff implemented"
    ]
  },
  {
    "id": "gemini-enterprise",
    "cat": "genai",
    "name": "Enterprise Gemini Assistant with Managed Session State",
    "short": "Multi-turn conversational assistant with durable session history, Redis caching, and enterprise IAM authentication.",
    "when": "Internal workplace assistants requiring authenticated employee sessions, conversation history persistence, and low-latency token streaming.",
    "flow": [
      {
        "s": "identity-platform",
        "l": "Employee SSO"
      },
      {
        "s": "cloud-run",
        "l": "Assistant API"
      },
      {
        "s": "memorystore",
        "l": "Redis cache"
      },
      {
        "s": "firestore",
        "l": "Durable store"
      },
      {
        "s": "gemini",
        "l": "Gemini 1.5 Pro"
      }
    ],
    "steps": [
      [
        0,
        "Employees authenticate via corporate SAML/OIDC using [[identity-platform|Identity Platform]]."
      ],
      [
        1,
        "[[cloud-run|Cloud Run]] validates user JWT tokens and extracts verified organization claims."
      ],
      [
        2,
        "Active conversational context and recent message windows are retrieved from [[memorystore|Memorystore for Redis]]."
      ],
      [
        3,
        "Full conversation transcripts and user feedback ratings are stored durably in [[firestore]]."
      ],
      [
        4,
        "Prompt context with recent message history is sent to [[gemini|Gemini 1.5 Pro]] for contextual response generation."
      ]
    ],
    "why": [
      "Redis memory caching delivers sub-2ms session context lookups, minimizing conversation latency.",
      "Firestore provides scalable serverless persistence for historical chat review and auditing.",
      "Clean separation between fast cache and durable storage prevents database bottlenecks."
    ],
    "fails": [
      "Exceeding context window limits if conversation history is not trimmed or summarized periodically.",
      "Redis memory exhaustion if TTL expiration policies are not configured for abandoned sessions."
    ],
    "problem": "Conversational assistants lose context across browser refreshes or introduce multi-second latency by querying relational databases on every message.",
    "whenNot": "Stateless single-turn query tools that do not require conversational memory.",
    "security": "End-to-end token validation; Firestore documents partitioned by user ID with security rules.",
    "costModel": "Gemini input tokens scale with conversation depth; sliding-window trimming caps token spend.",
    "evalMetrics": "Session retrieval latency < 5ms, context retention accuracy > 95%, P95 response time < 1.2s.",
    "checklist": [
      "Redis eviction policy set to volatile-lru",
      "Sliding window of last 6 turns enforced",
      "Firestore indexes deployed",
      "Session encryption at rest enabled",
      "User deletion and GDPR export tested"
    ]
  },
  {
    "id": "grounded-generation",
    "cat": "genai",
    "name": "Grounded Generation with Web Search & Citations",
    "short": "Ground Gemini directly in Google Search or enterprise domains with verified URL citations and confidence scores.",
    "when": "Answering open-domain questions about real-time market data, competitor news, or public regulations without maintaining private RAG pipelines.",
    "flow": [
      {
        "s": "cloud-run",
        "l": "Application API"
      },
      {
        "s": "model-armor",
        "l": "Input screening"
      },
      {
        "s": "gemini",
        "l": "Gemini model"
      },
      {
        "s": "gemini-enterprise",
        "l": "Search Grounding"
      },
      {
        "s": "cloud-monitoring",
        "l": "Telemetry"
      }
    ],
    "steps": [
      [
        0,
        "Client application sends business query to [[cloud-run|Cloud Run]] API service."
      ],
      [
        1,
        "[[model-armor|Model Armor]] inspects query for prompt injection, hate speech, and sensitive corporate terms."
      ],
      [
        2,
        "[[gemini|Gemini]] evaluates query and determines whether external real-world search grounding is necessary."
      ],
      [
        3,
        "[[gemini-enterprise|Gemini Enterprise Agent Platform]] executes dynamic Google Search queries, retrieving live web sources."
      ],
      [
        4,
        "Final response with inline markdown citations and Grounding Support Chunk metadata is logged in [[cloud-monitoring]]."
      ]
    ],
    "why": [
      "Google Search grounding eliminates hallucinations on recent events and facts occurring after model cutoff.",
      "Native grounding integration requires zero vector database infrastructure, chunking code, or web scraping pipelines.",
      "Every factual claim includes clickable verifiable source citations."
    ],
    "fails": [
      "Search grounding latency adding 500ms-1500ms to response times.",
      "Queries on confidential internal topics failing because public search has no visibility into private documents."
    ],
    "problem": "Foundation models hallucinate on fast-moving news, stock prices, and recent regulatory changes without access to live web sources.",
    "whenNot": "Queries regarding private corporate data (use [[a:traditional-rag|Private RAG]] instead).",
    "security": "Enterprise search grounding does not log private enterprise queries to public search indices.",
    "costModel": "Standard Gemini token cost plus small per-request grounding search fee.",
    "evalMetrics": "Citation precision > 96%, Groundedness score > 94%, hallucination rate < 2%.",
    "checklist": [
      "Grounding dynamic threshold configured",
      "Citations rendered as clickable links",
      "Fallback response for search timeouts defined",
      "Latency monitoring alert set",
      "Model Armor policy applied"
    ]
  },
  {
    "id": "multimodal-intelligence",
    "cat": "genai",
    "name": "End-to-End Multimodal Vision & Document Pipeline",
    "short": "Unified ingestion of images, video, and audio combining Document AI OCR, Vision AI, and Gemini multimodal analysis.",
    "when": "Extracting insights from unstructured mixed media: handwritten receipts, equipment photos, surveillance clips, and recorded service calls.",
    "flow": [
      {
        "s": "gcs",
        "l": "Media lake"
      },
      {
        "s": "document-ai",
        "l": "OCR & layout"
      },
      {
        "s": "vision-ai",
        "l": "Visual bounds"
      },
      {
        "s": "gemini",
        "l": "Multimodal LLM"
      },
      {
        "s": "bigquery",
        "l": "Structured data"
      }
    ],
    "steps": [
      [
        0,
        "Mixed media (PDFs, TIFFs, JPGs, MP4s) are uploaded into partitioned [[gcs|Cloud Storage]] buckets."
      ],
      [
        1,
        "Text-heavy pages are processed through [[document-ai|Document AI]] to extract Markdown layouts and tables."
      ],
      [
        2,
        "Images and video frames are analyzed by [[vision-ai|Vision AI]] to identify visual objects and boundary coordinates."
      ],
      [
        3,
        "Combined text layout and visual elements are passed to [[gemini|Gemini 1.5 Pro]] for multimodal synthesis and reasoning."
      ],
      [
        4,
        "Extracted structured entities, confidence scores, and summaries are inserted into [[bigquery]] for business analytics."
      ]
    ],
    "why": [
      "Multi-modal fusion extracts information trapped between visual diagrams and surrounding text.",
      "Pre-processing with Document AI reduces LLM token costs by converting static text to clean Markdown.",
      "BigQuery acts as the structured query warehouse for enterprise reporting and BI dashboards."
    ],
    "fails": [
      "Large video files exceeding Cloud Run or API memory limits during frame extraction.",
      "OCR failures on low-resolution or degraded historical scanned documents."
    ],
    "problem": "Legacy OCR engines lose table formatting and cannot interpret diagrams, photos, or architectural blueprints.",
    "whenNot": "Purely structured database records or plain text files with no visual elements.",
    "security": "Media files encrypted with customer-managed keys in GCS; BigQuery column-level security applied.",
    "costModel": "Document AI per-page fee, Vision AI per-image fee, and Gemini multimodal token costs.",
    "evalMetrics": "Entity extraction F1 > 0.94, table alignment accuracy > 96%, average processing time < 4s.",
    "checklist": [
      "Document AI processor version pinned",
      "Dead letter queue for corrupted media files",
      "BigQuery partitioned table created",
      "Image compression pipeline verified",
      "Audit logging configured"
    ]
  },
  {
    "id": "prompt-engine",
    "cat": "genai",
    "name": "Dynamic Prompt Engine & Semantic Caching",
    "short": "Centralized prompt management platform with template versioning, semantic response caching, and model routing.",
    "when": "Large teams sharing LLM prompts across multiple microservices where duplicate queries waste budget and prompt edits need staging tests.",
    "flow": [
      {
        "s": "cloud-run",
        "l": "Prompt proxy"
      },
      {
        "s": "memorystore",
        "l": "Semantic cache"
      },
      {
        "s": "model-garden",
        "l": "Prompt registry"
      },
      {
        "s": "gemini",
        "l": "Gemini inference"
      },
      {
        "s": "ap-evals",
        "l": "Eval runner"
      }
    ],
    "steps": [
      [
        0,
        "Application requests hit a centralized [[cloud-run|Cloud Run]] prompt gateway."
      ],
      [
        1,
        "Gateway computes vector embedding of input and checks [[memorystore|Memorystore for Redis]] for semantically similar cached answers."
      ],
      [
        2,
        "If a cache miss occurs, the gateway fetches the active approved prompt template from [[model-garden|Model Garden]]."
      ],
      [
        3,
        "Query is routed to the optimal model ([[gemini|Gemini 1.5 Flash]] for simple tasks, Pro for complex tasks)."
      ],
      [
        4,
        "Background workers continuously run test prompts through [[ap-evals|Vertex AI Evaluation]] to detect regressions."
      ]
    ],
    "why": [
      "Semantic caching achieves 30-50% cost reduction by serving identical or paraphrased queries from cache.",
      "Decoupling prompt templates from application code enables immediate prompt updates without redeploying microservices.",
      "Model routing directs 70%+ of simple traffic to cheaper Flash models."
    ],
    "fails": [
      "Serving stale cached responses when underlying business data changes rapidly.",
      "Overly aggressive semantic similarity threshold returning incorrect answers for subtle query differences."
    ],
    "problem": "Hardcoding prompt strings in microservices leads to inconsistent quality, zero version control, and wasted budget on duplicate LLM calls.",
    "whenNot": "Highly dynamic queries requiring 100% unique personalized responses with zero repetition.",
    "security": "Prompt templates versioned in Git; cache keys salted with tenant ID to prevent cross-tenant data leaks.",
    "costModel": "Redis memory instance cost offset by 30-50% reduction in foundation model token spend.",
    "evalMetrics": "Cache hit rate > 35%, P95 cached latency < 25ms, semantic similarity threshold tuned to 0.92.",
    "checklist": [
      "Redis cache TTL policy established",
      "Semantic distance threshold calibrated",
      "Prompt versioning CI pipeline active",
      "Model routing logic unit tested",
      "Cache invalidation API deployed"
    ]
  },
  {
    "id": "hybrid-rag",
    "cat": "rag",
    "name": "Hybrid Search RAG with Reciprocal Rank Fusion",
    "short": "Enterprise retrieval combining dense semantic vectors, BM25 keyword matching, and cross-encoder reranking.",
    "when": "Corpora containing mixed conceptual questions and precise alphanumeric queries (SKUs, error codes, legal clauses) where vector search alone fails.",
    "flow": [
      {
        "s": "gcs",
        "l": "Document bucket"
      },
      {
        "s": "rag-engine",
        "l": "Chunk & embed"
      },
      {
        "s": "vector-search",
        "l": "Dense vector"
      },
      {
        "s": "ai-search",
        "l": "BM25 keyword"
      },
      {
        "s": "gemini",
        "l": "Rerank & answer"
      }
    ],
    "steps": [
      [
        0,
        "Enterprise PDFs and manuals are uploaded to [[gcs|Cloud Storage]]."
      ],
      [
        1,
        "[[rag-engine|RAG Engine]] parses documents, applies layout-aware chunking, and generates dense vector embeddings."
      ],
      [
        2,
        "Dense embeddings are indexed in [[vector-search|Vertex AI Vector Search]] for high-scale semantic similarity search."
      ],
      [
        3,
        "Exact keywords, product codes, and metadata are indexed in [[ai-search|Agent Search]] for BM25 lexical search."
      ],
      [
        4,
        "Top candidates from both passes are fused via Reciprocal Rank Fusion (RRF) and synthesized by [[gemini|Gemini]]."
      ]
    ],
    "why": [
      "Combines semantic understanding for conversational phrasing with exact keyword precision for codes and acronyms.",
      "Reciprocal Rank Fusion normalizes disparate scoring scales without fragile manual weight tuning.",
      "Reduces retrieval failure rate by 20-35% compared to vector search alone."
    ],
    "fails": [
      "Double query latency if dense and keyword searches are executed sequentially rather than in parallel.",
      "Reranker timeout if candidate pool sent to cross-encoder exceeds 50 documents."
    ],
    "problem": "Vector search fails on exact alphanumeric queries (e.g. 'Part #404-B2'), while keyword search fails on conceptual synonyms.",
    "whenNot": "Simple conversational chat over short plain text notes where basic retrieval suffices.",
    "security": "Documents encrypted at rest with CMEK; search requests filtered by user security groups.",
    "costModel": "Dual index storage plus embedding generation; offset by higher answer accuracy and fewer user retries.",
    "evalMetrics": "MRR > 0.85, NDCG@10 > 0.88, recall@5 > 92%.",
    "checklist": [
      "Parallel retrieval dispatch configured",
      "RRF constant tuned to k=60",
      "Reranker latency under 150ms",
      "Evaluation benchmark covers both keyword and semantic cases",
      "Embedding model version pinned"
    ]
  },
  {
    "id": "vector-search-rag",
    "cat": "rag",
    "name": "High-Scale Low-Latency Vector Search RAG with ScaNN",
    "short": "Billion-scale vector indexing using Google ScaNN algorithm deployed on private endpoints with sub-10ms query latency.",
    "when": "High-traffic search applications (>1,000 QPS) with millions of embedded items requiring ultra-low latency and Private Service Connect isolation.",
    "flow": [
      {
        "s": "gcs",
        "l": "Vector export"
      },
      {
        "s": "vector-search",
        "l": "ScaNN index"
      },
      {
        "s": "psc",
        "l": "Private endpoint"
      },
      {
        "s": "cloud-run",
        "l": "Search API"
      },
      {
        "s": "gemini",
        "l": "Answer synthesis"
      }
    ],
    "steps": [
      [
        0,
        "Pre-computed vector embeddings are exported to [[gcs|Cloud Storage]] in JSON or Avro format."
      ],
      [
        1,
        "[[vector-search|Vertex AI Vector Search]] builds an optimized index using Google ScaNN (Score-aware Anisotropic Vector Quantization)."
      ],
      [
        2,
        "The deployed index is exposed through a [[psc|Private Service Connect]] forwarding rule inside the corporate VPC."
      ],
      [
        3,
        "A high-performance [[cloud-run|Cloud Run]] microservice executes approximate nearest neighbor (ANN) queries with sub-10ms latency."
      ],
      [
        4,
        "Retrieved context passages are formatted and sent to [[gemini|Gemini 1.5 Flash]] for grounded answer synthesis."
      ]
    ],
    "why": [
      "ScaNN provides state-of-the-art recall-vs-latency trade-offs at multi-billion vector scale.",
      "Private Service Connect keeps all search traffic on Google private backbone with zero internet exposure.",
      "Automatic index replica scaling supports thousands of concurrent queries without latency degradation."
    ],
    "fails": [
      "Index build delays when adding large batches of new embeddings dynamically.",
      "Recall drops if vector dimension or quantization parameters are misconfigured during index creation."
    ],
    "problem": "Standard relational or open-source vector databases degrade in query latency and crash when scaling past 10 million vectors at high QPS.",
    "whenNot": "Small datasets (<50,000 vectors) where AlloyDB or BigQuery vector search is simpler and cheaper.",
    "security": "PSC endpoint prevents external internet access; IAM governs index administrative operations.",
    "costModel": "Billed per deployed index node hour; rightsizing replica count based on QPS demand is key.",
    "evalMetrics": "Recall@10 > 95%, P99 search latency < 12ms, QPS capacity > 2,500.",
    "checklist": [
      "ScaNN quantization parameters benchmarked",
      "PSC network connectivity validated",
      "Autoscaling minimum and maximum replicas set",
      "Incremental index update pipeline tested",
      "Monitoring alert for query latency active"
    ]
  },
  {
    "id": "sql-rag",
    "cat": "rag",
    "name": "Natural Language to SQL (NL2SQL) & Analytical RAG with BigQuery",
    "short": "Convert business questions into validated BigQuery SQL queries with schema grounding, dry-run safety, and natural language explanations.",
    "when": "Business intelligence, financial reporting, and KPI exploration over enterprise data warehouses where non-technical staff need instant data answers.",
    "flow": [
      {
        "s": "cloud-run",
        "l": "Analyst API"
      },
      {
        "s": "knowledge-catalog",
        "l": "Schema catalog"
      },
      {
        "s": "gemini",
        "l": "SQL generator"
      },
      {
        "s": "bigquery",
        "l": "Dry-run & exec"
      },
      {
        "s": "bigquery-ai",
        "l": "ML analytics"
      }
    ],
    "steps": [
      [
        0,
        "User asks a business question in natural language via the [[cloud-run|Cloud Run]] API service."
      ],
      [
        1,
        "Service retrieves table schemas, column descriptions, and business glossary terms from [[knowledge-catalog|Dataplex Knowledge Catalog]]."
      ],
      [
        2,
        "[[gemini|Gemini 1.5 Pro]] generates standard BigQuery SQL using the schema context and few-shot query examples."
      ],
      [
        3,
        "The query is validated using a [[bigquery]] dry run to verify syntax, security permissions, and byte-scan cost before execution."
      ],
      [
        4,
        "Results are analyzed using [[bigquery-ai|BigQuery AI]] functions, and Gemini generates a natural language summary with interactive charts."
      ]
    ],
    "why": [
      "Empowers non-technical stakeholders to query multi-petabyte datasets directly without writing SQL.",
      "BigQuery dry-run validation prevents execution of syntactically invalid or excessively expensive queries.",
      "Knowledge Catalog grounding ensures the model uses verified enterprise business definitions."
    ],
    "fails": [
      "Hallucinated column names if schema documentation is incomplete or ambiguous.",
      "Generating Cartesian product joins that exceed query memory limits on large tables."
    ],
    "problem": "Business users wait days for data analytics teams to write ad-hoc SQL reports for basic operational metrics.",
    "whenNot": "Unstructured text document retrieval where vector RAG is required.",
    "security": "Read-only BigQuery service account with row- and column-level security policies enforced.",
    "costModel": "BigQuery on-demand scan pricing capped by query cost limits; Gemini token fees for SQL generation.",
    "evalMetrics": "SQL syntax validity 100%, execution accuracy > 92%, dry-run rejection rate < 5%.",
    "checklist": [
      "Dry-run byte limit configured (e.g. max 10GB per query)",
      "Read-only IAM permissions enforced",
      "Schema descriptions populated in Knowledge Catalog",
      "Few-shot prompt library curated",
      "SQL injection sanitization verified"
    ]
  },
  {
    "id": "ha-rag",
    "cat": "rag",
    "name": "High-Availability Multi-Region RAG Architecture",
    "short": "Fault-tolerant RAG deployment with dual-region Cloud Storage, replicated vector indexes, and global load balancer failover.",
    "when": "Mission-critical tier-0 applications requiring 99.99% SLA and automatic regional disaster recovery without downtime during cloud zone incidents.",
    "flow": [
      {
        "s": "load-balancing",
        "l": "Global Anycast LB"
      },
      {
        "s": "cloud-run",
        "l": "Multi-region API"
      },
      {
        "s": "vector-search",
        "l": "Replicated index"
      },
      {
        "s": "gcs",
        "l": "Dual-region data"
      },
      {
        "s": "gemini",
        "l": "Multi-region LLM"
      }
    ],
    "steps": [
      [
        0,
        "Global client requests enter through [[load-balancing|Cloud Load Balancing]] with health-checked Anycast routing."
      ],
      [
        1,
        "Traffic is routed to the closest healthy region running [[cloud-run|Cloud Run]] application containers."
      ],
      [
        2,
        "Retrieval executes against localized [[vector-search|Vertex AI Vector Search]] indexes deployed across US and EU regions."
      ],
      [
        3,
        "Source documents and embedding checkpoints synchronize continuously across [[gcs|Cloud Storage]] dual-region buckets."
      ],
      [
        4,
        "Queries are dispatched to multi-region [[gemini|Gemini]] endpoints with automatic failover if a regional endpoint degrades."
      ]
    ],
    "why": [
      "Protects against regional cloud outages with zero manual DNS intervention.",
      "Routes users to geographically closest region, reducing latency for global enterprise workforces.",
      "Dual-region Cloud Storage guarantees RPO < 15 minutes and 99.99% data availability."
    ],
    "fails": [
      "Index synchronization lag between primary and secondary regions during large batch updates.",
      "Split-brain session state if cross-region session affinity is not handled properly."
    ],
    "problem": "Single-region RAG architectures suffer total application outages during regional network or datacenter disruptions.",
    "whenNot": "Internal non-critical tools where a 99.9% single-region availability SLA is acceptable.",
    "security": "Symmetric IAM security policies across both regions; CMEK keys replicated in both regions.",
    "costModel": "Infrastructure duplicated across regions; justified by avoidance of multi-million dollar business downtime.",
    "evalMetrics": "Availability 99.99%, failover switchover time < 30s, cross-region replication lag < 5 minutes.",
    "checklist": [
      "Global LB backend health checks configured",
      "Dual-region GCS bucket replication verified",
      "Vector Search index deployed in both regions",
      "Chaos engineering region outage simulation passed",
      "Disaster recovery runbook documented"
    ]
  },
  {
    "id": "single-agent",
    "cat": "agents",
    "name": "Single-Agent System with ADK & Cloud Run",
    "short": "Self-contained autonomous agent built with Google Agent Development Kit (ADK) running in serverless containers.",
    "when": "Well-defined customer support or workflow automation tasks where a single specialized agent with 3-5 tools provides bounded autonomy without multi-agent complexity.",
    "flow": [
      {
        "s": "cloud-run",
        "l": "Agent container"
      },
      {
        "s": "adk",
        "l": "ADK framework"
      },
      {
        "s": "secret-manager",
        "l": "Tool secrets"
      },
      {
        "s": "gemini",
        "l": "Reasoning model"
      },
      {
        "s": "cloud-monitoring",
        "l": "Trajectory logs"
      }
    ],
    "steps": [
      [
        0,
        "User requests arrive at [[cloud-run|Cloud Run]] hosting an agent microservice built with [[adk|Agent Development Kit]]."
      ],
      [
        1,
        "The agent initializes conversational state and loads tool definitions using [[adk|ADK]] primitives."
      ],
      [
        2,
        "Secure API tokens for enterprise backend integrations are fetched from [[secret-manager]]."
      ],
      [
        3,
        "[[gemini|Gemini 1.5 Pro]] reasons over user goals, selects appropriate tools, and formats structured parameters."
      ],
      [
        4,
        "Agent execution trajectory, tool call status, and latency metrics are logged to [[cloud-monitoring|Cloud Monitoring]]."
      ]
    ],
    "why": [
      "Follows Google's core architecture recommendation: start with a single specialized agent before introducing multi-agent complexity.",
      "ADK provides native session management, tool abstractions, and error recovery primitives.",
      "Serverless deployment on Cloud Run provides zero-maintenance autoscaling."
    ],
    "fails": [
      "Agent entering retry loops if tool error messages are unclear or unhandled.",
      "Tool hallucination if tool descriptions in the prompt are ambiguous."
    ],
    "problem": "Teams adopt complex multi-agent orchestrations for simple tasks, introducing high latency, flaky coordination, and 5x token bills.",
    "whenNot": "Multi-disciplinary enterprise workflows requiring distinct domain personas or strict organizational separation of duties.",
    "security": "Least-privilege IAM service account; tool arguments validated against strict Pydantic schemas.",
    "costModel": "Single model inference cost per turn; significantly cheaper than multi-agent debate or supervisor handoffs.",
    "evalMetrics": "Task completion rate > 92%, tool selection accuracy > 96%, average execution time < 3.5s.",
    "checklist": [
      "Tool descriptions documented with input constraints",
      "Maximum iteration limit set to 4",
      "Error handling fallback prompt defined",
      "Session memory persistence tested",
      "Trace logging enabled"
    ]
  },
  {
    "id": "tool-using-agent",
    "cat": "agents",
    "name": "Tool-Using Agent with Agent Runtime & Function Calling",
    "short": "Managed agent deployment on Vertex AI Agent Runtime executing sandboxed database, API, and code-execution tools.",
    "when": "Enterprise agents needing secure server-side execution of enterprise tools with OAuth token delegation and automatic schema validation.",
    "flow": [
      {
        "s": "agent-studio",
        "l": "Agent Studio"
      },
      {
        "s": "agent-runtime",
        "l": "Agent Runtime"
      },
      {
        "s": "cloud-run",
        "l": "Tool microservice"
      },
      {
        "s": "gemini",
        "l": "Gemini 1.5 Pro"
      },
      {
        "s": "audit-logs",
        "l": "Audit trails"
      }
    ],
    "steps": [
      [
        0,
        "Agent instructions, tools, and guardrails are configured visually in [[agent-studio|Agent Studio]]."
      ],
      [
        1,
        "The agent executes inside [[agent-runtime|Vertex AI Agent Runtime]], managing conversation state and tool dispatching."
      ],
      [
        2,
        "Tools execute as authenticated REST endpoints hosted on [[cloud-run|Cloud Run]] with IAM authorization."
      ],
      [
        3,
        "[[gemini|Gemini 1.5 Pro]] evaluates intermediate tool outputs and decides whether to invoke additional tools or respond."
      ],
      [
        4,
        "Every tool invocation, argument payload, and response is recorded in [[audit-logs|Cloud Audit Logs]] for compliance."
      ]
    ],
    "why": [
      "Agent Runtime provides managed hosting, scaling, and session persistence without managing raw Kubernetes pods.",
      "Tool execution is strictly decoupled from the LLM, running in isolated secure microservices.",
      "Comprehensive audit logging ensures full visibility into every automated action taken."
    ],
    "fails": [
      "Tool timeouts if backend API calls exceed the Agent Runtime execution deadline.",
      "Parameter mismatch if OpenAPI specification deviates from actual backend implementation."
    ],
    "problem": "Running tool functions inside client browsers or monolithic servers creates severe security risks and prevents auditing.",
    "whenNot": "Static document retrieval where standard RAG with no tool execution is required.",
    "security": "OAuth 2.0 token propagation; IAM governs Cloud Run tool access; immutable audit logs.",
    "costModel": "Agent Runtime hosting fees plus standard Gemini token costs and Cloud Run execution seconds.",
    "evalMetrics": "Tool argument accuracy > 98%, execution success rate > 95%, average response latency < 2.5s.",
    "checklist": [
      "OpenAPI schemas validated",
      "Cloud Run authentication enforced with IAM",
      "Timeout thresholds aligned across services",
      "Sensitive parameters masked in logs",
      "Error response codes handled gracefully"
    ]
  },
  {
    "id": "planner-executor",
    "cat": "agents",
    "name": "Planner-Executor Agent with Stepwise Verification",
    "short": "Two-stage agent architecture separating high-level strategic task decomposition from discrete tool execution and validation.",
    "when": "Multi-step complex business processes (supply chain rerouting, complex insurance claims) where executing without an upfront plan leads to infinite loops.",
    "flow": [
      {
        "s": "adk",
        "l": "ADK Planner"
      },
      {
        "s": "agent-runtime",
        "l": "Runtime engine"
      },
      {
        "s": "gemini",
        "l": "Reasoning LLM"
      },
      {
        "s": "firestore",
        "l": "Plan state"
      },
      {
        "s": "cloud-monitoring",
        "l": "Step metrics"
      }
    ],
    "steps": [
      [
        0,
        "User goal is received by the [[adk|ADK]] planning agent."
      ],
      [
        1,
        "[[agent-runtime|Agent Runtime]] coordinates the planner-executor lifecycle with durable session boundaries."
      ],
      [
        2,
        "[[gemini|Gemini 1.5 Pro]] analyzes the objective and creates a structured JSON plan with discrete verifiable sub-tasks."
      ],
      [
        3,
        "The plan, current execution index, and intermediate artifacts are persisted in [[firestore]] for state recovery."
      ],
      [
        4,
        "Step execution progress, plan revisions, and execution duration are tracked in [[cloud-monitoring|Cloud Monitoring]]."
      ]
    ],
    "why": [
      "Separating planning from execution prevents myopic agent behavior and reduces wandering in tool-space.",
      "The agent can re-plan dynamically when a tool step fails or returns unexpected data.",
      "Checkpoints in Firestore enable pausing and resuming long-running processes without restarting."
    ],
    "fails": [
      "Over-planning simple tasks, generating 10 steps when 1 step would suffice.",
      "Infinite re-planning loops if the planner refuses to acknowledge an unrecoverable external API error."
    ],
    "problem": "ReAct agents frequently get stuck in repetitive action loops or lose track of the original goal during long multi-step workflows.",
    "whenNot": "Single-step lookups or simple Q&A where planning introduces unnecessary latency and cost.",
    "security": "Plan generation constrained by strict JSON schema; plan state encrypted in Firestore.",
    "costModel": "Two LLM calls per task (planner + executor); mitigated by using Flash for executor steps.",
    "evalMetrics": "Plan completion rate > 90%, plan revision efficiency > 85%, step execution precision > 95%.",
    "checklist": [
      "Plan schema defined with max 8 steps",
      "Re-planning cap set to max 2 attempts",
      "Firestore checkpoint write latency verified",
      "Alerting for stalled plans configured",
      "User preview of plan enabled"
    ]
  },
  {
    "id": "sequential-agents",
    "cat": "agents",
    "name": "Deterministic Sequential Agent Pipeline",
    "short": "Chained specialist agents passing typed artifacts down a predictable assembly line with deterministic state transitions.",
    "when": "Document drafting, compliance verification, and code review workflows where tasks must happen in a strict sequential order with quality gates.",
    "flow": [
      {
        "s": "adk",
        "l": "Sequential construct"
      },
      {
        "s": "agent-runtime",
        "l": "Pipeline host"
      },
      {
        "s": "workflows",
        "l": "Cloud Workflows"
      },
      {
        "s": "gemini",
        "l": "Specialist models"
      },
      {
        "s": "agent-memory",
        "l": "Artifact store"
      }
    ],
    "steps": [
      [
        0,
        "Task is defined using the [[adk|ADK]] `SequentialAgent` construct with typed input and output contracts."
      ],
      [
        1,
        "[[agent-runtime|Agent Runtime]] hosts the agent pipeline execution environment."
      ],
      [
        2,
        "[[workflows|Cloud Workflows]] orchestrates deterministic transitions, step timeouts, and error retries."
      ],
      [
        3,
        "Specialized [[gemini|Gemini]] agents execute distinct roles: Drafter -> Fact-Checker -> Policy Auditor."
      ],
      [
        4,
        "Intermediate drafts, validation reports, and final artifacts are stored in [[agent-memory|Agent Memory]]."
      ]
    ],
    "why": [
      "Combines the flexibility of LLM specialists with the rock-solid determinism of workflow state machines.",
      "Each specialist agent has a focused prompt and narrow toolset, improving output quality and reducing hallucinations.",
      "Clear audit trail showing exactly which agent modified which section of an artifact."
    ],
    "fails": [
      "Pipeline stalling if an upstream agent produces output that fails downstream JSON schema validation.",
      "Accumulated latency if 4 or 5 sequential LLM calls run in series without streaming."
    ],
    "problem": "Prompting a single LLM to draft, verify, check compliance, and format output simultaneously results in overlooked errors and degraded quality.",
    "whenNot": "Open-ended exploratory tasks where steps cannot be predicted in advance.",
    "security": "Each agent runs with distinct IAM roles; artifacts signed and versioned in Agent Memory.",
    "costModel": "Predictable linear cost proportional to the number of stages in the pipeline.",
    "evalMetrics": "Stage-to-stage schema compliance 100%, final output quality score > 94%, pipeline completion rate > 98%.",
    "checklist": [
      "Pydantic schemas defined for every stage interface",
      "Step timeouts configured in Cloud Workflows",
      "Artifact retention policy set in Agent Memory",
      "Stage-level unit tests implemented",
      "Failure notification webhook configured"
    ]
  },
  {
    "id": "parallel-agents",
    "cat": "agents",
    "name": "Parallel Multi-Agent Research Swarm",
    "short": "Fan-out multi-agent architecture executing independent sub-queries simultaneously and aggregating results into a unified brief.",
    "when": "Broad competitive analysis, market research, and multi-source document reviews where parallel execution cuts latency from 60s to 5s.",
    "flow": [
      {
        "s": "cloud-run",
        "l": "Coordinator API"
      },
      {
        "s": "adk",
        "l": "ParallelAgent"
      },
      {
        "s": "pubsub",
        "l": "Fan-out queue"
      },
      {
        "s": "gemini",
        "l": "Worker agents"
      },
      {
        "s": "agent-memory",
        "l": "Aggregator"
      }
    ],
    "steps": [
      [
        0,
        "User research topic is received by the [[cloud-run|Cloud Run]] coordinator service."
      ],
      [
        1,
        "[[adk|ADK]] `ParallelAgent` decomposes the research topic into independent specialized sub-questions."
      ],
      [
        2,
        "Sub-tasks are published to [[pubsub|Cloud Pub/Sub]] topics for concurrent fan-out dispatching."
      ],
      [
        3,
        "Worker agents powered by [[gemini|Gemini 1.5 Flash]] query independent data sources simultaneously."
      ],
      [
        4,
        "Results are collected in [[agent-memory|Agent Memory]], and a synthesis agent produces a consolidated executive brief."
      ]
    ],
    "why": [
      "Reduces total research latency by 80% compared to sequential querying.",
      "Each worker agent is specialized for a specific domain (news, financials, patents, social sentiment).",
      "Pub/Sub decoupling prevents slow worker nodes from blocking the overall system."
    ],
    "fails": [
      "Synthesis agent hallucinating when merging contradictory findings from different worker agents.",
      "Pub/Sub worker timeouts under heavy burst traffic if concurrency limits are not tuned."
    ],
    "problem": "Comprehensive research workflows take minutes to complete when executed sequentially, causing browser timeouts and poor user experience.",
    "whenNot": "Sequential tasks where step B strictly depends on the output of step A.",
    "security": "Workers run in isolated containers with read-only access to source data; aggregator validates worker outputs.",
    "costModel": "Multiple concurrent LLM calls; offset by using lightweight Flash models for workers and Pro for synthesis.",
    "evalMetrics": "Total research latency < 8s, source coverage > 95%, synthesis factuality > 92%.",
    "checklist": [
      "Fan-out worker concurrency limits set",
      "Worker timeout deadline set to 10s",
      "Synthesis conflict resolution prompt tuned",
      "Pub/Sub dead letter topic configured",
      "Memory aggregation buffer sized properly"
    ]
  },
  {
    "id": "supervisor-agent",
    "cat": "agents",
    "name": "Supervisor-Worker Multi-Agent Orchestration",
    "short": "Hierarchical agent system where a central supervisor routes tasks to domain-specialist workers and synthesizes their deliverables.",
    "when": "Multi-functional enterprise portals (IT helpdesk + HR + Finance) where a single root agent delegates to distinct specialized teams with strict boundaries.",
    "flow": [
      {
        "s": "agent-studio",
        "l": "Supervisor config"
      },
      {
        "s": "agent-runtime",
        "l": "Runtime supervisor"
      },
      {
        "s": "adk",
        "l": "Worker agents"
      },
      {
        "s": "gemini",
        "l": "Gemini models"
      },
      {
        "s": "agent-governance",
        "l": "Access boundaries"
      }
    ],
    "steps": [
      [
        0,
        "Enterprise user interacts with the central supervisor agent configured in [[agent-studio|Agent Studio]]."
      ],
      [
        1,
        "[[agent-runtime|Agent Runtime]] manages supervisor context, worker dispatching, and return evaluation."
      ],
      [
        2,
        "Specialist worker agents created with [[adk|ADK]] handle specialized domains (Payroll, IT Provisioning, Benefits)."
      ],
      [
        3,
        "[[gemini|Gemini 1.5 Pro]] acts as supervisor for intent classification and synthesis; Flash powers workers."
      ],
      [
        4,
        "[[agent-governance|Agent Governance]] validates that workers only access tools within their authorized departmental boundaries."
      ]
    ],
    "why": [
      "Provides a clean single front door for users while maintaining strict separation of concern across enterprise systems.",
      "Supervisor shields backend workers from messy user dialogue, passing only structured task requirements.",
      "Prevents tool namespace pollution by isolating tool schemas to their respective specialist workers."
    ],
    "fails": [
      "Supervisor misclassifying user intent and delegating to the wrong specialist worker.",
      "Ping-pong delegation between supervisor and worker if task acceptance criteria are ambiguous."
    ],
    "problem": "Giving a single monolithic agent 50+ enterprise tools causes tool hallucination, high prompt token overhead, and security boundary violations.",
    "whenNot": "Single-domain applications where one specialized agent easily handles all user needs.",
    "security": "Role-based delegation enforced by Agent Governance; workers cannot call tools outside their assigned scope.",
    "costModel": "Supervisor call + worker call; token savings achieved by keeping worker tool definitions out of the supervisor prompt.",
    "evalMetrics": "Routing accuracy > 96%, task resolution rate > 92%, delegation ping-pong rate < 2%.",
    "checklist": [
      "Supervisor classification prompts tuned with golden examples",
      "Maximum delegation depth capped at 2",
      "Worker tool registries isolated",
      "Agent Governance access policies validated",
      "Centralized audit logging enabled"
    ]
  },
  {
    "id": "hitl-agent",
    "cat": "agents",
    "name": "Human-in-the-Loop Agent with Workflow Approvals",
    "short": "Autonomous agent execution paused at critical write checkpoints requiring human sign-off via Cloud Workflows and Cloud Tasks.",
    "when": "Financial transfers, database deletes, customer-facing emails, and medical prescriptions where automated actions require verifiable human confirmation.",
    "flow": [
      {
        "s": "adk",
        "l": "Agent engine"
      },
      {
        "s": "agent-runtime",
        "l": "Runtime state"
      },
      {
        "s": "workflows",
        "l": "Approval workflow"
      },
      {
        "s": "cloud-tasks",
        "l": "Callback queue"
      },
      {
        "s": "gemini",
        "l": "Action executor"
      }
    ],
    "steps": [
      [
        0,
        "User requests an impactful action (e.g. 'Issue $5,000 refund') handled by [[adk|ADK]] agent."
      ],
      [
        1,
        "[[agent-runtime|Agent Runtime]] validates the requested tool parameters and detects that the tool requires human authorization."
      ],
      [
        2,
        "Execution pauses and generates a signed callback webhook managed by [[workflows|Cloud Workflows]]."
      ],
      [
        3,
        "[[cloud-tasks|Cloud Tasks]] manages approval expiration deadlines and sends notifications via email/Slack/web portal."
      ],
      [
        4,
        "Upon verified human sign-off, [[gemini|Gemini]] resumes execution with the approved payload and confirms completion."
      ]
    ],
    "why": [
      "Human approval is the most effective safety guardrail for high-consequence enterprise actions.",
      "Cloud Workflows provides durable suspension for hours or days without consuming server compute.",
      "Clear separation of automated analysis from irreversible execution meets strict regulatory compliance requirements."
    ],
    "fails": [
      "Approval requests expiring or timing out if human reviewers do not respond within configured SLA windows.",
      "Context drift between the time the agent planned the action and the time the human approved it."
    ],
    "problem": "Autonomous agents executing write operations directly into ERP or financial systems risk catastrophic financial loss or data corruption from hallucinations.",
    "whenNot": "Read-only information retrieval or low-risk internal documentation queries.",
    "security": "Human approval action requires multi-factor authentication; signed callback tokens prevent unauthorized bypass.",
    "costModel": "Zero compute cost while waiting for human sign-off; standard model costs for planning and execution turns.",
    "evalMetrics": "Unauthorized execution rate: exactly 0.000%, approval notification latency < 2s, audit compliance 100%.",
    "checklist": [
      "Approval expiration timeout defined (e.g. 24 hours)",
      "HMAC signed callback URLs implemented",
      "Notification channels (Slack/Email) integrated",
      "Audit log records both agent proposal and human approval",
      "Re-validation of parameters upon approval verified"
    ]
  },
  {
    "id": "mcp-agent",
    "cat": "agents",
    "name": "Enterprise MCP-Based Agent with Tool Servers",
    "short": "Agent connecting to standardized Model Context Protocol (MCP) servers hosted on Cloud Run for dynamic tool discovery.",
    "when": "Standardizing tool integrations across multiple AI platforms (Gemini, Claude, local dev tools) without rewriting custom function definitions for each framework.",
    "flow": [
      {
        "s": "adk",
        "l": "ADK MCP client"
      },
      {
        "s": "agent-runtime",
        "l": "Agent host"
      },
      {
        "s": "cloud-run",
        "l": "MCP server"
      },
      {
        "s": "alloydb",
        "l": "Enterprise DB"
      },
      {
        "s": "gemini",
        "l": "Gemini model"
      }
    ],
    "steps": [
      [
        0,
        "[[adk|ADK]] initializes an MCP client connection to enterprise tool registries."
      ],
      [
        1,
        "[[agent-runtime|Agent Runtime]] discovers tool capabilities, schemas, and resource prompts dynamically at runtime."
      ],
      [
        2,
        "A containerized MCP server running on [[cloud-run|Cloud Run]] exposes standardized database tools over SSE transport."
      ],
      [
        3,
        "The MCP server executes authorized parameterized queries against [[alloydb]] PostgreSQL with ScaNN vector capabilities."
      ],
      [
        4,
        "Tool results are returned to [[gemini|Gemini 1.5 Pro]] in standard MCP format for synthesis and user response."
      ]
    ],
    "why": [
      "Model Context Protocol (MCP) eliminates vendor lock-in by providing an open standard for LLM tool integration.",
      "Tool schemas, prompt templates, and data resources are versioned and deployed independently of the agent logic.",
      "Cloud Run provides serverless hosting for MCP servers with automatic scaling and zero idle cost."
    ],
    "fails": [
      "SSE connection drops between client and remote MCP server during long-running tool executions.",
      "Security vulnerabilities if MCP servers do not validate caller authentication tokens."
    ],
    "problem": "Engineering teams rewrite custom tool integrations repeatedly for different agent frameworks and LLM SDKs.",
    "whenNot": "Tightly coupled single-purpose microservices with one fixed internal Python function.",
    "security": "mTLS or Bearer token authentication between ADK client and Cloud Run MCP server; database queries use parameterized SQL.",
    "costModel": "Serverless Cloud Run execution fees for MCP tool calls; standard Gemini inference costs.",
    "evalMetrics": "Tool discovery latency < 50ms, MCP schema compliance 100%, tool call success rate > 96%.",
    "checklist": [
      "MCP server Docker container hardened",
      "SSE transport heartbeat configured",
      "Tool parameters validated with JSON Schema",
      "IAM authentication required on Cloud Run",
      "AlloyDB connection pool configured"
    ]
  },
  {
    "id": "a2a-network",
    "cat": "agents",
    "name": "Inter-Enterprise Agent2Agent (A2A) Protocol Network",
    "short": "Decentralized cross-boundary agent communication using Google Agent2Agent protocol with mTLS, discovery, and capability negotiation.",
    "when": "B2B agent collaboration (buyer agent negotiating with supplier agent, travel agent negotiating with airline agent) across independent corporate domains.",
    "flow": [
      {
        "s": "agent-runtime",
        "l": "Enterprise agent"
      },
      {
        "s": "agent-protocols",
        "l": "A2A protocol"
      },
      {
        "s": "agent-governance",
        "l": "Identity & mTLS"
      },
      {
        "s": "apigee",
        "l": "B2B Gateway"
      },
      {
        "s": "gemini",
        "l": "Negotiation LLM"
      }
    ],
    "steps": [
      [
        0,
        "Enterprise internal agent running on [[agent-runtime|Agent Runtime]] initiates an external B2B procurement task."
      ],
      [
        1,
        "[[agent-protocols|Agent Protocols]] formats task intent using the standardized Agent2Agent (A2A) message contract."
      ],
      [
        2,
        "[[agent-governance|Agent Governance]] authenticates the remote agent using mutual TLS (mTLS) and cryptographic identity."
      ],
      [
        3,
        "Requests pass through [[apigee|Apigee API Management]] for enterprise traffic shaping, rate limiting, and contract auditing."
      ],
      [
        4,
        "[[gemini|Gemini 1.5 Pro]] reasons over external agent proposals, negotiates terms within pre-set constraints, and finalizes agreement."
      ]
    ],
    "why": [
      "Enables autonomous B2B commerce and workflow integration between independent companies without manual API integration.",
      "A2A protocol establishes standard discovery, task lifecycle, and capability negotiation mechanisms.",
      "Apigee provides enterprise security, monitoring, and audit trails for external agent interactions."
    ],
    "fails": [
      "Remote partner agent becoming unresponsive or returning malformed task updates.",
      "Adversarial prompt injection attacks originating from untrusted external agents."
    ],
    "problem": "Current agent systems are isolated within single corporate clouds with no secure, standardized way to delegate work to partner agents.",
    "whenNot": "Internal agent workflows that operate completely within a single corporate VPC.",
    "security": "mTLS certificate exchange; strict parameter bounds; external agent inputs treated as untrusted data.",
    "costModel": "Apigee API gateway calls plus standard model token costs; immense business value from automated B2B transaction execution.",
    "evalMetrics": "Negotiation agreement rate > 88%, A2A handshake latency < 200ms, zero unauthorized data disclosure.",
    "checklist": [
      "mTLS certificates rotated and verified",
      "Apigee B2B proxy deployed with rate limits",
      "Strict parameter guardrails configured for negotiation",
      "External inputs screened by Model Armor",
      "Transaction non-repudiation logging active"
    ]
  },
  {
    "id": "cloud-run-ai",
    "cat": "production",
    "name": "Serverless Containerized AI Microservice on Cloud Run",
    "short": "Fully managed serverless AI backend running containerized Python/Go with zero-scale down, GPU acceleration, and Cloud Armor WAF.",
    "when": "Production REST/gRPC AI endpoints with bursty traffic, requiring rapid autoscaling, automatic TLS certificates, and zero infrastructure maintenance.",
    "flow": [
      {
        "s": "load-balancing",
        "l": "Cloud LB"
      },
      {
        "s": "cloud-armor",
        "l": "Cloud Armor"
      },
      {
        "s": "cloud-run",
        "l": "Cloud Run GPU/CPU"
      },
      {
        "s": "gemini",
        "l": "Gemini API"
      },
      {
        "s": "cloud-monitoring",
        "l": "SLO Dashboard"
      }
    ],
    "steps": [
      [
        0,
        "Global client requests arrive at [[load-balancing|Cloud Load Balancing]] with Anycast IP routing."
      ],
      [
        1,
        "[[cloud-armor|Cloud Armor]] enforces DDoS protection, rate limits, and GeoIP filtering at the network edge."
      ],
      [
        2,
        "Requests are processed by containerized microservices on [[cloud-run|Cloud Run]] utilizing serverless GPUs (NVIDIA L4) or CPUs."
      ],
      [
        3,
        "Microservice calls [[gemini|Gemini 1.5 Pro]] via Google Gen AI SDK with connection pooling and retries."
      ],
      [
        4,
        "Request latency, error rates, and container resource metrics are visualized on [[cloud-monitoring|Cloud Monitoring]] dashboards."
      ]
    ],
    "why": [
      "True serverless operational model: scales down to zero when idle, scales up to hundreds of instances in seconds.",
      "Now supports serverless NVIDIA L4 GPUs for local embedding generation and small open-source model inference.",
      "Zero cluster management overhead compared to Kubernetes/GKE."
    ],
    "fails": [
      "GPU cold start delays if minimum instances are set to zero for latency-sensitive APIs.",
      "Container instance memory limits exceeded if processing multi-gigabyte media uploads in memory."
    ],
    "problem": "Operating dedicated Kubernetes clusters for simple AI microservices consumes hundreds of engineering hours in cluster maintenance and upgrades.",
    "whenNot": "Massive multi-node distributed training or highly customized Kubernetes networking (use [[a:llm-serving|GKE]] instead).",
    "security": "Container runs in secure gVisor sandbox; egress routed through Private Google Access.",
    "costModel": "Per-second resource billing; zero waste on idle clusters during weekends or off-peak hours.",
    "evalMetrics": "API availability 99.99%, P95 latency < 350ms, zero-downtime rolling deployment verification.",
    "checklist": [
      "Minimum instances set to 1 for latency-critical paths",
      "Cloud Armor security policy attached",
      "Concurrency parameter tuned (typically 40-80 per instance)",
      "Health check probes configured",
      "SLO alerts for 5xx errors active"
    ]
  },
  {
    "id": "private-ai",
    "cat": "production",
    "name": "Zero-Egress Private AI Architecture with PSC & VPC-SC",
    "short": "Isolated enterprise AI environment where model calls, embeddings, and data access stay entirely on private Google Cloud network backbones.",
    "when": "Regulated banking, defense, and healthcare environments where no packet may traverse the public internet and VPC Service Controls enforce zero-data-exfiltration.",
    "flow": [
      {
        "s": "vpc",
        "l": "Private VPC"
      },
      {
        "s": "psc",
        "l": "PSC endpoint"
      },
      {
        "s": "vpc-sc",
        "l": "VPC Service Perimeter"
      },
      {
        "s": "gemini",
        "l": "Private Gemini"
      },
      {
        "s": "kms",
        "l": "CMEK keys"
      }
    ],
    "steps": [
      [
        0,
        "Corporate application runs inside a secure, private [[vpc|Virtual Private Cloud]] with no public internet gateway."
      ],
      [
        1,
        "Traffic to Google AI services routes through a [[psc|Private Service Connect]] endpoint with internal IP addresses."
      ],
      [
        2,
        "[[vpc-sc|VPC Service Controls]] perimeter surrounds storage, models, and databases, blocking any egress outside the security zone."
      ],
      [
        3,
        "Requests reach [[gemini|Gemini]] private endpoints without ever touching public IP space."
      ],
      [
        4,
        "All data at rest, embeddings, and cached states are encrypted using [[kms|Cloud KMS]] Customer-Managed Encryption Keys."
      ]
    ],
    "why": [
      "Eliminates data exfiltration risk: even compromised credentials cannot export data outside the VPC-SC perimeter.",
      "Meets stringent FedRAMP High, HIPAA, and PCI-DSS compliance requirements for AI workloads.",
      "Private Service Connect provides predictable, low-latency network performance across private Google fiber."
    ],
    "fails": [
      "Developers blocked from legitimate external tools if VPC-SC egress rules are overly restrictive.",
      "Routing failures if internal DNS records for PSC endpoints are not configured correctly."
    ],
    "problem": "Enterprise security teams reject AI projects because public SaaS API endpoints expose corporate data to internet interception and exfiltration.",
    "whenNot": "Public web applications using public documentation where internet isolation is unnecessary.",
    "security": "Zero public IP addresses; VPC Service Controls enforced; Customer-Managed Encryption Keys.",
    "costModel": "PSC data processing fees and KMS key rotation costs; marginal cost compared to compliance violations.",
    "evalMetrics": "Zero packets routed over public internet, VPC-SC violation count 0, data encryption coverage 100%.",
    "checklist": [
      "VPC-SC perimeter dry-run mode tested before enforcement",
      "PSC DNS zone configured with private Google IPs",
      "CMEK key rotation policy set to 90 days",
      "Audit logging for perimeter blocks enabled",
      "Developer access via Cloud Workstations verified"
    ]
  },
  {
    "id": "apigee-ai",
    "cat": "production",
    "name": "Enterprise AI API Gateway with Apigee",
    "short": "Centralized enterprise AI gateway enforcing API rate limits, token quotas, monetization, and automated prompt inspection.",
    "when": "Exposing internal LLMs or agent tools to hundreds of business units or external developers requiring strict token billing, spike arrest, and IAM governance.",
    "flow": [
      {
        "s": "cloud-armor",
        "l": "Cloud Armor WAF"
      },
      {
        "s": "apigee",
        "l": "Apigee Gateway"
      },
      {
        "s": "identity-platform",
        "l": "Developer OAuth"
      },
      {
        "s": "cloud-run",
        "l": "Backend AI API"
      },
      {
        "s": "gemini",
        "l": "Foundation model"
      }
    ],
    "steps": [
      [
        0,
        "External and internal client requests arrive at [[cloud-armor|Cloud Armor]] for DDoS protection and edge rate limiting."
      ],
      [
        1,
        "[[apigee|Apigee API Management]] enforces API key validation, OAuth JWT token verification, and quota policies."
      ],
      [
        2,
        "Developer credentials and organization tiers are validated through [[identity-platform|Identity Platform]]."
      ],
      [
        3,
        "Apigee routes approved requests to backend microservices running on [[cloud-run|Cloud Run]]."
      ],
      [
        4,
        "Requests invoke [[gemini|Gemini 1.5]] foundation models with streaming token counting and cost attribution."
      ]
    ],
    "why": [
      "Prevents any single runaway team or external tenant from exhausting enterprise Vertex AI quotas.",
      "Enables internal chargeback and external API monetization with precise token-level metering.",
      "Centralizes security policies, CORS rules, and rate limits in a dedicated API management layer."
    ],
    "fails": [
      "Apigee proxy latency adding 20-50ms overhead if complex JavaScript policies are executed on request paths.",
      "Rate limit policies blocking legitimate enterprise traffic during sudden marketing campaigns."
    ],
    "problem": "Unregulated access to enterprise LLM endpoints results in quota exhaustion, unexpected six-figure billing spikes, and zero cost attribution.",
    "whenNot": "Small single-team internal tools with known, predictable query volumes.",
    "security": "OAuth 2.0 with mTLS; API keys never shared directly with downstream model endpoints.",
    "costModel": "Apigee API call tiers; pay-off is total visibility and automated control over million-dollar LLM budgets.",
    "evalMetrics": "Gateway overhead < 15ms, quota enforcement accuracy 100%, chargeback attribution coverage 100%.",
    "checklist": [
      "Spike arrest policies configured on all AI proxies",
      "Token counting policy implemented in Apigee",
      "Developer portal with self-service API key provisioning active",
      "Cost attribution reporting integrated into BigQuery",
      "Circuit breaker for backend model outages tested"
    ]
  },
  {
    "id": "enterprise-platform",
    "cat": "production",
    "name": "Unified Enterprise AI Platform with Agent Gateway & Identity",
    "short": "Comprehensive enterprise AI landing zone featuring Agent Identity, Agent Registry, Agent Gateway, and Model Armor safety perimeters.",
    "when": "Fortune 500 enterprises standardizing AI delivery across dozens of engineering teams with centralized security, auditing, and cost attribution.",
    "flow": [
      {
        "s": "iam",
        "l": "Workload Identity"
      },
      {
        "s": "agent-governance",
        "l": "Agent Gateway"
      },
      {
        "s": "agent-runtime",
        "l": "Agent Runtime"
      },
      {
        "s": "model-armor",
        "l": "Safety firewall"
      },
      {
        "s": "gemini",
        "l": "Gemini 1.5 Pro"
      }
    ],
    "steps": [
      [
        0,
        "Enterprise engineering teams authenticate workloads using [[iam|Cloud IAM]] Workload Identity Federation."
      ],
      [
        1,
        "[[agent-governance|Agent Governance]] acts as the enterprise Agent Gateway, enforcing agent identity and tool permissions."
      ],
      [
        2,
        "Agents execute in managed sandboxes on [[agent-runtime|Vertex AI Agent Runtime]] with unified lifecycle management."
      ],
      [
        3,
        "All prompts, retrieved documents, and tool responses pass through centralized [[model-armor|Model Armor]] inspection."
      ],
      [
        4,
        "Secure, compliant requests are fulfilled by foundation models in [[gemini|Gemini Enterprise Agent Platform]]."
      ]
    ],
    "why": [
      "Treats AI agents as first-class enterprise principals with verifiable identity and bounded permissions.",
      "Prevents shadow AI by providing developers with approved, secure 'golden paths' for agent deployment.",
      "Centralizes safety, compliance, and audit logging across the entire corporation."
    ],
    "fails": [
      "Over-centralization causing engineering friction if agent onboarding takes weeks of administrative approvals.",
      "Bottlenecks at the Agent Gateway if throughput limits are not provisioned for peak enterprise load."
    ],
    "problem": "Disparate engineering teams building ad-hoc AI tools create severe regulatory compliance gaps, credential leaks, and duplicative software costs.",
    "whenNot": "Early-stage startups with a single development team where lightweight setups suffice.",
    "security": "Zero-trust agent architecture: every agent has an identity, every tool call is authorized, every step is logged.",
    "costModel": "Centralized billing with automated departmental cost allocation labels.",
    "evalMetrics": "Agent onboarding time < 2 hours, compliance pass rate 100%, zero unauthenticated tool executions.",
    "checklist": [
      "Agent Identity and Registry configured",
      "Model Armor enterprise safety policies deployed",
      "Automated terraform landing zone modules published",
      "Cross-project IAM permissions established",
      "Executive cost allocation dashboard active"
    ]
  },
  {
    "id": "multi-region-ai",
    "cat": "production",
    "name": "Multi-Region Resilient AI Architecture",
    "short": "Active-active multi-region deployment with Global Anycast Load Balancing, regional failover, and synchronized metadata.",
    "when": "Global enterprise applications with strict low-latency requirements across US, Europe, and Asia-Pacific requiring instant regional failover during cloud outages.",
    "flow": [
      {
        "s": "load-balancing",
        "l": "Global Anycast LB"
      },
      {
        "s": "cloud-run",
        "l": "Regional Cloud Run"
      },
      {
        "s": "psc",
        "l": "Private Connect"
      },
      {
        "s": "gemini",
        "l": "Regional Gemini"
      },
      {
        "s": "cloud-monitoring",
        "l": "Global health"
      }
    ],
    "steps": [
      [
        0,
        "Global client requests hit [[load-balancing|Cloud Load Balancing]] Anycast IP, routing to the nearest healthy continent."
      ],
      [
        1,
        "Regional [[cloud-run|Cloud Run]] instances in Iowa (us-central1), Belgium (europe-west1), and Tokyo (asia-northeast1) process requests locally."
      ],
      [
        2,
        "Internal traffic traverses private backbones via [[psc|Private Service Connect]] to regional endpoints."
      ],
      [
        3,
        "Requests are served by regional [[gemini|Gemini]] deployments adhering to local data residency requirements."
      ],
      [
        4,
        "[[cloud-monitoring|Cloud Monitoring]] global synthetic probes continuously test regional endpoint health and trigger instant failover."
      ]
    ],
    "why": [
      "Minimizes network latency for global workforces by terminating connections within their geographic region.",
      "Guarantees business continuity: if an entire cloud region experiences an incident, traffic shifts seamlessly in seconds.",
      "Allows compliance with regional data sovereignty regulations (e.g. EU data staying within EU boundaries)."
    ],
    "fails": [
      "Quota imbalances where failover region cannot handle sudden doubled traffic volume during an outage.",
      "Cross-region data transfer egress fees if application logic inadvertently transfers large payloads between regions."
    ],
    "problem": "Single-region AI systems suffer from elevated trans-oceanic latency (200ms+ round trips) and catastrophic downtime during regional outages.",
    "whenNot": "Local domestic applications with users located exclusively within a single metropolitan area or country.",
    "security": "Symmetric security perimeters across all regions; regional KMS keys prevent cross-region decryption.",
    "costModel": "Multi-region compute capacity; offset by global latency optimization and guaranteed business SLA.",
    "evalMetrics": "Global P95 response time < 800ms, automatic regional failover time < 20s, availability 99.99%.",
    "checklist": [
      "Quota headroom of at least 50% reserved in secondary regions",
      "Anycast health checks tuned with 5s probe interval",
      "Regional data residency compliance verified",
      "Automated cross-region load testing conducted",
      "Disaster recovery failover simulation run quarterly"
    ]
  },
  {
    "id": "event-driven-agent",
    "cat": "production",
    "name": "Event-Driven Asynchronous Agent with Pub/Sub & Cloud Tasks",
    "short": "Decoupled asynchronous AI processing triggered by Cloud Storage uploads, database mutations, or webhook events with guaranteed delivery.",
    "when": "Large batch ingestion, back-office ticket routing, and asynchronous document extraction where synchronous HTTP requests would time out.",
    "flow": [
      {
        "s": "gcs",
        "l": "Document upload"
      },
      {
        "s": "pubsub",
        "l": "Eventarc bus"
      },
      {
        "s": "cloud-tasks",
        "l": "Rate-limited queue"
      },
      {
        "s": "cloud-run",
        "l": "Worker service"
      },
      {
        "s": "gemini",
        "l": "Extraction LLM"
      }
    ],
    "steps": [
      [
        0,
        "Enterprise documents are uploaded to [[gcs|Cloud Storage]] buckets by external systems or batch ingest jobs."
      ],
      [
        1,
        "[[pubsub|Cloud Pub/Sub]] receives upload events via Eventarc and broadcasts them to processing pipelines."
      ],
      [
        2,
        "[[cloud-tasks|Cloud Tasks]] buffers execution tasks, enforcing rate limits to prevent overwhelming downstream model quotas."
      ],
      [
        3,
        "Worker microservices running on [[cloud-run|Cloud Run]] pull tasks and execute document processing workflows."
      ],
      [
        4,
        "[[gemini|Gemini 1.5 Flash]] extracts structured entities and summaries, writing output back to destination storage."
      ]
    ],
    "why": [
      "Decoupled event-driven architecture prevents HTTP timeouts on complex multi-minute processing jobs.",
      "Cloud Tasks provides token bucket rate limiting to keep requests strictly within Vertex AI quota limits.",
      "Automatic retry with exponential backoff guarantees that transient model errors do not cause data loss."
    ],
    "fails": [
      "Dead letter queue buildup if documents contain corrupted files or unhandled edge cases.",
      "Duplicate processing if worker idempotency keys are not checked before running expensive LLM calls."
    ],
    "problem": "Synchronous HTTP calls for heavy AI processing fail with 504 Gateway Timeouts and crash downstream services during traffic spikes.",
    "whenNot": "Interactive user-facing applications requiring synchronous real-time responses.",
    "security": "Pub/Sub messages encrypted with CMEK; Cloud Tasks invokes Cloud Run via OIDC service account authentication.",
    "costModel": "Serverless pay-per-event pricing; Cloud Run scales to zero when event queue is empty.",
    "evalMetrics": "Zero lost messages, job processing success rate > 99.8%, average queue dwell time < 15s.",
    "checklist": [
      "Cloud Tasks rate limit calibrated to match Vertex AI QPM quota",
      "Worker idempotency implemented using document hash keys",
      "Dead letter topic and alert configured for failed tasks",
      "Cloud Run maximum instances set to prevent quota exhaustion",
      "Task execution metrics monitored in Cloud Monitoring"
    ]
  },
  {
    "id": "governed-agent-workflow",
    "cat": "production",
    "name": "Governed Agentic Workflow with Cloud Workflows & Audit Logs",
    "short": "Deterministic workflow orchestrator calling AI agents at key decision nodes with immutable Cloud Audit Logs.",
    "when": "Regulatory reporting and compliance processes requiring exact workflow auditability, deterministic step retry logic, and tamper-proof evidence logs.",
    "flow": [
      {
        "s": "agent-studio",
        "l": "Workflow design"
      },
      {
        "s": "workflows",
        "l": "Cloud Workflows"
      },
      {
        "s": "cloud-run",
        "l": "Agent executor"
      },
      {
        "s": "audit-logs",
        "l": "Immutable audit"
      },
      {
        "s": "gemini",
        "l": "Decision model"
      }
    ],
    "steps": [
      [
        0,
        "Business logic and decision trees are authored and maintained in [[agent-studio|Agent Studio]]."
      ],
      [
        1,
        "[[workflows|Cloud Workflows]] executes the state machine, managing step transitions, conditionals, and retry policies."
      ],
      [
        2,
        "Agent reasoning steps invoke specialized containers running on [[cloud-run|Cloud Run]]."
      ],
      [
        3,
        "Every decision rationale, model prompt, and tool payload is written immutably to [[audit-logs|Cloud Audit Logs]]."
      ],
      [
        4,
        "[[gemini|Gemini 1.5 Pro]] evaluates ambiguous inputs and makes calibrated decisions according to strict business guidelines."
      ]
    ],
    "why": [
      "Guarantees that deterministic business rules (compliance checks, mandatory approvals) cannot be bypassed by an autonomous agent.",
      "Cloud Workflows state machine handles long-running pauses, retries, and errors with zero infrastructure overhead.",
      "Immutable audit logging satisfies regulatory compliance audits (SOX, GDPR, FDA 21 CFR Part 11)."
    ],
    "fails": [
      "Workflow stalling if an AI agent returns an unparseable response that does not match expected state machine transitions.",
      "Audit log storage costs growing unexpectedly if full raw context prompts are logged without truncation."
    ],
    "problem": "Purely autonomous agents cannot be deployed in regulated industries because their execution paths are non-deterministic and unverifiable.",
    "whenNot": "Creative brainstorming or open-ended exploratory chat applications.",
    "security": "Cloud Workflows executes with fine-grained IAM service accounts; audit logs locked with Bucket Lock.",
    "costModel": "Fraction of a cent per workflow execution; significantly cheaper than running continuous workflow servers.",
    "evalMetrics": "Deterministic execution compliance 100%, audit trail completeness 100%, workflow failure rate < 0.2%.",
    "checklist": [
      "State machine retry and exception handling validated",
      "Audit log retention policy configured with Bucket Lock",
      "Cloud Run agent outputs validated with strict schemas",
      "Cloud Monitoring alerts on workflow failure active",
      "Human escalation branch tested"
    ]
  },
  {
    "id": "agent-observability-platform",
    "cat": "production",
    "name": "Full-Stack AI Telemetry & Distributed Agent Tracing Pipeline",
    "short": "End-to-end telemetry pipeline capturing agent execution traces, tool call latencies, token consumption, and Groundedness metrics in BigQuery.",
    "when": "Operating production multi-agent systems where debugging non-deterministic errors, tool call loops, and latency spikes requires millisecond-level step traces.",
    "flow": [
      {
        "s": "agent-runtime",
        "l": "Agent runtime"
      },
      {
        "s": "cloud-monitoring",
        "l": "Metrics & SLOs"
      },
      {
        "s": "audit-logs",
        "l": "Log sink"
      },
      {
        "s": "bigquery",
        "l": "Trace warehouse"
      },
      {
        "s": "ces",
        "l": "Analytics UI"
      }
    ],
    "steps": [
      [
        0,
        "Agents executing in [[agent-runtime|Vertex AI Agent Runtime]] emit OpenTelemetry-compatible trace spans for every step."
      ],
      [
        1,
        "[[cloud-monitoring|Cloud Monitoring]] ingests real-time metrics for TTFT, tokens per second, and error rates against SLO targets."
      ],
      [
        2,
        "Raw execution logs, prompt versions, and tool results stream through [[audit-logs|Cloud Audit Logs]] log sinks."
      ],
      [
        3,
        "Telemetry is continuously loaded into [[bigquery]] partitioned tables for deep SQL analytics and regression analysis."
      ],
      [
        4,
        "Production engineering teams inspect agent performance, user satisfaction, and cost trends via [[ces|Customer Engagement Suite]] dashboards."
      ]
    ],
    "why": [
      "Turns opaque AI 'black boxes' into fully transparent, debuggable distributed software systems.",
      "Correlates token spend and latency with specific user tasks, pinpointing inefficient prompts and slow tools.",
      "Enables continuous quality monitoring to catch model drift and prompt regressions before users report them."
    ],
    "fails": [
      "High logging costs if high-volume full-text prompts and completions are exported without sampling.",
      "Latency impact on live inference if telemetry export is performed synchronously rather than asynchronously in background."
    ],
    "problem": "When production AI agents fail or hallucinate, engineers cannot diagnose root causes without detailed step-by-step execution traces.",
    "whenNot": "Prototype scripts or pre-production experimentation environments.",
    "security": "Sensitive data masked in traces using SDP; BigQuery access restricted to authorized SRE teams.",
    "costModel": "Log ingestion and BigQuery storage costs; controlled via 10% trace sampling on successful requests and 100% on errors.",
    "evalMetrics": "Trace ingestion lag < 10s, error trace capture rate 100%, zero PII leakage into trace logs.",
    "checklist": [
      "Trace sampling policy configured (e.g. 100% on errors, 10% on success)",
      "Sensitive Data Protection de-identification rule attached",
      "BigQuery log sink partition expiration set to 90 days",
      "Cloud Monitoring SLO alert rules deployed",
      "SRE runbook for diagnosing trace bottlenecks created"
    ]
  }
];
