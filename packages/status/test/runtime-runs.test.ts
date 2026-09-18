import assert from 'node:assert/strict';
import test from 'node:test';
import { RuntimeSpanStore } from '../src/runtime-runs.ts';

function subagentPartial(agents: Array<{ agent?: string; active: boolean }>): unknown {
  return {
    details: {
      kind: 'pi-subagent',
      results: agents.map((entry) => ({
        ...(entry.agent ? { agent: entry.agent } : {}),
        exitCode: -1,
        sawAgentStart: true,
        sawAgentSettled: !entry.active,
      })),
    },
  };
}

test('root span opens per turn and children nest under it', () => {
  const store = new RuntimeSpanStore();
  assert.equal(store.beginRoot('turn-1', 'understanding', 1_000), true);
  assert.equal(store.begin('bash-1', 'bash', 'turn-1', 2_000), true);
  assert.equal(store.begin('sub-1', 'subagent', 'turn-1', 3_000), true);

  const snap = store.snapshot(4_000);
  // The subagent tool span is a container: only bash counts until agents appear.
  assert.equal(snap.children, 1);
  assert.equal(snap.subagents, 0);
  const bash = snap.spans?.find((span) => span.id === 'bash-1');
  assert.equal(bash?.parent, 'turn-1');
  assert.equal(bash?.kind, 'bash');
  assert.equal(bash?.elapsedMs, 2_000);
});

test('partial results map to per-agent child spans with inferred stage', () => {
  const store = new RuntimeSpanStore();
  store.beginRoot('turn-1', 'working', 1_000);
  store.begin('sub-1', 'subagent', 'turn-1', 2_000);

  // Names arrive via the tool input calls, mapped by result order.
  const calls = [{ agent: 'reviewer' }, { agent: 'scout' }];
  assert.equal(
    store.update(
      'sub-1',
      subagentPartial([{ active: true }, { active: true }]),
      calls,
      3_000,
    ),
    true,
  );
  const snap = store.snapshot(4_000);
  const reviewer = snap.spans?.find((span) => span.agent === 'reviewer');
  assert.equal(reviewer?.parent, 'sub-1');
  assert.equal(reviewer?.stage, 'assuring');
  const scout = snap.spans?.find((span) => span.agent === 'scout');
  assert.equal(scout?.stage, 'understanding');
  assert.equal(snap.subagents, 2);
});

test('settled agents collapse; change queue reports starts and ends', () => {
  const store = new RuntimeSpanStore();
  store.beginRoot('turn-1', 'working', 1_000);
  store.begin('sub-1', 'subagent', 'turn-1', 2_000);
  const calls = [{ agent: 'reviewer' }, { agent: 'scout' }];
  store.update(
    'sub-1',
    subagentPartial([{ active: true }, { active: true }]),
    calls,
    3_000,
  );
  store.drainChanges();

  assert.equal(
    store.update('sub-1', subagentPartial([{ active: false }]), calls),
    true,
  );
  const changes = store.drainChanges();
  // Settled reviewer ends explicitly; absent scout ends by omission.
  assert.deepEqual([...changes.ended].sort(), ['sub-1:0', 'sub-1:1']);
  const snap = store.snapshot();
  assert.equal(
    snap.spans?.some((span) => span.agent === 'scout'),
    false,
  );
  assert.equal(
    snap.spans?.some((span) => span.agent === 'reviewer'),
    false,
  );
  assert.equal(
    snap.spans?.some((span) => span.id === 'sub-1'),
    true,
  );
});

test('finishing spans and roots ends them exactly once', () => {
  const store = new RuntimeSpanStore();
  store.beginRoot('turn-1', 'working', 1_000);
  store.begin('bash-1', 'bash', 'turn-1', 2_000);
  assert.equal(store.finish('bash-1', 3_000), true);
  assert.equal(store.finish('bash-1', 4_000), false);
  assert.equal(store.endRoot('turn-1', 5_000), true);
  assert.equal(store.endRoot('turn-1', 6_000), false);
  const snap = store.snapshot();
  assert.equal(snap.children, 0);
  assert.equal(snap.spans?.length, 0);
});

test('count parity with the retired tracker semantics', () => {
  const store = new RuntimeSpanStore();
  store.beginRoot('turn-1', 'working', 1_000);
  store.begin('bash-1', 'bash', 'turn-1', 2_000);
  store.begin('sub-1', 'subagent', 'turn-1', 2_000);
  store.update(
    'sub-1',
    subagentPartial([{ active: true }, { active: true }, { active: true }]),
    [{ agent: 'a' }, { agent: 'b' }, { agent: 'c' }],
    3_000,
  );
  const snap = store.snapshot();
  // children = bash(1) + per-agent(3); the tool span is a container, not a run.
  assert.equal(snap.children, 4);
  assert.equal(snap.subagents, 3);
});
