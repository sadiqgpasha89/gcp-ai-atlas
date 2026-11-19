/* Generative AI & Agents (Gemini Enterprise Agent Platform, formerly Vertex AI) */
S({
  id: 'gemini', cat: 'genai', name: 'Gemini on the Agent Platform', doc: 'gemini-enterprise-agent-platform/overview',
  tag: 'Google foundation models through an enterprise API: multimodal, long-context, tool-using.',
  what: 'Gemini is Google\'s family of multimodal models, offered in tiers: **Pro** for the hardest reasoning, **Flash** as the balanced workhorse, and **Flash-Lite** for high-volume, low-cost work. They take text, images, audio, video and PDFs, support very long context (up to around a million tokens), and have controllable "thinking" for harder problems. Tool features include function calling, structured JSON output, grounding with Google Search or Maps, code execution, URL context and computer use, plus a **Live API** for real-time voice and video streaming. Embedding models for retrieval are offered alongside.\n\nYou call the same models either through the Gemini Developer API (API key, fast start) or through the Agent Platform (IAM, VPC Service Controls, customer-managed keys, data residency, Provisioned Throughput). Both use the `google-genai` SDK; the older `vertexai` generative modules were removed. Specific model versions change every few months, so confirm names, limits and prices in Model Garden.',
  flow: ['Build request', 'Auth + endpoint', 'Input screening', 'Model + thinking', 'Tools + grounding', 'Stream output'],
  steps: [
    [0, 'Your app assembles a request: system instructions, conversation, retrieved passages, tool schemas and a response schema.'],
    [1, 'The `google-genai` client authenticates with a service account ([[iam]]) and targets a regional or global endpoint in your project.'],
    [2, 'Optional [[model-armor|Model Armor]] and built-in safety settings screen the prompt for injection, sensitive data and unsafe content.'],
    [3, 'The model reads the (possibly cached) context and reasons, spending a bounded budget of thinking tokens if enabled.'],
    [4, 'If it needs a tool, it returns a function call; your code or a managed tool runs it, and the result goes back into the loop. Grounding adds search or your own data.'],
    [5, 'Tokens stream back. Usage metadata reports input, output, cached and thinking tokens for cost tracking.']
  ],
  gotchas: [
    '**Thinking tokens bill as output.** A hard prompt on a high thinking setting can cost several times a plain one. Set budgets per task class.',
    '**Quota is per project, model and region,** and pay-as-you-go traffic shares capacity dynamically, so bursts can see `429` errors. Request increases or buy Provisioned Throughput before launch ([[quotas]]).',
    '**Models are retired on a published schedule.** Pin a version, subscribe to deprecation notices and keep an eval set so you can migrate in days.',
    '**Long context is not free recall.** Quality can drop in the middle of very long prompts. Retrieve the relevant parts instead of sending everything.',
    '**Structured output guarantees shape, not truth.** A valid JSON object can still contain a wrong value. Validate against the source.'
  ],
  edges: [
    'Context caching (implicit and explicit) cuts the cost of repeated prefixes, but only if the prefix is byte-identical and stable. Put changing text at the end.',
    'Batch mode runs requests asynchronously at a discount for work that can wait up to a day.',
    'Regional versus global endpoints trade availability against data-residency guarantees. Check the legal requirement before choosing.',
    'Grounding with Google Search sends the query to Search and carries extra cost and display requirements.'
  ],
  ml: [
    'Reasoning model for [[adk|agents]], RAG answers ([[rag-engine]]) and classification or extraction at volume.',
    'Multimodal understanding: read scanned documents, screenshots, audio and video directly, often replacing a separate OCR or transcription step ([[document-ai]] when you need field-level accuracy and audit).',
    'Embeddings for [[vector-search]], [[alloydb]] or [[bigquery-ai]] retrieval.',
    'Batch scoring of millions of records with the batch endpoint, from [[bigquery-ai]] or a pipeline.'
  ],
  pairs: ['model-garden', 'rag-engine', 'adk', 'model-armor', 'ap-tuning', 'quotas', 'vector-search'],
  cost: 'Billed per million input and output tokens, with different rates by tier, modality and context length; thinking tokens count as output; cached input is billed at a reduced rate; batch requests are discounted. Provisioned Throughput trades a fixed commitment for reserved capacity. Use the pricing page and measure real token counts.'
});

