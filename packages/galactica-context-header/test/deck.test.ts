import assert from 'node:assert/strict';
import test from 'node:test';
import { visibleWidth } from '@earendil-works/pi-tui';

import { renderHeaderDeck, type HeaderDeckState } from '../src/deck.ts';

const plainTheme = {
  fg: (_color: string, text: string) => text,
  bold: (text: string) => text,
};

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

test('renders the approved open-sided wide deck without spacer rows', () => {
  const lines = renderHeaderDeck(fixture(), 160, plainTheme as never);

  assert.equal(lines.length, 11);
  assert.match(lines[0] ?? '', /^─ 󰠭 > ─+$/u);
  assert.equal(lines[1], '00:00:07 ⟩ waiting › next direction');
  assert.equal(
    lines[5],
    '[󰆧]  ~/galactica  ·   feature/review-ledger/preserve-openspec-validation',
  );
  assert.equal(
    lines[6],
    ' 2 staged  ·   3 modified  ·   1 untracked  ·   0 conflicts',
  );
  assert.equal(
    lines[8],
    '󰚩 agts 0/0  ⟩  󰦕 stps 6/16  󰈔 files 37/53  ⟩  󰒋 LSP 2/2   MCP 3/3',
  );
  assert.equal(
    lines[9],
    '󰚩 GPT-5.6 Sol  󰧑 high  ⟩  󰾆 ctx 38%  󰎞 zips 2   qta 63%  ⟩   48.2% (268M)  ⟩  󰜦 $5.16',
  );
  assert.match(lines[10] ?? '', /^󰆾 ═+ < 󰠭 ══$/u);
  assert.ok(lines.every((line) => line.length > 0));
  assert.ok(lines.every((line) => !line.startsWith('│') && !line.endsWith('│')));
  assert.equal(lines.join('').split('󰠭').length - 1, 2);
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
  }
});

test('renders unavailable optional telemetry honestly', () => {
  const state = fixture();
  state.header = null;
  state.elapsedMs = null;
  state.footerTelemetry = undefined;
  state.resources = undefined;
  state.lsp = null;
  state.mcp = null;
  state.branch = '';
  state.gitAvailable = false;

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  assert.match(lines[1] ?? '', /waiting › next direction/u);
  assert.match(lines.find((line) => line.includes('')) ?? '', / \(no Git\)/u);
  assert.match(
    lines.find((line) => line.includes('󰦕')) ?? '',
    /󰦕 stps —.*󰈔 files —.*󰒋 LSP —.* MCP —/u,
  );
  assert.match(lines.find((line) => line.includes('')) ?? '', / qta —.* —.*󰜦 \$0/u);
});
