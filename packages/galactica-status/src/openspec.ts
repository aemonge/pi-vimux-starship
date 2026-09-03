import { promises as fs } from 'node:fs';
import { resolve, sep } from 'node:path';
import type {
  CommandRunner,
  OpenSpecOverview,
  OpenSpecState,
  OpenSpecTask,
} from './types.ts';

interface OpenSpecChangeRecord {
  name: string;
  completedTasks: number;
  totalTasks: number;
  lastModified: string;
  status: string;
}

interface OpenSpecListResult {
  changes: OpenSpecChangeRecord[];
  root?: { path?: string };
}

interface ApplyInstructionsResult {
  progress?: { total?: number; complete?: number };
  tasks: OpenSpecTask[];
  tasksPath?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function safeJson(text: string, label: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} returned malformed JSON: ${message}`);
  }
}

export function parseOpenSpecList(value: unknown): OpenSpecListResult {
  if (!isRecord(value) || !Array.isArray(value.changes)) {
    throw new Error('OpenSpec list result has no changes array');
  }

  const changes: OpenSpecChangeRecord[] = [];
  for (const item of value.changes) {
    if (!isRecord(item) || typeof item.name !== 'string') continue;
    const completedTasks = finiteNumber(item.completedTasks);
    const totalTasks = finiteNumber(item.totalTasks);
    if (completedTasks === undefined || totalTasks === undefined) continue;
    changes.push({
      name: item.name,
      completedTasks: Math.max(0, Math.trunc(completedTasks)),
      totalTasks: Math.max(0, Math.trunc(totalTasks)),
      lastModified: typeof item.lastModified === 'string' ? item.lastModified : '',
      status: typeof item.status === 'string' ? item.status : 'unknown',
    });
  }

  const root =
    isRecord(value.root) && typeof value.root.path === 'string'
      ? { path: value.root.path }
      : undefined;
  return { changes, root };
}

function cleanTaskTitle(text: string): string {
  return text
    .replace(/\s+/gu, ' ')
    .replace(
      /\s+(?:Acceptance\/evidence|Acceptance\/ evidence|Acceptance|Evidence|Dependencies|Estimate):.*$/iu,
      '',
    )
    .trim()
    .replace(/[.:]\s*$/u, '');
}

export function parseTaskHeadline(
  description: string,
  fallbackId: string,
  done: boolean,
): OpenSpecTask {
  const normalized = description.replace(/\s+/gu, ' ').trim();
  const idMatch = normalized.match(/^(\d+(?:\.\d+)*)\s+(.+)$/u);
  const id = idMatch?.[1] ?? fallbackId;
  const body = idMatch?.[2] ?? normalized;
  const kindMatch = body.match(/\b(Story|Spike|Lab|Hack)\b/iu);
  const kindText = kindMatch?.[1];
  const kind = kindText
    ? ((kindText[0]?.toUpperCase() + kindText.slice(1).toLowerCase()) as
        'Story' | 'Spike' | 'Lab' | 'Hack')
    : undefined;
  const title = cleanTaskTitle(
    kindMatch?.index === undefined ? body : body.slice(0, kindMatch.index),
  );
  return { id, title: title || id, ...(kind ? { kind } : {}), done };
}

export function parseTaskMarkdown(content: string): OpenSpecTask[] {
  const tasks: OpenSpecTask[] = [];
  const pattern = /^\s*-\s*\[([ xX])\]\s+(.+)$/gmu;
  let match: RegExpExecArray | null;
  let ordinal = 0;
  while ((match = pattern.exec(content)) !== null) {
    ordinal += 1;
    tasks.push(
      parseTaskHeadline(match[2] ?? '', String(ordinal), (match[1] ?? '') !== ' '),
    );
  }
  return tasks;
}

export function parseApplyInstructions(value: unknown): ApplyInstructionsResult {
  if (!isRecord(value) || !Array.isArray(value.tasks)) {
    throw new Error('OpenSpec apply instructions have no tasks array');
  }

  const tasks = value.tasks.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.description !== 'string') return [];
    return [
      parseTaskHeadline(
        item.description,
        typeof item.id === 'string' ? item.id : String(index + 1),
        item.done === true,
      ),
    ];
  });

  let tasksPath: string | undefined;
  if (isRecord(value.contextFiles) && Array.isArray(value.contextFiles.tasks)) {
    tasksPath = value.contextFiles.tasks.find(
      (path): path is string => typeof path === 'string',
    );
  }

  const progress = isRecord(value.progress)
    ? {
        total: finiteNumber(value.progress.total),
        complete: finiteNumber(value.progress.complete),
      }
    : undefined;

  return { tasks, tasksPath, progress };
}

function chooseChange(
  list: OpenSpecListResult,
  configuredChange?: string | null,
  environmentChange?: string,
): OpenSpecChangeRecord | undefined {
  const requested = configuredChange || environmentChange;
  if (!requested) return undefined;

  const selected = list.changes.find((change) => change.name === requested);
  if (!selected) throw new Error(`configured OpenSpec change not found: ${requested}`);
  return selected;
}

async function runJson(
  runner: CommandRunner,
  args: string[],
  cwd: string,
  label: string,
): Promise<unknown> {
  const result = await runner('openspec', args, { cwd, timeoutMs: 5_000 });
  if (result.code !== 0 || result.killed) {
    const detail = result.stderr.trim();
    throw new Error(`${label} failed${detail ? `: ${detail}` : ''}`);
  }
  return safeJson(result.stdout, label);
}

function fallbackTitle(changeId: string): string {
  return changeId.replaceAll('-', ' ');
}

async function isIdeaChange(projectRoot: string, changeName: string): Promise<boolean> {
  const changesRoot = resolve(projectRoot, 'openspec', 'changes');
  const changeRoot = resolve(changesRoot, changeName);
  if (changeRoot !== changesRoot && !changeRoot.startsWith(`${changesRoot}${sep}`)) {
    return false;
  }
  try {
    const metadata = await fs.readFile(resolve(changeRoot, '.openspec.yaml'), 'utf8');
    const schema = metadata.match(/^schema:\s*["']?([^\s"'#]+)/mu)?.[1];
    return schema === 'ramona-idea';
  } catch {
    // Generic OpenSpec changes have no Ramona Idea marker and count as Plans.
    return false;
  }
}

export async function collectOpenSpecOverview(options: {
  cwd: string;
  runner: CommandRunner;
}): Promise<OpenSpecOverview> {
  const list = parseOpenSpecList(
    await runJson(options.runner, ['list', '--json'], options.cwd, 'openspec list'),
  );
  const projectRoot = list.root?.path ?? options.cwd;
  const ideaFlags = await Promise.all(
    list.changes.map((change) => isIdeaChange(projectRoot, change.name)),
  );
  const plans = list.changes.filter((_change, index) => !ideaFlags[index]);
  const completedPlans = plans.filter(
    (change) =>
      change.status === 'complete' ||
      (change.totalTasks > 0 && change.completedTasks >= change.totalTasks),
  ).length;

  return {
    projectRoot,
    actionableChanges: plans.filter(
      (change) => change.totalTasks > 0 && change.completedTasks < change.totalTasks,
    ).length,
    totalChanges: list.changes.length,
    completedPlans,
    totalPlans: plans.length,
    completedTasks: plans.reduce((total, change) => total + change.completedTasks, 0),
    totalTasks: plans.reduce((total, change) => total + change.totalTasks, 0),
  };
}

export async function collectOpenSpec(options: {
  cwd: string;
  runner: CommandRunner;
  configuredChange?: string | null;
  environmentChange?: string;
  now?: number;
}): Promise<OpenSpecState | undefined> {
  const now = options.now ?? Date.now();
  const list = parseOpenSpecList(
    await runJson(options.runner, ['list', '--json'], options.cwd, 'openspec list'),
  );
  const change = chooseChange(
    list,
    options.configuredChange,
    options.environmentChange,
  );
  if (!change) return undefined;

  const projectRoot = list.root?.path ?? options.cwd;
  let title = fallbackTitle(change.name);
  try {
    const shown = await runJson(
      options.runner,
      ['show', change.name, '--json'],
      projectRoot,
      'openspec show',
    );
    if (isRecord(shown) && typeof shown.title === 'string' && shown.title.trim()) {
      title = shown.title.trim();
    }
  } catch {
    // The list result is still useful when an optional title lookup fails.
  }

  let tasks: OpenSpecTask[] = [];
  let tasksPath: string | undefined;
  let instructionProgress: ApplyInstructionsResult['progress'];
  try {
    const instructions = parseApplyInstructions(
      await runJson(
        options.runner,
        ['instructions', 'apply', '--change', change.name, '--json'],
        projectRoot,
        'openspec instructions apply',
      ),
    );
    tasks = instructions.tasks;
    tasksPath = instructions.tasksPath;
    instructionProgress = instructions.progress;

    if (tasksPath) {
      try {
        const markdownTasks = parseTaskMarkdown(await fs.readFile(tasksPath, 'utf8'));
        if (markdownTasks.length > 0) tasks = markdownTasks;
      } catch {
        // Instructions still provide a safe task fallback when the file moves.
      }
    }
  } catch {
    // Progress from `list` remains valid even if apply instructions are unavailable.
  }

  const completedTasks = Math.max(
    0,
    Math.trunc(instructionProgress?.complete ?? change.completedTasks),
  );
  const totalTasks = Math.max(
    0,
    Math.trunc(instructionProgress?.total ?? change.totalTasks),
  );
  const complete =
    change.status === 'complete' || (totalTasks > 0 && completedTasks >= totalTasks);

  return {
    projectRoot,
    changeId: change.name,
    title,
    phase: complete ? 'complete' : change.status,
    completedTasks,
    totalTasks,
    progressPercent:
      totalTasks > 0
        ? Math.max(0, Math.min(100, Math.round((completedTasks / totalTasks) * 100)))
        : 0,
    pendingTasks: tasks.filter((task) => !task.done),
    allTasks: tasks,
    ...(tasksPath ? { tasksPath } : {}),
    meta: {
      source: 'openspec-cli',
      refreshedAt: now,
      attemptedAt: now,
      updatedAt: Date.parse(change.lastModified) || now,
      stale: false,
    },
  };
}
