# ADR 0004: Labs run locally with mock tools

Status: accepted, 2026-11-20

**Context.** The plan requires reproducible labs but forbids committing credentials or creating billable resources.

**Decision.** `labs/rag-eval` (synthetic corpus, BM25, access control, tombstones, evaluation gate) and `labs/bounded-agent` (mock tools, budgets, policy decisions, failure injection, trajectory evaluation) run with Node only. Each README and each page record says what the lab does not prove.

**Consequences.** Labs demonstrate engineering controls, not the behaviour or performance of any Google service. Their latency numbers are informational only. Cloud variants remain future work.
