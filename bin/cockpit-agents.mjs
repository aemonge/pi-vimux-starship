#!/usr/bin/env node
// pi-vimux-starship command center — live triage board over cockpit snapshots.
// Render look is the Human-validated frozen contract (commit 4aa1cfa): the
// header, row grammar, palette, and spacing below must not drift.
// Layout: STATE → AGENT → TASK → TIME, dynamic full terminal width.

import { readdir, readFile, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const THEME = {
  accent: '#076678', // blue — attention
  titlePurple: '#5c5ca8', // violet — title
  cyan: '#427b58', // project names
  green: '#689d6a', // working
  yellow: '#b57614', // secondary hints
  text: '#5c3a2e', // subject lines
  muted: '#574d47', // ids, time, counts
  dim: '#796d63', // parked, gone
};

const ICON = '󰆧'; // deck PWD glyph (matches header gauge)
const TITLE = 'pi-vimux-starship command center';
const TIME_WIDTH = 8;
const ID_WIDTH = 7; // git-style short id: pi --session <id> resolves it

export function colorWanted({
  tty = process.stdout.isTTY ?? false,
  env = process.env,
} = {}) {
  return Boolean(tty) && !env.NO_COLOR;
}

export function watchWanted({ tty, watch = false, json = false, once = false }) {
  if (watch) return true;
  if (json || once) return false;
  return Boolean(tty);
}

export function defaultStateDir() {
  // Mirrors packages/cockpit-telemetry/src/sink.ts — keep the two in step.
  const override = process.env.PI_VIMUX_STARSHIP_STATE_DIR;
  if (override) return override;
  const base = process.env.XDG_STATE_HOME ?? path.join(homedir(), '.local', 'state');
  return path.join(base, 'pi-vimux-starship', 'agents');
}

export async function readSnapshots(stateDir) {
  let names;
  try {
    names = await readdir(stateDir);
  } catch {
    return [];
  }
  const snapshots = [];
  for (const name of names) {
    if (!name.endsWith('.json')) continue;
    try {
      const parsed = JSON.parse(await readFile(path.join(stateDir, name), 'utf8'));
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        parsed.protocol === 1 &&
        typeof parsed.sessionId === 'string' &&
        typeof parsed.updatedAt === 'number'
      ) {
        snapshots.push(parsed);
      }
    } catch {
      // Corrupt snapshot: skip it, never break the board.
    }
  }
  return snapshots;
}

const ATTENTION_REASONS = {
  'requesting-validation': 'validation',
  'requesting-redirection': 'redirection',
  'requesting-input': 'input',
  'awaiting-resume': 'resume',
};

const WORKING_LIFECYCLES = new Set([
  'understanding',
  'working',
  'assuring',
  'learning',
  'answering',
]);

const STATE_RANK = { attention: 0, working: 1, parked: 2, gone: 3 };

function defaultPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
}

// Mirrors the header deck's path form (packages/header/src/gauge.ts):
// `~` for home, `~/rest` under it, raw elsewhere — never a bare basename.
function formatProjectPath(cwd, home = process.env.HOME ?? '') {
  if (!home) return cwd;
  if (cwd === home) return '~';
  if (cwd.startsWith(`${home}/`)) return `~${cwd.slice(home.length)}`;
  return cwd;
}

export async function pruneDeadSnapshots(stateDir, { pidAlive } = {}) {
  const isPidAlive = pidAlive ?? defaultPidAlive;
  const removed = [];
  for (const snapshot of await readSnapshots(stateDir)) {
    if (typeof snapshot.pid !== 'number' || isPidAlive(snapshot.pid)) continue;
    try {
      await rm(path.join(stateDir, `${snapshot.sessionId}.json`), {
        force: true,
      });
      removed.push(snapshot.sessionId);
    } catch {
      // Pruning is best-effort hygiene, never a board failure.
    }
  }
  return removed;
}

function formatClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const seconds = total % 60;
  const two = (value) => String(value).padStart(2, '0');
  return `${hours}:${two(minutes)}:${two(seconds)}`;
}

