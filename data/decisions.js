/* Decision guides for engineering managers and principal engineers.
   Schema per decision:
   id, theme ('strategy'|'architecture'|'risk'), title, question, door ('two-way'|'one-way'|'mixed'), doorNote,
   why (why it matters), cols, rows, rules:[[if, then]], redflags:[], ask:[], revisit, related:[service ids]
   Text supports `code`, **bold**, [[service-id|label]]. */
window.ATLAS.decisionThemes = [
  { id: 'strategy', name: 'Strategy & scope', blurb: 'Decide what to build, how autonomous it should be, and how to improve it. These are the decisions that set the budget and the team.' },
  { id: 'architecture', name: 'Architecture', blurb: 'Where models run, how agents are hosted, how retrieval works, and how the system copes with load and capacity.' },
  { id: 'risk', name: 'Risk, quality & cost', blurb: 'How you will know it works, how much you trust it to act, what it costs to run, and how tenants stay apart.' }
];

window.ATLAS.decisions = [
  /* ---------------- STRATEGY ---------------- */
  {
    id: 'build-buy-customize', theme: 'strategy', title: 'Build, buy or customise?',
    question: 'How much of this should we build ourselves, and how much should we adopt?',
    door: 'mixed', doorNote: 'Two-way at the start. It becomes one-way once your data, workflows and people depend on the choice.',
    why: 'Every AI feature has a build cost and a run cost, and the second is the one teams under-estimate. The wrong level of build also locks in headcount: a self-managed accelerator stack needs people on call for it.\n\nGoogle Cloud spans the whole range, from a finished employee product to bare TPUs, so the question is less "can we" and more "which rung should we stand on".',
    cols: ['Path', 'First value in', 'You own', 'Fits when', 'Main risk'],
    rows: [
      ['Adopt a finished product ([[gemini-enterprise|Gemini Enterprise]], [[ces|Customer Engagement Suite]])', 'Days', 'Configuration, connectors and data hygiene', 'Commodity needs: employee search, research, contact-centre bots', 'Capability ceiling; per-seat cost; limited customisation'],
      ['Managed blocks ([[gemini]] + [[rag-engine|RAG Engine]] or [[ai-search|AI Search]] + [[agent-studio|Agent Studio]])', 'Weeks', 'Prompts, data, evals, application glue', 'A differentiated feature built on standard patterns', 'Quotas and the limits of the abstraction'],
      ['Code-first on a managed runtime ([[adk]] + [[agent-runtime|Agent Runtime]])', 'Weeks to a few months', 'Agent logic, tools, memory strategy', 'Bespoke control flow, multi-agent designs, any model', 'You own agent quality and its operations'],
      ['Managed ML platform ([[ap-training|Managed Training]], [[ap-pipelines|Pipelines]], [[ap-inference|endpoints]])', 'Months', 'Models, features, pipelines, monitoring', 'Proprietary data is the advantage; predictive models', 'MLOps burden; scarce specialist talent'],
      ['Self-managed on [[gke|GKE]] with [[gce|GPUs]] or [[tpu|TPUs]]', 'Months or more', 'Everything, including accelerator capacity', 'Extreme scale or cost pressure, strict locality, custom serving', 'Operations load; capacity supply risk']
    ],
    rules: [
      ['The capability is not a differentiator for us', 'Buy. Put the effort into rollout and data quality.'],
      ['It is differentiating and a standard pattern (RAG, tool use) covers it', 'Managed blocks. Spend your time on evals and domain data.'],
      ['The control flow is bespoke, or you need a model outside the Gemini family', 'Code-first on a managed runtime. [[model-garden|Model Garden]] gives partner and open models in the same boundary.'],
      ['You have a proven data advantage and a trained model beats prompting on your evals', 'Own the model on the ML platform. Not before.'],
      ['You need locality, unit cost or latency that managed services cannot meet', 'Self-managed, with a named owner for accelerator capacity.']
    ],
    redflags: [
      'Fine-tuning is proposed before anyone has measured a prompt-plus-retrieval baseline.',
      'A "platform" is being built before the first use case is in production.',
      'The build-or-buy case rests on demo quality rather than on an eval set.',
      'Run cost and on-call burden are missing from the comparison.',
      'There is no exit path if the model or vendor changes in twelve months.'
    ],
    ask: [
      'Which part of this is our differentiator, and which part is plumbing?',
      'What does it cost per task at the volume we expect in a year, and who pays for it?',
      'Who is on call for it, and what do they do at 3 a.m.?',
      'If we had to swap the model next year, what would break?'
    ],
    revisit: 'Each quarter, when volume grows tenfold, or when a managed option adds the capability you built. Google has renamed and merged products fast (Vertex AI to the Agent Platform, Agentspace into Gemini Enterprise), so re-check what "managed" now includes.',
    related: ['gemini-enterprise', 'gemini', 'adk', 'agent-runtime', 'ap-training']
  },
  {
    id: 'autonomy-level', theme: 'strategy', title: 'How autonomous should it be?',
    question: 'Is this a single model call, a fixed workflow, or an agent that decides its own steps?',
    door: 'two-way', doorNote: 'Easy to move up a level later if tools sit behind clean interfaces. Hard to move down once users expect autonomy.',
    why: 'Autonomy multiplies cost, latency and the ways things go wrong. Most business problems have a known path, and a workflow with LLM steps is cheaper, faster and easier to test than an agent that rediscovers the path every time.',
    cols: ['Level', 'Pattern', 'Predictability', 'Google Cloud building blocks', 'Cost of a failure'],
    rows: [
      ['0. Single call', 'One prompt in, one answer out (classify, summarise, extract)', 'High', '[[gemini]], [[cloud-run]]', 'Low: a wrong answer'],
      ['1. Grounded answer', 'Retrieve, then generate (RAG)', 'High', '[[rag-engine|RAG Engine]], [[vector-search]]', 'Low to medium: a confident wrong answer'],
      ['2. Workflow with LLM steps', 'A fixed path where models handle individual steps', 'High', '[[workflows]], [[cloud-run]], [[gemini]], ADK workflow agents', 'Medium: bounded by the path'],
      ['3. Agent, human approves writes', 'Model chooses tools; a person approves anything that changes state', 'Medium', '[[adk]] on [[agent-runtime]], approval callbacks in [[workflows]]', 'Medium: caught at approval'],
      ['4. Agent acts within limits', 'Autonomous with scoped identities, spend caps, reversible actions', 'Lower', '[[agent-governance|Agent Identity and Gateway]], [[iam]], [[billing|budgets]]', 'High: acts before anyone looks'],
      ['5. Multi-agent, autonomous', 'Several agents delegating to each other', 'Lowest', '[[adk]] sub-agents, A2A ([[agent-protocols]]), a supervisor pattern', 'Highest: errors compound across agents']
    ],
    rules: [
      ['You can write the steps down', 'Use a workflow (level 2). It is cheaper and testable.'],
      ['The path depends on what the model finds along the way', 'Use an agent, and start at level 3.'],
      ['Any action changes money, data or access', 'Keep a human approval until measured error rates earn autonomy.'],
      ['One agent with more tools would do', 'Do not use multiple agents. Add them only for separate trust boundaries or clearly separate skills.']
    ],
    redflags: [
      'The word "agent" is in the title and nobody can describe a task whose steps vary.',
      'Agents call other agents with no limit on depth or total tokens.',
      'Tools are broad ("run any SQL") rather than narrow ("get order status").',
      'Autonomy is promised on a date, not earned by measured accuracy.'
    ],
    ask: [
      'Can you draw the steps? If yes, why is this not a workflow?',
      'What is the worst thing the agent can do with its permissions today?',
      'What is the agent\'s measured success rate on the eval set, and what is the target before we remove approvals?',
      'What stops a loop from burning tokens all night?'
    ],
    revisit: 'When the eval set shows consistently high accuracy for a class of action, consider removing approval for that class only.',
    related: ['adk', 'agent-runtime', 'workflows', 'agent-governance', 'iam']
  },
  {
    id: 'improve-model', theme: 'strategy', title: 'How do we make it better at our task?',
    question: 'Prompt, retrieve, fine-tune, or pre-train? In what order?',
    door: 'two-way', doorNote: 'Prompting and retrieval are cheap to change. Fine-tuning creates a data pipeline and a model you must maintain.',
    why: 'Teams jump to fine-tuning because it feels like real engineering. Usually the gain is in the prompt, the retrieval, or the data, and each step down this list costs far more than the one above it.',
    cols: ['Approach', 'What changes', 'Good for', 'Cost and effort', 'Maintenance'],
    rows: [
      ['Prompt engineering and few-shot examples', 'Instructions and examples', 'Format, tone, simple tasks', 'Minutes; no cost beyond tokens', 'Re-test when the model version changes'],
      ['Retrieval ([[rag-engine|RAG Engine]], [[ai-search|AI Search]])', 'What the model can see at question time', 'Private, current or large knowledge', 'Days; ongoing retrieval cost', 'Keep the index fresh; tune chunking'],
      ['Supervised tuning of [[gemini|Gemini]] ([[ap-tuning|Model Tuning]])', 'Model behaviour, managed', 'Style, format, narrow tasks with labelled data', 'Days; a few hundred clean examples', 'Re-tune when the base model is retired'],
      ['Fine-tune an open model ([[ap-tuning|tuning]], [[ap-training|Managed Training]])', 'Weights of an open model, full control', 'Specialised domains, a smaller and cheaper model', 'Weeks; GPU or TPU training plus hosting', 'You run training, serving and upgrades'],
      ['Continued pre-training', 'Broad knowledge and language of the model', 'A new language or a very large proprietary corpus', 'Months; large accelerator runs ([[tpu]], [[dws]])', 'You own a foundation model lifecycle']
    ],
    rules: [
      ['Output is the wrong shape or tone', 'Fix the prompt, add examples, use structured output. Measure.'],
      ['The model lacks facts it needs, or the facts change', 'Retrieval. Fine-tuning is a poor way to teach changing facts.'],
      ['A strong prompt plus retrieval still misses the bar and you have hundreds of clean labelled examples', 'Supervised tuning, compared against the best prompt baseline.'],
      ['A big model works but is too slow or costly for your volume', 'Tune a smaller model on the big model\'s outputs, or route easy cases to a cheaper tier.']
    ],
    redflags: [
      'No baseline score exists for the prompt-only approach.',
      'The training set was written quickly by one person and has inconsistent labels.',
      'Nobody has budgeted for re-tuning when the base model retires.',
      'Fine-tuning is proposed to fix hallucinations on facts that live in a database.'
    ],
    ask: [
      'What is the score of prompt-plus-retrieval on our eval set, and what is the gap to the target?',
      'Where do the training examples come from, and how were they checked?',
      'What happens when the base model is retired?',
      'Would a cheaper model with a better prompt close the gap?'
    ],
    revisit: 'When the base model version changes, when the eval gap changes, or when the cost per task moves materially.',
    related: ['gemini', 'rag-engine', 'ap-tuning', 'ap-training', 'ap-evals']
  },

  /* ---------------- ARCHITECTURE ---------------- */
  {
    id: 'where-model-runs', theme: 'architecture', title: 'Where should the model run?',
    question: 'Managed API, reserved capacity, a model deployed to our own endpoint, or our own fleet?',
    door: 'mixed', doorNote: 'Cheap to switch between managed options behind one interface. Costly once you operate accelerators.',
    why: 'This choice sets your unit cost curve, your latency floor, your data boundary and your on-call load. Managed APIs are cheapest to start and hardest to control; your own fleet is the reverse.',
    cols: ['Option', 'Control', 'Ops burden', 'Fits when', 'Watch out for'],
    rows: [
      ['[[gemini|Gemini]] pay-as-you-go (shared capacity)', 'Low', 'None', 'Most workloads, spiky or unknown volume', '429s under contention; model retirement schedule'],
      ['Gemini with Provisioned Throughput', 'Medium', 'Low', 'Steady, latency-sensitive production load', 'Paying for capacity you do not use; unit sizing'],
      ['Partner or open models as managed APIs ([[model-garden|Model Garden]])', 'Medium', 'Low', 'You need a specific non-Gemini model or a second source', 'Separate quotas, terms and regions per model'],
      ['Open model on a managed endpoint ([[ap-inference|endpoints]])', 'High', 'Medium', 'Custom or tuned weights, dedicated capacity, VPC-only access', 'Endpoints bill all day; scale-out is slow for big models'],
      ['Self-managed on [[gke|GKE]] with [[gce|GPUs]] or [[tpu|TPUs]]', 'Highest', 'High', 'Extreme scale, special serving needs, strict locality', 'Accelerator supply, engineering time and on-call'],
      ['Gemini on Google Distributed Cloud', 'High', 'High', 'Air-gapped or on-premises requirements', 'Hardware lead time; capability lag against the cloud service']
    ],
    rules: [
      ['You are starting out or volume is unknown', 'Pay-as-you-go Gemini behind a thin interface you own.'],
      ['Load is steady and latency matters', 'Add Provisioned Throughput for the baseline, pay-as-you-go for bursts.'],
      ['You need weights you control or a model Google does not offer as a service', 'Managed endpoint first; own fleet only when the numbers demand it.'],
      ['A legal requirement forbids the managed path', 'Choose the smallest self-run option that satisfies it, and document the requirement.']
    ],
    redflags: [
      'Self-hosting is proposed to save money, with no model of utilisation or staffing cost.',
      'The application calls a model SDK directly in a hundred places, so switching is a rewrite.',
      'No fallback exists if the chosen model or region is unavailable.',
      'A managed endpoint was deployed for an experiment and nobody owns its cost.'
    ],
    ask: [
      'What is the cost per million tokens at our utilisation, all-in, including people?',
      'What is the fallback when this model or region is down?',
      'How long does it take to switch models, and have we tried?',
      'Which data leaves our boundary on each path?'
    ],
    revisit: 'When volume or latency needs change by a factor of three, when a new model tier appears, or when a legal constraint changes.',
    related: ['gemini', 'model-garden', 'ap-inference', 'gke', 'tpu']
  },
  {
    id: 'agent-runtime', theme: 'architecture', title: 'How do we host the agent?',
    question: 'Visual builder, managed agent runtime, serverless containers, or Kubernetes?',
    door: 'two-way', doorNote: 'Agent logic written against ADK and standard protocols moves between hosts with modest effort. Platform-specific builders move less easily.',
    why: 'The host sets who runs the loop, where state lives, how it scales, and how you debug a failure at 3 a.m. Choose the most managed option that lets you control what you actually need to control.',
    cols: ['Option', 'You control', 'You operate', 'Fits when', 'Watch out for'],
    rows: [
      ['[[agent-studio|Agent Studio]] / Gemini Enterprise Agent Designer', 'Prompts, tools, data', 'Nothing', 'Prototypes, business-built agents, read-only tasks', 'Hard to review and test; ceiling on custom flow'],
      ['[[agent-runtime|Agent Runtime]] with [[adk]] (or LangGraph and others)', 'All agent code and tools', 'Little: you ship code, Google runs it', 'Most production agents; long-running work; sessions and memory', 'Billing for resident compute; governance is opt-in'],
      ['[[cloud-run|Cloud Run]] container', 'Everything in the container', 'The service and its state stores', 'You need custom frameworks or tight latency control', 'Timeouts, scale-from-zero, state you must build'],
      ['[[gke|GKE]]', 'Everything, including the network', 'The cluster and the agents', 'Many agents beside self-hosted models; strict network control', 'Platform effort; slow to change'],
      ['[[ces|Customer Engagement Suite]] conversational agents', 'Flows and playbooks', 'Nothing', 'Contact-centre agents with telephony and handoff', 'Less flexible for non-service use cases']
    ],
    rules: [
      ['It is a prototype or a low-risk internal helper', 'Agent Studio or Agent Designer. Move to code when it needs tests.'],
      ['It is a production agent and you want less to operate', 'Agent Runtime with ADK.'],
      ['It must live beside your own models or services, or needs unusual frameworks', 'Cloud Run, or GKE when you already run it.'],
      ['It is customer service on voice or chat', 'Evaluate Customer Engagement Suite before building.']
    ],
    redflags: [
      'Business logic lives only in a visual builder with no version control.',
      'Long-running agents sit idle on always-on compute with no scaling bounds.',
      'The agent runs under a broad shared service account.',
      'Nobody can replay a failed run step by step.'
    ],
    ask: [
      'Where is the canonical definition of this agent, and is it in version control?',
      'How do we trace a single run through every model and tool call?',
      'Whose identity does each tool call run under?',
      'What does it cost while idle?'
    ],
    revisit: 'When the agent graduates from prototype, when volume changes, or when the platform adds or retires a hosting option.',
    related: ['agent-studio', 'agent-runtime', 'adk', 'cloud-run', 'gke']
  },
  {
    id: 'vector-store', theme: 'architecture', title: 'Which vector store?',
    question: 'Where do embeddings live, and what runs the nearest-neighbour search?',
    door: 'two-way', doorNote: 'Moving embeddings is a re-index, not a rewrite, if retrieval sits behind an interface. Running one more database is the real commitment.',
    why: 'Retrieval quality and access control, not raw speed, decide most RAG outcomes. The store matters mainly for scale, filtering, freshness and operations.',
    cols: ['Option', 'Scale', 'Filtering and joins', 'Operations', 'Fits when'],
    rows: [
      ['[[rag-engine|RAG Engine]] managed default', 'Small to medium', 'Metadata filters', 'None', 'A first assistant, a baseline, a small team'],
      ['[[vector-search|Vector Search]]', 'Very large, high QPS', 'Metadata restricts, hybrid search', 'Low: deployed index nodes', 'Dedicated retrieval tier with strict latency'],
      ['[[alloydb|AlloyDB]] (pgvector, ScaNN)', 'Large (billions with ScaNN)', 'Full SQL joins and filters', 'Medium: a database', 'Operational data already in Postgres'],
      ['[[cloud-sql|Cloud SQL]] (pgvector)', 'Small to mid', 'Full SQL', 'Low', 'Pilots and mid-size apps already on Cloud SQL'],
      ['[[spanner|Spanner]] or [[firestore|Firestore]] vector search', 'Mid', 'Transactional with the row, or document filters', 'Low', 'Vectors that must stay consistent with global or document data'],
      ['[[bigquery-ai|BigQuery vector search]]', 'Very large, batch-oriented', 'SQL', 'None', 'Analytical retrieval, offline matching, not low-latency serving']
    ],
    rules: [
      ['You are starting', 'RAG Engine default, or the Postgres you already run.'],
      ['Your source data is relational and permissions are in SQL', 'AlloyDB or Cloud SQL, filtering in the same query.'],
      ['You need a large dedicated tier with high QPS', 'Vector Search.'],
      ['The use is analytical and latency is not critical', 'BigQuery vector search.']
    ],
    redflags: [
      'A separate vector database is proposed with no recall measurement showing the current one is insufficient.',
      'Per-user access control is applied after retrieval, in the prompt, instead of in the query.',
      'The embedding model name is not stored with the vectors.',
      'No plan exists for deleting a document from the index and its caches.'
    ],
    ask: [
      'What recall at k do we measure today, and on what test set?',
      'How do filters interact with the approximate index at our selectivity?',
      'How do we re-index if we change the embedding model?',
      'How does a deletion request reach the index, the caches and the logs?'
    ],
    revisit: 'When data size grows tenfold, when filtering becomes more selective, or when the embedding model changes.',
    related: ['rag-engine', 'vector-search', 'alloydb', 'cloud-sql', 'spanner']
  },
  {
    id: 'inference-pattern', theme: 'architecture', title: 'Synchronous, streaming, asynchronous or batch?',
    question: 'How does a request travel, and how long is anyone waiting?',
    door: 'mixed', doorNote: 'Changing the pattern changes the API contract, the UI and the failure handling. Pick early.',
    why: 'The pattern fixes your timeouts, your retry rules, your cost per token (batch is much cheaper) and your user experience.',
    cols: ['Pattern', 'User waits', 'Typical building blocks', 'Cost', 'Failure handling'],
    rows: [
      ['Synchronous request and response', 'A second or two', '[[cloud-run]], [[gemini]]', 'Standard', 'Timeouts and fallback answers'],
      ['Streaming chat', 'First tokens fast, a few seconds total', '[[load-balancing]] with long timeouts, SSE or WebSocket from [[cloud-run]]', 'Standard', 'Reconnect, partial answers, buffering bugs'],
      ['Live voice and video', 'Real time', 'Gemini Live API, [[speech-to-text]], [[text-to-speech]]', 'Higher', 'Interruptions, latency spikes, device and network variance'],
      ['Asynchronous job', 'Minutes', '[[pubsub]] or [[cloud-tasks]], a worker on [[cloud-run]], a result store', 'Standard', 'Retries, idempotency, status polling'],
      ['Batch', 'Hours', 'Gemini batch, [[bigquery-ai]], [[ap-inference|batch inference]], [[batch]]', 'Lowest', 'Late failures, partial results, re-runs']
    ],
    rules: [
      ['A person is typing and watching', 'Streaming, with a short time to first token.'],
      ['The task takes longer than a request timeout', 'Asynchronous with a status endpoint and a result store.'],
      ['Nobody is waiting and volume is large', 'Batch. It is the cheapest pattern.'],
      ['It is a voice conversation', 'Evaluate the Live API; every added hop is audible.']
    ],
    redflags: [
      'A long agent run is held open inside one HTTP request.',
      'Retries are added at several layers without backoff or idempotency.',
      'Streaming was tested directly against the app but not through the real load balancer path.',
      'A batch-suitable job runs on the interactive path at full price.'
    ],
    ask: [
      'Which timeout is the smallest on the full request path, and who set it?',
      'What does the user see when the model is slow or down?',
      'Is every retried operation idempotent?',
      'Which workloads could move to batch?'
    ],
    revisit: 'When latency requirements change, when usage shifts from chat to long-running tasks, or when batch-eligible work appears.',
    related: ['cloud-run', 'pubsub', 'cloud-tasks', 'load-balancing', 'gemini']
  },
  {
    id: 'capacity-strategy', theme: 'architecture', title: 'How do we secure capacity and throughput?',
    question: 'Will the model calls and accelerators be there when we need them?',
    door: 'two-way', doorNote: 'Commitments are one-way for their term. Everything else can be adjusted.',
    why: 'Quota, capacity and money are three different things. Launch-day throttling is the most common surprise in AI systems, and accelerator shortages are not solved by paying more.',
    cols: ['Lever', 'What it gives', 'Commitment', 'Fits when', 'Limit'],
    rows: [
      ['Quota increase ([[quotas]])', 'Permission to use more', 'None', 'Always, ahead of launch', 'Not a guarantee that capacity exists'],
      ['Dynamic shared quota (default Gemini)', 'Shared pool with no fixed cap', 'None', 'Spiky or experimental load', 'Can return 429 under contention'],
      ['Provisioned Throughput', 'Reserved model capacity', 'A term', 'Steady, latency-sensitive production', 'Idle cost; unit sizing'],
      ['Second model or region fallback', 'Resilience', 'Engineering effort', 'Anything business critical', 'Quality differences; residency rules'],
      ['Accelerator reservations and [[dws|Dynamic Workload Scheduler]]', 'GPUs and TPUs when needed', 'A block or a queue', 'Training and self-hosted serving', 'Flex start has no deadline guarantee'],
      ['Spot VMs and flex-start', 'Cheap, interruptible capacity', 'None', 'Fault-tolerant batch and checkpointed jobs', 'Preemption']
    ],
    rules: [
      ['Launching a user-facing feature', 'Raise quotas for peak in every region and load test, weeks ahead.'],
      ['The feature is critical and steady', 'Provisioned Throughput for the baseline plus a tested fallback model.'],
      ['Training on scarce accelerators', 'Reservation or calendar mode for deadlines; flex-start where waiting is fine.'],
      ['Work can be interrupted', 'Spot with checkpoints.']
    ],
    redflags: [
      'No load test has run at expected peak with realistic prompts.',
      'Retries have no backoff, so throttling becomes an outage.',
      'The fallback model has never been run against the evals.',
      'A reservation was bought before the job was designed to use it fully.'
    ],
    ask: [
      'What are our quotas per region, and what is our peak?',
      'What happens at the first 429, step by step?',
      'Which GPUs or TPUs do we depend on, and how do we get them next month?',
      'When did we last test the fallback?'
    ],
    revisit: 'Before each launch, each quarter, and whenever a model or accelerator generation changes.',
    related: ['quotas', 'gemini', 'dws', 'gce', 'tpu']
  },
  {
    id: 'orchestration', theme: 'architecture', title: 'How do we orchestrate the work?',
    question: 'Which service coordinates multi-step flows, schedules and retries?',
    door: 'two-way', doorNote: 'Steps are usually small services, so the orchestrator can be replaced with effort rather than a rewrite.',
    why: 'Orchestration is where retries, state, approvals and visibility live. The wrong choice makes simple flows heavy, or makes complex ones unobservable.',
    cols: ['Option', 'Model', 'Best for', 'Limits', 'Human steps'],
    rows: [
      ['[[workflows|Workflows]]', 'Serverless steps in YAML', 'API-driven flows, approvals, glue between services', 'Payload size; not for heavy compute', 'Callbacks, cheap waiting'],
      ['[[composer|Cloud Composer]] (Airflow)', 'DAGs on a schedule', 'Dependency-heavy data and ML schedules, backfills', 'Always-on environment; heavy for event flows', 'Sensors and manual triggers'],
      ['[[ap-pipelines|Pipelines]]', 'ML DAGs with lineage and caching', 'Train, evaluate, register, deploy', 'ML-shaped; not general orchestration', 'Conditions and approval steps'],
      ['Event choreography ([[eventarc]] + [[pubsub]])', 'Services react to events', 'Loose coupling, fan-out', 'Hard to see the whole flow', 'Needs an explicit approval service'],
      ['Agent orchestration (ADK workflow agents)', 'Sequential, parallel, loop agents', 'LLM steps whose order may vary', 'Harder to test than fixed flows', 'Tool-level approvals'],
      ['[[batch|Batch]]', 'Job-level scheduler', 'Large run-to-completion compute', 'Not an orchestrator of services', 'None']
    ],
    rules: [
      ['The flow calls APIs and might wait for a person', 'Workflows.'],
      ['It is a scheduled data or ML process with many dependencies', 'Composer, or Pipelines for pure ML.'],
      ['Services should be independent and react to events', 'Eventarc and Pub/Sub, with a dead-letter topic and idempotent handlers.'],
      ['Order depends on what an LLM finds', 'ADK agents, with hard limits.']
    ],
    redflags: [
      'Heavy data transformation is done inside the orchestrator.',
      'Workflow payloads carry documents instead of references.',
      'No one can see, in one place, where an instance of the process stands.',
      'Retried steps are not idempotent.'
    ],
    ask: [
      'Where do I look to see what state this process is in?',
      'What happens on a repeated step or a repeated event?',
      'Who approves, and what happens if they never respond?',
      'What are the payload, step and duration limits?'
    ],
    revisit: 'When the flow gains a human step, when volume grows tenfold, or when two orchestrators start overlapping.',
    related: ['workflows', 'composer', 'ap-pipelines', 'eventarc', 'pubsub']
  },
  {
    id: 'training-compute', theme: 'architecture', title: 'Where do we train?',
    question: 'Which service runs training, and on what accelerators?',
    door: 'mixed', doorNote: 'Code that targets a framework moves between GPUs and TPUs with work. The investment in a specific stack is the real lock-in.',
    why: 'Training consumes the scarcest and most expensive resources you have. The choice affects obtainability, cost, recovery from failure and how many people it takes.',
    cols: ['Option', 'You manage', 'Fits when', 'Accelerators', 'Watch out for'],
    rows: [
      ['[[bigquery-ai|BigQuery ML]]', 'SQL only', 'Tabular models, forecasts and first recommenders by analysts', 'None needed', 'Limited model choice'],
      ['[[ap-training|Managed Training]] (custom or serverless)', 'Container and code', 'Most custom training and fine-tuning', 'GPUs and TPUs', 'Queue time for scarce accelerators; resume logic is yours'],
      ['[[ap-tuning|Model Tuning]] recipes', 'Data only', 'Tuning Gemini or common open models', 'Handled for you', 'Little control over training details'],
      ['[[gke|GKE]] with JobSet and [[dws|DWS]]', 'The cluster and jobs', 'Large or unusual jobs, mixed training and serving fleets', 'GPUs and TPUs', 'Platform engineering effort'],
      ['[[gce|Compute Engine]] or Slurm with Cluster Director', 'The cluster, scheduler and recovery', 'HPC-style teams, maximum control', 'GPUs, TPUs', 'You own health checks and repair'],
      ['[[tpu|TPU]] (JAX or PyTorch/XLA)', 'Model code for XLA', 'Large-scale training where price-performance matters', 'TPU slices', 'Library and kernel compatibility; topology planning']
    ],
    rules: [
      ['The model is tabular or small', 'BigQuery ML or a small managed job. Do not buy accelerators.'],
      ['You are tuning a supported model', 'Model Tuning first.'],
      ['It is custom training', 'Managed Training; move to GKE only when you need its control.'],
      ['You train at foundation-model scale', 'Own the cluster with a named capacity owner, a TPU or GPU strategy and tested recovery.']
    ],
    redflags: [
      'A large training run starts without a tested checkpoint and resume path.',
      'Capacity is assumed because quota was granted.',
      'Data loading is not profiled, so expensive accelerators wait on storage.',
      'There is no cost ceiling on the experiment.'
    ],
    ask: [
      'How do we get these accelerators, and what if we do not?',
      'How long can we lose before we resume from a checkpoint?',
      'Is the input pipeline fast enough to keep chips busy?',
      'What is the cost of one failed run?'
    ],
    revisit: 'Per training campaign, and when a new accelerator generation lands.',
    related: ['ap-training', 'ap-tuning', 'gke', 'tpu', 'dws']
  },

  /* ---------------- RISK, QUALITY & COST ---------------- */
  {
    id: 'evaluation', theme: 'risk', title: 'How will we know it works?',
    question: 'What evidence says this is good enough to ship, and to keep shipping?',
    door: 'two-way', doorNote: 'You can improve evaluation at any time, but without it every other decision is an opinion.',
    why: 'Generative systems are non-deterministic and fail in subtle ways. An eval set is the only thing that makes model, prompt and retrieval changes comparable, and it is the gate for autonomy.',
    cols: ['Method', 'Measures', 'Cost', 'Good for', 'Weakness'],
    rows: [
      ['Versioned eval set with reference answers', 'Task accuracy and format', 'Low per run; effort to build', 'Regression tests on every change', 'Needs real, representative cases'],
      ['Model-based autoraters ([[ap-evals|Agent Platform Evals]])', 'Quality against a rubric', 'Tokens', 'Scale, open-ended outputs', 'Judge bias; needs calibration to humans'],
      ['Retrieval metrics (recall at k)', 'Whether the right passages surface', 'Low', 'RAG systems ([[rag-engine]])', 'Needs labelled relevant passages'],
      ['Agent simulation and trajectory checks', 'Tool choice, order and multi-step success', 'Medium', 'Agents ([[adk]])', 'Synthetic users reflect your assumptions'],
      ['Live-traffic evaluation and feedback', 'Real behaviour and drift', 'Ongoing', 'Production quality', 'Delayed labels; privacy of data'],
      ['Human review and red teaming', 'Subtle failures and safety', 'High', 'Launch gates and high-risk domains', 'Slow; hard to scale']
    ],
    rules: [
      ['Before any build', 'Write the eval set first, from real cases, with a threshold.'],
      ['A prompt, model or retrieval change is proposed', 'Run the eval set, and report by slice, not only the mean.'],
      ['The system uses tools', 'Score tool choice and parameters separately from the final answer.'],
      ['You will remove an approval step', 'Require measured accuracy on that action class, over enough cases and time.']
    ],
    redflags: [
      'Quality is judged by demo and gut feel.',
      'The eval set is tuned against repeatedly and never refreshed.',
      'Only averages are reported, hiding a bad segment.',
      'An LLM judge is used with no calibration against people.'
    ],
    ask: [
      'Where is the eval set, who owns it, and how recently was it refreshed?',
      'What does the score look like per segment and per risk class?',
      'How do user complaints become new test cases?',
      'What score blocks a release?'
    ],
    revisit: 'Every model change, each quarter, and after any production incident.',
    related: ['ap-evals', 'rag-engine', 'adk', 'agent-runtime', 'model-garden']
  },
  {
    id: 'human-in-loop', theme: 'risk', title: 'How much do we trust it to act?',
    question: 'Which actions need a person, and whose authority does the agent use?',
    door: 'two-way', doorNote: 'Easy to relax later once evidence exists. Hard to tighten after an incident has taught users to expect speed.',
    why: 'Permissions bound the damage when the model is wrong or manipulated. Approval is the cheapest control you have, and identity decides what an action means in the audit log.',
    cols: ['Pattern', 'How it works', 'Building blocks', 'Best for', 'Risk'],
    rows: [
      ['Read-only', 'The agent looks things up and cannot change anything', '[[iam]] read roles, managed MCP tools ([[agent-protocols]])', 'First deployments', 'Low; exposure of data the user should not see'],
      ['Propose, then approve', 'The agent drafts the change and a person confirms', '[[workflows|Workflows]] callbacks, approval UI', 'Most state-changing actions', 'Approval fatigue'],
      ['Approve above a threshold', 'Small reversible actions are automatic, larger ones need a person', 'Policy in the tool, [[agent-governance|Agent Gateway]]', 'Routine operations with a value range', 'Threshold gaming and splitting'],
      ['Autonomous within limits', 'Agent acts with scoped identity, caps and rollback', '[[agent-governance|Agent Identity]], [[billing|budgets]], [[audit-logs]]', 'Proven, reversible, high-volume tasks', 'Acts before anyone looks'],
      ['Dual control', 'Two people approve', 'Workflows with two callbacks', 'High-value or irreversible actions', 'Slow']
    ],
    rules: [
      ['The action changes money, data or access', 'Propose then approve, until measured error rates justify more.'],
      ['The action is reversible and capped', 'Consider autonomy for that class, with alarms.'],
      ['The agent acts for a user', 'Use that user\'s delegated authority, not a shared admin account.'],
      ['The action is irreversible', 'Keep a person in the loop, always.']
    ],
    redflags: [
      'The agent uses one broad service account for everything.',
      'Approvals are rubber-stamped because volume is too high.',
      'Tools accept free-form parameters with no server-side validation.',
      'Nobody can reconstruct what the agent did and under whose authority.'
    ],
    ask: [
      'What is the worst action the agent can take today, and who would notice?',
      'Whose identity appears in the audit log for each action?',
      'What evidence would let us remove this approval?',
      'How do we undo an action?'
    ],
    revisit: 'When measured accuracy changes, after any incident, and when new tools are added.',
    related: ['workflows', 'agent-governance', 'iam', 'audit-logs', 'agent-protocols']
  },
  {
    id: 'cost-levers', theme: 'risk', title: 'How do we keep it affordable?',
    question: 'Which levers cut cost per successful task, and what do they cost in quality?',
    door: 'two-way', doorNote: 'Most levers are reversible, though each can cost quality, so re-run the evals after every change.',
    why: 'Tokens are the bill, and agents multiply them: retries, loops, long contexts and thinking tokens all count. Cost per call hides this; cost per successful task shows it.',
    cols: ['Lever', 'How', 'Typical effect', 'Quality risk', 'Where'],
    rows: [
      ['Route by difficulty', 'Cheaper tiers (Flash-Lite, Flash) for easy cases, Pro only for hard ones', 'Large', 'Misrouted hard cases', '[[gemini]], [[apigee]]'],
      ['Context caching', 'Stable prefixes (system prompt, shared documents) cached', 'Medium to large on long prompts', 'None, if keys are stable', '[[gemini]]'],
      ['Batch', 'Run non-urgent work asynchronously at a discount', 'Large', 'Latency', '[[gemini]], [[bigquery-ai]], [[batch]]'],
      ['Semantic or response cache', 'Skip the model for repeated questions', 'Large for repetitive traffic', 'Wrong cached answers', '[[memorystore]]'],
      ['Bound thinking and output', 'Set thinking budgets, shorter answers', 'Medium', 'Lower reasoning quality', '[[gemini]]'],
      ['Fewer calls per task', 'Merge steps, retrieve better, stop loops', 'Medium', 'Lower accuracy if over-merged', '[[adk]]'],
      ['Tune a smaller model', 'Distil a large model\'s behaviour', 'Large at volume', 'Narrow generalisation', '[[ap-tuning]]'],
      ['Commit where steady', 'Provisioned Throughput, committed use', 'Medium', 'Paying for idle', '[[quotas]], [[billing]]']
    ],
    rules: [
      ['The task is easy for a small model', 'Route to a cheaper tier and verify on evals.'],
      ['Prompts repeat large shared prefixes', 'Use context caching and keep changing text at the end.'],
      ['Nobody is waiting', 'Batch it.'],
      ['Spend rises with no quality gain', 'Look for loops, retries and oversized context before changing models.']
    ],
    redflags: [
      'Cost is tracked per call, not per successful task.',
      'No per-tenant or per-feature cost attribution exists.',
      'Budgets alert but nothing slows the spend.',
      'A cheaper model was chosen with no eval run.'
    ],
    ask: [
      'What is our cost per successful task, and how does it break down?',
      'Which levers have we applied, and what did they do to the eval scores?',
      'How fast would a runaway loop be noticed and stopped?',
      'What happens to unit cost at ten times the volume?'
    ],
    revisit: 'Monthly while volume grows, and whenever prices or model tiers change.',
    related: ['gemini', 'billing', 'apigee', 'memorystore', 'quotas']
  },
  {
    id: 'tenancy', theme: 'risk', title: 'How do we isolate tenants and data?',
    question: 'How do customers, teams or users stay apart in storage, retrieval, caches and logs?',
    door: 'one-way', doorNote: 'Retrofitting isolation after launch means migrating data and re-testing every path. Decide before onboarding sensitive tenants.',
    why: 'A missing filter leaks one customer\'s data to another, and the leak can come from a vector index, a cache, a log or a model memory, not only the database.',
    cols: ['Model', 'Isolation', 'Cost and effort', 'Fits when', 'Risk'],
    rows: [
      ['Pooled data with tenant filters', 'Logical: filters in every query, index and cache key', 'Lowest', 'Many small tenants, low sensitivity', 'One missed filter leaks data'],
      ['Separate index or collection per tenant', 'Stronger logical isolation in retrieval', 'Medium', 'Moderate sensitivity, tenants of varied size', 'Many indexes to operate and pay for'],
      ['Separate dataset or database per tenant', 'Data-layer separation with IAM per tenant', 'Medium to high', 'Contractual separation, uneven tenants', 'Operational overhead'],
      ['Separate project per tenant ([[iam]], [[vpc-sc]])', 'Strong boundary for IAM, quotas, billing, perimeters', 'High', 'Regulated or large tenants', 'Provisioning automation required ([[infra-manager]])'],
      ['Per-tenant keys ([[kms]] CMEK)', 'Cryptographic: disable a key to cut off data', 'Medium', 'Strict control and deletion needs', 'Key management and quota on KMS']
    ],
    rules: [
      ['Tenants are small and data is not sensitive', 'Pooled with filters, tested adversarially.'],
      ['Contracts require separation or per-tenant deletion', 'Dedicated datasets or projects, and per-tenant keys.'],
      ['Any shared cache, memory or log can hold tenant text', 'Scope it by tenant in the key, or do not share it.'],
      ['Regulators are involved', 'Project-level isolation, perimeters and key control from day one.']
    ],
    redflags: [
      'Tenant filtering relies on the prompt asking the model to ignore other data.',
      'Semantic caches or memory stores are shared across tenants.',
      'Logs and traces hold prompts and are visible to every engineer.',
      'Nobody has attempted a cross-tenant retrieval test.'
    ],
    ask: [
      'Show me a test where tenant A tries to read tenant B through every path.',
      'Where does tenant text live, including caches, memory, logs and backups?',
      'How do we delete a tenant completely, including embeddings?',
      'What does a noisy tenant do to everyone else\'s quota?'
    ],
    revisit: 'Before onboarding any regulated tenant, and after any change to caching, memory or logging.',
    related: ['iam', 'vpc-sc', 'kms', 'agent-memory', 'rag-engine']
  }
];
