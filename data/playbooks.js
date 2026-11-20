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
    var stack = [], seen = {}, risks = [], next = [], nseen = {}, arch = null, headline = '';
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

    return { headline: headline, arch: arch, stack: stack, risks: risks, next: next, phases: phases };
  }
};


window.ATLAS.engineeringPlaybooks = [
  {
    "id": "rag-engineering",
    "title": "Enterprise RAG Engineering Playbook",
    "badge": "Core Pattern",
    "tag": "Document ingestion, layout chunking, hybrid search tuning, reranking and quality metrics.",
    "intro": "Retrieval-Augmented Generation (RAG) is not a single prompt trick — it is a distributed data retrieval and ranking system. In enterprise deployments, generation quality is overwhelmingly constrained by retrieval recall. This playbook outlines the production engineering practices for building high-precision RAG on Google Cloud.",
    "sections": [
      {
        "title": "1. Document Cracking and Ingestion",
        "body": "Never use naive PDF text dumpers on enterprise documents. Real-world documents contain multi-column layouts, tables, headers, embedded diagrams and scanned pages that standard text splitters flatten into useless noise.\n\nUse [[document-ai|Document AI]] layout analysis (`layout-parser`). It outputs semantic Markdown preserving document headers (`#`, `##`), reading order across columns, and structured HTML/Markdown tables. For multimodal documents containing charts and photos, integrate [[vision-ai]] and Gemini multimodal models to extract visual bounding box descriptions.",
        "tips": [
          "**Always extract tables as Markdown:** Tables converted to raw text lose cell coordinate meaning; Markdown tables allow embedding models and LLMs to preserve column-row relationships.",
          "**Capture document metadata during cracking:** Extract author, department, creation date, and Cloud IAM security group identifiers into metadata tags for downstream security trimming."
        ]
      },
      {
        "title": "2. Chunking Algorithms and Boundaries",
        "body": "Chunk size directly governs the trade-off between retrieval specificity and conversational context. Chunks under 200 tokens lack sufficient semantic context; chunks over 1,500 tokens dilute vector embeddings and inflate LLM input costs.\n\nAdopt **Document-Aware Layout Chunking** and **Hierarchical Parent-Child Chunking**:",
        "bullets": [
          "**Layout-Aware Chunking:** Split at logical Markdown section boundaries (`##`) rather than arbitrary character counts. Prepend the document title and section path to every chunk.",
          "**Parent-Child Indexing:** In [[ai-search|Vertex AI Search]] or [[vector-search|Vector Search]], index small child passages (200-300 tokens) for dense vector search, but retrieve and inject the parent section (1,000-1,500 tokens) into the LLM prompt to give the model complete context.",
          "**Sliding Window Overlap:** Maintain 10-15% token overlap across sequential chunks to prevent semantic truncation of cross-boundary statements."
        ]
      },
      {
        "title": "3. Hybrid Search Tuning and Semantic Reranking",
        "body": "Dense vector search alone fails on alphanumeric strings: product SKUs, invoice numbers, software error codes, and customer identifiers. Pure keyword search fails on synonyms and conceptual phrasing.\n\nProduction enterprise RAG on Google Cloud must configure **Hybrid Search** combining dense vectors and BM25 full-text search, fused via Reciprocal Rank Fusion (RRF), followed by the **Google Semantic Ranker**.",
        "bullets": [
          "**Reciprocal Rank Fusion (RRF):** Evaluates ranks from dense vector and BM25 keyword passes in [[ai-search]], scoring candidates by `1 / (60 + rank)`. This balances keyword precision and semantic intent without manual weight tuning.",
          "**Semantic Ranker:** Evaluates the top 50 RRF candidates through Google's deep cross-encoder model, boosting relevant passages to the top 3-5 positions. This yields a 15-25% lift in NDCG@10 at a modest 100-200ms latency cost.",
          "**Vertex AI Search Datastores:** Google Cloud's managed knowledge layer automates document cracking, query rewriting, and semantic ranking out of the box."
        ]
      },
      {
        "title": "4. Measurable RAG Quality Indicators",
        "body": "Do not judge RAG quality by manual spot-checking or subjective demo reviews. Track formal statistical evaluation metrics separated into retrieval quality and generation quality:",
        "bullets": [
          "**Recall@K (Target: >85% at K=5):** The fraction of ground-truth relevant passages successfully surfaced in the top K retrieved results.",
          "**MRR (Mean Reciprocal Rank):** Evaluates how close to the top position the first relevant passage appears.",
          "**NDCG@K (Normalized Discounted Cumulative Gain):** Measures graded relevance and ranking quality of the retrieved set.",
          "**Groundedness / Faithfulness (Target: >95%):** The percentage of generated claims in the final answer that can be strictly deduced from retrieved context.",
          "**Answer Relevance (Target: >90%):** How directly the synthesized response answers the user's prompt without extraneous filler.",
          "**Citation Precision (Target: >98%):** Percentage of inline citations that point to an actual supporting statement in the source passage."
        ]
      },
      {
        "title": "5. The 12 Subdomains of the Production RAG Lifecycle",
        "body": "Enterprise RAG is not a single prompt trick — it is an end-to-end data and retrieval lifecycle spanning 12 distinct subdomains:\n\n1. **Source Ingestion:** Batch and streaming ingestion from [[gcs|Cloud Storage]], databases, and SaaS tools.\n2. **Document Parsing:** Layout-aware cracking via [[document-ai]] preserving headers and tables.\n3. **Normalization & Cleaning:** PII scrubbing with [[sdp]], deduplication, and markdown normalization.\n4. **Chunking Strategies:** Semantic, hierarchical parent-child, and layout boundary chunking.\n5. **Metadata Enrichment:** Author, department, security ACL tags, and summary attributes.\n6. **Embedding Generation:** Dense, sparse, and multimodal embedding generation.\n7. **Indexing & Storage:** High-scale vector storage in [[vector-search]] or [[alloydb]].\n8. **Retrieval:** Dense, sparse, hybrid (RRF), and metadata-filtered retrieval.\n9. **Reranking:** Deep cross-encoder reranking via Google Semantic Ranker.\n10. **Context Construction:** Context window packing, deduplication, and prompt assembly.\n11. **Generation & Grounding:** Synthesizing factual answers with inline citations on [[gemini]].\n12. **Evaluation & Monitoring:** Offline Recall@K and Groundedness evaluation via [[ap-evals]]."
      },
      {
        "title": "6. Component-Level RAG Quality Tuning Workflow",
        "body": "When enterprise RAG quality fails in production, use this systematic diagnostic workflow to identify which component to fix:\n\n- **Poor Retrieval Recall (<80%):** Do not touch the LLM prompt. Fix document cracking, adjust chunk size, add query expansion, or switch to hybrid dense+keyword search.\n- **High Recall but Low Precision (<70%):** Retrieved passages contain relevant facts mixed with irrelevant noise. Add metadata pre-filtering, tune vector distance thresholds, or deploy the Google Semantic Ranker.\n- **Good Context but Bad Answer:** The correct passage was retrieved, but the LLM answer is incomplete or wrong. Fix the system instruction, increase context clarity, or upgrade from Flash to Gemini 1.5 Pro.\n- **Correct Answer but Wrong Citations:** The model hallucinated sources. Enforce strict XML delimiter grounding and citation verification.\n- **High Retrieval Latency (>1.5s):** Parallelize dense and keyword retrieval passes, enable Redis semantic caching, or deploy Vector Search with Private Service Connect.\n- **High Operational Cost:** Enable Gemini Context Caching for large shared knowledge bases, reduce retrieved chunk count from top-10 to top-4, or route simple lookups to smaller models."
      }
    ],
    "see": [
      "arch:traditional-rag",
      "arch:agentic-rag",
      "dec:vector-hybrid-search",
      "dec:chunking-strategy",
      "dec:reranking-tradeoff",
      "svc:ai-search",
      "svc:document-ai"
    ]
  },
  {
    "id": "agent-engineering",
    "title": "Multi-Agent Engineering & Orchestration Playbook",
    "badge": "Emerging Standard",
    "tag": "Orchestration patterns, framework selection, memory persistence, MCP tools and safety gates.",
    "intro": "Moving from a single chatbot to an autonomous multi-agent system shifts engineering focus from prompt design to distributed systems design: state machines, distributed transactions, memory lifecycles, and tool authorization. This playbook outlines the architectural patterns and production guardrails required to operate multi-agent systems reliably on Google Cloud.",
    "sections": [
      {
        "title": "1. Multi-Agent Orchestration Patterns",
        "body": "Avoid unstructured peer-to-peer agent swarms in production; uncoordinated agents enter conversational deadlocks and experience rapid context bloat. Choose one of three proven coordination topologies:",
        "bullets": [
          "**Supervisor-Worker (Hub and Spoke):** A central coordinator agent breaks user tasks into sub-goals, delegates them to specialized workers (Researcher, Coder, Reviewer), and synthesizes final output.",
          "**Sequential Pipeline (Assembly Line):** Agents pass structured data sequentially through deterministic stages (Extract -> Validate -> Format -> Post). Best when steps are ordered and auditable.",
          "**Hierarchical Consensus:** Worker agents produce candidate proposals; an independent critic agent evaluates proposals against compliance and safety rubrics before final approval."
        ]
      },
      {
        "title": "2. Runtime Selection & Tool Contracts",
        "body": "Choose between managed and code-first runtimes based on autonomy requirements. Use [[agent-runtime|Vertex AI Agent Runtime]] for managed enterprise workflows. Use [[adk|Agent Development Kit]] or code-first frameworks (LangGraph, CrewAI) hosted on [[cloud-run]] for complex state machines.\n\nEnforce strict tool interface boundaries:",
        "bullets": [
          "**Narrow, Typed Tool Schemas:** Define tool input parameters with strict JSON Schema types. Avoid generic `query: string` inputs; demand structured fields like `account_id: integer` and `start_date: string`.",
          "**Server-Side Tool Validation:** Never trust model-generated arguments blindly. Tool Cloud Run microservices must validate inputs against backend business rules and authorization scopes.",
          "**Model Context Protocol (MCP):** Standardize tool integrations on MCP servers to decouple tools from proprietary model SDKs."
        ]
      },
      {
        "title": "3. State Persistence and Session Memory",
        "body": "Agents require persistent working memory to maintain context across multi-step execution graphs and user interaction turns.",
        "bullets": [
          "**Short-Term Scratchpad:** Temporary key-value state held in memory during single-run execution.",
          "**Long-Term Conversational Memory:** Persist conversation turns and checkpointed state in [[firestore]] keyed by `session_id` with TTL expiration.",
          "**Semantic Long-Term Memory:** Store user preferences, past decisions, and summarized knowledge in [[vector-search]] or [[ai-search]] for cross-session retrieval."
        ]
      },
      {
        "title": "4. Safety Boundaries & Circuit Breakers",
        "body": "Autonomous agents can consume thousands of dollars in minutes if caught in recursive reasoning loops. Hard operational boundaries are non-negotiable:",
        "tips": [
          "**Maximum Iteration Cap:** Enforce a hard ceiling of 5 tool turns per task. Terminate execution and trigger human escalation if the agent has not reached a conclusion.",
          "**Wall-Clock Timeout:** Enforce an explicit timeout (e.g. 60 seconds) on agent graph execution via [[workflows]].",
          "**Human-in-the-Loop (HITL) Write Gates:** Require cryptographic human approval via Cloud Workflows callbacks for all writes, financial transactions, or external emails."
        ]
      },
      {
        "title": "5. 15+ Enterprise Agent Design Patterns",
        "body": "Master the catalog of verified agent patterns before authoring complex autonomous systems:\n\n- **Sequential Pipeline:** Predictable step-by-step handoffs between specialized agents.\n- **Parallel Swarm:** Concurrent fan-out of independent sub-tasks with centralized aggregation.\n- **Coordinator / Orchestrator:** Central router delegating tasks to domain specialists.\n- **Hierarchical Supervisor:** Multi-level supervisor-worker trees with bounded delegation.\n- **Planner-Executor:** Separate planning phase with stepwise verification and re-planning.\n- **Reflection & Self-Correction:** Agent reviews its own intermediate draft before responding.\n- **Critic-Reviewer:** Generator agent drafts, Critic agent tests against rubric.\n- **Multi-Agent Debate:** Diverse agent personas debate options to reach consensus.\n- **Blackboard / Shared State:** Agents communicate by reading and writing to shared memory.\n- **Event-Driven Agent:** Asynchronous agents triggered by Pub/Sub message queues.\n- **Human-in-the-Loop:** Automated execution paused at write checkpoints for human approval.\n- **Agentic RAG:** Agent dynamically decides when to search, filter, or query structured SQL.\n- **Agent2Agent (A2A):** Decentralized cross-boundary agent communication with mTLS."
      },
      {
        "title": "6. The Golden Decision Rule: Start Simple",
        "body": "Google architecture guidance explicitly dictates: **Start with the simplest architecture that satisfies business requirements**.\n\n1. Begin with a single specialized prompt or deterministic code.\n2. If grounding is required, add standard RAG.\n3. If multiple tools are required, deploy a single specialized agent with [[adk|ADK]].\n4. Introduce multi-agent delegation **only** when separate teams own distinct tools, when context windows are overwhelmed, or when strict security isolation requires distinct service account identities."
      }
    ],
    "see": [
      "arch:multiagent-orchestration",
      "arch:agentic-rag",
      "dec:agent-runtime",
      "dec:workflow-vs-agent",
      "dec:human-in-loop",
      "svc:agent-runtime",
      "svc:adk",
      "svc:workflows"
    ]
  },
  {
    "id": "genaiops",
    "title": "GenAIOps Lifecycle & Evaluation Playbook",
    "badge": "Operational Rigor",
    "tag": "Golden datasets, automated evaluation gates, CI/CD pipelines, and drift detection.",
    "intro": "Traditional DevOps monitors deterministic code compilation and test execution. GenAIOps monitors stochastic system health: prompt drift, statistical evaluation degradation, regression testing, and continuous benchmarking. This playbook details how to operationalize continuous quality engineering for generative AI on Google Cloud.",
    "sections": [
      {
        "title": "1. The Golden Evaluation Dataset",
        "body": "Subjective spot-testing in the Google Cloud console is the most dangerous anti-pattern in generative AI. You cannot manage what you do not measure.\n\nEvery production AI project must maintain a versioned **Golden Evaluation Dataset** in Git alongside application code:",
        "bullets": [
          "**Curate 100-500 Representative Queries:** Include typical user questions, difficult multi-hop edge cases, adversarial prompt injection attacks, and out-of-domain queries.",
          "**Ground-Truth Annotations:** Pair each query with verified ground-truth reference passages and ideal answers signed off by business domain experts.",
          "**Automated Synthetic Expansion:** Use [[gemini]] foundation models to generate 1,000+ synthetic question-answer pairs from raw documents, and filter pairs with low confidence scores."
        ]
      },
      {
        "title": "2. Multi-Tiered Evaluation Metrics",
        "body": "Run automated evaluations on every prompt, model, or retrieval change using a two-tier evaluation framework:",
        "bullets": [
          "**Deterministic Rule-Based Tests:** Fast, zero-cost checks verifying JSON Schema compliance, regex patterns, keyword inclusions/exclusions, and blocked term detection.",
          "**LLM-as-a-Judge Statistical Scoring:** Pass model output, ground-truth references, and retrieved context to an independent evaluator model using [[ap-evals|Vertex AI Evaluation Service]].",
          "**Evaluation Dimensions:** Score Groundedness/Faithfulness (>95%), Answer Relevance (>90%), Context Recall (>85%), and Safety/Toxicity (0 violations)."
        ]
      },
      {
        "title": "3. Automated CI/CD Evaluation Release Gates",
        "body": "Embed automated evaluation suites directly into GitHub Actions or Cloud Build pipelines targeting `main`:",
        "bullets": [
          "**Pull Request Evaluation Sweep:** Execute the 100-case core evaluation dataset on every PR touching prompts, chunking code, or tool definitions.",
          "**Hard Quality Gates:** Automatically block merge if Groundedness drops by more than 2% or if any critical safety violation is detected.",
          "**Cryptographic Release Pinning:** Pin prompt templates, model versions, temperature, and search configurations into immutable deployment packages."
        ]
      },
      {
        "title": "4. Canary Deployment & Online Drift Monitoring",
        "body": "Offline evaluations cannot predict real-world user query distribution shifts. Deploy updates with canary traffic routing and live telemetry:",
        "tips": [
          "**Canary Routing:** Route 10% of production traffic to the candidate prompt or model via [[apigee|Apigee]] or Vertex AI Endpoint traffic splitting.",
          "**Online Feedback Capture:** Log explicit user feedback (thumbs up/down) and implicit signals (copy-to-clipboard, retry frequency) to [[cloud-monitoring]].",
          "**Automated Rollback:** Configure Cloud Monitoring alerting policies on P95 latency, 429 quota errors, or negative feedback spikes to trigger instant automated rollback within 5 minutes."
        ]
      },
      {
        "title": "5. Production AI Release Gates Checklist",
        "body": "Enforce strict automated gates in Cloud Build before any prompt, model, or tool configuration deploys to production:\n\n- **Gate 1 (Unit & Tool Contracts):** 100% pass on tool schema validation and mock function execution.\n- **Gate 2 (Security & Red-Teaming):** Zero vulnerabilities to prompt injection and jailbreak test suites.\n- **Gate 3 (Groundedness & Recall):** Eval score on golden dataset must not regress by more than 1.0%.\n- **Gate 4 (Latency SLA):** P95 response time must remain within the agreed budget (e.g. <2,000ms).\n- **Gate 5 (Cost Ceiling):** Projected cost per task must not exceed budget threshold.\n- **Gate 6 (Canary Promotion):** Route 5% traffic for 24 hours; automatically roll back if 5xx errors or negative user ratings exceed 1.5%."
      }
    ],
    "see": [
      "arch:genaiops-lifecycle",
      "dec:evaluation",
      "dec:improve-model",
      "svc:ap-evals",
      "svc:gemini",
      "svc:cloud-monitoring"
    ]
  },
  {
    "id": "security-hardening",
    "title": "Enterprise Security Hardening Playbook",
    "badge": "Enterprise Readiness",
    "tag": "Zero-trust network boundaries, prompt defense, data masking, document security and IAM least privilege.",
    "intro": "Generative AI introduces novel enterprise attack surfaces: direct and indirect prompt injection, sensitive data leakage into public training sets, and compromised autonomous tool executions. This playbook provides the definitive security hardening checklist for Google Cloud AI architectures.",
    "sections": [
      {
        "title": "1. Zero-Trust Network Perimeter",
        "body": "No production AI service should ever expose a public internet endpoint. Enforce strict private connectivity:",
        "bullets": [
          "**Private Service Connect (PSC):** Access Vertex AI APIs, Cloud Storage, and BigQuery exclusively through Private Service Connect endpoints within private VPC subnets.",
          "**VPC Service Controls (VPC-SC):** Enforce cryptographic security perimeters around Vertex AI and Cloud Storage to prevent data exfiltration even if IAM credentials are compromised.",
          "**Egress Filtering:** Force all outbound internet traffic from container hosts and Cloud Run instances through Cloud NAT and Cloud Firewall for FQDN filtering."
        ]
      },
      {
        "title": "2. Identity Propagation & Least Privilege",
        "body": "Authenticate workloads using short-lived managed service account tokens and propagate end-user credentials to all downstream retrieval layers:",
        "bullets": [
          "**Disable Service Account Keys:** Never issue downloadable service account JSON keys for developers or applications. Enforce Workload Identity Federation.",
          "**Delegated User Authorization:** Propagate caller identity claims from Identity Platform or Cloud IAM through [[apigee]] so retrieval and tool execution act with user permissions rather than administrative access.",
          "**Least-Privilege Roles:** Restrict Cloud Run tool containers to narrow IAM roles granting access only to specific BigQuery tables or Cloud SQL instances."
        ]
      },
      {
        "title": "3. Prompt Injection Defense & Content Safety",
        "body": "Defend against both direct jailbreak attacks (users attempting to bypass guardrails) and indirect prompt injection (hidden commands in retrieved documents):",
        "bullets": [
          "**Model Armor & Vertex AI Safety Filters:** Enable prompt injection filters to block direct jailbreak attempts and system prompt extraction using [[model-armor]].",
          "**Delimited System Prompts:** Isolate untrusted retrieved documents inside unambiguous XML delimiters (`<context>...</context>`) with strict model instructions to ignore instructions inside tags.",
          "**Cloud DLP De-identification:** Configure [[sdp|Sensitive Data Protection (Cloud DLP)]] to automatically mask Social Security numbers, credit cards, and corporate secrets before prompts enter model context.",
          "**Pre-Execution Tool Screening:** Screen tool call arguments against regex patterns before invoking backend database functions."
        ]
      },
      {
        "title": "4. Document-Level Security Trimming",
        "body": "In enterprise RAG, users must only retrieve information they have explicit permission to access in source systems:",
        "tips": [
          "**Datastore-Level ACL Tags:** Tag every document in [[ai-search]] with a list of authorized user IDs and security group IDs.",
          "**Mandatory Backend Filter Injection:** The backend search proxy must inject a mandatory security filter matching caller group claims extracted from verified JWT tokens.",
          "**Customer-Managed Encryption Keys (CMEK):** Encrypt all Cloud Storage buckets and Vertex AI indexes with dedicated keys in [[kms|Cloud KMS]]. Revoking key access renders tenant data permanently unreadable."
        ]
      },
      {
        "title": "5. The 14 AI-Specific Threat Vectors",
        "body": "Protect against the comprehensive OWASP Top 10 for LLMs and agent threat catalog:\n\n1. **Direct Prompt Injection:** Adversarial user inputs attempting to override system instructions.\n2. **Indirect Prompt Injection:** Malicious instructions hidden inside untrusted retrieved web pages or documents.\n3. **Jailbreaks:** Sophisticated persona adoption or linguistic encoding bypassing safety filters.\n4. **Sensitive Data Disclosure:** Accidental leakage of confidential corporate PII into model outputs.\n5. **Data Exfiltration:** Agent manipulated into sending internal database records to external webhook URLs.\n6. **Retrieval Poisoning:** Adversary uploading malicious documents to pollute vector search indices.\n7. **Tool Abuse & Parameter Tampering:** Agent tricked into calling tools with destructive arguments.\n8. **Unauthorized Tool Execution:** Agent calling administrative functions without proper user authorization.\n9. **Excessive Agent Autonomy:** Unbounded agents taking irreversible financial or operational actions without human review.\n10. **Privilege Escalation:** Agent inheriting elevated administrative service accounts instead of user clearance.\n11. **Model Denial of Service:** Specially crafted prompts causing massive token generation and quota exhaustion.\n12. **Insecure Output Handling:** Application executing raw LLM code or SQL without sanitization.\n13. **Hallucinated Actions:** Agent executing non-existent tools or hallucinated API endpoints.\n14. **Supply Chain Vulnerabilities:** Compromised third-party model weights, prompt templates, or MCP tool servers."
      }
    ],
    "see": [
      "arch:secure-multitenant-rag",
      "dec:tenancy",
      "dec:human-in-loop",
      "svc:model-armor",
      "svc:iam",
      "svc:kms",
      "svc:vpc-sc"
    ]
  },
  {
    "id": "sre-operations",
    "title": "Production AI SRE & Reliability Playbook",
    "badge": "Operations & SRE",
    "tag": "10 operational indicators, 429 throttling mitigation, latency budgets, runbooks and postmortems.",
    "intro": "Operating generative AI and agentic systems requires moving from traditional server health monitoring to stochastic system reliability: tracking token economics, prompt drift, retrieval quality, tool error rates, and 429 quota spikes. This playbook establishes the site reliability engineering standards for production AI on Google Cloud.",
    "sections": [
      {
        "title": "1. The 10 Mandatory Operational Indicators",
        "body": "Every production AI application on Google Cloud must instrument and display the 10 core operational health metrics in [[cloud-monitoring]]:",
        "bullets": [
          "**1. Task Throughput & Completion Rate (Target: >95%):** End-to-end completed business tasks versus aborted or failed runs.",
          "**2. Time to First Token (TTFT) (Target: P95 <1,500ms):** Elapsed time from prompt submission to first streamed completion token.",
          "**3. Token Consumption & Cache Efficiency (Target: >35% cache hits):** Prompt and completion token volume, tracking context caching savings on Gemini.",
          "**4. Model Quota Throttling Rate (HTTP 429) (Target: <0.1%):** Frequency of ResourceExhausted quota errors from model APIs.",
          "**5. Retrieval Groundedness Score (Target: >95%):** Automated sample evaluation verifying answers cite retrieved context.",
          "**6. Agent Tool-Call Failure Rate (Target: <2%):** Percentage of tool invocations resulting in errors, timeouts, or retries.",
          "**7. Cost per Successful Task (Target: within budget):** Unit economics dividing daily total infrastructure spend by successful tasks.",
          "**8. Evaluation Score Trend:** Offline and online golden eval scores tracked across releases.",
          "**9. Safety Filter Trigger Rate (Target: <0.1%):** Frequency of requests blocked by Vertex AI safety filters or Model Armor.",
          "**10. Dependency Health & Availability (Target: >99.9%):** Health of upstream foundation models, Vertex AI Search, and Cloud Storage."
        ]
      },
      {
        "title": "2. Mitigating HTTP 429 Quota Spikes & Capacity Management",
        "body": "Quota limits are the most common operational failure mode in LLM applications. Implement multi-layered capacity resilience:",
        "bullets": [
          "**Multi-Region Endpoints:** Route requests across multiple Google Cloud Regions (e.g. us-central1, europe-west1) during regional traffic bursts.",
          "**Client Exponential Backoff and Jitter:** Configure Google GenAI SDKs with full jitter exponential backoff to prevent thundering herd retry storms.",
          "**Multi-Model Failover:** Configure [[apigee]] to failover to a fallback model (e.g. Gemini 1.5 Flash) if primary Gemini 1.5 Pro quota is exhausted.",
          "**Asynchronous Queue Buffering:** Buffer non-interactive requests through [[pubsub]] or [[cloud-tasks]] to decouple user traffic from model concurrency limits."
        ]
      },
      {
        "title": "3. Managing Non-Deterministic Failure & Incident Response",
        "body": "When generative AI applications fail, standard stack traces rarely reveal the root cause. Follow SRE triage procedures:",
        "tips": [
          "**Isolate the Failing Layer:** Determine whether the incident stems from Retrieval (empty or stale passages), Grounding (model hallucinating despite context), or Tool Invocation (API error or invalid schema).",
          "**Prompt Circuit Breakers:** Maintain dynamic prompt versioning in Secret Manager or runtime environment variables so prompts can be reverted in 60 seconds without code deployments.",
          "**Stochastic Postmortems:** Conduct post-incident reviews using the 5 Whys adapted for AI: investigate dataset distribution shifts, prompt drift, and retrieval recall failure."
        ]
      },
      {
        "title": "4. Full-Stack AI Telemetry & Distributed Tracing Schema",
        "body": "Instrument OpenTelemetry spans across the complete agent invocation lifecycle:\n\n- **Trace Header:** Root trace ID, parent span ID, session ID, user ID, tenant ID.\n- **Agent Metadata:** Agent name, agent version, system prompt hash, runtime container ID.\n- **Model Execution:** Model identifier ([[gemini|Gemini 1.5 Pro]]), temperature, input tokens, output tokens, TTFT, generation latency.\n- **Tool Execution:** Tool name, serialized arguments, execution duration, return status code, sanitized response payload.\n- **Retrieval Context:** Datastore ID, query vector hash, retrieved document IDs, similarity scores, reranker latency.\n- **Evaluation Telemetry:** Online Groundedness score, safety filter trigger flag, user thumbs-up/down feedback."
      }
    ],
    "see": [
      "arch:llm-serving",
      "dec:capacity-strategy",
      "dec:inference-pattern",
      "dec:cost-levers",
      "svc:cloud-monitoring",
      "svc:gemini",
      "svc:apigee"
    ]
  },
  {
    "id": "finops-economics",
    "title": "AI FinOps & Unit Economics Playbook",
    "badge": "Cost & Economics",
    "tag": "Total cost formula, cost per successful task, token optimization, semantic caching and model routing.",
    "intro": "The biggest failure mode in enterprise generative AI is deploying a technical success that is an economic catastrophe. This playbook establishes the FinOps framework for AI Engineering Managers to calculate total cost of ownership, model unit economics, and implement architectural levers that reduce inference costs by 60-80%.",
    "sections": [
      {
        "title": "1. The Total AI System Cost Formula",
        "body": "Engineering leaders frequently make the mistake of budgeting only for model token pricing. Production AI cost is the sum of four distinct operational layers:\n\n$$\\text{Total AI System Cost} = C_{\\text{Inference}} + C_{\\text{Infrastructure}} + C_{\\text{Data}} + C_{\\text{Operations}}$$\n\nWhere:\n- **$C_{\\text{Inference}}$**: Input tokens, output tokens, embedding generation, cross-encoder reranking, and external model API calls.\n- **$C_{\\text{Infrastructure}}$**: Cloud Run serverless CPU/GPU seconds, GKE accelerator nodes, load balancing, networking egress, and VPC perimeters.\n- **$C_{\\text{Data}}$**: BigQuery storage and analytical scans, Cloud Storage dual-region replication, vector index node hours in [[vector-search]], and Datastream CDC.\n- **$C_{\\text{Operations}}$**: Evaluation test runs via [[ap-evals]], Cloud Logging and Monitoring ingestion, distributed tracing, and third-party observability licensing."
      },
      {
        "title": "2. The Golden Metric: Cost per Successful Task",
        "body": "Do not judge AI systems by cost per API invocation or cost per thousand tokens. A model that costs $0.02 per call but succeeds only 40% of the time requires retries, human escalations, and user abandonment, making it far more expensive than a $0.08 model with 98% accuracy.\n\n$$\\text{Cost per Successful Task} = \\frac{\\text{Total System Cost}}{\\text{Successfully Completed Tasks}}$$\n\nTrack this metric across every business workflow. When an agent experiences tool loops, prompt injection, or hallucinated arguments, the cost of failed runs must be attributed directly to the task's economic profile."
      },
      {
        "title": "3. The 6 Architectural Cost-Optimization Levers",
        "body": "Apply these six architectural levers in order of implementation effort and impact:",
        "bullets": [
          "**1. Prompt Compression & Layout Trimming:** Strip redundant conversational filler and JSON whitespace from prompt context. Using layout-aware Markdown chunking instead of raw document text cuts input token volume by 30-45%.",
          "**2. Semantic Response Caching:** Deploy [[memorystore|Memorystore for Redis]] in front of Gemini. For repetitive enterprise FAQs, semantic similarity caching resolves 25-40% of queries with sub-10ms latency at zero token cost.",
          "**3. Dynamic Model Routing:** Route simple intent classification, entity extraction, and filtering to [[gemini|Gemini 1.5 Flash]] ($0.075 / 1M tokens), reserving Gemini 1.5 Pro ($1.25 / 1M tokens) strictly for complex multi-hop synthesis.",
          "**4. Context Caching on Gemini:** For applications sharing a large document corpus (e.g. 500-page corporate policy manual), leverage Gemini Context Caching to receive an 75% discount on cached input tokens.",
          "**5. Batch Asynchronous Processing:** For non-realtime classification, summarization, and offline evaluations, use the Vertex AI Batch Prediction API to achieve 50% discount compared to online inference.",
          "**6. Provisioned Throughput Rightsizing:** Transition from pay-as-you-go to Provisioned Throughput only when baseline sustained QPS utilization exceeds 70%, avoiding paying for unused reserved model units during off-peak hours."
        ]
      },
      {
        "title": "4. Quotas, Budgets and runaway Loop Prevention",
        "body": "Autonomous agents with tool access can enter infinite retry loops, burning thousands of dollars in minutes:",
        "tips": [
          "**Enforce Hard Step Caps:** Set a hard ceiling of max 5 tool executions per agent turn in [[adk|ADK]].",
          "**Session-Level Token Budgets:** Terminate agent execution if cumulative tokens for a single conversation thread exceed 50,000 tokens.",
          "**Real-time Budget Action Alerts:** Configure Pub/Sub alerts on Google Cloud Billing budgets to disable runaway service accounts automatically if spend crosses 120% of forecast."
        ]
      }
    ],
    "see": [
      "dec:cost-levers",
      "dec:where-model-runs",
      "svc:billing",
      "svc:gemini",
      "svc:memorystore",
      "svc:cloud-run"
    ]
  },
  {
    "id": "evaluation-testing",
    "title": "AI Evaluation & Quality Engineering Playbook",
    "badge": "Quality & Evals",
    "tag": "Test pyramid, LLM-as-a-judge, RAG metrics, agent trajectory evaluation, and CI/CD release gates.",
    "intro": "The fundamental difference between hobbyist AI development and enterprise AI engineering is empirical measurement. If you cannot measure quality statistically, every change to a prompt, model, or chunking strategy is an argument rather than an engineering decision. This playbook establishes the testing pyramid and evaluation pipeline for production AI systems on Google Cloud.",
    "sections": [
      {
        "title": "1. The AI Quality Testing Pyramid",
        "body": "Traditional unit testing is necessary but completely insufficient for probabilistic generative systems. Implement a five-layer AI testing pyramid:\n\n1. **Deterministic Unit Tests:** Verify tool functions, JSON parsers, API contracts, and parameter validation with 100% pass expectations.\n2. **Security & Red-Teaming Tests:** Automated penetration testing against prompt injection libraries, jailbreaks, and PII exfiltration.\n3. **Component Evaluation (Retrieval):** Statistical retrieval benchmarking measuring Recall@K, Precision@K, and MRR on golden query sets.\n4. **End-to-End Generation Evaluation:** Multi-metric scoring of Groundedness, Faithfulness, and Answer Relevance using [[ap-evals|Vertex AI Evaluation]].\n5. **Agent Trajectory & Behavior Tests:** Step-by-step verification of tool selection accuracy, argument precision, loop recovery, and delegation boundaries."
      },
      {
        "title": "2. Core RAG Evaluation Metrics",
        "body": "Always decouple retrieval evaluation from generation evaluation so you know exactly which component to fix when quality degrades:",
        "bullets": [
          "**Recall@K (Target: >85% at K=5):** Did the retrieval system surface the ground-truth document passage in the top K candidates?",
          "**Mean Reciprocal Rank (MRR) (Target: >0.80):** What is the reciprocal rank of the first relevant document? Higher MRR ensures relevant context sits at the top of the LLM prompt.",
          "**Context Precision & Relevance (Target: >90%):** Does the retrieved context contain only information relevant to the question, or is it filled with irrelevant noise?",
          "**Faithfulness / Groundedness (Target: >95%):** Is every factual claim in the generated answer directly supported by the retrieved passages, or did the model invent facts?",
          "**Answer Relevance (Target: >90%):** Did the model directly address the user's specific intent, or did it provide an evasive answer?"
        ]
      },
      {
        "title": "3. Agent Trajectory & Behavior Metrics",
        "body": "Evaluating agents requires inspecting the entire execution path, not just the final user-facing text:",
        "bullets": [
          "**Task Success Rate (Target: >90%):** The percentage of agent executions that completely satisfy the user's objective without human intervention.",
          "**Tool Selection Accuracy (Target: >96%):** Did the agent choose the correct tool from its registry given the user's request?",
          "**Tool Argument Accuracy (Target: >98%):** Were the extracted parameters formatted with exact schema types and valid values?",
          "**Unnecessary Tool Call Rate (Target: <5%):** Did the agent invoke redundant or wasteful tools that inflated latency and cost?",
          "**Trajectory Recovery Rate (Target: >80%):** When a tool returned an error (e.g. 404 or validation failure), did the agent successfully recover or crash?"
        ]
      },
      {
        "title": "4. Automated CI/CD Release Gates",
        "body": "A code or prompt change should never reach production solely because its Docker container builds successfully. Enforce automated evaluation gates in Cloud Build:\n\n- **PR Gate (Fast):** Run 50 golden test cases covering core user journeys; build fails if Groundedness drops by more than 1%.\n- **Staging Gate (Deep):** Run 1,000+ comprehensive test cases with edge cases and adversarial attacks; verify P95 latency and token cost.\n- **Production Canary Gate:** Route 10% of live traffic to the new model version; compare online user feedback and Groundedness against the control group before 100% rollout."
      }
    ],
    "see": [
      "arch:genaiops-lifecycle",
      "dec:evaluation",
      "svc:ap-evals",
      "svc:gemini",
      "svc:infra-manager"
    ]
  },
  {
    "id": "data-engineering",
    "title": "AI Data Platforms, Ingestion & Preparation Playbook",
    "badge": "Data Engineering",
    "tag": "Document cracking, OCR, metadata extraction, deduplication, incremental sync and ACL propagation.",
    "intro": "Production AI systems are constrained far more by data quality and data engineering architecture than by model capability. An LLM cannot reason over documents it cannot parse, and vector retrieval fails if document boundaries are flattened. This playbook outlines data preparation, ingestion pipelines, and governance for enterprise AI on Google Cloud.",
    "sections": [
      {
        "title": "1. Document Cracking & Layout Preservation",
        "body": "Naive text extraction strips headers, tables, and multi-column reading order. Enterprise documents (financial reports, contracts, manuals) require semantic cracking:\n\n- Use [[document-ai|Document AI]] layout parser to extract documents into structured Markdown preserving section hierarchy (`#`, `##`, `###`).\n- Convert financial and statistical tables into Markdown or HTML tables so column-row cell relationships are preserved for embedding models.\n- Run optical character recognition (OCR) on embedded charts and diagrams, extracting text coordinates and visual bounding boxes."
      },
      {
        "title": "2. Data Cleansing, Deduplication & Normalization",
        "body": "Garbage in, garbage out is especially true for vector retrieval. Before embedding documents, run an automated cleaning pipeline:\n\n- **Deduplication:** Hash document contents using MinHash or SimHash to eliminate exact and near-duplicate pages that pollute search results.\n- **PII Scrubbing:** Pass raw text through [[sdp|Sensitive Data Protection (Cloud DLP)]] to mask Social Security numbers, credit cards, and personal contact details.\n- **Header Prepending:** Prepend document metadata (document title, author, update timestamp, section path) to every chunk so the embedding model has context even on small passages."
      },
      {
        "title": "3. Incremental Ingestion & Deletion Propagation",
        "body": "Real enterprise data changes continuously. An enterprise RAG pipeline must handle document updates and deletions gracefully:\n\n- **CDC via Datastream:** Capture source database changes in real time and stream them into [[bigquery]] or vector stores.\n- **Tombstoning & Deletion:** When a document is deleted from Cloud Storage, an Eventarc trigger must immediately delete its corresponding vector embeddings from [[vector-search]] and [[ai-search]].\n- **Version Control:** Maintain document version hashes to re-embed only modified sections rather than re-indexing entire multi-terabyte corpora."
      },
      {
        "title": "4. Document-Level ACL Synchronization",
        "body": "Users must never retrieve documents they lack permission to view in source systems (Google Drive, SharePoint, Salesforce):\n\n- Extract access control lists (ACLs) during document ingestion and index them as metadata tags alongside vector embeddings.\n- In [[ai-search|Agent Search]] or [[vector-search|Vector Search]], enforce mandatory pre-filtering using verified user identity claims.\n- Periodically re-sync group memberships to ensure revoked employee permissions take effect immediately."
      }
    ],
    "see": [
      "arch:traditional-rag",
      "arch:secure-multitenant-rag",
      "dec:vector-store",
      "svc:document-ai",
      "svc:sdp",
      "svc:bigquery",
      "svc:gcs"
    ]
  },
  {
    "id": "multimodal-engineering",
    "title": "Multimodal AI Systems & Cross-Modal Intelligence Playbook",
    "badge": "Multimodal AI",
    "tag": "Image understanding, video analysis, audio processing, document OCR and multimodal RAG architectures.",
    "intro": "Enterprise intelligence lives beyond text. Blueprints, medical scans, surveillance feeds, financial charts, and customer call recordings contain mission-critical information that text-only models cannot touch. This playbook establishes the architecture and engineering standards for building production multimodal AI systems on Google Cloud.",
    "sections": [
      {
        "title": "1. Multimodal Ingestion & Pre-processing",
        "body": "Handling multi-gigabyte media streams requires specialized ingestion and compression pipelines:\n\n- **Video Processing:** Extract keyframes using scene-change detection rather than uniform time intervals; pass extracted frames alongside audio tracks to [[gemini|Gemini 1.5 Pro]].\n- **Audio Pipelines:** Process long-form audio through [[speech-to-text|Speech-to-Text]] for high-fidelity transcription, then feed both the transcript and raw audio to Gemini for acoustic sentiment analysis.\n- **Document Images:** High-resolution scans (300+ DPI) should be cracked with [[document-ai]] to produce clean text layouts, with high-resolution visual bounding boxes preserved for chart inspection."
      },
      {
        "title": "2. Multimodal Embeddings & Retrieval",
        "body": "Cross-modal retrieval enables searching images with text queries and searching text with image inputs:\n\n- Generate multimodal embeddings using Vertex AI Multimodal Embedding models, which map text and images into a shared vector space.\n- Store vectors in [[vector-search|Vertex AI Vector Search]] to execute sub-15ms similarity lookups across mixed media corpora.\n- Index both visual representations (image embeddings) and textual representations (OCR and Vision AI labels) to support hybrid cross-modal search."
      },
      {
        "title": "3. The 6 Production Multimodal Patterns",
        "body": "Adopt these six verified production patterns for multimodal enterprise workloads:",
        "bullets": [
          "**1. Document Intelligence:** Extract complex structured data from invoices, IDs, and financial reports using Document AI and Gemini.",
          "**2. Visual Quality Inspection:** Detect manufacturing defects and assembly errors by comparing factory camera photos against golden CAD models.",
          "**3. Video Summarization & Search:** Ingest security or training videos, generate temporal timestamp markers, and answer user queries with direct video clip jumps.",
          "**4. Contact Center Call Analysis:** Transcribe customer service audio with Speech-to-Text, analyze speaker sentiment, and extract action items.",
          "**5. Multimodal RAG Assistant:** Answer complex technical queries using both textual manuals and visual wiring diagrams.",
          "**6. Multilingual Visual Translation:** Translate text embedded inside signage, labels, and product packaging using Vision AI and Translation APIs."
        ]
      },
      {
        "title": "4. Latency and Cost Optimization for Multimodal AI",
        "body": "Multimodal tokens (especially high-resolution images and video) consume significant context windows:\n\n- **Downsample Media Responsibly:** Resize images to 1,024x1,024 resolution before sending to Gemini; higher resolutions dramatically increase token count without proportional accuracy gain.\n- **Audio Frame Rate Tuning:** Compress audio files to 16kHz mono MP3 or Opus format to minimize upload bandwidth and processing latency.\n- **Pre-computed Visual Captions:** For static image catalogs, generate detailed text descriptions once during ingestion and index them as text to reduce runtime multimodal inference costs."
      }
    ],
    "see": [
      "arch:multimodal-rag",
      "arch:document-intelligence",
      "svc:vision-ai",
      "svc:document-ai",
      "svc:speech-to-text",
      "svc:gemini"
    ]
  },
  {
    "id": "enterprise-integration",
    "title": "Enterprise Integration, MCP & Agent2Agent (A2A) Protocols Playbook",
    "badge": "Integration & MCP",
    "tag": "Model Context Protocol (MCP), Agent2Agent (A2A), ERP/CRM integration, Apigee API governance and Pub/Sub.",
    "intro": "AI systems cannot operate in isolated silos. Enterprise agents must interact with legacy ERPs (SAP), CRMs (Salesforce), ticketing platforms (ServiceNow), and partner systems. This playbook establishes the architecture for connecting Google Cloud AI agents to enterprise systems using open protocols: Model Context Protocol (MCP) and Agent2Agent (A2A).",
    "sections": [
      {
        "title": "1. Model Context Protocol (MCP) Architecture",
        "body": "Anthropic's open Model Context Protocol (MCP) has become the industry standard for exposing tools, resources, and prompt templates to AI agents:\n\n- **MCP Clients:** Embedded in [[adk|ADK]] and Vertex AI Agent Runtime to discover and invoke tools dynamically.\n- **MCP Servers:** Containerized microservices running on [[cloud-run|Cloud Run]] exposing enterprise databases, APIs, and business logic over SSE transport.\n- **Resources:** Standardized read-only endpoints allowing agents to inspect files, database schemas, and documentation without custom wrappers.\n- **Tools:** Actionable functions with JSON Schema parameter definitions and executable callbacks."
      },
      {
        "title": "2. Agent2Agent (A2A) Protocol & Interoperability",
        "body": "As organizations deploy specialized agents across different business units and external partners, direct Agent-to-Agent communication becomes necessary:\n\n- **Agent Discovery:** Registry services where agents broadcast their capabilities, input schemas, and service-level agreements.\n- **Mutual Authentication:** Cryptographic identity verification using mTLS certificates and OIDC tokens managed via [[agent-governance]].\n- **Task Lifecycle:** Formal state machines for task delegation: `PROPOSED` -> `ACCEPTED` -> `IN_PROGRESS` -> `COMPLETED` / `REJECTED`.\n- **Contract Negotiation:** Bounded parameters where buyer and supplier agents negotiate terms within pre-approved thresholds."
      },
      {
        "title": "3. Enterprise ERP & CRM Connectors",
        "body": "Integrating agents with core business platforms requires strict isolation and parameter validation:",
        "bullets": [
          "**SAP ERP Integration:** Expose RFC / BAPI business functions through authenticated Cloud Run proxies with strict parameter bounds to prevent unauthorized ledger entries.",
          "**Salesforce CRM Integration:** Use OAuth 2.0 user delegation so the agent can only read and update customer leads within the logged-in sales rep's authorized territories.",
          "**ServiceNow IT Service Management:** Allow IT support agents to query knowledge bases and open tickets, with automated escalation to human tier-2 engineers for critical outages."
        ]
      },
      {
        "title": "4. API Governance with Apigee",
        "body": "Exposing internal LLMs and agent tools to hundreds of developers requires enterprise API governance:\n\n- Use [[apigee|Apigee API Management]] to enforce spike arrest, rate limits, and token-based quota allocations across business units.\n- Implement prompt inspection policies to detect sensitive API keys or credit card numbers in outbound tool arguments.\n- Maintain immutable API transaction logs in BigQuery for enterprise chargeback and regulatory auditing."
      }
    ],
    "see": [
      "arch:mcp-agent",
      "arch:a2a-network",
      "arch:apigee-ai",
      "svc:adk",
      "svc:agent-protocols",
      "svc:apigee",
      "svc:cloud-run"
    ]
  },
  {
    "id": "delivery-playbook",
    "title": "AI Project Delivery Playbook & 12 Industry Use Cases",
    "badge": "Delivery & Leadership",
    "tag": "Project lifecycle, feasibility matrix, business KPIs, and 12 production industry use-case blueprints.",
    "intro": "Leading an AI engineering team requires more than technical knowledge; it requires disciplined project delivery: qualifying real business problems, establishing measurable KPIs, managing stakeholder expectations, and navigating the path from initial prototype to scaled production. This playbook provides the operational delivery framework and 12 complete industry blueprints.",
    "sections": [
      {
        "title": "1. The 6-Stage AI Project Delivery Lifecycle",
        "body": "Follow a disciplined stage-gate process to prevent multi-month engineering investments into doomed AI prototypes:\n\n1. **Discovery & Feasibility (Weeks 1-2):** Validate data readiness, define business KPIs, score feasibility, and verify that AI is truly required over deterministic code.\n2. **Architecture & Threat Modeling (Weeks 3-4):** Select GCP services, author Architecture Decision Records (ADRs), and model security threats.\n3. **Eval Baseline & Prototype (Weeks 5-6):** Build a 100-case golden evaluation dataset; establish baseline scores on simplest managed stack.\n4. **Pilot & Human-in-the-Loop (Weeks 7-10):** Deploy to limited internal users; enforce approval gates on write actions; track cost per task.\n5. **Production Release Gates (Weeks 11-12):** Pass security, quality, reliability, and FinOps audits; establish canary routing and on-call rota.\n6. **Scale & Optimization (Ongoing):** Apply FinOps levers (caching, batching, routing); raise autonomy only where measured quality supports it."
      },
      {
        "title": "2. AI Use-Case Feasibility Matrix",
        "body": "Before committing engineering headcount, score candidate projects across these 7 dimensions (Low / Medium / High):\n\n- **Business Value:** Measurable labor hours saved, revenue lift, or strategic priority.\n- **Data Availability:** High-quality, curated, permissioned documents exist in [[gcs]] or [[bigquery]].\n- **AI Suitability:** Problem requires reasoning, summarization, or semantic synthesis rather than deterministic arithmetic.\n- **Deterministic Tolerance:** Business can tolerate 95% accuracy with human escalation, rather than requiring 100.000% perfection.\n- **Technical Complexity:** Single-prompt utility (Low) vs multi-agent distributed system (High).\n- **Risk Profile:** Read-only internal summary (Low) vs autonomous financial transaction execution (High).\n- **ROI Potential:** Projected 12-month return relative to compute and engineering headcount cost."
      },
      {
        "title": "3. The 12 Enterprise Industry Blueprints",
        "body": "Standard production architectures for the 12 most impactful enterprise AI use cases:",
        "bullets": [
          "**1. Retail — Competitive Intelligence & Demand Forecasting:** Scrape public competitor pricing, analyze consumer reviews, and forecast localized inventory in BigQuery ML.",
          "**2. Banking — Anti-Money Laundering & Fraud Detection:** Combine real-time feature streams with graph analysis in Spanner Graph to identify fraud rings.",
          "**3. Insurance — Automated Claims Cracking:** Ingest police reports, repair photos, and medical bills via Document AI and Gemini to accelerate claims settlement.",
          "**4. Healthcare — Clinical Documentation Assistant:** Transcribe doctor-patient conversations with Speech-to-Text and synthesize structured SOAP notes with strict HIPAA compliance.",
          "**5. Manufacturing — Predictive Equipment Maintenance:** Ingest IoT sensor telemetry into Dataflow, detecting vibration anomalies before catastrophic machine failure.",
          "**6. Supply Chain — Global Disruption Rerouting:** Monitor real-time weather and port delays, automatically proposing optimal freight rerouting options.",
          "**7. Customer Support — Tier-1 Autonomous Resolution:** Resolve 60%+ of tier-1 customer inquiries with grounded RAG and authorized CRM tool execution.",
          "**8. Human Resources — Employee Policy & Benefits Navigator:** Answer complex health insurance and leave questions with citations from company handbooks.",
          "**9. IT Operations — Autonomous Incident Triage:** Correlate Cloud Logging errors during outages, suggesting root causes and running diagnostic scripts.",
          "**10. Legal — Automated Contract Review:** Extract risk clauses, indemnity liabilities, and non-standard terms from multi-hundred-page commercial agreements.",
          "**11. Sales — Account Intelligence & Proposal Drafting:** Aggregate CRM history and news to generate personalized, tailored RFP responses.",
          "**12. Marketing — Multilingual Campaign Personalization:** Generate culturally adapted advertising copy, visual assets, and localized product descriptions at scale."
        ]
      },
      {
        "title": "4. Leading Design Reviews and Risk Assessments",
        "body": "As an AI Engineering Manager, lead technical design reviews with these mandatory challenge questions:\n\n- 'What is our baseline score on real data, and how was the evaluation set verified?'\n- 'Why is this an agent rather than a deterministic script or a simple prompt?'\n- 'What happens when a tool returns an error or hallucinated arguments?'\n- 'What is the projected cost per successful task at 10x current volume?'\n- 'Can an untrusted document inject instructions that trigger unauthorized actions?'"
      }
    ],
    "see": [
      "dec:build-buy-customize",
      "dec:autonomy-level",
      "dec:cost-levers",
      "svc:adk",
      "svc:gemini",
      "svc:bigquery"
    ]
  }
];
