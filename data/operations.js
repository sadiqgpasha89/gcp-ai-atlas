/* Production AI Operations Centre: Operational Dashboard, SRE Runbooks & Postmortems */
window.ATLAS.operations = {
  "title": "Production AI Operations Centre",
  "lede": "Operating generative AI and agentic systems requires moving from traditional server health monitoring to stochastic system reliability: tracking token economics, prompt drift, retrieval quality, tool error rates, and 429 quota spikes.",
  "dashboardTemplate": {
    "title": "Mandatory Production AI Operations Dashboard Template",
    "subtitle": "The 10 critical operational indicators that every production AI application must monitor in real time.",
    "widgets": [
      {
        "id": "task-throughput",
        "title": "Task Throughput & Completion Rate",
        "metric": "98.5%",
        "sub": "15,820 Total Tasks · 15,582 Succeeded · 238 Failed",
        "status": "ok",
        "target": "Target: >95% successful task completion rate",
        "kusto": "resource.type=\"cloud_run_revision\" AND jsonPayload.status=~\"success|failure\" | summarize total=count(), succeeded=countif(jsonPayload.status=\"success\") by timestamp_hour"
      },
      {
        "id": "ttft-latency",
        "title": "Time to First Token (TTFT)",
        "metric": "790ms",
        "sub": "P50: 620ms · P95: 1,390ms · P99: 2,080ms",
        "status": "ok",
        "target": "Target: P95 TTFT < 1,500ms for streaming UX",
        "kusto": "metric.type=\"aiplatform.googleapis.com/prediction/online/latency\" | align percentile(95) | every 15m"
      },
      {
        "id": "token-burn",
        "title": "Token Consumption & Cache Efficiency",
        "metric": "19.8M",
        "sub": "Prompt: 13.4M (44% Cached) · Completion: 6.4M",
        "status": "ok",
        "target": "Target: >35% prompt context cache hit rate on repeated prefixes",
        "kusto": "metric.type=\"aiplatform.googleapis.com/prediction/online/token_count\" | group_by [token_type] | every 1h"
      },
      {
        "id": "throttling-429",
        "title": "Model Quota Events (HTTP 429)",
        "metric": "10 events",
        "sub": "0.06% of all requests · 100% absorbed by multi-region failover",
        "status": "ok",
        "target": "Target: <0.1% throttling rate; zero user-facing 429 errors",
        "kusto": "resource.type=\"aiplatform.googleapis.com/Endpoint\" AND protoPayload.status.code=8 | count() by 5m"
      },
      {
        "id": "rag-quality",
        "title": "RAG Retrieval & Groundedness Score",
        "metric": "96.5%",
        "sub": "Recall@5: 91.8% · Groundedness: 96.5% · Relevance: 94.3%",
        "status": "ok",
        "target": "Target: >95% groundedness; >88% Recall@5",
        "kusto": "logName=~\"projects/.*/logs/rag_evaluations\" | extract jsonPayload.groundedness_score | avg() by 6h"
      },
      {
        "id": "tool-failures",
        "title": "Agent Tool-Call Failure Rate",
        "metric": "1.2%",
        "sub": "39 failures out of 3,380 tool dispatches · 0 loops detected",
        "status": "ok",
        "target": "Target: <2.0% tool failure rate; 0 infinite loops",
        "kusto": "jsonPayload.event_type=\"agent_tool_call\" | summarize total=count(), failed=countif(jsonPayload.status != \"success\") by 1h"
      },
      {
        "id": "cost-per-task",
        "title": "Cost per Successful Task",
        "metric": "$0.0138",
        "sub": "Daily Spend: $214.20 · Forecast Month: $6,426",
        "status": "ok",
        "target": "Target: Unit cost below $0.020 per completed task",
        "kusto": "SELECT avg(cost_usd) as cost_per_task, sum(cost_usd) as daily_total FROM `ai_ops.task_billing` GROUP BY date"
      },
      {
        "id": "eval-trend",
        "title": "Automated Evaluation Score Trend",
        "metric": "93.1 / 100",
        "sub": "+1.5 pts vs last model release · 0 critical safety violations",
        "status": "ok",
        "target": "Target: Quality score stable or improving across releases",
        "kusto": "SELECT prompt_version, avg(composite_score) as quality_score FROM `ai_evals.results` GROUP BY prompt_version"
      },
      {
        "id": "safety-shields",
        "title": "Model Armor & Safety Filter Triggers",
        "metric": "0.04%",
        "sub": "11 blocks: 7 Prompt Injection · 4 Harmful Content · 0 Data Leaks",
        "status": "ok",
        "target": "Target: <0.1% trigger rate; 100% blocked at perimeter",
        "kusto": "resource.type=\"aiplatform.googleapis.com/Endpoint\" AND jsonPayload.safety_blocked=true | count() by 1h"
      },
      {
        "id": "dependency-health",
        "title": "AI Dependency Availability & Health",
        "metric": "99.99%",
        "sub": "Gemini: 99.99% · Vertex Search: 99.98% · Cloud Storage: 100%",
        "status": "ok",
        "target": "Target: >99.9% service availability across dependencies",
        "kusto": "metric.type=\"custom.googleapis.com/ai/dependency_health\" | align fraction_true | every 5m"
      }
    ]
  },
  "runbooks": [
    {
      "id": "rb-429-throttling",
      "title": "Runbook 1: Remediating Model Quota & HTTP 429 Spikes",
      "severity": "P1 / P2",
      "trigger": "Cloud Monitoring alert `VertexAIQuotaExhausted` fires (HTTP 429 ResourceExhausted > 1% over 5-minute window).",
      "steps": [
        "**Step 1: Check Active Region:** Confirm which Google Cloud Region is returning 429 errors using Cloud Monitoring Metrics for [[gemini]].",
        "**Step 2: Activate Multi-Region Failover:** In [[apigee|Apigee]] or client configuration, route traffic to a secondary Google Cloud Region (e.g. europe-west1 or us-central1).",
        "**Step 3: Verify Client Exponential Backoff:** Verify that client SDKs have exponential backoff with full jitter enabled.",
        "**Step 4: Enable Context Caching:** Ensure repeated system prompt prefixes and large document contexts utilize Gemini Context Caching to save active quota.",
        "**Step 5: Request Quota Increase:** Submit a Quota increase request for Tokens Per Minute (TPM) in the impacted region."
      ]
    },
    {
      "id": "rb-groundedness-drop",
      "title": "Runbook 2: Groundedness Regression and Hallucination Alerts",
      "severity": "P2",
      "trigger": "Cloud Monitoring alert `RAG-Groundedness-Degraded` fires (Groundedness drops below 90% over 1-hour window).",
      "steps": [
        "**Step 1: Inspect Retrieved Documents:** Query [[cloud-monitoring]] log traces to verify whether retrieved passages in [[ai-search]] match the user prompt.",
        "**Step 2: Check Datastore Freshness:** Verify that the Cloud Storage ingestion pipeline and Vertex AI Search sync jobs are executing without errors.",
        "**Step 3: Review System Prompt Delimiters:** Confirm that system prompt XML boundaries (`<context>...</context>`) have not been corrupted by recent prompt commits.",
        "**Step 4: Roll Back Prompt Changes:** Revert to the previous verified prompt version via Secret Manager or runtime environment variables within 5 minutes.",
        "**Step 5: Add Failing Queries to Golden Eval Set:** Append regressed customer queries to the automated evaluation dataset in Git."
      ]
    },
    {
      "id": "rb-agent-loop-spike",
      "title": "Runbook 3: Terminating Runaway Multi-Agent Loops and Cost Spikes",
      "severity": "P1",
      "trigger": "Cloud Monitoring alert `AgentLoopSpike` fires (single task exceeds 5 tool turns or burns >50,000 tokens).",
      "steps": [
        "**Step 1: Identify Offending Session:** Query Cloud Logging for agent sessions with `turn_count > 5`.",
        "**Step 2: Terminate Active Sessions:** Call the agent runtime management API or terminate the parent [[workflows]] execution.",
        "**Step 3: Trip the Circuit Breaker:** If a downstream tool is degraded, disable that specific tool from the agent's tool manifest dynamically.",
        "**Step 4: Review Agent Reasoning Traces:** Inspect the thought trace in Cloud Logging to understand why the agent repeated queries.",
        "**Step 5: Update Tool Descriptions:** Clarify tool schemas, input parameters, and negative examples in agent instructions."
      ]
    },
    {
      "id": "rb-model-retirement",
      "title": "Runbook 4: Managing Model Deprecations and Upgrades",
      "severity": "P3 (Planned)",
      "trigger": "Google Cloud announces retirement date for an active model version (e.g. Gemini 1.0 Pro retirement).",
      "steps": [
        "**Step 1: Inventory Active Deployments:** Identify every project, region, and application pinned to the retiring model ID.",
        "**Step 2: Deploy Candidate Successor in Staging:** Deploy the recommended successor model (e.g. Gemini 1.5 Pro or Flash) in staging.",
        "**Step 3: Execute Full Regression Eval Suite:** Run the 500+ case golden evaluation dataset against both models simultaneously. Compare Groundedness, Relevance, Latency, and Token Consumption.",
        "**Step 4: Fine-Tune System Prompts:** Successor models often follow instructions differently; adjust prompts to re-align output formatting.",
        "**Step 5: Canary Rollout:** Route 10% production traffic to the new model via [[apigee]]; monitor error rates for 1 week before completing cutover."
      ]
    }
  ],
  "postmortemTemplate": {
    "title": "Incident Postmortem Template for AI & Stochastic Systems",
    "intro": "Standard postmortems assume deterministic software bugs. Incidents in generative AI systems often involve probabilistic failures, prompt drift, unexpected real-world distributions, or model provider rate limiting. Use this template for post-incident reviews.",
    "templateMarkdown": "# AI Incident Postmortem: [Incident Title]\n\n**Date:** YYYY-MM-DD\n**Incident Lead:** [Engineering Manager / Incident Commander]\n**Principal Reviewer:** [Principal Engineer / Architect]\n**Severity:** P1 / P2\n**Duration:** [Start Time] to [Resolution Time] (Total: X minutes)\n\n---\n\n## 1. Executive Summary\nA brief 3-sentence summary: what happened, what was the customer and financial impact, and what resolved the issue.\n\n## 2. Customer & Financial Impact\n- **Affected Users / Tenants:** [Number of users or percentage of traffic affected]\n- **Task Failure Rate:** [Peak percentage of failed or degraded tasks]\n- **Token / Financial Cost Impact:** [Unplanned token burn or billing impact]\n- **SLA Breach:** [Was customer availability or latency SLA breached?]\n\n## 3. Incident Timeline (UTC)\n- **HH:MM** - Anomaly detected by alert [Alert Name] or reported by [Team].\n- **HH:MM** - Incident channel opened; on-call engineer paged.\n- **HH:MM** - Root cause isolated to [Component: Model / Retrieval / Tool / Gateway].\n- **HH:MM** - Mitigation applied [e.g. Traffic rerouted via Multi-Region Endpoint / Prompt rolled back].\n- **HH:MM** - Error rates returned to normal baseline; monitoring verified.\n- **HH:MM** - Incident declared resolved.\n\n## 4. Root Cause Analysis: The 5 Whys (AI Specific)\n1. **Why did the failure occur?** (e.g. The customer assistant hallucinated incorrect pricing data.)\n2. **Why was incorrect data generated?** (e.g. The retrieval step returned outdated 2023 pricing sheets.)\n3. **Why did retrieval return outdated data?** (e.g. The Cloud Storage document sync pipeline stalled 48 hours ago.)\n4. **Why was the sync stall not detected?** (e.g. No Cloud Monitoring alert was configured on Cloud Storage Pub/Sub dead-letter subscriptions.)\n5. **Why was there no alert?** (e.g. The pipeline was provisioned manually rather than via Terraform with monitoring policies.)\n\n## 5. Failure Classification\n- [ ] Retrieval Failure (Missing context, bad chunking, stale index)\n- [ ] Model Hallucination / Grounding Failure (Model ignored context)\n- [ ] Adversarial / Prompt Injection Attack\n- [ ] Capacity / Rate Limiting (HTTP 429 ResourceExhausted)\n- [ ] Agent Loop / Tool Invocation Error\n- [ ] Infrastructure / Network / DNS Failure\n\n## 6. Corrective Actions & Prevention (Owner & Due Date)\n| Action Item | Type | Owner | Due Date | Ticket / PR |\n| :--- | :--- | :--- | :--- | :--- |\n| Add Cloud Monitoring alert on Pub/Sub dead-letter messages | Prevention | SRE Lead | YYYY-MM-DD | #1234 |\n| Add regressed incident queries to golden eval set | Quality | AI Engineer | YYYY-MM-DD | #1235 |\n| Configure multi-region Apigee failover pool | Resilience | Principal Eng | YYYY-MM-DD | #1236 |\n"
  }
};
