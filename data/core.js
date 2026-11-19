/* Shared registry + category definitions.
   Every service file calls S({...}). Schema:
   id, cat, name, tag, doc (path under docs.cloud.google.com), what,
   flow:[labels], steps:[[flowIndex, text]], gotchas:[], edges:[], ml:[], pairs:[ids], cost
   Text supports `code`, **bold**, and [[service-id]] / [[service-id|label]] links.
   Naming note: Vertex AI became the Gemini Enterprise Agent Platform ("Agent Platform") in April 2026.
   Ids for those services use the prefix `ap-` or an agent-specific name. */
window.ATLAS = { categories: [], services: [], architectures: [], decisions: [] };
window.S = function (o) { window.ATLAS.services.push(o); };

window.ATLAS.categories = [
  {
    id: 'compute', name: 'Compute & Accelerators', hue: 18,
    short: 'TPUs, NVIDIA GPUs, containers, serverless and accelerator schedulers.',
    intro: 'AI systems are bottlenecked by two things: accelerator capacity and how quickly you can keep it busy. This category covers where code and models actually run, from a single Cloud Run service to thousands of TPU or GPU chips wired into one fabric.\n\nThe key split is **spiky and small** (Cloud Run) versus **sustained and accelerated** (GPU VMs, TPUs, GKE). Most real systems use both: a thin serverless layer in front and a fat accelerated layer behind it. Google also gives you a choice other clouds do not: its own TPUs sit beside NVIDIA GPUs, and the same Kubernetes layer can schedule either.',
    lens: 'Ask three questions: does it need a TPU or a GPU, how long does one unit of work run, and how bursty is the load? Then ask **how will we obtain the chips**, because on Google Cloud the consumption model (reservation, Dynamic Workload Scheduler, Spot) matters as much as the instance type.'
  },
  {
    id: 'storage', name: 'Storage', hue: 42,
    short: 'Where datasets, checkpoints, models and embeddings live.',
    intro: 'Storage choices decide training throughput and the bill. Cloud Storage is the system of record for almost everything in ML: raw data, features, checkpoints, model artifacts. Parallel file systems and fast block storage appear when a job needs POSIX semantics or very high sustained throughput.',
    lens: 'Keep **Cloud Storage as the source of truth**, and add a faster tier (Anywhere Cache, Rapid Storage, Managed Lustre, Hyperdisk ML) only where a profiler shows accelerators waiting on data.'
  },
  {
    id: 'databases', name: 'Databases & Vector Stores', hue: 145,
    short: 'Operational data, caches, global SQL and similarity search.',
    intro: 'Generative AI made the database layer matter more: retrieval needs a vector index, agents need low-latency memory, and chat apps need durable state. On Google Cloud most operational databases now ship vector search and managed MCP servers, so agents can query them directly.',
    lens: 'Prefer adding vectors to a database you already operate (AlloyDB, Cloud SQL, Spanner, Firestore) until scale, latency or filtering needs prove otherwise. Moving embeddings later is easy; running one more database is permanent.'
  },
  {
    id: 'analytics', name: 'Data & Analytics', hue: 178,
    short: 'The warehouse, pipelines, Spark and the catalog that agents read.',
    intro: 'Models are only as good as the data pipeline behind them. On Google Cloud the centre of gravity is BigQuery: a warehouse that also runs ML, embeddings and vector search, and that now sits inside what Google calls the Agentic Data Cloud. Around it sit stream and batch engines, Spark, and a catalog that tells agents what the data means.',
    lens: 'Think in layers: **land** raw data in Cloud Storage or BigQuery, **catalog** it, **transform** it, **query** it, **govern** it. BigQuery covers several layers at once, which is its strength and the reason to be deliberate about cost controls.'
  },
  {
    id: 'streaming', name: 'Streaming & Orchestration', hue: 208,
    short: 'Messaging, events, task queues and workflows that glue systems together.',
    intro: 'Production AI is asynchronous. Embedding jobs queue up, user events stream into feature pipelines, and multi-step agent or training workflows need retries and state. These services carry messages and coordinate work.',
    lens: 'Choose by delivery semantics and replay needs: a **queue or task dispatcher** hands each message to one worker, a **topic with retention** lets many readers replay, a **log** (Kafka) keeps strict partition order, and an **event bus** routes by rules.'
  },
  {
    id: 'genai', name: 'Generative AI & Agents', hue: 268,
    short: 'Gemini and partner models, retrieval, agent building, runtime and memory.',
    intro: 'The Gemini Enterprise Agent Platform (formerly Vertex AI) is the managed front door to Gemini, Google open models and partner models such as Claude, with the supporting pieces for retrieval, agent building, hosting, memory and evaluation. If you want to call, ground and govern models without running accelerator fleets, start here.\n\nSince April 2026 the platform is organised around agents: models are something agents consume, and governance (identity, registry, gateway) is part of the platform, not an afterthought. The older `vertexai` generative SDK modules were removed in favour of the `google-genai` SDK.',
    lens: 'Start with the highest-level service that meets the requirement (the Gemini API, then RAG Engine or AI Search, then Agent Runtime), and drop down to the ML platform or raw GKE only when you need control the managed layer will not give you.'
  },
  {
    id: 'ml', name: 'ML Platform (Agent Platform)', hue: 300,
    short: 'Train, tune, register, deploy and monitor your own models.',
    intro: 'The model-building half of the Agent Platform (the part that used to be called Vertex AI) is the managed platform for the classic ML lifecycle and for training or hosting open-weight and custom models. It covers notebooks, managed training, tuning, pipelines, feature storage, a model registry, several kinds of inference endpoint, monitoring and evaluation.',
    lens: 'Use this layer when **you own the model**: custom training, fine-tuning, or hosting open weights. Use the Gemini API when you are consuming a model someone else trains.'
  },
  {
    id: 'aiservices', name: 'Pre-built AI Services', hue: 332,
    short: 'API-call AI for documents, speech, translation, vision and contact centres.',
    intro: 'These are task-specific models behind an API: no training, no infrastructure. They remain the fastest route for well-defined tasks like OCR, transcription, or translation, and they pair naturally with LLMs, which are strong at reasoning but wasteful at extraction. Gemini itself is multimodal and can now do some of this work, so the real question is which one is cheaper and more auditable for your volume.',
    lens: 'Use a specialist service for the **extraction** step and an LLM for the **reasoning** step. It is usually cheaper, faster and easier to audit than asking an LLM to do both. Test Gemini on your own documents before assuming a specialist is required.'
  },
  {
    id: 'networking', name: 'Networking & Delivery', hue: 232,
    short: 'How requests reach models, and how services talk privately.',
    intro: 'Latency, privacy and streaming behaviour of AI endpoints are largely decided by the network path. This category covers fronting a model with an API, keeping traffic off the public internet, and connecting on-premises data.',
    lens: 'Draw the request path end to end and note every timeout and payload limit on it. The smallest one wins, and it is usually not the one you set.'
  },
  {
    id: 'security', name: 'Security & Identity', hue: 6,
    short: 'Identity, encryption, perimeters, and guardrails for models and agents.',
    intro: 'AI workloads concentrate sensitive data and expensive resources. A stolen service-account key can run up a five-figure accelerator bill, and a careless prompt log can leak customer data. Google Cloud adds a new layer for agents: identities, a registry and a gateway that treat an agent as a first-class principal.',
    lens: 'Start from **identity** (who or what can call what), then **data** (who can read it, encrypted with whose key), then **perimeter** (what can reach it and where can data leave).'
  },
  {
    id: 'ops', name: 'Observability & Operations', hue: 88,
    short: 'Metrics, logs, audit trails, quotas, cost and infrastructure as code.',
    intro: 'ML systems fail quietly: latency creeps up, quality drifts, costs spike. Observability turns those into signals, and infrastructure as code makes the whole platform reproducible. Quotas and billing belong here too, because on a shared model service they are the first thing that breaks.',
    lens: 'Instrument three layers: **infrastructure** (accelerator utilisation, queue depth), **service** (latency, errors, quota rejections), and **model quality** (drift, eval scores, guardrail hits).'
  }
];
