/* Playbooks for engineering leaders: maturity ladder, readiness checklist, ADR template, solution shaper.
   Checklist `see` entries are 'svc:<service-id>' or 'dec:<decision-id>'. */

window.ATLAS.ladder = [
  {
    stage: 'Prototype', time: 'Days to weeks',
    goal: 'Prove there is real value and that it is feasible on real data.',
    exit: [
      'An eval set exists (real, representative cases) and the baseline has a score.',
      'Two or three real users or stakeholders confirm the output is useful.',
      'A first estimate of cost per task, and the top three risks, are written down.'
    ],
    skip: ['Building a platform', 'Fine-tuning', 'Optimising cost', 'Multi-region']
  },
  {
    stage: 'Pilot', time: 'Weeks',
    goal: 'Prove reliability and safety with real users in a limited scope.',
    exit: [
      'The eval score meets the agreed threshold on a larger set.',
      'Actions are read-only or approval-gated; guardrails and tenant isolation are tested.',
      'Monitoring exists, someone is on call, and cost per task is measured.'
    ],
    skip: ['Removing approvals', 'Widening tool access', 'Chasing scale']
  },
  {
    stage: 'Production', time: 'Weeks to a quarter',
    goal: 'Prove it can be operated, not just built.',
    exit: [
      'Service levels are defined and have been met for several weeks.',
      'Quotas and capacity cover peak; the fallback path has been tested.',
      'Runbooks have been used in an exercise, and cost is attributed per tenant or feature.'
    ],
    skip: ['New autonomous capabilities without new evals']
  },
  {
    stage: 'Scale', time: 'Ongoing',
    goal: 'Prove the economics and the resilience.',
    exit: [
      'Cost per successful task is at target, using caching, batching, routing or smaller models.',
      'A capacity plan covers growth, including a region or model outage.',
      'Autonomy has been raised only where measured accuracy justifies it, and decision records are reviewed quarterly.'
    ],
    skip: ['Rewriting for its own sake']
  }
];

