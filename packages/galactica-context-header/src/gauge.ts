import { truncateToWidth } from '@earendil-works/pi-tui';

export const CONTEXT_GAUGE_WIDTH = 7;
export const FANCY_FOOTER_WIDGET_CHANNEL = 'pi-fancy-footer:widget';
export const FANCY_FOOTER_READY_CHANNEL = 'pi-fancy-footer:ready';
export const GALACTICA_HEADER_CHANNEL = 'galactica-status:header';
export const LOCATION_WIDGET_ID = 'galactica.location';
export const LEGACY_GIT_WIDGET_ID = 'galactica.git-status';
export const GIT_BRANCH_WIDGET_ID = 'galactica.git-branch';
export const GIT_SCOPE_SEPARATOR_WIDGET_ID = 'galactica.git-scope-separator';
export const GIT_STAGED_WIDGET_ID = 'galactica.git-staged';
export const GIT_MODIFIED_WIDGET_ID = 'galactica.git-modified';
export const GIT_UNTRACKED_WIDGET_ID = 'galactica.git-untracked';
export const GIT_CONFLICT_WIDGET_ID = 'galactica.git-conflict';
export const ENVIRONMENT_WIDGET_ID = 'galactica.agent-environment';
export const REASONING_WIDGET_ID = 'galactica.reasoning-effort';
export const CONTEXT_WIDGET_ID = 'galactica.context-usage';
export const COMPACTION_WIDGET_ID = 'galactica.compaction-count';
export const RESOURCE_SEPARATOR_WIDGET_ID = 'galactica.resource-separator';
export const SCOPE_SEPARATOR_WIDGET_ID = 'galactica.scope-separator';
export const PROMPT_STATUS_CHANNEL = 'galactica-status:prompt-row';
export const FOOTER_TELEMETRY_CHANNEL = 'pi-vimux-starship:footer-telemetry/v1';
export const VIM_MODE_CHANNEL = 'pi-vim:mode-change';

const HEADER_COLORS = [
  'text',
  'accent',
  'muted',
  'dim',
  'success',
  'error',
  'warning',
] as const;

export type HeaderColor = (typeof HEADER_COLORS)[number];
export type HeaderDiagnostics = {
  text: string;
  color: HeaderColor;
  state: 'pass' | 'fail' | 'running';
};

export const HEADER_ACTIVITY_KINDS = [
  'understanding',
  'inspection',
  'synthesis',
  'planning',
  'skill-proposal',
  'mutation',
  'implementation',
  'change-review',
  'regression',
  'verification',
  'result-review',
  'recovery',
  'awaiting-validation',
  'awaiting-input',
  'operation-aborted',
] as const;

export type HeaderActivity = {
  kind: (typeof HEADER_ACTIVITY_KINDS)[number];
  current?: number;
  total?: number;
};

export const MAX_ACTIVITY_PATH_DEPTH = 6;
export const MAX_ACTIVITY_SEGMENT_ID_LENGTH = 48;
export const MAX_ACTIVITY_SEGMENT_LABEL_LENGTH = 48;
export const MAX_ACTIVITY_SEGMENT_COMPACT_LENGTH = 24;

export type HeaderActivitySegment = {
  id: string;
  label: string;
  compact?: string;
  current?: number;
  total?: number;
};

export type HeaderWork = {
  lifecycle: string;
  titles: string[];
  color: HeaderColor;
  activity?: HeaderActivity;
  activityPath?: HeaderActivitySegment[];
};
export type HeaderSnapshot = {
  activity?: HeaderActivity | null;
  work: HeaderWork | null;
  diagnostics: HeaderDiagnostics | null;
  backgroundActivity: boolean;
  approvalRequired: boolean;
  blocked: boolean;
  counters: {
    agents: { active: number; total: number };
    tasks?: { completed: number; total: number };
    steps?: { completed: number; total: number };
    files?: { completed: number; total: number };
  };
  progress: Array<{
    icon: string;
    completed: number;
    total: number;
    color: HeaderColor;
  }>;
};

export type FooterTelemetrySnapshot = {
  totalCost: number;
  quotaPercent?: number;
};

export type VimMode = 'insert' | 'normal' | 'visual' | 'visual-line' | 'ex';

