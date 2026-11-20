/* Runnable local labs. Rendered on #/labs under "Runnable local labs". Source lives in /labs in the repository.
   Each lab has a README written to the common lab template (see docs/contributing-content.md). */
window.ATLAS.labs.localLabs = [
  {
    id: 'rag-eval',
    title: 'RAG evaluation, access control and deletion',
    level: 'Foundations to Advanced',
    time: '1 to 2 hours',
    path: 'labs/rag-eval',
    objective: 'Measure retrieval quality, enforce tenant and group access control before ranking, prove deletion and cache invalidation, and gate a change against a baseline, then break the system on purpose and confirm the checks fail.',
    run: 'node labs/rag-eval/run.mjs',
    test: 'node --test labs/rag-eval/test.mjs',
    environment: 'Node 22 or newer. No dependencies, no network, no cloud account, no cost.',
    demonstrates: [
      'Precision@k, recall@k, MRR and NDCG@k computed by the same code the website loads (`assets/logic.js`).',
      'Hard safety invariants (leaks, stale content, injection payloads served) that must be exactly zero.',
      'A regression gate against a stored baseline with explicit per-metric tolerances.',
      'Six injected faults, each shown to fail the gate: ACL bypass, shared cache, empty index, injection tripwire off, stale version served, stale cache after delete.',
      'Source-to-index reconciliation that reports orphans and missing items.'
    ],
    limits: [
      '24 hand-written cases and one annotator. Differences of a few points are noise.',
      'Lexical BM25 only; says nothing about vector, hybrid or managed retrieval.',
      'The injection tripwire is a regex heuristic and is not a defence against prompt injection.'
    ],
    related: ['pb:rag-lifecycle-controls', 'pb:eval-datasets-gates', 'arch:secure-multitenant-rag', 'dec:index-tenancy', 'svc:ai-search', 'svc:vector-search']
  },
  {
    id: 'bounded-agent',
    title: 'A bounded multi-step agent workflow',
    level: 'Advanced',
    time: '2 to 3 hours',
    path: 'labs/bounded-agent',
    objective: 'See the controls that make an agent workflow bounded: contract, allow-list, budgets, retries with jittered backoff, idempotency, autonomy levels with approval, checkpoint and resume, trace and trajectory evaluation, each triggered by an injected failure.',
    run: 'node labs/bounded-agent/run.mjs',
    test: 'node --test labs/bounded-agent/test.mjs',
    environment: 'Node 22 or newer. No dependencies, no network, no cloud account, no cost.',
    demonstrates: [
      'Every run ends with a stated reason inside its budgets: loop detection, max steps, tool-call, token and deadline limits.',
      'Retries with full-jitter exponential backoff, bounded attempts, and recovery recorded.',
      'An idempotency key making a repeated refund request cause exactly one side effect, including after a crash before the checkpoint was saved.',
      'Autonomy levels L0 to L5 (an Atlas framework) as a tested decision table, with approval and a deny-by-default path.',
      'A tool not on the contract allow-list refused even at the highest autonomy level; instruction-like tool output flagged as data.',
      'Trajectory metrics: task success, tool selection, argument validity, unnecessary calls, policy violations, recoveries.'
    ],
    limits: [
      'The planner is scripted, so this shows the controls around a model, not model behaviour.',
      'Token counts are a character-based proxy and time is a logical clock.',
      'Not an ADK or Google orchestration API; a teaching harness.'
    ],
    related: ['pb:agent-bounded-design', 'pb:nfr-reliability', 'pb:identity-threat-model', 'arch:multiagent-orchestration', 'arch:hitl-agent', 'dec:autonomy-level', 'dec:workflow-vs-agent', 'svc:adk']
  }
];
