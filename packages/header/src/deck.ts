import type { Theme } from '@earendil-works/pi-coding-agent';
import { truncateToWidth, visibleWidth } from '@earendil-works/pi-tui';

import type { LspCapability, McpCapability } from './capabilities.ts';
import type {
  FooterTelemetrySnapshot,
  GitStatusSummary,
  HeaderActivity,
  HeaderSuggestion,
  HeaderSnapshot,
  PiStatusSnapshot,
  VimMode,
} from './gauge.ts';
import type { ResourceTelemetry } from './process-resources.ts';
import { formatDeckCountdown } from './gauge.ts';

export interface HeaderDeckModeRail {
  plain: string;
  styled: string;
}

export interface HeaderDeckState {
  elapsedMs: number | null;
  idleMs?: number;
  header: HeaderSnapshot | null;
  cwd: string;
  devbox: boolean;
  branch: string;
  gitAvailable: boolean;
  git: GitStatusSummary;
  model: string;
  thinking?: string;
  contextPercent?: number;
  contextTokens?: number;
  contextWindow?: number;
  compactionCount: number;
  resources?: ResourceTelemetry;
  footerTelemetry?: FooterTelemetrySnapshot;
  piStatus?: PiStatusSnapshot;
  lsp: LspCapability | null;
  mcp: McpCapability | null;
  mode: VimMode;
}

const ANSI_ESCAPE = new RegExp(
  '\\u001b(?:\\][\\s\\S]*?(?:\\u0007|\\u001b\\\\)|\\[[0-?]*[ -/]*[@-~]|[@-_])',
  'gu',
);
const CONTROL_CHARACTER = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f]', 'gu');
const TRAILING_ANSI_ESCAPE =
  /\u001b(?:\][\s\S]*?(?:\u0007|\u001b\\)|\[[0-?]*[ -/]*[@-~]|[@-_])\s*$/u;

function safeText(value: string, maximum = 180): string {
  return Array.from(
    value
      .replace(ANSI_ESCAPE, '')
      .replace(CONTROL_CHARACTER, ' ')
      .replaceAll('󰠭', '')
      .replace(/\s+/gu, ' ')
      .trim(),
  )
    .slice(0, maximum)
    .join('');
}

function color(theme: Theme, name: string, text: string, bold = false): string {
  const content = bold ? theme.bold(text) : text;
  return theme.fg(name as Parameters<Theme['fg']>[0], content);
}

function fit(line: string, width: number): string {
  return truncateToWidth(line, Math.max(0, width), '');
}

function trimTrailingFormatting(line: string): string {
  let trimmed = line.trimEnd();
  while (TRAILING_ANSI_ESCAPE.test(trimmed)) {
    trimmed = trimmed.replace(TRAILING_ANSI_ESCAPE, '').trimEnd();
  }
  return trimmed;
}

function fitWithoutDanglingSeparator(line: string, width: number): string {
  let fitted = fit(line, width);
  while (true) {
    const visible = fitted.replace(ANSI_ESCAPE, '').trimEnd();
    const separator = visible.at(-1);
    if (separator !== '›' && separator !== '⟩') return fitted;
    fitted = trimTrailingFormatting(fitted.slice(0, fitted.lastIndexOf(separator)));
  }
}

const MODE_ICONS: Record<VimMode, string> = {
  insert: '󰏫',
  normal: '󰆾',
  visual: '󰒅',
  'visual-line': '󰒅',
  ex: '󰆍',
};

const MODE_COLORS: Record<VimMode, string> = {
  insert: 'borderMuted',
  normal: 'borderAccent',
  visual: 'customMessageLabel',
  'visual-line': 'customMessageLabel',
  ex: 'warning',
};

function fallbackModeRail(state: HeaderDeckState, theme: Theme): HeaderDeckModeRail {
  const plain = MODE_ICONS[state.mode];
  return { plain, styled: color(theme, MODE_COLORS[state.mode], plain) };
}

