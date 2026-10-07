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
const EXPECTED_TOOLS = ['openspec_focus', 'stage', 'subject', 'work_focus'];

test('chrome-only deck composition activates header footer and status', () => {
  assert.equal(COCKPIT_SURFACES.contextHeader, 'deck');
  assert.deepEqual(COCKPIT_COMPOSITION, [
    'fancy-footer:telemetry',
    'galactica-status:provider',
    'galactica-context-header:deck',
    'cockpit-telemetry:sink',
  ]);
});

test('one package activates the root cockpit composition entrypoint', async () => {
  const result = await inspectLocalPackage();

  assert.equal(result.packageName, '@aemonge-dev/pi-vimux-starship');
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
