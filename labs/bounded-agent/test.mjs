import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT, runWorkflow, createWorld, createTools, createPlanner, authorize, LEVELS, validateArgs, validateContract, backoffDelay, mulberry32, evaluateTrajectory, memoryStore, CrashError, DEFAULT_BUDGETS } from './agent.mjs';

const EXPECT = { tools: ['lookup_order', 'check_policy', 'issue_refund', 'notify_customer'], refunds: 1, notifications: 1 };
function go(o = {}) {
  const world = o.world || createWorld(), faults = o.faults || {};
  const result = runWorkflow({ contract: o.contract || CONTRACT, input: o.input || { orderId: 'O-1001' }, world, tools: createTools(world, faults), planner: createPlanner(faults), level: o.level ?? 3, limits: o.limits, approver: o.approver || (() => true), budgets: o.budgets, seed: o.seed ?? 1, store: o.store, runId: o.runId, resume: o.resume, crashAfterStep: o.crashAfterStep, loopDetection: o.loopDetection });
  return { world, result, m: evaluateTrajectory(result, world, EXPECT) };
}
const evts = (r, type) => r.trace.filter(e => e.type === type);

test('normal path at L3 with approval: completes, one refund, one notification, perfect trajectory', () => {
  const { world, result, m } = go();
  assert.equal(result.status, 'completed'); assert.equal(world.refunds.length, 1); assert.equal(world.notifications.length, 1);
  assert.equal(m.taskSuccess, true); assert.equal(m.toolSelectionAccuracy, 1); assert.equal(m.unnecessaryToolCalls, 0); assert.equal(m.argumentValidity, 1);
  assert.equal(evts(result, 'approval').length, 2); // refund + customer message
});

/* ---- contract and input ---- */
test('contract: an incomplete contract is rejected before any tool runs', () => {
  const { world, result } = go({ contract: { ...CONTRACT, owner: undefined } });
  assert.equal(result.stopReason, 'invalid-contract'); assert.equal(Object.keys(world.toolHits).length, 0);
  assert.ok(validateContract({}).length >= 5);
});
test('input: input that violates the input schema is rejected before any tool runs', () => {
  const { world, result } = go({ input: { orderId: 12345 } });
  assert.equal(result.stopReason, 'invalid-input'); assert.equal(Object.keys(world.toolHits).length, 0);
});
test('output: a completed run whose output breaks the output schema is stopped, not accepted', () => {
  const bad = { ...CONTRACT, outputSchema: { ...CONTRACT.outputSchema, required: ['orderId', 'mustExist'], properties: { ...CONTRACT.outputSchema.properties, mustExist: { type: 'string' } } } };
  assert.equal(go({ contract: bad }).result.stopReason, 'invalid-output');
});

/* ---- budgets and loop prevention ---- */
test('loop fault: loop detection stops the run after a bounded number of repeats', () => {
  const { result } = go({ faults: { loop: true } });
  assert.equal(result.stopReason, 'loop-detected');
  assert.ok(result.usage.steps <= DEFAULT_BUDGETS.loopRepeatLimit + 1, `steps ${result.usage.steps}`);
});
test('loop fault with loop detection disabled: the max-steps budget is the backstop', () => {
  const { result } = go({ faults: { loop: true }, loopDetection: false, budgets: { maxToolCalls: 100 } });
  assert.equal(result.stopReason, 'max-steps'); assert.equal(result.usage.steps, DEFAULT_BUDGETS.maxSteps);
});
test('loop fault: the tool-call budget stops a run before max-steps when it is lower', () => {
  const { result } = go({ faults: { loop: true }, loopDetection: false, budgets: { maxToolCalls: 5 } });
  assert.equal(result.stopReason, 'tool-call-budget'); assert.equal(result.usage.toolCalls, 5);
});
test('token budget: the run stops once the budget is spent', () => {
  const { result } = go({ budgets: { maxTokens: 900 } });
  assert.equal(result.stopReason, 'token-budget'); assert.ok(result.usage.tokens >= 900); assert.ok(result.usage.steps < 5);
});
test('deadline: the wall-clock budget stops a slow run and bounds elapsed time', () => {
  const { result } = go({ faults: { toolTimeout: 5 }, contract: { ...CONTRACT, deadlineMs: 1500 }, budgets: { maxAttempts: 10 } });
  assert.ok(['deadline', 'tool-unavailable'].includes(result.stopReason), result.stopReason);
  assert.ok(result.usage.elapsedMs < 1500 + DEFAULT_BUDGETS.toolTimeoutMs + DEFAULT_BUDGETS.backoff.capMs);
});
test('every stop is reported with a reason and a partial state, never a silent hang', () => {
  for (const f of [{ loop: true }, { toolOutage: true }]) {
    const { result } = go({ faults: f });
    assert.equal(result.status, 'stopped'); assert.ok(result.stopReason); assert.ok(result.state && typeof result.state.step === 'number');
    assert.equal(result.trace[result.trace.length - 1].type, 'stop');
  }
});

