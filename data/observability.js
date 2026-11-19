/* Observability & Operations */
S({
  id: 'cloud-monitoring', cat: 'ops', name: 'Cloud Monitoring, Logging & Trace', doc: 'monitoring/docs',
  tag: 'Metrics, logs, traces and alerts for infrastructure, services and agents.',
  what: 'The Google Cloud observability suite has three parts. **Cloud Monitoring** collects metrics, draws dashboards and fires alerts (including SLO-based alerts). **Cloud Logging** ingests and stores logs, with log-based metrics and sinks to [[bigquery]] or [[gcs]]. **Cloud Trace** and OpenTelemetry-based tracing follow a request across services. **Managed Service for Prometheus** collects Prometheus metrics, and GPU and TPU metrics (utilisation, memory, temperature) come through agents and [[gke]] integrations.\n\nFor agents, the Agent Platform adds **Agent Observability**: turnkey dashboards and full execution traces of reasoning steps, tool calls and results, so a non-deterministic failure can be replayed and debugged.',
  flow: ['Emit signals', 'Collect', 'Store + index', 'Dashboards', 'Alerts', 'On-call'],
  steps: [
    [0, 'Services emit metrics, structured logs and trace spans, including model server stats and agent step events.'],
    [1, 'Agents and integrations collect them; the platform adds its own metrics for managed services.'],
    [2, 'Metrics and logs are stored with retention policies; logs can also be routed to [[bigquery]] for analysis.'],
    [3, 'Dashboards show latency (including time to first token), errors, throttles, tokens, queue depth and accelerator utilisation.'],
    [4, 'Alert policies fire on thresholds or SLO burn rate and notify a channel.'],
    [5, 'On-call follows a runbook, jumping from an alert to the trace and the logs.']
  ],
  gotchas: [
    '**Logging is billed by volume ingested.** Verbose prompt and response logging at scale is expensive, and holds sensitive data. Sample, exclude, and set retention.',
    '**High-cardinality labels explode metric cost.** Do not label by user or prompt.',
    '**Average latency hides tail pain.** Alert on high percentiles and on time to first token, not just total time.',
    '**Alerts without owners are noise.** Every page needs a named rota and a runbook.'
  ],
  edges: [
    'Log retention defaults differ by bucket, and audit logs have their own rules ([[audit-logs]]).',
    'Traces need propagation of trace context across every hop, including through queues, or they break into fragments.',
    'Agent traces contain prompts and tool results, so restrict access to them.'
  ],
  ml: [
    'Accelerator health and utilisation dashboards for training and serving ([[gke]], [[tpu]]).',
    'Alerts on quota rejections (429), token spikes and guardrail hits ([[quotas]], [[model-armor]]).',
    'Agent traces to debug wrong tool choices and loops ([[agent-runtime]]).'
  ],
  pairs: ['audit-logs', 'quotas', 'bigquery', 'gke', 'agent-runtime', 'ap-monitoring'],
  cost: 'Logging bills per GiB ingested above a free allowance (and for retention beyond default), Monitoring per metric data volume and for some metric types, Trace per span. Control cost with exclusion filters and sampling.'
});

S({
  id: 'audit-logs', cat: 'ops', name: 'Cloud Audit Logs', doc: 'logging/docs/audit',
  tag: 'A tamper-resistant record of who did what, where and when, across Google Cloud.',
  what: 'Cloud Audit Logs records API activity in four streams. **Admin Activity** logs (configuration changes) are always on and free. **Data Access** logs (reads and writes of data) must be enabled for most services and can be large. **System Event** logs record Google actions and **Policy Denied** logs record permission failures. Each entry names the principal, method, resource, time and source network.\n\nFor AI it answers questions regulators and incident responders ask: who invoked which model, who read the training bucket, which agent changed that record. For model requests themselves, separate request and response logging can be enabled on the platform, and that content is a different, sensitive stream.',
  flow: ['API call', 'Log entry', 'Log bucket', 'Sink', 'Analysis', 'Alert / evidence'],
  steps: [
    [0, 'A principal calls a Google Cloud API.'],
    [1, 'The service writes an audit log entry describing it.'],
    [2, 'The entry is stored in a log bucket with its retention period (Admin Activity for 400 days by default).'],
    [3, 'A sink routes copies to [[bigquery]] or [[gcs]] for long-term or cross-project analysis.'],
    [4, 'Queries and log-based alerts detect patterns, such as a new principal reading a model bucket.'],
    [5, 'The records serve as evidence in audits and incident reviews.']
  ],
  gotchas: [
    '**Data Access logs are off by default for most services,** so you have no read history until you turn them on. Enable them for sensitive data and model services before you need them.',
    '**They can be large and costly** on high-volume data services. Scope them deliberately.',
    '**Identity in the log may be a service account, not a person.** Make sure you can map the service account to a team or agent.',
    '**Prompts are not in audit logs.** Content logging is a separate decision with privacy implications.'
  ],
  edges: [
    'Log entries arrive with small delay, so a real-time control based on them is best-effort.',
    'Exempted principals can be excluded from Data Access logs. Review exemptions.',
    'Organisation-level sinks protect logs from project owners, a good design for tamper resistance.'
  ],
  ml: [
    'Proving who accessed training data and models.',
    'Detecting unusual use of expensive accelerators or model invocation from a new identity.',
    'Triggering [[eventarc]] workflows from selected events.'
  ],
  pairs: ['cloud-monitoring', 'iam', 'bigquery', 'eventarc', 'agent-governance', 'kms'],
  cost: 'Admin Activity and System Event logs are free to store for default retention; Data Access logs are billed as ingested logs. Exports and extended retention add storage costs.'
});