export type PromptStatusSnapshot = {
  protocol: 1;
  signals: Array<{ glyph: string; color: HeaderColor }>;
  git: GitStatusSummary & { branch: string };
  progress: HeaderSnapshot['progress'];
};

export const HEADER_PRESENTATION = {
  contextIcon: '󰧑',
  contextLabel: 'ctx',
  contextColor: 'success',
  locationColor: 'success',
} as const;

export const IDLE_HEADER_WORK: HeaderWork = {
  lifecycle: 'listening',
  titles: ['no focused task'],
  color: 'accent',
};

export function displayedHeaderWork(work: HeaderWork | null | undefined): {
  work: HeaderWork;
  idle: boolean;
} {
  return work ? { work, idle: false } : { work: IDLE_HEADER_WORK, idle: true };
}

export function runtimeHeaderWork(
  work: HeaderWork | null | undefined,
  agentBusy: boolean,
): { work: HeaderWork; idle: boolean } {
  const displayed = displayedHeaderWork(work);
  if (!agentBusy || !displayed.idle) return displayed;
  return {
    work: {
      lifecycle: 'understanding',
      titles: ['no focus'],
      color: 'accent',
      activity: { kind: 'understanding' },
    },
    idle: false,
  };
}

export function lifecycleStatusLabel(work: HeaderWork | null | undefined): string {
  return work ? `⟩ ${work.lifecycle}` : '⟩';
}

export type ContextGauge = {
  percent: number;
  percentText: string;
  filled: string;
  empty: string;
};

export function contextGaugeColor(percent: number): HeaderColor {
  if (percent >= 85) return 'warning';
  return 'success';
}

export const DEVBOX_PWD_ICON = '[󰆧] ';

export function formatFooterPath(cwd: string, home = ''): string {
  return !home
    ? cwd
    : cwd === home
      ? '~'
      : cwd.startsWith(`${home}/`)
        ? `~${cwd.slice(home.length)}`
        : cwd;
}

