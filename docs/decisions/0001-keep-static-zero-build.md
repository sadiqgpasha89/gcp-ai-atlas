# ADR 0001: Keep the site static with no build step

Status: accepted, 2026-11-20

**Context.** The plan allows large changes but requires preserving existing content, URLs and the visual identity, and says to discover the stack before assuming one.

**Decision.** Keep hash routing, `window.ATLAS` data files and the single `app.js`. Add new code as plain scripts and Node `.mjs` files with no dependencies.

**Consequences.** Nothing to install, nothing to break on upgrade, and contributors can edit data directly. The cost is a long `app.js` and no type checking. A framework migration would put existing URLs and content at risk and was not needed for any task in scope.
