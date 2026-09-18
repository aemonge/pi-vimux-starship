import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldRefreshGitAfterTool } from '../src/git-refresh.ts';

test('refreshes Git after successful tools that may mutate repository state', () => {
  for (const toolName of ['bash', 'edit', 'write']) {
    assert.equal(shouldRefreshGitAfterTool(toolName, false), true, toolName);
  }
});

test('does not refresh Git for reads or failed mutations', () => {
  assert.equal(shouldRefreshGitAfterTool('read', false), false);
  assert.equal(shouldRefreshGitAfterTool('grep', false), false);
  assert.equal(shouldRefreshGitAfterTool('edit', true), false);
});
