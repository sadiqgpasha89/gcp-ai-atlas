/* Streaming & Orchestration */
S({
  id: 'pubsub', cat: 'streaming', name: 'Pub/Sub', doc: 'pubsub/docs',
  tag: 'Global messaging with retention, replay, ordering keys and direct BigQuery delivery.',
  what: 'Pub/Sub decouples senders from receivers. Publishers write messages to a **topic**; each **subscription** gets its own copy and delivers it by pull, push (HTTPS), or straight into [[bigquery]] or [[gcs]]. Delivery is at-least-once by default, with optional exactly-once delivery on pull subscriptions, ordering keys for per-key order, dead-letter topics, and replay by seeking a subscription back in time or to a snapshot. It scales automatically with no partitions to manage.\n\nIt is the default event backbone for AI pipelines: document-arrived events, embedding job requests, feedback streams, and fan-out of model outputs to several consumers.',
  flow: ['Publisher', 'Topic', 'Subscription', 'Delivery', 'Ack or retry', 'Dead-letter / replay'],
  steps: [
    [0, 'A service publishes a message (up to a few MB) with attributes and optionally an ordering key.'],
    [1, 'The topic stores it durably and replicates it across zones.'],
    [2, 'Each subscription receives its own copy, and retains it until acknowledged or the retention period ends.'],
    [3, 'A subscriber pulls it, or Pub/Sub pushes it to an endpoint such as [[cloud-run]], or writes it directly to [[bigquery]].'],
    [4, 'The consumer acknowledges after processing. If the ack deadline passes, the message is redelivered.'],
    [5, 'After too many failed attempts a message goes to a dead-letter topic, and a subscription can be rewound to replay history.']
  ],
  gotchas: [
    '**At-least-once means duplicates.** Make handlers idempotent, using a message id or business key.',
    '**Ordering keys limit throughput per key** and a failed message can block later ones with the same key until resolved.',
    '**Ack deadlines must outlast processing.** A slow model call that exceeds the deadline causes redelivery and double work. Extend deadlines or ack early and track state elsewhere.',
    '**Message size is bounded.** Pass an object reference ([[gcs]] URI), not the document.'
  ],
  edges: [
    'Push delivery retries with backoff and needs the endpoint to return success quickly. Long agent runs should be queued, not run inline.',
    'Retention and replay are per topic and per subscription settings, so a new subscription does not see old messages unless you seek.',
    'Cross-region delivery adds latency and egress cost.'
  ],
  ml: [
    'Triggering ingestion and embedding when new documents land, with a dead-letter topic for failures.',
    'Streaming user feedback and click events into [[dataflow]] feature pipelines.',
    'Fan-out of one model output to audit, analytics and notification consumers.'
  ],
  pairs: ['dataflow', 'cloud-run', 'eventarc', 'bigquery', 'cloud-tasks', 'managed-kafka'],
  cost: 'Billed per volume of data published and delivered (with a free monthly allowance), plus retention storage beyond the default and replay or snapshot storage. Exactly-once and ordering have no extra fee but constrain throughput.'
});

