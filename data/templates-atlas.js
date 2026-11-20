/* Additional copy-ready templates (plan tasks SEC-09, MGR-03). Appended to ATLAS.toolkit.templates.
   Each template: id, title, badge, desc, markdown. These are Atlas templates, not official Google documents. */
(function () {
  var add = [
  {
    "id": "ai-inventory",
    "title": "9. AI System and Agent Inventory",
    "badge": "Governance Template",
    "desc": "One register of every AI system and agent: owner, purpose, data, tools, autonomy level and review date.",
    "markdown": "# AI System and Agent Inventory\n\nKeep one row per system or agent. Review at least [every N months] and on any change in scope, data, tools or autonomy.\n\n| Field | Entry |\n|---|---|\n| System or agent name | |\n| Business owner (accountable) | |\n| Technical owner | |\n| Purpose and users | |\n| Lifecycle stage (prototype, pilot, production, retired) | |\n| Models and versions used | |\n| Data sources and classification | |\n| Contains personal data? (yes/no, which) | |\n| Tools and external systems it can call | |\n| Autonomy level (L0 to L5, Atlas framework) and who approved it | |\n| Human oversight and approval points | |\n| Identities used (workload, agent, tool) | |\n| Evaluation set and latest result (dataset version, date) | |\n| Known limitations | |\n| Applicable obligations (confirm with legal) | |\n| Incident contact | |\n| Last reviewed (YYYY-MM-DD) and by whom | |\n"
  },
  {
    "id": "system-card",
    "title": "10. System Card",
    "badge": "Governance Template",
    "desc": "A plain-language description of what a system does, how it was evaluated and where it should not be used.",
    "markdown": "# System Card: [System name]\n\n**Version:** [x.y]  |  **Owner:** [name]  |  **Date:** [YYYY-MM-DD]\n\n## 1. Intended use\n- Who uses it and for what:\n- Out-of-scope uses (where it must not be used):\n\n## 2. How it works\n- Components (model, retrieval, tools, agents) and versions:\n- Data sources:\n- Autonomy level and approval points:\n\n## 3. Evaluation\n- Datasets used (name, version, size, how built) and their limitations:\n- Results (metric, value, number of cases) and the baseline compared against:\n- What was not evaluated:\n\n## 4. Risks and mitigations\n| Risk | Mitigation | Residual risk | Owner |\n|---|---|---|---|\n\n## 5. Monitoring and change control\n- What is monitored, who is alerted:\n- What changes require re-evaluation:\n\n## 6. Contact and feedback\n"
  },
  {
    "id": "risk-assessment",
    "title": "11. AI Risk Assessment",
    "badge": "Governance Template",
    "desc": "Score and track risks for an AI system across security, data, model, agent, vendor, reliability, cost and operations.",
    "markdown": "# AI Risk Assessment: [System name]\n\n**Assessor:** [name]  |  **Date:** [YYYY-MM-DD]  |  **Next review:** [YYYY-MM-DD]\n\nScore likelihood and impact on your organisation's own scale: [define the scale here].\n\n| ID | Category | Risk | Likelihood | Impact | Controls in place | Residual risk | Owner | Decision (accept / mitigate / avoid / transfer) | Due |\n|---|---|---|---|---|---|---|---|---|---|\n| R1 | Security | Indirect prompt injection through retrieved content | | | | | | | |\n| R2 | Security | Excessive agency: tool or agent can do more than intended | | | | | | | |\n| R3 | Data | Cross-tenant or cross-user leakage | | | | | | | |\n| R4 | Data | Stale or deleted content still served | | | | | | | |\n| R5 | Model | Quality regression after a model or prompt change | | | | | | | |\n| R6 | Agent | Loop, runaway cost or unbounded execution | | | | | | | |\n| R7 | Vendor | Dependency on a model or service that changes or is retired | | | | | | | |\n| R8 | Reliability | Outage or quota exhaustion on the critical path | | | | | | | |\n| R9 | Cost | Unit cost exceeds the business case | | | | | | | |\n| R10 | Operations | No owner or runbook for an incident | | | | | | | |\n\nResidual risks above the accepted level need a named accepter and a review date.\n"
  },
  {
    "id": "privacy-review",
    "title": "12. Privacy Review",
    "badge": "Governance Template",
    "desc": "Questions to answer before a system handles personal data. Not legal advice; involve your privacy or legal contact.",
    "markdown": "# Privacy Review: [System name]\n\nNot legal advice. What is required depends on your jurisdiction, sector and contracts. Complete with your privacy or legal contact.\n\n## 1. Data\n- Personal data types processed (and whether any are sensitive categories):\n- Sources, and whether data subjects know about this use:\n- Why each data type is needed (purpose), and whether less would do:\n\n## 2. Flow\n- Where data goes: index, prompts, model provider, logs, traces, memory, evaluation sets, backups:\n- Locations (regions) of each store, and any residency constraints:\n- Third parties involved:\n\n## 3. Controls\n- Redaction or de-identification before indexing, prompting and logging:\n- Access controls and who can see what:\n- Retention period for each store:\n- How a deletion or access request reaches every store, including caches and derived content:\n\n## 4. Rights and transparency\n- How users are told AI is involved and how to get a human:\n- How requests, corrections and complaints are handled:\n\n## 5. Decision\n- Residual privacy risks and owners:\n- Outcome (approved / approved with conditions / not approved), reviewer and date:\n"
  },
  {
    "id": "tool-permission-register",
    "title": "13. Tool Permission Register",
    "badge": "Governance Template",
    "desc": "One row per tool an agent can call: purpose, permissions, limits, approval and audit.",
    "markdown": "# Tool Permission Register: [System or agent name]\n\nA tool that exists in a registry is not thereby allowed. Only tools listed here as allowed may be called by this agent or task.\n\n| Tool | Purpose | Kind (read / recommend / write / external-comm / destructive) | Identity it runs as | Permissions granted (least privilege) | Input and output limits | Timeout | Idempotent? | Approval needed? (when, by whom) | Audit record | Owner | Allowed for (agent, task, autonomy level) | Last reviewed |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n| | | | | | | | | | | | | |\n\nRules:\n- Each tool has its own identity and the narrowest permissions that work.\n- Tool output is untrusted data and cannot widen these permissions.\n- Adding a tool or raising a level needs review and an updated evaluation.\n"
  },
  {
    "id": "human-oversight-plan",
    "title": "14. Human Oversight Plan",
    "badge": "Governance Template",
    "desc": "Who reviews or approves what, how fast, and what happens when nobody responds.",
    "markdown": "# Human Oversight Plan: [System name]\n\n## 1. Actions that need a human\n| Action | Why | Approver role | Requester must differ from approver? | Response target | Default if no response |\n|---|---|---|---|---|---|\n| | | | | | Deny |\n\n## 2. What the approver sees\n- Action and arguments:\n- Reason and evidence:\n- What will change and whether it can be undone:\n\n## 3. Sampling and review of automated actions\n- What share of autonomous actions is reviewed, by whom, how often:\n- What triggers an extra review:\n\n## 4. Escalation and stop\n- Who can pause or disable the system, and how fast:\n- Who is paged when approvals are stuck:\n\n## 5. Training and fatigue\n- How approvers are trained; how approval volume is kept manageable:\n\n## 6. Record keeping\n- Approvals and denials are logged with who, when, what they saw and the decision.\n"
  },
  {
    "id": "use-case-charter",
    "title": "15. AI Use-Case Charter",
    "badge": "Delivery Template",
    "desc": "Define the problem, value hypothesis, users, constraints and the decision to proceed before any build.",
    "markdown": "# AI Use-Case Charter: [Name]\n\n**Sponsor:** [name]  |  **Owner:** [name]  |  **Date:** [YYYY-MM-DD]\n\n## 1. Problem and users\n- Problem in one sentence (no solution words):\n- Who has it, how often, what it costs today:\n\n## 2. Should AI be used at all?\n- Why a rules-based or manual approach is not enough:\n- What happens when the AI is wrong, and how bad it is:\n\n## 3. Value hypothesis\n- Outcome measure (not activity): [metric, current value, target, by when]\n- How we will know: [baseline method]\n\n## 4. Constraints\n- Data available and its state:\n- Latency, volume, availability expectations (see the NFR table):\n- Privacy, residency and compliance constraints:\n- Budget and team:\n\n## 5. Initial design direction\n- Workflow, single agent or multi-agent, and why:\n- Autonomy level proposed:\n\n## 6. Risks and open questions\n## 7. Decision gate\n- Go / no-go / more discovery, decided by [role] on [date], with evidence:\n"
  },
  {
    "id": "data-readiness",
    "title": "16. Data Readiness Assessment",
    "badge": "Delivery Template",
    "desc": "Check that source data is accessible, owned, clean, permissioned and fresh enough for the use case.",
    "markdown": "# Data Readiness Assessment: [Use case]\n\n| Source | Owner | Access method | Classification | ACL model | Update pattern | Volume | Quality issues found | Ready? (yes / with work / no) |\n|---|---|---|---|---|---|---|---|---|\n| | | | | | | | | |\n\n## Quality dimensions checked per source\nSchema, completeness, validity, accuracy, uniqueness, consistency, freshness, referential integrity. Record the method and sample size, not just the verdict.\n\n## Questions\n- Can permissions be read and kept in sync with the source?\n- How do deletions in the source reach our index and caches?\n- Who fixes a data problem we find, and how long does it take?\n- Is there enough representative data to build an evaluation set?\n\n## Decision\n- Ready / ready with conditions / not ready, owner and date:\n"
  },
  {
    "id": "eval-plan",
    "title": "17. Evaluation Plan",
    "badge": "Delivery Template",
    "desc": "Define datasets, metrics, gates and rollout evidence before building, so quality is measurable from the first prototype.",
    "markdown": "# Evaluation Plan: [System name]\n\n## 1. What good means\n- Task success definition:\n- Failures that are unacceptable (safety invariants, must be zero):\n\n## 2. Datasets\n| Dataset | Version | Size | Origin (real / synthetic / adversarial) | Labelled by | Split (dev / held-out) | Known gaps |\n|---|---|---|---|---|---|---|\n\n## 3. Metrics\n| Level | Metric | What it does not prove | Target or tolerance (project-specific) | How measured |\n|---|---|---|---|---|\n\n## 4. Judges\n- Judge model and prompt version, calibration sample, agreement with humans:\n\n## 5. Gates\n- Pre-merge, pre-release, canary, post-release; who reviews; rollback criteria defined before rollout:\n\n## 6. Reproducibility\n- Recorded: commit, dataset version, model and version, prompt hash, retrieval config, index version, judge version, seed:\n"
  },
  {
    "id": "post-launch-review",
    "title": "18. Post-Launch Review",
    "badge": "Delivery Template",
    "desc": "Review outcomes, quality, cost and incidents against the charter after launch, and decide what changes.",
    "markdown": "# Post-Launch Review: [System name]\n\n**Review date:** [YYYY-MM-DD]  |  **Period covered:** [from - to]\n\n## 1. Outcomes against the charter\n| Outcome measure | Baseline | Target | Actual | Notes |\n|---|---|---|---|---|\n\n## 2. Quality and safety\n- Evaluation and sampled-quality trend:\n- Policy violations, leaks, injection attempts:\n- User-reported problems and how they became test cases:\n\n## 3. Reliability and cost\n- SLO attainment and error budget:\n- Incidents and runbook performance:\n- Cost per successful task against the business case:\n\n## 4. Operations and ownership\n- Is the support model working? Are the right people on call?\n\n## 5. Decisions\n- Continue / change / reduce autonomy / retire, with reasons and owners:\n- Follow-up actions with owners and dates:\n"
  }
];
  add.forEach(function (t) { window.ATLAS.toolkit.templates.push(t); });
})();
