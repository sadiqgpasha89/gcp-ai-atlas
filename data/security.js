/* Security & Identity */
S({
  id: 'iam', cat: 'security', name: 'IAM & Workload Identity', doc: 'iam/docs',
  tag: 'Who and what can do what: roles, service accounts, federation and organisation policy.',
  what: 'Identity and Access Management grants **roles** (bundles of permissions) to **principals** (users, groups, service accounts, workloads) on **resources** in a hierarchy of organisation, folders and projects. Policies inherit downward, **IAM Conditions** add context, **deny policies** override grants, and **Organization Policy** sets guardrails such as banning service-account keys or restricting regions.\n\nFor AI the key idea is **keyless workload identity**: [[gke]] pods use Workload Identity, external systems use Workload Identity Federation, and agents now get their own identities ([[agent-governance]]). Predefined roles such as `roles/aiplatform.user` grant model access (the API is still `aiplatform.googleapis.com`); narrow custom roles bound the rest.',
  flow: ['Principal', 'Authenticate', 'Request resource', 'Evaluate policy', 'Allow / deny', 'Audit log'],
  steps: [
    [0, 'A workload (pod, Cloud Run service, agent) presents a short-lived token tied to its service account or federated identity.'],
    [1, 'Google verifies the token without any long-lived key.'],
    [2, 'The workload calls an API, for example to invoke a model or read a bucket.'],
    [3, 'IAM evaluates allow policies on the resource and its ancestors, then deny policies and conditions.'],
    [4, 'The request is allowed or denied with a precise permission name in the error.'],
    [5, 'The decision and caller are written to [[audit-logs]].']
  ],
  gotchas: [
    '**Service account keys are the classic leak.** Block their creation with an organisation policy and use workload identity instead.',
    '**Basic roles (Owner, Editor) are far too broad** for AI workloads. Use predefined or custom roles.',
    '**Permissions propagate with delay,** usually seconds but occasionally minutes, which confuses first-time setups.',
    '**Service agents** (Google-managed identities) need permissions too. A job that fails with permission errors often lacks them on the bucket or key.'
  ],
  edges: [
    'Impersonation chains let one identity act as another, convenient and risky. Audit them.',
    'A model endpoint\'s identity may differ from the caller\'s. Decide whose authority each call uses.',
    'Deny policies and conditions are powerful but hard to debug. Use the Policy Troubleshooter.'
  ],
  ml: [
    'Separate service accounts for training, serving, pipelines and each agent tool, each with least privilege.',
    'Restricting who can invoke expensive accelerators or use partner models.',
    'Passing end-user identity through to tools so agents act as the user, not an admin.'
  ],
  pairs: ['agent-governance', 'kms', 'vpc-sc', 'audit-logs', 'identity-platform', 'secret-manager'],
  cost: 'IAM is free. The cost of weak IAM is a stolen credential running accelerators or reading data, so spend effort on least privilege and quotas ([[quotas]], [[billing]]).'
});

