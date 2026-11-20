/* Atlas playbooks added in the engineering-depth upgrade (plan tasks RAG-*, AGT-*, SEC-*, REL-*, EVAL-*).
   Same schema as data/playbooks.js, plus optional fields rendered by pagePlaybook():
     glance   { purpose, triggers[], roles[], artefacts[], exit[] }   the "at a glance" box
     section.table { cols[], rows[][] }                                 tables (row length must equal cols length)
     section.code  string                                              a preformatted block
     lastReviewed  ISO date the guidance was last edited by a person or agent (NOT a verification of Google facts)
   `see` refs: svc:<id> arch:<id> dec:<id> pb:<id> lab:<id> tool:<id> page:<id>
   All of this is Atlas guidance, not an official Google recommendation. */
(function () {
  var add = [
{
  "id": "rag-lifecycle-controls",
  "title": "RAG Lifecycle Controls: Ownership, Access Control, Freshness and Deletion",
  "badge": "Atlas guidance",
  "tag": "Every stage from source to answer needs an owner, a control and a test, especially the stages that fail silently.",
  "intro": "Use this playbook after choosing a retrieval approach and before calling a RAG system production-ready. It complements the RAG Engineering Playbook by focusing on **who owns each stage, how access control survives retrieval, and what 'deleted' actually means**. It is Atlas guidance, not an official Google recommendation. Product behaviour (limits, regions, features) must be confirmed in current official documentation before you depend on it.",
  "glance": {
    "purpose": "Give every stage of a RAG system an owner, a control and a test, and make access control, freshness and deletion demonstrable.",
    "triggers": [
      "Designing a new RAG system or reviewing an existing one",
      "Moving from pilot to production",
      "A leak, a stale answer or a deletion request has occurred",
      "Adding a new source system or a new tenant"
    ],
    "roles": [
      "Product owner (use case, sources)",
      "Data owner (source quality, ACLs)",
      "ML or platform engineer (pipeline, index)",
      "Security (identity, threat model)",
      "SRE (SLOs, runbooks)",
      "Engineering manager (release gate)"
    ],
    "artefacts": [
      "Lifecycle ownership table",
      "ACL and tenancy model",
      "Deletion procedure with an audit record",
      "Reconciliation report",
      "RAG evaluation set and gate"
    ],
    "exit": [
      "Every stage has a named owner and at least one test",
      "A cross-tenant and revoked-user leakage test passes and runs in CI",
      "Deletion has been demonstrated end to end, including caches and derived content",
      "A freshness objective is defined and measured"
    ]
  },
  "sections": [
    {
      "title": "1. The lifecycle, stage by stage, with an owner",
      "body": "A RAG answer is only as trustworthy as the weakest stage behind it. The common failure is a stage with no owner: parsing quality, permission sync and deletion are rarely anyone's job until something goes wrong.",
      "table": {
        "cols": [
          "Stage",
          "What happens",
          "Typical owner",
          "Control to put in place",
          "Failure it prevents"
        ],
        "rows": [
          [
            "Source onboarding",
            "A system or repository is approved as a source",
            "Data owner",
            "Source register with owner, classification, ACL model and refresh method",
            "Unknown or unowned content in the index"
          ],
          [
            "Ingestion",
            "Content is fetched or pushed into the pipeline",
            "Platform engineer",
            "Idempotent jobs, checkpoints, dead-letter handling, change detection",
            "Missed updates, duplicates, silent gaps"
          ],
          [
            "Parsing and normalisation",
            "Files become clean text, tables and structure",
            "ML engineer",
            "Parse-quality sample review per source type, lineage to page and offset",
            "Flattened tables, lost headings, garbled scans"
          ],
          [
            "Chunking and metadata",
            "Text is split and tagged",
            "ML engineer",
            "Chunk strategy tested on your questions; required metadata schema",
            "Answers split across chunks, missing ACLs"
          ],
          [
            "Embedding and indexing",
            "Chunks become vectors and lexical terms",
            "Platform engineer",
            "Versioned index, recorded embedding model, build validation",
            "Mixed embedding versions, partial builds"
          ],
          [
            "Query understanding",
            "The question is rewritten, expanded or routed",
            "ML engineer",
            "Logged rewrites, a test set for routing",
            "Rewrites that change the question's meaning"
          ],
          [
            "Retrieval and fusion",
            "Lexical and vector results are combined and filtered",
            "ML engineer",
            "Pre-filter by identity, measured recall@k",
            "Leakage, missed evidence"
          ],
          [
            "Reranking",
            "Candidates are re-ordered",
            "ML engineer",
            "Measured gain against latency and cost",
            "Latency spent for no quality gain"
          ],
          [
            "Context assembly",
            "Evidence is selected, deduplicated and ordered",
            "ML engineer",
            "Token budget, dedupe, source labels",
            "Context stuffing, duplicate evidence"
          ],
          [
            "Generation and citation",
            "The model answers from the evidence",
            "Product owner",
            "Groundedness and citation checks, abstention path",
            "Unsupported claims, fake citations"
          ],
          [
            "Feedback and re-indexing",
            "Signals trigger fixes and rebuilds",
            "Product owner and platform engineer",
            "Feedback triage, re-index procedure with rollback",
            "Known errors that never get fixed"
          ]
        ]
      }
    },
    {
      "title": "2. Ingestion modes and when to use each",
      "body": "Choose the refresh mode from how fast the source changes and what a stale answer costs, not from what is easiest to build. Mixed estates usually need more than one mode. Google Cloud building blocks such as [[pubsub|Pub/Sub]], [[eventarc|Eventarc]] and [[dataflow|Dataflow]] can carry events and pipelines; confirm current capabilities in their documentation.",
      "table": {
        "cols": [
          "Mode",
          "Use when",
          "Watch out for"
        ],
        "rows": [
          [
            "Batch full refresh",
            "Small, slow-changing corpus; simplest correct option",
            "Cost and time grow with corpus size; deletions are implicit, so verify them"
          ],
          [
            "Incremental (change detection)",
            "Large corpus where few items change; you can detect changes by modified time or content hash",
            "Unreliable timestamps; moves and renames look like delete plus add"
          ],
          [
            "Event-driven",
            "Source can emit events (for example object created or updated)",
            "Event loss and reordering; you still need periodic reconciliation"
          ],
          [
            "Streaming or change data capture",
            "Operational databases where freshness is measured in seconds or minutes",
            "Schema changes, ordering, and the cost of re-embedding frequently changing rows"
          ],
          [
            "Scheduled refresh",
            "Sources with no change signal",
            "Windows of staleness; load spikes at the schedule"
          ],
          [
            "Backfill and replay",
            "New index, new embedding model, parser fix",
            "Do it into a new index version and switch over; never mutate the live one in place"
          ],
          [
            "Deletion",
            "Source delete, retention expiry, takedown, access removal",
            "Treat as a first-class event with its own tests (section 6)"
          ]
        ]
      }
    },
    {
      "title": "3. Parsing: what breaks and what to measure",
      "body": "Parsing decides what the model can ever see. Parser behaviour depends on your documents, so evaluate on your own files and keep the findings as part of the source register. [[document-ai|Document AI]] and multimodal models are options for layout-aware extraction; their accuracy on your content is something to measure, not assume.",
      "bullets": [
        "**Know the failure modes per format:** multi-column PDFs read out of order, tables flattened to text, headers and footers repeated into every chunk, scanned pages with OCR errors, images and diagrams with no text, spreadsheets with merged cells.",
        "**Sample and review:** read a random set of parsed outputs per source type, side by side with the originals, before indexing the whole source. Record what you found.",
        "**Keep lineage:** every chunk carries document id, version, page or section, and character offsets so a citation can point at the exact evidence and a deletion can find every derived piece.",
        "**Measure parse fidelity where it matters:** for tables, check a sample of cell values; for scans, check a sample of key fields. Treat a parser change as a change that needs re-evaluation.",
        "**State limits to users:** if a source type parses poorly (for example handwriting), say so in the product instead of returning confident wrong answers."
      ]
    },
    {
      "title": "4. Chunking and metadata",
      "body": "There is no best chunk size. The right strategy depends on document structure and on the questions people ask. Test candidates on your own evaluation set (see the Evaluation playbook) and compare recall and answer quality, not intuition. The decision guide on chunking strategy gives the trade-offs for the common choices.",
      "table": {
        "cols": [
          "Strategy",
          "Strength",
          "Weakness"
        ],
        "rows": [
          [
            "Fixed size",
            "Simple, predictable cost",
            "Cuts through sentences and tables"
          ],
          [
            "Recursive (by separators)",
            "Respects paragraphs where possible",
            "Still blind to document structure"
          ],
          [
            "Sentence or paragraph",
            "Natural units; good for prose",
            "Very small units lose context"
          ],
          [
            "Structure-aware (headings, sections, tables)",
            "Keeps meaning with its heading; good for manuals and policies",
            "Needs reliable structure from the parser"
          ],
          [
            "Semantic (split at topic shifts)",
            "Coherent chunks",
            "Extra compute; behaviour depends on the embedding model"
          ],
          [
            "Parent-child (retrieve small, return larger)",
            "Precise match, richer context",
            "More storage and more moving parts; context can grow"
          ],
          [
            "Contextual (prepend a document summary or heading path to each chunk)",
            "Chunks stay interpretable on their own",
            "Extra generation cost at ingest; summaries can be wrong"
          ]
        ]
      },
      "bullets": [
        "**Overlap** helps when meaning spans a boundary but duplicates content, inflates the index and can return near-identical evidence. Use the smallest overlap that fixes a measured problem.",
        "**Required metadata per chunk:** document id, version, source URI, tenant, ACL or group list, classification, page or section, updated-at, content hash, and the pipeline version that produced it. Without these, access control, freshness and deletion cannot be implemented."
      ]
    },
    {
      "title": "5. Access control that survives retrieval",
      "body": "A model or a prompt cannot enforce authorization. Authorization has to be applied by the retrieval layer using the **caller's** identity, before ranking, and it has to hold in caches, derived content and logs. The decision guides on index tenancy and tenancy model compare isolation options.",
      "bullets": [
        "**Propagate the end user's identity** to retrieval, not only the application's service identity. If everything runs as one service account, the system can only enforce what that account is allowed to see.",
        "**Filter before ranking.** Pre-filtering by tenant and group means hidden documents cannot affect ranking, term statistics or timing. Filtering after retrieving the top k can return too few results and can leak through scores or counts. (The RAG evaluation lab applies this order and tests it.)",
        "**Choose the isolation level deliberately:** a shared index with metadata filters is cheaper but relies on the filter being right every time; an index or project per tenant costs more and isolates failures. Regulated or high-impact data often justifies stronger isolation.",
        "**Derived content inherits the source's ACL:** summaries, embeddings, extracted entities, graph edges and evaluation copies are all copies of the data.",
        "**Cache keys include identity and ACL scope.** A cache keyed only by the query text will serve one user's answer to another. Test it.",
        "**Permission changes must propagate:** define how quickly a revocation reaches the index (an objective, measured), and what happens in the gap.",
        "**Citations and logs follow the same rules:** do not show or log content the caller could not read."
      ],
      "tips": [
        "Write the leakage tests first: cross-tenant, revoked user, group change, shared cache, and a user who should get no results. Run them in CI. A passing normal-path test says nothing about leakage.",
        "Do not let a model decide whether a user may see a document. Use it only on content already authorised."
      ]
    },
    {
      "title": "6. Freshness and deletion semantics",
      "body": "'Deleted' must be defined, or it means different things to different teams. A defensible definition covers the index, every derived artefact and every cache, with evidence. If a legal deletion obligation applies to you, ask your legal team what it requires; this playbook is not legal advice.",
      "table": {
        "cols": [
          "Event",
          "Required behaviour",
          "Evidence to keep"
        ],
        "rows": [
          [
            "Source updated",
            "New version indexed; old version no longer returned; caches invalidated",
            "Source version to index version mapping; freshness measurement"
          ],
          [
            "Source deleted or access removed",
            "Tombstone immediately so it is never returned; then physical removal from index, derived content and caches",
            "Deletion record with time, actor and the list of stores cleaned"
          ],
          [
            "Retention expiry",
            "Same as delete, driven by the retention schedule",
            "Scheduled job log and a sample verification"
          ],
          [
            "Reconciliation",
            "Compare the source of truth with the index on a schedule; report orphans (indexed but gone from source) and missing (in source but not indexed)",
            "Reconciliation report and its follow-up"
          ],
          [
            "Re-index or model change",
            "Build a new index version, evaluate, switch, keep rollback",
            "Evaluation comparison and the switch record"
          ]
        ]
      },
      "bullets": [
        "**Define 'deletion complete':** the document is absent from the primary index, from replicas and backups per your policy, from derived content (chunks, embeddings, summaries, graph), from caches, and from evaluation and test copies; logs follow the retention rules for logs.",
        "**Define a freshness objective:** time from source change to searchable, per source. Measure it with canary documents that you change on purpose and watch appear.",
        "**Make deletion auditable:** an operator should be able to prove, for a given document id, when it was removed from each store."
      ]
    },
    {
      "title": "7. Failure modes",
      "table": {
        "cols": [
          "Failure",
          "Symptom",
          "Detection",
          "Response"
        ],
        "rows": [
          [
            "Empty retrieval",
            "No evidence for a valid question",
            "Rate of empty results per source and per query class",
            "Abstain with a clear message; investigate coverage"
          ],
          [
            "Irrelevant evidence",
            "Answers cite unrelated passages",
            "Context relevance on sampled traffic; low recall@k on the eval set",
            "Tune retrieval and reranking; improve chunking and metadata"
          ],
          [
            "Poisoned document",
            "Content crafted to steer the model",
            "Source review, anomaly checks on new content, red-team cases",
            "Quarantine, remove, find sibling documents; restrict who can add sources"
          ],
          [
            "Indirect prompt injection in retrieved content",
            "Model follows instructions found in a document",
            "Injection test cases; policy-violation logs",
            "Treat retrieved text as untrusted data; constrain tools; screen inputs and outputs. Pattern matching alone is not a defence"
          ],
          [
            "Stale chunk",
            "Outdated answer",
            "Freshness canaries; version checks on cited sources",
            "Re-index; show document date in citations"
          ],
          [
            "Duplicate evidence",
            "Same passage repeated, crowding out others",
            "Duplicate rate in assembled context",
            "Deduplicate by content hash or near-duplicate rules before assembly"
          ],
          [
            "Malformed parsing",
            "Garbled or missing text",
            "Parse sampling; spikes in empty or very short chunks",
            "Fix the parser; re-ingest into a new index version"
          ],
          [
            "Index outage",
            "Errors or timeouts from retrieval",
            "Availability and latency SLIs",
            "Fail closed or degrade as designed; never answer from the model alone without saying so for questions that require grounding"
          ],
          [
            "Permission-filter failure",
            "Missing filter, wrong tenant, filter error",
            "Leakage tests in CI and synthetic canary users in production",
            "Fail closed: return nothing and alert. Treat as a security incident"
          ]
        ]
      }
    },
    {
      "title": "8. Where added complexity is justified",
      "body": "These patterns come from published research and community practice. They are options, not defaults. Add one only when your evaluation set shows the baseline failing in the way the pattern addresses, and re-measure after adding it. Confirm that your framework or managed service actually supports a pattern before planning around it.",
      "table": {
        "cols": [
          "Pattern",
          "What it adds",
          "Use when",
          "Avoid when"
        ],
        "rows": [
          [
            "Hybrid retrieval with rank fusion",
            "Lexical plus vector results combined (for example by reciprocal rank fusion)",
            "Queries include exact terms, codes or names that embeddings blur",
            "The corpus is small and vector-only already meets your recall target"
          ],
          [
            "Query rewriting, decomposition, expansion",
            "Better matches for vague or multi-part questions",
            "Users ask compound or underspecified questions",
            "Rewrites change meaning and you cannot detect it"
          ],
          [
            "Reranking",
            "Re-orders candidates with a stronger model",
            "Recall@k is fine but precision at the top is poor",
            "Latency or cost budget is tight and the gain is small"
          ],
          [
            "Iterative or multi-hop retrieval",
            "Follow-up retrieval using earlier findings",
            "Answers need facts from several linked documents",
            "Single-passage questions dominate"
          ],
          [
            "Corrective RAG (CRAG)",
            "Evaluates retrieval quality and triggers a corrective step such as re-retrieval",
            "Retrieval quality varies a lot by query",
            "You have no reliable retrieval-quality signal"
          ],
          [
            "Self-RAG",
            "The model decides when to retrieve and critiques its own output",
            "You control the model and need on-demand retrieval",
            "You rely on a managed model without that capability"
          ],
          [
            "Adaptive or routed RAG",
            "Chooses a strategy by query type or complexity",
            "Mixed traffic with clearly different query classes",
            "One strategy is already good for all measured classes"
          ],
          [
            "Hierarchical retrieval (for example RAPTOR-style summary trees)",
            "Retrieves at several levels of abstraction",
            "Questions about themes across very long documents",
            "Questions are about specific facts"
          ],
          [
            "GraphRAG",
            "Entity and relationship graph, sometimes with community summaries",
            "Answers depend on relationships across entities",
            "Answers come from one or two passages; the graph is costly to build and maintain"
          ],
          [
            "Temporal RAG",
            "Time-aware retrieval and versioning",
            "The right answer depends on 'as of' dates",
            "Content is not versioned"
          ],
          [
            "Confidence-aware abstention",
            "Declines when evidence is weak",
            "A wrong answer costs more than no answer",
            "You cannot calibrate confidence on your data"
          ]
        ]
      }
    }
  ],
  "see": [
    "arch:traditional-rag",
    "arch:agentic-rag",
    "arch:graph-rag",
    "arch:secure-multitenant-rag",
    "dec:index-tenancy",
    "dec:tenancy",
    "dec:chunking-strategy",
    "dec:vector-hybrid-search",
    "dec:reranking-tradeoff",
    "dec:graphrag-vs-vector",
    "dec:vector-store",
    "svc:document-ai",
    "svc:ai-search",
    "svc:rag-engine",
    "svc:vector-search",
    "svc:pubsub",
    "svc:eventarc",
    "svc:dataflow",
    "svc:iam",
    "svc:sdp",
    "pb:eval-datasets-gates",
    "pb:identity-threat-model",
    "pb:nfr-reliability",
    "pb:data-engineering",
    "lab:rag-eval"
  ],
  "lastReviewed": "2026-11-20"
},
{
  "id": "agent-bounded-design",
  "title": "Bounded Agents: Contracts, State, Budgets and Autonomy Levels",
  "badge": "Atlas guidance",
  "tag": "Make an agent workflow stop, stay inside its permissions, and recover, before making it clever.",
  "intro": "Use this playbook when designing or reviewing any tool-using agent or multi-agent workflow. It deepens the Multi-Agent Engineering Playbook with the mechanics that decide whether a system is safe to run unattended: contracts, state, budgets, retries, approvals and failure handling. It is Atlas guidance, not an official Google recommendation, and the autonomy levels below are an **Atlas framework, not a Google standard**. The runnable lab *Bounded agent* implements the controls described here.",
  "glance": {
    "purpose": "Define the contracts, limits and human checkpoints that make an agent workflow bounded, debuggable and recoverable.",
    "triggers": [
      "Designing an agent, tool or multi-agent workflow",
      "Proposing multi-agent over a simpler design",
      "Raising an agent's autonomy or giving it a new tool",
      "After an incident involving a loop, a runaway cost or an unwanted action"
    ],
    "roles": [
      "Engineering manager (autonomy decision, release gate)",
      "Principal engineer (architecture, contracts)",
      "AI engineer (implementation, evals)",
      "Security (tool permissions, identity)",
      "Product owner (what needs approval)",
      "SRE (budgets, alerts, runbooks)"
    ],
    "artefacts": [
      "Design choice record (workflow, single agent or multi-agent) with justification",
      "Task contract per agent or hop",
      "Tool permission register",
      "Budget and stop-condition table",
      "Autonomy level decision with evidence",
      "Trajectory evaluation set"
    ],
    "exit": [
      "Every loop has at least two independent stop conditions that are tested",
      "Every tool has a schema, a timeout, an allow-list entry, an owner and an audit record",
      "Risky actions have an explicit approval path with a safe default",
      "Failure paths (outage, bad arguments, injection, budget exhaustion, crash and resume) are tested"
    ]
  },
  "sections": [
    {
      "title": "1. Start with the cheapest design that works",
      "body": "More autonomy means more variance, more cost and more to secure. Pick the least autonomous design that meets the requirement, and write down why a simpler one was rejected. The decision guides on workflow versus agent and on autonomy level carry the detailed trade-offs.",
      "table": {
        "cols": [
          "Design",
          "Use when",
          "Cost of being wrong",
          "Prefer it when"
        ],
        "rows": [
          [
            "Deterministic workflow with model calls inside fixed steps",
            "The steps are known and stable; the model transforms or classifies",
            "Low and predictable",
            "You can write the flow down; this is the default"
          ],
          [
            "Single agent with a small tool set",
            "The next step depends on what was found, but one capable loop can handle it",
            "Medium; cost and latency vary per run",
            "Variable paths, a few tools, one owner"
          ],
          [
            "Multi-agent (supervisor and specialists, or peers)",
            "Specialisation, parallel work, or isolation of permissions or context demonstrably helps and was measured against a single agent",
            "Highest; failures compound across hops",
            "Only with an evaluation showing it beats the simpler design"
          ]
        ]
      },
      "tips": [
        "If you cannot say what a second agent does that a second tool or a second prompt could not, you do not need a second agent.",
        "Record the choice as an ADR so a later team can see why it was made and what evidence would reverse it."
      ]
    },
    {
      "title": "2. A shared vocabulary",
      "body": "Teams argue less when terms mean one thing. Use these consistently in designs and reviews.",
      "bullets": [
        "**Model:** the language model that proposes the next action.",
        "**Instructions:** the system prompt and policies that frame the model.",
        "**Tools:** functions the system can execute for the model, each with a schema and permissions.",
        "**State:** the typed record of what has happened in this run.",
        "**Memory:** information kept across runs; has its own retention and access rules.",
        "**Planner and executor:** the part that decides the next step, and the part that carries it out.",
        "**Orchestrator:** the code that runs the loop, enforces budgets and routes between agents.",
        "**Policy:** rules checked by code, outside the model, before any action.",
        "**Evaluator:** a component or test that scores a result or trajectory.",
        "**Human approval:** a checkpoint where a person must allow an action.",
        "**External system:** anything outside the agent that has side effects or holds data."
      ]
    },
    {
      "title": "3. Task contracts between agents",
      "body": "A contract turns 'the supervisor asks a worker' into something that can be validated and tested. Validate it in code at every hop, not in the prompt.",
      "table": {
        "cols": [
          "Field",
          "Purpose",
          "Example"
        ],
        "rows": [
          [
            "goal",
            "What 'done' means in one sentence",
            "Decide a refund for one order and notify the customer"
          ],
          [
            "inputSchema",
            "Reject malformed requests before any work",
            "orderId: string, at most 20 characters"
          ],
          [
            "outputSchema",
            "Reject malformed or incomplete results",
            "refunded: boolean; notified: boolean; evidence: list"
          ],
          [
            "owner",
            "Who is accountable and who gets paged",
            "support-automation team"
          ],
          [
            "deadline",
            "Wall-clock limit for this task",
            "A number agreed with the caller, not a universal default"
          ],
          [
            "allowedTools",
            "The allow-list for this task only",
            "lookup_order, check_policy, issue_refund, notify_customer"
          ],
          [
            "evidenceRequired",
            "What must be gathered before acting",
            "Order record and policy check"
          ],
          [
            "errorSchema",
            "A fixed shape for failures so callers can react",
            "code, retryable flag, message"
          ],
          [
            "completionCriteria",
            "Checkable conditions for success",
            "Refund issued only if eligible; customer notified once"
          ]
        ]
      }
    },
    {
      "title": "4. State, checkpoints and resumption",
      "bullets": [
        "**Typed, versioned state.** Define the state schema, put a version in it, and reject state you do not recognise. When the schema changes, migrate explicitly.",
        "**Checkpoint after every completed step**, especially before and after side effects, so a crash resumes instead of restarting.",
        "**Make side-effecting steps idempotent.** Resume, retry and crash recovery will repeat calls. An idempotency key on writes makes a repeat harmless. The lab tests a crash before the checkpoint is saved for exactly this reason.",
        "**Separate state from memory.** State belongs to one run and is discarded or archived; memory persists across runs and needs retention, deletion and access rules. See [[agent-memory|Sessions and Memory Bank]] for the managed option and verify its current behaviour.",
        "**Define the session lifecycle:** creation, expiry, resumption window, and what happens to in-flight work at expiry.",
        "**Keep state small and free of secrets.** Store references to large or sensitive data, not copies."
      ]
    },
    {
      "title": "5. Orchestration patterns",
      "table": {
        "cols": [
          "Pattern",
          "Control flow",
          "Use when",
          "Anti-pattern"
        ],
        "rows": [
          [
            "Sequential",
            "A then B then C",
            "Stages depend on each other",
            "Chaining agents where one function would do"
          ],
          [
            "Parallel fan-out and fan-in",
            "Run independent tasks together, then merge",
            "Independent sub-questions or sources",
            "Merging without a rule for conflicts or for a failed branch"
          ],
          [
            "Planner and executor",
            "One component plans, another executes steps",
            "Long tasks where the plan can be inspected or approved",
            "Letting the plan grow without a step limit"
          ],
          [
            "Supervisor and workers",
            "A supervisor delegates to specialists and combines results",
            "Distinct skills or permissions per specialist",
            "A supervisor that holds every permission, defeating isolation"
          ],
          [
            "Specialist routing",
            "A router picks one specialist",
            "Clearly different request types",
            "A router with no fallback for 'none of these'"
          ],
          [
            "Critic or reviewer",
            "A second pass checks the first",
            "Errors are costly and checkable",
            "Same model, same prompt, same blind spots; review adds cost, not safety"
          ],
          [
            "Event-driven",
            "Agents react to events",
            "Asynchronous, long-running work",
            "No idempotency, so redelivered events repeat side effects"
          ],
          [
            "Human in the loop",
            "A person approves or decides at defined points",
            "Destructive, financial, external or regulated actions",
            "Approvals on everything, which trains people to click through"
          ]
        ]
      }
    },
    {
      "title": "6. Budgets, retries and stop conditions",
      "body": "Every loop needs at least two independent reasons to stop. A model can be talked into continuing; a counter in code cannot. Retries are a cost multiplier: model them in the Cost per Task calculator.",
      "table": {
        "cols": [
          "Control",
          "What it limits",
          "Notes"
        ],
        "rows": [
          [
            "Maximum steps",
            "Iterations of the agent loop",
            "Backstop when nothing else triggers"
          ],
          [
            "Tool-call count",
            "Calls made, including retries",
            "Separate from steps; one step may call several tools"
          ],
          [
            "Token budget",
            "Input plus output tokens per run",
            "Also bounds cost; count what the provider reports"
          ],
          [
            "Wall-clock deadline",
            "Elapsed time",
            "Pass the remaining time down to tools"
          ],
          [
            "Recursion depth",
            "Agents calling agents",
            "Set a small hard cap"
          ],
          [
            "Spend limit",
            "Money per run, per user, per day",
            "Needs price inputs you keep current; alert before the cap"
          ],
          [
            "Loop detection",
            "The same action repeated",
            "Catches a stuck model earlier than the step cap"
          ],
          [
            "Per-call timeout",
            "One tool call",
            "Shorter than the overall deadline"
          ],
          [
            "Retry policy",
            "Which failures are retried, how often",
            "Retry only errors marked retryable; use exponential backoff with jitter; cap attempts; add a global retry budget to avoid retry storms"
          ],
          [
            "Idempotency and deduplication",
            "Repeat side effects",
            "Key every write"
          ],
          [
            "Cancellation and compensation",
            "Unwinding a partly done task",
            "Define the undo for each side effect, or require approval before it"
          ],
          [
            "Partial results",
            "What the caller gets when the run stops early",
            "Return what was done, what was not, and why. Never present a partial result as complete"
          ]
        ]
      }
    },
    {
      "title": "7. Tool design standards",
      "bullets": [
        "**Schema for inputs and outputs**, validated by code before execution and before returning to the model.",
        "**Least privilege:** each tool runs with an identity that can do only what that tool needs. Tools do not share a broad credential.",
        "**Explicit allow-list per task.** A tool that exists in the registry is not thereby allowed. The lab shows a destructive tool being refused even at the highest autonomy level because it is not on the contract.",
        "**Size and time limits** on input, output and execution.",
        "**Idempotency** for anything with side effects.",
        "**Error classification:** retryable versus permanent, with a stable error shape.",
        "**Audit record** for every call: who or what asked, on whose behalf, arguments (redacted), result status.",
        "**Safe failure:** on doubt, stop and report; do not guess.",
        "**Treat tool output as untrusted data.** Text returned by a tool or document can contain instructions. It must never change policy or widen permissions."
      ]
    },
    {
      "title": "8. Autonomy levels (an Atlas framework, not an official Google standard)",
      "body": "Autonomy is a property of an (agent, tool, action) combination, not of the whole product. Start low, raise a level only with evaluation evidence, and keep the ability to lower it quickly. The runnable lab implements this table.",
      "table": {
        "cols": [
          "Level",
          "Name",
          "Permitted",
          "Approval",
          "Limits and evidence required"
        ],
        "rows": [
          [
            "L0",
            "Observe",
            "No actions. May log what it would have done (shadow mode)",
            "Not applicable",
            "Use to gather a trajectory dataset before any action is enabled"
          ],
          [
            "L1",
            "Read-only",
            "Read data and call read-only tools",
            "None",
            "Data access is scoped and logged; no writes anywhere"
          ],
          [
            "L2",
            "Recommend",
            "Read, and produce recommendations or drafts for a person",
            "None for the draft; a person acts",
            "Recommendation quality is evaluated; the human owns the action"
          ],
          [
            "L3",
            "Execute after approval",
            "Propose writes or external messages",
            "A person approves each action",
            "Approver sees action, arguments, reason and evidence; deny is the default on timeout"
          ],
          [
            "L4",
            "Bounded autonomous",
            "Perform defined actions alone, inside hard limits",
            "Only above a stated limit",
            "Budgets and caps enforced in code; trajectory evaluation passing; kill switch; monitoring and alerting"
          ],
          [
            "L5",
            "High-impact under governance",
            "Actions with large or irreversible impact",
            "Explicit governance and approval, always",
            "Named accountable owner, risk assessment, legal and security review, incident plan; most teams should not be here"
          ]
        ]
      },
      "tips": [
        "Destructive actions are never autonomous at L4 in this framework; they need explicit approval even at L5.",
        "Do not raise a level because the demo went well. Raise it because the evaluation set, the failure-injection tests and the monitoring say it is safe, and record who decided."
      ]
    },
    {
      "title": "9. Human approval and escalation",
      "bullets": [
        "**Require approval for:** destructive actions, money movement, external communication, regulated decisions, access changes, and anything you cannot undo.",
        "**Show the approver what they need:** the action, its arguments, the reason, the evidence and what will change. An approval screen that hides the arguments is theatre.",
        "**Default to deny** on timeout or error. Do not auto-approve to keep the workflow moving.",
        "**Separate the requester from the approver** for high-impact actions.",
        "**Avoid approval fatigue:** narrow the set that needs approval and batch the low-risk set. If people approve everything, the control has failed.",
        "**Audit every approval**: who, when, what they saw, what they decided.",
        "**Define escalation:** who is paged when the workflow is stuck waiting, and what the caller sees meanwhile."
      ]
    },
    {
      "title": "10. MCP and A2A: trust boundaries",
      "body": "Model Context Protocol (MCP) standardises how a model-facing client reaches tools and data; Agent2Agent (A2A) standardises how agents discover and call one another. Both are protocol specifications. What a particular vendor or Google product implements on top of them is a separate question to verify in that product's documentation. See [[agent-protocols|MCP and Agent2Agent]] and the source specifications at modelcontextprotocol.io and a2a-protocol.org.",
      "bullets": [
        "**Every remote tool server and remote agent is a trust boundary.** Treat it as untrusted until it is registered, reviewed and pinned.",
        "**Authenticate the caller and authorise each tool.** Discovery and capability negotiation tell you what exists; they do not grant permission.",
        "**Carry identity:** know which user and which agent a call is for, so downstream systems can enforce least privilege and write meaningful audit records.",
        "**Pin and review versions.** A tool description or schema that changes silently can change behaviour. Alert on drift.",
        "**Treat tool descriptions and agent cards as untrusted input** that could contain instructions.",
        "**Plan for failure:** timeouts, partial responses, schema mismatch, a remote agent that never answers.",
        "**Audit cross-boundary calls** with correlation ids that survive the hop."
      ]
    },
    {
      "title": "11. Failure modes",
      "table": {
        "cols": [
          "Failure",
          "Detection",
          "Containment",
          "Recovery"
        ],
        "rows": [
          [
            "Agent loop",
            "Loop detector; step and token budgets",
            "Stop the run with a stated reason",
            "Return partial result; add the case to the eval set"
          ],
          [
            "Tool outage",
            "Error rate, timeouts",
            "Bounded retries with backoff; circuit breaker",
            "Fallback or safe stop; alert the tool owner"
          ],
          [
            "Bad tool arguments",
            "Schema validation errors",
            "Reject before execution; do not retry blindly",
            "Give the model the validation error once, then stop"
          ],
          [
            "Stale state",
            "State version and age checks",
            "Refuse to act on state older than its allowed age",
            "Reload from the source of truth"
          ],
          [
            "Conflicting sub-agent answers",
            "Disagreement check against a merge rule",
            "Do not average; apply the rule or escalate",
            "Human review for high-impact cases"
          ],
          [
            "Partial success",
            "Per-step status in state",
            "Mark the result partial; no silent completion",
            "Resume from checkpoint; idempotent retries"
          ],
          [
            "Model refusal",
            "Refusal signal or empty output",
            "Stop; do not rephrase to bypass safety",
            "Route to a person or return a clear message"
          ],
          [
            "Prompt injection",
            "Injection screens; policy denials in the trace",
            "Allow-list and least privilege hold regardless of what the model asks for",
            "Quarantine the source; review the trace"
          ],
          [
            "Budget exhaustion",
            "Budget stop events",
            "Stop and report",
            "Review whether the task or the budget is wrong"
          ],
          [
            "Rate limit",
            "429s and quota alarms",
            "Backoff with jitter; queue; shed load",
            "Capacity plan; see the reliability playbook"
          ],
          [
            "Supervisor failure",
            "Heartbeats and run timeouts",
            "Workers stop at their own deadline",
            "Resume from checkpoint under a new supervisor"
          ]
        ]
      }
    }
  ],
  "see": [
    "arch:multiagent-orchestration",
    "arch:supervisor-agent",
    "arch:planner-executor",
    "arch:hitl-agent",
    "arch:mcp-agent",
    "arch:a2a-network",
    "arch:governed-agent-workflow",
    "dec:workflow-vs-agent",
    "dec:autonomy-level",
    "dec:human-in-loop",
    "dec:orchestration",
    "dec:agent-runtime",
    "svc:adk",
    "svc:agent-runtime",
    "svc:agent-memory",
    "svc:agent-protocols",
    "svc:agent-governance",
    "svc:workflows",
    "pb:agent-engineering",
    "pb:identity-threat-model",
    "pb:nfr-reliability",
    "pb:eval-datasets-gates",
    "lab:bounded-agent",
    "tool:agent-assistant",
    "tool:calculator"
  ],
  "lastReviewed": "2026-11-20"
},
{
  "id": "identity-threat-model",
  "title": "Identity, Delegation and Threat Modelling for RAG and Agents",
  "badge": "Atlas guidance",
  "tag": "Who is acting, on whose behalf, with what authority, and what can go wrong at each trust boundary.",
  "intro": "Use this playbook to model identities and threats for any RAG or agent system before the architecture review. It extends the Enterprise Security Hardening Playbook with identity types, delegation, a threat-model template and a governance map. It is Atlas guidance, not an official Google recommendation, and **not legal advice**. Verify current product behaviour for [[iam|IAM]] and [[agent-governance|Agent Identity, Registry and Gateway]] in official documentation.",
  "glance": {
    "purpose": "Make identities, delegation and trust boundaries explicit and produce a threat model with owners for residual risk.",
    "triggers": [
      "New RAG or agent system",
      "A new tool, data source or tenant is added",
      "Raising an agent's autonomy",
      "Security review or incident"
    ],
    "roles": [
      "Security architect (threat model, controls)",
      "Principal engineer (identity design)",
      "Engineering manager (risk acceptance request)",
      "Data owner (classification, access)",
      "Privacy or legal contact (privacy review)"
    ],
    "artefacts": [
      "Identity map",
      "Threat model",
      "Tool permission register",
      "Data classification and retention table",
      "Human oversight plan",
      "Risk acceptance record for residual risk"
    ],
    "exit": [
      "Every actor and credential in the system is on the identity map",
      "No component holds broader permissions than its function needs",
      "Each threat has a control, a residual risk and an owner",
      "Indirect prompt injection and excessive agency are explicitly addressed"
    ]
  },
  "sections": [
    {
      "title": "1. Five kinds of identity",
      "body": "Most incidents involve a component acting with more authority than anyone intended. Name every identity and keep them separate whenever their privileges, lifecycle or audit needs differ.",
      "table": {
        "cols": [
          "Identity",
          "Example",
          "Controlled by",
          "Rule"
        ],
        "rows": [
          [
            "Human user",
            "An employee asking a question",
            "Your identity provider",
            "Authorise data access against this identity, not the application's"
          ],
          [
            "Workload or application",
            "The service that hosts the agent",
            "Platform team (service account, workload identity)",
            "Least privilege; no long-lived keys where an alternative exists"
          ],
          [
            "Agent",
            "The reasoning component acting for a user or a team",
            "Agent owner",
            "Give each agent its own identity so actions are attributable and revocable"
          ],
          [
            "Sub-agent",
            "A specialist called by a supervisor",
            "Agent owner",
            "Narrower permissions than its caller; never inherits everything"
          ],
          [
            "Tool or downstream service",
            "A refunds API, a database",
            "Tool owner",
            "Authorises each call using the caller identity and the delegation chain"
          ]
        ]
      }
    },
    {
      "title": "2. Delegation: acting on behalf of someone",
      "bullets": [
        "**Be explicit about whose authority is being used:** the user's (on their behalf), the agent's own (autonomous), or both.",
        "**Effective authority should not exceed either party.** An agent acting for a user should not be able to do what the user cannot, and should not do what the agent itself is not approved to do. Implement it as the intersection and test it.",
        "**Prefer token exchange or equivalent delegation** where the platform supports it, so downstream systems see both the user and the acting agent. OAuth 2.0 Token Exchange is specified in RFC 8693; confirm what your products support.",
        "**Use short-lived, scoped credentials** wherever the platform supports them. Avoid long-lived keys and shared secrets.",
        "**Never put secrets in prompts, tool descriptions or logs.** A model can repeat what it is given.",
        "**Watch for the confused deputy:** a privileged component that acts on a lower-privileged caller's request without checking that the caller is allowed. Check the caller's authority at the point of action.",
        "**Define revocation:** how fast an agent's or user's access can be removed, and how that reaches caches, tokens and in-flight runs."
      ]
    },
    {
      "title": "3. Threat model",
      "body": "Build the model from assets (what you protect), actors (who or what interacts), trust boundaries (where authority or data quality changes), and entry points (where input arrives). Then list threats, controls, residual risk and an owner. The table below is a starting set for RAG and agent systems; replace the residual risk and owner columns with your own. The OWASP project publishes a taxonomy of risks for LLM applications and agentic systems; names and numbering change between versions, so confirm the current version at the source.",
      "table": {
        "cols": [
          "Threat",
          "Entry point",
          "Controls to consider",
          "Residual risk and owner"
        ],
        "rows": [
          [
            "Indirect prompt injection",
            "Retrieved documents, web pages, tool output, emails",
            "Treat all retrieved or tool text as untrusted data; least-privilege tools; allow-lists; screen inputs and outputs; human approval for high-impact actions",
            "To be assessed by the system owner"
          ],
          [
            "Direct prompt injection",
            "User input",
            "Input screening; instruction hierarchy in code, not only in text; policy checks outside the model",
            "To be assessed"
          ],
          [
            "Data exfiltration",
            "Tool calls, rendered links or images, outbound email",
            "Egress controls; output screening; no autonomous external communication; review of rendered output",
            "To be assessed"
          ],
          [
            "Excessive agency and tool misuse",
            "An over-permissioned tool or agent",
            "Per-task allow-lists; per-tool identities; approvals; budgets; autonomy level discipline",
            "To be assessed"
          ],
          [
            "Cross-tenant or cross-user leakage",
            "Retrieval, caches, memory, logs",
            "Pre-filtering by caller identity; identity-keyed caches; isolation level chosen by risk; leakage tests",
            "To be assessed"
          ],
          [
            "Insecure output handling",
            "Model output passed to a browser, shell, database or API",
            "Encode and validate output; never execute model output directly",
            "To be assessed"
          ],
          [
            "Denial of service and cost exhaustion",
            "Large inputs, loops, many tool calls",
            "Rate limits, token and step budgets, quotas, alerts",
            "To be assessed"
          ],
          [
            "Supply chain",
            "Models, packages, MCP servers, agent cards, datasets",
            "Registry of approved components; version pinning; review; drift alerts",
            "To be assessed"
          ],
          [
            "Poisoned index or data",
            "Ingestion sources",
            "Source approval and ownership; change review; anomaly checks; removal procedure",
            "To be assessed"
          ],
          [
            "Credential theft",
            "Secrets in config, prompts or logs",
            "Secret manager, short-lived credentials, no secrets in prompts, log redaction",
            "To be assessed"
          ],
          [
            "Sensitive data in logs and traces",
            "Observability pipeline",
            "Redaction before storage; retention limits; access control on telemetry",
            "To be assessed"
          ]
        ]
      }
    },
    {
      "title": "4. Controls checklist",
      "bullets": [
        "Least privilege for every identity; review permissions on a schedule.",
        "Per-task tool allow-lists; a tool permission register with an owner per tool.",
        "Short-lived credentials where supported; secrets in a secret manager, never in prompts.",
        "Private networking and data perimeters where the data warrants them; see [[vpc-sc|VPC Service Controls]] and test perimeters in dry-run mode before enforcing.",
        "Encryption at rest and in transit; customer-managed keys where policy requires them ([[kms|Cloud KMS]]).",
        "Input and output screening as one layer, for example [[model-armor|Model Armor]]. It does not replace the controls above.",
        "Rate limits, quotas and budgets.",
        "Human approval paths for high-impact actions, with audit.",
        "Logging with redaction; tamper-resistant audit logs ([[audit-logs|Cloud Audit Logs]])."
      ]
    },
    {
      "title": "5. Authorization-aware retrieval and data security",
      "body": "The detail lives in the RAG Lifecycle Controls playbook. The security points to carry into the threat model: authorisation is enforced by the retrieval layer using the caller's identity before ranking; tenant isolation level is chosen by risk; caches, memory and derived content inherit the source ACL; private networking and data residency requirements are decided up front because they constrain service choice; and deletion is defined and tested."
    },
    {
      "title": "6. Data classification, privacy and retention",
      "bullets": [
        "**Classify data** before it is indexed or sent to a model, and record which classes each system may touch. [[sdp|Sensitive Data Protection]] can help find and de-identify personal data; treat detection as one control, not proof.",
        "**Redact before indexing or logging** where the use case does not need the raw data.",
        "**Set retention per class** for source copies, indexes, prompts, responses, traces, memory and evaluation sets.",
        "**Plan deletion and access review:** who can see what, reviewed regularly; how a data subject or owner request propagates through every store.",
        "**Run a privacy review** for any system handling personal data. What it must contain depends on your jurisdiction and contracts; ask your privacy or legal contact. This playbook does not say what the law requires."
      ]
    },
    {
      "title": "7. Governance frameworks: what they are, and what they are not",
      "body": "Frameworks help structure your practice. Whether any of them is a legal or contractual obligation for you depends on your sector, location and customers. Confirm the current version and date at each source; this Atlas has not verified them.",
      "table": {
        "cols": [
          "Framework or source",
          "What it is",
          "Typical status",
          "Use it for"
        ],
        "rows": [
          [
            "NIST AI Risk Management Framework (and its Generative AI profile)",
            "Voluntary guidance for governing, mapping, measuring and managing AI risk",
            "Voluntary unless a contract or regulation points to it",
            "Structuring a risk process and vocabulary"
          ],
          [
            "ISO/IEC 42001",
            "A standard for an AI management system that organisations can be assessed against",
            "Voluntary unless required by a customer or regulator",
            "Building an auditable management system"
          ],
          [
            "OWASP guidance for LLM and agentic applications",
            "Community security guidance and risk taxonomies",
            "Voluntary community guidance",
            "Threat modelling and security review checklists"
          ],
          [
            "Laws and regulations that apply to you",
            "Binding obligations such as sector rules and privacy or AI laws",
            "Mandatory where they apply",
            "Ask legal counsel what applies and what it requires"
          ]
        ]
      }
    },
    {
      "title": "8. Templates to use",
      "body": "Copy-ready templates for these artefacts are in the Manager Toolkit: **AI system inventory**, **system card**, **risk assessment**, **privacy review**, **tool permission register**, **human oversight plan**, plus the existing threat model and incident templates. Fill them in per system and keep them with the code."
    }
  ],
  "see": [
    "arch:secure-multitenant-rag",
    "arch:governed-agent-workflow",
    "arch:private-ai",
    "arch:mcp-agent",
    "dec:tenancy",
    "dec:index-tenancy",
    "dec:human-in-loop",
    "svc:iam",
    "svc:agent-governance",
    "svc:model-armor",
    "svc:vpc-sc",
    "svc:kms",
    "svc:sdp",
    "svc:audit-logs",
    "svc:secret-manager",
    "svc:identity-platform",
    "pb:security-hardening",
    "pb:rag-lifecycle-controls",
    "pb:agent-bounded-design",
    "tool:risk-analyzer",
    "tool:readiness-scorecard",
    "page:toolkit",
    "page:gov"
  ],
  "lastReviewed": "2026-11-20"
},
{
  "id": "nfr-reliability",
  "title": "NFRs, Fault Tolerance and Runbooks for AI Systems",
  "badge": "Atlas guidance",
  "tag": "State the non-functional requirements as measurable numbers, design for failure, and write the runbooks before the incident.",
  "intro": "Use this playbook to turn 'it should be fast and reliable' into reviewable requirements, and to design the failure behaviour of an AI system. It extends the Production AI SRE and Reliability Playbook. Numbers in this playbook are written as placeholders such as `<N>` on purpose: **there are no universal targets**. Derive yours from users, risk and measurement. Atlas guidance, not an official Google recommendation.",
  "glance": {
    "purpose": "Make non-functional requirements measurable, design explicit failure behaviour, and have runbooks and fault-injection tests ready.",
    "triggers": [
      "Architecture review of a new AI system",
      "Before a production launch or a traffic increase",
      "After an outage, a quota event or a cost spike",
      "Adding a new dependency such as a model, index or tool"
    ],
    "roles": [
      "Engineering manager (requirements sign-off)",
      "Principal engineer (design)",
      "SRE (SLOs, alerts, runbooks)",
      "Product owner (failure tolerance)",
      "FinOps or finance partner (cost limits)"
    ],
    "artefacts": [
      "NFR table with owners",
      "Workload questionnaire answers",
      "Timeout and retry budget",
      "Fallback decision table",
      "SLO and alert definitions",
      "Runbooks",
      "Fault-injection test plan"
    ],
    "exit": [
      "Every NFR has a measurable form, a measurement method and an owner",
      "Failure behaviour is designed per dependency and tested",
      "Runbooks exist for the likely incidents and were exercised once",
      "SLO alerts are in place and route to a named team"
    ]
  },
  "sections": [
    {
      "title": "1. The NFR catalogue",
      "body": "State each requirement so that a test or a dashboard can say pass or fail. Placeholders show the form; values come from your users and your risk.",
      "table": {
        "cols": [
          "Requirement",
          "How to state it",
          "Form (placeholders)",
          "Measured by"
        ],
        "rows": [
          [
            "Latency",
            "Percentiles for the user-visible path, including time to first token for streaming",
            "p50 <N> s, p95 <N> s, p99 <N> s",
            "Traces and latency metrics at the edge"
          ],
          [
            "Throughput",
            "Requests or tasks per unit time at peak",
            "<N> tasks per minute at peak",
            "Load tests; production metrics"
          ],
          [
            "Concurrency",
            "Simultaneous in-flight requests",
            "<N> concurrent sessions",
            "Load tests; saturation metrics"
          ],
          [
            "Availability",
            "Share of requests served successfully over a window",
            "<N>% over <window>",
            "Success-rate SLI"
          ],
          [
            "Reliability of outcome",
            "Share of tasks completed correctly",
            "<N>% task success on the evaluation set and in sampled production",
            "Evaluation and sampling; this is not the same as availability"
          ],
          [
            "Scalability",
            "Growth the design must absorb",
            "<N>x current traffic without redesign",
            "Load tests; capacity model"
          ],
          [
            "Privacy",
            "Data classes allowed and handling rules",
            "No class <X> data leaves region <R>",
            "Design review; audits"
          ],
          [
            "Security",
            "Controls that must hold",
            "Zero cross-tenant leaks in tests; least privilege verified",
            "Security tests; access reviews"
          ],
          [
            "Quality",
            "Retrieval and answer quality targets",
            "Recall@k <N>, groundedness <N> on dataset <version>",
            "Evaluation gate"
          ],
          [
            "Cost",
            "Unit cost and total limits",
            "<currency> <N> per successful task; monthly cap <N>",
            "Cost model and billing data"
          ],
          [
            "Maintainability",
            "Effort to change safely",
            "Prompt or index change released within <N> days with gates passing",
            "Delivery metrics"
          ],
          [
            "Portability",
            "Ability to switch a component",
            "Model or index can be swapped behind an interface in <N> weeks",
            "Design review"
          ],
          [
            "RTO and RPO",
            "Time to restore and acceptable data loss",
            "RTO <N> minutes; RPO <N> minutes for state and index",
            "Recovery exercises"
          ]
        ]
      }
    },
    {
      "title": "2. Workload questionnaire",
      "body": "Answer these before choosing services or sizing anything. Unknowns are answers too: record them and plan to measure.",
      "bullets": [
        "**Traffic shape:** steady, diurnal, bursty or event-driven? Peak versus average? Expected growth?",
        "**Payload size:** typical and maximum input and output tokens; document sizes; image or audio use.",
        "**Geography and residency:** where are users; where must data stay; what is the latency from users to each dependency?",
        "**Tenancy:** one tenant or many; are tenants allowed to affect each other's performance?",
        "**Criticality:** is this on a revenue or safety path, or an internal convenience? What is the cost of an hour of downtime and of a wrong answer?",
        "**Data sensitivity:** classes of data touched and their handling rules.",
        "**Response-time target:** what the user will tolerate, and whether streaming changes that.",
        "**Failure tolerance:** on error, may the system retry, degrade, answer partially, or must it refuse? Who decides?",
        "**Dependencies:** which models, indexes, tools and APIs are on the critical path, and what are their quotas?"
      ]
    },
    {
      "title": "3. Timeout and retry budgets",
      "body": "Treat time and retries as budgets that are allocated, not defaults that are inherited. A common failure is every layer retrying, multiplying load on a struggling dependency.",
      "bullets": [
        "**End-to-end deadline first.** Decide the total time the caller will wait, then allocate it across retrieval, reranking, generation and tools, leaving margin. Pass the remaining time down so no stage works past the deadline.",
        "**Retry only what is safe:** idempotent operations, errors marked retryable (timeouts, transient unavailability, rate limits), never validation errors or policy denials.",
        "**Exponential backoff with jitter,** capped, so clients do not retry in lockstep. The Bounded agent lab implements full jitter and tests its bounds.",
        "**A retry budget:** cap retries as a fraction of traffic so a partial outage cannot turn into a retry storm. Retries also multiply token cost; model them in the Cost per Task calculator.",
        "**Circuit breakers:** stop calling a failing dependency for a short period and probe for recovery.",
        "**Bulkheads:** separate capacity pools per tenant, per tool or per priority so one failure or one heavy user cannot starve the rest.",
        "**Rate limits, queues and load shedding:** decide what to reject first when overloaded, for example low-priority and batch work, and return a clear signal. Quota behaviour for model and platform services must be checked in current documentation ([[quotas|Quotas]]).",
        "**Graceful degradation:** define, per dependency, the reduced service you will give."
      ]
    },
    {
      "title": "4. Fallbacks, and when each is unsafe",
      "body": "A fallback that silently changes behaviour can be worse than an error. Decide in advance which fallbacks are allowed for which risk level, tell the user when quality is reduced, and run the evaluation set against each fallback path.",
      "table": {
        "cols": [
          "Fallback",
          "Use when",
          "Unsafe when"
        ],
        "rows": [
          [
            "Alternate model",
            "Primary is unavailable and the alternate was evaluated on your tasks",
            "Safety behaviour, output format or capability differ and nobody tested it; data residency terms differ"
          ],
          [
            "Cached response",
            "Content is non-personal, stable and fresh enough",
            "The answer is user-specific, permission-sensitive or time-sensitive"
          ],
          [
            "Deterministic path (rules or templates)",
            "A narrow, well-understood task",
            "The task needs interpretation; the rules will give confident wrong answers"
          ],
          [
            "Smaller or cheaper model",
            "Low-risk tasks under load",
            "High-risk decisions, or tasks where the smaller model fails your evaluation set"
          ],
          [
            "Lexical-only or reduced retrieval",
            "Vector retrieval is down and exact-match still helps",
            "Recall drops below what the use case tolerates and the answer is presented as complete"
          ],
          [
            "Partial answer",
            "Part of the evidence or tool results are available",
            "The user could mistake it for complete; always state what is missing"
          ],
          [
            "Safe refusal or human handoff",
            "Any high-risk task when dependencies are impaired",
            "Never unsafe, but it has a user cost; make it a designed experience"
          ]
        ]
      }
    },
    {
      "title": "5. Observability",
      "bullets": [
        "**Traces** across every stage: retrieval, reranking, model calls, tool calls, agent decisions and policy decisions, with a correlation id. [[cloud-monitoring|Cloud Monitoring, Logging and Trace]] provide the platform pieces; confirm current capabilities in documentation.",
        "**Metrics:** latency percentiles per stage, error rate by class, retries, token usage in and out, cache hit rate, empty-retrieval rate, tool failure rate, approval wait time, budget stops, cost per task.",
        "**Retrieval evidence logging:** which sources were retrieved and used, so quality problems can be diagnosed. Redact or restrict content that is sensitive.",
        "**Cost attribution:** label usage by tenant, feature, agent and environment so a cost spike has an owner.",
        "**Redaction by default** for prompts, responses and tool arguments; set retention and access rules for telemetry as for any sensitive data.",
        "**Sample for quality:** automated checks on a sample of live traffic complement the offline evaluation set."
      ]
    },
    {
      "title": "6. SLIs, SLOs and alerting",
      "body": "An SLI is a measurement; an SLO is a target for it over a window. For AI systems you need SLIs for outcome quality as well as for availability and latency. Example forms below use placeholders; set values from user needs and measured capability.",
      "table": {
        "cols": [
          "SLI",
          "SLO form",
          "Notes"
        ],
        "rows": [
          [
            "Request success rate",
            "<N>% of requests succeed over <window>",
            "Define 'success' to exclude intended refusals and abstentions"
          ],
          [
            "Latency",
            "<N>% of requests complete within <T> seconds",
            "Measure at the user edge; track time to first token separately"
          ],
          [
            "Task success (sampled)",
            "<N>% of sampled tasks judged correct",
            "Needs a labelled or judged sample; state the sampling method"
          ],
          [
            "Index freshness",
            "<N>% of source changes searchable within <T> minutes",
            "Measured with canary documents"
          ],
          [
            "Groundedness (sampled)",
            "<N>% of sampled answers fully supported by cited evidence",
            "Judge calibration affects this number"
          ],
          [
            "Cost per successful task",
            "At most <currency> <N> on a <window> average",
            "Alert on trend and on spikes"
          ]
        ]
      },
      "tips": [
        "Alert on the rate at which the error budget is being consumed, not on every blip. Separate pages (act now) from tickets (act this week).",
        "Do not copy another team's targets. A target you cannot measure, or that no user cares about, is decoration."
      ]
    },
    {
      "title": "7. Runbooks",
      "body": "Write the runbook before the incident and exercise it once. Each runbook has the same skeleton: **Trigger, Diagnosis, Containment, Recovery, Validation, Escalation**, and an owner. Starting points for the nine most likely scenarios:",
      "table": {
        "cols": [
          "Runbook",
          "Trigger",
          "First containment",
          "Recovery validation"
        ],
        "rows": [
          [
            "Model or API outage",
            "Error rate or latency SLO breach on model calls",
            "Switch to an approved fallback; shed low-priority work",
            "Success rate and latency back within SLO; evaluation spot check on the fallback path if used"
          ],
          [
            "Quota exhaustion",
            "429 rates or quota alerts",
            "Queue and shed; route low-priority work to batch; request more quota in parallel",
            "429 rate normal; backlog drained"
          ],
          [
            "Retrieval or index outage",
            "Retrieval errors or empty-result spike",
            "Fail closed or degrade as designed; do not answer ungrounded questions as if grounded",
            "Recall on canary queries; no leakage"
          ],
          [
            "Ingestion delay",
            "Freshness SLO breach",
            "Pause dependent claims of freshness in the product; replay from checkpoint",
            "Canary documents appear within target; reconciliation report clean"
          ],
          [
            "Tool failure",
            "Tool error rate",
            "Circuit-break the tool; fall back or stop with a clear message",
            "Tool success rate; no duplicated side effects"
          ],
          [
            "Agent runaway",
            "Budget stops, loop detector, unusual spend",
            "Kill or pause runs; lower autonomy; tighten budgets",
            "Cost and step counts normal; add the case to the evaluation set"
          ],
          [
            "Quality regression",
            "Evaluation or sampled-quality drop after a change",
            "Roll back the prompt, model, index or config",
            "Evaluation back at baseline; cause recorded"
          ],
          [
            "Security incident",
            "Leak, injection success, unauthorised action",
            "Disable the affected tool or tenant path; revoke credentials; preserve logs",
            "Containment confirmed; review of scope; notification per your obligations (ask legal)"
          ],
          [
            "Cost spike",
            "Spend or token alerts",
            "Apply budgets and rate limits; find the top consumer by label",
            "Spend back in range; guard added"
          ]
        ]
      }
    },
    {
      "title": "8. Fault-injection scenarios",
      "body": "A failure path you have never triggered is a guess. Run these in a test environment first, and in production only with controls and agreement. The two runnable labs include local versions.",
      "table": {
        "cols": [
          "Scenario",
          "Inject",
          "Expect"
        ],
        "rows": [
          [
            "Timeouts",
            "Delay or drop dependency responses",
            "Bounded retries with jitter; deadline honoured; clear error or fallback"
          ],
          [
            "Partial outage",
            "Fail one tool, one index shard or one region",
            "Containment without cascading failure; correct degraded behaviour"
          ],
          [
            "Malformed output",
            "Model returns invalid JSON or a wrong schema",
            "Validation rejects it; no side effect; bounded repair attempts"
          ],
          [
            "Poisoned document",
            "Add a document with an injection payload",
            "Not served or not obeyed; alert raised"
          ],
          [
            "Traffic spike",
            "Multiply load",
            "Rate limits and load shedding work; priority traffic protected"
          ],
          [
            "Token limits",
            "Oversized input or output",
            "Truncation or rejection by design; no silent loss of required context"
          ],
          [
            "Downstream dependency failure",
            "Make an external API return errors",
            "Circuit breaker opens; fallback or safe stop; recovery probe"
          ],
          [
            "Crash and resume",
            "Kill the process mid-task",
            "Resume from checkpoint; no repeated side effects"
          ]
        ]
      }
    }
  ],
  "see": [
    "arch:multi-region-ai",
    "arch:llm-serving",
    "arch:ha-rag",
    "arch:agent-observability-platform",
    "dec:capacity-strategy",
    "dec:model-deployment-capacity",
    "dec:inference-pattern",
    "dec:cost-levers",
    "svc:cloud-monitoring",
    "svc:quotas",
    "svc:apigee",
    "svc:audit-logs",
    "svc:workflows",
    "svc:cloud-tasks",
    "pb:sre-operations",
    "pb:agent-bounded-design",
    "pb:rag-lifecycle-controls",
    "pb:finops-economics",
    "lab:bounded-agent",
    "lab:rag-eval",
    "tool:calculator",
    "tool:readiness-scorecard",
    "page:ops"
  ],
  "lastReviewed": "2026-11-20"
},
{
  "id": "eval-datasets-gates",
  "title": "Evaluation Datasets, Metrics and Release Gates",
  "badge": "Atlas guidance",
  "tag": "Build a repeatable test set, know what each metric does not prove, and gate releases on evidence.",
  "intro": "Use this playbook to build the evaluation assets that let a team change a prompt, model, index or agent and know whether it got better or worse. It extends the AI Evaluation and Quality Engineering Playbook with dataset formats, metric limits, judge calibration, CI gates and release patterns. The metric functions described here are implemented and tested in the Atlas (`assets/logic.js`) and used by the RAG evaluation lab. Atlas guidance, not an official Google recommendation. Thresholds are deliberately left as project-specific placeholders.",
  "glance": {
    "purpose": "Create versioned, reproducible evaluation datasets and gates so every change is compared to a baseline before release.",
    "triggers": [
      "Before the first production release",
      "Changing a model, prompt, retriever, index or agent configuration",
      "A quality incident or a user complaint pattern",
      "Raising an agent's autonomy"
    ],
    "roles": [
      "Engineering manager (gate owner)",
      "AI engineer (datasets, harness)",
      "Domain expert (labels, adjudication)",
      "Product owner (what 'good' means)",
      "Security (adversarial cases)"
    ],
    "artefacts": [
      "Versioned evaluation dataset with a data card",
      "Evaluation harness in the repository",
      "Baseline results with metadata",
      "CI gate configuration with project-specific tolerances",
      "Release and rollback criteria"
    ],
    "exit": [
      "The same evaluation can be rerun after any change and compared to a stored baseline",
      "Each metric is documented with what it does not prove",
      "Safety invariants are zero-tolerance and tested by injecting the failure",
      "Gate thresholds are set from observed variance and risk, and recorded"
    ]
  },
  "sections": [
    {
      "title": "1. Evaluation levels",
      "body": "Evaluate at the level where a defect lives. An end-to-end score that drops tells you something broke but not what. Test the cheap, deterministic levels first.",
      "table": {
        "cols": [
          "Level",
          "Question it answers",
          "Typical measures"
        ],
        "rows": [
          [
            "Data",
            "Is the source content correct, complete and fresh?",
            "Schema and completeness checks; freshness; duplicates"
          ],
          [
            "Parser",
            "Is the text and structure extracted correctly?",
            "Sampled fidelity for tables and key fields"
          ],
          [
            "Embedding and retrieval",
            "Do the right passages come back?",
            "Precision@k, recall@k, MRR, NDCG"
          ],
          [
            "Reranker",
            "Does re-ordering improve the top results?",
            "Change in precision@k or NDCG against latency and cost"
          ],
          [
            "Model",
            "Does the model do the task on representative inputs?",
            "Task-specific accuracy, format validity"
          ],
          [
            "Prompt",
            "Did a prompt change help or hurt?",
            "Same dataset, same model, compare to baseline"
          ],
          [
            "Tool",
            "Does the tool behave to its contract?",
            "Unit and contract tests; error classification"
          ],
          [
            "Agent trajectory",
            "Did the agent take sensible steps within policy?",
            "Tool selection, argument validity, unnecessary calls, recovery"
          ],
          [
            "End-to-end task",
            "Did the user's task get done correctly?",
            "Task success against the contract's completion criteria"
          ],
          [
            "Safety",
            "Does it resist misuse and leak nothing?",
            "Leakage, injection and policy-violation tests"
          ],
          [
            "Production monitoring",
            "Is quality holding on live traffic?",
            "Sampled evaluation, user feedback, drift signals"
          ]
        ]
      }
    },
    {
      "title": "2. A versioned dataset format",
      "body": "Keep datasets in the repository as plain files with a version, so a result can always be tied to the exact cases that produced it. The lab's `dataset.json` follows this shape.",
      "code": "{\n  \"schemaVersion\": 1,\n  \"datasetVersion\": \"2026-11-20.1\",\n  \"description\": \"What this set is for\",\n  \"limitations\": [\"Known gaps and biases\"],\n  \"cases\": [\n    {\n      \"id\": \"c01\",\n      \"query\": \"The user input\",\n      \"user\": { \"id\": \"u1\", \"tenant\": \"t1\", \"groups\": [] },\n      \"context\": \"Optional supplied context\",\n      \"relevant\": { \"doc-id\": 3 },\n      \"reference\": \"Optional reference answer\",\n      \"expectedBehavior\": \"answer | abstain | refuse | escalate\",\n      \"expectedTools\": [{ \"tool\": \"lookup_order\", \"args\": { \"orderId\": \"O-1\" } }],\n      \"constraints\": [\"Must cite a source\"],\n      \"riskTag\": \"access-control\",\n      \"difficulty\": \"easy | medium | hard\",\n      \"failureCriteria\": \"What counts as a failure for this case\"\n    }\n  ]\n}",
      "bullets": [
        "**Version the dataset and the schema.** Change the dataset version whenever a case is added, edited or removed.",
        "**Write failure criteria per case,** especially for safety and access-control cases, so a reviewer can see why a pass or fail was assigned.",
        "**Split the data:** a development set you can tune on, and a held-out set you rarely look at.",
        "**Write a short data card:** origin of the cases, who labelled them, known gaps, and what the set cannot tell you."
      ]
    },
    {
      "title": "3. Building the set",
      "bullets": [
        "**Golden set from real use** (de-identified and approved): the best signal about what users actually ask. Include the awkward, the vague and the multi-part.",
        "**Synthetic data** extends coverage cheaply but tends to be easier and more uniform than real traffic, and can inherit the generating model's biases. Review a sample by hand and label it as synthetic.",
        "**Human-labelled data** is the reference for judging automated metrics. Use at least two reviewers on a sample to see how much they agree.",
        "**Adversarial cases:** prompt injection, requests for other users' data, malformed inputs, out-of-scope questions, conflicting evidence.",
        "**Edge cases:** empty retrieval, very long inputs, rare languages or formats, stale versus current documents.",
        "**Prevent leakage:** do not tune prompts, few-shot examples or retrieval parameters on the held-out set; remove near-duplicates across splits; keep examples used in prompts out of the test set; freeze and record the versions you evaluate against.",
        "**Start small and grow from failures.** Every production incident and every confirmed user-reported error becomes a new case."
      ]
    },
    {
      "title": "4. Metrics: what each measures and what it does not prove",
      "body": "Report the number of cases behind every metric. With a few dozen cases, differences of a few points are noise. Definitions below match the implementation in `assets/logic.js`.",
      "table": {
        "cols": [
          "Metric",
          "Measures",
          "Does not prove"
        ],
        "rows": [
          [
            "Precision@k",
            "Share of the top k results that are relevant (denominator is k even if fewer are returned)",
            "That the answer is right; that relevant items are not missing"
          ],
          [
            "Recall@k",
            "Share of all relevant items found in the top k (undefined when a case has none)",
            "That the top results are ordered well; that the model uses the evidence"
          ],
          [
            "MRR",
            "Average of 1 divided by the rank of the first relevant result",
            "Anything about the second or third relevant result"
          ],
          [
            "NDCG@k",
            "Ranking quality with graded relevance, discounting lower ranks (gain 2 to the power grade, minus 1)",
            "Absolute usefulness; it depends on how relevance grades were assigned"
          ],
          [
            "Context relevance",
            "How much of the retrieved context is pertinent to the question",
            "That the needed fact is present"
          ],
          [
            "Context recall",
            "Whether the retrieved context contains what is needed to answer",
            "That the model answered from it"
          ],
          [
            "Faithfulness or groundedness",
            "Whether claims in the answer are supported by the provided evidence",
            "That the evidence itself is correct"
          ],
          [
            "Answer relevance",
            "Whether the answer addresses the question",
            "That it is correct or grounded"
          ],
          [
            "Citation precision and coverage",
            "Whether cited sources support the claims, and whether claims are cited",
            "That the cited source is authoritative or current"
          ],
          [
            "Abstention quality",
            "Whether the system declines when it should and answers when it should",
            "Behaviour on cases that are not in the set"
          ],
          [
            "Latency and cost",
            "Time and money per request or task",
            "Quality; a faster or cheaper answer may be worse"
          ],
          [
            "Task success (agent)",
            "Whether the end result met the completion criteria",
            "That the path was safe or efficient"
          ],
          [
            "Trajectory quality, tool selection, argument validity",
            "Whether the right tools were chosen and called correctly",
            "That the outcome was good"
          ],
          [
            "Policy compliance, unnecessary tool calls, recovery",
            "Rule adherence, wasted effort, behaviour after failures",
            "Quality of the final answer"
          ]
        ]
      }
    },
    {
      "title": "5. Judges: limits and calibration",
      "bullets": [
        "**Model-based judges are measuring instruments with biases:** preference for longer answers, for the first option shown, and for outputs resembling their own style. Randomise order and control for length.",
        "**Calibrate against humans.** Have people label a sample, compare to the judge, and report agreement. Re-do this when the judge model, prompt or task changes.",
        "**Fix and record the judge:** model version, prompt, temperature and any sampling, so scores are comparable across runs.",
        "**Prefer reference-based metrics where a reference exists;** use reference-free judging for open-ended outputs and treat the scores as indicative.",
        "**Use human adjudication** for disagreements and for high-risk categories.",
        "**Avoid grading a model with itself** where you can, and never use one score as the only evidence.",
        "**Reproducibility:** nondeterministic systems need repeated runs or fixed seeds where available; report variability."
      ]
    },
    {
      "title": "6. CI quality gates",
      "body": "A gate compares a candidate to a stored baseline and blocks the release when it fails. Thresholds are yours to set from observed run-to-run variance and the cost of being wrong; there are no universal values, and the Atlas does not offer any.",
      "table": {
        "cols": [
          "Gate",
          "Compared against",
          "How to set the rule"
        ],
        "rows": [
          [
            "Quality regression",
            "Stored baseline on the same dataset version",
            "Tolerance per metric from observed variance; a metric with no tolerance should fail the gate as 'no threshold', not pass"
          ],
          [
            "Safety invariants",
            "Zero",
            "Leakage, policy violations and served injection payloads are zero by design, not by tolerance"
          ],
          [
            "Latency budget",
            "The latency SLO",
            "Percentile and limit from your NFRs"
          ],
          [
            "Cost budget",
            "Cost per successful task target",
            "From your cost model, using dated prices"
          ],
          [
            "Human review",
            "Change risk",
            "Mandatory for high-risk changes, new tools, autonomy increases and dataset edits that remove cases"
          ]
        ]
      },
      "tips": [
        "Make the gate fail closed: a missing result is a failure.",
        "When a gate blocks a release, the choice is fix the change or move the baseline deliberately with a recorded reason. Never edit the dataset to make a failing case disappear without review."
      ]
    },
    {
      "title": "7. Versioning and reproducibility",
      "bullets": [
        "Record with every result: code commit, dataset version, model identifier and version, prompt hash, retrieval configuration, index version, judge version, temperature and seed, date, environment.",
        "Store results with that metadata next to the baseline so a regression can be traced to a change.",
        "Treat a change to any of these as a change that needs re-evaluation: model, prompt, retrieval parameters, embedding model, chunking, index contents, parser, tool schemas, dataset.",
        "Rerun the same evaluation after the change and compare to the baseline. That comparison is the evidence for the release decision."
      ]
    },
    {
      "title": "8. Release patterns and rollback criteria",
      "body": "Offline evaluation catches what your dataset covers. Production traffic finds the rest. Define rollback criteria **before** the rollout starts.",
      "table": {
        "cols": [
          "Pattern",
          "What it tells you",
          "Rollback trigger (define in advance)"
        ],
        "rows": [
          [
            "Pre-production offline evaluation",
            "Quality and safety on the dataset",
            "Any gate failure"
          ],
          [
            "Shadow",
            "Candidate output on live traffic without affecting users",
            "Divergence or quality below baseline on sampled comparison"
          ],
          [
            "Canary",
            "Real behaviour on a small share of users",
            "SLO burn, quality sample drop, safety event, cost per task above limit"
          ],
          [
            "A/B comparison",
            "Outcome difference between versions with enough traffic to measure",
            "Pre-registered success measure not met"
          ],
          [
            "Post-deployment monitoring",
            "Drift and regressions over time",
            "Alert thresholds on sampled quality and user feedback"
          ]
        ]
      }
    }
  ],
  "see": [
    "arch:genaiops-lifecycle",
    "dec:evaluation",
    "dec:improve-model",
    "svc:ap-evals",
    "svc:gemini",
    "svc:cloud-monitoring",
    "pb:evaluation-testing",
    "pb:genaiops",
    "pb:rag-lifecycle-controls",
    "pb:agent-bounded-design",
    "pb:nfr-reliability",
    "lab:rag-eval",
    "lab:bounded-agent",
    "tool:readiness-scorecard",
    "tool:calculator"
  ],
  "lastReviewed": "2026-11-20"
}
  ];
  add.forEach(function (p) { window.ATLAS.engineeringPlaybooks.push(p); });
})();
