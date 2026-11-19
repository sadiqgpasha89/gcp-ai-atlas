/* Management templates: copy-ready markdown, rendered at #/t and #/t/<id>.
   Schema: id, title, short, when, who, body (markdown), related:[service ids], see:['p:id','a:id','d:id'] */
window.ATLAS.templates = [
{
  id: 'problem-statement', title: 'Discovery and problem statement',
  short: 'Frame the problem, the user, the outcome and what would make it not worth building, before anyone picks a model.',
  when: 'At the start of any AI initiative, before architecture or vendor choices. Re-read it at every stage gate.',
  who: 'Product owner with the engineering manager; sponsor signs off.',
  related: ['gemini'], see: ['d:build-buy-customize', 'd:autonomy-level', 't:value-feasibility'],
  body: `# Problem statement: <working title>

Owner: <name>   Sponsor: <name>   Date: <yyyy-mm-dd>   Status: draft | agreed

## 1. The problem
- Who has it (role, volume, how often):
- What they do today and what it costs (time, money, errors):
- Evidence (interviews, tickets, logs, numbers):

## 2. The outcome
- Success in one sentence, in business terms:
- Primary metric and today's baseline:
- Guard-rail metrics that must not get worse (quality, safety, cost, latency):
- Target and date:

## 3. Scope
- In scope (first release):
- Out of scope:
- Users and tenants for the pilot:
- Systems and data the solution must touch:

## 4. Is AI the right tool?
- Could rules, search, a workflow or a report solve it? Why not:
- Autonomy level needed (single call / grounded answer / workflow / agent with approval / autonomous):
- What a wrong answer costs, and who sees it:

## 5. Constraints
- Data classes involved and residency or key-management requirements:
- Latency and availability expectations:
- Budget ceiling (build and monthly run):
- Regulatory or policy requirements:

## 6. Assumptions and risks
| Assumption or risk | Likelihood | Impact | How we will test it |
|---|---|---|---|

## 7. Kill criteria
We stop or change direction if, by <date>: <e.g. task success below X on the golden set; cost per successful task above Y; data owners decline access>.

## 8. Next step
- Decision requested:
- Owner and date:`
},
{
  id: 'value-feasibility', title: 'Business value and feasibility',
  short: 'A one-page case: what it is worth, what it costs to build and run, and how confident the team is about each.',
  when: 'Before funding a pilot, and again before scaling it. Use real numbers from the pilot at the second review.',
  who: 'Engineering manager and product owner; finance reviews the cost lines.',
  related: ['billing'], see: ['d:finops', 'd:cost-levers', 't:problem-statement'],
  body: `# Value and feasibility: <initiative>

Date: <yyyy-mm-dd>   Prepared by: <name>   Stage: pilot | scale

## 1. Value
| Benefit | Measure | Baseline | Target | Annual value | Confidence (H/M/L) |
|---|---|---|---|---|---|
| Time saved | hours per task x tasks | | | | |
| Errors avoided | rework cost | | | | |
| Revenue or retention | | | | | |

Value counted only when a person's time is released to other work or a cost is removed: <yes/no and how>.

## 2. Cost
| Item | Build (one-off) | Run (monthly) | Source of the number |
|---|---|---|---|
| Team (people and time) | | | |
| Model usage (tokens per task x tasks) | | | measured / estimated |
| Retrieval, index, storage | | | |
| Runtime, gateway, observability | | | |
| Evaluation and test environments | | | |
| Security, compliance, review | | | |

Cost per successful task at expected volume: <$>   At 10x volume: <$>

## 3. Feasibility
| Question | Answer | Evidence |
|---|---|---|
| Is the data available, permissioned and good enough? | | |
| Does a baseline pass the golden set at the required level? | | |
| Can we meet latency and availability targets? | | |
| Do quotas and capacity support the volume? | | |
| Do residency, key and perimeter requirements allow the chosen services? | | |
| Do we have the skills, or a plan to get them? | | |

## 4. Options considered
Buy / managed blocks / code-first / own the model: <chosen and why>

## 5. Recommendation
Proceed / proceed with conditions / stop. Conditions and review date:`
},
{
  id: 'architecture-review', title: 'Architecture review checklist',
  short: 'A structured review of an agent or RAG design: autonomy, identity, retrieval, evaluation, failure, cost and operations.',
  when: 'At design review and before production. Anything you cannot answer is a finding.',
  who: 'Tech lead presents; a principal engineer and a security reviewer challenge.',
  related: ['agent-runtime', 'agent-governance'], see: ['a:multi-agent-system', 'a:agentic-rag', 'p:agent-governance-guide', 'p:platform-engineering'],
  body: `# Architecture review: <system>

Date: <yyyy-mm-dd>   Reviewers: <names>   Decision: approve | approve with conditions | revise

## 1. Purpose and autonomy
- [ ] Problem statement and success metric linked
- [ ] Autonomy level justified; a workflow was considered
- [ ] One agent vs several justified (or "single agent")

## 2. Data and retrieval
- [ ] Sources, owners, data classes listed
- [ ] Retrieval strategy chosen with a measured baseline (vector / hybrid / agentic / graph)
- [ ] Permissions enforced in the retrieval query, tested with users in different groups
- [ ] Ingestion, deletion propagation and freshness objectives defined

## 3. Identity and access
- [ ] Each agent has its own identity; no shared service accounts
- [ ] Delegated (on-behalf-of) actions carry the user's identity
- [ ] Tools registered; default-deny policy; direct tool access blocked and tested
- [ ] Write actions above a threshold need approval

## 4. Safety
- [ ] Injection and tool-output threats modelled (see threat model)
- [ ] Prompt, response and tool-result screening in place
- [ ] Sensitive data redacted in logs and traces

## 5. Evaluation and release
- [ ] Golden, adversarial and multi-turn sets exist; held-out set frozen
- [ ] Release gates written; evals run in CI
- [ ] Canary and rollback criteria defined; rollback rehearsed

## 6. Reliability and capacity
- [ ] Timeouts, retries with backoff, idempotency keys, step and token limits
- [ ] Quotas sized for forecast; fallback model or region
- [ ] Recovery objectives and a failover test

## 7. Operations and cost
- [ ] Traces, metrics, dashboards and alerts; release markers
- [ ] Runbooks for the top failure modes; on-call named
- [ ] Cost per successful task estimated; budget alerts set

## 8. Compliance
- [ ] Residency, CMEK, perimeter and audit evidence confirmed for each service (compliance matrix)

## Findings
| # | Finding | Severity | Owner | Due |
|---|---|---|---|---|

## Decision and conditions`
},
{
  id: 'model-agent-selection', title: 'Model and agent selection record',
  short: 'A short decision record for choosing a model, a model tier or an agent design, with the eval evidence attached.',
  when: 'Whenever you choose or change the model, the agent design or the orchestration pattern. One-way doors need a record.',
  who: 'Tech lead writes; engineering manager approves.',
  related: ['gemini', 'model-garden', 'adk'], see: ['d:improve-model', 'd:where-model-runs', 'd:scorecard', 'p:evaluation-lifecycle'],
  body: `# Decision record: <model or agent choice>

Date: <yyyy-mm-dd>   Decider: <name>   Status: proposed | accepted | superseded by <id>

## Context
What we are choosing, for which task, and the constraints (latency, cost, residency, capacity):

## Options
| Option | Version pinned | Task success | Groundedness | Tool correctness | p95 latency | Cost per successful task | Notes |
|---|---|---|---|---|---|---|---|
| A (current) | | | | | | | |
| B | | | | | | | |
| C | | | | | | | |

Dataset: <name, size, date>. Same dataset and settings for every row. Differences smaller than the noise band (about +-<x> points at <n> cases) are not counted.

## Decision
We choose <option> because:

## Consequences
- Fallback model or path:
- Quota and capacity needed:
- What would make us revisit (date or trigger):
- Reversibility: two-way / one-way, and how to roll back:

## Evidence
Links to eval runs, traces and the scorecard export.`
},
{
  id: 'rag-design-review', title: 'RAG design review',
  short: 'Review a retrieval-augmented system end to end: sources, parsing, chunking, index, permissions, quality and freshness.',
  when: 'Before a RAG system goes to pilot, and after any change to sources, chunking, embeddings or retrieval strategy.',
  who: 'Engineer owning the pipeline; data owner and security reviewer attend.',
  related: ['rag-engine', 'ai-search', 'vector-search', 'document-ai'], see: ['a:agentic-rag', 'p:data-lifecycle', 'd:retrieval-strategy', 'd:vector-store'],
  body: `# RAG design review: <system>

Date: <yyyy-mm-dd>   Reviewers: <names>

## 1. Sources
| Source | Owner | Data class | Change frequency | Freshness tier (1/2/3) | Access method |
|---|---|---|---|---|---|

## 2. Parsing and chunking
- File types and parsers; scanned pages, tables, diagrams handled how:
- Chunking strategy (structure-aware / fixed), size, overlap, contextual prefix:
- Sampled chunks reviewed by a person (n=<>), issues found:

## 3. Index and retrieval
- Retrieval strategy and why (vector / hybrid / agentic / graph); baseline score:
- Embedding model and version recorded with the vectors:
- Reranker, k, filters, score threshold:
- Store and its residency, key and perimeter support:

## 4. Permissions
- How ACLs are captured at ingestion and refreshed on change:
- Where filtering happens (in the query: yes/no):
- Cache, memory and summary stores that could copy restricted text:
- Permission test results (users in different groups):

## 5. Quality
| Metric | Golden set result | Gate | Pass |
|---|---|---|---|
| Recall at k | | | |
| Groundedness | | | |
| Refusal correctness (no-answer cases) | | | |
| Citation correctness | | | |

## 6. Freshness and deletion
- Freshness objective per tier and how it is measured:
- Deletion propagation time (tested):
- Reconciliation job and its schedule:

## 7. Operations
- Index versioning and blue/green re-index:
- Alerts: freshness breach, empty-result rate, permission-filter errors:

## Findings and actions
| # | Finding | Owner | Due |
|---|---|---|---|`
},
{
  id: 'threat-model', title: 'Threat model and risk assessment',
  short: 'List what the agent can reach, who might abuse it, how, and which controls stop them, with an owner for each gap.',
  when: 'At design time for every agent that reads untrusted content or can change state, and whenever a tool or data source is added.',
  who: 'Tech lead and security reviewer together.',
  related: ['model-armor', 'agent-governance', 'iam'], see: ['p:agent-governance-guide', 'p:incident-runbooks', 'a:multi-agent-system'],
  body: `# Threat model: <agent or system>

Date: <yyyy-mm-dd>   Authors: <names>   Review date: <yyyy-mm-dd>

## 1. What it is
Purpose, users, deployment, data classes:

## 2. Assets and capabilities
| Asset or capability | Read / write | Data class | Who owns it |
|---|---|---|---|
| Tool: | | | |
| Data source: | | | |
| Credential or identity: | | | |

## 3. Trust boundaries and untrusted inputs
Where untrusted text can enter the model's context (user input, retrieved documents, web pages, tool results, other agents):

## 4. Threats
| # | Threat | Example | Likelihood | Impact | Existing control | Gap / action | Owner |
|---|---|---|---|---|---|---|---|
| 1 | Prompt injection through retrieved or tool-returned text | | | | | | |
| 2 | Exfiltration of data through a tool call or an output | | | | | | |
| 3 | Unauthorised or excessive action (confused deputy) | | | | | | |
| 4 | Permission leakage in retrieval, cache or memory | | | | | | |
| 5 | Compromised credential or tool server | | | | | | |
| 6 | Denial of wallet (loops, abuse, huge inputs) | | | | | | |
| 7 | Poisoned data or index | | | | | | |
| 8 | Harmful or non-compliant output | | | | | | |

## 5. Controls checklist
- [ ] Per-agent identity, default-deny tool policy, gateway as the only path
- [ ] Read and write tools separated; approval on risky writes
- [ ] Screening on inputs, outputs and tool results
- [ ] Limits: steps, tokens, wall time, per-user rate
- [ ] Audit log of user, agent, tool, arguments, decision
- [ ] Adversarial cases in the eval set; red-team run date: <>

## 6. Residual risk and acceptance
Risks accepted, by whom, until when:`
},
{
  id: 'evaluation-report', title: 'Evaluation report',
  short: 'The record of one evaluation round: dataset, candidates, results by slice, failures, gates and the decision.',
  when: 'For every release candidate and every model, prompt or retrieval change that could move quality.',
  who: 'Engineer who ran the evals writes; quality lead reviews.',
  related: ['ap-evals'], see: ['p:evaluation-lifecycle', 'd:scorecard', 'd:evaluation'],
  body: `# Evaluation report: <release or change>

Date: <yyyy-mm-dd>   Author: <name>   Baseline: <version>   Candidate: <version>

## 1. What changed
Prompt / tools / model / retrieval / index / code (link to the manifest):

## 2. Datasets
| Set | Cases | Last refreshed | Notes |
|---|---|---|---|
| Golden (held out) | | | |
| Adversarial | | | |
| Multi-turn simulations | | | |
| Retrieval | | | |

Judge model and version: <>   Agreement with human labels on <n> cases: <%>

## 3. Results
| Metric | Gate | Baseline | Candidate | Delta | Pass |
|---|---|---|---|---|---|
| Task success | | | | | |
| Groundedness | | | | | |
| Retrieval recall at k | | | | | |
| Tool correctness | | | | | |
| Attack success rate | | | | | |
| p95 latency | | | | | |
| Cost per successful task | | | | | |

Noise band at <n> cases: about +-<x> points. Runs repeated: <n>.

## 4. By slice
Topics, risk levels or tools where the candidate is worse than the average:

## 5. Failures reviewed
| Case | What went wrong | Category | Action |
|---|---|---|---|

New regression cases added: <n>

## 6. Decision
Ship / ship with conditions / hold. Waivers (owner, expiry):`
},
{
  id: 'launch-go-no-go', title: 'Production launch Go/No-Go',
  short: 'The final gate before production: quality, safety, reliability, cost, compliance and operations, each with an owner and a verdict.',
  when: 'The week before launch, and before widening a pilot to a new tenant or region.',
  who: 'Engineering manager chairs; product, security, operations and finance each give a verdict.',
  related: ['cloud-monitoring', 'quotas'], see: ['p:agentops', 'p:platform-engineering', 'p:incident-runbooks', 'p:compliance-matrix'],
  body: `# Go/No-Go: <system and release>

Date: <yyyy-mm-dd>   Chair: <name>   Launch window: <>

| Area | Criterion | Evidence | Owner | Verdict (Go / No-go / Waiver) |
|---|---|---|---|---|
| Quality | Release gates met on the held-out set (evaluation report linked) | | | |
| Quality | Weakest slice above its floor | | | |
| Safety | Adversarial set passes; no open high-severity finding | | | |
| Security | Threat model reviewed; tools registered; direct access blocked (tested) | | | |
| Privacy and compliance | Residency, keys, perimeter and audit evidence confirmed | | | |
| Data | Freshness objectives met; deletion tested; permissions tested | | | |
| Reliability | Load test at 2x expected peak; quotas raised and confirmed | | | |
| Reliability | Fallback model or region tested; recovery objectives met | | | |
| Release | Canary plan, rollback criteria and rehearsed rollback | | | |
| Operations | Dashboards, alerts and runbooks in place; on-call trained | | | |
| Cost | Cost per successful task within budget at expected and 10x volume; budget alerts set | | | |
| People | Support, escalation and user communication ready | | | |

## Open risks and waivers
| Risk or waiver | Owner | Expires |
|---|---|---|

## Decision
Go / Go with conditions / No-go. Conditions:

Signed: product ___ engineering ___ security ___ operations ___ finance ___`
},
{
  id: 'slo-runbook', title: 'SLO and incident runbook',
  short: 'Service-level objectives for one system, with the runbook an on-call engineer follows when one is at risk.',
  when: 'When a system gets its first on-call rotation, and at every quarterly review.',
  who: 'Service owner and on-call lead.',
  related: ['cloud-monitoring', 'quotas'], see: ['p:agentops', 'p:incident-runbooks', 't:post-incident-review'],
  body: `# SLOs and runbook: <system>

Owner: <team>   On-call rota: <link>   Escalation: <name, channel>   Last reviewed: <yyyy-mm-dd>

## 1. Service-level objectives
| Objective | Indicator and how measured | Target | Window | Error budget | Alert |
|---|---|---|---|---|---|
| Availability | | | 30 d | | burn-rate |
| Latency (p95) | | | 7 d | | |
| Task success (sampled) | | | 7 d | | |
| Groundedness | | | 7 d | | |
| Index freshness (tier 1) | | | continuous | | |
| Cost per successful task | | | weekly | | |

If the budget is spent: <freeze releases / reliability work first>

## 2. Dashboards
Health: <link>   Quality: <link>   Cost: <link>   Release: <link>

## 3. Kill switches
- Disable agent: <how>
- Disable tool: <how>
- Fallback model / region: <how>
- Pin last good prompt and index: <how>
- Read-only mode for write tools: <how>

## 4. First 15 minutes
1. Acknowledge the page; name an incident lead.
2. Check dashboards and recent releases (release markers).
3. Stabilise: use a kill switch or roll back before diagnosing.
4. Post a status update.
5. Escalate if data exposure or an unapproved write is possible.

## 5. Runbooks
| Scenario | Link |
|---|---|
| Model or agent outage | |
| Quota exhaustion and 429s | |
| Runaway loop or token spend | |
| Prompt injection or malicious tool output | |
| RAG permission leakage | |
| Stale or wrongly indexed documents | |
| Poor retrieval after a data refresh | |
| Failed release | |

## 6. Contacts
Product: <> Security: <> Data owners: <> Vendor support: <>`
},
{
  id: 'post-incident-review', title: 'Post-incident review',
  short: 'A blameless record of what happened, why, how it was handled and what changes so it does not repeat.',
  when: 'Within five working days of any severity 1 or 2 incident, and for near misses that exposed a gap.',
  who: 'Incident lead writes; everyone involved reviews; the engineering manager tracks actions.',
  related: ['cloud-monitoring', 'audit-logs'], see: ['p:incident-runbooks', 'p:agentops', 't:slo-runbook'],
  body: `# Post-incident review: <title>

Incident id: <>   Date: <yyyy-mm-dd>   Severity: <1-4>   Lead: <name>   Status: draft | final

## Summary
Two or three sentences: what happened, who was affected, for how long.

## Impact
- Users and tenants affected:
- Duration (detected / mitigated / resolved):
- Data exposure or unapproved actions: yes / no (details):
- Cost impact:
- Error budget consumed:

## Timeline (UTC)
| Time | Event | Source |
|---|---|---|

## Root cause and contributing factors
- Trigger:
- Underlying cause:
- Why existing tests, evals or alerts did not catch it:
- Why it was or was not contained quickly:

## What went well / what went badly / where we got lucky

## Actions
| # | Action | Type (prevent / detect / mitigate / process) | Owner | Due | Done |
|---|---|---|---|---|---|

Each failing input added as a regression case to the eval set: yes / no
Runbook updated: yes / no

## Lessons
What we would tell a new on-call engineer:`
},
{
  id: 'cost-optimisation-review', title: 'Cost optimisation review',
  short: 'A monthly review of where the AI spend goes, which levers apply, and what each would risk.',
  when: 'Monthly for production systems, and whenever cost per successful task moves by more than 10 percent.',
  who: 'Engineering manager with the tech lead; finance attends quarterly.',
  related: ['billing', 'quotas'], see: ['d:finops', 'd:cost-levers', 'p:agentops'],
  body: `# Cost review: <system>   Period: <month>

## 1. Headline
| Measure | Last period | This period | Budget |
|---|---|---|---|
| Tasks | | | |
| Success rate | | | |
| Total spend | | | |
| Cost per task | | | |
| **Cost per successful task** | | | |

## 2. Where the money went
| Component | Spend | Share | Change |
|---|---|---|---|
| Model input tokens | | | |
| Model output and reasoning tokens | | | |
| Embeddings and reranking | | | |
| Vector and search | | | |
| Runtime and tools | | | |
| Observability and storage | | | |
| Evaluation and test environments | | | |

By agent: <> By tenant: <> Retries and failed runs: <$ and %>

## 3. Levers considered
| Lever | Estimated saving | Quality risk | Evidence needed | Decision |
|---|---|---|---|---|
| Prompt and context trimming | | | | |
| Prompt caching | | | | |
| Semantic or retrieval cache | | | | |
| Model routing to a smaller model | | | | |
| Batch for work that can wait | | | | |
| Fewer calls per task (merge steps) | | | | |
| Retrieval depth and chunk size | | | | |
| Idle environments and indexes | | | | |

## 4. Anomalies
Loops, spikes, forgotten resources:

## 5. Forecast
Next quarter at expected volume: <$>   At 10x: <$>   Quota and commitment decisions:

## 6. Actions
| Action | Owner | Due | Eval re-run needed |
|---|---|---|---|`
},
{
  id: 'tech-debt-backlog', title: 'Technical debt and improvement backlog',
  short: 'A ranked list of the debt that threatens quality, reliability or speed in an AI system, with cost of delay.',
  when: 'Quarterly planning, and after an incident that exposed a structural weakness.',
  who: 'Tech lead owns the list; engineering manager ranks it with product.',
  related: ['infra-manager'], see: ['p:platform-engineering', 'a:agent-cicd', 'p:data-lifecycle'],
  body: `# Technical debt and improvement backlog: <system>   Quarter: <>

Ranking rule: impact on users or risk x likelihood, divided by effort. Re-rank each quarter.

| # | Item | Category | Impact if ignored | Effort (S/M/L) | Cost of delay | Owner | Target quarter |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |

Categories to look at:
- Evaluation: stale golden set, no held-out set, uncalibrated judge, no online evals
- Release: prompts edited outside version control, no canary, rollback not rehearsed
- Data: manual ingestion, no deletion propagation, no freshness alerts, mixed embedding models
- Retrieval: no baseline comparison, chunking never revisited, permissions applied after retrieval
- Agents: shared service accounts, tools without schemas or owners, no step and token limits
- Platform: infrastructure created by hand, long-lived keys, no drift detection, no staging parity
- Observability: no release markers, missing cost attribution, noisy alerts
- Cost: no budget alerts, idle environments, no routing or caching
- Documentation and skills: no runbooks, single points of knowledge

## Decisions this quarter
Items accepted, deferred (with reason) and dropped:

## Capacity
Share of team time reserved for debt this quarter: <%>`
}
];