S({
  id: 'model-garden', cat: 'genai', name: 'Model Garden', doc: 'vertex-ai/generative-ai/docs/model-garden/explore-models',
  tag: 'A catalogue of 200+ Google, open and partner models you can call or deploy.',
  what: 'Model Garden is the model catalogue of the Agent Platform. It lists Google models (Gemini, Imagen, Veo, Gemma and embedding models), **partner models** such as Anthropic Claude, and many open-weight models (Llama, Mistral, DeepSeek, Qwen and others). Each can be used in one of three ways: as a **managed API** (model as a service, pay per token), as a **one-click deployment** to a dedicated endpoint you control, or as a base for tuning.\n\nThat makes it the place to compare models on your own data without changing vendors or clouds, and to keep a fallback model available inside the same security boundary.',
  flow: ['Browse + compare', 'Choose access mode', 'Enable / deploy', 'Call endpoint', 'Evaluate', 'Swap or fall back'],
  steps: [
    [0, 'You browse the catalogue and shortlist models by capability, licence, modality and price.'],
    [1, 'For each you choose: managed API (no infrastructure), or self-deploy (your own GPUs or TPUs and a dedicated endpoint).'],
    [2, 'Partner models need an enablement step and acceptance of terms; open models deploy to an endpoint on a machine type you pick.'],
    [3, 'Your app calls them through the same SDK and IAM model as Gemini ([[gemini]]).'],
    [4, 'You run the same eval set across candidates ([[ap-evals]]).'],
    [5, 'Because the interface is shared, you can route by task or fail over to a second model with little code.']
  ],
  gotchas: [
    '**Not every model is in every region,** and partner model quotas are set separately from Gemini.',
    '**Self-deployed models cost money while the endpoint is up,** even with no traffic. Autoscale to a minimum, and undeploy test endpoints.',
    '**Licences differ.** Some open models restrict commercial use or require attribution. Legal should check before production.',
    '**API shape differs slightly by provider.** A model-agnostic wrapper helps, but features such as caching or thinking do not map one to one.'
  ],
  edges: [
    'Managed partner models are billed and often data-handled under that provider\'s terms layered on Google Cloud. Read the data-use terms.',
    'A one-click deployment picks a sensible default container, not the fastest. For large volumes, tune it or move to [[gke]].',
    'Catalogue entries and versions change frequently.'
  ],
  ml: [
    'Bake-offs between Gemini tiers, Claude and open models on your eval set before committing ([[ap-evals]]).',
    'Starting point for fine-tuning an open model ([[ap-tuning]]).',
    'A second-source model for resilience, in the same project and security perimeter.'
  ],
  pairs: ['gemini', 'ap-tuning', 'ap-inference', 'ap-evals', 'gke'],
  cost: 'Managed APIs bill per token under each provider\'s rates. Self-deployed models bill for the underlying machines and accelerators by the hour. Compare cost per task, not list price per token.'
});

