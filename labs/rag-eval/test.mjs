import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runEval, gate, here, loadGates, loadCorpus } from './evaluate.mjs';
import { Index, canSee } from './retriever.mjs';

const gates = loadGates();
const baseline = JSON.parse(fs.readFileSync(path.join(here, 'baseline.json'), 'utf8'));
const run = (fault, indexOpts) => runEval({ fault, k: gates.k, indexOpts });
const total = (inv) => Object.values(inv).reduce((n, v) => n + v.length, 0);

test('normal run: all safety invariants are zero and the regression gate passes', () => {
  const r = run(null), g = gate(r, baseline, gates);
  assert.equal(total(r.invariants), 0, JSON.stringify(r.invariants));
  assert.equal(g.passed, true, JSON.stringify(g.comparison.results));
});
test('the evaluation is deterministic', () => {
  assert.equal(JSON.stringify(run(null).metrics), JSON.stringify(run(null).metrics));
});
test('the dataset is not trivially perfect: lexical retrieval misses the paraphrase cases', () => {
  const m = run(null).metrics;
  assert.ok(m.recall < 1 && m.recall > 0.5, `recall ${m.recall}`);
});
test('hand-checked case: an expense query returns the current policy, never the superseded one', () => {
  const c = run(null).perCase.find(x => x.id === 'c01');
  assert.equal(c.ranked[0], 'exp-v2'); assert.ok(!c.ranked.includes('exp-v1'));
});

/* ---- failure injection: each fault must be DETECTED, otherwise the test suite proves nothing ---- */
test('fault aclBypass: leaks are detected and the gate fails', () => {
  const r = run('aclBypass'), g = gate(r, baseline, gates);
  assert.ok(r.invariants.aclOrTenantLeaks.length > 0);
  assert.equal(g.passed, false);
});
test('fault sharedCache: a cache key without identity leaks across users and is detected', () => {
  const r = run('sharedCache');
  assert.ok(r.invariants.aclOrTenantLeaks.some(l => l.doc === 'salary' || l.doc === 'incident'), JSON.stringify(r.invariants.aclOrTenantLeaks));
  assert.equal(gate(r, baseline, gates).passed, false);
});
test('fault emptyIndex: an index outage is a regression, not a silent pass', () => {
  const r = run('emptyIndex'), g = gate(r, baseline, gates);
  assert.equal(r.metrics.recall, 0); assert.equal(g.passed, false); assert.ok(g.comparison.hasFailures);
});
test('fault includeSuperseded: stale content served is detected', () => {
  const r = run(null, { excludeSuperseded: false });
  assert.ok(r.invariants.staleDocumentsServed.length > 0);
  assert.equal(gate(r, baseline, gates).passed, false);
});
test('fault noScan: without the tripwire the poisoned document is served and detected', () => {
  const r = run(null, { scanInjection: false });
  assert.ok(r.invariants.injectionPayloadsServed.length > 0);
  assert.equal(gate(r, baseline, gates).passed, false);
});
test('the injection tripwire quarantines the poisoned document and the query abstains', () => {
  const r = run(null), c = r.perCase.find(x => x.id === 'c18');
  assert.equal(c.abstained, true);
});

/* ---- access control ---- */
test('access control: visibility rules by tenant and group', () => {
  const docs = Object.fromEntries(loadCorpus().docs.map(d => [d.id, d]));
  assert.equal(canSee(docs.salary, { tenant: 'northwind', groups: ['hr'] }), true);
  assert.equal(canSee(docs.salary, { tenant: 'northwind', groups: [] }), false);
  assert.equal(canSee(docs.salary, { tenant: 'globex', groups: ['hr'] }), false); // same group name, wrong tenant
  assert.equal(canSee(docs['gx-bonus'], { tenant: 'northwind', groups: ['hr', 'engineering'] }), false);
});
test('hidden documents do not influence ranking: results are identical with or without them in the corpus', () => {
  const full = loadCorpus().docs, visibleOnly = full.filter(d => d.id !== 'salary' && d.id !== 'gx-bonus' && d.id !== 'gx-expense');
  const u = { id: 'u', tenant: 'northwind', groups: [] };
  const a = new Index(full).search('How long are customer support transcripts kept?', u, 3);
  const b = new Index(visibleOnly).search('How long are customer support transcripts kept?', u, 3);
  assert.equal(JSON.stringify(a.results), JSON.stringify(b.results));
});

/* ---- freshness and deletion ---- */
const ana = { id: 'u-ana', tenant: 'northwind', groups: [] };
const Q = 'How long are customer support transcripts kept?';
test('deletion: a tombstoned document is never returned and the cache is invalidated', () => {
  const idx = new Index(loadCorpus().docs);
  assert.equal(idx.search(Q, ana, 3).results[0].id, 'retention'); // populates the cache
  const before = idx.size();
  idx.delete('retention');
  assert.equal(idx.size(), before - 1);
  const after = idx.search(Q, ana, 3);
  assert.ok(!after.results.some(r => r.id === 'retention'));
  assert.deepEqual(idx.audit.map(a => a.event), ['delete']);
});
test('deletion fault: skipping cache invalidation keeps serving deleted content, and the test detects it', () => {
  const idx = new Index(loadCorpus().docs, { staleCache: true });
  idx.search(Q, ana, 3);
  idx.delete('retention');
  assert.ok(idx.search(Q, ana, 3).results.some(r => r.id === 'retention'), 'expected the stale cache to leak the deleted doc');
});
test('reconciliation finds missed deletions (orphans) and missed ingests (missing)', () => {
  const idx = new Index(loadCorpus().docs);
  const source = loadCorpus().docs.map(d => d.id).filter(id => id !== 'training').concat(['new-doc']);
  const r = idx.reconcile(source);
  assert.deepEqual(r.orphans, ['training']); assert.deepEqual(r.missing, ['new-doc']);
  idx.delete('training');
  assert.deepEqual(idx.reconcile(source).orphans, []);
});