window.ATLAS.readiness = [
  {
    id: 'quality', name: 'Quality and evaluation', items: [
      { id: 'q1', kind: 'both', t: 'A versioned eval set of real, representative cases exists, with agreed pass thresholds.', why: 'Without it every change is an argument, not a measurement.', see: ['dec:evaluation', 'svc:ap-evals'] },
      { id: 'q2', kind: 'both', t: 'Evals run automatically on every change to prompt, model, retrieval or code.', why: 'Regressions from small edits are the most common quality loss.', see: ['dec:evaluation'] },
      { id: 'q3', kind: 'agent', t: 'Tool choice and parameter accuracy are measured separately from final answer quality.', why: 'A right answer from a wrong tool call is luck, and it will not repeat.', see: ['dec:agent-runtime', 'svc:adk'] },
      { id: 'q4', kind: 'both', t: 'For RAG, retrieval quality (recall at k) is measured separately from generation.', why: 'It tells you which half to fix.', see: ['dec:vector-store', 'svc:rag-engine'] },
      { id: 'q5', kind: 'ml', t: 'Offline metrics map to a business metric, and the holdout reflects production data.', why: 'A model can win offline and lose in production.', see: ['svc:ap-pipelines'] },
      { id: 'q6', kind: 'both', t: 'Known failure modes are documented, with what the user sees when each happens.', why: 'Graceful failure is designed, not discovered.', see: [] }
    ]
  },
  {
    id: 'safety', name: 'Safety and security', items: [
      { id: 's1', kind: 'agent', t: 'Every tool is narrow, validates its parameters server-side, and runs with least privilege.', why: 'Permissions bound the damage when the model is wrong or manipulated.', see: ['dec:human-in-loop', 'svc:iam'] },
      { id: 's2', kind: 'agent', t: 'Writes and irreversible actions need approval, or have a written justification from measured accuracy.', why: 'Approval is the cheapest control you have.', see: ['dec:human-in-loop', 'svc:workflows'] },
      { id: 's3', kind: 'agent', t: 'Prompt injection through retrieved text and tool output has been tested; tool output is treated as data.', why: 'Any text the agent reads can contain instructions.', see: ['svc:model-armor', 'svc:agent-governance'] },
      { id: 's4', kind: 'both', t: 'Model Armor or equivalent screening and PII handling are configured and tested on inputs and outputs; logging of sensitive text is a deliberate choice.', why: 'Logs and caches are where sensitive data quietly accumulates.', see: ['svc:model-armor', 'svc:sdp'] },
      { id: 's5', kind: 'both', t: 'Per-user and per-tenant isolation is tested across retrieval, caches and logs.', why: 'A missing filter leaks one customer\'s data to another.', see: ['dec:tenancy'] },
      { id: 's6', kind: 'both', t: 'Encryption keys, private network paths and VPC Service Controls perimeters are in place, where required.', why: 'Prompts and datasets should not cross the public internet or leave your perimeter.', see: ['svc:kms', 'svc:vpc-sc', 'svc:psc'] },
      { id: 's7', kind: 'both', t: 'Model and vendor terms on data use, retention and residency are reviewed, including global and multi-region endpoints.', why: 'Compliance owners need to approve this before launch, not after.', see: ['svc:gemini'] }
    ]
  },
  {
    id: 'reliability', name: 'Reliability and capacity', items: [
      { id: 'r1', kind: 'both', t: 'Quotas (requests and tokens per minute, GPU and TPU chips) are requested for peak, in every region used.', why: 'Increases take days, and capacity is a separate matter.', see: ['dec:capacity-strategy', 'svc:quotas'] },
      { id: 'r2', kind: 'both', t: 'Retries use backoff and jitter; timeouts line up across every hop; retried actions are idempotent.', why: 'Throttling plus naive retries becomes an outage.', see: ['dec:inference-pattern'] },
      { id: 'r3', kind: 'both', t: 'A fallback model or degraded mode exists, and has been tested against the evals.', why: 'Models and regions have bad days.', see: ['dec:capacity-strategy'] },
      { id: 'r4', kind: 'agent', t: 'Hard caps exist on steps, tokens and wall-clock time per session.', why: 'Loops are how a small bug becomes a large bill.', see: ['dec:autonomy-level'] },
      { id: 'r5', kind: 'ml', t: 'Model rollout uses a traffic split or shadow traffic with a tested rollback; the previous version is kept.', why: 'A bad model needs a one-step undo.', see: ['svc:ap-inference'] },
      { id: 'r6', kind: 'both', t: 'Load tests cover peak traffic, slow requests and cold scale-out.', why: 'Accelerator and model start-up time makes scaling slower than it looks.', see: ['svc:ap-inference'] }
    ]
  },
  {
    id: 'cost', name: 'Cost', items: [
      { id: 'c1', kind: 'both', t: 'Cost per successful task is measured and attributed by feature and tenant.', why: 'Cost per call hides retries, loops and long contexts.', see: ['dec:cost-levers', 'svc:billing'] },
      { id: 'c2', kind: 'both', t: 'Budget alerts and per-client rate limits guard against runaway spend.', why: 'Billing data lags, so you need faster signals too.', see: ['svc:billing', 'svc:cloud-armor', 'svc:apigee'] },
      { id: 'c3', kind: 'both', t: 'Idle resources (endpoints, clusters, notebooks) have owners and automatic shutdown.', why: 'Forgotten accelerators are a leading source of waste.', see: ['svc:ap-inference', 'svc:ap-workbench'] },
      { id: 'c4', kind: 'both', t: 'The forecast at current and ten times current volume is written down with its assumptions.', why: 'Unit economics that break at scale are better found now.', see: [] }
    ]
  },
  {
    id: 'ops', name: 'Operations and observability', items: [
      { id: 'o1', kind: 'both', t: 'Dashboards show latency (including time to first token), errors, throttles, tokens, queue age and accelerator utilisation.', why: 'You cannot run what you cannot see.', see: ['svc:cloud-monitoring'] },
      { id: 'o2', kind: 'agent', t: 'Every agent run is traceable step by step (reasoning, tool calls, results) and can be replayed.', why: 'Non-deterministic failures need a record to debug.', see: ['svc:agent-runtime', 'svc:cloud-monitoring'] },
      { id: 'o3', kind: 'both', t: 'Alerts page a named on-call rota, with runbooks for throttling, model outage, bad output and runaway cost.', why: 'Alerts without owners are noise.', see: ['svc:cloud-monitoring'] },
      { id: 'o4', kind: 'ml', t: 'Drift and data-quality monitoring has a defined retraining trigger and an owner.', why: 'Models decay quietly.', see: ['svc:ap-monitoring'] },
      { id: 'o5', kind: 'both', t: 'Infrastructure is defined as code; environments are reproducible; changes are reviewed.', why: 'Manual setups cannot be audited or rebuilt.', see: ['svc:infra-manager'] },
      { id: 'o6', kind: 'both', t: 'Model versions are pinned, and a process exists for retirements and upgrades.', why: 'Providers retire models on their schedule, not yours.', see: ['svc:gemini'] }
    ]
  },
  {
    id: 'data', name: 'Data and privacy', items: [
      { id: 'd1', kind: 'both', t: 'Data sources are catalogued with owners, and permission to use them for this purpose is confirmed.', why: 'Legal and trust problems start with unexamined data.', see: ['svc:knowledge-catalog'] },
      { id: 'd2', kind: 'both', t: 'Sensitive data is scanned for before it enters a training set or an index.', why: 'It is far cheaper to keep it out than to remove it.', see: ['svc:sdp'] },
      { id: 'd3', kind: 'both', t: 'Retention and deletion are defined for prompts, outputs, embeddings and logs, including full tenant deletion.', why: 'Embeddings and logs are easy to forget when deleting.', see: ['dec:tenancy'] },
      { id: 'd4', kind: 'ml', t: 'Training data, code and model versions are linked so any production model can be reproduced.', why: 'Audits and incidents both ask for this.', see: ['svc:ap-pipelines'] }
    ]
  },
  {
    id: 'team', name: 'Team and process', items: [
      { id: 't1', kind: 'both', t: 'There are named owners for quality, for cost, and for on-call.', why: 'Shared ownership means nobody owns it.', see: [] },
      { id: 't2', kind: 'both', t: 'Users have a feedback channel, and complaints become eval cases.', why: 'Real failures are your best test data.', see: ['dec:evaluation'] },
      { id: 't3', kind: 'both', t: 'The rollout plan has success criteria and a stop rule that says what makes us pause.', why: 'It is easier to agree a stop rule before launch.', see: [] },
      { id: 't4', kind: 'both', t: 'Key decisions are recorded as short decision records with reversibility and a revisit date.', why: 'The next engineer needs to know why, not only what.', see: [] },
      { id: 't5', kind: 'both', t: 'Users are told what the system is, what it cannot do, and how to reach a person.', why: 'Calibrated trust prevents most harm.', see: [] }
    ]
  }
];

