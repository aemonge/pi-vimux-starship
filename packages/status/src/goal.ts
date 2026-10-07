import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getAgentDir } from '@earendil-works/pi-coding-agent';

export const GOAL_STATE_ENTRY_TYPE = 'goal-state';

export const GOAL_HEADER_STATUSES = [
  'active',
  'queued',
  'paused',
  'blocked',
  'usage_limited',
  'budget_limited',
  'complete',
] as const;

export type GoalHeaderStatus = (typeof GOAL_HEADER_STATUSES)[number];

export interface GoalHeaderState {
  id: string;
  status: GoalHeaderStatus;
  automaticModelTurns: number;
  waiting: boolean;
  objective?: string;
  elapsedSeconds?: number;
  tasksDone?: number;
  tasksActive?: number;
  tasksTotal?: number;
  tokensUsed?: number;
  tokenBudget?: number;
}

const STATUS_SET = new Set<string>(GOAL_HEADER_STATUSES);
const MAX_GOAL_ID_POINTS = 128;
const MAX_HEADER_PROGRESS = 9_999;
const GOAL_PROMPT_MARKER =
  /<!-- pi-goal-(?:prompt|continuation):[A-Za-z0-9:._-]{1,300} -->/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseGoalHeaderState(value: unknown): GoalHeaderState | null {
  if (value === null) return null;
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || !value.id || value.id !== value.id.trim()) {
    return null;
  }
  if (Array.from(value.id).length > MAX_GOAL_ID_POINTS) return null;
  if (typeof value.status !== 'string' || !STATUS_SET.has(value.status)) return null;
  const automaticModelTurns =
    typeof value.automaticModelTurns === 'number' &&
    Number.isSafeInteger(value.automaticModelTurns) &&
    value.automaticModelTurns >= 0
      ? Math.min(value.automaticModelTurns, MAX_HEADER_PROGRESS)
      : 0;
  const boundedCount = (input: unknown): number | undefined =>
    typeof input === 'number' &&
    Number.isSafeInteger(input) &&
    input >= 0 &&
    input <= 9_999
      ? input
      : undefined;
  const objective =
    typeof value.objective === 'string' && value.objective.trim() !== ''
      ? value.objective.replace(/\s+/gu, ' ').trim().slice(0, 160)
      : undefined;
  const elapsedSeconds =
    typeof value.elapsedSeconds === 'number' &&
    Number.isFinite(value.elapsedSeconds) &&
    value.elapsedSeconds >= 0
      ? Math.min(value.elapsedSeconds, 3_600_000)
      : undefined;
  const tokensUsed =
    typeof value.tokensUsed === 'number' &&
    Number.isFinite(value.tokensUsed) &&
    value.tokensUsed >= 0
      ? Math.min(value.tokensUsed, 9_999_999_999)
      : undefined;
  return {
    id: value.id,
    status: value.status as GoalHeaderStatus,
    automaticModelTurns,
    waiting: value.status === 'active' && isRecord(value.waiting),
    ...(objective !== undefined ? { objective } : {}),
    ...(elapsedSeconds !== undefined ? { elapsedSeconds } : {}),
    ...(boundedCount(value.tasksDone) !== undefined
      ? { tasksDone: boundedCount(value.tasksDone) }
      : {}),
    ...(boundedCount(value.tasksActive) !== undefined
      ? { tasksActive: boundedCount(value.tasksActive) }
      : {}),
    ...(boundedCount(value.tasksTotal) !== undefined
      ? { tasksTotal: boundedCount(value.tasksTotal) }
      : {}),
    ...(tokensUsed !== undefined ? { tokensUsed } : {}),
    ...(boundedCount(value.tokenBudget) !== undefined &&
    (boundedCount(value.tokenBudget) ?? 0) > 0
      ? { tokenBudget: boundedCount(value.tokenBudget) }
      : {}),
  };
}

export function restoreGoalHeaderState(
  entries: readonly unknown[],
): GoalHeaderState | null {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (
      !isRecord(entry) ||
      entry.type !== 'custom' ||
      entry.customType !== GOAL_STATE_ENTRY_TYPE
    ) {
      continue;
    }
    const data = isRecord(entry.data) ? entry.data : undefined;
    return parseGoalHeaderState(data?.goal);
  }
  return null;
}

export function isGoalOwnedPrompt(value: unknown): boolean {
  return typeof value === 'string' && GOAL_PROMPT_MARKER.test(value);
}

export function sameGoalHeaderState(
  left: GoalHeaderState | null,
  right: GoalHeaderState | null,
): boolean {
  return (
    left === right ||
    (left !== null &&
      right !== null &&
      left.id === right.id &&
      left.status === right.status &&
      left.automaticModelTurns === right.automaticModelTurns &&
      left.waiting === right.waiting &&
      left.objective === right.objective &&
      left.tasksDone === right.tasksDone &&
      left.tasksActive === right.tasksActive &&
      left.tasksTotal === right.tasksTotal &&
      left.tokensUsed === right.tokensUsed &&
      left.tokenBudget === right.tokenBudget &&
      Math.floor((left.elapsedSeconds ?? 0) / 10) ===
        Math.floor((right.elapsedSeconds ?? 0) / 10))
  );
}

export function parseGoalAutomaticTurnLimit(value: unknown): number | undefined {
  if (!isRecord(value)) return undefined;
  const limits = isRecord(value.continuationLimits)
    ? value.continuationLimits
    : undefined;
  const limit = limits?.automaticTurns;
  return typeof limit === 'number' &&
    Number.isSafeInteger(limit) &&
    limit > 0 &&
    limit <= MAX_HEADER_PROGRESS
    ? limit
    : undefined;
}

export async function loadGoalAutomaticTurnLimit(): Promise<number | undefined> {
  try {
    const raw = await readFile(join(getAgentDir(), 'pi-goal.json'), 'utf8');
    return parseGoalAutomaticTurnLimit(JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
}
