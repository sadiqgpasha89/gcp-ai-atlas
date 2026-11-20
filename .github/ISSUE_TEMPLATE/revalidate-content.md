---
name: Revalidate time-sensitive content
about: A service, lifecycle, limit or product name is due for review or has changed
title: "Revalidate: <service or topic>"
labels: content-freshness
---

**What needs checking**
<!-- Service/page, route (for example #/s/vector-search) and the claim in question. -->

**Why now**
- [ ] Shown as not yet verified on `#/freshness`
- [ ] Google announced a change (link below)
- [ ] A reader reported it
- [ ] Other:

**First-party source(s) read** (exact URL, title and the "last updated" date shown on the page)
1.

**Result**
- [ ] Claims still match. Updated `verified` and `sourceUrl` in `data/meta.js`.
- [ ] Claims changed. Updated the page text and the record, and added a CHANGELOG line.
- [ ] Could not verify. Left the record as `needs-verification` and noted why here.

Follow `docs/content-governance.md`. Never copy a date forward without reading the source again.
