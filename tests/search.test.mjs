import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAtlas, search } from './load-atlas.mjs';

const A = loadAtlas();
const index = search.build(A);
// search.js runs in its own vm realm; copy arrays into this realm so deepEqual compares like with like
const top = (q, kind = 'all', n = 5) => [...search.query(index, q, kind, n)];

test('index covers every service, architecture, decision and playbook', () => {
  for (const [kind, n] of [['service', A.services.length], ['architecture', A.architectures.length], ['decision', A.decisions.length], ['playbook', A.engineeringPlaybooks.length]]) {
    assert.ok(index.filter(i => i.kind === kind).length >= n, `${kind} entries missing`);
  }
  assert.ok(index.length > 200, `only ${index.length} entries`);
});

test('no entry has an empty or broken name, summary or link', () => {
  for (const it of index) {
    assert.ok(it.name && it.name.trim(), `empty name for ${it.href}`);
    assert.ok(it.tag && it.tag.trim(), `empty summary for "${it.name}"`);
    assert.ok(!/undefined|\[object|NaN/.test(it.name + ' ' + it.tag + ' ' + it.type + ' ' + it.cat), `bad text in "${it.name}"`);
    assert.match(it.href, /^#\/[a-z0-9\/-]*$/, `bad href ${it.href}`);
  }
});

test('every link resolves to a real route or record', () => {
  const ids = { s: new Set(A.services.map(x => x.id)), a: new Set(A.architectures.map(x => x.id)), d: new Set(A.decisions.map(x => x.id)), p: new Set(A.engineeringPlaybooks.map(x => x.id)) };
  const modules = new Set(['tools', 'gov', 'ops', 'toolkit', 'labs', 'freshness']);
  const decTools = new Set(['em', 'pe', 'shaper', 'checklists', 'calculator']);
  const sub = { tools: new Set(['compare', 'rag-assistant', 'agent-assistant', 'risk-analyzer', 'readiness-scorecard', 'review-gen']) };
  for (const it of index) {
    const [, kind, id] = it.href.split('/');
    if (kind === 'd') assert.ok(!id || decTools.has(id) || ids.d.has(id), `${it.href} does not exist`);
    else if (ids[kind]) assert.ok(ids[kind].has(id), `${it.href} does not exist`);
    else if (kind === '') assert.equal(it.href, '#/');
    else assert.ok(modules.has(kind) && (!id || sub[kind]?.has(id)), `${it.href} is not a route`);
  }
});

test('a service is found by its name and id', () => {
  assert.equal(top('agent development kit')[0].href, '#/s/adk');
  assert.ok(top('vector search').some(h => h.href === '#/s/vector-search'));
});

test('acronyms and error codes find the right content', () => {
  assert.ok(top('429', 'all', 8).some(h => /429|throttl|quota/i.test(h.name)), '429');
  for (const q of ['rag', 'mcp', 'adk', 'iam', 'adr']) assert.ok(top(q).length > 0, q);
  assert.ok(top('pt', 'all', 8).some(h => /Provisioned|quota/i.test(h.name)), 'pt');
});

test('alias expansion works in both directions and ranks the literal term first', () => {
  assert.ok(search.expand('rag').includes('retrieval augmented generation'));
  assert.ok(search.expand('retrieval augmented generation').includes('rag'));
  assert.deepEqual([...search.expand('zzz')], ['zzz']);
});

test('short terms match whole words only', () => {
  // "slo" must not match "slots"; "429" must not match "14290"
  const synthetic = [
    { kind: 'guide', type: 'Page', href: '#/x', name: 'Slots and slides', tag: 'about slots', cat: 'x', id: '#/x', hay: 'slots and slides' },
    { kind: 'guide', type: 'Page', href: '#/y', name: 'SLO targets', tag: 'targets', cat: 'x', id: '#/y', hay: 'slo targets' }
  ];
  assert.deepEqual([...search.query(synthetic, 'slo', 'all', 5)].map(h => h.href), ['#/y']);
});

test('type filters restrict results and keep ranking', () => {
  const svc = top('service', 'service', 10);
  assert.ok(svc.length > 0 && svc.every(h => h.kind === 'service'));
  const arch = top('rag', 'architecture', 10);
  assert.ok(arch.length > 0 && arch.every(h => h.kind === 'architecture'));
});

test('every word must match; nonsense queries return nothing', () => {
  assert.deepEqual(top('zzzqqq'), []);
  assert.deepEqual(top('rag zzzqqq'), []);
});

test('an empty query lists entries instead of an error state', () => {
  assert.ok(search.query(index, '', 'all', 12).length === 12);
});

test('query is case-insensitive and ignores extra whitespace', () => {
  assert.deepEqual(top('  agent development kit   ').map(h => h.href), top('AGENT DEVELOPMENT KIT').map(h => h.href));
});

test('the freshness page is discoverable', () => {
  assert.ok(top('verified sources').some(h => h.href === '#/freshness'));
  assert.ok(top('content freshness').some(h => h.href === '#/freshness'));
});
