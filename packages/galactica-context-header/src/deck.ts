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
  contextPercent: number;
  compactionCount: number;
  resources?: ResourceTelemetry;
  footerTelemetry?: FooterTelemetrySnapshot;
  lsp: LspCapability | null;
  mcp: McpCapability | null;
  mode: VimMode;
}

const MODE_ICONS: Record<VimMode, string> = {
  insert: '󰏫',
  normal: '󰆾',
  visual: '󰒅',
  'visual-line': '󰒅',
  ex: '󰆍',
};

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

function ornament(width: number, prefix: string, fill: string, suffix: string): string {
  const fillWidth = Math.max(0, width - visibleWidth(prefix) - visibleWidth(suffix));
  return fit(`${prefix}${fill.repeat(fillWidth)}${suffix}`, width);
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
        : activeFocus || titleFocus || 'next direction',
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
  if (titles.length > 1) {
    return titles
      .slice(0, maximumLines)
      .map((line) => truncateToWidth(line, width, '…'));
  }
  const path = (work?.activityPath ?? [])
    .map((segment) => safeText(segment.label))
    .filter(Boolean);
  return wrapFocus([...titles, ...path].join(' › '), width, maximumLines);
}

function semanticSeparator(theme: Theme): string {
  return color(theme, 'thinkingHigh', '⟩', true);
}

function projectLine(state: HeaderDeckState, theme: Theme): string {
  const pathIcon = state.devbox ? '[󰆧] ' : '';
  const path = color(theme, 'success', `${pathIcon} ${safeText(state.cwd)}`, true);
  const branchText = state.branch || (state.gitAvailable ? '(detached)' : '(no Git)');
  const branch = color(
    theme,
    state.branch ? 'success' : 'dim',
    ` ${safeText(branchText, 80)}`,
  );
  return `${path}  ${color(theme, 'dim', '·')}  ${branch}`;
}

function gitLine(state: HeaderDeckState, theme: Theme): string {
  return [
    color(
      theme,
      state.git.staged > 0 ? 'success' : 'dim',
      ` ${state.git.staged} staged`,
    ),
    color(
      theme,
      state.git.modified > 0 ? 'warning' : 'dim',
      ` ${state.git.modified} modified`,
    ),
    color(
      theme,
      state.git.untracked > 0 ? 'accent' : 'dim',
      ` ${state.git.untracked} untracked`,
    ),
    color(
      theme,
      state.git.conflicts > 0 ? 'error' : 'dim',
      ` ${state.git.conflicts} conflicts`,
    ),
  ].join(`  ${color(theme, 'dim', '·')}  `);
}

function operationsLine(state: HeaderDeckState, theme: Theme): string {
  const counters = state.header?.counters;
  const agents = counters?.agents ?? { active: 0, total: 0 };
  const steps = counters?.steps;
  const files = counters?.files;
  const work = [
    color(
      theme,
      agents.active > 0 ? 'accent' : 'dim',
      `󰚩 agts ${agents.active}/${agents.total}`,
    ),
    semanticSeparator(theme),
    color(
      theme,
      steps ? 'accent' : 'dim',
      `󰦕 stps ${steps ? `${steps.completed}/${steps.total}` : '—'}`,
    ),
    color(
      theme,
      files ? 'accent' : 'dim',
      `󰈔 files ${files ? `${files.completed}/${files.total}` : '—'}`,
    ),
    semanticSeparator(theme),
    color(
      theme,
      state.lsp ? 'accent' : 'dim',
      `󰒋 LSP ${state.lsp ? `${state.lsp.healthy}/${state.lsp.total}` : '—'}`,
    ),
    color(
      theme,
      state.mcp ? 'accent' : 'dim',
      ` MCP ${state.mcp ? `${state.mcp.healthy}/${state.mcp.total}` : '—'}`,
    ),
  ];
  return work.join('  ');
}

