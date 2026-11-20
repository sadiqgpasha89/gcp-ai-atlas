// Content-validation tests: the validator must pass on the repo and must fail on deliberate breakage.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './helpers.mjs';

function copyRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-'));
  for (const f of ['index.html', 'scripts', 'data', 'labs', 'assets', 'tests']) fs.cpSync(path.join(root, f), path.join(dir, f), { recursive: true });
  return dir;
}
const run = (dir) => spawnSync(process.execPath, [path.join(dir, 'scripts/check.mjs')], { encoding: 'utf8' });
function mutate(dir, file, from, to) {
  const p = path.join(dir, file), t = fs.readFileSync(p, 'utf8');
  assert.ok(t.includes(from), 'mutation anchor missing: ' + from);
  fs.writeFileSync(p, t.replace(from, to));
}

test('validator passes on the repository as shipped', () => {
  const r = run(root);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /data OK/);
});

test('validator rejects "verified" without a date and source', () => {
  const d = copyRepo();
  mutate(d, 'data/meta.js', "'gce': { was: [], lifecycle: 'unknown', verification: 'needs-verification'", "'gce': { was: [], lifecycle: 'unknown', verification: 'verified'");
  const r = run(d);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /verified requires/);
});

test('validator rejects a lifecycle claim without verification', () => {
  const d = copyRepo();
  mutate(d, 'data/meta.js', "'gce': { was: [], lifecycle: 'unknown'", "'gce': { was: [], lifecycle: 'ga'");
  const r = run(d);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /asserted without verification/);
});

test('validator rejects an unresolved playbook see reference', () => {
  const d = copyRepo();
  mutate(d, 'data/guides-atlas.js', '"lab:rag-eval"', '"lab:does-not-exist"');
  const r = run(d);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /unresolved see ref lab:does-not-exist/);
});

test('validator rejects a ragged playbook table row', () => {
  const d = copyRepo();
  mutate(d, 'data/guides-atlas.js', '"L0",\n            "Observe",', '"L0",');
  const r = run(d);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /table row/);
});

test('validator detects a committed secret pattern', () => {
  const d = copyRepo();
  fs.writeFileSync(path.join(d, 'data/leak.js'), '// ' + '-----BEGIN RSA ' + 'PRIVATE KEY-----\n');
  const r = run(d);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /possible secret/);
});
