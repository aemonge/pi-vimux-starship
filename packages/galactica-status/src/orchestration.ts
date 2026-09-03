import { promises as fs } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import type {
  GalacticaStatusConfig,
  OrchestrationState,
  WorkflowState,
} from './types.ts';

const ORCHESTRATION_CANDIDATES = [
  '.pi/status/orchestration.json',
  '.pi/orchestration.json',
  '.taskflow/state.json',
  '.taskflow/run-state.json',
  '.galactica/orchestration.json',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function timestamp(value: unknown): number | undefined {
  const numeric = number(value);
  if (numeric !== undefined) return numeric;
  const string = text(value);
  if (!string) return undefined;
  const parsed = Date.parse(string);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeWorkflowState(value: unknown): WorkflowState {
  const state = text(value)?.toLowerCase();
  switch (state) {
    case 'running':
    case 'active':
    case 'in-progress':
    case 'working':
      return 'running';
    case 'blocked':
    case 'failed':
    case 'error':
    case 'failed-verification':
      return 'blocked';
    case 'complete':
    case 'completed':
    case 'done':
    case 'success':
      return 'complete';
    case 'idle':
    case 'paused':
    case 'waiting':
      return 'idle';
    default:
      return 'unknown';
  }
}

function activeWorkerCount(value: Record<string, unknown>): number {
  const explicit = number(
    value.activeWorkers ?? value.workerCount ?? value.activeAgents ?? value.agentCount,
  );
  if (explicit !== undefined) return Math.max(0, Math.trunc(explicit));

  const workers = Array.isArray(value.workers)
    ? value.workers
    : Array.isArray(value.agents)
      ? value.agents
      : [];
  return workers.filter((worker) => {
    if (!isRecord(worker)) return false;
    return ['running', 'active', 'working', 'in-progress'].includes(
      text(worker.status ?? worker.state)?.toLowerCase() ?? '',
    );
  }).length;
}

export function parseOrchestrationState(
  value: unknown,
  options: { source: string; now?: number; fallbackUpdatedAt?: number },
): OrchestrationState {
  if (!isRecord(value)) throw new Error('orchestration state is not an object');
  const now = options.now ?? Date.now();
  const workflow = isRecord(value.workflow) ? value.workflow : {};
  const openspec = isRecord(value.openspec) ? value.openspec : {};
  const task = isRecord(value.task) ? value.task : {};

  const phase = text(value.phase ?? workflow.phase ?? workflow.node ?? value.role);
  const state = normalizeWorkflowState(value.state ?? value.status ?? workflow.state);
  const currentTask = text(
    value.currentTask ??
      value.current_task ??
      task.title ??
      task.name ??
      value.blockedReason,
  );
  const openspecTaskId = text(
    value.openspecTaskId ??
      value.openspec_task_id ??
      openspec.taskId ??
      openspec.task_id,
  );
  const startedAt = timestamp(
    value.startedAt ?? value.started_at ?? workflow.startedAt ?? workflow.started_at,
  );
  const explicitElapsed = number(
    value.elapsedMs ?? value.elapsed_ms ?? workflow.elapsedMs,
  );
  const elapsedMs =
    explicitElapsed ?? (startedAt ? Math.max(0, now - startedAt) : undefined);
  const updatedAt =
    timestamp(value.updatedAt ?? value.updated_at ?? value.timestamp) ??
    options.fallbackUpdatedAt ??
    now;
  const staleAfterMs = 600_000;
  const activeWorkers = activeWorkerCount(value);

  if (
    state === 'unknown' &&
    !phase &&
    !currentTask &&
    activeWorkers === 0 &&
    elapsedMs === undefined
  ) {
    throw new Error('orchestration state has no recognized workflow fields');
  }

  return {
    ...(phase ? { phase } : {}),
    state,
    activeWorkers,
    ...(currentTask ? { currentTask } : {}),
    ...(openspecTaskId ? { openspecTaskId } : {}),
    ...(startedAt ? { startedAt } : {}),
    ...(elapsedMs !== undefined ? { elapsedMs: Math.max(0, elapsedMs) } : {}),
    meta: {
      source: options.source,
      refreshedAt: now,
      attemptedAt: now,
      updatedAt,
      staleAfterMs,
      stale: now - updatedAt > staleAfterMs,
    },
  };
}

async function existingFile(paths: readonly string[]): Promise<string | undefined> {
  for (const path of paths) {
    try {
      if ((await fs.stat(path)).isFile()) return path;
    } catch {
      // Optional state files may only exist while a workflow is active.
    }
  }
  return undefined;
}

export async function detectOrchestrationPath(
  projectRoot: string,
  configuredPath?: string | null,
): Promise<string | undefined> {
  if (configuredPath) {
    const path = isAbsolute(configuredPath)
      ? configuredPath
      : resolve(projectRoot, configuredPath);
    return (await existingFile([path])) ?? path;
  }
  return existingFile(
    ORCHESTRATION_CANDIDATES.map((path) => resolve(projectRoot, path)),
  );
}

export async function collectOrchestration(options: {
  projectRoot: string;
  config: GalacticaStatusConfig['orchestration'];
  now?: number;
}): Promise<{ state?: OrchestrationState; sourcePath?: string }> {
  const sourcePath = await detectOrchestrationPath(
    options.projectRoot,
    options.config.stateFile,
  );
  if (!sourcePath) return {};

  try {
    const stat = await fs.stat(sourcePath);
    const parsed = JSON.parse(await fs.readFile(sourcePath, 'utf8')) as unknown;
    return {
      sourcePath,
      state: parseOrchestrationState(parsed, {
        source: sourcePath,
        now: options.now,
        fallbackUpdatedAt: stat.mtimeMs,
      }),
    };
  } catch (error) {
    const code = isRecord(error) ? error.code : undefined;
    if (code === 'ENOENT' && !options.config.stateFile) return {};
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`failed to read orchestration state: ${message}`);
  }
}