export function formatDeckElapsed(elapsedMs: number | null): string {
  const maximum = (99 * 60 + 59) * 1_000 + 999;
  const observed = elapsedMs ?? 0;
  const finite = Number.isFinite(observed)
    ? observed
    : observed === Number.POSITIVE_INFINITY
      ? maximum
      : 0;
  const normalized = Math.min(maximum, Math.max(0, Math.floor(finite)));
  const minutes = Math.floor(normalized / 60_000);
  const seconds = Math.floor((normalized % 60_000) / 1_000);
  const centiseconds = Math.floor((normalized % 1_000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}'${String(centiseconds).padStart(2, '0')}`;
}

export function formatDeckPercent(value: number): string {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return `${Math.round(normalized)}%`;
}

export function formatDeckCpu(value: number): string {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return `${normalized.toFixed(1)}%`;
}

export function formatDeckBytes(value: number): string {
  const units = ['', 'K', 'M', 'G', 'T'];
  let normalized = Number.isFinite(value) ? Math.max(0, value) : 0;
  let unit = 0;
  while (normalized >= 1024 && unit < units.length - 1) {
    normalized /= 1024;
    unit += 1;
  }
  const decimals = unit > 0 && normalized < 10 ? 1 : 0;
  return `${normalized.toFixed(decimals).replace(/\.0$/u, '')}${units[unit]}`;
}

function formatCost(value: number): string {
  const normalized = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (normalized === 0) return '$0';
  const decimals =
    normalized >= 0.01
      ? 2
      : Math.min(6, Math.max(3, Math.ceil(-Math.log10(normalized)) + 1));
  return `$${normalized.toFixed(decimals).replace(/\.?0+$/u, '')}`;
}

function lifecycle(state: HeaderDeckState): { label: string; active: boolean } | null {
  // Frozen contract: the renderer never fabricates a stage.
  const raw = state.header?.work?.lifecycle;
  if (!raw) return null;
  const aliases: Record<string, string> = {
    active: 'working',
    implementation: 'working',
    verification: 'assuring',
    'awaiting validation': 'waiting',
    'awaiting input': 'waiting',
  };
  const label = safeText(aliases[raw.toLowerCase()] ?? raw, 24);
  if (!label) return null;
  return {
    label,
    active: !['waiting', 'listening'].includes(label.toLowerCase()),
  };
}

function wrapFocus(text: string, width: number, maximumLines: number): string[] {
  const words = safeText(text, 360).split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (visibleWidth(candidate) <= width) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maximumLines) break;
  }
  if (lines.length < maximumLines && current) lines.push(current);
  if (words.length > 0 && lines.length === maximumLines) {
    lines[maximumLines - 1] = truncateToWidth(
      lines[maximumLines - 1] ?? '',
      width,
      '…',
    );
  }
  return lines.slice(0, maximumLines);
}

function elevatedSelectionLines(
  state: HeaderDeckState,
  width: number,
  theme: Theme,
): string[] {
  const prefix = `${color(theme, 'customMessageLabel', '󰠭')} ${semanticSeparator(theme)} `;
  const indent = ' '.repeat(visibleWidth(prefix));
  const selection = state.header?.selection;
  const titles = (selection?.titles ?? [])
    .map((value) => safeText(value))
    .filter(Boolean);
  if (!selection || titles.length === 0) {
    return []; // frozen contract: no selection means no slot
  }
  const contentWidth = Math.max(1, width - visibleWidth(prefix));
  const selectionColor = ['accent', 'success'].includes(selection.color)
    ? 'accent'
    : selection.color;
  return wrapFocus(titles.join(' › '), contentWidth, 2).map(
    (line, index) =>
      `${index === 0 ? prefix : indent}${color(theme, selectionColor, line)}`,
  );
}

function semanticSeparator(theme: Theme): string {
  return color(theme, 'thinkingHigh', '⟩', true);
}

function minorSeparator(theme: Theme, semanticColor = 'accent'): string {
  return color(theme, semanticColor, '›');
}
function loud(theme: Theme, name: string, text: string): string {
  return `\u001b[7m${color(theme, name, text, true)}\u001b[27m`;
}

function alignedRows(left: string, right: string, width: number): string[] {
  const gap = width - visibleWidth(left) - visibleWidth(right);
  if (gap >= 1) return [`${left}${' '.repeat(gap)}${right}`];
  return [fit(left, width), fit(right, width)].filter(Boolean);
}

function alignedSingleRow(left: string, right: string, width: number): string {
  if (!right) return fit(left, width);
  const rightWidth = visibleWidth(right);
  if (rightWidth >= width) return fit(right, width);
  const fittedLeft = truncateToWidth(left, width - rightWidth - 1, '…');
  const gap = Math.max(1, width - visibleWidth(fittedLeft) - rightWidth);
  return `${fittedLeft}${' '.repeat(gap)}${right}`;
}

