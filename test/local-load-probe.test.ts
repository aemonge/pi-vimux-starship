import assert from 'node:assert/strict';
import test from 'node:test';
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
  'work',
];
const EXPECTED_TOOLS = ['openspec_focus', 'work_focus'];

test('one package composes each imported extension exactly once in startup order', async () => {
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

test('Fancy Footer publishes readiness during package composition', async () => {
  const result = await inspectLocalPackage();
  const footer = result.registrations[0];

  assert.equal(footer?.entrypoint, EXPECTED_EXTENSION_ENTRYPOINTS[0]);
  assert.ok(footer?.emittedChannels.includes('pi-fancy-footer:ready'));
});
