/* Operating guides: long-form playbooks rendered at #/p/<id>.
   Schema per guide: id, group, title, short, when, blocks:[...], src:[[label,url]], related:[service ids], see:['p:id','a:id','d:id','t:id']
   Block types: h2, h3, p, ul, ol, table{cols,rows,note}, callout{title,text}, two{left,right}, cards{items:[{tag,title,text}]}, steps{items:[[label,text]]}, runbook{...}
   Text supports `code`, **bold**, [[service-id|label]] and prefixed links [[p:guide|label]], [[a:arch|label]], [[d:decision|label]], [[t:template|label]]. */
window.ATLAS.guideGroups = [
  { id: 'govern', name: 'Govern and secure', hue: 18, blurb: 'Identity, policy, compliance and the controls that decide what an agent may touch.' },
  { id: 'operate', name: 'Operate and respond', hue: 145, blurb: 'What to measure, how to prove quality before and after release, and what to do when it breaks.' },
  { id: 'deliver', name: 'Deliver and platform', hue: 215, blurb: 'Pipelines, environments and release practice for prompts, agents, models and indexes.' },
  { id: 'data', name: 'Data and knowledge', hue: 42, blurb: 'Keeping the knowledge behind retrieval correct, fresh and permissioned.' }
];
window.ATLAS.guides = [];

