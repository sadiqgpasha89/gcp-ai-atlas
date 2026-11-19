/* More advanced architectures: GraphRAG and agent CI/CD. Same schema as arch-agentic.js. */
window.ATLAS.architectures.push(
{
  id: 'graphrag', name: 'GraphRAG with Spanner Graph',
  short: 'Retrieval that follows relationships: a knowledge graph plus vector and keyword search, for questions that span documents and entities.',
  when: 'Answers depend on how things connect (who owns what, which system depends on which, which contract covers which supplier) and plain chunk retrieval keeps returning related fragments but not the connection. If questions are mostly "find the passage that says X", stay with vector or hybrid retrieval ([[d:retrieval-strategy|retrieval strategy]]).',
  flow: [
    { l: 'Source files', s: 'gcs' },
    { l: 'Extract entities + relations', s: 'gemini' },
    { l: 'Resolve + load graph', s: 'spanner-graph' },
    { l: 'Chunk + embed', s: 'spanner-graph' },
    { l: 'Hybrid retrieve + traverse', s: 'spanner-graph' },
    { l: 'Assemble context + answer', s: 'gemini' },
    { l: 'Update + reconcile', s: 'pubsub' }
  ],
  steps: [
    [0, 'Files land in [[gcs|Cloud Storage]] (or arrive from a connector). A change event on [[pubsub|Pub/Sub]] starts processing, so the graph does not depend on a nightly batch.'],
    [1, 'A processing function (on [[cloud-run|Cloud Run]]) sends each document to [[gemini|Gemini]] with a **fixed schema**: allowed node types, edge types and properties. The model returns entities and relationships as structured output. Constraining the schema is what keeps the graph queryable.'],
    [2, '**Entity resolution** merges "Acme Corp", "ACME Corporation" and "acme" into one node, using normalisation rules, identifiers and, for ambiguous cases, a model plus a review queue. The nodes and edges are written to [[spanner-graph|Spanner Graph]] together with the source document id and the ACL of that document.'],
    [3, 'The same documents are split into chunks (with layout-aware parsing for tables and headings, see [[document-ai|Document AI]]), embedded, and stored with their links to the graph nodes they mention. Vectors and graph live in one database, so one transaction updates both.'],
    [4, 'At query time the system embeds the question and uses **vector plus full-text search** (reciprocal rank fusion) to find **entry nodes and chunks**. It then **traverses** a few hops with a graph query to collect related entities, relationships and the chunks that support them. Permission filters apply before and after traversal.'],
    [5, 'The retrieved subgraph and chunks are assembled into a compact context: the entities, how they connect, and the supporting text with citations. Gemini answers from that context and a validator checks that each claim has a source ([[a:agentic-rag|agentic RAG]] describes the verification step).'],
    [6, 'Updates and deletes flow in as events. A scheduled **reconciliation** compares the source system with the graph, removes orphaned nodes and edges, and re-resolves entities that changed. Without it the graph drifts from the truth.']
  ],
  why: [
    'It answers questions that need a connection, not a passage: multi-hop dependencies, exposure across documents, "everything related to this supplier".',
    'Vector search finds where to start and the graph finds what is connected, so each does the job it is good at.',
    'Keeping vectors, text search and graph in one database ([[spanner-graph]]) removes a copy, a sync job and a consistency problem.',
    'The graph is inspectable. You can see why an answer included an entity, which a pile of chunks cannot show.'
  ],
  fails: [
    '**Extraction errors become graph facts.** A wrong edge is retrieved with confidence. Sample and review the extracted graph, and keep a confidence and provenance on every edge.',
    '**Entity resolution is the hard part.** Over-merging joins different things; under-merging splits one thing into five and breaks traversal.',
    '**Unbounded traversal.** Too many hops pulls in the whole neighbourhood and drowns the context. Cap hops, fan-out and context size.',
    '**Permission leakage through edges.** A node the user may see can link to content they may not. Enforce ACLs on nodes, edges and chunks, not only on documents.',
    '**Stale graph.** Updates that touch text but not the graph leave old relationships behind.',
    '**Model-written graph queries.** Letting a model write free-form queries risks wrong or expensive ones. Prefer a small set of parameterised traversals, run under a read-only identity.'
  ],
  sections: [
    { t: 'h2', text: 'When a graph earns its cost' },
    { t: 'table', cols: ['Question shape', 'Example', 'Vector or hybrid retrieval', 'GraphRAG'], rows: [
      ['Find the passage', '"What is our travel reimbursement limit?"', 'Strong. Use this.', 'Unnecessary'],
      ['Summarise a topic across a few documents', '"What changed in the 2026 security policy?"', 'Good with reranking', 'Rarely needed'],
      ['Multi-hop relationship', '"Which of our services depend on the vendor that had the outage?"', 'Weak: needs several lookups that the model must stitch together', 'Strong'],
      ['Aggregate across entities', '"Which suppliers appear in more than three open contracts?"', 'Weak', 'Strong, or use SQL on the same data'],
      ['Explain a chain of cause', '"How is this alert connected to that release?"', 'Weak', 'Strong, if the edges exist'],
      ['Entities with many aliases', '"Everything about Acme"', 'Misses variants', 'Strong after entity resolution']
    ], note: 'If most of your questions fall in the first two rows, a graph adds cost (extraction, resolution, upkeep) without adding answers.' },

    { t: 'h2', text: 'Pipeline stages' },
    { t: 'table', cols: ['Stage', 'What happens', 'Design choices', 'Quality check'], rows: [
      ['**Extraction**', 'A model reads each chunk or document and emits entities and relations as structured output', 'Fixed schema of node and edge types; one pass per chunk versus per document; confidence and evidence span per edge', 'Precision and recall of edges on a labelled sample'],
      ['**Entity resolution**', 'Merge mentions of the same thing', 'Deterministic keys first (ids, emails, ticket numbers), fuzzy matching second, model-assisted for the rest; a review queue for low confidence', 'Merge error rate on a labelled set; count of duplicate nodes'],
      ['**Graph construction**', 'Write nodes and edges with provenance and ACLs', 'Node and edge tables with properties for source id, timestamp, confidence, owner group; a property graph defined over them', 'Orphans, edges without a source, nodes without an owner'],
      ['**Storage and indexes**', 'Graph, chunk text, vectors and full-text index in one database', 'Vector index for entry points, full-text for keywords and identifiers, standard indexes on node keys', 'Query latency at p95 on representative traversals'],
      ['**Retrieval**', 'Entry search then traversal', 'Hop limit (often 1 to 3), edge-type allow-list per question type, fan-out cap, score threshold', 'Recall of the supporting entities on multi-hop questions'],
      ['**Context assembly**', 'Turn a subgraph into prompt text', 'List entities and relations compactly, include source chunks, order by relevance, stay within a token budget', 'Groundedness and context size'],
      ['**Generation and verification**', 'Answer with citations; verify claims', 'Refuse when the graph and chunks do not support an answer', 'Citation correctness, refusal correctness'],
      ['**Update and reconcile**', 'Apply changes; clean up', 'Event-driven updates; scheduled reconciliation; soft delete with a retention window', 'Freshness lag; drift between source and graph']
    ] },

    { t: 'h2', text: 'Retrieval patterns' },
    { t: 'cards', items: [
      { tag: 'Pattern 1', title: 'Vector entry, graph expand', text: 'Find the closest nodes or chunks by embedding, then expand a fixed number of hops along allowed edge types. The default for most GraphRAG systems, and the one Google\'s reference architecture follows.' },
      { tag: 'Pattern 2', title: 'Hybrid entry, graph expand', text: 'Combine vector and full-text search with reciprocal rank fusion to pick the entry points. Use it when identifiers, product codes or names matter as much as meaning.' },
      { tag: 'Pattern 3', title: 'Templated traversals', text: 'A small library of parameterised graph queries ("dependencies of X", "owners of Y", "documents mentioning both"), chosen by the router. Predictable, testable and cheap. Prefer this over letting a model write free-form queries.' },
      { tag: 'Pattern 4', title: 'SQL beside graph', text: 'Use SQL on the same tables for counts and filters, and graph queries for paths. Spanner Graph supports both on the same data, which is the point of keeping them together.' }
    ] },

    { t: 'h2', text: 'Designing the schema' },
    { t: 'ul', items: [
      '**Start from the questions.** Write the twenty questions users will ask, then list the node and edge types needed to answer them. Skip the rest.',
      '**Keep the vocabulary small:** a dozen node types and edge types is plenty to start. A large, loose schema produces noisy extraction.',
      '**Put provenance on everything:** source document, passage, extraction run, model version, confidence, and ACL. You will need it for debugging, deletion and permissions.',
      '**Separate facts from mentions.** A document mentioning a supplier is a different edge from a contract with a supplier.',
      '**Version the schema** and the extraction prompt together, and re-extract when either changes ([[a:agent-cicd|CI/CD architecture]]).'
    ] },

    { t: 'h2', text: 'Operating it' },
    { t: 'table', cols: ['Concern', 'What to do'], rows: [
      ['**Cost**', 'Extraction is a model call per chunk, which dominates build cost. Extract incrementally, cache by content hash, use a smaller model for first pass, and budget re-extraction when the schema changes.'],
      ['**Freshness**', 'Event-driven updates plus nightly reconciliation. Track the age of the newest unprocessed change per source.'],
      ['**Permissions**', 'Store the ACL on nodes, edges and chunks. Filter during traversal, not only at the end, and test with users in different groups ([[p:incident-runbooks|runbook R5]]).'],
      ['**Evaluation**', 'Score multi-hop questions separately: did retrieval return the right entities and edges, and did the answer use them? Compare against a vector-only baseline on the same set ([[p:evaluation-lifecycle|evaluation lifecycle]]).'],
      ['**Rebuilds**', 'Build a new graph beside the old one and switch when it passes the gate. Never re-extract in place.']
    ] }
  ],
  src: [
    ['GraphRAG infrastructure for generative AI using Vertex AI and Spanner Graph', 'https://docs.cloud.google.com/architecture/gen-ai-graphrag-spanner'],
    ['Multimodal GraphRAG resource orchestration with agents', 'https://docs.cloud.google.com/architecture/agentic-ai-multimodal-graph-rag-resource-orchestration'],
    ['Spanner vector search overview', 'https://docs.cloud.google.com/spanner/docs/vector-search-overview'],
    ['Introducing Spanner Graph', 'https://cloud.google.com/blog/products/databases/announcing-spanner-graph']
  ]
},
{
  id: 'agent-cicd', name: 'CI/CD for agents and RAG systems',
  short: 'How to version, test, deploy and roll back everything that can change an agent\'s behaviour: prompts, tools, models, indexes and data.',
  when: 'You release changes to a prompt, a tool, a model version or an index more than once a quarter, or you have already had a release that made quality worse and nobody could say why. Classic CI/CD protects code; an agent also changes through data and configuration.',
  flow: [
    { l: 'Version everything' },
    { l: 'Build + test', s: 'cloud-run' },
    { l: 'Evaluate + gate', s: 'ap-evals' },
    { l: 'Build index', s: 'ap-pipelines' },
    { l: 'Deploy revision', s: 'agent-runtime' },
    { l: 'Shadow + canary', s: 'cloud-monitoring' },
    { l: 'Promote or roll back', s: 'infra-manager' }
  ],
  steps: [
    [0, 'Prompts, agent configuration, tool schemas, orchestration code, eval datasets and infrastructure definitions all live in version control. A release is a **manifest** that pins one version of each: prompt, tools, model, retrieval settings, index and code.'],
    [1, 'On every pull request the pipeline builds the container, runs unit tests for tools and glue code, and runs **static checks** (schema validation, secrets scan, dependency and image scan). Build and test jobs run on [[cloud-run|Cloud Run]] jobs or your CI runner.'],
    [2, 'The **evaluation gate** runs the smoke set on a pull request and the full suite on a release candidate with [[ap-evals|Agent Platform Evals]]: retrieval, answer quality, tool use, security and cost ([[p:evaluation-lifecycle|evaluation lifecycle]]). The release is blocked if a gate fails.'],
    [3, 'If documents, chunking or embeddings changed, a pipeline ([[ap-pipelines|Pipelines]] or your orchestrator) builds a **new index beside the current one**. It runs retrieval evals on both and records the index version in the manifest.'],
    [4, 'The agent deploys as a **new revision** on [[agent-runtime|Agent Runtime]] (or Cloud Run or GKE) with its own identity and the manifest versions. The old revision keeps running.'],
    [5, '**Shadow** traffic copies live requests to the new revision and scores the output without showing it. A **canary** then routes a small share of real traffic, and the dashboard compares success, latency, cost and safety against the control ([[p:agentops|AgentOps]]).'],
    [6, 'If canary metrics stay inside the rollback criteria, traffic widens step by step and the manifest is promoted. If they do not, the router returns to the previous revision automatically. Infrastructure changes go through [[infra-manager|Terraform]] with the same review and promotion path.']
  ],
  why: [
    'Behaviour changes without code changes: a prompt edit, a new model version or a re-index can each make the system better or worse. Treating them as releases gives them tests and rollback.',
    'A manifest makes "what was running on Tuesday" answerable, which is the first question in any incident.',
    'Building indexes beside the old one makes a bad data refresh reversible.',
    'Evaluation gates turn quality from an opinion into a pass or fail check.'
  ],
  fails: [
    '**Prompt edits made in the console** bypass review and cannot be rolled back. Make the repository the only path to production.',
    '**Model versions change behind a stable name.** Pin versions where you can, and re-run the eval suite on a schedule to detect drift.',
    '**Gates that never fail** are theatre. Review them when a regression reaches production, and add the case.',
    '**Canary too small or too short** to see a rare failure. Size by the failure rate you need to detect.',
    '**Rollback that was never rehearsed** fails when needed: the old index was deleted, a schema migration cannot be undone, or a secret rotated.',
    '**Evaluation on a stale dataset** passes changes that hurt current questions.'
  ],
  sections: [
    { t: 'h2', text: 'What can change in production' },
    { t: 'table', cols: ['What changes', 'Version it as', 'Test it with', 'Roll back by'], rows: [
      ['**Prompt or system instruction**', 'File in the repository, hashed; prompt id in every trace', 'Smoke eval on PR; full eval on release; injection tests', 'Redeploy or flag back to the previous prompt version'],
      ['**Tool schema or tool code**', 'Semantic version per tool; MCP server image tag', 'Contract tests; tool-selection and argument evals; unsafe-call tests', 'Pin the agent to the previous tool version; keep old tool endpoints live during canary'],
      ['**Model or model version**', 'Explicit version pinned in the manifest', 'Full eval suite and cost and latency on a replayed sample', 'Switch the manifest back; keep a fallback model configured'],
      ['**Retrieval settings** (k, filters, reranker, chunk size)', 'Config in the repository', 'Retrieval eval (recall at k) and answer eval', 'Revert the config'],
      ['**Data and index**', 'Index version and source snapshot id; embedding model recorded', 'Retrieval eval on old and new index side by side; permission tests', 'Point the agent at the previous index (keep it for at least a week)'],
      ['**Orchestration and agent code**', 'Container image digest and git commit', 'Unit, integration, trajectory and step-limit tests', 'Route traffic to the previous revision'],
      ['**Policies and identity**', 'Terraform for IAM, gateway and registry entries', 'Policy tests, including "direct call must fail"', 'Revert the Terraform change; audit logs show who changed what']
    ] },
    { t: 'h2', text: 'Pipeline stages and gates' },
    { t: 'table', cols: ['Stage', 'Runs on', 'Checks', 'Blocks when'], rows: [
      ['**Pull request**', 'Every change', 'Lint, unit and contract tests, secrets scan, dependency scan, smoke eval (minutes)', 'Any failure'],
      ['**Release candidate**', 'Merge to main', 'Full golden set, adversarial and injection set, multi-turn simulations, cost and latency replay', 'A gate in the [[p:evaluation-lifecycle|release thresholds]] fails'],
      ['**Index build**', 'Data or embedding change', 'Build new index; retrieval eval against current; permission test with users in different groups', 'Recall drops beyond the margin or a permission test fails'],
      ['**Staging**', 'Before production', 'End-to-end tasks against production-like data and identities; gateway and policy checks', 'Any unsafe action or policy bypass'],
      ['**Shadow**', 'Live traffic copy', 'Scored comparison, no user impact', 'Quality or safety worse than control'],
      ['**Canary**', '1 to 5 percent, then widen', 'Success, latency, cost, safety, user feedback versus control', 'Any rollback criterion is hit'],
      ['**Promote**', 'After canary', 'Manifest recorded, runbooks updated, old revision kept warm for a set period', 'None; this is the release']
    ] },
    { t: 'h2', text: 'Rollback criteria, written in advance' },
    { t: 'ul', items: [
      'Task success down by more than the agreed margin against the control over a minimum number of requests.',
      'Any unsafe tool call, policy block spike, or sensitive-data leak.',
      'p95 latency above the objective for N minutes, or error rate above the budget.',
      'Cost per successful task above the approved ceiling.',
      'Automatic rollback for the first three; human decision for the rest.'
    ] },
    { t: 'callout', title: 'Environments', text: 'Keep dev, staging and production in separate projects with separate agent identities and separate data. Staging should use production-like permissions and a **sanitised copy** of data, since many failures (permissions, quotas, network paths) only appear under real controls. Promote **the same manifest** through environments, not a rebuilt one.' },
    { t: 'p', text: 'The delivery tooling (Terraform, Cloud Build or GitHub Actions, Artifact Registry, supply-chain controls, blue/green and disaster recovery) is covered in [[p:platform-engineering|the platform engineering guide]].' }
  ],
  src: [
    ['MLOps: continuous delivery and automation pipelines in machine learning', 'https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning'],
    ['Agent evaluation on Agent Platform', 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/optimize/evaluation/agent-evaluation'],
    ['Cloud Deploy documentation', 'https://docs.cloud.google.com/deploy/docs']
  ]
}
);
