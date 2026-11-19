# Google Cloud for AI/ML Systems — an interactive atlas

**Live site (once Pages is enabled): https://sadiqgpasha89.github.io/gcp-ai-atlas/**

A static, no-build website that explains the Google Cloud services you use to build AI and ML systems: what each one is, how it works step by step (with an animated stepper), the gotchas and edge cases, and how to use it in larger systems. It is the Google Cloud counterpart of the [AWS AI Atlas](https://sadiqgpasha89.github.io/aws-ai-atlas/).

The atlas has three layers:

1. **Knowledge base** (`#/c`, `#/s`, `#/a`, `#/d`): **73 services** in **11 categories** (Compute & Accelerators, Storage, Databases & Vector Stores, Data & Analytics, Streaming & Orchestration, Generative AI & Agents, ML Platform (Agent Platform), Pre-built AI Services, Networking & Delivery, Security & Identity, Observability & Operations); **10 reference architectures** (RAG assistant, LLM serving, training and MLOps, agent platform, document intelligence, real-time features, multi-agent system, agentic RAG, GraphRAG, agent CI/CD), each a step-through diagram whose boxes link to service pages; and **15 decision guides** with options tables, if/then rules, red flags, review questions, a revisit trigger and a one-way/two-way-door marker (including retrieval strategy).
2. **Playbook** (`#/p`, `#/t`, `#/d/<tool>`):
   - **7 operating guides** in four groups: agent governance, data residency and compliance matrix, AgentOps, incident runbooks (R1 to R8), the evaluation lifecycle, platform engineering for AI workloads, and the data and knowledge lifecycle.
   - **12 templates** (problem statement, value and feasibility, architecture review, model and agent selection, RAG design review, threat model, evaluation report, launch go/no-go, SLO and runbook, post-incident review, cost optimisation review, tech-debt backlog), each copyable as markdown.
   - **Solution shaper**: seven questions in, a starting stack, risks, the decisions to make next and "go deeper" links to guides and architectures out.
   - **Readiness checklists**: a maturity ladder, a 43-item production-readiness checklist (progress saved in the browser) and a decision-record template.
   - **Calculators**: cost per task, an **AI FinOps model** (every component, six what-if comparisons, cost per successful task) and an **evaluation scorecard** (compare candidates on one dataset and apply release gates).
3. **Manager cockpit** (`#/m`, `#/m/<section>`): ten browser-only trackers for AI portfolio, architecture review, project health, quality, reliability (error-budget use), cost (forecast against actual), security and compliance, a team capability matrix, a technology radar seeded from this atlas, and a decision log. Each section has KPIs and derived columns, CSV import and export, and an overview lists what needs attention. Data is stored in this browser's local storage only; it is never sent anywhere. Export it to keep it. A static site cannot read live systems, so feed it from exports (evaluation runs, Cloud Monitoring SLO data, the BigQuery billing export).

Search (`/` or `Ctrl/Cmd+K`) covers all three layers. Light and dark themes, keyboard-friendly steppers and tables, responsive layout.

Pure HTML, CSS and JavaScript. No framework, no bundler, no dependencies.

## A note on Google Cloud naming

Google Cloud has renamed several AI products. This atlas uses the current names and says what each one used to be called:

| Current name | Formerly |
|---|---|
| Gemini Enterprise Agent Platform ("Agent Platform") | Vertex AI |
| Agent Runtime | Agent Engine |
| Agent Studio | Vertex AI Studio |
| Gemini Enterprise | Agentspace |
| Knowledge Catalog | Dataplex Universal Catalog |
| Managed Service for Apache Spark | Dataproc (Spark) |

The API endpoint is still `aiplatform.googleapis.com`, and service ids for the ML platform use the `ap-` prefix.

## Run it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Publish on GitHub Pages

1. In the repository go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/pages.yml` validates the data and deploys. The site appears at `https://<your-user>.github.io/<repo>/`.

All asset paths are relative and routing uses the URL hash (`#/s/gemini`), so it works under a project sub-path with no configuration.

## Project layout

```
index.html              page shell, loads the data files then app.js
assets/style.css        design tokens, layout, components, dark theme
assets/app.js           router, pages, isometric diagrams, stepper, search
data/core.js            category definitions + the S() helper
data/<category>.js      one file of services per category
data/architectures.js   reference architectures
data/arch-agentic*.js   agentic architectures (multi-agent, agentic RAG, GraphRAG, agent CI/CD)
data/decisions.js       decision guides (options, rules, red flags, review questions)
data/guides*.js         operating guides (blocks of headings, tables, callouts, runbooks)
data/templates.js       management templates
data/playbooks.js       maturity ladder, readiness checklist, ADR template, solution shaper rules
data/cockpit.js         cockpit sections: columns, sample (fictional) rows, skill list
data/meta.js            per-service launch stage and last-reviewed facts (statuses marked "Check" are unverified)
assets/tools.js         evaluation scorecard and FinOps model (pure functions are testable)
assets/cockpit.js       cockpit engine: tables, derived values, CSV and JSON import and export, radar
scripts/check.mjs       data validator (runs in CI)
```

## Add or edit a service

Add an `S({...})` call to the relevant file in `data/`:

```js
S({
  id: 'my-service',            // url slug, [a-z0-9-]
  cat: 'compute',              // a category id from data/core.js
  name: 'Display Name',
  doc: 'run/docs',             // path under docs.cloud.google.com, or a full https:// URL
  tag: 'One-line summary.',
  what: 'Paragraph one.\n\nParagraph two.',
  flow: ['Node A', 'Node B', 'Node C'],              // 3–7 labels for the diagram
  steps: [[0, 'What happens at A.'], [1, '...'], [2, '...']],  // [nodeIndex, text]
  gotchas: ['...'], edges: ['...'], ml: ['...'],
  pairs: ['other-service-id'],
  cost: 'How it is billed.'
});
```

Text supports `` `code` ``, `**bold**`, and links to other services with `[[service-id]]` or `[[service-id|custom label]]`.

Then run the validator:

```bash
node scripts/check.mjs
```

It checks for unknown references, step indexes outside the diagram, nodes no step ever visits, unbalanced markup, and missing fields.

## Add or edit a decision guide

Append an object to `ATLAS.decisions` in `data/decisions.js` (fields are listed at the top of that file). Table cells can link services with `[[service-id|label]]`. `node scripts/check.mjs` checks the schema, every link, and runs the solution shaper over all 5,832 answer combinations to make sure each recommendation points at real services and guides. If you change the shaper rules in `data/playbooks.js`, run it again.

## Add a guide, template or cockpit section

- **Guide**: add an object to `ATLAS.guides` (`id`, `group`, `title`, `short`, `when`, `blocks`, `src`, `related`, `see`) in a `data/guides*.js` file. Blocks are `h2`, `h3`, `p`, `ul`, `ol`, `table`, `callout`, `two`, `cards`, `steps` or `runbook`. Link across layers with `[[p:guide|label]]`, `[[a:architecture]]`, `[[d:decision-or-tool]]`, `[[t:template]]` and `[[m:cockpit-tab]]`.
- **Template**: add an object to `ATLAS.templates` in `data/templates.js` (markdown `body`).
- **Cockpit section**: add a tab to `ATLAS.cockpit.tabs` in `data/cockpit.js` with typed columns (`text`, `select`, `number`, `money`, `percent`, `date`, `status`) and fictional sample rows. Derived columns for a new section live in `derive()` and `kpis()` in `assets/cockpit.js`.

`node scripts/check.mjs` validates all of these, including every cross-reference and the cockpit sample data.

## A note on accuracy

Launch stages in `data/meta.js` are recorded with a review date (`metaReviewed`); where a status has not been confirmed against Google's documentation it is shown as "Check" rather than guessed. Prices in the FinOps model and calculators are placeholders you replace with current figures.

Google Cloud limits, quotas, prices, model versions and product names change often, and several features referenced here are in preview. Numbers in this atlas are for orientation. Before designing around a specific limit, check the linked Google Cloud documentation and your project's Quotas page. Corrections are welcome.

This is an independent educational project and is not affiliated with or endorsed by Google or Google Cloud.
