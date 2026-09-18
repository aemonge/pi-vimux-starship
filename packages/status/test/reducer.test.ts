import assert from 'node:assert/strict';
import test from 'node:test';
import type { LedgerEvent } from '../src/ledger.ts';
import type { GoalHeaderState } from '../src/goal.ts';
import type { RunSpan } from '../src/types.ts';
import {
  applyEvent,
  deriveTitle,
  derivedStage,
  emptyFacts,
  reduceLedger,
  rootRun,
} from '../src/reducer.ts';

const goal: GoalHeaderState = {
  id: 'goal-1',
  status: 'active',
  automaticModelTurns: 3,
  waiting: false,
};

function span(overrides: Partial<RunSpan> = {}): RunSpan {
  return {
    id: 'turn-1',
    kind: 'agent',
    parent: null,
    stage: 'understanding',
    stageDeclared: false,
    since: 1_000,
    ...overrides,
  };
}

test('empty fold yields listening selection-none snapshot with no placeholders', () => {
  const snapshot = reduceLedger([]);
  assert.equal(snapshot.version, 0);
  assert.deepEqual(snapshot.selection, { kind: 'none' });
  assert.equal(snapshot.runs.length, 0);
  assert.equal(snapshot.progress, null);
  assert.equal(derivedStage(snapshot), 'listening');
});

test('applyEvent is pure: input facts are never mutated', () => {
  const facts = emptyFacts();
  applyEvent(facts, { type: 'run/start', at: 1, span: span() });
  assert.equal(facts.runs.size, 0);
});

test('resolver priority: openspec-task beats all others', () => {
  const snapshot = reduceLedger([
    { type: 'focus/subject', at: 1, subject: { state: 'set', title: 'subject' } },
    { type: 'focus/work', at: 2, work: { state: 'active', intent: 'work' } },
    { type: 'focus/goal', at: 3, goal },
    {
      type: 'focus/openspec',
      at: 4,
      focus: { mode: 'task', change: 'chg', taskId: '2' },
    },
  ]);
  assert.deepEqual(snapshot.selection, {
    kind: 'openspec-task',
    change: 'chg',
    task: '2',
  });
});

test('resolver priority: goal beats work and subject', () => {
  const snapshot = reduceLedger([
    { type: 'focus/subject', at: 1, subject: { state: 'set', title: 'subject' } },
    { type: 'focus/work', at: 2, work: { state: 'active', intent: 'work' } },
    { type: 'focus/goal', at: 3, goal },
  ]);
  assert.equal(snapshot.selection.kind, 'goal');
});

test('resolver priority: subject is the passive fallback, never overriding', () => {
  const withWork = reduceLedger([
    { type: 'focus/subject', at: 1, subject: { state: 'set', title: 'subject' } },
    { type: 'focus/work', at: 2, work: { state: 'active', intent: 'work' } },
  ]);
  assert.equal(withWork.selection.kind, 'session-work');
  const alone = reduceLedger([
    { type: 'focus/subject', at: 1, subject: { state: 'set', title: 'subject' } },
  ]);
  assert.deepEqual(alone.selection, { kind: 'subject', title: 'subject' });
});

test('clearing higher focus falls back to subject without narration', () => {
  const snapshot = reduceLedger([
    { type: 'focus/subject', at: 1, subject: { state: 'set', title: 'subject' } },
    { type: 'focus/work', at: 2, work: { state: 'active', intent: 'work' } },
    { type: 'focus/work', at: 3, work: { state: 'clear' } },
  ]);
  assert.deepEqual(snapshot.selection, { kind: 'subject', title: 'subject' });
});

test('derived title never renders placeholder narration (exhibits 2, 3, 5)', () => {
  const none = reduceLedger([]);
  assert.equal(deriveTitle(none), 'π');
  const cleared = reduceLedger([
    { type: 'focus/openspec', at: 1, focus: { mode: 'none' } },
  ]);
  const title = deriveTitle(cleared);
  const forbidden = [
    '—',
    'no focus',
    'no OpenSpec',
    'OpenSpec clear',
    'task —',
    'stps —',
  ];
  for (const token of forbidden) {
    assert.equal(title.includes(token), false, `title must not contain ${token}`);
  }
});

