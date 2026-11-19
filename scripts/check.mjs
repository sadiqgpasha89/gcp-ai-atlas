// Validates the data files: node scripts/check.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="(data\/[^"]+)"/g)].map(m => m[1]);

const ctx = { window: {} };
ctx.window = ctx; // window === global
vm.createContext(ctx);
for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s });
const A = ctx.ATLAS;

const errs = [];
const err = (m) => errs.push(m);
const ids = new Set();
const readySee = []; // readiness see refs to guides, architectures, templates (checked once those are loaded)
const cats = new Set(A.categories.map(c => c.id));
const archIds = new Set();

for (const s of A.services) {
  const p = `service ${s.id}`;
  if (ids.has(s.id)) err(`${p}: duplicate id`);
  ids.add(s.id);
  if (!/^[a-z0-9-]+$/.test(s.id)) err(`${p}: id must match [a-z0-9-]+`);
}
const refRe = /\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g;
const checkText = (where, t) => {
  if (typeof t !== 'string' || !t.trim()) return err(`${where}: empty text`);
  for (const m of t.matchAll(refRe)) if (!ids.has(m[1])) err(`${where}: unknown [[${m[1]}]]`);
  if ((t.match(/`/g) || []).length % 2) err(`${where}: unbalanced backtick`);
  if ((t.match(/\*\*/g) || []).length % 2) err(`${where}: unbalanced **`);
};

for (const s of A.services) {
  const p = `service ${s.id}`;
  for (const k of ['cat', 'name', 'tag', 'what', 'cost', 'doc']) if (!s[k]) err(`${p}: missing ${k}`);
  if (!cats.has(s.cat)) err(`${p}: unknown category ${s.cat}`);
  for (const k of ['flow', 'steps', 'gotchas', 'edges', 'ml', 'pairs']) if (!Array.isArray(s[k]) || !s[k].length) err(`${p}: ${k} must be a non-empty array`);
  if (s.flow && (s.flow.length < 3 || s.flow.length > 7)) err(`${p}: flow length ${s.flow.length} outside 3..7`);
  checkText(`${p}.what`, s.what); checkText(`${p}.cost`, s.cost);
  (s.steps || []).forEach(([n, t], i) => {
    if (!Number.isInteger(n) || n < 0 || n >= s.flow.length) err(`${p}: step ${i + 1} node index ${n} out of range`);
    checkText(`${p}.steps[${i}]`, t);
  });
  const nodesUsed = new Set((s.steps || []).map(x => x[0]));
  (s.flow || []).forEach((f, i) => { if (!nodesUsed.has(i)) err(`${p}: flow node ${i} ("${f}") never highlighted by a step`); });
  for (const k of ['gotchas', 'edges', 'ml']) (s[k] || []).forEach((t, i) => checkText(`${p}.${k}[${i}]`, t));
  (s.pairs || []).forEach(x => { if (!ids.has(x)) err(`${p}: pairs references unknown ${x}`); if (x === s.id) err(`${p}: pairs references itself`); });
}

// product facts (data/meta.js)
const STAGES = ['GA', 'Preview', 'Mixed', 'Check'];
if (!/^\d{4}-\d{2}-\d{2}$/.test(A.metaReviewed || '')) err('metaReviewed must be YYYY-MM-DD');
for (const id of Object.keys(A.meta || {})) if (!ids.has(id)) err(`meta: unknown service ${id}`);
for (const s of A.services) {
  const m = (A.meta || {})[s.id], p = `meta ${s.id}`;
  if (!m) { err(`${p}: missing`); continue; }
  if (!STAGES.includes(m.s)) err(`${p}: s must be one of ${STAGES.join(', ')}`);
  if (!m.alt || m.alt.length < 20) err(`${p}: alt (alternatives and migration) is required`);
  if (m.price && !/^https:\/\//.test(m.price)) err(`${p}: price must be an https URL`);
  if (m.was && !Array.isArray(m.was)) err(`${p}: was must be an array`);
  for (const k of (m.v || [])) if (!['name', 'status', 'limits'].includes(k)) err(`${p}: unknown verified aspect ${k}`);
  if ((m.v || []).includes('limits') && !m.lim) err(`${p}: marked limits-verified but has no lim`);
  if ((m.v || []).includes('status') && m.s === 'Check') { /* allowed: verified that status is unclear */ }
  for (const k of ['reg', 'lim', 'alt']) if (m[k]) checkText(`${p}.${k}`, m[k]);
}

for (const a of A.architectures) {
  const p = `architecture ${a.id}`;
  if (archIds.has(a.id)) err(`${p}: duplicate id`); archIds.add(a.id);
  for (const k of ['name', 'short', 'when']) if (!a[k]) err(`${p}: missing ${k}`);
  a.flow.forEach((f, i) => { if (f.s && !ids.has(f.s)) err(`${p}: flow[${i}] unknown service ${f.s}`); });
  a.steps.forEach(([n, t], i) => {
    if (n < 0 || n >= a.flow.length) err(`${p}: step ${i + 1} node index out of range`);
    checkText(`${p}.steps[${i}]`, t);
  });
  const used = new Set(a.steps.map(x => x[0]));
  a.flow.forEach((f, i) => { if (!used.has(i)) err(`${p}: flow node ${i} never highlighted`); });
  for (const k of ['why', 'fails']) a[k].forEach((t, i) => checkText(`${p}.${k}[${i}]`, t));
  checkText(`${p}.when`, a.when);
}
const themeIds = new Set(A.decisionThemes.map(t => t.id));
const decIds = new Set();
for (const d of A.decisions) {
  const p = `decision ${d.id}`;
  if (decIds.has(d.id)) err(`${p}: duplicate id`); decIds.add(d.id);
  if (!/^[a-z0-9-]+$/.test(d.id)) err(`${p}: id must match [a-z0-9-]+`);
  if (['shaper', 'checklists', 'calculator'].includes(d.id)) err(`${p}: id clashes with a tool route`);
  if (!themeIds.has(d.theme)) err(`${p}: unknown theme ${d.theme}`);
  if (!['two-way', 'one-way', 'mixed'].includes(d.door)) err(`${p}: door must be two-way, one-way or mixed`);
  for (const k of ['title', 'question', 'doorNote', 'why', 'revisit']) checkText(`${p}.${k}`, d[k]);
  if (!Array.isArray(d.cols) || d.cols.length < 3) err(`${p}: cols needs at least 3 columns`);
  if (!Array.isArray(d.rows) || d.rows.length < 2) err(`${p}: rows needs at least 2 rows`);
  (d.rows || []).forEach((r, ri) => {
    if (r.length !== d.cols.length) err(`${p}: row ${ri} has ${r.length} cells, expected ${d.cols.length}`);
    r.forEach((c, ci) => checkText(`${p}.rows[${ri}][${ci}]`, c));
  });
  if (!Array.isArray(d.rules) || d.rules.length < 3) err(`${p}: rules needs at least 3 entries`);
  (d.rules || []).forEach((r, i) => { if (!Array.isArray(r) || r.length !== 2) err(`${p}: rules[${i}] must be [if, then]`); else r.forEach((t, j) => checkText(`${p}.rules[${i}][${j}]`, t)); });
  for (const k of ['redflags', 'ask']) {
    if (!Array.isArray(d[k]) || d[k].length < 3) err(`${p}: ${k} needs at least 3 entries`);
    (d[k] || []).forEach((t, i) => checkText(`${p}.${k}[${i}]`, t));
  }
  (d.related || []).forEach(x => { if (!ids.has(x)) err(`${p}: related references unknown service ${x}`); });
}
for (const t of A.decisionThemes) if (!A.decisions.some(d => d.theme === t.id)) err(`theme ${t.id}: has no decisions`);

// playbooks
if (!Array.isArray(A.ladder) || A.ladder.length !== 4) err('ladder: expected 4 stages');
(A.ladder || []).forEach(l => { for (const k of ['stage', 'time', 'goal']) checkText(`ladder ${l.stage}.${k}`, l[k]); for (const k of ['exit', 'skip']) (l[k] || []).forEach((t, i) => checkText(`ladder ${l.stage}.${k}[${i}]`, t)); });
const readyIds = new Set();
for (const g of A.readiness) {
  if (!g.items.length) err(`readiness group ${g.id}: empty`);
  for (const it of g.items) {
    const p = `readiness ${it.id}`;
    if (readyIds.has(it.id)) err(`${p}: duplicate id`); readyIds.add(it.id);
    if (!['agent', 'ml', 'both'].includes(it.kind)) err(`${p}: kind must be agent, ml or both`);
    checkText(`${p}.t`, it.t); checkText(`${p}.why`, it.why);
    (it.see || []).forEach(r => {
      const [k, id] = r.split(':');
      if (k === 'svc' && !ids.has(id)) err(`${p}: see unknown service ${id}`);
      else if (k === 'dec' && !decIds.has(id)) err(`${p}: see unknown decision ${id}`);
      else if (['p', 'a', 't'].includes(k)) readySee.push([p, k, id]);
      else if (!['svc', 'dec', 'p', 'a', 't'].includes(k)) err(`${p}: bad see ref ${r}`);
    });
  }
}
if (typeof A.adrTemplate !== 'string' || A.adrTemplate.length < 200) err('adrTemplate missing');

// solution shaper: exhaustively run every answer combination
const Q = A.shaper.questions;
let combos = 0;
const deeperChecks = [];
const walk = (i, a) => {
  if (i === Q.length) {
    combos++;
    let r;
    try { r = A.shaper.recommend(a); } catch (e) { return err(`shaper threw for ${JSON.stringify(a)}: ${e.message}`); }
    const w = `shaper ${Object.values(a).join('/')}`;
    if (!r.headline) err(`${w}: no headline`);
    if (r.arch && !archIds.has(r.arch)) err(`${w}: unknown architecture ${r.arch}`);
    if (!r.stack.length || !r.risks.length || !r.next.length || r.phases.length !== 4) err(`${w}: incomplete result`);
    const seen = new Set();
    r.stack.forEach(x => { if (!ids.has(x.id)) err(`${w}: unknown service ${x.id}`); if (seen.has(x.id)) err(`${w}: duplicate service ${x.id}`); seen.add(x.id); if (!x.role || !x.why) err(`${w}: ${x.id} missing role or why`); });
    r.next.forEach(x => { if (!decIds.has(x.id)) err(`${w}: unknown decision ${x.id}`); });
    deeperChecks.push([w, r.deeper || []]);
    return;
  }
  for (const o of Q[i].options) walk(i + 1, { ...a, [Q[i].id]: o[0] });
};
walk(0, {});

for (const [k, v] of Object.entries(A.shaper.defaults)) if (!Q.find(q => q.id === k)?.options.some(o => o[0] === v)) err(`shaper default ${k}=${v} is not an option`);

for (const c of A.categories) {
  if (!A.services.some(s => s.cat === c.id)) err(`category ${c.id}: has no services`);
  checkText(`category ${c.id}.lens`, c.lens);
}


// ---- content blocks (guides and architecture sections) ----
const TOOL_ROUTES = ['shaper', 'checklists', 'calculator', 'finops', 'scorecard'];
const BLOCK_TYPES = ['h2', 'h3', 'p', 'ul', 'ol', 'table', 'callout', 'two', 'cards', 'steps', 'runbook'];
const checkBlocks = (where, blocks, minH2 = 0) => {
  if (!Array.isArray(blocks) || !blocks.length) return err(`${where}: blocks must be a non-empty array`);
  let h2 = 0;
  blocks.forEach((b, i) => {
    const w = `${where}[${i}:${b.t}]`;
    if (!BLOCK_TYPES.includes(b.t)) return err(`${w}: unknown block type`);
    switch (b.t) {
      case 'h2': h2++; // fallthrough
      case 'h3': case 'p': checkText(w, b.text); break;
      case 'ul': case 'ol': if (!Array.isArray(b.items) || !b.items.length) err(`${w}: items`); else b.items.forEach((t, j) => checkText(`${w}.items[${j}]`, t)); break;
      case 'table':
        if (!Array.isArray(b.cols) || b.cols.length < 2) err(`${w}: cols needs at least 2`);
        if (!Array.isArray(b.rows) || !b.rows.length) err(`${w}: rows`);
        (b.rows || []).forEach((r, ri) => {
          if (r.length !== (b.cols || []).length) err(`${w}: row ${ri} has ${r.length} cells, expected ${(b.cols || []).length}`);
          r.forEach((c, ci) => checkText(`${w}.rows[${ri}][${ci}]`, c));
        });
        if (b.note) checkText(`${w}.note`, b.note);
        break;
      case 'callout': checkText(`${w}.title`, b.title); checkText(`${w}.text`, b.text); break;
      case 'two': for (const side of ['left', 'right']) { const x = b[side]; if (!x || !Array.isArray(x.items) || !x.items.length) err(`${w}.${side}: needs title and items`); else { checkText(`${w}.${side}.title`, x.title); x.items.forEach((t, j) => checkText(`${w}.${side}.items[${j}]`, t)); } } break;
      case 'cards': if (!Array.isArray(b.items) || !b.items.length) err(`${w}: items`); else b.items.forEach((c, j) => { checkText(`${w}.items[${j}].title`, c.title); checkText(`${w}.items[${j}].text`, c.text); }); break;
      case 'steps': if (!Array.isArray(b.items) || !b.items.length) err(`${w}: items`); else b.items.forEach((c, j) => { if (!Array.isArray(c) || c.length !== 2) err(`${w}.items[${j}]: must be [label, text]`); else { checkText(`${w}.items[${j}][0]`, c[0]); checkText(`${w}.items[${j}][1]`, c[1]); } }); break;
      case 'runbook':
        for (const k of ['id', 'title', 'trigger', 'prevent']) checkText(`${w}.${k}`, b[k]);
        for (const k of ['symptoms', 'triage', 'mitigate', 'root']) { if (!Array.isArray(b[k]) || b[k].length < 2) err(`${w}.${k}: needs at least 2 entries`); else b[k].forEach((t, j) => checkText(`${w}.${k}[${j}]`, t)); }
        break;
    }
  });
  if (h2 < minH2) err(`${where}: needs at least ${minH2} h2 sections, has ${h2}`);
};
const checkSrc = (where, src) => {
  if (!Array.isArray(src) || !src.length) return err(`${where}: src (sources) is required`);
  src.forEach((x, i) => { if (!Array.isArray(x) || x.length !== 2 || !x[0] || !/^https:\/\//.test(x[1])) err(`${where}.src[${i}]: must be [label, https URL]`); });
};
for (const a of A.architectures) {
  if (a.sections) { checkBlocks(`architecture ${a.id}.sections`, a.sections, 2); checkSrc(`architecture ${a.id}`, a.src); }
}

// ---- guides ----
const groupIds = new Set((A.guideGroups || []).map(g => g.id));
const guideIds = new Set();
for (const g of A.guides || []) {
  const p = `guide ${g.id}`;
  if (guideIds.has(g.id)) err(`${p}: duplicate id`); guideIds.add(g.id);
  if (!/^[a-z0-9-]+$/.test(g.id)) err(`${p}: id must match [a-z0-9-]+`);
  if (!groupIds.has(g.group)) err(`${p}: unknown group ${g.group}`);
  for (const k of ['title', 'short', 'when']) checkText(`${p}.${k}`, g[k]);
  checkBlocks(`${p}.blocks`, g.blocks, 3);
  checkSrc(p, g.src);
  (g.related || []).forEach(x => { if (!ids.has(x)) err(`${p}: related references unknown service ${x}`); });
}
for (const gr of A.guideGroups || []) if (!(A.guides || []).some(g => g.group === gr.id)) err(`guide group ${gr.id}: has no guides`);

// ---- management templates ----
const tplIds = new Set();
for (const t of A.templates || []) {
  const p = `template ${t.id}`;
  if (tplIds.has(t.id)) err(`${p}: duplicate id`); tplIds.add(t.id);
  if (!/^[a-z0-9-]+$/.test(t.id)) err(`${p}: id must match [a-z0-9-]+`);
  for (const k of ['title', 'short', 'when', 'who']) checkText(`${p}.${k}`, t[k]);
  if (typeof t.body !== 'string' || t.body.length < 300) err(`${p}: body must be at least 300 characters of markdown`);
  (t.related || []).forEach(x => { if (!ids.has(x)) err(`${p}: related references unknown service ${x}`); });
}

// shaper 'go deeper' targets (checked once guides and templates are known)
for (const [w, list] of deeperChecks) for (const d of list) {
  const ok = d.k === 'p' ? guideIds.has(d.id) : d.k === 'a' ? archIds.has(d.id) : d.k === 'd' ? TOOL_ROUTES.includes(d.id) || decIds.has(d.id) : false;
  if (!ok) err(`${w}: deeper link ${d.k}:${d.id} has no target`);
  if (!d.why) err(`${w}: deeper link ${d.k}:${d.id} needs why`);
}
// ---- cross-references with a prefix: [[p:guide|label]] [[a:arch]] [[d:decision]] [[t:template]] ----
const cockpitIds = new Set(((A.cockpit || {}).tabs || []).map(t => t.id));
const prefRe = /\[\[([padmt]):([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g;
const targetOk = (k, id) => k === 'p' ? guideIds.has(id) : k === 'a' ? archIds.has(id) : k === 'd' ? (decIds.has(id) || TOOL_ROUTES.includes(id)) : k === 't' ? (tplIds.has(id) || id === '') : k === 'm' ? (!A.cockpit || cockpitIds.has(id)) : false;
const walkStrings = (v, where, fn) => {
  if (typeof v === 'string') return fn(v, where);
  if (Array.isArray(v)) return v.forEach((x, i) => walkStrings(x, `${where}[${i}]`, fn));
  if (v && typeof v === 'object' && typeof v !== 'function') for (const [k, x] of Object.entries(v)) walkStrings(x, `${where}.${k}`, fn);
};
for (const [name, val] of [['services', A.services.map(s => ({ ...s, meta: undefined }))], ['architectures', A.architectures], ['decisions', A.decisions], ['guides', A.guides || []], ['templates', A.templates || []]]) {
  walkStrings(val, name, (t, w) => { for (const m of t.matchAll(prefRe)) if (!targetOk(m[1], m[2])) err(`${w}: dangling [[${m[1]}:${m[2]}]]`); });
}
for (const t of A.templates || []) (t.see || []).forEach(r => { const [k, id] = r.split(':'); if (!targetOk(k, id)) err(`template ${t.id}: see ${r} has no target`); });
// `see` lists on guides
for (const g of A.guides || []) (g.see || []).forEach(r => { const [k, id] = r.split(':'); if (!targetOk(k, id)) err(`guide ${g.id}: see ${r} has no target`); });

for (const [p, k, id] of readySee) if (!(k === 'p' ? guideIds : k === 'a' ? archIds : tplIds).has(id)) err(`${p}: see unknown ${k === 'p' ? 'guide' : k === 'a' ? 'architecture' : 'template'} ${id}`);
// ---- manager cockpit schema ----
if (A.cockpit) {
  const ck = A.cockpit, TYPES = ['text', 'select', 'number', 'money', 'percent', 'date', 'status'];
  if (!ck.storageKey) err('cockpit: storageKey missing');
  const skillIds = new Set((ck.skillList || []).map(x => x[0]));
  if (skillIds.size !== (ck.skillList || []).length || !skillIds.size) err('cockpit: skillList needs unique [id,label] pairs');
  const seen = new Set();
  for (const t of ck.tabs || []) {
    const p = `cockpit tab ${t.id}`;
    if (!t.id || seen.has(t.id)) err(`${p}: missing or duplicate id`); seen.add(t.id);
    if (!t.title || !t.blurb) err(`${p}: needs title and blurb`);
    if (t.special === 'skills') {
      for (const pe of t.samplePeople || []) for (const [k, v] of Object.entries(pe.levels || {})) { if (!skillIds.has(k)) err(`${p}: sample person ${pe.name} has unknown skill ${k}`); if (!(v >= 0 && v <= 4)) err(`${p}: level ${v} out of range`); }
      for (const [k, v] of Object.entries(t.sampleTargets || {})) { if (!skillIds.has(k)) err(`${p}: unknown target skill ${k}`); if (!(v >= 0 && v <= 4)) err(`${p}: target ${v} out of range`); }
      continue;
    }
    if (!Array.isArray(t.cols) || !t.cols.length) { err(`${p}: needs cols`); continue; }
    const keys = new Set();
    for (const c of t.cols) {
      if (!c.k || !c.label || !TYPES.includes(c.type)) err(`${p}: bad column ${JSON.stringify(c)}`);
      if (keys.has(c.k)) err(`${p}: duplicate column ${c.k}`); keys.add(c.k);
      if (c.type === 'select' && !(c.opts || []).length) err(`${p}: select column ${c.k} needs opts`);
    }
    for (const [i, r] of (t.sample || []).entries()) for (const [k, v] of Object.entries(r)) {
      const c = t.cols.find(x => x.k === k);
      if (!c) { err(`${p}: sample row ${i} has unknown field ${k}`); continue; }
      if (c.type === 'select' && v !== '' && !c.opts.includes(v)) err(`${p}: sample row ${i} ${k}="${v}" not in options`);
      if (c.type === 'status' && !['Green', 'Amber', 'Red'].includes(v)) err(`${p}: sample row ${i} ${k}="${v}" is not a status`);
      if (['number', 'money', 'percent'].includes(c.type) && typeof v !== 'number') err(`${p}: sample row ${i} ${k} must be a number`);
      if (c.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) err(`${p}: sample row ${i} ${k}="${v}" is not YYYY-MM-DD`);
    }
  }
  for (const need of ['portfolio', 'arch', 'project', 'quality', 'reliability', 'cost', 'security', 'skills', 'radar', 'decisions']) if (!seen.has(need)) err(`cockpit: missing tab ${need}`);
}

const words = A.services.reduce((n, s) => n + JSON.stringify(s).split(/\s+/).length, 0);
console.log(`${A.categories.length} categories, ${A.services.length} services, ${A.architectures.length} architectures, ${A.decisions.length} decision guides, ${(A.guides || []).length} guides, ${(A.templates || []).length} templates, ${A.readiness.reduce((n, g) => n + g.items.length, 0)} readiness items, ${combos} shaper combinations checked, ~${words} words in services`);
if (errs.length) { console.error(`\n${errs.length} problem(s):`); errs.forEach(e => console.error(' - ' + e)); process.exit(1); }
console.log('data OK');