S({
  id: 'rag-engine', cat: 'genai', name: 'RAG Engine', doc: 'vertex-ai/generative-ai/docs/rag-engine/rag-overview',
  tag: 'Managed ingestion, chunking, retrieval and grounding for retrieval-augmented generation.',
  what: 'RAG Engine manages the plumbing between your documents and a model. You create a **corpus**, import files from [[gcs]], Google Drive or other sources, and it parses and chunks them, calls an embedding model, stores vectors, and retrieves relevant chunks at query time. You can plug the retrieval into a [[gemini]] call as a tool, so the model answers with the retrieved passages and citations.\n\nIt supports several vector backends (a managed default, [[vector-search]], [[agent-retrieval|Agent Retrieval]], and some third-party stores) and retrieval options such as filtering and re-ranking. It is the shortest route from a folder of documents to a cited assistant, and you can replace its parts later as quality or scale needs change.',
  flow: ['Documents', 'Parse + chunk', 'Embed', 'Vector store', 'Retrieve + rank', 'Grounded answer'],
  steps: [
    [0, 'Source files (manuals, policies, tickets) sit in [[gcs]] or a connected source and are imported into a corpus.'],
    [1, 'A parser (optionally a layout-aware one) extracts text and structure, and chunking rules split it into passages.'],
    [2, 'An embedding model turns each chunk into a vector.'],
    [3, 'Vectors and metadata are stored in the chosen backend.'],
    [4, 'At question time the query is embedded, the nearest chunks are retrieved (with filters), and optionally re-ranked.'],
    [5, '[[gemini]] receives the chunks as context and returns an answer with citations to the sources.']
  ],
  gotchas: [
    '**Retrieval quality is usually the real problem.** Wrong chunk size, poor parsing of tables, or missing metadata means the right passage never surfaces. Measure recall at k separately from answer quality.',
    '**Access control is yours to enforce.** Without per-user metadata filters, any user can retrieve any chunk. Test with users from different groups.',
    '**Imports are not instant.** New documents are searchable only after the import completes.',
    '**Changing the embedding model or chunking needs a re-import** into a new corpus.',
    '**Its security controls are narrower than the rest of the platform.** Google documents that VPC Service Controls and CMEK are supported, and that data residency and Access Transparency (AXT) controls are **not**. CMEK also applies only to corpora that use the managed RAG database, and the key is fixed when the corpus is created. For regulated or location-bound data, check the current documentation and see the [[p:compliance-matrix|compliance matrix]] before choosing it.'
  ],
  edges: [
    'PDF tables, scans and images need a layout-aware or OCR step to be retrievable ([[document-ai]]).',
    'Very large corpora, strict latency or complex hybrid search may outgrow the managed default and need [[vector-search]] or [[alloydb]] directly.',
    'Deleting a source file does not automatically remove its chunks from every backend. Verify deletes.'
  ],
  ml: [
    'Internal assistants over policy, product and support content with citations.',
    'The retrieval tool inside an agent, next to action tools ([[adk]]).',
    'A baseline to beat: if a managed pipeline already meets your recall target, custom retrieval is not needed.'
  ],
  pairs: ['gemini', 'vector-search', 'agent-retrieval', 'ai-search', 'gcs', 'document-ai', 'model-armor'],
  cost: 'Billed for embedding calls at import, vector storage and serving in the chosen backend, retrieval operations, and then the model tokens for each answer. Large re-imports are a one-off but real cost.'
});

S({
  id: 'ai-search', cat: 'genai', name: 'Agent Search', doc: 'generative-ai-app-builder/docs/introduction',
  tag: 'Search and answer over your content as a managed product, with relevance tuning.',
  what: 'Agent Search (formerly Vertex AI Search; part of the Agent Platform, and the engine under many Gemini Enterprise connectors) is a managed search service. You point it at websites, unstructured documents, structured data or connected SaaS content, and it builds the index, handles ranking and semantic understanding, and returns results or **generated answers with citations**. It has configuration for relevance, facets, boost rules and access control, and variants for media and retail (search and recommendations for commerce).\n\nChoose it over [[rag-engine]] when you want a search product with relevance tooling, connectors and a UI-ready API, rather than assembling retrieval parts yourself.',
  flow: ['Connect data', 'Crawl / import', 'Index + understand', 'Query', 'Rank + filter', 'Answer + citations'],
  steps: [
    [0, 'You create a data store from a website, a bucket, a structured source or a SaaS connector.'],
    [1, 'The service imports and refreshes content on a schedule or by event.'],
    [2, 'It parses, chunks and indexes, building semantic and keyword indexes with entity understanding.'],
    [3, 'A query arrives from your app or a user, with optional user identity.'],
    [4, 'Results are ranked, filtered by access control and boosts, and grouped by facets.'],
    [5, 'Optionally a model composes a summary answer, with each claim linked to its source.']
  ],
  gotchas: [
    '**Identity-aware access needs setup.** Without mapping users to document permissions, search can show results users should not see.',
    '**Freshness varies by connector.** A SaaS connector may sync hourly or daily.',
    '**The name changed but parts of the surface did not.** Google renamed Vertex AI Search to Agent Search, yet the console still shows "Vertex AI Search and AI Applications", and the API is still `discoveryengine.googleapis.com`. Search your own IAM roles, audit logs and Terraform for the old and the new names.'
  ],
  edges: [
    'Generated answers can be disabled per query, which is wise for regulated content.',
    'You have less control over chunking and ranking than in a self-built pipeline.',
    'Relevance tuning needs real queries and judgments, not guesses.'
  ],
  ml: [
    'Employee or customer search over documents and help content with answers and links.',
    'A managed retrieval tool for agents when you do not need to own the index ([[adk]]).',
    'Commerce search and recommendations for catalogues.'
  ],
  pairs: ['rag-engine', 'gemini-enterprise', 'vector-search', 'gcs', 'identity-platform'],
  cost: 'Billed per query by edition and feature (search, generative answers, advanced features), plus indexed data storage. Costs scale with query volume, so check the unit prices for answer generation.'
});

