/* Databases & Vector Stores */
S({
  id: 'alloydb', cat: 'databases', name: 'AlloyDB for PostgreSQL', doc: 'alloydb/docs',
  tag: 'Postgres-compatible database with built-in vector search, AI functions and an analytics engine.',
  what: 'AlloyDB is a PostgreSQL-compatible database with a disaggregated storage layer, read pools for scale-out reads, and a **columnar engine** that speeds analytical queries on live data. For AI it adds three things: the `pgvector` extension with Google\'s **ScaNN** index for fast approximate nearest-neighbour search (tuned for very large vector counts), **AI functions** that call Gemini and embedding models from SQL, and managed tools that let agents query the database through an MCP server.\n\nThat makes it a strong default when your operational data already lives in Postgres: vectors, metadata filters and joins sit in one transactional store.',
  flow: ['App / agent query', 'Primary or read pool', 'Filter + join', 'ScaNN vector index', 'Rank + return', 'Optional AI function'],
  steps: [
    [0, 'An application, or an agent through a managed MCP tool, sends SQL to AlloyDB over a private connection ([[psc|Private Service Connect]] or VPC).'],
    [1, 'Reads go to a **read pool** instance for scale; writes go to the primary.'],
    [2, 'The planner applies relational filters (tenant, status, permissions) alongside the vector search, so access control is enforced in SQL.'],
    [3, 'A ScaNN or HNSW index finds approximate nearest neighbours of the query embedding.'],
    [4, 'Candidates are re-ranked or joined with business tables and returned.'],
    [5, 'Where useful, an AI function calls [[gemini]] from inside the query, for example to generate an embedding or classify a row.']
  ],
  gotchas: [
    '**Approximate indexes trade recall for speed.** Measure recall against exact search on your own data, and re-measure after the dataset grows or the model changes.',
    '**Filtered vector search needs care.** A very selective filter can leave the index with too few matches, so test the combination you actually run.',
    '**Changing the embedding model means re-embedding everything.** Keep the model name and version in a column so you can run two indexes during a migration.',
    '**Index builds on large tables take time and memory.** Plan them off-peak.'
  ],
  edges: [
    'Read pools replicate asynchronously, so a just-written row may not be visible on a read replica for a moment.',
    'Calling a model from SQL adds network latency and model cost to a query. Do it in batch jobs, not on hot paths.',
    'Vector indexes are per column. Multi-vector designs (several embeddings per row) multiply storage and build time.'
  ],
  ml: [
    'Vector store for RAG when the source data is already relational, with tenant filters done in SQL.',
    'Agent tool backend: managed, remote MCP access with IAM and VPC controls ([[agent-protocols]]).',
    'Low-latency feature and profile lookups beside the vectors, joined in one query.'
  ],
  pairs: ['cloud-sql', 'spanner', 'vector-search', 'bigquery', 'gemini', 'psc'],
  cost: 'Billed for provisioned vCPU and memory of primary and read pool instances, storage and backups, and network. Vector indexes add memory pressure, which may push you to a larger instance.'
});

S({
  id: 'cloud-sql', cat: 'databases', name: 'Cloud SQL', doc: 'sql/docs',
  tag: 'Managed PostgreSQL, MySQL and SQL Server, with pgvector for small to mid-size vector search.',
  what: 'Cloud SQL runs standard PostgreSQL, MySQL or SQL Server with managed backups, patching, high availability and read replicas. For AI the relevant piece is **pgvector** on PostgreSQL (and vector support in newer MySQL versions), which turns an existing application database into a vector store without adding a new system.\n\nIt is the simple answer for pilots and mid-scale products: familiar tools, familiar ops, and enough vector performance for hundreds of thousands to a few million embeddings. When you outgrow it, [[alloydb]] is the natural next step.',
  flow: ['App query', 'Primary instance', 'Vector index', 'Filter + join', 'Return rows', 'Replica / backup'],
  steps: [
    [0, 'The application connects through the Cloud SQL connector or a private IP and sends SQL.'],
    [1, 'The primary instance executes it. Reads can be offloaded to read replicas.'],
    [2, 'A pgvector `hnsw` or `ivfflat` index finds nearest neighbours of the query embedding.'],
    [3, 'Standard `WHERE` clauses and joins apply tenant and permission rules.'],
    [4, 'Rows come back with distances for the application to rank or pass to a model.'],
    [5, 'High availability fails over to a standby, and automated backups provide point-in-time recovery.']
  ],
  gotchas: [
    '**One primary is a ceiling.** Vector queries compete with transactional load for CPU and memory, so a busy app can slow retrieval and the reverse.',
    '**HNSW indexes live in memory-hungry structures.** If the index does not fit in the buffer cache, latency collapses.',
    '**Version and extension support differ by engine version.** Confirm the pgvector version you need is available.'
  ],
  edges: [
    'Maintenance windows cause brief restarts even with high availability. Schedule them away from peak.',
    'Connection counts are limited. Use a pooler for serverless callers such as [[cloud-run]].',
    'Cross-region replicas help read latency and disaster recovery but add lag and cost.'
  ],
  ml: [
    'Vector store for a first RAG pilot with the data already in Postgres.',
    'Durable chat history, evaluation results and prompt versions for an AI app.',
    'Backing store for a tool server that agents call.'
  ],
  pairs: ['alloydb', 'spanner', 'cloud-run', 'vector-search', 'firestore'],
  cost: 'Billed for instance vCPU and memory, storage, backups, and network. High availability roughly doubles the instance cost. Read replicas are billed as full instances.'
});

