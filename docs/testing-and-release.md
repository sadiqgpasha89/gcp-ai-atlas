# Testing and release

## Local

```
node scripts/check.mjs                       # content, metadata, references, secrets scan, freshness summary
node --check assets/app.js
node --check assets/logic.js
node --test "tests/*.test.mjs"               # cost and retrieval logic; content validation incl. deliberate-breakage cases
node --test labs/rag-eval/test.mjs labs/bounded-agent/test.mjs
node labs/rag-eval/run.mjs                   # evaluation gate against labs/rag-eval/baseline.json
```

Use the glob form for `tests`; passing the bare directory fails on Node 22.

To view the site: `python3 -m http.server` in the repository root, then open `http://localhost:8000/`.

## What is not covered

No automated browser tests, accessibility scans or responsive tests exist. Pages have been smoke-tested by loading routes in headless Chrome and checking for console errors. See `known-limitations.md`.

## CI and release

`.github/workflows/pages.yml` runs the validator, syntax checks, all tests and the RAG gate. Only if they pass does it publish `index.html`, `assets`, `data` and `.nojekyll` to GitHub Pages. A push to `main` triggers it.

## Rolling back

Revert the offending commit on `main` and push; the workflow redeploys the previous content. In an emergency, run the workflow manually from a known-good commit using "Run workflow".

## Updating the RAG baseline

Run `node labs/rag-eval/run.mjs --write-baseline` only after reviewing why metrics changed, and commit the new `baseline.json` with the reason in the commit message. Safety invariants (leaks, stale documents, injection payloads served) must stay at zero.
