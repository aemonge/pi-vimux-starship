import type { SessionSubject, SessionWorkFocus } from './active-work.ts';
import type { GoalHeaderState } from './goal.ts';
import type { ActiveRunSpanView, ActiveRuntimeRuns } from './runtime-runs.ts';
import type {
  DiagnosticsState,
  FancyFooterMessage,
  FancyFooterWidget,
  OpenSpecFeedback,
  OpenSpecOverview,
  OpenSpecState,
  OrchestrationState,
  PublishOperation,
  SourceMeta,
  StatusSnapshot,
  WidgetColor,
} from './types.ts';

export const FANCY_FOOTER_PROTOCOL_VERSION = 1 as const;
export const FANCY_FOOTER_WIDGET_CHANNEL = 'pi-fancy-footer:widget';
export const FANCY_FOOTER_READY_CHANNEL = 'pi-fancy-footer:ready';
export const GALACTICA_HEADER_CHANNEL = 'galactica-status:header';

const OPEN_SPEC_WIDGET_ID = 'galactica.openspec';
const OPEN_SPEC_SCOPE_SEPARATOR_WIDGET_ID = 'galactica.openspec-scope-separator';
const OPEN_SPEC_PROGRESS_WIDGET_ID = 'galactica.openspec-progress';
const SESSION_WORK_WIDGET_ID = 'galactica.work';
const GOAL_WIDGET_ID = 'galactica.goal';
const DIAGNOSTICS_WIDGET_ID = 'galactica.diagnostics';
const ORCHESTRATION_WIDGET_ID = 'galactica.orchestration';

function normalizeInline(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

function shorten(value: string, maximum: number): string {
  const points = Array.from(normalizeInline(value));
  if (points.length <= maximum) return points.join('');
  return `${points.slice(0, Math.max(1, maximum - 1)).join('')}…`;
}

function normalizeChangeTitle(title: string): string {
  return normalizeInline(title).replace(
    /^(?:implement|create|build|add|shape|configure|support|manage|reconcile)\s+(?:an?\s+|the\s+)?/iu,
    '',
  );
}

function compactChangeTitle(title: string, maximum: number): string {
  return shorten(normalizeChangeTitle(title), maximum);
}

function focusedTaskText(
  task: { id: string; title: string },
  compact: boolean,
): string {
  const title = normalizeInline(task.title);
  const step = title.match(/^(?:Step|Task)\s+(\d+(?:\.\d+)*)(?:[.:])?\s+(.+)$/iu);
  const id = step?.[1] ?? task.id;
  const body = step?.[2] ?? title;
  return `${id} ${compact ? shorten(body, 14) : body}`;
}

function formatDuration(ms: number | undefined): string | undefined {
  if (ms === undefined || ms < 0) return undefined;
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1_000))}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  return `${Math.floor(ms / 3_600_000)}h`;
}

function ageText(updatedAt: number | undefined, now: number): string | undefined {
  if (!updatedAt) return undefined;
  return formatDuration(Math.max(0, now - updatedAt));
}

function isStale(meta: SourceMeta, now: number): boolean {
  return (
    meta.stale ||
    (meta.updatedAt !== undefined &&
      meta.staleAfterMs !== undefined &&
      now - meta.updatedAt > meta.staleAfterMs)
  );
}

function openSpecColor(state: OpenSpecState): WidgetColor {
  if (state.meta.stale) return 'warning';
  if (['blocked', 'error', 'failed'].includes(state.phase)) return 'error';
  if (state.phase === 'complete') return 'success';
  return 'accent';
}

export function formatSessionWork(focus: SessionWorkFocus): string {
  if (focus.state === 'clear') return 'Work · clear';
  return focus.state === 'validation'
    ? `Validate · ${focus.intent}`
    : `Work · ${focus.intent}`;
}

export function formatOpenSpecOverview(overview: OpenSpecOverview): string {
  return (
    `${overview.completedPlans}/${overview.totalPlans}` +
    ` ›  ${overview.completedTasks}/${overview.totalTasks}`
  );
}

export function formatOpenSpec(
  state: OpenSpecState,
  focusedTaskId: string | null,
  compact = false,
): string {
  const progress = `${state.completedTasks}/${state.totalTasks}`;
  const title = compact
    ? compactChangeTitle(state.title, 26)
    : normalizeChangeTitle(state.title);
  const stale = state.meta.stale
    ? `  stale ${ageText(state.meta.updatedAt, Date.now()) ?? ''}`.trimEnd()
    : '';

  if (state.phase === 'complete') return `${progress}  ${title}${stale}`;

  const activeTask = focusedTaskId
    ? (state.allTasks ?? state.pendingTasks).find((task) => task.id === focusedTaskId)
    : undefined;
  if (activeTask) {
    return `${progress}  ▶ ${focusedTaskText(activeTask, compact)}${stale}`;
  }

  return `${progress}  ${title}${stale}`;
}