S({
  id: 'spanner', cat: 'databases', name: 'Spanner', doc: 'spanner/docs',
  tag: 'Globally consistent relational database with vector search and graph queries.',
  what: 'Spanner is a horizontally scalable relational database that keeps strong consistency across regions, with SQL, transactions and a very high availability target for multi-region configurations. It now also offers built-in **vector search** (exact and approximate), **graph** queries over the same tables, and a columnar engine for analytical queries on live data. A downloadable edition, Spanner Omni, extends it to other clouds and on-premises.\n\nFor AI it suits systems where a single global source of truth must serve agents and applications at once: orders, entitlements, inventory, ledgers, plus embeddings that must stay transactionally consistent with the rows they describe.',
  flow: ['Client query', 'Split + leader', 'Transaction / read', 'Vector or graph query', 'Replicate', 'Result'],
  steps: [
    [0, 'A client sends SQL through a session; Spanner routes it by key range to the right **split**.'],
    [1, 'Each split has a leader replica that coordinates writes using Paxos across zones or regions.'],
    [2, 'Reads can be strong (latest) or stale (cheaper, a few seconds old), chosen per query.'],
    [3, 'A vector search or graph pattern query runs inside the database, joined with relational data.'],
    [4, 'Committed writes replicate to a quorum before acknowledgement, so no committed data is lost on a zone failure.'],
    [5, 'Rows return to the client or to an agent tool.']
  ],
  gotchas: [
    '**Schema and key design decide performance.** Monotonically increasing keys (timestamps, sequences) create hot spots. Use hashed or UUID-style keys.',
    '**Capacity is provisioned** in processing units or autoscaled between bounds. Forgetting to size for peak causes latency, not errors.',
    '**Multi-region writes pay for consistency.** Commit latency includes cross-region round trips, so put the leader near the writers.',
    'Vector search quality and limits differ by mode (exact versus approximate). Test on your data.'
  ],
  edges: [
    'Stale reads are cheap and fast but can return data a few seconds old. Do not use them for authorisation checks.',
    'Interleaved tables and foreign keys behave differently from a single-node Postgres, so migrations need review.',
    'Large analytical scans on the same instance compete with transactions unless you use the columnar engine or a data boost style offload.'
  ],
  ml: [
    'A globally consistent store for agent-relevant business state (orders, accounts, entitlements) behind managed MCP tools.',
    'Embeddings stored with the rows they describe, so deletes and updates are transactional ([[vector-search]] for the dedicated option).',
    'Graph queries for knowledge-graph style retrieval over relationships.'
  ],
  pairs: ['alloydb', 'bigquery', 'bigtable', 'firestore', 'vector-search', 'agent-protocols'],
  cost: 'Billed for compute capacity (processing units or nodes, or autoscaled), stored data, backups and network egress. It is priced as a premium, always-on service, so it earns its cost when you need global consistency, not for a small single-region app.'
});