export function formatFooterBranch(branch: string, maxWidth = 30): string {
  const trimmed = branch.trim();
  const separator = trimmed.indexOf('/');
  const prefixed =
    separator > 0
      ? `${Array.from(trimmed.slice(0, separator))[0] ?? ''}/${trimmed.slice(separator + 1)}`
      : trimmed;
  return truncateToWidth(prefixed, Math.max(0, Math.floor(maxWidth)), '...').replace(
    /\u001b\[[0-?]*[ -/]*[@-~]/gu,
    '',
  );
}

export type FooterPaletteColor =
  | 'accent'
  | 'borderAccent'
  | 'customMessageLabel'
  | 'error'
  | 'mdHeading'
  | 'success'
  | 'toolDiffAdded'
  | 'thinkingHigh'
  | 'thinkingLow'
  | 'thinkingMax'
  | 'thinkingMedium'
  | 'thinkingXhigh'
  | 'warning';

export function reasoningFooterColor(thinking = ''): FooterPaletteColor {
  switch (thinking.trim().toLowerCase()) {
    case 'medium':
      return 'thinkingMedium';
    case 'high':
      return 'thinkingHigh';
    case 'xhigh':
      return 'thinkingXhigh';
    case 'max':
      return 'thinkingMax';
    default:
      return 'thinkingLow';
  }
}

export function contextFooterColor(_thinking = '', percent = 0): FooterPaletteColor {
  const normalizedPercent = Number.isFinite(percent)
    ? Math.max(0, Math.min(100, percent))
    : 0;
  return normalizedPercent >= 85 ? 'warning' : 'accent';
}

export function countCompactions(entries: readonly { type: string }[]): number {
  return entries.filter((entry) => entry.type === 'compaction').length;
}

export function buildAgentFooterWidgets(options: {
  cwd: string;
  branch: string;
  git: GitStatusSummary;
  gitAvailable?: boolean;
  model: string;
  thinking?: string;
  contextPercent: number;
  compactionCount?: number;
  devbox?: boolean;
}) {
  const gauge = buildContextGauge(options.contextPercent, 80);
  const gitAvailable = options.gitAvailable ?? Boolean(options.branch);
  const modelColor: FooterPaletteColor = 'accent';
  const reasoningColor: FooterPaletteColor = 'borderAccent';
  const contextColor = contextFooterColor(options.thinking, gauge.percent);
  const compactionCount = Math.max(0, Math.trunc(options.compactionCount ?? 0));
  return [
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: LOCATION_WIDGET_ID,
        label: 'Working directory',
        description: 'Current Pi working directory',
        content: { type: 'text', text: options.cwd },
        icon: {
          glyphs: options.devbox
            ? {
                nerd: DEVBOX_PWD_ICON,
                emoji: '[📦] 📁',
                unicode: '[□] ▣',
                ascii: '[D] D',
              }
            : { nerd: '', emoji: '📁', unicode: '▣', ascii: 'D' },
          color: 'accent',
        },
        style: { textColor: 'accent', bold: true },
        layout: {
          row: 0,
          position: 0,
          align: 'left',
          fill: 'grow',
          minWidth: 12,
        },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: GIT_SCOPE_SEPARATOR_WIDGET_ID,
        label: 'Git scope separator',
        description: 'Separates project status from Git state',
        content: { type: 'text', text: options.branch ? '›' : '' },
        icon: false,
        style: { textColor: 'accent' },
        layout: { row: 0, position: 1, align: 'left', fill: 'none' },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: GIT_BRANCH_WIDGET_ID,
        label: 'Git branch',
        description: 'Current Git branch',
        content: {
          type: 'text',
          text: options.branch
            ? options.branch
            : gitAvailable
              ? '(detached)'
              : '(no Git)',
        },
        icon: options.branch
          ? {
              glyphs: { nerd: '', emoji: '🌿', unicode: '⎇', ascii: '*' },
              color: 'success',
            }
          : {
              glyphs: { nerd: '› ', emoji: '› 🌿', unicode: '› ⎇', ascii: '> *' },
              color: 'dim',
            },
        style: { textColor: options.branch ? 'success' : 'dim' },
        layout: {
          row: 0,
          position: 2,
          align: 'left',
          fill: options.branch ? 'none' : 'grow',
          ...(options.branch ? {} : { minWidth: 0 }),
        },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: GIT_STAGED_WIDGET_ID,
        label: 'Git staged files',
        description: 'Number of staged files',
        content: {
          type: 'text',
          text: options.git.staged > 0 ? String(options.git.staged) : '',
        },
        icon:
          options.git.staged > 0
            ? {
                glyphs: { nerd: '', emoji: '➕', unicode: '+', ascii: '+' },
                color: 'toolDiffAdded',
              }
            : false,
        style: { textColor: 'toolDiffAdded' },
        layout: { row: 0, position: 3, align: 'left', fill: 'none' },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: GIT_MODIFIED_WIDGET_ID,
        label: 'Git modified files',
        description: 'Number of modified files',
        content: {
          type: 'text',
          text: options.git.modified > 0 ? String(options.git.modified) : '',
        },
        icon:
          options.git.modified > 0
            ? {
                glyphs: { nerd: '', emoji: '✏️', unicode: '~', ascii: '~' },
                color: 'warning',
              }
            : false,
        style: { textColor: 'warning' },
        layout: { row: 0, position: 4, align: 'left', fill: 'none' },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: GIT_UNTRACKED_WIDGET_ID,
        label: 'Git untracked files',
        description: 'Number of untracked files',
        content: {
          type: 'text',
          text: options.git.untracked > 0 ? String(options.git.untracked) : '',
        },
        icon:
          options.git.untracked > 0
            ? {
                glyphs: { nerd: '', emoji: '❓', unicode: '?', ascii: '?' },
                color: 'mdHeading',
              }
            : false,
        style: { textColor: 'mdHeading' },
        layout: { row: 0, position: 5, align: 'left', fill: 'none' },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: GIT_CONFLICT_WIDGET_ID,
        label: 'Git conflicts',
        description: 'Number of conflicted files',
        content: {
          type: 'text',
          text: options.git.conflicts > 0 ? String(options.git.conflicts) : '',
        },
        icon:
          options.git.conflicts > 0
            ? {
                glyphs: { nerd: '', emoji: '⚠️', unicode: '!', ascii: '!' },
                color: 'error',
              }
            : false,
        style: { textColor: 'error' },
        layout: { row: 0, position: 6, align: 'left', fill: 'none' },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: ENVIRONMENT_WIDGET_ID,
        label: 'Agent model',
        description: 'Current model identity',
        content: { type: 'text', text: options.model },
        icon: {
          glyphs: { nerd: '󰚩', emoji: '🤖', unicode: '◉', ascii: '@' },
          color: modelColor,
        },
        style: { textColor: modelColor },
        layout: { row: 1, position: 0, align: 'left', fill: 'none' },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: REASONING_WIDGET_ID,
        label: 'Reasoning effort',
        description: 'Current model reasoning level',
        content: {
          type: 'text',
          text: options.thinking ? `› ${options.thinking}` : '',
        },
        icon: false,
        style: { textColor: reasoningColor },
        layout: { row: 1, position: 1, align: 'left', fill: 'none' },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: SCOPE_SEPARATOR_WIDGET_ID,
        label: 'Scope separator',
        description: 'Separates model identity from local session metrics',
        content: { type: 'text', text: '⟩' },
        icon: false,
        style: { textColor: 'thinkingHigh' },
        layout: { row: 1, position: 5, align: 'right', fill: 'none' },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: CONTEXT_WIDGET_ID,
        label: 'Context usage',
        description: 'Current model context consumption',
        content: {
          type: 'text',
          text: gauge.percentText,
        },
        icon: {
          glyphs: { nerd: '󰾆', emoji: '🎯', unicode: '◎', ascii: 'O' },
          color: contextColor,
        },
        style: { textColor: contextColor },
        layout: { row: 1, position: 9, align: 'right', fill: 'none' },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: COMPACTION_WIDGET_ID,
        label: 'Compaction count',
        description: 'Number of context compactions in the active session branch',
        content: {
          type: 'text',
          text: compactionCount > 0 ? String(compactionCount) : '',
        },
        icon:
          compactionCount > 0
            ? {
                glyphs: {
                  nerd: '› 󰎞',
                  emoji: '› 📝',
                  unicode: '› ¶',
                  ascii: '> S',
                },
                color: contextColor,
              }
            : false,
        style: { textColor: contextColor },
        layout: { row: 1, position: 10, align: 'right', fill: 'none' },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: RESOURCE_SEPARATOR_WIDGET_ID,
        label: 'Resource separator',
        description: 'Separates context state from session RAM and CPU',
        content: { type: 'text', text: '⟩' },
        icon: false,
        style: { textColor: 'thinkingHigh' },
        layout: { row: 1, position: 8, align: 'right', fill: 'none' },
      },
    },
  ] as const;
}