function diagnosticsColor(state: DiagnosticsState, now: number): WidgetColor {
  if (
    state.errors + state.blockers > 0 ||
    state.tests === 'fail' ||
    state.typecheck === 'fail'
  ) {
    return 'error';
  }
  if (isStale(state.meta, now) || state.warnings > 0) return 'warning';
  if (state.tests === 'pass' || state.typecheck === 'pass') return 'success';
  return 'text';
}

function checkText(name: string, state: DiagnosticsState['tests']): string | undefined {
  if (state === 'pass') return `✓ ${name}`;
  if (state === 'fail') return `✗ ${name}`;
  if (state === 'running') return `◷ ${name}`;
  return undefined;
}

export function formatDiagnostics(
  state: DiagnosticsState,
  now = Date.now(),
  compact = false,
): string {
  const parts: string[] = [];
  const errors = state.errors + state.blockers;
  if (errors > 0) parts.push(`${errors}E`);
  if (state.warnings > 0 && !compact) parts.push(`${state.warnings}W`);
  if (errors === 0 && state.warnings === 0) parts.push('clean');

  const tests = checkText('tests', state.tests);
  const types = checkText('types', state.typecheck);
  if (tests) parts.push(tests);
  if (types && !compact) parts.push(types);
  if (isStale(state.meta, now)) {
    parts.push(`stale ${ageText(state.meta.updatedAt, now) ?? ''}`.trimEnd());
  }
  return parts.join('  ');
}

function orchestrationColor(state: OrchestrationState, now: number): WidgetColor {
  if (isStale(state.meta, now)) return 'warning';
  if (state.state === 'blocked') return 'error';
  if (state.state === 'complete') return 'success';
  return 'accent';
}

export function formatOrchestration(
  state: OrchestrationState,
  now = Date.now(),
  compact = false,
): string {
  if (state.state === 'blocked') {
    return `blocked${state.currentTask ? `: ${shorten(state.currentTask, compact ? 16 : 30)}` : ''}`;
  }
  if (state.state === 'complete') return 'complete';

  const elapsed =
    state.elapsedMs ??
    (state.startedAt ? Math.max(0, now - state.startedAt) : undefined);
  const parts: string[] = [];
  if (state.activeWorkers > 0) parts.push(String(state.activeWorkers));
  if (state.phase) parts.push(shorten(state.phase, compact ? 14 : 24));
  else if (state.currentTask) parts.push(shorten(state.currentTask, compact ? 14 : 24));
  if (!compact) {
    const duration = formatDuration(elapsed);
    if (duration) parts.push(duration);
  }
  if (isStale(state.meta, now)) parts.push('stale');
  return parts.join('  ') || state.state;
}