S({
  id: 'spanner-graph', cat: 'databases', name: 'Spanner Graph', doc: 'spanner/docs/graph/overview',
  tag: 'Property-graph queries (GQL) over Spanner tables, with vector and full-text search for GraphRAG.',
  what: 'Spanner Graph adds a **property graph** to Spanner. You keep entities and relationships in ordinary tables, declare a graph schema that maps them to nodes and edges, and query them with **GQL** (the ISO graph query language), alone or combined with SQL in one statement. Built-in vector search and full-text search sit on the same data, so one query can find nodes by meaning or by keyword and then traverse the relationships around them.\n\nFor AI it is the storage layer of a **GraphRAG** system: instead of retrieving isolated text chunks, you retrieve a node and the connected context around it (the supplier of this part, the contracts that mention that supplier, the incidents tied to both). It inherits Spanner\'s consistency, IAM integration, CMEK, VPC Service Controls and audit logging, so it suits governed enterprise knowledge.',
  flow: ['Source documents', 'Extract entities + relations', 'Graph tables + schema', 'Vector / keyword match', 'GQL traversal', 'Ranked graph context'],
  steps: [
    [0, 'Documents arrive in [[gcs]]. An event triggers processing, and text is split into segments (a layout-aware parser such as [[document-ai]] helps for PDFs and tables).'],
    [1, 'A model ([[gemini]]) extracts entities and relationships from each segment, producing candidate nodes and edges.'],
    [2, 'Nodes and edges are written to Spanner tables; a declarative graph schema maps those tables to a property graph. Embeddings are stored beside the nodes.'],
    [3, 'At question time the query is embedded and matched to relevant nodes by vector search, optionally mixed with full-text search for exact terms.'],
    [4, 'A GQL query traverses from those starting nodes to related nodes and edges, combined with SQL for filters such as tenant or date.'],
    [5, 'The retrieved nodes and edges are ranked against the question and passed to the model as grounded context, with the source segments as citations.']
  ],
  gotchas: [
    '**Extraction errors become graph errors.** An LLM-built graph contains duplicates, wrong relations and missed links. Budget for entity resolution (merging "IBM" and "International Business Machines") and for sampling the graph by hand.',
    '**Multi-hop traversal can fan out.** Two or three hops across a dense node can return thousands of rows. Limit depth and result size, and rank before you build the prompt.',
    '**The graph goes stale quietly.** A changed source document must update or delete its nodes and edges, or answers cite relationships that no longer exist.',
    '**It is not a free upgrade over vector RAG.** Graph building costs model calls and engineering time. Use it when the questions are about relationships and aggregations, not when a single passage holds the answer.'
  ],
  edges: [
    'Graph and relational views of the same tables stay consistent, which avoids dangling edges but also means schema changes are database schema changes.',
    'Row-level or tenant isolation still has to be designed: filter on a tenant column in every traversal, and test with users from different groups.',
    'Spanner is provisioned capacity. Size compute for the traversal load, not only for storage.'
  ],
  ml: [
    'GraphRAG for questions that span documents: dependencies, ownership, exposure, "which of our contracts mention this supplier".',
    'Recommendations and fraud or risk networks where relationships are the signal.',
    'A knowledge graph that an agent queries as a tool, next to vector retrieval ([[agent-runtime]]).'
  ],
  pairs: ['spanner', 'vector-search', 'agent-retrieval', 'rag-engine', 'document-ai', 'gemini', 'agent-runtime', 'gcs'],
  cost: 'Billed as Spanner: provisioned compute (nodes or processing units), storage and network. Graph building adds model calls for extraction and embeddings per document, and refreshes repeat that cost. Measure extraction cost per thousand documents before committing.'
});