function progressLine(state: HeaderDeckState, theme: Theme): string {
  const tasks = state.header?.counters.tasks;
  const steps = state.header?.counters.steps;
  // Frozen contract: absent facts remove their slots; placeholder dashes are
  // forbidden. No counters at all collapses the whole progress slot.
  const segments: string[] = [];
  if (tasks && tasks.total > 0) {
    const semantic = tasks.completed >= tasks.total ? 'success' : 'text';
    segments.push(
      color(theme, semantic, ` task ${tasks.completed}/${tasks.total}`, true),
    );
  }
  if (steps && steps.total > 0) {
    const semantic = steps.completed >= steps.total ? 'success' : 'text';
    segments.push(color(theme, semantic, ` stps ${steps.completed}/${steps.total}`));
  }
  if (segments.length === 0) return '';
  if (segments.length === 1) return segments[0] ?? '';
  return `${segments[0]} ${minorSeparator(theme, 'dim')} ${segments[1]}`;
}

function spanElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}'${String(seconds).padStart(2, '0')}`;
}

function spanTreeRows(state: HeaderDeckState, width: number, theme: Theme): string[] {
  // Frozen contract runs fact: one elastic row per live child run, naming its
  // agent and stage; the rows collapse the moment the spans settle.
  if (width < 60) return [];
  const spans = (state.header?.activeRunSpans ?? []).filter(
    (span) => span.agent !== undefined || span.kind === 'bash',
  );
  return spans.map((span, index) => {
    const branch = index === spans.length - 1 ? '└' : '├';
    const who = span.agent ?? span.label ?? span.kind;
    // Brown family (customMessageLabel), never bare black.
    const left = color(theme, 'customMessageLabel', `  ${branch} ${who} ${span.stage}`);
    const right = color(theme, 'dim', spanElapsed(span.elapsedMs));
    const fitted = truncateToWidth(left, Math.max(1, width - 8), '…');
    const gap = Math.max(1, width - visibleWidth(fitted) - visibleWidth(right));
    return `${fitted}${' '.repeat(gap)}${right}`;
  });
}

const ACTIVITY_LABELS: Record<HeaderActivity['kind'], string> = {
  understanding: 'interpreting',
  inspection: 'inspecting',
  synthesis: 'synthesizing',
  planning: 'planning',
  'skill-proposal': 'proposing skill',
  mutation: 'updating',
  implementation: 'implementing',
  'change-review': 'reviewing change',
  regression: 'testing',
  verification: 'checking',
  'result-review': 'reviewing result',
  recovery: 'recovering',
  'awaiting-validation': 'validation',
  'awaiting-input': 'input',
  'operation-aborted': 'stopped',
};

function activityLabel(state: HeaderDeckState): string {
  const pathActivity = state.header?.work?.activityPath?.at(-1);
  const pathLabel = safeText(pathActivity?.compact || pathActivity?.label || '');
  if (pathLabel) return pathLabel;
  const activity = state.header?.work?.activity;
  return activity ? ACTIVITY_LABELS[activity.kind] : '';
}

const SUGGESTION_LABELS: Record<HeaderSuggestion, string> = {
  'requesting-validation': 'requesting validation or redirection',
  'awaiting-continuation': 'awaiting continuation',
  'requesting-redirection': 'requesting redirection',
  'awaiting-resume': 'awaiting resume or redirect',
  'requesting-input': 'requesting input',
};

const PLACEHOLDER_TITLES = new Set(['no focused task', 'no focus']);

function whatLine(state: HeaderDeckState): string {
  const work = state.header?.work;
  const title = (work?.titles ?? []).find(
    (candidate) => candidate && !PLACEHOLDER_TITLES.has(candidate),
  );
  const pathLabel = safeText(work?.activityPath?.at(-1)?.label ?? '');
  const base = safeText(title ?? '') || pathLabel;
  // Frozen contract: one home per fact — step counts live in progressLine only.
  return base;
}

function suggestionLine(
  state: HeaderDeckState,
  theme: Theme,
  recovering: boolean,
): string {
  const suggestion = state.header?.suggestion;
  if (!suggestion) {
    const what = lifecycle(state)?.active ? whatLine(state) : '';
    return what ? color(theme, 'accent', what) : ''; // frozen contract: silence, no dash
  }
  const semanticColor =
    suggestion === 'requesting-redirection'
      ? 'error'
      : ['requesting-validation', 'requesting-input'].includes(suggestion)
        ? 'warning'
        : recovering
          ? 'accent'
          : 'success';
  return color(theme, semanticColor, `󰁕 ${SUGGESTION_LABELS[suggestion]}`);
}

