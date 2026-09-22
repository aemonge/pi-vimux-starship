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
      suggestion: 'requesting-validation',
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
  assert.equal(formatDeckElapsed(null), "000:00'00");
  assert.equal(formatDeckElapsed(54), "000:00'05");
  assert.equal(formatDeckElapsed(999), "000:00'99");
  assert.equal(formatDeckElapsed(1_000), "000:01'00");
  assert.equal(formatDeckElapsed(62_345), "001:02'34");
  assert.equal(formatDeckElapsed(3_600_000), "060:00'00");
  assert.equal(formatDeckElapsed(Number.POSITIVE_INFINITY), "999:59'99");
  assert.equal(formatDeckElapsed(Number.NaN), "000:00'00");
  assert.equal(formatDeckElapsed(Number.NEGATIVE_INFINITY), "000:00'00");
});

test('renders the approved rich wide header without side borders or spacer rows', () => {
  const lines = renderHeaderDeck(fixture(), 160, plainTheme as never);

  assert.equal(lines.length, 6);
  const titleRow = plain(lines[2] ?? '');
  assert.ok(titleRow.startsWith("󰠭 000:07'00 ⟩ Read-only preflight"));
  assert.ok(titleRow.includes("000:07'00"));
  assert.match(lines[1] ?? '', /^─+$/u);
  const statusRow = plain(lines[4] ?? '');
  assert.ok(statusRow.includes('waiting'));
  assert.ok(statusRow.includes('requesting validation or redirection'));
  assert.ok(titleRow.includes('task 0/1'));
  assert.ok(titleRow.includes('stps 6/16'));
  assert.equal(statusRow.includes('idle'), false);
  assert.match(statusRow, /^. 02 › . 01 ⟩ waiting/u);
  assert.doesNotMatch(lines[4] ?? '', /requesting validation or redirection ⟩  task/u);
  assert.equal(plain(lines[3] ?? ''), '┈'.repeat(160));
  assert.match(lines[3] ?? '', /^\u001b\[2m/u);
  assert.match(plain(lines[0] ?? ''), /^\[.\] . ~\/galactica ⟩/u);
  // Relocation phase: runs lead the lifecycle row; project heads telemetry.
  assert.match(statusRow, /feature\/review-led/u);
  assert.ok(statusRow.trimEnd().endsWith('1'));
  assert.match(
    lines[0] ?? '',
    /\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F0F86} 38% \u{203A} \u{F039E} 2 \u{203A} \u{F241} 63%\s+/u,
  );
  assert.match(
    lines[0] ?? '',
    /48\.2% \u{203A}  268M \u{27E9}  3\/3 \u{27E9} \u{F0726} \$5\.16$/u,
  );
  assert.equal(lines.join('\n').includes('32K/128K'), false);
  assert.match(lines[5] ?? '', /^─ /u);
  assert.match(lines[5] ?? '', /‹ 󰠭 ─$/u);
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

test('drops the footer count; diagnostics stay on the top rule', () => {
  const state = fixture();
  state.piStatus = { errors: 0, warnings: 0, nativeStatusCount: 3 };

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  assert.match(lines[1] ?? '', /^─+$/u);
  assert.equal(lines.join('').includes('·3'), false);
  // Relocation phase: the footer count is deleted; the anchor echo remains.
  assert.doesNotMatch(lines.at(-1) ?? '', /[0-9] ‹/u);

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
  assert.doesNotMatch(empty[1] ?? '', /·0/u);
});

test('hides the bottom rail while inserting', () => {
  const state = fixture();
  state.mode = 'insert';

  const hidden = renderHeaderDeck(state, 160, plainTheme as never);
  assert.equal(hidden.length, 5);
  assert.doesNotMatch(hidden.join('\n'), /‹ 󰠭/u);

  const suppliedHidden = renderHeaderDeck(state, 160, plainTheme as never, {
    plain: '󰏫',
    styled: '󰏫',
  });
  assert.equal(suppliedHidden.length, 5);
  assert.doesNotMatch(suppliedHidden.join('\n'), /‹ 󰠭/u);

  state.mode = 'normal';
  const visible = renderHeaderDeck(state, 160, plainTheme as never);
  assert.equal(visible.length, 6);
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
  state.header!.suggestion = 'requesting-validation';

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const statusRow = plain(lines[4] ?? '');
  assert.ok(statusRow.includes('assuring'));
  assert.ok(statusRow.includes('verify'));
  assert.ok(statusRow.includes('requesting validation or redirection'));
  const titleRow = plain(lines[2] ?? '');
  assert.ok(titleRow.startsWith("󰠭 000:07'00 ⟩ Plan title › Current task"));
  assert.ok(titleRow.includes("000:07'00"));
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
  assert.doesNotMatch(wide[4] ?? '', /Parent Plan title/u);
  const titleRow = plain(wide[2] ?? '');
  assert.ok(
    titleRow.startsWith(`󰠭 000:07'00 ⟩ Parent Plan title › ${expected}`.slice(0, 40)),
  );
  assert.ok(titleRow.includes("000:07'00"));

  const narrow = renderHeaderDeck(state, 79, plainTheme as never);
  assert.match(narrow[2] ?? '', /󰠭/u);
  const status = narrow.find((line) => plain(line).includes('waiting')) ?? '';
  assert.ok(status.includes('waiting'));
  assert.equal(status.includes('idle'), false);
  const focus = narrow.slice(2, 4);
  assert.equal(focus.length, 2);
  assert.ok(plain(focus[0] ?? '').startsWith("󰠭 000:07'00 ⟩ Parent Plan title"));
  assert.ok(plain(focus[1] ?? '').includes('without repeating'));
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
  assert.doesNotMatch(wide[4] ?? '', /One focused work title/u);
  const titleRow = plain(wide[2] ?? '');
  assert.ok(titleRow.startsWith("󰠭 000:07'00 ⟩ One focused work title"));
  assert.ok(titleRow.includes("000:07'00"));
  assert.equal(wide.join('\n').split('One focused work title').length - 1, 1);

  const narrow = renderHeaderDeck(state, 79, plainTheme as never);
  assert.ok(plain(narrow[2] ?? '').startsWith("󰠭 000:07'00 ⟩ One focused work title"));
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
  const subjectRow = plain(wide[2] ?? '');
  assert.ok(subjectRow.startsWith("󰠭 000:07'00 ⟩ Session subject"));
  assert.ok(subjectRow.includes("000:07'00"));
  assert.doesNotMatch(wide.join('\n'), /󰠭 ⟩ —/u);

  const narrow = renderHeaderDeck(state, 79, plainTheme as never);
  assert.notEqual(plain(narrow[2] ?? ''), `󰠭 ⟩ —`);
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
    "( 2 ›  1 · 000:07'00)",
    'idle',
    'requesting validation or redirection',
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
  state.header!.suggestion = 'requesting-validation';
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
  assert.ok(colors.includes('warning:requesting validation or redirection'));
  assert.ok(colors.includes('accent:Plan title › Current task'));
  assert.equal(colors.includes('accent:verify'), false);
  assert.equal(colors.includes('accent:requesting validation or redirection'), false);
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
  state.header!.suggestion = 'awaiting-resume';
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

  assert.ok(plain(lines[4] ?? '').includes('working › recovering'));
  assert.ok(plain(lines[4] ?? '').includes('awaiting resume or redirect'));
  assert.ok(colors.includes('accent:recovering'));
  assert.ok(colors.includes('accent:awaiting resume or redirect'));
  assert.ok(bolded.includes('working'));
  assert.equal(bolded.includes('recovering'), false);
  assert.equal(bolded.includes('awaiting resume or redirect'), false);
});

test('reports the WHAT with task title and step while active without a cue', () => {
  const state = fixture();
  state.header!.work = {
    lifecycle: 'working',
    titles: ['Plan title', 'Current task'],
    color: 'accent',
    activity: { kind: 'implementation' },
  };
  state.header!.selection = null;
  state.header!.suggestion = null;
  state.header!.approvalRequired = false;
  state.header!.blocked = false;

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  // Relocation: the capsule keeps a title row alive even without selection.
  const status = plain(lines[4] ?? '');

  assert.ok(status.includes('working › implementing ⟩ Plan title'));
  assert.equal(status.includes('step 7/16'), false);
  assert.ok(plain(lines[2] ?? '').includes('stps 6/16'));
  assert.equal(status.includes('󰁕 Plan title'), false);
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
  assert.ok(colors.includes("accent:000:07'00"));
  assert.ok(!colors.some((entry) => entry.endsWith(':idle')));
  assert.ok(colors.includes('warning:requesting validation or redirection'));
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
  // Frozen contract: absent counters remove their slots — no dash narration.
  assert.ok(
    !colors.some((entry) => entry.includes('task') && !entry.startsWith('dim:')),
  );
  assert.ok(
    !colors.some((entry) => entry.includes('stps') && !entry.startsWith('dim:')),
  );

  state.header!.counters.tasks = { completed: 0, total: 1 };
  colors.length = 0;
  renderHeaderDeck(state, 160, theme as never);
  assert.ok(colors.some((entry) => entry.includes(' task 0/1')));
  assert.ok(!colors.some((entry) => entry.includes('stps')));

  state.header!.counters.tasks = undefined;
  state.header!.counters.steps = { completed: 10, total: 10 };
  colors.length = 0;
  renderHeaderDeck(state, 160, theme as never);
  assert.ok(!colors.some((entry) => entry.includes('task')));
  assert.ok(colors.some((entry) => entry.includes(' stps 10/10')));
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

test('keeps compact telemetry islands together with one gap cell', () => {
  const left = '󰚩 GPT-5.6 Sol › high ⟩ 󰾆 38% › 󰎞 2 ›  63%';
  const right = '48.2% ›  268M ⟩  3/3 ⟩ 󰜦 $5.16';
  const width = visibleWidth(left) + visibleWidth(right) + 4;

  const lines = renderHeaderDeck(fixture(), width, plainTheme as never);
  assert.match(
    lines.join('\n'),
    new RegExp(`${escapeRegExp(left)}\\s+${escapeRegExp(right)}`),
  );
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
  const counterRow = plain(lines[2] ?? '');
  assert.ok(counterRow.includes("000:07'00"));
  // Relocation phase: runs ride the lifecycle row, off the title band.
  assert.match(plain(lines[4] ?? ''), /^. 00 › . 00 ⟩ waiting/u);
  assert.ok(colors.includes('dim: 00'));
  assert.doesNotMatch(lines[0] ?? '', /||󰈙/u);

  colors.length = 0;
  state.header!.counters.activeRuns = { children: 1, subagents: 0 };
  lines = renderHeaderDeck(state, 160, theme as never);
  assert.ok(plain(lines[2] ?? '').includes("000:07'00"));
  assert.match(plain(lines[4] ?? ''), /^. 01 › . 00 ⟩ waiting/u);
  assert.ok(colors.includes('accent: 01'));
  assert.ok(colors.includes('dim: 00'));

  colors.length = 0;
  state.header!.counters.activeRuns = { children: 3, subagents: 2 };
  lines = renderHeaderDeck(state, 160, theme as never);
  assert.ok(plain(lines[2] ?? '').includes("000:07'00"));
  assert.match(plain(lines[4] ?? ''), /^. 03 › . 02 ⟩ waiting/u);
  assert.ok(colors.includes('accent: 03'));
  assert.ok(colors.includes('accent: 02'));
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
    assert.ok(
      lines.some((line) => plain(line).includes("󰠭 000:07'00")),
      String(width),
    );
    assert.equal(lines.join('').split('󰠭').length - 1, 2, String(width));
    if (width >= 79) {
      assert.match(lines.join('\n'), /000:07'00/u, String(width));
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
  const all = lines.join('\n');
  // Frozen contract: absent facts remove their slots — the frame collapses
  // without a single placeholder dash or emptiness narration.
  // Gray-out amendment: dim numeric zeros replace every placeholder dash.
  assert.equal(
    lines.some((line) => line.includes('—')),
    false,
  );
  assert.ok(plain(lines[2] ?? '').includes('task 00/00'), 'dim title placeholder');
  assert.ok(plain(lines[2] ?? '').includes('stps 00/00'), 'dim title placeholder');
  assert.doesNotMatch(all, /next direction/u);
  assert.doesNotMatch(all, /clean/u);
  assert.ok(
    !lines.filter((_line, index) => index !== 2).some((line) => line.includes('task')),
    'no task slot below the title without counters',
  );
  assert.ok(
    !lines.filter((_line, index) => index !== 2).some((line) => line.includes('stps')),
    'no steps slot below the title without counters',
  );
  const status = lines.find((line) => line.includes('waiting')) ?? '';
  // Frozen contract: full silence when nothing is running or selected.
  assert.equal(status, '');
  // Frozen contract: absent Git removes the segment entirely.
  assert.ok(all.includes('(no Git)'));
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

  const calendarAt = telemetryLine.indexOf(`${CAL_ICON} 12%`);
  const flameAt = telemetryLine.indexOf(`${FLAME_ICON} 82%`);
  const costAt = telemetryLine.indexOf('$5.16');
  assert.ok(calendarAt >= 0, 'calendar tile renders');
  assert.ok(flameAt > calendarAt, 'flame follows the calendar');
  assert.ok(costAt > flameAt, 'cost anchors the far end');
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

test('renders elastic span rows naming each live child run', () => {
  const state = fixture();
  state.header!.activeRunSpans = [
    {
      id: 'sub-1:reviewer',
      kind: 'subagent',
      parent: 'sub-1',
      agent: 'reviewer',
      stage: 'assuring',
      elapsedMs: 41_000,
    },
    {
      id: 'bash-2',
      kind: 'bash',
      parent: 'turn-1',
      label: 'pytest',
      stage: 'working',
      elapsedMs: 10_000,
    },
  ];
  const lines = renderHeaderDeck(state, 120, plainTheme as never);
  const reviewer = lines.find((line) => line.includes('reviewer')) ?? '';
  assert.match(reviewer, /├ reviewer assuring/u);
  assert.match(reviewer, /00'41/u);
  const bashRow = lines.find((line) => line.includes('pytest')) ?? '';
  assert.match(bashRow, /└ .*pytest working/u);
  assert.match(bashRow, /00'10/u);
});

test('span rows collapse when no child runs are live', () => {
  const lines = renderHeaderDeck(fixture(), 120, plainTheme as never);
  assert.equal(
    lines.some((line) => line.includes('├') || line.includes('└')),
    false,
  );
});