window.ATLAS.guides.push({
  id: 'agent-governance-guide', group: 'govern', title: 'Agent governance: implementation guide',
  short: 'How to give every agent its own identity, an approved catalogue and a policy chokepoint, and how to roll that out without stopping delivery.',
  when: 'You run more than one agent, agents call tools that change state, or a security review asks "what can this agent do, and who allowed it?". The service card says what each product is; this guide says how to put them together.',
  blocks: [
    { t: 'h2', text: 'The model in one page' },
    { t: 'p', text: 'Treat an agent as a **principal**, like a service or a person. It gets its own identity, it can only reach what a policy grants, and everything it does is logged under that identity. Four pieces carry this on Google Cloud ([[agent-governance|the service card has the detail]]):' },
    { t: 'table', cols: ['Piece', 'Job', 'Question it answers'], rows: [
      ['**Agent Identity**', 'Gives each agent a cryptographic identity (SPIFFE based) and manages its credentials. It also brokers credentials for outbound tools through its auth manager.', 'Who is this agent?'],
      ['**Agent Registry**', 'Central catalogue of approved agents, tools and MCP servers, including third-party ones. The gateway reads its metadata to apply policy.', 'What is approved, and who owns it?'],
      ['**Agent Gateway**', 'The policy-enforced network path for user-to-agent, agent-to-tool and agent-to-agent traffic. Applies IAM policy and can call [[model-armor|Model Armor]] and other screening.', 'May this call happen, and is its content safe?'],
      ['**IAM policy**', 'Unified access policies link an agent identity to the registered tools and endpoints it may call. Connections are blocked unless a policy grants them.', 'What is this agent allowed to do?']
    ], note: 'Stage differs by component and by feature (the cross-cloud gateway workflow and some policy types were in preview at the last review). Check each before you plan on it.' },
    { t: 'callout', title: 'The one rule that matters', text: 'Governance only covers traffic that goes through it. If an agent can reach a tool directly, the registry and gateway are decoration. Make the gateway the only permitted path with network and IAM controls, then test that the bypass fails.' },

    { t: 'h2', text: 'Agent identity versus the user\'s identity' },
    { t: 'p', text: 'There are two different questions in every call: **which agent is acting**, and **on whose authority**. Agent Identity supports both modes, and the choice changes what you can audit and how much damage a compromised agent can do.' },
    { t: 'table', cols: ['Mode', 'Whose permissions apply', 'Typical credential', 'Use it when', 'Risk to manage'], rows: [
      ['**Agent\'s own authority**', 'Only what the agent identity has been granted', 'Agent identity credentials (X.509 certificate, bound access tokens, OIDC ID tokens for external backends)', 'Background jobs, shared reference data, actions that are the same for every user', 'A broad grant is a standing privilege for every caller. Keep roles narrow.'],
      ['**Delegated (on behalf of a user)**', 'The user\'s consent and scopes, brokered to the agent', 'Three-legged OAuth tokens held by the auth manager; the agent never sees the raw credential in the managed flow', 'Anything personal: the user\'s mail, tickets, repositories, records', 'The agent can do what the user can do. Scope tokens to the task and set short lifetimes.'],
      ['**Both**', 'Intersection of the two is the safe target', 'Agent identity to authenticate, delegated token to act', 'Agent acts for a user inside a system the agent identity must also be allowed to reach', 'Audit logs must show both identities so you can answer "who asked" and "who did".']
    ] },
    { t: 'h3', text: 'Worked example: an expenses assistant' },
    { t: 'steps', items: [
      ['1', 'Priya asks the assistant in Gemini Enterprise: "Approve the three small expenses waiting for me and file the rest for my manager."'],
      ['2', 'The request reaches the agent through the gateway. The agent runs as its **own identity**, `expenses-assistant`, which is allowed to call the registered Expenses MCP server and nothing else.'],
      ['3', 'To read Priya\'s queue the agent needs **her** authority. The auth manager holds her three-legged OAuth token from the earlier consent and attaches it at the gateway. The agent code never handles the token.'],
      ['4', 'The agent asks to call `approve_expense`. The gateway checks the IAM policy: this agent identity, this registered tool, allowed. It screens the arguments and the tool result with Model Armor.'],
      ['5', '`approve_expense` is a write above a cost threshold, so the agent pauses for Priya\'s explicit approval ([[d:human-in-loop|human-in-the-loop decision]]). Small ones go through.'],
      ['6', 'The audit trail records: user Priya, agent `expenses-assistant`, tool `approve_expense`, arguments, policy decision, trace id. Finance can answer who approved, via which agent, and under what rule.']
    ] },

    { t: 'h2', text: 'Agent Registry: catalogue and discovery' },
    { t: 'ul', items: [
      '**Register every agent and every tool endpoint**, including third-party MCP servers. An unregistered tool cannot be named in a policy, which is the point.',
      '**Required fields:** owner team, on-call contact, purpose, data classes touched, environment, version, and a link to the threat model ([[t:threat-model]]).',
      '**Approval workflow:** registration is a request, not a self-service publish. Security reviews the data classes and the write actions; the owner re-attests on a schedule (quarterly is a sensible start).',
      '**Discovery:** agents and users find only approved assets. Draft agents live in dev projects and are not visible to production agents.',
      '**Retire things:** a registry that only grows is a list of unmaintained attack surface. Remove entries when the owner cannot be reached.'
    ] },

    { t: 'h2', text: 'Agent Gateway: ingress, egress and policy' },
    { t: 'table', cols: ['Path', 'What it secures', 'Policy you will want'], rows: [
      ['**Client to agent (ingress)**', 'External clients and tools (an IDE, a CLI, a partner app) reaching your agents', 'Which clients may call which agent; screening of prompts; rate limits; authentication of the caller'],
      ['**Agent to anywhere (egress)**', 'Agents calling MCP servers, APIs, other agents, inside or outside Google Cloud', 'Per-tool IAM policy by agent identity; allow-list of registered destinations; screening of tool arguments and results'],
      ['**Agent to agent**', 'Delegation between a supervisor and specialists, or across teams', 'Only registered agents; propagate the caller\'s identity; cap call depth']
    ], note: 'Managed runtimes (Agent Runtime, Gemini Enterprise) route agent traffic through the gateway automatically when it is enabled. Self-hosted agents need explicit network and IAM controls to force the same path.' },
    { t: 'p', text: 'Authorisation decisions can be delegated to custom engines through service extensions, so you can add an organisation-specific check (a data-loss rule, a business-hours rule) without writing it into every agent.' },

    { t: 'h2', text: 'Authentication: what to use where' },
    { t: 'table', cols: ['Situation', 'Mechanism', 'Notes'], rows: [
      ['Agent calls Google Cloud APIs directly', 'Agent identity with **mutual TLS** and certificate-bound access tokens', 'Binding makes a stolen token unusable outside the agent\'s trusted runtime. This is the default for agent identities.'],
      ['Agent calls through Agent Gateway to Google Cloud APIs', 'mTLS to the gateway, then **DPoP** (proof of possession, RFC 9449) beyond it', 'The gateway terminates mTLS, so DPoP keeps the token bound end to end. Context-Aware Access can enforce both.'],
      ['Agent calls an external SaaS tool on a user\'s behalf', '**Three-legged OAuth** via the auth manager', 'Consent once, token vaulted and decrypted at the gateway. Prefer this to putting a user token in the agent.'],
      ['Agent calls an external service with its own account', '**Two-legged OAuth** (client credentials) or an API key, held by the auth manager', 'Rotate; scope to one tool; never in prompts or code. See [[secret-manager|Secret Manager]].'],
      ['Agent calls your own backend on Google Cloud', 'OIDC ID token minted for the agent identity', 'The backend verifies audience and agent identity, not just "some service account".'],
      ['Self-hosted agent outside the managed runtimes', '[[iam|Workload identity]] federation or service account with least privilege', 'Feature differences apply: some governance features are for managed runtimes. Compensate with your own mesh and OAuth stack.']
    ] },

    { t: 'h2', text: 'Access policy: default deny and least privilege' },
    { t: 'ul', items: [
      '**Default deny.** An agent with no policy reaches nothing. Start from zero and add one registered tool at a time.',
      '**One identity per agent, per environment.** Never share a service account between agents; it makes the audit trail useless and a compromise contagious.',
      '**Separate read and write tools** so you can grant read widely and write narrowly, and so approval gates can key on the tool name.',
      '**Boundaries around the whole thing:** [[vpc-sc|VPC Service Controls]] perimeters for data exfiltration, Principal Access Boundary and deny policies as a backstop, organisation policy for the settings nobody should change.',
      '**Few templates, not many rules.** Policy sprawl is unreviewable. Define three or four standard agent profiles (read-only retrieval; internal read-write; external-facing) and map agents to them.'
    ] },

    { t: 'h2', text: 'Tool governance' },
    { t: 'table', cols: ['Tool type', 'Approve when', 'Block when'], rows: [
      ['**MCP servers** (first-party)', 'Registered, owner named, tools listed with read/write flags, runs inside your perimeter', 'Exposes a generic "run anything" tool, or has no owner'],
      ['**MCP servers** (third-party)', 'Vendor reviewed, data flows documented, traffic only via the gateway, results screened', 'Server can return instructions the model will follow without screening; unknown hosting'],
      ['**API tools** (OpenAPI, functions)', 'Narrow scope, idempotent writes, per-call authorisation at the API too', 'Agent holds a broad key; the API trusts the agent blindly'],
      ['**Agent endpoints** (A2A)', 'Registered, versioned agent card, identity propagated, depth capped', 'Anonymous endpoint; no caller identity forwarded ([[agent-protocols]])']
    ], note: 'Defence in depth: the tool itself must still authorise the call. The gateway is not a substitute for server-side checks.' },

    { t: 'h2', text: 'Content protection and auditability' },
    { t: 'two', left: { title: 'Screen with Model Armor', items: [
      'Prompts and responses for injection, jailbreak, harmful content and sensitive data ([[model-armor]]).',
      'Tool **results** as well as user input: a tool is a route for hostile text.',
      'Template per agent profile, with block versus log-only modes while you tune.',
      'Pair with [[sdp|Sensitive Data Protection]] where personal data may appear.'
    ] }, right: { title: 'Log so you can answer questions later', kind: 'ml', items: [
      'Who: end user identity and agent identity on every event ([[audit-logs]]).',
      'What: tool name, arguments (redacted as needed), result status, policy decision.',
      'Why: trace id linking the model calls and tool calls of one task ([[cloud-monitoring|Cloud Trace]]).',
      'Retention and access: route to a log bucket with its own access controls; keep what the audit requires.'
    ] } },
    { t: 'p', text: 'Detection features (anomaly and threat detection, an agent security view in Security Command Center) watch for unusual behaviour. Treat them as a second line: a quiet dashboard is not proof the policy is right.' },

    { t: 'h2', text: 'Rollout order' },
    { t: 'steps', items: [
      ['1', '**Inventory.** List every agent, tool and MCP server in use, including shadow ones in notebooks and personal projects. Assign an owner to each.'],
      ['2', '**Identity first.** Give each production agent its own identity and remove shared service accounts. This alone fixes the audit trail.'],
      ['3', '**Register** the assets from step 1. Mark unapproved ones and set a retirement date.'],
      ['4', '**Gateway in log-only mode** for one agent. Watch what it would have blocked, fix false positives, then enforce.'],
      ['5', '**Default-deny policies** from the standard profiles, agent by agent, highest risk first (anything that writes or reaches personal data).'],
      ['6', '**Screening and approvals:** Model Armor templates, approval gates on the write tools, rate limits.'],
      ['7', '**Prove the bypass is closed.** Try to reach a tool directly from an agent runtime; it should fail. Add it to the release checklist.'],
      ['8', '**Operate it:** quarterly re-attestation, audit-log reviews, a runbook for a compromised agent ([[p:incident-runbooks|incident runbooks]]).']
    ] },

    { t: 'h2', text: 'Implementation checklist' },
    { t: 'ul', items: [
      'Every production agent has a unique identity; no shared service accounts.',
      'Every agent and tool is in the registry with an owner, data classes and an on-call contact.',
      'Agent-to-tool traffic goes only through the gateway; a direct call fails in a test.',
      'Policies are default-deny and built from a small set of profiles.',
      'Delegated actions carry the user\'s identity and scopes; the audit log shows both identities.',
      'Writes above a cost or risk threshold require human approval.',
      'Model Armor screens inputs, outputs and tool results; sensitive data is redacted in logs.',
      'Audit logs, traces and policy decisions are retained and searchable.',
      'A compromised-agent runbook exists and has been rehearsed.',
      'Preview features are listed with an owner and a fallback.'
    ] }
  ],
  src: [
    ['Agent Identity overview', 'https://docs.cloud.google.com/iam/docs/agent-identity-overview'],
    ['Agent Gateway overview', 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/govern/gateways/agent-gateway-overview'],
    ['Context-Aware Access agent security (mTLS and DPoP)', 'https://docs.cloud.google.com/access-context-manager/docs/caa-agent-security'],
    ['Govern your agents', 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/govern']
  ],
  related: ['agent-governance', 'iam', 'model-armor', 'vpc-sc', 'audit-logs', 'agent-protocols', 'agent-runtime', 'secret-manager'],
  see: ['a:multi-agent-system', 'd:human-in-loop', 'p:compliance-matrix', 'p:incident-runbooks', 't:threat-model']
});

window.ATLAS.guides.push({
  id: 'compliance-matrix', group: 'govern', title: 'Data residency and compliance matrix',
  short: 'Which security controls each AI, retrieval and agent service supports, with the gaps called out, so a design does not fail a review in week ten.',
  when: 'You have a residency, key-management or perimeter requirement and need to know which building blocks you may use. Read it before choosing a retrieval or agent service, not after.',
  blocks: [
    { t: 'callout', title: 'How to read this page', text: 'Rows say **Yes**, **No** or **Check**. Yes and No come from Google Cloud security-controls pages as read on the review date. **Check** means the sources disagreed, the control depends on the edition, region or feature, or it was not confirmed. Support changes with releases and differs by model and region, so confirm on the linked page before you sign off a design.' },
    { t: 'h2', text: 'The four controls' },
    { t: 'table', cols: ['Control', 'What it gives you', 'Where it surprises people'], rows: [
      ['**Data residency (at rest)**', 'Stored data stays in the location you chose', 'Separate from **ML processing** location, which depends on the endpoint you call. A regional store behind a global endpoint can process elsewhere.'],
      ['**CMEK**', 'You hold the encryption key in Cloud KMS', 'Key location must match the resource; some features need the key in a fixed region; support is per resource type.'],
      ['**VPC Service Controls**', 'A perimeter that blocks data leaving a defined set of projects and services', 'Only works for services that support it. Calls that cross the perimeter need ingress and egress rules.'],
      ['**Access Transparency**', 'Logs of Google personnel access to your content', 'Often limited to specific regions or multi-regions, and absent for some AI features.']
    ] },
    { t: 'h2', text: 'The matrix' },
    { t: 'table', cols: ['Service', 'Data residency (at rest)', 'CMEK', 'VPC-SC', 'Access Transparency', 'Notes'], rows: [
      ['[[gemini|Gemini models on Agent Platform]]', 'Yes', 'Yes', 'Yes', 'Yes', 'Varies by model and by feature. Partner and open models (MaaS) have their own rows on the controls page. ML processing location depends on endpoint choice.'],
      ['[[rag-engine|RAG Engine]]', 'No', 'Yes', 'Yes', 'No', 'Data residency commitments do not apply. Do not choose it for a hard residency requirement.'],
      ['[[ai-search|Agent Search]]', 'Yes (US and EU multi-region APIs only)', 'Enterprise edition only (US and EU multi-region APIs)', 'Yes', 'Yes (US and EU multi-regions only)', 'Ranking, grounded generation and check-grounding APIs: VPC-SC and Access Transparency yes; residency and CMEK not applicable.'],
      ['[[agent-retrieval|Agent Retrieval / Vector Search 2]]', 'Check', 'Yes', 'Check', 'Check', 'CMEK is documented for collections. The general controls table lists the product; confirm which columns apply.'],
      ['[[vector-search|Vector Search (index and endpoint)]]', 'Check', 'Yes', 'Yes (index query)', 'Check', 'CMEK needs the same key on index and endpoint. Index queries are listed as VPC-SC protected.'],
      ['[[agent-runtime|Agent Runtime]]', 'Check', 'Yes', 'Yes', 'Check', 'Sources disagree on residency and Access Transparency (older docs say not supported; the data-residency terms list it as an exception). Confirm for your region.'],
      ['[[agent-memory|Memory Bank and Sessions]]', 'Check', 'Yes (not with the global endpoint)', 'Yes', 'Check', 'Excluded from the data-residency service list at the review date. Check before storing regulated data.'],
      ['[[gemini-enterprise|Gemini Enterprise]]', 'Yes (US and EU multi-region; not with Grounding with Google Search)', 'Yes (US and EU multi-region)', 'Yes', 'Yes (US and EU multi-regions only)', 'Edition and feature dependent. Certifications differ between Gemini Enterprise and NotebookLM Enterprise.'],
      ['[[spanner|Spanner]] and [[spanner-graph|Spanner Graph]]', 'Yes', 'Yes', 'Yes', 'Check', 'Spanner is on the data-residency service list; confirm the graph features inherit the same controls.'],
      ['[[alloydb|AlloyDB]]', 'Yes', 'Yes', 'Yes', 'Check', 'On the data-residency service list.'],
      ['[[bigquery|BigQuery]]', 'Yes', 'Yes', 'Yes', 'Check', 'Dataset location is chosen at creation and cannot be changed; plan it.'],
      ['[[document-ai|Document AI]]', 'Yes', 'Check', 'Check', 'Check', 'On the data-residency service list; confirm processor location and CMEK support per processor.']
    ], note: 'Source pages: Gemini Enterprise Agent Platform security controls, RAG Engine CMEK page, Agent Search and Gemini Enterprise compliance pages, and the Google Cloud data-residency services list. A "Yes" is a statement about the product, not about every feature or model inside it.' },

    { t: 'h2', text: 'Choosing with a constraint' },
    { t: 'table', cols: ['If you must have', 'Then', 'And watch for'], rows: [
      ['A hard **data residency at rest** commitment for retrieval', 'Prefer a retrieval store that is on the residency list: [[ai-search|Agent Search]] (in a supported multi-region), [[alloydb|AlloyDB]], [[spanner|Spanner]] or [[bigquery|BigQuery]]. Avoid [[rag-engine|RAG Engine]] unless the requirement is relaxed.', 'ML processing location: choose a jurisdictional or regional endpoint for the model, not the global one.'],
      ['**Customer-managed keys** everywhere', 'Check CMEK per resource before design: Agent Search needs the Enterprise edition; Vector Search needs one key for index and endpoint.', 'Memory and session stores with the global endpoint do not support the same key model.'],
      ['A **VPC-SC perimeter** around data and models', 'Put the AI project, the data projects and the key project in one perimeter and write ingress/egress rules for the rest.', 'Third-party tools and external MCP servers sit outside the perimeter; route them through the [[p:agent-governance-guide|gateway]].'],
      ['**Access Transparency** evidence', 'Pick services and regions where it is listed.', 'It is often limited to the US and EU multi-regions.']
    ] },
    { t: 'h2', text: 'Ask before you commit' },
    { t: 'ul', items: [
      'Which location does **ML processing** happen in for the endpoint we will call, and does the model support it?',
      'Is every service in the data path on the residency list, including logging, tracing and evaluation stores?',
      'Do we hold the key in the right location for each resource?',
      'What leaves the perimeter, to whom, and through which gateway?',
      'Who owns re-checking this page when we change a model, region or edition?'
    ] }
  ],
  src: [
    ['Agent Platform security controls', 'https://docs.cloud.google.com/vertex-ai/docs/general/vertexai-security-controls'],
    ['Where your data lives and is processed', 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/resources/data-residency'],
    ['Agent Search compliance and security controls', 'https://docs.cloud.google.com/generative-ai-app-builder/docs/compliance-security-controls'],
    ['Gemini Enterprise compliance and security controls', 'https://docs.cloud.google.com/gemini/enterprise/docs/compliance-security-controls'],
    ['Services with data residency', 'https://cloud.google.com/terms/data-residency']
  ],
  related: ['rag-engine', 'ai-search', 'agent-retrieval', 'vector-search', 'agent-runtime', 'agent-memory', 'gemini-enterprise', 'vpc-sc', 'kms'],
  see: ['p:agent-governance-guide', 'd:vector-store', 'd:tenancy']
});