S({
  id: 'managed-kafka', cat: 'streaming', name: 'Managed Service for Apache Kafka', doc: 'managed-service-for-apache-kafka/docs',
  tag: 'Managed Kafka clusters for teams that need the Kafka protocol and ecosystem.',
  what: 'Google Cloud\'s managed Kafka service runs Apache Kafka clusters with automated broker management, scaling and upgrades, while keeping the standard protocol, clients and connectors. Choose it over [[pubsub]] when you need strict per-partition ordering at high throughput, log compaction, consumer-group semantics that your tools assume, or an existing Kafka estate to migrate.\n\nFor AI workloads it is the transport for event streams that feed real-time features and vector sinks, often with [[dataflow]] or Kafka Connect on the other side.',
  flow: ['Producer', 'Topic partitions', 'Broker leader', 'Replicate', 'Consumer group', 'Sink'],
  steps: [
    [0, 'A producer writes records with a key; the key decides the partition.'],
    [1, 'Each topic is split into partitions, which are the unit of ordering and parallelism.'],
    [2, 'The partition leader broker appends the record to its log.'],
    [3, 'Followers on other brokers or zones replicate it, and the producer is acknowledged per its settings.'],
    [4, 'A consumer group reads partitions in parallel, tracking offsets so it can resume or replay.'],
    [5, 'A connector or [[dataflow]] writes results to [[bigquery]], [[bigtable]] or a vector sink.']
  ],
  gotchas: [
    '**Partition count is hard to reduce** and affects parallelism and ordering. Pick it with growth in mind.',
    '**A slow consumer causes lag,** not errors. Alert on consumer lag.',
    '**Cluster sizing is yours.** Capacity is provisioned in vCPU and memory, so over-sizing costs money and under-sizing causes throttling.',
    'Network paths need private connectivity configured ([[vpc]], [[psc]]).'
  ],
  edges: [
    'Rebalances pause consumers. Long processing between polls triggers them.',
    'Retention is by time or size, and old offsets become unreadable.',
    'Version and feature support follows upstream Kafka with some lag.'
  ],
  ml: [
    'High-throughput event backbone feeding real-time features ([[ap-feature-store]]).',
    'Migrating an existing Kafka-based data platform to Google Cloud without rewriting producers.',
    'Streaming embeddings into vector sinks with Kafka Connect.'
  ],
  pairs: ['pubsub', 'dataflow', 'bigquery', 'bigtable', 'vpc'],
  cost: 'Billed for provisioned cluster compute and memory, and for storage and network. It is capacity-priced, unlike the pay-per-message model of [[pubsub]].'
});

S({
  id: 'eventarc', cat: 'streaming', name: 'Eventarc', doc: 'eventarc/docs',
  tag: 'Routes events from Google Cloud, your apps and SaaS to Cloud Run, GKE and Workflows.',
  what: 'Eventarc delivers events as CloudEvents to a destination: [[cloud-run]], [[gke]], [[workflows]] or an HTTP endpoint. Sources include Cloud Storage object changes, Cloud Audit Log entries for almost any Google Cloud service, [[pubsub]] topics and direct events from many services. A newer advanced mode adds a message bus, filtering and transformation pipelines.\n\nIt is the glue for event-driven AI: "when a file lands in the bucket, start ingestion", or "when a model is registered, run the evaluation workflow".',
  flow: ['Event source', 'Trigger + filter', 'Transform', 'Route', 'Destination', 'Retry'],
  steps: [
    [0, 'Something happens: an object is finalised in [[gcs]], an audit log entry is written, a Pub/Sub message arrives.'],
    [1, 'A trigger with filters (event type, bucket, resource name) matches the event.'],
    [2, 'Optionally the event is transformed or enriched before delivery.'],
    [3, 'Eventarc routes it to the configured destination using a service account identity ([[iam]]).'],
    [4, 'The destination ([[cloud-run]], [[workflows]]) runs its logic.'],
    [5, 'Failed deliveries are retried with backoff according to the trigger settings.']
  ],
  gotchas: [
    '**Delivery is at-least-once,** so destinations must be idempotent.',
    '**Audit-log events need audit logging enabled** for the source service, and Data Access logs are off by default for many services ([[audit-logs]]).',
    '**Triggers are regional,** and the source and trigger location must match for many sources.',
    'The service account used for delivery needs invoker permission on the destination.'
  ],
  edges: [
    'Events can arrive out of order and slightly late.',
    'A trigger that writes to the bucket it watches can loop. Filter on prefixes.',
    'Large payloads are not carried in the event. Fetch the object from storage.'
  ],
  ml: [
    'Start document ingestion when a new file lands in a bucket ([[rag-engine]]).',
    'Kick off an evaluation or deployment workflow when a model is registered ([[ap-pipelines]]).',
    'Route security or quota events to an alerting workflow.'
  ],
  pairs: ['cloud-run', 'workflows', 'pubsub', 'gcs', 'audit-logs'],
  cost: 'Standard triggers have no per-event charge beyond underlying services, while advanced mode bills per event processed. Destination costs (Cloud Run, Workflows) apply.'
});

