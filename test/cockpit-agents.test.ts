import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  colorWanted,
  deriveAgents,
  pruneDeadSnapshots,
  readSnapshots,
  renderBoard,
  renderJson,
  startBoardWatch,
  watchWanted,
} from '../bin/cockpit-agents.mjs';

// The deck formats PWD against this home; pin it for the whole suite
// (node --test isolates each file in its own process).
process.env.HOME = '/home/dev';

const NOW = 1_800_000_000_000;

// Fixture sessionIds double as the board's 7-char prefix ids (git-style
// short SHAs, resolvable via `pi --session <id>`); first 7 chars are the
// display ids, reproducing the frozen sample's id column shape.
const FIXTURES: ReadonlyArray<{
  sessionId: string;
  elapsedMs: number;
  ageMs: number;
  pid?: number;
  idleMs?: number;
  spanMs?: number;
  activityMs?: number;
  stage?: readonly string[];
  cwd: string;
  suggestion: string | null;
  lifecycle: string;
  titles: readonly string[];
}> = [
  {
    sessionId: '003f1a0-session-att',
    elapsedMs: 10_931_000, // 3:02:11
    ageMs: 1_000,
    idleMs: 10_930_000, // deck idle clock at last event
    cwd: '/home/dev/pi-vimux-starship',
    suggestion: 'requesting-validation',
    lifecycle: 'waiting',
    titles: ['Pi agent telemetry CLI for vimux-starship notifications'],
  },
  {
    sessionId: '001c2d4-session-wrk1',
    elapsedMs: 754_000, // 012:34'00
    ageMs: 5_000,
    spanMs: 749_000, // root span at last event; drift adds the rest
    activityMs: 749_000, // deck clock at last event — identical to the span here
    stage: ['working', 'implementing'],
    cwd: '/home/dev/galactica',
    suggestion: null,
    lifecycle: 'working',
    titles: ['Consolidate imported Pi cockpit'],
  },
  {
    sessionId: '002b3e5-session-wrk2',
    elapsedMs: 2_467_000, // 041:07'00
    ageMs: 9_000,
    spanMs: 2_458_000,
    activityMs: 2_458_000,
    stage: ['working', 'planning'],
    cwd: '/home/dev/pi-vimux-starship',
    suggestion: null,
    lifecycle: 'working',
    titles: ['Route Insert through Neovim'],
  },
  {
    sessionId: '004a9c3-session-park',
    elapsedMs: 6_000_000, // 1:40:00
    ageMs: 20_000,
    idleMs: 5_980_000,
    cwd: '/home/aemonge/articles',
    suggestion: null,
    lifecycle: 'listening',
    titles: ['QMD taxonomy cleanup'],
  },
  {
    sessionId: '005d7e1-session-gone',
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
      ...(fixture.stage
        ? {
            activityPath: fixture.stage.slice(1).map((compact, index) => ({
              id: `seg-${index}`,
              label: compact,
              compact,
            })),
          }
        : {}),
    },
    diagnostics: null,
    backgroundActivity: false,
    approvalRequired: false,
    blocked: false,
    counters: { agents: { active: 0, total: 0 } },
    progress: [],
    ...(fixture.idleMs !== undefined ? { idleMs: fixture.idleMs } : {}),
    ...(fixture.spanMs !== undefined
      ? {
          activeRunSpans: [
            { id: 'turn-1', kind: 'agent', parent: null, elapsedMs: fixture.spanMs },
          ],
        }
      : {}),
    ...(fixture.activityMs !== undefined
      ? { activityElapsedMs: fixture.activityMs }
      : {}),
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

async function waitFor(check: () => Promise<boolean> | boolean): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail('condition not reached within the wait window');
}

