import type { Theme } from '@earendil-works/pi-coding-agent';
import { truncateToWidth, visibleWidth } from '@earendil-works/pi-tui';

import type { LspCapability, McpCapability } from './capabilities.ts';
import type {
  FooterTelemetrySnapshot,
  GitStatusSummary,
  HeaderSnapshot,
  VimMode,
} from './gauge.ts';
import type { ResourceTelemetry } from './process-resources.ts';

export interface HeaderDeckState {
  elapsedMs: number | null;
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
  lsp: LspCapability | null;
  mcp: McpCapability | null;
  mode: VimMode;
}

const ANSI_ESCAPE = new RegExp(
  '\\u001b(?:\\][\\s\\S]*?(?:\\u0007|\\u001b\\\\)|\\[[0-?]*[ -/]*[@-~]|[@-_])',
  'gu',
);
const CONTROL_CHARACTER = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f]', 'gu');

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

export function formatDeckElapsed(elapsedMs: number | null): string {
  const totalSeconds = Math.max(0, Math.floor((elapsedMs ?? 0) / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
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

function lifecycle(state: HeaderDeckState): { label: string; focus: string } {
  const work = state.header?.work;
  const raw = work?.lifecycle || (state.elapsedMs === null ? 'waiting' : 'working');
  const aliases: Record<string, string> = {
    listening: 'waiting',
    active: 'working',
    implementation: 'working',
    verification: 'assuring',
    'awaiting validation': 'waiting',
    'awaiting input': 'waiting',
  };
  const label = safeText(aliases[raw.toLowerCase()] ?? raw, 24) || 'waiting';
  const path = work?.activityPath ?? [];
  const activeFocus = safeText(path.at(-1)?.compact || path.at(-1)?.label || '');
  const titleFocus = safeText(work?.titles.at(-1) ?? '');
  return {
    label,
    focus:
      label === 'waiting'
        ? 'next direction'
        : titleFocus || activeFocus || 'next direction',
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

function narrativeLines(
  state: HeaderDeckState,
  width: number,
  maximumLines: number,
): string[] {
  const work = state.header?.work;
  const titles = (work?.titles ?? []).map((value) => safeText(value)).filter(Boolean);
  const narrativeTitles = titles.length > 1 ? titles.slice(1) : titles;
  return wrapFocus(narrativeTitles.join(' › '), width, maximumLines);
}

function semanticSeparator(theme: Theme): string {
  return color(theme, 'thinkingHigh', '⟩', true);
}

function minorSeparator(theme: Theme, semanticColor = 'accent'): string {
  return color(theme, semanticColor, '›');
}

function alignedRows(left: string, right: string, width: number): string[] {
  const gap = width - visibleWidth(left) - visibleWidth(right);
  if (gap >= 2) return [`${left}${' '.repeat(gap)}${right}`];
  return [fit(left, width), fit(right, width)].filter(Boolean);
}

function progressLine(state: HeaderDeckState, theme: Theme): string {
  const tasks = state.header?.counters.tasks;
  const steps = state.header?.counters.steps;
  const taskText = tasks ? `${tasks.completed}/${tasks.total}` : '—';
  const stepText = steps ? `${steps.completed}/${steps.total}` : '—';
  return `${color(theme, tasks ? 'accent' : 'dim', ` task ${taskText}`)} ${minorSeparator(theme)} ${color(theme, steps ? 'accent' : 'dim', ` stps ${stepText}`)}`;
}

function projectLeft(state: HeaderDeckState, theme: Theme): string {
  const pathIcon = state.devbox ? '[󰆧] ' : '';
  return color(theme, 'success', `${pathIcon} ${safeText(state.cwd)}`, true);
}

function gitRight(state: HeaderDeckState, theme: Theme): string {
  const branchText = state.branch || (state.gitAvailable ? '(detached)' : '(no Git)');
  const branch = color(
    theme,
    state.branch ? 'success' : 'dim',
    ` ${safeText(branchText, 80)}`,
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
    ? color(theme, 'dim', '—')
    : dirty.length > 0
      ? dirty.join(` ${minorSeparator(theme)} `)
      : color(theme, 'success', ' clean');
  return `${branch} ${semanticSeparator(theme)} ${status}`;
}

function globalLeft(state: HeaderDeckState, theme: Theme): string {
  return `${color(theme, 'accent', `󰚩 ${safeText(state.model, 80)}`)} ${minorSeparator(theme)} ${color(theme, state.thinking ? 'thinkingHigh' : 'dim', safeText(state.thinking || 'off', 16))}`;
}

function globalRight(state: HeaderDeckState, theme: Theme): string {
  const ctxColor =
    state.contextPercent !== undefined && state.contextPercent >= 85
      ? 'warning'
      : state.contextPercent === undefined
        ? 'dim'
        : 'accent';
  const quota = state.footerTelemetry?.quotaPercent;
  const quotaColor =
    quota !== undefined && quota >= 80
      ? 'warning'
      : quota === undefined
        ? 'dim'
        : 'accent';
  return [
    color(
      theme,
      ctxColor,
      `󰾆 ctx ${state.contextPercent === undefined ? '—' : formatDeckPercent(state.contextPercent)}`,
    ),
    minorSeparator(theme, ctxColor),
    color(
      theme,
      state.compactionCount > 0 ? ctxColor : 'dim',
      `󰎞 zips ${state.compactionCount}`,
    ),
    semanticSeparator(theme),
    color(
      theme,
      quotaColor,
      ` qta ${quota === undefined ? '—' : formatDeckPercent(quota)}`,
    ),
    minorSeparator(theme),
    color(
      theme,
      state.footerTelemetry ? 'accent' : 'dim',
      `󰜦 ${state.footerTelemetry ? formatCost(state.footerTelemetry.totalCost) : '—'}`,
    ),
  ].join(' ');
}

function localLeft(state: HeaderDeckState, theme: Theme): string {
  const counters = state.header?.counters;
  const agents = counters?.agents ?? { active: 0, total: 0 };
  const files = counters?.files;
  return [
    color(theme, 'accent', `󱎫 ${formatDeckElapsed(state.elapsedMs)}`),
    minorSeparator(theme),
    color(
      theme,
      agents.active > 0 ? 'accent' : 'dim',
      `agts ${agents.active}/${agents.total}`,
    ),
    minorSeparator(theme),
    color(
      theme,
      files ? 'accent' : 'dim',
      `files ${files ? `${files.completed}/${files.total}` : '—'}`,
    ),
  ].join(' ');
}

function localRight(state: HeaderDeckState, theme: Theme): string {
  const resources = state.resources;
  const resourceColor =
    resources?.cpuWarning || resources?.memoryWarning
      ? 'warning'
      : resources
        ? 'accent'
        : 'dim';
  const resourceText = resources
    ? `${formatDeckCpu(resources.cpuPercent)} · ${formatDeckBytes(resources.memoryBytes)}`
    : '—';
  const mcp = state.mcp ? `${state.mcp.healthy}/${state.mcp.total}` : '—';
  return `${color(theme, resourceColor, ` ${resourceText}`)} ${minorSeparator(theme)} ${color(theme, state.mcp ? 'accent' : 'dim', ` MCP ${mcp}`)}`;
}

export function renderHeaderDeck(
  state: HeaderDeckState,
  width: number,
  theme: Theme,
): string[] {
  const boundedWidth = Math.max(0, Math.floor(width));
  if (boundedWidth === 0) return [];

  const lineColor = 'thinkingHigh';
  const topPrefix = `${color(theme, lineColor, '─ ')}${color(theme, 'customMessageLabel', '󰠭')}${color(theme, lineColor, ' › ')}`;
  const top = `${topPrefix}${color(
    theme,
    lineColor,
    '─'.repeat(Math.max(0, boundedWidth - visibleWidth(topPrefix))),
  )}`;
  const bottomSuffix = `${color(theme, lineColor, ' ‹ ')}${color(theme, 'customMessageLabel', '󰠭')}${color(theme, lineColor, ' ─')}`;
  const bottom = `${color(
    theme,
    lineColor,
    '─'.repeat(Math.max(0, boundedWidth - visibleWidth(bottomSuffix))),
  )}${bottomSuffix}`;
  const divider = color(theme, 'dim', '┈'.repeat(boundedWidth));
  const current = lifecycle(state);
  const activity = state.header?.work?.activityPath?.at(-1);
  const activityText = safeText(activity?.compact || activity?.label || '');
  const titles = (state.header?.work?.titles ?? [])
    .map((value) => safeText(value))
    .filter(Boolean);
  const planTitle = titles.length > 1 ? titles[0] : '';
  const statusLeft = [
    color(theme, state.header?.work?.color ?? 'accent', current.label, true),
    ...(activityText
      ? [minorSeparator(theme), color(theme, 'accent', activityText)]
      : []),
    semanticSeparator(theme),
    color(theme, state.header?.work?.color ?? 'accent', current.focus),
    ...(planTitle
      ? [
          minorSeparator(theme, state.header?.work?.color ?? 'accent'),
          color(theme, state.header?.work?.color ?? 'accent', planTitle),
        ]
      : []),
  ].join(' ');
  const focusLines = narrativeLines(state, boundedWidth, 2).map((line) =>
    color(theme, state.header?.work?.color ?? 'accent', line),
  );

  const rows = [
    top,
    ...alignedRows(statusLeft, progressLine(state, theme), boundedWidth),
    ...focusLines,
    divider,
    ...alignedRows(projectLeft(state, theme), gitRight(state, theme), boundedWidth),
    divider,
    ...alignedRows(globalLeft(state, theme), globalRight(state, theme), boundedWidth),
    ...alignedRows(localLeft(state, theme), localRight(state, theme), boundedWidth),
    bottom,
  ];
  return rows.map((line) => fit(line, boundedWidth));
}