export function parseGitBranch(stdout: string): string {
  const branch = stdout.trim().split(/\r?\n/u, 1)[0] ?? '';
  return branch === 'HEAD' ? '' : branch.slice(0, 48);
}

export interface GitStatusSummary {
  staged: number;
  modified: number;
  untracked: number;
  conflicts: number;
}

export function parseGitStatus(stdout: string): GitStatusSummary {
  const summary: GitStatusSummary = {
    staged: 0,
    modified: 0,
    untracked: 0,
    conflicts: 0,
  };
  const conflictStates = new Set(['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU']);
  for (const line of stdout.split(/\r?\n/u)) {
    if (line.startsWith('??')) {
      summary.untracked += 1;
      continue;
    }
    if (line.length < 2 || line.startsWith('!!')) continue;
    const state = line.slice(0, 2);
    if (conflictStates.has(state)) {
      summary.conflicts += 1;
      continue;
    }
    const index = line[0];
    const worktree = line[1];
    if (index && index !== ' ' && index !== '?') summary.staged += 1;
    if (worktree && worktree !== ' ') summary.modified += 1;
  }
  return summary;
}

function isHeaderColor(value: unknown): value is HeaderColor {
  return (
    typeof value === 'string' && (HEADER_COLORS as readonly string[]).includes(value)
  );
}

export function parseDiagnosticsHeader(raw: unknown): HeaderDiagnostics | null {
  const snapshot = parseHeaderSnapshot(raw);
  return snapshot?.diagnostics ?? null;
}

