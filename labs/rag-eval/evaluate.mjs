// Runs the golden dataset against the retriever and returns a report. Used by run.mjs and test.mjs.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { Index, canSee, looksInjected } from './retriever.mjs';

export const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(here, f), 'utf8'));

// Same metric code the website loads, so the lab and the site cannot drift apart.
export function loadLogic() {
  const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(here, '../../assets/logic.js'), 'utf8'), ctx);
  return ctx.AtlasLogic;
}
export const loadCorpus = () => readJson('corpus.json');
export const loadDataset = () => readJson('dataset.json');
export const loadGates = () => readJson('gates.json');

export function runEval({ fault = null, k = 3, indexOpts = {} } = {}) {
  const L = loadLogic(), corpus = loadCorpus(), data = loadDataset();
  const faultOpts = fault ? { [fault]: true } : {};
  const idx = new Index(corpus.docs, { ...faultOpts, ...indexOpts });
  const byId = Object.fromEntries(corpus.docs.map(d => [d.id, d]));
  const t0 = process.hrtime.bigint();
  const calls = {};
  const retrieve = (c) => { const r = idx.search(c.query, c.user, k); calls[c.id] = r; return r.results.map(x => x.id); };
  const ev = L.evaluateRetrieval(data.cases, retrieve, k);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;

  let abstainCorrect = 0, leaks = [], stale = [], served = [];
  for (const c of data.cases) {
    const r = calls[c.id], shouldAbstain = c.expectedBehavior === 'abstain';
    if (r.abstained === shouldAbstain) abstainCorrect++;
    for (const { id } of r.results) {
      const d = byId[id];
      if (!canSee(d, c.user)) leaks.push({ case: c.id, doc: id });
      if (d.superseded) stale.push({ case: c.id, doc: id });
      if (looksInjected(d.title + ' ' + d.text)) served.push({ case: c.id, doc: id });
    }
  }
  const metric = (m) => m.value;
  const metrics = {
    precision: metric(ev.aggregate.precision), recall: metric(ev.aggregate.recall),
    mrr: metric(ev.aggregate.mrr), ndcg: metric(ev.aggregate.ndcg),
    abstentionAccuracy: abstainCorrect / data.cases.length
  };
  return {
    fault, k, datasetVersion: data.datasetVersion, cases: data.cases.length,
    answerableCases: ev.aggregate.recall.n, metrics,
    // Safety invariants: these must be exactly zero by construction, so they are hard failures,
    // not tolerance-based thresholds.
    invariants: { aclOrTenantLeaks: leaks, staleDocumentsServed: stale, injectionPayloadsServed: served },
    perCase: ev.per.map(p => ({ id: p.id, ranked: p.ranked, abstained: calls[p.id].abstained, reason: calls[p.id].reason, p: p.p, r: p.r, rr: p.rr })),
    latencyMsTotal: Math.round(ms * 100) / 100, index: idx
  };
}

export function gate(report, baseline, gates) {
  const L = loadLogic();
  const inv = report.invariants, invariantFailures = Object.entries(inv).filter(([, v]) => v.length).map(([k, v]) => `${k}: ${v.length}`);
  const cmp = L.compareToBaseline(report.metrics, baseline.metrics, gates.tolerances);
  return { invariantFailures, comparison: cmp, passed: !invariantFailures.length && cmp.passed };
}