const GOLDEN_80 = [
  '󰆧 pi-vimux-starship command center                        4 agents · 1 attention',
  '',
  "! 003f1a0 › ~/pi-vimux-starship ⟩ validation                           182:11'00",
  '                                  Pi agent telemetry CLI for vimux-starship notifications',
  '',
  "● 001c2d4 › ~/galactica ⟩ Consolidate imported Pi cockpit › working ›  012:34'00",
  "● 002b3e5 › ~/pi-vimux-starship ⟩ Route Insert through Neovim › workin 041:07'00",
  "◌ 004a9c3 › /home/aemonge/articles ⟩ QMD taxonomy cleanup › listening  100:00'00",
  "× 005d7e1 › /home/aemonge/dotfiles ⟩ Shell hygiene pass                022:45'00",
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
    assert.ok(output.includes('\u001b[38;2;92;92;168m'), 'bold violet title');
    assert.ok(output.includes('\u001b[38;2;92;92;168m › '), 'violet row separator');
    assert.ok(output.includes('\u001b[38;2;92;92;168m ⟩ '), 'violet path separator');
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
    // Raw paths widen the prefix; the squeezable floor is now 26 columns.
    const output = renderBoard(rows, { columns: 40, color: false });
    const lines = output.split('\n');
    const subIndent = lines.find((line) => line.startsWith('      '));
    assert.ok(subIndent, 'fixture includes a subline');
    for (const [index, line] of lines.entries()) {
      // Header (line 0) and sublines keep their natural frozen overflow;
      // the guard pins main row lines.
      if (index === 0 || line === '' || line === subIndent) continue;
      assert.ok(
        [...line].length <= 40,
        `row ${index} exceeds 40 columns: ${[...line].length}`,
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
    const rows = deriveAgents(
      [{ ...base, work: { ...base.work, lifecycle }, activeRunSpans: undefined }],
      {
        now: NOW,
      },
    );
    assert.equal(rows[0]?.state, 'parked', lifecycle);
  }
});