S({
  id: 'infra-manager', cat: 'ops', name: 'Terraform & Infrastructure Manager', doc: 'infrastructure-manager/docs',
  tag: 'Define the platform as code, with Terraform, deployed and tracked by a managed service.',
  what: 'Terraform is the standard way to define Google Cloud infrastructure as code, using the `google` and `google-beta` providers. **Infrastructure Manager** runs Terraform for you as a managed service (deployments, previews, state in Cloud Storage, history), and **Config Connector** manages resources through Kubernetes manifests. **Cloud Foundation Toolkit** and blueprints supply tested modules for landing zones, networks and projects.\n\nML platforms have many moving parts (projects, networks, keys, buckets, endpoints, quotas, budgets). Defined in code, they are reviewable, reproducible per environment and recoverable.',
  flow: ['Write config', 'Review (PR)', 'Plan / preview', 'Apply', 'State', 'Detect drift'],
  steps: [
    [0, 'Engineers write Terraform for projects, networks ([[vpc]]), keys ([[kms]]), buckets and endpoints.'],
    [1, 'Changes go through pull-request review, with policy checks.'],
    [2, 'A preview shows what will be created, changed or destroyed.'],
    [3, 'Apply creates the resources with a deployment service account ([[iam]]).'],
    [4, 'State records what exists, stored remotely with locking.'],
    [5, 'Scheduled plans detect manual changes that drifted from code.']
  ],
  gotchas: [
    '**The apply identity is extremely powerful.** Scope it, protect the pipeline, and avoid owner on the whole organisation.',
    '**Destroying a resource can destroy data** (a bucket, a database, a key). Use deletion protection and lifecycle rules for stateful resources.',
    '**Provider and API version drift:** new platform features often appear in the beta provider first, and renamed services need migrations.',
    '**State is a secret store.** It can contain sensitive values. Restrict access.'
  ],
  edges: [
    'Some AI resources (endpoints, indexes) take a long time to create or update, so applies can time out. Raise timeouts.',
    'Quotas are resources too, but increases often need a request, not just code.',
    'Importing existing hand-built resources takes effort. Start early.'
  ],
  ml: [
    'Reproducible dev, staging and production for an AI platform.',
    'Embedding guardrails (org policy, budgets, perimeters) in the baseline.',
    'Tear-down of experimental GPU environments by deleting the stack.'
  ],
  pairs: ['iam', 'vpc', 'kms', 'billing', 'quotas'],
  cost: 'Terraform is free; Infrastructure Manager bills for the underlying Cloud Build and storage use. The cost saved is in avoided misconfiguration and idle resources.'
});

