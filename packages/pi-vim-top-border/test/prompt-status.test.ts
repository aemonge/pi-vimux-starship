import assert from 'node:assert/strict';
import test from 'node:test';

import { formatModeAnchor, parsePromptStatus } from '../prompt-status.ts';

test('spaces only the vi-mode icon for right-edge border placement', () => {
  assert.equal(formatModeAnchor('󰏫'), ' 󰏫 ');
  assert.equal(formatModeAnchor('󰆾'), ' 󰆾 ');
  assert.equal(formatModeAnchor('󰒅'), ' 󰒅 ');
  assert.equal(formatModeAnchor('󰆍'), ' 󰆍 ');
});

test('accepts bounded prompt telemetry with conflicts and progress', () => {
  assert.deepEqual(
    parsePromptStatus({
      protocol: 1,
      signals: [{ glyph: '✓', color: 'success' }],
      git: {
        branch: 'main',
        staged: 2,
        modified: 1,
        untracked: 3,
        conflicts: 1,
      },
      progress: [{ icon: '󰘬', completed: 18, total: 41, color: 'accent' }],
    }),
    {
      signals: [{ glyph: '✓', color: 'success' }],
      git: {
        branch: 'main',
        staged: 2,
        modified: 1,
        untracked: 3,
        conflicts: 1,
      },
      progress: [{ icon: '󰘬', completed: 18, total: 41, color: 'accent' }],
    },
  );
});

test('rejects malformed prompt telemetry', () => {
  assert.equal(parsePromptStatus({ protocol: 2 }), null);
  assert.equal(
    parsePromptStatus({
      protocol: 1,
      signals: [],
      git: { branch: 'main', staged: -1 },
      progress: [],
    }),
    null,
  );
});
