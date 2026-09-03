import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getNamespacedSection,
  mergeConfigRecords,
  PACKAGE_SETTINGS_KEY,
  readNamespacedLayers,
} from '../src/config.ts';

test('the package owns one stable settings namespace', () => {
  assert.equal(PACKAGE_SETTINGS_KEY, 'piVimuxStarship');
  assert.deepEqual(
    getNamespacedSection(
      {
        piVimuxStarship: {
          footer: { refreshMs: 4_000 },
        },
      },
      'footer',
    ),
    { refreshMs: 4_000 },
  );
});

test('namespaced sections reject malformed containers', () => {
  for (const settings of [undefined, null, [], { piVimuxStarship: true }]) {
    assert.equal(getNamespacedSection(settings, 'vim'), undefined);
  }
  assert.equal(
    getNamespacedSection({ piVimuxStarship: { vim: 'normal' } }, 'vim'),
    undefined,
  );
});

test('project configuration can be excluded for command-capable sections', () => {
  const layers = readNamespacedLayers(
    { piVimuxStarship: { status: { enabled: true } } },
    {
      piVimuxStarship: {
        status: { diagnostics: { command: ['sh', '-c', 'unsafe'] } },
      },
    },
    'status',
    { allowProject: false },
  );

  assert.deepEqual(layers.global, { enabled: true });
  assert.equal(layers.project, undefined);
});

test('deep merge preserves nested defaults and replaces arrays', () => {
  assert.deepEqual(
    mergeConfigRecords(
      {
        providerStatus: {
          providers: ['openai-codex', 'anthropic'],
          showCredits: false,
        },
      },
      {
        providerStatus: {
          providers: ['anthropic'],
        },
      },
    ),
    {
      providerStatus: {
        providers: ['anthropic'],
        showCredits: false,
      },
    },
  );
});
