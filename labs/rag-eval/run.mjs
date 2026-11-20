// node labs/rag-eval/run.mjs [--fault=<name>] [--write-baseline] [--json]
// Faults: emptyIndex, aclBypass, sharedCache, staleCache, scanInjection(=false via --fault=noScan), includeSuperseded
import fs from 'node:fs';
import path from 'node:path';
import { runEval, gate, here, loadGates } from './evaluate.mjs';

const args = process.argv.slice(2);
const arg = (n) => (args.find(a => a.startsWith(`--${n}=`)) || '').split('=')[1];
const fault = arg('fault') || null, gates = loadGates();
const indexOpts = fault === 'noScan' ? { scanInjection: false } : fault === 'includeSuperseded' ? { excludeSuperseded: false } : {};
const report = runEval({ fault: ['noScan', 'includeSuperseded'].includes(fault) ? null : fault, k: gates.k, indexOpts });
report.fault = fault;
const fmt = (v) => (v == null ? 'n/a' : v.toFixed(3));

if (args.includes('--write-baseline')) {
  if (fault) { console.error('Refusing to write a baseline from a fault-injected run.'); process.exit(2); }
  fs.writeFileSync(path.join(here, 'baseline.json'), JSON.stringify({ datasetVersion: report.datasetVersion, k: report.k, metrics: report.metrics }, null, 2) + '\n');
  console.log('baseline.json written'); process.exit(0);
}
const baseline = JSON.parse(fs.readFileSync(path.join(here, 'baseline.json'), 'utf8'));
const g = gate(report, baseline, gates);

if (args.includes('--json')) { const { index, ...rest } = report; console.log(JSON.stringify({ ...rest, gate: g }, null, 2)); process.exit(g.passed ? 0 : 1); }

console.log(`RAG evaluation lab | dataset ${report.datasetVersion} | ${report.cases} cases (${report.answerableCases} answerable) | k=${report.k}${fault ? ` | FAULT INJECTED: ${fault}` : ''}\n`);
console.log('metric               baseline  current   delta    tolerance  status');
for (const r of g.comparison.results) console.log(`${r.metric.padEnd(20)} ${fmt(r.baseline).padStart(8)} ${fmt(r.current).padStart(8)} ${(r.delta == null ? 'n/a' : (r.delta >= 0 ? '+' : '') + r.delta.toFixed(3)).padStart(8)} ${String(r.tolerance ?? '-').padStart(10)}  ${r.status}`);
console.log('\nSafety invariants (must be 0):');
for (const [k, v] of Object.entries(report.invariants)) console.log(`  ${k.padEnd(26)} ${v.length}${v.length ? '  ' + JSON.stringify(v) : ''}`);
console.log(`\nLatency (all ${report.cases} searches, in-memory): ${report.latencyMsTotal} ms. Informational only.`);
console.log(g.passed ? '\nGATE: PASS' : `\nGATE: FAIL ${g.invariantFailures.join('; ')}${g.comparison.hasFailures ? ' regression' : ''}`);
process.exit(g.passed ? 0 : 1);
