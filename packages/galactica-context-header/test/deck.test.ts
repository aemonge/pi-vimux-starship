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
      selection: {
        source: 'openspec',
        titles: [
          'Read-only preflight for the interrupted one-line Review ledger fix',
          'before further OpenSpec validation and implementation',
        ],
        color: 'accent',
      },
      suggestion: 'human-validation',
      diagnostics: null,
      backgroundActivity: false,
      approvalRequired: true,
      blocked: false,
      counters: {
        agents: { active: 0, total: 0 },
        activeRuns: { children: 2, subagents: 1 },
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
  assert.equal(
    lines[0],
    `󰠭 ⟩ Read-only preflight for the interrupted one-line Review ledger fix › before further OpenSpec validation and implementation`,
  );
  assert.match(lines[1] ?? '', /^─+$/u);
  assert.match(
    lines[2] ?? '',
    /^\( 2 ›  1 · 00:07'00\) waiting ⟩ idle 󰁕 Human validation\s+ task 0\/1 ›  stps 6\/16$/u,
  );
  assert.doesNotMatch(lines[2] ?? '', /Human validation ⟩  task/u);
  assert.equal(plain(lines[3] ?? ''), '┈'.repeat(160));
  assert.equal(plain(lines[5] ?? ''), '┈'.repeat(160));
  assert.match(lines[3] ?? '', /^\u001b\[2m/u);
  assert.match(lines[4] ?? '', /^\[󰆧\]  ~\/galactica\s+/u);
  assert.match(
    lines[4] ?? '',
    / feature\/review-ledger\/preserve-openspec-validation ⟩  2 ›  3 ›  1$/u,
  );
  assert.match(lines[6] ?? '', /^󰚩 GPT-5\.6 Sol › high ⟩ 󰾆 38% › 󰎞 2\s+/u);
  assert.match(lines[6] ?? '', / 63% › 󰜦 \$5\.16 ⟩  48\.2% ›  268M ›  3\/3$/u);
  assert.equal(lines.join('\n').includes('32K/128K'), false);
  assert.match(lines[7] ?? '', /^─ /u);
  assert.match(lines[7] ?? '', /‹ 󰠭 ─$/u);
  assert.ok(lines.every((line) => line.length > 0));
  assert.ok(lines.every((line) => !line.startsWith('│') && !line.endsWith('│')));
  assert.equal(lines.join('').split('󰠭').length - 1, 2);
  assert.equal(lines.join('').includes('󰒋 LSP'), false);
});

test('turns the top ladybug into distinct error and warning counts', () => {
  const state = fixture();
  state.piStatus = { errors: 2, warnings: 3, nativeStatusCount: 0 };

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const alert = lines.find((line) => plain(line).startsWith('─ 󰅙')) ?? '';
  assert.match(plain(alert), /^─ 󰅙 2 ›  3 ⟩ \/pi-status ─+$/u);
  assert.equal(alert.split('⟩').length - 1, 1);
  assert.doesNotMatch(alert, /󰠭/u);
  assert.ok(alert.includes('\u001b[7m'));

  const colors: string[] = [];
  renderHeaderDeck(state, 160, {
    fg: (name: string, text: string) => {
      colors.push(`${name}:${text}`);
      return text;
    },
    bold: (text: string) => text,
  } as never);
  assert.ok(colors.includes('error:󰅙 2'));
  assert.ok(colors.includes('warning: 3'));
  assert.ok(colors.includes('dim:/pi-status'));
});

test('keeps the native-status count on the footer attribution only', () => {
  const state = fixture();
  state.piStatus = { errors: 0, warnings: 0, nativeStatusCount: 3 };

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  assert.match(lines[1] ?? '', /^─+$/u);
  assert.equal(lines.join('').includes('·3'), false);
  assert.doesNotMatch(lines.at(-1) ?? '', /👣/u);
  assert.match(lines.at(-1) ?? '', /3 ‹ 󰠭 ─$/u);

  const ansiTheme = {
    fg: (_semanticColor: string, text: string) => `\u001b[35m${text}\u001b[0m`,
    bold: (text: string) => `\u001b[1m${text}\u001b[22m`,
  };
  const wrapped = renderHeaderDeck(state, 59, ansiTheme as never);
  assert.ok(wrapped.every((line) => visibleWidth(line) <= 59));
  const wrappedTop = wrapped.find((line) => /^─+$/u.test(plain(line))) ?? '';
  assert.match(plain(wrappedTop), /^─+$/u);

  state.piStatus.nativeStatusCount = 0;
  const empty = renderHeaderDeck(state, 160, plainTheme as never);
  assert.doesNotMatch(empty[1] ?? '', /👣|·0/u);
  assert.match(empty.at(-1) ?? '', / ‹ 󰠭 ─$/u);

  state.piStatus.nativeStatusCount = 3;
  const narrow = renderHeaderDeck(state, 5, plainTheme as never);
  const narrowTop = narrow.find((line) => /^─+$/u.test(plain(line))) ?? '';
  assert.doesNotMatch(narrowTop, /👣/u);
  assert.ok(visibleWidth(narrowTop) <= 5);
});

test('hides the bottom rail while inserting', () => {
  const state = fixture();
  state.mode = 'insert';

  const hidden = renderHeaderDeck(state, 160, plainTheme as never);
  assert.equal(hidden.length, 7);
  assert.doesNotMatch(hidden.join('\n'), /‹ 󰠭/u);

  const suppliedHidden = renderHeaderDeck(state, 160, plainTheme as never, {
    plain: '󰏫',
    styled: '󰏫',
  });
  assert.equal(suppliedHidden.length, 7);
  assert.doesNotMatch(suppliedHidden.join('\n'), /‹ 󰠭/u);

  state.mode = 'normal';
  const visible = renderHeaderDeck(state, 160, plainTheme as never);
  assert.equal(visible.length, 8);
  assert.match(visible.at(-1) ?? '', /‹ 󰠭 ─$/u);
});

test('places a supplied live styled mode icon on the bottom separator', () => {
  const renderWithModeRail = renderHeaderDeck as unknown as (
    state: HeaderDeckState,
    width: number,
    theme: typeof plainTheme,
    modeRail: { plain: string; styled: string },
  ) => string[];
  const modeRail = { plain: 'VIS', styled: '\u001b[35mVIS\u001b[0m' };

  const lines = renderWithModeRail(fixture(), 80, plainTheme, modeRail);
  const bottom = lines.at(-1) ?? '';

  assert.match(plain(bottom), /^─ VIS ─+ ‹ 󰠭 ─$/u);
  assert.equal(bottom.includes(modeRail.styled), true);
});

test('drops the status command before severity counts at narrow widths', () => {
  const state = fixture();
  state.piStatus = { errors: 2, warnings: 3, nativeStatusCount: 0 };

  const compact =
    renderHeaderDeck(state, 20, plainTheme as never).find((line) =>
      plain(line).startsWith('─ 󰅙'),
    ) ?? '';
  assert.match(plain(compact), /^─ 󰅙 2 ›  3 /u);
  assert.doesNotMatch(compact, /pi-status/u);

  const narrow =
    renderHeaderDeck(state, 9, plainTheme as never).find((line) =>
      plain(line).startsWith('─ 󰅙'),
    ) ?? '';
  assert.match(plain(narrow), /^─ 󰅙 5/u);
  assert.ok(visibleWidth(narrow) <= 9);
});

test('keeps activity and focus distinct on the title row', () => {
  const state = fixture();
  state.header!.work = {
    lifecycle: 'assuring',
    titles: ['Plan title', 'Current task'],
    color: 'accent',
    activityPath: [{ id: 'verification', label: 'Running checks', compact: 'verify' }],
  };
  state.header!.selection = {
    source: 'openspec',
    titles: ['Plan title', 'Current task'],
    color: 'accent',
  };
  state.header!.suggestion = 'validate-result';

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  assert.match(
    lines[2] ?? '',
    /^\( 2 ›  1 · 00:07'00\) assuring ⟩ verify 󰁕 validate result\s+ task/u,
  );
  assert.equal(lines[0], `󰠭 ⟩ Plan title › Current task`);
  assert.equal(lines.join('\n').split('Running checks').length - 1, 0);
});

test('gives the complete selected scope a bounded full-width focus canvas', () => {
  const state = fixture();
  const expected =
    'Deliver one deliberately long current Task description that needs a second responsive line without repeating its parent Plan title';
  state.header!.work!.titles = ['Parent Plan title', expected];
  state.header!.selection = {
    source: 'openspec',
    titles: ['Parent Plan title', expected],
    color: 'accent',
  };

  const wide = renderHeaderDeck(state, 160, plainTheme as never);
  assert.doesNotMatch(wide[2] ?? '', /Parent Plan title/u);
  assert.equal(wide[0], `󰠭 ⟩ Parent Plan title › ${expected}`);

  const narrow = renderHeaderDeck(state, 79, plainTheme as never);
  assert.match(narrow[0] ?? '', /󰠭/u);
  const status = narrow.find((line) => plain(line).startsWith('(')) ?? '';
  assert.match(status, /^\( 2 ›  1 · 00:07'00\) waiting ⟩ idle/u);
  const focus = narrow.slice(0, 2);
  assert.equal(focus.length, 2);
  assert.equal(
    focus.join(' ').replace(/󰠭 ⟩ |    /gu, ''),
    `Parent Plan title › ${expected}`,
  );
});

test('keeps a single selected title on the focus row only', () => {
  const state = fixture();
  state.header!.work!.titles = ['One focused work title'];
  state.header!.selection = {
    source: 'session-work',
    titles: ['One focused work title'],
    color: 'accent',
  };

  const wide = renderHeaderDeck(state, 160, plainTheme as never);
  assert.doesNotMatch(wide[2] ?? '', /One focused work title/u);
  assert.equal(wide[0], `󰠭 ⟩ One focused work title`);
  assert.equal(wide.join('\n').split('One focused work title').length - 1, 1);

  const narrow = renderHeaderDeck(state, 79, plainTheme as never);
  assert.equal(plain(narrow[0] ?? ''), `󰠭 ⟩ One focused work title`);
});

test('renders the subject selection on the focus row instead of an em dash', () => {
  const state = fixture();
  state.header!.work = null;
  state.header!.selection = {
    source: 'subject',
    titles: ['Session subject'],
    color: 'accent',
  };

  const wide = renderHeaderDeck(state, 160, plainTheme as never);
  assert.equal(wide[0], `󰠭 ⟩ Session subject`);
  assert.doesNotMatch(wide.join('\n'), /󰠭 ⟩ —/u);

  const narrow = renderHeaderDeck(state, 79, plainTheme as never);
  assert.notEqual(plain(narrow[0] ?? ''), `󰠭 ⟩ —`);
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
  assert.ok(bolded.includes('[󰆧]'));
  assert.ok(bolded.includes('⟩'));
  for (const regular of [
    "( 2 ›  1 · 00:07'00)",
    'idle',
    'Human validation',
    'Read-only preflight for the interrupted one-line Review ledger fix',
    'before further OpenSpec validation and implementation',
    ' stps 6/16',
    ' ~/galactica',
    ' feature/review-ledger/preserve-openspec-validation',
    'GPT-5.6 Sol',
  ]) {
    assert.equal(bolded.includes(regular), false, regular);
  }
});

test('uses a bold blue lifecycle with neutral activity and green direction', () => {
  const state = fixture();
  state.header!.work = {
    lifecycle: 'assuring',
    titles: ['Plan title', 'Current task'],
    color: 'accent',
    activityPath: [{ id: 'verification', label: 'Running checks', compact: 'verify' }],
  };
  state.header!.selection = {
    source: 'openspec',
    titles: ['Plan title', 'Current task'],
    color: 'accent',
  };
  state.header!.suggestion = 'validate-result';
  state.header!.approvalRequired = false;
  const colors: string[] = [];
  const theme = {
    fg: (semanticColor: string, text: string) => {
      colors.push(`${semanticColor}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => text,
  };

  renderHeaderDeck(state, 160, theme as never);

  assert.ok(colors.includes('accent:assuring'));
  assert.ok(colors.includes('text:verify'));
  assert.ok(colors.includes('success:󰁕 validate result'));
  assert.ok(colors.includes('accent:Plan title › Current task'));
  assert.equal(colors.includes('accent:verify'), false);
  assert.equal(colors.includes('accent:󰁕 validate result'), false);
});

test('colors recovery activity and direction blue while only lifecycle stays bold', () => {
  const state = fixture();
  state.header!.work = {
    lifecycle: 'working',
    titles: ['Repair runtime state'],
    color: 'accent',
    activity: { kind: 'recovery' },
  };
  state.header!.selection = {
    source: 'session-work',
    titles: ['Repair runtime state'],
    color: 'accent',
  };
  state.header!.suggestion = 'complete-scope';
  state.header!.approvalRequired = false;
  const colors: string[] = [];
  const bolded: string[] = [];
  const theme = {
    fg: (semanticColor: string, text: string) => {
      colors.push(`${semanticColor}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => {
      bolded.push(text);
      return text;
    },
  };

  const lines = renderHeaderDeck(state, 160, theme as never);

  assert.match(lines[2] ?? '', /working ⟩ recovering 󰁕 complete scope\s+ task/u);
  assert.ok(colors.includes('accent:recovering'));
  assert.ok(colors.includes('accent:󰁕 complete scope'));
  assert.ok(bolded.includes('working'));
  assert.equal(bolded.includes('recovering'), false);
  assert.equal(bolded.includes('󰁕 complete scope'), false);
});

test('keeps lifecycle contextual and colors progress by completion', () => {
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
  assert.ok(colors.includes("accent:· 00:07'00"));
  assert.ok(colors.includes('dim:idle'));
  assert.ok(colors.includes('warning:󰁕 Human validation'));
  assert.ok(
    colors.includes(
      'accent:Read-only preflight for the interrupted one-line Review ledger fix › before further OpenSpec validation and implementation',
    ),
  );
  assert.ok(colors.includes('text: task 0/1'));
  assert.ok(colors.includes('dim:›'));
  assert.ok(colors.includes('text: stps 6/16'));

  state.header!.counters.tasks = { completed: 1, total: 1 };
  state.header!.counters.steps = { completed: 16, total: 16 };
  colors.length = 0;
  renderHeaderDeck(state, 160, theme as never);
  assert.ok(colors.includes('success: task 1/1'));
  assert.ok(colors.includes('success: stps 16/16'));

  state.header!.counters.tasks = undefined;
  state.header!.counters.steps = undefined;
  colors.length = 0;
  renderHeaderDeck(state, 160, theme as never);
  assert.ok(colors.includes('dim: task —'));
  assert.ok(colors.includes('dim:›'));
  assert.ok(colors.includes('dim: stps —'));

  state.header!.counters.tasks = { completed: 0, total: 1 };
  colors.length = 0;
  renderHeaderDeck(state, 160, theme as never);
  assert.ok(colors.includes('text: task 0/1'));
  assert.ok(colors.includes('dim:›'));
  assert.ok(colors.includes('dim: stps —'));

  state.header!.counters.tasks = undefined;
  state.header!.counters.steps = { completed: 10, total: 10 };
  colors.length = 0;
  renderHeaderDeck(state, 160, theme as never);
  assert.ok(colors.includes('dim: task —'));
  assert.ok(colors.includes('dim:›'));
  assert.ok(colors.includes('success: stps 10/10'));
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
  assert.ok(colors.includes('borderAccent:󰆾'));
  assert.equal(colors.filter((entry) => entry.startsWith('text:┈')).length, 1);
  assert.equal(colors.filter((entry) => entry === 'customMessageLabel:󰠭').length, 2);
  assert.equal(
    colors.some((entry) => entry.startsWith('thinkingMax:')),
    false,
  );
});

test('keeps compact telemetry islands together with one gap cell', () => {
  const left = '󰚩 GPT-5.6 Sol › high ⟩ 󰾆 38% › 󰎞 2';
  const right = ' 63% › 󰜦 $5.16 ⟩  48.2% ›  268M ›  3/3';
  const width = visibleWidth(left) + visibleWidth(right) + 1;

  const lines = renderHeaderDeck(fixture(), width, plainTheme as never);
  assert.ok(lines.includes(`${left} ${right}`));
});

test('keeps child-run and subagent counters visible and changes only their color', () => {
  const state = fixture();
  const colors: string[] = [];
  const theme = {
    fg: (semanticColor: string, text: string) => {
      colors.push(`${semanticColor}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => text,
  };

  state.header!.counters.activeRuns = { children: 0, subagents: 0 };
  let lines = renderHeaderDeck(state, 160, theme as never);
  assert.match(lines[2] ?? '', /^\( 0 ›  0 · 00:07'00\)/u);
  assert.ok(colors.includes('dim: 0'));
  assert.ok(colors.includes('dim: 0'));
  assert.doesNotMatch(lines[6] ?? '', /||󰈙/u);

  colors.length = 0;
  state.header!.counters.activeRuns = { children: 1, subagents: 0 };
  lines = renderHeaderDeck(state, 160, theme as never);
  assert.match(lines[2] ?? '', /^\( 1 ›  0 · 00:07'00\)/u);
  assert.ok(colors.includes('accent: 1'));
  assert.ok(colors.includes('dim: 0'));

  colors.length = 0;
  state.header!.counters.activeRuns = { children: 3, subagents: 2 };
  lines = renderHeaderDeck(state, 160, theme as never);
  assert.match(lines[2] ?? '', /^\( 3 ›  2 · 00:07'00\)/u);
  assert.ok(colors.includes('accent: 3'));
  assert.ok(colors.includes('accent: 2'));
});

test('never leaves a telemetry separator dangling at narrow widths', () => {
  for (let width = 20; width <= 100; width += 1) {
    const lines = renderHeaderDeck(fixture(), width, plainTheme as never);
    assert.ok(
      lines.every((line) => !/[›⟩]\s*$/u.test(plain(line))),
      String(width),
    );
  }
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
  assert.match(
    lines[2] ?? '',
    /^\( 0 ›  0 · 00:00'00\) waiting ⟩ idle 󰁕 —\s+ task — ›  stps —$/u,
  );
  assert.equal(plain(lines[0] ?? ''), `󰠭 ⟩ —`);
  assert.doesNotMatch(lines.join('\n'), /next direction/u);
  assert.match(lines.find((line) => line.includes('')) ?? '', / \(no Git\) ⟩ —/u);
  assert.doesNotMatch(lines.join('\n'), /clean/u);
  assert.match(lines.find((line) => line.includes('')) ?? '', / task — ›  stps —/u);
  assert.match(
    lines.find((line) => line.includes('')) ?? '',
    /󰜦 — ⟩  — ›  — ›  —/u,
  );
  assert.equal(lines.join('\n').split('').length - 1, 1);
  assert.equal(lines.join('\n').split('').length - 1, 1);
  assert.doesNotMatch(lines.join('\n'), /󰈙/u);
  assert.match(lines.find((line) => line.includes('')) ?? '', /󰾆 —.* — › 󰜦 —/u);
});

const CAL_ICON = '󰃰';
const FLAME_ICON = '󰈸';
const CLOCK_ICON = '󰅐';

test('paints icon-native quota tiles in cost, calendar, flame order', () => {
  const state = fixture();
  state.footerTelemetry = {
    totalCost: 5.16,
    quotaWindows: [
      {
        label: '5h',
        percent: 82,
        resetAt: Math.floor(Date.now() / 1000) + 90 * 60 + 30,
      },
      {
        label: '7d',
        percent: 12,
        resetAt: Math.floor(Date.now() / 1000) + 6 * 86_400,
      },
    ],
  };
  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const telemetryLine = plain(
    lines.find((line: string) => line.includes('$5.16')) ?? '',
  );

  const costAt = telemetryLine.indexOf('$5.16');
  const calendarAt = telemetryLine.indexOf(`${CAL_ICON} 12%`);
  const flameAt = telemetryLine.indexOf(`${FLAME_ICON} 82%`);
  assert.ok(costAt >= 0 && calendarAt > costAt, 'calendar follows cost');
  assert.ok(flameAt > calendarAt, 'flame tile closes the group');
  assert.ok(
    telemetryLine.includes(`${FLAME_ICON} 82% › ${CLOCK_ICON} 1:30`),
    'coding tile carries clock countdown',
  );
});

test('classifies minute and day labels and always counts down the coding window', () => {
  const state = fixture();
  state.footerTelemetry = {
    totalCost: 5.16,
    quotaWindows: [
      {
        label: '90m',
        percent: 52,
        resetAt: Math.floor(Date.now() / 1000) + 45 * 60 + 10,
      },
      { label: '30d', percent: 40 },
    ],
  };
  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const telemetryLine = plain(
    lines.find((line: string) => line.includes('$5.16')) ?? '',
  );

  assert.ok(telemetryLine.includes(`${CAL_ICON} 40%`), 'day label is calendar');
  assert.ok(
    telemetryLine.includes(`${FLAME_ICON} 52% › ${CLOCK_ICON} 0:45`),
    'cool coding window still counts down',
  );
});

test('coding window without reset time paints flame without clock', () => {
  const state = fixture();
  state.footerTelemetry = {
    totalCost: 5.16,
    quotaWindows: [{ label: '5h', percent: 62 }],
  };
  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const telemetryLine = plain(
    lines.find((line: string) => line.includes('$5.16')) ?? '',
  );

  const tail = telemetryLine.slice(telemetryLine.indexOf(FLAME_ICON));
  assert.ok(tail.startsWith(`${FLAME_ICON} 62%`));
  assert.ok(!tail.includes(CLOCK_ICON) && !tail.includes(':'));
});

test('weekly-only telemetry paints the calendar tile alone', () => {
  const state = fixture();
  state.footerTelemetry = {
    totalCost: 5.16,
    quotaWindows: [
      {
        label: '7d',
        percent: 33,
        resetAt: Math.floor(Date.now() / 1000) + 5 * 86_400,
      },
    ],
  };
  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const telemetryLine = plain(
    lines.find((line: string) => line.includes('$5.16')) ?? '',
  );

  const tail = telemetryLine.slice(telemetryLine.indexOf(CAL_ICON));
  assert.ok(tail.startsWith(`${CAL_ICON} 33%`));
  assert.ok(!tail.includes(FLAME_ICON));
  assert.ok(!tail.includes(CLOCK_ICON), 'calendar never carries a countdown');
});
