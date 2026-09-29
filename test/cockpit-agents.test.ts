import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  colorWanted,
  deriveAgents,
  readSnapshots,
  renderBoard,
  renderJson,
  watchWanted,
} from '../bin/cockpit-agents.mjs';

const NOW = 1_800_000_000_000;

// Fixture sessionIds are pre-searched so the sha256-based 3-char ids derive
// to 003/001/002/004/005, reproducing the frozen sample's id column exactly.
const FIXTURES: ReadonlyArray<{
  sessionId: string;
  elapsedMs: number;
  ageMs: number;
  pid?: number;
  cwd: string;
  suggestion: string | null;
  lifecycle: string;
  titles: readonly string[];
}> = [
  {
    sessionId: '0b4a-b1fe-4bd6-8f0e-session-b4',
    elapsedMs: 10_931_000, // 3:02:11
    ageMs: 1_000,
    cwd: '/home/dev/pi-vimux-starship',
    suggestion: 'requesting-validation',
    lifecycle: 'waiting',
    titles: ['Pi agent telemetry CLI for vimux-starship notifications'],
  },
  {
    sessionId: '04e7a-b1fe-4bd6-8f0e-session-4e7',
    elapsedMs: 754_000, // 0:12:34
    ageMs: 5_000,
    cwd: '/home/dev/galactica',
    suggestion: null,
    lifecycle: 'working',
    titles: ['Consolidate imported Pi cockpit'],
  },
  {
    sessionId: '054ca-b1fe-4bd6-8f0e-session-54c',
    elapsedMs: 2_467_000, // 0:41:07
    ageMs: 9_000,
    cwd: '/home/dev/pi-vimux-starship',
    suggestion: null,
    lifecycle: 'working',
    titles: ['Route Insert through Neovim'],
  },
  {
    sessionId: '032ea-b1fe-4bd6-8f0e-session-32e',
    elapsedMs: 6_000_000, // 1:40:00
    ageMs: 20_000,
    cwd: '/home/aemonge/articles',
    suggestion: null,
    lifecycle: 'listening',
    titles: ['QMD taxonomy cleanup'],
  },
  {
    sessionId: '0449a-b1fe-4bd6-8f0e-session-449',
    elapsedMs: 1_365_000, // 0:22:45
    ageMs: 120_000, // frozen heartbeat but pid dead → gone
    pid: 4194303,
    cwd: '/home/aemonge/dotfiles',
    suggestion: null,
    lifecycle: 'listening',
    titles: ['Shell hygiene pass'],
  },
] as const;

function snapshotFor(fixture: (typeof FIXTURES)[number]) {
  return {
    protocol: 1,
    activity: null,
    selection: null,
    suggestion: fixture.suggestion,
    work: {
      lifecycle: fixture.lifecycle,
      titles: [...fixture.titles],
      color: 'accent',
    },
    diagnostics: null,
    backgroundActivity: false,
    approvalRequired: false,
    blocked: false,
    counters: { agents: { active: 0, total: 0 } },
    progress: [],
    sessionId: fixture.sessionId,
    pid: fixture.pid ?? process.pid,
    cwd: fixture.cwd,
    sessionStart: NOW - fixture.elapsedMs,
    updatedAt: NOW - fixture.ageMs,
  };
}

async function fixtureDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'cockpit-board-'));
  for (const fixture of FIXTURES) {
    await writeFile(
      path.join(dir, `${fixture.sessionId}.json`),
      JSON.stringify(snapshotFor(fixture)),
      'utf8',
    );
  }
  return dir;
}

const GOLDEN_80 = [
  '󰆧 pi-vimux-starship command center                        4 agents · 1 attention',
  '',
  '! 003  pi-vimux-starship       validation                                3:02:11',
  '                               Pi agent telemetry CLI for vimux-starship notifications',
  '',
  '● 001  galactica               Consolidate imported Pi cockpit           0:12:34',
  '● 002  pi-vimux-starship       Route Insert through Neovim               0:41:07',
  '◌ 004  articles                QMD taxonomy cleanup                      1:40:00',
  '× 005  dotfiles                Shell hygiene pass                        0:22:45',
].join('\n');

