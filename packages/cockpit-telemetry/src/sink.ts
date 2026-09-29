import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

export type SnapshotSinkOptions = {
  /** Overrides the snapshot directory (tests inject a tmp path). */
  stateDir?: string;
  /** Overrides the reported pid (tests inject a stable number). */
  pid?: number;
  /** Overrides the clock (tests inject a controllable now). */
  now?: () => number;
  /** Mirrors the header deck's activity clock; null while idle. */
  activityClock?: () => number | null;
};

export function defaultStateDir(): string {
  const override = process.env.PI_VIMUX_STARSHIP_STATE_DIR;
  if (override) return override;
  const base = process.env.XDG_STATE_HOME ?? path.join(homedir(), '.local', 'state');
  return path.join(base, 'pi-vimux-starship', 'agents');
}

function isSessionId(value: unknown): value is string {
  return typeof value === 'string' && value !== '' && !value.includes('/');
}

function isHeaderEvent(
  event: unknown,
): event is { protocol: 1 } & Record<string, unknown> {
  if (typeof event !== 'object' || event === null || Array.isArray(event)) {
    return false;
  }
  return (event as { protocol?: unknown }).protocol === 1;
}

export function createSnapshotSink(options: SnapshotSinkOptions = {}) {
  const stateDir = options.stateDir ?? defaultStateDir();
  const pid = options.pid ?? process.pid;
  const now = options.now ?? Date.now;
  const activityClock = options.activityClock ?? (() => null);
  let identity: {
    sessionId: string;
    cwd: string;
    sessionStart: number;
  } | null = null;
  let writeSequence = 0;

  return {
    onSessionStart(sessionId: unknown, cwd: unknown): void {
      if (!isSessionId(sessionId) || typeof cwd !== 'string') return;
      identity = { sessionId, cwd, sessionStart: now() };
    },

    async onHeaderEvent(event: unknown): Promise<void> {
      try {
        if (!identity || !isHeaderEvent(event)) return;
        const activityElapsedMs = activityClock();
        const payload = {
          ...event,
          sessionId: identity.sessionId,
          pid,
          cwd: identity.cwd,
          sessionStart: identity.sessionStart,
          updatedAt: now(),
          ...(typeof activityElapsedMs === 'number' &&
          Number.isFinite(activityElapsedMs)
            ? { activityElapsedMs }
            : {}),
        };
        await mkdir(stateDir, { recursive: true });
        const target = path.join(stateDir, `${identity.sessionId}.json`);
        const temp = `${target}.${pid}.${(writeSequence += 1)}.tmp`;
        await writeFile(temp, JSON.stringify(payload), 'utf8');
        await rename(temp, target);
      } catch {
        // Fail soft: telemetry must never disturb the host session.
      }
    },

    async onSessionShutdown(): Promise<void> {
      try {
        if (!identity) return;
        await rm(path.join(stateDir, `${identity.sessionId}.json`), {
          force: true,
        });
        identity = null;
      } catch {
        // Fail soft: telemetry must never disturb the host session.
      }
    },
  };
}

export type SnapshotSink = ReturnType<typeof createSnapshotSink>;