export function deriveAgents(snapshots, { now = Date.now(), pidAlive } = {}) {
  const isPidAlive = pidAlive ?? defaultPidAlive;
  const rows = snapshots.map((snapshot) => {
    const lifecycle = snapshot.work?.lifecycle ?? 'listening';
    const subject = snapshot.work?.titles?.[0] ?? snapshot.selection?.titles?.[0] ?? '';
    const spans = Array.isArray(snapshot.activeRunSpans) ? snapshot.activeRunSpans : [];
    const rootSpanElapsed = spans
      .filter((span) => span && !span.parent && Number.isFinite(span.elapsedMs))
      .reduce((max, span) => Math.max(max, span.elapsedMs), -1);
    const drift = Math.max(0, now - (snapshot.updatedAt ?? now));
    let state = 'parked';
    let task = subject || 'parked';
    let sub = '';

    if (snapshot.blocked) {
      state = 'attention';
      task = 'blocked';
      sub = subject;
    } else {
      const reason = ATTENTION_REASONS[snapshot.suggestion];
      if (snapshot.approvalRequired || reason) {
        state = 'attention';
        task = reason ?? 'validation';
        sub = subject;
      } else if (WORKING_LIFECYCLES.has(lifecycle) || spans.length > 0) {
        state = 'working';
        task = subject || 'working';
      }
    }

    // Liveness keys on pid only: idle sessions stop emitting header events,
    // so a frozen heartbeat does not mean dead. Stale-but-alive parks.
    const dead = typeof snapshot.pid === 'number' && !isPidAlive(snapshot.pid);
    if (dead) {
      state = 'gone';
      task = subject || 'gone';
      sub = '';
    }

    // Deck-clock match: the sink's `activityElapsedMs` mirrors the header
    // timer tile tick-for-tick; idle rows ride the deck idle clock (idleMs
    // is omitted at zero, so absent means 0); spans are the legacy fallback.
    // Both event clocks freeze at the last event and drift forward by
    // snapshot age. Gone rows report the session lifetime.
    const sessionAgeMs = now - (snapshot.sessionStart ?? now);
    const elapsedMs =
      state === 'gone'
        ? sessionAgeMs
        : Number.isFinite(snapshot.activityElapsedMs)
          ? snapshot.activityElapsedMs + drift
          : rootSpanElapsed >= 0
            ? rootSpanElapsed + drift
            : (Number.isFinite(snapshot.idleMs) ? snapshot.idleMs : 0) + drift;

    return {
      state,
      id: String(snapshot.sessionId).slice(0, ID_WIDTH),
      project: formatProjectPath(String(snapshot.cwd ?? '')) || '?',
      task,
      sub,
      time: formatClock(elapsedMs),
      updatedAt: snapshot.updatedAt,
    };
  });
  rows.sort(
    (a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || b.updatedAt - a.updatedAt,
  );
  return rows;
}

function makePainters(enabled) {
  const paint = (hex) => (text) =>
    enabled
      ? `\u001b[38;2;${parseInt(hex.slice(1, 3), 16)};${parseInt(
          hex.slice(3, 5),
          16,
        )};${parseInt(hex.slice(5, 7), 16)}m${text}\u001b[39m`
      : text;
  return {
    accent: paint(THEME.accent),
    titlePurple: paint(THEME.titlePurple),
    cyan: paint(THEME.cyan),
    green: paint(THEME.green),
    text: paint(THEME.text),
    muted: paint(THEME.muted),
    dim: paint(THEME.dim),
    bold: (chunk) => (enabled ? `\u001b[1m${chunk}\u001b[22m` : chunk),
  };
}

function resolveColumns(explicit) {
  const columns =
    explicit ?? process.stdout.columns ?? Number(process.env.COLUMNS ?? 80);
  return Number.isFinite(columns) && columns > 0 ? columns : 80;
}

// Narrow-width truncation guard: cells never exceed their column; the frozen
// subline keeps its natural overflow (the validated sample overflows at 80).
function fitRight(value, width) {
  const points = [...value];
  if (points.length >= width) return points.slice(0, width).join('');
  return value + ' '.repeat(width - points.length);
}

function fitLeft(value, width) {
  const points = [...value];
  if (points.length >= width) return points.slice(0, width).join('');
  return ' '.repeat(width - points.length) + value;
}

export function renderBoard(rows, { columns, color } = {}) {
  const width = resolveColumns(columns);
  const painters = makePainters(color ?? colorWanted());

  const markers = {
    attention: { glyph: '!', paint: painters.accent },
    working: { glyph: '●', paint: painters.green },
    parked: { glyph: '◌', paint: painters.dim },
    gone: { glyph: '×', paint: painters.dim },
  };

  const live = rows.filter((row) => row.state !== 'gone').length;
  const attention = rows.filter((row) => row.state === 'attention').length;

  const titleLeft = `${ICON} ${TITLE}`;
  const headerRightPlain = `${live} agents · ${attention} attention`;
  const headerGap = ' '.repeat(
    Math.max(1, width - [...titleLeft].length - [...headerRightPlain].length),
  );

  if (rows.length === 0) {
    return (
      `${painters.bold(painters.titlePurple(titleLeft))}${headerGap}` +
      `${painters.muted(`${live} agents · `)}${painters.accent(`${attention} attention`)}\n\n` +
      `${painters.dim('no live agents')}\n`
    );
  }

  const projectWidth = Math.max(20, ...rows.map((row) => [...row.project].length)) + 2;
  const rowPrefixWidth = 2 + ID_WIDTH + 2 + projectWidth + 2;
  const taskWidth = Math.max(2, width - rowPrefixWidth - TIME_WIDTH - 2);

  const blocks = [];
  for (const row of rows) {
    const marker = markers[row.state];
    const taskPaint =
      row.state === 'attention'
        ? (chunk) => painters.bold(painters.accent(chunk))
        : painters.text;
    const main =
      `${marker.paint(marker.glyph)} ` +
      `${painters.muted(fitRight(row.id, ID_WIDTH))}  ` +
      `${painters.cyan(fitRight(row.project, projectWidth))}  ` +
      `${taskPaint(fitRight(row.task, taskWidth))}` +
      `  ${painters.muted(fitLeft(row.time, TIME_WIDTH))}`;
    blocks.push(main);
    if (row.sub) {
      blocks.push(`${' '.repeat(rowPrefixWidth)}${painters.text(row.sub)}`);
      blocks.push('');
    }
  }

  return (
    `${painters.bold(painters.titlePurple(titleLeft))}${headerGap}` +
    `${painters.muted(`${live} agents · `)}${painters.accent(`${attention} attention`)}\n\n` +
    `${blocks.join('\n')}\n`
  );
}

export function renderJson(snapshots) {
  return JSON.stringify(snapshots, null, 2);
}

async function paintOnce({ json, stateDir }) {
  await pruneDeadSnapshots(stateDir);
  const snapshots = await readSnapshots(stateDir);
  if (json) {
    process.stdout.write(`${renderJson(snapshots)}\n`);
    return;
  }
  const rows = deriveAgents(snapshots);
  process.stdout.write(renderBoard(rows));
}

async function main(argv) {
  const json = argv.includes('--json');
  const once = argv.includes('--once');
  const intervalFlag = argv.indexOf('--interval');
  const intervalSeconds = intervalFlag >= 0 ? Number(argv[intervalFlag + 1] ?? 2) : 2;
  const intervalMs =
    (Number.isFinite(intervalSeconds) && intervalSeconds > 0 ? intervalSeconds : 2) *
    1000;
  const stateDir = defaultStateDir();
  const watch = watchWanted({
    tty: process.stdout.isTTY ?? false,
    watch: argv.includes('-w') || argv.includes('--watch'),
    json,
    once,
  });

  await paintOnce({ json, stateDir });
  if (!watch) return;

  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    process.stdout.write('\u001b[2J\u001b[H');
    await paintOnce({ json, stateDir });
  }
}

const invokedAsScript = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;

if (invokedAsScript) {
  await main(process.argv.slice(2));
}
