import { truncateToWidth, visibleWidth } from '@earendil-works/pi-tui';

export const FANCY_FOOTER_WIDGET_CHANNEL = 'pi-fancy-footer:widget';

const TRACKED_WIDGET_IDS = new Set([
  'galactica.openspec-progress',
  'galactica.openspec',
  'galactica.work',
  'galactica.goal',
  'galactica.project-capabilities',
  'galactica.session-memory',
  'galactica.session-cpu',
  'galactica.context-usage',
  'galactica.compaction-count',
  'galactica.runtime-state',
]);

const COLORS = [
  'text',
  'accent',
  'muted',
  'dim',
  'success',
  'error',
  'warning',
  'borderAccent',
  'customMessageLabel',
  'thinkingHigh',
] as const;

export type PromptRailColor = (typeof COLORS)[number];
export type PromptRailColorize = (color: PromptRailColor, text: string) => string;

type RailWidget = {
  id: string;
  text: string;
  icon: string;
  color: PromptRailColor;
};

export type PromptRailSnapshot = {
  widgets: ReadonlyMap<string, RailWidget>;
  totalCost: number;
};

type StyledText = { plain: string; styled: string };

const ANSI_ESCAPE = new RegExp(
  '\\u001b(?:\\][\\s\\S]*?(?:\\u0007|\\u001b\\\\)|\\[[0-?]*[ -/]*[@-~]|[@-_])',
  'gu',
);
const CONTROL_CHARACTER = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f]', 'gu');

function normalizeInline(value: string, maximum = 128): string {
  return Array.from(
    value
      .replace(/\u2800/gu, ' ')
      .replace(ANSI_ESCAPE, '')
      .replace(CONTROL_CHARACTER, ' ')
      .replace(/\s+/gu, ' ')
      .trim(),
  )
    .slice(0, maximum)
    .join('');
}

function isColor(value: unknown): value is PromptRailColor {
  return typeof value === 'string' && (COLORS as readonly string[]).includes(value);
}

function resolveIcon(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  const glyphs = (value as Record<string, unknown>).glyphs;
  if (typeof glyphs === 'string') return normalizeInline(glyphs, 16);
  if (!glyphs || typeof glyphs !== 'object' || Array.isArray(glyphs)) return '';
  const choices = glyphs as Record<string, unknown>;
  for (const family of ['nerd', 'unicode', 'ascii']) {
    if (typeof choices[family] === 'string') {
      return normalizeInline(choices[family] as string, 16);
    }
  }
  return '';
}

function parseWidget(value: unknown): RailWidget | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const widget = value as Record<string, unknown>;
  if (typeof widget.id !== 'string' || !TRACKED_WIDGET_IDS.has(widget.id)) return null;

  const content = widget.content;
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null;
  const contentRecord = content as Record<string, unknown>;
  if (contentRecord.type !== 'text' || typeof contentRecord.text !== 'string') {
    return null;
  }
  const text = normalizeInline(contentRecord.text);
  const icon = resolveIcon(widget.icon);
  const style =
    widget.style && typeof widget.style === 'object' && !Array.isArray(widget.style)
      ? (widget.style as Record<string, unknown>)
      : undefined;
  const iconRecord =
    widget.icon && typeof widget.icon === 'object' && !Array.isArray(widget.icon)
      ? (widget.icon as Record<string, unknown>)
      : undefined;
  const color = isColor(style?.textColor)
    ? style.textColor
    : isColor(iconRecord?.color)
      ? iconRecord.color
      : 'accent';

  return { id: widget.id, text, icon, color };
}

export class PromptRailStore {
  private readonly widgets = new Map<string, RailWidget>();
  private totalCost = 0;

  apply(raw: unknown): boolean {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
    const message = raw as Record<string, unknown>;
    if (message.protocol !== 1 || typeof message.type !== 'string') return false;

    if (message.type === 'remove') {
      return typeof message.id === 'string' && this.widgets.delete(message.id);
    }
    if (message.type !== 'upsert') return false;

    const widget = parseWidget(message.widget);
    if (!widget) return false;
    const previous = this.widgets.get(widget.id);
    if (previous && JSON.stringify(previous) === JSON.stringify(widget)) return false;
    this.widgets.set(widget.id, widget);
    return true;
  }

  setTotalCost(value: number): boolean {
    const next = Number.isFinite(value) ? Math.max(0, value) : 0;
    if (next === this.totalCost) return false;
    this.totalCost = next;
    return true;
  }

  clear(): void {
    this.widgets.clear();
    this.totalCost = 0;
  }

  snapshot(): PromptRailSnapshot {
    return { widgets: new Map(this.widgets), totalCost: this.totalCost };
  }
}

export function collectSessionCost(entries: readonly unknown[]): number {
  let total = 0;
  for (const rawEntry of entries) {
    if (!rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) continue;
    const entry = rawEntry as Record<string, unknown>;
    if (entry.type !== 'message') continue;
    const message = entry.message;
    if (!message || typeof message !== 'object' || Array.isArray(message)) continue;
    const candidate = message as Record<string, unknown>;
    if (candidate.role !== 'assistant') continue;
    const usage = candidate.usage;
    if (!usage || typeof usage !== 'object' || Array.isArray(usage)) continue;
    const cost = (usage as Record<string, unknown>).cost;
    if (!cost || typeof cost !== 'object' || Array.isArray(cost)) continue;
    const value = Number((cost as Record<string, unknown>).total);
    if (Number.isFinite(value) && value > 0) total += value;
  }
  return total;
}

