# Route inventory

Routes are hash-based and resolved in `render()` in `assets/app.js`. IDs come from the data files; `node scripts/check.mjs` validates that internal references resolve.

| Route | Page | Source data |
|---|---|---|
| `#/` | Home | all |
| `#/c/<category>` | Category page (11) with verification filter | `data/core.js`, `data/meta.js` |
| `#/s/<service>` | Service page (73) incl. Product facts panel | `data/core.js`, `data/meta.js` |
| `#/a`, `#/a/<id>` | Architectures (42) | `data/architectures.js` |
| `#/d`, `#/d/<id>` | Decision guides (23) | `data/decisions.js` |
| `#/d/shaper`, `#/d/calculator`, `#/d/checklists` | Solution shaper, cost calculator (extended with scenario model), readiness checklists | `data/`, `assets/logic.js` |
| `#/p`, `#/p/<id>` | Playbooks (16) | `data/playbooks.js`, `data/guides-atlas.js` |
| `#/tools`, `#/tools/<id>` | Interactive tools hub and tools (9) | `assets/app.js` |
| `#/gov` | Security and governance | `data/governance.js` |
| `#/ops` | Operations | `data/observability.js` |
| `#/toolkit` | Templates (18) and cockpit checklists | `data/toolkit.js`, `data/templates-atlas.js` |
| `#/labs` | Labs, learning paths, runnable local labs | `data/labs.js`, `data/locallabs.js` |

Playbook `see` references use the kinds `svc`, `arch`, `dec`, `pb`, `lab`, `tool`, `page`. All are validated.

Search covers services (including previous names), architectures, decisions, playbooks (including table text), tools, local labs and templates.