test('gone derives from dead pid only; stale-but-alive parks', () => {
  const base = snapshotFor(FIXTURES[1]);
  const staleAlive = {
    ...base,
    work: { ...base.work, lifecycle: 'listening' },
    activeRunSpans: undefined,
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

test('project column shows deck-form paths, never a bare basename', () => {
  const base = snapshotFor(FIXTURES[1]);
  const home = { ...base, cwd: '/home/dev' };
  assert.equal(deriveAgents([home], { now: NOW })[0]?.project, '~');
  const nested = { ...base, cwd: '/home/dev/projects/x' };
  assert.equal(deriveAgents([nested], { now: NOW })[0]?.project, '~/projects/x');
  const away = { ...base, cwd: '/srv/data' };
  assert.equal(deriveAgents([away], { now: NOW })[0]?.project, '/srv/data');
});

test('the deck activity clock wins over span and idle clocks', () => {
  const base = snapshotFor(FIXTURES[1]);
  const withAll = {
    ...base,
    activityElapsedMs: 25_000,
    idleMs: 1_000,
    activeRunSpans: [{ id: 'turn-1', kind: 'agent', parent: null, elapsedMs: 262_000 }],
    updatedAt: NOW - 2_000,
  };
  assert.equal(deriveAgents([withAll], { now: NOW })[0]?.time, "000:27'00");
});

test('working rows append the deck stage to the task cell', () => {
  const base = snapshotFor(FIXTURES[1]);
  assert.equal(
    deriveAgents([base], { now: NOW })[0]?.task,
    'Consolidate imported Pi cockpit › working › implementing',
  );
  const understanding = {
    ...base,
    work: {
      ...base.work,
      lifecycle: 'understanding',
      activityPath: [
        {
          id: 'interpreting-intent',
          label: 'interpreting intent',
          compact: 'interpreting',
        },
      ],
    },
  };
  assert.equal(
    deriveAgents([understanding], { now: NOW })[0]?.task,
    'Consolidate imported Pi cockpit › understanding › interpreting',
  );
});

test('ids are stable 7-char sessionId prefixes, resolvable by pi --session', () => {
  const base = snapshotFor(FIXTURES[0]);
  const first = deriveAgents([base], { now: NOW })[0];
  const again = deriveAgents([base], { now: NOW + 5_000 })[0];
  assert.equal(first?.id, base.sessionId.slice(0, 7));
  assert.equal(again?.id, first?.id);
  assert.match(String(first?.id), /^[0-9a-f]{7}$/u);
});

test('just-idle rows mirror the deck frozen zero face when idleMs is absent', () => {
  const base = snapshotFor(FIXTURES[1]);
  const justIdle = {
    ...base,
    work: { ...base.work, lifecycle: 'listening' },
    activeRunSpans: undefined,
    activityElapsedMs: undefined,
    idleMs: undefined,
    updatedAt: NOW - 6_000,
  };
  assert.equal(deriveAgents([justIdle], { now: NOW })[0]?.time, "000:00'00");
});

test('an explicit zero idleMs is also the frozen face, never drift', () => {
  const base = snapshotFor(FIXTURES[1]);
  const zeroIdle = {
    ...base,
    work: { ...base.work, lifecycle: 'listening' },
    activeRunSpans: undefined,
    activityElapsedMs: undefined,
    idleMs: 0,
    updatedAt: NOW - 6_000,
  };
  assert.equal(deriveAgents([zeroIdle], { now: NOW })[0]?.time, "000:00'00");
});

test('gone rows report the session lifetime', () => {
  const rows = deriveAgents([snapshotFor(FIXTURES[4])], { now: NOW });
  assert.equal(rows[0]?.state, 'gone');
  assert.equal(rows[0]?.time, "022:45'00");
});

test('pruneDeadSnapshots deletes dead-pid files and keeps the rest', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'cockpit-prune-'));
  try {
    const alive = snapshotFor(FIXTURES[1]);
    const dead = snapshotFor(FIXTURES[4]); // dead pid fixture
    await writeFile(
      path.join(dir, `${alive.sessionId}.json`),
      JSON.stringify(alive),
      'utf8',
    );
    await writeFile(
      path.join(dir, `${dead.sessionId}.json`),
      JSON.stringify(dead),
      'utf8',
    );
    await writeFile(path.join(dir, 'corrupt.json'), '{oops', 'utf8');

    const removed = await pruneDeadSnapshots(dir);

    assert.deepEqual(removed.sort(), [dead.sessionId].sort());
    assert.deepEqual(
      (await readSnapshots(dir)).map((snapshot) => snapshot.sessionId),
      [alive.sessionId],
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
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
    'Testing a 20-second sleep command › working › implementing',
  );
});

test('idle time column ticks with the deck idle clock via drift', () => {
  const base = snapshotFor(FIXTURES[1]);
  const idle = {
    ...base,
    work: { ...base.work, lifecycle: 'listening' },
    activeRunSpans: undefined,
    activityElapsedMs: undefined,
    sessionStart: NOW - 3_600_000,
    idleMs: 1_713_000, // deck showed 000:28'33
    updatedAt: NOW - 5_000, // snapshot froze 5s ago
  };
  const rows = deriveAgents([idle], { now: NOW });
  assert.equal(rows[0]?.state, 'parked');
  assert.equal(rows[0]?.time, "028:38'00", 'idleMs plus snapshot age');
});

test('working time column adds snapshot-age drift to the span clock', () => {
  const base = snapshotFor(FIXTURES[1]);
  const withSpans = {
    ...base,
    activityElapsedMs: undefined,
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
  assert.equal(rows[0]?.time, "004:27'00", 'newest root span elapsed plus drift');
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

test('startBoardWatch repaints on snapshot directory events', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'cockpit-watch-'));
  try {
    let refreshes = 0;
    const board = startBoardWatch(dir, () => {
      refreshes += 1;
    });
    await writeFile(
      path.join(dir, 'sess-watch.json'),
      JSON.stringify(snapshotFor(FIXTURES[1])),
      'utf8',
    );
    await waitFor(() => Promise.resolve(refreshes > 0));
    board.stop();
    assert.ok(refreshes > 0, 'watch fired at least one repaint');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
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