window.ATLAS.adrTemplate = [
  '# ADR-NNN: <short decision title>',
  '',
  'Status: Proposed | Accepted | Superseded by ADR-xxx',
  'Date: YYYY-MM-DD',
  'Owner: <name>',
  'Reviewers: <names>',
  '',
  '## Context',
  'What problem are we solving? Constraints, volumes, deadlines, compliance needs.',
  'Eval results so far and the current baseline score.',
  '',
  '## Options considered',
  '| Option | Strengths | Weaknesses | Build cost | Run cost |',
  '|---|---|---|---|---|',
  '| A |  |  |  |  |',
  '| B |  |  |  |  |',
  '',
  '## Decision',
  'We will ...',
  '',
  '## Evidence',
  'Eval scores, cost per successful task, latency, load-test results, security review.',
  '',
  '## Reversibility',
  'Two-way door | One-way door | Mixed. What would it cost, in people and time, to reverse this?',
  '',
  '## Risks and mitigations',
  '- Risk: ...  Mitigation: ...',
  '',
  '## Consequences',
  'What becomes easier, what becomes harder, who is affected.',
  '',
  '## Revisit when',
  'A date, or a trigger (volume 10x, model retired, cost above X, incident).'
].join('\n');

/* ---------- Solution shaper ---------- */
window.ATLAS.shaper = {
  questions: [
    { id: 'goal', label: 'What are you building?', options: [
      ['qa', 'Answers from our own documents'],
      ['agent', 'An assistant that takes actions in our systems'],
      ['docs', 'Extraction of data from documents, forms or scans'],
      ['generate', 'Generating or transforming content (drafts, summaries, classification)'],
      ['predict', 'Predictions from structured data (risk, demand, churn)'],
      ['recs', 'Recommendations or ranking for users']
    ] },
    { id: 'action', label: 'If it takes actions, how much freedom does it get?', only: 'agent', options: [
      ['read', 'Read-only: it looks things up'],
      ['approve', 'It proposes changes and a person approves'],
      ['auto', 'It acts on its own within limits']
    ] },
    { id: 'latency', label: 'How fast must it respond?', options: [
      ['interactive', 'Under a second or two'],
      ['chat', 'Streaming chat: first words quickly, a few seconds in total'],
      ['async', 'Minutes are fine'],
      ['batch', 'Offline, hours are fine']
    ] },
    { id: 'data', label: 'How sensitive is the data?', options: [
      ['public', 'Public or low sensitivity'],
      ['internal', 'Internal business data'],
      ['regulated', 'Regulated or personal data (PII, health, financial)']
    ] },
    { id: 'scale', label: 'What scale do you expect in the first year?', options: [
      ['pilot', 'A pilot or one team'],
      ['mid', 'A product with steady use'],
      ['high', 'High and sustained volume']
    ] },
    { id: 'team', label: 'What does your team look like?', options: [
      ['small', 'Small team, no ML specialists'],
      ['mixed', 'Some ML experience'],
      ['platform', 'A platform or ML engineering team']
    ] },
    { id: 'model', label: 'What do you need from the model?', options: [
      ['managed', 'A managed or off-the-shelf model is fine'],
      ['custom', 'A customised (fine-tuned) model'],
      ['hosted', 'We must host the model ourselves (open weights, locality, cost)']
    ] }
  ],
  defaults: { goal: 'qa', action: 'read', latency: 'chat', data: 'internal', scale: 'pilot', team: 'small', model: 'managed' },

  recommend: function (a) {
    var stack = [], seen = {}, risks = [], next = [], nseen = {}, arch = null, headline = '', deeper = [], dseen = {};
    function more(k, id, why) { if (dseen[k + id]) return; dseen[k + id] = 1; deeper.push({ k: k, id: id, why: why }); }
    function add(id, role, why) { if (seen[id]) return; seen[id] = 1; stack.push({ id: id, role: role, why: why }); }
    function nx(id, why) { if (nseen[id]) return; nseen[id] = 1; next.push({ id: id, why: why }); }
    function risk(t) { if (risks.indexOf(t) < 0) risks.push(t); }

    nx('build-buy-customize', 'Confirm how much to build before committing people.');

    if (a.goal === 'qa') {
      headline = 'Grounded question answering (RAG)'; arch = 'rag-assistant';
      add('gcs', 'Source of truth for the documents', 'Every ingestion path starts here.');
      if (a.team === 'small' || a.scale === 'pilot') {
        add('rag-engine', 'Managed ingestion, chunking, retrieval and grounding', 'The quickest route to a working, cited assistant, with a managed default vector store you can swap later.');
      } else {
        add('rag-engine', 'Ingestion, chunking and retrieval orchestration', 'Keeps the pipeline managed while you choose the index behind it.');
      }
      if (a.scale === 'high') add('vector-search', 'Dedicated vector index with filters', 'High concurrency and strict filtering favour a dedicated retrieval tier.');
      else if (a.scale === 'mid' && a.team !== 'small') add('alloydb', 'Vectors in Postgres (pgvector, ScaNN)', 'One database to operate if your operational data is already in Postgres, with SQL filters for access control.');
      add('gemini', 'Models for embeddings and answers', 'One API to a range of tiers, with no accelerators to run.');
      add('model-armor', 'Screens prompts and responses', 'Cuts unsafe, injected and leaking content.');
      add('identity-platform', 'User identity for per-user retrieval filters', 'Access control must be enforced in retrieval, not in the prompt.');
      nx('vector-store', 'Choose the index and test filtering and recall.');
      nx('improve-model', 'Prompt and retrieval first; fine-tune last.');
      risk('Retrieval quality, not the model, is usually the problem. Measure recall at k separately.');
      risk('Per-user document access must be enforced with metadata filters, and tested.');
      risk('New documents are searchable only after ingestion completes. Define the freshness you promise.');
      nx('retrieval-strategy', 'Stay on hybrid retrieval until evals show you need more.');
      more('a', 'agentic-rag', 'When questions need rewriting, routing or several lookups.');
      if (a.scale !== 'pilot') more('a', 'graphrag', 'Only if multi-hop relationship questions fail on a vector baseline.');
      more('p', 'data-lifecycle', 'Ingestion, freshness and permissions decide quality.');
      more('p', 'evaluation-lifecycle', 'Build the golden set and release gates.');
      if (a.data === 'regulated') more('p', 'compliance-matrix', 'Check residency, keys and perimeter before you pick a retrieval service.');
    } else if (a.goal === 'agent') {
      headline = a.action === 'read' ? 'Read-only tool-using agent' : (a.action === 'approve' ? 'Agent with human approval' : 'Autonomous agent within limits');
      arch = 'agent-platform';
      if (a.team === 'small' && a.model === 'managed') add('agent-studio', 'Low-code agent building and prompt testing', 'The fastest route for a small team; move to code when it needs tests and review.');
      add('adk', 'Code-first agent framework', 'Open framework for tools, workflow agents and evals, with no lock-in to a host.');
      add('agent-runtime', 'Managed runtime with sessions and tracing', 'You ship code, Google runs it, with isolation and scaling handled.');
      add('gemini', 'Reasoning model', 'Use the smallest tier that passes your evals.');
      add('cloud-run', 'Tool implementations', 'Narrow, testable services with explicit schemas.');
      add('rag-engine', 'Knowledge lookup as one of the agent\'s tools', 'Gives the agent grounded facts.');
      add('agent-memory', 'Session state and long-term memory', 'Sessions need to survive restarts, scoped per user.');
      add('identity-platform', 'User identity passed to every tool call', 'Tools must act as the user, not as an admin.');
      add('apigee', 'Entry point with auth, quotas and throttling', 'Per-user limits protect your spend.');
      add('model-armor', 'Screens prompts, responses and tool output', 'A second layer beside permissions.');
      if (a.action === 'approve') add('workflows', 'Approval gate with a callback', 'Pauses for a person and keeps an audit trail.');
      if (a.action === 'auto') {
        add('agent-governance', 'Agent identity, registry and gateway', 'Gives each agent its own identity and policy-checked tool access.');
        add('iam', 'Scoped, short-lived credentials per tool', 'Permissions bound the damage.');
        add('billing', 'Budgets and spend alerts', 'Autonomy plus loops can spend quickly.');
        add('audit-logs', 'Audit trail of every action', 'You will need to answer "what did it do?".');
        risk('The agent acts before anyone looks. Keep actions reversible and capped in count and value.');
      }
      nx('autonomy-level', 'Check a workflow would not do the job.');
      nx('agent-runtime', 'Confirm the hosting choice.');
      nx('human-in-loop', 'Set what needs approval and whose identity tools use.');
      risk('Prompt injection through retrieved text and tool output. Treat both as untrusted data.');
      more('a', 'multi-agent-system', 'If one agent has too many tools or several owners, and for when not to split.');
      more('p', 'agent-governance-guide', 'Agent identity, registry, gateway and tool policy.');
      more('p', 'evaluation-lifecycle', 'Trajectory, tool and adversarial evals and release gates.');
      more('p', 'agentops', 'What to measure and alert on once it is live.');
      more('p', 'incident-runbooks', 'Runbooks for loops, injection, throttling and bad releases.');
      more('a', 'agent-cicd', 'Version and release prompts, tools, models and indexes safely.');
      risk('Loops burn tokens. Cap steps, tokens and wall-clock time per session.');
      risk('Vague tool descriptions cause wrong tool choices. Test tool selection on its own.');
    } else if (a.goal === 'docs') {
      headline = 'Document intelligence pipeline'; arch = 'document-intelligence';
      add('gcs', 'Document landing zone', 'Object events start the workflow.');
      add('eventarc', 'Routes the upload event to the pipeline', 'Decouples ingestion from processing.');
      add('workflows', 'Orchestration with retries and human review', 'Handles failure and low-confidence cases.');
      add('document-ai', 'OCR, layout and field extraction', 'Cheaper and more predictable than asking an LLM to read pixels.');
      add('sdp', 'PII detection and redaction', 'Redact before any generative step.');
      add('gemini', 'Maps messy fields to your schema and checks rules', 'Use the LLM for judgement only.');
      add('firestore', 'Validated results and status', 'Fast lookup for downstream systems.');
      nx('orchestration', 'Pick the orchestration pattern and its limits.');
      risk('An LLM may invent a value. Require each extracted value to appear in the source text.');
      risk('Workflow payloads are limited. Pass Cloud Storage references, not document text.');
      risk('Backfills hit service quotas. Use queues and concurrency limits.');
      if (a.latency === 'interactive') risk('Multi-page extraction is asynchronous. Design the waiting experience.');
    } else if (a.goal === 'generate') {
      headline = 'LLM content and transformation service';
      add('gemini', 'Models through one API, in Pro, Flash and Flash-Lite tiers', 'Start here, match the tier to task difficulty, and compare on your own evals.');
      add('model-garden', 'Partner and open models if you need a second source', 'Same boundary, separate quotas and terms per model.');
      add('model-armor', 'Content and PII controls', 'Required for anything user-facing.');
      if (a.latency === 'interactive' || a.latency === 'chat') { add('apigee', 'Front door with auth, quotas and routing', 'Use streaming for long outputs.'); add('cloud-run', 'Thin application layer', 'Prompt assembly and response streaming.'); }
      nx('inference-pattern', 'Decide between synchronous, streaming and batch.');
      nx('cost-levers', 'Tokens are the bill; plan the levers early.');
      risk('Quality is subjective. Write a scoring rubric and calibrate any model-as-judge against people.');
      risk('Behaviour shifts when model versions change. Pin versions and re-run evals.');
    } else if (a.goal === 'predict') {
      headline = 'Predictive ML platform';
      arch = a.latency === 'interactive' ? 'realtime-features' : 'training-mlops';
      add('gcs', 'Data lake and artifact store', 'Everything reads from and writes to it.');
      add('bigquery', 'Warehouse for training data and features', 'SQL-first preparation where most of your data already lives.');
      add('dataflow', 'Prepares training datasets at scale', 'Repeatable, with data-quality checks.');
      add('ap-workbench', 'Workspace for data scientists', 'Notebooks and experiment tracking.');
      add('ap-training', 'Managed training jobs', 'Pay for accelerators only while they run.');
      add('ap-pipelines', 'Train, evaluate, register, deploy', 'Makes retraining routine and auditable.');
      add('ap-inference', 'Hosts the model', 'Online or batch prediction, to match latency.');
      add('ap-monitoring', 'Drift and skew monitoring', 'Models decay quietly.');
      if (a.latency === 'interactive') add('ap-feature-store', 'Same features online and offline', 'Avoids training-serving skew for low-latency scoring.');
      if (a.team === 'small') add('bigquery-ai', 'Train models in SQL (BigQuery ML)', 'Analysts can ship tabular models with no ML platform to run.');
      if (a.team === 'small') add('model-garden', 'Start from a pretrained model', 'Less to build and tune.');
      nx('training-compute', 'Pick where training runs.');
      nx('orchestration', 'Choose how the pipeline is run.');
      risk('Training-serving skew: define each feature once and use it in both places.');
      risk('Labels often arrive late. Plan proxy metrics meanwhile.');
      risk('Drift needs an owner and a defined retraining trigger.');
      if (a.data === 'regulated') risk('Bias and explainability evidence may be required. Plan for explainable-AI reports and model documentation.');
    } else if (a.goal === 'recs') {
      headline = 'Recommendations and ranking'; arch = 'realtime-features';
      add('gcs', 'Interaction history', 'Training data for any recommender.');
      add('pubsub', 'Live events', 'Fresh behaviour improves recommendations.');
      add('bigquery', 'Interaction and catalogue warehouse', 'Where history is joined, labelled and sampled.');
      if (a.team === 'small' || a.model === 'managed') {
        add('bigquery-ai', 'Train a first recommender in SQL (BigQuery ML)', 'Matrix factorization on your interaction data with no model code.');
        add('ai-search', 'Managed search and recommendations (for commerce and media use cases)', 'Check whether the managed product covers your catalogue before you build.');
      } else {
        add('ap-training', 'Train your own ranking model', 'Control over features and objective.');
        add('ap-feature-store', 'Online and offline features', 'Consistent features at request time.');
        add('ap-inference', 'Serves rankings', 'Autoscaled online endpoint.');
      }
      add('firestore', 'Catalogue and profile lookup', 'Joins recommendation IDs to display data.');
      nx('evaluation', 'Offline metrics must map to business outcomes.');
      risk('Cold start: new users and items have no history. Use metadata and fallbacks.');
      risk('Feedback loops make popular items more popular. Monitor diversity.');
    }

    if (a.model === 'hosted' && (a.goal === 'qa' || a.goal === 'agent' || a.goal === 'generate')) {
      if (a.scale === 'high' && a.team === 'platform') {
        add('gke', 'Serving fleet for open-weight models', 'Control and cost at high steady volume.');
        add('gce', 'GPU capacity (reserved baseline)', 'Reserve accelerators; do not rely on on-demand.');
        add('tpu', 'TPU capacity for serving at scale', 'Evaluate price-performance if your model stack supports it.');
      } else {
        add('ap-inference', 'Managed hosting for open-weight models', 'Less to operate than your own fleet.');
        add('model-garden', 'Starting point for open models', 'Tuned containers and a catalogue.');
      }
      nx('where-model-runs', 'Confirm hosting against the managed API.');
      risk('Accelerator capacity and slow scale-out become your problem. Reserve capacity and keep headroom.');
    }
    if (a.model === 'custom') {
      add('ap-tuning', 'Tuning jobs for Gemini or open models', 'Customise on your data, after prompt and retrieval baselines.');
      add('ap-training', 'Custom training for open-weight fine-tuning', 'Use when managed tuning recipes do not fit.');
      nx('improve-model', 'Prove fine-tuning beats prompt plus retrieval on your evals.');
      risk('Fine-tuning before a prompt and retrieval baseline wastes effort and creates a maintenance duty.');
    }

    if (a.latency === 'interactive') risk('A one- or two-second budget rules out multi-step agent loops and large models. Measure end to end.');
    if (a.latency === 'chat') risk('Streaming breaks behind buffering proxies and short idle timeouts. Test the whole path.');
    if (a.latency === 'async') { add('pubsub', 'Buffers and retries long jobs', 'Protects slow consumers from bursts.'); risk('Async jobs need status, retries, idempotency and a result store.'); nx('inference-pattern', 'Define the job contract.'); }
    if (a.latency === 'batch') { add('workflows', 'Coordinates bulk runs', 'Retries and state for long jobs.'); nx('inference-pattern', 'Batch is the cheapest pattern; confirm it fits.'); risk('Batch failures surface late. Add checks on each stage.'); }

    if (a.data === 'regulated') {
      add('vpc-sc', 'Service perimeter around data and AI services', 'Blocks exfiltration even with stolen credentials.');
      add('psc', 'Private endpoints keep traffic off the public internet', 'Prompts and datasets avoid the public internet.');
      add('kms', 'Customer-managed encryption keys (CMEK)', 'Key control is part of most regulated-data reviews.');
      add('sdp', 'Discovers and redacts sensitive data', 'Keep PII out of training sets, indexes and logs.');
      add('audit-logs', 'Audit log of API activity', 'Evidence for audits.');
      add('iam', 'Least-privilege roles', 'Limits access to datasets and models.');
      nx('tenancy', 'Choose the isolation model before onboarding sensitive tenants.');
      risk('Global and multi-region endpoints can serve requests outside your chosen location. Check residency rules before enabling them.');
      risk('Prompts, outputs and logs hold sensitive data. Restrict access and set retention.');
    } else if (a.data === 'internal') {
      add('psc', 'Private endpoints for Google APIs', 'Keeps traffic off the public internet.');
      add('kms', 'Encryption keys', 'Default encryption, with key control when you need it.');
      add('iam', 'Least-privilege roles', 'Separate service accounts for builders, jobs and apps.');
    }

    if (a.scale === 'mid' || a.scale === 'high') {
      add('quotas', 'Raise model and accelerator quotas before launch', 'Throttling is the most common launch surprise.');
      nx('capacity-strategy', 'Plan quotas, fallbacks and reservations.');
      nx('cost-levers', 'Decide which levers to apply and measure.');
      risk('Quota increases take days. Request them well before launch.');
    }
    if (a.scale === 'high') {
      add('cloud-armor', 'Rate limiting and WAF at the edge', 'Protects against abuse and denial of wallet.');
      if (a.goal === 'qa' || a.goal === 'generate' || a.goal === 'agent') add('memorystore', 'Semantic cache and counters', 'Skips the model on repeated questions; verify answers stay correct.');
    }
    if (a.team === 'small') risk('A small team should avoid operating accelerators or clusters. Stay on managed services until volume forces a change.');

    nx('evaluation', 'Build the eval set before the system.');
    add('cloud-monitoring', 'Metrics, logs, traces and alerts across every layer', 'Latency, errors, throttles, tokens and cost.');
    add('billing', 'Budgets, alerts and cost attribution', 'Forgotten resources and loops are expensive.');

    var phases = [
      'Prototype: build the eval set first, then a baseline of the simplest managed pieces (' + headline.toLowerCase() + ').',
      'Pilot: limit scope and users. Add guardrails, permission and tenant tests, and monitoring. Measure cost per task.' + (a.goal === 'agent' ? ' Keep actions read-only or approval-gated.' : ''),
      'Production: raise quotas, add a tested fallback, load test, write runbooks and define service levels.',
      'Scale: apply cost levers (caching, batching, routing), revisit hosting, and raise autonomy only where measured accuracy supports it.'
    ];

    if (a.scale !== 'pilot') more('p', 'platform-engineering', 'Pipelines, environments, supply chain and recovery.');
    more('d', 'finops', 'Model the cost per successful task before you commit to a budget.');
    return { headline: headline, arch: arch, stack: stack, risks: risks, next: next, phases: phases, deeper: deeper };
  }
};
