/* Advanced agentic architectures. Same schema as architectures.js plus:
   sections: [block]  extra teaching content rendered under the walkthrough (see renderBlocks in app.js)
   src: [[title, url]] the Google Cloud material the page is based on
   Block types: h2, h3, p, ul, ol, table{cols,rows,note}, callout{title,text}, two{left,right}, cards{items}, steps{items:[[n,text]]}
   Links: [[service-id]], [[p:guide-id|label]], [[a:arch-id|label]], [[d:decision-id|label]], [[t:template-id|label]], [[m:tab|label]] */

window.ATLAS.architectures.push(
{
  id: 'multi-agent-system', name: 'Production multi-agent system',
  short: 'A coordinator and specialist agents with their own identities, tools, memory, budgets, approvals and traces, and the rules for when not to use one.',
  when: 'A single agent is struggling because it has too many tools, the task has several distinct responsibilities, or different parts need different models, permissions or owners. If one model call or one agent with a few tools does the job, stay there.',
  flow: [
    { l: 'User + frontend', s: 'cloud-run' },
    { l: 'Coordinator agent', s: 'adk' },
    { l: 'Specialist agents', s: 'agent-runtime' },
    { l: 'Tools over MCP', s: 'agent-protocols' },
    { l: 'Memory + state', s: 'agent-memory' },
    { l: 'Identity + gateway', s: 'agent-governance' },
    { l: 'Approval + traces', s: 'cloud-monitoring' }
  ],
  steps: [
    [0, 'A user submits a request through a frontend on [[cloud-run|Cloud Run]]. Sign-in happens before any agent runs, and the verified user identity travels with the request.'],
    [1, 'The **coordinator** (built with [[adk|ADK]]) classifies the intent and picks a flow: one specialist, a sequence, a parallel fan-out, or an iterative refinement loop. It also sets the run\'s **budget**: maximum steps, token budget and deadline.'],
    [5, 'Before any agent-to-agent or agent-to-tool call, traffic passes the [[agent-governance|Agent Gateway]]. Each agent has its own identity and is listed in the registry, and policies default to deny, so a call to an unregistered tool fails.'],
    [2, 'Specialist agents (research, retrieval, analytics, validation) do the work on [[agent-runtime|Agent Runtime]], or on Cloud Run or GKE. They talk to the coordinator and to each other over the A2A protocol. Each has a narrow prompt and a short tool list.'],
    [3, 'Specialists reach databases, APIs and files through **MCP servers**. Write tools take an **idempotency key**, so a retry cannot book a second flight or send a second email.'],
    [4, 'The run keeps **session state** for the conversation and a private scratchpad per agent. Only explicit hand-offs move data between agents. Long-term facts about a user go to [[agent-memory|Memory Bank]], keyed by tenant and user.'],
    [6, 'A **validation agent** checks grounding and policy before the answer is returned. A high-risk action pauses for **human approval**. Every agent call is traced and scored, so you can see which agent caused a failure, a slow run or a cost spike.']
  ],
  why: [
    'Specialists keep each prompt and tool list small, which improves tool choice and makes each part testable on its own.',
    'Separate identities and tool lists give each agent least privilege. A research agent does not need write access to the order system.',
    'Budgets, step limits and a single owner for routing make cost and runaway behaviour a design property, not a surprise.',
    'Per-agent traces and scores localise failures. Without them a multi-agent bug is a six-way argument.'
  ],
  fails: [
    '**Loops and fan-out blow the budget.** Two agents that keep correcting each other, or a parallel fan-out of twenty calls, can multiply cost in minutes. Cap steps, iterations and concurrency.',
    '**Coordinator mistakes cascade.** A wrong routing decision sends the whole run down the wrong path. Evaluate routing accuracy separately.',
    '**Shared context leaks.** An agent that can read another agent\'s scratchpad, or a memory store with no tenant key, can expose data across users.',
    '**Duplicate side effects.** Without idempotency keys, a retry after a timeout runs the action twice.',
    '**Nobody owns the seams.** Each agent passes its tests, and the hand-off between them fails. Test the end-to-end task and the hand-offs, not just agents.'
  ],
  src: [
    ['Google Cloud: Multi-agent AI system reference architecture', 'https://docs.cloud.google.com/architecture/multiagent-ai-system'],
    ['Google Cloud: Choose a design pattern for your agentic AI system', 'https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system']
  ],
  sections: [
    { t: 'h2', text: 'One agent, many agents, or no agent' },
    { t: 'p', text: 'This is the first decision, and the most expensive one to get wrong. Every extra agent adds model calls, latency, a surface to secure and a thing to evaluate.' },
    { t: 'table', cols: ['Option', 'Use it when', 'Avoid it when', 'Cost and latency'], rows: [
      ['No agent: one model call or a fixed workflow', 'The task is predictable and fits one call: summarising, translating, classifying, extracting. Or the steps are fixed and known.', 'The path depends on what the model finds along the way.', 'Lowest. One call, or a few in a fixed order.'],
      ['One agent with tools', 'A multi-step task that needs external data or a handful of tools, such as checking an order and drafting a reply.', 'The tool list has grown long, tool choice is becoming unreliable, or the prompt is trying to be five jobs at once.', 'Moderate. Each loop iteration is a model call.'],
      ['Several agents', 'Distinct responsibilities with different tools, permissions, models or owners; tasks that can run in parallel; a quality check that should be independent of the producer.', 'You cannot yet say why one agent is not enough, or you have no evals to show that splitting helps.', 'Highest. More calls and tokens, more latency, and more to secure and trace.']
    ] },
    { t: 'callout', title: 'The rule', text: 'Start with one agent and prove it is not enough, using an eval set, before you split it. Google\'s own design guidance says the same: refine the core logic, prompts and tools in a single agent first, and move to several when it struggles with many tools, growing complexity or distinct responsibilities.' },

    { t: 'h2', text: 'Four orchestration patterns' },
    { t: 'p', text: 'Most production systems are one of these four, or a composition of them. In ADK the first, second and fourth map to workflow agents (`SequentialAgent`, `ParallelAgent`, `LoopAgent`), and the third is model-driven delegation to sub-agents.' },
    { t: 'table', cols: ['Pattern', 'Use it when', 'Latency and cost', 'Typical failure', 'Control to add'], rows: [
      ['**Sequential**: a fixed pipeline of agents', 'A repeatable process with a known order: extract, enrich, validate, write.', 'Predictable. Lower than model-driven routing. A slow step delays everything.', 'One bad early output poisons every later step.', 'Validate the output schema between steps; fail fast.'],
      ['**Parallel**: fan out, then merge', 'Independent sub-tasks: several analyses of one document, or searching several sources at once.', 'Lower latency, but token and resource cost rises with the fan-out.', 'Conflicting results; one slow branch holds the merge.', 'Cap concurrency; set a per-branch timeout; define how conflicts are resolved before building it.'],
      ['**Supervisor delegation**: the coordinator chooses which agent runs next', 'Adaptive routing where the path depends on the request, such as support triage or research planning.', 'More model calls than a fixed pipeline. The routing call itself costs tokens.', 'Wrong or looping delegation.', 'Evaluate routing accuracy; limit hops; log every delegation with a reason.'],
      ['**Iterative refinement**: produce, critique, revise until good enough', 'Hard-to-get-right outputs: code, plans, long documents, anything with a clear quality check.', 'Each cycle adds cost and time, and the first cycles help most.', 'Never converges, or polishes the wrong thing.', 'A maximum iteration count and a measurable exit test, not "until it looks fine".']
    ] },
    { t: 'h3', text: 'Other patterns worth knowing' },
    { t: 'table', cols: ['Pattern', 'Best for', 'Main trade-off'], rows: [
      ['Review and critique (generator plus critic)', 'Output that must be accurate or meet strict rules, such as security-checked code.', 'Extra model calls on every revision.'],
      ['Hierarchical task decomposition', 'Ambiguous, open-ended work such as research and planning.', 'The most complexity, and many calls.'],
      ['Swarm (agents talk to each other with no supervisor)', 'Creative or ambiguous problems that benefit from debate.', 'Hardest to control and the most expensive. Needs an explicit exit condition.'],
      ['ReAct (reason, act, observe in one agent)', 'Dynamic tasks that need continuous replanning.', 'Early tool errors propagate; iterations add latency.'],
      ['Human in the loop', 'High-stakes or approval-required steps.', 'You must build and staff the review path.']
    ], note: 'Summarised from Google Cloud\'s agentic design-pattern guide. Read the guide for the full trade-offs.' },

    { t: 'h2', text: 'Guardrails for a multi-agent run' },
    { t: 'p', text: 'These are the controls that turn "it works in the demo" into something you can leave running. Set every one of them explicitly and make the values visible in config, not buried in a prompt.' },
    { t: 'table', cols: ['Control', 'What to set', 'Why'], rows: [
      ['Maximum steps per run', 'A hard cap on total agent and tool calls for one task.', 'Stops runaway loops regardless of which agent causes them.'],
      ['Loop limit', 'A maximum iteration count on every refinement or retry loop, plus a measurable exit test.', 'Google\'s multi-agent reference stops iterative refinement at a maximum iteration count for this reason.'],
      ['Token budget', 'A budget per task and per agent. When it is spent, stop and return what you have or escalate.', 'Cost is bounded by design, and a single misbehaving agent cannot spend the whole budget.'],
      ['Timeouts and deadline', 'A per-call timeout, plus an overall deadline for the run.', 'A slow tool should fail the call, not hang the user.'],
      ['Retries', 'Retry transient errors (including 429s) with exponential backoff and jitter. Do not retry non-idempotent writes without a key.', 'Retries without limits amplify an outage into a quota storm.'],
      ['Idempotency', 'An idempotency key on every write or external action, reused on retry.', 'A retry after a timeout must not repeat the side effect.'],
      ['Fallback', 'A defined degraded path: a smaller model, a cached answer, a single-agent mode, or hand-off to a person.', 'Agent-level failures should not become user-level outages. Design agents to work independently where you can.'],
      ['Concurrency limit', 'A maximum number of parallel branches per run and per tenant.', 'A fan-out is the fastest way to hit a model quota ([[quotas]]).'],
      ['Kill switch', 'A flag that disables a single agent or the whole workflow without a deploy.', 'You need to stop a bad release in minutes.']
    ] },

    { t: 'h2', text: 'Memory and session state: shared or isolated?' },
    { t: 'p', text: 'Default to isolated. Share only by an explicit hand-off that you can log and review.' },
    { t: 'table', cols: ['State', 'Scope', 'Who can read it', 'Use it for', 'Risk'], rows: [
      ['Session history', 'One conversation', 'The coordinator, and agents it passes it to', 'Context for follow-up questions', 'Grows without bound. Summarise or trim.'],
      ['Task scratchpad', 'One run', 'Agents in that run only', 'Intermediate results passed between steps', 'A stale or poisoned result steers later agents. Validate hand-offs.'],
      ['Agent-private working memory', 'One agent, one run', 'That agent', 'Reasoning notes, partial work', 'Low, if it is never shared.'],
      ['Long-term user memory ([[agent-memory|Memory Bank]])', 'One user, many sessions', 'Agents allowed by policy', 'Preferences and durable facts', 'Memory poisoning and privacy. Key by tenant and user; support deletion on request.'],
      ['Shared knowledge ([[agent-retrieval|retrieval]])', 'Many users', 'Any agent, through a permission-filtered query', 'Documents and reference data', 'Permission leakage. Filter every query by the end user\'s access.']
    ] },

    { t: 'h2', text: 'Identity, registry and gateway' },
    { t: 'ul', items: [
      'Give every agent its **own identity**, separate from the human user\'s, and grant it only the tools it needs.',
      'Register agents and MCP servers in the **registry**, so the gateway knows which destinations are approved.',
      'Route agent, tool and model traffic through the **gateway**, so policy and content screening apply in one place.',
      'Keep a human in the loop for business-critical actions, with the ability to pause or override an agent.'
    ] },
    { t: 'p', text: 'The implementation detail, the difference between an agent\'s identity and the user\'s, and a rollout order are in [[p:agent-governance-guide|the agent governance guide]].' },

    { t: 'h2', text: 'Tracing and per-agent evaluation' },
    { t: 'two', left: { title: 'Trace on every call', items: [
      'Run ID, parent span, agent name and version, model and prompt version.',
      'Tool calls with arguments and results (redacted where needed).',
      'Latency, input and output tokens, retries and the final outcome.',
      'The delegation decision and its stated reason.'
    ] }, right: { title: 'Score at two levels', kind: 'ml', items: [
      '**End to end:** task success, cost per successful task, escalation rate.',
      '**Per agent:** routing accuracy (coordinator), tool choice and arguments (specialists), grounding (retrieval agent), catch rate (validator).',
      '**Trajectory:** did it take a sensible path, and did it stop when it should?',
      'Run multi-turn simulated users before launch to find coordination issues. See [[p:evaluation-lifecycle|the evaluation lifecycle]].'
    ] } }
  ]
},

{
  id: 'agentic-rag', name: 'Advanced agentic RAG',
  short: 'Query rewriting, planning, routing across sources, hybrid retrieval with permission filters, reranking, grounding checks and a refuse-or-escalate path.',
  when: 'Baseline RAG gives plausible answers but misses on multi-part questions, ambiguous questions, questions that span sources, or evidence that is partly in a table and partly in a database. Prove the failure with evals first: this design costs more latency and tokens.',
  flow: [
    { l: 'User + permissions', s: 'identity-platform' },
    { l: 'Understand + plan', s: 'adk' },
    { l: 'Route + retrieve', s: 'agent-retrieval' },
    { l: 'Filter + rerank' },
    { l: 'Iterate + tools', s: 'agent-protocols' },
    { l: 'Answer + verify', s: 'gemini' },
    { l: 'Refuse, escalate, learn', s: 'ap-evals' }
  ],
  steps: [
    [0, 'The user signs in ([[identity-platform]]). Their verified groups and tenant become a **permission filter** that is applied to every retrieval call in the run, by the platform, not by the model.'],
    [1, 'A planner agent **rewrites** the question (resolves "it" from the session, expands acronyms, splits a two-part question into two) and picks a **strategy**: answer directly, retrieve once, retrieve in several steps, or ask a clarifying question.'],
    [2, 'A **router** chooses the sources for each sub-question (policy documents, a product table, an orders database through an MCP tool, a knowledge graph) and runs **hybrid retrieval**: dense vectors for meaning and keyword search for exact terms and identifiers, in parallel.'],
    [3, 'Results are filtered by permission and metadata (tenant, date, document status), **merged by rank fusion**, **reranked** by a semantic ranker, and **compressed** to the passages that matter within a token budget.'],
    [4, 'If the evidence is thin, the agent **iterates**: reformulates, tries another source or calls a tool. The loop has a maximum number of rounds and stops when new rounds stop adding evidence.'],
    [5, '[[gemini|Gemini]] writes the answer with citations. A **verification step** checks each claim against the cited passages. Prompts and responses are screened by [[model-armor|Model Armor]].'],
    [6, 'If evidence is still insufficient, the system **refuses or escalates** instead of guessing. Unanswered questions, low-confidence answers, thumbs-down and stale-document reports feed the eval set and the **ingestion refresh**.']
  ],
  why: [
    'Rewriting and decomposition fix the most common cause of bad RAG answers: the retrieval query was not the question.',
    'Hybrid retrieval catches both the paraphrase (vectors) and the part number (keywords).',
    'Permission filtering in the retrieval layer means a prompt cannot talk the model into showing restricted content.',
    'A refuse-or-escalate path turns "confidently wrong" into "I could not find that", which users and auditors can live with.'
  ],
  fails: [
    '**Over-retrieval.** More chunks do not mean better answers. Long contexts bury the passage that matters and raise cost.',
    '**Permission leakage.** A filter applied only in the prompt, or missed on one source, returns restricted content. Test with users from different groups on every source.',
    '**Stale or wrongly indexed documents.** The best retrieval cannot fix an index that is a week behind. Monitor freshness.',
    '**Agent loops.** Iterative retrieval that never decides it has enough. Cap rounds and track evidence gained per round.',
    '**Grounding theatre.** Citations attached to claims the passage does not support. Verify claims, not just the presence of a link.'
  ],
  src: [
    ['Google Cloud: RAG reference architectures', 'https://docs.cloud.google.com/architecture/rag-reference-architectures'],
    ['Google Cloud: Agent Retrieval overview', 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/vector-search-2/overview'],
    ['Google Cloud: Evaluate your agents', 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/optimize/evaluation/evaluate-agents']
  ],
  sections: [
    { t: 'h2', text: 'Baseline RAG or agentic RAG?' },
    { t: 'table', cols: ['', 'Baseline RAG', 'Agentic RAG'], rows: [
      ['Shape', 'Embed the question, retrieve top-k, answer.', 'Plan, route, retrieve, rerank, check, repeat if needed.'],
      ['Latency', 'One retrieval and one generation.', 'Several steps. Plan for seconds, not milliseconds, and stream.'],
      ['Tokens and cost', 'Low and predictable.', 'Higher and variable: planner, verifier and extra rounds all cost tokens.'],
      ['Strong on', 'Single-passage questions over one clean corpus.', 'Multi-part, ambiguous and multi-source questions.'],
      ['Debugging', 'Two places to look: retrieval and generation.', 'Many places: every step needs a trace and a score.'],
      ['Main risk', 'Wrong chunk retrieved.', 'Loops, cost, and a larger surface for leakage.']
    ] },
    { t: 'callout', title: 'Start here', text: 'Build baseline RAG first ([[a:rag-assistant|the RAG assistant architecture]]) and measure retrieval recall and answer quality separately. Add one agentic step at a time (query rewriting is usually first) and keep it only if the eval score improves enough to pay for the extra cost.' },

    { t: 'h2', text: 'Which retrieval option? Do not treat them as interchangeable' },
    { t: 'p', text: 'These products store and retrieve data differently. Choose by data model, who runs it, and the question you need to answer. Several can sit in one system: a vector tier for documents, a relational database for entitlements, a graph for relationships.' },
    { t: 'table', cols: ['Requirement', 'Option to evaluate', 'Data model', 'Operational burden', 'Fits', 'Do not choose it when'], rows: [
      ['Managed RAG workflow', '[[rag-engine|RAG Engine]]', 'Corpora of files; it parses, chunks and embeds for you.', 'Low.', 'A grounded assistant over documents with little retrieval tuning.', 'You need data residency controls (not supported), a custom schema, or full control of ranking.'],
      ['Managed search experience', '[[ai-search|Agent Search]]', 'Data stores built from websites, documents, structured data and connectors.', 'Low.', 'Enterprise or website search with relevance tooling, facets and cited answers.', 'You want to own chunking and ranking, or retrieval must run inside your own database.'],
      ['Vector similarity at scale', '[[vector-search|Vector Search]]', 'Embeddings in an ANN index. You create the embeddings and keep metadata elsewhere.', 'Medium.', 'Very large corpora and tight latency where you want control of the pieces.', 'You want embeddings, data and metadata in one managed store.'],
      ['Collection-based, AI-native retrieval', '[[agent-retrieval|Agent Retrieval]]', 'Collections of JSON data objects with auto-embedding, hybrid search and reranking.', 'Low to medium.', 'Agents that need hybrid retrieval with stored fields in one service, including through an MCP server.', 'You need relational joins or transactions, or you cannot accept a newer product: check its launch stage.'],
      ['Relational data with vectors', '[[alloydb|AlloyDB]]', 'Postgres tables with vector columns and indexes.', 'Medium.', 'Embeddings next to transactional rows, with SQL joins and filters.', 'The corpus or query rate would crowd out the transactional workload.'],
      ['Large-scale analytical retrieval', '[[bigquery|BigQuery]]', 'Warehouse tables with embedding and vector search functions.', 'Low.', 'Batch and analytical similarity over warehouse data, and enrichment jobs.', 'You need per-request latency in tens of milliseconds at high query rates.'],
      ['Relationship-based retrieval', '[[spanner-graph|Spanner Graph]]', 'Nodes and edges as tables, queried with GQL, plus vector and full-text search.', 'Medium to high.', 'Multi-hop questions: dependencies, ownership, exposure across documents.', 'The answer sits in a single passage. See [[a:graphrag|GraphRAG]].']
    ], note: 'A decision guide with if/then rules is at [[d:retrieval-strategy|Which retrieval strategy?]].' },

    { t: 'h2', text: 'The pipeline stages and what breaks without each' },
    { t: 'table', cols: ['Stage', 'What it does', 'What breaks without it'], rows: [
      ['Query rewriting', 'Turns the user\'s words into a good search query, using the conversation.', 'Follow-ups like "and for Germany?" retrieve nothing relevant.'],
      ['Decomposition', 'Splits a multi-part question into sub-questions.', 'One retrieval cannot find evidence for two topics.'],
      ['Routing', 'Picks the right source for each sub-question.', 'You search the wrong store, or all of them, at extra cost.'],
      ['Hybrid retrieval', 'Combines vector and keyword matching.', 'Exact identifiers and rare terms are missed.'],
      ['Permission filter', 'Restricts results to what this user may see.', 'Restricted content leaks into answers.'],
      ['Rank fusion and rerank', 'Merges result lists and rescores the top candidates.', 'The best passage sits at rank 14 and never reaches the prompt.'],
      ['Context compression', 'Keeps only the passages and sentences that matter.', 'Cost and latency rise, and the answer drifts.'],
      ['Grounding check', 'Verifies claims against cited passages.', 'Fluent claims with no support.'],
      ['Refuse or escalate', 'Declines when evidence is insufficient.', 'The model guesses.']
    ] },

    { t: 'h2', text: 'Evaluate each stage separately' },
    { t: 'ul', items: [
      '**Retrieval:** recall@k and precision@k against labelled questions, per source and per user group.',
      '**Context:** is the needed passage in the final context, and how many irrelevant tokens came with it?',
      '**Answer:** correctness and groundedness (is each claim supported by the cited text?).',
      '**Behaviour:** refusal correctness (did it refuse when it should, and answer when it could?).',
      '**Cost and latency:** per stage, so you know where the extra seconds and tokens go.'
    ] },
    { t: 'p', text: 'Details and a scorecard for comparing strategies are in [[p:evaluation-lifecycle|the evaluation lifecycle]].' },

    { t: 'h2', text: 'Feedback-driven ingestion' },
    { t: 'ul', items: [
      'Log questions that were refused, escalated or thumbed down, and review them weekly. Many are missing documents, not bad retrieval.',
      'Detect stale documents (source changed, index not updated) and trigger a refresh. Monitor index freshness as a service level.',
      'Add every real failure to the eval set so it cannot regress.',
      'Handle deletes: removing a source must remove its chunks and any cached answers.'
    ] },
    { t: 'p', text: 'The full ingestion lifecycle is in [[p:data-lifecycle|the data and knowledge lifecycle guide]].' }
  ]
}
);