function runtimeCapsule(state: HeaderDeckState, theme: Theme): string {
  const children = state.header?.counters.activeRuns?.children ?? 0;
  const subagents = state.header?.counters.activeRuns?.subagents ?? 0;
  const elapsed = state.elapsedMs;
  // Gray-out amendment (Human-directed): an idle turn shows a dim capsule with
  // the idle timer instead of hiding the slot.
  if (children === 0 && subagents === 0 && elapsed == null) {
    const idle = state.idleMs;
    if (idle === undefined || idle <= 0) return '';
    return (
      `${color(theme, 'dim', '(')}${color(theme, 'dim', ` 0`)} ` +
      `${minorSeparator(theme, 'dim')} ${color(theme, 'dim', ` 0`)} ` +
      `${color(theme, 'dim', `· ${formatDeckElapsed(idle)}`)}${color(theme, 'dim', ')')}`
    );
  }
  const childColor = children > 0 ? 'accent' : 'dim';
  const subagentColor = subagents > 0 ? 'accent' : 'dim';
  const timeSegment =
    elapsed == null
      ? ''
      : ` ${color(theme, 'accent', `· ${formatDeckElapsed(elapsed)}`)}`;
  return (
    `${color(theme, 'dim', '(')}${color(theme, childColor, ` ${children}`)} ` +
    `${minorSeparator(theme, 'dim')} ${color(theme, subagentColor, ` ${subagents}`)}` +
    timeSegment +
    `${color(theme, 'dim', ')')}`
  );
}

function projectLeft(state: HeaderDeckState, theme: Theme): string {
  const devbox = state.devbox ? `${color(theme, 'success', '[󰆧]', true)} ` : '';
  return `${devbox}${color(theme, 'success', ` ${safeText(state.cwd)}`)}`;
}

function gitRight(state: HeaderDeckState, theme: Theme): string {
  // Gray-out amendment (Human-directed): absent Git shows a dim marker.
  if (!state.branch && !state.gitAvailable) {
    return color(theme, 'dim', '(no Git)');
  }
  const branch = color(
    theme,
    state.branch ? 'success' : 'dim',
    ` ${safeText(state.branch || '(detached)', 32)}`,
  );
  const entries = [
    [state.git.staged, 'success', ''],
    [state.git.modified, 'warning', ''],
    [state.git.untracked, 'accent', ''],
    [state.git.conflicts, 'error', ''],
  ] as const;
  const dirty = entries
    .filter(([count]) => count > 0)
    .map(([count, semanticColor, icon]) =>
      color(theme, semanticColor, `${icon} ${count}`),
    );
  const status = !state.gitAvailable
    ? ''
    : dirty.length > 0
      ? dirty.join(` ${minorSeparator(theme)} `)
      : color(theme, 'success', ' clean');
  if (!status) return branch;
  return `${branch} ${semanticSeparator(theme)} ${status}`;
}

function globalLeft(state: HeaderDeckState, theme: Theme): string {
  return `${color(theme, 'accent', `󰚩 ${safeText(state.model, 80)}`)} ${minorSeparator(theme)} ${color(theme, state.thinking ? 'thinkingHigh' : 'dim', safeText(state.thinking || 'off', 16))}`;
}

function compactTelemetryLeft(state: HeaderDeckState, theme: Theme): string {
  const ctxColor =
    state.contextPercent !== undefined && state.contextPercent >= 85
      ? 'warning'
      : state.contextPercent === undefined
        ? 'dim'
        : 'accent';
  const segments: string[] = [];
  if (state.contextPercent !== undefined) {
    segments.push(
      color(theme, 'accent', `󰾆 ${formatDeckPercent(state.contextPercent)}`),
    );
  }
  if (state.compactionCount > 0) {
    segments.push(color(theme, ctxColor, `󰎞 ${state.compactionCount}`));
  }
  const quota = simpleQuotaTile(state, theme);
  if (quota) segments.push(quota);
  if (segments.length === 0) return globalLeft(state, theme);
  return [
    globalLeft(state, theme),
    semanticSeparator(theme),
    segments.join(` ${minorSeparator(theme, ctxColor)} `),
  ].join(' ');
}

