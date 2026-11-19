/* Data & Analytics */
S({
  id: 'bigquery', cat: 'analytics', name: 'BigQuery', doc: 'bigquery/docs',
  tag: 'The serverless data warehouse and lakehouse at the centre of Google Cloud data and AI.',
  what: 'BigQuery separates storage from compute: data sits in managed columnar storage (or in open formats such as Iceberg on [[gcs]] through BigLake), and queries run on slots, a unit of compute allocated on demand or reserved. It handles SQL over petabytes, streaming ingestion, and governance down to row and column level.\n\nFor AI it is more than a source of training tables. It can generate embeddings, run vector search, call Gemini from SQL, and train models in place ([[bigquery-ai]]). Its **Storage Read API** streams data straight into training jobs, and managed remote MCP servers let agents query it with your IAM policies.',
  flow: ['Ingest', 'Storage + metadata', 'Query planner', 'Slots execute', 'Result / table', 'Consumer'],
  steps: [
    [0, 'Data arrives by batch load, the Storage Write API, [[dataflow]], a [[pubsub]] subscription, or a Datastream change feed.'],
    [1, 'It is stored in a columnar format, with partitioning and clustering to limit scanned data, and described in the catalog ([[knowledge-catalog]]).'],
    [2, 'The planner compiles SQL into stages and prunes partitions and columns.'],
    [3, 'Slots run the stages in parallel and shuffle intermediate data in memory.'],
    [4, 'Results land in a table, a view, or the client. Materialised views and BI Engine cache hot results.'],
    [5, 'A dashboard, a training job via the Storage Read API, or an agent through an MCP tool consumes it.']
  ],
  gotchas: [
    '**On-demand pricing bills by bytes scanned.** `SELECT *` on a wide table, or a missing partition filter, is the classic expensive mistake. Set maximum-bytes-billed limits.',
    '**Partitioning and clustering must match your filters.** Otherwise the query scans everything.',
    '**Slot contention.** Heavy shared workloads on a reservation queue each other. Separate reservations for ML, BI and ingestion.',
    '**Streaming data may sit in a buffer** briefly before it is fully available to some operations such as DML.'
  ],
  edges: [
    'Row-level security and policy tags protect data, but exports and ML model training can bypass assumptions if service accounts are over-permissioned.',
    'Time travel and fail-safe retention keep deleted data for a window, which matters for deletion compliance.',
    'Cross-region joins are not allowed. Datasets and the data they join must be co-located.'
  ],
  ml: [
    'Feature engineering in SQL, with the output feeding [[ap-feature-store]] or training directly.',
    'Eval datasets and prompt-response logs stored as tables, queried to find regressions.',
    'Agent data access: natural-language-to-SQL with governed context from [[knowledge-catalog]].'
  ],
  pairs: ['bigquery-ai', 'dataflow', 'knowledge-catalog', 'ap-feature-store', 'gcs', 'spark', 'agent-protocols'],
  cost: 'Storage is billed per GB (cheaper for long-term unmodified data). Compute is either on-demand per TiB scanned or capacity-based slots in editions with autoscaling. Pick the model by predictability of workload, and cap bytes billed per query for safety.'
});

S({
  id: 'bigquery-ai', cat: 'analytics', name: 'BigQuery ML & AI functions', doc: 'bigquery/docs/bqml-introduction',
  tag: 'Train models, create embeddings, search vectors and call Gemini from SQL.',
  what: 'BigQuery ML trains and runs models with SQL statements: linear and tree models, matrix factorisation for recommendations, forecasting, and imported or remote models. For generative AI, **remote models** point at Gemini or an embedding model on the Agent Platform, so `ML.GENERATE_EMBEDDING` and the `AI.*` generation functions run inline over table rows. `CREATE VECTOR INDEX` and `VECTOR_SEARCH` provide similarity search, and object tables or `ObjectRef` let you process images, PDFs and audio next to structured data.\n\nIt shortens the path from data to a first model, and gives analysts a way to apply LLMs to millions of rows without moving the data.',
  flow: ['Table or object data', 'Remote model / ML model', 'Run function', 'Batch calls', 'Write results', 'Vector index'],
  steps: [
    [0, 'Rows (and optionally unstructured files via object tables) are the input, already in [[bigquery]].'],
    [1, 'You define a model: a native one trained in SQL, or a remote model that wraps a [[gemini]] or embedding endpoint through a connection.'],
    [2, 'A SQL function (`ML.PREDICT`, `ML.GENERATE_EMBEDDING`, `AI.GENERATE`) is applied to the rows.'],
    [3, 'BigQuery batches requests to the model, handling parallelism and retries within quota.'],
    [4, 'Outputs are written to a new table, with the source row keys for traceability.'],
    [5, 'Embeddings are indexed with `CREATE VECTOR INDEX` and queried with `VECTOR_SEARCH`.']
  ],
  gotchas: [
    '**Model calls cost money per row.** A careless `AI.GENERATE` over a billion-row table is a large bill. Test on a sample, and set limits.',
    '**Quota on the remote model limits throughput.** A big job can run for hours if the underlying endpoint has low quota ([[quotas]]).',
    '**Non-determinism.** Generated text changes between runs. Store outputs with the model version and prompt used.',
    'The vector index is approximate, so check recall on your data.'
  ],
  edges: [
    'The connection service account needs permission on the model endpoint. Missing permission fails with a generic error.',
    'Row-by-row LLM calls ignore context between rows. For summarisation across rows, aggregate first.',
    'Embedding model changes require rebuilding the index.'
  ],
  ml: [
    'Batch classification, extraction and summarisation over warehouse tables without a separate pipeline.',
    'First-pass recommenders (matrix factorisation) and forecasts by analysts, before investing in a custom model.',
    'A simple RAG tier for analytical data: embed, index, search, all in SQL.'
  ],
  pairs: ['bigquery', 'gemini', 'ap-feature-store', 'vector-search', 'quotas'],
  cost: 'Model training and queries are billed through BigQuery compute; remote model calls are billed by the Gemini or embedding service per token or per call, on top. Estimate row count times tokens per row before running.'
});