/* ---- retries, backoff, outages ---- */
test('timeouts: retries with backoff recover, and recovery is recorded', () => {
  const { result, m } = go({ faults: { toolTimeout: 2 } });
  assert.equal(result.status, 'completed'); assert.equal(evts(result, 'retry').length, 2); assert.equal(m.recoveries, 1);
});
test('backoff delays follow full jitter: within [0, min(cap, base*2^attempt)] and seeded-deterministic', () => {
  const { result } = go({ faults: { toolTimeout: 2 } }), d = evts(result, 'retry').map(e => e.delayMs);
  assert.ok(d[0] <= 100 && d[1] <= 200, JSON.stringify(d));
  assert.equal(JSON.stringify(go({ faults: { toolTimeout: 2 }, seed: 1 }).result.trace), JSON.stringify(result.trace));
  const variants = new Set([1, 2, 3, 4, 5].map(s => JSON.stringify(evts(go({ faults: { toolTimeout: 2 }, seed: s }).result, 'retry').map(e => e.delayMs))));
  assert.ok(variants.size > 1, 'jitter should differ across seeds');
});
test('backoffDelay: capped, and never exceeds the exponential ceiling', () => {
  const hi = () => 0.999999;
  assert.ok(backoffDelay(0, { baseMs: 100, capMs: 2000 }, hi) < 100);
  assert.ok(backoffDelay(3, { baseMs: 100, capMs: 2000 }, hi) < 800);
  assert.ok(backoffDelay(10, { baseMs: 100, capMs: 2000 }, hi) < 2000);
  assert.equal(backoffDelay(5, { baseMs: 100, capMs: 2000 }, () => 0), 0);
  const r = mulberry32(7); for (let i = 0; i < 100; i++) { const x = r(); assert.ok(x >= 0 && x < 1); }
});
test('outage: retries are bounded by maxAttempts, nothing is executed, the partial state is kept', () => {
  const { world, result } = go({ faults: { toolOutage: true } });
  assert.equal(result.stopReason, 'tool-unavailable');
  assert.deepEqual(evts(result, 'tool-call').map(e => e.attempt), [1, 2, 3]);
  assert.equal(world.refunds.length, 0); assert.equal(world.notifications.length, 0);
});

/* ---- tool argument validation ---- */
test('bad arguments are rejected before execution, not retried, and the agent recovers', () => {
  const { world, result, m } = go({ faults: { badArgs: true } });
  assert.equal(evts(result, 'tool-error').filter(e => e.code === 'BAD_ARGS').length, 1);
  assert.equal(world.toolHits.issue_refund, 1); // the invalid call never reached the tool
  assert.equal(result.status, 'completed'); assert.equal(world.refunds.length, 1); assert.ok(m.argumentValidity < 1);
});
test('validateArgs: required, unknown, type and range checks', () => {
  const s = { required: ['a'], properties: { a: { type: 'number', min: 0, max: 10 }, s: { type: 'string', maxLength: 3 } } };
  assert.equal(validateArgs(s, { a: 5 }).length, 0);
  assert.ok(validateArgs(s, {}).length === 1);
  assert.ok(validateArgs(s, { a: 11 }).length === 1);
  assert.ok(validateArgs(s, { a: NaN }).length === 1);
  assert.ok(validateArgs(s, { a: 1, extra: 1 }).length === 1);
  assert.ok(validateArgs(s, { a: 1, s: 'toolong' }).length === 1);
  assert.ok(validateArgs(s, null).length === 1);
});

/* ---- idempotency ---- */
test('idempotency: a repeated refund request with the same key causes exactly one side effect', () => {
  const { world, result } = go({ faults: { duplicateCall: true } });
  assert.equal(result.status, 'completed'); assert.equal(world.refunds.length, 1); assert.equal(world.toolHits.issue_refund, 2);
});

/* ---- allow-list and injection ---- */
test('injection: instruction-like tool output is flagged, the unlisted destructive tool is blocked, the run still completes', () => {
  const { world, result, m } = go({ faults: { poisonedOutput: true } });
  assert.ok(evts(result, 'injection-flag').length >= 1);
  const denied = evts(result, 'policy').filter(e => e.decision === 'deny');
  assert.equal(denied.length, 1); assert.equal(denied[0].tool, 'delete_order'); assert.match(denied[0].reason, /allow-list/); assert.equal(denied[0].injected, true);
  assert.equal(world.deleted.length, 0); assert.equal(world.toolHits.delete_order, undefined);
  assert.equal(m.taskSuccess, true); assert.equal(m.policyViolationsBlocked, 1);
});
test('allow-list holds even at the highest autonomy level', () => {
  const { world } = go({ faults: { poisonedOutput: true }, level: 5 });
  assert.equal(world.deleted.length, 0);
});