function boundedProgress(
  candidate: Record<string, unknown>,
): Pick<HeaderActivitySegment, 'current' | 'total'> {
  if (
    typeof candidate.current !== 'number' ||
    !Number.isFinite(candidate.current) ||
    typeof candidate.total !== 'number' ||
    !Number.isFinite(candidate.total) ||
    candidate.total <= 0
  ) {
    return {};
  }
  const total = Math.min(9_999, Math.max(1, Math.trunc(candidate.total)));
  return {
    total,
    current: Math.min(total, Math.max(0, Math.trunc(candidate.current))),
  };
}

function parseHeaderActivity(value: unknown): HeaderActivity | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.kind !== 'string' ||
    !(HEADER_ACTIVITY_KINDS as readonly string[]).includes(candidate.kind)
  ) {
    return undefined;
  }

  return {
    kind: candidate.kind as HeaderActivity['kind'],
    ...boundedProgress(candidate),
  };
}

const ACTIVITY_SEGMENT_ID = /^[a-z0-9][a-z0-9-]*$/u;
const ANSI_ESCAPE =
  /\u001b(?:\][\s\S]*?(?:\u0007|\u001b\\)|\[[0-?]*[ -/]*[@-~]|[@-_])/gu;
const C1_CSI = /\u009b[0-?]*[ -/]*[@-~]/gu;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f-\u009f]/gu;

function boundedCodePoints(value: string, maximum: number): string {
  return Array.from(value).slice(0, maximum).join('');
}

function normalizeActivityLabel(value: string, maximum: number): string | undefined {
  const normalized = value
    .replace(ANSI_ESCAPE, '')
    .replace(C1_CSI, '')
    .replace(CONTROL_CHARACTER, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
  if (!normalized) return undefined;
  return boundedCodePoints(normalized, maximum);
}

export function parseHeaderActivityPath(
  value: unknown,
): HeaderActivitySegment[] | undefined {
  if (!Array.isArray(value) || value.length > MAX_ACTIVITY_PATH_DEPTH) {
    return undefined;
  }

  const ids = new Set<string>();
  const path: HeaderActivitySegment[] = [];
  for (const rawSegment of value) {
    if (!rawSegment || typeof rawSegment !== 'object' || Array.isArray(rawSegment)) {
      return undefined;
    }
    const candidate = rawSegment as Record<string, unknown>;
    if (
      typeof candidate.id !== 'string' ||
      Array.from(candidate.id).length > MAX_ACTIVITY_SEGMENT_ID_LENGTH ||
      !ACTIVITY_SEGMENT_ID.test(candidate.id) ||
      ids.has(candidate.id) ||
      typeof candidate.label !== 'string' ||
      (candidate.compact !== undefined && typeof candidate.compact !== 'string')
    ) {
      return undefined;
    }

    const label = normalizeActivityLabel(
      candidate.label,
      MAX_ACTIVITY_SEGMENT_LABEL_LENGTH,
    );
    const compact =
      candidate.compact === undefined
        ? undefined
        : normalizeActivityLabel(
            candidate.compact,
            MAX_ACTIVITY_SEGMENT_COMPACT_LENGTH,
          );
    if (!label || (candidate.compact !== undefined && !compact)) return undefined;

    ids.add(candidate.id);
    path.push({
      id: candidate.id,
      label,
      ...(compact ? { compact } : {}),
      ...boundedProgress(candidate),
    });
  }
  return path;
}

function boundedCounterPair(
  value: unknown,
  completedKey: string,
): { completed: number; total: number } | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const completed = record[completedKey];
  const total = record.total;
  if (
    !Number.isInteger(completed) ||
    !Number.isInteger(total) ||
    Number(completed) < 0 ||
    Number(total) < 0 ||
    Number(completed) > Number(total) ||
    Number(total) > 999_999
  ) {
    return undefined;
  }
  return { completed: Number(completed), total: Number(total) };
}