test('golden render reproduces the frozen TUI contract byte-identically', async () => {
  const dir = await fixtureDir();
  try {
    const snapshots = await readSnapshots(dir);
    const rows = deriveAgents(snapshots, { now: NOW });
    const output = renderBoard(rows, { columns: 80, color: false });
    assert.equal(output, `${GOLDEN_80}\n`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('frozen colors appear when color is on, including bold accent reason', async () => {
  const dir = await fixtureDir();
  try {
    const rows = deriveAgents(await readSnapshots(dir), { now: NOW });
    const output = renderBoard(rows, { columns: 80, color: true });
    assert.ok(output.includes('\u001b[1m\u001b[38;2;92;92;168m'), 'bold violet title');
    assert.ok(
      output.includes('\u001b[38;2;7;102;120m1 attention'),
      'accent attention count',
    );
    assert.ok(
      output.includes('\u001b[1m\u001b[38;2;7;102;120mvalidation'),
      'bold accent reason word',
    );
    assert.ok(output.includes('\u001b[38;2;104;157;106m'), 'green working marker');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('dynamic widths: COLUMNS geometry recomputes project and task columns', async () => {
  const dir = await fixtureDir();
  try {
    const rows = deriveAgents(await readSnapshots(dir), { now: NOW });
    const output = renderBoard(rows, { columns: 100, color: false });
    for (const line of output.split('\n')) {
      if (line.length > 0 && !line.startsWith(' ')) {
        assert.ok(
          [...line].length <= 100,
          `main row exceeds width: ${[...line].length}`,
        );
      }
    }
    const wide = renderBoard(rows, { columns: 120, color: false });
    assert.ok([...wide.split('\n')[0]].length >= 100, 'header stretches with width');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('surrogate-safe title math keeps the header gap correct with the icon', async () => {
  const rows = deriveAgents([], { now: NOW });
  const output = renderBoard(rows, { columns: 80, color: false });
  const header = output.split('\n')[0] ?? '';
  assert.equal([...header].length, 80, 'icon counts as one code point');
});

test('narrow-width guard keeps main rows within the terminal width', async () => {
  const dir = await fixtureDir();
  try {
    const rows = deriveAgents(await readSnapshots(dir), { now: NOW });
    const output = renderBoard(rows, { columns: 45, color: false });
    const lines = output.split('\n');
    const subIndent = lines.find((line) => line.startsWith('      '));
    assert.ok(subIndent, 'fixture includes a subline');
    for (const [index, line] of lines.entries()) {
      // Header (line 0) and sublines keep their natural frozen overflow;
      // the guard pins main row lines.
      if (index === 0 || line === '' || line === subIndent) continue;
      assert.ok(
        [...line].length <= 45,
        `row ${index} exceeds 45 columns: ${[...line].length}`,
      );
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('attention states derive from every suggestion, approval, and block', () => {
  const base = snapshotFor(FIXTURES[1]);
  const variants = [
    { suggestion: 'requesting-validation' },
    { suggestion: 'requesting-redirection' },
    { suggestion: 'requesting-input' },
    { suggestion: 'awaiting-resume' },
    { approvalRequired: true },
    { blocked: true },
  ];
  for (const variant of variants) {
    const rows = deriveAgents([{ ...base, ...variant }], { now: NOW });
    assert.equal(rows[0]?.state, 'attention', JSON.stringify(variant));
  }
  assert.equal(
    deriveAgents([{ ...base, blocked: true }], { now: NOW })[0]?.task,
    'blocked',
  );
});

test('working derives from active lifecycles or live run spans', () => {
  const base = snapshotFor(FIXTURES[1]);
  for (const lifecycle of [
    'understanding',
    'working',
    'assuring',
    'learning',
    'answering',
  ]) {
    const rows = deriveAgents([{ ...base, work: { ...base.work, lifecycle } }], {
      now: NOW,
    });
    assert.equal(rows[0]?.state, 'working', lifecycle);
  }
  const spans = {
    ...base,
    work: { ...base.work, lifecycle: 'listening' },
    activeRunSpans: [{ id: 'turn-1' }],
  };
  assert.equal(deriveAgents([spans], { now: NOW })[0]?.state, 'working');
});

test('parked derives from listening or waiting', () => {
  const base = snapshotFor(FIXTURES[1]);
  for (const lifecycle of ['listening', 'waiting']) {
    const rows = deriveAgents([{ ...base, work: { ...base.work, lifecycle } }], {
      now: NOW,
    });
    assert.equal(rows[0]?.state, 'parked', lifecycle);
  }
});

test('gone derives from dead pid only; stale-but-alive parks', () => {
  const base = snapshotFor(FIXTURES[1]);
  const staleAlive = {
    ...base,
    work: { ...base.work, lifecycle: 'listening' },
    updatedAt: NOW - 61_000,
  };
  assert.equal(deriveAgents([staleAlive], { now: NOW })[0]?.state, 'parked');
  const deadPid = deriveAgents([{ ...base, pid: 4194303 }], { now: NOW });
  assert.equal(deadPid[0]?.state, 'gone');
  assert.equal(deriveAgents([{ ...base }], { now: NOW })[0]?.state, 'working');
});

test('groups order attention → working → parked → gone, most recent first', () => {
  const attention = { ...snapshotFor(FIXTURES[0]), updatedAt: NOW - 30_000 };
  const parked = snapshotFor(FIXTURES[3]);
  const working = snapshotFor(FIXTURES[1]);
  const gone = snapshotFor(FIXTURES[4]);
  const rows = deriveAgents([gone, parked, working, attention], { now: NOW });
  assert.deepEqual(
    rows.map((row: { state: string }) => row.state),
    ['attention', 'working', 'parked', 'gone'],
  );
});

test('3-char ids are stable and zero-padded from the sessionId', () => {
  const base = snapshotFor(FIXTURES[0]);
  const first = deriveAgents([base], { now: NOW })[0];
  const again = deriveAgents([base], { now: NOW + 5_000 })[0];
  assert.equal(first?.id, '003');
  assert.equal(again?.id, '003');
  assert.match(String(first?.id), /^\d{3}$/u);
});

test('time column falls back to session age without live spans', () => {
  const rows = deriveAgents([snapshotFor(FIXTURES[0])], { now: NOW });
  assert.equal(rows[0]?.time, '3:02:11');
});

test('task title falls back to selection.titles when work has none', () => {
  const base = snapshotFor(FIXTURES[1]);
  const subjectSourced = {
    ...base,
    work: { ...base.work, titles: [] },
    selection: {
      source: 'subject',
      titles: ['Testing a 20-second sleep command'],
      color: 'accent',
    },
  };
  assert.equal(
    deriveAgents([subjectSourced], { now: NOW })[0]?.task,
    'Testing a 20-second sleep command',
  );
});

test('idle time column ticks with the deck idle clock via drift', () => {
  const base = snapshotFor(FIXTURES[1]);
  const idle = {
    ...base,
    work: { ...base.work, lifecycle: 'listening' },
    sessionStart: NOW - 3_600_000,
    idleMs: 1_713_000, // deck showed 000:28'33
    updatedAt: NOW - 5_000, // snapshot froze 5s ago
  };
  const rows = deriveAgents([idle], { now: NOW });
  assert.equal(rows[0]?.state, 'parked');
  assert.equal(rows[0]?.time, '0:28:38', 'idleMs plus snapshot age');
});

test('working time column adds snapshot-age drift to the span clock', () => {
  const base = snapshotFor(FIXTURES[1]);
  const withSpans = {
    ...base,
    sessionStart: NOW - 3_600_000, // an hour old — must not win over the span
    updatedAt: NOW - 5_000,
    activeRunSpans: [
      { id: 'call-1', kind: 'bash', parent: 'turn-1', elapsedMs: 12_000 },
      { id: 'turn-1', kind: 'agent', parent: null, elapsedMs: 262_000 },
      { id: 'turn-0', kind: 'agent', parent: null, elapsedMs: 30_000 },
    ],
  };
  const rows = deriveAgents([withSpans], { now: NOW });
  assert.equal(rows[0]?.state, 'working');
  assert.equal(rows[0]?.time, '0:04:27', 'newest root span elapsed plus drift');
});

test('readSnapshots tolerates corrupt files, wrong protocols, and missing dirs', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'cockpit-read-'));
  try {
    await writeFile(
      path.join(dir, 'good.json'),
      JSON.stringify(snapshotFor(FIXTURES[1])),
      'utf8',
    );
    await writeFile(path.join(dir, 'corrupt.json'), '{not json', 'utf8');
    await writeFile(
      path.join(dir, 'wrong-protocol.json'),
      JSON.stringify({ protocol: 2 }),
      'utf8',
    );
    const snapshots = await readSnapshots(dir);
    assert.equal(snapshots.length, 1);
    assert.equal(snapshots[0]?.sessionId, FIXTURES[1].sessionId);
    assert.deepEqual(await readSnapshots(path.join(dir, 'does-not-exist')), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('empty board renders the header plus a dim no-live-agents line', () => {
  const output = renderBoard(deriveAgents([], { now: NOW }), {
    columns: 80,
    color: false,
  });
  assert.equal(
    output,
    '󰆧 pi-vimux-starship command center                        0 agents · 0 attention\n\nno live agents\n',
  );
});

test('renderJson round-trips the parsed snapshots', async () => {
  const snapshots = [snapshotFor(FIXTURES[1]), snapshotFor(FIXTURES[3])];
  assert.deepEqual(JSON.parse(renderJson(snapshots)), snapshots);
});

test('colorWanted honors TTY and NO_COLOR', () => {
  assert.equal(colorWanted({ tty: true, env: {} }), true);
  assert.equal(colorWanted({ tty: true, env: { NO_COLOR: '1' } }), false);
  assert.equal(colorWanted({ tty: false, env: {} }), false);
});

test('watchWanted defaults to watching on a TTY with escapes', () => {
  assert.equal(watchWanted({ tty: true }), true, 'terminal watches by default');
  assert.equal(watchWanted({ tty: true, json: true }), false, 'json stays single-shot');
  assert.equal(
    watchWanted({ tty: true, once: true }),
    false,
    '--once forces one render',
  );
  assert.equal(watchWanted({ tty: false }), false, 'pipes stay single-shot');
  assert.equal(watchWanted({ tty: false, watch: true }), true, '-w forces watch');
});
