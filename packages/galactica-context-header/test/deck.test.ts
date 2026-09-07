import assert from 'node:assert/strict';
import test from 'node:test';
import { visibleWidth } from '@earendil-works/pi-tui';

import {
  formatDeckElapsed,
  renderHeaderDeck,
  type HeaderDeckState,
} from '../src/deck.ts';

const plainTheme = {
  fg: (_color: string, text: string) => text,
  bold: (text: string) => text,
};

function plain(text: string): string {
  return text.replace(/\u001b\[[0-?]*[ -/]*[@-~]/gu, '');
}

function fixture(): HeaderDeckState {
  return {
    elapsedMs: 7_000,
    header: {
      activity: null,
      work: {
        lifecycle: 'waiting',
        titles: [
          'Read-only preflight for the interrupted one-line Review ledger fix',
          'before further OpenSpec validation and implementation',
        ],
        color: 'accent',
      },
      diagnostics: null,
      backgroundActivity: false,
      approvalRequired: false,
      blocked: false,
      counters: {
        agents: { active: 0, total: 0 },
        tasks: { completed: 0, total: 1 },
        steps: { completed: 6, total: 16 },
        files: { completed: 37, total: 53 },
      },
      progress: [],
    },
    cwd: '~/galactica',
    devbox: true,
    branch: 'feature/review-ledger/preserve-openspec-validation',
    gitAvailable: true,
    git: { staged: 2, modified: 3, untracked: 1, conflicts: 0 },
    model: 'GPT-5.6 Sol',
    thinking: 'high',
    contextPercent: 38,
    contextTokens: 32 * 1024,
    contextWindow: 128 * 1024,
    compactionCount: 2,
    resources: {
      cpuPercent: 48.2,
      memoryBytes: 268 * 1024 * 1024,
      cpuWarning: false,
      memoryWarning: false,
    },
    footerTelemetry: { totalCost: 5.16, quotaPercent: 63 },
    lsp: { healthy: 2, total: 2 },
    mcp: { healthy: 3, total: 3 },
    mode: 'normal',
  };
}

test('formats fixed-width minute activity age with visible hundredths', () => {
  assert.equal(formatDeckElapsed(null), "00:00'00");
  assert.equal(formatDeckElapsed(54), "00:00'05");
  assert.equal(formatDeckElapsed(999), "00:00'99");
  assert.equal(formatDeckElapsed(1_000), "00:01'00");
  assert.equal(formatDeckElapsed(62_345), "01:02'34");
  assert.equal(formatDeckElapsed(3_600_000), "60:00'00");
  assert.equal(formatDeckElapsed(Number.POSITIVE_INFINITY), "99:59'99");
  assert.equal(formatDeckElapsed(Number.NaN), "00:00'00");
  assert.equal(formatDeckElapsed(Number.NEGATIVE_INFINITY), "00:00'00");
});

test('renders the approved rich wide header without side borders or spacer rows', () => {
  const lines = renderHeaderDeck(fixture(), 160, plainTheme as never);

  assert.equal(lines.length, 8);
  assert.match(lines[0] ?? '', /^─ 󰠭 › ─+$/u);
  assert.match(
    lines[1] ?? '',
    /^waiting \(00:07'00\) ⟩ next direction › Read-only preflight for the interrupted one-line Review ledger fix\s+ task 0\/1 ›  stps 6\/16$/u,
  );
  assert.equal(lines[2], 'before further OpenSpec validation and implementation');
  assert.equal(plain(lines[3] ?? ''), '┈'.repeat(160));
  assert.equal(plain(lines[5] ?? ''), '┈'.repeat(160));
  assert.match(lines[3] ?? '', /^\u001b\[2m/u);
  assert.match(lines[4] ?? '', /^\[󰆧\]  ~\/galactica\s+/u);
  assert.match(
    lines[4] ?? '',
    / feature\/review-ledger\/preserve-openspec-validation ⟩  2 ›  3 ›  1$/u,
  );
  assert.match(lines[6] ?? '', /^󰚩 GPT-5\.6 Sol › high ⟩ 󰾆 38% › 󰎞 2\s+/u);
  assert.match(
    lines[6] ?? '',
    / 63% › 󰜦 \$5\.16 ⟩  0\/0 › 󰈙 37\/53 ⟩  48\.2% ›  268M ›  3\/3$/u,
  );
  assert.equal(lines.join('\n').includes('32K/128K'), false);
  assert.match(lines[7] ?? '', /^─+ ‹ 󰠭 ─$/u);
  assert.ok(lines.every((line) => line.length > 0));
  assert.ok(lines.every((line) => !line.startsWith('│') && !line.endsWith('│')));
  assert.equal(lines.join('').split('󰠭').length - 1, 2);
  assert.equal(lines.join('').includes('󰒋 LSP'), false);
});

test('keeps activity and focus distinct on the title row', () => {
  const state = fixture();
  state.header!.work = {
    lifecycle: 'assuring',
    titles: ['Plan title', 'Current task'],
    color: 'accent',
    activityPath: [{ id: 'verification', label: 'Running checks', compact: 'verify' }],
  };

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  assert.match(lines[1] ?? '', /^assuring \(00:07'00\) › verify ⟩ Plan title\s+/u);
  assert.equal(lines[2], 'Current task');
  assert.equal(lines.join('\n').split('Running checks').length - 1, 0);
});

test('moves Plan to the status row and wraps only the current Task', () => {
  const state = fixture();
  const expected =
    'Deliver one deliberately long current Task description that needs a second responsive line without repeating its parent Plan title';
  state.header!.work!.titles = ['Parent Plan title', expected];

  const wide = renderHeaderDeck(state, 160, plainTheme as never);
  assert.match(wide[1] ?? '', /next direction › Parent Plan title\s+/u);
  assert.equal(wide[2], expected);

  const narrow = renderHeaderDeck(state, 79, plainTheme as never);
  assert.match(narrow[0] ?? '', /󰠭/u);
  assert.match(narrow[1] ?? '', /^waiting \(00:07'00\).+ task 0\/1 ›  stps 6\/16$/u);
  const dividerIndex = narrow.findIndex((line) => plain(line) === '┈'.repeat(79));
  const narrative = narrow.slice(dividerIndex - 2, dividerIndex);
  assert.equal(narrative.length, 2);
  assert.equal(narrative.join(' '), expected);
  assert.equal(narrative.join(' ').includes('Parent Plan title'), false);
});

test('keeps a single work title on the one-line status row only', () => {
  const state = fixture();
  state.header!.work!.titles = ['One focused work title'];

  const wide = renderHeaderDeck(state, 160, plainTheme as never);
  assert.match(wide[1] ?? '', /next direction › One focused work title.* task/u);
  assert.equal(wide.join('\n').split('One focused work title').length - 1, 1);

  const narrow = renderHeaderDeck(state, 79, plainTheme as never);
  assert.match(plain(narrow[1] ?? ''), /next direction › One focused wor.* task/u);
});

test('bolds only current control and status anchors', () => {
  const bolded: string[] = [];
  const theme = {
    fg: (_semanticColor: string, text: string) => text,
    bold: (text: string) => {
      bolded.push(text);
      return text;
    },
  };

  renderHeaderDeck(fixture(), 160, theme as never);

  assert.ok(bolded.includes('waiting'));
  assert.ok(bolded.includes(' task 0/1'));
  assert.ok(bolded.includes(' stps 6/16'));
  assert.ok(bolded.includes('before further OpenSpec validation and implementation'));
  assert.ok(bolded.includes('[󰆧]'));
  assert.ok(bolded.includes('⟩'));
  for (const regular of [
    "(00:07'00)",
    'next direction',
    'Read-only preflight for the interrupted one-line Review ledger fix',
    ' ~/galactica',
    ' feature/review-ledger/preserve-openspec-validation',
    'GPT-5.6 Sol',
  ]) {
    assert.equal(bolded.includes(regular), false, regular);
  }
});

test('keeps only lifecycle contextual and colors progress by completion', () => {
  const state = fixture();
  state.header!.work!.color = 'warning';
  const colors: string[] = [];
  const theme = {
    fg: (semanticColor: string, text: string) => {
      colors.push(`${semanticColor}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => text,
  };

  renderHeaderDeck(state, 160, theme as never);

  assert.ok(colors.includes('warning:waiting'));
  assert.ok(colors.includes('text:next direction'));
  assert.ok(
    colors.includes(
      'text:Read-only preflight for the interrupted one-line Review ledger fix',
    ),
  );
  assert.ok(
    colors.includes('text:before further OpenSpec validation and implementation'),
  );
  assert.ok(colors.includes('accent: task 0/1'));
  assert.ok(colors.includes('accent: stps 6/16'));

  state.header!.counters.tasks = { completed: 1, total: 1 };
  state.header!.counters.steps = { completed: 16, total: 16 };
  colors.length = 0;
  renderHeaderDeck(state, 160, theme as never);
  assert.ok(colors.includes('success: task 1/1'));
  assert.ok(colors.includes('success: stps 16/16'));
});

test('uses prompt-line color for rules and major separators with violet ladybugs', () => {
  const colors: string[] = [];
  const theme = {
    fg: (semanticColor: string, text: string) => {
      colors.push(`${semanticColor}:${text}`);
      return text;
    },
    bold: (text: string) => text,
  };

  renderHeaderDeck(fixture(), 160, theme as never);

  assert.ok(colors.some((entry) => entry.startsWith('thinkingHigh:─')));
  assert.ok(colors.includes('thinkingHigh:⟩'));
  assert.equal(colors.filter((entry) => entry.startsWith('text:┈')).length, 1);
  assert.equal(colors.filter((entry) => entry === 'customMessageLabel:󰠭').length, 2);
  assert.equal(
    colors.some((entry) => entry.startsWith('thinkingMax:')),
    false,
  );
});

test('keeps compact telemetry islands together with one gap cell', () => {
  const left = '󰚩 GPT-5.6 Sol › high ⟩ 󰾆 38% › 󰎞 2';
  const right = ' 63% › 󰜦 $5.16 ⟩  0/0 › 󰈙 37/53 ⟩  48.2% ›  268M ›  3/3';
  const width = visibleWidth(left) + visibleWidth(right) + 1;

  const lines = renderHeaderDeck(fixture(), width, plainTheme as never);
  assert.ok(lines.includes(`${left} ${right}`));
});

test('preserves ANSI-safe width with a coloring theme', () => {
  const ansiTheme = {
    fg: (_semanticColor: string, text: string) => `\u001b[35m${text}\u001b[0m`,
    bold: (text: string) => `\u001b[1m${text}\u001b[22m`,
  };

  for (const width of [160, 100, 79, 59, 39, 20]) {
    const lines = renderHeaderDeck(fixture(), width, ansiTheme as never);
    assert.ok(
      lines.every((line) => visibleWidth(line) <= width),
      String(width),
    );
  }
});

test('preserves width and essential deck structure through responsive collapse', () => {
  for (const width of [160, 100, 79, 59, 39, 20]) {
    const lines = renderHeaderDeck(fixture(), width, plainTheme as never);
    assert.ok(lines.length >= 4, String(width));
    assert.ok(
      lines.every((line) => visibleWidth(line) <= width),
      String(width),
    );
    assert.match(lines[0] ?? '', /󰠭/u, String(width));
    assert.match(lines.at(-1) ?? '', /󰠭/u, String(width));
    assert.equal(lines.join('').split('󰠭').length - 1, 2, String(width));
    if (width >= 79) {
      assert.match(lines.join('\n'), /00:07'00/u, String(width));
      assert.match(lines.join('\n'), /󰾆 38%/u, String(width));
    }
  }
});

test('renders unavailable optional telemetry honestly', () => {
  const state = fixture();
  state.header = null;
  state.elapsedMs = null;
  state.footerTelemetry = undefined;
  state.contextPercent = undefined;
  state.contextTokens = undefined;
  state.contextWindow = undefined;
  state.resources = undefined;
  state.lsp = null;
  state.mcp = null;
  state.branch = '';
  state.gitAvailable = false;

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  assert.match(lines[1] ?? '', /waiting \(00:00'00\) ⟩ next direction/u);
  assert.match(lines.find((line) => line.includes('')) ?? '', / \(no Git\) ⟩ —/u);
  assert.doesNotMatch(lines.join('\n'), /clean/u);
  assert.match(lines.find((line) => line.includes('')) ?? '', / task — ›  stps —/u);
  assert.match(
    lines.find((line) => line.includes('')) ?? '',
    / 0\/0 › 󰈙 — ⟩  — ›  — ›  —/u,
  );
  assert.match(lines.find((line) => line.includes('')) ?? '', /󰾆 —.* — › 󰜦 —/u);
});
