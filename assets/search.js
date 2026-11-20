/* Atlas search: index builder + query function. Pure (no DOM), so tests/search.test.mjs can load it in Node.
   Records are indexed by collecting every string they contain, so the index never depends on field names. */
(function (root) {
  'use strict';

  /* kind -> filter label. Order is the order of the filter chips. */
  var KINDS = [
    ['service', 'Services'], ['architecture', 'Architectures'], ['decision', 'Decisions'], ['playbook', 'Playbooks'],
    ['runbook', 'Runbooks'], ['security', 'Security'], ['tool', 'Tools'], ['lab', 'Labs'], ['guide', 'Guides']
  ];

  /* Acronyms and alternate terms. A query word that equals any member also matches every other member. */
  var ALIASES = [
    ['rag', 'retrieval augmented generation', 'retrieval-augmented generation'],
    ['mcp', 'model context protocol'],
    ['a2a', 'agent2agent', 'agent to agent'],
    ['adk', 'agent development kit'],
    ['iam', 'identity and access management', 'role based access control', 'rbac'],
    ['adr', 'architecture decision record', 'decision record'],
    ['slo', 'service level objective', 'service level objectives', 'error budget'],
    ['sla', 'service level agreement'],
    ['llm', 'large language model', 'language model', 'gemini'],
    ['iac', 'infrastructure as code', 'terraform', 'infrastructure manager'],
    ['hitl', 'human in the loop', 'human-in-the-loop'],
    ['finops', 'cost management', 'cost optimization', 'tco'],
    ['mlops', 'genaiops', 'llmops'],
    ['gke', 'kubernetes'],
    ['bq', 'bigquery'],
    ['psc', 'private service connect'],
    ['vpc-sc', 'vpc service controls', 'service perimeter'],
    ['cmek', 'customer managed encryption keys', 'customer-managed encryption keys', 'cloud kms'],
    ['429', 'throttling', 'resourceexhausted', 'resource exhausted', 'rate limit', 'rate limiting', 'quota'],
    ['pt', 'provisioned throughput'],
    ['scann', 'vector index', 'approximate nearest neighbor', 'ann'],
    ['rrf', 'reciprocal rank fusion', 'hybrid search'],
    ['bm25', 'keyword search', 'lexical search'],
    ['pii', 'personal data', 'sensitive data', 'sensitive data protection', 'sdp', 'dlp'],
    ['owasp', 'llm top 10'],
    ['dr', 'disaster recovery'],
    ['ocr', 'document ai', 'text extraction'],
    ['sdk', 'client library'],
    ['prr', 'production readiness review', 'readiness'],
    ['idp', 'intelligent document processing', 'document processing'],
    ['acl', 'permission-aware', 'security trimming', 'document level security']
  ];

  function flat(o, out) {
    if (o == null) return out;
    var t = typeof o;
    if (t === 'string') out.push(o);
    else if (t === 'number') out.push(String(o));
    else if (Array.isArray(o)) o.forEach(function (x) { flat(x, out); });
    else if (t === 'object') Object.keys(o).forEach(function (k) { flat(o[k], out); });
    return out;
  }

  /* Substring match, except that short terms (3 characters or fewer, such as "slo" or "pt") must be a whole word,
     so "slo" finds SLO but not "slots". */
  function has(text, t) {
    if (t.length > 3) return text.indexOf(t) > -1;
    for (var i = text.indexOf(t); i > -1; i = text.indexOf(t, i + 1)) {
      if ((i === 0 || !/[a-z0-9]/.test(text.charAt(i - 1))) && !/[a-z0-9]/.test(text.charAt(i + t.length))) return true;
    }
    return false;
  }

  function expand(term) {
    var alts = [term];
    ALIASES.forEach(function (g) { if (g.indexOf(term) > -1) g.forEach(function (m) { if (alts.indexOf(m) < 0) alts.push(m); }); });
    return alts;
  }

  /* Returns up to `limit` entries. kind = 'all' or a KINDS key. Ranking: name prefix 100, name contains 70,
     id contains 55, tag contains 30, body contains 10, summed across query words; every word must match. */
  function query(index, text, kind, limit) {
    var terms = String(text || '').toLowerCase().split(/\s+/).filter(Boolean);
    var alts = terms.map(expand);
    var res = index.filter(function (it) { return !kind || kind === 'all' || it.kind === kind; }).map(function (it) {
      var score = 0, ok = true, nm = it.name.toLowerCase(), tg = it.tag.toLowerCase();
      alts.forEach(function (as) {
        var best = 0;
        as.forEach(function (t, i) {
          var s = 0;
          if (nm.indexOf(t) === 0 && has(nm.slice(0, t.length + 1) + ' ', t)) s = 100; else if (has(nm, t)) s = 70; else if (has(it.id.toLowerCase(), t)) s = 55;
          else if (has(tg, t)) s = 30; else if (has(it.hay, t)) s = 10;
          if (i > 0 && s) s = Math.round(s * 0.9); /* the literal term outranks its aliases */
          if (s > best) best = s;
        });
        if (!best) ok = false; score += best;
      });
      return { it: it, score: terms.length ? (ok ? score : 0) : 1 };
    }).filter(function (h) { return h.score > 0; });
    res.sort(function (a, b) { return b.score - a.score || a.it.name.localeCompare(b.it.name); });
    return res.slice(0, limit || 20).map(function (h) { return h.it; });
  }

  /* Top-level pages: [kind, href, name, summary, category, extra keywords] */
  var PAGES = [
      ['tool', '#/tools', 'AI Engineering Interactive Tools', 'All 9 decision tools, comparison matrices, and calculators', 'Tool Hub', 'tools compare rag agent risk scorecard review shaper calculator checklists'],
      ['tool', '#/tools/compare', 'Service Comparison Engine', 'Side-by-side matrices for Vector, Agent Runtimes, Models, Orchestration', 'Tool', 'compare vector database search agent engine cloud run gke gemini claude llama'],
      ['tool', '#/tools/rag-assistant', 'RAG Architecture Design Assistant', '5-step interactive sizing & pattern wizard', 'Tool', 'rag assistant wizard vector search hybrid spanner chunking embedding'],
      ['tool', '#/tools/agent-assistant', 'Agentic Architecture Design Assistant', '4-step autonomy, tools & orchestration wizard', 'Tool', 'agent assistant wizard autonomous swarm hitl evaluator router adk'],
      ['tool', '#/tools/risk-analyzer', 'Architecture Risk Analyzer', 'STRIDE threat calculator and mitigation plan generator', 'Tool', 'risk analyzer stride threat prompt injection model armor security blast radius'],
      ['tool', '#/tools/readiness-scorecard', 'Production Readiness Scorecard', 'Interactive 30-point evaluation launch gate', 'Tool', 'scorecard readiness prr launch gate production checklist evaluation'],
      ['tool', '#/tools/review-gen', 'Architecture Review (ADR/PRR) Generator', 'Form-driven ADR & PRR markdown review generator', 'Tool', 'generator adr prr review markdown architecture decision record'],
      ['tool', '#/d/em', 'Decisions for engineering managers', 'Default calls, evidence to ask for, and the guides you lead', 'Decision tab', 'manager budget headcount risk launch gate quick calls'],
      ['tool', '#/d/pe', 'Decisions for principal engineers', 'Default designs, trade-offs and the tests to demand', 'Decision tab', 'principal architect design review adr trade-off quick calls'],
      ['tool', '#/d/shaper', 'Solution shaper', 'Get a starting stack, risks and next decisions for your use case', 'Tool', 'recommend stack wizard rag agent starting point'],
      ['tool', '#/d/checklists', 'Readiness checklists', 'Maturity ladder, production readiness and decision record template', 'Tool', 'production readiness launch checklist adr decision record maturity prototype pilot scale'],
      ['tool', '#/d/calculator', 'Cost per task calculator', 'Unit economics for LLM features and the levers that cut cost', 'Tool', 'price tokens caching batch unit economics budget'],
      ['security', '#/gov', 'Enterprise AI Governance & Landing Zones', 'Resource Manager landing zones, network isolation, 8-pillar security framework, tenancy models', 'Governance', 'landing zone resource manager hierarchy shared vpc psc cloud armor security framework tenancy org policy'],
      ['guide', '#/ops', 'Production AI Operations Centre', '10-widget dashboard template, Cloud Logging / Monitoring queries, SRE runbooks, postmortem template', 'Operations', 'dashboard cloud logging monitoring query runbook 429 throttling postmortem incident sre latency ttft gemini'],
      ['tool', '#/toolkit', 'AI Engineering Manager Toolkit', '8 production templates, 12 industry use cases, daily cockpit, RACI, RAID, quality gates', 'Toolkit', 'toolkit templates sdd adr prr threat model eval report finops incident runbook use cases industry daily cockpit assessment'],
      ['lab', '#/labs', 'Hands-on Labs & Learning Roadmaps', '12 production projects, 16-week curriculum, 3-tier competency model, capability radar', 'Labs', 'labs exercises tutorial roadmaps learn curriculum hands-on projects']
  ,
    ['guide', '#/freshness', 'Content freshness and sources', 'What has been verified against Google Cloud documentation, when, and what has not', 'Guide', 'verified verification freshness lifecycle deprecated stale review sources accuracy']
  ];

  function build(A) {
    var byId = {};
    A.services.forEach(function (s) { byId[s.id] = s; });
    var meta = A.meta || {};
    function plain(s) {
      return String(s).replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, function (m, id, label) { return label || (byId[id] ? byId[id].name : id); });
    }
    function hayOf(o) { return plain(flat(o, []).join(' ')).replace(/[`*]/g, '').toLowerCase(); }
    var out = [];
    function add(kind, type, href, name, tag, cat, obj, extra) {
      if (!name) return;
      out.push({ kind: kind, type: type, href: href, name: String(name), tag: String(tag || ''), cat: cat, id: href,
        hay: hayOf(obj) + (extra ? ' ' + String(extra).toLowerCase() : '') });
    }
    var catById = {}; A.categories.forEach(function (c) { catById[c.id] = c; });

    A.services.forEach(function (s) { add('service', 'Service', '#/s/' + s.id, s.name, s.tag, catById[s.cat].name, s, s.id + ' ' + ((meta[s.id] || {}).was || []).join(' ')); });
    A.architectures.forEach(function (a) { add('architecture', 'Architecture', '#/a/' + a.id, a.name, a.short, 'Architecture', a, a.id); });
    A.decisions.forEach(function (d) { add('decision', 'Decision', '#/d/' + d.id, d.title, d.question, 'Decision guide', d, d.id); });
    A.engineeringPlaybooks.forEach(function (p) { add('playbook', 'Playbook', '#/p/' + p.id, p.title, p.tag, 'Playbook', p, p.id); });
    (A.labs.localLabs || []).forEach(function (l) { add('lab', 'Local lab', '#/labs', 'Local lab: ' + l.title, l.objective, 'Runnable local lab', l, l.id); });
    (A.toolkit.templates || []).forEach(function (t) { add('tool', 'Template', '#/toolkit', String(t.title).replace(/^\d+\.\s*/, ''), t.desc, 'Template', t, t.id); });
    PAGES.forEach(function (t) { add(t[0], 'Page', t[1], t[2], t[3], t[4], null, t[5]); });

    /* Individual items inside modules. They link to the module page. */
    function each(arr, fn) { (arr || []).forEach(fn); }
    each(A.operations && A.operations.runbooks, function (r) { add('runbook', 'Runbook', '#/ops', r.title, r.trigger, 'Operations', r); });
    each(A.toolkit && A.toolkit.useCaseCatalog, function (u) { add('guide', 'Use case', '#/toolkit', u.title, u.desc, 'Toolkit', u); });
    each(A.toolkit && A.toolkit.qualityGates && A.toolkit.qualityGates.stages, function (g) { add('security', 'Quality gate', '#/toolkit', g.stage, (g.criteria || [])[0], 'Toolkit', g); });
    each(A.labs && A.labs.exercises, function (e) { add('lab', 'Lab', '#/labs', e.title, e.goal, 'Labs', e); });
    each(A.labs && A.labs.learningPaths, function (p) { add('lab', 'Learning path', '#/labs', p.role, p.objective, 'Labs', p); });
    each(A.labs && A.labs.curriculum16Week && A.labs.curriculum16Week.phases, function (p) { add('lab', 'Curriculum phase', '#/labs', p.phase, p.focus, 'Labs', p); });
    each(A.labs && A.labs.radarBenchmark && A.labs.radarBenchmark.dimensions, function (d) { add('guide', 'Capability', '#/labs', d.name, d.desc, 'Labs', d); });
    return out;
  }


  var api = { build: build, query: query, expand: expand, KINDS: KINDS, ALIASES: ALIASES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AtlasSearch = api;
})(typeof window !== 'undefined' ? window : globalThis);