S({
  id: 'workflows', cat: 'streaming', name: 'Workflows', doc: 'workflows/docs',
  tag: 'Serverless orchestration of API calls, with retries, parallel steps and human callbacks.',
  what: 'Workflows runs a definition written in YAML or JSON that calls HTTP endpoints and Google Cloud APIs through connectors, with conditions, loops, parallel branches, try/retry/except blocks, and subworkflows. Executions are durable: state is kept for you, steps retry on failure, and an execution can wait for an external signal with a **callback**.\n\nCallbacks make it the natural place for **human approval** in an agent process: the workflow creates a callback URL, sends it to a reviewer, and pauses cheaply until it is called, then continues.',
  flow: ['Trigger', 'Execution starts', 'Call APIs', 'Parallel + branch', 'Wait for callback', 'Complete'],
  steps: [
    [0, 'An [[eventarc]] trigger, a scheduler or an API call starts an execution with input arguments.'],
    [1, 'The engine runs steps in order, keeping variables as state.'],
    [2, 'A step calls [[cloud-run]], [[gemini]] or another API, using connectors that handle long-running operations.'],
    [3, 'Parallel branches run concurrently, and `try`/`retry` blocks handle transient failures.'],
    [4, 'A callback step pauses until an HTTP request arrives, for example when a person approves an action.'],
    [5, 'The execution completes, or fails with a reason, leaving a log of every step.']
  ],
  gotchas: [
    '**Variable and payload sizes are limited,** so pass object references rather than documents.',
    '**It is for orchestration, not computation.** Heavy data transformation belongs in [[dataflow]] or [[cloud-run]].',
    '**Callbacks are bearer URLs.** Treat them as secrets and authenticate who calls them.',
    'Step counts and execution duration have limits; check them for very long processes.'
  ],
  edges: [
    'A step that is retried without idempotency can repeat side effects such as sending an email.',
    'Expression syntax has its own quirks. Test definitions with small inputs first.',
    'Connectors cover many but not all Google APIs.'
  ],
  ml: [
    'Approval gates for agent actions that change state, with an audit trail ([[agent-governance]]).',
    'Ingestion and evaluation pipelines that chain [[batch]], [[bigquery-ai]] and model calls.',
    'Multi-step document processing with retries and a human review branch ([[document-ai]]).'
  ],
  pairs: ['eventarc', 'cloud-run', 'cloud-tasks', 'document-ai', 'composer', 'batch'],
  cost: 'Billed per executed step (internal and external steps priced differently) with a free monthly tier. Waiting on a callback is cheap; each step run counts.'
});

