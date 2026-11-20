/* Google Cloud for AI systems — atlas app. Plain JS, no build step, hash-routed. */
(function () {
  'use strict';
  var A = window.ATLAS;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  var byId = {}, catById = {}, archById = {};
  A.services.forEach(function (s) { byId[s.id] = s; });
  A.categories.forEach(function (c) { catById[c.id] = c; c.items = A.services.filter(function (s) { return s.cat === c.id; }); });
  A.architectures.forEach(function (a) { archById[a.id] = a; });

  /* ---------- text helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, function (m, id, label) {
        var sv = byId[id];
        if (!sv) return label || id;
        return '<a href="#/s/' + id + '">' + (label || sv.name) + '</a>';
      });
  }
  function paras(s) { return String(s).split(/\n\n+/).map(function (p) { return '<p>' + fmt(p) + '</p>'; }).join(''); }
  function ul(items) { if (!Array.isArray(items)) items = String(items == null ? '' : items).split(/\n+/).filter(Boolean); return '<ul>' + items.map(function (i) { return '<li>' + fmt(i) + '</li>'; }).join('') + '</ul>'; }
  /* ---- metadata, verification and cross-link helpers ---- */
  var meta = A.meta || {}, AL = window.AtlasLogic || {};
  var REPO = 'https://github.com/sadiqgpasha89/gcp-ai-atlas';
  function issueLink(title) { return REPO + '/issues/new?title=' + encodeURIComponent(title); }
  var LIFE = { ga: 'Generally available', preview: 'Preview', deprecated: 'Deprecated', retired: 'Retired', unknown: 'Lifecycle not verified' };
  function verState(id) { var m = meta[id]; return !m ? 'none' : (m.verification === 'verified' ? 'verified' : (m.verification === 'not-applicable' ? 'na' : 'unverified')); }
  function verBadge(id) {
    var m = meta[id], st = verState(id);
    if (st === 'verified') return '<span class="vbadge ok" title="Checked against official documentation on ' + esc(m.verified) + '">Verified ' + esc(m.verified) + '</span>';
    if (st === 'na') return '<span class="vbadge na">Verification not applicable</span>';
    return '<span class="vbadge unk" title="Not yet checked against official documentation by the Atlas maintainers">Not yet verified</span>';
  }
  function hueOf(catId) { return catById[catId] ? catById[catId].hue : 215; }

  /* ---------- isometric drawing ---------- */
  function miniCube(h) {
    return '<svg class="iso" viewBox="-30 -16 60 56" style="--h:' + h + '" aria-hidden="true"><g class="node">' +
      '<path class="face f-left" d="M-26 0L0 13V35L-26 22Z"/><path class="face f-right" d="M0 13L26 0V22L0 35Z"/><path class="face f-top" d="M0-13L26 0L0 13L-26 0Z"/></g></svg>';
  }
  function slab(cx, cy, w, d, label, sub, h, lx) {
    var hh = w / 2;
    return '<g style="--h:' + h + '" class="node" tabindex="-1">' +
      '<path class="face f-left" d="M' + (cx - w) + ' ' + cy + 'L' + cx + ' ' + (cy + hh) + 'V' + (cy + hh + d) + 'L' + (cx - w) + ' ' + (cy + d) + 'Z"/>' +
      '<path class="face f-right" d="M' + cx + ' ' + (cy + hh) + 'L' + (cx + w) + ' ' + cy + 'V' + (cy + d) + 'L' + cx + ' ' + (cy + hh + d) + 'Z"/>' +
      '<path class="face f-top" d="M' + cx + ' ' + (cy - hh) + 'L' + (cx + w) + ' ' + cy + 'L' + cx + ' ' + (cy + hh) + 'L' + (cx - w) + ' ' + cy + 'Z"/>' +
      '<path d="M' + (cx + w * 0.55) + ' ' + (cy - 2) + 'L' + (lx - 8) + ' ' + (cy - 2) + '" stroke="var(--line2)" stroke-dasharray="3 4" fill="none"/>' +
      '<text x="' + lx + '" y="' + (cy + 2) + '" style="text-anchor:start;font-size:16px;font-family:var(--serif)">' + label + '</text>' +
      '<text x="' + lx + '" y="' + (cy + 20) + '" style="text-anchor:start;font-size:11px;font-weight:400;fill:var(--muted)">' + sub + '</text></g>';
  }
  function heroSVG() {
    var layers = [
      { l: 'Foundation', s: 'GCE · TPU · Cloud Storage · Hyperdisk', h: 18, w: 140 },
      { l: 'Data', s: 'BigQuery · Dataflow · Pub/Sub · Vector Search', h: 175, w: 120 },
      { l: 'Models', s: 'Gemini · Vertex AI Studio · Model Garden', h: 265, w: 100 },
      { l: 'Apps & agents', s: 'Cloud Run · Vertex AI Agent Builder · ADK', h: 305, w: 80 }
    ];
    var out = '<svg viewBox="0 0 560 420" role="img" aria-label="Isometric stack: foundation, data, models, apps and agents">';
    layers.forEach(function (L, i) { out += slab(150, 320 - i * 80, L.w, 24, L.l, L.s, L.h, 318); });
    return out + '</svg>';
  }

  /* ---------- stepper ---------- */
  function mountStepper(host, spec) {
    var flow = spec.flow.map(function (f) { return typeof f === 'string' ? { l: f } : f; });
    var steps = spec.steps.map(function (s) { return { n: s[0], t: s[1] }; });
    var cur = 0, timer = null, narrow = null, W = 0, pts = [];

    host.innerHTML =
      '<div class="stage"></div>' +
      '<div class="ctrl"><button data-a="prev">← Prev</button><button data-a="play">▶ Play</button><button data-a="next">Next →</button><span class="count" aria-live="polite"></span></div>' +
      '<ol class="steps">' + steps.map(function (s, i) { return '<li data-i="' + i + '" tabindex="0">' + '<span>' + fmt(s.t) + '</span></li>'; }).join('') + '</ol>';
    var stage = $('.stage', host);

    function wrap(label, max) {
      var words = label.split(' '), lines = [''], k = 0;
      words.forEach(function (w) {
        if ((lines[k] + ' ' + w).trim().length > max && lines[k]) { lines.push(w); k++; } else lines[k] = (lines[k] + ' ' + w).trim();
      });
      return lines;
    }
    function compute() {
      var n = flow.length; pts = [];
      if (!narrow) {
        W = 760; var pad = 84, dy = n > 1 ? Math.min(30, 150 / (n - 1)) : 0;
        for (var i = 0; i < n; i++) pts.push({ x: n === 1 ? W / 2 : pad + i * (W - 2 * pad) / (n - 1), y: 54 + i * dy });
        return W + ' ' + (pts[n - 1].y + 118);
      }
      W = 360;
      for (var j = 0; j < n; j++) pts.push({ x: j % 2 ? 250 : 110, y: 50 + j * 86 });
      return W + ' ' + (pts[n - 1].y + 68);
    }
    function draw() {
      var wh = compute().split(' ');
      var svg = '<svg viewBox="0 0 ' + wh[0] + ' ' + wh[1] + '" role="img" aria-label="Flow diagram">';
      for (var i = 0; i < pts.length - 1; i++) svg += '<path class="edge" d="M' + pts[i].x + ' ' + (pts[i].y + 12) + 'L' + pts[i + 1].x + ' ' + (pts[i + 1].y + 12) + '"/>';
      flow.forEach(function (f, i) {
        var p = pts[i], hue = f.s && byId[f.s] ? hueOf(byId[f.s].cat) : (spec.hue || 215);
        var lines = wrap(f.l, narrow ? 24 : 15), t = '';
        lines.forEach(function (ln, k) {
          if (!narrow) t += '<text x="0" y="' + (54 + k * 14) + '">' + esc(ln) + '</text>';
          else t += '<text x="' + (i % 2 ? -42 : 42) + '" y="' + (12 + k * 14 - (lines.length - 1) * 7) + '" style="text-anchor:' + (i % 2 ? 'end' : 'start') + '">' + esc(ln) + '</text>';
        });
        var body = '<g class="node" data-i="' + i + '" style="--h:' + hue + '"><path class="face f-left" d="M-26 0L0 13V35L-26 22Z"/><path class="face f-right" d="M0 13L26 0V22L0 35Z"/><path class="face f-top" d="M0-13L26 0L0 13L-26 0Z"/>' + t + '</g>';
        svg += '<g transform="translate(' + p.x + ' ' + p.y + ')">' + (f.s && byId[f.s] ? '<a href="#/s/' + f.s + '" aria-label="' + esc(byId[f.s].name) + '">' + body + '</a>' : body) + '</g>';
      });
      svg += '<g class="packet"><circle class="ring" r="7"/><circle r="7"/></g></svg>';
      stage.innerHTML = svg;
      place(false);
    }
    function place() {
      var s = steps[cur], p = pts[s.n] || pts[0], visited = {};
      for (var i = 0; i <= cur; i++) visited[steps[i].n] = 1;
      $$('.node[data-i]', stage).forEach(function (g) {
        var i = +g.getAttribute('data-i');
        g.classList.toggle('on', i === s.n);
        g.classList.toggle('dim', !visited[i]);
      });
      var pk = $('.packet', stage);
      pk.style.transform = 'translate(' + p.x + 'px,' + (p.y + 12) + 'px)';
      $$('ol.steps li', host).forEach(function (li, i) {
        li.classList.toggle('on', i === cur);
        li.classList.toggle('done', i < cur);
        if (i === cur) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
      $('.count', host).textContent = 'Step ' + (cur + 1) + ' / ' + steps.length;
      $('[data-a=prev]', host).disabled = cur === 0;
      $('[data-a=next]', host).disabled = cur === steps.length - 1;
    }
    function go(i) { cur = Math.max(0, Math.min(steps.length - 1, i)); place(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; $('[data-a=play]', host).textContent = '▶ Play'; } }
    function play() {
      if (timer) return stop();
      if (cur === steps.length - 1) go(0);
      $('[data-a=play]', host).textContent = '❚❚ Pause';
      timer = setInterval(function () { if (cur >= steps.length - 1) stop(); else go(cur + 1); }, 2600);
    }
    host.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-a]'), li = e.target.closest('ol.steps li');
      if (b) { var a = b.getAttribute('data-a'); if (a === 'play') play(); else { stop(); go(cur + (a === 'next' ? 1 : -1)); } }
      else if (li && !e.target.closest('a')) { stop(); go(+li.getAttribute('data-i')); }
    });
    host.addEventListener('keydown', function (e) {
      if (e.target.closest('a')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); stop(); go(cur + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); stop(); go(cur - 1); }
      else if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('ol.steps li')) { e.preventDefault(); stop(); go(+e.target.getAttribute('data-i')); }
    });
    function measure() { var nw = stage.clientWidth < 560; if (nw !== narrow) { narrow = nw; draw(); } }
    measure();
    if (window.ResizeObserver) new ResizeObserver(measure).observe(stage); else window.addEventListener('resize', measure);
    host._stop = stop;
    go(0);
  }

  var pendingSteppers = [];
  function stepperHost(spec) { pendingSteppers.push(spec); return '<div class="stepper" data-sp="' + (pendingSteppers.length - 1) + '"></div>'; }

  /* ---------- pages ---------- */
  function pageHome() {
    var n = A.services.length;
    var h = '<div class="wide"><section class="hero"><div>' +
      '<div class="eyebrow">The AI Engineering Management Operating System · ' + n + ' services · ' + A.architectures.length + ' architectures · ' + A.decisions.length + ' decisions · ' + A.engineeringPlaybooks.length + ' playbooks · 9 tools</div>' +
      '<h1>Google Cloud for AI Systems — an interactive operating system.</h1>' +
      '<p class="lede">From cloud catalog to production AI engineering operating system: design, evaluate, architect, govern, and lead production-grade generative AI, RAG, and multi-agent systems on Google Cloud.</p>' +
      '<div class="btns">' +
        '<a class="btn primary" href="#/tools">Engineering Tools (9) →</a>' +
        '<a class="btn" href="#/a">Architectures (' + A.architectures.length + ')</a>' +
        '<a class="btn" href="#/p">Playbooks (' + A.engineeringPlaybooks.length + ')</a>' +
        '<a class="btn" href="#/d">Decision Centre (' + A.decisions.length + ')</a>' +
        '<a class="btn" href="#/toolkit">Manager Toolkit</a>' +
        '<a class="btn" href="#/labs">Labs & Projects (' + A.labs.exercises.length + ')</a>' +
      '</div>' +
      '</div>' + heroSVG() + '</section>';

    h += '<h2>The 6 Levels of Enterprise AI Engineering Maturity</h2>' +
      '<p style="max-width:72ch">A complete operational maturity framework for AI Engineering Managers and Principal Architects leading enterprise AI on Google Cloud.</p>' +
      '<div class="grid">' +
      '<a class="card" style="--h:212" href="#/c/genai"><div class="mini">Level 1</div><h3>1. Service Encyclopedia</h3><p>73 Google Cloud AI, data, and compute services with architecture fit, operational gotchas, and pairing notes.</p></a>' +
      '<a class="card" style="--h:305" href="#/labs"><div class="mini">Level 2</div><h3>2. Learning Atlas</h3><p>12 complete production labs, 16-week progressive roadmap, and 3-tier competency benchmark.</p></a>' +
      '<a class="card" style="--h:268" href="#/a"><div class="mini">Level 3</div><h3>3. Architecture Intelligence</h3><p>42 reference architectures with standardized 12-section blueprints and 23 architectural decision guides.</p></a>' +
      '<a class="card" style="--h:150" href="#/p"><div class="mini">Level 4</div><h3>4. Production Engineering</h3><p>11 deep playbooks: RAG lifecycle, multi-agent patterns, GenAIOps release gates, OpenTelemetry, and FinOps.</p></a>' +
      '<a class="card" style="--h:25" href="#/gov"><div class="mini">Level 5</div><h3>5. Engineering Leadership</h3><p>Resource Manager hierarchy, 8-pillar security framework, RACI matrices, RAID trackers, and risk analysis.</p></a>' +
      '<a class="card" style="--h:40" href="#/tools"><div class="mini">Level 6</div><h3>6. AI Delivery Cockpit</h3><p>9 interactive decision tools, 8 copyable production templates, and daily engineering manager checklists.</p></a>' +
      '</div>';

    h += '<h2>Interactive Engineering Tools (9)</h2>' +
      '<p style="max-width:72ch">Decision calculators, architecture wizards, and governance instruments built for day-to-day technical leadership.</p>' +
      '<div class="grid">' +
      '<a class="card" style="--h:215" href="#/tools/compare"><div class="mini">Interactive</div><h3>Service Comparison Engine</h3><p>Side-by-side technical trade-off matrices for Vector, Agent Runtimes, Models, and Orchestration.</p></a>' +
      '<a class="card" style="--h:268" href="#/tools/rag-assistant"><div class="mini">Wizard</div><h3>RAG Design Assistant</h3><p>5-step interactive sizing & pattern wizard recommending optimal retrieval architectures.</p></a>' +
      '<a class="card" style="--h:150" href="#/tools/agent-assistant"><div class="mini">Wizard</div><h3>Agent Design Assistant</h3><p>4-step autonomy, tools & orchestration wizard recommending deterministic vs swarm patterns.</p></a>' +
      '<a class="card" style="--h:25" href="#/tools/risk-analyzer"><div class="mini">Governance</div><h3>Architecture Risk Analyzer</h3><p>STRIDE + AI threat risk calculator evaluating system exposure and generating mitigation plans.</p></a>' +
      '<a class="card" style="--h:185" href="#/tools/readiness-scorecard"><div class="mini">Launch Gate</div><h3>Production Readiness Scorecard</h3><p>Interactive 30-point evaluation across Architecture, Data, Eval, Security, Ops, and FinOps.</p></a>' +
      '<a class="card" style="--h:40" href="#/tools/review-gen"><div class="mini">Generator</div><h3>Architecture Review Generator</h3><p>Form-driven generator producing formatted markdown ADR / PRR ready for PRs and design reviews.</p></a>' +
      '<a class="card" style="--h:215" href="#/d/shaper"><div class="mini">Interactive</div><h3>Solution Shaper</h3><p>Seven questions in, a starting stack and the decisions to make next out.</p></a>' +
      '<a class="card" style="--h:185" href="#/d/calculator"><div class="mini">Calculator</div><h3>Cost per Task Calculator</h3><p>Unit economics calculator with token pricing, context caching, and retry multipliers.</p></a>' +
      '<a class="card" style="--h:150" href="#/d/checklists"><div class="mini">Checklists</div><h3>Readiness Checklists</h3><p>Maturity ladder and production checklists from prototype to enterprise scale.</p></a>' +
      '</div>';

    h += '<h2>Reference Architectures (' + A.architectures.length + ')</h2>' +
      '<p style="max-width:72ch">Production blueprints across 5 categories: Foundation ML, Generative AI, RAG, Multi-Agent Systems, and Enterprise MLOps.</p>' +
      '<div class="grid">' +
      A.architectures.slice(0, 8).map(function (a) {
        return '<a class="card" style="--h:215" href="#/a/' + a.id + '"><div class="mini">Architecture</div><h3>' + esc(a.name) + '</h3><p>' + esc(a.short) + '</p></a>';
      }).join('') +
      '</div>' +
      '<div style="margin:16px 0 32px"><a class="btn" href="#/a">View all ' + A.architectures.length + ' Reference Architectures →</a></div>';

    h += '<h2>AI Engineering Playbooks (' + A.engineeringPlaybooks.length + ')</h2>' +
      '<p style="max-width:72ch">Deep architectural and operational playbooks covering RAG lifecycle, multi-agent systems, GenAIOps, FinOps, SRE, and security.</p>' +
      '<div class="grid">' +
      A.engineeringPlaybooks.map(function (p) {
        return '<a class="card" style="--h:215" href="#/p/' + p.id + '"><div class="mini">' + esc(p.badge) + '</div><h3>' + esc(p.title) + '</h3><p>' + esc(p.tag) + '</p></a>';
      }).join('') +
      '</div>';

    h += '<h2>Service Catalogue by Category (' + A.services.length + ')</h2>' +
      '<p style="max-width:62ch">Services are grouped by their specific role in an AI/ML system: compute, data, models, orchestration, and security.</p><div class="grid">';
    A.categories.forEach(function (c) {
      h += '<a class="card catcard" style="--h:' + c.hue + '" href="#/c/' + c.id + '">' + miniCube(c.hue) + '<div class="mini">' + c.items.length + ' services</div><h3>' + esc(c.name) + '</h3><p>' + esc(c.short) + '</p></a>';
    });
    h += '</div></div>';
    return h;
  }

  function serviceCard(s) {
    return '<a class="card" data-ver="' + verState(s.id) + '" style="--h:' + hueOf(s.cat) + '" href="#/s/' + s.id + '">' + miniCube(hueOf(s.cat)) + '<h3>' + esc(s.name) + '</h3><p>' + esc(s.tag) + '</p>' + verBadge(s.id) + '</a>';
  }

  function pageCategory(id) {
    var c = catById[id]; if (!c) return notFound();
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Category</div><h1>' + esc(c.name) + '</h1><p class="lede">' + esc(c.short) + '</p>';
    h += paras(c.intro);
    h += '<div class="callout"><b>Design lens</b>' + fmt(c.lens) + '</div>';
    var nv = c.items.filter(function (x) { return verState(x.id) === 'verified'; }).length;
    h += '<h2>Services</h2>' +
      '<div class="filters" role="group" aria-label="Filter services by verification status">' +
      '<button type="button" class="fchip active" data-f="all" aria-pressed="true">All (' + c.items.length + ')</button>' +
      '<button type="button" class="fchip" data-f="verified" aria-pressed="false">Verified (' + nv + ')</button>' +
      '<button type="button" class="fchip" data-f="unverified" aria-pressed="false">Not yet verified (' + (c.items.length - nv) + ')</button></div>' +
      '<p class="fine" id="fnote">Verification status comes from each service\'s metadata record. It is about whether the Atlas maintainers have checked the record against official documentation, not about the quality of the service.</p>' +
      '<div class="grid" id="svcGrid">' + c.items.map(serviceCard).join('') + '</div><p class="none" id="fempty" hidden>No services in this category match that filter.</p>';
    afterRender = function () {
      var chips = $$('.fchip'), cards = $$('#svcGrid .card');
      chips.forEach(function (b) {
        b.addEventListener('click', function () {
          var f = b.getAttribute('data-f'), shown = 0;
          chips.forEach(function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
          cards.forEach(function (cd) { var v = cd.getAttribute('data-ver'), ok = f === 'all' || (f === 'verified' ? v === 'verified' : v !== 'verified'); cd.hidden = !ok; if (ok) shown++; });
          $('#fempty').hidden = shown > 0;
        });
      });
    };
    return h;
  }

  function productFacts(s) {
    var m = meta[s.id]; if (!m) return '';
    var rows = [];
    rows.push(['Name in this catalogue', esc(s.name)]);
    if (m.was && m.was.length) rows.push(['Previously known as', m.was.map(esc).join(', ') + '<small class="fine">Older names can still appear in documentation, console labels or API and SDK identifiers. A rename does not imply those changed.</small>']);
    rows.push(['Lifecycle', '<span class="life ' + esc(m.lifecycle) + '">' + esc(LIFE[m.lifecycle] || m.lifecycle) + '</span>']);
    rows.push(['Verification', verBadge(s.id) + (m.verification === 'verified' && m.sourceUrl ? ' <a href="' + esc(m.sourceUrl) + '" target="_blank" rel="noopener">source checked ↗</a>' : '')]);
    if (s.doc) rows.push(['Official documentation', '<a href="https://cloud.google.com/' + esc(s.doc) + '" target="_blank" rel="noopener">Google Cloud docs ↗</a>' + (m.verification === 'verified' ? '' : '<small class="fine">Link taken from the existing record; not yet checked.</small>')]);
    if (m.alt && m.alt.length) rows.push(['Compare with', m.alt.filter(function (x) { return byId[x]; }).map(function (x) { return '<a href="#/s/' + x + '">' + esc(byId[x].name) + '</a>'; }).join(' · ')]);
    var h = '<section class="facts" aria-labelledby="facts-h"><h2 id="facts-h">Product facts</h2><dl>' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';
    if (m.verification !== 'verified') h += '<p class="fine warnline">This record has not been checked against official documentation by the Atlas maintainers. Product names, lifecycle status, limits, regions and prices change. Confirm in the linked documentation before you design around anything here.</p>';
    if (m.choose || m.avoid) {
      h += '<div class="lists two guide"><div class="box"><h3>Choose it when</h3><p>' + fmt(m.choose || 'Not yet written.') + '</p></div><div class="box warn"><h3>Avoid it when</h3><p>' + fmt(m.avoid || 'Not yet written.') + '</p></div></div><p class="fine">Atlas guidance for orientation. It is not an official Google recommendation.</p>';
    }
    h += '<p class="fine"><a href="' + issueLink('Content issue: ' + s.name + ' (' + s.id + ')') + '" target="_blank" rel="noopener">Report an issue with this page ↗</a> (opens a GitHub issue; there is no promise of a reply).</p></section>';
    return h;
  }
  function pageService(id) {
    var s = byId[id]; if (!s) return notFound();
    var c = catById[s.cat], hue = c.hue, i = c.items.indexOf(s);
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a class="chip" style="--h:' + hue + '" href="#/c/' + c.id + '">' + esc(c.name) + '</a>' +
      (s.doc ? '<a href="https://cloud.google.com/' + esc(s.doc) + '" target="_blank" rel="noopener">Google Cloud docs ↗</a>' : '') + '</div>';
    h += '<h1>' + esc(s.name) + '</h1><p class="lede">' + esc(s.tag) + '</p>';
    h += productFacts(s);
    h += '<h2 style="margin-top:28px">What it is</h2>' + paras(s.what);
    h += '<h2>How it works</h2>' + stepperHost({ flow: s.flow, steps: s.steps, hue: hue });
    h += '<div class="lists two" style="margin-top:34px"><div class="box warn"><h3>Gotchas</h3>' + ul(s.gotchas) + '</div><div class="box"><h3>Edge cases</h3>' + ul(s.edges) + '</div></div>';
    h += '<h2>Using it in AI/ML systems</h2><div class="box ml" style="padding-top:2px">' + ul(s.ml) + '</div>';
    if (s.pairs && s.pairs.length) {
      h += '<h2>Pairs well with</h2><div class="pairs">' + s.pairs.filter(function (p) { return byId[p]; }).map(function (p) { return '<a href="#/s/' + p + '">' + esc(byId[p].name) + '</a>'; }).join('') + '</div>';
    }
    if (s.cost) h += '<div class="callout" style="margin-top:28px"><b>Cost model</b>' + fmt(s.cost) + '</div>';
    var prev = c.items[i - 1], next = c.items[i + 1];
    h += '<div class="pn">' + (prev ? '<a href="#/s/' + prev.id + '"><small>← Previous</small>' + esc(prev.name) + '</a>' : '<span></span>') + (next ? '<a href="#/s/' + next.id + '"><small>Next →</small>' + esc(next.name) + '</a>' : '') + '</div>';
    return h;
  }

  function pageArchIndex() {
    var cats = [
      { id: 'all', name: 'All Architectures', count: A.architectures.length },
      { id: 'foundation-ml', name: 'Foundation ML', count: A.architectures.filter(function(a){return a.cat==='foundation-ml';}).length },
      { id: 'genai', name: 'GenAI Systems', count: A.architectures.filter(function(a){return a.cat==='genai';}).length },
      { id: 'rag', name: 'RAG Architectures', count: A.architectures.filter(function(a){return a.cat==='rag';}).length },
      { id: 'agents', name: 'Multi-Agent Systems', count: A.architectures.filter(function(a){return a.cat==='agents';}).length },
      { id: 'production', name: 'Production & MLOps', count: A.architectures.filter(function(a){return a.cat==='production';}).length }
    ];
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Reference Architectures</div>' +
      '<h1>Production Reference Architectures (' + A.architectures.length + ')</h1>' +
      '<p class="lede">Comprehensive production blueprints covering the entire lifecycle: Foundation ML, Generative AI, Retrieval-Augmented Generation, Autonomous Multi-Agent Swarms, and Enterprise MLOps platforms. Every blueprint follows a standardized 12-section AI Engineering Manager blueprint.</p>' +
      '<div class="filter-bar" id="archFilterBar">' +
      cats.map(function (c, i) {
        return '<button type="button" class="filter-btn' + (i === 0 ? ' active' : '') + '" data-cat="' + c.id + '">' + esc(c.name) + ' <span class="count-pill">(' + c.count + ')</span></button>';
      }).join('') +
      '</div>' +
      '<div class="grid" id="archGrid">';
    A.architectures.forEach(function (a) {
      var catName = { 'foundation-ml': 'Foundation ML', 'genai': 'GenAI', 'rag': 'RAG', 'agents': 'Multi-Agent', 'production': 'Production' }[a.cat] || a.cat;
      h += '<a class="card arch-card" style="--h:215" data-cat="' + a.cat + '" href="#/a/' + a.id + '">' +
        '<div class="cat-tag">' + esc(catName) + '</div>' +
        '<h3>' + esc(a.name) + '</h3>' +
        '<p>' + esc(a.short) + '</p>' +
        '</a>';
    });
    h += '</div>';

    afterRender = function () {
      var bar = $('#archFilterBar');
      if (!bar) return;
      var btns = $$('.filter-btn', bar);
      var cards = $$('.arch-card', $('#archGrid'));
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          btns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var targetCat = btn.getAttribute('data-cat');
          cards.forEach(function (card) {
            if (targetCat === 'all' || card.getAttribute('data-cat') === targetCat) {
              card.style.display = '';
            } else {
              card.style.display = 'none';
            }
          });
        });
      });
    };
    return h;
  }

  function pageArch(id) {
    var a = archById[id]; if (!a) return notFound();
    var catName = { 'foundation-ml': 'Foundation ML', 'genai': 'Generative AI', 'rag': 'Retrieval-Augmented Generation (RAG)', 'agents': 'Autonomous Multi-Agent Systems', 'production': 'Enterprise Production & MLOps' }[a.cat] || a.cat;
    
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/a">Architectures</a> / ' + esc(catName) + '</div>' +
      '<h1>' + esc(a.name) + '</h1>' +
      '<p class="lede">' + esc(a.short) + '</p>';

    h += '<div class="bp-container">';

    // Section 1: Business Problem & Executive Summary
    h += '<div class="bp-sec">' +
      '<div class="bp-header"><span class="bp-num">1</span><h3 class="bp-title">Business Problem & Executive Summary</h3></div>' +
      '<p>' + fmt(a.problem || a.short) + '</p>' +
      '</div>';

    // Section 2: When to Use It (Decision Triggers)
    h += '<div class="bp-sec">' +
      '<div class="bp-header"><span class="bp-num">2</span><h3 class="bp-title">When to Use It (Decision Triggers)</h3></div>' +
      '<div class="callout" style="margin:0"><b>Architectural Fit</b>' + fmt(a.when) + '</div>' +
      '</div>';

    // Section 3: When NOT to Use It & Alternatives
    h += '<div class="bp-sec">' +
      '<div class="bp-header"><span class="bp-num">3</span><h3 class="bp-title">When NOT to Use It & Alternatives</h3></div>' +
      '<div class="callout warn" style="margin:0"><b>Anti-patterns & Disqualifiers</b>' + fmt(a.whenNot || 'Do not use when a simpler static pipeline or deterministic SQL query suffices, or when operational SLAs cannot tolerate probabilistic model latencies.') + '</div>' +
      '</div>';

    // Section 4: Interactive Architecture Diagram & Stepper
    h += '<div class="bp-sec">' +
      '<div class="bp-header"><span class="bp-num">4</span><h3 class="bp-title">Interactive Architecture Flow Diagram</h3></div>' +
      '<p style="color:var(--muted);font-size:13px;margin-bottom:14px">Step through the data flow. Click nodes or links to inspect corresponding Google Cloud service specifications.</p>' +
      stepperHost({ flow: a.flow, steps: a.steps, hue: 215 }) +
      '</div>';

    // Section 5: Google Cloud Service Mapping & Key Roles
    var used = {}; a.flow.forEach(function (f) { if (f.s) used[f.s] = 1; });
    var ids = Object.keys(used);
    h += '<div class="bp-sec">' +
      '<div class="bp-header"><span class="bp-num">5</span><h3 class="bp-title">Google Cloud Service Mapping & Key Roles</h3></div>' +
      '<p style="color:var(--muted);font-size:13px">Each service below executes a dedicated responsibility in this architecture:</p>' +
      '<div class="pairs" style="margin-top:10px">' +
      ids.map(function (p) {
        var s = byId[p];
        return s ? '<a href="#/s/' + p + '">' + esc(s.name) + '</a>' : '';
      }).filter(Boolean).join('') +
      '</div></div>';

    // Section 6: End-to-End Data Flow Steps & Rationale
    h += '<div class="bp-sec">' +
      '<div class="bp-header"><span class="bp-num">6</span><h3 class="bp-title">End-to-End Execution Flow & Design Rationale</h3></div>' +
      '<div class="bp-grid">' +
        '<div class="bp-item"><h4>Execution Steps</h4><ol style="margin:6px 0;padding-left:18px">' +
          a.steps.map(function(s){ return '<li style="margin:6px 0">' + fmt(s[1]) + '</li>'; }).join('') +
        '</ol></div>' +
        '<div class="bp-item"><h4>Why This Shape</h4>' + ul(a.why) + '</div>' +
      '</div></div>';

    // Section 7: Security Architecture & Threat Mitigations
    var secItems = a.security || [
      'Enforce least-privilege IAM service accounts with Workload Identity Federation (WIF).',
      'Deploy inside VPC Service Controls (VPC-SC) perimeter to prevent data exfiltration.',
      'Sanitize all inbound user prompts and external retrieval inputs against indirect prompt injection via Vertex AI Model Armor.',
      'Customer-Managed Encryption Keys (CMEK) enabled across all storage buckets, vector indices, and database tables.'
    ];
    h += '<div class="bp-sec">' +
      '<div class="bp-header"><span class="bp-num">7</span><h3 class="bp-title">Security Architecture & Threat Mitigations</h3></div>' +
      ul(secItems) +
      '</div>';

    // Section 8: Failure Modes & Automated Recovery Strategies
    h += '<div class="bp-sec">' +
      '<div class="bp-header"><span class="bp-num">8</span><h3 class="bp-title">Failure Modes & Automated Recovery Strategies</h3></div>' +
      '<div class="box warn" style="margin:0">' + ul(a.fails) + '</div>' +
      '</div>';

    // Section 9: Cost Model & FinOps Levers
    var costItems = a.costModel || [
      'Input/Output token consumption billed per million tokens; apply Context Caching for static prompts longer than 32,768 tokens (up to 75% savings).',
      'Compute sizing: configure autoscaling with minimum 0 instances on Cloud Run or scale-to-zero nodepools in GKE to eliminate idle compute spend.',
      'Use BigQuery continuous queries or batch prediction discounts (50% reduction) for non-interactive workloads.'
    ];
    h += '<div class="bp-sec">' +
      '<div class="bp-header"><span class="bp-num">9</span><h3 class="bp-title">Cost Model & FinOps Levers</h3></div>' +
      ul(costItems) +
      '</div>';

    // Section 10: AI Quality Evaluation & Acceptance Metrics
    var evalItems = a.evalMetrics || [
      'Retrieval Quality: Hit Rate @ K >= 92%, Mean Reciprocal Rank (MRR) >= 0.85.',
      'Generation Quality: Groundedness & Faithfulness >= 0.90 evaluated via Vertex AI AutoSxS or Prometheus-style judge models.',
      'Latency SLA: P95 Time-to-First-Token (TTFT) <= 800ms, P95 Total Response Time <= 2.8s.',
      'Task Success Rate: >= 94% on domain gold validation test suites.'
    ];
    h += '<div class="bp-sec">' +
      '<div class="bp-header"><span class="bp-num">10</span><h3 class="bp-title">AI Quality Evaluation & Acceptance Metrics</h3></div>' +
      ul(evalItems) +
      '</div>';

    // Section 11: Deployment & CI/CD Strategy
    h += '<div class="bp-sec">' +
      '<div class="bp-header"><span class="bp-num">11</span><h3 class="bp-title">Deployment & CI/CD Strategy</h3></div>' +
      '<p><b>Canary Pipeline with Automated Quality Gates:</b> Code, prompts, and pipeline configs are version-controlled in Cloud Source Repositories/GitHub. Cloud Build triggers automated evaluation runs against golden datasets using Vertex AI Evaluation API. If Groundedness < 0.90 or Hallucination Rate > 3%, the deployment is blocked automatically. Safe rollouts are orchestrated using Traffic Splitting on Cloud Run (10% canary → 50% → 100%) or Argo Rollouts on GKE.</p>' +
      '</div>';

    // Section 12: Production Readiness Checklist
    var checkItems = a.checklist || [
      'Data & Privacy: Redaction of PII/PHI completed; customer data excluded from foundation model training.',
      'Security: Zero-trust VPC Service Controls perimeter and service account least-privilege verified.',
      'Observability: OpenTelemetry traces exported to Cloud Trace; 429 throttling and TTFT alerts configured in Cloud Monitoring.',
      'Resilience: Circuit breaker pattern implemented with exponential backoff on Vertex AI API quotas.',
      'FinOps: Token usage quotas and Cloud Billing budget threshold alerts active.',
      'Disaster Recovery: Vector indices and state stores backed up with documented RTO < 1h, RPO < 15m.'
    ];
    h += '<div class="bp-sec">' +
      '<div class="bp-header"><span class="bp-num">12</span><h3 class="bp-title">Production Readiness Checklist</h3></div>' +
      '<p style="color:var(--muted);font-size:13px">Verify all operational criteria before signing off on production launch:</p>' +
      '<ul class="bp-chk-list">' +
      checkItems.map(function(item, idx) {
        return '<li class="bp-chk-item"><input type="checkbox" id="chk-' + a.id + '-' + idx + '"><label for="chk-' + a.id + '-' + idx + '">' + fmt(item) + '</label></li>';
      }).join('') +
      '</ul>' +
      '</div>';

    h += '</div>'; // end bp-container
    return h;
  }

  /* ---------- decisions & leader tools ---------- */
  var decById = {}; A.decisions.forEach(function (d) { decById[d.id] = d; });
  var themeById = {}; A.decisionThemes.forEach(function (t) { themeById[t.id] = t; });
  var THEME_HUE = { strategy: 212, architecture: 268, risk: 150 };
  var DOOR = { 'two-way': ['Two-way door', 'Easy to reverse'], 'one-way': ['One-way door', 'Hard to reverse'], 'mixed': ['Mixed door', 'Reversible at first'] };
  var afterRender = null;

  function doorBadge(d) { var x = DOOR[d.door]; return '<span class="door ' + d.door + '" title="' + esc(x[1]) + '">' + x[0] + '</span>'; }
  function plain(s) {
    return String(s).replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, function (m, id, label) { return label || (byId[id] ? byId[id].name : id); });
  }
  function copyText(text, btn) {
    var label = btn ? (btn.getAttribute('data-l') || btn.textContent) : '';
    if (btn) btn.setAttribute('data-l', label);
    function done(ok) { if (!btn) return; btn.textContent = ok ? 'Copied ✓' : 'Select and copy manually'; setTimeout(function () { btn.textContent = label; }, 1800); }
    function fallback() {
      var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(t); t.select(); var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t); done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback); else fallback();
  }
  function seeLink(ref) {
    var p = ref.split(':'), id = p[1];
    if (p[0] === 'svc' && byId[id]) return '<a href="#/s/' + id + '">' + esc(byId[id].name) + '</a>';
    if (p[0] === 'dec' && decById[id]) return '<a href="#/d/' + id + '">' + esc(decById[id].title) + '</a>';
    return '';
  }
  function money(n) {
    if (!isFinite(n)) return '—';
    if (n >= 100) return '$' + Math.round(n).toLocaleString('en-US');
    if (n >= 1) return '$' + n.toFixed(2);
    if (n >= 0.01) return '$' + n.toFixed(3);
    return '$' + n.toFixed(5);
  }

  /* ----- role tabs: engineering managers and principal engineers ----- */
  var roleById = {}; A.roles.forEach(function (r) { roleById[r.id] = r; });
  var ROLE_KEY = 'atlas-role';
  function getRole() { try { var r = localStorage.getItem(ROLE_KEY); return roleById[r] ? r : null; } catch (e) { return null; } }
  function setRole(r) { try { localStorage.setItem(ROLE_KEY, r); } catch (e) {} }
  var LEAD_TEXT = { em: 'Engineering manager leads', pe: 'Principal engineer leads', both: 'Shared decision' };
  function leadChip(d) { return '<span class="lead ' + d.lead + '">' + LEAD_TEXT[d.lead] + '</span>'; }
  function roleChip(d, role) {
    var t = d.lead === role ? 'You lead' : (d.lead === 'both' ? 'You co-own' : 'You advise');
    return '<span class="lead ' + (d.lead === role ? 'mine' : (d.lead === 'both' ? 'both' : 'other')) + '">' + t + '</span>';
  }
  function tabList(label, tabs, active) {
    return '<div class="tabs" role="tablist" aria-label="' + esc(label) + '">' + tabs.map(function (t) {
      var on = t[0] === active;
      return '<button type="button" role="tab" class="tab" id="tab-' + t[0] + '" aria-controls="panel-' + t[0] + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';
  }
  function tabPanel(id, active, html) {
    return '<div role="tabpanel" class="tabpanel" id="panel-' + id + '" aria-labelledby="tab-' + id + '" tabindex="0"' + (id === active ? '' : ' hidden') + '>' + html + '</div>';
  }
  function mountTabs(root, onChange) {
    var list = $('.tabs', root); if (!list) return;
    function select(id, focus) {
      $$('.tab', list).forEach(function (b) {
        var on = b.getAttribute('data-tab') === id;
        b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      $$('.tabpanel', root).forEach(function (p) { p.hidden = p.id !== 'panel-' + id; });
      if (onChange) onChange(id);
    }
    list.addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) select(b.getAttribute('data-tab')); });
    list.addEventListener('keydown', function (e) {
      var tabs = $$('.tab', list), i = tabs.indexOf(document.activeElement); if (i < 0) return;
      var j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (tabs.length + i - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
      if (j >= 0) { e.preventDefault(); select(tabs[j].getAttribute('data-tab'), true); }
    });
  }
  function decisionCard(d, line, chip) {
    return '<a class="card" style="--h:' + THEME_HUE[d.theme] + '" href="#/d/' + d.id + '"><div class="mini">' + esc(themeById[d.theme].name) + '</div><h3>' + esc(d.title) + '</h3><p>' + esc(line) + '</p>' +
      '<div class="badges">' + doorBadge(d) + (chip || '') + '</div></a>';
  }
  function roleView(role) {
    var r = roleById[role], other = role === 'em' ? 'pe' : 'em';
    var h = '<p class="rolelede">' + fmt(r.blurb) + '</p>' +
      '<div class="lists two"><div class="box"><h3>What you decide</h3>' + ul(r.owns) + '</div>' +
      '<div class="box ml"><h3>Your rhythm</h3><ul>' + r.rhythm.map(function (x) { return '<li><b>' + esc(x[0]) + ':</b> ' + fmt(x[1]) + '</li>'; }).join('') + '</ul></div></div>';
    h += '<h3 style="margin-top:30px">Quick calls</h3><p style="max-width:62ch">Find the situation you are in, take the default call, and open the guide for the options, rules and red flags behind it.</p>' +
      '<div class="tablewrap"><table class="quick"><thead><tr><th>If this is happening</th><th>Default call</th><th>Guide</th></tr></thead><tbody>' +
      r.quick.map(function (q) { var d = decById[q[2]]; return '<tr><td>' + fmt(q[0]) + '</td><td>' + fmt(q[1]) + '</td><td><a href="#/d/' + d.id + '">' + esc(d.title) + '</a></td></tr>'; }).join('') + '</tbody></table></div>';
    var groups = [
      ['You lead these', A.decisions.filter(function (d) { return d.lead === role; })],
      ['You co-own these', A.decisions.filter(function (d) { return d.lead === 'both'; })],
      [role === 'em' ? 'Principal engineers lead; you back them on' : 'Engineering managers lead; you advise on', A.decisions.filter(function (d) { return d.lead === other; })]
    ];
    groups.forEach(function (g) {
      if (!g[1].length) return;
      h += '<h3 style="margin-top:30px">' + esc(g[0]) + ' <span class="cnt">' + g[1].length + '</span></h3><div class="grid">' +
        g[1].map(function (d) { return decisionCard(d, d[role].call, roleChip(d, role)); }).join('') + '</div>';
    });
    return h;
  }
  function allView() {
    var h = '<p class="rolelede">Every guide, grouped by theme. Each is marked with who usually leads it.</p>';
    A.decisionThemes.forEach(function (t) {
      var list = A.decisions.filter(function (d) { return d.theme === t.id; });
      h += '<h3 style="margin-top:26px">' + esc(t.name) + '</h3><p style="max-width:62ch">' + esc(t.blurb) + '</p><div class="grid">' +
        list.map(function (d) { return decisionCard(d, d.question, leadChip(d)); }).join('') + '</div>';
    });
    return h;
  }

  function pageDecisionHub(tab) {
    var active = (tab === 'em' || tab === 'pe' || tab === 'all') ? tab : (getRole() || 'em');
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Decisions</div><h1>Decision guides</h1>' +
      '<p class="lede">For engineering managers and principal engineers deciding how to build agentic and ML systems on Google Cloud.</p>' +
      '<p style="max-width:62ch">Each guide gives the options side by side, if/then rules, red flags to watch for, questions to ask in a design review, and a trigger for revisiting the decision. Each one is marked as a <b>two-way door</b> (cheap to reverse) or a <b>one-way door</b> (expensive to reverse), so you can spend your review time where it counts.</p>';
    h += '<h2>Pick your role</h2><p style="max-width:62ch">The tabs below show the same guides through two lenses. Engineering managers get the default call, the evidence to ask for and the budget and people implications. Principal engineers get the default design, the trade-offs and the tests to demand. Your choice is remembered in this browser.</p>';
    h += tabList('Decision guides by role', [['em', 'Engineering managers'], ['pe', 'Principal engineers'], ['all', 'All guides']], active);
    h += tabPanel('em', active, roleView('em')) + tabPanel('pe', active, roleView('pe')) + tabPanel('all', active, allView());
    h += '<h2>Tools</h2><div class="grid">' +
      '<a class="card" style="--h:215" href="#/d/shaper"><div class="mini">Interactive</div><h3>Solution shaper</h3><p>Answer seven questions about your use case and get a starting stack, risks, and the decisions to make next.</p></a>' +
      '<a class="card" style="--h:150" href="#/d/checklists"><div class="mini">Checklist</div><h3>Readiness checklists</h3><p>A prototype-to-scale maturity ladder, a production-readiness checklist, and a decision-record template.</p></a>' +
      '<a class="card" style="--h:185" href="#/d/calculator"><div class="mini">Calculator</div><h3>Cost per task</h3><p>Model unit economics and see which levers (caching, batching, routing) move the bill most.</p></a></div>';
    h += '<h2>Using these in practice</h2><div class="lists two"><div class="box"><h3>In a design review</h3>' +
      ul(['Open the guide for the decision under discussion and read its **red flags** aloud.', 'Ask the **review questions** and note which have no answer yet.', 'For a **one-way door**, require a written decision record before approving.']) + '</div>' +
      '<div class="box ml"><h3>When planning a quarter</h3>' +
      ul(['Run the **solution shaper** to get a first stack and the decisions it flags.', 'Use the **maturity ladder** to set exit criteria for each phase.', 'Put the **cost calculator** numbers next to the roadmap, not after it.']) + '</div></div>';
    afterRender = function () {
      mountTabs($('#main'), function (id) {
        if (id !== 'all') setRole(id);
        try { history.replaceState(null, '', '#/d/' + id); } catch (e) {}
        renderSide('d', id);
      });
    };
    return h;
  }

  function roleLens(d, role) {
    var x = d[role], lbl = role === 'em' ? ['You decide', 'Ask your team for'] : ['You own', 'Evidence to demand'];
    return '<div class="callout lens"><b>Default call</b>' + fmt(x.call) + '</div>' +
      '<div class="lists two"><div class="box"><h3>' + lbl[0] + '</h3>' + ul(x.own) + '</div><div class="box ml"><h3>' + lbl[1] + '</h3>' + ul(x.evidence) + '</div></div>';
  }

  function pageDecision(id) {
    var d = decById[id]; if (!d) return notFound();
    var t = themeById[d.theme], i = A.decisions.indexOf(d);
    var active = getRole() || (d.lead === 'pe' ? 'pe' : 'em');
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/d">Decisions</a> / ' + esc(t.name) + '</div><h1>' + esc(d.title) + '</h1><p class="lede">' + esc(d.question) + '</p>';
    h += '<div class="doorline">' + doorBadge(d) + '<span>' + fmt(d.doorNote) + '</span></div>';
    h += '<h2>Decide by role</h2><p class="lead-note">' + leadChip(d) + '</p>';
    h += tabList('Decision lens by role', [['em', 'Engineering manager' + (d.lead === 'em' ? ' <i>leads</i>' : '')], ['pe', 'Principal engineer' + (d.lead === 'pe' ? ' <i>leads</i>' : '')]], active);
    h += tabPanel('em', active, roleLens(d, 'em')) + tabPanel('pe', active, roleLens(d, 'pe'));
    h += '<h2>Why it matters</h2>' + paras(d.why);
    h += '<h2>The options</h2><div class="tablewrap"><table><thead><tr>' + d.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      d.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + fmt(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    h += '<h2>Decide with these rules</h2><div class="rules">' + d.rules.map(function (r) {
      return '<div class="rule"><div class="if"><small>If</small>' + fmt(r[0]) + '</div><div class="then"><small>Then</small>' + fmt(r[1]) + '</div></div>';
    }).join('') + '</div>';
    h += '<div class="lists two" style="margin-top:34px"><div class="box warn"><h3>Red flags</h3>' + ul(d.redflags) + '</div><div class="box"><h3>Ask in the design review</h3>' + ul(d.ask) + '</div></div>';
    h += '<div class="callout" style="margin-top:22px"><b>Revisit when</b>' + fmt(d.revisit) + '</div>';
    var rel = (d.related || []).filter(function (p) { return byId[p]; });
    if (rel.length) h += '<h2>Services involved</h2><div class="pairs">' + rel.map(function (p) { return '<a href="#/s/' + p + '">' + esc(byId[p].name) + '</a>'; }).join('') + '</div>';
    var prev = A.decisions[i - 1], next = A.decisions[i + 1];
    h += '<div class="pn">' + (prev ? '<a href="#/d/' + prev.id + '"><small>← Previous</small>' + esc(prev.title) + '</a>' : '<span></span>') + (next ? '<a href="#/d/' + next.id + '"><small>Next →</small>' + esc(next.title) + '</a>' : '') + '</div>';
    afterRender = function () { mountTabs($('#main'), function (r) { setRole(r); }); };
    return h;
  }

  /* ----- solution shaper ----- */
  function pageShaper() {
    var Q = A.shaper.questions;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/d">Decisions</a> / Tool</div><h1>Solution shaper</h1>' +
      '<p class="lede">Describe the system. Get a starting shape you can argue with.</p>' +
      '<div class="callout"><b>Read this first</b>This is a rule-based starting point, not an architecture sign-off. It shows the usual shape for your answers and the decisions most worth a conversation. Your evals and constraints override it.</div>' +
      '<div class="shaper"><form id="shForm" class="shform">';
    Q.forEach(function (q) {
      h += '<fieldset data-q="' + q.id + '"><legend>' + esc(q.label) + '</legend>' + q.options.map(function (o) {
        return '<label class="opt"><input type="radio" name="' + q.id + '" value="' + o[0] + '"><span>' + esc(o[1]) + '</span></label>';
      }).join('') + '</fieldset>';
    });
    h += '</form><div id="shOut" class="shout" aria-live="polite"></div></div>';
    afterRender = mountShaper;
    return '<div class="wide">' + h + '</div>';
  }
  function shaperMarkdown(a, r) {
    var Q = A.shaper.questions, L = ['# Solution shape: ' + r.headline, '', '## Inputs'];
    Q.forEach(function (q) {
      if (q.only && a.goal !== q.only) return;
      var o = q.options.filter(function (x) { return x[0] === a[q.id]; })[0];
      L.push('- ' + q.label + ' ' + (o ? o[1] : a[q.id]));
    });
    if (r.arch) L.push('', 'Reference architecture: ' + archById[r.arch].name);
    L.push('', '## Stack');
    r.stack.forEach(function (s) { L.push('- ' + byId[s.id].name + ': ' + s.role + '. ' + s.why); });
    L.push('', '## Risks to design for'); r.risks.forEach(function (x) { L.push('- ' + x); });
    L.push('', '## Decisions to make next'); r.next.forEach(function (n) { L.push('- ' + decById[n.id].title + ': ' + n.why); });
    L.push('', '## Phasing'); r.phases.forEach(function (p, i) { L.push((i + 1) + '. ' + p); });
    L.push('', 'Generated by the Google Cloud for AI systems atlas. A starting point only: validate with your own evals.');
    return L.join('\n');
  }
  function mountShaper() {
    var form = $('#shForm'), out = $('#shOut'), a = {}, k;
    for (k in A.shaper.defaults) a[k] = A.shaper.defaults[k];
    $$('input[type=radio]', form).forEach(function (r) { r.checked = a[r.name] === r.value; });
    function paint() {
      var fs = $('fieldset[data-q=action]', form); if (fs) fs.hidden = a.goal !== 'agent';
      var r = A.shaper.recommend(a), h = '<div class="eyebrow">Suggested starting shape</div><h2 style="margin-top:0">' + esc(r.headline) + '</h2>';
      if (r.arch && archById[r.arch]) h += '<p>Reference architecture: <a href="#/a/' + r.arch + '">' + esc(archById[r.arch].name) + '</a></p>';
      h += '<h3>Stack</h3><ul class="stack">' + r.stack.map(function (s) {
        var sv = byId[s.id];
        return '<li style="--h:' + hueOf(sv.cat) + '"><a class="svc" href="#/s/' + s.id + '">' + esc(sv.name) + '</a><span><b>' + esc(s.role) + '.</b> ' + esc(s.why) + '</span></li>';
      }).join('') + '</ul>';
      h += '<h3>Risks to design for</h3><div class="box warn" style="padding-top:2px">' + ul(r.risks) + '</div>';
      h += '<h3>Decide next</h3><ul class="nextl">' + r.next.map(function (n) {
        var d = decById[n.id]; return '<li><a href="#/d/' + d.id + '">' + esc(d.title) + '</a> ' + doorBadge(d) + '<br><span>' + esc(n.why) + '</span></li>';
      }).join('') + '</ul>';
      h += '<h3>Phasing</h3><ol class="phases">' + r.phases.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>';
      h += '<div class="btns" style="margin-top:18px"><button class="btn" type="button" data-copy>Copy as markdown</button><a class="btn" href="#/d/checklists">Readiness checklists</a></div>';
      out.innerHTML = h; out._md = shaperMarkdown(a, r);
    }
    form.addEventListener('change', function (e) { if (e.target.name) { a[e.target.name] = e.target.value; paint(); } });
    out.addEventListener('click', function (e) { var b = e.target.closest('[data-copy]'); if (b) copyText(out._md, b); });
    paint();
  }

  /* ----- checklists, ladder, ADR ----- */
  var READY_KEY = 'atlas-ready-v1';
  function loadReady() { try { return JSON.parse(localStorage.getItem(READY_KEY)) || {}; } catch (e) { return {}; } }
  function saveReady(o) { try { localStorage.setItem(READY_KEY, JSON.stringify(o)); } catch (e) {} }

  function pageChecklists() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/d">Decisions</a> / Tool</div><h1>Readiness checklists</h1>' +
      '<p class="lede">What has to be true before you move up a stage, and before you go live.</p>';
    h += '<h2>The maturity ladder</h2><p style="max-width:62ch">Most failed AI projects skipped a stage. Each stage has a different goal, and each has things you should not do yet.</p><div class="ladder">';
    A.ladder.forEach(function (s, i) {
      h += '<div class="rung"><div class="rn">' + (i + 1) + '</div><h3>' + esc(s.stage) + '</h3><div class="mini">' + esc(s.time) + '</div><p>' + esc(s.goal) + '</p>' +
        '<h4>Exit when</h4>' + ul(s.exit) + '<h4 class="no">Not yet</h4><p class="nope">' + s.skip.map(esc).join(' · ') + '</p></div>';
    });
    h += '</div><h2>Production readiness</h2><p style="max-width:62ch">Tick items as they become true. Your progress is saved in this browser only.</p>' +
      '<div class="ready-bar"><div class="seg" role="group" aria-label="Filter checklist" id="rdFilter">' +
      '<button type="button" data-f="all" aria-pressed="true">All</button><button type="button" data-f="agent" aria-pressed="false">Agentic</button><button type="button" data-f="ml" aria-pressed="false">Classic ML</button></div>' +
      '<div class="prog" aria-live="polite"><div class="track"><div class="fill" id="rdFill"></div></div><span id="rdNum"></span></div></div><div id="rdList"></div>' +
      '<div class="btns" style="margin-top:16px"><button class="btn" type="button" id="rdCopy">Copy open items as markdown</button><button class="btn" type="button" id="rdReset">Reset</button></div>';
    h += '<h2>Decision record template</h2><p style="max-width:62ch">A short record for each one-way door. The point is the reversibility line and the revisit trigger.</p>' +
      '<div class="codebar"><button class="btn" type="button" id="adrCopy">Copy template</button></div><pre class="adr" tabindex="0">' + esc(A.adrTemplate) + '</pre>';
    afterRender = mountChecklists;
    return h;
  }
  function mountChecklists() {
    var state = loadReady(), filter = 'all', list = $('#rdList');
    function visible(it) { return filter === 'all' || it.kind === 'both' || it.kind === filter; }
    function paint() {
      var total = 0, done = 0, h = '';
      A.readiness.forEach(function (g) {
        var items = g.items.filter(visible); if (!items.length) return;
        h += '<h3>' + esc(g.name) + '</h3><ul class="chklist">';
        items.forEach(function (it) {
          total++; if (state[it.id]) done++;
          var see = (it.see || []).map(seeLink).filter(Boolean).join(' · ');
          h += '<li><label class="chk"><input type="checkbox" data-id="' + it.id + '"' + (state[it.id] ? ' checked' : '') + '><span><span class="t">' + fmt(it.t) + '</span>' +
            '<span class="w">' + esc(it.why) + '</span>' + (see ? '<span class="s">See: ' + see + '</span>' : '') + '</span></label></li>';
        });
        h += '</ul>';
      });
      list.innerHTML = h;
      $('#rdNum').textContent = done + ' of ' + total;
      $('#rdFill').style.width = (total ? Math.round(done / total * 100) : 0) + '%';
    }
    list.addEventListener('change', function (e) {
      var id = e.target.getAttribute('data-id'); if (!id) return;
      if (e.target.checked) state[id] = 1; else delete state[id];
      saveReady(state);
      var vis = 0, dn = 0; A.readiness.forEach(function (g) { g.items.filter(visible).forEach(function (it) { vis++; if (state[it.id]) dn++; }); });
      $('#rdNum').textContent = dn + ' of ' + vis; $('#rdFill').style.width = (vis ? Math.round(dn / vis * 100) : 0) + '%';
    });
    $('#rdFilter').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-f]'); if (!b) return; filter = b.getAttribute('data-f');
      $$('#rdFilter button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      paint();
    });
    $('#rdReset').addEventListener('click', function () { state = {}; saveReady(state); paint(); });
    $('#rdCopy').addEventListener('click', function () {
      var L = ['# Production readiness: open items', ''];
      A.readiness.forEach(function (g) {
        var open = g.items.filter(function (it) { return visible(it) && !state[it.id]; }); if (!open.length) return;
        L.push('## ' + g.name); open.forEach(function (it) { L.push('- [ ] ' + plain(it.t)); }); L.push('');
      });
      if (L.length === 2) L.push('All items in this view are done.');
      copyText(L.join('\n'), this);
    });
    $('#adrCopy').addEventListener('click', function () { copyText(A.adrTemplate, this); });
    paint();
  }

  /* ----- cost calculator ----- */
  var CALC_DEFAULTS = { req: 20000, inTok: 3000, outTok: 500, pIn: 3, pOut: 15, calls: 1, success: 85, sem: 0, cacheFrac: 0, cacheDisc: 90, batchShare: 0, batchDisc: 50, infra: 0.0005 };
  var CALC_FIELDS = [
    ['Traffic and task shape', [
      ['req', 'Tasks per day', '', 'A task is one user request that your system completes.'],
      ['calls', 'Model calls per task', '', 'Agents often make 3 to 10. A plain chat answer makes 1.'],
      ['inTok', 'Input tokens per call', '', 'System prompt, history, retrieved passages and tool results all count.'],
      ['outTok', 'Output tokens per call', '', 'Reasoning tokens usually bill as output.'],
      ['success', 'Tasks completed successfully', '%', 'Failures still cost money. Measure this with your evals.']]],
    ['Prices (example values: replace with current pricing)', [
      ['pIn', 'Input price per 1M tokens', '$', 'Take this from the pricing page for your model.'],
      ['pOut', 'Output price per 1M tokens', '$', 'Output is typically several times the input price.'],
      ['infra', 'Other cost per task', '$', 'Retrieval, gateway, storage, orchestration, logging.']]],
    ['Levers', [
      ['sem', 'Answered from semantic cache', '%', 'Share of tasks that skip the model entirely. Check answers stay correct.'],
      ['cacheFrac', 'Input tokens served from prompt cache', '%', 'Stable prefixes such as system prompts and shared documents.'],
      ['cacheDisc', 'Prompt-cache discount', '%', 'Cached input is billed at a reduced rate. Confirm for your model.'],
      ['batchShare', 'Share of calls sent to batch', '%', 'Only for work that can wait.'],
      ['batchDisc', 'Batch discount', '%', 'Confirm the current discount for your model.']]]
  ];
  function calcCost(p) {
    var bf = 1 - p.batchShare / 100 * p.batchDisc / 100, keep = 1 - p.sem / 100;
    var inC = p.inTok / 1e6 * p.pIn * (1 - p.cacheFrac / 100 * p.cacheDisc / 100) * bf * p.calls * keep;
    var outC = p.outTok / 1e6 * p.pOut * bf * p.calls * keep;
    var task = inC + outC + p.infra;
    return { inC: inC, outC: outC, infra: p.infra, task: task, ok: p.success > 0 ? task / (p.success / 100) : Infinity, month: task * p.req * 30 };
  }
  function pageCalculator() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/d">Decisions</a> / Tool</div><h1>Cost per task</h1>' +
      '<p class="lede">Unit economics for an LLM feature, and which levers move them.</p>' +
      '<div class="callout"><b>About the numbers</b>Prices here are placeholders for the arithmetic. Look up current prices for your model and Region, and measure your own token counts. Nothing is sent anywhere: the calculation runs in your browser.</div>' +
      '<div class="wide"><div class="calc"><form id="calcForm" class="calcform">';
    CALC_FIELDS.forEach(function (g) {
      h += '<fieldset><legend>' + esc(g[0]) + '</legend>';
      g[1].forEach(function (f) {
        h += '<label class="num"><span class="nl2">' + esc(f[1]) + '</span><span class="inp">' + (f[2] === '$' ? '<i>$</i>' : '') +
          '<input type="number" inputmode="decimal" min="0" step="any" name="' + f[0] + '" aria-describedby="h-' + f[0] + '">' + (f[2] === '%' ? '<i>%</i>' : '') + '</span><small id="h-' + f[0] + '">' + esc(f[3]) + '</small></label>';
      });
      h += '</fieldset>';
    });
    h += '<button class="btn" type="button" id="calcReset">Reset to defaults</button></form><div id="calcOut" class="calcout" aria-live="polite"></div></div></div>';
    h += scenarioShell();
    afterRender = function () { mountCalculator(); if (AL.scenarioCost) mountScenario(); };
    return h;
  }
  /* ----- FinOps scenario panel (uses assets/logic.js, the same code the unit tests run) ----- */
  var SCEN_EXTRA = [
    ['Workload shape', [
      ['requestsPerTask', 'User-visible requests per task', '1', 'Used for cost per request.'],
      ['users', 'Active users per month', '0', 'Used for cost per user. Leave 0 to skip.'],
      ['retryPct', 'Attempts that need one retry (%)', '0', 'Retries repeat the whole pipeline, so cost scales by 1 + this share.']]],
    ['Other per-task costs (your prices)', [
      ['toolCallsPerTask', 'Billable tool/API calls per task', '0', ''], ['pTool', 'Price per tool/API call', '0', ''],
      ['retrievalPerTask', 'Retrieval queries per task', '0', ''], ['pRetrieval1k', 'Price per 1,000 retrieval queries', '0', ''],
      ['embedTokPerTask', 'Query-embedding tokens per task', '0', ''], ['pEmbed', 'Price per 1M embedding tokens', '0', ''],
      ['rerankPerTask', 'Rerank requests per task', '0', ''], ['pRerank1k', 'Price per 1,000 rerank requests', '0', '']]],
    ['Fixed monthly costs', [
      ['fixObs', 'Logging, tracing, monitoring', '0', ''], ['fixEval', 'Evaluation runs', '0', ''],
      ['fixStorage', 'Storage and index hosting', '0', ''], ['fixPlatform', 'Other fixed platform cost', '0', '']]],
    ['One-time setup', [
      ['oneDocs', 'Documents to index', '0', ''], ['oneTokPerDoc', 'Tokens embedded per document', '0', 'Priced with the embedding price above.'],
      ['oneOther', 'Other setup cost', '0', '']]],
    ['Budget', [['monthlyBudget', 'Monthly budget (0 = none)', '0', 'Shows headroom or overspend.']]]
  ];
  function scenarioShell() {
    var h = '<h2 style="margin-top:36px">Scenario model</h2><p class="lede" style="max-width:72ch">Builds on the inputs above. Adds retries, tool, retrieval and rerank costs, fixed and one-time costs, unit economics, pinned comparison and export. You supply every price; the Atlas holds none.</p>' +
      '<div class="callout"><b>Estimate, not a quote</b>Results come from your assumptions. They are not a guaranteed cloud bill. Record where your prices came from so the numbers can be checked later.</div>' +
      '<div class="wide"><div class="calc"><form id="scenForm" class="calcform">' +
      '<fieldset><legend>Pricing record</legend>' +
      '<label class="num"><span class="nl2">Scenario name</span><span class="inp"><input type="text" name="name" placeholder="e.g. Support assistant, hybrid RAG"></span></label>' +
      '<label class="num"><span class="nl2">Currency</span><span class="inp"><input type="text" name="currency" value="USD"></span></label>' +
      '<label class="num"><span class="nl2">Pricing source (URL or document)</span><span class="inp"><input type="text" name="pricingSource" placeholder="paste the pricing page you used"></span></label>' +
      '<label class="num"><span class="nl2">Date prices were retrieved</span><span class="inp"><input type="date" name="retrievedOn"></span></label>' +
      '<label class="num"><span class="nl2">Region assumed</span><span class="inp"><input type="text" name="region" placeholder="e.g. a single Region you will deploy to"></span></label></fieldset>' +
      '<fieldset><legend>Starting shape</legend><label class="num"><span class="nl2">Archetype preset</span><span class="inp"><select name="preset"><option value="">Choose a shape…</option>' +
      (AL.PRESETS || []).map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join('') + '</select></span><small id="presetNote">A preset changes the shape (calls, tools, retrieval), never prices. Edit afterwards.</small></label></fieldset>';
    SCEN_EXTRA.forEach(function (g) {
      h += '<fieldset><legend>' + esc(g[0]) + '</legend>';
      g[1].forEach(function (f) {
        h += '<label class="num"><span class="nl2">' + esc(f[1]) + '</span><span class="inp"><input type="number" inputmode="decimal" min="0" step="any" name="' + f[0] + '" value="' + f[2] + '"></span>' + (f[3] ? '<small>' + esc(f[3]) + '</small>' : '') + '</label>';
      });
      h += '</fieldset>';
    });
    h += '<fieldset><legend>Budget guard</legend><label class="num"><span class="nl2">Target cost per successful task</span><span class="inp"><input type="number" min="0" step="any" name="target" value="0"></span><small>Shows the most model calls per task that fit the target. 0 skips it.</small></label></fieldset>' +
      '</form><div id="scenOut" class="calcout" aria-live="polite"></div></div></div>';
    return h;
  }
  function mountScenario() {
    var legacy = $('#calcForm'), sf = $('#scenForm'), out = $('#scenOut'), pinned = null;
    function num(f, k) { var v = parseFloat(f.elements[k].value); return isFinite(v) ? v : 0; }
    function raw() {
      var r = {
        tasksPerMonth: num(legacy, 'req') * 30, callsPerTask: num(legacy, 'calls'), inTok: num(legacy, 'inTok'), outTok: num(legacy, 'outTok'),
        successPct: num(legacy, 'success'), pIn: num(legacy, 'pIn'), pOut: num(legacy, 'pOut'), semPct: num(legacy, 'sem'),
        cacheFrac: num(legacy, 'cacheFrac'), cacheDisc: num(legacy, 'cacheDisc'), batchShare: num(legacy, 'batchShare'), batchDisc: num(legacy, 'batchDisc'), infra: num(legacy, 'infra')
      };
      SCEN_EXTRA.forEach(function (g) { g[1].forEach(function (f) { r[f[0]] = num(sf, f[0]); }); });
      return r;
    }
    function meta() { return { name: sf.elements.name.value, currency: sf.elements.currency.value, pricingSource: sf.elements.pricingSource.value, retrievedOn: sf.elements.retrievedOn.value, region: sf.elements.region.value }; }
    function cur(v) { if (v == null || !isFinite(v)) return 'n/a'; var c = (sf.elements.currency.value || '').trim(); return (c ? c + ' ' : '') + (Math.abs(v) >= 100 ? Math.round(v).toLocaleString('en-US') : (Math.abs(v) >= 1 ? v.toFixed(2) : v.toFixed(4))); }
    function pct(v) { return v == null ? 'n/a' : (v > 0 ? '+' : '') + v.toFixed(0) + '%'; }
    function paint() {
      var r = AL.scenarioCost(raw()), m = meta(), h = '';
      if (!(r.inputs.tasksPerMonth > 0)) { out.innerHTML = '<p class="none">Enter tasks per day above to see results.</p>'; return; }
      if (!m.pricingSource.trim() || !m.retrievedOn) h += '<p class="fine warnline">Pricing source or retrieval date is not recorded. Exports will say so. Fill both before sharing these numbers.</p>';
      if (!(r.inputs.pIn > 0 || r.inputs.pOut > 0)) h += '<p class="fine warnline">No model prices entered, so model cost is zero. This is an input gap, not a free system.</p>';
      r.warnings.forEach(function (w) { h += '<p class="fine warnline">Input corrected: ' + esc(w) + '</p>'; });
      h += '<div class="eyebrow">Unit economics</div><div class="kpis">' +
        '<div class="kpi"><small>Per request</small><b>' + cur(r.unit.perRequest) + '</b></div>' +
        '<div class="kpi"><small>Per workflow (task)</small><b>' + cur(r.unit.perWorkflow) + '</b></div>' +
        '<div class="kpi"><small>Per user per month</small><b>' + cur(r.unit.perUser) + '</b></div>' +
        '<div class="kpi"><small>Per successful task</small><b>' + cur(r.unit.perSuccessfulTask) + '</b></div></div>';
      h += '<div class="kpis"><div class="kpi"><small>Monthly variable</small><b>' + cur(r.monthlyVariable) + '</b></div><div class="kpi"><small>Monthly fixed</small><b>' + cur(r.monthlyFixed) + '</b></div>' +
        '<div class="kpi"><small>Monthly total</small><b>' + cur(r.monthlyTotal) + '</b></div><div class="kpi"><small>One-time setup</small><b>' + cur(r.oneTimeTotal) + '</b></div>' +
        '<div class="kpi"><small>Year one (12 months + setup)</small><b>' + cur(r.yearOneTotal) + '</b></div></div>';
      if (r.budget) h += '<p class="' + (r.budget.over ? 'warnline' : 'okline') + '">' + (r.budget.over ? 'Over budget by ' + cur(-r.budget.headroom) : 'Within budget, headroom ' + cur(r.budget.headroom)) + ' per month.</p>';
      var tgt = num(sf, 'target');
      if (tgt > 0) { var mc = AL.maxCallsForTarget(raw(), tgt); h += '<p class="fine">' + (mc == null ? 'Target cannot be solved: model prices or volume are missing.' : (mc === 0 ? 'Even one model call per task exceeds the target, because other costs already do.' : 'Largest number of model calls per task that fits the target: <b>' + mc + '</b>.')) + '</p>'; }
      h += '<h3>Largest cost drivers (monthly)</h3><div class="tablewrap"><table><thead><tr><th>Component</th><th>Monthly</th><th>Share</th></tr></thead><tbody>' +
        r.drivers.map(function (d) { return '<tr><td>' + esc(d.name) + '</td><td>' + cur(d.monthly) + '</td><td>' + (d.share == null ? 'n/a' : (d.share * 100).toFixed(1) + '%') + '</td></tr>'; }).join('') + '</tbody></table></div>';
      h += '<h3>Sensitivity</h3><div class="tablewrap"><table><thead><tr><th>Change one thing</th><th>Setting</th><th>Monthly total</th><th>Change</th></tr></thead><tbody>' +
        AL.sensitivity(raw()).map(function (row) { return row.points.map(function (pt, i) { return '<tr>' + (i === 0 ? '<td rowspan="' + row.points.length + '" style="white-space:normal">' + esc(row.label) + '</td>' : '') + '<td>' + esc(pt.label) + '</td><td>' + cur(pt.monthlyTotal) + '</td><td>' + pct(pt.deltaPct) + '</td></tr>'; }).join(''); }).join('') + '</tbody></table></div>';
      h += '<h3>Compare scenarios</h3><p><button class="btn" type="button" id="scPin">Pin current as scenario A</button> <button class="btn" type="button" id="scUnpin"' + (pinned ? '' : ' disabled') + '>Clear pin</button></p>';
      if (pinned) {
        var c = AL.compareScenarios(pinned.raw, raw());
        h += '<p>Scenario A' + (pinned.name ? ' (' + esc(pinned.name) + ')' : '') + ' ' + cur(c.a.monthlyTotal) + ' vs current ' + cur(c.b.monthlyTotal) + ' per month: <b>' + pct(c.totalDeltaPct) + '</b>' + (c.biggestDriver ? '. Biggest mover: ' + esc(c.biggestDriver) : '') + '.</p>' +
          '<div class="tablewrap"><table><thead><tr><th>Component</th><th>A</th><th>Current</th><th>Change</th></tr></thead><tbody>' + c.rows.map(function (x) { return '<tr><td>' + esc(x.name) + '</td><td>' + cur(x.a) + '</td><td>' + cur(x.b) + '</td><td>' + pct(x.deltaPct) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      } else h += '<p class="fine">Pin a scenario, change the inputs (or pick another preset), and the differences appear here.</p>';
      h += '<h3>Export</h3><p><button class="btn" type="button" id="scMd">Copy as Markdown</button> <button class="btn" type="button" id="scJson">Copy as JSON</button></p><p class="fine">Exports include the assumptions, the pricing record and a reminder that this is an estimate.</p>';
      out.innerHTML = h;
      $('#scPin').addEventListener('click', function () { pinned = { raw: raw(), name: sf.elements.name.value }; paint(); });
      $('#scUnpin').addEventListener('click', function () { pinned = null; paint(); });
      $('#scMd').addEventListener('click', function () { copyText(AL.scenarioMarkdown(raw(), meta()), this); });
      $('#scJson').addEventListener('click', function () { copyText(JSON.stringify({ meta: meta(), inputs: AL.scenarioCost(raw()).inputs, disclaimer: 'Estimate from user-supplied assumptions, not a quote.' }, null, 2), this); });
    }
    sf.elements.preset.addEventListener('change', function () {
      var id = sf.elements.preset.value; if (!id) return;
      var pr = AL.PRESETS.filter(function (x) { return x.id === id; })[0]; if (!pr) return;
      var patched = AL.applyPreset(raw(), id), k;
      if (legacy.elements.calls) legacy.elements.calls.value = patched.callsPerTask;
      SCEN_EXTRA.forEach(function (g) { g[1].forEach(function (f) { if (pr.patch[f[0]] != null) sf.elements[f[0]].value = pr.patch[f[0]]; }); });
      $('#presetNote').textContent = pr.note + ' Shape only: set your own prices.';
      legacy.dispatchEvent(new Event('input')); paint();
    });
    sf.addEventListener('input', paint); sf.addEventListener('change', paint);
    legacy.addEventListener('input', paint);
    $('#calcReset').addEventListener('click', function () { setTimeout(paint, 0); });
    paint();
  }
  function mountCalculator() {
    var form = $('#calcForm'), out = $('#calcOut'), p = {}, k;
    function fill() { for (k in CALC_DEFAULTS) { p[k] = CALC_DEFAULTS[k]; form.elements[k].value = CALC_DEFAULTS[k]; } }
    function read() {
      for (k in CALC_DEFAULTS) {
        var v = parseFloat(form.elements[k].value); if (!isFinite(v) || v < 0) v = 0;
        if (/^(success|sem|cacheFrac|cacheDisc|batchShare|batchDisc)$/.test(k)) v = Math.min(100, v);
        p[k] = v;
      }
      if (p.calls < 1) p.calls = 1;
    }
    function clone() { var o = {}; for (var x in p) o[x] = p[x]; return o; }
    function paint() {
      var c = calcCost(p), tot = c.inC + c.outC + c.infra || 1;
      var h = '<div class="eyebrow">Result</div><div class="kpis">' +
        '<div class="kpi"><small>Per task</small><b>' + money(c.task) + '</b></div>' +
        '<div class="kpi"><small>Per successful task</small><b>' + money(c.ok) + '</b></div>' +
        '<div class="kpi"><small>Per month (30 days)</small><b>' + money(c.month) + '</b></div>' +
        '<div class="kpi"><small>At 10x volume</small><b>' + money(c.month * 10) + '</b></div></div>';
      h += '<h3>Where the money goes</h3><div class="split" role="img" aria-label="Cost split">' +
        '<span style="width:' + (c.inC / tot * 100) + '%" class="s1"></span><span style="width:' + (c.outC / tot * 100) + '%" class="s2"></span><span style="width:' + (c.infra / tot * 100) + '%" class="s3"></span></div>' +
        '<ul class="legend"><li><i class="s1"></i>Input tokens ' + money(c.inC) + '</li><li><i class="s2"></i>Output tokens ' + money(c.outC) + '</li><li><i class="s3"></i>Other ' + money(c.infra) + '</li></ul>';
      var levers = [
        ['Halve output tokens (tighter prompts, shorter answers)', function (q) { q.outTok *= 0.5; }],
        ['Cache 60% of the prompt', function (q) { q.cacheFrac = Math.max(q.cacheFrac, 60); }],
        ['Answer 25% of tasks from a semantic cache', function (q) { q.sem = Math.max(q.sem, 25); }],
        ['Send half the calls to batch (if the work can wait)', function (q) { q.batchShare = Math.max(q.batchShare, 50); }],
        ['One fewer model call per task', function (q) { q.calls = Math.max(1, q.calls - 1); }],
        ['Route to a model one fifth the price', function (q) { q.pIn /= 5; q.pOut /= 5; }],
        ['Raise the success rate to 95%', function (q) { q.success = Math.max(q.success, 95); }]
      ];
      h += '<h3>What each lever would do</h3><div class="tablewrap"><table><thead><tr><th>Lever</th><th>Per month</th><th>Change</th><th>Per successful task</th></tr></thead><tbody>' +
        levers.map(function (L) {
          var q = clone(); L[1](q); var r = calcCost(q), d = c.month ? (r.month - c.month) / c.month * 100 : 0;
          return '<tr><td style="white-space:normal">' + esc(L[0]) + '</td><td>' + money(r.month) + '</td><td class="' + (d < -0.5 ? 'dn' : (d > 0.5 ? 'up' : '')) + '">' + (Math.abs(d) < 0.5 ? 'no change' : (d > 0 ? '+' : '') + d.toFixed(0) + '%') + '</td><td>' + money(r.ok) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      h += '<p class="fine">Each row changes one thing from your current inputs. Levers are not additive, and each one can cost quality, so re-run your evals after applying it.</p>';
      out.innerHTML = h;
    }
    fill();
    form.addEventListener('input', function () { read(); paint(); });
    $('#calcReset').addEventListener('click', function () { fill(); paint(); });
    read(); paint();
  }

  /* ---------- playbooks ---------- */
  /* ---------- interactive engineering tools ---------- */
  function pageToolsHub() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Engineering Tools</div>' +
      '<h1>AI Engineering Interactive Tools (9)</h1>' +
      '<p class="lede">Decision engines, architecture wizards, risk analyzers, and launch readiness tools built for AI Engineering Managers and Principal Architects leading enterprise AI systems on Google Cloud.</p>' +
      '<div class="tool-hub-grid">' +
      '<a class="tool-hub-card" href="#/tools/compare"><span class="tool-tag">Evaluation</span><h3>1. Service Comparison Engine</h3><p>Side-by-side technical trade-off matrices for Vector Databases, Agent Runtimes, Foundation Models, and Orchestration Frameworks.</p><span class="door two-way">Launch Tool →</span></a>' +
      '<a class="tool-hub-card" href="#/tools/rag-assistant"><span class="tool-tag">Architecture</span><h3>2. RAG Design Assistant</h3><p>5-step interactive sizing & pattern wizard that recommends the exact RAG architecture, vector store, and chunking strategy.</p><span class="door two-way">Launch Tool →</span></a>' +
      '<a class="tool-hub-card" href="#/tools/agent-assistant"><span class="tool-tag">Architecture</span><h3>3. Agent Design Assistant</h3><p>4-step autonomy, tools & orchestration wizard recommending single-agent, router, swarm, or human-in-the-loop patterns.</p><span class="door two-way">Launch Tool →</span></a>' +
      '<a class="tool-hub-card" href="#/tools/risk-analyzer"><span class="tool-tag">Security & Risk</span><h3>4. Architecture Risk Analyzer</h3><p>STRIDE + AI threat risk calculator evaluating system exposure, injection blast radius, and generating mitigation plans.</p><span class="door two-way">Launch Tool →</span></a>' +
      '<a class="tool-hub-card" href="#/tools/readiness-scorecard"><span class="tool-tag">Launch Gate</span><h3>5. Production Readiness Scorecard</h3><p>Interactive 30-point evaluation across Architecture, Data, Evaluation, Security, Operations, and FinOps with weighted score.</p><span class="door two-way">Launch Tool →</span></a>' +
      '<a class="tool-hub-card" href="#/tools/review-gen"><span class="tool-tag">Governance</span><h3>6. Architecture Review Generator</h3><p>Form-driven generator producing formatted markdown ADR / PRR ready to paste into GitHub PRs or Google Docs.</p><span class="door two-way">Launch Tool →</span></a>' +
      '<a class="tool-hub-card" href="#/d/shaper"><span class="tool-tag">Architecture</span><h3>7. Solution Shaper</h3><p>Seven questions in, a starting stack and the decisions to make next out for generative AI and multi-agent systems.</p><span class="door two-way">Launch Tool →</span></a>' +
      '<a class="tool-hub-card" href="#/d/calculator"><span class="tool-tag">FinOps</span><h3>8. Cost per Successful Task Calculator</h3><p>Unit economics calculator factoring in prompt caching, routing ratios, and retry multipliers.</p><span class="door two-way">Launch Tool →</span></a>' +
      '<a class="tool-hub-card" href="#/d/checklists"><span class="tool-tag">Launch Gate</span><h3>9. Readiness Checklists</h3><p>Maturity ladder and production checklists from prototype to enterprise scale.</p><span class="door two-way">Launch Tool →</span></a>' +
      '</div>';
    return h;
  }

  function pageCompare() {
    var tabs = [
      ['vector', 'Vector & Search'],
      ['runtime', 'Agent Runtimes'],
      ['models', 'Foundation Models'],
      ['orch', 'Agent Frameworks']
    ];

    var matrices = {
      vector: {
        cols: ['Vertex AI Search', 'Vertex AI Vector Search', 'BigQuery Vector Search', 'AlloyDB (pgvector)', 'Spanner Graph'],
        rows: [
          ['Target Workload', 'Turnkey managed search, RAG ingestion', 'Large-scale semantic vector retrieval', 'Analytical queries + vector similarity', 'Transactional OLTP + low-latency vector', 'Multi-hop graph + semantic search'],
          ['Ingestion Latency', 'Batch / near-realtime (minutes)', 'Streaming updates (seconds)', 'Streaming inserts into BigQuery', 'Immediate ACID transaction sync', 'Immediate transactional graph updates'],
          ['Query P95 Latency', '80ms - 250ms', '5ms - 20ms (ScaNN index)', '150ms - 800ms', '10ms - 35ms', '25ms - 90ms'],
          ['Max Index Scale', 'Billions of documents', 'Billions of high-dim vectors', 'Petabyte-scale table partitions', 'Tens of millions of vectors', 'Trillions of nodes & edges'],
          ['Filtering & ACLs', 'Built-in document ACLs, metadata filters', 'Metadata restriction tokens (crowding)', 'Native SQL WHERE filters', 'Native SQL & row-level security (RLS)', 'GQL & graph pattern matching'],
          ['Operational Burden', 'Zero-ops (managed SaaS)', 'Low (managed index endpoints)', 'Zero-ops (serverless analytical)', 'Low (managed PostgreSQL)', 'Zero-ops (distributed relational graph)'],
          ['Pricing Driver', 'Per-query search fee + document storage', 'Node-hours for index endpoints + storage', 'Slot-hours or TB scanned', 'Instance vCPU / RAM hours + storage', 'Spanner processing units (PUs) + storage'],
          ['Reference Architecture', '<a href="#/a/rag-production-cache">rag-production-cache</a>', '<a href="#/a/rag-hybrid-search">rag-hybrid-search</a>', '<a href="#/a/rag-temporal-event">rag-temporal-event</a>', '<a href="#/a/rag-agentic-retrieval">rag-agentic-retrieval</a>', '<a href="#/a/rag-graph-spanner">rag-graph-spanner</a>']
        ]
      },
      runtime: {
        cols: ['Vertex AI Agent Engine', 'Cloud Run (FastAPI/ADK)', 'GKE (Kubernetes)', 'Vertex AI Endpoints'],
        rows: [
          ['Target Workload', 'Fully managed Agent runtime & tools', 'Stateless agent APIs, event processors', 'Complex custom runtimes, open models', 'Model inference serving (vLLM/TGI)'],
          ['Cold Start Latency', 'Managed warm pool (~200ms)', 'Sub-second (100ms - 500ms)', 'N/A (warm pods running)', '1s - 5s on autoscaling'],
          ['Max Timeout', '60 minutes', '60 minutes', 'Unlimited', '60 seconds'],
          ['State & Memory', 'Built-in session state & memory bank', 'External (Firestore / Memorystore)', 'Kubernetes stateful sets or DB', 'Stateless inference'],
          ['Custom Binaries', 'Supported via container image', 'Full Linux container support', 'Complete platform & GPU control', 'Inference container image only'],
          ['Autoscaling Speed', 'Automatic managed scaling', 'Instant (0 to 1000s of instances in sec)', 'HPA based on CPU/custom metrics', 'Metric-based instance autoscaling'],
          ['Pricing Model', 'Agent runtime hours + LLM tokens', 'Pay-per-request vCPU/RAM seconds', 'Node VM hours + cluster fee', 'Node-hours per replica'],
          ['Reference Architecture', '<a href="#/a/agent-adk-engine">agent-adk-engine</a>', '<a href="#/a/agent-deterministic-router">agent-deterministic-router</a>', '<a href="#/a/agent-hierarchical-swarm">agent-hierarchical-swarm</a>', '<a href="#/a/genai-fine-tuning-serving">genai-fine-tuning-serving</a>']
        ]
      },
      models: {
        cols: ['Gemini 2.5 Flash', 'Gemini 2.5 Pro', 'Claude 3.7 Sonnet (Vertex)', 'Llama 3.3 70B (vLLM / GKE)'],
        rows: [
          ['Input Pricing / 1M', '$0.075 (<128k) / $0.15 (>128k)', '$1.25 (<128k) / $2.50 (>128k)', '$3.00 / 1M tokens', 'Self-hosted GPU compute cost'],
          ['Output Pricing / 1M', '$0.30 (<128k) / $0.60 (>128k)', '$5.00 (<128k) / $10.00 (>128k)', '$15.00 / 1M tokens', 'Self-hosted GPU compute cost'],
          ['Context Window', '1,048,576 tokens', '2,097,152 tokens', '200,000 tokens', '128,000 tokens'],
          ['P95 TTFT Latency', '180ms - 350ms', '450ms - 900ms', '400ms - 800ms', '80ms - 250ms (dedicated GPU)'],
          ['Structured Output', 'Native JSON Schema (99.8% valid)', 'Native JSON Schema (99.9% valid)', 'High (Tool calling mode)', 'Constrained decoding (vLLM grammar)'],
          ['Multimodal Native', 'Text, Audio, Images, Video, PDF', 'Text, Audio, Images, Video, PDF', 'Text, Images, PDF', 'Text only (unless Vision variant)'],
          ['Reasoning Benchmark', 'Fast reasoning & high-throughput', 'Deep reasoning, coding, complex math', 'Top-tier code, hybrid thinking', 'Strong open-weights alternative'],
          ['Best Production Fit', 'High-volume agents, RAG summarization', 'Multi-agent planners, deep synthesis', 'Complex software engineering tasks', 'Air-gapped, sovereign, low-latency API']
        ]
      },
      orch: {
        cols: ['Google Gen AI ADK', 'LangGraph', 'CrewAI', 'Cloud Workflows / Composer'],
        rows: [
          ['Control Model', 'Code-first Python/TS with Agent Engine', 'Graph-based state machine with cycles', 'Role-playing autonomous agents', 'Deterministic DAG orchestration'],
          ['State Persistence', 'Vertex AI Agent Engine Session API', 'Postgres / Redis checkpointers', 'In-memory / custom vector store', 'Native workflow state / Airflow DB'],
          ['Multi-Agent Protocols', 'Native support for Agent-to-Agent (A2A)', 'Hierarchical & multi-graph coordination', 'Hierarchical manager / process flow', 'Step-based invocation of Cloud Run/APIs'],
          ['Observability', 'OpenTelemetry -> Cloud Trace / Logging', 'LangSmith / OpenTelemetry exporter', 'Custom logging', 'Cloud Logging / Cloud Trace'],
          ['GCP Native Fit', 'First-class Vertex AI & IAM integration', 'Runs on Cloud Run / GKE with custom code', 'Runs on Cloud Run / GKE', 'Built-in GCP identity & security'],
          ['Best Use Case', 'Production enterprise agents on GCP', 'Complex cyclical logic with custom state', 'Rapid prototyping of collaborative agents', 'Deterministic batch ETL & pipeline triggers']
        ]
      }
    };

    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/tools">Tools</a> / Service Comparison Engine</div>' +
      '<h1>Service Comparison Engine</h1>' +
      '<p class="lede">Side-by-side technical trade-off evaluation matrices across Google Cloud AI, data, compute, and orchestration technologies.</p>' +
      '<div class="tabs" id="compTabs" role="tablist">' +
      tabs.map(function (t, i) {
        return '<button type="button" role="tab" class="tab' + (i === 0 ? ' active' : '') + '" data-tab="' + t[0] + '" aria-selected="' + (i === 0 ? 'true' : 'false') + '">' + esc(t[1]) + '</button>';
      }).join('') +
      '</div>';

    tabs.forEach(function (t, i) {
      var mat = matrices[t[0]];
      h += '<div class="comp-wrap comp-panel" id="comp-panel-' + t[0] + '"' + (i === 0 ? '' : ' style="display:none"') + '>' +
        '<table class="comp-table">' +
        '<thead><tr><th>Dimension</th>' +
        mat.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') +
        '</tr></thead><tbody>' +
        mat.rows.map(function (r) {
          return '<tr><td><b>' + esc(r[0]) + '</b></td>' +
            r.slice(1).map(function (v) { return '<td>' + fmt(v) + '</td>'; }).join('') +
            '</tr>';
        }).join('') +
        '</tbody></table></div>';
    });

    afterRender = function () {
      var tbar = $('#compTabs');
      if (!tbar) return;
      var tbtns = $$('.tab', tbar);
      tbtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          tbtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          var tabId = btn.getAttribute('data-tab');
          $$('.comp-panel').forEach(function (p) {
            p.style.display = p.id === 'comp-panel-' + tabId ? '' : 'none';
          });
        });
      });
    };

    return h;
  }

  function pageRagAssistant() {
    var state = { scale: 'medium', latency: 'interactive', fresh: 'batch', depth: 'factual', acl: 'doc_acl' };

    function getRec() {
      if (state.depth === 'multimodal') {
        return {
          arch: 'rag-multimodal-gemini',
          name: 'Multimodal Document Analysis & Visual RAG',
          why: 'Multimodal documents containing complex charts, tables, and scanned diagrams require direct vision processing with Gemini 2.5 and native chunk alignment.',
          store: 'Vertex AI Search (Document AI enabled) or BigQuery Vector Search with multimodal embeddings.',
          chunk: 'Page-level / Section-level chunking preserving embedded images and table bounding boxes.',
          guard: 'Vertex AI Model Armor + Document OCR confidence thresholding.'
        };
      }
      if (state.depth === 'multihop') {
        return {
          arch: 'rag-graph-spanner',
          name: 'GraphRAG with Spanner Graph & Vertex AI',
          why: 'Multi-hop entity relationships and cross-document reasoning cannot be solved by cosine similarity alone; Spanner Graph provides topological path traversal combined with semantic embeddings.',
          store: 'Spanner Graph for entity-relation topology + Vertex AI Vector Search for chunk embeddings.',
          chunk: 'Entity-centric chunking: extract subject-predicate-object triples plus 300-word context windows.',
          guard: 'GQL query sanitization to prevent graph traversal denial of service.'
        };
      }
      if (state.depth === 'analytical' || state.scale === 'structured') {
        return {
          arch: 'rag-temporal-event',
          name: 'Temporal & Event-Driven BigQuery Ingestion RAG',
          why: 'Structured tabular data and analytical questions demand SQL aggregation in BigQuery combined with VECTOR_SEARCH over text attributes.',
          store: 'BigQuery with native VECTOR_SEARCH and partitioned tables.',
          chunk: 'Row-level metadata serialisation or micro-batch analytical snapshots.',
          guard: 'SQL AST parsing & parameterized query execution to eliminate SQL injection.'
        };
      }
      if (state.fresh === 'streaming') {
        return {
          arch: 'rag-temporal-event',
          name: 'Event-Driven Real-Time RAG',
          why: 'Sub-minute freshness requires Pub/Sub event ingestion and Dataflow streaming directly into Vertex AI Vector Search endpoints.',
          store: 'Vertex AI Vector Search streaming index + Memorystore for recent event cache.',
          chunk: 'Stream chunking on message arrival (256 - 512 tokens).',
          guard: 'Dead-letter queues (DLQ) and schema validation on Pub/Sub ingestion.'
        };
      }
      if (state.scale === 'small' && state.acl === 'public') {
        return {
          arch: 'rag-production-cache',
          name: 'Production Enterprise Grounded RAG with Caching',
          why: 'Under 10,000 documents with standard latency requirements is perfectly served by managed Vertex AI Search or Vector Search with Gemini Context Caching.',
          store: 'Vertex AI Search (managed) or AlloyDB pgvector.',
          chunk: 'Hierarchical chunking (parent: 1024 tokens, child: 256 tokens).',
          guard: 'Vertex AI Search automatic Grounding Attributions & Grounding Faithfulness eval.'
        };
      }
      return {
        arch: 'rag-hybrid-search',
        name: 'Hybrid Search RAG (Vector + BM25 Lexical + Reranking)',
        why: 'Enterprise corpus with document-level ACLs requires combining dense semantic vector search with exact keyword (BM25) matching and cross-encoder reranking.',
        store: 'Vertex AI Vector Search + Elasticsearch/BigQuery for BM25, or managed Vertex AI Search.',
        chunk: 'Recursive character chunking (512 tokens with 10% overlap).',
        guard: 'Reciprocal Rank Fusion (RRF) reranker + Vertex AI Model Armor prompt injection guardrails.'
      };
    }

    var rec = getRec();

    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/tools">Tools</a> / RAG Design Assistant</div>' +
      '<h1>RAG Architecture Design Assistant</h1>' +
      '<p class="lede">Select your data scale, latency SLAs, update frequency, and reasoning complexity to receive an optimal Google Cloud RAG architecture recommendation.</p>' +
      '<div class="wiz-box">' +
        '<div class="wiz-step">' +
          '<div class="wiz-step-title">1. Knowledge Corpus Scale</div>' +
          '<div class="wiz-options" data-k="scale">' +
            '<div class="wiz-opt' + (state.scale === 'small' ? ' selected' : '') + '" data-v="small"><div class="wiz-opt-title">Small</div><div class="wiz-opt-desc">&lt;10k docs (&lt;500MB)</div></div>' +
            '<div class="wiz-opt' + (state.scale === 'medium' ? ' selected' : '') + '" data-v="medium"><div class="wiz-opt-title">Medium</div><div class="wiz-opt-desc">10k - 1M docs (500MB - 100GB)</div></div>' +
            '<div class="wiz-opt' + (state.scale === 'massive' ? ' selected' : '') + '" data-v="massive"><div class="wiz-opt-title">Massive</div><div class="wiz-opt-desc">&gt;1M docs (multi-TB)</div></div>' +
            '<div class="wiz-opt' + (state.scale === 'structured' ? ' selected' : '') + '" data-v="structured"><div class="wiz-opt-title">Structured Data</div><div class="wiz-opt-desc">Tabular Data Warehouse (BigQuery)</div></div>' +
          '</div>' +
        '</div>' +

        '<div class="wiz-step">' +
          '<div class="wiz-step-title">2. Query Latency SLA</div>' +
          '<div class="wiz-options" data-k="latency">' +
            '<div class="wiz-opt' + (state.latency === 'realtime' ? ' selected' : '') + '" data-v="realtime"><div class="wiz-opt-title">Ultra-low (&lt;500ms)</div><div class="wiz-opt-desc">Real-time voice / chat autocomplete</div></div>' +
            '<div class="wiz-opt' + (state.latency === 'interactive' ? ' selected' : '') + '" data-v="interactive"><div class="wiz-opt-title">Interactive (1s - 3s)</div><div class="wiz-opt-desc">Conversational copilot / assistant</div></div>' +
            '<div class="wiz-opt' + (state.latency === 'batch' ? ' selected' : '') + '" data-v="batch"><div class="wiz-opt-title">Batch / Deep (&gt;5s)</div><div class="wiz-opt-desc">Multi-doc synthesis / report gen</div></div>' +
          '</div>' +
        '</div>' +

        '<div class="wiz-step">' +
          '<div class="wiz-step-title">3. Ingestion & Freshness</div>' +
          '<div class="wiz-options" data-k="fresh">' +
            '<div class="wiz-opt' + (state.fresh === 'streaming' ? ' selected' : '') + '" data-v="streaming"><div class="wiz-opt-title">Real-Time Streaming</div><div class="wiz-opt-desc">&lt;1 minute from event to searchable</div></div>' +
            '<div class="wiz-opt' + (state.fresh === 'batch' ? ' selected' : '') + '" data-v="batch"><div class="wiz-opt-title">Periodic Batch</div><div class="wiz-opt-desc">Daily / weekly scheduled sync</div></div>' +
            '<div class="wiz-opt' + (state.fresh === 'static' ? ' selected' : '') + '" data-v="static"><div class="wiz-opt-title">Static Corpus</div><div class="wiz-opt-desc">Rarely updated reference docs</div></div>' +
          '</div>' +
        '</div>' +

        '<div class="wiz-step">' +
          '<div class="wiz-step-title">4. Reasoning Depth</div>' +
          '<div class="wiz-options" data-k="depth">' +
            '<div class="wiz-opt' + (state.depth === 'factual' ? ' selected' : '') + '" data-v="factual"><div class="wiz-opt-title">Direct Factual</div><div class="wiz-opt-desc">Single-passage lookup & answering</div></div>' +
            '<div class="wiz-opt' + (state.depth === 'multihop' ? ' selected' : '') + '" data-v="multihop"><div class="wiz-opt-title">Multi-Hop Synthesis</div><div class="wiz-opt-desc">Connecting entities across many docs</div></div>' +
            '<div class="wiz-opt' + (state.depth === 'analytical' ? ' selected' : '') + '" data-v="analytical"><div class="wiz-opt-title">Analytical Aggregation</div><div class="wiz-opt-desc">SQL math + text semantic analysis</div></div>' +
            '<div class="wiz-opt' + (state.depth === 'multimodal' ? ' selected' : '') + '" data-v="multimodal"><div class="wiz-opt-title">Multimodal</div><div class="wiz-opt-desc">Complex tables, charts, scanned PDFs</div></div>' +
          '</div>' +
        '</div>' +

        '<div class="wiz-step">' +
          '<div class="wiz-step-title">5. Access Control & Security</div>' +
          '<div class="wiz-options" data-k="acl">' +
            '<div class="wiz-opt' + (state.acl === 'public' ? ' selected' : '') + '" data-v="public"><div class="wiz-opt-title">Public / Generic</div><div class="wiz-opt-desc">No per-user ACLs needed</div></div>' +
            '<div class="wiz-opt' + (state.acl === 'doc_acl' ? ' selected' : '') + '" data-v="doc_acl"><div class="wiz-opt-title">Document-Level ACLs</div><div class="wiz-opt-desc">Drive / Workspace permission sync</div></div>' +
            '<div class="wiz-opt' + (state.acl === 'row_sec' ? ' selected' : '') + '" data-v="row_sec"><div class="wiz-opt-title">Row/Column Security</div><div class="wiz-opt-desc">Database IAM & user-level isolation</div></div>' +
          '</div>' +
        '</div>' +

        '<div class="wiz-result" id="ragResult">' +
          '<div class="cat-tag">Recommended Blueprint</div>' +
          '<h3 style="margin:4px 0 8px"><a href="#/a/' + rec.arch + '">' + esc(rec.name) + ' →</a></h3>' +
          '<p><b>Why this matches:</b> ' + esc(rec.why) + '</p>' +
          '<ul style="margin:8px 0;padding-left:18px;font-size:13px">' +
            '<li><b>Storage & Retrieval:</b> ' + esc(rec.store) + '</li>' +
            '<li><b>Chunking & Embedding:</b> ' + esc(rec.chunk) + '</li>' +
            '<li><b>Security & Guardrails:</b> ' + esc(rec.guard) + '</li>' +
          '</ul>' +
          '<div style="margin-top:12px"><a class="btn primary" href="#/a/' + rec.arch + '">Open Full 12-Section Architecture Blueprint →</a></div>' +
        '</div>' +
      '</div>';

    afterRender = function () {
      var box = $('.wiz-box');
      if (!box) return;
      $$('.wiz-opt', box).forEach(function (opt) {
        opt.addEventListener('click', function () {
          var k = opt.closest('.wiz-options').getAttribute('data-k');
          var v = opt.getAttribute('data-v');
          $$('.wiz-options[data-k="' + k + '"] .wiz-opt', box).forEach(function (o) { o.classList.remove('selected'); });
          opt.classList.add('selected');
          state[k] = v;
          var r = getRec();
          var resEl = $('#ragResult');
          if (resEl) {
            resEl.innerHTML = '<div class="cat-tag">Recommended Blueprint</div>' +
              '<h3 style="margin:4px 0 8px"><a href="#/a/' + r.arch + '">' + esc(r.name) + ' →</a></h3>' +
              '<p><b>Why this matches:</b> ' + esc(r.why) + '</p>' +
              '<ul style="margin:8px 0;padding-left:18px;font-size:13px">' +
                '<li><b>Storage & Retrieval:</b> ' + esc(r.store) + '</li>' +
                '<li><b>Chunking & Embedding:</b> ' + esc(r.chunk) + '</li>' +
                '<li><b>Security & Guardrails:</b> ' + esc(r.guard) + '</li>' +
              '</ul>' +
              '<div style="margin-top:12px"><a class="btn primary" href="#/a/' + r.arch + '">Open Full 12-Section Architecture Blueprint →</a></div>';
          }
        });
      });
    };

    return h;
  }

  function pageAgentAssistant() {
    var state = { task: 'dynamic', hitl: 'guarded', tools: 'openapi', latency: 'interactive' };

    function getRec() {
      if (state.task === 'swarm') {
        return {
          arch: 'agent-hierarchical-swarm',
          name: 'Hierarchical Supervisor Multi-Agent Swarm',
          why: 'Multi-domain tasks requiring independent specialist subagents need a root supervisor agent orchestrating domain subagents with isolated context windows.',
          runtime: 'GKE or Vertex AI Agent Engine with custom multi-agent routing.',
          state: 'Spanner for ACID task checkpointing + Firestore for ephemeral conversation memory.',
          security: 'Per-agent IAM service accounts; supervisor validates subagent outputs before merging.'
        };
      }
      if (state.hitl === 'guarded' || state.task === 'dynamic' && state.latency === 'critical') {
        return {
          arch: 'agent-human-in-the-loop',
          name: 'Human-in-the-Loop Guarded Agentic Workflow',
          why: 'High-value transactions and irreversible write actions demand deterministic execution boundaries and asynchronous human sign-off via Pub/Sub.',
          runtime: 'Vertex AI Agent Engine with Cloud Run approval service.',
          state: 'Cloud Tasks / Pub/Sub paused task queue + Firestore state persistence.',
          security: 'HMAC signature verification on approval webhooks + Cloud KMS payload encryption.'
        };
      }
      if (state.task === 'dynamic') {
        return {
          arch: 'agent-evaluator-optimizer',
          name: 'Evaluator-Optimizer Agentic Architecture',
          why: 'Iterative goal solving requires a dual-agent pattern: a generator proposes solutions and a specialist evaluator tests against acceptance criteria before finalizing.',
          runtime: 'Vertex AI Agent Engine (Python SDK / ADK).',
          state: 'Vertex AI Agent Session API + Firestore history.',
          security: 'Sandboxed code execution in gVisor container; zero network egress from worker.'
        };
      }
      if (state.tools === 'mcp') {
        return {
          arch: 'agent-mcp-orchestration',
          name: 'MCP-Compliant Multi-Agent System (Model Context Protocol)',
          why: 'Integrating standard desktop tools, local developer environments, and enterprise services requires standardized JSON-RPC Model Context Protocol servers.',
          runtime: 'Cloud Run or GKE hosting MCP server daemons.',
          state: 'Redis / Memorystore for MCP tool call caching.',
          security: 'OAuth2 bearer token exchange + Cloud Armor rate limiting per MCP client.'
        };
      }
      return {
        arch: 'agent-deterministic-router',
        name: 'Deterministic Router with Multi-Agent Fallback',
        why: 'Cost-sensitive user requests should be routed deterministically to fast code or small models, with autonomous agents reserved only for ambiguous goals.',
        runtime: 'Cloud Run (FastAPI/Go router) calling Gemini 2.5 Flash and Pro.',
        state: 'Firestore for session history.',
        security: 'Cloud Armor WAF protecting API endpoints + IAM least privilege.'
      };
    }

    var rec = getRec();

    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/tools">Tools</a> / Agent Design Assistant</div>' +
      '<h1>Agentic Architecture Design Assistant</h1>' +
      '<p class="lede">Select your task complexity, autonomy boundaries, tool integration surface, and latency requirements to determine the optimal Google Cloud multi-agent architecture.</p>' +
      '<div class="wiz-box">' +
        '<div class="wiz-step">' +
          '<div class="wiz-step-title">1. Task Execution Complexity</div>' +
          '<div class="wiz-options" data-k="task">' +
            '<div class="wiz-opt' + (state.task === 'single' ? ' selected' : '') + '" data-v="single"><div class="wiz-opt-title">Single-Turn Tool</div><div class="wiz-opt-desc">Simple API lookup or deterministic action</div></div>' +
            '<div class="wiz-opt' + (state.task === 'linear' ? ' selected' : '') + '" data-v="linear"><div class="wiz-opt-title">Linear Multi-Step</div><div class="wiz-opt-desc">Sequential workflow with known branches</div></div>' +
            '<div class="wiz-opt' + (state.task === 'dynamic' ? ' selected' : '') + '" data-v="dynamic"><div class="wiz-opt-title">Dynamic Goal-Solving</div><div class="wiz-opt-desc">Iterative planning, self-correction & eval</div></div>' +
            '<div class="wiz-opt' + (state.task === 'swarm' ? ' selected' : '') + '" data-v="swarm"><div class="wiz-opt-title">Collaborative Swarm</div><div class="wiz-opt-desc">Multiple specialist subagents cooperating</div></div>' +
          '</div>' +
        '</div>' +

        '<div class="wiz-step">' +
          '<div class="wiz-step-title">2. Autonomy & Human-in-the-Loop</div>' +
          '<div class="wiz-options" data-k="hitl">' +
            '<div class="wiz-opt' + (state.hitl === 'readonly' ? ' selected' : '') + '" data-v="readonly"><div class="wiz-opt-title">Read-Only Autonomy</div><div class="wiz-opt-desc">Search, analyze, summarize (zero write risk)</div></div>' +
            '<div class="wiz-opt' + (state.hitl === 'guarded' ? ' selected' : '') + '" data-v="guarded"><div class="wiz-opt-title">Guarded Write Autonomy</div><div class="wiz-opt-desc">Autonomous read, mandatory human sign-off on writes</div></div>' +
            '<div class="wiz-opt' + (state.hitl === 'supervised' ? ' selected' : '') + '" data-v="supervised"><div class="wiz-opt-title">Supervised Co-Pilot</div><div class="wiz-opt-desc">Human confirms every tool invocation</div></div>' +
          '</div>' +
        '</div>' +

        '<div class="wiz-step">' +
          '<div class="wiz-step-title">3. Tool Breadth & Protocol</div>' +
          '<div class="wiz-options" data-k="tools">' +
            '<div class="wiz-opt' + (state.tools === 'gcp' ? ' selected' : '') + '" data-v="gcp"><div class="wiz-opt-title">GCP Native APIs</div><div class="wiz-opt-desc">BigQuery, Cloud Storage, Spanner APIs</div></div>' +
            '<div class="wiz-opt' + (state.tools === 'openapi' ? ' selected' : '') + '" data-v="openapi"><div class="wiz-opt-title">Enterprise OpenAPI</div><div class="wiz-opt-desc">Internal microservices & REST webhooks</div></div>' +
            '<div class="wiz-opt' + (state.tools === 'mcp' ? ' selected' : '') + '" data-v="mcp"><div class="wiz-opt-title">Model Context Protocol</div><div class="wiz-opt-desc">Standardized MCP servers & local tools</div></div>' +
            '<div class="wiz-opt' + (state.tools === 'a2a' ? ' selected' : '') + '" data-v="a2a"><div class="wiz-opt-title">Agent-to-Agent (A2A)</div><div class="wiz-opt-desc">Cross-team distributed agent protocol</div></div>' +
          '</div>' +
        '</div>' +

        '<div class="wiz-step">' +
          '<div class="wiz-step-title">4. Latency SLA & Resilience</div>' +
          '<div class="wiz-options" data-k="latency">' +
            '<div class="wiz-opt' + (state.latency === 'interactive' ? ' selected' : '') + '" data-v="interactive"><div class="wiz-opt-title">Interactive (&lt;3s)</div><div class="wiz-opt-desc">Synchronous user chat with fallback</div></div>' +
            '<div class="wiz-opt' + (state.latency === 'worker' ? ' selected' : '') + '" data-v="worker"><div class="wiz-opt-title">Background Worker</div><div class="wiz-opt-desc">Asynchronous, multi-minute, auto-retry</div></div>' +
            '<div class="wiz-opt' + (state.latency === 'critical' ? ' selected' : '') + '" data-v="critical"><div class="wiz-opt-title">Mission-Critical</div><div class="wiz-opt-desc">Zero-error tolerance, formal verification</div></div>' +
          '</div>' +
        '</div>' +

        '<div class="wiz-result" id="agentResult">' +
          '<div class="cat-tag">Recommended Blueprint</div>' +
          '<h3 style="margin:4px 0 8px"><a href="#/a/' + rec.arch + '">' + esc(rec.name) + ' →</a></h3>' +
          '<p><b>Why this matches:</b> ' + esc(rec.why) + '</p>' +
          '<ul style="margin:8px 0;padding-left:18px;font-size:13px">' +
            '<li><b>Runtime Platform:</b> ' + esc(rec.runtime) + '</li>' +
            '<li><b>State & Memory Store:</b> ' + esc(rec.state) + '</li>' +
            '<li><b>Security & Isolation:</b> ' + esc(rec.security) + '</li>' +
          '</ul>' +
          '<div style="margin-top:12px"><a class="btn primary" href="#/a/' + rec.arch + '">Open Full 12-Section Architecture Blueprint →</a></div>' +
        '</div>' +
      '</div>';

    afterRender = function () {
      var box = $('.wiz-box');
      if (!box) return;
      $$('.wiz-opt', box).forEach(function (opt) {
        opt.addEventListener('click', function () {
          var k = opt.closest('.wiz-options').getAttribute('data-k');
          var v = opt.getAttribute('data-v');
          $$('.wiz-options[data-k="' + k + '"] .wiz-opt', box).forEach(function (o) { o.classList.remove('selected'); });
          opt.classList.add('selected');
          state[k] = v;
          var r = getRec();
          var resEl = $('#agentResult');
          if (resEl) {
            resEl.innerHTML = '<div class="cat-tag">Recommended Blueprint</div>' +
              '<h3 style="margin:4px 0 8px"><a href="#/a/' + r.arch + '">' + esc(r.name) + ' →</a></h3>' +
              '<p><b>Why this matches:</b> ' + esc(r.why) + '</p>' +
              '<ul style="margin:8px 0;padding-left:18px;font-size:13px">' +
                '<li><b>Runtime Platform:</b> ' + esc(r.runtime) + '</li>' +
                '<li><b>State & Memory Store:</b> ' + esc(r.state) + '</li>' +
                '<li><b>Security & Isolation:</b> ' + esc(r.security) + '</li>' +
              '</ul>' +
              '<div style="margin-top:12px"><a class="btn primary" href="#/a/' + r.arch + '">Open Full 12-Section Architecture Blueprint →</a></div>';
          }
        });
      });
    };

    return h;
  }

  function pageRiskAnalyzer() {
    var rState = { sysType: 'external', dataSens: 'confidential', tools: 'write_low', guards: 'model_armor' };

    function calcRisk() {
      var score = 15;
      if (rState.sysType === 'external') score += 25;
      else if (rState.sysType === 'agent') score += 20;
      else score += 10;

      if (rState.dataSens === 'pii') score += 30;
      else if (rState.dataSens === 'confidential') score += 18;
      else score += 5;

      if (rState.tools === 'write_high') score += 30;
      else if (rState.tools === 'write_low') score += 15;
      else score += 0;

      if (rState.guards === 'none') score += 20;
      else if (rState.guards === 'prompt_only') score += 10;
      else if (rState.guards === 'model_armor') score -= 15;
      else if (rState.guards === 'two_tier') score -= 25;

      score = Math.max(5, Math.min(98, score));
      var lvl = score < 30 ? 'Low' : (score < 60 ? 'Moderate' : (score < 85 ? 'High' : 'Critical'));
      var cls = score < 30 ? 'risk-low' : (score < 60 ? 'risk-med' : (score < 85 ? 'risk-high' : 'risk-crit'));
      return { score: score, level: lvl, cls: cls };
    }

    var cur = calcRisk();

    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/tools">Tools</a> / Architecture Risk Analyzer</div>' +
      '<h1>Architecture Risk Analyzer</h1>' +
      '<p class="lede">Evaluate system exposure, autonomous blast radius, and prompt injection vulnerabilities using the STRIDE threat model tailored for enterprise AI systems.</p>' +
      '<div class="box" style="margin:20px 0">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
          '<div>' +
            '<h3 style="margin:0">Composite Architecture Risk Assessment</h3>' +
            '<p style="color:var(--muted);margin:4px 0 0;font-size:13px">Computed from attack surface exposure, data classification, tool privileges, and active defenses.</p>' +
          '</div>' +
          '<div id="riskBadgeWrap"><span class="risk-score-badge ' + cur.cls + '">' + cur.level + ' Risk · ' + cur.score + ' / 100</span></div>' +
        '</div>' +
        '<div class="risk-meter"><div class="risk-meter-fill ' + cur.cls + '" id="riskBar" style="width:' + cur.score + '%"></div></div>' +
      '</div>' +

      '<div class="bp-grid" style="margin-bottom:24px">' +
        '<div class="bp-item">' +
          '<h4>1. System Exposure</h4>' +
          '<select class="gen-input" id="r_sysType" style="margin-top:6px;width:100%">' +
            '<option value="external" selected>Public Customer-Facing Bot / API</option>' +
            '<option value="internal">Internal Employee Copilot</option>' +
            '<option value="agent">Autonomous Background Worker / Agent</option>' +
          '</select>' +
        '</div>' +
        '<div class="bp-item">' +
          '<h4>2. Data Classification</h4>' +
          '<select class="gen-input" id="r_dataSens" style="margin-top:6px;width:100%">' +
            '<option value="public">Public / Open Data</option>' +
            '<option value="confidential" selected>Confidential Internal IP</option>' +
            '<option value="pii">PII / Financial / Regulated Healthcare</option>' +
          '</select>' +
        '</div>' +
        '<div class="bp-item">' +
          '<h4>3. Tool Execution Privileges</h4>' +
          '<select class="gen-input" id="r_tools" style="margin-top:6px;width:100%">' +
            '<option value="readonly">Read-Only Queries & Lookups</option>' +
            '<option value="write_low" selected>Read + Low-Risk Writes (Drafts, Tags)</option>' +
            '<option value="write_high">Unrestricted Writes / Financial / IAM / DB Updates</option>' +
          '</select>' +
        '</div>' +
        '<div class="bp-item">' +
          '<h4>4. Active Defenses & Guardrails</h4>' +
          '<select class="gen-input" id="r_guards" style="margin-top:6px;width:100%">' +
            '<option value="none">None (Default Base System Prompt)</option>' +
            '<option value="prompt_only">Prompt Hardening & Blacklist Regex</option>' +
            '<option value="model_armor" selected>Vertex AI Model Armor + Content Filters</option>' +
            '<option value="two_tier">Two-Tier Judge Eval + Hard Deterministic Gates</option>' +
          '</select>' +
        '</div>' +
      '</div>' +

      '<h2>STRIDE Threat Matrix Breakdown</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>STRIDE Threat Category</th><th>System Vulnerability Mode</th><th>Mandatory GCP Mitigation</th></tr></thead><tbody>' +
        '<tr><td><b>Spoofing</b></td><td>Adversary impersonates trusted agent or service account</td><td>Enforce Workload Identity Federation (WIF) and mutual TLS (mTLS) with short-lived OAuth tokens.</td></tr>' +
        '<tr><td><b>Tampering</b></td><td>Indirect prompt injection via retrieved third-party documents</td><td>Deploy Vertex AI Model Armor to sanitize retrieval chunks before injecting into prompt context.</td></tr>' +
        '<tr><td><b>Repudiation</b></td><td>Agent performs unlogged transactions or tool actions</td><td>Export Cloud Audit Logs and OpenTelemetry spans capturing every tool payload to BigQuery.</td></tr>' +
        '<tr><td><b>Information Disclosure</b></td><td>System prompt extraction, PII leakage, or vector ACL bypass</td><td>Enable Cloud DLP inspection on output streams; enforce VPC Service Controls (VPC-SC) perimeter.</td></tr>' +
        '<tr><td><b>Denial of Service</b></td><td>Adversary floods tokens or triggers recursive agent loops</td><td>Configure Cloud Armor per-client rate limits and hard token execution budget caps per session.</td></tr>' +
        '<tr><td><b>Elevation of Privilege</b></td><td>Agent tool execution escapes sandbox or accesses root resources</td><td>Run tool containers with non-root users in gVisor sandbox; restrict IAM roles to specific resource IDs.</td></tr>' +
      '</tbody></table></div>' +

      '<div style="margin-top:20px;display:flex;gap:12px">' +
        '<button class="btn primary" type="button" id="copyRiskReport">Copy Risk Assessment Summary</button>' +
      '</div>';

    afterRender = function () {
      function update() {
        rState.sysType = $('#r_sysType').value;
        rState.dataSens = $('#r_dataSens').value;
        rState.tools = $('#r_tools').value;
        rState.guards = $('#r_guards').value;
        var r = calcRisk();
        var badge = $('#riskBadgeWrap');
        if (badge) badge.innerHTML = '<span class="risk-score-badge ' + r.cls + '">' + r.level + ' Risk · ' + r.score + ' / 100</span>';
        var bar = $('#riskBar');
        if (bar) {
          bar.className = 'risk-meter-fill ' + r.cls;
          bar.style.width = r.score + '%';
        }
      }

      ['r_sysType', 'r_dataSens', 'r_tools', 'r_guards'].forEach(function (id) {
        var el = $('#' + id);
        if (el) el.addEventListener('change', update);
      });

      var btn = $('#copyRiskReport');
      if (btn) {
        btn.addEventListener('click', function () {
          var r = calcRisk();
          var md = '# AI Architecture Risk Assessment Report\n\n' +
            '- **System Exposure:** ' + rState.sysType + '\n' +
            '- **Data Classification:** ' + rState.dataSens + '\n' +
            '- **Tool Execution Privileges:** ' + rState.tools + '\n' +
            '- **Active Guardrails:** ' + rState.guards + '\n' +
            '- **Composite Risk Score:** ' + r.score + ' / 100 (' + r.level + ' Risk)\n\n' +
            '## Mandatory Controls Required Before Launch\n' +
            '1. Deploy Vertex AI Model Armor on all inbound user prompts and external retrieval chunks.\n' +
            '2. Enforce zero-trust VPC Service Controls perimeter around BigQuery, Vertex AI, and Cloud Storage.\n' +
            '3. Enforce IAM least-privilege service accounts with Workload Identity Federation.\n' +
            '4. Establish token consumption quotas and rate-limiting via Cloud Armor.\n';
          copyText(md, this);
        });
      }
    };

    return h;
  }

  function pageReadinessScorecard() {
    var categories = [
      {
        name: 'Pillar 1: Architecture & Model Selection',
        items: [
          'Business problem verified to require probabilistic AI rather than deterministic software.',
          'Foundation model selected based on empirical latency/accuracy trade-offs, not benchmark hype.',
          'Context window sized properly; prompt cached for recurring system instructions (Context Caching).',
          'Explicit fallback model / circuit breaker configured for upstream outages or quota exhaustion.',
          'One-way vs two-way door decisions formally documented in an Architecture Decision Record (ADR).'
        ]
      },
      {
        name: 'Pillar 2: Data & Retrieval Quality',
        items: [
          'Chunking strategy evaluated against document layout (semantic vs recursive character).',
          'Embedding model matched to query language, domain vocabulary, and dimensionality.',
          'Vector index recall measured against ground-truth validation set (Hit Rate @ K >= 90%, MRR >= 0.80).',
          'Document-level ACLs or row-level permissions preserved in retrieval results without cross-tenant leakage.',
          'Ingestion pipeline has dead-letter queue (DLQ), deduplication, and schema validation.'
        ]
      },
      {
        name: 'Pillar 3: AI Quality Evaluation & Safety',
        items: [
          'Golden evaluation dataset curated (>=100 curated domain question-answer pairs).',
          'Automated eval pipeline integrated into CI/CD (Groundedness >= 0.90, Faithfulness >= 0.90).',
          'Red-teaming executed for direct and indirect prompt injection attacks.',
          'Vertex AI Model Armor or content safety filters actively blocking toxic outputs.',
          'Hallucination rate benchmarked and verified under business error budget (<3%).'
        ]
      },
      {
        name: 'Pillar 4: Security & Access Control',
        items: [
          'Dedicated least-privilege service account used with Workload Identity Federation (WIF).',
          'System deployed inside a VPC Service Controls (VPC-SC) perimeter to prevent data exfiltration.',
          'Customer-Managed Encryption Keys (CMEK) enabled across all storage buckets, vector indices, and database tables.',
          'Agent tool calls strictly bounded to authorized endpoints with no shell execution.',
          'Audit logging enabled for all prompt inputs, tool calls, and model outputs.'
        ]
      },
      {
        name: 'Pillar 5: Observability & Production SRE',
        items: [
          'OpenTelemetry distributed tracing captures user query -> retrieval -> LLM -> response.',
          '10-widget production AI dashboard active in Cloud Monitoring.',
          'Alerts configured for P95 TTFT, 429 quota exhaustion, and token burn rate.',
          'Documented SRE runbooks ready for 429 rate-limiting and retrieval degradation.',
          'Automated rollback trigger defined if production evaluation score drops by >5%.'
        ]
      },
      {
        name: 'Pillar 6: FinOps & Unit Economics',
        items: [
          'Cost per successful task calculated and verified against business unit margins.',
          'Context Caching enabled for prompts > 32,768 tokens (achieving 75% savings).',
          'Cloud Billing budget alerts configured at 50%, 80%, and 100% of monthly budget.',
          'Rate limits and per-user token quotas enforced via Cloud Armor or API Gateway.',
          'Batch prediction utilized for asynchronous workloads (50% cost reduction).'
        ]
      }
    ];

    var totalItems = 30;

    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/tools">Tools</a> / Production Readiness Scorecard</div>' +
      '<h1>AI Production Readiness Scorecard</h1>' +
      '<p class="lede">Interactive 30-point evaluation across Architecture, Data, Evaluation, Security, Operations, and FinOps. Calculate your go/no-go readiness score before signing off on production launch.</p>' +
      '<div class="box" style="margin:20px 0">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
          '<div>' +
            '<h3 style="margin:0">Production Launch Gate Score</h3>' +
            '<p style="color:var(--muted);margin:4px 0 0;font-size:13px">Threshold for production: >= 27 / 30 items passed (90%).</p>' +
          '</div>' +
          '<div id="scoreVerdictWrap"><span class="door mixed" id="scoreVerdict">0 / ' + totalItems + ' Passed (0%) · Gated</span></div>' +
        '</div>' +
        '<div class="risk-meter"><div class="risk-meter-fill risk-med" id="scoreBar" style="width:0%"></div></div>' +
      '</div>';

    categories.forEach(function (cat, cIdx) {
      h += '<div class="scorecard-cat">' +
        '<div class="scorecard-cat-header">' +
          '<b>' + esc(cat.name) + '</b>' +
          '<span class="cnt" id="cat-count-' + cIdx + '">0 / ' + cat.items.length + '</span>' +
        '</div>';
      cat.items.forEach(function (it, iIdx) {
        var id = 'sc-' + cIdx + '-' + iIdx;
        h += '<div class="scorecard-chk">' +
          '<input type="checkbox" id="' + id + '" data-c="' + cIdx + '">' +
          '<label for="' + id + '">' + fmt(it) + '</label>' +
        '</div>';
      });
      h += '</div>';
    });

    h += '<div style="margin:24px 0;display:flex;gap:12px">' +
      '<button class="btn primary" type="button" id="copyScorecard">Copy PRR Launch Scorecard</button>' +
    '</div>';

    afterRender = function () {
      function updateScore() {
        var checked = $$('.scorecard-chk input:checked');
        var passed = checked.length;
        var pct = Math.round((passed / totalItems) * 100);
        var verdict = passed >= 27 ? 'READY FOR PRODUCTION (GREEN)' : (passed >= 20 ? 'CONDITIONALLY GATED (AMBER)' : 'BLOCKED FOR PRODUCTION (RED)');
        var cls = passed >= 27 ? 'two-way' : (passed >= 20 ? 'mixed' : 'one-way');
        var vEl = $('#scoreVerdict');
        if (vEl) {
          vEl.className = 'door ' + cls;
          vEl.textContent = passed + ' / ' + totalItems + ' Passed (' + pct + '%) · ' + verdict;
        }
        var bar = $('#scoreBar');
        if (bar) {
          bar.style.width = pct + '%';
          bar.className = 'risk-meter-fill ' + (passed >= 27 ? 'risk-low' : (passed >= 20 ? 'risk-med' : 'risk-crit'));
        }

        categories.forEach(function (cat, cIdx) {
          var cChecked = $$('.scorecard-chk input[data-c="' + cIdx + '"]:checked').length;
          var el = $('#cat-count-' + cIdx);
          if (el) el.textContent = cChecked + ' / ' + cat.items.length;
        });
      }

      $$('.scorecard-chk input').forEach(function (chk) {
        chk.addEventListener('change', updateScore);
      });

      var btn = $('#copyScorecard');
      if (btn) {
        btn.addEventListener('click', function () {
          var checked = $$('.scorecard-chk input:checked');
          var passed = checked.length;
          var pct = Math.round((passed / totalItems) * 100);
          var verdict = passed >= 27 ? 'READY FOR PRODUCTION (GREEN)' : (passed >= 20 ? 'CONDITIONALLY GATED (AMBER)' : 'BLOCKED FOR PRODUCTION (RED)');

          var md = '# AI Production Readiness Review (PRR) Scorecard\n\n' +
            '- **Status:** ' + verdict + '\n' +
            '- **Score:** ' + passed + ' / ' + totalItems + ' (' + pct + '%)\n' +
            '- **Date:** ' + new Date().toISOString().split('T')[0] + '\n\n' +
            '## Verified Criteria Checklist\n';

          categories.forEach(function (cat, cIdx) {
            md += '### ' + cat.name + '\n';
            cat.items.forEach(function (it, iIdx) {
              var isDone = $('#sc-' + cIdx + '-' + iIdx).checked;
              md += '- [' + (isDone ? 'x' : ' ') + '] ' + it + '\n';
            });
            md += '\n';
          });

          copyText(md, this);
        });
      }
    };

    return h;
  }

  function pageReviewGen() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/tools">Tools</a> / Architecture Review Generator</div>' +
      '<h1>Architecture Review (ADR / PRR) Generator</h1>' +
      '<p class="lede">Fill out your system parameters to instantly generate a standardized, production-grade Architecture Decision Record (ADR) and Production Readiness Review (PRR) in markdown format.</p>' +
      '<div class="box" style="margin:20px 0">' +
        '<div class="bp-grid">' +
          '<div class="bp-item"><h4>System / Feature Name</h4><input class="gen-input" id="rg_name" value="Enterprise Customer Support Agent" style="width:100%"></div>' +
          '<div class="bp-item"><h4>Owner & Engineering Lead</h4><input class="gen-input" id="rg_owner" value="AI Engineering Team / Platform EM" style="width:100%"></div>' +
          '<div class="bp-item"><h4>Primary Architecture Pattern</h4>' +
            '<select class="gen-input" id="rg_arch" style="width:100%">' +
              A.architectures.map(function(a){ return '<option value="' + a.id + '">' + esc(a.name) + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div class="bp-item"><h4>Foundation Model</h4>' +
            '<select class="gen-input" id="rg_model" style="width:100%">' +
              '<option value="Gemini 2.5 Flash">Gemini 2.5 Flash (Low latency, high throughput)</option>' +
              '<option value="Gemini 2.5 Pro">Gemini 2.5 Pro (Deep reasoning, multi-turn coding)</option>' +
              '<option value="Claude 3.7 Sonnet">Claude 3.7 Sonnet on Vertex AI</option>' +
              '<option value="Llama 3.3 70B">Llama 3.3 70B on Model Garden / vLLM</option>' +
            '</select>' +
          '</div>' +
          '<div class="bp-item"><h4>Storage & Vector Strategy</h4>' +
            '<select class="gen-input" id="rg_store" style="width:100%">' +
              '<option value="Vertex AI Search (Managed RAG)">Vertex AI Search (Managed RAG)</option>' +
              '<option value="Vertex AI Vector Search + Cloud Storage">Vertex AI Vector Search + Cloud Storage</option>' +
              '<option value="BigQuery Vector Search">BigQuery Vector Search</option>' +
              '<option value="AlloyDB (pgvector)">AlloyDB (pgvector)</option>' +
              '<option value="Spanner Graph">Spanner Graph (GraphRAG)</option>' +
            '</select>' +
          '</div>' +
          '<div class="bp-item"><h4>Monthly Token Budget ($)</h4><input class="gen-input" id="rg_budget" value="$2,500 / month" style="width:100%"></div>' +
        '</div>' +
        '<div style="margin-top:16px"><button class="btn primary" type="button" id="btnGenReview">Generate ADR & Review Document</button></div>' +
      '</div>' +

      '<div class="box" style="margin:20px 0">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<h3 style="margin:0">Generated Architecture Review Document</h3>' +
          '<button class="btn" type="button" id="copyGenReview">Copy Markdown</button>' +
        '</div>' +
        '<pre class="adr" id="reviewOutput" style="margin-top:12px">Click "Generate ADR & Review Document" above to produce your markdown architecture review.</pre>' +
      '</div>';

    afterRender = function () {
      function generate() {
        var name = $('#rg_name').value;
        var owner = $('#rg_owner').value;
        var archId = $('#rg_arch').value;
        var arch = archById[archId];
        var model = $('#rg_model').value;
        var store = $('#rg_store').value;
        var budget = $('#rg_budget').value;

        var md = '# Architecture Decision Record (ADR): ' + name + '\n\n' +
          '**Status:** APPROVED\n' +
          '**Date:** ' + new Date().toISOString().split('T')[0] + '\n' +
          '**Deciders:** ' + owner + '\n' +
          '**Reference Architecture:** ' + (arch ? arch.name + ' (#' + arch.id + ')' : archId) + '\n\n' +
          '## 1. Context & Problem Statement\n' +
          'We need to build and operate ' + name + ' with deterministic cost control, production-grade security, and measurable retrieval quality.\n\n' +
          '## 2. Decision\n' +
          '- **Foundation Model:** ' + model + ' with automatic fallback and context caching.\n' +
          '- **Data & Retrieval Store:** ' + store + '.\n' +
          '- **Serving & Runtime:** Cloud Run / Vertex AI Agent Engine with least-privilege IAM service accounts.\n' +
          '- **Budget Limit:** Hard budget threshold alert set at ' + budget + '.\n\n' +
          '## 3. Security & Governance Guardrails\n' +
          '- Deployed inside VPC Service Controls (VPC-SC) perimeter.\n' +
          '- Inbound prompt sanitization via Vertex AI Model Armor.\n' +
          '- Full OpenTelemetry distributed tracing exported to Cloud Trace and BigQuery.\n\n' +
          '## 4. Evaluation & Production Release Gates\n' +
          '- Groundedness & Faithfulness threshold >= 0.90 evaluated via Vertex AI AutoSxS.\n' +
          '- Latency SLA: P95 Time-to-First-Token <= 800ms.\n' +
          '- Hallucination rate bounded to < 3% on golden test dataset.\n';

        var out = $('#reviewOutput');
        if (out) out.textContent = md.replace(/\\n/g, '\n');
      }

      var genBtn = $('#btnGenReview');
      if (genBtn) genBtn.addEventListener('click', generate);

      var copyBtn = $('#copyGenReview');
      if (copyBtn) {
        copyBtn.addEventListener('click', function () {
          var text = $('#reviewOutput').textContent;
          copyText(text, this);
        });
      }
    };

    return h;
  }

  function pagePlaybooksIndex() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Playbooks</div>' +
      '<h1>AI Engineering Playbooks</h1>' +
      '<p class="lede">Comprehensive engineering playbooks for engineering leaders and principal architects designing, hardening, and operating generative AI systems on Google Cloud.</p>' +
      '<div class="grid">';
    A.engineeringPlaybooks.forEach(function (p) {
      h += '<a class="card" style="--h:215" href="#/p/' + p.id + '">' +
        '<div class="mini">' + esc(p.badge) + '</div>' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<p>' + esc(p.tag) + '</p>' +
        '</a>';
    });
    h += '</div>';
    return h;
  }

  var TOOL_NAMES = { compare: 'Service comparison engine', 'rag-assistant': 'RAG architecture design assistant', 'agent-assistant': 'Agentic architecture design assistant', 'risk-analyzer': 'Architecture risk analyzer', 'readiness-scorecard': 'Production readiness scorecard', 'review-gen': 'Architecture review generator', shaper: 'Solution shaper', checklists: 'Readiness checklists', calculator: 'Cost per task calculator' };
  var PAGE_NAMES = { gov: 'Security & Governance', ops: 'Operations & Reliability', toolkit: 'Toolkit & Templates', labs: 'Labs & Roadmaps' };
  function pagePlaybook(id) {
    var pb = A.engineeringPlaybooks.find(function (p) { return p.id === id; });
    if (!pb) return notFound();
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/p">Playbooks</a></div>' +
      '<h1>' + esc(pb.title) + '</h1>' +
      '<div style="margin:8px 0 16px"><span class="chip" style="--h:215">' + esc(pb.badge) + '</span></div>' +
      '<p class="lede">' + esc(pb.tag) + '</p>' +
      '<div class="callout"><b>Playbook Scope & Context</b>' + fmt(pb.intro) + '</div>';

    if (pb.glance) {
      var g = pb.glance;
      h += '<section class="glance" aria-label="Playbook at a glance"><h2>At a glance</h2><dl>' +
        (g.purpose ? '<div><dt>Purpose</dt><dd>' + fmt(g.purpose) + '</dd></div>' : '') +
        (g.triggers && g.triggers.length ? '<div><dt>Use it when</dt><dd>' + ul(g.triggers) + '</dd></div>' : '') +
        (g.roles && g.roles.length ? '<div><dt>Roles</dt><dd>' + ul(g.roles) + '</dd></div>' : '') +
        (g.artefacts && g.artefacts.length ? '<div><dt>Artefacts produced</dt><dd>' + ul(g.artefacts) + '</dd></div>' : '') +
        (g.exit && g.exit.length ? '<div><dt>Exit criteria</dt><dd>' + ul(g.exit) + '</dd></div>' : '') +
        '</dl></section>';
    }
    if (pb.lastReviewed) {
      h += '<p class="fine">Last edited: ' + esc(pb.lastReviewed) + '. This is an editorial date and does not mean Google product facts were re-verified. ' +
        '<a href="' + issueLink('Playbook issue: ' + pb.title) + '" target="_blank" rel="noopener">Report an issue ↗</a></p>';
    }

    (pb.sections || []).forEach(function (sec) {
      h += '<h2>' + esc(sec.title) + '</h2>';
      if (sec.body) h += paras(sec.body);
      if (sec.table && sec.table.cols) {
        h += '<div class="tablewrap" tabindex="0" role="region" aria-label="' + esc(sec.title) + ' table"><table class="matrix-table"><thead><tr>' +
          sec.table.cols.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          sec.table.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<th scope="row">' + fmt(c) + '</th>' : '<td>' + fmt(c) + '</td>'; }).join('') + '</tr>'; }).join('') +
          '</tbody></table></div>';
      }
      if (sec.bullets && sec.bullets.length) h += ul(sec.bullets);
      if (sec.code) h += '<pre class="adr" tabindex="0">' + esc(sec.code) + '</pre>';
      if (sec.tips && sec.tips.length) {
        h += '<div class="box warn" style="margin-top:14px"><h3>Engineering Rules & Best Practices</h3>' + ul(sec.tips) + '</div>';
      }
    });

    if (pb.see && pb.see.length) {
      h += '<h2>Connected Architectures & Decisions</h2><div class="pairs">' +
        pb.see.map(function (r) {
          var p = r.split(':');
          if (p[0] === 'arch' && archById[p[1]]) return '<a href="#/a/' + p[1] + '">📐 ' + esc(archById[p[1]].name) + '</a>';
          if (p[0] === 'dec' && decById[p[1]]) return '<a href="#/d/' + p[1] + '">⚖️ ' + esc(decById[p[1]].title) + '</a>';
          if (p[0] === 'svc' && byId[p[1]]) return '<a href="#/s/' + p[1] + '">📦 ' + esc(byId[p[1]].name) + '</a>';
          if (p[0] === 'pb') { var q = A.engineeringPlaybooks.find(function (x) { return x.id === p[1]; }); if (q) return '<a href="#/p/' + p[1] + '">📘 ' + esc(q.title) + '</a>'; }
          if (p[0] === 'lab') { var ll = ((A.labs && A.labs.localLabs) || []).find(function (x) { return x.id === p[1]; }); if (ll) return '<a href="#/labs">🧪 Local lab: ' + esc(ll.title) + '</a>'; }
          if (p[0] === 'tool' && TOOL_NAMES[p[1]]) return '<a href="#/tools/' + p[1] + '">🛠️ ' + esc(TOOL_NAMES[p[1]]) + '</a>';
          if (p[0] === 'page' && PAGE_NAMES[p[1]]) return '<a href="#/' + p[1] + '">🗂️ ' + esc(PAGE_NAMES[p[1]]) + '</a>';
          return '';
        }).filter(Boolean).join('') + '</div>';
    }

    var pi = A.engineeringPlaybooks.indexOf(pb);
    var prevP = A.engineeringPlaybooks[pi - 1], nextP = A.engineeringPlaybooks[pi + 1];
    h += '<div class="pn">' +
      (prevP ? '<a href="#/p/' + prevP.id + '"><small>← Previous Playbook</small>' + esc(prevP.title) + '</a>' : '<span></span>') +
      (nextP ? '<a href="#/p/' + nextP.id + '"><small>Next Playbook →</small>' + esc(nextP.title) + '</a>' : '') +
      '</div>';

    return h;
  }

  /* ---------- governance ---------- */
  function pageGovernance() {
    var g = A.governance;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Security & Governance</div>' +
      '<h1>Enterprise AI Security, Governance & Google Cloud Landing Zones</h1>' +
      '<p class="lede">Operationalizing generative AI within Google Cloud enterprise landing zones, Resource Manager folder hierarchy, zero-trust network boundaries, and defense-in-depth security controls.</p>';

    // CAF Landing Zone
    h += '<h2>' + esc(g.landingZones.title) + '</h2>' +
      '<p>' + fmt(g.landingZones.intro) + '</p>' +
      '<div class="lists two" style="margin:16px 0">' +
      g.landingZones.principles.map(function (p) {
        return '<div class="box"><h3>' + esc(p.name) + '</h3><p>' + fmt(p.desc) + '</p></div>';
      }).join('') + '</div>';

    h += '<h3>Enterprise Management Group Hierarchy</h3>' +
      '<p style="max-width:62ch">Structure subscriptions to separate shared foundational model capacity and central API gateways from application workload teams.</p>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Management Group Level</th><th>Target Scope</th><th>Architecture Purpose</th></tr></thead><tbody>' +
      g.landingZones.hierarchy.map(function (row) {
        return '<tr><td><b>' + esc(row.level) + '</b></td><td>' + esc(row.scope) + '</td><td>' + fmt(row.purpose) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    h += '<h3>Zero-Trust Network Topology: ' + esc(g.landingZones.networkTopology.type) + '</h3>' +
      '<div class="grid" style="margin:16px 0">' +
      g.landingZones.networkTopology.components.map(function (c) {
        return '<div class="card" style="--h:215"><div class="mini">Network Component</div><h3>' + esc(c.name) + '</h3><p>' + fmt(c.desc) + '</p></div>';
      }).join('') + '</div>';

    // Security Framework
    h += '<h2>' + esc(g.securityFramework.title) + '</h2>' +
      '<p>' + fmt(g.securityFramework.intro) + '</p>' +
      '<div class="grid" style="margin:16px 0">' +
      g.securityFramework.pillars.map(function (p) {
        return '<div class="box" style="margin-bottom:8px"><h3>' + esc(p.name) + '</h3>' + ul(p.controls) + '</div>';
      }).join('') + '</div>';

    // Tenancy Models
    h += '<h2>' + esc(g.tenancyModels.title) + '</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Isolation Model</th><th>Best Fit</th><th>Mechanism</th><th>Pros</th><th>Cons</th></tr></thead><tbody>' +
      g.tenancyModels.models.map(function (m) {
        return '<tr><td><b>' + esc(m.name) + '</b></td><td>' + fmt(m.fit) + '</td><td>' + fmt(m.mechanism) + '</td><td><span style="color:var(--ok)">' + fmt(m.pros) + '</span></td><td><span style="color:var(--warn)">' + fmt(m.cons) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>';

    // Policy Initiatives
    h += '<h2>' + esc(g.policyInitiatives.title) + '</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Org Policy / Guardrail Name</th><th>Enforcement Effect</th><th>Compliance & Security Purpose</th></tr></thead><tbody>' +
      g.policyInitiatives.policies.map(function (pol) {
        var effectColor = pol.effect === 'Deny' ? 'var(--warn)' : 'var(--accent)';
        return '<tr><td><b>' + esc(pol.name) + '</b></td><td><code style="color:' + effectColor + '">' + esc(pol.effect) + '</code></td><td>' + fmt(pol.purpose) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    return h;
  }

  /* ---------- operations ---------- */
  function pageOperations() {
    var op = A.operations;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Operations</div>' +
      '<h1>' + esc(op.title) + '</h1>' +
      '<p class="lede">' + fmt(op.lede) + '</p>';

    // Dashboard Template
    h += '<h2>' + esc(op.dashboardTemplate.title) + '</h2>' +
      '<p class="fine">' + esc(op.dashboardTemplate.subtitle) + '</p>' +
      '<div class="dash-grid">';

    op.dashboardTemplate.widgets.forEach(function (w) {
      h += '<div class="dash-card">' +
        '<div class="dash-top">' +
          '<h4>' + esc(w.title) + '</h4>' +
          '<span class="status-pill ' + (w.status === 'ok' ? 'ok' : 'warn') + '">● ' + esc(w.status) + '</span>' +
        '</div>' +
        '<div class="dash-metric">' + esc(w.metric) + '</div>' +
        '<div class="dash-sub">' + esc(w.sub) + '</div>' +
        '<div class="dash-target">' + esc(w.target) + '</div>' +
        '<div style="margin-top:auto;padding-top:10px;display:flex;justify-content:space-between;align-items:center">' +
          '<button class="btn-sm" type="button" data-toggle-kql="' + w.id + '">View Query ⤢</button>' +
          '<button class="btn-sm" type="button" data-copy="' + esc(w.kusto || w.query || '') + '">Copy Query</button>' +
        '</div>' +
        '<div class="kql-box" id="kql-' + w.id + '" hidden>' + esc(w.kusto) + '</div>' +
      '</div>';
    });
    h += '</div>';

    // Runbooks
    h += '<h2>Production SRE Incident Runbooks</h2>' +
      '<p style="max-width:62ch">Step-by-step remediation procedures for on-call engineers when stochastic or capacity anomalies trigger high-severity alerts.</p>';

    op.runbooks.forEach(function (rb) {
      var sevColor = rb.severity.indexOf('P1') > -1 ? 'var(--warn)' : 'var(--accent)';
      h += '<div class="box" style="margin:16px 0;border-left:5px solid ' + sevColor + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
          '<h3>' + esc(rb.title) + '</h3>' +
          '<span class="door ' + (rb.severity.indexOf('P1') > -1 ? 'one-way' : 'two-way') + '">' + esc(rb.severity) + '</span>' +
        '</div>' +
        '<p style="margin:8px 0;color:var(--muted)"><b>Trigger Condition:</b> ' + fmt(rb.trigger) + '</p>' +
        '<h4>Remediation Steps:</h4>' +
        '<ol style="margin:8px 0;padding-left:22px">' +
        rb.steps.map(function (st) { return '<li style="margin:6px 0">' + fmt(st) + '</li>'; }).join('') +
        '</ol>' +
      '</div>';
    });

    // Postmortem Template
    var pm = op.postmortemTemplate;
    h += '<h2>' + esc(pm.title) + '</h2>' +
      '<p>' + fmt(pm.intro) + '</p>' +
      '<div style="margin:12px 0 8px;display:flex;justify-content:flex-end">' +
        '<button class="btn" type="button" id="copyPostmortem">Copy Postmortem Template</button>' +
      '</div>' +
      '<pre class="adr">' + esc(pm.templateMarkdown) + '</pre>';

    afterRender = function () {
      $$('button[data-toggle-kql]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-toggle-kql');
          var target = $('#kql-' + id);
          if (target) {
            target.hidden = !target.hidden;
            this.textContent = target.hidden ? 'View Query ⤢' : 'Hide Query ⤹';
          }
        });
      });
      $$('button[data-copy]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          copyText(this.getAttribute('data-copy'), this);
        });
      });
      var copyPmBtn = $('#copyPostmortem');
      if (copyPmBtn) {
        copyPmBtn.addEventListener('click', function () {
          copyText(pm.templateMarkdown, this);
        });
      }
    };

    return h;
  }

  /* ---------- toolkit ---------- */
  function pageToolkit() {
    var tk = A.toolkit;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Manager Toolkit</div>' +
      '<h1>' + esc(tk.title) + '</h1>' +
      '<p class="lede">' + fmt(tk.lede) + '</p>';

    // 8 Copyable Leadership Templates
    if (tk.templates && tk.templates.length) {
      h += '<h2>8 Copyable Production AI Engineering Templates</h2>' +
        '<p style="max-width:72ch">Standardized markdown templates for engineering managers, principal engineers, and architects. Copy directly into your repositories, pull requests, and review meetings.</p>' +
        '<div class="grid" style="margin:20px 0">';
      tk.templates.forEach(function (t, i) {
        h += '<div class="box" style="margin:0;display:flex;flex-direction:column;justify-content:space-between">' +
          '<div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
              '<span class="cat-tag">' + esc(t.badge) + '</span>' +
              '<button class="btn btn-sm copy-tmpl-btn" type="button" data-idx="' + i + '">Copy Template</button>' +
            '</div>' +
            '<h3 style="margin:4px 0 6px">' + esc(t.title) + '</h3>' +
            '<p style="color:var(--muted);font-size:13px;line-height:1.5">' + fmt(t.desc) + '</p>' +
          '</div>' +
          '<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600;font-size:12px;color:var(--accent)">Preview Markdown</summary>' +
            '<pre class="adr" style="margin-top:8px;font-size:11px;max-height:220px;overflow-y:auto">' + esc(t.markdown) + '</pre>' +
          '</details>' +
        '</div>';
      });
      h += '</div>';
    }

    // 12 Industry Use Cases
    if (tk.useCaseCatalog && tk.useCaseCatalog.length) {
      h += '<h2>12 Enterprise Industry Use Cases & Service Stacks</h2>' +
        '<p style="max-width:72ch">Concrete enterprise AI blueprints with quantified business KPIs, recommended architectures, and Google Cloud service stacks.</p>' +
        '<div class="grid" style="margin:20px 0">';
      tk.useCaseCatalog.forEach(function (uc) {
        h += '<div class="card" style="--h:215">' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<span class="cat-tag">' + esc(uc.domain) + '</span>' +
            '<span class="door two-way" style="font-size:10px">' + esc(uc.suitability) + '</span>' +
          '</div>' +
          '<h3 style="margin:8px 0 6px">' + esc(uc.title) + '</h3>' +
          '<p style="font-size:13px;color:var(--muted);line-height:1.5">' + fmt(uc.desc) + '</p>' +
          '<div style="margin:10px 0;font-size:12px"><b>Target KPI:</b> <code style="color:var(--ok)">' + esc(uc.kpi) + '</code></div>' +
          '<div style="font-size:12px"><b>Architecture:</b> <a href="#/a/' + uc.arch + '">#' + esc(uc.arch) + ' →</a></div>' +
        '</div>';
      });
      h += '</div>';
    }

    // Daily Cockpit Operating Checklists
    if (tk.dailyCockpit) {
      h += '<h2>' + esc(tk.dailyCockpit.title) + '</h2>' +
        '<p>' + fmt(tk.dailyCockpit.intro) + '</p>' +
        '<div class="grid" style="margin:20px 0">';
      (tk.dailyCockpit.domains || []).forEach(function (dom) {
        h += '<div class="box">' +
          '<h3>' + esc(dom.name || dom.title || '') + '</h3>' +
          '<ul style="margin:8px 0;padding-left:18px;font-size:13px">' +
          (dom.items || dom.questions || []).map(function (it) { return '<li style="margin:6px 0">' + fmt(it) + '</li>'; }).join('') +
          '</ul>' +
        '</div>';
      });
      h += '</div>';
    }

    // Use Case Assessment
    h += '<h2>' + esc(tk.useCaseAssessment.title) + '</h2>' +
      '<p>' + fmt(tk.useCaseAssessment.intro) + '</p>' +
      '<div class="lists two" style="margin:16px 0">';
    tk.useCaseAssessment.dimensions.forEach(function (dim) {
      h += '<div class="box"><h3>' + esc(dim.category) + '</h3><ul style="margin:6px 0;padding-left:18px">' +
        dim.criteria.map(function (cr) { return '<li style="margin:5px 0"><b>' + esc(cr.name) + ':</b> ' + fmt(cr.desc) + '</li>'; }).join('') +
        '</ul></div>';
    });
    h += '</div>' +
      '<h3>Decision & Prioritization Matrix</h3>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Score Range</th><th>Verdict</th><th>Recommended Leadership Action</th></tr></thead><tbody>' +
      tk.useCaseAssessment.scoringMatrix.map(function (row) {
        return '<tr><td><b>' + esc(row.range) + '</b></td><td><span class="door two-way">' + esc(row.verdict) + '</span></td><td>' + fmt(row.action) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    // Project Estimation
    h += '<h2>' + esc(tk.projectEstimation.title) + '</h2>' +
      '<p>' + fmt(tk.projectEstimation.intro) + '</p>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Delivery Phase</th><th>Headcount Allocation</th><th>Core Engineering Deliverables</th></tr></thead><tbody>' +
      tk.projectEstimation.phases.map(function (p) {
        return '<tr><td><b>' + esc(p.name) + '</b></td><td><code style="color:var(--accent)">' + esc(p.alloc) + '</code></td><td>' + fmt(p.deliverables) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    // RACI Matrix
    h += '<h2>' + esc(tk.raciMatrix.title) + '</h2>' +
      '<p>' + fmt(tk.raciMatrix.intro) + '</p>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Key Engineering Activity</th>' +
      tk.raciMatrix.roles.map(function (r) { return '<th>' + esc(r) + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      tk.raciMatrix.matrix.map(function (row) {
        function badge(r) {
          var cls = r === 'R' ? 'raci-r' : (r === 'A' ? 'raci-a' : (r === 'C' ? 'raci-c' : 'raci-i'));
          return '<span class="raci-badge ' + cls + '">' + r + '</span>';
        }
        return '<tr><td><b>' + esc(row.task) + '</b></td>' +
          row.raci.map(function (rc) { return '<td style="text-align:center">' + badge(rc) + '</td>'; }).join('') +
          '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="fine"><b>R</b>esponsible · <b>A</b>ccountable · <b>C</b>onsulted · <b>I</b>nformed</p>';

    // RAID Tracker
    h += '<h2>' + esc(tk.raidTracker.title) + '</h2>' +
      '<p>' + fmt(tk.raidTracker.intro) + '</p>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Type</th><th>Risk / Assumption / Issue / Dependency</th><th>Mitigation, validation or resolution</th></tr></thead><tbody>' +
      tk.raidTracker.items.map(function (it) {
        var cls = it.type === 'Risk' ? 'door one-way' : (it.type === 'Issue' ? 'door mixed' : 'door two-way');
        return '<tr><td><span class="' + cls + '">' + esc(it.type) + '</span></td><td><b>' + esc(it.title) + '</b></td><td>' + fmt(it.mitigation || it.validation || it.resolution || '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    // Quality Gates
    h += '<h2>' + esc(tk.qualityGates.title) + '</h2>' +
      '<p>' + fmt(tk.qualityGates.intro) + '</p>' +
      '<div class="grid" style="margin:16px 0">' +
      tk.qualityGates.stages.map(function (st) {
        return '<div class="box"><h3>' + esc(st.stage) + '</h3><ul style="margin:6px 0;padding-left:18px">' +
          st.criteria.map(function (c) { return '<li style="margin:6px 0">' + fmt(c) + '</li>'; }).join('') +
          '</ul></div>';
      }).join('') + '</div>';

    // Vendor Matrix
    h += '<h2>' + esc(tk.vendorMatrix.title) + '</h2>' +
      '<p>' + fmt(tk.vendorMatrix.intro) + '</p>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Model Family</th><th>Key Strengths</th><th>Trade-offs & Latency</th><th>Best Production Fit</th></tr></thead><tbody>' +
      tk.vendorMatrix.models.map(function (m) {
        return '<tr><td><b>' + esc(m.family) + '</b></td><td><span style="color:var(--ok)">' + fmt(m.strengths) + '</span></td><td><span style="color:var(--warn)">' + fmt(m.tradeoffs) + '</span></td><td>' + fmt(m.bestFit) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    // Skills Matrix
    h += '<h2>' + esc(tk.skillsMatrix.title) + '</h2>' +
      '<p>' + fmt(tk.skillsMatrix.intro) + '</p>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Core Competency Area</th><th>Required Technical Skills</th><th>Team Target Level</th></tr></thead><tbody>' +
      tk.skillsMatrix.competencies.map(function (c) {
        return '<tr><td><b>' + esc(c.area) + '</b></td><td>' + fmt(c.skills) + '</td><td><span class="door two-way">' + esc(c.levelTarget) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>';

    afterRender = function () {
      $$('.copy-tmpl-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.getAttribute('data-idx'), 10);
          if (tk.templates && tk.templates[idx]) {
            copyText(tk.templates[idx].markdown, this);
          }
        });
      });
    };

    return h;
  }

  function pageLabs() {
    var l = A.labs;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Labs & Roadmaps</div>' +
      '<h1>' + esc(l.title) + '</h1>' +
      '<p class="lede">' + fmt(l.lede) + '</p>';

    // Runnable local labs (tested, mock/offline)
    if (l.localLabs && l.localLabs.length) {
      h += '<h2>Runnable local labs</h2>' +
        '<p style="max-width:72ch">Two labs you can run on your own machine with Node.js only. They use <b>mock tools and a synthetic corpus</b>: no Google Cloud project, credentials, network access or billable resources. They demonstrate engineering controls; they do not benchmark any Google service. Clone the repository to run them.</p><div class="lists two">' +
        l.localLabs.map(function (x) {
          return '<div class="box"><h3>' + esc(x.title) + '</h3><p class="fine">' + esc(x.level) + ' · ' + esc(x.time) + ' · <code>' + esc(x.path) + '</code></p><p>' + fmt(x.objective) + '</p>' +
            '<p class="fine">' + esc(x.environment || '') + '</p><h4>Run</h4><pre class="adr" tabindex="0">' + esc(x.run) + '</pre><h4>Test</h4><pre class="adr" tabindex="0">' + esc(x.test) + '</pre>' +
            '<h4>Demonstrates</h4>' + ul(x.demonstrates || []) + '<h4>Limits</h4>' + ul(x.limits || []) +
            '<p class="fine"><a href="' + REPO + '/tree/main/' + esc(x.path) + '" target="_blank" rel="noopener">View on GitHub ↗</a></p></div>';
        }).join('') + '</div>';
    }

    // 12 Production Projects
    if (l.exercises && l.exercises.length) {
      h += '<h2>12 Production Hands-On Projects</h2>' +
        '<p style="max-width:72ch">Production implementation projects with complete repository structures, step-by-step guides, code snippets, security hardening, evaluation plans, and cost estimates.</p>';

      var levels = [
        ['Level 1: Core AI Engineering', l.exercises.filter(function (e) { return e.level.indexOf('Level 1') > -1; })],
        ['Level 2: Advanced Enterprise RAG & Agents', l.exercises.filter(function (e) { return e.level.indexOf('Level 2') > -1; })],
        ['Level 3: Principal & Enterprise Scale', l.exercises.filter(function (e) { return e.level.indexOf('Level 3') > -1; })]
      ];

      levels.forEach(function (grp) {
        if (!grp[1].length) return;
        h += '<h3 style="margin-top:28px">' + esc(grp[0]) + ' <span class="cnt">(' + grp[1].length + ' projects)</span></h3>';
        grp[1].forEach(function (ex) {
          h += '<div class="lab-card">' +
            '<div class="lab-header">' +
              '<span class="lab-level">' + esc(ex.level) + '</span>' +
              '<span class="lab-time">⏱ ' + esc(ex.time) + '</span>' +
              (ex.arch ? '<a class="chip" href="#/a/' + ex.arch + '">📐 ' + esc(ex.arch) + '</a>' : '') +
            '</div>' +
            '<h3 style="margin:4px 0 8px">' + esc(ex.title) + '</h3>' +
            '<p style="color:var(--muted);font-size:13px"><b>Goal:</b> ' + fmt(ex.goal) + '</p>' +
            (ex.techStack ? '<div style="margin:8px 0;font-size:12px"><b>Tech Stack:</b> ' + (Array.isArray(ex.techStack) ? ex.techStack : String(ex.techStack).split(/,\s*/)).map(function(s){ return '<code>' + esc(s) + '</code>'; }).join(' · ') + '</div>' : '') +

            '<details style="margin-top:14px"><summary style="cursor:pointer;font-weight:700;color:var(--accent)">View Project Implementation Guide & Code →</summary>' +
              '<div style="margin-top:12px">' +
                (ex.repoStructure ? '<h4>Repository Structure</h4><pre class="repo-tree">' + esc(ex.repoStructure) + '</pre>' : '') +
                '<h4>Step-by-Step Implementation</h4>' +
                '<ol class="lab-steps">' +
                ex.steps.map(function (st) { return '<li>' + fmt(st) + '</li>'; }).join('') +
                '</ol>' +
                (ex.codeSnippet ? '<div style="margin:14px 0"><h4>Key Code Implementation</h4><pre class="code-box"><code>' + esc(ex.codeSnippet) + '</code></pre></div>' : '') +
                '<div class="lists two" style="margin:14px 0">' +
                  (ex.security ? '<div class="box"><h4>Security Hardening</h4>' + ul(ex.security) + '</div>' : '') +
                  (ex.evalPlan ? '<div class="box"><h4>Evaluation Plan</h4>' + ul(ex.evalPlan) + '</div>' : '') +
                '</div>' +
                '<div style="margin:10px 0;font-size:12px"><b>Cost Estimate:</b> ' + fmt(ex.costEstimate || 'Standard Vertex AI token consumption.') + '</div>' +
                (ex.checklist && ex.checklist.length ? '<h4>Verification Checklist</h4><ul class="bp-chk-list">' + ex.checklist.map(function(c, i){ return '<li class="bp-chk-item"><input type="checkbox" id="chk-lab-' + ex.id + '-' + i + '"><label for="chk-lab-' + ex.id + '-' + i + '">' + fmt(c) + '</label></li>'; }).join('') + '</ul>' : '') +
              '</div>' +
            '</details>' +
          '</div>';
        });
      });
    }

    // 16-Week Curriculum
    if (l.curriculum16Week && l.curriculum16Week.phases) {
      h += '<h2>' + esc(l.curriculum16Week.title) + '</h2>' +
        '<p>' + fmt(l.curriculum16Week.intro) + '</p>' +
        '<div class="grid" style="margin:20px 0">';
      l.curriculum16Week.phases.forEach(function (ph) {
        h += '<div class="box">' +
          '<div class="mini">' + esc(ph.weeks) + '</div>' +
          '<h3>' + esc(ph.phase) + '</h3>' +
          '<p style="color:var(--muted);font-size:13px"><b>Focus:</b> ' + fmt(ph.focus) + '</p>' +
        '</div>';
      });
      h += '</div>';
    }

    // 3-Tier Competency Model
    if (l.competencyModel && l.competencyModel.tiers) {
      h += '<h2>3-Tier Competency Model for AI Engineering</h2>' +
        '<div class="grid" style="margin:20px 0">';
      l.competencyModel.tiers.forEach(function (tier) {
        h += '<div class="box">' +
          '<div class="cat-tag">' + esc(tier.tier) + '</div>' +
          '<h4>Services and skills</h4>' +
          '<p style="font-size:13px;color:var(--muted)">' + fmt(tier.services) + '</p>' +
        '</div>';
      });
      h += '</div>';
    }

    // Capability Benchmark Radar
    if (l.radarBenchmark && l.radarBenchmark.dimensions) {
      h += '<h2>' + esc(l.radarBenchmark.title) + '</h2>' +
        '<p>' + fmt(l.radarBenchmark.intro) + '</p>' +
        '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Engineering Dimension</th><th>Target level (1 to 5)</th><th>What it covers</th></tr></thead><tbody>' +
        l.radarBenchmark.dimensions.map(function (d) {
          return '<tr><td><b>' + esc(d.name) + '</b></td>' +
            '<td style="font-weight:600;color:var(--accent)">' + esc(d.target) + '</td>' +
            '<td>' + fmt(d.desc) + '</td>' +
            '</tr>';
        }).join('') +
        '</tbody></table></div>';
    }

    // Role-Based Roadmaps
    h += '<h2>Role-Based Progressive Learning Roadmaps</h2>' +
      '<div class="roadmap-grid">';
    l.learningPaths.forEach(function (path) {
      h += '<div class="roadmap-card">' +
        '<div class="mini">' + esc(path.duration) + '</div>' +
        '<h3>' + esc(path.role) + '</h3>' +
        '<p style="color:var(--muted);font-size:13px">' + fmt(path.objective) + '</p>' +
        '<ul style="margin:12px 0 0;padding-left:18px;font-size:13px">' +
        path.modules.map(function (m) {
          return '<li style="margin:6px 0"><b>' + esc(m.week) + ':</b> ' + fmt(m.topics) + '</li>';
        }).join('') +
        '</ul>' +
      '</div>';
    });
    h += '</div>';

    // Official Google Cloud Architecture Resources
    h += '<h2>Official Google Cloud Architecture Resources</h2>' +
      '<div class="grid" style="margin:16px 0">';
    l.officialResources.forEach(function (res) {
      h += '<div class="card" style="--h:215">' +
        '<div class="mini">Documentation Hub</div>' +
        '<h3>' + esc(res.title) + '</h3>' +
        '<p>' + fmt(res.desc) + '</p>' +
        '<div style="margin-top:12px"><a href="' + esc(res.url) + '" target="_blank" rel="noopener">Open in Google Cloud Documentation ↗</a></div>' +
      '</div>';
    });
    h += '</div>';

    return h;
  }

  /* ---------- Content freshness (#/freshness): what has and has not been checked against Google documentation ---------- */
  function pageFreshness() {
    var total = A.services.length, ver = A.services.filter(function (x) { return verState(x.id) === 'verified'; });
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Content freshness</div><h1>Content freshness and sources</h1>' +
      '<p class="lede">What has been compared with official Google Cloud documentation, on what date, from which page, and what has not. Product names, lifecycle status, limits and quotas change; treat anything not marked verified as a starting point to confirm.</p>' +
      '<div class="kpis">' +
        '<div class="kpi"><small>Service records</small><b>' + total + '</b></div>' +
        '<div class="kpi"><small>Verified</small><b>' + ver.length + '</b><span class="fine">checked against a recorded Google page</span></div>' +
        '<div class="kpi"><small>Not yet verified</small><b>' + (total - ver.length) + '</b><span class="fine">labelled on each page</span></div>' +
      '</div>';
    h += '<h2>Verified service records</h2>';
    if (ver.length) {
      h += '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Service</th><th>Checked</th><th>Lifecycle</th><th>Source</th></tr></thead><tbody>' +
        ver.map(function (x) { var m = meta[x.id]; return '<tr><td><a href="#/s/' + esc(x.id) + '">' + esc(x.name) + '</a></td><td>' + esc(m.verified) + '</td><td>' + esc(LIFE[m.lifecycle] || m.lifecycle) + '</td><td><a href="' + esc(m.sourceUrl) + '" target="_blank" rel="noopener">Source ↗</a></td></tr>'; }).join('') +
        '</tbody></table></div>';
    } else {
      h += '<div class="callout"><b>None yet.</b> No service record has been compared with official documentation, so none shows a verified date. This is deliberate: a record is only marked verified when a person opens the official page and records the date and URL.</div>';
    }
    h += '<h2>Coverage by category</h2><div class="tablewrap"><table class="matrix-table"><thead><tr><th>Category</th><th>Services</th><th>Verified</th><th>Not yet verified</th></tr></thead><tbody>' +
      A.categories.map(function (c) {
        var nv = c.items.filter(function (x) { return verState(x.id) === 'verified'; }).length;
        return '<tr><th scope="row"><a href="#/c/' + esc(c.id) + '">' + esc(c.name) + '</a></th><td>' + c.items.length + '</td><td>' + nv + '</td><td>' + (c.items.length - nv) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    var life = {};
    A.services.forEach(function (x) { var k = (meta[x.id] || {}).lifecycle || 'unknown'; life[k] = (life[k] || 0) + 1; });
    h += '<h2>Lifecycle status</h2><p style="max-width:68ch">Lifecycle (generally available, preview, deprecated, retired) is only shown for verified records. Every other record reads “Lifecycle not verified”.</p><ul>' +
      Object.keys(life).map(function (k) { return '<li>' + esc(LIFE[k] || k) + ': <b>' + life[k] + '</b></li>'; }).join('') + '</ul>';
    h += '<h2>What the dates on this site mean</h2><ul>' +
      '<li><b>Verified</b> (service record): the date someone compared the record with the Google page named as its source.</li>' +
      '<li><b>Last edited</b> (playbook): the date the text was last changed. It does not mean Google product facts were re-checked.</li>' +
      '<li><b>Prices:</b> never stored in the data. Calculators use numbers you type, and example values are labelled as such.</li></ul>' +
      '<p class="fine">Rules and the verification procedure are in <a href="' + REPO + '/blob/main/docs/content-governance.md" target="_blank" rel="noopener">docs/content-governance.md ↗</a>. Found something out of date? <a href="' + issueLink('Content revalidation: ') + '" target="_blank" rel="noopener">Open an issue ↗</a>.</p>';
    return h;
  }

  function notFound() { return '<h1>Not found</h1><p class="lede">That page does not exist. <a href="#/">Back to the atlas</a>.</p>'; }

  /* ---------- sidebar ---------- */
  function nl(href, label, cur) { return '<a class="nl" href="' + href + '"' + (cur ? ' aria-current="page"' : '') + '>' + label + '</a>'; }
  function renderSide(kind, id) {
    var cur = kind === 's' && byId[id] ? byId[id].cat : (kind === 'c' ? id : null);
    var curTheme = kind === 'd' && decById[id] ? decById[id].theme : null;
    var h = '<h3>Explore</h3>' +
      nl('#/', 'Home', !kind) +
      nl('#/tools', 'Engineering Tools (9)', kind === 'tools' && !id) +
      nl('#/a', 'Architectures (' + A.architectures.length + ')', kind === 'a' && !id) +
      nl('#/d', 'Decision Centre (' + A.decisions.length + ')', kind === 'd' && !id) +
      nl('#/p', 'Engineering Playbooks (' + A.engineeringPlaybooks.length + ')', kind === 'p' && !id) +
      nl('#/gov', 'Security & Governance', kind === 'gov') +
      nl('#/ops', 'Production Operations', kind === 'ops') +
      nl('#/toolkit', 'Manager Toolkit (' + (A.toolkit.templates ? A.toolkit.templates.length : 8) + ' templates)', kind === 'toolkit') +
      nl('#/labs', 'Labs & Projects (' + A.labs.exercises.length + ')', kind === 'labs');
      nl('#/freshness', 'Content freshness', kind === 'freshness');

    h += '<h3>Engineering Tools</h3>' +
      nl('#/tools/compare', 'Service comparison engine', (kind === 'tools' || kind === 'd') && id === 'compare') +
      nl('#/tools/rag-assistant', 'RAG design assistant', (kind === 'tools' || kind === 'd') && id === 'rag-assistant') +
      nl('#/tools/agent-assistant', 'Agent design assistant', (kind === 'tools' || kind === 'd') && id === 'agent-assistant') +
      nl('#/tools/risk-analyzer', 'Architecture risk analyzer', (kind === 'tools' || kind === 'd') && id === 'risk-analyzer') +
      nl('#/tools/readiness-scorecard', 'Production readiness scorecard', (kind === 'tools' || kind === 'd') && id === 'readiness-scorecard') +
      nl('#/tools/review-gen', 'Architecture review generator', (kind === 'tools' || kind === 'd') && id === 'review-gen') +
      nl('#/d/shaper', 'Solution shaper', (kind === 'tools' || kind === 'd') && id === 'shaper') +
      nl('#/d/calculator', 'Cost per task calculator', (kind === 'tools' || kind === 'd') && id === 'calculator') +
      nl('#/d/checklists', 'Readiness checklists', (kind === 'tools' || kind === 'd') && id === 'checklists');

    h += '<h3>Playbooks (' + A.engineeringPlaybooks.length + ')</h3>';
    A.engineeringPlaybooks.forEach(function (p) {
      var shortTitle = p.title.replace(' Playbook', '').replace(' Engineering & Orchestration', '').replace(' & Hardening', '');
      h += nl('#/p/' + p.id, shortTitle, kind === 'p' && id === p.id);
    });

    h += '<h3>Decision Guides (' + A.decisions.length + ')</h3>' +
      nl('#/d/em', 'For engineering managers', kind === 'd' && id === 'em') +
      nl('#/d/pe', 'For principal engineers', kind === 'd' && id === 'pe');

    A.decisionThemes.forEach(function (t) {
      var list = A.decisions.filter(function (d) { return d.theme === t.id; });
      h += '<details' + (curTheme === t.id ? ' open' : '') + '><summary style="--h:' + THEME_HUE[t.id] + '"><span class="dot"></span><span style="flex:1">' + esc(t.name) + '</span><span class="n">' + list.length + '</span></summary><ul>' +
        list.map(function (d) { return '<li><a href="#/d/' + d.id + '"' + (kind === 'd' && id === d.id ? ' aria-current="page"' : '') + '>' + esc(d.title) + '</a></li>'; }).join('') + '</ul></details>';
    });

    h += '<h3>Architectures (' + A.architectures.length + ')</h3>';
    var catGroups = [
      ['Foundation ML', A.architectures.filter(function(a){return a.cat==='foundation-ml';})],
      ['GenAI Systems', A.architectures.filter(function(a){return a.cat==='genai';})],
      ['RAG Architectures', A.architectures.filter(function(a){return a.cat==='rag';})],
      ['Multi-Agent Systems', A.architectures.filter(function(a){return a.cat==='agents';})],
      ['Production & MLOps', A.architectures.filter(function(a){return a.cat==='production';})]
    ];
    catGroups.forEach(function (g) {
      h += '<details' + (kind === 'a' && id && archById[id] && g[1].some(function(a){return a.id===id;}) ? ' open' : '') + '><summary style="--h:215"><span class="dot"></span><span>' + esc(g[0]) + '</span><span class="n">' + g[1].length + '</span></summary><ul>' +
        g[1].map(function (a) { return '<li><a href="#/a/' + a.id + '"' + (kind === 'a' && id === a.id ? ' aria-current="page"' : '') + '>' + esc(a.name) + '</a></li>'; }).join('') + '</ul></details>';
    });

    h += '<h3>Services (' + A.services.length + ')</h3>';
    A.categories.forEach(function (c) {
      h += '<details' + (cur === c.id ? ' open' : '') + '><summary style="--h:' + c.hue + '"><span class="dot"></span><a href="#/c/' + c.id + '"' + (kind === 'c' && id === c.id ? ' aria-current="page"' : '') + '>' + esc(c.name) + '</a><span class="n">' + c.items.length + '</span></summary><ul>' +
        c.items.map(function (s) { return '<li><a href="#/s/' + s.id + '"' + (kind === 's' && id === s.id ? ' aria-current="page"' : '') + '>' + esc(s.name) + '</a></li>'; }).join('') + '</ul></details>';
    });
    $('#side').innerHTML = h;
  }

  function render() {
    $$('.stepper').forEach(function (el) { if (el._stop) el._stop(); });
    var parts = location.hash.replace(/^#\/?/, '').split('/'), kind = parts[0] || '', id = parts[1] || '';
    pendingSteppers = []; afterRender = null;
    var html, title = 'Google Cloud for AI Systems — an interactive operating system';

    var ALL_TOOLS = {
      compare: ['Service comparison engine', pageCompare],
      'rag-assistant': ['RAG architecture design assistant', pageRagAssistant],
      'agent-assistant': ['Agentic architecture design assistant', pageAgentAssistant],
      'risk-analyzer': ['Architecture risk analyzer', pageRiskAnalyzer],
      'readiness-scorecard': ['Production readiness scorecard', pageReadinessScorecard],
      'review-gen': ['Architecture review generator', pageReviewGen],
      shaper: ['Solution shaper', pageShaper],
      checklists: ['Readiness checklists', pageChecklists],
      calculator: ['Cost per task calculator', pageCalculator]
    };

    if (kind === 's' && byId[id]) { html = pageService(id); title = byId[id].name + ' — Google Cloud for AI Systems'; }
    else if (kind === 'c' && catById[id]) { html = pageCategory(id); title = catById[id].name + ' — Google Cloud for AI Systems'; }
    else if (kind === 'a') { if (id && archById[id]) { html = pageArch(id); title = archById[id].name + ' — Google Cloud for AI Systems'; } else html = pageArchIndex(); }
    else if (kind === 'tools') {
      if (!id) { html = pageToolsHub(); title = 'AI Engineering Interactive Tools — Google Cloud AI Atlas'; }
      else if (ALL_TOOLS[id]) { html = ALL_TOOLS[id][1](); title = ALL_TOOLS[id][0] + ' — Google Cloud AI Atlas'; }
      else html = notFound();
    }
    else if (kind === 'd') {
      if (!id || id === 'em' || id === 'pe' || id === 'all') { html = pageDecisionHub(id); title = (id === 'em' ? 'Decisions for engineering managers' : id === 'pe' ? 'Decisions for principal engineers' : 'Decision guides') + ' — Google Cloud for AI Systems'; }
      else if (ALL_TOOLS[id]) { html = ALL_TOOLS[id][1](); title = ALL_TOOLS[id][0] + ' — Google Cloud for AI Systems'; }
      else if (decById[id]) { html = pageDecision(id); title = decById[id].title + ' — Google Cloud for AI Systems'; }
      else html = notFound();
    }
    else if (kind === 'p') {
      if (id) {
        var pb = A.engineeringPlaybooks.find(function (p) { return p.id === id; });
        if (pb) { html = pagePlaybook(id); title = pb.title + ' — Google Cloud AI Atlas'; }
        else html = notFound();
      } else {
        html = pagePlaybooksIndex();
        title = 'AI Engineering Playbooks — Google Cloud AI Atlas';
      }
    }
    else if (kind === 'gov') {
      html = pageGovernance();
      title = 'Enterprise AI Governance & Landing Zones — Google Cloud AI Atlas';
    }
    else if (kind === 'ops') {
      html = pageOperations();
      title = 'Production AI Operations Centre — Google Cloud AI Atlas';
    }
    else if (kind === 'toolkit') {
      html = pageToolkit();
      title = 'AI Engineering Manager Toolkit — Google Cloud AI Atlas';
    }
    else if (kind === 'labs') {
      html = pageLabs();
      title = 'Hands-on Labs & Learning Roadmaps — Google Cloud AI Atlas';
    }
    else if (kind === 'freshness') {
      html = pageFreshness();
      title = 'Content freshness and sources — Google Cloud AI Atlas';
    }
    else if (!kind) html = pageHome();
    else html = notFound();

    var main = $('#main'); main.innerHTML = html;
    pendingSteppers.forEach(function (spec, i) { mountStepper($('[data-sp="' + i + '"]', main), spec); });
    if (afterRender) afterRender();
    renderSide(kind, id);
    document.title = title;
    window.scrollTo(0, 0);
    document.body.classList.remove('nav-open');
    $('#menuBtn').setAttribute('aria-expanded', 'false');
    var cs = $('.side a[aria-current=page]'); if (cs && cs.scrollIntoView) cs.scrollIntoView({ block: 'nearest' });
  }

  document.addEventListener('submit', function (e) { e.preventDefault(); });
  window.addEventListener('hashchange', render);

  /* ---------- chrome: nav, theme, search ---------- */
  $('#menuBtn').addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open'); this.setAttribute('aria-expanded', open);
  });
  $('#scrim').addEventListener('click', function () { document.body.classList.remove('nav-open'); });
  $('#themeBtn').addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('atlas-theme', next); } catch (e) {}
  });

  /* ---- Search: index/query logic lives in assets/search.js (unit-tested in Node) ---- */
  var overlay = $('#overlay'), q = $('#q'), resultsEl = $('#results'), filtersEl = $('#searchFilters'), sel = 0, hits = [], kind = 'all';
  var S = window.AtlasSearch, index = S.build(A);
  var kindCounts = {};
  index.forEach(function (it) { kindCounts[it.kind] = (kindCounts[it.kind] || 0) + 1; });
  function paintFilters() {
    filtersEl.innerHTML = [['all', 'All']].concat(S.KINDS.filter(function (k) { return kindCounts[k[0]]; })).map(function (k) {
      return '<button type="button" class="chip' + (k[0] === kind ? ' on' : '') + '" data-kind="' + k[0] + '" aria-pressed="' + (k[0] === kind) + '">' + esc(k[1]) + '</button>';
    }).join('');
  }
  /* Highlights query words. Matching runs on the raw text and each piece is escaped separately, so a query
     such as "amp" can never cut through an HTML entity like &amp;. */
  function mark(text, terms) {
    var words = terms.filter(function (t) { return t.length > 1; }).map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    if (!words.length) return esc(text);
    var re = new RegExp('(' + words.join('|') + ')', 'ig');
    return String(text).split(re).map(function (part, i) { return i % 2 ? '<mark>' + esc(part) + '</mark>' : esc(part); }).join('');
  }
  function openSearch() { overlay.hidden = false; q.value = ''; kind = 'all'; paintFilters(); runSearch(); q.focus(); }
  function closeSearch() { overlay.hidden = true; }
  function runSearch() { hits = S.query(index, q.value, kind, 15); sel = 0; paint(); }
  function paint() {
    var terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    resultsEl.innerHTML = hits.length ? hits.map(function (it, i) {
      return '<li role="option" aria-selected="' + (i === sel) + '"><a href="' + esc(it.href) + '" class="' + (i === sel ? 'sel' : '') + '"><b>' + mark(it.name, terms) +
        ' <small class="muted-s">· ' + esc(it.type) + (it.cat && it.cat !== it.type ? ' · ' + esc(it.cat) : '') + '</small></b><span>' + mark(plain(it.tag).slice(0, 160), terms) + '</span></a></li>';
    }).join('') : '<li class="none">No matches' + (kind !== 'all' ? ' in this filter' : '') + '. Try a service name (“Vertex AI Search”), a concept (“throttling”, “vector”), an acronym (“RAG”, “ADK”, “MCP”) or an error code (“429”).' +
      (kind !== 'all' ? ' <button type="button" class="chip" data-kind="all">Search everything</button>' : '') + '</li>';
    var st = $('#searchStatus'); if (st) st.textContent = hits.length + (hits.length === 1 ? ' result' : ' results');
    var cur = resultsEl.querySelector('a.sel'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
  }
  $('#searchBtn').addEventListener('click', openSearch);
  overlay.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-kind]');
    if (chip) { kind = chip.getAttribute('data-kind'); paintFilters(); runSearch(); q.focus(); return; }
    if (e.target === overlay || e.target.closest('a')) closeSearch();
  });
  q.addEventListener('input', runSearch);
  q.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(hits.length - 1, sel + 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
    else if (e.key === 'Enter' && hits[sel]) { location.hash = hits[sel].href; closeSearch(); }
  });
  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''));
    if (e.key === 'Escape') closeSearch();
    else if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openSearch(); }
  });

  render();
})();