function compactTelemetryRight(
  state: HeaderDeckState,
  theme: Theme,
  nowMs = Date.now(),
): string {
  const resources = state.resources;
  // Relocation: resources left-to-right, cost anchors the far end.
  const resourceSegments: string[] = [];
  if (resources) {
    const resourceColor =
      resources.cpuWarning || resources.memoryWarning ? 'warning' : 'accent';
    const parts = [
      color(theme, resourceColor, ` ${formatDeckCpu(resources.cpuPercent)}`),
      color(theme, resourceColor, ` ${formatDeckBytes(resources.memoryBytes)}`),
    ];
    resourceSegments.push(parts.join(` ${minorSeparator(theme, resourceColor)} `));
  }
  if (state.mcp) {
    resourceSegments.push(
      color(theme, 'accent', ` ${state.mcp.healthy}/${state.mcp.total}`),
    );
  }
  const windows = windowQuotaTiles(state, theme, nowMs);
  if (windows) resourceSegments.unshift(windows);
  const cost = costTile(state, theme);
  if (cost) resourceSegments.push(cost);
  return resourceSegments.join(` ${semanticSeparator(theme)} `);
}

function simpleQuotaTile(state: HeaderDeckState, theme: Theme): string {
  const telemetry = state.footerTelemetry;
  if (!telemetry || (telemetry.quotaWindows ?? []).length > 0) return '';
  const quota = telemetry.quotaPercent;
  if (quota === undefined) return '';
  const quotaColor = quota >= 80 ? 'warning' : 'accent';
  return color(theme, quotaColor, ` ${formatDeckPercent(quota)}`);
}

function windowQuotaTiles(
  state: HeaderDeckState,
  theme: Theme,
  nowMs = Date.now(),
): string {
  const telemetry = state.footerTelemetry;
  const windows = telemetry?.quotaWindows ?? [];
  if (windows.length === 0) return '';
  // Icons carry window identity: minute/hour windows are the coding window and
  // wear the permanent flame with its reset countdown; day windows are the long
  // window on the calendar. Telemetry lists windows shortest-first, so the
  // first of each class is the tightest one.
  const coding = windows.find((window) => /^[\d.]+[mh]$/u.test(window.label));
  const calendar = windows.find((window) => /^[\d.]+d$/u.test(window.label));
  const tiles: string[] = [];
  if (calendar) {
    tiles.push(
      color(
        theme,
        calendar.percent >= 80 ? 'warning' : 'accent',
        `󰃰 ${formatDeckPercent(calendar.percent)}`,
      ),
    );
  }
  if (coding) {
    tiles.push(
      color(
        theme,
        coding.percent >= 80 ? 'warning' : 'accent',
        coding.resetAt !== undefined
          ? `󰈸 ${formatDeckPercent(coding.percent)} › 󰅐 ${formatDeckCountdown(coding.resetAt, nowMs)}`
          : `󰈸 ${formatDeckPercent(coding.percent)}`,
      ),
    );
  }
  return tiles.join(` ${semanticSeparator(theme)} `);
}

function costTile(state: HeaderDeckState, theme: Theme): string {
  const telemetry = state.footerTelemetry;
  if (!telemetry) return '';
  return color(theme, 'accent', `󰜦 ${formatCost(telemetry.totalCost)}`);
}

function topRailPrefix(
  state: HeaderDeckState,
  width: number,
  theme: Theme,
  lineColor: string,
): string {
  const errors = state.piStatus?.errors ?? 0;
  const warnings = state.piStatus?.warnings ?? 0;
  if (errors === 0 && warnings === 0) return '';

  const groups = [
    errors > 0 ? loud(theme, 'error', `󰅙 ${errors}`) : '',
    warnings > 0 ? loud(theme, 'warning', ` ${warnings}`) : '',
  ].filter(Boolean);
  const summary = groups.join(color(theme, lineColor, ' › '));
  const full = `${color(theme, lineColor, '─ ')}${summary}${color(theme, lineColor, ' ⟩ ')}${color(theme, 'dim', '/pi-status')} `;
  if (visibleWidth(full) < width) return full;

  const compact = `${color(theme, lineColor, '─ ')}${summary} `;
  if (visibleWidth(compact) < width) return compact;

  const total = errors + warnings;
  const severity = errors > 0 ? 'error' : 'warning';
  const icon = errors > 0 ? '󰅙' : '';
  return `${color(theme, lineColor, '─ ')}${loud(theme, severity, `${icon} ${total}`)} `;
}