S({
  id: 'quotas', cat: 'ops', name: 'Quotas, Provisioned Throughput & Capacity', doc: 'docs/quotas',
  tag: 'The limits, reservations and shared pools that decide whether your model calls get through.',
  what: 'Google Cloud enforces **quotas** per project, region and resource: request rates, token rates, accelerator counts, and many more. The Quotas and System Limits page shows usage and lets you request increases, and a **quota adjuster** can raise some automatically. For Gemini on the Agent Platform, pay-as-you-go traffic uses **Dynamic Shared Quota**, a shared pool without a fixed per-project cap that can return 429 errors under contention. **Provisioned Throughput** reserves model capacity for a term, for predictable latency at steady load.\n\nAccelerator capacity is a third, separate problem: quota says you may ask, a **reservation** or [[dws]] says you will get it.',
  flow: ['Estimate peak', 'Check quotas', 'Request increase', 'Reserve capacity', 'Load test', 'Monitor 429s'],
  steps: [
    [0, 'You estimate peak requests and tokens per minute, and accelerator counts, for every region you will use.'],
    [1, 'You compare against current quotas and usage in the console or API.'],
    [2, 'You request increases, with justification, well before launch.'],
    [3, 'For steady, latency-sensitive load you buy Provisioned Throughput; for accelerators, a reservation or [[dws|Dynamic Workload Scheduler]].'],
    [4, 'A load test exercises peak, slow requests and cold scale-out, with retries and fallbacks.'],
    [5, 'Alerts on quota usage and 429 rate warn you before users feel it ([[cloud-monitoring]]).']
  ],
  gotchas: [
    '**Quota increases take days** and are not guaranteed. Capacity is a different thing: a granted quota does not create GPUs.',
    '**Limits are per region.** A fallback region needs its own quota and, for data residency, legal approval.',
    '**Retries without backoff turn throttling into an outage.** Use exponential backoff with jitter and a retry budget.',
    '**Dynamic shared quota is not a guarantee.** If a feature is business critical, buy provisioned capacity or design a fallback model.'
  ],
  edges: [
    'Batch and online workloads may have separate limits, which is a useful way to protect interactive traffic.',
    'Provisioned Throughput is sized in model-specific units, and mismatch (too small or large) wastes money or throttles.',
    'Partner models have their own quotas, separate from Gemini.'
  ],
  ml: [
    'A pre-launch checklist item for every model or accelerator you depend on ([[ap-inference]], [[gemini]]).',
    'Fallback design: a second model or region that has been tested against the evals.',
    'Capacity planning for training campaigns ([[tpu]], [[gce]]).'
  ],
  pairs: ['gemini', 'dws', 'gce', 'tpu', 'cloud-monitoring', 'billing'],
  cost: 'Quotas themselves are free. Provisioned Throughput and reservations are committed spend billed whether used or not, so size them to the steady baseline and let pay-as-you-go cover bursts.'
});

S({
  id: 'billing', cat: 'ops', name: 'Billing, Budgets & FinOps', doc: 'billing/docs',
  tag: 'See where AI spend goes, alert on it early, and attribute it to features and teams.',
  what: 'Cloud Billing offers **budgets and alerts** (by project, service or label), **billing export to BigQuery** with detailed line items, cost breakdown reports, committed use discounts and the FinOps hub for recommendations. **Labels** and project structure let you attribute spend to teams and features, and programmatic budget notifications through [[pubsub]] can trigger automation.\n\nBudgets alert by default; they **do not cap** spending. For runaway AI cost, the fast controls are quotas, rate limits and automated shutoffs, because billing data lags by hours.',
  flow: ['Label + structure', 'Export to BigQuery', 'Budgets', 'Alerts', 'Automation', 'Review'],
  steps: [
    [0, 'Projects, folders and labels map spend to teams, tenants and features.'],
    [1, 'Detailed billing data is exported to [[bigquery]] on a regular cadence.'],
    [2, 'Budgets set thresholds per project, service or label.'],
    [3, 'Alerts notify owners at chosen percentages and on forecast overrun.'],
    [4, 'A Pub/Sub notification can trigger a function to disable a service or lower a quota ([[pubsub]]).'],
    [5, 'A regular review compares cost per successful task with the forecast, and applies the levers.']
  ],
  gotchas: [
    '**Billing data lags,** by hours for usage and longer for some items. A runaway loop can spend a lot before the alert arrives.',
    '**Token usage must be tracked in your own telemetry** to compute cost per task. Billing shows dollars, not business meaning.',
    '**Labels are not retroactive and are not inherited by every resource.** Enforce them with policy.',
    '**Idle accelerators and endpoints** are the usual surprise. Add owners and automatic shutdown.'
  ],
  edges: [
    'Committed use discounts and reservations are shared at the billing account level, which can make a team\'s cost allocation unclear.',
    'Egress and cross-region traffic can be a large hidden line item for data-heavy AI.',
    'Partner model marketplace charges appear separately.'
  ],
  ml: [
    'Cost per task by feature and tenant, joined from billing export and token logs.',
    'Alarms for unexpected accelerator spend.',
    'Evidence for choosing between provisioned capacity and pay-as-you-go.'
  ],
  pairs: ['bigquery', 'pubsub', 'quotas', 'cloud-monitoring', 'infra-manager'],
  cost: 'Billing tools are free. The cost of weak cost control is not, so budget alerts, quotas and labels are among the cheapest controls in this atlas.'
});