S({
  id: 'agent-studio', cat: 'genai', name: 'Agent Studio', doc: 'gemini-enterprise-agent-platform/agents',
  tag: 'A low-code, prompt-first builder for agents, with export to code.',
  what: 'Agent Studio is the visual builder in the Agent Platform (the successor to Vertex AI Studio and the console-based part of Agent Builder). You describe an agent in natural language, attach tools and data sources, test it in a chat pane, and deploy it. When the agent outgrows the visual tool you can **export the logic to the Agent Development Kit** ([[adk]]) and continue in code.\n\nIt is also a prompt playground for comparing models, and a place for non-engineers and engineers to prototype together. Treat it as a way to reach a working prototype fast, not as the place to hold production logic that needs review and tests.',
  flow: ['Describe goal', 'Attach tools + data', 'Test in chat', 'Evaluate', 'Deploy', 'Export to ADK'],
  steps: [
    [0, 'You write what the agent should do, its tone and its limits in plain language.'],
    [1, 'You connect tools (APIs, MCP servers), knowledge ([[rag-engine]], [[ai-search]]) and a model ([[gemini]]).'],
    [2, 'A chat pane runs the agent so you can see its tool calls and reasoning.'],
    [3, 'You save test conversations and score them with [[ap-evals]].'],
    [4, 'You deploy to [[agent-runtime]] or to the [[gemini-enterprise|Gemini Enterprise]] app.'],
    [5, 'If you need version control, tests or custom flow, you export to [[adk]] code.']
  ],
  gotchas: [
    '**A visual prototype is not production-ready.** It still needs evals, permission review and monitoring.',
    '**Prompt edits in a UI are easy to make and hard to review.** Keep the canonical version in source control once it matters.',
    '**Tool permissions apply as configured.** An agent that can call a broad API can do whatever that API allows ([[agent-governance]]).'
  ],
  edges: [
    'Exports may not round-trip: edits to exported code do not flow back to the visual definition.',
    'Features and naming are new as of 2026 and still moving.',
    'Test conversations are not an eval set. Build a separate, versioned one.'
  ],
  ml: [
    'Fast prototypes to show stakeholders, with a clear path to code.',
    'Prompt and model comparison before locking a design.',
    'Low-risk internal agents with read-only tools.'
  ],
  pairs: ['adk', 'agent-runtime', 'gemini', 'gemini-enterprise', 'ap-evals'],
  cost: 'There is no separate charge for the design surface; you pay for model tokens during testing, tools called, and the runtime where the agent is deployed.'
});

S({
  id: 'adk', cat: 'genai', name: 'Agent Development Kit (ADK)', doc: 'https://google.github.io/adk-docs/',
  tag: 'An open-source, code-first framework for building single and multi-agent systems.',
  what: 'The Agent Development Kit is an open-source framework (Python first, with other language SDKs; check current support) for defining agents, tools and the control flow between them. You compose **LLM agents** (the model decides), **workflow agents** (sequential, parallel or loop patterns you fix), and custom agents, then arrange them into trees or, in the newer graph-based model, networks of sub-agents. It has built-in tool support (functions, OpenAPI, MCP), session and memory services, evaluation tooling and streaming, and it speaks the Agent2Agent protocol.\n\nIt is model-agnostic and deploys anywhere containers run, but is tuned for [[agent-runtime]]. Most teams use it when they need to control the flow, test behaviour in CI, or run several agents with different trust boundaries.',
  flow: ['Define agents + tools', 'Runner', 'Session state', 'Model + tool loop', 'Sub-agent delegation', 'Response events'],
  steps: [
    [0, 'You define a root agent with instructions, a model and tools, and optionally sub-agents or a workflow agent that sequences them.'],
    [1, 'A **Runner** receives the user message and starts an invocation.'],
    [2, 'A session service loads the conversation and state ([[agent-memory]]).'],
    [3, 'The agent calls the model; if it requests a tool, the Runner executes it and feeds the result back, repeating until a final answer.'],
    [4, 'A coordinator may hand a task to a specialist sub-agent, or to a remote agent over A2A ([[agent-protocols]]).'],
    [5, 'The Runner emits a stream of events (messages, tool calls, state changes) that you log, trace and display.']
  ],
  gotchas: [
    '**Loops need hard limits.** Set maximum iterations and token budgets for every agent that can call tools repeatedly.',
    '**Vague tool descriptions cause wrong tool choices.** Write each tool docstring as an interface contract, and test tool selection on its own.',
    '**Multi-agent designs multiply cost and failure modes.** Start with one agent and a few narrow tools; add agents only for separate trust boundaries or clearly different skills.',
    '**State leakage:** shared session state between sub-agents can carry data one should not see. Scope state keys deliberately.'
  ],
  edges: [
    'Tool outputs are text the model reads, so a malicious document or web page can contain instructions. Treat tool output as untrusted data ([[model-armor]]).',
    'Deterministic workflow agents are easier to test than free-form delegation. Prefer them where the path is known.',
    'Framework versions are moving quickly. Pin versions and read release notes.'
  ],
  ml: [
    'The reference way to build code-first agents on Google Cloud, with evaluation in CI ([[ap-evals]]).',
    'Wrapping existing APIs and databases as narrow tools ([[agent-protocols]], [[alloydb]]).',
    'Composing a supervisor with specialist agents, each with its own identity and permissions ([[agent-governance]]).'
  ],
  pairs: ['agent-runtime', 'agent-memory', 'agent-protocols', 'gemini', 'ap-evals', 'agent-governance'],
  cost: 'ADK is free. You pay for model tokens, tool backends, and wherever the agent runs. Multi-step agents make several model calls per task, so measure cost per task rather than per call.'
});

