import assert from 'node:assert/strict';
import test from 'node:test';

import { visibleWidth } from '@earendil-works/pi-tui';

import {
  activityAgeCandidates,
  buildRuntimeFooterWidgets,
  formatActivityAge,
  formatRailChronometer,
  passiveActivityStatus,
  RUNTIME_SCOPE_SEPARATOR_WIDGET_ID,
  RUNTIME_STATUS_WIDGET_ID,
} from '../src/activity-age.ts';

test('formats a human-readable six-cell age through minutes', () => {
  assert.equal(formatActivityAge(0, 6), '   0ms');
  assert.equal(formatActivityAge(99, 6), '  99ms');
  assert.equal(formatActivityAge(100, 6), '  0.1s');
  assert.equal(formatActivityAge(9_999, 6), '  9.9s');
  assert.equal(formatActivityAge(10_000, 6), ' 10.0s');
  assert.equal(formatActivityAge(59_999, 6), ' 59.9s');
  assert.equal(formatActivityAge(60_000, 6), ' 1m00s');
  assert.equal(formatActivityAge(754_000, 6), '12m34s');
});

test('adds a two-frame heartbeat when hour-scale precision becomes coarse', () => {
  assert.equal(formatActivityAge(3_600_000, 6), '1h00m·');
  assert.equal(formatActivityAge(3_600_500, 6), '1h00m•');
  assert.equal(formatActivityAge(45_000_000, 6), '12:30·');
  assert.equal(formatActivityAge(360_000_000, 6), '4d04h·');
  assert.equal(visibleWidth(formatActivityAge(360_000_500, 6)), 6);
});

test('keeps the prompt-rail chronometer fixed at eight cells', () => {
  assert.equal(formatRailChronometer(null), "00:00'00");
  assert.equal(formatRailChronometer(0), "00:00'00");
  assert.equal(formatRailChronometer(450), "00:00'45");
  assert.equal(formatRailChronometer(12_300), "00:12'30");
  assert.equal(formatRailChronometer(754_560), "12:34'56");
  assert.equal(formatRailChronometer(6_000_000), "01h40'00");
  assert.equal(formatRailChronometer(360_000_000), "04d04'00");
  for (const value of [null, 0, 450, 12_300, 754_560, 6_000_000, 360_000_000]) {
    assert.equal(visibleWidth(formatRailChronometer(value)), 8);
  }
});

test('keeps four- and three-cell responsive fallbacks', () => {
  assert.equal(formatActivityAge(0, 4), ' 0ms');
  assert.equal(formatActivityAge(9_999, 4), '9.9s');
  assert.equal(formatActivityAge(10_000, 4), ' 10s');
  assert.equal(formatActivityAge(100_000, 4), '  1m');
  assert.equal(formatActivityAge(6_000_000, 4), '  1h');
  assert.equal(formatActivityAge(360_000_000, 4), '  4d');
  assert.equal(formatActivityAge(0, 3), ' 0s');
  assert.equal(formatActivityAge(9_000, 3), ' 9s');
  assert.equal(formatActivityAge(99_000, 3), '99s');
  assert.equal(formatActivityAge(100_000, 3), ' 1m');
});

test('keeps visible semantic passive states in every responsive size', () => {
  assert.equal(passiveActivityStatus('waiting', 6), '  wait');
  assert.equal(passiveActivityStatus('listening', 6), '  idle');
  assert.equal(passiveActivityStatus('blocked', 6), '  hold');
  assert.equal(passiveActivityStatus('aborted', 6), '  stop');
  assert.equal(passiveActivityStatus('waiting', 4), 'wait');
  assert.equal(passiveActivityStatus('listening', 4), 'idle');
  assert.equal(passiveActivityStatus('blocked', 4), 'hold');
  assert.equal(passiveActivityStatus('aborted', 4), 'stop');
  assert.equal(passiveActivityStatus('waiting', 3), '  …');
  assert.deepEqual(activityAgeCandidates(null, 'waiting'), [
    { size: 6, age: '  wait' },
    { size: 4, age: 'wait' },
    { size: 3, age: '  …' },
  ]);
  assert.deepEqual(activityAgeCandidates(420), [
    { size: 6, age: '  0.4s' },
    { size: 4, age: '0.4s' },
    { size: 3, age: ' 0s' },
  ]);
});

test('publishes the fixed-width runtime state for prompt-rail consumers', () => {
  const widgets = buildRuntimeFooterWidgets("00:00'25");
  assert.deepEqual(
    widgets.map(({ widget }) => widget.id),
    [RUNTIME_STATUS_WIDGET_ID, RUNTIME_SCOPE_SEPARATOR_WIDGET_ID],
  );
  assert.deepEqual(
    widgets.map(({ widget }) => widget.layout),
    [
      { row: 1, position: 4, align: 'left', fill: 'none', minWidth: 8 },
      { row: 1, position: 3, align: 'left', fill: 'none' },
    ],
  );
  assert.equal(widgets[0].widget.content.text, "00:00'25");
  assert.equal(widgets[0].widget.style.textColor, 'dim');
  assert.equal(
    buildRuntimeFooterWidgets("00:00'25", true)[0].widget.style.textColor,
    'accent',
  );
  assert.equal(widgets[1].widget.content.text, '⟩');
  assert.equal(widgets[1].widget.style.textColor, 'thinkingHigh');
});
