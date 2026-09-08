import assert from 'node:assert/strict';
import test from 'node:test';

import {
  credentialFreeProbeEnvironment,
  packedPathsFromNpmJson,
  REQUIRED_FILES,
  validateDemoSources,
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

test('clean-room Pi probe environment cannot inherit provider or session secrets', () => {
  const environment = credentialFreeProbeEnvironment('/tmp/clean-home', '/usr/bin');

  assert.deepEqual(Object.keys(environment).sort(), [
    'HOME',
    'LANG',
    'PATH',
    'PI_CODING_AGENT_DIR',
    'PI_OFFLINE',
    'TERM',
  ]);
  assert.equal(environment.PI_OFFLINE, '1');
  for (const key of ['ANTHROPIC_API_KEY', 'AWS_ACCESS_KEY_ID', 'PI_SESSION_FILE']) {
    assert.equal(key in environment, false);
  }
});

test('README and VHS source preserve the credential-free Neovim demonstration', () => {
  const readme = [
    'docs/assets/pi-vimux-starship.gif',
    'nvim +terminal',
    '/vimux-health',
    '## Installation',
    '### Rollback',
    '## Reproducible VHS demo',
  ].join('\n');
  const tape = [
    'Output docs/assets/pi-vimux-starship.gif',
    'Type "pi --offline --no-session --no-extensions --no-context-files"',
    'Type "/vimux-health"',
    'Type ":x"',
  ].join('\n');

  assert.deepEqual(validateDemoSources(readme, tape), []);
  assert.match(
    validateDemoSources(readme, `${tape}\nType "--api-key secret"`).join('\n'),
    /forbidden/u,
  );
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