S({
  id: 'kms', cat: 'security', name: 'Cloud KMS & CMEK', doc: 'kms/docs',
  tag: 'Customer-managed encryption keys for data, models and disks, with HSM and external options.',
  what: 'Cloud KMS stores and manages cryptographic keys. By default Google encrypts data at rest with Google-managed keys. **Customer-managed encryption keys (CMEK)** let you supply a key from KMS (software, Cloud HSM, or an external key manager via EKM) so that you control rotation, disabling and destruction. Most AI-related services support CMEK for training data, models, index storage and logs, and **Autokey** automates key creation and policy.\n\nKey control is a common requirement in regulated reviews: disable the key and the data becomes unreadable, which is also a real way to lock yourself out.',
  flow: ['Create key ring + key', 'Grant service agent', 'Configure resource CMEK', 'Wrap data keys', 'Use / audit', 'Rotate or disable'],
  steps: [
    [0, 'You create a key ring and key in the same location as the data it will protect.'],
    [1, 'You grant the service agent of the target service permission to use the key.'],
    [2, 'You set the key on the resource (a bucket, a dataset, a model, an index, an endpoint) when creating it.'],
    [3, 'The service wraps its data-encryption keys with your key.'],
    [4, 'Every use is logged in [[audit-logs]], so you can see which service decrypted what.'],
    [5, 'Rotation creates new versions; disabling or destroying a key makes the data inaccessible.']
  ],
  gotchas: [
    '**Key location must match the resource location.** A key in a different region than the model or bucket is rejected.',
    '**Destroying a key destroys the data.** Use scheduled destruction with a safety window, and restrict who can destroy.',
    '**CMEK adds KMS calls to hot paths.** Request quotas on KMS can throttle a busy service.',
    '**Not everything is covered.** Some derived data, caches or logs may use default keys. Check each service\'s CMEK coverage.'
  ],
  edges: [
    'A key cannot be changed on an existing resource in many services. Plan it at creation time.',
    'External keys add network dependency and latency, and an outage at the external manager is an outage for you.',
    'Cross-project key access needs explicit grants.'
  ],
  ml: [
    'Protecting training data, tuned models and vector indexes with keys you control.',
    'Meeting residency and sovereignty requirements together with regional endpoints.',
    'Disabling a key as an emergency kill switch for a tenant\'s data.'
  ],
  pairs: ['iam', 'gcs', 'bigquery', 'ap-inference', 'audit-logs', 'secret-manager'],
  cost: 'Billed per key version per month (more for HSM and external), plus per-operation charges. Autokey does not change the price but reduces setup effort.'
});

S({
  id: 'secret-manager', cat: 'security', name: 'Secret Manager', doc: 'secret-manager/docs',
  tag: 'Store and rotate API keys, tokens and credentials outside your code and images.',
  what: 'Secret Manager stores secrets as versioned objects, with IAM-controlled access, automatic replication, rotation notifications, and audit logging. Cloud Run, GKE and other services can mount a secret as an environment variable or file at runtime.\n\nAI systems accumulate secrets quickly: keys for third-party model APIs, vector database credentials, tool backends and webhooks. Putting them in code, prompts or notebooks is the most common way they leak.',
  flow: ['Create secret', 'Add version', 'Grant access', 'Workload fetches', 'Rotate', 'Audit'],
  steps: [
    [0, 'You create a secret and choose its replication location.'],
    [1, 'You add a version containing the value.'],
    [2, 'You grant the accessor role on that secret to the workload\'s service account ([[iam]]).'],
    [3, 'At start, [[cloud-run]] or [[gke]] injects the value, or code reads it with the client library.'],
    [4, 'You add a new version on rotation and disable the old one once consumers move.'],
    [5, '[[audit-logs]] record every access, showing who read which secret and when.']
  ],
  gotchas: [
    '**Pin versions in production** instead of `latest`, or a bad rotation breaks everything at once.',
    '**Values injected as environment variables appear in process dumps and crash reports.** Prefer mounted files for high-value secrets.',
    '**Never put secrets in prompts or agent context.** A model can repeat what it sees.',
    '**Access is per secret.** Avoid granting project-wide secret access.'
  ],
  edges: [
    'Secrets are fetched at start or on demand; a long-running agent needs a refresh strategy.',
    'Replication policy is fixed at creation, so choose regions that fit residency rules.',
    'Rotation topics notify you, but you must build the rotation logic.'
  ],
  ml: [
    'Credentials for partner model APIs, MCP servers and tool backends.',
    'Database and index passwords for retrieval stores.',
    'Webhook signing secrets for agent integrations.'
  ],
  pairs: ['iam', 'kms', 'cloud-run', 'gke', 'audit-logs'],
  cost: 'Billed per active secret version per month and per access operation, with a small free allowance. Negligible compared with the cost of a leak.'
});

