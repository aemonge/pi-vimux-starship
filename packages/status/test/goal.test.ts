import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isGoalOwnedPrompt,
  parseGoalAutomaticTurnLimit,
  restoreGoalHeaderState,
  sameGoalHeaderState,
} from '../src/goal.ts';

function goalEntry(
  status: string,
  options: {
    id?: string;
    automaticModelTurns?: unknown;
    waiting?: unknown;
    text?: string;
  } = {},
) {
  return {
    type: 'custom',
    customType: 'goal-state',
    data: {
      goal: {
        id: options.id ?? 'goal-1',
        text: options.text ?? '/private/path must never enter the header',
        status,
        automaticModelTurns: options.automaticModelTurns ?? 0,
        ...(options.waiting === undefined ? {} : { waiting: options.waiting }),
      },
    },
  };
}

test('restores only bounded display-safe Goal state from the latest session entry', () => {
  const state = restoreGoalHeaderState([
    goalEntry('paused'),
    { type: 'assistant', content: 'unrelated' },
    goalEntry('active', {
      id: 'goal-2',
      automaticModelTurns: 2,
      waiting: { reason: 'external event with secret text' },
    }),
  ]);

  assert.deepEqual(state, {
    id: 'goal-2',
    status: 'active',
    automaticModelTurns: 2,
    waiting: true,
  });
  assert.equal('text' in (state ?? {}), false);
});

test('an explicit cleared Goal entry removes older Goal state', () => {
  assert.equal(
    restoreGoalHeaderState([
      goalEntry('active'),
      { type: 'custom', customType: 'goal-state', data: { goal: null } },
    ]),
    null,
  );
});

test('rejects malformed Goal status and bounds progress counters', () => {
  assert.equal(restoreGoalHeaderState([goalEntry('invented')]), null);
  assert.deepEqual(
    restoreGoalHeaderState([
      goalEntry('active', { automaticModelTurns: Number.MAX_SAFE_INTEGER }),
    ]),
    {
      id: 'goal-1',
      status: 'active',
      automaticModelTurns: 9_999,
      waiting: false,
    },
  );
});

test('compares only the safe Goal projection fields', () => {
  const active = restoreGoalHeaderState([goalEntry('active')]);
  const same = restoreGoalHeaderState([
    goalEntry('active', { text: 'a completely different raw objective' }),
  ]);
  const complete = restoreGoalHeaderState([goalEntry('complete')]);
  assert.equal(sameGoalHeaderState(active, same), true);
  assert.equal(sameGoalHeaderState(active, complete), false);
});

test('recognizes only bounded Pi Goal-owned prompt markers', () => {
  assert.equal(
    isGoalOwnedPrompt(
      'Goal mode is active\n<!-- pi-goal-prompt:ffe5a524-6bb8-4b87-b3d3-57fea9fc9797 -->',
    ),
    true,
  );
  assert.equal(
    isGoalOwnedPrompt(
      'Continue\n<!-- pi-goal-continuation:goal-1:ffe5a524-6bb8-4b87-b3d3-57fea9fc9797 -->',
    ),
    true,
  );
  assert.equal(isGoalOwnedPrompt('APPROVE'), false);
  assert.equal(isGoalOwnedPrompt({ prompt: 'not a string' }), false);
});

test('reads only a bounded positive automatic-turn limit', () => {
  assert.equal(
    parseGoalAutomaticTurnLimit({
      continuationLimits: { automaticTurns: 4, noProgressTurns: 2 },
    }),
    4,
  );
  assert.equal(
    parseGoalAutomaticTurnLimit({ continuationLimits: { automaticTurns: null } }),
    undefined,
  );
  assert.equal(
    parseGoalAutomaticTurnLimit({ continuationLimits: { automaticTurns: 10_000 } }),
    undefined,
  );
});