export function parseFooterTelemetry(raw: unknown): FooterTelemetrySnapshot | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const message = raw as Record<string, unknown>;
  if (message.protocol !== 1 || message.type !== 'snapshot') return null;
  if (
    typeof message.totalCost !== 'number' ||
    !Number.isFinite(message.totalCost) ||
    message.totalCost < 0
  ) {
    return null;
  }
  if (message.quotaPercent === undefined) return { totalCost: message.totalCost };
  if (
    typeof message.quotaPercent !== 'number' ||
    !Number.isFinite(message.quotaPercent) ||
    message.quotaPercent < 0 ||
    message.quotaPercent > 100
  ) {
    return null;
  }
  return { totalCost: message.totalCost, quotaPercent: message.quotaPercent };
}

export function parseVimMode(raw: unknown): VimMode | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const mode = (raw as Record<string, unknown>).mode;
  return ['insert', 'normal', 'visual', 'visual-line', 'ex'].includes(String(mode))
    ? (mode as VimMode)
    : null;
}

export function parseHeaderSnapshot(raw: unknown): HeaderSnapshot | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const message = raw as Record<string, unknown>;
  if (message.protocol !== 1) return null;

  const standaloneActivity = parseHeaderActivity(message.activity) ?? null;
  let work: HeaderWork | null = null;
  if (
    message.work &&
    typeof message.work === 'object' &&
    !Array.isArray(message.work)
  ) {
    const candidate = message.work as Record<string, unknown>;
    if (
      typeof candidate.lifecycle === 'string' &&
      Array.isArray(candidate.titles) &&
      candidate.titles.every((title) => typeof title === 'string') &&
      isHeaderColor(candidate.color)
    ) {
      const lifecycle = candidate.lifecycle.replace(/\s+/gu, ' ').trim().slice(0, 48);
      const titles = candidate.titles
        .map((title) => String(title).replace(/\s+/gu, ' ').trim().slice(0, 180))
        .filter(Boolean);
      const activity =
        parseHeaderActivity(candidate.activity) ?? standaloneActivity ?? undefined;
      const hasExplicitActivityPath = Object.prototype.hasOwnProperty.call(
        candidate,
        'activityPath',
      );
      const activityPath = hasExplicitActivityPath
        ? parseHeaderActivityPath(candidate.activityPath)
        : undefined;
      const hasValidExplicitActivityPath =
        hasExplicitActivityPath && activityPath !== undefined;
      const hasVisibleActivity = hasValidExplicitActivityPath
        ? activityPath.length > 0
        : activity !== undefined;
      if (lifecycle && (titles.length > 0 || hasVisibleActivity)) {
        work = {
          lifecycle,
          titles,
          color: candidate.color,
          ...(activity ? { activity } : {}),
          ...(hasValidExplicitActivityPath ? { activityPath } : {}),
        };
      }
    }
  }

  let diagnostics: HeaderDiagnostics | null = null;
  if (
    message.diagnostics &&
    typeof message.diagnostics === 'object' &&
    !Array.isArray(message.diagnostics)
  ) {
    const candidate = message.diagnostics as Record<string, unknown>;
    if (
      typeof candidate.text === 'string' &&
      isHeaderColor(candidate.color) &&
      ['pass', 'fail', 'running'].includes(String(candidate.state))
    ) {
      const text = candidate.text.replace(/\s+/gu, ' ').trim().slice(0, 48);
      if (text) {
        diagnostics = {
          text,
          color: candidate.color,
          state: candidate.state as HeaderDiagnostics['state'],
        };
      }
    }
  }

  const rawCounters =
    message.counters && typeof message.counters === 'object'
      ? (message.counters as Record<string, unknown>)
      : {};
  const agents = boundedCounterPair(rawCounters.agents, 'active');
  const tasks = boundedCounterPair(rawCounters.tasks, 'completed');
  const steps = boundedCounterPair(rawCounters.steps, 'completed');
  const files = boundedCounterPair(rawCounters.files, 'completed');

  const progress = Array.isArray(message.progress)
    ? message.progress.flatMap((rawProgress) => {
        if (
          !rawProgress ||
          typeof rawProgress !== 'object' ||
          Array.isArray(rawProgress)
        ) {
          return [];
        }
        const candidate = rawProgress as Record<string, unknown>;
        if (
          typeof candidate.icon !== 'string' ||
          typeof candidate.completed !== 'number' ||
          typeof candidate.total !== 'number' ||
          !isHeaderColor(candidate.color)
        ) {
          return [];
        }
        return [
          {
            icon: candidate.icon.slice(0, 8),
            completed: Math.max(0, Math.trunc(candidate.completed)),
            total: Math.max(0, Math.trunc(candidate.total)),
            color: candidate.color,
          },
        ];
      })
    : [];

  return {
    activity: standaloneActivity,
    work,
    diagnostics,
    backgroundActivity: message.backgroundActivity === true,
    approvalRequired: message.approvalRequired === true,
    blocked: message.blocked === true,
    counters: {
      agents: agents
        ? { active: agents.completed, total: agents.total }
        : { active: 0, total: 0 },
      ...(tasks ? { tasks } : {}),
      ...(steps ? { steps } : {}),
      ...(files ? { files } : {}),
    },
    progress,
  };
}

