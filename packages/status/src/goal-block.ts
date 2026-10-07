import type {
  ExtensionAPI,
  ExtensionContext,
  Theme,
} from '@earendil-works/pi-coding-agent';
import { truncateToWidth, visibleWidth } from '@earendil-works/pi-tui';

/**
 * Goal-block takeover for pi-goal-x: replaces its persistent aboveEditor
 * widget ("goal" key) with a compact deck-style block rendered from the
 * goal entries pi-goal-x already appends to the session branch.
 *
 * pi-goal-x registers its widget once per session (one-shot flag), so the
 * first same-key registration after theirs owns the slot for the session.
 * We re-assert briefly after session start and on turn starts until the
 * takeover sticks. pi-goal-x modals, tools, and storage are untouched.
 */

const GOAL_WIDGET_KEY = 'goal';
const GOAL_X_STATE_ENTRY = 'pi-goal-state';
const GOAL_X_FOCUS_ENTRY = 'pi-goal-focus';
const REASSERT_DELAYS_MS = [800, 2_000, 5_000, 10_000];

export interface GoalBlockTaskCounts {
  pending: number;
  active: number;
  complete: number;
  total: number;
}

export interface GoalBlockState {
  id: string;
  objective: string;
  status: string;
  tokensUsed?: number;
  activeSeconds?: number;
  tokenBudget?: number;
  autoContinue?: boolean;
  tasks?: GoalBlockTaskCounts;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function countTasks(node: unknown, counts: GoalBlockTaskCounts): void {
  if (!isRecord(node)) return;
  const status = node.status;
  if (status === 'pending' || status === 'active' || status === 'complete') {
    counts.total += 1;
    counts[status] += 1;
  }
  if (Array.isArray(node.subtasks)) {
    for (const child of node.subtasks) countTasks(child, counts);
  }
}

function parseTaskCounts(taskList: unknown): GoalBlockTaskCounts | undefined {
  if (!isRecord(taskList) || !Array.isArray(taskList.tasks)) return undefined;
  const counts: GoalBlockTaskCounts = { pending: 0, active: 0, complete: 0, total: 0 };
  for (const task of taskList.tasks) countTasks(task, counts);
  return counts.total > 0 ? counts : undefined;
}

function parseNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function parseGoalRecord(value: unknown): GoalBlockState | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || value.id.trim() === '') return null;
  if (typeof value.objective !== 'string' || value.objective.trim() === '') return null;
  const usage = isRecord(value.usage) ? value.usage : {};
  const budget = parseNumber(usage.tokenBudget) ?? parseNumber(value.tokenBudget);
  return {
    id: value.id.slice(0, 128),
    objective: value.objective.replace(/\s+/gu, ' ').trim().slice(0, 160),
    status: typeof value.status === 'string' ? value.status.slice(0, 24) : 'active',
    tokensUsed: parseNumber(usage.tokensUsed),
    activeSeconds: parseNumber(usage.activeSeconds),
    ...(budget !== undefined && budget > 0 ? { tokenBudget: budget } : {}),
    ...(value.autoContinue === true ? { autoContinue: true } : {}),
    ...(parseTaskCounts(value.taskList)
      ? { tasks: parseTaskCounts(value.taskList) }
      : {}),
  };
}

export function readGoalBlockState(ctx: ExtensionContext): GoalBlockState | null {
  const entries: readonly unknown[] = ctx.sessionManager.getBranch();
  let focusedGoalId: string | null | undefined;
  let record: unknown;
  let recordSeen = false;
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (!isRecord(entry) || entry.type !== 'custom') continue;
    if (
      focusedGoalId === undefined &&
      entry.customType === GOAL_X_FOCUS_ENTRY &&
      isRecord(entry.data)
    ) {
      focusedGoalId =
        typeof entry.data.focusedGoalId === 'string' ? entry.data.focusedGoalId : null;
    }
    if (
      !recordSeen &&
      entry.customType === GOAL_X_STATE_ENTRY &&
      isRecord(entry.data)
    ) {
      record = entry.data.goal;
      recordSeen = true;
    }
    if (focusedGoalId !== undefined && recordSeen) break;
  }
  if (!recordSeen) return null;
  const state = parseGoalRecord(record);
  if (!state) return null;
  if (
    focusedGoalId !== undefined &&
    focusedGoalId !== null &&
    focusedGoalId !== state.id
  ) {
    return null;
  }
  return state;
}

