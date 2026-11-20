# Changelog

User-visible changes. Newest first.

## 1.1.0 — 2026-11-20

Brings the Azure AI Atlas Milestone A changes (stabilise, search, security headers, freshness page, browser tests and CI) to this atlas. A route-by-route browser crawl (188 routes at 1280 px and 375 px) found the defects below; the same crawl now runs as a test.

### Added
- **Content freshness and sources** (`#/freshness`): how many service records are verified, coverage by category, lifecycle counts, and what the dates on the site mean. No record is verified yet, and the page says so.
- **Search rewrite**: `assets/search.js` indexes about 240 entries (services, architectures, decisions, playbooks, local labs, templates, tools, and the runbooks, use cases, projects, curriculum phases and capabilities inside modules). It understands acronyms and error codes (RAG, ADK, MCP, IAM, VPC-SC, CMEK, 429), has type filters, highlights matches, matches short terms as whole words, and shows guidance when nothing matches.
- **Content-Security-Policy** (meta tag). The theme script moved to `assets/theme.js`, and the three inline `onsubmit` handlers were removed.
- **Browser smoke test** (`npm run smoke`): opens every route reachable from the home page at two widths and fails on console or CSP errors, horizontal overflow, empty pages, `undefined`/`NaN` text and links that lead to "Not found"; then exercises search, the cost calculator, the freshness page and the theme toggle.
- `npm run check`, `npm test` (52 logic, content, search and site tests plus the two lab suites), `npm run verify`, a local server (`npm run serve`), a CI workflow (`ci.yml`) and a content-revalidation issue template.

### Fixed
- **Toolkit RAID table** showed `undefined` in the third column of every Assumption, Issue and Dependency row (5 cells). It now shows the validation or resolution text.
- **Labs page**: the 16-week roadmap showed `Milestone: undefined` on six cards, the competency model showed empty tier cards, and the capability benchmark table showed `undefined` in 24 cells. Each now reads the fields the data actually has. The benchmark table shows each dimension's target level and description.
- **Sideways scrolling on every page at desktop width** (top navigation too wide) and on Toolkit and Labs at phone width (long labels and code blocks). The nav scrolls inside its own row and cards wrap their content.
- Grid columns with fixed minimum widths no longer force overflow on narrow screens.
- One guide said a recall metric was "undefined" in prose; it now says "not defined".

### Changed
- Deployment to GitHub Pages also syntax-checks `assets/search.js` and `assets/theme.js`.

### Known limitations
- All 73 service records are still unverified (see `#/freshness`); Google documentation could not be read when this was written.
- No accessibility scan, external link check or Lighthouse run has been performed.

## 1.0.0

Earlier releases are described in the git history and `docs/implementation-status.md`.