S({
  id: 'composer', cat: 'streaming', name: 'Cloud Composer', doc: 'composer/docs',
  tag: 'Managed Apache Airflow for scheduled, dependency-heavy data and ML pipelines.',
  what: 'Cloud Composer runs Apache Airflow environments: you write DAGs in Python, and it schedules and monitors them, with a large library of operators for Google Cloud services and others. It suits scheduled and backfill-heavy pipelines with many dependencies: nightly feature builds, retraining schedules, data quality checks.\n\nChoose it when your team already uses Airflow or needs its rich scheduling and operator ecosystem. For event-driven or short flows, [[workflows]] is lighter; for ML-specific lineage and caching, [[ap-pipelines]] is more integrated.',
  flow: ['DAG file', 'Scheduler', 'Task queue', 'Worker', 'Operator runs', 'State + UI'],
  steps: [
    [0, 'You deploy a DAG file to the environment\'s bucket.'],
    [1, 'The scheduler parses it and creates runs on schedule or on trigger.'],
    [2, 'Ready tasks are queued by dependency order.'],
    [3, 'Workers pick tasks up, scaling with load in Composer 2 and later.'],
    [4, 'Operators call [[bigquery]], [[dataflow]], [[ap-training]] or other services and wait or defer.'],
    [5, 'Task state, logs and retries appear in the Airflow UI and Cloud Logging.']
  ],
  gotchas: [
    '**An environment is always on,** so even an idle one bills for its scheduler, database and workers.',
    '**Heavy work inside a task** (running data processing in the worker) overloads it. Delegate to the proper service and just wait.',
    '**DAG parsing cost.** Importing large libraries or calling APIs at the top level of a DAG file slows the scheduler.'
  ],
  edges: [
    'Airflow major version upgrades need DAG changes. Pin versions and test.',
    'Backfills can launch hundreds of runs at once. Set max active runs.',
    'Environment networking (private IP, VPC-SC) needs planning ([[vpc-sc]]).'
  ],
  ml: [
    'Scheduled retraining and batch-scoring pipelines across data and ML services.',
    'Orchestrating nightly embedding refreshes and evaluation reports.',
    'Data quality gates that block downstream training.'
  ],
  pairs: ['workflows', 'bigquery', 'dataflow', 'ap-pipelines', 'spark'],
  cost: 'Billed for the environment: scheduler, workers, web server and database, plus storage, by size tier. It runs continuously, so size it for the workload and delete test environments.'
});

S({
  id: 'cloud-tasks', cat: 'streaming', name: 'Cloud Tasks', doc: 'tasks/docs',
  tag: 'A task dispatcher with rate limits and retries for calling your own services.',
  what: 'Cloud Tasks lets you put HTTP tasks on a queue and have Google Cloud call a target at a rate you control, retrying on failure. Unlike [[pubsub]], the producer decides the target and the queue controls dispatch rate and concurrency, which makes it ideal for **protecting a downstream service** such as a model endpoint with a hard quota.\n\nIt supports scheduled tasks (run at a future time), de-duplication by task name, and per-queue retry policies.',
  flow: ['Producer creates task', 'Queue', 'Rate limiter', 'Dispatch HTTP', 'Handler', 'Retry / done'],
  steps: [
    [0, 'Your service creates a task with a target URL, payload and optional schedule time.'],
    [1, 'The task sits in a queue with configured maximum dispatch rate and concurrency.'],
    [2, 'The dispatcher releases tasks no faster than those limits, smoothing bursts.'],
    [3, 'It sends an authenticated HTTP request to the handler, such as [[cloud-run]].'],
    [4, 'The handler does the work (calls a model, writes a result) and returns a status.'],
    [5, 'A non-success response triggers a retry with backoff, until the maximum attempts or duration.']
  ],
  gotchas: [
    '**Handlers must respond within the dispatch deadline.** Long model calls need the deadline set high, or a different design.',
    '**Retries repeat work.** Use task names for de-duplication and idempotent handlers.',
    '**Tasks have size limits.** Store payloads in [[gcs]] and pass a reference.'
  ],
  edges: [
    'Queue rate limits are per queue, so one noisy tenant can starve others unless you use per-tenant queues.',
    'Deleted-queue names cannot be reused for a while.',
    'Delivery order is not guaranteed.'
  ],
  ml: [
    'Throttling calls to a rate-limited model or tool API so you stay within quota ([[quotas]]).',
    'Scheduling delayed follow-up work such as re-checking an async job.',
    'Fan-out of embedding or evaluation jobs at a controlled rate.'
  ],
  pairs: ['cloud-run', 'pubsub', 'workflows', 'gemini', 'quotas'],
  cost: 'Billed per million operations after a free tier. Underlying handler costs dominate.'
});