export function formatGoalElapsed(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m ${Math.floor(seconds % 60)}s`;
  }
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return `${Math.floor(tokens)}`;
}

const STATUS_COLORS: Record<
  string,
  'success' | 'accent' | 'warning' | 'error' | 'dim'
> = {
  active: 'accent',
  complete: 'success',
  paused: 'warning',
  blocked: 'error',
  usage_limited: 'warning',
  budget_limited: 'warning',
  queued: 'dim',
};

export function renderGoalBlock(
  state: GoalBlockState | null,
  width: number,
  theme: Theme,
): string[] {
  if (!state || width < 40) return [];
  const fg = (semantic: string, text: string): string =>
    theme.fg(semantic as never, text);

  const badge = fg(STATUS_COLORS[state.status] ?? 'text', `● ${state.status}`);
  const elapsed =
    state.activeSeconds !== undefined
      ? ` · ${formatGoalElapsed(state.activeSeconds)}`
      : '';
  const headline = `◆ ${state.objective}   ${badge}${elapsed}`;
  const rows: string[] = [truncateToWidth(headline, width, '…')];

  if (state.tasks && width >= 48) {
    const { complete, total, active } = state.tasks;
    rows.push(
      truncateToWidth(
        `  ├ tasks ${complete}/${total} done` +
          (active > 0 ? ` · ${active} active` : ''),
        width,
        '…',
      ),
    );
  }

  if (
    width >= 60 &&
    (state.tokensUsed !== undefined || state.tokenBudget !== undefined)
  ) {
    const parts: string[] = [];
    if (state.tokensUsed !== undefined)
      parts.push(`${formatTokens(state.tokensUsed)} tokens`);
    if (state.tokenBudget !== undefined && state.tokensUsed !== undefined) {
      parts.push(
        `budget ${Math.min(999, Math.round((state.tokensUsed / state.tokenBudget) * 100))}%`,
      );
    }
    if (parts.length > 0) {
      rows.push(truncateToWidth(`  └ usage ${parts.join(' · ')}`, width, '…'));
    }
  }

  return rows.map((line) => fg('dim', line));
}

export function installGoalBlockTakeover(pi: ExtensionAPI): () => void {
  let activeCtx: ExtensionContext | undefined;
  let stopped = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const register = (ctx: ExtensionContext): void => {
    if (stopped || ctx.mode !== 'tui' || !ctx.hasUI) return;
    if (typeof ctx.ui.setWidget !== 'function') return;
    ctx.ui.setWidget(GOAL_WIDGET_KEY, (tui, theme: Theme) => {
      const requestRender = (): void => tui.requestRender();
      return {
        render(width: number): string[] {
          const lines = renderGoalBlock(readGoalBlockState(ctx), width, theme);
          return lines.every((line) => visibleWidth(line) <= width)
            ? lines
            : lines.map((line) => truncateToWidth(line, width, '…'));
        },
        invalidate() {
          requestRender();
        },
      };
    });
  };

  const scheduleReasserts = (ctx: ExtensionContext): void => {
    for (const delay of REASSERT_DELAYS_MS) {
      const timer = setTimeout(() => {
        if (!stopped && activeCtx === ctx) register(ctx);
      }, delay);
      timer.unref?.();
      timers.push(timer);
    }
  };

  pi.on('session_start', (_event, ctx) => {
    if (!ctx) return;
    activeCtx = ctx;
    register(ctx);
    scheduleReasserts(ctx);
  });

  pi.on('turn_start', () => {
    if (!stopped && activeCtx) register(activeCtx);
  });

  return () => {
    stopped = true;
    for (const timer of timers) clearTimeout(timer);
    activeCtx?.ui.setWidget(GOAL_WIDGET_KEY, undefined);
    activeCtx = undefined;
  };
}