export function buildWidgetSnapshots(
  snapshot: StatusSnapshot,
  options: {
    compact?: boolean;
    now?: number;
    focusedTaskId?: string;
    openSpecFeedback?: OpenSpecFeedback;
    openSpecOverview?: OpenSpecOverview;
    openSpecProjectDetected?: boolean;
    workFocus?: SessionWorkFocus;
    goal?: GoalHeaderState | null;
  } = {},
): FancyFooterWidget[] {
  const compact = options.compact ?? false;
  const now = options.now ?? Date.now();
  const widgets: FancyFooterWidget[] = [];

  const hasActiveFallback =
    !options.openSpecOverview &&
    (Boolean(options.goal) ||
      Boolean(options.workFocus && options.workFocus.state !== 'clear'));

  if (
    options.openSpecOverview ||
    (options.openSpecProjectDetected === false && !hasActiveFallback)
  ) {
    widgets.push({
      id: OPEN_SPEC_SCOPE_SEPARATOR_WIDGET_ID,
      label: 'OpenSpec scope separator',
      description: 'Separates the working directory from OpenSpec state',
      content: { type: 'text', text: '⟩' },
      icon: false,
      style: { textColor: 'thinkingHigh' },
      layout: {
        enabled: false,
        row: 0,
        position: 0,
        align: 'right',
        fill: 'none',
      },
    });
  }

  if (options.openSpecOverview) {
    const overview = options.openSpecOverview;
    const complete =
      overview.totalPlans > 0 &&
      overview.completedPlans >= overview.totalPlans &&
      (overview.totalTasks === 0 || overview.completedTasks >= overview.totalTasks);
    const color: WidgetColor =
      overview.totalPlans === 0 ? 'dim' : complete ? 'success' : 'accent';
    widgets.push({
      id: OPEN_SPEC_PROGRESS_WIDGET_ID,
      label: 'OpenSpec progress',
      description: 'Aggregate completion across OpenSpec Plans and their Tasks',
      content: { type: 'text', text: formatOpenSpecOverview(overview) },
      icon: {
        glyphs: { nerd: '', emoji: '📋', unicode: '▤', ascii: 'P' },
        color,
      },
      style: { textColor: color },
      layout: { row: 0, position: 0, align: 'right', fill: 'none', minWidth: 8 },
    });
  } else if (options.openSpecProjectDetected === false && !hasActiveFallback) {
    widgets.push({
      id: OPEN_SPEC_PROGRESS_WIDGET_ID,
      label: 'OpenSpec progress',
      description: 'No OpenSpec project was found from the current project root',
      content: { type: 'text', text: 'no OpenSpec' },
      icon: {
        glyphs: { nerd: '', emoji: '📋', unicode: '▤', ascii: 'P' },
        color: 'dim',
      },
      style: { textColor: 'dim' },
      layout: { row: 0, position: 0, align: 'right', fill: 'none', minWidth: 8 },
    });
  }

  if (!snapshot.openspec && !options.openSpecOverview && options.goal) {
    widgets.push({
      id: GOAL_WIDGET_ID,
      label: 'Goal',
      description: 'Active Goal scope; its detailed objective remains in the header',
      content: { type: 'text', text: 'Goal' },
      icon: {
        glyphs: { nerd: '󰊕', emoji: '🎯', unicode: '◎', ascii: 'G' },
        color: goalHeaderColor(options.goal),
      },
      style: { textColor: goalHeaderColor(options.goal) },
      layout: {
        row: 0,
        position: 0,
        align: 'right',
        fill: 'none',
      },
    });
  } else if (
    !snapshot.openspec &&
    !options.openSpecOverview &&
    options.workFocus &&
    options.workFocus.state !== 'clear'
  ) {
    const color: WidgetColor =
      options.workFocus.state === 'validation' ? 'warning' : 'accent';
    const glyph =
      options.workFocus.state === 'validation'
        ? { nerd: '◇⠀', emoji: '◇⠀', unicode: '◇⠀', ascii: '? ' }
        : { nerd: '▶⠀', emoji: '▶⠀', unicode: '▶⠀', ascii: '> ' };
    widgets.push({
      id: SESSION_WORK_WIDGET_ID,
      label: options.workFocus.state === 'validation' ? 'Validate' : 'Focus',
      description:
        options.workFocus.state === 'validation'
          ? 'Session focus awaiting Human validation; its title remains in the header'
          : 'Active Session Work focus; its title remains in the header',
      content: {
        type: 'text',
        text: options.workFocus.state === 'validation' ? 'Validate' : 'Focus',
      },
      icon: { glyphs: glyph, color },
      style: { textColor: color },
      layout: {
        row: 0,
        position: 0,
        align: 'right',
        fill: 'none',
      },
    });
  }

  if (
    !snapshot.openspec &&
    !options.workFocus &&
    !options.goal &&
    options.openSpecFeedback
  ) {
    const unavailable = options.openSpecFeedback === 'unavailable';
    const color: WidgetColor = unavailable ? 'warning' : 'dim';
    const stateText =
      options.openSpecFeedback === 'no-focus' ? 'no focus' : options.openSpecFeedback;
    widgets.push({
      id: OPEN_SPEC_WIDGET_ID,
      label: 'OpenSpec',
      description: unavailable
        ? 'OpenSpec project detected, but its status is unavailable'
        : options.openSpecFeedback === 'no-focus'
          ? 'OpenSpec has actionable work, but this session has no task focus'
          : 'OpenSpec has no actionable task work',
      content: { type: 'text', text: `OpenSpec · ${stateText}` },
      icon: {
        glyphs: {
          nerd: '○⠀',
          emoji: '○⠀',
          unicode: '○⠀',
          ascii: 'o ',
        },
        color,
      },
      style: { textColor: color },
      layout: {
        row: 0,
        position: 8,
        align: 'left',
        fill: 'none',
        minWidth: 10,
      },
    });
  }

  if (snapshot.openspec) {
    const color = openSpecColor(snapshot.openspec);
    const checkbox =
      snapshot.openspec.phase === 'complete'
        ? '[x]'
        : ['blocked', 'error', 'failed'].includes(snapshot.openspec.phase)
          ? '[!]'
          : '[-]';
    widgets.push({
      id: OPEN_SPEC_WIDGET_ID,
      label: 'OpenSpec',
      description: 'Focused OpenSpec change, task progress, and pending work',
      content: {
        type: 'text',
        text: formatOpenSpec(snapshot.openspec, options.focusedTaskId ?? null, compact),
      },
      icon: {
        glyphs: {
          nerd: `${checkbox}⠀`,
          emoji: `${checkbox}⠀`,
          unicode: `${checkbox}⠀`,
          ascii: `${checkbox}⠀`,
        },
        color,
      },
      style: { textColor: color },
      layout: {
        row: 0,
        position: 8,
        align: 'left',
        fill: 'none',
        minWidth: 10,
      },
    });
  }

  if (snapshot.orchestration) {
    const color = orchestrationColor(snapshot.orchestration, now);
    widgets.push({
      id: ORCHESTRATION_WIDGET_ID,
      label: 'Orchestration',
      description: 'Local workflow phase, workers, task, and elapsed time',
      content: {
        type: 'text',
        text: formatOrchestration(snapshot.orchestration, now, compact),
      },
      icon: {
        glyphs:
          snapshot.orchestration.state === 'blocked'
            ? { nerd: '', emoji: '⚠️', unicode: '!', ascii: '!' }
            : { nerd: '', emoji: '👥', unicode: '◎', ascii: 'A' },
        color,
      },
      style: { textColor: color },
      layout: { row: 0, position: 9, align: 'left', fill: 'none', minWidth: 6 },
    });
  }

  if (snapshot.diagnostics) {
    const color = diagnosticsColor(snapshot.diagnostics, now);
    widgets.push({
      id: DIAGNOSTICS_WIDGET_ID,
      label: 'Diagnostics',
      description: 'Aggregate blockers, warnings, tests, types, and freshness',
      content: {
        type: 'text',
        text: formatDiagnostics(snapshot.diagnostics, now, compact),
      },
      icon: {
        glyphs: { nerd: '󰏫', emoji: '🧪', unicode: '◆', ascii: 'D' },
        color,
      },
      style: { textColor: color },
      layout: {
        row: 1,
        position: 0,
        align: 'right',
        fill: 'none',
        minWidth: 7,
      },
    });
  }

  return widgets;
}

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

