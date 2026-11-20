import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLogic } from './helpers.mjs';

const L = loadLogic();
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`);

/* ---------- legacy calculator ---------- */
const LEGACY = { req: 1000, calls: 3, inTok: 2000, outTok: 500, pIn: 1, pOut: 4, infra: 0.002, success: 80, sem: 0, cacheFrac: 0, cacheDisc: 0, batchShare: 0, batchDisc: 0 };

test('calcCost: hand-computed baseline', () => {
  // input: 2000/1e6*1*3 = 0.006 ; output: 500/1e6*4*3 = 0.006 ; task = 0.012 + 0.002 = 0.014
  const r = L.calcCost(LEGACY);
  near(r.inC, 0.006); near(r.outC, 0.006); near(r.task, 0.014);
  near(r.ok, 0.014 / 0.8); near(r.month, 0.014 * 1000 * 30);
});
test('calcCost: zero success rate gives Infinity, not NaN', () => {
  assert.equal(L.calcCost({ ...LEGACY, success: 0 }).ok, Infinity);
});

/* ---------- scenario model ---------- */
const SC = { tasksPerMonth: 30000, users: 300, successPct: 80, callsPerTask: 3, inTok: 2000, outTok: 500, pIn: 1, pOut: 4, infra: 0.002 };

test('scenarioCost equals calcCost when only the legacy fields are set', () => {
  const a = L.calcCost(LEGACY), b = L.scenarioCost(SC);
  near(b.perTaskTotal, a.task);
  near(b.monthlyTotal, a.month);
  near(b.unit.perSuccessfulTask, a.ok);
});
test('scenarioCost: caches, batch and semantic cache match the legacy levers', () => {
  const lever = { cacheFrac: 60, cacheDisc: 90, batchShare: 50, batchDisc: 50, semPct: 25 };
  const a = L.calcCost({ ...LEGACY, ...lever, sem: lever.semPct }), b = L.scenarioCost({ ...SC, ...lever });
  near(b.perTaskTotal, a.task);
});
test('scenarioCost: retries inflate pipeline cost but not "other" cost', () => {
  const base = L.scenarioCost({ ...SC, infra: 0 });
  const retry = L.scenarioCost({ ...SC, infra: 0, retryPct: 50 });
  near(retry.perTaskTotal, base.perTaskTotal * 1.5);
  const withInfra = L.scenarioCost({ ...SC, infra: 0.01, retryPct: 100 });
  near(withInfra.perTaskTotal, (0.012) * 2 + 0.01);
});
test('scenarioCost: retrieval, rerank, tools and embeddings are added per task', () => {
  const r = L.scenarioCost({ ...SC, infra: 0, inTok: 0, outTok: 0, retrievalPerTask: 2, pRetrieval1k: 5, rerankPerTask: 1, pRerank1k: 1, toolCallsPerTask: 4, pTool: 0.001, embedTokPerTask: 100, pEmbed: 0.1 });
  near(r.perTask.retrieval, 2 / 1000 * 5);       // 0.01
  near(r.perTask.rerank, 1 / 1000 * 1);          // 0.001
  near(r.perTask.tools, 4 * 0.001);              // 0.004
  near(r.perTask.embeddings, 100 / 1e6 * 0.1);   // 0.00001
});
test('scenarioCost: fixed costs and one-time costs are kept separate', () => {
  const r = L.scenarioCost({ ...SC, fixObs: 100, fixEval: 50, fixStorage: 25, fixPlatform: 25, oneDocs: 1000, oneTokPerDoc: 2000, pEmbed: 0.5, oneOther: 10 });
  near(r.monthlyFixed, 200);
  near(r.oneTime.indexing, 1000 * 2000 / 1e6 * 0.5); // 1.0
  near(r.oneTimeTotal, 11);
  near(r.annualRecurring, r.monthlyTotal * 12);
  near(r.yearOneTotal, r.monthlyTotal * 12 + 11);
});
test('scenarioCost: unit economics', () => {
  const r = L.scenarioCost({ ...SC, requestsPerTask: 2 });
  near(r.unit.perWorkflow, r.monthlyTotal / 30000);
  near(r.unit.perRequest, r.monthlyTotal / 60000);
  near(r.unit.perUser, r.monthlyTotal / 300);
  near(r.unit.perSuccessfulTask, r.monthlyTotal / 24000);
});
test('scenarioCost: cost by component sums to the monthly total', () => {
  const r = L.scenarioCost({ ...SC, fixObs: 10, retrievalPerTask: 1, pRetrieval1k: 3, retryPct: 10, semPct: 20 });
  near(Object.values(r.byComponent).reduce((a, b) => a + b, 0), r.monthlyTotal, 1e-6);
  assert.ok(r.drivers.length > 0 && r.drivers[0].monthly >= r.drivers[r.drivers.length - 1].monthly);
});
test('scenarioCost: edge cases never throw or return NaN', () => {
  const cases = [{}, { tasksPerMonth: 0 }, { tasksPerMonth: 'abc', pIn: -5 }, { successPct: 0, tasksPerMonth: 10, inTok: 10, pIn: 1 }, { tasksPerMonth: 1e12, inTok: 1e9, pIn: 1e6, outTok: 1e9, pOut: 1e6 }, null, undefined];
  for (const c of cases) {
    const r = L.scenarioCost(c);
    for (const v of [r.perTaskTotal, r.monthlyTotal, r.annualRecurring, r.yearOneTotal]) assert.ok(Number.isFinite(v), JSON.stringify(c));
    for (const v of Object.values(r.unit)) assert.ok(v === null || Number.isFinite(v), JSON.stringify(c));
  }
});
test('scenarioCost: zero volume yields null unit costs rather than Infinity', () => {
  const u = L.scenarioCost({ tasksPerMonth: 0, users: 0, inTok: 10, pIn: 1 }).unit;
  assert.equal(JSON.stringify(u), JSON.stringify({ perRequest: null, perWorkflow: null, perUser: null, perSuccessfulTask: null }));
});
test('normalize: reports every correction instead of silently changing inputs', () => {
  const n = L.normalize({ pIn: -1, successPct: 250, inTok: 'x', callsPerTask: 0 });
  assert.equal(n.p.pIn, 0); assert.equal(n.p.successPct, 100); assert.equal(n.p.inTok, 0); assert.equal(n.p.callsPerTask, 1);
  assert.equal(n.warnings.length, 4);
});
test('scenarioCost: budget headroom', () => {
  const r = L.scenarioCost({ ...SC, monthlyBudget: 100 });
  assert.equal(r.budget.over, r.monthlyTotal > 100);
  near(r.budget.headroom, 100 - r.monthlyTotal);
  assert.equal(L.scenarioCost(SC).budget, null);
});

/* ---------- sensitivity and comparison ---------- */
test('sensitivity: doubling traffic doubles variable cost; 1x row has zero delta', () => {
  const rows = L.sensitivity({ ...SC, fixObs: 0 });
  const traffic = rows[0].points;
  near(traffic.find(p => p.label === '2x').deltaPct, 100);
  near(traffic.find(p => p.label === '1x').deltaPct, 0);
});
test('sensitivity: fixed costs do not scale with traffic', () => {
  const traffic = L.sensitivity({ ...SC, fixObs: 1e6 })[0].points;
  const base = L.scenarioCost({ ...SC, fixObs: 1e6 }).monthlyTotal;
  const dbl = traffic.find(p => p.label === '2x').monthlyTotal;
  assert.ok(dbl < base * 2);
});
test('sensitivity: retry and cache rows move in the expected direction', () => {
  const rows = L.sensitivity(SC);
  const retry = rows.find(r => r.label === 'Retry rate').points;
  assert.ok(retry[retry.length - 1].monthlyTotal > retry[0].monthlyTotal);
  const cache = rows.find(r => r.label.startsWith('Semantic')).points;
  assert.ok(cache[cache.length - 1].monthlyTotal < cache[0].monthlyTotal);
});
test('compareScenarios: identifies the driver and the delta', () => {
  const a = { ...SC, callsPerTask: 1 }, b = { ...SC, callsPerTask: 4 };
  const c = L.compareScenarios(a, b);
  assert.ok(c.totalDelta > 0);
  assert.match(c.biggestDriver, /Model/);
  near(c.b.monthlyTotal - c.a.monthlyTotal, c.totalDelta);
});
test('presets patch structure only, never prices; unknown preset throws', () => {
  const out = L.applyPreset(SC, 'multi-agent');
  assert.equal(out.callsPerTask, 10); assert.equal(out.pIn, SC.pIn); assert.equal(out.inTok, SC.inTok);
  for (const p of L.PRESETS) for (const k of Object.keys(p.patch)) assert.ok(!/^p[A-Z]|price/i.test(k), `${p.id} patches price field ${k}`);
  assert.throws(() => L.applyPreset(SC, 'nope'));
});
test('maxCallsForTarget: result fits the target and one more call does not', () => {
  const target = 0.02;
  const n = L.maxCallsForTarget(SC, target);
  assert.ok(n >= 1);
  assert.ok(L.scenarioCost({ ...SC, callsPerTask: n }).unit.perSuccessfulTask <= target + 1e-12);
  assert.ok(L.scenarioCost({ ...SC, callsPerTask: n + 1 }).unit.perSuccessfulTask > target);
});
test('maxCallsForTarget: returns null when unsolvable and 0 when other costs already exceed the target', () => {
  assert.equal(L.maxCallsForTarget(SC, 0), null);
  assert.equal(L.maxCallsForTarget({ ...SC, pIn: 0, pOut: 0 }, 1), null);
  assert.equal(L.maxCallsForTarget({ ...SC, infra: 1 }, 0.01), 0);
});
test('scenarioMarkdown: states when the pricing source is missing', () => {
  const md = L.scenarioMarkdown(SC, {});
  assert.match(md, /Pricing source: NOT RECORDED/);
  assert.match(md, /not a quote or a guaranteed cloud bill/);
  const md2 = L.scenarioMarkdown(SC, { pricingSource: 'https://cloud.google.com/pricing', retrievedOn: '2026-11-20', region: 'us-central1', currency: 'USD' });
  assert.match(md2, /Retrieved: 2026-11-20/);
});

/* ---------- retrieval metrics (hand-computed) ---------- */
test('precision@k and recall@k', () => {
  const ranked = ['a', 'x', 'b', 'y', 'z'], rel = ['a', 'b', 'c'];
  near(L.precisionAtK(ranked, rel, 3), 2 / 3);
  near(L.precisionAtK(ranked, rel, 5), 2 / 5);
  near(L.recallAtK(ranked, rel, 3), 2 / 3);
  near(L.recallAtK(ranked, rel, 1), 1 / 3);
});
test('precision@k keeps k as the denominator when fewer results are returned', () => {
  near(L.precisionAtK(['a'], ['a'], 5), 1 / 5);
});
test('recall is undefined (null) when a case has no relevant documents', () => {
  assert.equal(L.recallAtK(['a'], [], 3), null);
  assert.equal(L.reciprocalRank(['a'], [], 3), null);
  assert.equal(L.ndcgAtK(['a'], [], 3), null);
});
test('reciprocal rank', () => {
  near(L.reciprocalRank(['x', 'y', 'a'], ['a'], 5), 1 / 3);
  assert.equal(L.reciprocalRank(['x', 'y', 'a'], ['a'], 2), 0);
  assert.equal(L.reciprocalRank(['a'], ['a'], 5), 1);
});
test('ndcg: perfect ordering is 1; hand-computed binary and graded cases', () => {
  near(L.ndcgAtK(['a', 'b'], ['a', 'b'], 2), 1);
  // binary, relevant {a,b}; ranked [x, a, b]. DCG = 1/log2(3) + 1/log2(4) ; IDCG = 1/log2(2) + 1/log2(3)
  const dcg = 1 / Math.log2(3) + 1 / Math.log2(4), idcg = 1 / Math.log2(2) + 1 / Math.log2(3);
  near(L.ndcgAtK(['x', 'a', 'b'], ['a', 'b'], 3), dcg / idcg);
  // graded: a=3, b=1 ; ranked [b, a]. DCG = (2^1-1)/log2(2) + (2^3-1)/log2(3) ; IDCG = 7/log2(2) + 1/log2(3)
  const gd = 1 / 1 + 7 / Math.log2(3), gi = 7 / 1 + 1 / Math.log2(3);
  near(L.ndcgAtK(['b', 'a'], { a: 3, b: 1 }, 2), gd / gi);
});
test('ndcg ignores repeated ids so duplicate evidence cannot inflate the score', () => {
  const dup = L.ndcgAtK(['a', 'a', 'a'], ['a', 'b'], 3), clean = L.ndcgAtK(['a', 'x', 'y'], ['a', 'b'], 3);
  near(dup, clean);
});
test('evaluateRetrieval aggregates and reports skipped cases', () => {
  const cases = [{ id: 1, relevant: ['a'] }, { id: 2, relevant: ['b'] }, { id: 3, relevant: [] }];
  const out = L.evaluateRetrieval(cases, c => (c.id === 1 ? ['a', 'z'] : ['z', 'b']), 2);
  near(out.aggregate.mrr.value, (1 + 0.5) / 2);
  assert.equal(out.aggregate.mrr.n, 2); assert.equal(out.aggregate.mrr.skipped, 1);
  near(out.aggregate.recall.value, 1);
});
test('compareToBaseline: requires explicit tolerances; never invents a threshold', () => {
  const base = { recall: 0.8, mrr: 0.6 };
  const r = L.compareToBaseline({ recall: 0.79, mrr: 0.5 }, base, { recall: 0.02 });
  const by = Object.fromEntries(r.results.map(x => [x.metric, x]));
  assert.equal(by.recall.status, 'pass');
  assert.equal(by.mrr.status, 'no-threshold');
  assert.equal(r.passed, false);
  const f = L.compareToBaseline({ recall: 0.7, mrr: 0.6 }, base, { recall: 0.02, mrr: 0.0 });
  assert.equal(f.hasFailures, true);
  assert.equal(L.compareToBaseline({ recall: 0.8, mrr: 0.6 }, base, { recall: 0, mrr: 0 }).passed, true);
  assert.equal(L.compareToBaseline({ recall: 0.8 }, base, { recall: 0, mrr: 0 }).results.find(x => x.metric === 'mrr').status, 'missing');
});
