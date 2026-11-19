# Google Cloud for AI/ML Systems — an interactive atlas

**Live site (once Pages is enabled): https://sadiqgpasha89.github.io/gcp-ai-atlas/**

A static, no-build website that explains the Google Cloud services you use to build AI and ML systems: what each one is, how it works step by step (with an animated stepper), the gotchas and edge cases, and how to use it in larger systems. It is the Google Cloud counterpart of the [AWS AI Atlas](https://sadiqgpasha89.github.io/aws-ai-atlas/).

- **71 services** in **11 categories**: Compute & Accelerators, Storage, Databases & Vector Stores, Data & Analytics, Streaming & Orchestration, Generative AI & Agents, ML Platform (Agent Platform), Pre-built AI Services, Networking & Delivery, Security & Identity, Observability & Operations.
- **6 reference architectures** (RAG assistant, LLM serving, training and MLOps, agent platform, document intelligence, real-time features), each a step-through diagram whose boxes link to the service pages.
- **Leader toolkit** for engineering managers and principal engineers building agentic and ML systems:
  - **14 decision guides** (build/buy/customise, autonomy level, how to improve a model, where the model runs, agent hosting, vector store, inference pattern, capacity, orchestration, training compute, evaluation, human-in-the-loop, cost levers, tenancy). Each has an options table, if/then rules, red flags, design-review questions, a revisit trigger and a one-way/two-way-door marker.
  - **Solution shaper**: seven questions in, a starting stack, risks and the decisions to make next out (copyable as markdown).
  - **Readiness checklists**: a prototype-to-scale maturity ladder, a 38-item production-readiness checklist (progress saved in the browser) and a decision-record template.
  - **Cost-per-task calculator** with a what-if table for caching, batching, routing and fewer calls.
- Search (`/` or `Ctrl/Cmd+K`), light and dark themes, keyboard-friendly steppers, responsive layout.

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
data/decisions.js       decision guides (options, rules, red flags, review questions)
data/playbooks.js       maturity ladder, readiness checklist, ADR template, solution shaper rules
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

## A note on accuracy

Google Cloud limits, quotas, prices, model versions and product names change often, and several features referenced here are in preview. Numbers in this atlas are for orientation. Before designing around a specific limit, check the linked Google Cloud documentation and your project's Quotas page. Corrections are welcome.

This is an independent educational project and is not affiliated with or endorsed by Google or Google Cloud.