S({
  id: 'identity-platform', cat: 'security', name: 'Identity Platform & IAP', doc: 'identity-platform/docs',
  tag: 'Sign users in to your AI app, and put identity-aware access in front of internal tools.',
  what: 'Identity Platform (the enterprise layer of Firebase Authentication) provides sign-in for customer-facing apps: email and password, social providers, SAML and OIDC federation, multi-factor authentication, multi-tenancy and blocking functions. **Identity-Aware Proxy (IAP)** puts Google identity and context-aware access in front of internal web apps, [[cloud-run]] services and VMs without a VPN. For workforce access use Cloud Identity or your own provider federated into IAM.\n\nFor AI apps the user\'s identity should travel with every request, so retrieval and tools can enforce what that user is allowed to see.',
  flow: ['User signs in', 'Identity provider', 'ID token', 'App / IAP check', 'Claims to backend', 'Scoped access'],
  steps: [
    [0, 'A user opens your app and signs in with a provider.'],
    [1, 'Identity Platform authenticates, with MFA if required, and may federate with SAML or OIDC.'],
    [2, 'It returns a signed ID token with the user id and custom claims (tenant, groups).'],
    [3, 'Your backend, or IAP for internal tools, verifies the token on every request.'],
    [4, 'The claims are passed to retrieval and tool calls as filters and identity.'],
    [5, 'The agent can read and act only within what the user is permitted.']
  ],
  gotchas: [
    '**Verify tokens on the server, every time.** Never trust identity sent by the client.',
    '**Authorisation is not authentication.** A signed-in user still needs per-document and per-action permission checks.',
    '**Custom claims are cached in tokens,** so changes take effect after token refresh.',
    '**Tenant isolation must be end to end:** index filters, caches and logs.'
  ],
  edges: [
    'IAP protects the front door, not what a logged-in user can do inside.',
    'Account linking across providers can merge identities unexpectedly. Test flows.',
    'Token lifetime is a tradeoff: short tokens are safer, long ones reduce calls.'
  ],
  ml: [
    'User-scoped RAG: filters derived from verified claims ([[rag-engine]]).',
    'Agent tools that act with the user\'s delegated identity.',
    'Protecting internal evaluation and annotation tools.'
  ],
  pairs: ['iam', 'cloud-run', 'rag-engine', 'agent-governance', 'apigee'],
  cost: 'Identity Platform is billed per monthly active user above a free tier, with higher rates for SAML, OIDC and MFA. IAP itself has no separate charge.'
});

S({
  id: 'cloud-armor', cat: 'security', name: 'Cloud Armor', doc: 'armor/docs',
  tag: 'WAF, DDoS defence and rate limiting at the edge of your load balancer.',
  what: 'Cloud Armor attaches security policies to external load balancers: preconfigured WAF rules (OWASP-style), custom rules on IPs, geography, headers and request content, **rate limiting** and throttling, bot management integration, and adaptive protection that detects anomalous traffic with machine learning. Network-level DDoS defence is built into Google\'s edge.\n\nFor AI the case is **denial of wallet**: an attacker or a runaway client sending expensive prompts is an availability and cost problem, not just a security one. Rate limits at the edge are the first, cheapest control.',
  flow: ['Request', 'Edge', 'Policy rules', 'Rate limit', 'Allow / throttle / block', 'Backend'],
  steps: [
    [0, 'A request reaches the global edge of [[load-balancing]].'],
    [1, 'DDoS protection absorbs volumetric floods.'],
    [2, 'The attached policy evaluates rules in priority order.'],
    [3, 'Rate-limit rules count requests per client key (IP, header, token) over a window.'],
    [4, 'The request is allowed, throttled (429), or blocked.'],
    [5, 'Allowed traffic goes on to the backend ([[apigee]], [[cloud-run]], [[gke]]).']
  ],
  gotchas: [
    '**Request counts are not token counts.** A single request can be tiny or enormous in model cost. Pair edge limits with token-aware quotas in [[apigee]] or your app.',
    '**Preview before enforcing.** WAF rules can block legitimate prompts that look like attacks (code, SQL, markup).',
    '**Rate limit keys matter.** Limiting by IP penalises shared networks; limit by authenticated identity where possible.',
    '**Large request bodies** may be inspected only partially. Know the inspection limit.'
  ],
  edges: [
    'Policies attach to backend services, so internal-only traffic that bypasses the balancer is not covered.',
    'Rules have quotas and a processing cost per rule.',
    'Adaptive protection needs baseline traffic to learn from.'
  ],
  ml: [
    'Protecting public chat and agent endpoints from abuse and cost attacks.',
    'Geographic and IP restrictions for regulated services.',
    'A first layer ahead of [[model-armor]] content screening.'
  ],
  pairs: ['load-balancing', 'apigee', 'model-armor', 'cloud-run', 'identity-platform'],
  cost: 'Billed per policy per month, per rule, and per million requests evaluated, with adaptive protection and managed protection at higher tiers.'
});

