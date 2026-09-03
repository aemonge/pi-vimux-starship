import assert from 'node:assert/strict';
import test from 'node:test';
import { visibleWidth } from '@earendil-works/pi-tui';

import {
  collectSessionCost,
  formatCompactCost,
  PromptRailStore,
  renderPromptRails,
} from '../prompt-rail.ts';

const colorize = (_color: string, text: string) => text;
const ANSI_ESCAPE = new RegExp('\\u001b\\[[0-?]*[ -/]*[@-~]', 'gu');
const plain = (text: string) => text.replace(ANSI_ESCAPE, '');

function upsert(
  id: string,
  text: string,
  icon = '',
  color = 'accent',
): Record<string, unknown> {
  return {
    protocol: 1,
    type: 'upsert',
    widget: {
      id,
      content: { type: 'text', text },
      icon: icon ? { glyphs: { nerd: icon }, color } : false,
      style: { textColor: color },
    },
  };
}

test('collects bounded rail widgets and removes stale snapshots', () => {
  const store = new PromptRailStore();
  assert.equal(store.apply(upsert('galactica.runtime-state', "00:00'00")), true);
  assert.equal(
    store.apply(upsert('galactica.openspec-progress', '9/19 ›  48/64', '')),
    true,
  );
  assert.equal(store.snapshot().widgets.size, 2);
  assert.equal(
    store.apply({
      protocol: 1,
      type: 'remove',
      id: 'galactica.openspec-progress',
    }),
    true,
  );
  assert.equal(store.snapshot().widgets.has('galactica.openspec-progress'), false);
  assert.equal(store.apply(upsert('unrelated.widget', 'ignored')), false);
  assert.equal(
    store.apply({
      protocol: 1,
      type: 'upsert',
      widget: {
        id: 'galactica.runtime-state',
        content: { type: 'text', text: { unsafe: true } },
      },
    }),
    false,
  );
});

test('totals assistant usage and formats compact session cost', () => {
  assert.equal(
    collectSessionCost([
      { type: 'message', message: { role: 'user' } },
      {
        type: 'message',
        message: { role: 'assistant', usage: { cost: { total: 1.7 } } },
      },
      {
        type: 'message',
        message: { role: 'assistant', usage: { cost: { total: 0.034 } } },
      },
    ]),
    1.734,
  );
  assert.equal(formatCompactCost(1.734), '$1.73');
  assert.equal(formatCompactCost(0.0012), '$0.0012');
});

test('colors the cost boundary like every other major separator', () => {
  const store = new PromptRailStore();
  store.apply(upsert('galactica.context-usage', '50%', '󰾆'));
  store.apply(upsert('galactica.runtime-state', "00:00'00", '', 'dim'));
  store.setTotalCost(3);
  const colors: string[] = [];

  renderPromptRails({
    lines: ['─'.repeat(80), '─'.repeat(80)],
    width: 80,
    snapshot: store.snapshot(),
    mode: { plain: '󰏫', styled: '󰏫' },
    colorize: (color, text) => {
      colors.push(`${color}:${text}`);
      return text;
    },
  });

  assert.ok(colors.includes('thinkingHigh:⟩'));
  assert.ok(colors.includes('accent:$3'));
  assert.equal(colors.includes('accent:⟩ $3'), false);
});

test('renders mode above a chronometer and right-side context resources', () => {
  const store = new PromptRailStore();
  for (const message of [
    upsert('galactica.project-capabilities', '3/3', ''),
    upsert('galactica.openspec-progress', '9/19 ›  48/64', ''),
    upsert('galactica.session-memory', '252M', '▤'),
    upsert('galactica.session-cpu', '1%', '› '),
    upsert('galactica.context-usage', '51.1%', '󰾆'),
    upsert('galactica.compaction-count', '2', '› 󰎞'),
    upsert('galactica.runtime-state', "00:00'00"),
  ]) {
    store.apply(message);
  }
  store.setTotalCost(1.73);

  const lines = renderPromptRails({
    lines: ['─'.repeat(100), '│ prompt', '─'.repeat(100)],
    width: 100,
    snapshot: store.snapshot(),
    mode: { plain: '󰏫', styled: '󰏫' },
    colorize,
  });

  assert.equal(visibleWidth(lines[0] ?? ''), 100);
  assert.equal(visibleWidth(lines[2] ?? ''), 100);
  assert.match(plain(lines[0] ?? ''), /^─ 󰏫 /u);
  assert.match(plain(lines[0] ?? ''), /  3\/3 ⟩  9\/19 ›  48\/64 ──$/u);
  assert.match(plain(lines[2] ?? ''), /^─ 00:00'00 /u);
  assert.match(plain(lines[2] ?? ''), / 󰾆 51\.1% › 󰎞 2 ⟩ ▤ 252M ›  1% ⟩ \$1\.73 ──$/u);
});

test('right-aligns bottom telemetry before the closing rail', () => {
  const store = new PromptRailStore();
  for (const message of [
    upsert('galactica.session-memory', '323M', '▤'),
    upsert('galactica.session-cpu', '1%', '› '),
    upsert('galactica.context-usage', '93.9%', '󰾆'),
    upsert('galactica.runtime-state', "00:00'00"),
  ]) {
    store.apply(message);
  }
  store.setTotalCost(18.63);

  const lines = renderPromptRails({
    lines: ['─'.repeat(100), '─'.repeat(100)],
    width: 100,
    snapshot: store.snapshot(),
    mode: { plain: '󰏫', styled: '󰏫' },
    colorize,
  });
  const bottom = plain(lines[1] ?? '');

  assert.equal(bottom.indexOf('󰾆'), 65);
  assert.match(bottom, /\$18\.63 ──$/u);
});

test('keeps mode, chronometer, and context while dropping narrow resources', () => {
  const store = new PromptRailStore();
  for (const message of [
    upsert('galactica.session-memory', '252M', '▤'),
    upsert('galactica.session-cpu', '1%', '› '),
    upsert('galactica.context-usage', '51.1%', '󰾆'),
    upsert('galactica.runtime-state', "00:00'00"),
  ]) {
    store.apply(message);
  }

  const lines = renderPromptRails({
    lines: ['─'.repeat(28), '─'.repeat(28)],
    width: 28,
    snapshot: store.snapshot(),
    mode: { plain: '󰆾', styled: '󰆾' },
    colorize,
  });

  assert.equal(visibleWidth(lines[0] ?? ''), 28);
  assert.equal(visibleWidth(lines[1] ?? ''), 28);
  assert.match(plain(lines[0] ?? ''), /^─ 󰆾 /u);
  assert.doesNotMatch(plain(lines[1] ?? ''), /252M|/u);
  assert.match(plain(lines[1] ?? ''), /^─ 00:00'00 /u);
  assert.match(plain(lines[1] ?? ''), / 󰾆 51\.1% ──$/u);

  const tiny = renderPromptRails({
    lines: ['─'.repeat(8), '─'.repeat(8)],
    width: 8,
    snapshot: store.snapshot(),
    mode: { plain: '󰆾', styled: '󰆾' },
    colorize,
  });
  assert.match(plain(tiny[0] ?? ''), /^─ 󰆾 /u);
  assert.doesNotMatch(plain(tiny[1] ?? ''), /󰆾/u);
});
