// node labs/bounded-agent/run.mjs   Prints one row per scenario: the evidence of bounded behaviour.
import { CONTRACT, runWorkflow, createWorld, createTools, createPlanner, evaluateTrajectory } from './agent.mjs';
const EXPECT = { tools: ['lookup_order', 'check_policy', 'issue_refund', 'notify_customer'], refunds: 1, notifications: 1 };
const scenarios = [
  ['normal, L3 + approval', {}, { level: 3 }],
  ['tool timeouts (2x)', { toolTimeout: 2 }, { level: 3 }],
  ['tool outage', { toolOutage: true }, { level: 3 }],
  ['bad tool arguments', { badArgs: true }, { level: 3 }],
  ['duplicate refund call', { duplicateCall: true }, { level: 3 }],
  ['poisoned tool output', { poisonedOutput: true }, { level: 5 }],
  ['agent loop', { loop: true }, { level: 3 }],
  ['agent loop, detector off', { loop: true }, { level: 3, loopDetection: false, budgets: { maxToolCalls: 100 } }],
  ['L1 read-only', {}, { level: 1 }],
  ['L3, approval refused', {}, { level: 3, approver: () => false }]
];
const pad = (v, n) => String(v).padEnd(n);
console.log(pad('scenario', 26) + pad('status', 10) + pad('stop reason', 18) + pad('steps', 6) + pad('calls', 6) + pad('retries', 8) + pad('tokens', 7) + pad('ms', 6) + pad('refunds', 8) + pad('deleted', 8) + 'task success');
for (const [name, faults, o] of scenarios) {
  const world = createWorld();
  const r = runWorkflow({ contract: CONTRACT, input: { orderId: 'O-1001' }, world, tools: createTools(world, faults), planner: createPlanner(faults), approver: () => true, seed: 1, ...o });
  const m = evaluateTrajectory(r, world, EXPECT);
  console.log(pad(name, 26) + pad(r.status, 10) + pad(r.stopReason, 18) + pad(r.usage.steps, 6) + pad(r.usage.toolCalls, 6) + pad(r.usage.retries, 8) + pad(r.usage.tokens, 7) + pad(r.usage.elapsedMs, 6) + pad(world.refunds.length, 8) + pad(world.deleted.length, 8) + m.taskSuccess);
}
console.log('\nEvery run ends with a reason and inside its budgets. "task success" is false by design for runs that were stopped or denied.');