function modelLine(state: HeaderDeckState, theme: Theme): string {
  const ctxColor = state.contextPercent >= 85 ? 'warning' : 'accent';
  const quota = state.footerTelemetry?.quotaPercent;
  const quotaColor =
    quota !== undefined && quota >= 80
      ? 'warning'
      : quota === undefined
        ? 'dim'
        : 'accent';
  const resources = state.resources;
  const resourceColor =
    resources?.cpuWarning || resources?.memoryWarning
      ? 'warning'
      : resources
        ? 'accent'
        : 'dim';
  const resourceText = resources
    ? `${formatDeckCpu(resources.cpuPercent)} (${formatDeckBytes(resources.memoryBytes)})`
    : '—';
  const cost = state.footerTelemetry?.totalCost ?? 0;
  return [
    color(theme, 'accent', `󰚩 ${safeText(state.model, 80)}`),
    color(
      theme,
      state.thinking ? 'thinkingHigh' : 'dim',
      `󰧑 ${safeText(state.thinking || 'off', 16)}`,
    ),
    semanticSeparator(theme),
    color(theme, ctxColor, `󰾆 ctx ${formatDeckPercent(state.contextPercent)}`),
    color(
      theme,
      state.compactionCount > 0 ? ctxColor : 'dim',
      `󰎞 zips ${state.compactionCount}`,
    ),
    color(
      theme,
      quotaColor,
      ` qta ${quota === undefined ? '—' : formatDeckPercent(quota)}`,
    ),
    semanticSeparator(theme),
    color(theme, resourceColor, ` ${resourceText}`),
    semanticSeparator(theme),
    color(theme, 'accent', `󰜦 ${formatCost(cost)}`),
  ].join('  ');
}

export function renderHeaderDeck(
  state: HeaderDeckState,
  width: number,
  theme: Theme,
): string[] {
  const boundedWidth = Math.max(0, Math.floor(width));
  if (boundedWidth === 0) return [];

  const narrative = lifecycle(state);
  const top = color(
    theme,
    'thinkingMax',
    ornament(boundedWidth, '─ 󰠭 > ', '─', ''),
    true,
  );
  const status = fit(
    `${color(theme, 'accent', formatDeckElapsed(state.elapsedMs), true)} ${semanticSeparator(theme)} ${color(theme, state.header?.work?.color ?? 'accent', narrative.label, true)} › ${color(theme, state.header?.work?.color ?? 'accent', narrative.focus)}`,
    boundedWidth,
  );
  const focusLines = narrativeLines(
    state,
    boundedWidth,
    boundedWidth >= 80 ? 2 : 1,
  ).map((line) => color(theme, state.header?.work?.color ?? 'accent', line));
  const divider = color(theme, 'borderMuted', '─'.repeat(boundedWidth));
  const mode = MODE_ICONS[state.mode];
  const bottom = color(
    theme,
    'thinkingMax',
    ornament(boundedWidth, `${mode} `, '═', ' < 󰠭 ══'),
    true,
  );

  if (boundedWidth < 40) {
    return [top, status, fit(modelLine(state, theme), boundedWidth), bottom].map(
      (line) => fit(line, boundedWidth),
    );
  }
  if (boundedWidth < 60) {
    return [
      top,
      status,
      ...focusLines,
      divider,
      projectLine(state, theme),
      divider,
      modelLine(state, theme),
      bottom,
    ].map((line) => fit(line, boundedWidth));
  }
  if (boundedWidth < 80) {
    return [
      top,
      status,
      ...focusLines,
      divider,
      projectLine(state, theme),
      divider,
      operationsLine(state, theme),
      modelLine(state, theme),
      bottom,
    ].map((line) => fit(line, boundedWidth));
  }
  return [
    top,
    status,
    ...focusLines,
    divider,
    projectLine(state, theme),
    gitLine(state, theme),
    divider,
    operationsLine(state, theme),
    modelLine(state, theme),
    bottom,
  ].map((line) => fit(line, boundedWidth));
}
