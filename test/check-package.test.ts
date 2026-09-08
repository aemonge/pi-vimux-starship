import assert from 'node:assert/strict';
import test from 'node:test';

import {
  packedPathsFromNpmJson,
  REQUIRED_FILES,
  validatePackedFiles,
} from '../scripts/check-package.mjs';

test('minimal package contents retain runtime entrypoints, docs, and licenses', () => {
  const result = validatePackedFiles(REQUIRED_FILES);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.files, [...REQUIRED_FILES].sort());
});

test('package contents reject development, planning, test, and private paths', () => {
  const result = validatePackedFiles([
    ...REQUIRED_FILES,
    '.env.private',
    '.pi/settings.json',
    'AGENTS.md',
    'baseline/source.sha256',
    'openspec/changes/plan/tasks.md',
    'packages/pi-vim-top-border/test/editor.test.ts',
    'scripts/private.mjs',
    'src/health.test.ts',
    'tsconfig.json',
  ]);

  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0] ?? '', /\.env\.private/u);
  assert.match(result.errors[0] ?? '', /openspec/u);
  assert.match(result.errors[0] ?? '', /editor\.test\.ts/u);
});

test('npm pack JSON exposes exactly one validated path list', () => {
  assert.deepEqual(
    packedPathsFromNpmJson({
      'pi-vimux-starship': {
        files: [{ path: 'README.md' }, { path: 'src/index.ts' }],
      },
    }),
    ['README.md', 'src/index.ts'],
  );
  assert.throws(() => packedPathsFromNpmJson([]), /non-object/u);
  assert.throws(
    () => packedPathsFromNpmJson({ first: { files: [] }, second: { files: [] } }),
    /2 package results/u,
  );
});
