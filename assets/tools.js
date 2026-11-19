/* Interactive tools: evaluation scorecard (#/d/scorecard) and AI FinOps model (#/d/finops).
   Loaded before app.js. Each tool exposes pure functions (evaluate / calc) so they can be tested outside a browser,
   plus render(U) and mount(U), where U is the helper bag passed in by app.js. */
(function () {
  'use strict';
  var T = (window.ATLAS_TOOLS = window.ATLAS_TOOLS || {});

  function num(v) { var x = parseFloat(v); return isFinite(x) ? x : NaN; }
  function uv(m, v) { return m.unit === '$' ? '$' + v : v + m.unit; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ================= evaluation scorecard ================= */
  var METRICS = [
    { id: 'success', label: 'Task success', unit: '%', dir: 'higher', kind: 'pct', gate: 90, help: 'Share of cases judged correct and complete' },
    { id: 'ground', label: 'Groundedness', unit: '%', dir: 'higher', kind: 'pct', gate: 95, help: 'Share of answers whose claims are supported by the cited sources' },
    { id: 'recall', label: 'Retrieval recall at k', unit: '%', dir: 'higher', kind: 'pct', gate: 85, help: 'Share of cases where the needed passage was retrieved' },
    { id: 'tool', label: 'Tool correctness', unit: '%', dir: 'higher', kind: 'pct', gate: 97, help: 'Right tool and valid arguments' },
    { id: 'attack', label: 'Attack success rate', unit: '%', dir: 'lower', kind: 'attack', gate: 0, help: 'Share of adversarial cases that succeeded (injection, leakage)' },
    { id: 'p95', label: 'p95 latency', unit: 's', dir: 'lower', kind: 'lat', gate: 8, help: 'End-to-end seconds on a replayed sample' },
    { id: 'cost', label: 'Cost per successful task', unit: '$', dir: 'lower', kind: 'cost', gate: 0.1, help: 'Total spend divided by successful tasks' }
  ];
  function scDefaults() {
    return {
      n: 200, margin: 2, lat: 10, cost: 10,
      gates: METRICS.reduce(function (o, m) { o[m.id] = m.gate; return o; }, {}),
      cands: [
        { name: 'Production (baseline)', v: { success: 91, ground: 96, recall: 88, tool: 98, attack: 0, p95: 6.5, cost: 0.062 } },
        { name: 'A: new prompt', v: { success: 93, ground: 96, recall: 90, tool: 98, attack: 0, p95: 6.9, cost: 0.064 } },
        { name: 'B: larger model', v: { success: 94, ground: 93, recall: 89, tool: 97, attack: 1, p95: 5.1, cost: 0.081 } }
      ]
    };
  }
  /* 95 percent half-width of a proportion, in percentage points */
  function noise(pPct, n) {
    var p = Math.min(1, Math.max(0, pPct / 100));
    return n > 0 ? 1.96 * Math.sqrt(p * (1 - p) / n) * 100 : NaN;
  }
  /* Returns per candidate: cells[metric] = {v, abs, rel, pass, why, delta, noisy}, passed, total, blocked[] */
  function scEvaluate(s) {
    var base = s.cands[0];
    return s.cands.map(function (c, i) {
      var cells = {}, passed = 0, blocked = [];
      METRICS.forEach(function (m) {
        var v = num(c.v[m.id]), g = num(s.gates[m.id]), b = num(base.v[m.id]);
        var cell = { v: v, abs: false, rel: true, why: [], delta: NaN, noisy: false };
        if (!isFinite(v)) { cell.why.push('missing value'); }
        else {
          cell.abs = !isFinite(g) ? true : (m.dir === 'higher' ? v >= g : v <= g);
          if (!cell.abs) cell.why.push((m.dir === 'higher' ? 'below ' : 'above ') + 'the gate of ' + uv(m, g));
          if (i > 0 && isFinite(b)) {
            cell.delta = v - b;
            if (m.kind === 'pct') { cell.rel = v >= b - num(s.margin); if (!cell.rel) cell.why.push('more than ' + s.margin + ' points below baseline'); cell.noisy = Math.abs(cell.delta) < noise(b, num(s.n)); }
            else if (m.kind === 'attack') { cell.rel = v <= b; if (!cell.rel) cell.why.push('worse than baseline'); }
            else if (m.kind === 'lat') { cell.rel = v <= b * (1 + num(s.lat) / 100); if (!cell.rel) cell.why.push('more than ' + s.lat + '% slower than baseline'); }
            else if (m.kind === 'cost') { cell.rel = v <= b * (1 + num(s.cost) / 100); if (!cell.rel) cell.why.push('more than ' + s.cost + '% costlier than baseline'); }
          }
        }
        cell.pass = isFinite(v) && cell.abs && cell.rel;
        if (cell.pass) passed++; else blocked.push(m.label + ': ' + cell.why.join(', '));
        cells[m.id] = cell;
      });
      return { name: c.name, cells: cells, passed: passed, total: METRICS.length, blocked: blocked, ship: blocked.length === 0 };
    });
  }
  function scMarkdown(s, ev, U) {
    var L = ['# Evaluation scorecard', '', 'Cases in the dataset: ' + s.n + '. Baseline: ' + s.cands[0].name + '. Regression margin: ' + s.margin + ' points; latency allowance ' + s.lat + '%; cost allowance ' + s.cost + '%.', ''];
    L.push('| Metric | Gate | ' + s.cands.map(function (c) { return c.name; }).join(' | ') + ' |');
    L.push('|---|---|' + s.cands.map(function () { return '---|'; }).join(''));
    METRICS.forEach(function (m) {
      L.push('| ' + m.label + ' | ' + (m.dir === 'higher' ? '≥ ' : '≤ ') + uv(m, s.gates[m.id]) + ' | ' + ev.map(function (e) {
        var c = e.cells[m.id]; return (isFinite(c.v) ? uv(m, c.v) : '—') + ' ' + (c.pass ? 'PASS' : 'FAIL');
      }).join(' | ') + ' |');
    });
    L.push('', '## Verdict');
    ev.forEach(function (e, i) { L.push('- ' + e.name + ': ' + (e.ship ? (i === 0 ? 'meets every absolute gate (baseline)' : 'meets all gates') : 'BLOCKED. ' + e.blocked.join('; '))); });
    var nz = noise(num(s.cands[0].v.success), num(s.n));
    if (isFinite(nz)) L.push('', 'Noise: at ' + s.n + ' cases, success-rate differences smaller than about ±' + nz.toFixed(1) + ' points are not distinguishable from chance.');
    L.push('', 'Generated by the Google Cloud AI Atlas scorecard. Gates are examples: set them from your own baseline.');
    return L.join('\n');
  }
  T.scorecard = {
    title: 'Evaluation scorecard', METRICS: METRICS, defaults: scDefaults, evaluate: scEvaluate, noise: noise, markdown: scMarkdown,
    render: function (U) {
      return '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/d">Decisions</a> / Tool</div><h1>Evaluation scorecard</h1>' +
        '<p class="lede">Compare models, prompts, agent configurations or retrieval strategies on one dataset, and turn your thresholds into release gates.</p>' +
        '<div class="callout"><b>How to use it</b>Enter the results of one evaluation run per candidate, all on the <strong>same dataset</strong>. The first column is the baseline (what is in production). A candidate passes a metric when it meets the absolute gate <em>and</em> does not regress against the baseline by more than the allowance. Nothing is sent anywhere; the checks run in your browser. Gates are examples: set them from your own baseline ([[p:evaluation-lifecycle|evaluation lifecycle]]).</div>'.replace(/\[\[p:evaluation-lifecycle\|([^\]]+)\]\]/, '<a href="#/p/evaluation-lifecycle">$1</a>') +
        '<div class="wide"><div class="sc"><div id="scIn"></div><div id="scOut" class="calcout" aria-live="polite"></div></div></div>';
    },
    mount: function (U) {
      var s = scDefaults(), inEl = U.$('#scIn'), outEl = U.$('#scOut'), esc = U.esc;
      function inputs() {
        var h = '<div class="scglobals">' + [['n', 'Cases in the dataset', ''], ['margin', 'Max regression, quality metrics', 'pts'], ['lat', 'Latency allowance', '%'], ['cost', 'Cost allowance', '%']].map(function (f) {
          return '<label class="num"><span class="nl2">' + f[1] + '</span><span class="inp"><input type="number" inputmode="decimal" min="0" step="any" data-k="' + f[0] + '" value="' + s[f[0]] + '">' + (f[2] ? '<i>' + f[2] + '</i>' : '') + '</span></label>';
        }).join('') + '</div>';
        h += '<div class="tablewrap sci"><table><thead><tr><th>Metric</th><th>Gate</th>' + s.cands.map(function (c, i) {
          return '<th><input class="cname" type="text" aria-label="Candidate ' + (i + 1) + ' name" data-name="' + i + '" value="' + esc(c.name) + '">' + (i === 0 ? '<small>baseline</small>' : '<button type="button" class="rm" data-rm="' + i + '" aria-label="Remove ' + esc(c.name) + '">Remove</button>') + '</th>';
        }).join('') + '</tr></thead><tbody>' + METRICS.map(function (m) {
          return '<tr><th scope="row">' + esc(m.label) + ' <small>' + (m.dir === 'higher' ? 'higher is better' : 'lower is better') + ', ' + esc(m.unit) + '</small></th><td><input type="number" inputmode="decimal" step="any" aria-label="Gate for ' + esc(m.label) + '" data-g="' + m.id + '" value="' + s.gates[m.id] + '"></td>' + s.cands.map(function (c, i) {
            return '<td><input type="number" inputmode="decimal" step="any" aria-label="' + esc(m.label) + ' for ' + esc(c.name) + '" data-c="' + i + '" data-m="' + m.id + '" value="' + (c.v[m.id] === undefined ? '' : c.v[m.id]) + '"></td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
        h += '<div class="btns"><button class="btn" type="button" data-add' + (s.cands.length >= 5 ? ' disabled' : '') + '>Add candidate</button><button class="btn" type="button" data-reset>Reset to example</button></div>';
        inEl.innerHTML = h;
      }
      function paint() {
        var ev = T.scorecard.evaluate(s), nz = noise(num(s.cands[0].v.success), num(s.n));
        var h = '<div class="eyebrow">Verdict</div><div class="verdicts">' + ev.map(function (e, i) {
          return '<div class="vd ' + (e.ship ? 'ok' : 'no') + '"><small>' + (i === 0 ? 'Baseline' : 'Candidate') + '</small><b>' + esc(e.name) + '</b><span class="vtag">' + (e.ship ? (i === 0 ? 'Meets the absolute gates' : 'Meets all gates') : 'Blocked') + '</span><span class="fine">' + e.passed + ' of ' + e.total + ' gates passed</span>' +
            (e.ship ? '' : '<ul>' + e.blocked.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>') + '</div>';
        }).join('') + '</div>';
        h += '<h3>Detail</h3><div class="tablewrap"><table><thead><tr><th>Metric</th><th>Gate</th>' + ev.map(function (e) { return '<th>' + esc(e.name) + '</th>'; }).join('') + '</tr></thead><tbody>' + METRICS.map(function (m) {
          return '<tr><td style="white-space:normal">' + esc(m.label) + '</td><td>' + (m.dir === 'higher' ? '≥ ' : '≤ ') + esc(uv(m, s.gates[m.id])) + '</td>' + ev.map(function (e, i) {
            var c = e.cells[m.id];
            var d = (i > 0 && isFinite(c.delta)) ? ' <span class="fine">(' + (c.delta > 0 ? '+' : '') + (Math.round(c.delta * 1000) / 1000) + (c.noisy ? ', within noise' : '') + ')</span>' : '';
            return '<td class="' + (c.pass ? 'pass' : 'fail') + '">' + (c.pass ? '✓ ' : '✗ ') + (isFinite(c.v) ? esc(uv(m, c.v)) : '—') + d + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
        h += '<p class="fine">' + (isFinite(nz) ? 'At ' + esc(String(s.n)) + ' cases, a success rate near ' + esc(String(s.cands[0].v.success)) + '% has a 95% interval of about ±' + nz.toFixed(1) + ' points, so smaller differences between candidates are not distinguishable from chance. Add cases or repeat runs before acting on them.' : 'Enter the number of cases to see the noise band.') + '</p>';
        h += '<div class="btns"><button class="btn" type="button" data-copy>Copy as markdown</button></div>';
        outEl.innerHTML = h; outEl._md = scMarkdown(s, ev, U);
      }
      inEl.addEventListener('input', function (e) {
        var t = e.target;
        if (t.hasAttribute('data-k')) s[t.getAttribute('data-k')] = t.value === '' ? '' : num(t.value);
        else if (t.hasAttribute('data-g')) s.gates[t.getAttribute('data-g')] = t.value === '' ? '' : num(t.value);
        else if (t.hasAttribute('data-name')) s.cands[+t.getAttribute('data-name')].name = t.value;
        else if (t.hasAttribute('data-c')) s.cands[+t.getAttribute('data-c')].v[t.getAttribute('data-m')] = t.value === '' ? '' : num(t.value);
        paint();
      });
      inEl.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-add') && s.cands.length < 5) { var nv = {}; METRICS.forEach(function (m) { nv[m.id] = ''; }); s.cands.push({ name: 'Candidate ' + String.fromCharCode(64 + s.cands.length), v: nv }); inputs(); paint(); }
        else if (b.hasAttribute('data-rm')) { s.cands.splice(+b.getAttribute('data-rm'), 1); inputs(); paint(); }
        else if (b.hasAttribute('data-reset')) { s = scDefaults(); inputs(); paint(); }
      });
      outEl.addEventListener('click', function (e) { var b = e.target.closest('[data-copy]'); if (b) U.copyText(outEl._md, b); });
      inputs(); paint();
    }
  };

  /* ================= AI FinOps model ================= */
  function foDefaults() {
    return {
      tasks: 20000, success: 88, retry: 6,
      models: [
        { name: 'Coordinator', calls: 2, inTok: 3000, outTok: 400, rsnTok: 0, pIn: 3, pOut: 15 },
        { name: 'Retrieval specialist', calls: 3, inTok: 6000, outTok: 300, rsnTok: 0, pIn: 3, pOut: 15 },
        { name: 'Validator', calls: 1, inTok: 4000, outTok: 200, rsnTok: 500, pIn: 3, pOut: 15 }
      ],
      embTok: 800, pEmb: 0.15, rerankCalls: 3, pRerank: 1, vecQ: 4, pVec: 0.5, toolCalls: 6, pTool: 0.2, compute: 0.002,
      fxIndex: 400, fxMemory: 120, fxObs: 300, fxStorage: 150, fxEnvs: 600, evalCases: 3000, evalJudge: 0.01,
      cmp: {
        singleCalls: 60, singleCtx: 1.5, singleDelta: -3,
        routeShare: 70, routePrice: 20, routeDelta: -1,
        custFixed: 1500, custVec: 0.1,
        cacheHit: 30, cacheFixed: 80,
        parN: 4, parCtx: 2000, parSec: 3, parMerge: 1.5,
        retRow: 1, retK: 5, retChunk: 600
      }
    };
  }
  /* per-run costs and monthly totals. Prices are per 1M tokens, per 1K calls or per task, as labelled in the form. */
  function foCalc(p) {
    var model = 0, inPart = 0, outPart = 0;
    p.models.forEach(function (m) {
      var i = m.calls * m.inTok / 1e6 * m.pIn, o = m.calls * (m.outTok + m.rsnTok) / 1e6 * m.pOut;
      inPart += i; outPart += o;
    });
    model = inPart + outPart;
    var emb = p.embTok / 1e6 * p.pEmb, rerank = p.rerankCalls / 1000 * p.pRerank, vec = p.vecQ / 1000 * p.pVec, tools = p.toolCalls / 1000 * p.pTool, comp = p.compute;
    var run = model + emb + rerank + vec + tools + comp;
    var runs = p.tasks * (1 + p.retry / 100);
    var variable = runs * run;
    var fixed = p.fxIndex + p.fxMemory + p.fxObs + p.fxStorage + p.fxEnvs;
    var evalCost = p.evalCases * (run + p.evalJudge);
    var total = variable + fixed + evalCost;
    var ok = p.tasks * p.success / 100;
    return {
      run: run, runs: runs, variable: variable, fixed: fixed, evalCost: evalCost, total: total,
      perTask: p.tasks ? total / p.tasks : 0, perSuccess: ok ? total / ok : Infinity, ok: ok,
      parts: { inPart: inPart * runs, outPart: outPart * runs, emb: emb * runs, rerank: rerank * runs, vec: vec * runs, tools: tools * runs, comp: comp * runs },
      retryCost: p.tasks * (p.retry / 100) * run, failedCost: p.tasks * (1 - p.success / 100) * run
    };
  }
  function foCompare(p) {
    var base = foCalc(p), c = p.cmp, out = [], q, r;
    function row(group, label, alt, note, extra) { out.push({ group: group, label: label, month: alt.total, perSuccess: alt.perSuccess, d: base.total ? (alt.total - base.total) / base.total * 100 : 0, note: note || '', extra: extra || '' }); }
    var totalCalls = p.models.reduce(function (a, m) { return a + m.calls; }, 0) || 1;
    function wavg(f) { return p.models.reduce(function (a, m) { return a + m.calls * m[f]; }, 0) / totalCalls; }

    /* 1. one agent versus several */
    q = clone(p);
    q.models = [{ name: 'Single agent', calls: totalCalls * c.singleCalls / 100, inTok: wavg('inTok') * c.singleCtx, outTok: wavg('outTok'), rsnTok: wavg('rsnTok'), pIn: wavg('pIn'), pOut: wavg('pOut') }];
    q.success = Math.max(0, Math.min(100, p.success + c.singleDelta));
    row('One agent versus several', 'Current design (' + p.models.length + ' model groups)', base, 'Your inputs');
    row('One agent versus several', 'Single agent', foCalc(q), c.singleCalls + '% of the calls, ' + c.singleCtx + 'x the context per call, success ' + (c.singleDelta >= 0 ? '+' : '') + c.singleDelta + ' points');

    /* 2. routing versus one larger model */
    q = clone(p); q.models = [];
    p.models.forEach(function (m) {
      var big = clone(m); big.calls = m.calls * (1 - c.routeShare / 100); q.models.push(big);
      var sm = clone(m); sm.calls = m.calls * c.routeShare / 100; sm.pIn = m.pIn * c.routePrice / 100; sm.pOut = m.pOut * c.routePrice / 100; sm.name = m.name + ' (small)'; q.models.push(sm);
    });
    q.models.push({ name: 'Router', calls: 1, inTok: 300, outTok: 20, rsnTok: 0, pIn: p.models[0].pIn * c.routePrice / 100, pOut: p.models[0].pOut * c.routePrice / 100 });
    q.success = Math.max(0, Math.min(100, p.success + c.routeDelta));
    row('Routing versus one larger model', 'Everything on the larger model', base, 'Your inputs');
    row('Routing versus one larger model', 'Route ' + c.routeShare + '% of calls to a model at ' + c.routePrice + '% of the price', foCalc(q), 'Adds a router call (300 in, 20 out); success ' + (c.routeDelta >= 0 ? '+' : '') + c.routeDelta + ' points');

    /* 3. managed versus custom retrieval */
    q = clone(p); q.pVec = c.custVec; q.fxIndex = c.custFixed;
    var queries = p.tasks * (1 + p.retry / 100) * p.vecQ, dPer = (p.pVec - c.custVec) / 1000, be = dPer > 0 ? Math.max(0, (c.custFixed - p.fxIndex) / dPer) : Infinity;
    row('Managed versus custom retrieval', 'Managed (your index and query prices)', base, 'Your inputs');
    row('Managed versus custom retrieval', 'Custom retrieval tier', foCalc(q), '$' + c.custFixed + ' a month fixed, $' + c.custVec + ' per 1K queries', isFinite(be) ? 'Break-even at about ' + Math.round(be).toLocaleString('en-US') + ' queries a month; you run ' + Math.round(queries).toLocaleString('en-US') + '.' : 'Custom is not cheaper per query, so there is no break-even.');

    /* 4. caching versus repeated retrieval */
    var h = c.cacheHit / 100;
    q = clone(p); q.embTok = p.embTok * (1 - h); q.rerankCalls = p.rerankCalls * (1 - h); q.vecQ = p.vecQ * (1 - h); q.fxObs = p.fxObs + c.cacheFixed;
    var retr = foCalc(q);
    var fc = clone(base); fc.variable = base.variable * (1 - h); fc.total = fc.variable + base.fixed + c.cacheFixed + base.evalCost; fc.perSuccess = base.ok ? fc.total / base.ok : Infinity;
    row('Caching versus repeated retrieval', 'No cache', base, 'Your inputs');
    row('Caching versus repeated retrieval', 'Retrieval cache (' + c.cacheHit + '% hits)', retr, 'Saves embeddings, reranking and vector queries on a hit; the model still runs');
    row('Caching versus repeated retrieval', 'Answer cache (' + c.cacheHit + '% hits)', fc, 'A hit skips the whole run. Check that cached answers stay correct and permitted for that user');

    /* 5. parallel versus sequential */
    var extra = (c.parN - 1) * c.parCtx / 1e6 * p.models[0].pIn * (p.tasks * (1 + p.retry / 100));
    var par = clone(base); par.total = base.total + extra; par.perSuccess = base.ok ? par.total / base.ok : Infinity;
    var seqS = c.parN * c.parSec, parS = c.parSec + c.parMerge;
    row('Parallel versus sequential', 'Sequential (' + c.parN + ' steps, ' + c.parSec + ' s each)', base, 'Latency about ' + seqS.toFixed(1) + ' s');
    row('Parallel versus sequential', 'Parallel fan-out of ' + c.parN, par, 'Latency about ' + parS.toFixed(1) + ' s (' + Math.round((1 - parS / seqS) * 100) + '% faster). Each extra branch is sent the ' + c.parCtx + '-token shared context', extra ? '+$' + extra.toFixed(2) + ' per month in repeated context' : '');

    /* 6. chunk size and retrieval depth */
    var ri = Math.min(Math.max(0, c.retRow), p.models.length - 1), curCtx = c.retK * c.retChunk, grid = [];
    [3, 5, 8, 12].forEach(function (k) {
      var cells = [300, 600, 1200].map(function (ch) {
        var z = clone(p); z.models[ri].inTok = Math.max(0, p.models[ri].inTok - curCtx + k * ch);
        var r2 = foCalc(z); return { k: k, chunk: ch, total: r2.total, perSuccess: r2.perSuccess, d: base.total ? (r2.total - base.total) / base.total * 100 : 0, cur: k === c.retK && ch === c.retChunk };
      });
      grid.push(cells);
    });
    return { base: base, rows: out, grid: grid, retModel: p.models[ri] ? p.models[ri].name : '', curCtx: curCtx };
  }
  function foMarkdown(p, U) {
    var b = foCalc(p), m = U.money;
    var L = ['# AI cost model', '', '**Cost per successful task: ' + m(b.perSuccess) + '**', '', '| Measure | Value |', '|---|---|',
      '| Tasks per month | ' + p.tasks.toLocaleString('en-US') + ' |', '| Success rate | ' + p.success + '% |', '| Cost per task | ' + m(b.perTask) + ' |', '| Cost per successful task | ' + m(b.perSuccess) + ' |', '| Monthly total | ' + m(b.total) + ' |',
      '| of which retries | ' + m(b.retryCost) + ' |', '| of which failed tasks | ' + m(b.failedCost) + ' |', '', '## Components (monthly)', '', '| Component | Monthly |', '|---|---|',
      '| Model input tokens | ' + m(b.parts.inPart) + ' |', '| Model output and reasoning tokens | ' + m(b.parts.outPart) + ' |', '| Embeddings | ' + m(b.parts.emb) + ' |', '| Reranking | ' + m(b.parts.rerank) + ' |', '| Vector queries | ' + m(b.parts.vec) + ' |', '| Tool and API calls | ' + m(b.parts.tools) + ' |', '| Runtime compute | ' + m(b.parts.comp) + ' |',
      '| Fixed (index, memory, observability, storage, environments) | ' + m(b.fixed) + ' |', '| Evaluation runs | ' + m(b.evalCost) + ' |', '',
      '## Comparisons', '', '| Option | Monthly | Per successful task | Change |', '|---|---|---|---|'];
    foCompare(p).rows.forEach(function (r) { L.push('| ' + r.label + ' | ' + m(r.month) + ' | ' + m(r.perSuccess) + ' | ' + (Math.abs(r.d) < 0.05 ? '—' : (r.d > 0 ? '+' : '') + r.d.toFixed(1) + '%') + ' |'); });
    L.push('', 'Prices are placeholders. Replace them with current prices from the Google Cloud pricing pages and your own measured token counts. Generated by the Google Cloud AI Atlas.');
    return L.join('\n');
  }
  T.finops = {
    title: 'AI FinOps model', defaults: foDefaults, calc: foCalc, compare: foCompare, markdown: foMarkdown,
    render: function (U) {
      return '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/d">Decisions</a> / Tool</div><h1>AI FinOps model</h1>' +
        '<p class="lede">A component-by-component cost model for an agent or RAG system, led by the number that matters: <b>cost per successful business task</b>.</p>' +
        '<div class="callout"><b>About the numbers</b>Every price below is a <strong>placeholder</strong> so the arithmetic works. Replace them with current prices from the Google Cloud pricing pages ([[billing|Billing and FinOps]]) and your own measured token counts from traces. Nothing is sent anywhere: the model runs in your browser. The simpler single-call version is the <a href="#/d/calculator">cost per task calculator</a>.</div>'.replace('[[billing|Billing and FinOps]]', '<a href="#/s/billing">Billing and FinOps</a>') +
        '<div class="fo"><div id="foKpi" class="kpis fokpi" aria-live="polite"></div><div id="foIn"></div><div id="foOut"></div></div>';
    },
    mount: function (U) {
      var p = foDefaults(), kpiEl = U.$('#foKpi'), inEl = U.$('#foIn'), outEl = U.$('#foOut'), esc = U.esc, money = U.money;
      function fld(path, label, unit, hint, step) {
        return '<label class="num"><span class="nl2">' + label + '</span><span class="inp">' + (unit === '$' ? '<i>$</i>' : '') + '<input type="number" inputmode="decimal" min="0" step="' + (step || 'any') + '" data-p="' + path + '">' + (unit && unit !== '$' ? '<i>' + unit + '</i>' : '') + '</span>' + (hint ? '<small>' + hint + '</small>' : '') + '</label>';
      }
      function modelRows() {
        return '<div class="tablewrap fom"><table><thead><tr><th>Model call group</th><th>Calls per task</th><th>Input tokens</th><th>Output tokens</th><th>Reasoning tokens</th><th>$ in / 1M</th><th>$ out / 1M</th><th></th></tr></thead><tbody>' + p.models.map(function (m, i) {
          return '<tr><td><input type="text" aria-label="Name of group ' + (i + 1) + '" data-r="' + i + '" data-f="name" value="' + esc(m.name) + '"></td>' + ['calls', 'inTok', 'outTok', 'rsnTok', 'pIn', 'pOut'].map(function (f) {
            return '<td><input type="number" inputmode="decimal" min="0" step="any" aria-label="' + esc(f) + ' for ' + esc(m.name) + '" data-r="' + i + '" data-f="' + f + '" value="' + m[f] + '"></td>';
          }).join('') + '<td>' + (p.models.length > 1 ? '<button type="button" class="rm" data-rmrow="' + i + '" aria-label="Remove ' + esc(m.name) + '">Remove</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div><div class="btns"><button type="button" class="btn" data-addrow' + (p.models.length >= 8 ? ' disabled' : '') + '>Add model call group</button></div>';
      }
      function build() {
        var h = '<h2>1. Volume and outcome</h2><div class="fogrid">' + fld('tasks', 'Tasks per month', '', 'A task is one user request that your system completes.') + fld('success', 'Tasks completed successfully', '%', 'Measure with evals and user outcomes. Failures still cost money.') + fld('retry', 'Tasks re-run once', '%', 'Retries repeat the whole run.') + '</div>';
        h += '<h2>2. Every model call, across every agent</h2><p class="fine">One row per agent or step type. Reasoning tokens bill as output. The Coordinator, specialists and validators of a multi-agent system each get a row.</p><div id="foRows">' + modelRows() + '</div>';
        h += '<h2>3. Retrieval, tools and compute (per task)</h2><div class="fogrid">' +
          fld('embTok', 'Embedding tokens', '', 'Query embedding and any live embedding work.') + fld('pEmb', 'Embedding price per 1M tokens', '$', '') +
          fld('rerankCalls', 'Reranking calls', '', '') + fld('pRerank', 'Reranking price per 1K calls', '$', '') +
          fld('vecQ', 'Vector or search queries', '', 'Include retries inside the loop.') + fld('pVec', 'Query price per 1K', '$', '') +
          fld('toolCalls', 'Tool and API calls', '', '') + fld('pTool', 'Tool price per 1K calls', '$', 'Your own APIs and gateway.') +
          fld('compute', 'Runtime compute per task', '$', 'Agent runtime, containers and orchestration, from billing export.') + '</div>';
        h += '<h2>4. Fixed monthly costs</h2><div class="fogrid">' +
          fld('fxIndex', 'Vector index and search capacity', '$', 'Index nodes, storage, embedding refresh.') + fld('fxMemory', 'Memory and session storage', '$', '') +
          fld('fxObs', 'Logging, tracing and monitoring', '$', '') + fld('fxStorage', 'Storage and network egress', '$', '') +
          fld('fxEnvs', 'Dev, test and evaluation environments', '$', 'Often forgotten and often large.') + fld('evalCases', 'Evaluation cases run per month', '', 'Each costs a full run plus a judge call.') +
          fld('evalJudge', 'Judge and scoring cost per case', '$', '') + '</div>';
        h += '<h2>5. Comparisons</h2><p class="fine">Each comparison changes one thing from your inputs above and recalculates the whole model. The assumptions are yours to edit. Quality effects are shown only where you enter a success change.</p><div class="fogrid cmpgrid">' +
          fld('cmp.singleCalls', 'Single agent: calls as a share of multi-agent calls', '%', '') + fld('cmp.singleCtx', 'Single agent: context multiplier per call', 'x', '') + fld('cmp.singleDelta', 'Single agent: success change', 'pts', '') +
          fld('cmp.routeShare', 'Routing: share of calls to the small model', '%', '') + fld('cmp.routePrice', 'Routing: small model price as a share of large', '%', '') + fld('cmp.routeDelta', 'Routing: success change', 'pts', '') +
          fld('cmp.custFixed', 'Custom retrieval: fixed monthly cost', '$', 'Nodes plus the engineering time you assign to it.') + fld('cmp.custVec', 'Custom retrieval: price per 1K queries', '$', '') +
          fld('cmp.cacheHit', 'Cache hit rate', '%', '') + fld('cmp.cacheFixed', 'Cache: fixed monthly cost', '$', '') +
          fld('cmp.parN', 'Parallel: branches', '', '') + fld('cmp.parCtx', 'Parallel: shared context tokens per branch', '', '') + fld('cmp.parSec', 'Seconds per branch', 's', '') + fld('cmp.parMerge', 'Seconds to merge', 's', '') +
          fld('cmp.retRow', 'Retrieval context goes to model group (row, from 0)', '', '') + fld('cmp.retK', 'Retrieval depth now (k)', '', '') + fld('cmp.retChunk', 'Chunk size now (tokens)', '', '') + '</div>';
        inEl.innerHTML = h; fill();
      }
      function get(path) { var parts = path.split('.'); return parts.length === 2 ? p[parts[0]][parts[1]] : p[path]; }
      function set(path, v) { var parts = path.split('.'); if (parts.length === 2) p[parts[0]][parts[1]] = v; else p[path] = v; }
      function fill() { U.$$('input[data-p]', inEl).forEach(function (el) { el.value = get(el.getAttribute('data-p')); }); }
      function clamp() {
        ['success', 'retry'].forEach(function (k) { p[k] = Math.max(0, Math.min(100, p[k])); });
        ['cmp.cacheHit', 'cmp.singleCalls', 'cmp.routeShare', 'cmp.routePrice'].forEach(function (k) { set(k, Math.max(0, Math.min(k === 'cmp.singleCalls' ? 1000 : 100, get(k)))); });
        p.cmp.parN = Math.max(1, Math.round(p.cmp.parN)); p.cmp.retRow = Math.max(0, Math.round(p.cmp.retRow));
      }
      function paint() {
        clamp();
        var b = foCalc(p), cm = foCompare(p), tot = b.total || 1;
        kpiEl.innerHTML = '<div class="kpi hero"><small>Cost per successful task</small><b>' + money(b.perSuccess) + '</b></div><div class="kpi"><small>Cost per task</small><b>' + money(b.perTask) + '</b></div><div class="kpi"><small>Monthly total</small><b>' + money(b.total) + '</b></div><div class="kpi"><small>Retries + failed tasks</small><b>' + money(b.retryCost + b.failedCost) + '</b></div>';
        var comps = [['Model input tokens', b.parts.inPart], ['Model output and reasoning tokens', b.parts.outPart], ['Embeddings', b.parts.emb], ['Reranking', b.parts.rerank], ['Vector queries', b.parts.vec], ['Tool and API calls', b.parts.tools], ['Runtime compute', b.parts.comp], ['Fixed costs (index, memory, observability, storage, environments)', b.fixed], ['Evaluation runs', b.evalCost]];
        var h = '<h2>Where the money goes</h2><div class="tablewrap calcout fob"><table><thead><tr><th>Component</th><th>Monthly</th><th>Share</th></tr></thead><tbody>' + comps.map(function (c) {
          return '<tr><td style="white-space:normal">' + esc(c[0]) + '</td><td>' + money(c[1]) + '</td><td>' + (c[1] / tot * 100).toFixed(1) + '%</td></tr>';
        }).join('') + '<tr><td><b>Total</b></td><td><b>' + money(b.total) + '</b></td><td>100%</td></tr></tbody></table></div>';
        h += '<p class="fine">Variable components include retries. Of the variable spend, ' + money(b.retryCost) + ' is retries and ' + money(b.failedCost) + ' is tasks that failed; the two can overlap.</p>';
        var group = '';
        h += '<h2>Comparisons</h2><div class="tablewrap calcout fob"><table><thead><tr><th>Option</th><th>Monthly</th><th>Per successful task</th><th>Change</th></tr></thead><tbody>';
        cm.rows.forEach(function (r) {
          if (r.group !== group) { group = r.group; h += '<tr class="grp"><th colspan="4">' + esc(group) + '</th></tr>'; }
          h += '<tr><td style="white-space:normal">' + esc(r.label) + (r.note ? '<br><span class="fine">' + esc(r.note) + '</span>' : '') + (r.extra ? '<br><span class="fine">' + esc(r.extra) + '</span>' : '') + '</td><td>' + money(r.month) + '</td><td>' + money(r.perSuccess) + '</td><td class="' + (r.d < -0.05 ? 'dn' : (r.d > 0.05 ? 'up' : '')) + '">' + (Math.abs(r.d) < 0.05 ? '—' : (r.d > 0 ? '+' : '') + r.d.toFixed(1) + '%') + '</td></tr>';
        });
        h += '</tbody></table></div>';
        h += '<h3>Chunk size and retrieval depth</h3><p class="fine">Monthly total when retrieval context for <b>' + esc(cm.retModel) + '</b> changes from ' + cm.curCtx + ' tokens (k × chunk now). Recall and answer quality are <strong>not</strong> modelled: pair every cell you are tempted by with a retrieval evaluation ([[p:data-lifecycle|data lifecycle]]).</p>'.replace('[[p:data-lifecycle|data lifecycle]]', '<a href="#/p/data-lifecycle">data lifecycle</a>');
        h += '<div class="tablewrap calcout fob"><table><thead><tr><th>Retrieval depth k</th><th>300-token chunks</th><th>600-token chunks</th><th>1200-token chunks</th></tr></thead><tbody>' + cm.grid.map(function (cells) {
          return '<tr><td>k = ' + cells[0].k + '</td>' + cells.map(function (c) { return '<td class="' + (c.cur ? 'cur' : '') + '">' + money(c.total) + ' <span class="fine">(' + (Math.abs(c.d) < 0.05 ? '—' : (c.d > 0 ? '+' : '') + c.d.toFixed(1) + '%') + ')</span></td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
        h += '<div class="btns"><button class="btn" type="button" data-copy>Copy as markdown</button><button class="btn" type="button" data-reset>Reset to example</button></div>';
        outEl.innerHTML = h; outEl._md = foMarkdown(p, U);
      }
      inEl.addEventListener('input', function (e) {
        var t = e.target;
        if (t.hasAttribute('data-p')) set(t.getAttribute('data-p'), num(t.value) || 0);
        else if (t.hasAttribute('data-r')) { var m = p.models[+t.getAttribute('data-r')], f = t.getAttribute('data-f'); m[f] = f === 'name' ? t.value : (num(t.value) || 0); }
        paint();
      });
      inEl.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-addrow') && p.models.length < 8) { p.models.push({ name: 'Model group ' + (p.models.length + 1), calls: 1, inTok: 2000, outTok: 300, rsnTok: 0, pIn: 3, pOut: 15 }); U.$('#foRows').innerHTML = modelRows(); paint(); }
        else if (b.hasAttribute('data-rmrow')) { p.models.splice(+b.getAttribute('data-rmrow'), 1); U.$('#foRows').innerHTML = modelRows(); paint(); }
      });
      outEl.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-copy')) U.copyText(outEl._md, b);
        else if (b.hasAttribute('data-reset')) { p = foDefaults(); build(); paint(); }
      });
      build(); paint();
    }
  };
})();