S({
  id: 'sdp', cat: 'security', name: 'Sensitive Data Protection', doc: 'sensitive-data-protection/docs',
  tag: 'Find, classify and de-identify personal and secret data before it reaches a model or index.',
  what: 'Sensitive Data Protection (the service behind the DLP API) detects hundreds of types of sensitive data (names, ids, payment cards, health terms, secrets and credentials) in text, structured data and images, using patterns, dictionaries and ML. It can **de-identify** by redaction, masking, tokenisation or format-preserving encryption, and **data discovery** profiles BigQuery, Cloud Storage, Cloud SQL and other sources to show where sensitive data lives.\n\nThe principle: keep sensitive data out of training sets, indexes and prompts in the first place. Removing it afterwards is expensive and incomplete.',
  flow: ['Data source', 'Inspect', 'Findings', 'De-identify', 'Clean copy', 'Downstream use'],
  steps: [
    [0, 'Data sits in [[bigquery]], [[gcs]] or arrives as text in a request.'],
    [1, 'An inspection job or call scans for configured info types (built-in and custom).'],
    [2, 'Findings list type, location and likelihood, and can feed tags in [[knowledge-catalog]].'],
    [3, 'A de-identification transform redacts, masks or tokenises matches.'],
    [4, 'The cleaned copy is written to a separate location.'],
    [5, 'Training, indexing or prompting use the clean copy; the original keeps strict access.']
  ],
  gotchas: [
    '**Detection is probabilistic.** Expect false positives and misses. Tune likelihood thresholds and add custom detectors for your own identifiers.',
    '**Tokenisation keys are sensitive.** Whoever holds the key can reverse tokens ([[kms]]).',
    '**Scanning cost is per byte.** Sample large sources first, and use discovery to focus.',
    '**Free text is hardest.** Names in odd formats, or sensitive facts without a pattern, pass through.'
  ],
  edges: [
    'Latency of an inline call adds to request time, so do it asynchronously where you can.',
    'Image redaction relies on OCR quality.',
    'De-identified data can sometimes be re-identified by combining fields, so assess the risk.'
  ],
  ml: [
    'Redacting prompts and logs before storage.',
    'Cleaning documents before they enter a RAG index or a tuning set ([[rag-engine]], [[ap-tuning]]).',
    'Discovery of where personal data lives, to scope privacy and deletion work.'
  ],
  pairs: ['model-armor', 'bigquery', 'gcs', 'kms', 'knowledge-catalog', 'rag-engine'],
  cost: 'Billed per GB inspected or transformed, with discovery billed by profiled data. Costs scale with volume, so scan selectively and cache results.'
});

