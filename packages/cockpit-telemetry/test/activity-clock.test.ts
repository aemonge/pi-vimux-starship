import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createSnapshotSink } from '../src/sink.ts';

const headerEvent = {
  protocol: 1,
  activity: null,
  selection: null,
  suggestion: null,
  work: { lifecycle: 'working', titles: ['Work'], color: 'accent' },
  diagnostics: null,
  backgroundActivity: false,
  approvalRequired: false,
  blocked: false,
  counters: { agents: { active: 0, total: 0 } },
  progress: [],
} as const;

async function freshDir(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'cockpit-activity-'));
}

test('activityElapsedMs is stamped when the activity clock reports a value', async () => {
  const stateDir = await freshDir();
  let clock = 41_000;
  const sink = createSnapshotSink({
    stateDir,
    pid: 1,
    now: () => 9_000,
    activityClock: () => clock,
  });

  await sink.onSessionStart('sess-clock', '/w');
  await sink.onHeaderEvent(headerEvent);

  const payload = JSON.parse(
    await readFile(path.join(stateDir, 'sess-clock.json'), 'utf8'),
  );
  assert.equal(payload.activityElapsedMs, 41_000);

  clock = 45_000;
  await sink.onHeaderEvent(headerEvent);
  const updated = JSON.parse(
    await readFile(path.join(stateDir, 'sess-clock.json'), 'utf8'),
  );
  assert.equal(updated.activityElapsedMs, 45_000);

  await rm(stateDir, { recursive: true, force: true });
});

test('activityElapsedMs is omitted while the clock is idle (null)', async () => {
  const stateDir = await freshDir();
  const sink = createSnapshotSink({
    stateDir,
    pid: 1,
    now: () => 5,
    activityClock: () => null,
  });

  await sink.onSessionStart('sess-idle', '/w');
  await sink.onHeaderEvent(headerEvent);

  const payload = JSON.parse(
    await readFile(path.join(stateDir, 'sess-idle.json'), 'utf8'),
  );
  assert.equal('activityElapsedMs' in payload, false);

  await rm(stateDir, { recursive: true, force: true });
});
