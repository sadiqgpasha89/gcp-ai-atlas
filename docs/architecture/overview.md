# Architecture overview

The Atlas is a static site with no build step. This is deliberate: it keeps the site hostable on GitHub Pages and easy for contributors to edit.

```
index.html            loads, in order: data/*.js, assets/logic.js, assets/app.js
data/*.js             content; each file adds to window.ATLAS
  core.js             S({...}) service registry
  meta.js             per-service verification metadata (one record per service)
  guides-atlas.js     playbooks added in the engineering-depth upgrade
  templates-atlas.js  templates appended to ATLAS.toolkit.templates
  locallabs.js        records describing the runnable labs in labs/
assets/logic.js       pure logic: cost model, retrieval metrics. No DOM, no I/O, no prices
assets/app.js         router, renderers, search, interactive tools
labs/                 offline Node labs (rag-eval, bounded-agent). Not deployed to Pages
scripts/check.mjs     content and reference validator
tests/                node:test suites for logic and content validation
```

## Why `assets/logic.js` is a plain script

The browser loads it with a `<script>` tag. The Node tests load the same file into a `vm` context with `window` set to the context. The code under test is therefore the code that ships, with no copy and no build step.

## Data flow

1. `index.html` loads data files, each of which extends `window.ATLAS`.
2. `app.js` builds indexes (`byId`, category membership, search index) at startup and renders by route.
3. `meta.js` is read through `A.meta[serviceId]` for badges, filters, the Product facts panel and alias search.
4. The calculator reads form inputs and calls `AtlasLogic.scenarioCost` and related functions.

## What is deployed

The Pages workflow copies `index.html`, `assets`, `data` and `.nojekyll` into `_site`. `labs`, `tests`, `scripts` and `docs` are not deployed; the labs page links to them on GitHub.

## Where facts live

Volatile Google product facts (names, lifecycle, limits, regions, prices) belong only in records with a verification date and source. Prices are never stored in code or data; the calculator takes them from the user.