S({
  id: 'firestore', cat: 'databases', name: 'Firestore', doc: 'firestore/docs',
  tag: 'Serverless document database with real-time sync and built-in vector search.',
  what: 'Firestore stores JSON-like documents in collections, scales automatically, and supports real-time listeners that push changes to clients. It has a native **vector field type with KNN search**, and an edition with MongoDB-compatible APIs. There are no servers or capacity to manage.\n\nIt is a good fit for session state, chat transcripts, user profiles and light retrieval where the data is document-shaped and the access pattern is key or simple-filter lookup.',
  flow: ['Client write', 'Document + index', 'Real-time listener', 'Vector query', 'Agent state read', 'Result'],
  steps: [
    [0, 'An app or agent writes a document, for example a conversation turn with an embedding field.'],
    [1, 'Firestore stores it and updates its automatic indexes.'],
    [2, 'Listeners (a UI or a worker) receive the change in real time.'],
    [3, 'A vector query finds the nearest documents to a query embedding, combined with simple filters.'],
    [4, 'The agent reads the session document at the start of each turn to restore context.'],
    [5, 'The response, and any new state, are written back.']
  ],
  gotchas: [
    '**Queries must be backed by an index.** Complex filters need composite indexes you declare, and missing ones fail at runtime.',
    '**A single document is capped in size and has a sustained write rate limit.** Do not put an entire long conversation in one document.',
    '**Vector search here is for modest scale.** For tens of millions of vectors use a dedicated option ([[vector-search]] or [[alloydb]]).',
    'Reads and writes are billed per operation, so a chatty loop can cost more than expected.'
  ],
  edges: [
    'Hot documents (a counter updated by everything) throttle. Shard counters.',
    'Security rules protect client access, but server code uses IAM and bypasses them. Know which path you are on.',
    'Real-time listeners keep connections open and are billed per document change delivered.'
  ],
  ml: [
    'Session and conversation state for agents when [[agent-memory]] is more than you need.',
    'Small RAG corpora (FAQs, product help) with vectors beside the content.',
    'Feature flags and per-user settings read at request time.'
  ],
  pairs: ['cloud-run', 'agent-memory', 'alloydb', 'memorystore', 'identity-platform'],
  cost: 'Billed per document read, write and delete, plus stored data and network. There is a free daily quota. Cost tracks operations, so design queries to read few documents.'
});

S({
  id: 'bigtable', cat: 'databases', name: 'Bigtable', doc: 'bigtable/docs',
  tag: 'Wide-column database for very high throughput at single-digit-millisecond latency.',
  what: 'Bigtable stores sparse tables indexed by a single **row key**, scales by adding nodes, and serves millions of reads and writes per second with low latency. It is the backbone of many Google products and suits time series, event logs, profiles and **online feature serving** at large scale. It also supports ingesting and querying vector embeddings for semantic search workloads.\n\nThe trade-off is a limited query model: lookups and scans by row key range, with design effort needed up front so the key matches how you read.',
  flow: ['Write event', 'Row key routing', 'Tablet server', 'Memtable + SSTables', 'Read by key / range', 'Serve features'],
  steps: [
    [0, 'A streaming pipeline ([[dataflow]]) or service writes a row keyed by entity and time.'],
    [1, 'The row key determines which **tablet** (a contiguous key range) owns it.'],
    [2, 'A tablet server handles the mutation, writing to a log and an in-memory table.'],
    [3, 'Data is flushed to immutable files on Colossus, Google\'s distributed file system, and compacted over time.'],
    [4, 'A read by key, or a short range scan, returns the latest cell versions.'],
    [5, 'The model-serving layer uses the values as features, or a retrieval layer uses stored vectors.']
  ],
  gotchas: [
    '**The row key is your only index.** A poor key causes hot tablets. Avoid starting keys with timestamps; prefix with an entity id or a hash.',
    '**Nodes are provisioned.** Autoscaling helps, but traffic spikes can outrun it.',
    '**There is no multi-row transaction or secondary index.** If you need those, another database fits better.'
  ],
  edges: [
    'Replication across clusters is eventually consistent unless you route a key range to one cluster.',
    'Garbage collection rules decide when old cell versions disappear. Set them, or storage grows.',
    'Large cells and very wide rows hurt performance. Keep rows modest.'
  ],
  ml: [
    'Low-latency online feature store for ranking and fraud models, populated by streaming pipelines ([[ap-feature-store]]).',
    'Per-user event history for real-time personalisation.',
    'Time-series telemetry from model servers.'
  ],
  pairs: ['dataflow', 'ap-feature-store', 'bigquery', 'spanner', 'pubsub'],
  cost: 'Billed for provisioned or autoscaled node capacity, stored data, and network. Cost is driven by throughput, so a small hot table can need more nodes than a large cold one.'
});

