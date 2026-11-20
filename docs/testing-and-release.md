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

The same steps are available as `npm run check`, `npm test` and `npm run smoke`; `npm run verify` runs all three. The smoke test needs Playwright, which is not a repository dependency: `npm i --no-save playwright && npx playwright install chromium`. To use an installed Chrome set `CHROME_PATH`; to use an existing Playwright install set `PLAYWRIGHT_DIR` to the `node_modules` folder that contains it.

`tests/search.test.mjs` covers the search index (coverage, no broken names or links, acronyms, whole-word matching of short terms, filters). `tests/site.test.mjs` checks the Content-Security-Policy, that there are no inline scripts or handlers, and script order.

To view the site: `python3 -m http.server` in the repository root, then open `http://localhost:8000/`.

## What is not covered

`scripts/smoke.mjs` (run in CI by `ci.yml`) follows links from the home page to every reachable route (188 at the time of writing) at 1280 px and 375 px and fails on console or CSP errors, horizontal overflow, empty pages, `undefined`/`NaN` text and links to the not-found page; it also exercises search, the cost calculator, the freshness page and the theme toggle.

Not covered: accessibility scans, an external link check, Lighthouse, cross-browser testing and screen-reader review. See `known-limitations.md`.

## CI and release

`.github/workflows/ci.yml` runs the checks, tests and browser smoke test on every pull request and on pushes to other branches. `.github/workflows/pages.yml` runs the validator, syntax checks, all tests and the RAG gate. Only if they pass does it publish `index.html`, `assets`, `data` and `.nojekyll` to GitHub Pages. A push to `main` triggers it.

## Rolling back

Revert the offending commit on `main` and push; the workflow redeploys the previous content. In an emergency, run the workflow manually from a known-good commit using "Run workflow".

## Updating the RAG baseline

Run `node labs/rag-eval/run.mjs --write-baseline` only after reviewing why metrics changed, and commit the new `baseline.json` with the reason in the commit message. Safety invariants (leaks, stale documents, injection payloads served) must stay at zero.