export function buildPromptStatusSnapshot(
  header: HeaderSnapshot | null,
  branch: string,
  git: GitStatusSummary,
): PromptStatusSnapshot {
  const signals: PromptStatusSnapshot['signals'] = [];
  if (header?.blocked) signals.push({ glyph: '', color: 'error' });
  else if (header?.diagnostics?.state === 'fail') {
    signals.push({ glyph: '✗', color: 'error' });
  } else if (header?.diagnostics?.state === 'running') {
    signals.push({ glyph: '◷', color: 'accent' });
  } else if (header?.diagnostics?.state === 'pass') {
    signals.push({ glyph: '✓', color: 'success' });
  }
  if (header?.backgroundActivity) signals.push({ glyph: '󰔟', color: 'accent' });

  return {
    protocol: 1,
    signals,
    git: { branch, ...git },
    progress: header?.progress ?? [],
  };
}

export function headerColumnGap(
  width: number,
  leftWidth: number,
  rightWidth: number,
): number | null {
  const gap = Math.floor(width) - leftWidth - rightWidth;
  return gap >= 1 ? gap : null;
}

export function headerColumnLayout(
  width: number,
  leftWidth: number,
  centerWidth: number,
  rightWidth: number,
): { beforeCenter: number; beforeRight: number } | null {
  const boundedWidth = Math.floor(width);
  const centerStart = Math.floor((boundedWidth - centerWidth) / 2);
  const rightStart = boundedWidth - rightWidth;
  const beforeCenter = centerStart - leftWidth;
  const beforeRight = rightStart - centerStart - centerWidth;
  if (beforeCenter < 1 || beforeRight < 1) return null;
  return { beforeCenter, beforeRight };
}

export function normalizeContextPercent(
  percent: unknown,
  tokens: unknown,
  contextWindow: unknown,
): number {
  if (typeof percent === 'number' && Number.isFinite(percent)) {
    return Math.max(0, Math.min(100, percent));
  }
  if (
    typeof tokens === 'number' &&
    Number.isFinite(tokens) &&
    typeof contextWindow === 'number' &&
    Number.isFinite(contextWindow) &&
    contextWindow > 0
  ) {
    return Math.max(0, Math.min(100, (tokens / contextWindow) * 100));
  }
  return 0;
}

function formatPercent(percent: number): string {
  const rounded = Math.round(percent * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

export function buildContextGauge(
  percent: number,
  availableWidth: number,
): ContextGauge {
  const normalized = Math.max(0, Math.min(100, percent));
  const percentText = formatPercent(normalized);
  // One cell each for the icon and two separating spaces. On narrow terminals,
  // reduce the gauge before sacrificing the percentage.
  const cells = Math.max(
    0,
    Math.min(CONTEXT_GAUGE_WIDTH, Math.floor(availableWidth) - percentText.length - 3),
  );
  let filledCells = cells === 0 ? 0 : Math.round((normalized / 100) * cells);
  if (normalized > 0 && filledCells === 0) filledCells = 1;
  if (normalized < 100 && filledCells === cells && cells > 1) {
    filledCells = cells - 1;
  }
  return {
    percent: normalized,
    percentText,
    filled: '▰'.repeat(filledCells),
    empty: '▱'.repeat(cells - filledCells),
  };
}