S({
  id: 'agent-runtime', cat: 'genai', name: 'Agent Runtime (formerly Agent Engine)', doc: 'agent-builder/agent-engine/overview',
  tag: 'Managed hosting for agents with scaling, sessions, sandboxes and long-running support.',
  what: 'Agent Runtime deploys an agent (built with ADK, LangGraph, LangChain, CrewAI or your own code) as a managed service with an API. It handles packaging, scaling (with sub-second cold starts and runs that can last days), identity, logging and tracing, and plugs into **Sessions**, **Memory Bank** ([[agent-memory]]) and **Agent Sandbox** for running model-generated code or browser actions in isolation.\n\nIt is the managed middle ground between [[cloud-run]] (you operate everything) and a fully no-code product. You write agent code; Google runs it. It can also publish the agent over A2A so other agents can call it.',
  flow: ['Package agent', 'Deploy', 'Invoke API', 'Session + memory', 'Sandboxed tools', 'Trace + scale'],
  steps: [
    [0, 'You package the agent code and its dependencies, usually with the ADK command-line tools.'],
    [1, 'Deployment creates a managed resource with its own service identity ([[agent-governance]]).'],
    [2, 'A client calls the agent API, optionally streaming events back.'],
    [3, 'The runtime loads the session and, if enabled, relevant long-term memories ([[agent-memory]]).'],
    [4, 'Tool calls run in your tool backends, and model-generated code runs inside an isolated sandbox.'],
    [5, 'Traces and logs go to observability ([[cloud-monitoring]]), and the platform scales instances with demand.']
  ],
  gotchas: [
    '**Billing is for compute residency** (vCPU-hours and memory), so a long-lived idle agent still costs money. Set scaling bounds and stop what you are not using.',
    '**Agent identity is not your identity.** Tools run with the agent\'s service identity unless you pass user credentials deliberately. Decide whose authority each action uses.',
    '**Networking is configured separately.** Reaching private resources needs [[psc]] or VPC access set up, and egress controls need [[vpc-sc]] design.',
    '**Dependencies must be pinned.** A rebuild with newer library versions can change behaviour.'
  ],
  edges: [
    'Long-running agents need checkpointed state, because a deployment or failure can restart an instance.',
    'Concurrency per instance matters when each request holds a large context.',
    'Quotas on deployments and concurrent sessions apply per project and region ([[quotas]]).'
  ],
  ml: [
    'Production hosting for ADK agents without owning servers.',
    'Long-running research or back-office agents that work for hours with human check-ins ([[workflows]] for approvals).',
    'Exposing an internal agent to other teams as an A2A endpoint ([[agent-protocols]]).'
  ],
  pairs: ['adk', 'agent-memory', 'agent-governance', 'cloud-run', 'cloud-monitoring', 'gemini'],
  cost: 'Billed for the compute your agent consumes while running (vCPU-hours and GB-hours), plus separate charges for Sessions, Memory Bank and Sandbox use, and model tokens. Compute residency is the line item to watch for always-on agents.'
});