S({
  id: 'vpc-sc', cat: 'security', name: 'VPC Service Controls', doc: 'vpc-service-controls/docs',
  tag: 'Perimeters that stop data leaving approved projects, even with stolen credentials.',
  what: 'VPC Service Controls (VPC-SC) draws a **service perimeter** around projects and Google APIs. Calls that cross the perimeter, such as copying a [[bigquery]] table to an outside project or reading a [[gcs]] bucket from the internet, are blocked unless an **ingress or egress rule** or **access level** allows them. IAM answers who may; the perimeter answers from where and to where.\n\nThe point is exfiltration defence: a leaked credential still cannot move data out of the perimeter, which is why it features in most regulated AI designs.',
  flow: ['Request to API', 'Identify project + caller', 'Perimeter check', 'Ingress / egress rules', 'Allow or deny', 'Audit'],
  steps: [
    [0, 'A caller sends a request to a protected API, such as the Gemini endpoint, BigQuery or Cloud Storage.'],
    [1, 'Google identifies the target project, the caller identity and network context.'],
    [2, 'It checks whether the request crosses the perimeter boundary.'],
    [3, 'Rules and access levels (IP ranges, device state, identities) are evaluated.'],
    [4, 'The request is allowed or rejected with a violation error.'],
    [5, 'Violations are recorded in [[audit-logs]] for tuning and investigation.']
  ],
  gotchas: [
    '**Start in dry-run mode.** Enforcing immediately breaks things you did not know crossed the boundary, including Google-managed pipelines.',
    '**Not every service is supported,** or supported equally. Check the product list for each AI service you rely on.',
    '**Perimeters are all-or-nothing per service,** so partner or SaaS access needs explicit ingress rules.',
    '**Debugging is slow.** Violation logs are cryptic until you learn to read them.'
  ],
  edges: [
    'Cross-project designs (a shared model project, separate data projects) require bridges or rules carefully scoped.',
    'Access levels based on IP are fragile for remote work.',
    'Notebooks and package installs often need allowed egress paths.'
  ],
  ml: [
    'Keeping training data, models and prompts inside a boundary for regulated workloads.',
    'Limiting where agents can send data, a backstop to application controls.',
    'Evidence for compliance reviews on data residency and exfiltration.'
  ],
  pairs: ['iam', 'psc', 'vpc', 'bigquery', 'gcs', 'audit-logs'],
  cost: 'There is no separate charge for VPC-SC; the cost is operational effort in design, dry-run analysis and ongoing exceptions.'
});

S({
  id: 'model-armor', cat: 'security', name: 'Model Armor', doc: 'model-armor/docs',
  tag: 'Screens prompts and responses for injection, leaks and unsafe content, as an API or gateway policy.',
  what: 'Model Armor inspects what goes into and comes out of models and agents. Templates configure filters for **prompt injection and jailbreak**, **sensitive data** (using [[sdp]]), **malicious URLs**, and **responsible-AI categories** such as hate or harassment, each with confidence thresholds and an enforcement choice (block, or only inspect and log). It works with any model, not just Gemini, and can be called directly through an API or enforced by the platform in front of the model: [[agent-governance|Agent Gateway]], [[apigee]], the [[gke]] Inference Gateway and Agent Platform integrations.\n\nIt is one layer, not a security boundary on its own. It reduces bad input and output; permissions and perimeters limit the damage when something gets through.',
  flow: ['Prompt in', 'Model Armor template', 'Filters', 'Allow / block', 'Model call', 'Screen response'],
  steps: [
    [0, 'A prompt (or tool output about to be fed to a model) enters your app or gateway.'],
    [1, 'The app or gateway calls Model Armor with a chosen template.'],
    [2, 'Filters run: injection and jailbreak detection, sensitive data, malicious URLs, safety categories.'],
    [3, 'The result says match or no match per filter; policy decides to block, redact or pass.'],
    [4, 'Allowed prompts go to the model ([[gemini]], a partner model, or a self-hosted model).'],
    [5, 'The response is screened the same way before it reaches the user or the next tool.']
  ],
  gotchas: [
    '**Detection is not perfect.** Attackers adapt, and false positives block legitimate input. Run in inspect-only mode first and tune thresholds on real traffic.',
    '**Screen tool output and retrieved documents,** not just user prompts. Indirect injection arrives through data the agent reads.',
    '**Latency adds up.** An extra call on each hop adds time. Screen at the gateway rather than inside every service.',
    '**It is a separate service** with its own endpoint, quota and enablement.'
  ],
  edges: [
    'Floor settings apply minimum protection across a project or organisation, so teams cannot drop below a baseline.',
    'Block decisions need a user experience: what does the user see?',
    'Logging prompts for review is itself sensitive data. Set retention.'
  ],
  ml: [
    'A uniform first line of defence for all model traffic, across models and teams.',
    'Protecting agents against indirect prompt injection from documents and web pages ([[adk]]).',
    'Compliance evidence that content controls are on and measured.'
  ],
  pairs: ['agent-governance', 'apigee', 'gemini', 'sdp', 'adk', 'agent-protocols'],
  cost: 'Billed per volume of text screened (tokens or characters) by filter, with a free allowance. Cost scales with traffic, so apply it once per hop, not repeatedly.'
});

