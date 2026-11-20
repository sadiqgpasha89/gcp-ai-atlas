/* Atlas pure logic: cost model and retrieval-evaluation metrics.
   Plain script, no dependencies. Loaded by index.html before app.js and by the Node tests
   (tests/helpers.mjs) so the same code that runs in the browser is the code that is tested.
   Nothing here performs I/O or network calls. Prices are always caller-supplied inputs;
   this file contains no price data. */
(function (root) {
  'use strict';

  /* ---------- small helpers ---------- */
  function sum(a) { var t = 0; for (var i = 0; i < a.length; i++) t += a[i]; return t; }
  function round(n, d) { var m = Math.pow(10, d == null ? 6 : d); return Math.round(n * m) / m; }

  /* ===================================================================
     1. Legacy cost-per-task model (kept exactly: the original calculator
        and its levers table are built on it).
     =================================================================== */
  function calcCost(p) {
    var bf = 1 - p.batchShare / 100 * p.batchDisc / 100, keep = 1 - p.sem / 100;
    var inC = p.inTok / 1e6 * p.pIn * (1 - p.cacheFrac / 100 * p.cacheDisc / 100) * bf * p.calls * keep;
    var outC = p.outTok / 1e6 * p.pOut * bf * p.calls * keep;
    var task = inC + outC + p.infra;
    return { inC: inC, outC: outC, infra: p.infra, task: task, ok: p.success > 0 ? task / (p.success / 100) : Infinity, month: task * p.req * 30 };
  }

  /* ===================================================================
     2. Scenario cost model (FinOps).
        Superset of calcCost: with every new field at its default of 0 the
        per-task variable cost equals calcCost().task.
     =================================================================== */
  var PCT = { successPct: 1, semPct: 1, cacheFrac: 1, cacheDisc: 1, batchShare: 1, batchDisc: 1 };
  var FIELDS = [
    // key, default, label, unit
    ['tasksPerMonth', 0, 'Tasks (workflows) per month', 'count'],
    ['requestsPerTask', 1, 'User-visible requests per task', 'count'],
    ['users', 0, 'Active users per month', 'count'],
    ['successPct', 100, 'Task success rate', '%'],
    ['callsPerTask', 1, 'Model calls per task (all agent steps)', 'count'],
    ['inTok', 0, 'Input tokens per call', 'tokens'],
    ['outTok', 0, 'Output tokens per call', 'tokens'],
    ['pIn', 0, 'Price per 1M input tokens', 'currency'],
    ['pOut', 0, 'Price per 1M output tokens', 'currency'],
    ['cacheFrac', 0, 'Input tokens served from prompt cache', '%'],
    ['cacheDisc', 0, 'Prompt-cache discount', '%'],
    ['semPct', 0, 'Tasks answered from semantic cache', '%'],
    ['batchShare', 0, 'Share of calls sent to batch', '%'],
    ['batchDisc', 0, 'Batch discount', '%'],
    ['retryPct', 0, 'Attempts that need one retry', '%'],
    ['toolCallsPerTask', 0, 'Billable tool/API calls per task', 'count'],
    ['pTool', 0, 'Price per tool/API call', 'currency'],
    ['retrievalPerTask', 0, 'Retrieval/search queries per task', 'count'],
    ['pRetrieval1k', 0, 'Price per 1,000 retrieval queries', 'currency'],
    ['embedTokPerTask', 0, 'Query-embedding tokens per task', 'tokens'],
    ['pEmbed', 0, 'Price per 1M embedding tokens', 'currency'],
    ['rerankPerTask', 0, 'Rerank requests per task', 'count'],
    ['pRerank1k', 0, 'Price per 1,000 rerank requests', 'currency'],
    ['infra', 0, 'Other variable cost per task (compute, network)', 'currency'],
    ['fixObs', 0, 'Logging, tracing and monitoring per month', 'currency'],
    ['fixEval', 0, 'Evaluation runs per month', 'currency'],
    ['fixStorage', 0, 'Storage and index hosting per month', 'currency'],
    ['fixPlatform', 0, 'Other fixed platform cost per month', 'currency'],
    ['oneDocs', 0, 'One-time: documents to index', 'count'],
    ['oneTokPerDoc', 0, 'One-time: tokens embedded per document', 'tokens'],
    ['oneOther', 0, 'One-time: other setup cost', 'currency'],
    ['monthlyBudget', 0, 'Monthly budget (0 = none set)', 'currency']
  ];
  var DEFAULTS = {}; FIELDS.forEach(function (f) { DEFAULTS[f[0]] = f[1]; });

  /* Coerce raw input: missing/NaN/negative become 0 (or the default for requestsPerTask and
     callsPerTask, which must be at least 1); percentages clamp to 0..100. Every correction is
     reported in `warnings` so the UI can show it instead of silently changing the answer. */
  function normalize(raw) {
    var out = {}, warnings = [];
    FIELDS.forEach(function (f) {
      var k = f[0], v = raw && raw[k];
      if (v === undefined || v === null || v === '') { out[k] = f[1]; return; }
      v = typeof v === 'number' ? v : parseFloat(v);
      if (!isFinite(v)) { warnings.push(k + ': not a finite number, using ' + f[1]); out[k] = f[1]; return; }
      if (v < 0) { warnings.push(k + ': negative value, using 0'); v = 0; }
      if (PCT[k] && v > 100) { warnings.push(k + ': above 100%, using 100'); v = 100; }
      out[k] = v;
    });
    if (out.callsPerTask < 1) { warnings.push('callsPerTask: below 1, using 1'); out.callsPerTask = 1; }
    if (out.requestsPerTask < 1) { warnings.push('requestsPerTask: below 1, using 1'); out.requestsPerTask = 1; }
    return { p: out, warnings: warnings };
  }

  function div(a, b) { return b > 0 && isFinite(a / b) ? a / b : null; }

  function scenarioCost(raw) {
    var n = normalize(raw), p = n.p;
    var keep = 1 - p.semPct / 100;                       // share of tasks that reach the pipeline
    var bf = 1 - p.batchShare / 100 * p.batchDisc / 100; // blended batch factor on model tokens
    var attempts = 1 + p.retryPct / 100;                 // expected attempts, single-retry model
    var llmIn = p.inTok / 1e6 * p.pIn * (1 - p.cacheFrac / 100 * p.cacheDisc / 100) * bf * p.callsPerTask * keep * attempts;
    var llmOut = p.outTok / 1e6 * p.pOut * bf * p.callsPerTask * keep * attempts;
    var tools = p.toolCallsPerTask * p.pTool * keep * attempts;
    var retrieval = p.retrievalPerTask / 1000 * p.pRetrieval1k * keep * attempts;
    var rerank = p.rerankPerTask / 1000 * p.pRerank1k * keep * attempts;
    var embeddings = p.embedTokPerTask / 1e6 * p.pEmbed * attempts; // cache lookup still embeds the query
    var other = p.infra;
    var perTask = { llmIn: llmIn, llmOut: llmOut, tools: tools, retrieval: retrieval, rerank: rerank, embeddings: embeddings, other: other };
    var perTaskTotal = sum([llmIn, llmOut, tools, retrieval, rerank, embeddings, other]);
    var monthlyVariable = perTaskTotal * p.tasksPerMonth;
    var fixed = { observability: p.fixObs, evaluation: p.fixEval, storage: p.fixStorage, platform: p.fixPlatform };
    var monthlyFixed = sum([p.fixObs, p.fixEval, p.fixStorage, p.fixPlatform]);
    var monthlyTotal = monthlyVariable + monthlyFixed;
    var oneTime = { indexing: p.oneDocs * p.oneTokPerDoc / 1e6 * p.pEmbed, other: p.oneOther };
    var oneTimeTotal = oneTime.indexing + oneTime.other;
    var successTasks = p.tasksPerMonth * p.successPct / 100;
    var requests = p.tasksPerMonth * p.requestsPerTask;
    var byComponent = {
      'Model input tokens': llmIn * p.tasksPerMonth, 'Model output tokens': llmOut * p.tasksPerMonth,
      'Tool / API calls': tools * p.tasksPerMonth, 'Retrieval queries': retrieval * p.tasksPerMonth,
      'Reranking': rerank * p.tasksPerMonth, 'Query embeddings': embeddings * p.tasksPerMonth,
      'Other variable': other * p.tasksPerMonth,
      'Observability': p.fixObs, 'Evaluation': p.fixEval, 'Storage / index hosting': p.fixStorage, 'Other fixed': p.fixPlatform
    };
    var res = {
      inputs: p, warnings: n.warnings,
      perTask: perTask, perTaskTotal: perTaskTotal,
      monthlyVariable: monthlyVariable, monthlyFixed: monthlyFixed, fixed: fixed, monthlyTotal: monthlyTotal,
      oneTime: oneTime, oneTimeTotal: oneTimeTotal,
      annualRecurring: monthlyTotal * 12, yearOneTotal: monthlyTotal * 12 + oneTimeTotal,
      unit: {
        perRequest: div(monthlyTotal, requests),
        perWorkflow: div(monthlyTotal, p.tasksPerMonth),
        perUser: div(monthlyTotal, p.users),
        perSuccessfulTask: div(monthlyTotal, successTasks)
      },
      byComponent: byComponent,
      budget: p.monthlyBudget > 0 ? { monthlyBudget: p.monthlyBudget, headroom: p.monthlyBudget - monthlyTotal, over: monthlyTotal > p.monthlyBudget } : null
    };
    // Largest cost drivers, descending, zero components dropped.
    res.drivers = Object.keys(byComponent).map(function (k) { return { name: k, monthly: byComponent[k], share: div(byComponent[k], monthlyTotal) }; })
      .filter(function (d) { return d.monthly > 0; }).sort(function (a, b) { return b.monthly - a.monthly; });
    return res;
  }

  /* One-at-a-time sensitivity. Each knob is scaled (or set) and the monthly total recomputed.
     Returns rows of { label, points:[{ label, monthlyTotal, deltaPct }] }. */
  var SENS = [
    ['Traffic (tasks per month)', [['0.5x', 'tasksPerMonth', 0.5], ['1x', 'tasksPerMonth', 1], ['2x', 'tasksPerMonth', 2], ['10x', 'tasksPerMonth', 10]], 'mul'],
    ['Token volume (input and output per call)', [['0.5x', ['inTok', 'outTok'], 0.5], ['1x', ['inTok', 'outTok'], 1], ['2x', ['inTok', 'outTok'], 2]], 'mul'],
    ['Agent steps (model calls per task)', [['0.5x', 'callsPerTask', 0.5], ['1x', 'callsPerTask', 1], ['2x', 'callsPerTask', 2], ['4x', 'callsPerTask', 4]], 'mul'],
    ['Retry rate', [['0%', 'retryPct', 0], ['10%', 'retryPct', 10], ['25%', 'retryPct', 25], ['50%', 'retryPct', 50]], 'set'],
    ['Semantic-cache hit ratio', [['0%', 'semPct', 0], ['25%', 'semPct', 25], ['50%', 'semPct', 50], ['75%', 'semPct', 75]], 'set'],
    ['Retrieval and rerank depth', [['0.5x', ['retrievalPerTask', 'rerankPerTask'], 0.5], ['1x', ['retrievalPerTask', 'rerankPerTask'], 1], ['2x', ['retrievalPerTask', 'rerankPerTask'], 2]], 'mul']
  ];
  function sensitivity(raw) {
    var base = scenarioCost(raw), b = base.monthlyTotal;
    return SENS.map(function (row) {
      return {
        label: row[0],
        points: row[1].map(function (pt) {
          var q = {}, k, keys = [].concat(pt[1]);
          for (k in base.inputs) q[k] = base.inputs[k];
          keys.forEach(function (key) { q[key] = row[2] === 'mul' ? base.inputs[key] * pt[2] : pt[2]; });
          if (q.callsPerTask < 1) q.callsPerTask = 1; // a task never makes fewer than one call
          var t = scenarioCost(q).monthlyTotal;
          return { label: pt[0], monthlyTotal: t, deltaPct: b > 0 ? (t - b) / b * 100 : null };
        })
      };
    });
  }

  /* Scenario comparison: per-component deltas, B relative to A. */
  function compareScenarios(a, b) {
    var ra = scenarioCost(a), rb = scenarioCost(b), keys = Object.keys(ra.byComponent);
    var rows = keys.map(function (k) {
      var x = ra.byComponent[k], y = rb.byComponent[k];
      return { name: k, a: x, b: y, delta: y - x, deltaPct: x > 0 ? (y - x) / x * 100 : null };
    }).filter(function (r) { return r.a > 0 || r.b > 0; });
    rows.sort(function (p, q) { return Math.abs(q.delta) - Math.abs(p.delta); });
    var biggest = rows.length ? rows[0] : null;
    return {
      a: ra, b: rb, rows: rows,
      totalDelta: rb.monthlyTotal - ra.monthlyTotal,
      totalDeltaPct: ra.monthlyTotal > 0 ? (rb.monthlyTotal - ra.monthlyTotal) / ra.monthlyTotal * 100 : null,
      successTaskDelta: (ra.unit.perSuccessfulTask != null && rb.unit.perSuccessfulTask != null) ? rb.unit.perSuccessfulTask - ra.unit.perSuccessfulTask : null,
      biggestDriver: biggest ? biggest.name : null
    };
  }

  /* Illustrative archetypes. These set the *shape* of a workload (how many calls, how much
     retrieval) so two designs can be compared. They are assumptions to be replaced with
     measured values; they contain no prices. Each patch is applied on top of the user's inputs. */
  var PRESETS = [
    { id: 'workflow', name: 'Deterministic workflow', note: 'One model call inside fixed code. No agent loop.', patch: { callsPerTask: 1, toolCallsPerTask: 1, retrievalPerTask: 0, rerankPerTask: 0, embedTokPerTask: 0 } },
    { id: 'single-agent', name: 'Single agent with tools', note: 'A loop of model calls with a few tool calls. Assumes about 4 steps.', patch: { callsPerTask: 4, toolCallsPerTask: 3, retrievalPerTask: 0, rerankPerTask: 0, embedTokPerTask: 0 } },
    { id: 'multi-agent', name: 'Multi-agent (supervisor + workers)', note: 'Supervisor plus specialists. Assumes about 10 model calls.', patch: { callsPerTask: 10, toolCallsPerTask: 6, retrievalPerTask: 0, rerankPerTask: 0, embedTokPerTask: 0 } },
    { id: 'rag-vector', name: 'Vector-only RAG', note: 'One retrieval, no reranker, one generation call.', patch: { callsPerTask: 1, toolCallsPerTask: 0, retrievalPerTask: 1, rerankPerTask: 0, embedTokPerTask: 50 } },
    { id: 'rag-hybrid', name: 'Hybrid RAG with reranking', note: 'Lexical plus vector retrieval, reranked, one generation call.', patch: { callsPerTask: 1, toolCallsPerTask: 0, retrievalPerTask: 2, rerankPerTask: 1, embedTokPerTask: 50 } }
  ];
  function applyPreset(raw, id) {
    var pr = PRESETS.filter(function (x) { return x.id === id; })[0];
    if (!pr) throw new Error('unknown preset ' + id);
    var out = {}, k;
    for (k in raw) out[k] = raw[k];
    for (k in pr.patch) out[k] = pr.patch[k];
    return out;
  }

  /* Budget guard: the largest number of model calls per task that fits a target cost per
     successful task, holding everything else constant. Returns null when it cannot be solved
     (no price, no target, or the non-model costs alone already exceed the target). */
  function maxCallsForTarget(raw, targetPerSuccessfulTask) {
    var n = normalize(raw), p = n.p;
    if (!(targetPerSuccessfulTask > 0) || !(p.successPct > 0) || !(p.tasksPerMonth > 0)) return null;
    var one = {}, k; for (k in p) one[k] = p[k]; one.callsPerTask = 1;
    var r1 = scenarioCost(one);
    var perCall = (r1.perTask.llmIn + r1.perTask.llmOut);
    if (!(perCall > 0)) return null;
    var targetMonthly = targetPerSuccessfulTask * p.tasksPerMonth * p.successPct / 100;
    var nonModel = r1.monthlyTotal - perCall * p.tasksPerMonth;
    var room = targetMonthly - nonModel;
    if (room <= 0) return 0;
    return Math.floor(room / (perCall * p.tasksPerMonth));
  }

  function scenarioMarkdown(raw, meta) {
    var r = scenarioCost(raw), m = meta || {};
    function c(v) { return v == null ? 'n/a' : (m.currency || '') + ' ' + (Math.abs(v) < 1 ? v.toFixed(4) : v.toFixed(2)); }
    var L = ['# Cost scenario' + (m.name ? ': ' + m.name : ''), ''];
    L.push('> Estimate from user-supplied assumptions, not a quote or a guaranteed cloud bill.');
    L.push('> Pricing source: ' + (m.pricingSource || 'NOT RECORDED') + ' | Retrieved: ' + (m.retrievedOn || 'NOT RECORDED') + ' | Region: ' + (m.region || 'NOT RECORDED') + ' | Currency: ' + (m.currency || 'NOT RECORDED'));
    L.push('', '## Unit economics', '', '| Measure | Value |', '|---|---|',
      '| Cost per request | ' + c(r.unit.perRequest) + ' |', '| Cost per workflow (task) | ' + c(r.unit.perWorkflow) + ' |',
      '| Cost per user per month | ' + c(r.unit.perUser) + ' |', '| Cost per successful task | ' + c(r.unit.perSuccessfulTask) + ' |');
    L.push('', '## Totals', '', '| Measure | Value |', '|---|---|',
      '| Monthly variable | ' + c(r.monthlyVariable) + ' |', '| Monthly fixed | ' + c(r.monthlyFixed) + ' |', '| Monthly total | ' + c(r.monthlyTotal) + ' |',
      '| One-time setup | ' + c(r.oneTimeTotal) + ' |', '| Year-one total (12 months + one-time) | ' + c(r.yearOneTotal) + ' |');
    L.push('', '## Cost by component (monthly)', '', '| Component | Monthly | Share |', '|---|---|---|');
    r.drivers.forEach(function (d) { L.push('| ' + d.name + ' | ' + c(d.monthly) + ' | ' + (d.share == null ? 'n/a' : (d.share * 100).toFixed(1) + '%') + ' |'); });
    L.push('', '## Assumptions (inputs)', '', '```json', JSON.stringify(r.inputs, null, 2), '```');
    if (r.warnings.length) { L.push('', '## Input corrections', ''); r.warnings.forEach(function (w) { L.push('- ' + w); }); }
    return L.join('\n');
  }

  /* ===================================================================
     3. Retrieval evaluation metrics.
        ranked  : array of document ids, best first
        relevant: array/Set of relevant ids (binary), or an object id -> grade (graded)
     =================================================================== */
  function relSet(rel) { var s = {}, i; if (Array.isArray(rel)) { for (i = 0; i < rel.length; i++) s[rel[i]] = 1; } else if (rel && typeof rel.forEach === 'function') { rel.forEach(function (x) { s[x] = 1; }); } else if (rel) { for (var k in rel) if (rel[k] > 0) s[k] = rel[k]; } return s; }
  function relCount(s) { return Object.keys(s).length; }
  function topK(ranked, k) { return ranked.slice(0, Math.max(0, k | 0)); }

  /* Precision@k = relevant in top k / k. The denominator is k even when fewer than k results come back,
     so a retriever is not rewarded for returning less. */
  function precisionAtK(ranked, relevant, k) {
    if (!(k > 0)) return null;
    var s = relSet(relevant), hits = 0;
    topK(ranked, k).forEach(function (id) { if (s[id]) hits++; });
    return hits / k;
  }
  /* Recall@k = relevant in top k / all relevant. Undefined (null) when a case has no relevant documents. */
  function recallAtK(ranked, relevant, k) {
    var s = relSet(relevant), total = relCount(s);
    if (!total) return null;
    var hits = 0; topK(ranked, k).forEach(function (id) { if (s[id]) hits++; });
    return hits / total;
  }
  /* Reciprocal rank of the first relevant document within the top k (0 if none). */
  function reciprocalRank(ranked, relevant, k) {
    var s = relSet(relevant), lim = k > 0 ? Math.min(k, ranked.length) : ranked.length;
    if (!relCount(s)) return null;
    for (var i = 0; i < lim; i++) if (s[ranked[i]]) return 1 / (i + 1);
    return 0;
  }
  /* NDCG@k with gain (2^grade - 1) and a log2(rank + 1) discount. Binary relevance is grade 1.
     Null when the ideal DCG is 0 (no relevant documents). Duplicate ids are counted once. */
  function ndcgAtK(ranked, relevant, k) {
    var s = relSet(relevant), grades = Object.keys(s).map(function (id) { return s[id]; }).sort(function (a, b) { return b - a; });
    if (!grades.length || !(k > 0)) return null;
    var seen = {}, dcg = 0, idcg = 0, i, rank = 0;
    topK(ranked, k).forEach(function (id) { if (seen[id]) return; seen[id] = 1; rank++; if (s[id]) dcg += (Math.pow(2, s[id]) - 1) / Math.log(rank + 1) * Math.LN2; });
    for (i = 0; i < Math.min(k, grades.length); i++) idcg += (Math.pow(2, grades[i]) - 1) / Math.log(i + 2) * Math.LN2;
    return idcg > 0 ? dcg / idcg : null;
  }
  function meanSkipNull(a) { var v = a.filter(function (x) { return x != null; }); return { value: v.length ? sum(v) / v.length : null, n: v.length, skipped: a.length - v.length }; }

  /* Run a retriever over a dataset of cases { id, query, relevant } and aggregate. */
  function evaluateRetrieval(cases, retrieve, k) {
    var per = cases.map(function (c) {
      var ranked = retrieve(c) || [];
      return { id: c.id, ranked: ranked, p: precisionAtK(ranked, c.relevant, k), r: recallAtK(ranked, c.relevant, k), rr: reciprocalRank(ranked, c.relevant, k), ndcg: ndcgAtK(ranked, c.relevant, k) };
    });
    var agg = {
      k: k, cases: cases.length,
      precision: meanSkipNull(per.map(function (x) { return x.p; })),
      recall: meanSkipNull(per.map(function (x) { return x.r; })),
      mrr: meanSkipNull(per.map(function (x) { return x.rr; })),
      ndcg: meanSkipNull(per.map(function (x) { return x.ndcg; }))
    };
    return { per: per, aggregate: agg };
  }

  /* Regression gate. `tolerances` MUST be supplied per metric by the project: there are no
     universal defaults. A metric without a tolerance is reported as 'no-threshold' rather than
     silently passing. higherIsBetter metrics fail when current < baseline - tolerance. */
  function compareToBaseline(current, baseline, tolerances) {
    var out = [], names = Object.keys(baseline);
    names.forEach(function (m) {
      var b = baseline[m], c = current[m], tol = tolerances ? tolerances[m] : undefined;
      if (c == null || b == null) { out.push({ metric: m, baseline: b, current: c, status: 'missing' }); return; }
      if (tol == null) { out.push({ metric: m, baseline: b, current: c, delta: c - b, status: 'no-threshold' }); return; }
      out.push({ metric: m, baseline: b, current: c, delta: c - b, tolerance: tol, status: c >= b - tol ? 'pass' : 'fail' });
    });
    return { results: out, passed: out.every(function (r) { return r.status === 'pass'; }), hasFailures: out.some(function (r) { return r.status === 'fail'; }) };
  }

  root.AtlasLogic = {
    calcCost: calcCost,
    FIELDS: FIELDS, DEFAULTS: DEFAULTS, PRESETS: PRESETS,
    normalize: normalize, scenarioCost: scenarioCost, sensitivity: sensitivity, compareScenarios: compareScenarios,
    applyPreset: applyPreset, maxCallsForTarget: maxCallsForTarget, scenarioMarkdown: scenarioMarkdown,
    precisionAtK: precisionAtK, recallAtK: recallAtK, reciprocalRank: reciprocalRank, ndcgAtK: ndcgAtK,
    evaluateRetrieval: evaluateRetrieval, compareToBaseline: compareToBaseline, round: round
  };
})(typeof window !== 'undefined' ? window : globalThis);
