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
  if (['shaper', 'checklists', 'calculator', 'em', 'pe', 'all'].includes(d.id)) err(`${p}: id clashes with a tool route`);
  if (!themeIds.has(d.theme)) err(`${p}: unknown theme ${d.theme}`);
  if (!['em', 'pe', 'both'].includes(d.lead)) err(`${p}: lead must be em, pe or both`);
  for (const role of ['em', 'pe']) {
    const x = d[role];
    if (!x || typeof x !== 'object') { err(`${p}: missing ${role} lens`); continue; }
    checkText(`${p}.${role}.call`, x.call);
    for (const k of ['own', 'evidence']) {
      if (!Array.isArray(x[k]) || x[k].length < 2) err(`${p}.${role}.${k}: needs at least 2 entries`);
      (x[k] || []).forEach((t, i) => checkText(`${p}.${role}.${k}[${i}]`, t));
    }
  }
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

// roles (decision tabs)
if (!Array.isArray(A.roles) || A.roles.length !== 2 || A.roles.map(r => r.id).join() !== 'em,pe') err('roles: expected [em, pe]');
for (const r of A.roles || []) {
  const p = `role ${r.id}`;
  for (const k of ['name', 'blurb']) checkText(`${p}.${k}`, r[k]);
  for (const k of ['owns']) { if (!Array.isArray(r[k]) || r[k].length < 3) err(`${p}.${k}: needs at least 3 entries`); (r[k] || []).forEach((t, i) => checkText(`${p}.${k}[${i}]`, t)); }
  if (!Array.isArray(r.quick) || r.quick.length < 5) err(`${p}.quick: needs at least 5 rows`);
  (r.quick || []).forEach(([sit, call, dec], i) => { checkText(`${p}.quick[${i}].situation`, sit); checkText(`${p}.quick[${i}].call`, call); if (!decIds.has(dec)) err(`${p}.quick[${i}]: unknown decision ${dec}`); });
  if (!Array.isArray(r.rhythm) || r.rhythm.length < 3) err(`${p}.rhythm: needs at least 3 rows`);
  (r.rhythm || []).forEach(([when, what], i) => { checkText(`${p}.rhythm[${i}].when`, when); checkText(`${p}.rhythm[${i}].what`, what); });
}
for (const role of ['em', 'pe']) if (!A.decisions.some(d => d.lead === role)) err(`no decision is led by ${role}`);

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
      else if (k !== 'svc' && k !== 'dec') err(`${p}: bad see ref ${r}`);
    });
  }
}
if (typeof A.adrTemplate !== 'string' || A.adrTemplate.length < 200) err('adrTemplate missing');

// engineering playbooks
if (!Array.isArray(A.engineeringPlaybooks) || A.engineeringPlaybooks.length < 5) err('engineeringPlaybooks: expected at least 5 playbooks');
for (const p of A.engineeringPlaybooks || []) {
  const loc = `playbook ${p.id}`;
  for (const k of ['title', 'badge', 'tag', 'intro']) checkText(`${loc}.${k}`, p[k]);
  for (const sec of p.sections || []) {
    checkText(`${loc}.${sec.title}`, sec.title);
    if (sec.body) checkText(`${loc}.${sec.title}.body`, sec.body);
    for (const b of sec.bullets || []) checkText(`${loc}.${sec.title}.bullet`, b);
    for (const tip of sec.tips || []) checkText(`${loc}.${sec.title}.tip`, tip);
  }
  (p.see || []).forEach(r => {
    const [k, id] = r.split(':');
    if (k === 'svc' && !ids.has(id)) err(`${loc}: see unknown service ${id}`);
    else if (k === 'dec' && !decIds.has(id)) err(`${loc}: see unknown decision ${id}`);
    else if (k === 'arch' && !archIds.has(id)) err(`${loc}: see unknown architecture ${id}`);
  });
}

// governance
if (!A.governance || typeof A.governance !== 'object') err('governance: missing A.governance');
else {
  const g = A.governance;
  if (!g.landingZones || !g.securityFramework || !g.tenancyModels || !g.policyInitiatives) err('governance: missing core sections');
  checkText('governance.landingZones.title', g.landingZones.title);
  checkText('governance.landingZones.intro', g.landingZones.intro);
}

// operations
if (!A.operations || typeof A.operations !== 'object') err('operations: missing A.operations');
else {
  if (!A.operations.dashboardTemplate || !Array.isArray(A.operations.dashboardTemplate.widgets) || A.operations.dashboardTemplate.widgets.length < 10) err('operations: dashboardTemplate needs at least 10 widgets');
  if (!Array.isArray(A.operations.runbooks) || A.operations.runbooks.length < 4) err('operations: expected at least 4 runbooks');
  if (!A.operations.postmortemTemplate || typeof A.operations.postmortemTemplate.templateMarkdown !== 'string' || A.operations.postmortemTemplate.templateMarkdown.length < 200) err('operations: missing postmortemTemplate');
}

// toolkit
if (!A.toolkit || typeof A.toolkit !== 'object') err('toolkit: missing A.toolkit');
else {
  for (const k of ['useCaseAssessment', 'projectEstimation', 'raciMatrix', 'raidTracker', 'qualityGates', 'vendorMatrix', 'skillsMatrix']) {
    if (!A.toolkit[k]) err(`toolkit: missing ${k}`);
  }
}

// labs
if (!A.labs || typeof A.labs !== 'object') err('labs: missing A.labs');
else {
  if (!Array.isArray(A.labs.learningPaths) || A.labs.learningPaths.length < 3) err('labs: expected at least 3 learningPaths');
  if (!Array.isArray(A.labs.exercises) || A.labs.exercises.length < 5) err('labs: expected at least 5 exercises');
}

// solution shaper: exhaustively run every answer combination
const Q = A.shaper.questions;
let combos = 0;
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

const words = A.services.reduce((n, s) => n + JSON.stringify(s).split(/\s+/).length, 0);
console.log(`${A.categories.length} categories, ${A.services.length} services, ${A.architectures.length} architectures, ${A.decisions.length} decision guides (+ em/pe role tabs), ${A.readiness.reduce((n, g) => n + g.items.length, 0)} readiness items, ${combos} shaper combinations checked, ~${words} words in services`);
if (errs.length) { console.error(`\n${errs.length} problem(s):`); errs.forEach(e => console.error(' - ' + e)); process.exit(1); }
console.log('data OK');
