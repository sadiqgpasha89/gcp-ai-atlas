# Lab: a bounded multi-step agent workflow (local)

**Status:** runs locally, tested (`node --test labs/bounded-agent/test.mjs`). **Cloud cost:** none. **Credentials:** none.

## Objective and outcome
See, with evidence, what it takes to make an agent workflow *bounded*: it always stops, inside its budgets, for a stated reason, with a trace and a partial result; it cannot call tools it was not given; it cannot repeat a side effect; and risky actions wait for a human at the right autonomy level. After the lab you can point at the line of code and the test for each control.

## Prerequisites
Node 22+. Read the Atlas playbook *Bounded Agents: Contracts, State, Budgets and Autonomy Levels* first.

## Scenario
A refund-triage workflow for one order: look up the order, check the policy, issue the refund if eligible, notify the customer. A **scripted planner** stands in for the model so behaviour is deterministic. Fault flags make the planner (or a tool) misbehave the way real ones do.

## Architecture
`CONTRACT` (goal, owner, input/output schema, allow-list, evidence, deadline) -> `runWorkflow` loop: check budgets -> planner proposes an action -> loop detector -> allow-list -> autonomy-level policy (`authorize`) and optional approval -> argument validation -> execute with timeout, retry, jittered exponential backoff -> treat the result as untrusted data (flag instruction-like text) -> fold into typed state -> checkpoint. `evaluateTrajectory` scores the run.

## Steps
1. `node labs/bounded-agent/run.mjs` and read the table: every scenario ends with a reason and inside its budgets.
2. Read `runWorkflow` in `agent.mjs` top to bottom; each control is one short block.
3. Read `test.mjs`. For each control there is a test that triggers it. Change a budget in `DEFAULT_BUDGETS` and see which test notices.
4. Try `level: 1`, `3`, `4`, `5` in `run.mjs` and read the policy and approval events in `result.trace`.

## Validation and expected output
`node --test labs/bounded-agent/test.mjs` -> 29 passing. In `run.mjs`: the loop scenario stops with `loop-detected` after 4 steps; with the detector off it stops at `max-steps` (12); the poisoned-output scenario completes with `deleted = 0`; a 2x timeout run completes after 2 retries.

## Failure injection
`toolTimeout`, `toolOutage`, `badArgs`, `duplicateCall`, `poisonedOutput`, `loop` in `createTools` / `createPlanner`; `crashAfterStep` plus a lossy checkpoint store for crash and resume; `approver: () => false` for refused approval.

## Cost and cleanup
None. No cloud resources, no files written.

## Troubleshooting
*A scenario hangs:* it cannot, every loop has a budget; if you edit the runtime and a test hangs, a stop condition was removed. *Approval never asked:* check the autonomy `level` (L1 and L2 deny writes outright; L4 asks only above `limits.maxAutoAmount`).

## Limits
The planner is scripted, so this shows the **controls around** a model, not model behaviour. The token count is a rough character-based proxy. Time is a logical clock. Autonomy levels L0-L5 are an **Atlas framework, not an official Google standard**. This is a teaching harness, not an orchestrator and not an Agent Development Kit (ADK) API.

## Production extension
Run the same contract and policy around a real agent framework (for example ADK) and a real model; replace the in-memory checkpoint store with durable storage; propagate the real caller's identity and use a distinct, least-privilege identity per tool; send the trace to your observability stack with redaction; make approvals an auditable workflow with an owner and a timeout; add an evaluation set that scores trajectories (tool selection, argument validity, unnecessary calls, policy violations) and gate releases on it. Re-verify product behaviour against current official documentation.
