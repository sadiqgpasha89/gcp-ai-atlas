# Content governance

## What each date means

- `lastReviewed` on a playbook: the date a person or agent last edited it. It does not mean Google facts were checked.
- `verified` and `sourceUrl` on a service record (`data/meta.js`): the date the maintainer compared the record with official Google documentation, and the page used.

## Rules

1. Volatile facts (names, lifecycle, limits, quotas, regions, prices) appear only with a source. If unknown, say `unknown` or `needs-verification`; never guess.
2. Prices never go in code or data.
3. New engineering guidance is labelled "Atlas guidance, not an official Google recommendation".
4. `verified` requires an ISO date and a Google documentation URL. The validator enforces this.
5. A lifecycle value other than `unknown` requires `verified`.
6. No credentials, keys or personal data in the repository. The validator scans for common key patterns; it is a backstop, not a guarantee.

## Verifying a service record

1. Open the service's official documentation. Confirm the current product name, lifecycle (GA, Preview, deprecated, retired) and any alias.
2. Set `verification: 'verified'`, `verified: 'YYYY-MM-DD'`, `sourceUrl: '<the page you used>'`, and `lifecycle`.
3. Fill `was` only for names you confirmed. Note that API or SDK identifiers may not have changed.
4. Run `node scripts/check.mjs`.

## Review cadence

Review each record at least every 90 days and whenever Google announces a rename or deprecation. This interval is an Atlas choice, not a Google requirement. `node scripts/check.mjs` prints a freshness summary; once records are verified, extend it to flag records older than the interval.

## Reporting problems

Service and playbook pages link to a prefilled GitHub issue. There is no promise of a response time.