S({
  id: 'dataflow', cat: 'analytics', name: 'Dataflow', doc: 'dataflow/docs',
  tag: 'Managed Apache Beam for batch and streaming pipelines, including model inference.',
  what: 'Dataflow runs Apache Beam pipelines on a managed, autoscaling worker fleet. One programming model covers batch and streaming, with windowing, event-time handling and exactly-once processing semantics for supported sources and sinks. Streaming Engine and Shuffle move state off the workers, so scaling is smoother.\n\nFor ML it offers Beam transforms such as `RunInference` (batch model calls on CPUs or GPUs inside the pipeline) and `MLTransform` (embeddings and data preprocessing), and it is the usual way to turn event streams into features and vectors.',
  flow: ['Source', 'Read + window', 'Transform', 'RunInference', 'Sink', 'Autoscale'],
  steps: [
    [0, 'A pipeline reads from [[pubsub]], [[gcs]], [[bigquery]] or a Kafka topic ([[managed-kafka]]).'],
    [1, 'Elements are assigned to event-time windows, with watermarks tracking how late data may arrive.'],
    [2, 'Transforms clean, join and aggregate, shuffling data by key through the service.'],
    [3, 'A `RunInference` step batches elements and calls a model, local or remote, to embed or score them.'],
    [4, 'Results are written to [[bigquery]], [[bigtable]], [[vector-search]] or another sink.'],
    [5, 'The service adds or removes workers based on backlog and throughput.']
  ],
  gotchas: [
    '**Late and out-of-order data is the hard part.** Pick windows, triggers and allowed lateness deliberately, or results will be wrong in subtle ways.',
    '**Hot keys stall a pipeline.** One key with most of the data pins one worker. Use combiners or key salting.',
    '**Model loading per bundle is wasteful.** Share the model across elements, and size batches for the accelerator.',
    '**Streaming jobs run until stopped,** so a forgotten job is a continuing bill.'
  ],
  edges: [
    'Updating a streaming pipeline in place is limited. Compatible changes can update, others need drain and replace.',
    'Exactly-once is end to end only if the sink is idempotent or supports it.',
    'Worker quotas, IP address quotas and subnet size can cap autoscaling.'
  ],
  ml: [
    'Real-time feature pipelines from event streams into [[bigtable]] or [[ap-feature-store]].',
    'Continuous embedding of new documents into [[vector-search]].',
    'Large-scale offline preprocessing and inference over files in [[gcs]].'
  ],
  pairs: ['pubsub', 'bigquery', 'bigtable', 'gcs', 'ap-feature-store', 'vector-search'],
  cost: 'Billed for worker vCPU, memory, storage and any GPUs by the second, plus Streaming Engine or Shuffle data processed. Autoscaling bounds and batch flexible scheduling (FlexRS) are the main cost controls.'
});