S({
  id: 'memorystore', cat: 'databases', name: 'Memorystore', doc: 'memorystore/docs',
  tag: 'Managed Redis, Valkey and Memcached for caches, counters and semantic caching.',
  what: 'Memorystore runs in-memory stores (Redis, Valkey, Memcached) with managed replication, failover and patching. For AI systems it plays the supporting roles: a **response or semantic cache** that skips the model on repeated questions, **rate-limit counters** per user or tenant, short-lived session state, and, on the Redis and Valkey engines, vector search for small hot indexes.\n\nCaching is one of the cheapest ways to cut model cost and latency, but only when cache keys and staleness rules are designed deliberately.',
  flow: ['Request', 'Cache lookup', 'Hit: return', 'Miss: call model', 'Store result', 'TTL expiry'],
  steps: [
    [0, 'The application builds a cache key from the normalised prompt, or embeds the question for a semantic match.'],
    [1, 'It looks up the key (or nearest embedding) in Memorystore.'],
    [2, 'On a hit above the similarity threshold it returns the stored answer without calling the model.'],
    [3, 'On a miss it calls [[gemini]] and gets a fresh answer.'],
    [4, 'The answer is stored with metadata (tenant, model version, source versions).'],
    [5, 'A TTL, or invalidation when sources change, removes stale entries.']
  ],
  gotchas: [
    '**A semantic cache can return a wrong answer confidently.** Similar questions are not always the same question. Test thresholds on real traffic and keep tenant ids in the key.',
    '**Memory is the capacity.** Eviction policy decides what disappears under pressure, and it may be your rate-limit counters.',
    '**Cached answers outlive model and document changes** unless you version the key.'
  ],
  edges: [
    'Failover causes a brief interruption. Clients need retry and reconnect logic.',
    'Cache stampedes: many requests for the same missing key all call the model at once. Use request coalescing.',
    'Data is in memory, so treat it as a cache, not a system of record.'
  ],
  ml: [
    'Semantic cache in front of [[gemini]] to cut repeat-question cost.',
    'Token-bucket rate limiting per user, to protect spend alongside [[apigee]].',
    'Short-term working memory for agents between turns.'
  ],
  pairs: ['gemini', 'cloud-run', 'apigee', 'firestore', 'vector-search'],
  cost: 'Billed per GB-hour of provisioned capacity by tier (with replicas billed as extra capacity), plus network. Size for the working set, not the whole dataset.'
});

S({
  id: 'vector-search', cat: 'databases', name: 'Vector Search', doc: 'vertex-ai/docs/vector-search/overview',
  tag: 'Google purpose-built, managed vector index using the ScaNN algorithm, with hybrid search.',
  what: 'Vector Search (the managed service formerly called Vertex AI Vector Search, and before that Matching Engine) stores embeddings and returns approximate nearest neighbours at very large scale and low latency, built on Google\'s **ScaNN** algorithm. It supports metadata filtering, and **hybrid search** that combines dense vectors with keyword or sparse signals. It is an index-as-a-service: you bring the embeddings, deploy an index, and keep metadata elsewhere (the platform Feature Store, or your own database).\n\nUse it when you need a dedicated, high-scale ANN tier that is separate from your databases and you want control of embedding and ranking. The newer collection-based product that stores the data objects, generates embeddings and does hybrid search for you is a different product with its own API: [[agent-retrieval|Agent Retrieval]] (formerly Vector Search 2.0). Vector Search is also one of the backends that [[rag-engine]] can use.',
  flow: ['Documents + embeddings', 'Index build', 'Deploy index', 'Query embedding', 'ANN + filter', 'Top-k results'],
  steps: [
    [0, 'Text is chunked and embedded by a model such as a Gemini embedding model ([[gemini]]); vectors and metadata are written to storage or streamed in.'],
    [1, 'The service builds a tree-and-quantisation ScaNN index, with shards sized to your data.'],
    [2, 'The index is deployed to an endpoint with a chosen machine size and replica count.'],
    [3, 'At query time the question is embedded with the **same model** and sent to the endpoint.'],
    [4, 'The index finds nearest neighbours, applies metadata restrictions, and merges sparse results if hybrid search is on.'],
    [5, 'Top-k IDs, distances and metadata return to the application, which fetches full text and builds the prompt.']
  ],
  gotchas: [
    '**Index and query must use the same embedding model.** Mixing them silently returns nonsense neighbours.',
    '**Deployed indexes are billed while deployed.** An unused endpoint still costs money.',
    '**Streaming updates are not instantly searchable in every mode.** Check freshness guarantees for your configuration.',
    'Filtering interacts with approximate search. Highly selective filters can reduce recall, so measure.'
  ],
  edges: [
    'A hard delete for compliance needs the index to remove the vector, and any copies in storage and caches too.',
    'Re-indexing after changing chunking or embedding model is a full rebuild. Build a new index and switch traffic.',
    'Private endpoints need Private Service Connect or VPC peering configured ([[psc]]).'
  ],
  ml: [
    'Dedicated retrieval tier for large RAG systems with strict latency and high query volume.',
    'Recommendation candidate generation with two-tower models ([[ap-training]]).',
    'Semantic search over images or products using multimodal embeddings.'
  ],
  pairs: ['agent-retrieval', 'rag-engine', 'ai-search', 'alloydb', 'gemini', 'psc', 'gcs'],
  cost: 'Billed for index storage and build, and for the machines serving each deployed index (per node-hour), plus streaming updates. The serving nodes dominate, so right-size replicas and undeploy unused indexes.'
});

