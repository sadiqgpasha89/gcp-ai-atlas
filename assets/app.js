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
      .replace(/\[\[(?:([padmt]):)?([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, function (m, pre, id, label) {
        if (pre) return '<a href="#/' + pre + '/' + id + '">' + (label || id) + '</a>';
        var sv = byId[id];
        if (!sv) return label || id;
        return '<a href="#/s/' + id + '">' + (label || sv.name) + '</a>';
      });
  }
  function paras(s) { return String(s).split(/\n\n+/).map(function (p) { return '<p>' + fmt(p) + '</p>'; }).join(''); }
  function ul(items) { return '<ul>' + items.map(function (i) { return '<li>' + fmt(i) + '</li>'; }).join('') + '</ul>'; }
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
      { l: 'Foundation', s: 'GCE · TPU · Cloud Storage · Lustre', h: 18, w: 140 },
      { l: 'Data', s: 'BigQuery · Dataflow · Pub/Sub · vectors', h: 175, w: 120 },
      { l: 'Models', s: 'Gemini · Agent Platform', h: 265, w: 100 },
      { l: 'Apps & agents', s: 'Apigee · Cloud Run · Agent Runtime', h: 305, w: 80 }
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

  /* ---------- generic content blocks (guides, architecture sections) ---------- */
  function tableHtml(cols, rows, blk) {
    return '<div class="tablewrap' + (blk ? ' blk' : '') + '"><table><thead><tr>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + fmt(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function boxHtml(b) {
    return '<div class="box ' + (b.kind || '') + '"><h3>' + esc(b.title) + '</h3>' + ul(b.items) + '</div>';
  }
  function slug(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function renderBlocks(blocks) {
    return blocks.map(function (b) {
      switch (b.t) {
        case 'h2': return '<h2 id="' + slug(b.text) + '">' + esc(b.text) + '</h2>';
        case 'h3': return '<h3 class="bh3">' + esc(b.text) + '</h3>';
        case 'p': return paras(b.text);
        case 'ul': return ul(b.items);
        case 'ol': return '<ol class="olist">' + b.items.map(function (i) { return '<li>' + fmt(i) + '</li>'; }).join('') + '</ol>';
        case 'table': return tableHtml(b.cols, b.rows, true) + (b.note ? '<p class="fine">' + fmt(b.note) + '</p>' : '');
        case 'callout': return '<div class="callout"><b>' + esc(b.title) + '</b>' + fmt(b.text) + '</div>';
        case 'two': return '<div class="lists two" style="margin-top:22px">' + boxHtml(b.left) + boxHtml(b.right) + '</div>';
        case 'cards': return '<div class="grid">' + b.items.map(function (c) {
          return '<div class="card plain"><div class="mini">' + esc(c.tag || '') + '</div><h3>' + esc(c.title) + '</h3><p>' + fmt(c.text) + '</p></div>'; }).join('') + '</div>';
        case 'steps': return '<ol class="phases bigsteps">' + b.items.map(function (i) { return '<li><b>' + esc(i[0]) + '.</b> ' + fmt(i[1]) + '</li>'; }).join('') + '</ol>';
        case 'runbook':
          return '<details class="runbook"><summary><span class="rbn">' + esc(b.id) + '</span>' + esc(b.title) + '<small>' + esc(b.trigger) + '</small></summary>' +
            '<div class="lists two"><div class="box warn"><h3>Symptoms</h3>' + ul(b.symptoms) + '</div><div class="box"><h3>Triage in the first 15 minutes</h3>' + ul(b.triage) + '</div></div>' +
            '<div class="lists two" style="margin-top:14px"><div class="box ml"><h3>Mitigate</h3>' + ul(b.mitigate) + '</div><div class="box"><h3>Find the root cause</h3>' + ul(b.root) + '</div></div>' +
            '<div class="callout"><b>Prevent a repeat</b>' + fmt(b.prevent) + '</div></details>';
        default: return '';
      }
    }).join('');
  }
  function blocksText(blocks) {
    return (blocks || []).map(function (b) { return JSON.stringify(b).replace(/"(t|kind|cols|title|text|items|rows|left|right|note|id|trigger|symptoms|triage|mitigate|root|prevent|tag)":/g, ' '); }).join(' ');
  }
  function tocHtml(blocks) {
    var hs = blocks.filter(function (b) { return b.t === 'h2'; });
    if (hs.length < 3) return '';
    return '<nav class="toc" aria-label="On this page"><b>On this page</b>' + hs.map(function (h) { return '<a href="#/" data-jump="' + slug(h.text) + '">' + esc(h.text) + '</a>'; }).join('') + '</nav>';
  }

  /* ---------- product facts ---------- */
  var STAGE = { GA: ['st-ga', 'Generally available'], Preview: ['st-pre', 'Preview'], Mixed: ['st-mix', 'Features differ'], Check: ['st-chk', 'Not confirmed'] };
  function stageBadge(m) { var x = STAGE[m.s] || STAGE.Check; return '<span class="stg ' + x[0] + '" title="' + esc(x[1]) + '">' + (m.s === 'Check' ? 'Check' : m.s) + '</span>'; }
  function factsPanel(s) {
    var m = s.meta; if (!m) return '';
    var verified = (m.v || []).length;
    var h = '<h2>Product facts</h2><dl class="facts">';
    h += '<div><dt>Current name</dt><dd>' + esc(s.name) + '</dd></div>';
    h += '<div><dt>Previously called</dt><dd>' + (m.was && m.was.length ? m.was.map(esc).join(', ') : 'No rename recorded') + '</dd></div>';
    h += '<div><dt>Launch stage</dt><dd>' + stageBadge(m) + ' <span class="fine">' + esc((STAGE[m.s] || STAGE.Check)[1]) + (m.s === 'Mixed' ? ': individual features carry their own stage.' : (m.s === 'Check' ? ': confirm in the docs before you plan on it.' : '.')) + '</span></dd></div>';
    h += '<div><dt>Regions</dt><dd>' + (m.reg ? fmt(m.reg) : 'Varies by region. See <a href="https://cloud.google.com/about/locations" target="_blank" rel="noopener">Google Cloud locations</a> and the product docs.') + '</dd></div>';
    h += '<div><dt>Pricing</dt><dd>' + (m.price ? '<a href="' + esc(m.price) + '" target="_blank" rel="noopener">Pricing page ↗</a>' : 'See the pricing link from the product docs.') + '</dd></div>';
    h += '<div><dt>Quotas and limits</dt><dd>' + (m.lim ? fmt(m.lim) : 'Check the Quotas page in the console for your project and region, and request increases before launch ([[quotas]]).') + '</dd></div>';
    h += '<div><dt>Alternatives and migration</dt><dd>' + fmt(m.alt) + '</dd></div>';
    h += '<div><dt>Last reviewed</dt><dd>' + esc(A.metaReviewed) + ' · ' + (verified ? 'checked against Google Cloud documentation: ' + m.v.join(', ') + '.' : '<span class="fine">Not re-checked against the docs in the last review. Confirm name, stage and limits before you rely on them.</span>') + '</dd></div>';
    return h + '</dl>';
  }

  /* ---------- pages ---------- */
  function pageHome() {
    var n = A.services.length;
    var h = '<div class="wide"><section class="hero"><div>' +
      '<div class="eyebrow">An interactive atlas · ' + n + ' services · ' + A.categories.length + ' categories</div>' +
      '<h1>Build AI systems on Google Cloud, one block at a time.</h1>' +
      '<p class="lede">What each service is, how it actually works step by step, where it bites, and how to compose it into larger ML and GenAI systems.</p>' +
      '<div class="btns"><a class="btn primary" href="#/c/genai">Start with GenAI →</a><a class="btn" href="#/a">See full architectures</a><a class="btn" href="#/d">Decision guides</a></div>' +
      '</div>' + heroSVG() + '</section>';
    h += '<h2>The map</h2><p style="max-width:62ch">Services are grouped by the job they do in an AI/ML system. Each page ends with how to use the service in that setting, and what it pairs with.</p><div class="grid">';
    A.categories.forEach(function (c) {
      h += '<a class="card catcard" style="--h:' + c.hue + '" href="#/c/' + c.id + '">' + miniCube(c.hue) + '<div class="mini">' + c.items.length + ' services</div><h3>' + esc(c.name) + '</h3><p>' + esc(c.short) + '</p></a>';
    });
    h += '</div><h2>Start from a system</h2><p style="max-width:62ch">Prefer to learn top-down? Each architecture is a step-through diagram where every box links to the service behind it.</p><div class="grid">';
    A.architectures.forEach(function (a) {
      h += '<a class="card" style="--h:215" href="#/a/' + a.id + '"><div class="mini">Architecture</div><h3>' + esc(a.name) + '</h3><p>' + esc(a.short) + '</p></a>';
    });
    h += '</div><h2>For engineering leaders</h2><p style="max-width:62ch">Choosing between build, buy and customise; how much autonomy an agent gets; what is ready for production. Decision guides, a solution shaper, checklists and a cost calculator.</p><div class="grid">' +
      '<a class="card" style="--h:215" href="#/d/shaper"><div class="mini">Interactive</div><h3>Solution shaper</h3><p>Seven questions in, a starting stack and the decisions to make next out.</p></a>' +
      '<a class="card" style="--h:215" href="#/d"><div class="mini">' + A.decisions.length + ' guides</div><h3>Decision guides</h3><p>Options, if/then rules, red flags, review questions and one-way-door markers.</p></a>' +
      '<a class="card" style="--h:145" href="#/d/checklists"><div class="mini">Checklist</div><h3>Readiness checklists</h3><p>Maturity ladder, production readiness and a decision-record template.</p></a>' +
      '<a class="card" style="--h:42" href="#/d/calculator"><div class="mini">Calculator</div><h3>Cost per task</h3><p>See which levers move the bill most.</p></a>' +
      '</div><h2>How to read a service page</h2><div class="lists two" style="max-width:860px">' +
      '<div class="box"><h3>Every page has</h3>' + ul(['**What it is**: the job it does, in plain terms.', '**How it works**: a stepper you can click through or play.', '**Gotchas** and **edge cases**: the things that surprise people in production.', '**In AI/ML systems**: concrete ways to use it.']) + '</div>' +
      '<div class="box"><h3>A note on numbers</h3><p style="margin-top:10px">Limits and prices are given for orientation, and Google Cloud changes them, and renames products often. Where a number matters to your design, confirm it on the linked docs page and on your project\'s Quotas page.</p></div></div></div>';
    return h;
  }

  function serviceCard(s) {
    return '<a class="card" style="--h:' + hueOf(s.cat) + '" href="#/s/' + s.id + '">' + miniCube(hueOf(s.cat)) + '<h3>' + esc(s.name) + '</h3><p>' + esc(s.tag) + '</p></a>';
  }

  function pageCategory(id) {
    var c = catById[id]; if (!c) return notFound();
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Category</div><h1>' + esc(c.name) + '</h1><p class="lede">' + esc(c.short) + '</p>';
    h += paras(c.intro);
    h += '<div class="callout"><b>Design lens</b>' + fmt(c.lens) + '</div>';
    h += '<h2>Services</h2><div class="grid">' + c.items.map(serviceCard).join('') + '</div>';
    return h;
  }

  function pageService(id) {
    var s = byId[id]; if (!s) return notFound();
    var c = catById[s.cat], hue = c.hue, i = c.items.indexOf(s);
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a class="chip" style="--h:' + hue + '" href="#/c/' + c.id + '">' + esc(c.name) + '</a>' +
      (s.doc ? '<a href="' + (/^https?:\/\//.test(s.doc) ? '' : 'https://docs.cloud.google.com/') + esc(s.doc) + '" target="_blank" rel="noopener">Google Cloud docs ↗</a>' : '') + '</div>';
    h += '<h1>' + esc(s.name) + (s.meta ? ' ' + stageBadge(s.meta) : '') + '</h1><p class="lede">' + esc(s.tag) + '</p>';
    if (s.was && s.was.length) h += '<p class="aka">Formerly: ' + s.was.map(esc).join(' · ') + '</p>';
    h += '<h2 style="margin-top:28px">What it is</h2>' + paras(s.what);
    h += '<h2>How it works</h2>' + stepperHost({ flow: s.flow, steps: s.steps, hue: hue });
    h += '<div class="lists two" style="margin-top:34px"><div class="box warn"><h3>Gotchas</h3>' + ul(s.gotchas) + '</div><div class="box"><h3>Edge cases</h3>' + ul(s.edges) + '</div></div>';
    h += '<h2>Using it in AI/ML systems</h2><div class="box ml" style="padding-top:2px">' + ul(s.ml) + '</div>';
    h += factsPanel(s);
    if (s.pairs && s.pairs.length) {
      h += '<h2>Pairs well with</h2><div class="pairs">' + s.pairs.filter(function (p) { return byId[p]; }).map(function (p) { return '<a href="#/s/' + p + '">' + esc(byId[p].name) + '</a>'; }).join('') + '</div>';
    }
    if (s.cost) h += '<div class="callout" style="margin-top:28px"><b>Cost model</b>' + fmt(s.cost) + '</div>';
    var prev = c.items[i - 1], next = c.items[i + 1];
    h += '<div class="pn">' + (prev ? '<a href="#/s/' + prev.id + '"><small>← Previous</small>' + esc(prev.name) + '</a>' : '<span></span>') + (next ? '<a href="#/s/' + next.id + '"><small>Next →</small>' + esc(next.name) + '</a>' : '') + '</div>';
    return h;
  }

  function pageArchIndex() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Architectures</div><h1>Reference architectures</h1><p class="lede">Services are only useful in combination. These are the shapes that keep showing up in production AI/ML systems.</p><div class="grid">';
    A.architectures.forEach(function (a) { h += '<a class="card" style="--h:215" href="#/a/' + a.id + '"><div class="mini">Architecture</div><h3>' + esc(a.name) + '</h3><p>' + esc(a.short) + '</p></a>'; });
    return h + '</div>';
  }

  function pageArch(id) {
    var a = archById[id]; if (!a) return notFound();
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/a">Architectures</a></div><h1>' + esc(a.name) + '</h1><p class="lede">' + esc(a.short) + '</p>';
    h += '<div class="callout"><b>Use it when</b>' + fmt(a.when) + '</div>';
    h += '<h2>Walkthrough</h2><p>Click a step, or press Play. Every box is a link to its service page.</p>' + stepperHost({ flow: a.flow, steps: a.steps, hue: 215 });
    h += '<div class="lists two" style="margin-top:34px"><div class="box"><h3>Why this shape</h3>' + ul(a.why) + '</div><div class="box warn"><h3>How it fails</h3>' + ul(a.fails) + '</div></div>';
    if (a.sections) h += tocHtml(a.sections) + renderBlocks(a.sections);
    if (a.src) h += '<h2>Based on</h2><ul class="srcs">' + a.src.map(function (x) { return '<li><a href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + esc(x[0]) + ' ↗</a></li>'; }).join('') + '</ul>';
    var used = {}; a.flow.forEach(function (f) { if (f.s) used[f.s] = 1; });
    var ids = Object.keys(used);
    if (ids.length) h += '<h2>Services involved</h2><div class="pairs">' + ids.map(function (p) { return '<a href="#/s/' + p + '">' + esc(byId[p].name) + '</a>'; }).join('') + '</div>';
    return h;
  }


  /* ---------- guides (long-form playbooks) ---------- */
  var guideById = {}; (A.guides || []).forEach(function (g) { guideById[g.id] = g; });
  var guideGroupById = {}; (A.guideGroups || []).forEach(function (g) { guideGroupById[g.id] = g; });
  function guideCard(g) {
    return '<a class="card" style="--h:' + (guideGroupById[g.group] ? guideGroupById[g.group].hue : 215) + '" href="#/p/' + g.id + '"><div class="mini">' + esc(guideGroupById[g.group] ? guideGroupById[g.group].name : 'Guide') + '</div><h3>' + esc(g.title) + '</h3><p>' + esc(g.short) + '</p></a>';
  }
  function pageGuideHub() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Guides</div><h1>Operating guides</h1>' +
      '<p class="lede">Long-form playbooks for running agentic and ML systems on Google Cloud: governance, operations, evaluation, delivery and data.</p>' +
      '<p style="max-width:62ch">Service pages say what a product does. These guides say how a team runs a system built from them: who owns what, which numbers to watch, what to do when it breaks, and what to put in the pipeline.</p>';
    (A.guideGroups || []).forEach(function (gr) {
      var list = A.guides.filter(function (g) { return g.group === gr.id; });
      if (!list.length) return;
      h += '<h2>' + esc(gr.name) + '</h2><p style="max-width:62ch">' + esc(gr.blurb) + '</p><div class="grid">' + list.map(guideCard).join('') + '</div>';
    });
    return h;
  }
  function pageGuide(id) {
    var g = guideById[id]; if (!g) return notFound();
    var gr = guideGroupById[g.group] || { name: 'Guide' };
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/p">Guides</a> / ' + esc(gr.name) + '</div><h1>' + esc(g.title) + '</h1><p class="lede">' + esc(g.short) + '</p>';
    if (g.when) h += '<div class="callout"><b>Use it when</b>' + fmt(g.when) + '</div>';
    h += tocHtml(g.blocks) + renderBlocks(g.blocks);
    if (g.src && g.src.length) h += '<h2>Based on</h2><ul class="srcs">' + g.src.map(function (x) { return '<li><a href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + esc(x[0]) + ' ↗</a></li>'; }).join('') + '</ul>';
    var rel = (g.related || []).filter(function (p) { return byId[p]; });
    if (rel.length) h += '<h2>Services involved</h2><div class="pairs">' + rel.map(function (p) { return '<a href="#/s/' + p + '">' + esc(byId[p].name) + '</a>'; }).join('') + '</div>';
    var more = (g.see || []).map(function (r) {
      var p = r.split(':'), x = p[1];
      if (p[0] === 'p' && guideById[x]) return '<a href="#/p/' + x + '">' + esc(guideById[x].title) + '</a>';
      if (p[0] === 'a' && archById[x]) return '<a href="#/a/' + x + '">' + esc(archById[x].name) + '</a>';
      if (p[0] === 'd' && decById[x]) return '<a href="#/d/' + x + '">' + esc(decById[x].title) + '</a>';
      if (p[0] === 't') return '<a href="#/t' + (x ? '/' + x : '') + '">Template: ' + esc(x) + '</a>';
      return '';
    }).filter(Boolean);
    if (more.length) h += '<h2>Related guides and architectures</h2><div class="pairs">' + more.join('') + '</div>';
    return h;
  }


  /* ---------- management templates ---------- */
  var tplById = {}; (A.templates || []).forEach(function (t) { tplById[t.id] = t; });
  function seeHtml(see) {
    return (see || []).map(function (r) {
      var p = r.split(':'), x = p[1];
      if (p[0] === 'p' && guideById[x]) return '<a href="#/p/' + x + '">' + esc(guideById[x].title) + '</a>';
      if (p[0] === 'a' && archById[x]) return '<a href="#/a/' + x + '">' + esc(archById[x].name) + '</a>';
      if (p[0] === 'd' && decById[x]) return '<a href="#/d/' + x + '">' + esc(decById[x].title) + '</a>';
      if (p[0] === 'd' && window.ATLAS_TOOLS && window.ATLAS_TOOLS[x]) return '<a href="#/d/' + x + '">' + esc(window.ATLAS_TOOLS[x].title) + '</a>';
      if (p[0] === 't' && tplById[x]) return '<a href="#/t/' + x + '">Template: ' + esc(tplById[x].title) + '</a>';
      return '';
    }).filter(Boolean).join('');
  }
  function pageTemplates() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Templates</div><h1>Management templates</h1>' +
      '<p class="lede">Twelve copy-ready markdown templates for running AI work: from the first problem statement to the post-incident review.</p>' +
      '<p style="max-width:62ch">Each template says when to use it and who fills it in. Copy it into your wiki, ticket or repository, and fill it in. Nothing is stored here.</p><div class="grid">';
    A.templates.forEach(function (t) { h += '<a class="card" style="--h:145" href="#/t/' + t.id + '"><div class="mini">Template</div><h3>' + esc(t.title) + '</h3><p>' + esc(t.short) + '</p></a>'; });
    return h + '</div>';
  }
  function pageTemplate(id) {
    var t = tplById[id]; if (!t) return notFound();
    var i = A.templates.indexOf(t), prev = A.templates[i - 1], next = A.templates[i + 1];
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/t">Templates</a></div><h1>' + esc(t.title) + '</h1><p class="lede">' + esc(t.short) + '</p>';
    h += '<div class="lists two"><div class="box"><h3>When to use it</h3><p style="margin-top:10px">' + fmt(t.when) + '</p></div><div class="box ml"><h3>Who fills it in</h3><p style="margin-top:10px">' + fmt(t.who) + '</p></div></div>';
    h += '<div class="btns" style="margin:22px 0 10px"><button class="btn primary" type="button" data-copy-tpl>Copy template</button><span class="fine">Markdown, ' + t.body.split('\n').length + ' lines</span></div>';
    h += '<pre class="adr tpl" tabindex="0" aria-label="Template text">' + esc(t.body) + '</pre>';
    var more = seeHtml(t.see);
    if (more) h += '<h2>Related</h2><div class="pairs">' + more + '</div>';
    var rel = (t.related || []).filter(function (p) { return byId[p]; });
    if (rel.length) h += '<h2>Services involved</h2><div class="pairs">' + rel.map(function (p) { return '<a href="#/s/' + p + '">' + esc(byId[p].name) + '</a>'; }).join('') + '</div>';
    h += '<div class="pn">' + (prev ? '<a href="#/t/' + prev.id + '"><small>← Previous</small>' + esc(prev.title) + '</a>' : '<span></span>') + (next ? '<a href="#/t/' + next.id + '"><small>Next →</small>' + esc(next.title) + '</a>' : '') + '</div>';
    afterRender = function () { var b = $('[data-copy-tpl]'); if (b) b.addEventListener('click', function () { copyText(t.body, b); }); };
    return h;
  }

  /* ---------- decisions & leader tools ---------- */
  var decById = {}; A.decisions.forEach(function (d) { decById[d.id] = d; });
  var themeById = {}; A.decisionThemes.forEach(function (t) { themeById[t.id] = t; });
  var THEME_HUE = { strategy: 215, architecture: 145, risk: 18 };
  var DOOR = { 'two-way': ['Two-way door', 'Easy to reverse'], 'one-way': ['One-way door', 'Hard to reverse'], 'mixed': ['Mixed door', 'Reversible at first'] };
  var afterRender = null;

  function doorBadge(d) { var x = DOOR[d.door]; return '<span class="door ' + d.door + '" title="' + esc(x[1]) + '">' + x[0] + '</span>'; }
  function plain(s) {
    return String(s).replace(/\[\[(?:([padmt]):)?([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, function (m, pre, id, label) { return label || (!pre && byId[id] ? byId[id].name : id); });
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

  function pageDecisionHub() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Decisions</div><h1>Decision guides</h1>' +
      '<p class="lede">For engineering managers and principal engineers deciding how to build agentic and ML systems.</p>' +
      '<p style="max-width:62ch">Each guide gives the options side by side, if/then rules, red flags to watch for, questions to ask in a design review, and a trigger for revisiting the decision. Each one is marked as a <b>two-way door</b> (cheap to reverse) or a <b>one-way door</b> (expensive to reverse), so you can spend your review time where it counts.</p>';
    h += '<h2>Tools</h2><div class="grid">' +
      '<a class="card" style="--h:215" href="#/d/shaper"><div class="mini">Interactive</div><h3>Solution shaper</h3><p>Answer seven questions about your use case and get a starting stack, risks, and the decisions to make next.</p></a>' +
      '<a class="card" style="--h:145" href="#/d/checklists"><div class="mini">Checklist</div><h3>Readiness checklists</h3><p>A prototype-to-scale maturity ladder, a production-readiness checklist, and a decision-record template.</p></a>' +
      '<a class="card" style="--h:42" href="#/d/calculator"><div class="mini">Calculator</div><h3>Cost per task</h3><p>Model unit economics and see which levers (caching, batching, routing) move the bill most.</p></a>' +
      '<a class="card" style="--h:42" href="#/d/finops"><div class="mini">Cost model</div><h3>AI FinOps model</h3><p>Every model call across every agent, retrieval, tools and fixed costs, with six what-if comparisons and cost per successful task.</p></a>' +
      '<a class="card" style="--h:18" href="#/d/scorecard"><div class="mini">Release gates</div><h3>Evaluation scorecard</h3><p>Compare models, prompts, agents and retrieval strategies on one dataset and see which pass your gates.</p></a></div>';
    A.decisionThemes.forEach(function (t) {
      var list = A.decisions.filter(function (d) { return d.theme === t.id; });
      h += '<h2>' + esc(t.name) + '</h2><p style="max-width:62ch">' + esc(t.blurb) + '</p><div class="grid">';
      list.forEach(function (d) {
        h += '<a class="card" style="--h:' + THEME_HUE[t.id] + '" href="#/d/' + d.id + '"><div class="mini">' + esc(t.name) + '</div><h3>' + esc(d.title) + '</h3><p>' + esc(d.question) + '</p><div style="margin-top:10px">' + doorBadge(d) + '</div></a>';
      });
      h += '</div>';
    });
    h += '<h2>Using these in practice</h2><div class="lists two"><div class="box"><h3>In a design review</h3>' +
      ul(['Open the guide for the decision under discussion and read its **red flags** aloud.', 'Ask the **review questions** and note which have no answer yet.', 'For a **one-way door**, require a written decision record before approving.']) + '</div>' +
      '<div class="box ml"><h3>When planning a quarter</h3>' +
      ul(['Run the **solution shaper** to get a first stack and the decisions it flags.', 'Use the **maturity ladder** to set exit criteria for each phase.', 'Put the **cost calculator** numbers next to the roadmap, not after it.']) + '</div></div>';
    return h;
  }

  function pageDecision(id) {
    var d = decById[id]; if (!d) return notFound();
    var t = themeById[d.theme], i = A.decisions.indexOf(d);
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/d">Decisions</a> / ' + esc(t.name) + '</div><h1>' + esc(d.title) + '</h1><p class="lede">' + esc(d.question) + '</p>';
    h += '<div class="doorline">' + doorBadge(d) + '<span>' + fmt(d.doorNote) + '</span></div>';
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
    return h;
  }

  /* ----- solution shaper ----- */
  function pageShaper() {
    var Q = A.shaper.questions;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/d">Decisions</a> / Tool</div><h1>Solution shaper</h1>' +
      '<p class="lede">Describe the system. Get a starting shape you can argue with.</p>' +
      '<div class="callout"><b>Read this first</b>This is a rule-based starting point, not an architecture sign-off. It shows the usual shape for your answers and the decisions most worth a conversation. Your evals and constraints override it.</div>' +
      '<div class="shaper"><form id="shForm" class="shform" onsubmit="return false">';
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
    if (r.deeper && r.deeper.length) { L.push('', '## Go deeper'); r.deeper.forEach(function (d) { var t = deeperTarget(d); if (t) L.push('- ' + t[1] + ' (' + t[2].toLowerCase() + '): ' + d.why); }); }
    L.push('', '## Phasing'); r.phases.forEach(function (p, i) { L.push((i + 1) + '. ' + p); });
    L.push('', 'Generated by the Google Cloud AI Atlas. A starting point only: validate with your own evals.');
    return L.join('\n');
  }
  function deeperTarget(d) {
    if (d.k === 'a' && archById[d.id]) return ['#/a/' + d.id, archById[d.id].name, 'Architecture'];
    if (d.k === 'p' && guideById[d.id]) return ['#/p/' + d.id, guideById[d.id].title, 'Guide'];
    if (d.k === 'd' && d.id === 'finops') return ['#/d/finops', 'AI FinOps model', 'Tool'];
    if (d.k === 'd' && d.id === 'scorecard') return ['#/d/scorecard', 'Evaluation scorecard', 'Tool'];
    return null;
  }
  function deeperLinks(list) {
    return (list || []).map(function (d) { var t = deeperTarget(d); return t ? '<li><a href="' + t[0] + '">' + esc(t[1]) + '</a> <span class="fine">' + t[2] + '</span><br><span>' + esc(d.why) + '</span></li>' : ''; }).join('');
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
      var dl = deeperLinks(r.deeper);
      if (dl) h += '<h3>Go deeper</h3><ul class="nextl">' + dl + '</ul>';
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
      '<div class="callout"><b>About the numbers</b>Prices here are placeholders for the arithmetic. Look up current prices for your model and location, and measure your own token counts. Nothing is sent anywhere: the calculation runs in your browser.</div>' +
      '<div class="wide"><div class="calc"><form id="calcForm" class="calcform" onsubmit="return false">';
    CALC_FIELDS.forEach(function (g) {
      h += '<fieldset><legend>' + esc(g[0]) + '</legend>';
      g[1].forEach(function (f) {
        h += '<label class="num"><span class="nl2">' + esc(f[1]) + '</span><span class="inp">' + (f[2] === '$' ? '<i>$</i>' : '') +
          '<input type="number" inputmode="decimal" min="0" step="any" name="' + f[0] + '" aria-describedby="h-' + f[0] + '">' + (f[2] === '%' ? '<i>%</i>' : '') + '</span><small id="h-' + f[0] + '">' + esc(f[3]) + '</small></label>';
      });
      h += '</fieldset>';
    });
    h += '<button class="btn" type="button" id="calcReset">Reset to defaults</button></form><div id="calcOut" class="calcout" aria-live="polite"></div></div></div>';
    afterRender = mountCalculator;
    return h;
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

  function notFound() { return '<h1>Not found</h1><p class="lede">That page does not exist. <a href="#/">Back to the atlas</a>.</p>'; }

  /* ---------- sidebar ---------- */
  function nl(href, label, cur) { return '<a class="nl" href="' + href + '"' + (cur ? ' aria-current="page"' : '') + '>' + label + '</a>'; }
  function renderSide(kind, id) {
    var cur = kind === 's' && byId[id] ? byId[id].cat : (kind === 'c' ? id : null);
    var curTheme = kind === 'd' && decById[id] ? decById[id].theme : null;
    var h = '<h3>Explore</h3>' + nl('#/', 'Home', false) + nl('#/a', 'Architectures', kind === 'a' && !id) + '<h3>Decisions</h3>' +
      nl('#/d', 'Decision guides', kind === 'd' && !id) + nl('#/d/shaper', 'Solution shaper', kind === 'd' && id === 'shaper') +
      nl('#/d/checklists', 'Readiness checklists', kind === 'd' && id === 'checklists') + nl('#/d/calculator', 'Cost per task', kind === 'd' && id === 'calculator') +
      nl('#/d/finops', 'AI FinOps model', kind === 'd' && id === 'finops') + nl('#/d/scorecard', 'Evaluation scorecard', kind === 'd' && id === 'scorecard');
    A.decisionThemes.forEach(function (t) {
      var list = A.decisions.filter(function (d) { return d.theme === t.id; });
      h += '<details' + (curTheme === t.id ? ' open' : '') + '><summary style="--h:' + THEME_HUE[t.id] + '"><span class="dot"></span><span style="flex:1">' + esc(t.name) + '</span><span class="n">' + list.length + '</span></summary><ul>' +
        list.map(function (d) { return '<li><a href="#/d/' + d.id + '"' + (kind === 'd' && id === d.id ? ' aria-current="page"' : '') + '>' + esc(d.title) + '</a></li>'; }).join('') + '</ul></details>';
    });
    h += '<h3>Playbook</h3>' + nl('#/p', 'Operating guides', kind === 'p' && !id) + nl('#/t', 'Templates', kind === 't' && !id) +
      '<h3>Manager cockpit</h3>' + nl('#/m', 'Overview', kind === 'm' && !id) +
      A.cockpit.tabs.map(function (t) { return nl('#/m/' + t.id, esc(t.title), kind === 'm' && id === t.id); }).join('');
    h += '<h3>Services</h3>';
    A.categories.forEach(function (c) {
      h += '<details' + (cur === c.id ? ' open' : '') + '><summary style="--h:' + c.hue + '"><span class="dot"></span><a href="#/c/' + c.id + '"' + (kind === 'c' && id === c.id ? ' aria-current="page"' : '') + '>' + esc(c.name) + '</a><span class="n">' + c.items.length + '</span></summary><ul>' +
        c.items.map(function (s) { return '<li><a href="#/s/' + s.id + '"' + (kind === 's' && id === s.id ? ' aria-current="page"' : '') + '>' + esc(s.name) + '</a></li>'; }).join('') + '</ul></details>';
    });
    $('#side').innerHTML = h;
  }

  var UI = { $: $, $$: $$, esc: esc, fmt: fmt, ul: ul, paras: paras, copyText: copyText, money: money, tableHtml: tableHtml, renderBlocks: renderBlocks };

  /* ---------- router ---------- */
  function render() {
    $$('.stepper').forEach(function (el) { if (el._stop) el._stop(); });
    var parts = location.hash.replace(/^#\/?/, '').split('/'), kind = parts[0] || '', id = parts[1] || '';
    pendingSteppers = []; afterRender = null;
    var html, title = 'Google Cloud for AI/ML Systems — an interactive atlas';
    if (kind === 's' && byId[id]) { html = pageService(id); title = byId[id].name + ' — Google Cloud for AI/ML Systems'; }
    else if (kind === 'c' && catById[id]) { html = pageCategory(id); title = catById[id].name + ' — Google Cloud for AI/ML Systems'; }
    else if (kind === 'a') { if (id && archById[id]) { html = pageArch(id); title = archById[id].name + ' — Google Cloud for AI/ML Systems'; } else html = pageArchIndex(); }
    else if (kind === 'd') {
      var TOOLS = { shaper: ['Solution shaper', pageShaper], checklists: ['Readiness checklists', pageChecklists], calculator: ['Cost per task', pageCalculator] };
      Object.keys(window.ATLAS_TOOLS || {}).forEach(function (k) {
        var T = window.ATLAS_TOOLS[k];
        TOOLS[k] = [T.title, function () { afterRender = function () { T.mount(UI); }; return T.render(UI); }];
      });
      if (!id) { html = pageDecisionHub(); title = 'Decision guides — Google Cloud for AI/ML Systems'; }
      else if (TOOLS[id]) { html = TOOLS[id][1](); title = TOOLS[id][0] + ' — Google Cloud for AI/ML Systems'; }
      else if (decById[id]) { html = pageDecision(id); title = decById[id].title + ' — Google Cloud for AI/ML Systems'; }
      else html = notFound();
    }
    else if (kind === 'p') {
      if (!id) { html = pageGuideHub(); title = 'Operating guides — Google Cloud for AI/ML Systems'; }
      else if (guideById[id]) { html = pageGuide(id); title = guideById[id].title + ' — Google Cloud for AI/ML Systems'; }
      else html = notFound();
    }
    else if (kind === 't') {
      if (!id) { html = pageTemplates(); title = 'Management templates — Google Cloud for AI/ML Systems'; }
      else if (tplById[id]) { html = pageTemplate(id); title = tplById[id].title + ' — template — Google Cloud for AI/ML Systems'; }
      else html = notFound();
    }
    else if (kind === 'm') {
      var CK = window.ATLAS_COCKPIT, ckTab = id && A.cockpit.tabs.filter(function (t) { return t.id === id; })[0];
      if (!id || ckTab) {
        html = CK.render(UI, id); afterRender = function () { CK.mount(UI, id); };
        title = (ckTab ? ckTab.title + ' — ' : '') + 'Manager cockpit — Google Cloud for AI/ML Systems';
      } else html = notFound();
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
  window.addEventListener('hashchange', render);
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-jump]'); if (!a) return;
    e.preventDefault(); var t = document.getElementById(a.getAttribute('data-jump')); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

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

  var overlay = $('#overlay'), q = $('#q'), resultsEl = $('#results'), sel = 0, hits = [];
  var index = A.services.map(function (s) {
    return { type: 'Service', href: '#/s/' + s.id, name: s.name, id: s.id, tag: s.tag, cat: catById[s.cat].name, alias: (s.was || []).join(' ').toLowerCase(),
      hay: [s.name, s.id, s.tag, s.what, s.ml.join(' '), s.gotchas.join(' '), s.edges.join(' ')].join(' ').toLowerCase() };
  }).concat(A.architectures.map(function (a) {
    return { type: 'Architecture', href: '#/a/' + a.id, name: a.name, id: a.id, tag: a.short, cat: 'Architecture', hay: plain(a.name + ' ' + a.short + ' ' + a.why.join(' ') + ' ' + blocksText(a.sections)).toLowerCase() };
  })).concat((A.guides || []).map(function (g) {
    return { type: 'Guide', href: '#/p/' + g.id, name: g.title, id: g.id, tag: g.short, cat: 'Guide', hay: plain(g.title + ' ' + g.short + ' ' + (g.when || '') + ' ' + blocksText(g.blocks)).toLowerCase() };
  })).concat((A.templates || []).map(function (t) {
    return { type: 'Template', href: '#/t/' + t.id, name: t.title, id: t.id, tag: t.short, cat: 'Template', hay: plain(t.title + ' ' + t.short + ' ' + t.when + ' ' + t.body).toLowerCase() };
  })).concat(((A.cockpit && A.cockpit.tabs) || []).map(function (t) {
    return { type: 'Cockpit', href: '#/m/' + t.id, name: t.title, id: 'cockpit-' + t.id, tag: t.blurb, cat: 'Cockpit', hay: ('manager cockpit tracker ' + t.title + ' ' + t.blurb + ' ' + (t.cols || []).map(function (c) { return c.label; }).join(' ')).toLowerCase() };
  })).concat([{ type: 'Cockpit', href: '#/m', name: 'Manager cockpit', id: 'cockpit', tag: 'Track portfolio, delivery, quality, reliability, cost, security, skills and decisions', cat: 'Cockpit', hay: 'engineering manager dashboard tracker attention portfolio radar capability matrix' }]).concat(A.decisions.map(function (d) {
    return { type: 'Decision', href: '#/d/' + d.id, name: d.title, id: d.id, tag: d.question, cat: 'Decision guide',
      hay: plain([d.title, d.question, d.why, d.redflags.join(' '), d.ask.join(' '), d.rules.map(function (r) { return r.join(' '); }).join(' ')].join(' ')).toLowerCase() };
  })).concat([
    { type: 'Tool', href: '#/d/shaper', name: 'Solution shaper', id: 'shaper', tag: 'Get a starting stack, risks and next decisions for your use case', cat: 'Tool', hay: 'recommend stack wizard rag agent starting point' },
    { type: 'Tool', href: '#/d/checklists', name: 'Readiness checklists', id: 'checklists', tag: 'Maturity ladder, production readiness and decision record template', cat: 'Tool', hay: 'production readiness launch checklist adr decision record maturity prototype pilot scale' },
    { type: 'Tool', href: '#/d/scorecard', name: 'Evaluation scorecard', id: 'scorecard', tag: 'Compare candidates on one dataset and apply release gates', cat: 'Tool', hay: 'evals golden set release gate threshold regression compare models prompts agents retrieval pass fail' },
    { type: 'Tool', href: '#/d/finops', name: 'AI FinOps model', id: 'finops', tag: 'Component cost model and cost per successful task', cat: 'Tool', hay: 'cost tokens embeddings reranking vector retries budget routing cache parallel chunk size agent runtime unit economics' },
    { type: 'Tool', href: '#/d/calculator', name: 'Cost per task calculator', id: 'calculator', tag: 'Unit economics for LLM features and the levers that cut cost', cat: 'Tool', hay: 'price tokens caching batch unit economics budget' }
  ]);
  function openSearch() { overlay.hidden = false; q.value = ''; runSearch(); q.focus(); }
  function closeSearch() { overlay.hidden = true; }
  function runSearch() {
    var terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    hits = index.map(function (it) {
      var score = 0, ok = true;
      terms.forEach(function (t) {
        var nm = it.name.toLowerCase(), s = 0;
        if (nm.indexOf(t) === 0) s = 100; else if (nm.indexOf(t) > -1) s = 70; else if (it.id.indexOf(t) > -1) s = 55;
        else if (it.alias && it.alias.indexOf(t) > -1) s = 65;
        else if (it.tag.toLowerCase().indexOf(t) > -1) s = 30; else if (it.hay.indexOf(t) > -1) s = 10;
        if (!s) ok = false; score += s;
      });
      return { it: it, score: terms.length ? (ok ? score : 0) : 1 };
    }).filter(function (h) { return h.score > 0; }).sort(function (a, b) { return b.score - a.score || a.it.name.localeCompare(b.it.name); }).slice(0, 12);
    sel = 0; paint();
  }
  function paint() {
    resultsEl.innerHTML = hits.length ? hits.map(function (h, i) {
      return '<li role="option"><a href="' + h.it.href + '" class="' + (i === sel ? 'sel' : '') + '"><b>' + esc(h.it.name) + ' <small style="font-weight:400;color:var(--muted)">· ' + esc(h.it.cat) + '</small></b><span>' + esc(h.it.tag) + '</span></a></li>';
    }).join('') : '<li class="none">No matches. Try a service name or a concept like “vector” or “throttling”.</li>';
  }
  $('#searchBtn').addEventListener('click', openSearch);
  overlay.addEventListener('click', function (e) { if (e.target === overlay || e.target.closest('a')) closeSearch(); });
  q.addEventListener('input', runSearch);
  q.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(hits.length - 1, sel + 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
    else if (e.key === 'Enter' && hits[sel]) { location.hash = hits[sel].it.href; closeSearch(); }
  });
  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''));
    if (e.key === 'Escape') closeSearch();
    else if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openSearch(); }
  });

  render();
})();