S({
  id: 'spark', cat: 'analytics', name: 'Apache Spark (Managed Service / Serverless)', doc: 'dataproc/docs',
  tag: 'Spark and the Hadoop ecosystem as a managed service, formerly Dataproc, with a serverless option.',
  what: 'Google Cloud runs Apache Spark in two forms: clusters you size (the product long called Dataproc, now presented as the Managed Service for Apache Spark) and **serverless Spark** batches and sessions where you submit code and Google provisions executors. Both read open formats from [[gcs]] and tables in [[bigquery]], and notebook sessions support interactive work.\n\nChoose it when the work is already Spark (or you need libraries that are), for large joins and feature engineering on data lake files, and when you want to reuse an existing code base. For new SQL-shaped work, [[bigquery]] is often simpler.',
  flow: ['Submit job', 'Provision executors', 'Read lake data', 'Shuffle + compute', 'Write output', 'Release'],
  steps: [
    [0, 'You submit a PySpark or Scala job (or open a notebook session) to a cluster or to serverless Spark.'],
    [1, 'Serverless Spark allocates executors on demand; a cluster uses nodes you configured, optionally autoscaled.'],
    [2, 'Executors read Parquet or Iceberg files from [[gcs]], or tables through the BigQuery connector.'],
    [3, 'Spark stages run in parallel with shuffles between them.'],
    [4, 'Output is written to storage or BigQuery.'],
    [5, 'Serverless resources are released at the end; clusters can auto-delete when idle.']
  ],
  gotchas: [
    '**Small files and skewed partitions** are the usual cause of slow Spark jobs. Compact files and watch for hot keys.',
    '**Cluster idle time is billed.** Use autoscaling and idle-delete, or use serverless.',
    '**Library version drift:** a notebook that worked yesterday can break when the image version changes. Pin versions.'
  ],
  edges: [
    'Serverless has default per-batch resource limits and a startup delay measured in tens of seconds, which hurts very short jobs.',
    'Writing directly to a table that readers are using needs a transactional table format such as Iceberg.',
    'Network and subnet setup for private clusters takes planning ([[vpc]]).'
  ],
  ml: [
    'Distributed feature engineering and data cleaning on lake data before training.',
    'Running existing Spark ML or deduplication jobs for training corpora.',
    'Large-scale text pre-processing and tokenisation.'
  ],
  pairs: ['bigquery', 'gcs', 'dataflow', 'knowledge-catalog', 'workflows'],
  cost: 'Clusters bill VM and a small per-vCPU management fee; serverless bills by resource-seconds used by the batch. Spot VMs for secondary workers lower cluster cost.'
});

S({
  id: 'knowledge-catalog', cat: 'analytics', name: 'Knowledge Catalog (formerly Dataplex)', doc: 'dataplex/docs',
  tag: 'A catalog and governance layer that also supplies business context to agents.',
  what: 'Knowledge Catalog, which evolved from the Dataplex Universal Catalog, collects technical metadata from BigQuery, AlloyDB, Spanner, Cloud SQL and other sources, and adds **business meaning**: glossary terms, descriptions, relationships and quality rules, inferred and enriched with AI. It supports data lineage, data quality scans, profiling and policy tags that feed access control.\n\nThe agent angle is the new part: it exposes this context to agents (for text-to-SQL and research agents) so they use the right table and definition instead of guessing from column names. Much of the enrichment is in preview and changes quickly, so check status before relying on a specific feature.',
  flow: ['Sources', 'Harvest metadata', 'Enrich + classify', 'Policies + quality', 'Search / context API', 'Agent or analyst'],
  steps: [
    [0, 'Sources such as [[bigquery]], [[alloydb]], [[spanner]] and [[gcs]] register their assets automatically or by scan.'],
    [1, 'Technical metadata (schemas, owners, lineage) is harvested into the catalog.'],
    [2, 'AI-assisted enrichment proposes descriptions, glossary links and business definitions, which a steward reviews.'],
    [3, 'Quality rules and policy tags are attached, and scans publish pass or fail results.'],
    [4, 'Users and tools search the catalog, or an agent asks for context about a dataset through an API.'],
    [5, 'The consumer works with a governed, documented dataset and its lineage.']
  ],
  gotchas: [
    '**A catalog is only as good as its stewardship.** AI-suggested descriptions still need human review, or wrong definitions get amplified to agents.',
    '**Policy tags enforce access only where services honour them.** Verify the downstream engine respects the tag.',
    '**Preview features carry no guarantee** on behaviour or pricing. Keep them off critical paths until GA.'
  ],
  edges: [
    'Metadata harvest has latency, so a table created five minutes ago may not appear yet.',
    'Cross-project and cross-organisation catalogs need explicit permission and a decision on who owns the glossary.',
    'Lineage coverage is partial for jobs that do not emit events.'
  ],
  ml: [
    'Giving text-to-SQL agents the right definitions, which is the main lever for query accuracy.',
    'Tracking which datasets fed which model, for audits ([[ap-pipelines]] lineage).',
    'Data quality gates before training or indexing, plus sensitive-data tagging with [[sdp]].'
  ],
  pairs: ['bigquery', 'sdp', 'ap-feature-store', 'alloydb', 'agent-protocols'],
  cost: 'Metadata storage, scans and processing are billed at usage-based rates; some enrichment features are preview with separate or no pricing. Quality and profiling scans cost money in proportion to data scanned.'
});
