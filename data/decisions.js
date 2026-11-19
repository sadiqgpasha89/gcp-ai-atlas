/* Decision guides for engineering managers and principal engineers in Google Cloud for AI systems.
   Schema per decision:
   id, theme ('strategy'|'architecture'|'risk'), lead ('em'|'pe'|'both'), title, question,
   door ('two-way'|'one-way'|'mixed'), doorNote, why, cols, rows, rules:[[if, then]], redflags:[], ask:[], revisit, related:[service ids],
   em: { call, own:[], evidence:[] }   // the engineering manager lens
   pe: { call, own:[], evidence:[] }   // the principal engineer lens
   Text supports `code`, **bold**, [[service-id|label]]. */
window.ATLAS.decisionThemes = [
  { id: 'strategy', name: 'Strategy & scope', blurb: 'Decide what to build, how autonomous it should be, and how to improve it. These are the decisions that set the budget and the team.' },
  { id: 'architecture', name: 'Architecture', blurb: 'Where models run, how agents are hosted, how retrieval works, and how the system copes with load and capacity.' },
  { id: 'risk', name: 'Risk, quality & cost', blurb: 'How you will know it works, how much you trust it to act, what it costs to run, and how tenants stay apart.' }
];

window.ATLAS.decisions = [
  {
    "id": "build-buy-customize",
    "theme": "strategy",
    "title": "Build, buy or customise?",
    "question": "How much of this should we build ourselves, and how much should we adopt?",
    "door": "mixed",
    "doorNote": "Two-way at the start. It becomes one-way once your data, workflows and people depend on the choice.",
    "why": "Every AI feature has a build cost and a run cost, and the second is the one teams under-estimate. The wrong level of build also locks in headcount: a self-managed accelerator stack needs people on call for it.\n\nGoogle Cloud spans the whole range, from a finished employee product to bare TPUs, so the question is less \"can we\" and more \"which rung should we stand on\".",
    "cols": [
      "Path",
      "First value in",
      "You own",
      "Fits when",
      "Main risk"
    ],
    "rows": [
      [
        "Adopt a finished product ([[gemini-enterprise|Gemini Enterprise]], [[ces|Customer Engagement Suite]])",
        "Days",
        "Configuration, connectors and data hygiene",
        "Commodity needs: employee search, research, contact-centre bots",
        "Capability ceiling; per-seat cost; limited customisation"
      ],
      [
        "Managed blocks ([[gemini]] + [[rag-engine|RAG Engine]] or [[ai-search|AI Search]] + [[agent-studio|Agent Studio]])",
        "Weeks",
        "Prompts, data, evals, application glue",
        "A differentiated feature built on standard patterns",
        "Quotas and the limits of the abstraction"
      ],
      [
        "Code-first on a managed runtime ([[adk]] + [[agent-runtime|Agent Runtime]])",
        "Weeks to a few months",
        "Agent logic, tools, memory strategy",
        "Bespoke control flow, multi-agent designs, any model",
        "You own agent quality and its operations"
      ],
      [
        "Managed ML platform ([[ap-training|Managed Training]], [[ap-pipelines|Pipelines]], [[ap-inference|endpoints]])",
        "Months",
        "Models, features, pipelines, monitoring",
        "Proprietary data is the advantage; predictive models",
        "MLOps burden; scarce specialist talent"
      ],
      [
        "Self-managed on [[gke|GKE]] with [[gce|GPUs]] or [[tpu|TPUs]]",
        "Months or more",
        "Everything, including accelerator capacity",
        "Extreme scale or cost pressure, strict locality, custom serving",
        "Operations load; capacity supply risk"
      ]
    ],
    "rules": [
      [
        "The capability is not a differentiator for us",
        "Buy. Put the effort into rollout and data quality."
      ],
      [
        "It is differentiating and a standard pattern (RAG, tool use) covers it",
        "Managed blocks. Spend your time on evals and domain data."
      ],
      [
        "The control flow is bespoke, or you need a model outside the Gemini family",
        "Code-first on a managed runtime. [[model-garden|Model Garden]] gives partner and open models in the same boundary."
      ],
      [
        "You have a proven data advantage and a trained model beats prompting on your evals",
        "Own the model on the ML platform. Not before."
      ],
      [
        "You need locality, unit cost or latency that managed services cannot meet",
        "Self-managed, with a named owner for accelerator capacity."
      ]
    ],
    "redflags": [
      "Fine-tuning is proposed before anyone has measured a prompt-plus-retrieval baseline.",
      "A \"platform\" is being built before the first use case is in production.",
      "The build-or-buy case rests on demo quality rather than on an eval set.",
      "Run cost and on-call burden are missing from the comparison.",
      "There is no exit path if the model or vendor changes in twelve months."
    ],
    "ask": [
      "Which part of this is our differentiator, and which part is plumbing?",
      "What does it cost per task at the volume we expect in a year, and who pays for it?",
      "Who is on call for it, and what do they do at 3 a.m.?",
      "If we had to swap the model next year, what would break?"
    ],
    "revisit": "Each quarter, when volume grows tenfold, or when a managed option adds the capability you built. Google has renamed and merged products fast (Vertex AI to the Agent Platform, Agentspace into Gemini Enterprise), so re-check what \"managed\" now includes.",
    "related": [
      "gemini-enterprise",
      "gemini",
      "adk",
      "agent-runtime",
      "ap-training"
    ],
    "lead": "em",
    "em": {
      "call": "Default to the highest managed level that passes the eval. Fund a build only for a named differentiator.",
      "own": [
        "Headcount and on-call load the chosen path implies.",
        "The run-cost budget and who pays for it.",
        "The exit plan if a vendor or model changes."
      ],
      "evidence": [
        "A one-page comparison that includes run cost and operations, not just build time.",
        "A baseline eval score for the simplest managed option.",
        "A named owner for quality, for cost and for on-call."
      ]
    },
    "pe": {
      "call": "Prove the managed baseline first, then spend engineering effort only where the eval shows a gap.",
      "own": [
        "The seams: keep model, retrieval and tools behind interfaces so any layer can be swapped.",
        "The technical argument for any step down to a lower, more manual level."
      ],
      "evidence": [
        "Prompt-plus-retrieval baseline results on the real eval set.",
        "The interface boundary that makes model and vendor swap a configuration change."
      ]
    }
  },
  {
    "id": "autonomy-level",
    "theme": "strategy",
    "title": "How autonomous should it be?",
    "question": "Is this a single model call, a fixed workflow, or an agent that decides its own steps?",
    "door": "two-way",
    "doorNote": "Easy to move up a level later if tools sit behind clean interfaces. Hard to move down once users expect autonomy.",
    "why": "Autonomy multiplies cost, latency and the ways things go wrong. Most business problems have a known path, and a workflow with LLM steps is cheaper, faster and easier to test than an agent that rediscovers the path every time.",
    "cols": [
      "Level",
      "Pattern",
      "Predictability",
      "Google Cloud building blocks",
      "Cost of a failure"
    ],
    "rows": [
      [
        "0. Single call",
        "One prompt in, one answer out (classify, summarise, extract)",
        "High",
        "[[gemini]], [[cloud-run]]",
        "Low: a wrong answer"
      ],
      [
        "1. Grounded answer",
        "Retrieve, then generate (RAG)",
        "High",
        "[[rag-engine|RAG Engine]], [[vector-search]]",
        "Low to medium: a confident wrong answer"
      ],
      [
        "2. Workflow with LLM steps",
        "A fixed path where models handle individual steps",
        "High",
        "[[workflows]], [[cloud-run]], [[gemini]], ADK workflow agents",
        "Medium: bounded by the path"
      ],
      [
        "3. Agent, human approves writes",
        "Model chooses tools; a person approves anything that changes state",
        "Medium",
        "[[adk]] on [[agent-runtime]], approval callbacks in [[workflows]]",
        "Medium: caught at approval"
      ],
      [
        "4. Agent acts within limits",
        "Autonomous with scoped identities, spend caps, reversible actions",
        "Lower",
        "[[agent-governance|Agent Identity and Gateway]], [[iam]], [[billing|budgets]]",
        "High: acts before anyone looks"
      ],
      [
        "5. Multi-agent, autonomous",
        "Several agents delegating to each other",
        "Lowest",
        "[[adk]] sub-agents, A2A ([[agent-protocols]]), a supervisor pattern",
        "Highest: errors compound across agents"
      ]
    ],
    "rules": [
      [
        "You can write the steps down",
        "Use a workflow (level 2). It is cheaper and testable."
      ],
      [
        "The path depends on what the model finds along the way",
        "Use an agent, and start at level 3."
      ],
      [
        "Any action changes money, data or access",
        "Keep a human approval until measured error rates earn autonomy."
      ],
      [
        "One agent with more tools would do",
        "Do not use multiple agents. Add them only for separate trust boundaries or clearly separate skills."
      ]
    ],
    "redflags": [
      "The word \"agent\" is in the title and nobody can describe a task whose steps vary.",
      "Agents call other agents with no limit on depth or total tokens.",
      "Tools are broad (\"run any SQL\") rather than narrow (\"get order status\").",
      "Autonomy is promised on a date, not earned by measured accuracy."
    ],
    "ask": [
      "Can you draw the steps? If yes, why is this not a workflow?",
      "What is the worst thing the agent can do with its permissions today?",
      "What is the agent's measured success rate on the eval set, and what is the target before we remove approvals?",
      "What stops a loop from burning tokens all night?"
    ],
    "revisit": "When the eval set shows consistently high accuracy for a class of action, consider removing approval for that class only.",
    "related": [
      "adk",
      "agent-runtime",
      "workflows",
      "agent-governance",
      "iam"
    ],
    "lead": "both",
    "em": {
      "call": "Approve the lowest level that solves the problem. Raise it one step at a time, backed by eval numbers.",
      "own": [
        "The risk appetite: which actions may ever be automatic.",
        "The stop rule: what quality drop makes us step autonomy back down."
      ],
      "evidence": [
        "A written worst-case action and its control.",
        "Measured action accuracy before any approval is removed."
      ]
    },
    "pe": {
      "call": "Put deterministic structure around the model. Let the model decide only what code cannot.",
      "own": [
        "Tool design: narrow, typed, validated server-side, least privilege.",
        "Caps on steps, tokens and time, and the loop-detection logic."
      ],
      "evidence": [
        "Tool-selection accuracy measured separately from answer quality.",
        "Injection tests through retrieved text and tool output."
      ]
    }
  },
  {
    "id": "improve-model",
    "theme": "strategy",
    "title": "How do we make it better at our task?",
    "question": "Prompt, retrieve, fine-tune, or pre-train? In what order?",
    "door": "two-way",
    "doorNote": "Prompting and retrieval are cheap to change. Fine-tuning creates a data pipeline and a model you must maintain.",
    "why": "Teams jump to fine-tuning because it feels like real engineering. Usually the gain is in the prompt, the retrieval, or the data, and each step down this list costs far more than the one above it.",
    "cols": [
      "Approach",
      "What changes",
      "Good for",
      "Cost and effort",
      "Maintenance"
    ],
    "rows": [
      [
        "Prompt engineering and few-shot examples",
        "Instructions and examples",
        "Format, tone, simple tasks",
        "Minutes; no cost beyond tokens",
        "Re-test when the model version changes"
      ],
      [
        "Retrieval ([[rag-engine|RAG Engine]], [[ai-search|AI Search]])",
        "What the model can see at question time",
        "Private, current or large knowledge",
        "Days; ongoing retrieval cost",
        "Keep the index fresh; tune chunking"
      ],
      [
        "Supervised tuning of [[gemini|Gemini]] ([[ap-tuning|Model Tuning]])",
        "Model behaviour, managed",
        "Style, format, narrow tasks with labelled data",
        "Days; a few hundred clean examples",
        "Re-tune when the base model is retired"
      ],
      [
        "Fine-tune an open model ([[ap-tuning|tuning]], [[ap-training|Managed Training]])",
        "Weights of an open model, full control",
        "Specialised domains, a smaller and cheaper model",
        "Weeks; GPU or TPU training plus hosting",
        "You run training, serving and upgrades"
      ],
      [
        "Continued pre-training",
        "Broad knowledge and language of the model",
        "A new language or a very large proprietary corpus",
        "Months; large accelerator runs ([[tpu]], [[dws]])",
        "You own a foundation model lifecycle"
      ]
    ],
    "rules": [
      [
        "Output is the wrong shape or tone",
        "Fix the prompt, add examples, use structured output. Measure."
      ],
      [
        "The model lacks facts it needs, or the facts change",
        "Retrieval. Fine-tuning is a poor way to teach changing facts."
      ],
      [
        "A strong prompt plus retrieval still misses the bar and you have hundreds of clean labelled examples",
        "Supervised tuning, compared against the best prompt baseline."
      ],
      [
        "A big model works but is too slow or costly for your volume",
        "Tune a smaller model on the big model's outputs, or route easy cases to a cheaper tier."
      ]
    ],
    "redflags": [
      "No baseline score exists for the prompt-only approach.",
      "The training set was written quickly by one person and has inconsistent labels.",
      "Nobody has budgeted for re-tuning when the base model retires.",
      "Fine-tuning is proposed to fix hallucinations on facts that live in a database."
    ],
    "ask": [
      "What is the score of prompt-plus-retrieval on our eval set, and what is the gap to the target?",
      "Where do the training examples come from, and how were they checked?",
      "What happens when the base model is retired?",
      "Would a cheaper model with a better prompt close the gap?"
    ],
    "revisit": "When the base model version changes, when the eval gap changes, or when the cost per task moves materially.",
    "related": [
      "gemini",
      "rag-engine",
      "ap-tuning",
      "ap-training",
      "ap-evals"
    ],
    "lead": "pe",
    "em": {
      "call": "Do not fund fine-tuning without an error analysis and a written maintenance owner.",
      "own": [
        "Whether the cost of maintaining a custom model is justified by the measured gain.",
        "Staffing for dataset curation if tuning is approved."
      ],
      "evidence": [
        "The failure taxonomy with counts.",
        "A baseline-versus-candidate comparison on the same eval set."
      ]
    },
    "pe": {
      "call": "Work the cheap levers in order: instructions, retrieval, model, workflow, then weights.",
      "own": [
        "The error analysis and the eval set that decide the lever.",
        "The retest plan across base-model upgrades and retirements."
      ],
      "evidence": [
        "Retrieval recall at k measured separately from answer quality.",
        "Per-lever deltas on a held-out set, not a demo."
      ]
    }
  },
  {
    "id": "where-model-runs",
    "theme": "architecture",
    "title": "Where should the model run?",
    "question": "Managed API, reserved capacity, a model deployed to our own endpoint, or our own fleet?",
    "door": "mixed",
    "doorNote": "Cheap to switch between managed options behind one interface. Costly once you operate accelerators.",
    "why": "This choice sets your unit cost curve, your latency floor, your data boundary and your on-call load. Managed APIs are cheapest to start and hardest to control; your own fleet is the reverse.",
    "cols": [
      "Option",
      "Control",
      "Ops burden",
      "Fits when",
      "Watch out for"
    ],
    "rows": [
      [
        "[[gemini|Gemini]] pay-as-you-go (shared capacity)",
        "Low",
        "None",
        "Most workloads, spiky or unknown volume",
        "429s under contention; model retirement schedule"
      ],
      [
        "Gemini with Provisioned Throughput",
        "Medium",
        "Low",
        "Steady, latency-sensitive production load",
        "Paying for capacity you do not use; unit sizing"
      ],
      [
        "Partner or open models as managed APIs ([[model-garden|Model Garden]])",
        "Medium",
        "Low",
        "You need a specific non-Gemini model or a second source",
        "Separate quotas, terms and regions per model"
      ],
      [
        "Open model on a managed endpoint ([[ap-inference|endpoints]])",
        "High",
        "Medium",
        "Custom or tuned weights, dedicated capacity, VPC-only access",
        "Endpoints bill all day; scale-out is slow for big models"
      ],
      [
        "Self-managed on [[gke|GKE]] with [[gce|GPUs]] or [[tpu|TPUs]]",
        "Highest",
        "High",
        "Extreme scale, special serving needs, strict locality",
        "Accelerator supply, engineering time and on-call"
      ],
      [
        "Gemini on Google Distributed Cloud",
        "High",
        "High",
        "Air-gapped or on-premises requirements",
        "Hardware lead time; capability lag against the cloud service"
      ]
    ],
    "rules": [
      [
        "You are starting out or volume is unknown",
        "Pay-as-you-go Gemini behind a thin interface you own."
      ],
      [
        "Load is steady and latency matters",
        "Add Provisioned Throughput for the baseline, pay-as-you-go for bursts."
      ],
      [
        "You need weights you control or a model Google does not offer as a service",
        "Managed endpoint first; own fleet only when the numbers demand it."
      ],
      [
        "A legal requirement forbids the managed path",
        "Choose the smallest self-run option that satisfies it, and document the requirement."
      ]
    ],
    "redflags": [
      "Self-hosting is proposed to save money, with no model of utilisation or staffing cost.",
      "The application calls a model SDK directly in a hundred places, so switching is a rewrite.",
      "No fallback exists if the chosen model or region is unavailable.",
      "A managed endpoint was deployed for an experiment and nobody owns its cost."
    ],
    "ask": [
      "What is the cost per million tokens at our utilisation, all-in, including people?",
      "What is the fallback when this model or region is down?",
      "How long does it take to switch models, and have we tried?",
      "Which data leaves our boundary on each path?"
    ],
    "revisit": "When volume or latency needs change by a factor of three, when a new model tier appears, or when a legal constraint changes.",
    "related": [
      "gemini",
      "model-garden",
      "ap-inference",
      "gke",
      "tpu"
    ],
    "lead": "pe",
    "em": {
      "call": "Approve self-hosting only with a named capacity owner and a measured cost case against provisioned throughput.",
      "own": [
        "The cost and on-call implications of each hosting option.",
        "Sign-off with compliance on residency before launch."
      ],
      "evidence": [
        "A volume forecast with a pay-per-token versus provisioned throughput comparison.",
        "Compliance sign-off naming the deployment type."
      ]
    },
    "pe": {
      "call": "Start on Gemini Pay-As-You-Go behind a gateway. Move to Provisioned Throughput or self-hosted only on evidence.",
      "own": [
        "The traffic profile and the sizing method for provisioned capacity.",
        "The abstraction that lets a model move between deployments without code changes."
      ],
      "evidence": [
        "Load-test results including time to first token and tail latency.",
        "A failover test to a second Region or deployment."
      ]
    }
  },
  {
    "id": "agent-runtime",
    "theme": "architecture",
    "title": "How do we host the agent?",
    "question": "Visual builder, managed agent runtime, serverless containers, or Kubernetes?",
    "door": "two-way",
    "doorNote": "Agent logic written against ADK and standard protocols moves between hosts with modest effort. Platform-specific builders move less easily.",
    "why": "The host sets who runs the loop, where state lives, how it scales, and how you debug a failure at 3 a.m. Choose the most managed option that lets you control what you actually need to control.",
    "cols": [
      "Option",
      "You control",
      "You operate",
      "Fits when",
      "Watch out for"
    ],
    "rows": [
      [
        "[[agent-studio|Agent Studio]] / Gemini Enterprise Agent Designer",
        "Prompts, tools, data",
        "Nothing",
        "Prototypes, business-built agents, read-only tasks",
        "Hard to review and test; ceiling on custom flow"
      ],
      [
        "[[agent-runtime|Agent Runtime]] with [[adk]] (or LangGraph and others)",
        "All agent code and tools",
        "Little: you ship code, Google runs it",
        "Most production agents; long-running work; sessions and memory",
        "Billing for resident compute; governance is opt-in"
      ],
      [
        "[[cloud-run|Cloud Run]] container",
        "Everything in the container",
        "The service and its state stores",
        "You need custom frameworks or tight latency control",
        "Timeouts, scale-from-zero, state you must build"
      ],
      [
        "[[gke|GKE]]",
        "Everything, including the network",
        "The cluster and the agents",
        "Many agents beside self-hosted models; strict network control",
        "Platform effort; slow to change"
      ],
      [
        "[[ces|Customer Engagement Suite]] conversational agents",
        "Flows and playbooks",
        "Nothing",
        "Contact-centre agents with telephony and handoff",
        "Less flexible for non-service use cases"
      ]
    ],
    "rules": [
      [
        "It is a prototype or a low-risk internal helper",
        "Agent Studio or Agent Designer. Move to code when it needs tests."
      ],
      [
        "It is a production agent and you want less to operate",
        "Agent Runtime with ADK."
      ],
      [
        "It must live beside your own models or services, or needs unusual frameworks",
        "Cloud Run, or GKE when you already run it."
      ],
      [
        "It is customer service on voice or chat",
        "Evaluate Customer Engagement Suite before building."
      ]
    ],
    "redflags": [
      "Business logic lives only in a visual builder with no version control.",
      "Long-running agents sit idle on always-on compute with no scaling bounds.",
      "The agent runs under a broad shared service account.",
      "Nobody can replay a failed run step by step."
    ],
    "ask": [
      "Where is the canonical definition of this agent, and is it in version control?",
      "How do we trace a single run through every model and tool call?",
      "Whose identity does each tool call run under?",
      "What does it cost while idle?"
    ],
    "revisit": "When the agent graduates from prototype, when volume changes, or when the platform adds or retires a hosting option.",
    "related": [
      "agent-studio",
      "agent-runtime",
      "adk",
      "cloud-run",
      "gke"
    ],
    "lead": "pe",
    "em": {
      "call": "Pick the managed runtime that gives a trace per run and user-level identity. Add control only when forced.",
      "own": [
        "Who operates the runtime and its on-call.",
        "The decision about when a business-built agent must move to code."
      ],
      "evidence": [
        "A demo of tracing a failed run end to end.",
        "A named owner for the runtime."
      ]
    },
    "pe": {
      "call": "Keep tools behind stable interfaces (Cloud Run functions or MCP) so the runtime is replaceable.",
      "own": [
        "State, memory and identity design.",
        "The tool contract: schemas, validation, idempotency and error shapes."
      ],
      "evidence": [
        "A spike hosting the same agent on two runtimes.",
        "Replayable traces and a loop-cap test."
      ]
    }
  },
  {
    "id": "vector-store",
    "theme": "architecture",
    "title": "Which vector store?",
    "question": "Where do embeddings live, and what runs the nearest-neighbour search?",
    "door": "two-way",
    "doorNote": "Moving embeddings is a re-index, not a rewrite, if retrieval sits behind an interface. Running one more database is the real commitment.",
    "why": "Retrieval quality and access control, not raw speed, decide most RAG outcomes. The store matters mainly for scale, filtering, freshness and operations.",
    "cols": [
      "Option",
      "Scale",
      "Filtering and joins",
      "Operations",
      "Fits when"
    ],
    "rows": [
      [
        "[[rag-engine|RAG Engine]] managed default",
        "Small to medium",
        "Metadata filters",
        "None",
        "A first assistant, a baseline, a small team"
      ],
      [
        "[[vector-search|Vector Search]]",
        "Very large, high QPS",
        "Metadata restricts, hybrid search",
        "Low: deployed index nodes",
        "Dedicated retrieval tier with strict latency"
      ],
      [
        "[[alloydb|AlloyDB]] (pgvector, ScaNN)",
        "Large (billions with ScaNN)",
        "Full SQL joins and filters",
        "Medium: a database",
        "Operational data already in Postgres"
      ],
      [
        "[[cloud-sql|Cloud SQL]] (pgvector)",
        "Small to mid",
        "Full SQL",
        "Low",
        "Pilots and mid-size apps already on Cloud SQL"
      ],
      [
        "[[spanner|Spanner]] or [[firestore|Firestore]] vector search",
        "Mid",
        "Transactional with the row, or document filters",
        "Low",
        "Vectors that must stay consistent with global or document data"
      ],
      [
        "[[bigquery-ai|BigQuery vector search]]",
        "Very large, batch-oriented",
        "SQL",
        "None",
        "Analytical retrieval, offline matching, not low-latency serving"
      ]
    ],
    "rules": [
      [
        "You are starting",
        "RAG Engine default, or the Postgres you already run."
      ],
      [
        "Your source data is relational and permissions are in SQL",
        "AlloyDB or Cloud SQL, filtering in the same query."
      ],
      [
        "You need a large dedicated tier with high QPS",
        "Vector Search."
      ],
      [
        "The use is analytical and latency is not critical",
        "BigQuery vector search."
      ]
    ],
    "redflags": [
      "A separate vector database is proposed with no recall measurement showing the current one is insufficient.",
      "Per-user access control is applied after retrieval, in the prompt, instead of in the query.",
      "The embedding model name is not stored with the vectors.",
      "No plan exists for deleting a document from the index and its caches."
    ],
    "ask": [
      "What recall at k do we measure today, and on what test set?",
      "How do filters interact with the approximate index at our selectivity?",
      "How do we re-index if we change the embedding model?",
      "How does a deletion request reach the index, the caches and the logs?"
    ],
    "revisit": "When data size grows tenfold, when filtering becomes more selective, or when the embedding model changes. Choosing between vector, hybrid, agentic and graph retrieval is a separate decision: [[d:retrieval-strategy|which retrieval strategy]].",
    "related": [
      "rag-engine",
      "vector-search",
      "alloydb",
      "cloud-sql",
      "spanner"
    ],
    "lead": "pe",
    "em": {
      "call": "Do not add a new data store for a pilot. Reuse what the team operates, and fund the eval for retrieval.",
      "own": [
        "Whether a new store means a new on-call duty.",
        "Who owns the content pipeline and its freshness."
      ],
      "evidence": [
        "Retrieval recall numbers on real questions.",
        "A named owner for ingestion quality."
      ]
    },
    "pe": {
      "call": "Choose by filtering and ranking needs, not by vector benchmarks. Test with your real filters.",
      "own": [
        "Chunking, embedding model, index schema and security-trimming design.",
        "The reindex and rollback procedure."
      ],
      "evidence": [
        "Recall at k with the real access filters applied.",
        "Cross-user access tests that fail on a missing filter."
      ]
    }
  },
  {
    "id": "inference-pattern",
    "theme": "architecture",
    "title": "Synchronous, streaming, asynchronous or batch?",
    "question": "How does a request travel, and how long is anyone waiting?",
    "door": "mixed",
    "doorNote": "Changing the pattern changes the API contract, the UI and the failure handling. Pick early.",
    "why": "The pattern fixes your timeouts, your retry rules, your cost per token (batch is much cheaper) and your user experience.",
    "cols": [
      "Pattern",
      "User waits",
      "Typical building blocks",
      "Cost",
      "Failure handling"
    ],
    "rows": [
      [
        "Synchronous request and response",
        "A second or two",
        "[[cloud-run]], [[gemini]]",
        "Standard",
        "Timeouts and fallback answers"
      ],
      [
        "Streaming chat",
        "First tokens fast, a few seconds total",
        "[[load-balancing]] with long timeouts, SSE or WebSocket from [[cloud-run]]",
        "Standard",
        "Reconnect, partial answers, buffering bugs"
      ],
      [
        "Live voice and video",
        "Real time",
        "Gemini Live API, [[speech-to-text]], [[text-to-speech]]",
        "Higher",
        "Interruptions, latency spikes, device and network variance"
      ],
      [
        "Asynchronous job",
        "Minutes",
        "[[pubsub]] or [[cloud-tasks]], a worker on [[cloud-run]], a result store",
        "Standard",
        "Retries, idempotency, status polling"
      ],
      [
        "Batch",
        "Hours",
        "Gemini batch, [[bigquery-ai]], [[ap-inference|batch inference]], [[batch]]",
        "Lowest",
        "Late failures, partial results, re-runs"
      ]
    ],
    "rules": [
      [
        "A person is typing and watching",
        "Streaming, with a short time to first token."
      ],
      [
        "The task takes longer than a request timeout",
        "Asynchronous with a status endpoint and a result store."
      ],
      [
        "Nobody is waiting and volume is large",
        "Batch. It is the cheapest pattern."
      ],
      [
        "It is a voice conversation",
        "Evaluate the Live API; every added hop is audible."
      ]
    ],
    "redflags": [
      "A long agent run is held open inside one HTTP request.",
      "Retries are added at several layers without backoff or idempotency.",
      "Streaming was tested directly against the app but not through the real load balancer path.",
      "A batch-suitable job runs on the interactive path at full price."
    ],
    "ask": [
      "Which timeout is the smallest on the full request path, and who set it?",
      "What does the user see when the model is slow or down?",
      "Is every retried operation idempotent?",
      "Which workloads could move to batch?"
    ],
    "revisit": "When latency requirements change, when usage shifts from chat to long-running tasks, or when batch-eligible work appears.",
    "related": [
      "cloud-run",
      "pubsub",
      "cloud-tasks",
      "load-balancing",
      "gemini"
    ],
    "lead": "pe",
    "em": {
      "call": "Insist on a defined user experience for waiting and failure before build. It is a product decision as much as an engineering one.",
      "own": [
        "Agreeing the acceptable latency and failure experience with product.",
        "Prioritising batch for non-urgent work to save cost."
      ],
      "evidence": [
        "A latency budget by hop.",
        "A written failure experience per error type."
      ]
    },
    "pe": {
      "call": "Pick the pattern from the slowest realistic request. Make every step idempotent and every hop timeout explicit.",
      "own": [
        "The end-to-end timeout and buffering map.",
        "Retry, idempotency and dead-letter design."
      ],
      "evidence": [
        "Load tests with slow requests and long streams.",
        "A chaos test that kills a worker mid-job."
      ]
    }
  },
  {
    "id": "capacity-strategy",
    "theme": "architecture",
    "title": "How do we secure capacity and throughput?",
    "question": "Will the model calls and accelerators be there when we need them?",
    "door": "two-way",
    "doorNote": "Commitments are one-way for their term. Everything else can be adjusted.",
    "why": "Quota, capacity and money are three different things. Launch-day throttling is the most common surprise in AI systems, and accelerator shortages are not solved by paying more.",
    "cols": [
      "Lever",
      "What it gives",
      "Commitment",
      "Fits when",
      "Limit"
    ],
    "rows": [
      [
        "Quota increase ([[quotas]])",
        "Permission to use more",
        "None",
        "Always, ahead of launch",
        "Not a guarantee that capacity exists"
      ],
      [
        "Dynamic shared quota (default Gemini)",
        "Shared pool with no fixed cap",
        "None",
        "Spiky or experimental load",
        "Can return 429 under contention"
      ],
      [
        "Provisioned Throughput",
        "Reserved model capacity",
        "A term",
        "Steady, latency-sensitive production",
        "Idle cost; unit sizing"
      ],
      [
        "Second model or region fallback",
        "Resilience",
        "Engineering effort",
        "Anything business critical",
        "Quality differences; residency rules"
      ],
      [
        "Accelerator reservations and [[dws|Dynamic Workload Scheduler]]",
        "GPUs and TPUs when needed",
        "A block or a queue",
        "Training and self-hosted serving",
        "Flex start has no deadline guarantee"
      ],
      [
        "Spot VMs and flex-start",
        "Cheap, interruptible capacity",
        "None",
        "Fault-tolerant batch and checkpointed jobs",
        "Preemption"
      ]
    ],
    "rules": [
      [
        "Launching a user-facing feature",
        "Raise quotas for peak in every region and load test, weeks ahead."
      ],
      [
        "The feature is critical and steady",
        "Provisioned Throughput for the baseline plus a tested fallback model."
      ],
      [
        "Training on scarce accelerators",
        "Reservation or calendar mode for deadlines; flex-start where waiting is fine."
      ],
      [
        "Work can be interrupted",
        "Spot with checkpoints."
      ]
    ],
    "redflags": [
      "No load test has run at expected peak with realistic prompts.",
      "Retries have no backoff, so throttling becomes an outage.",
      "The fallback model has never been run against the evals.",
      "A reservation was bought before the job was designed to use it fully."
    ],
    "ask": [
      "What are our quotas per region, and what is our peak?",
      "What happens at the first 429, step by step?",
      "Which GPUs or TPUs do we depend on, and how do we get them next month?",
      "When did we last test the fallback?"
    ],
    "revisit": "Before each launch, each quarter, and whenever a model or accelerator generation changes.",
    "related": [
      "quotas",
      "gemini",
      "dws",
      "gce",
      "tpu"
    ],
    "lead": "both",
    "em": {
      "call": "Treat quota and capacity as a launch gate with an owner and a date, not as a task for launch week.",
      "own": [
        "The lead time in the plan and the person chasing it.",
        "The business decision on reserved capacity versus pay-as-you-go."
      ],
      "evidence": [
        "Quota held versus peak forecast, per Region.",
        "A tested fallback path."
      ]
    },
    "pe": {
      "call": "Design for throttling: gateway, backoff, spillover and a degraded mode. Assume quota will be short at some point.",
      "own": [
        "Retry policy, concurrency limits and circuit-breaker settings.",
        "The fallback hierarchy and its evals."
      ],
      "evidence": [
        "Load test that deliberately exceeds quota.",
        "Failover drill results across Google Cloud Regions."
      ]
    }
  },
  {
    "id": "orchestration",
    "theme": "architecture",
    "title": "How do we orchestrate the work?",
    "question": "Which service coordinates multi-step flows, schedules and retries?",
    "door": "two-way",
    "doorNote": "Steps are usually small services, so the orchestrator can be replaced with effort rather than a rewrite.",
    "why": "Orchestration is where retries, state, approvals and visibility live. The wrong choice makes simple flows heavy, or makes complex ones unobservable.",
    "cols": [
      "Option",
      "Model",
      "Best for",
      "Limits",
      "Human steps"
    ],
    "rows": [
      [
        "[[workflows|Workflows]]",
        "Serverless steps in YAML",
        "API-driven flows, approvals, glue between services",
        "Payload size; not for heavy compute",
        "Callbacks, cheap waiting"
      ],
      [
        "[[composer|Cloud Composer]] (Airflow)",
        "DAGs on a schedule",
        "Dependency-heavy data and ML schedules, backfills",
        "Always-on environment; heavy for event flows",
        "Sensors and manual triggers"
      ],
      [
        "[[ap-pipelines|Pipelines]]",
        "ML DAGs with lineage and caching",
        "Train, evaluate, register, deploy",
        "ML-shaped; not general orchestration",
        "Conditions and approval steps"
      ],
      [
        "Event choreography ([[eventarc]] + [[pubsub]])",
        "Services react to events",
        "Loose coupling, fan-out",
        "Hard to see the whole flow",
        "Needs an explicit approval service"
      ],
      [
        "Agent orchestration (ADK workflow agents)",
        "Sequential, parallel, loop agents",
        "LLM steps whose order may vary",
        "Harder to test than fixed flows",
        "Tool-level approvals"
      ],
      [
        "[[batch|Batch]]",
        "Job-level scheduler",
        "Large run-to-completion compute",
        "Not an orchestrator of services",
        "None"
      ]
    ],
    "rules": [
      [
        "The flow calls APIs and might wait for a person",
        "Workflows."
      ],
      [
        "It is a scheduled data or ML process with many dependencies",
        "Composer, or Pipelines for pure ML."
      ],
      [
        "Services should be independent and react to events",
        "Eventarc and Pub/Sub, with a dead-letter topic and idempotent handlers."
      ],
      [
        "Order depends on what an LLM finds",
        "ADK agents, with hard limits."
      ]
    ],
    "redflags": [
      "Heavy data transformation is done inside the orchestrator.",
      "Workflow payloads carry documents instead of references.",
      "No one can see, in one place, where an instance of the process stands.",
      "Retried steps are not idempotent."
    ],
    "ask": [
      "Where do I look to see what state this process is in?",
      "What happens on a repeated step or a repeated event?",
      "Who approves, and what happens if they never respond?",
      "What are the payload, step and duration limits?"
    ],
    "revisit": "When the flow gains a human step, when volume grows tenfold, or when two orchestrators start overlapping.",
    "related": [
      "workflows",
      "composer",
      "ap-pipelines",
      "eventarc",
      "pubsub"
    ],
    "lead": "pe",
    "em": {
      "call": "Match the engine to who will maintain it, not to who builds it first.",
      "own": [
        "The maintenance model: who changes the workflow in a year.",
        "Avoiding a third and fourth engine."
      ],
      "evidence": [
        "A named maintainer who can work in the chosen tool.",
        "An engine ownership rule written down."
      ]
    },
    "pe": {
      "call": "Keep step logic in plain, testable code and keep the engine thin.",
      "own": [
        "Idempotency, retry and compensation rules.",
        "Workflow versioning and the run-history retention."
      ],
      "evidence": [
        "Replay and failure tests.",
        "A versioning drill with running instances."
      ]
    }
  },
  {
    "id": "training-compute",
    "theme": "architecture",
    "title": "Where do we train?",
    "question": "Which service runs training, and on what accelerators?",
    "door": "mixed",
    "doorNote": "Code that targets a framework moves between GPUs and TPUs with work. The investment in a specific stack is the real lock-in.",
    "why": "Training consumes the scarcest and most expensive resources you have. The choice affects obtainability, cost, recovery from failure and how many people it takes.",
    "cols": [
      "Option",
      "You manage",
      "Fits when",
      "Accelerators",
      "Watch out for"
    ],
    "rows": [
      [
        "[[bigquery-ai|BigQuery ML]]",
        "SQL only",
        "Tabular models, forecasts and first recommenders by analysts",
        "None needed",
        "Limited model choice"
      ],
      [
        "[[ap-training|Managed Training]] (custom or serverless)",
        "Container and code",
        "Most custom training and fine-tuning",
        "GPUs and TPUs",
        "Queue time for scarce accelerators; resume logic is yours"
      ],
      [
        "[[ap-tuning|Model Tuning]] recipes",
        "Data only",
        "Tuning Gemini or common open models",
        "Handled for you",
        "Little control over training details"
      ],
      [
        "[[gke|GKE]] with JobSet and [[dws|DWS]]",
        "The cluster and jobs",
        "Large or unusual jobs, mixed training and serving fleets",
        "GPUs and TPUs",
        "Platform engineering effort"
      ],
      [
        "[[gce|Compute Engine]] or Slurm with Cluster Director",
        "The cluster, scheduler and recovery",
        "HPC-style teams, maximum control",
        "GPUs, TPUs",
        "You own health checks and repair"
      ],
      [
        "[[tpu|TPU]] (JAX or PyTorch/XLA)",
        "Model code for XLA",
        "Large-scale training where price-performance matters",
        "TPU slices",
        "Library and kernel compatibility; topology planning"
      ]
    ],
    "rules": [
      [
        "The model is tabular or small",
        "BigQuery ML or a small managed job. Do not buy accelerators."
      ],
      [
        "You are tuning a supported model",
        "Model Tuning first."
      ],
      [
        "It is custom training",
        "Managed Training; move to GKE only when you need its control."
      ],
      [
        "You train at foundation-model scale",
        "Own the cluster with a named capacity owner, a TPU or GPU strategy and tested recovery."
      ]
    ],
    "redflags": [
      "A large training run starts without a tested checkpoint and resume path.",
      "Capacity is assumed because quota was granted.",
      "Data loading is not profiled, so expensive accelerators wait on storage.",
      "There is no cost ceiling on the experiment."
    ],
    "ask": [
      "How do we get these accelerators, and what if we do not?",
      "How long can we lose before we resume from a checkpoint?",
      "Is the input pipeline fast enough to keep chips busy?",
      "What is the cost of one failed run?"
    ],
    "revisit": "Per training campaign, and when a new accelerator generation lands.",
    "related": [
      "ap-training",
      "ap-tuning",
      "gke",
      "tpu",
      "dws"
    ],
    "lead": "pe",
    "em": {
      "call": "Fund the smallest platform that makes retraining routine. Do not build a training cluster before the second use case.",
      "own": [
        "The cost per experiment and the monthly GPU/TPU budget.",
        "Who is accountable for idle spend."
      ],
      "evidence": [
        "Cost of one full and one failed run.",
        "Quota in the plan with a date."
      ]
    },
    "pe": {
      "call": "Make every job resumable and reproducible first, then optimise throughput.",
      "own": [
        "Data loading design, checkpoint cadence and storage tier.",
        "Environment pinning and lineage to the registry."
      ],
      "evidence": [
        "GPU/TPU utilisation profile showing data is not the bottleneck.",
        "A resume-after-failure test."
      ]
    }
  },
  {
    "id": "evaluation",
    "theme": "risk",
    "title": "How will we know it works?",
    "question": "What evidence says this is good enough to ship, and to keep shipping?",
    "door": "two-way",
    "doorNote": "You can improve evaluation at any time, but without it every other decision is an opinion.",
    "why": "Generative systems are non-deterministic and fail in subtle ways. An eval set is the only thing that makes model, prompt and retrieval changes comparable, and it is the gate for autonomy.",
    "cols": [
      "Method",
      "Measures",
      "Cost",
      "Good for",
      "Weakness"
    ],
    "rows": [
      [
        "Versioned eval set with reference answers",
        "Task accuracy and format",
        "Low per run; effort to build",
        "Regression tests on every change",
        "Needs real, representative cases"
      ],
      [
        "Model-based autoraters ([[ap-evals|Agent Platform Evals]])",
        "Quality against a rubric",
        "Tokens",
        "Scale, open-ended outputs",
        "Judge bias; needs calibration to humans"
      ],
      [
        "Retrieval metrics (recall at k)",
        "Whether the right passages surface",
        "Low",
        "RAG systems ([[rag-engine]])",
        "Needs labelled relevant passages"
      ],
      [
        "Agent simulation and trajectory checks",
        "Tool choice, order and multi-step success",
        "Medium",
        "Agents ([[adk]])",
        "Synthetic users reflect your assumptions"
      ],
      [
        "Live-traffic evaluation and feedback",
        "Real behaviour and drift",
        "Ongoing",
        "Production quality",
        "Delayed labels; privacy of data"
      ],
      [
        "Human review and red teaming",
        "Subtle failures and safety",
        "High",
        "Launch gates and high-risk domains",
        "Slow; hard to scale"
      ]
    ],
    "rules": [
      [
        "Before any build",
        "Write the eval set first, from real cases, with a threshold."
      ],
      [
        "A prompt, model or retrieval change is proposed",
        "Run the eval set, and report by slice, not only the mean."
      ],
      [
        "The system uses tools",
        "Score tool choice and parameters separately from the final answer."
      ],
      [
        "You will remove an approval step",
        "Require measured accuracy on that action class, over enough cases and time."
      ]
    ],
    "redflags": [
      "Quality is judged by demo and gut feel.",
      "The eval set is tuned against repeatedly and never refreshed.",
      "Only averages are reported, hiding a bad segment.",
      "An LLM judge is used with no calibration against people."
    ],
    "ask": [
      "Where is the eval set, who owns it, and how recently was it refreshed?",
      "What does the score look like per segment and per risk class?",
      "How do user complaints become new test cases?",
      "What score blocks a release?"
    ],
    "revisit": "Every model change, each quarter, and after any production incident.",
    "related": [
      "ap-evals",
      "rag-engine",
      "adk",
      "agent-runtime",
      "model-garden"
    ],
    "lead": "both",
    "em": {
      "call": "Do not approve a launch without a versioned eval set and a threshold agreed in advance.",
      "own": [
        "Making evaluation a funded task with an owner.",
        "The ship and stop rules."
      ],
      "evidence": [
        "The threshold, agreed before the results.",
        "Trend of scores across the last releases."
      ]
    },
    "pe": {
      "call": "Build the eval before the system. Score components separately so you know which half to fix.",
      "own": [
        "The eval set design, labelling and versioning.",
        "CI gates that block regressions."
      ],
      "evidence": [
        "Judge-versus-human agreement.",
        "Component-level scores for retrieval and tool choice."
      ]
    }
  },
  {
    "id": "human-in-loop",
    "theme": "risk",
    "title": "How much do we trust it to act?",
    "question": "Which actions need a person, and whose authority does the agent use?",
    "door": "two-way",
    "doorNote": "Easy to relax later once evidence exists. Hard to tighten after an incident has taught users to expect speed.",
    "why": "Permissions bound the damage when the model is wrong or manipulated. Approval is the cheapest control you have, and identity decides what an action means in the audit log.",
    "cols": [
      "Pattern",
      "How it works",
      "Building blocks",
      "Best for",
      "Risk"
    ],
    "rows": [
      [
        "Read-only",
        "The agent looks things up and cannot change anything",
        "[[iam]] read roles, managed MCP tools ([[agent-protocols]])",
        "First deployments",
        "Low; exposure of data the user should not see"
      ],
      [
        "Propose, then approve",
        "The agent drafts the change and a person confirms",
        "[[workflows|Workflows]] callbacks, approval UI",
        "Most state-changing actions",
        "Approval fatigue"
      ],
      [
        "Approve above a threshold",
        "Small reversible actions are automatic, larger ones need a person",
        "Policy in the tool, [[agent-governance|Agent Gateway]]",
        "Routine operations with a value range",
        "Threshold gaming and splitting"
      ],
      [
        "Autonomous within limits",
        "Agent acts with scoped identity, caps and rollback",
        "[[agent-governance|Agent Identity]], [[billing|budgets]], [[audit-logs]]",
        "Proven, reversible, high-volume tasks",
        "Acts before anyone looks"
      ],
      [
        "Dual control",
        "Two people approve",
        "Workflows with two callbacks",
        "High-value or irreversible actions",
        "Slow"
      ]
    ],
    "rules": [
      [
        "The action changes money, data or access",
        "Propose then approve, until measured error rates justify more."
      ],
      [
        "The action is reversible and capped",
        "Consider autonomy for that class, with alarms."
      ],
      [
        "The agent acts for a user",
        "Use that user's delegated authority, not a shared admin account."
      ],
      [
        "The action is irreversible",
        "Keep a person in the loop, always."
      ]
    ],
    "redflags": [
      "The agent uses one broad service account for everything.",
      "Approvals are rubber-stamped because volume is too high.",
      "Tools accept free-form parameters with no server-side validation.",
      "Nobody can reconstruct what the agent did and under whose authority."
    ],
    "ask": [
      "What is the worst action the agent can take today, and who would notice?",
      "Whose identity appears in the audit log for each action?",
      "What evidence would let us remove this approval?",
      "How do we undo an action?"
    ],
    "revisit": "When measured accuracy changes, after any incident, and when new tools are added.",
    "related": [
      "workflows",
      "agent-governance",
      "iam",
      "audit-logs",
      "agent-protocols"
    ],
    "lead": "both",
    "em": {
      "call": "Keep approval on every irreversible action until a written accuracy threshold has been met for a defined period.",
      "own": [
        "The risk appetite and who signs off on removing a gate.",
        "Reviewer capacity so approval does not become a bottleneck."
      ],
      "evidence": [
        "Accuracy per action type from real runs.",
        "The approver screen, shown in a demo."
      ]
    },
    "pe": {
      "call": "Run tools as the user, validate server-side, and cap blast radius with permissions rather than prompts.",
      "own": [
        "Tool design, identity flow and audit logging.",
        "Prompt-injection defences: untrusted-data handling and write blocking."
      ],
      "evidence": [
        "An injection test suite through retrieved text and tool output.",
        "A permission map from each tool to the data it can reach."
      ]
    }
  },
  {
    "id": "cost-levers",
    "theme": "risk",
    "title": "How do we keep it affordable?",
    "question": "Which levers cut cost per successful task, and what do they cost in quality?",
    "door": "two-way",
    "doorNote": "Most levers are reversible, though each can cost quality, so re-run the evals after every change.",
    "why": "Tokens are the bill, and agents multiply them: retries, loops, long contexts and thinking tokens all count. Cost per call hides this; cost per successful task shows it.",
    "cols": [
      "Lever",
      "How",
      "Typical effect",
      "Quality risk",
      "Where"
    ],
    "rows": [
      [
        "Route by difficulty",
        "Cheaper tiers (Flash-Lite, Flash) for easy cases, Pro only for hard ones",
        "Large",
        "Misrouted hard cases",
        "[[gemini]], [[apigee]]"
      ],
      [
        "Context caching",
        "Stable prefixes (system prompt, shared documents) cached",
        "Medium to large on long prompts",
        "None, if keys are stable",
        "[[gemini]]"
      ],
      [
        "Batch",
        "Run non-urgent work asynchronously at a discount",
        "Large",
        "Latency",
        "[[gemini]], [[bigquery-ai]], [[batch]]"
      ],
      [
        "Semantic or response cache",
        "Skip the model for repeated questions",
        "Large for repetitive traffic",
        "Wrong cached answers",
        "[[memorystore]]"
      ],
      [
        "Bound thinking and output",
        "Set thinking budgets, shorter answers",
        "Medium",
        "Lower reasoning quality",
        "[[gemini]]"
      ],
      [
        "Fewer calls per task",
        "Merge steps, retrieve better, stop loops",
        "Medium",
        "Lower accuracy if over-merged",
        "[[adk]]"
      ],
      [
        "Tune a smaller model",
        "Distil a large model's behaviour",
        "Large at volume",
        "Narrow generalisation",
        "[[ap-tuning]]"
      ],
      [
        "Commit where steady",
        "Provisioned Throughput, committed use",
        "Medium",
        "Paying for idle",
        "[[quotas]], [[billing]]"
      ]
    ],
    "rules": [
      [
        "The task is easy for a small model",
        "Route to a cheaper tier and verify on evals."
      ],
      [
        "Prompts repeat large shared prefixes",
        "Use context caching and keep changing text at the end."
      ],
      [
        "Nobody is waiting",
        "Batch it."
      ],
      [
        "Spend rises with no quality gain",
        "Look for loops, retries and oversized context before changing models."
      ]
    ],
    "redflags": [
      "Cost is tracked per call, not per successful task.",
      "No per-tenant or per-feature cost attribution exists.",
      "Budgets alert but nothing slows the spend.",
      "A cheaper model was chosen with no eval run."
    ],
    "ask": [
      "What is our cost per successful task, and how does it break down?",
      "Which levers have we applied, and what did they do to the eval scores?",
      "How fast would a runaway loop be noticed and stopped?",
      "What happens to unit cost at ten times the volume?"
    ],
    "revisit": "Monthly while volume grows, and whenever prices or model tiers change.",
    "related": [
      "gemini",
      "billing",
      "apigee",
      "memorystore",
      "quotas"
    ],
    "lead": "em",
    "em": {
      "call": "Set a target cost per successful task up front, and review it monthly with the lever list.",
      "own": [
        "The budget, the target and the alert owner.",
        "Commitments: reservation and provisioned-capacity decisions."
      ],
      "evidence": [
        "Cost per successful task by feature and tenant.",
        "Utilisation of any reserved capacity."
      ]
    },
    "pe": {
      "call": "Measure first, then apply levers in order of effect and quality risk. Re-run evals after each.",
      "own": [
        "Token and call instrumentation, tagging and attribution.",
        "Routing, caching and loop-cap design."
      ],
      "evidence": [
        "Per-lever before-and-after eval and cost numbers.",
        "Cache hit-rate and hit-correctness measurements."
      ]
    }
  },
  {
    "id": "tenancy",
    "theme": "risk",
    "title": "How do we isolate tenants and data?",
    "question": "How do customers, teams or users stay apart in storage, retrieval, caches and logs?",
    "door": "one-way",
    "doorNote": "Retrofitting isolation after launch means migrating data and re-testing every path. Decide before onboarding sensitive tenants.",
    "why": "A missing filter leaks one customer's data to another, and the leak can come from a vector index, a cache, a log or a model memory, not only the database.",
    "cols": [
      "Model",
      "Isolation",
      "Cost and effort",
      "Fits when",
      "Risk"
    ],
    "rows": [
      [
        "Pooled data with tenant filters",
        "Logical: filters in every query, index and cache key",
        "Lowest",
        "Many small tenants, low sensitivity",
        "One missed filter leaks data"
      ],
      [
        "Separate index or collection per tenant",
        "Stronger logical isolation in retrieval",
        "Medium",
        "Moderate sensitivity, tenants of varied size",
        "Many indexes to operate and pay for"
      ],
      [
        "Separate dataset or database per tenant",
        "Data-layer separation with IAM per tenant",
        "Medium to high",
        "Contractual separation, uneven tenants",
        "Operational overhead"
      ],
      [
        "Separate project per tenant ([[iam]], [[vpc-sc]])",
        "Strong boundary for IAM, quotas, billing, perimeters",
        "High",
        "Regulated or large tenants",
        "Provisioning automation required ([[infra-manager]])"
      ],
      [
        "Per-tenant keys ([[kms]] CMEK)",
        "Cryptographic: disable a key to cut off data",
        "Medium",
        "Strict control and deletion needs",
        "Key management and quota on KMS"
      ]
    ],
    "rules": [
      [
        "Tenants are small and data is not sensitive",
        "Pooled with filters, tested adversarially."
      ],
      [
        "Contracts require separation or per-tenant deletion",
        "Dedicated datasets or projects, and per-tenant keys."
      ],
      [
        "Any shared cache, memory or log can hold tenant text",
        "Scope it by tenant in the key, or do not share it."
      ],
      [
        "Regulators are involved",
        "Project-level isolation, perimeters and key control from day one."
      ]
    ],
    "redflags": [
      "Tenant filtering relies on the prompt asking the model to ignore other data.",
      "Semantic caches or memory stores are shared across tenants.",
      "Logs and traces hold prompts and are visible to every engineer.",
      "Nobody has attempted a cross-tenant retrieval test."
    ],
    "ask": [
      "Show me a test where tenant A tries to read tenant B through every path.",
      "Where does tenant text live, including caches, memory, logs and backups?",
      "How do we delete a tenant completely, including embeddings?",
      "What does a noisy tenant do to everyone else's quota?"
    ],
    "revisit": "Before onboarding any regulated tenant, and after any change to caching, memory or logging.",
    "related": [
      "iam",
      "vpc-sc",
      "kms",
      "agent-memory",
      "rag-engine"
    ],
    "lead": "pe",
    "em": {
      "call": "Decide the isolation model with compliance and sales before signing the first sensitive tenant. It is a one-way door.",
      "own": [
        "The commercial and contractual promises tied to isolation.",
        "The cost difference between shared and dedicated tiers."
      ],
      "evidence": [
        "A written tenant data-flow map.",
        "A tested tenant deletion and export procedure."
      ]
    },
    "pe": {
      "call": "Enforce isolation in retrieval and storage, not in prompts. Prove it with tests that try to cross the boundary.",
      "own": [
        "The data-layer design: filters, partitions, keys and caches.",
        "Automated cross-tenant leak tests in CI."
      ],
      "evidence": [
        "Cross-tenant query test results.",
        "A review of every place tenant data is copied (caches, logs, indexes)."
      ]
    }
  },
  {
    "id": "vector-hybrid-search",
    "theme": "architecture",
    "lead": "pe",
    "title": "Vector vs hybrid search: when is each appropriate?",
    "question": "Should retrieval rely purely on dense vectors or combine keyword BM25, dense vectors and semantic reranking?",
    "door": "two-way",
    "doorNote": "Datastores in [[ai-search]] support hybrid keyword plus dense vector retrieval out of the box without changing backend storage.",
    "why": "Dense vector search excels at conceptual similarity and cross-lingual meaning, but fails on exact keyword matching: serial numbers, acronyms, product SKUs and error codes. Hybrid search with Reciprocal Rank Fusion (RRF) and semantic reranking solves both.",
    "cols": [
      "Retrieval mode",
      "Strengths",
      "Weaknesses",
      "Latency",
      "Best fit"
    ],
    "rows": [
      [
        "Pure Dense Vector Search",
        "Handles synonyms, conceptual queries, multi-lingual questions",
        "Misses exact part numbers, product SKUs, unique IDs and rare technical terms",
        "Fast (20-60ms)",
        "Conversational FAQ, semantic discovery"
      ],
      [
        "Pure Keyword Search (BM25)",
        "Exact term matching, fast, low cost, familiar search syntax",
        "Cannot handle synonyms, paraphrasing or cross-language queries",
        "Very fast (10-30ms)",
        "Log search, lookup by invoice ID or SKU"
      ],
      [
        "Hybrid Search (BM25 + Vector via RRF)",
        "Combines keyword precision with semantic breadth; reciprocal rank fusion fuses scores",
        "Requires maintaining both inverted index and vector store in search",
        "Moderate (40-80ms)",
        "Enterprise intranet, technical documentation"
      ],
      [
        "Hybrid + Semantic Reranker",
        "Highest measured Recall@5 and NDCG@10; deep cross-encoder re-evaluates top 50 passages",
        "Adds 100-250ms latency and usage-based billing per 1,000 queries",
        "Higher (150-300ms)",
        "Customer-facing assistants, high-stakes compliance"
      ]
    ],
    "rules": [
      [
        "Queries contain acronyms, product SKUs, error codes or part numbers",
        "Use Hybrid search (BM25 + Vector). Pure vector will disappoint."
      ],
      [
        "The application serves external customers where accuracy drives revenue or brand trust",
        "Enable the Semantic Reranker in [[ai-search]]. The 15-25% NDCG boost is worth the latency."
      ],
      [
        "End-to-end latency budget is under 100ms",
        "Use Hybrid search with RRF but skip the semantic reranker."
      ],
      [
        "Search corpus is small (<5,000 documents) and questions are broad",
        "Pure dense vector search is often sufficient for early prototypes."
      ]
    ],
    "redflags": [
      "Choosing pure vector search for enterprise catalogs with complex alphanumeric product codes.",
      "Assuming vector similarity guarantees factual relevance without measuring Recall@K on golden queries.",
      "Enabling semantic reranking without checking the p95 latency impact on streaming token generation.",
      "Failing to test exact-match search queries during pre-pilot evaluations."
    ],
    "ask": [
      "What percentage of user queries contain exact terms, product codes or acronyms?",
      "What is our measured Recall@5 and NDCG difference between pure vector and hybrid plus reranker?",
      "What is the end-to-end latency budget from user prompt to first generated token?",
      "What is the monthly cost impact of the Semantic Reranker at expected production query volumes?"
    ],
    "revisit": "When query latency exceeds SLAs, when search evaluation metrics plateau, or when Vertex AI Search updates ranking capabilities.",
    "related": [
      "ai-search",
      "gemini",
      "apigee",
      "gcs"
    ],
    "em": {
      "call": "Default to Hybrid + Semantic Reranking for production user-facing assistants. Relevance directly impacts task completion rate.",
      "own": [
        "Budget allocation for semantic reranking queries.",
        "The customer satisfaction SLA tied to retrieval accuracy."
      ],
      "evidence": [
        "Evaluation scorecard comparing Recall@5 and MRR across vector, hybrid and reranked modes.",
        "Monthly cost estimate at 1x and 10x query volumes."
      ]
    },
    "pe": {
      "call": "Implement Reciprocal Rank Fusion (RRF) in [[ai-search]] combining text-embedding-004 vectors and BM25 keywords; tune semantic reranker thresholds.",
      "own": [
        "Search schema design, vector indexing algorithms (ScaNN), and RRF weight tuning.",
        "Latency profiling for the search step in the end-to-end trace."
      ],
      "evidence": [
        "Benchmark results measuring retrieval latency (P50/P95) and NDCG@10 on a representative test corpus.",
        "Precision and recall evaluation on keyword-heavy test queries containing product codes and acronyms."
      ]
    }
  },
  {
    "id": "classic-vs-agentic-rag",
    "theme": "strategy",
    "lead": "both",
    "title": "Classic vs agentic RAG: what complexity justifies agentic retrieval?",
    "question": "Should the system use deterministic single-shot retrieval or autonomous multi-step reasoning and query planning?",
    "door": "mixed",
    "doorNote": "Two-way to start with classic RAG in [[ai-search]]; moving to agentic RAG multiplies token cost and adds stateful orchestration.",
    "why": "Classic RAG answers questions that can be satisfied by a single search query over a single corpus. Agentic RAG decomposes complex questions, searches multiple datastores in parallel, reflects on missing information, and iteratively gathers facts. However, it costs 3x-8x more tokens and takes significantly longer.",
    "cols": [
      "Pattern",
      "Query Execution",
      "Multi-Source Synthesis",
      "Latency & Token Cost",
      "Best Production Fit"
    ],
    "rows": [
      [
        "Classic RAG",
        "Single deterministic query to [[ai-search]] or [[rag-engine]]",
        "None (single datastore or pre-merged index)",
        "Lowest latency (500-1,200ms); 1 LLM call",
        "FAQ assistants, policy Q&A, single document lookup"
      ],
      [
        "Routing RAG",
        "Classifier routes query to 1 of N specialized knowledge sources",
        "Queries exactly one specialized index per turn",
        "Low latency (800-1,500ms); 1 classification + 1 generation call",
        "Multi-department portals (HR vs IT vs Legal)"
      ],
      [
        "Decomposition RAG",
        "LLM splits complex query into sub-queries executed in parallel",
        "Combines results from multiple parallel searches",
        "Medium latency (1,500-3,000ms); 2-3 LLM calls",
        "Comparative questions (\"Compare Q3 results between Division A and B\")"
      ],
      [
        "Full Agentic RAG",
        "Autonomous loop: retrieve -> reflect -> re-query -> tool call -> synthesize",
        "Cross-queries search, SQL databases, and live APIs dynamically",
        "High latency (3,000-10,000ms); 4-10 LLM calls",
        "Deep research, complex customer issue diagnosis, forensic analysis"
      ]
    ],
    "rules": [
      [
        "User questions can be answered from a single document passage",
        "Use Classic RAG. Agentic loops add latency and cost for zero quality gain."
      ],
      [
        "Questions require comparing data across multiple distinct repositories (e.g. Jira + BigQuery)",
        "Use Decomposition RAG or a 2-step routing pattern."
      ],
      [
        "The assistant must verify intermediate retrieval before deciding which tool to call next",
        "Use Agentic RAG with [[agent-runtime]], but enforce hard limits on iterations (max 3 turns)."
      ],
      [
        "Latency budget is strict (<2 seconds)",
        "Classic RAG or Routing RAG only. Agentic loops cannot guarantee sub-2-second P95."
      ]
    ],
    "redflags": [
      "Choosing Agentic RAG for straightforward FAQ lookup tasks.",
      "Allowing unbounded agent loops without a hard circuit breaker on maximum iterations.",
      "Failing to instrument per-step token consumption and latency in [[cloud-monitoring]].",
      "Deploying agentic retrieval without an evaluation dataset measuring query decomposition accuracy."
    ],
    "ask": [
      "What percentage of user queries actually require synthesizing multiple distinct sources?",
      "What is our measured P95 latency and token cost difference between classic RAG and agentic RAG?",
      "How does the agent know when it has collected sufficient information to stop retrieving?",
      "Are tool calls and intermediate search steps logged with distributed trace IDs?"
    ],
    "revisit": "When multi-hop query failure rates rise in classic RAG, or when agentic token spend exceeds unit economics targets.",
    "related": [
      "ai-search",
      "agent-runtime",
      "adk",
      "cloud-run",
      "bigquery"
    ],
    "em": {
      "call": "Start with Classic RAG. Require evidence of multi-source synthesis failure before funding agentic retrieval development.",
      "own": [
        "Unit economics budget (agentic RAG triples token consumption).",
        "User latency tolerance and product SLA definition."
      ],
      "evidence": [
        "Evaluation analysis showing the percentage of queries that fail under single-shot retrieval.",
        "Cost-per-task comparison between classic and agentic prototypes on identical test queries."
      ]
    },
    "pe": {
      "call": "Implement single-shot hybrid search in [[ai-search]] first; introduce query rewriting and multi-index fan-out only when evaluation proves necessity.",
      "own": [
        "State management, loop termination conditions, and tool invocation timeouts.",
        "Telemetry instrumentation capturing intermediate retrieval traces."
      ],
      "evidence": [
        "Traces proving the agent terminates loops reliably within 3 turns.",
        "Component-level evals comparing retrieval recall of decomposed queries against raw user prompts."
      ]
    }
  },
  {
    "id": "search-vs-alloydb",
    "theme": "architecture",
    "lead": "pe",
    "title": "Vertex AI Search vs AlloyDB pgvector: which vector store?",
    "question": "Should vector embeddings live in specialized Vertex AI Search or in an operational relational database like AlloyDB PostgreSQL?",
    "door": "one-way",
    "doorNote": "Migrating vector indexes and embedding stores between services requires changing ingestion pipelines, query logic and access control.",
    "why": "[[ai-search|Vertex AI Search]] is a dedicated managed search engine offering hybrid keyword plus vector search, integrated document cracking, and semantic ranking. [[alloydb|AlloyDB for PostgreSQL]] with pgvector provides ACID transactions and co-located operational tables. Mixing up their roles leads to either building search features from scratch in SQL or overloading search with high-throughput transactional writes.",
    "cols": [
      "Dimension",
      "Vertex AI Search",
      "AlloyDB for PostgreSQL (pgvector)",
      "Architecture Verdict"
    ],
    "rows": [
      [
        "Primary Strength",
        "Hybrid search (BM25 + vectors), faceted filtering, Google-quality semantic ranker",
        "ACID transactions, relational joins, co-located operational business data",
        "Vertex AI Search for unstructured text; AlloyDB for structured relational data"
      ],
      [
        "Filtering & Facets",
        "Rich aggregations, metadata filters, document ACL security trimming",
        "SQL WHERE clauses, relational joins, composite indexes",
        "AlloyDB wins on complex relational joins; Vertex AI Search on text facets"
      ],
      [
        "Write Throughput",
        "Optimized for batch document indexing; periodic ingestion passes",
        "High-throughput transactional writes, row-level locking, instant updates",
        "AlloyDB for fast transactional entity updates"
      ],
      [
        "Operational Cost",
        "Search queries billed per 1,000 queries ($1-$4/k queries)",
        "Standard AlloyDB vCPU and memory instance pricing",
        "AlloyDB is cheaper for predictable high-volume operational lookup; Vertex AI Search scales on queries"
      ],
      [
        "Enterprise Ingestion",
        "Native document cracking (PDF, Word, HTML), automated layout parsing",
        "Requires custom ETL pipeline to crack, chunk, and embed documents into SQL",
        "Vertex AI Search is the turnkey choice for document RAG"
      ]
    ],
    "rules": [
      [
        "The primary workload is document RAG requiring hybrid keyword + vector search and text filtering",
        "Use [[ai-search|Vertex AI Search]]. Building BM25 and text tokenizers in Postgres is fragile."
      ],
      [
        "Vectors represent operational entities (products, user profiles) that must join with relational tables in transactions",
        "Use [[alloydb|AlloyDB for PostgreSQL]] with pgvector."
      ],
      [
        "The solution uses Google Cloud managed grounding with automated document cracking and website indexing",
        "Use Vertex AI Search."
      ],
      [
        "Workload requires high-throughput streaming vector ingestion with complex SQL analytics",
        "Use [[bigquery|BigQuery Vector Search]] or AlloyDB."
      ]
    ],
    "redflags": [
      "Building an ad-hoc search engine in AlloyDB using `LIKE '%term%'` queries instead of a dedicated search engine.",
      "Treating Vertex AI Search as an operational relational database for transactional updates.",
      "Overlooking query-based pricing in Vertex AI Search for extremely high-frequency bot traffic.",
      "Failing to index vector fields in pgvector using ScaNN or HNSW before benchmarking query performance."
    ],
    "ask": [
      "Do search queries require joining vectors against live relational operational tables?",
      "Do user queries require hybrid BM25 full-text scoring alongside vector similarity?",
      "What is the expected document ingestion volume and update frequency?",
      "What are the minimum monthly operational costs for each service under current team commitments?"
    ],
    "revisit": "When document corpus exceeds 10M vectors, when relational joins become a bottleneck in RAG, or when AlloyDB pgvector adds native hybrid ranking.",
    "related": [
      "ai-search",
      "alloydb",
      "cloud-sql",
      "vector-search"
    ],
    "em": {
      "call": "Use Vertex AI Search for enterprise knowledge bases and document search. Use AlloyDB pgvector when vectors are attributes of existing transactional records.",
      "own": [
        "Infrastructure cost baseline (query costs in Vertex AI Search vs compute in AlloyDB).",
        "Data governance and operational boundary between search and core relational databases."
      ],
      "evidence": [
        "Total cost of ownership projection across 1-year document volume growth.",
        "Engineering hours required to maintain custom search ranking in Postgres vs managed Vertex AI Search."
      ]
    },
    "pe": {
      "call": "Default to [[ai-search]] for document RAG (hybrid BM25 + vector, document cracking, security filters); use [[alloydb]] pgvector for operational entity vector queries.",
      "own": [
        "Index algorithm configuration (ScaNN vs HNSW), vector quantization, and filter execution order.",
        "Data synchronization pipeline between operational stores and search datastores."
      ],
      "evidence": [
        "P95 latency benchmark under concurrent query load comparing Vertex AI Search with AlloyDB pgvector.",
        "Recall@K evaluation with realistic enterprise metadata filters applied."
      ]
    }
  },
  {
    "id": "chunking-strategy",
    "theme": "architecture",
    "lead": "pe",
    "title": "Chunking strategies: fixed, semantic, hierarchical or document-aware?",
    "question": "How should documents be parsed, segmented and indexed for optimal embedding and retrieval?",
    "door": "two-way",
    "doorNote": "Re-chunking requires re-indexing the corpus and re-generating embeddings, but does not alter cloud infrastructure.",
    "why": "Bad chunking is the single most common cause of failed RAG pilots. If chunks are too small, they lose context; if too large, they dilute vector embeddings and fill the LLM context with irrelevant noise. Naive token chunking breaks sentences and flattens tables.",
    "cols": [
      "Strategy",
      "Segmentation Mechanism",
      "Preserves Layout & Tables",
      "Embedding Fidelity",
      "Best Fit"
    ],
    "rows": [
      [
        "Fixed-Length Token Splitter",
        "Splits every N tokens (e.g. 500) with 10% overlap",
        "Poor (splits mid-table and mid-sentence)",
        "Low-to-medium (context diluted or truncated)",
        "Simple raw text, unstructured transcripts"
      ],
      [
        "Sentence / Paragraph Splitter",
        "Splits on punctuation or double line-breaks",
        "Moderate (respects paragraphs, breaks tables)",
        "Medium (self-contained conceptual statements)",
        "Narrative articles, blog posts, news feeds"
      ],
      [
        "Document-Aware Layout Chunking",
        "Extracts headers, sections and tables via [[document-ai]]",
        "Excellent (preserves Markdown tables and headings)",
        "High (chunks reflect author structural intent)",
        "Enterprise PDFs, financial filings, technical manuals"
      ],
      [
        "Hierarchical Parent-Child Chunking",
        "Embeds small child chunks (200t); returns parent section (1,200t)",
        "High (searches specificity, provides full context)",
        "Highest (tight vectors, complete context to LLM)",
        "Legal contracts, policy documentation, compliance audits"
      ]
    ],
    "rules": [
      [
        "Documents contain tables, multi-column layouts or headers",
        "Use Document-Aware Layout Chunking via [[document-ai]]. Never use naive token splitters."
      ],
      [
        "Specific facts or numbers must be found, but the model needs surrounding context to explain them",
        "Use Hierarchical Parent-Child Chunking in [[ai-search]]."
      ],
      [
        "Documents are short, homogeneous plain-text notes (<1,000 words)",
        "Sentence or paragraph-level chunking is sufficient."
      ],
      [
        "Chunks cross section boundaries",
        "Enforce a minimum 10-15% sliding window overlap to preserve cross-boundary semantics."
      ]
    ],
    "redflags": [
      "Using a fixed 500-token character splitter on scanned PDFs containing financial tables.",
      "Embedding table rows individually without column headers, destroying tabular context.",
      "Allowing chunk sizes over 2,000 tokens for embedding models designed for 512-token optimal dense representations.",
      "Failing to preserve document metadata (title, section, page number) on each indexed chunk."
    ],
    "ask": [
      "What layout elements exist in our corpus (tables, headers, footnotes, multi-column text)?",
      "Does our chunking pipeline preserve section hierarchy and table Markdown representations?",
      "What is our measured Recall@5 when testing different chunk sizes (200 vs 500 vs 1,000 tokens)?",
      "Are document breadcrumbs (e.g. \"Section 4.2 > Limitations\") prepended to each chunk before embedding?"
    ],
    "revisit": "When retrieval recall plateaus, when users complain about truncated context, or when Document AI adds layout models.",
    "related": [
      "document-ai",
      "gcs",
      "ai-search",
      "gemini"
    ],
    "em": {
      "call": "Mandate layout-aware chunking for all enterprise PDF ingestion. Bad chunking cannot be fixed by prompt engineering.",
      "own": [
        "Document pipeline ingestion budget (Document AI layout analysis costs vs simple OCR).",
        "Golden evaluation dataset representing complex tabular and multi-page questions."
      ],
      "evidence": [
        "Side-by-side Groundedness comparison on tabular questions between naive chunking and layout-aware chunking.",
        "Preprocessing cost per 1,000 document pages."
      ]
    },
    "pe": {
      "call": "Implement layout-aware parsing using [[document-ai]] layout parser; split on Markdown header tags and maintain 15% sliding window overlap.",
      "own": [
        "Chunking script logic, token length validation, metadata extraction, and parent-child document mapping.",
        "Evaluation harness measuring Recall@K across chunk size variations (250, 500, 1,000 tokens)."
      ],
      "evidence": [
        "Distribution histogram of chunk token lengths across the corpus.",
        "Recall@5 score comparison across chunking strategies on the golden test suite."
      ]
    }
  },
  {
    "id": "reranking-tradeoff",
    "theme": "architecture",
    "lead": "pe",
    "title": "Semantic reranking: when does relevance justify latency?",
    "question": "Should the search pipeline include a deep cross-encoder semantic reranker after initial vector retrieval?",
    "door": "two-way",
    "doorNote": "Enabling or disabling the Semantic Ranker in [[ai-search]] is a configuration toggle; no datastore rebuilding is required.",
    "why": "First-stage retrieval (vector cosine similarity or BM25) is fast (20-50ms) but relies on approximate nearest neighbors or term frequencies. A second-stage semantic reranker passes the top passages through a deep language model to score relevance, lifting NDCG by 15-25% at the cost of 100-250ms latency.",
    "cols": [
      "Pipeline Stage",
      "Mechanism",
      "Latency Overhead",
      "Relevance Lift (NDCG@10)",
      "Best Production Fit"
    ],
    "rows": [
      [
        "Single-Stage Vector Search",
        "Cosine similarity over ScaNN vector graph in [[vector-search]]",
        "None (20-40ms total)",
        "Baseline",
        "Internal tools, latency-sensitive autocomplete, prototypes"
      ],
      [
        "Single-Stage Hybrid Search",
        "RRF combines BM25 keyword and dense vector ranks",
        "+10-30ms (30-70ms total)",
        "+8% to +12% over vector alone",
        "Technical intranets, general documentation search"
      ],
      [
        "Two-Stage: Hybrid + Semantic Ranker",
        "RRF surfaces top 50 candidates; Google Semantic Ranker reranks top 5",
        "+100-250ms (150-320ms total)",
        "+18% to +25% over vector alone",
        "Customer-facing assistants, high-stakes compliance, executive briefs"
      ],
      [
        "Two-Stage: Vector + Small Reranker",
        "Dense vector search surfaces top 20 candidates; fast local reranker reranks",
        "+50-100ms (70-140ms total)",
        "+12% to +16% over vector alone",
        "Balanced latency-sensitive conversational agents"
      ]
    ],
    "rules": [
      [
        "User-facing assistant where incorrect answers damage customer trust or revenue",
        "Enable semantic reranking in [[ai-search]]. The 20% relevance boost outweighs 150ms latency."
      ],
      [
        "End-to-end P95 latency SLA is strictly under 1,000ms",
        "Use hybrid search (BM25 + vector via RRF) without semantic reranker."
      ],
      [
        "The retrieved passages contain subtle negations, conditions or fine print",
        "Enable semantic reranking. Bi-encoders miss subtle logical qualifiers that cross-encoders catch."
      ],
      [
        "Monthly query volume is tens of millions and budget is constrained",
        "Benchmark whether the NDCG lift justifies per-query reranking API costs."
      ]
    ],
    "redflags": [
      "Sending 200+ candidates to the reranker, causing massive latency spikes and high billing.",
      "Enabling semantic reranking without measuring baseline Recall@K and NDCG@10 on a golden dataset.",
      "Assuming semantic reranking can compensate for corrupted chunks or missing source documents.",
      "Skipping reranking evaluation for non-English languages."
    ],
    "ask": [
      "What is our measured NDCG@10 and Recall@5 with and without the semantic reranker?",
      "What is the P95 latency breakdown of initial retrieval versus the reranking step?",
      "How many candidate passages are passed to the reranker (recommended: 30-50)?",
      "What is the estimated monthly cost of semantic reranker API calls at scale?"
    ],
    "revisit": "When embedding models improve (e.g. newer dense models closing the gap), or when query latency violates user experience targets.",
    "related": [
      "ai-search",
      "gemini",
      "vector-search",
      "apigee"
    ],
    "em": {
      "call": "Turn on semantic reranking for customer-facing applications. The measurable gain in answer groundedness protects brand trust.",
      "own": [
        "Per-query reranking API cost approval.",
        "Customer SLA definition balancing response quality against latency."
      ],
      "evidence": [
        "Evaluation scorecard showing Groundedness and Relevance scores with and without reranker.",
        "Latency impact report measuring TTFT with reranking enabled."
      ]
    },
    "pe": {
      "call": "Configure two-stage retrieval: surface top 50 candidates via [[ai-search]] hybrid search; rerank top 5 passages into [[gemini]] prompt.",
      "own": [
        "Candidate pool size tuning (k=30-50), score threshold filtering, and fallback on reranker timeout.",
        "End-to-end tracing in [[cloud-monitoring]] isolating reranking latency."
      ],
      "evidence": [
        "A/B test NDCG@10 comparison across 500 representative enterprise queries.",
        "P95 and P99 latency distribution of the reranking API call."
      ]
    }
  },
  {
    "id": "graphrag-vs-vector",
    "theme": "architecture",
    "lead": "pe",
    "title": "GraphRAG vs vector RAG: when are entity relationships important?",
    "question": "When does a project require knowledge graph extraction and community summaries rather than standard vector retrieval?",
    "door": "mixed",
    "doorNote": "Building a knowledge graph in [[spanner-graph]] requires a substantial offline extraction investment; query retrieval can fall back to standard vector search at any time.",
    "why": "Vector RAG is a \"local\" retrieval technique: it finds specific text chunks similar to a query. However, it cannot answer global questions that require understanding cross-document themes, corporate connections, or complex multi-hop entity relationships. GraphRAG extracts entities, relationships and claims into hierarchical communities, but costs significantly more to build and maintain.",
    "cols": [
      "Evaluation Dimension",
      "Vector RAG ([[ai-search]])",
      "GraphRAG ([[spanner-graph]] + Gemini)",
      "Architecture Verdict"
    ],
    "rows": [
      [
        "Query Type",
        "Specific fact retrieval (\"What is the refund window in policy X?\")",
        "Global synthesis & themes (\"What are the top 5 operational risks across all 2024 audits?\")",
        "Vector RAG for point lookups; GraphRAG for cross-corpus summarization"
      ],
      [
        "Multi-Hop Reasoning",
        "Poor (fails when facts are in disconnected documents)",
        "High (traverses explicit entity and relationship edges in GQL)",
        "GraphRAG excels at multi-hop relationship queries"
      ],
      [
        "Indexing Cost & Time",
        "Low: 1 embedding call per chunk; minutes to index",
        "High: 3-5 LLM extraction calls per chunk to build graph; hours/days",
        "GraphRAG indexing is 50x-100x more expensive in token spend"
      ],
      [
        "Infrastructure Required",
        "[[ai-search|Vertex AI Search]] or [[vector-search|Vector Search]]",
        "Graph database ([[spanner-graph]]) + Vector store + Graph extraction pipeline",
        "GraphRAG adds graph DB operational complexity"
      ],
      [
        "Maintenance & Updates",
        "Incremental chunk additions are straightforward",
        "Adding documents requires incremental entity extraction and community re-clustering",
        "Vector RAG is much simpler to keep fresh"
      ]
    ],
    "rules": [
      [
        "Users ask global, holistic questions over large document collections (\"Summarize all complaints regarding Product Y\")",
        "Use GraphRAG."
      ],
      [
        "Users ask specific, targeted factual questions that can be found in 1-2 paragraphs",
        "Use standard Vector RAG with [[ai-search]]. GraphRAG is overkill."
      ],
      [
        "The dataset has deeply interconnected entities (investigations, fraud detection, supply chains)",
        "Use [[spanner-graph]] to model entities and relationships explicitly."
      ],
      [
        "Indexing budget is limited or content updates every few minutes",
        "Use Vector RAG. GraphRAG extraction costs and pipeline latencies do not support real-time streaming updates."
      ]
    ],
    "redflags": [
      "Proposing GraphRAG for simple customer service FAQ lookup.",
      "Underestimating the massive token cost of offline graph extraction (extracting entities, relationships, and claims across 100k documents).",
      "Deploying GraphRAG without evaluating whether hybrid search with semantic reranking already solves the problem.",
      "Failing to establish an incremental graph update procedure for new incoming documents."
    ],
    "ask": [
      "What percentage of user queries require global corpus summarization versus specific passage retrieval?",
      "What is the estimated token cost to build and periodically re-cluster the knowledge graph?",
      "Who owns the graph database schema, entity resolution rules, and graph operations?",
      "Can our use case tolerate the latency and cost of GraphRAG query execution?"
    ],
    "revisit": "When users frequently complain that search misses cross-document connections, or when managed GraphRAG features mature.",
    "related": [
      "spanner-graph",
      "vector-search",
      "gemini",
      "gcs"
    ],
    "em": {
      "call": "Reject GraphRAG for standard Q&A features. Approve it only for executive synthesis, fraud networks, or legal intelligence where cross-corpus analysis is the core value proposition.",
      "own": [
        "Graph extraction token budget (often $5k-$20k+ for initial graph build).",
        "ROI justification based on high-value executive or investigative use cases."
      ],
      "evidence": [
        "Detailed cost projection for initial graph indexing and monthly incremental updates.",
        "Test results comparing Vector RAG vs GraphRAG on a benchmark of 50 global synthesis questions."
      ]
    },
    "pe": {
      "call": "Use [[spanner-graph]] for explicit entity relationship modeling; combine GQL graph traversal with [[vector-search]] retrieval for hybrid local-global RAG.",
      "own": [
        "Entity resolution algorithms, graph schema design, community detection clustering, and prompt extraction templates.",
        "Incremental graph update pipeline using Cloud Storage notifications and [[dataflow]]."
      ],
      "evidence": [
        "Extraction accuracy validation measuring entity and relationship precision against ground truth.",
        "Latency and cost benchmarks comparing local vector queries against global graph community queries."
      ]
    }
  },
  {
    "id": "index-tenancy",
    "theme": "risk",
    "lead": "both",
    "title": "Shared vs isolated search indexes: how to separate enterprise tenants?",
    "question": "How should multi-tenant RAG data be partitioned across Vertex AI Search datastores and indexes?",
    "door": "one-way",
    "doorNote": "Reorganizing data between shared datastores, dedicated datastores and dedicated Google Cloud projects requires migrating live data and re-indexing.",
    "why": "Tenant isolation is both a security guarantee and an economic trade-off. A Vertex AI Search datastore incurs operational commitments and index management overhead. Creating a datastore per tenant for thousands of small tenants causes administrative sprawl. Conversely, a shared datastore requires flawless document-level ACL security filtering.",
    "cols": [
      "Model",
      "Isolation Mechanism",
      "Cost per Tenant",
      "Noisy Neighbor Protection",
      "Best Production Fit"
    ],
    "rows": [
      [
        "Shared Datastore (Logical)",
        "Every document tagged with `tenant_id`; query proxy injects filter",
        "Lowest (pennies/mo per tenant)",
        "Low (shared indexing and search capacity)",
        "Standard B2B SaaS with hundreds or thousands of low-tier tenants"
      ],
      [
        "Datastore per Tenant (Shared Project)",
        "Dedicated Vertex AI Search datastore per customer inside a shared GCP project",
        "Moderate (constrained by datastore quotas per project)",
        "Medium (datastore-level isolation, shared project compute)",
        "Mid-market tiers (50-200 tenants) requiring distinct schemas or fast deletion"
      ],
      [
        "Project per Tenant (Physical Isolation)",
        "Dedicated Google Cloud Project per tenant managed via Google Cloud Resource Manager",
        "Highest ($500-$2,000+/mo per tenant)",
        "Complete physical and regulatory isolation",
        "Enterprise tier customers paying premium for isolated infrastructure"
      ],
      [
        "VPC-SC Perimeter per Tenant",
        "Dedicated VPC Service Controls perimeter isolating tenant storage and compute",
        "High (administrative overhead)",
        "Strict isolation against data exfiltration",
        "Government, defense, and highly regulated banking tiers"
      ]
    ],
    "rules": [
      [
        "Serving SMB/standard B2B customers where cost per tenant must stay under $5/month",
        "Use Shared Datastore with mandatory backend `tenant_id` filter injection. Never trust client filters."
      ],
      [
        "Enterprise customers mandate contractual physical data and compute isolation",
        "Provide Dedicated Project with [[vpc-sc]] as a premium priced tier."
      ],
      [
        "Customers require one-click instant data deletion (GDPR Article 17 / Right to be Forgotten)",
        "Use Datastore-per-Tenant. Deleting an entire datastore is atomic and instantaneous."
      ],
      [
        "Tenants require custom embedding models or distinct document schemas",
        "Use Datastore-per-Tenant or Project-per-Tenant."
      ]
    ],
    "redflags": [
      "Relying on client-side frontend code to supply the `tenant_id` search filter.",
      "Creating a Vertex AI Search app per tenant for 500 low-paying customers, creating massive administrative sprawl.",
      "Failing to test cross-tenant query leakage in automated CI regression test suites.",
      "Caching semantic search results without incorporating tenant ID into cache keys."
    ],
    "ask": [
      "What are our contractual data isolation commitments with each customer tier?",
      "How does the application backend authenticate and inject the caller tenant ID into search queries?",
      "Do we have automated integration tests verifying that Tenant A cannot retrieve Tenant B documents?",
      "How is tenant data purged when a customer cancels their subscription?"
    ],
    "revisit": "When customer tiering strategy changes, when enterprise sales demands dedicated isolation, or when tenant count exceeds 1,000.",
    "related": [
      "ai-search",
      "iam",
      "kms",
      "vpc-sc"
    ],
    "em": {
      "call": "Adopt a hybrid model: Shared Datastore for standard tiers; Dedicated Project / Perimeter for high-ACV enterprise contracts with dedicated pricing.",
      "own": [
        "Packaging and pricing strategy for dedicated enterprise isolation.",
        "Legal and compliance sign-off on logical versus physical data separation."
      ],
      "evidence": [
        "Unit economics model showing infrastructure cost per tenant across shared and dedicated architectures.",
        "Customer contracts audit verifying data isolation requirements."
      ]
    },
    "pe": {
      "call": "Enforce tenant filter injection in a trusted API gateway proxy using verified [[iam]] identity tokens; test cross-tenant boundary security in CI.",
      "own": [
        "Security filter injection logic, datastore naming conventions, and cache key partitioning.",
        "Automated cross-tenant penetration test suite running in build pipelines."
      ],
      "evidence": [
        "Automated test execution report proving zero query leakage across 1,000 randomized cross-tenant search requests.",
        "Code review of the search proxy confirming no direct client search access."
      ]
    }
  },
  {
    "id": "workflow-vs-agent",
    "theme": "strategy",
    "lead": "both",
    "title": "Deterministic workflow vs autonomous agent: what to choose?",
    "question": "When should a business process use deterministic application code and workflows versus an autonomous AI agent?",
    "door": "two-way",
    "doorNote": "Workflows and agents can be composed together: an agent can invoke a Cloud Workflows execution as a tool, or a workflow can invoke an agent for unstructured reasoning.",
    "why": "An autonomous agent is non-deterministic: it decides which steps to take, which tools to call, and when it is finished. For deterministic business processes (payroll, regulatory compliance, transaction processing), autonomous agents introduce unacceptable variance, cost, and failure modes. Google Cloud advises workflows for predefined execution paths and agents for open-ended problem solving.",
    "cols": [
      "Pattern",
      "Control Flow",
      "Predictability & Auditing",
      "Error Recovery",
      "Best Production Fit"
    ],
    "rows": [
      [
        "Deterministic Code / Script",
        "Hardcoded if/else branches, static function calls",
        "100% predictable; strict unit testing",
        "Standard try/catch; explicit error codes",
        "CRUD operations, data migrations, math calculations"
      ],
      [
        "State Machine ([[workflows]])",
        "Declarative YAML/JSON state graph, retries, branching, human approval tasks",
        "100% predictable state flow; full visual execution audit",
        "Configured catch blocks, exponential backoff, dead-letter topics",
        "Order fulfillment, multi-step approvals, ETL pipelines"
      ],
      [
        "Workflow with LLM Steps",
        "Deterministic workflow where specific steps invoke Gemini for extraction or summarization",
        "Predictable structure; bounded non-deterministic content within steps",
        "Step retries with temperature adjustment; fallback prompts",
        "Invoice processing, support ticket triage, content moderation"
      ],
      [
        "Autonomous Agent ([[agent-runtime]])",
        "Gemini dynamically plans sequence of tool invocations based on intermediate results",
        "Non-deterministic step order; variable latency and token spend",
        "Model reflection, re-planning, human-in-the-loop intervention",
        "Open-ended research, troubleshooting diagnostics, exploratory analytics"
      ]
    ],
    "rules": [
      [
        "The sequence of business steps is known in advance",
        "Use a deterministic workflow ([[workflows]]). Never use an autonomous agent."
      ],
      [
        "The task requires writing to transactional databases, moving money, or irreversible actions",
        "Use a workflow with explicit human approval gates."
      ],
      [
        "The sequence of steps depends entirely on what is discovered at runtime (e.g. diagnosing an unknown system error)",
        "Use an autonomous agent with [[agent-runtime]] or [[adk]]."
      ],
      [
        "The team wants autonomous reasoning inside a regulated business flow",
        "Decompose: make the workflow deterministic at the top level, and delegate bounded sub-tasks to agents."
      ]
    ],
    "redflags": [
      "Building an autonomous agent to perform an 8-step process that always follows the exact same 8 steps.",
      "Relying on prompt instructions to guarantee that an autonomous agent never skips a mandatory compliance step.",
      "Allowing an autonomous agent to execute database write operations without human approval or strict schema constraints.",
      "Failing to set hard caps on agent execution time and maximum tool invocation loops."
    ],
    "ask": [
      "Can the business process be diagrammed as a finite state machine with known branches?",
      "What is the acceptable variance in execution steps, latency, and cost per task?",
      "What happens if the agent executes steps in an unexpected order?",
      "Are irreversible actions protected by deterministic code constraints rather than prompt guidelines?"
    ],
    "revisit": "When deterministic workflows become too brittle due to thousands of edge cases, or when agent reliability improves on benchmarks.",
    "related": [
      "workflows",
      "agent-runtime",
      "adk",
      "cloud-run"
    ],
    "em": {
      "call": "Default to deterministic workflows with embedded AI calls. Approve autonomous agents only where dynamic step planning is proven essential.",
      "own": [
        "Business risk sign-off on non-deterministic process execution.",
        "Budget control (workflows have fixed costs; autonomous agents have variable token spend)."
      ],
      "evidence": [
        "Process flow analysis demonstrating why static branching cannot satisfy the requirements.",
        "Cost and latency variance analysis from prototype runs."
      ]
    },
    "pe": {
      "call": "Use [[workflows]] for system orchestration and state management; treat [[agent-runtime]] as specialized workers invoked for open-ended reasoning.",
      "own": [
        "Workflow state machine definitions, tool interface schemas, and timeout/circuit-breaker configuration.",
        "Loop detection and execution budget enforcement on autonomous sub-agents."
      ],
      "evidence": [
        "Execution trace comparison showing state machine reliability versus autonomous agent variability.",
        "Chaos testing demonstrating that agent failure is safely contained by the parent workflow."
      ]
    }
  },
  {
    "id": "model-deployment-capacity",
    "theme": "strategy",
    "lead": "em",
    "title": "Model deployment and Google Cloud capacity decision matrix",
    "question": "Which Google Cloud model deployment type, throughput tier and capacity strategy fits your workload, latency SLA and budget?",
    "door": "mixed",
    "doorNote": "Switching between Pay-As-You-Go and Provisioned Throughput takes minutes in the console, but Provisioned Throughput requires minimum 1-month commitments.",
    "why": "Running out of model capacity or hitting HTTP 429 quota errors is the #1 cause of failed generative AI launches. Google Cloud offers multiple deployment options (Pay-As-You-Go, Provisioned Throughput, Batch Prediction, and Self-Hosted on GKE) with vastly different throughput guarantees, pricing, regional availability and data residency rules.",
    "cols": [
      "Deployment Option",
      "Throughput Guarantee",
      "Pricing Model",
      "Data Residency",
      "Best Production Fit"
    ],
    "rows": [
      [
        "Gemini Pay-As-You-Go",
        "Shared capacity pool; subject to project TPM/RPM quotas and 429 errors",
        "Pay-per-character / pay-per-token (input/output)",
        "Selected Google Cloud Region or multi-region",
        "Prototypes, pilots, variable internal tools, developer sandboxes"
      ],
      [
        "Provisioned Throughput",
        "Guaranteed reserved throughput units; zero 429 throttling within limit",
        "Fixed hourly commitment (1-month or 1-year term commitment)",
        "Dedicated reserved capacity in selected Region",
        "Mission-critical customer applications with steady 24/7 volume and P99 latency SLAs"
      ],
      [
        "Batch Prediction",
        "Asynchronous offline execution completed within 24 hours",
        "50% discount compared to Pay-As-You-Go token pricing",
        "Selected Google Cloud Region",
        "Bulk document re-indexing, offline evaluations, nightly summarization"
      ],
      [
        "Self-Hosted on [[gke|GKE]] (vLLM)",
        "Dedicated TPU v5e/v5p or GPU (H100/L4) nodes; full control over inference runtime",
        "Hourly node compute billing regardless of query volume",
        "Strict single-cluster locality in private VPC",
        "Self-hosted open-weight models (Gemma 2, Llama 3), custom C++ serving runtimes"
      ]
    ],
    "rules": [
      [
        "Workload has predictable, high 24/7 query volume (>100 tokens/sec continuous) and requires strict P99 latency",
        "Purchase Gemini Provisioned Throughput."
      ],
      [
        "Workload is user-facing with variable burst traffic, and geographic compliance allows multi-region routing",
        "Use multi-region Gemini endpoints to mitigate 429 throttling."
      ],
      [
        "Processing large offline datasets that do not require immediate responses (nightly report generation)",
        "Use Vertex AI Batch Prediction for an immediate 50% cost reduction."
      ],
      [
        "Team requires custom Gemma fine-tunes or specialized C++ serving optimizations not offered via API",
        "Deploy dedicated [[gke|GKE clusters]] with TPU or GPU accelerators."
      ]
    ],
    "redflags": [
      "Launching a high-visibility marketing campaign on Pay-As-You-Go without requesting quota increases 4 weeks prior.",
      "Purchasing 1-year Provisioned Throughput commitments before measuring steady-state production baseline volume.",
      "Failing to implement exponential backoff and jitter in client SDKs for handling transient 429 ResourceExhausted errors.",
      "Ignoring prompt caching economics on repeated long context queries."
    ],
    "ask": [
      "What is our projected peak Tokens Per Minute (TPM) and Requests Per Minute (RPM) at launch?",
      "Does our enterprise data sovereignty policy permit multi-region endpoint failover?",
      "At what steady-state token volume does Provisioned Throughput become cheaper than Pay-As-You-Go?",
      "Do we have an automated failover pool configured across multiple model versions or regions?"
    ],
    "revisit": "Quarterly when usage doubles, when new model generations launch, or when Google Cloud introduces new pricing tiers.",
    "related": [
      "gemini",
      "ap-inference",
      "gke",
      "apigee"
    ],
    "em": {
      "call": "Prototype on Gemini Pay-As-You-Go; commit to Provisioned Throughput only when baseline volume justifies the monthly cost.",
      "own": [
        "Monthly capacity budget and financial commitment sign-offs.",
        "Service Quota increase requests submitted 4 weeks prior to major launch events."
      ],
      "evidence": [
        "Traffic model forecasting average and peak TPM/RPM requirements.",
        "FinOps break-even analysis comparing Pay-As-You-Go token spend against Provisioned Throughput commitments."
      ]
    },
    "pe": {
      "call": "Configure client SDKs with exponential backoff and jitter; route traffic through [[apigee]] with multi-region Gemini endpoint fallback pools.",
      "own": [
        "Capacity monitoring, rate-limit metric tracking in [[cloud-monitoring]], and retry policy implementation.",
        "Model abstraction layer enabling dynamic routing between standard and provisioned deployments."
      ],
      "evidence": [
        "Load-test report demonstrating client behavior during simulated 429 throttling bursts.",
        "Telemetry dashboard tracking token consumption against service quota thresholds in real time."
      ]
    }
  }
];
