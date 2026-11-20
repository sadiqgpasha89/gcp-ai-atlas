# Contributing content

No install step. You need Node 22 or newer for the checks.

## Add or change a service

Edit `data/<category>.js` (using `S({...})`) and add or update its record in `data/meta.js`. New records start as `needs-verification`.

## Add a playbook

Add an object to `data/guides-atlas.js`. Fields: `id`, `title`, `badge`, `tag`, `intro`, optional `glance`, `sections` (each with `title` and any of `body`, `bullets`, `tips`, `table {cols, rows}`, `code`), `see`, `lastReviewed`. `see` entries use `svc:`, `arch:`, `dec:`, `pb:`, `lab:`, `tool:` or `page:` followed by an id. Each table row must have as many cells as there are columns.

Text markup: `` `code` ``, `**bold**`, `[[service-id|label]]`.

## Add a template or lab record

`data/templates-atlas.js` for templates (`id`, `title`, `badge`, `desc`, `markdown`). `data/locallabs.js` for runnable labs; `path` must contain a `README.md`, and `limits` must say what the lab does not prove.

## Before you open a pull request

```
node scripts/check.mjs
node --test "tests/*.test.mjs"
node --test labs/rag-eval/test.mjs labs/bounded-agent/test.mjs
node labs/rag-eval/run.mjs
```