export type HeaderActivitySegment = {
  id: string;
  label: string;
  compact?: string;
  current?: number;
  total?: number;
};

export const HEADER_LIFECYCLES = [
  'understanding',
  'working',
  'waiting',
  'assuring',
  'learning',
  'answering',
  'blocked',
  'listening',
  'aborted',
] as const;

export type HeaderLifecycle = (typeof HEADER_LIFECYCLES)[number];

export const HEADER_SELECTION_SOURCES = [
  'openspec',
  'goal',
  'session-work',
  'subject',
] as const;

export type HeaderSelection = {
  source: (typeof HEADER_SELECTION_SOURCES)[number];
  titles: string[];
  color: WidgetColor;
};

export const HEADER_SUGGESTIONS = [
  'requesting-validation',
  'awaiting-continuation',
  'requesting-redirection',
  'awaiting-resume',
  'requesting-input',
] as const;

export type HeaderSuggestion = (typeof HEADER_SUGGESTIONS)[number];

export type HeaderStatusEvent = {
  protocol: 1;
  activity: HeaderActivity | null;
  selection: HeaderSelection | null;
  suggestion: HeaderSuggestion | null;
  work: {
    lifecycle: string;
    titles: string[];
    color: WidgetColor;
    activity?: HeaderActivity;
    activityPath?: HeaderActivitySegment[];
  } | null;
  diagnostics: {
    text: string;
    color: WidgetColor;
    state: 'pass' | 'fail' | 'running';
  } | null;
  backgroundActivity: boolean;
  approvalRequired: boolean;
  blocked: boolean;
  activeRunSpans?: ActiveRunSpanView[];
  counters: {
    agents: { active: number; total: number };
    activeRuns?: ActiveRuntimeRuns;
    tasks?: { completed: number; total: number };
    steps?: { completed: number; total: number };
    files?: { completed: number; total: number };
  };
  progress: { icon: string; completed: number; total: number; color: WidgetColor }[];
};

function narrativeTaskTitle(title: string): string {
  return normalizeInline(title).replace(
    /^(?:Step|Task)\s+\d+(?:\.\d+)*(?:[.:])?\s+/iu,
    '',
  );
}

function selectedOpenSpecTitles(
  state: OpenSpecState,
  focusedTaskId: string | undefined,
): string[] {
  const activeTask = focusedTaskId
    ? (state.allTasks ?? state.pendingTasks).find((task) => task.id === focusedTaskId)
    : undefined;
  return activeTask
    ? [normalizeInline(state.title), narrativeTaskTitle(activeTask.title)]
    : [normalizeInline(state.changeId), normalizeInline(focusedTaskId ?? 'no focus')];
}

export function headerSelection(options: {
  openSpec?: OpenSpecState | null;
  focusedTaskId?: string;
  goal?: GoalHeaderState | null;
  workFocus?: SessionWorkFocus;
  subject?: SessionSubject;
}): HeaderSelection | null {
  if (options.openSpec) {
    return {
      source: 'openspec',
      titles: selectedOpenSpecTitles(options.openSpec, options.focusedTaskId),
      color: openSpecColor(options.openSpec),
    };
  }
  if (options.goal) {
    return {
      source: 'goal',
      titles: ['Goal'],
      color: goalHeaderColor(options.goal),
    };
  }
  if (options.workFocus && options.workFocus.state !== 'clear') {
    return {
      source: 'session-work',
      titles: [normalizeInline(options.workFocus.intent)],
      color: options.workFocus.state === 'validation' ? 'warning' : 'accent',
    };
  }
  if (options.subject && options.subject.state === 'set') {
    return {
      source: 'subject',
      titles: [normalizeInline(options.subject.title)],
      color: 'accent',
    };
  }
  return null;
}

function headerSuggestion(options: {
  lifecycle: HeaderLifecycle;
  activity?: HeaderActivity;
  selection: HeaderSelection | null;
  approvalRequired: boolean;
  blocked: boolean;
}): HeaderSuggestion | null {
  if (options.blocked) return 'requesting-redirection';
  if (options.approvalRequired || options.activity?.kind === 'awaiting-validation') {
    return 'requesting-validation';
  }
  if (options.activity?.kind === 'awaiting-input') return 'requesting-input';
  if (options.lifecycle === 'aborted') return 'awaiting-resume';
  if (['waiting', 'listening'].includes(options.lifecycle) && options.selection) {
    return 'awaiting-continuation';
  }
  return null;
}

