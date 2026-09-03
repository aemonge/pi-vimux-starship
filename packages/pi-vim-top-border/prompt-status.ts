export const PROMPT_STATUS_CHANNEL = 'galactica-status:prompt-row';

const COLORS = [
  'text',
  'accent',
  'muted',
  'dim',
  'success',
  'error',
  'warning',
] as const;

export type PromptStatusColor = (typeof COLORS)[number];

export type PromptStatusSnapshot = {
  signals: Array<{ glyph: string; color: PromptStatusColor }>;
  git: {
    branch: string;
    staged: number;
    modified: number;
    untracked: number;
    conflicts: number;
  };
  progress: Array<{
    icon: string;
    completed: number;
    total: number;
    color: PromptStatusColor;
  }>;
};

export const EMPTY_PROMPT_STATUS: PromptStatusSnapshot = {
  signals: [],
  git: {
    branch: '',
    staged: 0,
    modified: 0,
    untracked: 0,
    conflicts: 0,
  },
  progress: [],
};

export function formatModeAnchor(mode: string): string {
  return ` ${mode} `;
}

function finiteCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : null;
}

function isColor(value: unknown): value is PromptStatusColor {
  return typeof value === 'string' && (COLORS as readonly string[]).includes(value);
}

export function parsePromptStatus(raw: unknown): PromptStatusSnapshot | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const message = raw as Record<string, unknown>;
  if (message.protocol !== 1) return null;

  const gitRaw = message.git;
  if (!gitRaw || typeof gitRaw !== 'object' || Array.isArray(gitRaw)) return null;
  const gitRecord = gitRaw as Record<string, unknown>;
  const staged = finiteCount(gitRecord.staged);
  const modified = finiteCount(gitRecord.modified);
  const untracked = finiteCount(gitRecord.untracked);
  const conflicts = finiteCount(gitRecord.conflicts);
  if (
    typeof gitRecord.branch !== 'string' ||
    staged === null ||
    modified === null ||
    untracked === null ||
    conflicts === null
  ) {
    return null;
  }

  const signals = Array.isArray(message.signals)
    ? message.signals.flatMap((rawSignal) => {
        if (!rawSignal || typeof rawSignal !== 'object' || Array.isArray(rawSignal)) {
          return [];
        }
        const signal = rawSignal as Record<string, unknown>;
        return typeof signal.glyph === 'string' && isColor(signal.color)
          ? [{ glyph: signal.glyph.slice(0, 8), color: signal.color }]
          : [];
      })
    : [];

  const progress = Array.isArray(message.progress)
    ? message.progress.flatMap((rawProgress) => {
        if (
          !rawProgress ||
          typeof rawProgress !== 'object' ||
          Array.isArray(rawProgress)
        ) {
          return [];
        }
        const item = rawProgress as Record<string, unknown>;
        const completed = finiteCount(item.completed);
        const total = finiteCount(item.total);
        return typeof item.icon === 'string' &&
          completed !== null &&
          total !== null &&
          isColor(item.color)
          ? [
              {
                icon: item.icon.slice(0, 8),
                completed,
                total,
                color: item.color,
              },
            ]
          : [];
      })
    : [];

  return {
    signals,
    git: {
      branch: gitRecord.branch.replace(/\s+/gu, ' ').trim().slice(0, 48),
      staged,
      modified,
      untracked,
      conflicts,
    },
    progress,
  };
}
