# ADR 0003: Service records are unverified until proven otherwise

Status: accepted, 2026-11-20

**Context.** The plan forbids inventing lifecycle, pricing, quota or region facts and asks for a date and source on volatile facts. Google documentation could not be fetched in the session that built this.

**Decision.** Every service has a record in `data/meta.js` with `verification: 'needs-verification'` and `lifecycle: 'unknown'`. The validator fails the build if a record claims `verified` without an ISO date and a Google documentation URL, or claims a lifecycle without verification. The UI says plainly that a record is not yet verified.

**Consequences.** The site is honest about what has not been checked. The filter and badge currently show every service as not verified. That is the true state, and it will change as maintainers verify records following `docs/content-governance.md`.