export function renderHeaderDeck(
  state: HeaderDeckState,
  width: number,
  theme: Theme,
  suppliedModeRail?: HeaderDeckModeRail,
): string[] {
  const boundedWidth = Math.max(0, Math.floor(width));
  if (boundedWidth === 0) return [];

  const lineColor = 'thinkingHigh';
  const topPrefix = topRailPrefix(state, boundedWidth, theme, lineColor);
  const top = `${topPrefix}${color(
    theme,
    lineColor,
    '─'.repeat(Math.max(0, boundedWidth - visibleWidth(topPrefix))),
  )}`;
  const modeRail = suppliedModeRail ?? fallbackModeRail(state, theme);
  const inserting = suppliedModeRail
    ? suppliedModeRail.plain === MODE_ICONS.insert
    : state.mode === 'insert';
  const bottomPrefix = `${color(theme, lineColor, '─ ')}${modeRail.styled}${color(theme, lineColor, ' ')}`;
  // Relocation phase: the footer count is deleted — diagnostics live on the
  // top rule; the bottom rail keeps only the mode icon and the anchor echo.
  const bottomSuffix = `${color(theme, lineColor, ' ')}${color(theme, lineColor, '‹ ')}${color(theme, 'customMessageLabel', '󰠭')}${color(theme, lineColor, ' ─')}`;
  const bottom = `${bottomPrefix}${color(
    theme,
    lineColor,
    '─'.repeat(
      Math.max(
        0,
        boundedWidth - visibleWidth(bottomPrefix) - visibleWidth(bottomSuffix),
      ),
    ),
  )}${bottomSuffix}`;
  const divider = `\u001b[2m${color(theme, 'text', '┈'.repeat(boundedWidth))}\u001b[22m`;
  const current = lifecycle(state);
  const activityText = activityLabel(state);
  const recovering =
    state.header?.work?.activity?.kind === 'recovery' ||
    activityText.toLowerCase() === 'recovering';
  const lifecycleColor = state.header?.blocked
    ? 'error'
    : state.header?.approvalRequired
      ? 'warning'
      : current?.active
        ? (state.header?.work?.color ?? 'accent')
        : 'dim';
  const lifecycleSegment = current
    ? color(theme, lifecycleColor, current.label, true)
    : '';
  const activitySegment = activityText
    ? color(theme, recovering ? 'accent' : 'text', activityText)
    : '';
  const suggestionSegment = suggestionLine(state, theme, recovering);
  const trailing = [activitySegment, suggestionSegment].filter(
    (segment) => segment !== '',
  );
  // Relocation phase: the capsule lives top-right on the title band; the
  // project context merges into the status row; git composes the right side
  // beside the progress slot.
  // Narrow frames: the capsule yields before the selection anchor does.
  const capsule = boundedWidth >= 40 ? runtimeCapsule(state, theme) : '';
  const focusLines = elevatedSelectionLines(state, boundedWidth, theme);
  const titleBase = focusLines.length > 0 ? focusLines : [''];
  const titleRows =
    capsule || focusLines.length > 0
      ? [
          alignedSingleRow(titleBase[0] ?? '', capsule, boundedWidth),
          ...titleBase.slice(1),
        ]
      : [];

  // Narrow frames: the project context yields before the stage does.
  const projectSegment = boundedWidth >= 100 ? projectLeft(state, theme) : '';
  const statusLeft = [
    projectSegment,
    ...(lifecycleSegment ? [semanticSeparator(theme)] : []),
    lifecycleSegment,
    ...(lifecycleSegment && trailing.length > 0 ? [semanticSeparator(theme)] : []),
    ...trailing,
  ]
    .filter((segment) => segment !== '')
    .join(' ');
  // Narrow frames: git yields before progress; progress before the stage.
  const statusRight = [
    ...(boundedWidth >= 60 ? [progressLine(state, theme)] : []),
    ...(boundedWidth >= 100 ? [truncateToWidth(gitRight(state, theme), 52, '…')] : []),
  ]
    .filter((segment) => segment !== '')
    .join('  ');
  const status = alignedSingleRow(statusLeft, statusRight, boundedWidth);

  const rows = [
    ...titleRows,
    top,
    status,
    ...spanTreeRows(state, boundedWidth, theme),
    divider,
    ...alignedRows(
      compactTelemetryLeft(state, theme),
      compactTelemetryRight(state, theme),
      boundedWidth,
    ),
    ...(inserting ? [] : [bottom]),
  ];
  return rows.map((line) => fitWithoutDanglingSeparator(line, boundedWidth));
}
