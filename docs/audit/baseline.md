# Baseline audit

Audit date: 2026-11-20. Scope: repository state at commit `4671f62` (the commit before the engineering-depth upgrade), plus what was measured during the upgrade. Covers plan tasks AUD-01 to AUD-05.

## Stack (discovered, not assumed)

| Item | Finding |
|---|---|
| Type | Static site. No framework, no bundler, no `package.json`, no runtime dependencies. |
| Routing | Hash routing (`#/s/<id>`, `#/c/<id>`, `#/a/<id>`, `#/d/<id>`, `#/p/<id>`, `#/tools/<id>`, `#/gov`, `#/ops`, `#/toolkit`, `#/labs`). |
| Content | `window.ATLAS` assembled from `data/*.js` files loaded by `<script>` tags in `index.html`. |
| App | `assets/app.js`, one ES5-style IIFE, about 2,500 lines. |
| Hosting | GitHub Pages via `.github/workflows/pages.yml`, deploying on push to `main`. |
| Package manager | None. Node 22 is used for scripts and tests only. |

## Counts (measured with the loaded data, AUD-03)

| Item | Count at baseline | Count after upgrade |
|---|---|---|
| Services | 73 | 73 |
| Categories | 11 | 11 |
| Architectures | 42 | 42 |
| Decision guides | 23 | 23 |
| Engineering playbooks | 11 | 16 |
| Toolkit templates | 8 | 18 |
| Interactive tools | 9 | 9 |
| Hands-on lab exercises (documentation) | 12 | 12 |
| Runnable local labs | 0 | 2 |

The README previously said 13 architectures and 5 playbooks. Those numbers were stale and the README has been corrected.

## Checks run (AUD-02, AUD-04)

- No install, lint, type-check or build step exists, because there are no dependencies. The real checks were `node scripts/check.mjs` (data validation) and `node --check assets/app.js`. Both passed at baseline.
- Headless Chrome smoke test of the home, service, category, architecture, playbook, labs, toolkit, tools, governance and operations routes, run on the baseline and on the upgraded site.
- Two defects were found at baseline and exist in the original commit. Both threw an uncaught JavaScript error and left the page blank:
  1. `#/labs`: lab `techStack` is a comma-separated string, the renderer called `.map` on it.
  2. `#/toolkit`: the daily cockpit data uses `title` and `questions`, the renderer read `name` and `items`.
  Both were fixed in this upgrade. A third latent issue is that `ul()` assumed arrays; it now tolerates strings (lab `security` and `evalPlan` are strings).

## Not done at baseline

- No manual screen-reader pass, no automated accessibility scan, no responsive screenshots (AUD-04 partially complete: see `implementation-status.md`).
- No external link check. The sandbox this work ran in has no general network access, so documentation URLs were not fetched. See `known-limitations.md`.

## Prioritised issue list

1. **High.** Service facts (names, lifecycle, limits, regions, prices) carry no verification date or source. All 73 records are now explicitly marked `needs-verification` rather than implied correct.
2. **High.** Two pages crashed (fixed).
3. **High.** No automated tests of any logic (fixed for cost and retrieval logic, labs, content validation).
4. **Medium.** Cost calculator had no retries, tool, retrieval, fixed or one-time costs, and no comparison or export (extended).
5. **Medium.** Labs were documentation only, with no way to run and check them (two local labs added).
6. **Medium.** README counts stale (fixed).
7. **Open.** Manager cockpit, competency tracking, most UX filters and accessibility testing (see ledger).
