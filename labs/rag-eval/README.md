# Lab: RAG evaluation, access control and deletion (local)

**Status:** runs locally, tested (`node --test labs/rag-eval/test.mjs`). **Cloud cost:** none. **Credentials:** none.

## Objective and outcome
Measure retrieval quality and enforce safety properties on a small enterprise-RAG-shaped system, then prove the checks work by **breaking the system on purpose and confirming the checks fail**. After the lab you can: compute precision@k, recall@k, MRR and NDCG@k and say what each does not prove; show that a hidden document cannot leak through ranking, a shared cache, or a stale index; and gate a change against a baseline.

## Prerequisites
Node 22+. Read the Atlas playbooks *RAG Lifecycle Controls* and *Evaluation Datasets, Metrics and Release Gates* first.

## Scenario
A fictional company ("Northwind") has an internal knowledge base. Some documents are open, some are restricted to a group (`engineering`, `hr`), one policy has a superseded older version, one document carries an injection payload, and a second tenant ("Globex") shares the same index. 24 hand-written cases cover answerable questions, access-control cases that must **abstain**, out-of-scope questions, and four vocabulary-mismatch paraphrases that a lexical retriever should miss.

## Architecture
`corpus.json` (documents with `tenant`, `groups`, `superseded`) -> `retriever.mjs` (filter by tenant+group and by version, **then** score with BM25 over the visible set only, injection tripwire, abstain below a confidence floor, tenant-safe cache, tombstones) -> `evaluate.mjs` (runs `dataset.json`, computes metrics with the same `assets/logic.js` the website loads, checks safety invariants) -> `run.mjs` (report and regression gate against `baseline.json` using `gates.json`).

## Steps
1. `node labs/rag-eval/run.mjs` and read the table. Note recall below 1.0 and why (cases c21-c24 are paraphrases; c22 is a *confident wrong answer*, worse than an abstention).
2. Open `dataset.json`. Each case has an id, query, user identity, graded relevance, expected behaviour, risk tag, difficulty and failure criteria (the dataset format from the Atlas evaluation playbook).
3. Inject faults and watch the gate fail (below). Then read `test.mjs` to see that each fault is asserted as *detected*.
4. Change `retriever.mjs` (for example the abstention floor) and rerun. If the gate fails, decide whether the change is a regression or whether the baseline should move, and say why. Regenerate only deliberately: `node labs/rag-eval/run.mjs --write-baseline`.

## Validation and expected output
Normal run: `GATE: PASS`, all three safety invariants `0`, recall about 0.778 and abstention accuracy 0.875 on dataset `2026-11-20.1`. `node --test labs/rag-eval/test.mjs` -> 15 passing.

## Failure injection
`--fault=aclBypass` (permission filter skipped) · `--fault=sharedCache` (cache key ignores identity) · `--fault=emptyIndex` (index outage) · `--fault=noScan` (injection tripwire off) · `--fault=includeSuperseded` (stale version served) · `staleCache` is exercised in the deletion test (cache not invalidated after delete). Each must produce `GATE: FAIL`.

## Cost and cleanup
No cloud resources are created and nothing is written except `baseline.json` when you ask for it. Nothing to clean up.

## Troubleshooting
*Gate fails on a clean checkout:* check you did not edit `dataset.json`, `corpus.json` or the retriever without regenerating the baseline deliberately. *`Cannot find module`:* run from the repository root with Node 22+.

## Limits (read before quoting any number)
About twenty cases; one annotator; lexical retrieval only; the injection tripwire is a regex heuristic and **is not a defence against prompt injection** (real defences are architectural: treat retrieved text as untrusted, constrain tools, screen inputs and outputs). Latency is in-memory and informational.

## Production extension
Replace BM25 with your managed or custom retrieval service and keep `dataset.json`, `evaluate.mjs` and the invariants. Then add: a larger and independently annotated dataset with a held-out split, hybrid retrieval and reranking as separate measured stages, answer-quality metrics (groundedness, citation precision) with a calibrated judge, identity propagation from the real caller, source-to-index deletion with audit, and the gate running in CI against your own tolerances. Re-verify every Google Cloud product behaviour against current official documentation before relying on it.
