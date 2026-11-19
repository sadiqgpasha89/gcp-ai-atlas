/* Enterprise AI Security, Governance & Google Cloud Architecture Framework */
window.ATLAS.governance = {
  "landingZones": {
    "title": "Enterprise AI Landing Zones & Google Cloud Architecture Framework",
    "intro": "The Google Cloud Architecture Framework recommends extending enterprise Resource Manager landing zones rather than creating an isolated AI silo. An AI workload relies on enterprise identity, network connectivity, centralized logging and organizational policy guardrails.",
    "principles": [
      {
        "name": "Extend, Do Not Fork, Landing Zones",
        "desc": "Incorporate AI platform resources into established Google Cloud organization hierarchies and Shared VPC networks. AI is an application workload, not an alternative cloud platform."
      },
      {
        "name": "Shared Platform vs Workload Projects",
        "desc": "Separate central shared platform services (API gateways, foundational model provisioned throughput, artifact registries) from decentralized application workload projects (feature development, prompt engineering)."
      },
      {
        "name": "Zero Trust Network Architecture",
        "desc": "No public IPs or endpoints on AI services. Enforce Private Service Connect, route all outbound traffic through Cloud Firewall and Cloud NAT, and use Cloud DNS private zones."
      },
      {
        "name": "Policy-Driven Governance",
        "desc": "Enforce security controls programmatically via Organization Policy constraints and VPC Service Controls rather than manual review gates."
      }
    ],
    "hierarchy": [
      {
        "level": "Organization Root",
        "scope": "Enterprise Root",
        "purpose": "Defines global compliance Organization Policies, root IAM roles, and centralized Cloud Billing accounts."
      },
      {
        "level": "Platform / Infrastructure Folder",
        "scope": "Networking · Security · Shared Services",
        "purpose": "Hosts central Shared VPC host projects, Cloud Interconnect / Cloud VPN gateways, Cloud Logging buckets, and Cloud Monitoring workspaces."
      },
      {
        "level": "AI Platform / Core Services Project",
        "scope": "Gemini Provisioned Throughput · Apigee Gateway",
        "purpose": "Hosts enterprise AI gateways ([[apigee]]), shared provisioned model capacity, centralized artifact registries, and enterprise knowledge bases in [[ai-search]]."
      },
      {
        "level": "Workload Folders & Projects",
        "scope": "Business Units & Application Teams",
        "purpose": "Subdivided into Development, Staging, and Production projects. Each team receives isolated projects for prompt testing, agent development, and RAG experimentation."
      },
      {
        "level": "Sandbox Folder",
        "scope": "Isolated R&D",
        "purpose": "Strictly budgeted, network-isolated environments for rapid model prototyping with automated monthly spend caps via [[billing]] alerts and auto-destruction policies."
      }
    ],
    "networkTopology": {
      "type": "Hub-and-Spoke with Shared VPC & Private Service Connect",
      "components": [
        {
          "name": "Shared VPC Host Project",
          "desc": "Hosts centralized network infrastructure, Cloud NAT, Cloud Armor WAF policies, and Private Service Connect endpoints."
        },
        {
          "name": "AI Service Projects",
          "desc": "Isolated spoke projects for AI workloads (GKE model clusters, Cloud Run agent runtimes, Vertex AI Workbench pools)."
        },
        {
          "name": "Private Service Connect (PSC)",
          "desc": "Every Google API (Vertex AI, Cloud Storage, BigQuery, Secret Manager) is accessed privately via internal IP addresses."
        },
        {
          "name": "VPC Service Controls (VPC-SC)",
          "desc": "Enforce a cryptographic security perimeter around Vertex AI and Cloud Storage to prevent data exfiltration."
        }
      ]
    }
  },
  "securityFramework": {
    "title": "Enterprise AI Security Framework",
    "intro": "A defense-in-depth model mapping security controls across every layer of the generative AI stack, grounded in the Google Cloud Security Foundations Guide for AI.",
    "pillars": [
      {
        "id": "identity",
        "name": "1. Identity & Access Management",
        "controls": [
          "**Disable Service Account Keys:** Enforce `iam.disableServiceAccountKeyCreation` organization policy. Use Workload Identity Federation for all CI/CD and external workloads.",
          "**Workload Identity on GKE & Cloud Run:** Workloads authenticate between services (e.g. Cloud Run -> Vertex AI, GKE -> Cloud Storage) using Kubernetes service accounts bound to IAM roles.",
          "**Delegated User Authorization:** Propagate end-user [[iam|Cloud IAM]] OAuth2 bearer tokens so agent tools and RAG retrieval act with user permissions, not administrative privileges.",
          "**Context-Aware Access:** Enforce BeyondCorp Enterprise context-aware access policies verifying device health and location before granting access to AI consoles."
        ]
      },
      {
        "id": "authorization",
        "name": "2. Fine-Grained RBAC & Tool Permissions",
        "controls": [
          "**Least-Privilege Roles:** Assign built-in granular roles: `roles/aiplatform.user` (inference only) vs `roles/aiplatform.admin` (endpoint deployer).",
          "**Tool-Level Permission Boundaries:** Agent tools hosted as [[cloud-run]] services must validate JWT bearer tokens and check caller security scopes before executing business actions.",
          "**Server-Side Parameter Validation:** Tools must strictly validate argument schemas server-side using JSON Schema to prevent parameter tampering or prompt-induced SQL injection."
        ]
      },
      {
        "id": "data",
        "name": "3. Data Security & Cryptography",
        "controls": [
          "**Customer-Managed Encryption Keys (CMEK):** Encrypt data at rest in [[gcs]], [[ai-search]], and [[bigquery]] with customer-managed keys held in [[kms|Cloud KMS]].",
          "**Zero Customer Data Retention (ZCDR):** Contractually confirm with Google Cloud that foundation model prompts and completions are never logged or stored for model training.",
          "**Automated PII De-identification:** Use [[sdp|Sensitive Data Protection (Cloud DLP)]] to detect and redact sensitive personal, healthcare, or financial identifiers before prompts enter model context."
        ]
      },
      {
        "id": "rag-security",
        "name": "4. Document-Level Security in RAG",
        "controls": [
          "**Security Trimming:** Tag documents in [[ai-search]] with Google Cloud Identity user and security group identifiers.",
          "**Mandatory Server-Side Filter Injection:** Inject security filters at the backend search proxy layer. Never trust frontend filters.",
          "**Short-Lived Signed URLs:** Serve raw document downloads from [[gcs]] using short-lived (5-minute) signed URLs verified against the user's storage permissions."
        ]
      },
      {
        "id": "agent-security",
        "name": "5. Agentic Security & Autonomy Controls",
        "controls": [
          "**Human-in-the-Loop (HITL) Approval Gates:** Mandate human authorization (via [[workflows|Cloud Workflows]] callbacks) for all external writes, financial transactions, or customer-facing notifications.",
          "**Container Sandboxing:** Execute dynamic Python code generated by models inside ephemeral, network-isolated sandboxes with restricted disk and CPU limits.",
          "**Hard Iteration & Budget Caps:** Enforce hard stops (max 5 tool turns, 60s timeout, 10,000 tokens) per agent task to prevent infinite loops."
        ]
      },
      {
        "id": "prompt-security",
        "name": "6. Prompt Security & Guardrails",
        "controls": [
          "**Model Armor Prompt Shields:** Screen incoming prompts for direct jailbreak attempts and system prompt extraction attacks using [[model-armor]].",
          "**Indirect Injection Defenses:** Screen untrusted retrieved documents and tool outputs for embedded instructions designed to hijack agent reasoning.",
          "**Delimited System Prompts:** Isolate external content inside unambiguous XML delimiters (`<context>...</context>`) with explicit model instructions to ignore instructions inside tags."
        ]
      },
      {
        "id": "network",
        "name": "7. Network Security & Perimeter Defense",
        "controls": [
          "**Private Service Connect (PSC):** Expose all Vertex AI and Google Cloud APIs exclusively on private IP addresses within virtual networks.",
          "**VPC Service Controls (VPC-SC):** Isolate sensitive AI data within a cryptographic service perimeter to prevent exfiltration to unauthorized Google Cloud projects.",
          "**Cloud Armor Layer 7 WAF:** Front user-facing web applications with [[cloud-armor|Cloud Armor]] rules blocking OWASP Top 10 vulnerabilities and rate-limiting abusive IP addresses."
        ]
      },
      {
        "id": "governance",
        "name": "8. AI Red Teaming & Continuous Governance",
        "controls": [
          "**Continuous Adversarial Testing:** Conduct automated red-teaming sweeps simulating jailbreaks, data exfiltration, and prompt injection before every production release.",
          "**Immutable Audit Trails:** Record every model call, prompt hash, tool execution, and approval event to an immutable [[audit-logs|Cloud Audit Logs]] bucket.",
          "**Responsible AI Verification:** Review AI capabilities against fairness, transparency, and accountability checklists before production sign-off."
        ]
      }
    ]
  },
  "tenancyModels": {
    "title": "Enterprise Multi-Tenancy Architecture Patterns",
    "models": [
      {
        "name": "Pooled / Shared Datastore (Logical Isolation)",
        "fit": "Standard B2B SaaS with hundreds or thousands of low-to-medium risk customers.",
        "mechanism": "Single [[ai-search]] datastore; documents carry `tenant_id` metadata; gateway injects mandatory search filters.",
        "pros": "Lowest infrastructure cost; instant tenant onboarding; scales to millions of documents.",
        "cons": "Logical isolation only; bugs in filter injection could leak data across tenants; shared noisy-neighbor capacity."
      },
      {
        "name": "Datastore-per-Tenant (Isolated Index)",
        "fit": "Moderate tenant counts (50-200) requiring custom schemas or fast one-click tenant deletion.",
        "mechanism": "Dedicated datastore per customer inside a shared Google Cloud project.",
        "pros": "Strong logical separation; distinct schemas per customer; easy tenant deletion and data export.",
        "cons": "Bounded by project datastore quotas; cost accumulates across multiple applications."
      },
      {
        "name": "Project-per-Tenant (Physical Isolation)",
        "fit": "Regulated enterprise tiers, government clients, or contracts mandating dedicated compute.",
        "mechanism": "Dedicated Google Cloud Project and dedicated Cloud Storage bucket with [[vpc-sc]] perimeter per tenant.",
        "pros": "Complete physical isolation; customer-managed encryption keys per tenant; zero noisy-neighbor interference.",
        "cons": "Highest cost ($500 - $2,000+/mo per tenant); high operational overhead to provision and upgrade."
      }
    ]
  },
  "policyInitiatives": {
    "title": "Recommended Google Cloud Organization Policies for AI",
    "policies": [
      {
        "name": "Restrict Public IP Access on Compute & Cloud Run",
        "effect": "Deny",
        "purpose": "Ensures no developer or application can expose AI inference workloads over the public internet."
      },
      {
        "name": "Require Customer-Managed Encryption Keys (CMEK)",
        "effect": "Deny",
        "purpose": "Guarantees that all Cloud Storage document buckets and search indexes are encrypted using Cloud KMS keys."
      },
      {
        "name": "Restrict Approved Vertex AI Model Deployments",
        "effect": "Deny",
        "purpose": "Restricts model invocations in Vertex AI to an approved corporate catalog (e.g. Gemini 1.5 Pro, Gemini 1.5 Flash, text-embedding-004)."
      },
      {
        "name": "Enforce Mandatory Cost Center & Owner Labels",
        "effect": "Deny",
        "purpose": "Blocks resource creation if mandatory resource attribution labels (`cost_center`, `owner`, `environment`) are missing."
      },
      {
        "name": "Enforce Cloud Audit Logging to Centralized Bucket",
        "effect": "Deny",
        "purpose": "Blocks any action that attempts to disable or modify Cloud Audit Logs across all projects."
      }
    ]
  },
  "policyInitiative": {
    "title": "Recommended Google Cloud Organization Policies for AI",
    "policies": [
      {
        "name": "Restrict Public IP Access on Compute & Cloud Run",
        "effect": "Deny",
        "purpose": "Ensures no developer or application can expose AI inference workloads over the public internet."
      },
      {
        "name": "Require Customer-Managed Encryption Keys (CMEK)",
        "effect": "Deny",
        "purpose": "Guarantees that all Cloud Storage document buckets and search indexes are encrypted using Cloud KMS keys."
      },
      {
        "name": "Restrict Approved Vertex AI Model Deployments",
        "effect": "Deny",
        "purpose": "Restricts model invocations in Vertex AI to an approved corporate catalog (e.g. Gemini 1.5 Pro, Gemini 1.5 Flash, text-embedding-004)."
      },
      {
        "name": "Enforce Mandatory Cost Center & Owner Labels",
        "effect": "Deny",
        "purpose": "Blocks resource creation if mandatory resource attribution labels (`cost_center`, `owner`, `environment`) are missing."
      },
      {
        "name": "Enforce Cloud Audit Logging to Centralized Bucket",
        "effect": "Deny",
        "purpose": "Blocks any action that attempts to disable or modify Cloud Audit Logs across all projects."
      }
    ]
  }
};
