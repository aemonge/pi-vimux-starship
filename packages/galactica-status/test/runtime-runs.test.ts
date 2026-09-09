import assert from 'node:assert/strict';
import test from 'node:test';

import { RuntimeRunTracker } from '../src/runtime-runs.ts';

test('counts Bash only as a child run for its exact tool lifecycle', () => {
  const tracker = new RuntimeRunTracker();

  assert.deepEqual(tracker.snapshot(), { children: 0, subagents: 0 });
  assert.equal(tracker.begin('bash-1', 'bash'), true);
  assert.deepEqual(tracker.snapshot(), { children: 1, subagents: 0 });
  assert.equal(tracker.finish('bash-1'), true);
  assert.deepEqual(tracker.snapshot(), { children: 0, subagents: 0 });
});

test('counts only lifecycle-evidenced active subagents', () => {
  const tracker = new RuntimeRunTracker();
  tracker.begin('subagent-1', 'subagent');

  assert.equal(
    tracker.update('subagent-1', {
      details: {
        kind: 'pi-subagent',
        results: [
          {
            exitCode: -1,
            agent: 'queued-private-name',
            prompt: 'queued private prompt',
          },
          {
            exitCode: -1,
            sawAgentStart: true,
            sawAgentSettled: false,
            agent: 'running-private-name',
            prompt: 'running private prompt',
          },
          {
            exitCode: -1,
            sawAgentStart: true,
            agent: 'second-running-private-name',
            prompt: 'second running private prompt',
          },
          {
            exitCode: 0,
            sawAgentStart: true,
            sawAgentSettled: true,
            agent: 'complete-private-name',
            prompt: 'completed private prompt',
          },
        ],
      },
    }),
    true,
  );
  assert.deepEqual(tracker.snapshot(), { children: 2, subagents: 2 });

  assert.equal(
    tracker.update('subagent-1', {
      details: {
        kind: 'pi-subagent',
        results: [
          { exitCode: -1 },
          { exitCode: 0, sawAgentStart: true, sawAgentSettled: true },
        ],
      },
    }),
    true,
  );
  assert.deepEqual(tracker.snapshot(), { children: 0, subagents: 0 });
});

test('ignores malformed and unrelated progress without inventing active work', () => {
  const tracker = new RuntimeRunTracker();
  tracker.begin('subagent-1', 'subagent');

  assert.equal(tracker.update('subagent-1', { details: { running: 8 } }), false);
  assert.equal(
    tracker.update('subagent-1', {
      details: { kind: 'pi-subagent', results: 'private child output' },
    }),
    false,
  );
  assert.deepEqual(tracker.snapshot(), { children: 0, subagents: 0 });
});
