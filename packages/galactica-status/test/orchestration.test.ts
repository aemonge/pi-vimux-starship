import assert from 'node:assert/strict';
import test from 'node:test';
import { parseOrchestrationState } from '../src/orchestration.ts';

test('parses running orchestration state and active workers', () => {
  const state = parseOrchestrationState(
    {
      status: 'running',
      phase: 'reviewer',
      workers: [{ status: 'running' }, { status: 'working' }, { status: 'complete' }],
      currentTask: 'Review publisher',
      openspec: { taskId: '3.8' },
      startedAt: 1_000,
      updatedAt: 2_000,
    },
    { source: 'state.json', now: 181_000 },
  );

  assert.equal(state.state, 'running');
  assert.equal(state.phase, 'reviewer');
  assert.equal(state.activeWorkers, 2);
  assert.equal(state.openspecTaskId, '3.8');
  assert.equal(state.elapsedMs, 180_000);
});

test('parses blocked workflow state', () => {
  const state = parseOrchestrationState(
    { state: 'failed-verification', blockedReason: 'tests' },
    { source: 'state.json' },
  );
  assert.equal(state.state, 'blocked');
  assert.equal(state.currentTask, 'tests');
});

test('rejects unrelated JSON', () => {
  assert.throws(
    () => parseOrchestrationState({ arbitrary: true }, { source: 'state.json' }),
    /no recognized workflow fields/,
  );
});
