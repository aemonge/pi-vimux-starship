import { truncateToWidth, visibleWidth } from '@earendil-works/pi-tui';

import type { HeaderActivity, HeaderActivitySegment, HeaderWork } from './gauge.ts';

export const ACTIVE_STATUS_ICON = '';
export const PASSIVE_STATUS_ICON = '';
export const MAJOR_SEPARATOR = '⟩';
export const MINOR_SEPARATOR = '›';
export const FOCUS_ICON = MAJOR_SEPARATOR;
export const LIFECYCLE_CELL_BUDGET = Math.max(
  visibleWidth(`${ACTIVE_STATUS_ICON} understand`),
  visibleWidth(`${PASSIVE_STATUS_ICON} understand`),
);
const MAJOR_PREFIX = ` ${MAJOR_SEPARATOR} `;
const MINOR_PREFIX = ` ${MINOR_SEPARATOR} `;
const MIN_FOCUS_TEXT_CELLS = 4;
const ANSI_SGR = /\u001b\[[0-?]*[ -/]*[@-~]/gu;

type ActivityLabels = { full: string; compact: string };

const ACTIVITY_LABELS: Record<HeaderActivity['kind'], ActivityLabels> = {
  understanding: { full: 'interpreting current request', compact: 'interpreting' },
  inspection: { full: 'inspecting project context', compact: 'inspection' },
  synthesis: { full: 'finalizing current request', compact: 'finalizing' },
  planning: { full: 'preparing implementation plan', compact: 'planning' },
  'skill-proposal': {
    full: 'preparing skill proposal',
    compact: 'skill proposal',
  },
  mutation: { full: 'updating selected files', compact: 'update' },
  implementation: {
    full: 'implementing selected change',
    compact: 'implementation',
  },
  'change-review': {
    full: 'reviewing applied changes',
    compact: 'reviewing changes',
  },
  regression: { full: 'running regression', compact: 'regression' },
  verification: {
    full: 'running focused verification',
    compact: 'verification',
  },
  'result-review': {
    full: 'reviewing check results',
    compact: 'reviewing results',
  },
  recovery: { full: 'repairing bounded failure', compact: 'repair' },
  'awaiting-validation': {
    full: 'Human validation',
    compact: 'validation',
  },
  'awaiting-input': {
    full: 'next direction',
    compact: 'input',
  },
  'operation-aborted': {
    full: 'operation aborted',
    compact: 'aborted',
  },
};

const DISPLAY_LIFECYCLES: Readonly<Record<string, string>> = {
  understanding: 'understand',
  working: 'work',
  waiting: 'wait',
  assuring: 'assure',
  learning: 'learn',
  answering: 'answer',
  blocked: 'blocked',
  listening: 'ready',
  aborted: 'stopped',
};

const ACTIVE_LIFECYCLES = new Set([
  'understanding',
  'working',
  'assuring',
  'learning',
  'answering',
]);

export type LifecycleTitleLayout = {
  anchor: string;
  lifecycle: string;
  activity: string;
  focusBoundary: string;
  focus: string;
  focusDetail: string;
};

export const TITLE_SECTION_COLORS = {
  anchor: 'accent',
  lifecycle: 'accent',
  activity: 'accent',
  focusBoundary: 'thinkingHigh',
  focus: 'success',
  focusDetail: 'success',
  emptyFocus: 'dim',
} as const;

const EMPTY_FOCUS_LABELS = new Set(['no focus', 'no openspec', 'no focused task']);

type TitleSectionColor = 'accent' | 'thinkingHigh' | 'success' | 'dim';

export function lifecycleSectionColor(_lifecycle: string): 'accent' {
  return TITLE_SECTION_COLORS.lifecycle;
}

export function focusSectionColor(focus: string): 'success' | 'dim' {
  return EMPTY_FOCUS_LABELS.has(focus.trim().toLowerCase())
    ? TITLE_SECTION_COLORS.emptyFocus
    : TITLE_SECTION_COLORS.focus;
}

export function renderLifecycleTitleSections(
  layout: LifecycleTitleLayout,
  lifecycle: string,
  _idle: boolean,
  theme: {
    fg: (color: TitleSectionColor, text: string) => string;
    bold: (text: string) => string;
  },
): string {
  const focusColor = focusSectionColor(layout.focus);
  return (
    theme.fg(TITLE_SECTION_COLORS.anchor, theme.bold(layout.anchor)) +
    theme.fg(lifecycleSectionColor(lifecycle), theme.bold(layout.lifecycle)) +
    theme.fg(TITLE_SECTION_COLORS.activity, layout.activity) +
    theme.fg(TITLE_SECTION_COLORS.focusBoundary, layout.focusBoundary) +
    theme.fg(focusColor, theme.bold(layout.focus)) +
    theme.fg(focusColor, layout.focusDetail)
  );
}

function boundedWidth(width: number): number {
  return Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;
}

function truncatePlainToWidth(text: string, width: number): string {
  return truncateToWidth(text, width, '…').replace(ANSI_SGR, '');
}

function progressSuffix(
  activity: Pick<HeaderActivitySegment, 'current' | 'total'>,
): string {
  if (activity.current === undefined || activity.total === undefined) return '';
  return ` ${activity.current}/${activity.total}`;
}

export function activityLabels(activity: HeaderActivity): ActivityLabels {
  const labels = ACTIVITY_LABELS[activity.kind];
  const progress = progressSuffix(activity);
  return {
    full: `${labels.full}${progress}`,
    compact: `${labels.compact}${progress}`,
  };
}

export function activitySegmentLabels(segment: HeaderActivitySegment): ActivityLabels {
  const progress = progressSuffix(segment);
  return {
    full: `${segment.label}${progress}`,
    compact: `${segment.compact ?? segment.label}${progress}`,
  };
}

export function effectiveActivityPathLabels(work: HeaderWork): ActivityLabels[] {
  if (work.activityPath !== undefined) {
    return work.activityPath.map(activitySegmentLabels);
  }
  return work.activity ? [activityLabels(work.activity)] : [];
}

type FittedFocus = { primary: string; detail: string };

function fitNarrativeTitleSections(
  titles: readonly string[],
  width: number,
): FittedFocus {
  const available = boundedWidth(width);
  if (available <= 0 || titles.length === 0) return { primary: '', detail: '' };
  for (let start = 0; start < titles.length; start += 1) {
    const visibleTitles = titles.slice(start);
    const candidate = visibleTitles.join(' › ');
    if (visibleWidth(candidate) <= available) {
      return {
        primary: visibleTitles[0] ?? '',
        detail:
          visibleTitles.length > 1
            ? `${MINOR_PREFIX}${visibleTitles.slice(1).join(MINOR_PREFIX)}`
            : '',
      };
    }
  }
  return {
    primary: truncatePlainToWidth(titles.at(-1) ?? '', available),
    detail: '',
  };
}

export function fitNarrativeTitles(titles: readonly string[], width: number): string {
  const fitted = fitNarrativeTitleSections(titles, width);
  return `${fitted.primary}${fitted.detail}`;
}

function statusPrefix(work: HeaderWork, agentBusy: boolean): string {
  const lifecycleIsActive = ACTIVE_LIFECYCLES.has(work.lifecycle.trim().toLowerCase());
  return `${agentBusy && lifecycleIsActive ? ACTIVE_STATUS_ICON : PASSIVE_STATUS_ICON} `;
}

export function lifecycleDisplayLabel(lifecycle: string): string {
  const normalized = lifecycle.trim().toLowerCase();
  return DISPLAY_LIFECYCLES[normalized] ?? normalized;
}

function fullLifecycle(work: HeaderWork, agentBusy: boolean): string {
  return truncatePlainToWidth(
    `${statusPrefix(work, agentBusy)}${lifecycleDisplayLabel(work.lifecycle)}`,
    LIFECYCLE_CELL_BUDGET,
  );
}

function compactLifecycle(work: HeaderWork, agentBusy: boolean): string {
  return `${statusPrefix(work, agentBusy)}${truncatePlainToWidth(
    lifecycleDisplayLabel(work.lifecycle),
    10,
  )}`;
}

function sectionLayout(
  lifecycle: string,
  activity = '',
  focusBoundary = '',
  focus = '',
  focusDetail = '',
): LifecycleTitleLayout {
  const prefix = [ACTIVE_STATUS_ICON, PASSIVE_STATUS_ICON]
    .map((icon) => `${icon} `)
    .find((candidate) => lifecycle.startsWith(candidate));
  if (prefix) {
    return {
      anchor: prefix,
      lifecycle: lifecycle.slice(prefix.length),
      activity,
      focusBoundary,
      focus,
      focusDetail,
    };
  }
  return {
    anchor: lifecycle,
    lifecycle: '',
    activity,
    focusBoundary,
    focus,
    focusDetail,
  };
}

function fitActivityFocus(
  lifecycle: string,
  activity: string,
  titles: readonly string[],
  width: number,
): LifecycleTitleLayout | null {
  const activityTail = `${MINOR_PREFIX}${activity}`;
  const coreWidth = visibleWidth(lifecycle) + visibleWidth(activityTail);
  if (coreWidth > width) return null;

  const focusWidth = width - coreWidth - visibleWidth(MAJOR_PREFIX);
  const focus =
    focusWidth >= MIN_FOCUS_TEXT_CELLS
      ? fitNarrativeTitleSections(titles, focusWidth)
      : { primary: '', detail: '' };
  return sectionLayout(
    lifecycle,
    activityTail,
    focus.primary ? MAJOR_PREFIX : '',
    focus.primary,
    focus.detail,
  );
}

function fitStructuredActivityFocus(
  lifecycle: string,
  activities: readonly string[],
  titles: readonly string[],
  width: number,
  requireFocus: boolean,
): LifecycleTitleLayout | null {
  const activityTail = activities.map((label) => `${MINOR_PREFIX}${label}`).join('');
  const coreWidth = visibleWidth(lifecycle) + visibleWidth(activityTail);
  if (coreWidth > width) return null;
  if (titles.length === 0) return sectionLayout(lifecycle, activityTail);

  const focusWidth = width - coreWidth - visibleWidth(MAJOR_PREFIX);
  const focus =
    focusWidth >= MIN_FOCUS_TEXT_CELLS
      ? fitNarrativeTitleSections(titles, focusWidth)
      : { primary: '', detail: '' };
  if (requireFocus && !focus.primary) return null;
  return sectionLayout(
    lifecycle,
    activityTail,
    focus.primary ? MAJOR_PREFIX : '',
    focus.primary,
    focus.detail,
  );
}

function distinctActivityVariants(labels: readonly ActivityLabels[]): string[][] {
  const candidates: string[][] = [
    labels.map((label) => label.full),
    labels.map((label) => label.compact),
  ];
  if (labels.length > 1) {
    candidates.push(['…', labels.at(-1)?.full ?? '']);
  }

  const signatures = new Set<string>();
  return candidates.filter((candidate) => {
    const signature = candidate.join('\u0000');
    if (signatures.has(signature)) return false;
    signatures.add(signature);
    return true;
  });
}

function layoutStructuredActivityPath(
  work: HeaderWork,
  width: number,
  agentBusy: boolean,
): LifecycleTitleLayout {
  const labels = effectiveActivityPathLabels(work);
  const lifecycle = fullLifecycle(work, agentBusy);
  const variants = distinctActivityVariants(labels);

  for (const variant of variants) {
    const fitted = fitStructuredActivityFocus(
      lifecycle,
      variant,
      work.titles,
      width,
      work.titles.length > 0,
    );
    if (fitted) return fitted;
  }

  if (work.titles.length > 0) {
    for (const variant of variants) {
      const fitted = fitStructuredActivityFocus(lifecycle, variant, [], width, false);
      if (fitted) return fitted;
    }
  }

  const deepest = labels.at(-1);
  const emergencyLifecycle = compactLifecycle(work, agentBusy);
  if (deepest) {
    for (const deepestLabel of [deepest.full, deepest.compact]) {
      const fitted = fitStructuredActivityFocus(
        emergencyLifecycle,
        [deepestLabel],
        [],
        width,
        false,
      );
      if (fitted) return fitted;
    }
  }

  if (visibleWidth(emergencyLifecycle) >= width) {
    return sectionLayout(truncatePlainToWidth(emergencyLifecycle, width));
  }
  const remaining = width - visibleWidth(emergencyLifecycle);
  if (!deepest || remaining <= visibleWidth(MINOR_PREFIX)) {
    return sectionLayout(truncatePlainToWidth(emergencyLifecycle, width));
  }
  return sectionLayout(
    emergencyLifecycle,
    truncatePlainToWidth(`${MINOR_PREFIX}${deepest.compact}`, remaining),
  );
}

export function layoutLifecycleTitle(
  work: HeaderWork,
  width: number,
  agentBusy = ACTIVE_LIFECYCLES.has(work.lifecycle.trim().toLowerCase()),
): LifecycleTitleLayout {
  const available = boundedWidth(width);
  if (available <= 0) {
    return {
      anchor: '',
      lifecycle: '',
      activity: '',
      focusBoundary: '',
      focus: '',
      focusDetail: '',
    };
  }

  if (work.activityPath && work.activityPath.length > 0) {
    return layoutStructuredActivityPath(work, available, agentBusy);
  }

  if (!work.activity || work.activityPath !== undefined) {
    const lifecycle = fullLifecycle(work, agentBusy);
    const focus = fitNarrativeTitleSections(
      work.titles,
      Math.max(0, available - visibleWidth(lifecycle) - visibleWidth(MAJOR_PREFIX)),
    );
    return sectionLayout(
      lifecycle,
      '',
      focus.primary ? MAJOR_PREFIX : '',
      focus.primary,
      focus.detail,
    );
  }

  const lifecycle = fullLifecycle(work, agentBusy);
  const labels = activityLabels(work.activity);
  const full = fitActivityFocus(lifecycle, labels.full, work.titles, available);
  if (full) return full;

  const compactActivity = fitActivityFocus(lifecycle, labels.compact, [], available);
  if (compactActivity) return compactActivity;

  const emergencyLifecycle = compactLifecycle(work, agentBusy);
  const emergency = fitActivityFocus(emergencyLifecycle, labels.compact, [], available);
  if (emergency) return emergency;

  if (visibleWidth(emergencyLifecycle) >= available) {
    return sectionLayout(truncatePlainToWidth(emergencyLifecycle, available));
  }
  return sectionLayout(
    emergencyLifecycle,
    truncatePlainToWidth(
      ` · ${labels.compact}`,
      available - visibleWidth(emergencyLifecycle),
    ),
  );
}
