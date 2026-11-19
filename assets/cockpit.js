/* AI Engineering Manager Cockpit (#/m, #/m/<tab>).
   Browser-local data: everything is kept in localStorage and never leaves the browser.
   Pure functions (derive, kpis, attention, toCsv, parseCsv, coerce) are exposed on ATLAS_COCKPIT.pure for testing. */
(function () {
  'use strict';
  var C = (window.ATLAS_COCKPIT = {});
  var A = function () { return window.ATLAS; };

  /* ---------- pure helpers ---------- */
  function num(v) { var x = parseFloat(v); return isFinite(x) ? x : 0; }
  function has(v) { return v !== undefined && v !== null && v !== ''; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function pct(n) { return (Math.round(n * 10) / 10) + '%'; }
  function count(rows, f) { return rows.filter(f).length; }
  function sum(rows, k) { return rows.reduce(function (a, r) { return a + num(r[k]); }, 0); }

  /* derived per-row cells: returns {key: {text, tone}} where tone is ok | warn | bad | '' */
  function derive(tabId, r) {
    if (tabId === 'quality') {
      if (!has(r.value) || !has(r.threshold)) return { state: { text: '—', tone: '' } };
      var okq = r.dir === 'Lower' ? num(r.value) <= num(r.threshold) : num(r.value) >= num(r.threshold);
      return { state: { text: okq ? 'OK' : 'Below threshold', tone: okq ? 'ok' : 'bad' } };
    }
    if (tabId === 'reliability') {
      var t = num(r.target), a = num(r.actual);
      if (!has(r.target) || !has(r.actual)) return { burn: { text: '—', tone: '' }, state: { text: '—', tone: '' } };
      var burn = t < 100 ? (100 - a) / (100 - t) * 100 : (a >= 100 ? 0 : Infinity);
      burn = Math.max(0, burn);
      return { burn: { text: isFinite(burn) ? Math.round(burn) + '%' : 'all', tone: burn > 100 ? 'bad' : (burn >= 75 ? 'warn' : 'ok') },
        state: { text: burn > 100 ? 'Breached' : (burn >= 75 ? 'At risk' : 'Within budget'), tone: burn > 100 ? 'bad' : (burn >= 75 ? 'warn' : 'ok') } };
    }
    if (tabId === 'cost') {
      var v = num(r.actual) - num(r.forecast), vp = num(r.forecast) ? v / num(r.forecast) * 100 : 0;
      var okTasks = num(r.tasks) * num(r.success) / 100;
      return { 'var': { text: (v > 0 ? '+' : v < 0 ? '−' : '') + money(Math.abs(v)) + ' (' + (vp > 0 ? '+' : '') + Math.round(vp) + '%)', tone: vp > 15 ? 'bad' : (vp > 0 ? 'warn' : 'ok') },
        unit: { text: okTasks > 0 ? '$' + (num(r.actual) / okTasks).toFixed(3) : '—', tone: '' } };
    }
    return {};
  }
  function overdue(d, now) { return has(d) && d < now; }
  function kpis(tabId, rows, now, extra) {
    var K = [];
    if (tabId === 'portfolio') {
      K.push(['Initiatives', rows.length, ''], ['In production', count(rows, function (r) { return r.stage === 'Production'; }), ''], ['Annual value', money(sum(rows, 'value')), ''],
        ['Value at risk', money(sum(rows, 'atrisk')), sum(rows, 'atrisk') > 0 ? 'warn' : ''], ['Red initiatives', count(rows, function (r) { return r.health === 'Red'; }), count(rows, function (r) { return r.health === 'Red'; }) ? 'bad' : '']);
    } else if (tabId === 'arch') {
      K.push(['Systems reviewed', rows.length, ''], ['Waiting or to revise', count(rows, function (r) { return r.outcome === 'Pending' || r.outcome === 'Revise'; }), ''], ['Open findings', sum(rows, 'open'), ''],
        ['High or critical', count(rows, function (r) { return (r.sev === 'High' || r.sev === 'Critical') && num(r.open) > 0; }), 'warn'], ['Reviews overdue', count(rows, function (r) { return overdue(r.next, now); }), 'bad']);
    } else if (tabId === 'project') {
      var slip = rows.length ? rows.reduce(function (a, r) { return a + (num(r.planned) - num(r.actual)); }, 0) / rows.length : 0;
      K.push(['Projects', rows.length, ''], ['Red', count(rows, function (r) { return r.health === 'Red'; }), 'bad'], ['Amber', count(rows, function (r) { return r.health === 'Amber'; }), 'warn'],
        ['Average slip', (Math.round(slip * 10) / 10) + ' pts', slip > 5 ? 'warn' : ''], ['Overdue', count(rows, function (r) { return overdue(r.due, now) && num(r.actual) < 100 && r.phase !== 'Done'; }), 'bad']);
    } else if (tabId === 'quality') {
      var bad = count(rows, function (r) { return (derive('quality', r).state || {}).tone === 'bad'; });
      K.push(['Metrics tracked', rows.length, ''], ['Below threshold', bad, bad ? 'bad' : ''], ['Passing', rows.length ? pct((rows.length - bad) / rows.length * 100) : '—', '']);
    } else if (tabId === 'reliability') {
      var d = rows.map(function (r) { return derive('reliability', r); }), att = count(rows, function (r) { return has(r.actual) && num(r.actual) >= num(r.target); });
      var worst = rows.reduce(function (m, r, i) { var b = d[i].burn && d[i].burn.text; var n = b === 'all' ? Infinity : parseFloat(b); return isFinite(n) || n === Infinity ? Math.max(m, n) : m; }, 0);
      K.push(['Objectives', rows.length, ''], ['SLO attainment', rows.length ? pct(att / rows.length * 100) : '—', att < rows.length ? 'warn' : ''], ['Breached', count(d, function (x) { return x.state && x.state.text === 'Breached'; }), 'bad'],
        ['Highest budget used', worst === Infinity ? 'all' : Math.round(worst) + '%', worst > 100 ? 'bad' : '']);
    } else if (tabId === 'cost') {
      var f = sum(rows, 'forecast'), a2 = sum(rows, 'actual'), ok = rows.reduce(function (s, r) { return s + num(r.tasks) * num(r.success) / 100; }, 0);
      K.push(['Forecast', money(f), ''], ['Actual', money(a2), ''], ['Variance', (a2 - f > 0 ? '+' : a2 - f < 0 ? '−' : '') + money(Math.abs(a2 - f)) + (f ? ' (' + (a2 - f > 0 ? '+' : '') + Math.round((a2 - f) / f * 100) + '%)' : ''), a2 > f * 1.15 ? 'bad' : (a2 > f ? 'warn' : 'ok')],
        ['Cost per successful task', ok > 0 ? '$' + (a2 / ok).toFixed(3) : '—', '']);
    } else if (tabId === 'security') {
      var open = rows.filter(function (r) { return r.state === 'Open' || r.state === 'In progress'; });
      ['Critical', 'High', 'Medium', 'Low'].forEach(function (s) { var n = count(open, function (r) { return r.sev === s; }); K.push(['Open ' + s.toLowerCase(), n, (s === 'Critical' || s === 'High') && n ? 'bad' : '']); });
      K.push(['Overdue', count(open, function (r) { return overdue(r.due, now); }), 'bad']);
    } else if (tabId === 'decisions') {
      K.push(['Decisions', rows.length, ''], ['Proposed', count(rows, function (r) { return r.state === 'Proposed'; }), ''], ['One-way doors', count(rows, function (r) { return r.door === 'One-way door'; }), ''],
        ['Revisit overdue', count(rows, function (r) { return r.state === 'Accepted' && overdue(r.revisit, now); }), 'bad']);
    } else if (tabId === 'radar') {
      ['Adopt', 'Trial', 'Assess', 'Hold'].forEach(function (g) { K.push([g, count(rows, function (r) { return r.ring === g; }), '']); });
    } else if (tabId === 'skills') {
      var g = skillGaps(extra.people, extra.targets, extra.skills);
      K.push(['People', extra.people.length, ''], ['Skills below target', g.skills.filter(function (s) { return s.gap > 0; }).length, 'warn'],
        ['Biggest team gap', g.top ? g.top.label + ' (' + (Math.round(g.top.gap * 10) / 10) + ')' : 'none', ''],
        ['Most gaps (person)', g.person ? g.person.name + ' (' + g.person.n + ')' : 'none', '']);
    }
    return K;
  }
  /* skills: average level per skill against target, and per-person count of skills below target */
  function skillGaps(people, targets, skills) {
    var out = skills.map(function (s) {
      var lv = people.map(function (p) { return num((p.levels || {})[s[0]]); });
      var avg = lv.length ? lv.reduce(function (a, b) { return a + b; }, 0) / lv.length : 0, tg = num(targets[s[0]]);
      return { id: s[0], label: s[1], avg: avg, target: tg, gap: Math.max(0, tg - avg), below: lv.filter(function (x) { return x < tg; }).length };
    });
    var top = out.slice().sort(function (a, b) { return b.gap - a.gap; })[0];
    var per = people.map(function (p) { return { name: p.name || '(unnamed)', n: skills.filter(function (s) { return num((p.levels || {})[s[0]]) < num(targets[s[0]]); }).length }; }).sort(function (a, b) { return b.n - a.n; })[0];
    return { skills: out, top: top && top.gap > 0 ? top : null, person: per && per.n > 0 ? per : null };
  }
  /* things that need the manager's attention, across all tabs */
  function attention(S, now) {
    var L = [], t = S.tabs;
    (t.portfolio || []).forEach(function (r) { if (r.health === 'Red') L.push(['bad', 'portfolio', r.name + ' is red' + (num(r.atrisk) ? ' with ' + money(num(r.atrisk)) + ' at risk' : '')]); });
    (t.project || []).forEach(function (r) {
      if (r.health === 'Red') L.push(['bad', 'project', r.project + ' is red' + (r.blocker ? ': ' + r.blocker : '')]);
      if (overdue(r.due, now) && num(r.actual) < 100 && r.phase !== 'Done') L.push(['bad', 'project', r.project + ' is overdue (' + r.due + ', ' + num(r.actual) + '% complete)']);
    });
    (t.quality || []).forEach(function (r) { if ((derive('quality', r).state || {}).tone === 'bad') L.push(['warn', 'quality', r.system + ': ' + r.metric + ' is ' + r.value + '% against ' + r.threshold + '%']); });
    (t.reliability || []).forEach(function (r) { var d = derive('reliability', r); if (d.state && (d.state.tone === 'bad' || d.state.tone === 'warn')) L.push([d.state.tone, 'reliability', r.system + ': ' + r.slo + ' is ' + d.state.text.toLowerCase() + ' (' + d.burn.text + ' of budget used)']); });
    (t.cost || []).forEach(function (r) { var f = num(r.forecast); if (f && num(r.actual) > f * 1.15) L.push(['warn', 'cost', r.system + ' spend is ' + Math.round((num(r.actual) - f) / f * 100) + '% over forecast']); });
    (t.security || []).forEach(function (r) {
      var open = r.state === 'Open' || r.state === 'In progress';
      if (open && overdue(r.due, now)) L.push(['bad', 'security', r.control + ' is overdue (' + r.due + ')']);
      else if (open && (r.sev === 'Critical' || r.sev === 'High')) L.push(['warn', 'security', r.sev + ' finding open: ' + r.control]);
    });
    (t.arch || []).forEach(function (r) { if (r.outcome === 'Revise') L.push(['warn', 'arch', r.system + ' needs a revised design']); if (overdue(r.next, now)) L.push(['warn', 'arch', r.system + ': architecture review is overdue']); });
    (t.decisions || []).forEach(function (r) { if (r.state === 'Accepted' && overdue(r.revisit, now)) L.push(['warn', 'decisions', 'Revisit: ' + r.title]); });
    var order = { bad: 0, warn: 1 };
    return L.sort(function (a, b) { return order[a[0]] - order[b[0]]; });
  }
  /* CSV */
  function csvCell(v) { v = v === undefined || v === null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCsv(cols, rows) { return [cols.map(function (c) { return csvCell(c.label); }).join(',')].concat(rows.map(function (r) { return cols.map(function (c) { return csvCell(r[c.k]); }).join(','); })).join('\n') + '\n'; }
  function parseCsv(text) {
    var rows = [], row = [], cell = '', q = false, i = 0, c;
    text = String(text).replace(/^﻿/, '');
    for (; i < text.length; i++) {
      c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; rows.push(row); row = []; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x.trim() !== ''; }); });
  }
  function coerce(col, v) {
    v = v === undefined || v === null ? '' : String(v).trim();
    if (col.type === 'number' || col.type === 'money' || col.type === 'percent') { if (v === '') return ''; var x = parseFloat(v.replace(/[$,%\s]/g, '')); return isFinite(x) ? x : ''; }
    if (col.type === 'status') { var m = { green: 'Green', amber: 'Amber', red: 'Red' }[v.toLowerCase()]; return m || ''; }
    if (col.type === 'select') { var hit = (col.opts || []).filter(function (o) { return o.toLowerCase() === v.toLowerCase(); })[0]; return hit || v; }
    return v;
  }
  /* map a parsed CSV matrix onto a tab's columns by label or key */
  function importMatrix(cols, matrix) {
    if (!matrix.length) return [];
    var head = matrix[0].map(function (h) { return h.trim().toLowerCase(); });
    var idx = cols.map(function (c) { var i = head.indexOf(c.label.toLowerCase()); return i >= 0 ? i : head.indexOf(c.k.toLowerCase()); });
    if (idx.every(function (i) { return i < 0; })) return null;
    return matrix.slice(1).map(function (r) { var o = {}; cols.forEach(function (c, j) { o[c.k] = coerce(c, idx[j] >= 0 ? r[idx[j]] : ''); }); return o; });
  }
  C.pure = { derive: derive, kpis: kpis, attention: attention, toCsv: toCsv, parseCsv: parseCsv, coerce: coerce, importMatrix: importMatrix, skillGaps: skillGaps };

  /* ---------- state ---------- */
  var QUAD = { genai: 0, ml: 0, aiservices: 0, databases: 1, storage: 1, analytics: 1, streaming: 1, core: 2, compute: 2, networking: 2, security: 3, observability: 3 };
  var QNAME = ['Models, agents and AI', 'Data and retrieval', 'Platform and compute', 'Security and operations'];
  function seedRadar() {
    var cat = {}; A().categories.forEach(function (c) { cat[c.id] = c; });
    return A().services.map(function (s) {
      var st = (s.meta && s.meta.s) || 'Check';
      return { name: s.name, area: cat[s.cat].name, cat: s.cat, stage: st, ring: st === 'GA' ? 'Trial' : 'Assess', note: '', sid: s.id };
    });
  }
  function emptyState() { return { tabs: {}, skills: { people: [], targets: {} }, radar: null, sampleLoaded: false }; }
  function load() {
    var S = emptyState();
    try { var raw = localStorage.getItem(A().cockpit.storageKey); if (raw) { var o = JSON.parse(raw); if (o && o.tabs) S = o; } } catch (e) { /* storage may be unavailable */ }
    if (!S.skills) S.skills = { people: [], targets: {} };
    if (!S.radar) S.radar = seedRadar();
    return S;
  }
  function save(S) { try { localStorage.setItem(A().cockpit.storageKey, JSON.stringify(S)); return true; } catch (e) { return false; } }
  function sampleState() {
    var S = emptyState(), cfg = A().cockpit;
    cfg.tabs.forEach(function (t) { if (t.sample) S.tabs[t.id] = JSON.parse(JSON.stringify(t.sample)); if (t.special === 'skills') S.skills = { people: JSON.parse(JSON.stringify(t.samplePeople)), targets: JSON.parse(JSON.stringify(t.sampleTargets)) }; });
    S.radar = seedRadar(); S.sampleLoaded = true;
    return S;
  }

  /* ---------- rendering ---------- */
  function tabNav(U, cur) {
    var h = '<nav class="cknav" aria-label="Cockpit sections"><a href="#/m"' + (!cur ? ' aria-current="page"' : '') + '>Overview</a>';
    A().cockpit.tabs.forEach(function (t) { h += '<a href="#/m/' + t.id + '"' + (cur === t.id ? ' aria-current="page"' : '') + '>' + U.esc(t.title) + '</a>'; });
    return h + '</nav>';
  }
  function kpiHtml(U, K) { return '<div class="kpis ckk">' + K.map(function (k) { return '<div class="kpi ' + (k[2] || '') + '"><small>' + U.esc(k[0]) + '</small><b>' + U.esc(String(k[1])) + '</b></div>'; }).join('') + '</div>'; }
  function inputFor(U, col, val, i, label) {
    var a = ' data-row="' + i + '" data-k="' + col.k + '" aria-label="' + U.esc(col.label + ', row ' + (i + 1)) + '"', v = has(val) ? val : '';
    if (col.type === 'select' || col.type === 'status') {
      var opts = col.type === 'status' ? ['Green', 'Amber', 'Red'] : col.opts;
      var seen = opts.indexOf(v) >= 0 || v === '';
      return '<select' + a + (col.type === 'status' ? ' class="st-' + String(v).toLowerCase() + '"' : '') + '><option value=""></option>' + opts.concat(seen ? [] : [v]).map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + U.esc(o) + '</option>'; }).join('') + '</select>';
    }
    if (col.type === 'number' || col.type === 'money' || col.type === 'percent') return '<input type="number" inputmode="decimal" step="any"' + a + ' value="' + U.esc(v) + '">';
    if (col.type === 'date') return '<input type="date"' + a + ' value="' + U.esc(v) + '">';
    return '<input type="text"' + a + ' value="' + U.esc(v) + '">';
  }
  function tableHtml(U, tab, rows, now) {
    var cols = tab.cols, der = tab.derived || [];
    var h = '<div class="tablewrap ck"><table><caption class="sr">' + U.esc(tab.title) + '</caption><thead><tr>' + cols.map(function (c) { return '<th scope="col" style="min-width:' + (c.w || 110) + 'px">' + U.esc(c.label) + '</th>'; }).join('') + der.map(function (d) { return '<th scope="col">' + U.esc(d.label) + '</th>'; }).join('') + '<th scope="col"><span class="sr">Actions</span></th></tr></thead><tbody>';
    if (!rows.length) h += '<tr><td colspan="' + (cols.length + der.length + 1) + '" class="empty">No rows yet. Add a row, import a CSV, or load the sample data from the overview.</td></tr>';
    rows.forEach(function (r, i) {
      var d = derive(tab.id, r);
      h += '<tr>' + cols.map(function (c) { return '<td>' + inputFor(U, c, r[c.k], i) + '</td>'; }).join('') + der.map(function (x) { var c = d[x.k] || { text: '—', tone: '' }; return '<td class="dv ' + c.tone + '" data-dv="' + x.k + '">' + U.esc(c.text) + '</td>'; }).join('') +
        '<td><button type="button" class="rm" data-del="' + i + '" aria-label="Delete row ' + (i + 1) + '">Delete</button></td></tr>';
    });
    return h + '</tbody></table></div>';
  }
  function skillsHtml(U, S) {
    var skills = A().cockpit.skillList, P = S.skills.people, T = S.skills.targets, lv = [0, 1, 2, 3, 4];
    function sel(attrs, v) { return '<select ' + attrs + '>' + lv.map(function (n) { return '<option' + (String(n) === String(v) ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select>'; }
    var h = '<p class="fine">Levels: 0 none, 1 aware, 2 can do with help, 3 can do alone, 4 can teach and review. Cells below the needed level are highlighted.</p><div class="tablewrap ck skm"><table><caption class="sr">Team capability matrix</caption><thead><tr><th scope="col" style="min-width:130px">Person</th>' + skills.map(function (s) { return '<th scope="col">' + U.esc(s[1]) + '</th>'; }).join('') + '<th scope="col"><span class="sr">Actions</span></th></tr></thead><tbody>';
    P.forEach(function (p, i) {
      h += '<tr><td><input type="text" data-sp="' + i + '" data-sk="name" aria-label="Person ' + (i + 1) + ' name" value="' + U.esc(p.name || '') + '"></td>' + skills.map(function (s) {
        var v = num((p.levels || {})[s[0]]), low = v < num(T[s[0]]);
        return '<td class="' + (low ? 'low' : '') + '">' + sel('data-sp="' + i + '" data-sk="' + s[0] + '" aria-label="' + U.esc((p.name || 'Person ' + (i + 1)) + ', ' + s[1]) + '"', v) + '</td>';
      }).join('') + '<td><button type="button" class="rm" data-delp="' + i + '" aria-label="Delete ' + U.esc(p.name || 'person ' + (i + 1)) + '">Delete</button></td></tr>';
    });
    h += '</tbody><tfoot><tr><th scope="row">Needed level</th>' + skills.map(function (s) { return '<td>' + sel('data-st="' + s[0] + '" aria-label="Needed level for ' + U.esc(s[1]) + '"', num(T[s[0]])) + '</td>'; }).join('') + '<td></td></tr>';
    var g = skillGaps(P, T, skills);
    h += '<tr><th scope="row">Team average</th>' + g.skills.map(function (s) { return '<td class="dv ' + (s.gap > 0 ? 'warn' : 'ok') + '">' + (Math.round(s.avg * 10) / 10) + '</td>'; }).join('') + '<td></td></tr>';
    h += '<tr><th scope="row">People below need</th>' + g.skills.map(function (s) { return '<td class="dv">' + s.below + '</td>'; }).join('') + '<td></td></tr></tfoot></table></div>';
    h += '<div class="btns"><button class="btn" type="button" data-addp>Add person</button></div>';
    return h;
  }
  function radarSvg(U, rows) {
    var R = { Adopt: [0, 85], Trial: [85, 150], Assess: [150, 205], Hold: [205, 250] }, cx = 260, cy = 260, groups = {}, stageCol = { GA: 'var(--ok)', Preview: 'var(--warn)', Mixed: 'var(--accent)', Check: 'var(--muted)' };
    var h = '<svg class="radar" viewBox="0 0 520 520" role="img" aria-label="Technology radar: ' + rows.length + ' technologies in four rings and four areas">';
    ['Hold', 'Assess', 'Trial', 'Adopt'].forEach(function (g) { h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R[g][1] + '" class="ring"/>'; });
    h += '<line x1="10" y1="260" x2="510" y2="260" class="axis"/><line x1="260" y1="10" x2="260" y2="510" class="axis"/>';
    ['Adopt', 'Trial', 'Assess', 'Hold'].forEach(function (g) { h += '<text x="' + (cx + 4) + '" y="' + (cy - (R[g][0] + R[g][1]) / 2 + 4) + '" class="rl">' + g + '</text>'; });
    [[500, 24, 'end'], [20, 24, 'start'], [20, 506, 'start'], [500, 506, 'end']].forEach(function (p, i) { h += '<text x="' + p[0] + '" y="' + p[1] + '" text-anchor="' + p[2] + '" class="ql">' + QNAME[i === 0 ? 0 : i === 1 ? 1 : i === 2 ? 2 : 3] + '</text>'; });
    rows.forEach(function (r) {
      if (!R[r.ring]) return;
      var cat = r.cat || ((A().services.filter(function (x) { return x.name === r.name; })[0] || {}).cat), q = QUAD[cat]; if (q === undefined) { q = 0; String(r.name || '').split('').forEach(function (ch) { q = (q + ch.charCodeAt(0)) % 4; }); }
      var k = q + '|' + r.ring; (groups[k] = groups[k] || []).push(r);
    });
    Object.keys(groups).forEach(function (k) {
      var q = +k.split('|')[0], ring = k.split('|')[1], list = groups[k], n = list.length, band = R[ring];
      list.forEach(function (r, i) {
        var a0 = [270, 180, 90, 0][q], ang = (a0 + 8 + (74 * (i + 0.5)) / n) * Math.PI / 180;
        var rad = band[0] + (band[1] - band[0]) * (0.3 + 0.4 * ((i * 7) % 5) / 4);
        h += '<circle cx="' + (cx + rad * Math.cos(ang)).toFixed(1) + '" cy="' + (cy + rad * Math.sin(ang)).toFixed(1) + '" r="5" fill="' + (stageCol[r.stage] || 'var(--muted)') + '"><title>' + U.esc(r.name + ' · ' + r.ring + ' · ' + r.stage) + '</title></circle>';
      });
    });
    return h + '</svg><p class="fine radarkey"><span style="--c:var(--ok)">GA</span><span style="--c:var(--warn)">Preview</span><span style="--c:var(--accent)">Features differ</span><span style="--c:var(--muted)">Not confirmed</span> Dot colour is the launch stage recorded in this atlas. Hover a dot for its name.</p>';
  }

  /* ---------- pages ---------- */
  function intro(U) {
    return '<div class="callout"><b>Your data stays in this browser</b>Everything you enter is stored in this browser\'s local storage and is never sent anywhere. That also means it is not shared, not backed up and is lost if you clear site data, so export it (CSV per tab, or JSON for everything) when it matters. A static site cannot read live systems: feed the tabs from exports. For example, export evaluation results to CSV, export SLO attainment from Cloud Monitoring, and export the billing data from BigQuery ([[billing|Billing and FinOps]], [[cloud-monitoring]]), then use Import on the matching tab.</div>'.replace(/\[\[([a-z-]+)(?:\|([^\]]+))?\]\]/g, function (m, id, l) { return '<a href="#/s/' + id + '">' + (l || (A().services.filter(function (s) { return s.id === id; })[0] || {}).name || id) + '</a>'; });
  }
  C.render = function (U, tabId) {
    var cfg = A().cockpit, tab = tabId ? cfg.tabs.filter(function (t) { return t.id === tabId; })[0] : null;
    if (tabId && !tab) return '<h1>Not found</h1><p class="lede">That cockpit section does not exist. <a href="#/m">Back to the cockpit</a>.</p>';
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/m">Manager cockpit</a>' + (tab ? ' / ' + U.esc(tab.title) : '') + '</div><h1>' + (tab ? U.esc(tab.title) : 'AI engineering manager cockpit') + '</h1>';
    h += '<p class="lede">' + U.esc(tab ? tab.blurb : 'One place to track the portfolio, reviews, delivery, quality, reliability, cost, security, skills, technology choices and decisions for your AI systems.') + '</p>';
    h += tabNav(U, tabId) + '<div id="ckBody"></div>';
    if (!tab) h = h.replace('<div id="ckBody"></div>', intro(U) + '<div id="ckBody"></div>');
    return h;
  };
  C.mount = function (U, tabId) {
    var cfg = A().cockpit, tab = tabId ? cfg.tabs.filter(function (t) { return t.id === tabId; })[0] : null, S = load(), body = U.$('#ckBody'), esc = U.esc, importMode = 'append', msg = '';
    if (!body) return;
    function persist() { if (!save(S)) msg = 'Could not save to this browser (storage is blocked or full). Export your data to keep it.'; }
    function rowsOf(id) { return id === 'radar' ? S.radar : (S.tabs[id] = S.tabs[id] || []); }
    function note() { return msg ? '<p class="ckmsg" role="status">' + esc(msg) + '</p>' : '<p class="ckmsg" role="status"></p>'; }
    function download(name, text, type) {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([text], { type: type })); a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(url); }, 500);
    }
    function overview() {
      var now = today(), att = attention(S, now), h = '';
      h += '<div class="btns ckbar"><button class="btn primary" type="button" data-sample>Load sample data</button><button class="btn" type="button" data-expall>Export all (JSON)</button><label class="btn filebtn">Import JSON<input type="file" accept=".json,application/json" data-impall hidden></label><button class="btn" type="button" data-clearall>Clear everything</button></div>' + note();
      h += '<h2>Needs your attention</h2>';
      var hasData = cfg.tabs.some(function (t) { return t.sample && (S.tabs[t.id] || []).length; });
      if (!hasData) h += '<p>Nothing to show yet. Load the sample data to see how the cockpit works, or open a section and start adding rows.</p>';
      else if (!att.length) h += '<p>Nothing is flagged. Check that the data is current.</p>';
      else h += '<ul class="attn">' + att.slice(0, 14).map(function (a) { return '<li class="' + a[0] + '"><a href="#/m/' + a[1] + '">' + esc(cfg.tabs.filter(function (t) { return t.id === a[1]; })[0].title) + '</a> ' + esc(a[2]) + '</li>'; }).join('') + '</ul>' + (att.length > 14 ? '<p class="fine">And ' + (att.length - 14) + ' more.</p>' : '');
      h += '<h2>Sections</h2><div class="grid">' + cfg.tabs.map(function (t) {
        var k = t.special === 'skills' ? kpis('skills', [], now, { people: S.skills.people, targets: S.skills.targets, skills: cfg.skillList }) : kpis(t.id, rowsOf(t.id), now);
        return '<a class="card" style="--h:215" href="#/m/' + t.id + '"><div class="mini">' + (t.special === 'skills' ? S.skills.people.length + ' people' : rowsOf(t.id).length + ' rows') + '</div><h3>' + esc(t.title) + '</h3><p>' + esc(k.slice(0, 3).map(function (x) { return x[0] + ': ' + x[1]; }).join(' · ')) + '</p></a>';
      }).join('') + '</div>';
      h += '<h2>How to use it</h2><div class="lists two"><div class="box"><h3>Weekly</h3>' + U.ul(['Update **Project health** and **Quality**; look at **Needs your attention**.', 'Move findings in **Security and compliance** and set owners.', 'Check **Reliability** budget use before approving releases.']) + '</div><div class="box ml"><h3>Monthly and quarterly</h3>' + U.ul(['Review **Cost** against forecast with finance ([[d:finops|FinOps model]]).', 'Re-rank the **Technology radar** and the **Decision log**.', 'Use the **Team capability matrix** to plan hiring and training.']) + '</div></div>'.replace(/\[\[d:finops\|([^\]]+)\]\]/, '<a href="#/d/finops">$1</a>');
      body.innerHTML = h;
    }
    function tabView() {
      var now = today(), h = '';
      if (tab.special === 'skills') {
        h += kpiHtml(U, kpis('skills', [], now, { people: S.skills.people, targets: S.skills.targets, skills: cfg.skillList })) + note() + skillsHtml(U, S);
        var g = skillGaps(S.skills.people, S.skills.targets, cfg.skillList);
        h += '<h2>Gaps by skill</h2><div class="tablewrap ck"><table><thead><tr><th>Skill</th><th>Team average</th><th>Needed</th><th>Gap</th><th>People below need</th></tr></thead><tbody>' + g.skills.slice().sort(function (a, b) { return b.gap - a.gap; }).map(function (s) { return '<tr><td>' + esc(s.label) + '</td><td>' + (Math.round(s.avg * 10) / 10) + '</td><td>' + s.target + '</td><td class="dv ' + (s.gap > 0 ? 'warn' : 'ok') + '">' + (Math.round(s.gap * 10) / 10) + '</td><td>' + s.below + '</td></tr>'; }).join('') + '</tbody></table></div>';
        h += '<div class="btns"><button class="btn" type="button" data-skcsv>Export CSV</button></div>';
      } else {
        var rows = rowsOf(tab.id);
        h += kpiHtml(U, kpis(tab.id, rows, now)) + note();
        if (tab.special === 'radar') h += radarSvg(U, rows);
        h += '<div class="btns ckbar"><button class="btn" type="button" data-add>Add row</button><button class="btn" type="button" data-csv>Export CSV</button><label class="btn filebtn">Import CSV<input type="file" accept=".csv,text/csv" data-imp hidden></label>' +
          '<span class="imode"><label><input type="radio" name="imode" value="append"' + (importMode === 'append' ? ' checked' : '') + '> Add to existing</label> <label><input type="radio" name="imode" value="replace"' + (importMode === 'replace' ? ' checked' : '') + '> Replace existing</label></span>' +
          (tab.special === 'radar' ? '<button class="btn" type="button" data-reseed>Reset to atlas seed</button>' : '<button class="btn" type="button" data-clear>Clear this section</button>') + '</div>';
        if (tab.special === 'radar') h += '<p class="fine">Starting positions come from each service\'s launch stage in this atlas (generally available services start at Trial, everything else at Assess). They are a prompt for discussion, not a recommendation. Set the ring to reflect your organisation\'s experience.</p>';
        h += '<div id="ckTable">' + tableHtml(U, tab, rows, now) + '</div>';
      }
      body.innerHTML = h;
    }
    /* update only the derived cells and KPIs after an input, so focus is kept */
    function refresh() {
      var now = today();
      if (tab.special === 'skills') { tabView(); return; }
      var rows = rowsOf(tab.id), box = body.querySelector('.ckk');
      if (box) box.outerHTML = kpiHtml(U, kpis(tab.id, rows, now));
      U.$$('#ckTable tbody tr').forEach(function (tr, i) {
        var d = derive(tab.id, rows[i] || {});
        U.$$('td[data-dv]', tr).forEach(function (td) { var c = d[td.getAttribute('data-dv')] || { text: '—', tone: '' }; td.textContent = c.text; td.className = 'dv ' + c.tone; });
      });
      if (tab.special === 'radar') { var sv = body.querySelector('svg.radar'), kp = body.querySelector('.radarkey'); if (sv) { var tmp = document.createElement('div'); tmp.innerHTML = radarSvg(U, rows); sv.outerHTML = tmp.querySelector('svg').outerHTML; } }
      var m = body.querySelector('.ckmsg'); if (m) m.textContent = msg;
    }
    function view() { if (tab) tabView(); else overview(); }
    body.addEventListener('input', function (e) {
      var t = e.target, row = t.getAttribute('data-row');
      if (row !== null && tab) { var col = tab.cols.filter(function (c) { return c.k === t.getAttribute('data-k'); })[0]; rowsOf(tab.id)[+row][col.k] = t.type === 'number' ? (t.value === '' ? '' : parseFloat(t.value)) : t.value; if (t.classList.contains('st-green') || t.tagName === 'SELECT') t.className = col.type === 'status' ? 'st-' + t.value.toLowerCase() : ''; persist(); refresh(); }
      else if (t.hasAttribute('data-sp')) { var p = S.skills.people[+t.getAttribute('data-sp')], k = t.getAttribute('data-sk'); if (k === 'name') p.name = t.value; else { p.levels = p.levels || {}; p.levels[k] = parseInt(t.value, 10); } persist(); if (k !== 'name') refresh(); else { var kb = body.querySelector('.ckk'); if (kb) kb.outerHTML = kpiHtml(U, kpis('skills', [], today(), { people: S.skills.people, targets: S.skills.targets, skills: cfg.skillList })); } }
      else if (t.hasAttribute('data-st')) { S.skills.targets[t.getAttribute('data-st')] = parseInt(t.value, 10); persist(); refresh(); }
      else if (t.name === 'imode') importMode = t.value;
    });
    body.addEventListener('change', function (e) {
      var t = e.target; if (!t.files || !t.files[0]) return;
      var file = t.files[0], rd = new FileReader();
      rd.onload = function () {
        try {
          if (t.hasAttribute('data-impall')) {
            var o = JSON.parse(rd.result); if (!o || !o.tabs) throw new Error('Not a cockpit export');
            S = o; if (!S.skills) S.skills = { people: [], targets: {} }; if (!S.radar) S.radar = seedRadar(); msg = 'Imported all sections.';
          } else if (t.hasAttribute('data-imp') && tab) {
            var res = importMatrix(tab.cols, parseCsv(rd.result));
            if (!res) throw new Error('No column in the file matches this section. Expected headers: ' + tab.cols.map(function (c) { return c.label; }).join(', '));
            if (importMode === 'replace') { if (tab.special === 'radar') S.radar = res; else S.tabs[tab.id] = res; } else { rowsOf(tab.id).push.apply(rowsOf(tab.id), res); }
            msg = 'Imported ' + res.length + ' rows.';
          }
          persist();
        } catch (err) { msg = 'Import failed: ' + err.message; }
        t.value = ''; view();
      };
      rd.readAsText(file);
    });
    body.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-sample')) { S = sampleState(); msg = 'Sample data loaded. All names and numbers are fictional.'; persist(); view(); }
      else if (b.hasAttribute('data-clearall')) { if (window.confirm('Remove everything you have entered in the cockpit from this browser?')) { S = emptyState(); S.radar = seedRadar(); msg = 'Cleared.'; persist(); view(); } }
      else if (b.hasAttribute('data-expall')) { download('ai-cockpit-' + today() + '.json', JSON.stringify(S, null, 2), 'application/json'); }
      else if (b.hasAttribute('data-add')) { var o = {}; tab.cols.forEach(function (c) { o[c.k] = c.type === 'status' ? 'Green' : ''; }); rowsOf(tab.id).push(o); persist(); tabView(); var last = U.$$('#ckTable tbody tr:last-child input, #ckTable tbody tr:last-child select'); if (last[0]) last[0].focus(); }
      else if (b.hasAttribute('data-del')) { rowsOf(tab.id).splice(+b.getAttribute('data-del'), 1); persist(); tabView(); }
      else if (b.hasAttribute('data-clear')) { if (window.confirm('Remove all rows in ' + tab.title + '?')) { S.tabs[tab.id] = []; persist(); tabView(); } }
      else if (b.hasAttribute('data-reseed')) { S.radar = seedRadar(); persist(); tabView(); }
      else if (b.hasAttribute('data-csv')) { download(tab.id + '-' + today() + '.csv', toCsv(tab.cols, rowsOf(tab.id)), 'text/csv'); }
      else if (b.hasAttribute('data-addp')) { S.skills.people.push({ name: '', levels: {} }); persist(); tabView(); }
      else if (b.hasAttribute('data-delp')) { S.skills.people.splice(+b.getAttribute('data-delp'), 1); persist(); tabView(); }
      else if (b.hasAttribute('data-skcsv')) {
        var sk = cfg.skillList, cols = [{ k: 'name', label: 'Person' }].concat(sk.map(function (s) { return { k: s[0], label: s[1] }; }));
        var rws = S.skills.people.map(function (p) { var r = { name: p.name }; sk.forEach(function (s) { r[s[0]] = (p.levels || {})[s[0]]; }); return r; });
        var tg = { name: 'Needed level' }; sk.forEach(function (s) { tg[s[0]] = S.skills.targets[s[0]]; });
        download('skills-' + today() + '.csv', toCsv(cols, rws.concat([tg])), 'text/csv');
      }
    });
    view();
  };
})();
