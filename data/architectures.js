window.ATLAS.architectures = [
  {
    id: 'rag-assistant', name: 'RAG assistant on the Agent Platform',
    short: 'Ground Gemini in your own documents, with citations, per-user access control and screening.',
    when: 'You need answers grounded in private or fast-changing content, and fine-tuning is the wrong tool. Start here for most enterprise assistants. When questions need several lookups or verification, see [[a:agentic-rag|agentic RAG]]; for relationship questions, [[a:graphrag|GraphRAG]]; to choose, [[d:retrieval-strategy|retrieval strategy]].',
    flow: [
      { l: 'Documents', s: 'gcs' },
      { l: 'Parse + chunk + embed', s: 'rag-engine' },
      { l: 'Vector index', s: 'vector-search' },
      { l: 'User + auth', s: 'identity-platform' },
      { l: 'Prompt screening', s: 'model-armor' },
      { l: 'LLM answer', s: 'gemini' }
    ],
    steps: [
      [0, 'Source documents (manuals, policies, tickets) are stored in [[gcs]]. An upload event or a schedule triggers an import.'],
      [1, '[[rag-engine|RAG Engine]] parses and chunks each document and calls an embedding model for each chunk.'],
      [2, 'Vectors and metadata (tenant, department, document ID) are written to a vector index such as [[vector-search]] (or [[alloydb]] when the data is relational).'],
      [3, 'A user signs in through [[identity-platform]]; their verified group claims travel with each request.'],
      [1, 'The question is embedded and the index is searched, with a **metadata filter** derived from the user\'s claims so they only retrieve documents they may see.'],
      [4, 'The prompt, with the retrieved passages, is screened by [[model-armor|Model Armor]] for injection, sensitive data and unsafe content.'],
      [5, '[[gemini|Gemini]] generates the answer from the retrieved chunks and returns it with citations; the response is screened again on the way out.']
    ],
    why: [
      'Knowledge stays outside the model, so updating a document updates answers without retraining.',
      'Citations make answers verifiable, which builds user trust and eases compliance.',
      'Metadata filtering gives per-user access control without a separate index per user.',
      'Every component is managed, so the team spends its time on quality, not servers.'
    ],
    fails: [
      'Bad chunking or parsing: the right document is indexed but the right passage never surfaces. Measure retrieval recall on a test set.',
      'Stale index: import lag means new policies are not yet searchable.',
      'Access-control leak: a missing filter returns restricted chunks. Test with users from different groups.',
      'Throttling at launch when model quotas were not raised ahead of time, or when pay-as-you-go capacity is contended.'
    ]
  },
  {
    id: 'llm-serving', name: 'Self-hosted LLM serving at scale',
    short: 'Serve an open-weight or tuned model on GPUs or TPUs, with LLM-aware routing and reserved capacity.',
    when: 'You need a specific open model, locality, or unit economics that the managed APIs cannot meet, and you have a team that can own the fleet.',
    flow: [
      { l: 'Clients', s: 'load-balancing' },
      { l: 'Inference Gateway', s: 'gke' },
      { l: 'Model servers (GPU)', s: 'gce' },
      { l: 'Model servers (TPU)', s: 'tpu' },
      { l: 'Weights + cache', s: 'gcs' },
      { l: 'Capacity + scale', s: 'dws' }
    ],
    steps: [
      [0, 'Requests arrive at a [[load-balancing|load balancer]] with TLS, WAF and a backend timeout set long enough for streaming.'],
      [1, 'The [[gke|GKE Inference Gateway]] picks a replica by queue depth, KV-cache use and prefix match, with priorities between models and request classes.'],
      [2, 'GPU model-server pods (vLLM, SGLang, Triton) run on [[gce|GPU nodes]] and stream tokens back.'],
      [3, 'Or the same service runs on [[tpu|TPU]] node pools, using a TPU-capable serving engine, where tokens-per-dollar at steady volume justifies it.'],
      [4, 'Weights load from [[gcs]] (through a cache) when a replica starts, so cold start is a function of the cache, not the bucket.'],
      [5, 'Reserved capacity covers the baseline; [[dws|Dynamic Workload Scheduler]] and Spot cover bursts and batch, and the autoscaler follows queue depth.']
    ],
    why: [
      'Full control over the model, the serving engine and the cost curve.',
      'LLM-aware routing improves latency and throughput over plain round-robin.',
      'GPUs and TPUs can be mixed behind one service as economics change.',
      'Data and prompts stay entirely within your project and perimeter.'
    ],
    fails: [
      'Slow scale-out: a new GPU node plus image pull plus weight load takes many minutes, so a spike hits before capacity arrives. Keep headroom and cache weights.',
      'Capacity not available: quota is granted but no accelerators exist in the zone. Reserve the baseline.',
      'Streaming cut off by a short timeout on some hop in the path.',
      'A bad node stalls a replica and no health check catches it, so tail latency rises silently.'
    ]
  },
  {
    id: 'training-mlops', name: 'Train, evaluate and promote (MLOps)',
    short: 'A repeatable pipeline from data to a monitored production model, with a gate before promotion.',
    when: 'You own a predictive or custom model, retraining is routine, and you need an auditable path from data to production.',
    flow: [
      { l: 'Warehouse data', s: 'bigquery' },
      { l: 'Features', s: 'ap-feature-store' },
      { l: 'Pipeline', s: 'ap-pipelines' },
      { l: 'Training', s: 'ap-training' },
      { l: 'Evaluate + gate', s: 'ap-evals' },
      { l: 'Registry + endpoint', s: 'ap-inference' },
      { l: 'Monitor', s: 'ap-monitoring' }
    ],
    steps: [
      [0, 'Curated tables in [[bigquery]] hold the labelled history, built from raw data by SQL or [[dataflow]].'],
      [1, 'Features are defined once in [[ap-feature-store|Feature Store]] so training and serving use the same definitions.'],
      [2, 'A scheduled or event-triggered [[ap-pipelines|pipeline]] starts a run and records lineage for each artifact.'],
      [3, '[[ap-training|Managed Training]] trains the candidate on the accelerators it requested, checkpointing to [[gcs]].'],
      [4, 'An evaluation step scores the candidate on a held-out set and compares it with the current production model; a condition gates promotion.'],
      [5, 'If it wins, the model is registered and deployed to an [[ap-inference|endpoint]] with a canary traffic split and a one-step rollback.'],
      [6, '[[ap-monitoring|Model Monitoring]] watches skew and drift; a threshold or a schedule triggers the next run.']
    ],
    why: [
      'Retraining becomes routine and auditable instead of a heroic notebook session.',
      'One feature definition for training and serving removes a whole class of silent bugs.',
      'The gate stops a worse model from reaching users.',
      'Lineage answers "which data and code made this model" for audits and incidents.'
    ],
    fails: [
      'Training-serving skew: features are computed differently online and offline. Define them once.',
      'Labels arrive late, so the gate scores against stale truth. Use proxy metrics and track label delay.',
      'Pipeline caching hides a changed upstream table. Disable caching where inputs are not captured.',
      'No owner for drift alerts, so they are ignored until a failure.'
    ]
  },
  {
    id: 'agent-platform', name: 'Tool-using agent platform',
    short: 'An agent that reads, decides and acts through narrow, governed tools, with memory and an audit trail.',
    when: 'The path to the answer varies with what the system finds, and the system must call internal APIs or data. If you can write the steps down, use a workflow instead. For several cooperating agents, see [[a:multi-agent-system|the production multi-agent architecture]]; for governance and release practice, see [[p:agent-governance-guide|governance]] and [[a:agent-cicd|CI/CD]].',
    flow: [
      { l: 'User + auth', s: 'identity-platform' },
      { l: 'API front door', s: 'apigee' },
      { l: 'Agent runtime', s: 'agent-runtime' },
      { l: 'Reasoning model', s: 'gemini' },
      { l: 'Tools (MCP)', s: 'agent-protocols' },
      { l: 'Sessions + memory', s: 'agent-memory' },
      { l: 'Governance', s: 'agent-governance' }
    ],
    steps: [
      [0, 'The user signs in through [[identity-platform]]; a verified identity travels with every request.'],
      [1, 'Requests enter through [[apigee]], which applies authentication, per-user rate and token limits, and screening.'],
      [2, 'The agent, written with [[adk]], runs on [[agent-runtime|Agent Runtime]], which loads the session and scales it.'],
      [5, '[[agent-memory|Sessions and Memory Bank]] restore conversation state and relevant long-term memories.'],
      [3, '[[gemini|Gemini]] reasons over the request and decides which tool to call.'],
      [4, 'Each tool is a narrow function behind an [[agent-protocols|MCP server]], such as "get order status", running with the user\'s authority or the agent\'s least-privilege identity.'],
      [6, '[[agent-governance|Agent Gateway]] enforces which tools the agent may reach and runs [[model-armor|Model Armor]]; every action is logged under the agent\'s identity.'],
      [2, 'For actions that change state, a [[workflows|Workflows]] callback pauses for human approval before the tool runs.']
    ],
    why: [
      'Narrow tools and scoped identities bound the damage when the model is wrong or manipulated.',
      'Managed runtime and memory mean the team writes agent logic, not infrastructure.',
      'A single gateway gives one place for policy, screening and audit.',
      'Approval gates make it safe to start with real actions and earn autonomy later.'
    ],
    fails: [
      'Prompt injection through retrieved text or tool output steers the agent. Treat both as untrusted data and screen them.',
      'Loops burn tokens. Cap steps, tokens and wall-clock time per session.',
      'Vague tool descriptions cause wrong tool choices. Test tool selection on its own.',
      'The agent uses a broad service account, so one error can touch everything. Use per-tool identities.'
    ]
  },
  {
    id: 'document-intelligence', name: 'Intelligent document processing',
    short: 'Turn scans, forms and PDFs into validated, structured records, with confidence-based human review.',
    when: 'You process high volumes of invoices, forms, claims or contracts and need auditable extraction, not a fluent summary.',
    flow: [
      { l: 'Upload', s: 'gcs' },
      { l: 'Event', s: 'eventarc' },
      { l: 'Workflow', s: 'workflows' },
      { l: 'Extract', s: 'document-ai' },
      { l: 'Redact', s: 'sdp' },
      { l: 'Validate', s: 'gemini' },
      { l: 'Store', s: 'bigquery' }
    ],
    steps: [
      [0, 'A document lands in a [[gcs|Cloud Storage]] bucket from users, email ingestion or a partner feed.'],
      [1, '[[eventarc]] turns the object event into a trigger.'],
      [2, '[[workflows]] starts an execution that passes the object reference (not the document) between steps.'],
      [3, '[[document-ai]] runs OCR, layout analysis and extraction, returning fields with confidence and source locations.'],
      [4, '[[sdp|Sensitive Data Protection]] redacts or tokenises personal data before any generative step.'],
      [5, '[[gemini]] maps messy values to your schema and checks business rules, and each value must appear in the source text.'],
      [2, 'Low-confidence or rule-failing documents branch to a human review step, which waits on a callback.'],
      [6, 'Validated records are written to [[bigquery]] (or [[spanner]] for transactional use), with status and the review trail.']
    ],
    why: [
      'A specialist extractor gives confidence scores and locations, which an LLM alone does not.',
      'The LLM is used only for judgement, which keeps cost and risk low.',
      'Workflows retries and human review make the pipeline robust to bad inputs.',
      'Redaction before generation reduces privacy exposure.'
    ],
    fails: [
      'An LLM invents a value that is not in the document. Require each extracted value to be found in the source.',
      'Workflow payload limits exceeded by passing document text. Pass references.',
      'Backfills hit processor quotas. Use a queue and a concurrency limit ([[cloud-tasks]]).',
      'Confidence thresholds set without calibration auto-approve bad extractions.'
    ]
  },
  {
    id: 'realtime-features', name: 'Real-time features and scoring',
    short: 'Stream events into fresh features and score requests in milliseconds, for ranking, fraud and recommendations.',
    when: 'A prediction must use what the user did seconds ago, and latency is measured in tens of milliseconds.',
    flow: [
      { l: 'Events', s: 'pubsub' },
      { l: 'Stream processing', s: 'dataflow' },
      { l: 'Offline store', s: 'bigquery' },
      { l: 'Online store', s: 'ap-feature-store' },
      { l: 'Scoring endpoint', s: 'ap-inference' },
      { l: 'Monitor + feedback', s: 'ap-monitoring' }
    ],
    steps: [
      [0, 'Clicks, transactions and other events are published to [[pubsub]].'],
      [1, '[[dataflow]] windows and aggregates the stream into features (counts, recency, rolling averages).'],
      [2, 'Features and raw events are also written to [[bigquery]], the offline store used to build point-in-time-correct training sets.'],
      [3, 'The latest values are published to the [[ap-feature-store|online store]] for millisecond lookup by entity id.'],
      [4, 'A request calls the [[ap-inference|endpoint]]; the service fetches features, scores the model and returns a result.'],
      [5, 'Requests, predictions and later outcomes are logged, and [[ap-monitoring|monitoring]] compares live inputs with training.']
    ],
    why: [
      'Fresh behaviour improves prediction quality, especially for fraud and ranking.',
      'The same feature definitions serve training and live scoring, preventing skew.',
      'Streaming and serving scale independently.',
      'Logged outcomes become the next training data.'
    ],
    fails: [
      'Late or out-of-order events produce wrong windows. Set allowed lateness deliberately.',
      'A hot entity key overloads one worker or one tablet.',
      'Online store and offline store diverge. Reconcile on a schedule.',
      'Cold start: new users and items have no features. Use metadata and a fallback model.'
    ]
  }
];