export function formatCompactCost(cost: number): string {
  const normalized = Number.isFinite(cost) ? Math.max(0, cost) : 0;
  if (normalized === 0) return '$0';
  const decimals =
    normalized >= 0.01
      ? 2
      : Math.min(6, Math.max(3, Math.ceil(-Math.log10(normalized)) + 1));
  return `$${normalized.toFixed(decimals).replace(/\.?0+$/u, '')}`;
}

function widgetText(
  widget: RailWidget | undefined,
  colorize: PromptRailColorize,
): StyledText | null {
  if (!widget) return null;
  const plain = [widget.icon, widget.text].filter(Boolean).join(' ');
  return plain ? { plain, styled: colorize(widget.color, plain) } : null;
}

function literal(
  text: string,
  color: PromptRailColor,
  colorize: PromptRailColorize,
): StyledText {
  return { plain: text, styled: colorize(color, text) };
}

function join(
  items: Array<StyledText | null | undefined>,
  separator = ' ',
): StyledText | null {
  const present = items.filter((item): item is StyledText => Boolean(item?.plain));
  if (present.length === 0) return null;
  return {
    plain: present.map((item) => item.plain).join(separator),
    styled: present.map((item) => item.styled).join(separator),
  };
}

function workWidget(widgets: ReadonlyMap<string, RailWidget>): RailWidget | undefined {
  for (const id of [
    'galactica.openspec-progress',
    'galactica.openspec',
    'galactica.goal',
    'galactica.work',
  ]) {
    const widget = widgets.get(id);
    if (widget) return widget;
  }
  return undefined;
}

function railSlice(base: string, width: number): string {
  return truncateToWidth(base, Math.max(0, width), '');
}

function composeRail(
  base: string,
  width: number,
  left: StyledText | null,
  right: StyledText | null,
  leftInset = 8,
  suffixWidth = 2,
): string | null {
  if (width <= 0) return '';
  const leftWidth = left ? visibleWidth(left.styled) : 0;
  const rightWidth = right ? visibleWidth(right.styled) : 0;
  const prefix = left ? Math.min(leftInset, Math.max(2, width - 1)) : 0;
  const occupied =
    prefix + (left ? 2 + leftWidth : 0) + (right ? 2 + rightWidth : 0) + suffixWidth;
  const fillWidth = width - occupied;
  if (fillWidth < 2) return null;

  let output = railSlice(base, prefix + fillWidth);
  if (left) {
    output = `${railSlice(base, prefix)} ${left.styled} ${railSlice(base, fillWidth)}`;
  }
  if (right) {
    output += ` ${right.styled} ${railSlice(base, suffixWidth)}`;
  } else {
    output += railSlice(base, suffixWidth);
  }
  return output;
}

export function renderPromptRails(options: {
  lines: string[];
  width: number;
  snapshot: PromptRailSnapshot;
  mode: StyledText;
  colorize: PromptRailColorize;
}): string[] {
  const { lines, width, snapshot, mode, colorize } = options;
  if (lines.length === 0 || width <= 0) return lines;

  const topBase = lines[0] ?? '';
  const bottomIndex = lines.length - 1;
  const bottomBase = lines[bottomIndex] ?? topBase;
  const widgets = snapshot.widgets;

  const runtimeWidget = widgets.get('galactica.runtime-state');
  const runtime = literal(
    runtimeWidget?.text || "00:00'00",
    runtimeWidget?.color ?? 'dim',
    colorize,
  );
  const capability = widgetText(
    widgets.get('galactica.project-capabilities'),
    colorize,
  );
  const work = widgetText(workWidget(widgets), colorize);
  const capabilityBoundary =
    capability && work ? literal('⟩', 'thinkingHigh', colorize) : null;
  const topTelemetry = join([capability, capabilityBoundary, work]);
  const topLayouts = [
    { left: mode, right: topTelemetry },
    { left: mode, right: work },
    { left: mode, right: null },
  ];
  let renderedTop: string | null = null;
  for (const layout of topLayouts) {
    renderedTop = composeRail(topBase, width, layout.left, layout.right, 1);
    if (renderedTop !== null) break;
  }
  lines[0] = renderedTop ?? railSlice(topBase, width);

  const memory = widgetText(widgets.get('galactica.session-memory'), colorize);
  const cpu = widgetText(widgets.get('galactica.session-cpu'), colorize);
  const context = widgetText(widgets.get('galactica.context-usage'), colorize);
  const compaction = widgetText(widgets.get('galactica.compaction-count'), colorize);
  const contextTelemetry = join([context, compaction]);
  const cost =
    snapshot.totalCost > 0
      ? join([
          literal('⟩', 'thinkingHigh', colorize),
          literal(formatCompactCost(snapshot.totalCost), 'accent', colorize),
        ])
      : null;
  const resources = join([memory, cpu]);
  const separatedResources = resources
    ? join([literal('⟩', 'thinkingHigh', colorize), resources])
    : null;
  const fullTelemetry = join([contextTelemetry, separatedResources, cost]);
  const compactTelemetry = join([context, separatedResources, cost]);
  const contextAndCost = join([contextTelemetry, cost]);
  const bottomLayouts = [
    { left: runtime, right: fullTelemetry },
    { left: runtime, right: compactTelemetry },
    { left: runtime, right: contextAndCost },
    { left: runtime, right: context },
    { left: runtime, right: cost },
    { left: runtime, right: null },
  ];
  let renderedBottom: string | null = null;
  for (const layout of bottomLayouts) {
    renderedBottom = composeRail(bottomBase, width, layout.left, layout.right, 1);
    if (renderedBottom !== null) break;
  }
  lines[bottomIndex] = renderedBottom ?? railSlice(bottomBase, width);
  return lines;
}
