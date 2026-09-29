import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import cockpitTelemetry from '../index.ts';

type Handler = (...args: unknown[]) => unknown;

class FakePi {
  readonly channels = new Map<string, Handler>();
  readonly lifecycle = new Map<string, Handler>();

  readonly events = {
    on: (channel: string, handler: Handler): (() => void) => {
      this.channels.set(channel, handler);
      return () => this.channels.delete(channel);
    },
  };

  on(event: string, handler: Handler): () => void {
    this.lifecycle.set(event, handler);
    return () => this.lifecycle.delete(event);
  }
}

async function waitFor(check: () => Promise<boolean>): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail('condition not reached within the wait window');
}

const headerEvent = {
  protocol: 1,
  activity: null,
  selection: null,
  suggestion: null,
  work: { lifecycle: 'listening', titles: [], color: 'accent' },
  diagnostics: null,
  backgroundActivity: false,
  approvalRequired: false,
  blocked: false,
  counters: { agents: { active: 0, total: 0 } },
  progress: [],
} as const;

test('factory subscribes to the header channel and session lifecycle', () => {
  const pi = new FakePi();
  cockpitTelemetry(pi as never);

  assert.deepEqual([...pi.channels.keys()].sort(), ['galactica-status:header']);
  assert.ok(pi.lifecycle.has('session_start'));
  assert.ok(pi.lifecycle.has('session_shutdown'));
});

test('live wiring mirrors a header event into the state directory', async () => {
  const stateDir = await mkdtemp(path.join(tmpdir(), 'cockpit-wiring-'));
  const previous = process.env.PI_VIMUX_STARSHIP_STATE_DIR;
  process.env.PI_VIMUX_STARSHIP_STATE_DIR = stateDir;
  try {
    const pi = new FakePi();
    cockpitTelemetry(pi as never);

    pi.lifecycle.get('session_start')?.(
      { type: 'session_start', reason: 'startup' },
      {
        cwd: '/home/dev/project',
        sessionManager: { getSessionId: () => 'sess-wired' },
      },
    );
    pi.channels.get('galactica-status:header')?.(headerEvent);

    const snapshot = path.join(stateDir, 'sess-wired.json');
    await waitFor(async () => (await readdir(stateDir)).length > 0);
    const payload = JSON.parse(await readFile(snapshot, 'utf8'));
    assert.equal(payload.sessionId, 'sess-wired');
    assert.equal(payload.cwd, '/home/dev/project');
    assert.equal(payload.pid, process.pid);
    assert.equal(payload.work.lifecycle, 'listening');

    pi.lifecycle.get('session_shutdown')?.({
      type: 'session_shutdown',
      reason: 'quit',
    });
    await waitFor(async () => (await readdir(stateDir)).length === 0);
  } finally {
    if (previous === undefined) delete process.env.PI_VIMUX_STARSHIP_STATE_DIR;
    else process.env.PI_VIMUX_STARSHIP_STATE_DIR = previous;
    await rm(stateDir, { recursive: true, force: true });
  }
});
