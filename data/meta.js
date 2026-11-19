/* Product facts for each service, merged into ATLAS.services at load.
   Fields:
     was    previous names (searchable, shown on the page)
     s      launch stage: 'GA' | 'Preview' | 'Mixed' (features differ) | 'Check' (not confirmed)
     v      what was verified against Google Cloud documentation in the last review: 'name', 'status', 'limits'
     reg    regional note (omit to show a pointer to the locations page)
     price  pricing page URL (omit to point at the docs)
     lim    quotas or key limits (omit to show a pointer to the Quotas page)
     alt    alternatives and migration considerations
   Rule: only write a limit, region or status that was read in the docs. Everything else says "Check".
   Launch stages are for the product; individual features carry their own stage. */
window.ATLAS.metaReviewed = '2026-11-19';
window.ATLAS.meta = {
  /* ---- compute ---- */
  'gce': { s: 'GA', price: 'https://cloud.google.com/compute/gpus-pricing', lim: 'GPU quotas are set per project, region and GPU model, and new projects start low. Request increases before a launch or a training run.', alt: 'Cloud TPU for steady, matmul-heavy work; GKE to orchestrate many GPU nodes; managed endpoints on the Agent Platform if you do not want to run model servers.' },
  'tpu': { s: 'GA', price: 'https://cloud.google.com/tpu/pricing', reg: 'TPU generations are offered in specific zones only. Confirm the zone for the generation you need before designing around it.', alt: 'GPUs on Compute Engine or GKE when your framework or model is not TPU-ready; managed Gemini or partner models when you do not need to host.' },
  'cloud-run': { s: 'GA', price: 'https://cloud.google.com/run/pricing', alt: 'GKE for long-lived, accelerator-heavy or heavily customised serving; Agent Runtime for managed agent hosting with sessions and memory.' },
  'gke': { s: 'GA', price: 'https://cloud.google.com/kubernetes-engine/pricing', alt: 'Cloud Run when you do not need cluster control; Agent Runtime for agents; managed endpoints on the Agent Platform for model hosting.' },
  'batch': { s: 'GA', price: 'https://cloud.google.com/batch/pricing', alt: 'Managed Training for ML jobs; Dataflow for data pipelines; Dynamic Workload Scheduler when the constraint is scarce accelerators.' },
  'dws': { s: 'Mixed', alt: 'Reservations for steady baselines; Spot for interruptible work; on-demand when capacity is available and the job is not time-critical. Check which consumption options your GPU or TPU type supports.' },
  /* ---- storage ---- */
  'gcs': { s: 'GA', price: 'https://cloud.google.com/storage/pricing', alt: 'Managed Lustre or Hyperdisk ML only where a profiler shows accelerators waiting on data; keep Cloud Storage as the source of truth.' },
  'gcs-fast': { s: 'Mixed', price: 'https://cloud.google.com/storage/pricing', alt: 'Plain Cloud Storage with parallel reads; Managed Lustre for POSIX and very high throughput. Newer features carry their own launch stage and locations: check each.' },
  'managed-lustre': { s: 'Check', alt: 'Cloud Storage with a cache for read-mostly data; Hyperdisk ML for read-only model weights at many replicas.' },
  'hyperdisk': { s: 'GA', price: 'https://cloud.google.com/compute/disks-image-pricing', alt: 'Cloud Storage with Anywhere Cache for read-mostly data; Managed Lustre for shared, high-throughput POSIX.' },
  /* ---- databases ---- */
  'alloydb': { s: 'GA', price: 'https://cloud.google.com/alloydb/pricing', alt: 'Cloud SQL for smaller, simpler Postgres; Spanner for global consistency; Agent Retrieval or Vector Search for a dedicated retrieval tier.' },
  'cloud-sql': { s: 'GA', price: 'https://cloud.google.com/sql/pricing', alt: 'AlloyDB for heavier Postgres and vector workloads; Spanner when you need horizontal scale or multi-region writes.' },
  'spanner': { s: 'GA', price: 'https://cloud.google.com/spanner/pricing', alt: 'AlloyDB or Cloud SQL when a single region is enough; Bigtable for key-based, very high write throughput.' },
  'spanner-graph': { s: 'GA', v: ['status'], price: 'https://cloud.google.com/spanner/pricing', alt: 'Vector-only retrieval (Agent Retrieval, Vector Search, AlloyDB) when questions do not depend on relationships between entities. Google announced general availability in January 2025.' },
  'firestore': { s: 'GA', price: 'https://cloud.google.com/firestore/pricing', alt: 'Spanner or AlloyDB for relational integrity; Bigtable for very high throughput time series.' },
  'bigtable': { s: 'GA', price: 'https://cloud.google.com/bigtable/pricing', alt: 'Spanner when you need secondary indexes and transactions; Firestore for document data with smaller scale.' },
  'memorystore': { s: 'GA', alt: 'Agent memory services for conversational memory; Firestore or Spanner when the data must be durable.' },
  'vector-search': { s: 'GA', v: ['name'], was: ['Vertex AI Vector Search', 'Matching Engine'], alt: 'Agent Retrieval for a managed store that holds the data, auto-embeds and does hybrid search; AlloyDB or Spanner when vectors belong with relational data. Agent Retrieval is a separate product with its own API, so moving is a migration.' },
  'agent-retrieval': { s: 'Check', v: ['name', 'limits'], was: ['Vector Search 2.0', 'Vertex AI Vector Search 2.0'], lim: 'A data object ID must be 1 to 63 characters. Collection and index limits are in the docs.', alt: 'Vector Search for an ANN index service when you manage embeddings and metadata yourself; AlloyDB or Spanner when vectors belong with relational rows; RAG Engine when you want the managed pipeline on top.' },
  /* ---- analytics ---- */
  'bigquery': { s: 'GA', price: 'https://cloud.google.com/bigquery/pricing', alt: 'Spanner or AlloyDB for operational reads; Dataflow plus Cloud Storage for pipelines that do not need a warehouse.' },
  'bigquery-ai': { s: 'Mixed', price: 'https://cloud.google.com/bigquery/pricing', alt: 'Agent Platform pipelines and endpoints when models need custom code or GPUs; check the launch stage of each AI function.' },
  'dataflow': { s: 'GA', price: 'https://cloud.google.com/dataflow/pricing', alt: 'BigQuery SQL for set-based transforms; Spark for existing Spark code; Pub/Sub plus Cloud Run for light event processing.' },
  'spark': { s: 'Check', was: ['Dataproc', 'Dataproc Serverless'], alt: 'Dataflow for streaming and Beam pipelines; BigQuery for SQL transforms. Confirm the current product name and packaging in the docs.' },
  'knowledge-catalog': { s: 'Check', was: ['Dataplex Universal Catalog', 'Dataplex'], alt: 'A third-party catalog if you already run one; BigQuery metadata alone for a small estate.' },
  /* ---- streaming ---- */
  'pubsub': { s: 'GA', price: 'https://cloud.google.com/pubsub/pricing', alt: 'Managed Service for Apache Kafka for strict partition order and replay; Cloud Tasks for per-task dispatch and rate control.' },
  'managed-kafka': { s: 'GA', alt: 'Pub/Sub when you do not need Kafka semantics or ecosystem; check packaging and naming in the docs.' },
  'eventarc': { s: 'GA', price: 'https://cloud.google.com/eventarc/pricing', alt: 'Pub/Sub directly for custom events; Workflows for multi-step orchestration after an event.' },
  'workflows': { s: 'GA', price: 'https://cloud.google.com/workflows/pricing', alt: 'Cloud Composer for data-heavy DAGs; Agent Platform pipelines for ML; ADK workflow agents for model-driven control flow.' },
  'composer': { s: 'GA', price: 'https://cloud.google.com/composer/pricing', alt: 'Workflows for lighter orchestration; Agent Platform pipelines for ML-specific runs.' },
  'cloud-tasks': { s: 'GA', price: 'https://cloud.google.com/tasks/pricing', alt: 'Pub/Sub for fan-out; Workflows when the work has multiple steps and state.' },
  /* ---- generative AI & agents ---- */
  'gemini': { s: 'Mixed', price: 'https://cloud.google.com/vertex-ai/generative-ai/pricing', lim: 'Quotas apply per project, model and region. Each model version has its own launch stage and retirement date: pin a version and track its schedule.', alt: 'Partner and open models through Model Garden; self-hosted open models on GKE or GPUs when locality or unit cost demands it.' },
  'model-garden': { s: 'Mixed', v: ['name'], was: ['Vertex AI Model Garden'], price: 'https://cloud.google.com/vertex-ai/generative-ai/pricing', alt: 'Calling a single model API directly if you will never switch; self-hosting on GKE for full control.' },
  'rag-engine': { s: 'GA', v: ['limits'], reg: 'Google documents that new projects must be allowlisted to use RAG Engine in us-central1, and suggests other regions or contacting support. Confirm the supported regions for your project before designing around it.', lim: 'VPC Service Controls and CMEK are supported. Data residency and Access Transparency (AXT) controls are not supported. CMEK is available only for corpora that use the managed RAG database, and it is fixed when the corpus is created.', alt: 'Agent Search for a search product with relevance tooling; Agent Retrieval, Vector Search or AlloyDB when you own the pipeline; GraphRAG on Spanner Graph for relationship questions.' },
  'ai-search': { s: 'Mixed', v: ['name', 'status'], was: ['Vertex AI Search', 'Generative AI App Builder'], lim: 'The console still shows "Vertex AI Search and AI Applications" and the API is still discoveryengine.googleapis.com. Features have independent launch stages (for example, agentic retrieval for streaming answers was GA with an allowlist).', alt: 'RAG Engine when you want a retrieval pipeline you tune yourself; Agent Retrieval when you want fine-grained control of the retrieval mechanics.' },
  'agent-studio': { s: 'Check', v: ['name'], was: ['Vertex AI Studio'], alt: 'ADK for code-first agents; Gemini Enterprise for a finished employee app.' },
  'adk': { s: 'GA', alt: 'Other open agent frameworks (LangGraph and others) can also run on Agent Runtime; Agent Studio for low-code prototypes. Check the ADK docs for the language you plan to use.' },
  'agent-runtime': { s: 'GA', v: ['name', 'status'], was: ['Vertex AI Agent Engine', 'Reasoning Engine'], alt: 'Cloud Run or GKE when you need your own container, networking or scaling model; Gemini Enterprise when you want a managed employee app rather than hosting your own agent.' },
  'agent-memory': { s: 'GA', v: ['name', 'status'], was: ['Vertex AI Agent Engine Memory Bank', 'Vertex AI Agent Engine Sessions'], alt: 'Firestore, Spanner or AlloyDB for memory you want to own and query directly; Memorystore for short-lived session cache.' },
  'gemini-enterprise': { s: 'GA', v: ['name'], was: ['Agentspace', 'Google Agentspace'], alt: 'Build with ADK on Agent Runtime when the experience must be bespoke; Agent Search when you only need search.' },
  'agent-protocols': { s: 'Mixed', alt: 'Direct API tool definitions for a single agent calling a few systems; MCP when many agents or clients need the same tools; A2A when agents from different teams or vendors must call each other.' },
  /* ---- ML platform ---- */
  'ap-workbench': { s: 'GA', v: ['name'], was: ['Vertex AI Workbench', 'Vertex AI Colab Enterprise'], alt: 'Local notebooks or a self-managed JupyterHub; BigQuery notebooks for SQL-centric work.' },
  'ap-training': { s: 'GA', v: ['name'], was: ['Vertex AI Training'], alt: 'GKE or Compute Engine for full control of the training stack; Slurm-style clusters for very large jobs.' },
  'ap-tuning': { s: 'Mixed', alt: 'Prompting and retrieval first; self-managed fine-tuning on GKE for models the managed service does not tune. Tunable models and methods change often: check the supported list.' },
  'ap-pipelines': { s: 'GA', v: ['name'], was: ['Vertex AI Pipelines'], alt: 'Cloud Composer or Workflows for orchestration outside ML; Cloud Build for CI.' },
  'ap-feature-store': { s: 'Mixed', v: ['name'], was: ['Vertex AI Feature Store'], alt: 'BigQuery plus an online store such as Bigtable or Firestore; check the current Feature Store architecture before building on it.' },
  'ap-inference': { s: 'GA', v: ['name'], was: ['Vertex AI Endpoints', 'Vertex AI Model Registry'], alt: 'GKE with an inference gateway and your own model servers; Cloud Run for small CPU models.' },
  'ap-monitoring': { s: 'GA', v: ['name'], was: ['Vertex AI Model Monitoring'], alt: 'Custom drift jobs in BigQuery; third-party monitoring if you run models outside the platform.' },
  'ap-evals': { s: 'GA', v: ['name', 'status'], was: ['Gen AI evaluation service on Vertex AI'], lim: 'The user simulator caps a run at a maximum number of turns (default 5) to stop run-off conversations. The newer GenAI client in the SDK may carry a different launch stage from the service: check the SDK docs.', alt: 'Open evaluation frameworks run in your own pipeline; human review for the cases an autorater cannot judge.' },
  /* ---- pre-built AI ---- */
  'document-ai': { s: 'GA', price: 'https://cloud.google.com/document-ai/pricing', alt: 'Gemini multimodal for ad-hoc documents; a layout parser inside Agent Search or RAG Engine for retrieval-only needs.' },
  'speech-to-text': { s: 'GA', price: 'https://cloud.google.com/speech-to-text/pricing', alt: 'Gemini audio understanding for transcription plus reasoning in one call; compare accuracy and cost on your audio.' },
  'text-to-speech': { s: 'GA', price: 'https://cloud.google.com/text-to-speech/pricing', alt: 'Gemini native audio output or the Live API for conversational voice.' },
  'translation': { s: 'GA', price: 'https://cloud.google.com/translate/pricing', alt: 'Gemini for context-aware or domain-specific translation; compare cost and consistency on your content.' },
  'vision-ai': { s: 'GA', price: 'https://cloud.google.com/vision/pricing', alt: 'Gemini multimodal for flexible visual understanding; custom models for specialised detection.' },
  'ces': { s: 'Check', was: ['Contact Center AI'], alt: 'Agents built with ADK and the Gemini Live API when you need a bespoke voice experience.' },
  /* ---- networking ---- */
  'vpc': { s: 'GA', alt: 'Private Service Connect for service-specific private endpoints; Cloud Interconnect for on-premises links.' },
  'psc': { s: 'GA', alt: 'VPC peering where it is still the supported option; Private Google Access for Google APIs only.' },
  'load-balancing': { s: 'GA', alt: 'Apigee when you need API products, quotas per consumer and analytics in front of model endpoints.' },
  'apigee': { s: 'GA', price: 'https://cloud.google.com/apigee/pricing', alt: 'Cloud Load Balancing with Cloud Armor for simple fronting; Agent Gateway for agent and tool traffic governance.' },
  'interconnect': { s: 'GA', alt: 'Cloud VPN for lower-bandwidth or temporary links.' },
  /* ---- security ---- */
  'iam': { s: 'GA', alt: 'There is no substitute. Use workload identity federation rather than service-account keys.' },
  'kms': { s: 'GA', price: 'https://cloud.google.com/kms/pricing', lim: 'Check which services support CMEK for your data: support differs by service and sometimes by configuration (for example, RAG Engine).', alt: 'Google-managed keys when you have no key-control requirement.' },
  'secret-manager': { s: 'GA', price: 'https://cloud.google.com/secret-manager/pricing', alt: 'Workload identity so there is no secret to store; Agent Identity auth manager for agent credentials.' },
  'identity-platform': { s: 'GA', price: 'https://cloud.google.com/identity-platform/pricing', alt: 'Workforce Identity Federation for employees; IAP for internal apps.' },
  'cloud-armor': { s: 'GA', price: 'https://cloud.google.com/armor/pricing', alt: 'Model Armor for prompt and response screening; Cloud Armor handles network-layer and WAF rules.' },
  'sdp': { s: 'GA', price: 'https://cloud.google.com/sensitive-data-protection/pricing', alt: 'Model Armor for inline prompt screening; custom redaction for domain-specific identifiers.' },
  'vpc-sc': { s: 'GA', lim: 'Not every service is supported inside a perimeter, and some are partially supported. Check the supported-products table before relying on the perimeter.', alt: 'IAM Deny and organisation policies for finer rules; Private Service Connect for network isolation.' },
  'model-armor': { s: 'GA', v: ['status'], alt: 'Built-in model safety settings for basic filtering; custom classifiers for domain-specific risks. Model Armor can be enabled on an Agent Gateway so that agent traffic is screened.' },
  'agent-governance': { s: 'Mixed', v: ['status'], lim: 'Agent Identity, Agent Registry and Agent Gateway are described as generally available, but individual capabilities differ: the cross-cloud Agent Gateway workflow is Limited Preview, and Semantic Governance Policies were in Public Preview. An Agent Gateway can be associated with up to two Agent Registry instances.', alt: 'Apigee as an API gateway for model and tool endpoints; your own service mesh and OAuth stack for agents outside Google Cloud, bearing in mind the limits of cross-cloud support.' },
  /* ---- observability & operations ---- */
  'cloud-monitoring': { s: 'GA', price: 'https://cloud.google.com/stackdriver/pricing', was: ['Stackdriver', 'Cloud Operations suite'], alt: 'OpenTelemetry to a third-party backend if you standardise elsewhere; BigQuery log analytics for ad-hoc analysis.' },
  'audit-logs': { s: 'GA', alt: 'Log sinks to BigQuery or Cloud Storage for long retention; SIEM export for security teams.' },
  'infra-manager': { s: 'GA', alt: 'Self-managed Terraform with remote state in Cloud Storage; Config Connector on GKE.' },
  'quotas': { s: 'GA', alt: 'Provisioned Throughput or reservations when quotas cannot guarantee the capacity you need.' },
  'billing': { s: 'GA', alt: 'BigQuery billing export plus your own dashboards when budgets and reports are not enough.' }
};
window.ATLAS.services.forEach(function (s) {
  var m = window.ATLAS.meta[s.id];
  if (m) { s.meta = m; s.was = m.was || []; }
});
