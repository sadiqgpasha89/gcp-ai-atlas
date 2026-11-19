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
      '<div class="eyebrow">The AI Engineering Management Operating System · ' + n + ' services · ' + A.architectures.length + ' architectures · ' + A.decisions.length + ' decisions</div>' +
      '<h1>Google Cloud for AI Systems — an interactive atlas.</h1>' +
      '<p class="lede">From cloud catalog to engineering management operating system: what to build, how to deliver it, how to govern it, and how to operate multi-agent and generative AI systems in production.</p>' +
      '<div class="btns">' +
        '<a class="btn primary" href="#/p">Engineering Playbooks →</a>' +
        '<a class="btn" href="#/a">Architectures</a>' +
        '<a class="btn" href="#/d">Decision Guides</a>' +
        '<a class="btn" href="#/ops">Operations Centre</a>' +
        '<a class="btn" href="#/toolkit">Manager Toolkit</a>' +
      '</div>' +
      '</div>' + heroSVG() + '</section>';

    h += '<h2>The 8 Pillars of Production AI Engineering</h2>' +
      '<p style="max-width:68ch">A complete operational lifecycle for engineering managers, principal engineers, and architects delivering generative AI and multi-agent systems on Google Cloud.</p>' +
      '<div class="grid">' +
      '<a class="card" style="--h:212" href="#/c/genai"><div class="mini">Pillar 1</div><h3>1. Services Catalogue</h3><p>73 Google Cloud AI, compute, data, and security services with lifecycle status, pricing notes, and implementation gotchas.</p></a>' +
      '<a class="card" style="--h:268" href="#/a"><div class="mini">Pillar 2</div><h3>2. Reference Architectures</h3><p>13 end-to-end architectures including Traditional RAG, Agentic RAG, GraphRAG, Multimodal RAG, Multi-Agent Orchestration, and GenAIOps.</p></a>' +
      '<a class="card" style="--h:150" href="#/d"><div class="mini">Pillar 3</div><h3>3. Architecture Decision Centre</h3><p>23 architectural decision guides with dedicated Engineering Manager and Principal Engineer lenses and one-way-door risk markers.</p></a>' +
      '<a class="card" style="--h:212" href="#/p"><div class="mini">Pillar 4</div><h3>4. AI Engineering Playbooks</h3><p>5 deep playbooks: RAG Engineering, Multi-Agent Orchestration, GenAIOps Lifecycle, Security Hardening, and SRE/Reliability.</p></a>' +
      '<a class="card" style="--h:25" href="#/gov"><div class="mini">Pillar 5</div><h3>5. Security & Governance</h3><p>Resource Manager hierarchy, Shared VPC network topology, 8-pillar security framework, and Organization Policies.</p></a>' +
      '<a class="card" style="--h:185" href="#/ops"><div class="mini">Pillar 6</div><h3>6. Operations Centre</h3><p>Mandatory 10-widget production AI dashboard with Cloud Logging / Monitoring queries, 4 SRE runbooks, and AI postmortem template.</p></a>' +
      '<a class="card" style="--h:40" href="#/toolkit"><div class="mini">Pillar 7</div><h3>7. Manager Toolkit</h3><p>Use-case assessment matrix, project estimation model, RACI matrix, RAID tracker, quality gates, and executive templates.</p></a>' +
      '<a class="card" style="--h:305" href="#/labs"><div class="mini">Pillar 8</div><h3>8. Hands-on Labs & Roadmaps</h3><p>3 role-based progressive roadmaps (EM, PE, Engineer), 5 hands-on production labs, and official Google Cloud Architecture links.</p></a>' +
      '</div>';

    h += '<h2>Service catalogue by category</h2><p style="max-width:62ch">Services are grouped by the job they do in an AI/ML system. Each page ends with how to use the service in production, gotchas, and what it pairs with.</p><div class="grid">';
    A.categories.forEach(function (c) {
      h += '<a class="card catcard" style="--h:' + c.hue + '" href="#/c/' + c.id + '">' + miniCube(c.hue) + '<div class="mini">' + c.items.length + ' services</div><h3>' + esc(c.name) + '</h3><p>' + esc(c.short) + '</p></a>';
    });
    h += '</div><h2>Reference Architectures (13)</h2><p style="max-width:62ch">Production blueprints from classic RAG to multi-agent orchestration and GenAIOps pipelines. Step-through diagrams where every node links to its service.</p><div class="grid">';
    A.architectures.forEach(function (a) {
      h += '<a class="card" style="--h:215" href="#/a/' + a.id + '"><div class="mini">Architecture</div><h3>' + esc(a.name) + '</h3><p>' + esc(a.short) + '</p></a>';
    });
    h += '</div><h2>Leadership & Decision Tools</h2><p style="max-width:62ch">Practical instruments for engineering managers and principal engineers navigating high-stakes AI architectural decisions.</p><div class="grid">' +
      '<a class="card" style="--h:215" href="#/d/em"><div class="mini">Decision tab</div><h3>Engineering managers</h3><p>Default calls, evidence to ask for and launch gates, across ' + A.decisions.length + ' guides.</p></a>' +
      '<a class="card" style="--h:268" href="#/d/pe"><div class="mini">Decision tab</div><h3>Principal engineers</h3><p>Default designs, trade-offs and the tests to demand in design review.</p></a>' +
      '<a class="card" style="--h:215" href="#/d/shaper"><div class="mini">Interactive</div><h3>Solution shaper</h3><p>Seven questions in, a starting stack and the decisions to make next out.</p></a>' +
      '<a class="card" style="--h:150" href="#/d/checklists"><div class="mini">Checklist</div><h3>Readiness checklists</h3><p>Maturity ladder, production readiness and a decision-record template.</p></a>' +
      '<a class="card" style="--h:185" href="#/d/calculator"><div class="mini">Calculator</div><h3>Cost per task</h3><p>See which levers move the bill most.</p></a>' +
      '<a class="card" style="--h:40" href="#/toolkit"><div class="mini">Toolkit</div><h3>EM Frameworks & RACI</h3><p>Estimation model, RACI matrix, RAID log and review templates.</p></a>' +
      '</div></div>';
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
      (s.doc ? '<a href="https://cloud.google.com/' + esc(s.doc) + '" target="_blank" rel="noopener">Google Cloud docs ↗</a>' : '') + '</div>';
    h += '<h1>' + esc(s.name) + '</h1><p class="lede">' + esc(s.tag) + '</p>';
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
    var used = {}; a.flow.forEach(function (f) { if (f.s) used[f.s] = 1; });
    var ids = Object.keys(used);
    if (ids.length) h += '<h2>Services involved</h2><div class="pairs">' + ids.map(function (p) { return '<a href="#/s/' + p + '">' + esc(byId[p].name) + '</a>'; }).join('') + '</div>';
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

  /* ---------- playbooks ---------- */
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

  function pagePlaybook(id) {
    var pb = A.engineeringPlaybooks.find(function (p) { return p.id === id; });
    if (!pb) return notFound();
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/p">Playbooks</a></div>' +
      '<h1>' + esc(pb.title) + '</h1>' +
      '<div style="margin:8px 0 16px"><span class="chip" style="--h:215">' + esc(pb.badge) + '</span></div>' +
      '<p class="lede">' + esc(pb.tag) + '</p>' +
      '<div class="callout"><b>Playbook Scope & Context</b>' + fmt(pb.intro) + '</div>';

    (pb.sections || []).forEach(function (sec) {
      h += '<h2>' + esc(sec.title) + '</h2>';
      if (sec.body) h += paras(sec.body);
      if (sec.bullets && sec.bullets.length) h += ul(sec.bullets);
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
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Type</th><th>Risk / Assumption / Issue / Dependency</th><th>Engineering Mitigation Strategy</th></tr></thead><tbody>' +
      tk.raidTracker.items.map(function (it) {
        var cls = it.type === 'Risk' ? 'door one-way' : (it.type === 'Issue' ? 'door mixed' : 'door two-way');
        return '<tr><td><span class="' + cls + '">' + esc(it.type) + '</span></td><td><b>' + esc(it.title) + '</b></td><td>' + fmt(it.mitigation) + '</td></tr>';
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

    // Copyable Templates
    h += '<h2>Copyable Leadership Templates</h2>' +
      '<div class="box" style="margin:16px 0">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<h3>' + esc(tk.architectureReview.title) + '</h3>' +
          '<button class="btn" type="button" id="copyArchReview">Copy Review Template</button>' +
        '</div>' +
        '<p style="margin:8px 0;color:var(--muted)">' + fmt(tk.architectureReview.intro) + '</p>' +
        '<pre class="adr" style="margin-top:10px">' + esc(tk.architectureReview.templateMarkdown) + '</pre>' +
      '</div>' +
      '<div class="box" style="margin:16px 0">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<h3>' + esc(tk.executiveReportTemplate.title) + '</h3>' +
          '<button class="btn" type="button" id="copyExecReport">Copy Executive Report</button>' +
        '</div>' +
        '<p style="margin:8px 0;color:var(--muted)">' + fmt(tk.executiveReportTemplate.intro) + '</p>' +
        '<pre class="adr" style="margin-top:10px">' + esc(tk.executiveReportTemplate.templateMarkdown) + '</pre>' +
      '</div>';

    afterRender = function () {
      var btn1 = $('#copyArchReview');
      if (btn1) btn1.addEventListener('click', function () { copyText(tk.architectureReview.templateMarkdown, this); });
      var btn2 = $('#copyExecReport');
      if (btn2) btn2.addEventListener('click', function () { copyText(tk.executiveReportTemplate.templateMarkdown, this); });
    };

    return h;
  }

  /* ---------- labs & roadmaps ---------- */
  function pageLabs() {
    var l = A.labs;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Labs & Roadmaps</div>' +
      '<h1>' + esc(l.title) + '</h1>' +
      '<p class="lede">' + fmt(l.lede) + '</p>';

    // Learning Paths
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

    // Hands-on Labs
    h += '<h2>Hands-on Production Labs (5 Exercises)</h2>' +
      '<p style="max-width:62ch">Step-by-step practical implementation exercises for engineering teams using the Google Cloud Console, gcloud CLI, and Python SDK.</p>';

    l.exercises.forEach(function (ex) {
      h += '<div class="lab-card">' +
        '<div class="lab-header">' +
          '<span class="lab-level">' + esc(ex.level) + '</span>' +
          '<span class="lab-time">⏱ ' + esc(ex.time) + '</span>' +
        '</div>' +
        '<h3>' + esc(ex.title) + '</h3>' +
        '<p style="color:var(--muted)"><b>Lab Goal:</b> ' + fmt(ex.goal) + '</p>' +
        '<h4>Step-by-Step Instructions:</h4>' +
        '<ol class="lab-steps">' +
        ex.steps.map(function (st) { return '<li>' + fmt(st) + '</li>'; }).join('') +
        '</ol>' +
      '</div>';
    });

    // Google Cloud Architecture Hub
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

  function notFound() { return '<h1>Not found</h1><p class="lede">That page does not exist. <a href="#/">Back to the atlas</a>.</p>'; }

  /* ---------- sidebar ---------- */
  function nl(href, label, cur) { return '<a class="nl" href="' + href + '"' + (cur ? ' aria-current="page"' : '') + '>' + label + '</a>'; }
  function renderSide(kind, id) {
    var cur = kind === 's' && byId[id] ? byId[id].cat : (kind === 'c' ? id : null);
    var curTheme = kind === 'd' && decById[id] ? decById[id].theme : null;
    var h = '<h3>Explore</h3>' +
      nl('#/', 'Home', !kind) +
      nl('#/a', 'Architectures (' + A.architectures.length + ')', kind === 'a' && !id) +
      nl('#/d', 'Decision Centre (' + A.decisions.length + ')', kind === 'd' && !id) +
      nl('#/p', 'Engineering Playbooks (' + A.engineeringPlaybooks.length + ')', kind === 'p' && !id) +
      nl('#/gov', 'Security & Governance', kind === 'gov') +
      nl('#/ops', 'Production Operations', kind === 'ops') +
      nl('#/toolkit', 'Manager Toolkit', kind === 'toolkit') +
      nl('#/labs', 'Labs & Roadmaps', kind === 'labs');

    h += '<h3>Playbooks</h3>';
    A.engineeringPlaybooks.forEach(function (p) {
      var shortTitle = p.title.replace(' Playbook', '').replace(' Engineering & Orchestration', '').replace(' & Hardening', '');
      h += nl('#/p/' + p.id, shortTitle, kind === 'p' && id === p.id);
    });

    h += '<h3>Decisions & Tools</h3>' +
      nl('#/d/em', 'For engineering managers', kind === 'd' && id === 'em') +
      nl('#/d/pe', 'For principal engineers', kind === 'd' && id === 'pe') +
      nl('#/d/shaper', 'Solution shaper', kind === 'd' && id === 'shaper') +
      nl('#/d/checklists', 'Readiness checklists', kind === 'd' && id === 'checklists') +
      nl('#/d/calculator', 'Cost per task', kind === 'd' && id === 'calculator');

    A.decisionThemes.forEach(function (t) {
      var list = A.decisions.filter(function (d) { return d.theme === t.id; });
      h += '<details' + (curTheme === t.id ? ' open' : '') + '><summary style="--h:' + THEME_HUE[t.id] + '"><span class="dot"></span><span style="flex:1">' + esc(t.name) + '</span><span class="n">' + list.length + '</span></summary><ul>' +
        list.map(function (d) { return '<li><a href="#/d/' + d.id + '"' + (kind === 'd' && id === d.id ? ' aria-current="page"' : '') + '>' + esc(d.title) + '</a></li>'; }).join('') + '</ul></details>';
    });

    h += '<h3>Architectures (' + A.architectures.length + ')</h3>';
    h += '<details' + (kind === 'a' && id ? ' open' : '') + '><summary style="--h:215"><span class="dot"></span><span>All Architectures</span><span class="n">' + A.architectures.length + '</span></summary><ul>' +
      A.architectures.map(function (a) { return '<li><a href="#/a/' + a.id + '"' + (kind === 'a' && id === a.id ? ' aria-current="page"' : '') + '>' + esc(a.name) + '</a></li>'; }).join('') + '</ul></details>';

    h += '<h3>Services (' + A.services.length + ')</h3>';
    A.categories.forEach(function (c) {
      h += '<details' + (cur === c.id ? ' open' : '') + '><summary style="--h:' + c.hue + '"><span class="dot"></span><a href="#/c/' + c.id + '"' + (kind === 'c' && id === c.id ? ' aria-current="page"' : '') + '>' + esc(c.name) + '</a><span class="n">' + c.items.length + '</span></summary><ul>' +
        c.items.map(function (s) { return '<li><a href="#/s/' + s.id + '"' + (kind === 's' && id === s.id ? ' aria-current="page"' : '') + '>' + esc(s.name) + '</a></li>'; }).join('') + '</ul></details>';
    });
    $('#side').innerHTML = h;
  }

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
      if (!id || id === 'em' || id === 'pe' || id === 'all') { html = pageDecisionHub(id); title = (id === 'em' ? 'Decisions for engineering managers' : id === 'pe' ? 'Decisions for principal engineers' : 'Decision guides') + ' — Google Cloud for AI/ML Systems'; }
      else if (TOOLS[id]) { html = TOOLS[id][1](); title = TOOLS[id][0] + ' — Google Cloud for AI/ML Systems'; }
      else if (decById[id]) { html = pageDecision(id); title = decById[id].title + ' — Google Cloud for AI/ML Systems'; }
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
    return { type: 'Service', href: '#/s/' + s.id, name: s.name, id: s.id, tag: s.tag, cat: catById[s.cat].name,
      hay: [s.name, s.id, s.tag, s.what, s.ml.join(' '), s.gotchas.join(' '), s.edges.join(' ')].join(' ').toLowerCase() };
  }).concat(A.architectures.map(function (a) {
    return { type: 'Architecture', href: '#/a/' + a.id, name: a.name, id: a.id, tag: a.short, cat: 'Architecture', hay: (a.name + ' ' + a.short + ' ' + a.why.join(' ')).toLowerCase() };
  })).concat(A.decisions.map(function (d) {
    return { type: 'Decision', href: '#/d/' + d.id, name: d.title, id: d.id, tag: d.question, cat: 'Decision guide',
      hay: plain([d.title, d.question, d.why, d.em.call, d.pe.call, d.redflags.join(' '), d.ask.join(' '), d.rules.map(function (r) { return r.join(' '); }).join(' ')].join(' ')).toLowerCase() };
  })).concat(A.engineeringPlaybooks.map(function (p) {
    return { type: 'Playbook', href: '#/p/' + p.id, name: p.title, id: p.id, tag: p.tag, cat: 'Playbook',
      hay: (p.title + ' ' + p.tag + ' ' + p.intro + ' ' + p.sections.map(function (s) { return s.title + ' ' + (s.body || '') + ' ' + (s.bullets ? s.bullets.join(' ') : ''); }).join(' ')).toLowerCase() };
  })).concat([
    { type: 'Tool', href: '#/d/em', name: 'Decisions for engineering managers', id: 'em', tag: 'Default calls, evidence to ask for, and the guides you lead', cat: 'Decision tab', hay: 'manager budget headcount risk launch gate quick calls' },
    { type: 'Tool', href: '#/d/pe', name: 'Decisions for principal engineers', id: 'pe', tag: 'Default designs, trade-offs and the tests to demand', cat: 'Decision tab', hay: 'principal architect design review adr trade-off quick calls' },
    { type: 'Tool', href: '#/d/shaper', name: 'Solution shaper', id: 'shaper', tag: 'Get a starting stack, risks and next decisions for your use case', cat: 'Tool', hay: 'recommend stack wizard rag agent starting point' },
    { type: 'Tool', href: '#/d/checklists', name: 'Readiness checklists', id: 'checklists', tag: 'Maturity ladder, production readiness and decision record template', cat: 'Tool', hay: 'production readiness launch checklist adr decision record maturity prototype pilot scale' },
    { type: 'Tool', href: '#/d/calculator', name: 'Cost per task calculator', id: 'calculator', tag: 'Unit economics for LLM features and the levers that cut cost', cat: 'Tool', hay: 'price tokens caching batch unit economics budget' },
    { type: 'Governance', href: '#/gov', name: 'Enterprise AI Governance & Landing Zones', id: 'gov', tag: 'Resource Manager landing zones, network isolation, 8-pillar security framework, tenancy models', cat: 'Governance', hay: 'landing zone resource manager hierarchy shared vpc psc cloud armor security framework tenancy org policy' },
    { type: 'Operations', href: '#/ops', name: 'Production AI Operations Centre', id: 'ops', tag: '10-widget dashboard template, Cloud Logging / Monitoring queries, SRE runbooks, postmortem template', cat: 'Operations', hay: 'dashboard cloud logging monitoring query runbook 429 throttling postmortem incident sre latency ttft gemini' },
    { type: 'Toolkit', href: '#/toolkit', name: 'AI Engineering Manager Toolkit', id: 'toolkit', tag: 'Use-case assessment, estimation, RACI, RAID, quality gates, skills matrix', cat: 'Toolkit', hay: 'toolkit assessment estimation raci raid quality gates vendor skills executive status report template' },
    { type: 'Labs', href: '#/labs', name: 'Hands-on Labs & Learning Roadmaps', id: 'labs', tag: 'Role roadmaps, 5 implementation labs, Google Cloud Architecture links', cat: 'Labs', hay: 'labs exercises tutorial roadmaps learn curriculum hands-on' }
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
