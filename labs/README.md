# Runnable local labs

These labs run on a laptop with **Node 22 or newer and nothing else**: no dependencies, no network, no Google Cloud account, no credentials, no cost. They exist to prove that the guidance in the Atlas can be turned into code that is measured and tested.

| Lab | What it demonstrates | Run it | Tests |
|---|---|---|---|
| [`rag-eval`](rag-eval/) | Retrieval evaluation (precision/recall/MRR/NDCG), access-control and tenant filtering, deletion and cache invalidation, abstention, injection tripwire, regression gate, failure injection | `node labs/rag-eval/run.mjs` | `node --test labs/rag-eval/test.mjs` |
| [`bounded-agent`](bounded-agent/) | Bounded agent execution: task contract, allow-list, budgets, retries with jittered backoff, idempotency, autonomy levels with approval, checkpoint/resume, trace, failure injection | `node labs/bounded-agent/run.mjs` | `node --test labs/bounded-agent/test.mjs` |

## What these labs are not

- They are **not** Google Cloud code. They use a toy BM25 retriever and a scripted planner in place of a vector service and a model, so that every result is deterministic and offline. Each README's *Production extension* section names what to swap in on Google Cloud and what you would then have to re-verify.
- They are **not** benchmarks. The datasets are small and hand-written. Differences of a few points are noise.
- The thresholds and tolerances in the labs belong to those labs. They are not recommended defaults for any real system.