test('derived title projects each selection kind (derived-only rule)', () => {
  assert.equal(
    deriveTitle(
      reduceLedger([
        {
          type: 'focus/openspec',
          at: 1,
          focus: { mode: 'task', change: 'chg', taskId: '3' },
        },
      ]),
    ),
    'π chg › 3',
  );
  assert.equal(
    deriveTitle(
      reduceLedger([
        { type: 'focus/subject', at: 1, subject: { state: 'set', title: 'S' } },
      ]),
    ),
    'π S',
  );
  assert.equal(
    deriveTitle(
      reduceLedger([
        {
          type: 'focus/work',
          at: 1,
          work: { state: 'validation', intent: 'freeze it' },
        },
      ]),
    ),
    'π Validate › freeze it',
  );
});

test('runs fold into a span tree with declaration beating inference', () => {
  const snapshot = reduceLedger([
    { type: 'run/start', at: 1, span: span() },
    {
      type: 'run/start',
      at: 2,
      span: span({
        id: 'sub-1',
        kind: 'subagent',
        parent: 'turn-1',
        agent: 'reviewer',
        stage: 'working',
      }),
    },
    { type: 'run/stage', at: 3, id: 'turn-1', stage: 'working', declared: true },
    { type: 'run/stage', at: 4, id: 'turn-1', stage: 'assuring', declared: false },
  ]);
  assert.equal(snapshot.runs.length, 2);
  assert.equal(rootRun(snapshot)?.id, 'turn-1');
  assert.equal(rootRun(snapshot)?.stage, 'working');
  assert.equal(derivedStage(snapshot), 'working');
  const reviewer = snapshot.runs.find((run) => run.id === 'sub-1');
  assert.equal(reviewer?.agent, 'reviewer');
  assert.equal(reviewer?.stage, 'working');
});

test('inference may set stage before any declaration arrives', () => {
  const snapshot = reduceLedger([
    { type: 'run/start', at: 1, span: span() },
    { type: 'run/stage', at: 2, id: 'turn-1', stage: 'assuring', declared: false },
  ]);
  assert.equal(snapshot.runs[0]?.stage, 'assuring');
  assert.equal(snapshot.runs[0]?.stageDeclared, false);
});

test('ended spans stay recorded but stop accepting stage updates', () => {
  const snapshot = reduceLedger([
    { type: 'run/start', at: 1, span: span() },
    { type: 'run/end', at: 2, id: 'turn-1' },
    { type: 'run/stage', at: 3, id: 'turn-1', stage: 'answering', declared: true },
  ]);
  assert.equal(snapshot.runs[0]?.endedAt, 2);
  assert.equal(snapshot.runs[0]?.stage, 'understanding');
});

test('stage and end events for unknown ids are no-ops', () => {
  const before = reduceLedger([{ type: 'run/start', at: 1, span: span() }]);
  const after = reduceLedger([
    { type: 'run/start', at: 1, span: span() },
    { type: 'run/stage', at: 2, id: 'ghost', stage: 'working', declared: true },
    { type: 'run/end', at: 3, id: 'ghost' },
  ]);
  assert.deepEqual(after.selection, before.selection);
  assert.deepEqual(after.runs, before.runs);
  assert.deepEqual(after.progress, before.progress);
  assert.equal(after.version, 3);
});

test('progress refresh carries freshness and version counts events', () => {
  const snapshot = reduceLedger([
    {
      type: 'progress/refresh',
      at: 42,
      progress: {
        tasks: { completed: 2, total: 5 },
        steps: { completed: 6, total: 14 },
        freshAt: 42,
      },
    },
  ]);
  assert.deepEqual(snapshot.progress?.tasks, { completed: 2, total: 5 });
  assert.equal(snapshot.version, 1);
});