export function classifyHeaderActivity(sourceText: string): HeaderActivity | undefined {
  const source = normalizeInline(sourceText).toLowerCase().replaceAll('-', ' ');
  if (!source) return undefined;
  if (/\bskill\s+proposal\b/u.test(source)) return { kind: 'skill-proposal' };
  if (/\b(?:regression|test|testing|test engineer|check|checking)\b/u.test(source)) {
    return { kind: 'regression' };
  }
  if (
    /\b(?:verify|verifier|verification|review|reviewer|audit|critic)\b/u.test(source)
  ) {
    return { kind: 'verification' };
  }
  if (/\b(?:recover|recovery|repair|fix)\b/u.test(source)) {
    return { kind: 'recovery' };
  }
  if (
    /\b(?:plan|planner|planning|proposal|design|scout|analyst|enrichment|spike)\b/u.test(
      source,
    )
  ) {
    return { kind: 'planning' };
  }
  if (
    /\b(?:implement|implementation|execute|executor|build|builder|edit|write|deliver|happy path)\b/u.test(
      source,
    )
  ) {
    return { kind: 'implementation' };
  }
  return undefined;
}

export function orchestrationHeaderActivity(
  state: OrchestrationState | null | undefined,
): HeaderActivity | undefined {
  if (!state || state.state !== 'running') return undefined;
  return classifyHeaderActivity(`${state.phase ?? ''} ${state.currentTask ?? ''}`);
}

export function headerLifecycleForActivity(
  activity: HeaderActivity | undefined,
): HeaderLifecycle | undefined {
  if (!activity) return undefined;
  if (
    ['understanding', 'inspection', 'synthesis', 'planning', 'skill-proposal'].includes(
      activity.kind,
    )
  ) {
    return 'understanding';
  }
  if (['regression', 'verification', 'result-review'].includes(activity.kind)) {
    return 'assuring';
  }
  if (['awaiting-validation', 'awaiting-input'].includes(activity.kind)) {
    return 'waiting';
  }
  if (activity.kind === 'operation-aborted') return 'aborted';
  return 'working';
}

export function goalHeaderLifecycle(
  goal: GoalHeaderState,
  activeFallback: HeaderLifecycle = 'working',
): HeaderLifecycle {
  if (goal.status === 'blocked') return 'blocked';
  if (goal.status === 'active' && !goal.waiting) return activeFallback;
  return 'waiting';
}

export function goalHeaderActivityPath(
  goal: GoalHeaderState,
  automaticTurnLimit?: number,
): HeaderActivitySegment[] {
  if (goal.status === 'complete') {
    return [
      {
        id: 'awaiting-human-validation',
        label: 'awaiting Human validation',
        compact: 'validation',
      },
    ];
  }
  if (goal.status === 'blocked') {
    return [{ id: 'goal-blocked', label: 'Goal blocked', compact: 'blocked' }];
  }
  if (goal.status === 'paused') {
    return [{ id: 'goal-paused', label: 'Goal paused', compact: 'paused' }];
  }
  if (goal.status === 'usage_limited') {
    return [
      {
        id: 'goal-usage-limited',
        label: 'Goal usage limited',
        compact: 'usage limit',
      },
    ];
  }
  if (goal.status === 'budget_limited') {
    return [
      {
        id: 'goal-budget-limited',
        label: 'Goal budget limited',
        compact: 'budget limit',
      },
    ];
  }
  if (goal.status === 'queued') {
    return [{ id: 'goal-queued', label: 'Goal queued', compact: 'queued' }];
  }
  if (goal.waiting) {
    return [
      {
        id: 'goal-waiting',
        label: 'waiting for external event',
        compact: 'waiting',
      },
    ];
  }
  return [
    {
      id: 'goal-work',
      label: 'completing Goal',
      compact: 'Goal',
      ...(automaticTurnLimit === undefined
        ? {}
        : {
            current: Math.min(goal.automaticModelTurns, automaticTurnLimit),
            total: automaticTurnLimit,
          }),
    },
  ];
}

function goalHeaderColor(goal: GoalHeaderState): WidgetColor {
  if (goal.status === 'blocked') return 'error';
  if (goal.status === 'active' && !goal.waiting) return 'accent';
  if (goal.status === 'complete') return 'warning';
  return 'dim';
}

export function orchestrationHeaderLifecycle(
  state: OrchestrationState | null | undefined,
): HeaderLifecycle | undefined {
  if (!state) return undefined;
  if (state.state === 'blocked') return 'blocked';
  if (state.state !== 'running') return undefined;
  const source = normalizeInline(
    `${state.phase ?? ''} ${state.currentTask ?? ''}`,
  ).toLowerCase();
  if (/\b(?:understand|scout|plan|analyst|enrichment|spike)\b/u.test(source)) {
    return 'understanding';
  }
  if (/\b(?:assure|verify|test|review|critic|gate)\b/u.test(source)) {
    return 'assuring';
  }
  if (/\b(?:learn|memory|evidence|retain)\b/u.test(source)) return 'learning';
  if (/\b(?:report(?:er|ing)?|relay|writer|answer)\b/u.test(source)) {
    return 'answering';
  }
  return 'working';
}