S({
  id: 'agent-retrieval', cat: 'databases', name: 'Agent Retrieval', doc: 'gemini-enterprise-agent-platform/build/vector-search-2/overview',
  tag: 'Self-tuning managed retrieval engine that stores your data objects, embeds them and runs hybrid search.',
  what: 'Agent Retrieval (formerly Vector Search 2.0) is a different product from [[vector-search]], not just a newer version of the same index. Vector Search is an approximate-nearest-neighbour **index service**: you create embeddings yourself, deploy an index, and keep your metadata somewhere else. Agent Retrieval is a **storage and retrieval system**: you create a **collection** of JSON **data objects**, and it stores them in a replicated storage engine, can generate the embeddings for you, and serves semantic, keyword and hybrid search from one place.\n\nSearch results from different methods are fused (reciprocal rank fusion) and can be reranked server-side with a semantic ranker. A remote **MCP server** exposes collection inspection and search tools, so an agent can query it directly. [[rag-engine]] can also use it as a managed backend.',
  flow: ['Define collection', 'Write data objects', 'Auto-embed + index', 'Query (semantic, keyword, hybrid)', 'Fuse + rerank', 'Results to app or agent'],
  steps: [
    [0, 'You create a collection and define its schema: the JSON fields, which fields are vectors, and which embedding model (if any) should generate them.'],
    [1, 'Data objects are written individually or in batch. Each one is validated against the schema before it is stored.'],
    [2, 'If auto-embedding is configured, the service calls the embedding model for you and builds and tunes the index on its own, so there is no separate index to deploy.'],
    [3, 'A query arrives as a vector you supply, as text to embed, as keywords, or as a hybrid of these, with filters on the stored fields.'],
    [4, 'Candidate results from each method are merged by rank fusion, and an optional semantic ranker rescores the merged list against the natural-language query.'],
    [5, 'Top results come back with their stored fields, so the application or agent does not need a second lookup. Agents can call the same search through the remote MCP server.']
  ],
  gotchas: [
    '**It is a separate product with its own API.** Collections and data objects replace indexes and endpoints. Treat a move from Vector Search as a migration project and read the current migration guidance first.',
    '**Check the launch stage before you commit.** Google\'s docs present it as a product under the Agent Platform, but launch stages of individual features differ. Confirm in the release notes for the feature you need.',
    '**Embedding choice is still a long-term decision.** Query and stored vectors must come from the same model. Plan for a re-embed if you change it.',
    '**Reranking adds a step.** It improves the top results but adds a model call to every query, in latency and, depending on the pricing mode, cost.',
    '**Permissions are your job.** Stored fields can carry tenant or ACL values, but every query must filter on them. Test with users from different groups.'
  ],
  edges: [
    'For vector fields without an embedding configuration, the client must supply the query vector.',
    'Because the data lives in the collection, it removes the need for a separate store for metadata, but it also becomes a system of record for those fields. Decide who owns deletes and retention.',
    'Pricing has two modes (usage-based for smaller workloads, resource-based for tuned performance). Model both against your traffic.'
  ],
  ml: [
    'The retrieval tier for agentic RAG when you want hybrid search, rerank and metadata in one service ([[adk]]).',
    'A managed backend for [[rag-engine]] when you do not want to run a separate vector index.',
    'Agent-facing knowledge access through the remote MCP server, governed like any other tool ([[agent-governance]]).'
  ],
  pairs: ['vector-search', 'rag-engine', 'ai-search', 'spanner-graph', 'alloydb', 'gemini', 'agent-protocols', 'agent-governance'],
  cost: 'Adaptable pricing: usage-based for smaller workloads or resource-based for tuned performance. Add the embedding calls (at write and at query time) and reranking. Compare both modes on your own query volume and data size.'
});
