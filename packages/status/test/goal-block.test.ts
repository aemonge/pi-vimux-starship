import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { visibleWidth } from '@earendil-works/pi-tui';

import {
  formatGoalElapsed,
  type GoalBlockState,
  readGoalBlockState,
  renderGoalBlock,
  resolveGoalRoot,
} from '../src/goal-block.ts';

const plainTheme = {
  fg: (_color: string, text: string) => text,
  bold: (text: string) => text,
} as never;

function fakeCtx(
  entries: readonly unknown[],
  cwd?: string,
): {
  cwd?: string;
  sessionManager: { getBranch: () => readonly unknown[] };
} {
  return {
    ...(cwd !== undefined ? { cwd } : {}),
    sessionManager: { getBranch: () => entries },
  };
}

function focusEntry(goalId: string | null): unknown {
  return {
    type: 'custom',
    customType: 'pi-goal-focus',
    data: { focusedGoalId: goalId },
  };
}

const SAMPLE_GOAL = {
  id: 'goal-1',
  objective: 'Ship the chrome-only cockpit',
  status: 'active',
  usage: { tokensUsed: 24_300, activeSeconds: 381 },
  tokenBudget: 50_000,
  taskList: {
    tasks: [
      {
        status: 'complete',
        subtasks: [{ status: 'complete' }, { status: 'pending' }],
      },
      { status: 'active' },
    ],
  },
};

function writePool(root: string, goals: unknown[]): void {
  mkdirSync(join(root, '.metadata'), { recursive: true });
  writeFileSync(
    join(root, '.metadata', '.goals-pool-snapshot.json'),
    JSON.stringify({ version: 1, dirMtimeMs: 0, goals }),
    'utf8',
  );
}

test('reads a focused goal from the disk pool snapshot with nested task counts', () => {
  const project = mkdtempSync(join(tmpdir(), 'goal-block-'));
  writePool(join(project, '.pi/goals'), [SAMPLE_GOAL]);
  const ctx = fakeCtx([focusEntry('goal-1')], project);

  const state = readGoalBlockState(ctx as never);
  assert.ok(state);
  assert.equal(state.objective, 'Ship the chrome-only cockpit');
  assert.equal(state.status, 'active');
  assert.deepEqual(state.tasks, { pending: 1, active: 1, complete: 2, total: 4 });
  assert.equal(state.tokensUsed, 24_300);
});

test('falls back to the legacy session record when no pool exists', () => {
  const project = mkdtempSync(join(tmpdir(), 'goal-block-'));
  const ctx = fakeCtx(
    [
      { type: 'custom', customType: 'pi-goal-state', data: { goal: SAMPLE_GOAL } },
      focusEntry('goal-1'),
    ],
    project,
  );
  const state = readGoalBlockState(ctx as never);
  assert.ok(state);
  assert.equal(state.objective, 'Ship the chrome-only cockpit');
});

test('returns null when the focused goal is not the one on record', () => {
  const project = mkdtempSync(join(tmpdir(), 'goal-block-'));
  writePool(join(project, '.pi/goals'), [SAMPLE_GOAL]);
  const ctx = fakeCtx([focusEntry('goal-9')], project);
  assert.equal(readGoalBlockState(ctx as never), null);
});

test('returns null when unfocused or empty', () => {
  const project = mkdtempSync(join(tmpdir(), 'goal-block-'));
  writePool(join(project, '.pi/goals'), [SAMPLE_GOAL]);
  assert.equal(readGoalBlockState(fakeCtx([focusEntry(null)], project) as never), null);
  assert.equal(readGoalBlockState(fakeCtx([], project) as never), null);
  const malformed = fakeCtx(
    [
      { type: 'custom', customType: 'pi-goal-state', data: { goal: { id: 'x' } } },
      focusEntry('x'),
    ],
    project,
  );
  assert.equal(readGoalBlockState(malformed as never), null);
});

test('resolveGoalRoot skips broken symlinks', () => {
  const project = mkdtempSync(join(tmpdir(), 'goal-block-'));
  const agentGoals = join(project, 'fake-home', '.pi', 'goals');
  mkdirSync(join(project, 'fake-home', '.pi'), { recursive: true });
  symlinkSync(join(project, 'nowhere'), agentGoals);
  const resolved = resolveGoalRoot(fakeCtx([], project) as never);
  assert.notEqual(resolved, agentGoals);
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
});

test('renders an unfocused hint when open goals exist', () => {
  const hint = renderGoalBlock(null, 60, plainTheme, 2);
  assert.deepEqual(hint, ['◆ 2 open goals · /goal-focus']);
  assert.deepEqual(renderGoalBlock(null, 60, plainTheme, 0), []);
  assert.deepEqual(renderGoalBlock(null, 44, plainTheme, 2), []);
});

test('formats elapsed durations', () => {
  assert.equal(formatGoalElapsed(45), '45s');
  assert.equal(formatGoalElapsed(381), '6m 21s');
  assert.equal(formatGoalElapsed(3_780), '1h 3m');
});