export function taskflowCallHeaderActivity(input: unknown): HeaderActivity | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined;
  const candidate = input as Record<string, unknown>;
  if (candidate.action !== 'run' || typeof candidate.name !== 'string') {
    return undefined;
  }
  return classifyHeaderActivity(candidate.name);
}

export function taskflowInitialHeaderPhase(input: unknown): string | undefined {
  const candidate = record(input);
  return candidate?.action === 'run' && candidate.name === 'ramona-loop'
    ? 'understanding'
    : undefined;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function boundedTaskflowPhase(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = normalizeInline(value);
  return normalized ? shorten(normalized, 64) : undefined;
}

export function taskflowUpdateHeaderPhase(partialResult: unknown): string | undefined {
  const details = record(record(partialResult)?.details);
  if (details?.action !== 'run') return undefined;
  const state = record(details.state);
  const phaseStates = record(state?.phases);
  if (!state || !phaseStates) return undefined;

  const promoted = new Set<string>();
  for (const phaseState of Object.values(phaseStates)) {
    const promotedPhases = record(record(phaseState)?.promotedPhases);
    if (!promotedPhases) continue;
    for (const id of Object.keys(promotedPhases)) promoted.add(id);
  }

  const definitions = record(state.def)?.phases;
  const orderedIds = Array.isArray(definitions)
    ? definitions.flatMap((definition) => {
        const id = boundedTaskflowPhase(record(definition)?.id);
        return id ? [id] : [];
      })
    : Object.keys(phaseStates).flatMap((id) => {
        const bounded = boundedTaskflowPhase(id);
        return bounded ? [bounded] : [];
      });

  return orderedIds.find((id) => {
    if (promoted.has(id)) return false;
    return record(phaseStates[id])?.status === 'running';
  });
}

export function taskflowPhaseHeaderLifecycle(phase: string): HeaderLifecycle {
  const normalized = normalizeInline(phase).toLowerCase();
  if (['ask-for-clarification', 'request-human-decision'].includes(normalized)) {
    return 'waiting';
  }
  if (normalized === 'explain-boundary') return 'blocked';
  const source = normalized.replaceAll('-', ' ');
  if (
    /\b(?:understand|gather|investigat|scout|plan|analyst|enrichment|spike)\w*\b/u.test(
      source,
    )
  ) {
    return 'understanding';
  }
  if (/\b(?:assur|verify|test|review|critic|gate)\w*\b/u.test(source)) {
    return 'assuring';
  }
  if (/\b(?:learn|memory|evidence|retain)\w*\b/u.test(source)) return 'learning';
  if (/\b(?:report|relay|writer|answer)\w*\b/u.test(source)) return 'answering';
  return 'working';
}

const GLOBAL_LOOP_ACTIVITY_PATHS: Readonly<
  Record<string, readonly HeaderActivitySegment[]>
> = {
  understanding: [
    {
      id: 'interpreting-intent',
      label: 'interpreting intent',
      compact: 'interpreting',
    },
  ],
  'gather-context': [
    { id: 'gathering-context', label: 'gathering context', compact: 'gathering' },
  ],
  'finalize-understanding': [
    {
      id: 'finalizing-understanding',
      label: 'finalizing current request',
      compact: 'finalizing',
    },
  ],
  'answer-now': [
    { id: 'preparing-answer', label: 'preparing answer', compact: 'answering' },
  ],
  'ask-for-clarification': [
    {
      id: 'awaiting-clarification',
      label: 'awaiting clarification',
      compact: 'clarification',
    },
  ],
  'explain-boundary': [
    { id: 'explaining-boundary', label: 'explaining boundary', compact: 'boundary' },
  ],
  working: [
    { id: 'completing-request', label: 'completing request', compact: 'working' },
  ],
  'request-human-decision': [
    { id: 'awaiting-decision', label: 'awaiting your decision', compact: 'decision' },
  ],
  assuring: [
    { id: 'checking-quality', label: 'checking quality', compact: 'checking' },
  ],
  'review-result': [
    { id: 'reviewing-result', label: 'reviewing result', compact: 'reviewing' },
  ],
  learning: [
    { id: 'capturing-learning', label: 'capturing learning', compact: 'learning' },
  ],
  answering: [
    { id: 'preparing-answer', label: 'preparing answer', compact: 'answering' },
  ],
};

export function taskflowPhaseHeaderActivityPath(
  phase: string,
): HeaderActivitySegment[] | undefined {
  const normalized = normalizeInline(phase).toLowerCase();
  const path = GLOBAL_LOOP_ACTIVITY_PATHS[normalized];
  return path?.map((segment) => ({ ...segment }));
}

function directCommandText(input: unknown): string {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return '';
  const command = (input as Record<string, unknown>).command;
  return typeof command === 'string' ? normalizeInline(command).toLowerCase() : '';
}

export function directToolCompletionHeaderActivity(
  activity: HeaderActivity | undefined,
  isError = false,
): HeaderActivity | undefined {
  if (!activity) return undefined;
  if (isError) return { kind: 'recovery' };
  if (
    ['understanding', 'inspection', 'planning', 'skill-proposal'].includes(
      activity.kind,
    )
  ) {
    return { kind: 'synthesis' };
  }
  if (['mutation', 'implementation', 'change-review'].includes(activity.kind)) {
    return { kind: 'change-review' };
  }
  if (['regression', 'verification', 'result-review'].includes(activity.kind)) {
    return { kind: 'result-review' };
  }
  return activity;
}

export function directToolHeaderActivity(
  toolName: string,
  input: unknown,
): HeaderActivity | undefined {
  const tool = normalizeInline(toolName).toLowerCase();
  if (['read', 'grep', 'find', 'ls', 'skill'].includes(tool)) {
    return { kind: 'inspection' };
  }
  if (['edit', 'write'].includes(tool)) return { kind: 'mutation' };
  if (tool !== 'bash') return undefined;

  const command = directCommandText(input);
  if (!command) return undefined;
  if (
    /\b(?:validate|verification|markdownlint|prettier\s+--check|typecheck|lint|node\s+--test|npm\s+(?:run\s+)?test|pytest|cargo\s+test)\b/u.test(
      command,
    )
  ) {
    return { kind: 'verification' };
  }
  if (/\bopenspec\s+(?:new|init|update|archive)\b/u.test(command)) {
    return { kind: 'mutation' };
  }
  if (
    /\bopenspec\s+(?:status|instructions|show|list|schemas|schema|context)\b/u.test(
      command,
    ) ||
    /(?:^|[;&|]\s*)(?:pwd|find|rg|grep|ls|stat|command\s+-v)\b/u.test(command)
  ) {
    return { kind: 'inspection' };
  }
  return undefined;
}

export function buildHeaderStatusEvent(
  widgets: readonly FancyFooterWidget[],
  options: {
    openSpec?: OpenSpecState | null;
    focusedTaskId?: string;
    workFocus?: SessionWorkFocus;
    subject?: SessionSubject;
    orchestration?: OrchestrationState | null;
    lifecycle?: HeaderLifecycle;
    activity?: HeaderActivity;
    activityPath?: HeaderActivitySegment[];
    taskflowPhase?: string;
    fallbackTitles?: string[];
    goal?: GoalHeaderState | null;
    goalAutomaticTurnLimit?: number;
    activeRuns?: ActiveRuntimeRuns;
    activeRunSpans?: ActiveRunSpanView[];
  } = {},
): HeaderStatusEvent {
  const diagnosticsWidget = widgets.find(
    (widget) => widget.id === DIAGNOSTICS_WIDGET_ID,
  );
  const diagnosticsState = diagnosticsWidget
    ? diagnosticsWidget.style?.textColor === 'error'
      ? 'fail'
      : diagnosticsWidget.content.text.includes('◷')
        ? 'running'
        : diagnosticsWidget.style?.textColor === 'success'
          ? 'pass'
          : null
    : null;

  const orchestration = options.orchestration;
  const blocked =
    orchestration?.state === 'blocked' ||
    options.goal?.status === 'blocked' ||
    Boolean(
      options.openSpec &&
      ['blocked', 'error', 'failed'].includes(options.openSpec.phase),
    );
  const activity =
    options.activity ?? orchestrationHeaderActivity(options.orchestration);
  const orchestrationLifecycle = orchestrationHeaderLifecycle(options.orchestration);
  const taskflowPhase = boundedTaskflowPhase(options.taskflowPhase);
  const activityPath =
    options.activityPath ??
    (taskflowPhase ? taskflowPhaseHeaderActivityPath(taskflowPhase) : undefined) ??
    (options.goal
      ? goalHeaderActivityPath(options.goal, options.goalAutomaticTurnLimit)
      : undefined);
  const ordinaryLifecycle =
    orchestrationLifecycle ??
    options.lifecycle ??
    headerLifecycleForActivity(activity) ??
    (options.goal?.status === 'active' && !options.goal.waiting
      ? 'working'
      : options.workFocus?.state === 'validation'
        ? 'waiting'
        : 'listening');
  const lifecycle: HeaderLifecycle = blocked
    ? 'blocked'
    : options.lifecycle === 'aborted'
      ? 'aborted'
      : ((taskflowPhase ? taskflowPhaseHeaderLifecycle(taskflowPhase) : undefined) ??
        (options.goal
          ? goalHeaderLifecycle(options.goal, ordinaryLifecycle)
          : undefined) ??
        ordinaryLifecycle);
  const projectedActivity =
    activityPath !== undefined ? { activityPath } : activity ? { activity } : {};
  const selection = headerSelection(options);
  const approvalRequired =
    options.workFocus?.state === 'validation' || options.goal?.status === 'complete';
  const suggestion = headerSuggestion({
    lifecycle,
    activity,
    selection,
    approvalRequired,
    blocked,
  });

  let work: HeaderStatusEvent['work'] = null;
  if (options.openSpec) {
    const state = options.openSpec;
    work = {
      lifecycle,
      titles: selectedOpenSpecTitles(state, options.focusedTaskId),
      color: openSpecColor(state),
      ...projectedActivity,
    };
  } else if (options.goal) {
    work = {
      lifecycle,
      titles: ['Goal'],
      color: goalHeaderColor(options.goal),
      ...projectedActivity,
    };
  } else if (options.workFocus && options.workFocus.state !== 'clear') {
    work = {
      lifecycle,
      titles: [normalizeInline(options.workFocus.intent)],
      color: options.workFocus.state === 'validation' ? 'warning' : 'accent',
      ...projectedActivity,
    };
  } else if (options.orchestration) {
    work = {
      lifecycle,
      titles: ['Taskflow run'],
      color: orchestrationColor(options.orchestration, Date.now()),
      ...projectedActivity,
    };
  } else {
    work = {
      lifecycle,
      titles:
        taskflowPhase && activityPath !== undefined
          ? []
          : taskflowPhase
            ? ['Taskflow run']
            : [], // frozen contract: no selection narrates nothing
      color: 'accent',
      ...projectedActivity,
    };
  }
  const progress = options.openSpec?.totalTasks
    ? [
        {
          icon: '󰘬',
          completed: options.openSpec.completedTasks,
          total: options.openSpec.totalTasks,
          color: openSpecColor(options.openSpec),
        },
      ]
    : [];

  return {
    protocol: 1,
    ...(options.activeRunSpans ? { activeRunSpans: options.activeRunSpans } : {}),
    activity: activity ?? null,
    selection,
    suggestion,
    work,
    diagnostics:
      diagnosticsWidget && diagnosticsState
        ? {
            text: diagnosticsWidget.content.text,
            color: diagnosticsWidget.style?.textColor ?? 'text',
            state: diagnosticsState,
          }
        : null,
    backgroundActivity: Boolean(
      orchestration?.state === 'running' ||
      (orchestration?.activeWorkers ?? 0) > 0 ||
      (options.goal?.status === 'active' && !options.goal.waiting),
    ),
    approvalRequired,
    blocked,
    counters: {
      agents: {
        active: orchestration?.activeWorkers ?? 0,
        total: orchestration
          ? Math.max(orchestration.activeWorkers, orchestration.totalWorkers ?? 0)
          : 0,
      },
      ...(options.activeRuns ? { activeRuns: options.activeRuns } : {}),
      ...(options.openSpec?.hierarchy
        ? { tasks: options.openSpec.hierarchy.tasks }
        : {}),
      ...(options.openSpec?.hierarchy &&
      options.focusedTaskId &&
      options.openSpec.hierarchy.stepsByTask[options.focusedTaskId]
        ? {
            steps: options.openSpec.hierarchy.stepsByTask[options.focusedTaskId],
          }
        : {}),
      ...(orchestration?.completedFiles === undefined ||
      orchestration.totalFiles === undefined
        ? {}
        : {
            files: {
              completed: orchestration.completedFiles,
              total: orchestration.totalFiles,
            },
          }),
    },
    progress,
  };
}

function signature(widget: FancyFooterWidget): string {
  return JSON.stringify(widget);
}

export class FancyFooterPublisher {
  private published = new Map<string, FancyFooterWidget>();
  private readonly emit: (message: FancyFooterMessage) => void;

  constructor(emit: (message: FancyFooterMessage) => void) {
    this.emit = emit;
  }

  sync(widgets: readonly FancyFooterWidget[]): PublishOperation[] {
    const next = new Map(widgets.map((widget) => [widget.id, widget]));
    const operations: PublishOperation[] = [];

    for (const [id] of this.published) {
      if (next.has(id)) continue;
      operations.push({ type: 'remove', id });
      this.emit({
        protocol: FANCY_FOOTER_PROTOCOL_VERSION,
        type: 'remove',
        id,
      });
    }

    for (const widget of widgets) {
      const previous = this.published.get(widget.id);
      if (previous && signature(previous) === signature(widget)) continue;
      operations.push({ type: 'upsert', widget });
      this.emit({
        protocol: FANCY_FOOTER_PROTOCOL_VERSION,
        type: 'upsert',
        widget,
      });
    }

    this.published = next;
    return operations;
  }

  republish(): void {
    for (const widget of this.published.values()) {
      this.emit({
        protocol: FANCY_FOOTER_PROTOCOL_VERSION,
        type: 'upsert',
        widget,
      });
    }
  }

  removeAll(): void {
    for (const id of this.published.keys()) {
      this.emit({
        protocol: FANCY_FOOTER_PROTOCOL_VERSION,
        type: 'remove',
        id,
      });
    }
    this.published.clear();
  }

  snapshots(): FancyFooterWidget[] {
    return [...this.published.values()];
  }
}
