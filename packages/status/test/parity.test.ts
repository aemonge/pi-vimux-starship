import assert from 'node:assert/strict';
import test from 'node:test';
import { headerSelection } from '../src/publisher.ts';
import type { GoalHeaderState } from '../src/goal.ts';
import type { OpenSpecState } from '../src/types.ts';
import {
  reduceLedger,
  resolveSelection,
  snapshotFromFacts,
  emptyFacts,
} from '../src/reducer.ts';
import { applyEvent } from '../src/reducer.ts';
import type { LedgerEvent } from '../src/ledger.ts';
import type { RunSpan } from '../src/types.ts';

const goal: GoalHeaderState = {
  id: 'goal-1',
  status: 'active',
  automaticModelTurns: 3,
  waiting: false,
};

const openSpec: OpenSpecState = {
  projectRoot: '/project',
  changeId: 'closed-loop',
  title: 'Shape a Pi-first closed-loop development harness',
  phase: 'in-progress',
  completedTasks: 20,
  progressPercent: 91,
  totalTasks: 22,
  pendingTasks: [],
  allTasks: [],
  meta: {
    source: 'test',
    refreshedAt: 1,
    attemptedAt: 1,
    stale: false,
  },
};

const subject = { state: 'set' as const, title: 'Session subject' };
const work = { state: 'active' as const, intent: 'Freeze the contract' };
const workValidation = { state: 'validation' as const, intent: 'Freeze the contract' };
const taskFocus = { mode: 'task' as const, change: 'closed-loop', taskId: '2' };

function span(overrides: Partial<RunSpan> = {}): RunSpan {
  return {
    id: 'turn-1',
    kind: 'agent',
    parent: null,
    stage: 'working',
    stageDeclared: false,
    since: 1,
    ...overrides,
  };
}

test('resolver slot matches the legacy headerSelection waterfall (T2 parity)', () => {
  const cases: Array<{
    name: string;
    facts: Parameters<typeof resolveSelection>[0];
    legacy: Parameters<typeof headerSelection>[0];
    expected: string;
  }> = [
    {
      name: 'nothing set',
      facts: {
        openSpec: { mode: 'none' },
        goal: null,
        work: { state: 'clear' },
        subject: { state: 'clear' },
      },
      legacy: {},
      expected: 'none',
    },
    {
      name: 'subject alone',
      facts: {
        openSpec: { mode: 'none' },
        goal: null,
        work: { state: 'clear' },
        subject,
      },
      legacy: { subject },
      expected: 'subject',
    },
    {
      name: 'work beats subject',
      facts: { openSpec: { mode: 'none' }, goal: null, work, subject },
      legacy: { workFocus: work, subject },
      expected: 'session-work',
    },
    {
      name: 'validation work still session-work',
      facts: {
        openSpec: { mode: 'none' },
        goal: null,
        work: workValidation,
        subject,
      },
      legacy: { workFocus: workValidation, subject },
      expected: 'session-work',
    },
    {
      name: 'goal beats work and subject',
      facts: { openSpec: { mode: 'none' }, goal, work, subject },
      legacy: { goal, workFocus: work, subject },
      expected: 'goal',
    },
    {
      name: 'openspec task beats everything',
      facts: { openSpec: taskFocus, goal, work, subject },
      legacy: {
        openSpec,
        focusedTaskId: '2',
        goal,
        workFocus: work,
        subject,
      },
      expected: 'openspec-task',
    },
  ];

  for (const testCase of cases) {
    const resolved = resolveSelection(testCase.facts).kind;
    const legacySelection = headerSelection(testCase.legacy);
    const legacyKind = legacySelection
      ? legacySelection.source === 'openspec'
        ? 'openspec-task'
        : legacySelection.source
      : 'none';
    assert.equal(resolved, testCase.expected, testCase.name);
    assert.equal(legacyKind, testCase.expected, `${testCase.name} (legacy)`);
  }
});

test('incremental recordEvent fold equals a full ledger replay (T2 parity)', () => {
  const events: LedgerEvent[] = [
    { type: 'focus/subject', at: 1, subject },
    { type: 'focus/work', at: 2, work },
    { type: 'run/start', at: 3, span: span() },
    {
      type: 'run/start',
      at: 4,
      span: span({ id: 'sub-1', kind: 'subagent', parent: 'turn-1', agent: 'scout' }),
    },
    { type: 'run/stage', at: 5, id: 'turn-1', stage: 'assuring', declared: true },
    {
      type: 'progress/refresh',
      at: 6,
      progress: {
        tasks: { completed: 1, total: 2 },
        steps: { completed: 3, total: 7 },
        freshAt: 6,
      },
    },
    { type: 'run/end', at: 7, id: 'sub-1' },
    { type: 'focus/work', at: 8, work: { state: 'clear' } },
  ];

  let incremental = emptyFacts();
  for (const event of events) {
    incremental = applyEvent(incremental, event);
  }
  const incrementalSnapshot = snapshotFromFacts(incremental, events.length);
  const replaySnapshot = reduceLedger(events);

  assert.deepEqual(incrementalSnapshot.selection, replaySnapshot.selection);
  assert.deepEqual(incrementalSnapshot.runs, replaySnapshot.runs);
  assert.deepEqual(incrementalSnapshot.progress, replaySnapshot.progress);
  assert.equal(incrementalSnapshot.selection.kind, 'subject');
  assert.equal(incrementalSnapshot.runs.length, 2);
});
