import assert from 'node:assert/strict';
import test from 'node:test';
import { visibleWidth } from '@earendil-works/pi-tui';

import {
  formatGoalElapsed,
  type GoalBlockState,
  readGoalBlockState,
  renderGoalBlock,
} from '../src/goal-block.ts';

const plainTheme = {
  fg: (_color: string, text: string) => text,
  bold: (text: string) => text,
} as never;

function fakeCtx(entries: readonly unknown[]): {
  sessionManager: { getBranch: () => readonly unknown[] };
} {
  return { sessionManager: { getBranch: () => entries } };
}

function goalEntry(goal: Record<string, unknown>): unknown {
  return { type: 'custom', customType: 'pi-goal-state', data: { goal } };
}

test('reads a focused goal record with nested task counts', () => {
  const ctx = fakeCtx([
    goalEntry({
      id: 'goal-1',
      objective: 'Ship the chrome-only cockpit',
      status: 'active',
      usage: { tokensUsed: 24_300, activeSeconds: 381 },
      taskList: {
        tasks: [
          {
            status: 'complete',
            subtasks: [{ status: 'complete' }, { status: 'pending' }],
          },
          { status: 'active' },
        ],
      },
    }),
    { type: 'custom', customType: 'pi-goal-focus', data: { focusedGoalId: 'goal-1' } },
  ]);

  const state = readGoalBlockState(ctx as never);
  assert.ok(state);
  assert.equal(state.objective, 'Ship the chrome-only cockpit');
  assert.equal(state.status, 'active');
  assert.deepEqual(state.tasks, { pending: 1, active: 1, complete: 2, total: 4 });
  assert.equal(state.tokensUsed, 24_300);
});

test('returns null when the focused goal differs from the state record', () => {
  const ctx = fakeCtx([
    goalEntry({ id: 'goal-1', objective: 'Other goal', status: 'queued' }),
    { type: 'custom', customType: 'pi-goal-focus', data: { focusedGoalId: 'goal-9' } },
  ]);
  assert.equal(readGoalBlockState(ctx as never), null);
});

test('returns null without a goal state entry', () => {
  assert.equal(readGoalBlockState(fakeCtx([]) as never), null);
  const malformed = fakeCtx([goalEntry({ id: 'x' })]);
  assert.equal(readGoalBlockState(malformed as never), null);
});

test('renders the full block on wide frames with degradation ladder', () => {
  const state: GoalBlockState = {
    id: 'goal-1',
    objective: 'Ship the chrome-only cockpit',
    status: 'active',
    tokensUsed: 24_300,
    activeSeconds: 381,
    tokenBudget: 50_000,
    tasks: { pending: 1, active: 1, complete: 2, total: 4 },
  };

  const wide = renderGoalBlock(state, 80, plainTheme);
  assert.equal(wide.length, 3);
  assert.match(wide[0] ?? '', /◆ Ship the chrome-only cockpit.*● active.*6m 21s/u);
  assert.match(wide[1] ?? '', /tasks 2\/4 done · 1 active/u);
  assert.match(wide[2] ?? '', /24\.3k tokens.*budget 49%/u);
  assert.ok(wide.every((line) => visibleWidth(line) <= 80));

  const medium = renderGoalBlock(state, 52, plainTheme);
  assert.equal(medium.length, 2);

  const narrow = renderGoalBlock(state, 44, plainTheme);
  assert.equal(narrow.length, 1);

  assert.deepEqual(renderGoalBlock(state, 30, plainTheme), []);
  assert.deepEqual(renderGoalBlock(null, 80, plainTheme), []);
});

test('formats elapsed durations', () => {
  assert.equal(formatGoalElapsed(45), '45s');
  assert.equal(formatGoalElapsed(381), '6m 21s');
  assert.equal(formatGoalElapsed(3_780), '1h 3m');
});
