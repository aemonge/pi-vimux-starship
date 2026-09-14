import assert from 'node:assert/strict';
import test from 'node:test';
import { COCKPIT_COMPOSITION, COCKPIT_SURFACES } from '../src/index.ts';
import {
  EXPECTED_EXTENSION_ENTRYPOINTS,
  inspectLocalPackage,
} from '../src/local-load-probe.ts';

const EXPECTED_COMMANDS = [
  'fancy-footer',
  'galactica-status',
  'galactica-status-debug',
  'galactica-status-refresh',
  'openspec-focus',
  'pi-status',
  'vimux-health',
  'work',
];
const EXPECTED_TOOLS = ['openspec_focus', 'subject', 'work_focus'];

test('external-only deck composition suppresses the native prompt surface', () => {
  assert.equal(COCKPIT_SURFACES.vim, 'external-editor-only');
  assert.deepEqual(COCKPIT_COMPOSITION, [
    'fancy-footer:telemetry',
    'galactica-status:provider',
    'galactica-context-header:editor-deck',
    'pi-vim:external-editor-only',
  ]);
});

test('one package activates the root cockpit composition entrypoint', async () => {
  const result = await inspectLocalPackage();

  assert.equal(result.packageName, 'pi-vimux-starship');
  assert.deepEqual(result.entrypoints, [...EXPECTED_EXTENSION_ENTRYPOINTS]);
  assert.equal(result.registrations.length, EXPECTED_EXTENSION_ENTRYPOINTS.length);
  assert.deepEqual(
    result.registrations.map(({ entrypoint }) => entrypoint),
    [...EXPECTED_EXTENSION_ENTRYPOINTS],
  );
});

test('composed factories register unique commands and tools', async () => {
  const result = await inspectLocalPackage();

  assert.deepEqual(result.commands, EXPECTED_COMMANDS);
  assert.deepEqual(result.tools, EXPECTED_TOOLS);
  for (const registration of result.registrations) {
    assert.ok(
      registration.lifecycleEvents.length + registration.eventChannels.length > 0,
      registration.entrypoint,
    );
  }
});

test('Fancy Footer publishes readiness during root package composition', async () => {
  const result = await inspectLocalPackage();
  const composition = result.registrations[0];

  assert.equal(composition?.entrypoint, EXPECTED_EXTENSION_ENTRYPOINTS[0]);
  assert.ok(composition?.emittedChannels.includes('pi-fancy-footer:ready'));
});
