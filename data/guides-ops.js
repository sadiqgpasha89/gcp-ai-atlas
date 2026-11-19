/* Operate and respond guides: AgentOps, incident runbooks, evaluation lifecycle. */
window.ATLAS.guides.push({
  id: 'agentops', group: 'operate', title: 'AgentOps: run and measure agent systems',
  short: 'The metrics, service-level objectives, dashboards and alerts that tell you whether an agent system is healthy, good and affordable.',
  when: 'An agent or RAG system is in or near production and the only signals you have are CPU graphs and user complaints. Use it to design the dashboard before the launch review.',
  blocks: [
    { t: 'h2', text: 'Three questions, three dashboards' },
    { t: 'p', text: 'Every metric should help answer one of three questions. If it answers none, drop it.' },
    { t: 'cards', items: [
      { tag: 'Healthy?', title: 'Is it up and fast?', text: 'Availability, latency, error rate, throttling, queue depth. Answered by service-level indicators and alerts. Owner: on-call engineer.' },
      { tag: 'Good?', title: 'Is the output right?', text: 'Task success, groundedness, retrieval quality, tool correctness, user feedback. Answered by evals and sampling. Owner: product and quality lead.' },
      { tag: 'Affordable?', title: 'Does it pay for itself?', text: 'Cost per successful task, tokens per task, retry waste, cache hit rate. Answered by billing export joined to traces. Owner: engineering manager.' }
    ] },
    { t: 'h2', text: 'Metric dimensions' },
    { t: 'table', cols: ['Dimension', 'Examples', 'Where the data comes from', 'Watch for'], rows: [
      ['**Business outcome**', 'Task completion rate, deflection or resolution rate, time saved, escalations to a human, revenue or cost impact', 'Product events, ticketing system, a join to your own outcome data', 'Vanity metrics: sessions and messages say nothing about outcomes.'],
      ['**Answer quality**', 'Groundedness, factual accuracy, helpfulness score, refusal correctness, hallucination rate on a sampled set', 'Online evaluators on sampled traces ([[ap-evals|Agent Platform Evals]]), human review of a weekly sample, thumbs and edits', 'Judge drift: re-calibrate automated judges against human labels.'],
      ['**Retrieval**', 'Recall at k on a golden set, empty-result rate, share of answers citing a source, source freshness, permission-filter hit rate', 'Retrieval logs, scheduled eval runs, index metadata', 'Quality dropping after an index refresh or a chunking change.'],
      ['**Agent execution**', 'Steps per task, tool calls per task, tool error rate, wrong-tool rate, loop-limit hits, handoffs between agents, approval rate and rejection rate', 'Traces ([[cloud-monitoring|Cloud Trace]]), tool logs, gateway logs', 'Rising steps per task is the first sign of a prompt or tool regression.'],
      ['**Latency**', 'Time to first token, end-to-end p50 and p95, per-step breakdown (retrieval, model, tool)', 'Traces; load balancer and gateway metrics', 'A p50 that looks fine while p95 breaks the experience.'],
      ['**Reliability**', 'Success rate of runs, model errors, 429s and quota rejections, timeouts, retries, dead-letter volume', 'Cloud Monitoring, model API metrics, [[quotas]] dashboards', 'Retries hiding a failing dependency until the bill arrives.'],
      ['**Cost**', 'Input, output and reasoning tokens per task, cost per task and per **successful** task, cache hit rate, embedding and index spend, idle capacity', 'Billing export to [[bigquery|BigQuery]] ([[billing]]), token counts in traces', 'Failed and retried runs being excluded from the denominator.'],
      ['**User experience**', 'Thumbs up/down rate, edit distance from agent draft to final, abandonment, re-ask rate, time to resolution', 'Product telemetry', 'Low feedback volume read as satisfaction.']
    ] },

    { t: 'h2', text: 'Service-level objectives to start with' },
    { t: 'p', text: 'Pick a few and review them monthly. An objective is a promise you will act on: when the error budget burns, the team stops shipping features and fixes reliability.' },
    { t: 'table', cols: ['Objective', 'Indicator', 'Example target', 'Window', 'If it burns'], rows: [
      ['Availability', 'Share of requests that return a non-error answer within the timeout', '99.5 percent', '30 days', 'Freeze releases; check dependencies and quotas first.'],
      ['Latency', 'p95 end-to-end time for the main task', 'Under 8 seconds interactive; under 2 minutes for long tasks', '7 days', 'Look at the per-step trace for the slow step; consider streaming or a smaller model for it.'],
      ['Task success', 'Share of sampled tasks judged correct and complete', '90 percent on the golden set; 85 percent on live samples', '7 days', 'Roll back the last prompt, model or index change ([[p:evaluation-lifecycle|evaluation lifecycle]]).'],
      ['Groundedness', 'Share of answers whose claims are supported by cited sources', '95 percent', '7 days', 'Check retrieval first, then the prompt; see runbook R6.'],
      ['Tool correctness', 'Share of tool calls with the right tool and valid arguments', '97 percent', '7 days', 'Review tool descriptions and schemas; add examples.'],
      ['Index freshness', 'Age of the newest unindexed change in a source', 'Under 4 hours for tier-1 sources', 'Continuous', 'Run the reconciliation job; see [[p:data-lifecycle|data lifecycle]].'],
      ['Cost', 'Cost per successful task', 'Under the budget agreed at launch', 'Weekly', 'Check retries, loop-limit hits, and model routing before negotiating the budget.']
    ], note: 'The numbers are examples to show the shape. Set targets from your baseline and what users will tolerate, not from this table.' },

    { t: 'h2', text: 'What to log on every run' },
    { t: 'ul', items: [
      '**Identifiers:** trace id, session id, user (pseudonymous), agent and version, prompt version, model and version, index version.',
      '**Per model call:** input, output and reasoning token counts, latency, finish reason, safety-filter result, cache hit.',
      '**Per tool call:** tool name, argument shape (redact values that are sensitive), status, latency, retries, policy decision.',
      '**Per retrieval:** query, rewritten query, filters applied, document ids and scores returned, which were cited.',
      '**Outcome:** task result, approval decisions, user feedback, human edits.',
      'Sensitive content needs a retention and redaction decision up front ([[sdp|Sensitive Data Protection]]). Store ids and hashes by default; keep full text only where you need it and can protect it.'
    ] },

    { t: 'h2', text: 'Dashboards' },
    { t: 'table', cols: ['Dashboard', 'Audience', 'Contents'], rows: [
      ['**Service health**', 'On-call', 'Availability, latency by step, error rate by type, 429s, queue depth, active incidents, error-budget burn'],
      ['**Quality**', 'Product and quality lead', 'Task success and groundedness trend, retrieval recall, failing eval cases, feedback, top failure categories, release markers on every chart'],
      ['**Cost**', 'Engineering manager and finance', 'Cost per successful task, by agent and by tenant; token mix; retry waste; cache hit rate; forecast versus budget'],
      ['**Release**', 'Release owner', 'Canary versus baseline on success, latency, cost and safety; eval gate status; rollback readiness']
    ] },
    { t: 'callout', title: 'Always chart a release marker', text: 'Quality and cost regressions almost always follow a change to a prompt, tool, model, index or data source. If the dashboard cannot show **what changed when**, root-cause analysis becomes guesswork.' },

    { t: 'h2', text: 'Alert design' },
    { t: 'table', cols: ['Alert on', 'Why', 'Route to', 'Avoid'], rows: [
      ['Error-budget **burn rate** for availability and latency', 'Pages only when the objective is truly at risk, fast burn and slow burn windows', 'On-call (page)', 'Alerting on every 5xx or single slow request'],
      ['**Quota** use above 70 and 90 percent, and any 429 spike', 'Throttling is the most common production failure for model-backed systems ([[quotas]])', 'On-call; capacity owner', 'Finding out from users'],
      ['**Loop or step-limit hits**, token use per task above 3x baseline', 'A runaway agent burns money fast (runbook R3)', 'On-call; auto-stop rule', 'Waiting for the billing alert'],
      ['**Safety**: injection or policy-block rate spike; sensitive data in outputs', 'Early sign of an attack or a leaking source (R4, R5)', 'Security on-call', 'Mixing with performance noise'],
      ['**Quality** drop on the live sample or the scheduled eval run', 'Catches silent regressions', 'Quality lead (ticket, not page)', 'Paging on a noisy judge score'],
      ['**Freshness** breach on tier-1 sources', 'Stale answers are wrong answers (R6)', 'Data owner', 'Treating it as an infra alert'],
      ['**Spend** forecast over budget', 'Cost is a reliability concern', 'Engineering manager', 'Monthly surprise']
    ] },
    { t: 'h2', text: 'Operating rhythm' },
    { t: 'steps', items: [
      ['Daily', 'On-call checks the health dashboard and open alerts. Triage failing eval cases.'],
      ['Weekly', 'Quality review: read 20 to 50 sampled traces, tag failures, add confirmed failures to the eval set. Cost review: top agents and tenants by cost per task.'],
      ['Monthly', 'SLO review: attainment, budget burn, whether targets still fit. Decide what to fix versus what to accept.'],
      ['Quarterly', 'Re-run the full evaluation suite, re-attest tools and agents ([[p:agent-governance-guide|governance]]), and rehearse a runbook.']
    ] }
  ],
  src: [
    ['Cloud Monitoring documentation', 'https://docs.cloud.google.com/monitoring/docs'],
    ['Agent evaluation on Agent Platform', 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/optimize/evaluation/agent-evaluation'],
    ['Google SRE book: service level objectives', 'https://sre.google/sre-book/service-level-objectives/']
  ],
  related: ['cloud-monitoring', 'ap-evals', 'billing', 'bigquery', 'quotas', 'audit-logs', 'agent-runtime'],
  see: ['p:incident-runbooks', 'p:evaluation-lifecycle', 'd:evaluation', 'd:cost-levers', 't:slo-runbook']
});

window.ATLAS.guides.push({
  id: 'incident-runbooks', group: 'operate', title: 'Incident runbooks for agent and RAG systems',
  short: 'Eight runbooks for the failures that actually happen: outages, throttling, runaway loops, injection, permission leaks, stale data, bad retrieval and bad releases.',
  when: 'You are on call for an agent or RAG system, or you are writing the on-call guide. Print the one that matches the page, then follow it.',
  blocks: [
    { t: 'h2', text: 'Before any runbook' },
    { t: 'ul', items: [
      '**Stabilise first, diagnose second.** Stop the damage (disable the tool, switch the model, roll back), then find the cause.',
      '**Have the kill switches before you need them:** per-agent disable flag, per-tool disable, a fallback model, a way to pin the last good prompt and index version, and a read-only mode for write tools.',
      '**Severity:** treat anything involving data exposure or an unapproved write as the highest severity, regardless of volume.',
      '**Communicate early.** Name an incident lead, post a status, and keep a timeline. Use the [[t:post-incident-review|post-incident review template]] afterwards.'
    ] },
    { t: 'h2', text: 'The runbooks' },
    { t: 'runbook', id: 'R1', title: 'Model or agent outage', trigger: 'Error rate or timeouts above the objective; model API returns 5xx or unavailable',
      symptoms: ['Spike in 5xx or deadline-exceeded from the model or the agent runtime.', 'Users see generic failures or hung requests.', 'The provider status page or the Google Cloud service health page shows an incident, or it does not and only you are affected.'],
      triage: ['Is it one model, one region, one agent, or everything? Compare per-model and per-region error rates.', 'Check service health for the model and runtime, and recent changes (release marker).', 'Check quota and capacity: an exhausted quota looks like an outage (go to R2 if 429s dominate).'],
      mitigate: ['Fail over to the fallback model or the second region if you have one ([[d:capacity-strategy|capacity strategy]]).', 'Degrade gracefully: switch to a smaller model, to retrieval-only answers, or to a queued asynchronous mode.', 'If the agent runtime is the failing part, route to the last known good revision.', 'Shorten timeouts and cap retries so a slow dependency does not exhaust workers.'],
      root: ['Which component failed first in the trace? Was there a deploy, a quota change, a dependency outage?', 'Did retries amplify the failure?', 'Was the fallback path tested? Did it work?'],
      prevent: 'Run a fallback model and a second region for tier-1 flows, test failover quarterly, and alert on error-budget burn rather than single errors.' },
    { t: 'runbook', id: 'R2', title: 'Quota exhaustion and 429s', trigger: 'Rising 429 or resource-exhausted errors; throughput flat while demand rises',
      symptoms: ['429 or "resource exhausted" from model endpoints, embedding calls or vector queries.', 'Latency climbs then errors, often in bursts at peak hours or after a batch job starts.', 'One tenant or one job consuming most of the quota.'],
      triage: ['Find which quota (per project, per region, per model, per minute) is hit in the Quotas page ([[quotas]]).', 'Identify the top consumer by agent, tenant and job. Is a batch or backfill running?', 'Check whether retries are multiplying load.'],
      mitigate: ['Pause or throttle the batch consumer first, so interactive traffic recovers.', 'Add exponential backoff with jitter; cap total retries; shed low-priority work.', 'Request a quota increase or move steady traffic to Provisioned Throughput ([[d:capacity-strategy|capacity strategy]]).', 'Spread load across regions where residency allows ([[p:compliance-matrix|compliance matrix]]).'],
      root: ['Was the quota sized for the forecast? When was it last reviewed?', 'Did a code change increase calls per task (more steps, bigger context)?', 'Is there per-tenant fairness, or can one tenant starve others?'],
      prevent: 'Alert at 70 and 90 percent of quota, schedule batch jobs off-peak, add per-tenant rate limits, and review quota quarterly against forecast.' },
    { t: 'runbook', id: 'R3', title: 'Runaway loops and token consumption', trigger: 'Tokens or cost per task far above baseline; steps per task rising; spend alert',
      symptoms: ['Cost alert or sudden token spike from one agent or session.', 'Traces with dozens of steps, repeated identical tool calls, or agents delegating back and forth.', 'Runs hitting the step limit or timing out.'],
      triage: ['Find the sessions with the highest token use in the last hour and open their traces.', 'Is it one user input that triggers a loop, or a change that affects many?', 'Check the last release: prompt, tool description, model change, a tool now returning unexpected output.'],
      mitigate: ['Disable the agent or the offending tool with the kill switch; cancel in-flight sessions.', 'Lower the maximum steps, per-run token budget and per-user rate limit.', 'Roll back the last prompt or tool change.', 'Add an identical-call detector that stops a run after the same call repeats.'],
      root: ['What stopped the agent from deciding it was done: ambiguous goal, a tool that never returns success, a refusal loop?', 'Did a tool start returning errors that the agent keeps retrying?', 'Why did the budget and step limits not stop it earlier?'],
      prevent: 'Hard limits on steps, tokens and wall time per run; spend alerts on forecast, not just actuals; regression tests for the triggering input in the eval set.' },
    { t: 'runbook', id: 'R4', title: 'Prompt injection or malicious tool output', trigger: 'Agent follows instructions that came from retrieved content or a tool; unexpected tool call or data leak',
      symptoms: ['The agent calls a tool the user never asked for, or sends data to an unexpected destination.', 'Model Armor or gateway logs show injection detections.', 'A document, web page or tool result contains instruction-like text.'],
      triage: ['Treat as a security incident. Page security on-call.', 'From the trace, find the first step where untrusted content entered the context, and the first action it caused.', 'Establish what was read or sent, and under whose identity ([[p:agent-governance-guide|audit trail]]).'],
      mitigate: ['Disable the affected tool or switch the agent to read-only; block the source (document, domain, MCP server) in the registry or gateway.', 'Revoke credentials the agent held if data may have left; rotate secrets.', 'Remove the poisoned document from the index and re-run the retrieval cache.', 'Tighten screening on tool results and add an approval gate to the action that was abused.'],
      root: ['How did the content get in: user upload, a shared drive, a web fetch, a third-party tool?', 'Why did policy allow the call: over-broad tool, missing approval, missing egress rule?', 'Is the same pattern present in other agents?'],
      prevent: 'Treat all retrieved and tool-returned text as untrusted. Separate read and write tools, require approval for sensitive writes, restrict egress to the gateway, and add adversarial cases to the eval set ([[p:evaluation-lifecycle|evaluation lifecycle]]).' },
    { t: 'runbook', id: 'R5', title: 'RAG permission leakage', trigger: 'A user saw or was cited content they should not have access to',
      symptoms: ['A report, a complaint or a red-team finding: an answer revealed restricted content.', 'Answers cite documents outside the user\'s group or tenant.', 'Permission-filter hit rate drops or is zero for some sources.'],
      triage: ['Highest severity. Stop the exposure: disable retrieval from the affected source or the whole agent.', 'Reproduce with a test user: same query, check which chunks and ACLs came back.', 'Check whether the ACL metadata is missing, wrong, or not applied in the query filter.'],
      mitigate: ['Switch the agent to answer from only unrestricted sources, or take it offline.', 'Re-apply ACLs in the index and re-run the sync; delete mis-permissioned chunks.', 'Purge caches that may hold restricted answers, including semantic caches.', 'Notify the data owner and security; start the disclosure process if policy requires it.'],
      root: ['Were ACLs extracted at ingestion and refreshed when permissions changed?', 'Is filtering done in the retrieval query, or only after, in the prompt?', 'Did a shared index mix tenants ([[d:tenancy|tenancy decision]])?', 'Did a cache, a memory store or a summary copy restricted text?'],
      prevent: 'Enforce permissions in the retrieval filter using identity from the request, never from the prompt. Test with users in different groups on every release, and re-sync ACLs on permission change.' },
    { t: 'runbook', id: 'R6', title: 'Stale or wrongly indexed documents', trigger: 'Answers cite outdated or deleted content; freshness breach; sources missing from the index',
      symptoms: ['Users report old policy, price or procedure.', 'Freshness metric breaches the objective.', 'Deleted documents still appear; new documents are not found.'],
      triage: ['Compare the source system with the index for a sample: counts, last-modified, deletions.', 'Check the ingestion pipeline: failed runs, a stuck cursor, skipped file types, permission errors.', 'Check whether updates are replacing old chunks or adding duplicates.'],
      mitigate: ['Trigger an incremental sync for the affected source; run a full reconciliation if counts disagree.', 'Delete tombstoned or duplicate chunks.', 'Add a visible "last updated" in answers where staleness is risky, or refuse for affected topics until fixed.'],
      root: ['Why did change detection miss it: no event, a polling gap, a renamed file, a parser failure?', 'Do deletions propagate?', 'Is there a freshness alert for this source?'],
      prevent: 'Per-source freshness objectives, deletion propagation tests, and a scheduled reconciliation that compares source and index ([[p:data-lifecycle|data lifecycle]]).' },
    { t: 'runbook', id: 'R7', title: 'Poor retrieval after a data refresh', trigger: 'Recall or groundedness drops after a re-index, new embedding model, or chunking change',
      symptoms: ['Golden-set recall at k falls; empty or irrelevant results rise.', 'Groundedness drops without a model or prompt change.', 'The drop lines up with an index rebuild or new source.'],
      triage: ['Overlay the quality chart with release markers: was the index, embedding model, chunker or parser changed?', 'Run the retrieval eval on the old and new index side by side.', 'Check mixed embedding models in one index, changed dimensions, or a parser that now drops tables or headers.'],
      mitigate: ['Point the agent back at the previous index version (keep the last good one for at least a week).', 'Pause the refresh job; do not delete the old index.', 'If only one source regressed, exclude it until fixed.'],
      root: ['What differed in chunk size, overlap, metadata or parser output? Look at ten chunks by eye.', 'Was the eval run on the new index before cutover? If not, why was that allowed?', 'Did document structure (tables, scanned pages) parse differently?'],
      prevent: 'Build the new index beside the old, run retrieval evals against both, and cut over only when the new one passes the release gate ([[a:agent-cicd|CI/CD architecture]]).' },
    { t: 'runbook', id: 'R8', title: 'Failed prompt, model or agent release', trigger: 'Canary or post-release metrics worse than baseline; user complaints after a deploy',
      symptoms: ['Success, groundedness or latency worse for the new version than the control.', 'Cost per task up, step counts up, new error types.', 'Complaints cluster after a release time.'],
      triage: ['Identify exactly what changed: prompt, tool, model version, retrieval setting, orchestration code.', 'Compare canary and baseline traces for the same inputs.', 'Check whether the model provider changed behaviour behind a stable name.'],
      mitigate: ['Roll back to the last good version (pinned prompt, config and model).', 'Stop the canary; hold the release train.', 'If rollback is not possible (a data migration), turn on a feature flag to the old path.'],
      root: ['Did the eval suite cover this case? If not, add it. If it did, why did the gate pass?', 'Was the canary big enough and long enough to see it?', 'Which one change caused it? Bisect the changes.'],
      prevent: 'Version everything that can change behaviour, gate release on evals, canary with automatic rollback criteria, and keep rollback rehearsed ([[a:agent-cicd|CI/CD architecture]]).' },
    { t: 'h2', text: 'After the incident' },
    { t: 'ul', items: [
      'Write the review within five working days using the [[t:post-incident-review|template]]. Blameless, specific, with owners and dates.',
      'Add the failing input as a regression case in the eval set before closing the action.',
      'Update the runbook with what you wished you had known. A runbook that has not changed after an incident was probably not read.'
    ] }
  ],
  src: [
    ['Google SRE book: managing incidents', 'https://sre.google/sre-book/managing-incidents/'],
    ['Google SRE book: postmortem culture', 'https://sre.google/sre-book/postmortem-culture/'],
    ['OWASP Top 10 for LLM applications', 'https://genai.owasp.org/llm-top-10/']
  ],
  related: ['quotas', 'model-armor', 'agent-governance', 'cloud-monitoring', 'agent-runtime', 'rag-engine', 'vector-search'],
  see: ['p:agentops', 'p:agent-governance-guide', 'p:data-lifecycle', 'a:agent-cicd', 't:post-incident-review']
});

window.ATLAS.guides.push({
  id: 'evaluation-lifecycle', group: 'operate', title: 'Evaluation lifecycle: from golden set to release gate',
  short: 'What to evaluate at each layer of an agent system, how to build the datasets, and which results should block a release.',
  when: 'You are deciding whether a change is good enough to ship, or designing the eval suite for a new system. Pair it with the [[d:scorecard|scorecard tool]] to compare candidates on one dataset.',
  blocks: [
    { t: 'h2', text: 'Evaluate each layer separately' },
    { t: 'p', text: 'One end-to-end score hides where the problem is. Score the layers separately, then score the whole. A system can retrieve perfectly and answer badly, or answer well from the wrong source.' },
    { t: 'table', cols: ['Layer', 'What you score', 'Typical metrics', 'Needs'], rows: [
      ['**Retrieval**', 'Did the right passages come back, and in rank order?', 'Recall at k, precision at k, MRR, empty-result rate, permission-filter correctness', 'Questions with labelled relevant documents'],
      ['**Model / answer**', 'Given the context, is the answer correct, complete, grounded and safe?', 'Correctness, groundedness (claims supported by cited text), completeness, tone, refusal correctness', 'Golden answers or rubrics; an LLM judge calibrated on human labels'],
      ['**Trajectory**', 'Did the agent take a sensible path?', 'Step count, redundant steps, loop hits, order of actions, handoffs, recovery after an error', 'Reference trajectories or rules'],
      ['**Tool use**', 'Right tool, right arguments, right time?', 'Tool-selection accuracy, argument validity, unnecessary calls, unsafe calls avoided', 'Expected tool calls per case'],
      ['**Multi-turn**', 'Does it keep context, handle corrections and not contradict itself?', 'Turn-level and conversation-level success, context retention, consistency', 'Scripted or simulated conversations'],
      ['**Adversarial and safety**', 'Does it resist injection, jailbreaks and data exfiltration?', 'Attack success rate, policy-block rate, sensitive data leakage', 'A red-team set; poisoned documents and tool outputs'],
      ['**End to end**', 'Did the user\'s task get done?', 'Task success, time and cost to completion, escalation rate', 'Realistic tasks with success criteria']
    ] },

    { t: 'h2', text: 'Building the datasets' },
    { t: 'steps', items: [
      ['1', '**Start from real traffic.** Pull anonymised queries from the pilot or from support logs. Cover the head (common questions) and the tail (rare, awkward, ambiguous).'],
      ['2', '**Write golden answers with domain experts,** not with the model. Record the source passage for each so retrieval can be scored too. Aim for 100 to 300 cases before launch; grow from incidents.'],
      ['3', '**Tag each case** by topic, difficulty, tool needed, and risk. Slices tell you where the average hides a failure.'],
      ['4', '**Add negative cases:** questions the system should refuse, questions with no answer in the corpus, and conflicting sources.'],
      ['5', '**Add adversarial cases:** injection strings in documents, tool outputs that give instructions, requests for other users\' data.'],
      ['6', '**Synthesise to widen coverage,** then review by a person. Generated questions from your documents are good for retrieval coverage and poor as the only source of truth.'],
      ['7', '**Freeze a held-out set** that nobody tunes against. Report on it for release decisions.'],
      ['8', '**Feed incidents back.** Every production failure becomes a regression case with the date and incident id.']
    ] },
    { t: 'h2', text: 'Judges and simulated users' },
    { t: 'two', left: { title: 'LLM judges', items: [
      'Fast and scalable, but biased: they favour longer answers and their own model family.',
      'Give the judge a rubric, the source passages and a score scale; ask for the reason before the score.',
      'Calibrate against 50 to 100 human-labelled cases and track agreement. Re-check when the judge model changes.',
      'Use a different model family from the one being judged when you can.'
    ] }, right: { title: 'Synthetic users', kind: 'ml', items: [
      'A model plays a user with a goal and a persona and talks to the agent for several turns.',
      'Good for multi-turn coverage, edge-case discovery and load of varied phrasing.',
      'Not a replacement for real users: it shares blind spots with the model. Keep a human-reviewed slice.',
      'Log the full conversation and the end state so the run is reproducible.'
    ] } },
    { t: 'h2', text: 'Offline, then online' },
    { t: 'table', cols: ['Stage', 'When', 'What runs', 'Decision it supports'], rows: [
      ['**Offline, pre-merge**', 'Every change to prompt, tool, retrieval or orchestration', 'Smoke subset (fast, a few minutes) of the golden set', 'Merge or fix'],
      ['**Offline, pre-release**', 'Release candidate', 'Full golden set, adversarial set, multi-turn simulations, cost and latency on a replayed sample', 'Ship, hold or roll back; compare candidates on the same data ([[d:scorecard|scorecard]])'],
      ['**Shadow**', 'Before exposure', 'New version receives a copy of live traffic; outputs are scored but not shown', 'Does it behave on real inputs?'],
      ['**Canary / A-B**', 'Gradual exposure', 'A small share of traffic on the new version, compared with the control on success, latency, cost, safety and feedback', 'Widen or stop'],
      ['**Online monitoring**', 'Always', 'Sampled live traces scored by evaluators and humans ([[p:agentops|AgentOps]])', 'Detect drift and silent regressions']
    ], note: 'Run the same evaluators offline and online so the numbers are comparable. [[ap-evals|Agent Platform Evals]] supports offline and online evaluation of agents.' },

    { t: 'h2', text: 'Release-blocking thresholds' },
    { t: 'p', text: 'A release gate is a rule written down in advance: "do not ship if". Without it, every regression gets argued case by case. Gate on the held-out set, compare to the current production version, and require a margin for noisy metrics.' },
    { t: 'table', cols: ['Gate', 'Example rule', 'Why'], rows: [
      ['Task success', 'No lower than production on the held-out set, and above the absolute floor (for example 90 percent)', 'Never ship a worse system, never ship one below the bar'],
      ['Groundedness', 'At or above the floor (for example 95 percent); no regression on high-risk slices', 'Unsupported claims are the costly error'],
      ['Retrieval recall at k', 'No drop larger than 2 points against the current index', 'Catches embedding, chunking and parser changes'],
      ['Tool correctness', 'No unsafe tool calls in the adversarial set; selection accuracy above the floor', 'A single unsafe action is a blocker'],
      ['Safety and injection', 'Attack success rate zero on the critical set; no new sensitive-data leaks', 'Hard stop'],
      ['Latency', 'p95 within the objective on a replayed sample', 'Quality bought with unusable latency is not a win'],
      ['Cost', 'Cost per successful task within 10 percent of production, or the increase approved', 'Prevents silent cost creep']
    ], note: 'Floors and margins are examples. Set them from your baseline. Review them each quarter, and record any waiver with an owner and an expiry.' },

    { t: 'h2', text: 'Common ways evaluation goes wrong' },
    { t: 'ul', items: [
      '**Tuning on the test set.** Prompts get fitted to the cases you look at. Keep a held-out set.',
      '**One average.** Report by slice; a 92 percent mean can hide a 60 percent score on the riskiest topic.',
      '**Uncalibrated judges** treated as ground truth.',
      '**Evaluating only the final answer,** so a retrieval regression shows up weeks later as "the model got worse".',
      '**No variance estimate.** Run non-deterministic systems several times; a one-point change inside the noise is not a result.',
      '**Stale data.** The corpus and the questions change; schedule a refresh of the golden set.'
    ] }
  ],
  src: [
    ['Agent evaluation on Agent Platform', 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/optimize/evaluation/agent-evaluation'],
    ['OWASP Top 10 for LLM applications', 'https://genai.owasp.org/llm-top-10/']
  ],
  related: ['ap-evals', 'gemini', 'rag-engine', 'vector-search', 'agent-runtime', 'adk'],
  see: ['p:agentops', 'p:incident-runbooks', 'a:agent-cicd', 'a:agentic-rag', 'd:evaluation', 't:evaluation-report']
});
