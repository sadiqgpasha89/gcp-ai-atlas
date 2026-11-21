import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAtlas, search } from './load-atlas.mjs';

const A = loadAtlas();
const ids = {
  s: new Set(A.services.map(x => x.id)), c: new Set(A.categories.map(x => x.id)), a: new Set(A.architectures.map(x => x.id)),
  d: new Set([...A.decisions.map(x => x.id), 'em', 'pe', 'all', 'shaper', 'checklists', 'calculator']),
  p: new Set(A.engineeringPlaybooks.map(x => x.id)),
  tools: new Set(['compare', 'rag-assistant', 'agent-assistant', 'risk-analyzer', 'readiness-scorecard', 'review-gen']),
  glossary: new Set([...A.glossary.map(x => x.id), ...A.glossaryGroups.map(x => x.id)]),
  start: new Set(A.paths.map(x => x.id))
};
const modules = new Set(['s', 'a', 'd', 'p', 'tools', 'gov', 'ops', 'toolkit', 'labs', 'freshness', 'glossary', 'start']);
function routeExists(href) {
  const m = href.match(/^#\/([a-z]+)(?:\/([a-z0-9-]+))?$/);
  if (!m) return false;
  const [, kind, id] = m;
  if (!id) return modules.has(kind);
  return Boolean(ids[kind] && ids[kind].has(id));
}

test('every glossary term is complete, unique and in a known group', () => {
  const seen = new Set(), groups = new Set(A.glossaryGroups.map(g => g.id));
  for (const t of A.glossary) {
    assert.ok(!seen.has(t.id), `duplicate glossary id ${t.id}`); seen.add(t.id);
    assert.match(t.id, /^[a-z0-9-]+$/);
    for (const k of ['term', 'def', 'why']) assert.ok(t[k] && t[k].trim(), `${t.id}: missing ${k}`);
    assert.ok(groups.has(t.group), `${t.id}: unknown group ${t.group}`);
    assert.ok(Array.isArray(t.see) && t.see.length, `${t.id}: needs at least one see link`);
    for (const l of t.see) assert.ok(routeExists(l), `${t.id}: see link ${l} is not a route`);
    for (const m of (t.def + ' ' + t.why).matchAll(/\[\[([a-z0-9-]+)/g)) assert.ok(ids.s.has(m[1]), `${t.id}: unknown [[${m[1]}]]`);
  }
  for (const g of groups) assert.ok(A.glossary.some(t => t.group === g), `group ${g} is empty`);
});

test('every reading path step points to a real route', () => {
  assert.ok(A.paths.length >= 3);
  for (const p of A.paths) {
    for (const k of ['id', 'role', 'goal', 'time']) assert.ok(p[k], `${p.id}: missing ${k}`);
    assert.ok(p.steps.length >= 4, `${p.id}: too few steps`);
    for (const [href, title, why] of p.steps) {
      assert.ok(routeExists(href), `${p.id}: ${href} is not a route`);
      assert.ok(title && why, `${p.id}: step ${href} needs a title and a reason`);
    }
  }
});

test('search finds glossary terms by acronym and name', () => {
  const index = search.build(A);
  const top = (q) => [...search.query(index, q, 'glossary', 5)].map(i => i.href);
  assert.ok(top('rrf').includes('#/glossary/rrf'));
  assert.ok(top('time to first token').includes('#/glossary/ttft'));
  assert.ok(top('mcp').includes('#/glossary/mcp'));
});
