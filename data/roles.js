/* Role lenses for the decision tabs in Google Cloud for AI systems.
   Each role: id, name, blurb, owns:[], quick:[[situation, default call, decision id]], rhythm:[[when, what to do]]
   Each decision guide in decisions.js carries `lead` ('em'|'pe'|'both') and per-role `em` / `pe` blocks. */
window.ATLAS.roles = [
  {
    id: 'em', name: 'Engineering managers',
    blurb: 'You decide what gets built, by whom, at what risk and cost. These guides give you the default call, the evidence to ask your team for, and the questions that expose a weak plan.',
    owns: [
      '**Scope and sequencing**: build, buy or customise, and what ships in which phase.',
      '**Risk appetite**: how much autonomy, which actions need a person, and the stop rule.',
      '**Budget and people**: run cost, reserved capacity, on-call and who owns quality.',
      '**Launch gates**: quota, evaluation thresholds, tenant isolation sign-off.'
    ],
    quick: [
      ['Someone proposes building a platform or fine-tuning before a first use case is live', 'Say no for now. Fund a managed baseline and an eval set first.', 'build-buy-customize'],
      ['A team wants an "agent" for a process with known steps', 'Ask for a workflow. Approve the lowest autonomy level that works.', 'autonomy-level'],
      ['An agent will write to customer or financial records', 'Require approval on every write until accuracy data says otherwise.', 'human-in-loop'],
      ['A launch is a few weeks away', 'Make quota and a tested fallback a launch gate with a named owner.', 'capacity-strategy'],
      ['The team says quality is "pretty good" from demos', 'Do not approve until a versioned eval set and agreed threshold exist.', 'evaluation'],
      ['The monthly bill jumped, or a forecast is needed', 'Ask for cost per successful task by feature and tenant, then the lever list.', 'cost-levers'],
      ['A large or regulated customer is about to sign', 'Settle the isolation model first. It is a one-way door.', 'tenancy'],
      ['The team wants to self-host models on GPUs/TPUs', 'Require a named capacity owner and a cost case against provisioned throughput.', 'where-model-runs'],
      ['Evaluating model deployment tier and quota commitments', 'Prototype on Gemini Pay-As-You-Go; commit to Provisioned Throughput only when steady volume or P99 latency demands it.', 'model-deployment-capacity'],
      ['Deciding whether a business process needs an autonomous agent', 'Default to deterministic workflows; use agents only for open-ended unstructured steps.', 'workflow-vs-agent'],
      ['Deciding how to separate multi-tenant customer data', 'Use shared datastore with security filters for standard B2B; charge for dedicated search instances.', 'index-tenancy'],
      ['Team wants to build GraphRAG for an entire corpus', 'Fund GraphRAG only for high-value global corpus synthesis. Use Vector RAG for operational Q&A.', 'graphrag-vs-vector']
    ],
    rhythm: [
      ['Before kickoff', 'Run the **solution shaper**, then read **Build, buy or customise** and **How autonomous should it be**.'],
      ['Before the pilot', 'Check **How will we know it works** and **How much do we trust it to act**; set the stop rule.'],
      ['Four weeks before launch', 'Run the **readiness checklist**; open **capacity** and **tenancy** if either is unsettled.'],
      ['Each month in production', 'Review **cost per successful task**, eval trend and any throttling or incident reports.']
    ]
  },
  {
    id: 'pe', name: 'Principal engineers',
    blurb: 'You decide how it is built and which trade-offs hold up in production. These guides give you the default design, the evidence that settles an argument, and the tests to demand.',
    owns: [
      '**Architecture**: where models run, how agents are hosted, how retrieval and tenancy work.',
      '**Interfaces**: tool contracts, model and vendor seams, identity flow and idempotency.',
      '**Quality evidence**: eval design, component-level scoring and regression gates.',
      '**Failure behaviour**: timeouts, retries, fallbacks, capacity and the blast radius of each tool.'
    ],
    quick: [
      ['Answers are wrong in a RAG system', 'Measure retrieval recall separately. Fix retrieval before the model.', 'improve-model'],
      ['Choosing a vector store', 'Pick by filtering and ranking needs, tested on your real filters.', 'vector-store'],
      ['Choosing where the model runs', 'Start on Gemini behind a gateway. Move on evidence.', 'where-model-runs'],
      ['Choosing an agent runtime', 'Managed first. Keep tools behind stable interfaces so the runtime is replaceable.', 'agent-runtime'],
      ['Long or bursty model calls', 'Stream for people, queue for slow work, batch for anything that can wait.', 'inference-pattern'],
      ['Multi-step or approval-gated work', 'Plain testable code for steps, a thin engine for state and waits.', 'orchestration'],
      ['Throttling at peak', 'Gateway with backoff, spillover and a degraded mode. Assume quota will be short.', 'capacity-strategy'],
      ['Multi-tenant retrieval', 'Enforce isolation in retrieval and storage, and test cross-tenant leaks in CI.', 'tenancy'],
      ['Dense vector search missing exact product codes or part numbers', 'Switch to Hybrid Search (BM25 + vectors) with Reciprocal Rank Fusion.', 'vector-hybrid-search'],
      ['Deciding between Classic RAG and Agentic RAG', 'Start with Classic RAG; add agentic query decomposition only for verified multi-source synthesis.', 'classic-vs-agentic-rag'],
      ['Deciding between Vertex AI Search and AlloyDB pgvector', 'Use Vertex AI Search for document RAG (hybrid, reranker, facets); AlloyDB for relational co-located vector search.', 'search-vs-alloydb'],
      ['Chunking complex PDFs with tables and figures', 'Use Document AI layout-aware chunking; never flatten tables with fixed token windows.', 'chunking-strategy'],
      ['Considering semantic reranking latency vs quality trade-off', 'Turn reranker on for customer-facing Q&A; benchmark Recall@K and P95 latency.', 'reranking-tradeoff']
    ],
    rhythm: [
      ['At design review', 'Open the guide for each decision, read its **red flags** aloud, and ask its **review questions**.'],
      ['When writing an ADR', 'Use the **decision record template** and mark the door type from the guide.'],
      ['Before merge', 'Evals, injection tests and cross-tenant tests must pass in CI.'],
      ['After an incident', 'Revisit the guide named in the post-incident review and update the **revisit trigger**.']
    ]
  }
];