S({
  id: 'agent-memory', cat: 'genai', name: 'Sessions & Memory Bank', doc: 'vertex-ai/generative-ai/docs/agent-engine/memory-bank/overview',
  tag: 'Managed short-term conversation state and curated long-term memory for agents.',
  what: 'Two managed services give agents continuity. **Sessions** store the history and state of each conversation, keyed by an id you can map to your own customer or case record. **Memory Bank** goes further: it generates, consolidates and retrieves **long-term memories** from conversations (preferences, facts, decisions), scoped to a user or other key, with profile-style retrieval for low-latency recall.\n\nThe point is that an agent can pick up where it left off, across sessions and instances, without you building your own extraction, deduplication and retrieval pipeline.',
  flow: ['Conversation', 'Session store', 'Memory generation', 'Consolidate', 'Retrieve', 'Next session'],
  steps: [
    [0, 'A user talks to an agent; each turn is appended to its session.'],
    [1, 'Sessions persist events and state so any instance can resume the conversation.'],
    [2, 'At the end of a session (or on a trigger) Memory Bank asks a model to extract candidate memories.'],
    [3, 'New memories are merged with existing ones, resolving duplicates and contradictions.'],
    [4, 'At the start of the next conversation, relevant memories (by similarity or profile) are fetched for the user.'],
    [5, 'They are placed into the prompt so the agent personalises without the user repeating themselves.']
  ],
  gotchas: [
    '**Memory is personal data.** Scope it per user, define retention, and support deletion, including from backups and logs. Decide what the agent may remember before it starts.',
    '**Generated memories can be wrong or stale,** and a wrong memory is repeated confidently. Let users view and correct them.',
    '**Memory can carry injected instructions.** If an attacker gets a malicious statement remembered, it persists. Treat memory content as untrusted input.',
    '**Cross-tenant leakage** is a risk if memory scopes are not set strictly. Test with two users.'
  ],
  edges: [
    'Memory generation costs model tokens per session. Trigger it selectively.',
    'Retrieval adds latency to the first turn. Profile-style memory is faster than similarity search.',
    'Custom session ids let you join agent conversations with CRM records, which is also a privacy link to manage.'
  ],
  ml: [
    'Personalised assistants that remember preferences across sessions.',
    'Long-running case-handling agents that need continuity across days.',
    'Support agents that carry context from prior tickets with the customer\'s consent.'
  ],
  pairs: ['agent-runtime', 'adk', 'firestore', 'sdp', 'agent-governance'],
  cost: 'Sessions are billed on events stored and retrieved; Memory Bank bills for memory generation (model tokens), storage and retrieval operations. Check current rates, as these are new services.'
});

S({
  id: 'gemini-enterprise', cat: 'genai', name: 'Gemini Enterprise (app)', doc: 'gemini/enterprise/docs',
  tag: 'The employee-facing agent workspace, absorbing Agentspace, for non-engineers.',
  what: 'Gemini Enterprise is the packaged, business-user product: a chat and agent workspace connected to company data (Workspace, Microsoft 365, Salesforce, ServiceNow and many more), with prebuilt agents such as research agents, an **Agent Designer** for no-code agent building, an inbox to manage long-running agent tasks, and an agent gallery. It absorbed Agentspace in 2026.\n\nThe Agent Platform ([[agent-runtime]], [[adk]]) is for engineers building agents; Gemini Enterprise is where many of those agents are delivered to employees, and where business teams build their own. The buy-versus-build decision often starts here.',
  flow: ['Connect data', 'Index + permissions', 'User prompt', 'Agent / search', 'Actions via tools', 'Answer + inbox'],
  steps: [
    [0, 'An admin connects data sources and identity providers.'],
    [1, 'Content is indexed with permissions mapped, so users only see what they may see ([[ai-search]]).'],
    [2, 'An employee asks a question or starts an agent in the app.'],
    [3, 'A prebuilt agent, a custom Agent Designer agent, or a registered engineer-built agent handles it.'],
    [4, 'Where allowed, the agent calls tools to act, for example creating a ticket, subject to policy ([[agent-governance]]).'],
    [5, 'The answer arrives with citations; long-running tasks report back to the user\'s inbox.']
  ],
  gotchas: [
    '**Connectors inherit the quality of source permissions.** Overshared folders become over-searchable.',
    '**Per-seat licensing** makes cost scale with headcount, not usage. Model it against the number of real users.',
    '**Business-built agents still need governance.** Decide who can publish an agent and what tools it may touch.',
    'Product packaging and names have changed repeatedly. Confirm current editions.'
  ],
  edges: [
    'Prebuilt capabilities are the capability ceiling. Differentiating features may need custom agents on the Agent Platform.',
    'Data residency and retention depend on edition and region.',
    'Agent actions run with the user\'s delegated authority or a service identity, which differ in audit trails.'
  ],
  ml: [
    'Enterprise search and research assistants without engineering effort.',
    'A delivery channel for agents built with [[adk]], registered through [[agent-governance]].',
    'The "buy" row in a build, buy or customise decision.'
  ],
  pairs: ['ai-search', 'agent-studio', 'agent-runtime', 'agent-governance', 'identity-platform'],
  cost: 'Typically a per-user subscription by edition, with some consumption-based add-ons. Compare seat cost against the value of heavy users, and against building with [[agent-runtime]].'
});

