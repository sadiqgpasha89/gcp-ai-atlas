# ADR 0002: Put testable logic in `assets/logic.js`

Status: accepted, 2026-11-20

**Context.** The calculator formulas lived inside `app.js` and could not be tested without a browser.

**Decision.** Move cost and retrieval-metric logic into `assets/logic.js`, loaded by the page and by Node tests via `vm`. Keep the original `calcCost` formula and prove the new model equals it when new inputs are zero.

**Consequences.** The tested code is the shipped code. The legacy levers table still uses the old local function in `app.js`; it is covered by the parity test rather than rewritten.
