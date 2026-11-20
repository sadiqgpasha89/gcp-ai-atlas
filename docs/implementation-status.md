# Implementation status

Ledger of every task ID in the execution plan (dated 2026-11-20), as of this change. A task is **Done** only where evidence exists in the repository. **Partial** means part is delivered and the rest is not; the gap is stated. **Blocked** means it could not be done in this session for a stated reason. **Not started** means no work was done.

Status counts: Done 57, Partial 45, Blocked 3, Not started 42 (of 147 task IDs).

Nothing here claims Google product facts are verified. The sandbox had no usable access to Google documentation, so SVC-02, SVC-03 and SVC-04 are blocked and all 73 service records stay `needs-verification`.

| ID | Status | Evidence or gap |
|---|---|---|
| AUD-01 | Done | docs/audit/baseline.md (stack, workflow, tests discovered) |
| AUD-02 | Done | No install/lint/build exists (zero dependencies). Ran `node scripts/check.mjs` and `node --check assets/app.js`; both pass |
| AUD-03 | Done | Counts table in docs/audit/baseline.md, measured from loaded data. Link count: no `#/` links are stored in data; links are built by the app and validated through `see` refs |
| AUD-04 | Partial | Headless Chrome smoke test of ten route types on baseline and upgraded site. No manual keyboard or screen-reader pass; no click-through of every tool |
| AUD-05 | Partial | Found and fixed two crashing pages. No external link check (no network access); accessibility not audited |
| AUD-06 | Done | docs/audit/baseline.md, docs/audit/route-inventory.md |
| AUD-07 | Done | This file |
| SVC-01 | Partial | All 73 services have a metadata record (validator enforces it). Record accuracy was not audited against Google documentation |
| SVC-02 | Blocked | Google documentation could not be fetched in this session. Seven "previously known as" entries come from existing knowledge and are shown with a not-verified caveat |
| SVC-03 | Blocked | Same cause. Every record has lifecycle `unknown`; the validator rejects any lifecycle claim without verification |
| SVC-04 | Blocked | Same cause. No external URL was checked |
| SVC-05 | Partial | Schema, validator rule (verified needs ISO date and Google docs sourceUrl), rendering and tests are in place. No value is verified yet |
| SVC-06 | Partial | `was` aliases on 7 services, rendered with a note that API and SDK names may differ. Not verified |
| SVC-07 | Partial | 38 of 73 services have alternatives and choose/avoid text (data/meta.js). Written as Atlas guidance; the other 35 have none |
| SVC-08 | Done | Badge on every service card and a verified / not-yet-verified filter on category pages, both driven by metadata. Today all 73 show not verified, which is accurate |
| SVC-09 | Done | scripts/check.mjs, tests/content.test.mjs (6 tests incl. negative cases) |
| SVC-10 | Done | docs/content-governance.md, docs/contributing-content.md |
| RAG-01 | Partial | rag-lifecycle-controls section 1 (stage, owner, control, test). Existing RAG playbook untouched |
| RAG-02 | Done | rag-lifecycle-controls section 2 |
| RAG-03 | Partial | Section 3 covers what breaks and what to measure; not every format listed in the plan |
| RAG-04 | Partial | Section 4 chunking and metadata. Not every chunking strategy listed |
| RAG-05 | Not started | Not written in this pass |
| RAG-06 | Not started | Not written in this pass |
| RAG-07 | Not started | Not written in this pass |
| RAG-12 | Not started | Not written in this pass |
| RAG-08 | Done | Section 5, plus labs/rag-eval pre-filter and tenant tests |
| RAG-09 | Done | Section 6, plus labs/rag-eval tombstones, supersession and reconciliation tests |
| RAG-10 | Done | Section 7, plus lab fault injection and injection tripwire (documented as not a defence) |
| RAG-11 | Done | eval-datasets-gates section 4; tests/logic.test.mjs metric tests; labs/rag-eval |
| RAG-13 | Done | labs/rag-eval: 15 tests, dataset, gates, baseline, fault flags. Local and mock; not a benchmark of any Google service |
| AGT-01 | Done | agent-bounded-design section 2 |
| AGT-02 | Done | agent-bounded-design section 1 |
| AGT-03 | Done | agent-bounded-design section 4 |
| AGT-04 | Done | agent-bounded-design section 3 |
| AGT-05 | Done | agent-bounded-design section 5 |
| AGT-07 | Done | agent-bounded-design section 6 |
| AGT-08 | Done | agent-bounded-design section 7 |
| AGT-09 | Done | agent-bounded-design section 9 |
| AGT-10 | Done | agent-bounded-design section 8 table, checked against the lab levels by the validator |
| AGT-12 | Done | agent-bounded-design section 11 |
| AGT-06 | Partial | Section 6 covers retries, backoff, jitter, idempotency. Concurrency limits and backpressure are thin |
| AGT-11 | Partial | Section 10 trust boundaries only. Not verified against current MCP or A2A specifications |
| AGT-13 | Done | labs/bounded-agent: 29 tests, traces, budgets, failure injection, policy checks, trajectory evaluation, checkpoint/resume. Local and mock |
| SEC-01 | Done | identity-threat-model section 3 |
| SEC-02 | Done | identity-threat-model section 1 |
| SEC-05 | Done | identity-threat-model section 5 |
| SEC-07 | Done | identity-threat-model section 6 |
| SEC-08 | Done | identity-threat-model section 7 |
| SEC-03 | Partial | Sections 1, 2 and 4. Product-specific IAM detail not verified |
| SEC-04 | Partial | Section 4 controls checklist |
| SEC-06 | Partial | Threat model plus lab tripwire; not a full control catalogue |
| SEC-09 | Partial | Templates 9 to 14 added: inventory, system card, risk assessment, privacy review, tool permission register, human oversight plan. No standalone threat-model template |
| SEC-10 | Not started | Existing readiness and review tools not changed |
| EVAL-01 | Done | eval-datasets-gates section 1 |
| EVAL-02 | Done | eval-datasets-gates section 2 |
| EVAL-03 | Done | eval-datasets-gates section 3 |
| EVAL-04 | Done | eval-datasets-gates section 4 |
| EVAL-05 | Done | eval-datasets-gates section 5 |
| EVAL-06 | Done | eval-datasets-gates section 6 |
| EVAL-07 | Done | eval-datasets-gates section 7 |
| EVAL-08 | Done | eval-datasets-gates section 8 |
| EVAL-09 | Done | labs/rag-eval dataset.json, gates.json, baseline.json, README limits |
| EVAL-10 | Partial | Evaluation plan template added. Existing readiness checklists and labs not changed |
| DATA-01 | Not started | Not written in this pass |
| DATA-02 | Partial | Ingestion modes covered inside rag-lifecycle-controls section 2 only |
| DATA-03 | Not started | Not written in this pass |
| DATA-04 | Not started | Not written in this pass |
| DATA-05 | Not started | Not written in this pass |
| DATA-07 | Not started | Not written in this pass |
| DATA-06 | Partial | Freshness, deletion and reconciliation in section 6 and the lab; no dedicated pipeline guide |
| REL-01 | Done | nfr-reliability section 1 |
| REL-02 | Done | nfr-reliability section 2 |
| REL-03 | Done | nfr-reliability section 3 |
| REL-04 | Done | nfr-reliability section 4 |
| REL-05 | Done | nfr-reliability section 5 |
| REL-06 | Done | nfr-reliability section 6 |
| REL-07 | Done | nfr-reliability section 7 |
| REL-08 | Done | nfr-reliability section 8 |
| REL-09 | Not started | Reference architectures and readiness tools not changed |
| FIN-01 | Partial | Legacy formula kept and proven equal to the new model when new inputs are zero (tests/logic.test.mjs). No separate written audit |
| FIN-02 | Partial | Users, requests, tasks, tokens, calls, retries, tool, retrieval, rerank and embedding inputs. No session input |
| FIN-03 | Done | One-time block shown and exported separately from monthly |
| FIN-04 | Done | Per request, per workflow, per user, per successful task; monthly, annual, year-one |
| FIN-05 | Done | Five archetype presets (shape only, no prices) and pin-and-compare |
| FIN-06 | Partial | Traffic, tokens, calls, retries, cache, retrieval depth. Model selection is not a sensitivity row |
| FIN-07 | Partial | Source, currency, date and region recorded and exported, with warnings when blank. Uncertainty is stated, not quantified |
| FIN-08 | Partial | Budget headroom and a calls-per-task guard. No alert or recommendation engine |
| FIN-09 | Done | tests/logic.test.mjs: 29 tests incl. zero, missing, negative, over-100% and very large inputs |
| TOOL-01 | Partial | Smoke tested; two pages fixed. Not a full usefulness audit |
| TOOL-02 | Not started | Existing tool not changed |
| TOOL-03 | Not started | Existing tool not changed |
| TOOL-04 | Not started | Existing tool not changed |
| TOOL-05 | Not started | Existing tool not changed |
| TOOL-06 | Not started | Existing tool not changed |
| TOOL-07 | Not started | Existing tool not changed |
| TOOL-08 | Not started | Existing tool not changed |
| TOOL-09 | Partial | Calculator is deterministic and explains drivers; other tools not reviewed |
| TOOL-10 | Partial | Calculator Markdown and JSON export. Other tools unchanged |
| TOOL-11 | Partial | Unit tests for calculator logic. No browser interaction tests |
| LAB-01 | Partial | Local labs record objective, environment, run, test, demonstrates, limits. Existing labs not migrated |
| LAB-02 | Not started | Existing 12 exercises not migrated |
| LAB-03 | Partial | Local labs reference real files; existing exercises not checked |
| LAB-04 | Done | Both new labs run offline with mock tools and are labelled as such |
| LAB-05 | Done | 44 lab tests plus a CI gate against a committed baseline |
| LAB-06 | Done | Both new advanced labs inject failures (flags and test cases) |
| LAB-07 | Not started | Progressive project path not built |
| LAB-08 | Partial | Local labs listed with effort and limits; existing exercises not indexed with cost bands |
| LAB-09 | Partial | New labs hold no credentials and the validator scans for key patterns. Existing exercise instructions not verified |
| PB-01 | Partial | Five new playbooks; GenAIOps/FinOps/security deepening not done for existing ones |
| PB-02 | Partial | New playbooks have an at-a-glance block; legacy playbooks not converted |
| PB-03 | Not started | Not written |
| PB-04 | Not started | Not written |
| PB-05 | Not started | An ADR template already existed; no new technical design template |
| PB-06 | Partial | `see` links to tools, labs, pages and playbooks on the new playbooks |
| MGR-03 | Partial | Use-case charter, data readiness, evaluation plan and post-launch review templates added |
| MGR-01 | Not started | Manager cockpit not built in this pass |
| MGR-02 | Not started | Manager cockpit not built in this pass |
| MGR-04 | Not started | Manager cockpit not built in this pass |
| MGR-05 | Not started | Manager cockpit not built in this pass |
| MGR-06 | Not started | Manager cockpit not built in this pass |
| MGR-07 | Not started | Manager cockpit not built in this pass |
| MGR-08 | Not started | Manager cockpit not built in this pass |
| MGR-09 | Not started | Manager cockpit not built in this pass |
| SKL-01 | Not started | Competency tracking not built; existing three-tier model untouched |
| SKL-02 | Not started | Competency tracking not built; existing three-tier model untouched |
| SKL-03 | Not started | Competency tracking not built; existing three-tier model untouched |
| SKL-04 | Not started | Competency tracking not built; existing three-tier model untouched |
| SKL-05 | Not started | Competency tracking not built; existing three-tier model untouched |
| SKL-06 | Not started | Competency tracking not built; existing three-tier model untouched |
| UX-01 | Done | Visual identity and navigation unchanged; additions reuse existing styles |
| UX-02 | Partial | Search now covers previous names, playbook tables, local labs and templates. Not tested with a user-path script |
| UX-03 | Partial | Verification filter only |
| UX-04 | Partial | Related links via `see`; filter empty state. No new breadcrumbs |
| UX-05 | Partial | Scroll regions focusable and labelled, filter buttons use aria-pressed, table headers scoped. Not audited with tooling or a screen reader |
| UX-06 | Partial | Calculator shows warnings, input corrections and an empty state |
| UX-07 | Not started | Diagram readability not reviewed |
| UX-08 | Partial | Verification treatment on services only |
| UX-09 | Done | Report-an-issue links on service and playbook pages; copy states no reply is promised |
| QA-01 | Partial | 79 tests and syntax checks in CI. No linter or type checker (none configured) |
| QA-02 | Partial | Duplicate IDs, reference resolution, schema and see-ref validation. No crawler for every route |
| QA-03 | Not started | No interaction tests |
| QA-04 | Not started | No accessibility tooling run |
| QA-05 | Not started | No responsive tests |
| QA-06 | Not started | No scanning (no dependencies to scan) |
| QA-07 | Partial | Deploy step unchanged. Live verification result recorded in the final report |
| QA-08 | Partial | Freshness report printed by the validator; informational. No staleness interval until something is verified |
| QA-09 | Done | docs/testing-and-release.md, docs/contributing-content.md |

## Workstream summary

| Workstream | State |
|---|---|
| WS-01 Audit | Done, with the accessibility and link checks noted as gaps |
| WS-02 Service accuracy | Mechanism built and tested; verification blocked |
| WS-03 RAG | One lifecycle playbook, one tested local lab; advanced patterns not written |
| WS-04 Agents | One playbook, one tested bounded-agent lab |
| WS-05 Security | One playbook and six templates; tool integration not done |
| WS-06 Evaluation | One playbook, tested metrics, a lab with a CI gate |
| WS-07 Data engineering | Not started beyond ingestion modes |
| WS-08 Reliability | One playbook; not linked into architectures |
| WS-09 FinOps | Scenario model, UI and tests; alerts and recommendations not done |
| WS-10 Decision tools | Not started |
| WS-11 Labs | Two runnable labs; existing labs not migrated |
| WS-12 Playbooks | Five new; standardisation and legacy migration not done |
| WS-13 Manager cockpit | Not started (four templates only) |
| WS-14 Competency | Not started |
| WS-15 UX and accessibility | Partial |
| WS-16 CI and QA | Partial: tests and gates in CI; no interaction, accessibility or responsive tests |