/* ---- autonomy levels and approval ---- */
test('authorize: the full level-by-kind decision table', () => {
  const kinds = ['read', 'recommend', 'write', 'external-comm', 'destructive'];
  const table = Object.fromEntries([0, 1, 2, 3, 4, 5].map(l => [l, kinds.map(k => authorize(l, { kind: k }, {}).decision).join(',')]));
  assert.deepEqual(table, {
    0: 'deny,deny,deny,deny,deny', 1: 'allow,deny,deny,deny,deny', 2: 'allow,allow,deny,deny,deny',
    3: 'allow,allow,approve,approve,deny', 4: 'allow,allow,allow,allow,deny', 5: 'allow,allow,allow,allow,approve'
  });
  assert.equal(authorize(9, { kind: 'read' }, {}).decision, 'deny');
  assert.equal(Object.keys(LEVELS).length, 6);
});
test('L0: nothing executes and the run is stopped by loop detection (defence in depth)', () => {
  const { world, result } = go({ level: 0 });
  assert.equal(Object.keys(world.toolHits).length, 0); assert.equal(result.status, 'stopped'); assert.equal(result.stopReason, 'loop-detected'); assert.equal(evts(result, 'policy').every(e => e.decision === 'deny'), true);
});
test('L1 read-only: reads run, writes and messages are denied, the result is a recommendation', () => {
  const { world, result } = go({ level: 1 });
  assert.equal(result.status, 'completed'); assert.equal(world.refunds.length, 0); assert.equal(world.notifications.length, 0);
  assert.equal(result.output.refunded, false); assert.match(result.output.recommendation, /human/);
});
test('L3 with approval refused: no side effect happens and the result is partial', () => {
  const { world, result, m } = go({ level: 3, approver: () => false });
  assert.equal(world.refunds.length, 0); assert.equal(world.notifications.length, 0);
  assert.equal(result.output.refunded, false); assert.equal(m.taskSuccess, false);
});
test('L3 approver receives the tool, arguments and reason', () => {
  const seen = []; go({ level: 3, approver: (r) => { seen.push(r); return true; } });
  assert.deepEqual(seen.map(r => r.tool), ['issue_refund', 'notify_customer']);
  assert.equal(seen[0].args.amount, 42.5); assert.match(seen[0].reason, /approval/);
});
test('L4 acts alone within its limit and asks above it', () => {
  let asked = 0; go({ level: 4, limits: { maxAutoAmount: 100 }, approver: () => { asked++; return true; } });
  assert.equal(asked, 0);
  const w = createWorld(); w.orders['O-1001'].amount = 90; asked = 0;
  const r = go({ world: w, level: 4, limits: { maxAutoAmount: 50 }, approver: () => { asked++; return false; } });
  assert.equal(asked, 1); assert.equal(w.refunds.length, 0); assert.equal(r.result.output.refunded, false);
});

/* ---- checkpoint and resume ---- */
test('resume after a crash continues from the checkpoint and does not repeat completed work', () => {
  const world = createWorld(), store = memoryStore(), tools = createTools(world);
  assert.throws(() => runWorkflow({ contract: CONTRACT, input: { orderId: 'O-1001' }, world, tools, planner: createPlanner(), approver: () => true, store, crashAfterStep: 3 }), CrashError);
  assert.equal(world.refunds.length, 1);
  const r = runWorkflow({ contract: CONTRACT, input: { orderId: 'O-1001' }, world, tools, planner: createPlanner(), approver: () => true, store, resume: true });
  assert.equal(r.status, 'completed'); assert.equal(world.refunds.length, 1); assert.equal(world.toolHits.lookup_order, 1); assert.equal(world.toolHits.check_policy, 1);
  assert.equal(evts(r, 'resume')[0].fromStep, 3);
});
test('a crash BEFORE the checkpoint is safe because the retried write is idempotent', () => {
  const world = createWorld(), tools = createTools(world), inner = memoryStore();
  const lossy = { save: (id, s) => { if (s.step < 3) inner.save(id, s); }, load: (id) => inner.load(id) }; // the step-3 checkpoint is lost
  assert.throws(() => runWorkflow({ contract: CONTRACT, input: { orderId: 'O-1001' }, world, tools, planner: createPlanner(), approver: () => true, store: lossy, crashAfterStep: 3 }), CrashError);
  const r = runWorkflow({ contract: CONTRACT, input: { orderId: 'O-1001' }, world, tools, planner: createPlanner(), approver: () => true, store: lossy, resume: true });
  assert.equal(r.status, 'completed'); assert.equal(world.refunds.length, 1); assert.equal(world.toolHits.issue_refund, 2);
});

/* ---- trace ---- */
test('trace: sequence numbers are strictly increasing and every tool call is preceded by a policy decision', () => {
  const { result } = go();
  result.trace.forEach((e, i) => { if (i) assert.ok(e.seq > result.trace[i - 1].seq); });
  result.trace.forEach((e, i) => { if (e.type === 'tool-call' && e.attempt === 1) assert.ok(result.trace.slice(0, i).some(p => p.type === 'policy' && p.tool === e.tool && p.decision !== 'deny')); });
});
test('trajectory evaluation catches a wrong tool sequence and unnecessary calls', () => {
  const { world, result } = go({ faults: { duplicateCall: true } });
  const m = evaluateTrajectory(result, world, EXPECT);
  assert.equal(m.unnecessaryToolCalls, 1); assert.equal(m.taskSuccess, true);
});