S({
  id: 'agent-protocols', cat: 'genai', name: 'MCP & Agent2Agent (A2A)', doc: 'mcp/overview',
  tag: 'Open protocols for how agents reach tools and how agents call each other.',
  what: 'Two protocols connect agents to the world. The **Model Context Protocol (MCP)** standardises how an agent discovers and calls tools and reads resources: an MCP server publishes tools with schemas, and any MCP-capable agent can use them. Google Cloud runs managed, remote MCP servers for many of its own services (BigQuery, AlloyDB, Cloud SQL, Spanner, Bigtable, Firestore and others), governed by your IAM, VPC Service Controls and audit logging.\n\n**Agent2Agent (A2A)** standardises how one agent finds another (through an **agent card** describing its skills), sends it tasks and receives results, across frameworks and vendors. Google contributed it to open governance. Together, MCP is "agent to tool" and A2A is "agent to agent".',
  flow: ['Agent', 'Discover (registry / card)', 'Authenticate', 'Call tool / task', 'Policy check', 'Result'],
  steps: [
    [0, 'An agent decides it needs a capability: query a database, or hand a sub-task to another agent.'],
    [1, 'It discovers the target through [[agent-governance|Agent Registry]] or an A2A agent card, which lists skills and endpoints.'],
    [2, 'It authenticates using its agent identity, and the target decides what that identity may do ([[iam]]).'],
    [3, 'The agent sends an MCP tool call or an A2A task with parameters.'],
    [4, 'A gateway applies policy: allowed tools, screening for injection and data leakage ([[model-armor]]), rate limits and logging.'],
    [5, 'The result returns to the calling agent as data to reason over, not as instructions to obey.']
  ],
  gotchas: [
    '**A tool description is a prompt.** An untrusted MCP server can describe a tool in a way that steers the model. Only connect to servers you have vetted, and prefer a registry of approved servers.',
    '**Broad tools are dangerous.** "Run any SQL" lets a wrong or manipulated model do anything the credentials allow. Expose narrow tools such as "get order status".',
    '**Identity propagation is easy to get wrong.** Decide whether a tool acts as the user, as the agent, or as an admin, and keep it consistent.',
    '**Protocols are young.** Specs and SDKs are changing, so pin versions and plan for upgrades.'
  ],
  edges: [
    'Remote MCP servers add a network hop and a failure mode. Cache what you can and set timeouts.',
    'A2A hides the other agent\'s internals, so you cannot inspect its reasoning. Evaluate it by its outputs and contracts.',
    'Tool output is untrusted content: sanitise, and never let it widen permissions.'
  ],
  ml: [
    'Giving agents governed access to [[bigquery]], [[alloydb]] and [[spanner]] through managed MCP servers.',
    'Splitting a large agent system across teams, each team exposing its agent over A2A ([[adk]]).',
    'Building your own narrow MCP tools on [[cloud-run]] for internal systems.'
  ],
  pairs: ['adk', 'agent-governance', 'model-armor', 'bigquery', 'cloud-run', 'apigee'],
  cost: 'The protocols are open and free. You pay for the servers and agents that implement them, gateway or API management in front of them, and the model tokens consumed reading tool results.'
});