S({
  id: 'agent-governance', cat: 'security', name: 'Agent Identity, Registry & Gateway', doc: 'gemini-enterprise-agent-platform/agents',
  tag: 'Treat each agent as a principal: a unique identity, an approved catalogue, a policy chokepoint.',
  what: 'Three Agent Platform services (introduced in 2026) bring governance to agent fleets. **Agent Identity** gives each agent a unique, cryptographically verifiable identity with an auditable trail mapped to authorisation policy, so you can say what each agent may do and what it did. **Agent Registry** is a central catalogue of approved agents, tools, skills and MCP servers, so only vetted assets are discoverable. **Agent Gateway** is the policy-enforced path between agents and tools across environments, enforcing rules and applying [[model-armor|Model Armor]]. Detection features (anomaly detection, threat detection, a security dashboard in Security Command Center) look for unusual agent behaviour.\n\nGovernance is opt-in. Existing agents do not gain these controls until you adopt them, and some pieces are in preview.',
  flow: ['Register agent', 'Issue identity', 'Discover (registry)', 'Call via gateway', 'Policy + screening', 'Audit + detect'],
  steps: [
    [0, 'A team registers an agent and its tools in the Agent Registry, with owners and descriptions.'],
    [1, 'Agent Identity issues the agent a unique identity and credentials, with authorisation policy attached ([[iam]]).'],
    [2, 'Other agents and users discover only approved assets through the registry.'],
    [3, 'Calls from agents to tools and to other agents pass through Agent Gateway.'],
    [4, 'The gateway enforces policy (allowed tools, data rules) and runs [[model-armor]] screening.'],
    [5, 'Actions are logged under the agent\'s identity ([[audit-logs]]), and anomaly and threat detection watch for odd behaviour.']
  ],
  gotchas: [
    '**Governance only covers what routes through it.** An agent that calls a tool directly bypasses the gateway. Make the gateway the only allowed path with network and IAM controls.',
    '**A registry is a process as much as a product.** Without an approval workflow and owners, it becomes a stale list.',
    '**Preview features can change.** Check the status of each component before you depend on it.',
    '**New services need enabling separately,** and have their own endpoints and quotas.'
  ],
  edges: [
    'Delegation (the agent acting on behalf of a user) needs clear rules about which identity appears in downstream audit logs.',
    'Agents built outside Google Cloud can be registered and governed, but with feature differences.',
    'Policy sprawl: many agent-specific rules are hard to review. Prefer a few templates.'
  ],
  ml: [
    'Giving every agent a least-privilege identity instead of a shared service account.',
    'A single, auditable path for agent-to-tool traffic in a large organisation ([[agent-protocols]]).',
    'Answering the audit question "what did this agent do, and who allowed it?".'
  ],
  pairs: ['iam', 'model-armor', 'agent-runtime', 'agent-protocols', 'audit-logs', 'vpc-sc'],
  cost: 'Pricing follows each component (gateway traffic processed, registry and identity usage, detection features); several are new or in preview, so confirm current rates. The larger cost is the effort to design policy and ownership.'
});
