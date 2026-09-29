import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createSnapshotSink } from '../src/sink.ts';

const headerEvent = {
  protocol: 1,
  activity: null,
  selection: { source: 'subject', titles: ['Session subject'], color: 'accent' },
  suggestion: null,
  work: { lifecycle: 'working', titles: ['Some work'], color: 'accent' },
  diagnostics: null,
  backgroundActivity: false,
  approvalRequired: false,
  blocked: false,
  counters: { agents: { active: 0, total: 0 } },
  progress: [],
} as const;

async function freshDir(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'cockpit-telemetry-'));
}

test('payload holds exactly the event facts plus session identity', async () => {
  const stateDir = await freshDir();
  let clock = 1_000;
  const sink = createSnapshotSink({
    stateDir,
    pid: 4242,
    now: () => clock,
  });

  await sink.onSessionStart('sess-alpha', '/home/dev/project');
  clock = 2_000;
  await sink.onHeaderEvent(headerEvent);

  const raw = await readFile(path.join(stateDir, 'sess-alpha.json'), 'utf8');
  const payload = JSON.parse(raw);
  assert.deepEqual(payload, {
    ...headerEvent,
    sessionId: 'sess-alpha',
    pid: 4242,
    cwd: '/home/dev/project',
    sessionStart: 1_000,
    updatedAt: 2_000,
  });
  assert.equal(
    Object.keys(payload).length,
    Object.keys(headerEvent).length + 5,
    'snapshot must not persist fields beyond the event plus identity',
  );

  await rm(stateDir, { recursive: true, force: true });
});

test('sessionStart is captured at session_start, updatedAt on each write', async () => {
  const stateDir = await freshDir();
  let clock = 10_000;
  const sink = createSnapshotSink({ stateDir, pid: 1, now: () => clock });

  await sink.onSessionStart('sess-beta', '/w');
  clock = 11_000;
  await sink.onHeaderEvent(headerEvent);
  clock = 12_000;
  await sink.onHeaderEvent(headerEvent);

  const payload = JSON.parse(
    await readFile(path.join(stateDir, 'sess-beta.json'), 'utf8'),
  );
  assert.equal(payload.sessionStart, 10_000);
  assert.equal(payload.updatedAt, 12_000);

  await rm(stateDir, { recursive: true, force: true });
});

test('writes are atomic: valid JSON, never a partial file, no tmp leftovers', async () => {
  const stateDir = await freshDir();
  const sink = createSnapshotSink({ stateDir, pid: 1, now: () => 5_000 });

  await sink.onSessionStart('sess-gamma', '/w');
  for (let index = 0; index < 5; index += 1) {
    await sink.onHeaderEvent({ ...headerEvent, blocked: index % 2 === 0 });
  }

  const entries = await readdir(stateDir);
  assert.deepEqual(entries, ['sess-gamma.json']);
  const payload = JSON.parse(
    await readFile(path.join(stateDir, 'sess-gamma.json'), 'utf8'),
  );
  assert.equal(payload.blocked, false);

  await rm(stateDir, { recursive: true, force: true });
});

test('header events before session_start fail soft and write nothing', async () => {
  const stateDir = await freshDir();
  const sink = createSnapshotSink({ stateDir, pid: 1, now: () => 1 });

  await assert.doesNotReject(sink.onHeaderEvent(headerEvent));
  assert.deepEqual(await readdir(stateDir), []);

  await rm(stateDir, { recursive: true, force: true });
});

test('malformed events fail soft and persist nothing', async () => {
  const stateDir = await freshDir();
  const sink = createSnapshotSink({ stateDir, pid: 1, now: () => 1 });
  await sink.onSessionStart('sess-delta', '/w');

  for (const malformed of [null, undefined, 42, 'garbage', [], { protocol: 2 }]) {
    await assert.doesNotReject(sink.onHeaderEvent(malformed));
  }
  assert.deepEqual(await readdir(stateDir), []);

  await rm(stateDir, { recursive: true, force: true });
});

test('unwritable state directory fails soft', async () => {
  const parent = await freshDir();
  const blocked = path.join(parent, 'not-a-dir');
  await writeFile(blocked, 'file where the directory should be', 'utf8');
  const sink = createSnapshotSink({
    stateDir: path.join(blocked, 'agents'),
    pid: 1,
    now: () => 1,
  });

  await sink.onSessionStart('sess-epsilon', '/w');
  await assert.doesNotReject(sink.onHeaderEvent(headerEvent));

  await rm(parent, { recursive: true, force: true });
});

test('missing state directory is created on demand', async () => {
  const parent = await freshDir();
  const stateDir = path.join(parent, 'nested', 'agents');
  const sink = createSnapshotSink({ stateDir, pid: 7, now: () => 3_000 });

  await sink.onSessionStart('sess-zeta', '/w');
  await sink.onHeaderEvent(headerEvent);

  const payload = JSON.parse(
    await readFile(path.join(stateDir, 'sess-zeta.json'), 'utf8'),
  );
  assert.equal(payload.pid, 7);

  await rm(parent, { recursive: true, force: true });
});

test('prune deletes the session snapshot on shutdown', async () => {
  const stateDir = await freshDir();
  const sink = createSnapshotSink({ stateDir, pid: 1, now: () => 1 });
  await sink.onSessionStart('sess-eta', '/w');
  await sink.onHeaderEvent(headerEvent);
  await assert.ok(
    (await readdir(stateDir)).includes('sess-eta.json'),
    'snapshot written before shutdown',
  );

  await sink.onSessionShutdown();
  assert.deepEqual(await readdir(stateDir), []);

  await assert.doesNotReject(sink.onSessionShutdown());

  await rm(stateDir, { recursive: true, force: true });
});

test('mkdir helper stays silent when the directory already exists', async () => {
  const stateDir = await freshDir();
  await mkdir(stateDir, { recursive: true });
  const sink = createSnapshotSink({ stateDir, pid: 1, now: () => 1 });
  await sink.onSessionStart('sess-0', '/w');
  await sink.onHeaderEvent(headerEvent);
  assert.deepEqual(await readdir(stateDir), ['sess-0.json']);

  await rm(stateDir, { recursive: true, force: true });
});
