import assert from 'node:assert/strict';
import test from 'node:test';
import * as publisherModule from '../src/publisher.ts';
import {
  buildWidgetSnapshots,
  FancyFooterPublisher,
  formatDiagnostics,
  formatOpenSpec,
  formatOpenSpecOverview,
  formatSessionWork,
} from '../src/publisher.ts';
import { AtomicStatusStore, ResourceBag } from '../src/state.ts';
import type {
  FancyFooterMessage,
  OpenSpecState,
  StatusSnapshot,
} from '../src/types.ts';

const openSpec: OpenSpecState = {
  projectRoot: '/project',
  changeId: 'closed-loop',
  title: 'Shape a Pi-first closed-loop development harness',
  phase: 'in-progress',
  completedTasks: 20,
  totalTasks: 22,
  progressPercent: 91,
  pendingTasks: [
    {
      id: '3.8',
      title: 'Gondolin-backed permission profiles',
      kind: 'Story',
      done: false,
    },
  ],
  tasksPath: '/project/openspec/changes/closed-loop/tasks.md',
  hierarchy: {
    tasks: { completed: 2, total: 3 },
    stepsByTask: { '3.8': { completed: 6, total: 8 } },
  },
  meta: {
    source: 'openspec-cli',
    refreshedAt: 10,
    attemptedAt: 10,
    updatedAt: 10,
    stale: false,
  },
};

function snapshot(overrides: Partial<StatusSnapshot> = {}): StatusSnapshot {
  return {
    cwd: '/project',
    projectRoot: '/project',
    configPath: '/config.json',
    configWarnings: [],
    openspec: openSpec,
    diagnostics: null,
    orchestration: null,
    errors: [],
    ...overrides,
  };
}

test('publisher emits upsert, suppresses unchanged snapshots, and removes', () => {
  const messages: FancyFooterMessage[] = [];
  const publisher = new FancyFooterPublisher((message) => messages.push(message));
  const widgets = buildWidgetSnapshots(snapshot());

  assert.equal(publisher.sync(widgets).length, 1);
  assert.equal(messages[0]?.type, 'upsert');
  assert.equal(publisher.sync(widgets).length, 0);
  assert.equal(messages.length, 1);

  const removals = publisher.sync([]);
  assert.deepEqual(removals, [{ type: 'remove', id: 'galactica.openspec' }]);
  assert.equal(messages.at(-1)?.type, 'remove');
});

test('published OpenSpec icons communicate partial, complete, and blocked state', () => {
  const nerdIcon = (state: OpenSpecState): string | false | undefined => {
    const widget = buildWidgetSnapshots(snapshot({ openspec: state }))[0];
    return (
      typeof widget?.icon === 'object' &&
      typeof widget.icon.glyphs === 'object' &&
      widget.icon.glyphs.nerd
    );
  };

  assert.equal(nerdIcon(openSpec), '[-]⠀');
  assert.equal(nerdIcon({ ...openSpec, phase: 'complete' }), '[x]⠀');
  assert.equal(nerdIcon({ ...openSpec, phase: 'blocked' }), '[!]⠀');
});

test('publishes aggregate OpenSpec Plan and Task progress independently of focus', () => {
  const overview = {
    projectRoot: '/project',
    actionableChanges: 2,
    totalChanges: 5,
    completedPlans: 3,
    totalPlans: 5,
    completedTasks: 21,
    totalTasks: 34,
  };
  const widgets = buildWidgetSnapshots(snapshot({ openspec: null }), {
    openSpecOverview: overview,
  });
  const boundary = widgets.find(
    (widget) => widget.id === 'galactica.openspec-scope-separator',
  );
  const progress = widgets.find(
    (widget) => widget.id === 'galactica.openspec-progress',
  );

  assert.equal(formatOpenSpecOverview(overview), '3/5 ›  21/34');
  assert.equal(boundary?.content.text, '⟩');
  assert.equal(boundary?.style?.textColor, 'thinkingHigh');
  assert.equal(boundary?.layout?.enabled, false);
  assert.equal(boundary?.layout?.position, 0);
  assert.equal(boundary?.layout?.align, 'right');
  assert.equal(progress?.content.text, '3/5 ›  21/34');
  const progressIcon = progress?.icon;
  assert.ok(progressIcon && typeof progressIcon.glyphs !== 'string');
  assert.equal(progressIcon.glyphs.nerd, '');
  assert.equal(progress?.layout?.position, 0);
  assert.equal(progress?.layout?.align, 'right');
  assert.equal(progress?.style?.textColor, 'accent');
});

test('publishes a dim right-aligned no-OpenSpec project state', () => {
  const widgets = buildWidgetSnapshots(snapshot({ openspec: null }), {
    openSpecProjectDetected: false,
  });
  const boundary = widgets.find(
    (widget) => widget.id === 'galactica.openspec-scope-separator',
  );
  const progress = widgets.find(
    (widget) => widget.id === 'galactica.openspec-progress',
  );

  assert.equal(boundary?.content.text, '⟩');
  assert.equal(boundary?.style?.textColor, 'thinkingHigh');
  assert.equal(progress?.content.text, 'no OpenSpec');
  assert.equal(progress?.style?.textColor, 'dim');
});

test('publishes dim OpenSpec feedback without inventing a focus', () => {
  const unfocused = buildWidgetSnapshots(snapshot({ openspec: null }), {
    openSpecFeedback: 'no-focus',
  })[0];
  const clear = buildWidgetSnapshots(snapshot({ openspec: null }), {
    openSpecFeedback: 'clear',
  })[0];

  assert.equal(unfocused?.content.text, 'OpenSpec · no focus');
  assert.equal(unfocused?.style?.textColor, 'dim');
  assert.equal(clear?.content.text, 'OpenSpec · clear');
  assert.equal(clear?.style?.textColor, 'dim');
  assert.deepEqual(buildWidgetSnapshots(snapshot({ openspec: null })), []);
});

test('publishes explicit Session Work states without competing with OpenSpec', () => {
  const active = { state: 'active', intent: 'Implement session metadata' } as const;
  const validation = {
    state: 'validation',
    intent: 'Implement session metadata',
  } as const;
  const clear = { state: 'clear' } as const;

  assert.equal(formatSessionWork(active), 'Work · Implement session metadata');
  assert.equal(formatSessionWork(validation), 'Validate · Implement session metadata');
  assert.equal(formatSessionWork(clear), 'Work · clear');

  const activeWidget = buildWidgetSnapshots(snapshot({ openspec: null }), {
    workFocus: active,
    openSpecFeedback: 'no-focus',
  })[0];
  assert.equal(activeWidget?.id, 'galactica.work');
  assert.equal(activeWidget?.content.text, 'Focus');
  assert.equal(activeWidget?.layout?.align, 'right');
  assert.equal(activeWidget?.style?.textColor, 'accent');

  const validationWidget = buildWidgetSnapshots(snapshot({ openspec: null }), {
    workFocus: validation,
  })[0];
  assert.equal(validationWidget?.content.text, 'Validate');
  assert.equal(validationWidget?.style?.textColor, 'warning');

  const clearWidgets = buildWidgetSnapshots(snapshot({ openspec: null }), {
    workFocus: clear,
  });
  assert.deepEqual(clearWidgets, []);

  const openSpecWins = buildWidgetSnapshots(snapshot(), { workFocus: active });
  assert.equal(
    openSpecWins.some((widget) => widget.id === 'galactica.work'),
    false,
  );
  assert.equal(openSpecWins[0]?.id, 'galactica.openspec');
});

test('uses Goal, Focus, then no OpenSpec as row-one fallbacks', () => {
  const noProject = { openSpecProjectDetected: false } as const;
  const goalWidgets = buildWidgetSnapshots(snapshot({ openspec: null }), {
    ...noProject,
    goal: {
      id: 'goal-1',
      status: 'active',
      automaticModelTurns: 1,
      waiting: false,
    },
  });
  assert.equal(goalWidgets.length, 1);
  assert.equal(goalWidgets[0]?.id, 'galactica.goal');
  assert.equal(goalWidgets[0]?.content.text, 'Goal');
  assert.equal(goalWidgets[0]?.layout?.align, 'right');

  const focusWidgets = buildWidgetSnapshots(snapshot({ openspec: null }), {
    ...noProject,
    workFocus: { state: 'active', intent: 'Improve prompt layout' },
  });
  assert.equal(focusWidgets.length, 1);
  assert.equal(focusWidgets[0]?.id, 'galactica.work');
  assert.equal(focusWidgets[0]?.content.text, 'Focus');

  const emptyWidgets = buildWidgetSnapshots(snapshot({ openspec: null }), noProject);
  assert.equal(
    emptyWidgets.find((widget) => widget.id === 'galactica.openspec-progress')?.content
      .text,
    'no OpenSpec',
  );
});

test('builds a bounded diagnostics event for the prompt header', () => {
  const buildHeaderStatusEvent = (
    publisherModule as unknown as {
      buildHeaderStatusEvent?: (widgets: ReturnType<typeof buildWidgetSnapshots>) => {
        protocol: number;
        diagnostics: { text: string; color: string } | null;
      };
    }
  ).buildHeaderStatusEvent;
  const widgets = buildWidgetSnapshots(
    snapshot({
      diagnostics: {
        errors: 0,
        blockers: 0,
        warnings: 0,
        tests: 'pass',
        typecheck: 'unknown',
        meta: {
          source: 'fixture',
          refreshedAt: 10,
          attemptedAt: 10,
          updatedAt: 10,
          stale: false,
        },
      },
    }),
  );

  assert.equal(typeof buildHeaderStatusEvent, 'function');
  assert.deepEqual(buildHeaderStatusEvent?.(widgets), {
    protocol: 1,
    activity: null,
    selection: null,
    suggestion: null,
    work: null,
    diagnostics: { text: 'clean  ✓ tests', color: 'success', state: 'pass' },
    backgroundActivity: false,
    approvalRequired: false,
    blocked: false,
    counters: { agents: { active: 0, total: 0 } },
    progress: [],
  });
  assert.deepEqual(buildHeaderStatusEvent?.([]), {
    protocol: 1,
    activity: null,
    selection: null,
    suggestion: null,
    work: null,
    diagnostics: null,
    backgroundActivity: false,
    approvalRequired: false,
    blocked: false,
    counters: { agents: { active: 0, total: 0 } },
    progress: [],
  });
});

test('publishes explicit selection and controlled next-action suggestions', () => {
  const selected = publisherModule.buildHeaderStatusEvent([], {
    openSpec,
    focusedTaskId: '3.8',
    lifecycle: 'assuring',
    activity: { kind: 'verification' },
  });
  assert.deepEqual(selected.selection, {
    source: 'openspec',
    titles: [
      'Shape a Pi-first closed-loop development harness',
      'Gondolin-backed permission profiles',
    ],
    color: 'accent',
  });
  assert.equal(selected.suggestion, null);

  const idle = publisherModule.buildHeaderStatusEvent([]);
  assert.equal(idle.selection, null);
  assert.equal(idle.suggestion, null);

  const restoredWork = publisherModule.buildHeaderStatusEvent([], {
    workFocus: { state: 'active', intent: 'Continue stable cockpit layout' },
  });
  assert.equal(restoredWork.work?.lifecycle, 'listening');
  assert.equal(restoredWork.suggestion, 'awaiting-continuation');

  const validation = publisherModule.buildHeaderStatusEvent([], {
    workFocus: { state: 'validation', intent: 'Validate stable cockpit layout' },
  });
  assert.deepEqual(validation.selection, {
    source: 'session-work',
    titles: ['Validate stable cockpit layout'],
    color: 'warning',
  });
  assert.equal(validation.suggestion, 'requesting-validation');
  assert.doesNotMatch(JSON.stringify([selected, validation]), /prompt|command|path/u);
});

test('subject selection fills the focus row beneath every higher source', () => {
  const subject = { state: 'set', title: 'Session subject' } as const;

  const idle = publisherModule.buildHeaderStatusEvent([], { subject });
  assert.deepEqual(idle.selection, {
    source: 'subject',
    titles: ['Session subject'],
    color: 'accent',
  });

  const beneathWork = publisherModule.buildHeaderStatusEvent([], {
    subject,
    workFocus: { state: 'active', intent: 'Ephemeral work' },
  });
  assert.equal(beneathWork.selection?.source, 'session-work');

  const beneathOpenSpec = publisherModule.buildHeaderStatusEvent([], {
    subject,
    openSpec,
    focusedTaskId: '3.8',
  });
  assert.equal(beneathOpenSpec.selection?.source, 'openspec');

  assert.doesNotMatch(JSON.stringify([idle, beneathWork]), /prompt|command/u);
});

test('publishes bounded active-run counters without runtime identities', () => {
  const event = publisherModule.buildHeaderStatusEvent([], {
    activeRuns: { children: 3, subagents: 2 },
  });

  assert.deepEqual(event.counters, {
    agents: { active: 0, total: 0 },
    activeRuns: { children: 3, subagents: 2 },
  });
  assert.doesNotMatch(JSON.stringify(event.counters), /prompt|pid|argument|output/u);
});

test('publishes bounded activity with an honest empty focus', () => {
  const event = publisherModule.buildHeaderStatusEvent([], {
    activity: { kind: 'planning' },
  });

  assert.deepEqual(event.work, {
    lifecycle: 'understanding',
    titles: [],
    color: 'accent',
    activity: { kind: 'planning' },
  });
  assert.deepEqual(event.activity, { kind: 'planning' });
  assert.doesNotMatch(JSON.stringify(event), /thought|command|path|generated/u);
});

test('projects explicit empty-state titles without inventing direct-response focus', () => {
  const event = publisherModule.buildHeaderStatusEvent([], {
    activity: { kind: 'synthesis' },
    fallbackTitles: [],
  });
  assert.deepEqual(event.work?.titles, []);
  assert.doesNotMatch(JSON.stringify(event), /Direct response/u);
});

test('projects bounded Goal progress without exposing the raw objective', () => {
  const active = publisherModule.buildHeaderStatusEvent([], {
    lifecycle: 'assuring',
    goal: {
      id: 'goal-1',
      status: 'active',
      automaticModelTurns: 2,
      waiting: false,
    },
    goalAutomaticTurnLimit: 4,
  });

  assert.deepEqual(active.work, {
    lifecycle: 'assuring',
    titles: ['Goal'],
    color: 'accent',
    activityPath: [
      {
        id: 'goal-work',
        label: 'completing Goal',
        compact: 'Goal',
        current: 2,
        total: 4,
      },
    ],
  });
  assert.equal(active.backgroundActivity, true);
  assert.equal(active.approvalRequired, false);
  assert.equal(
    publisherModule.buildHeaderStatusEvent([], {
      goal: {
        id: 'goal-1',
        status: 'active',
        automaticModelTurns: 0,
        waiting: false,
      },
    }).work?.lifecycle,
    'working',
  );

  const complete = publisherModule.buildHeaderStatusEvent([], {
    lifecycle: 'answering',
    goal: {
      id: 'goal-1',
      status: 'complete',
      automaticModelTurns: 2,
      waiting: false,
    },
    goalAutomaticTurnLimit: 4,
  });
  assert.deepEqual(complete.work, {
    lifecycle: 'waiting',
    titles: ['Goal'],
    color: 'warning',
    activityPath: [
      {
        id: 'awaiting-human-validation',
        label: 'awaiting Human validation',
        compact: 'validation',
      },
    ],
  });
  assert.equal(complete.backgroundActivity, false);
  assert.equal(complete.approvalRequired, true);
  assert.doesNotMatch(JSON.stringify([active, complete]), /private|objective|prompt/u);
});

test('Goal blocking and external waiting project controlled lifecycle states', () => {
  const blocked = publisherModule.buildHeaderStatusEvent([], {
    goal: {
      id: 'goal-1',
      status: 'blocked',
      automaticModelTurns: 3,
      waiting: false,
    },
  });
  const waiting = publisherModule.buildHeaderStatusEvent([], {
    goal: {
      id: 'goal-1',
      status: 'active',
      automaticModelTurns: 3,
      waiting: true,
    },
  });

  assert.equal(blocked.work?.lifecycle, 'blocked');
  assert.equal(blocked.blocked, true);
  assert.deepEqual(blocked.work?.activityPath, [
    { id: 'goal-blocked', label: 'Goal blocked', compact: 'blocked' },
  ]);
  assert.equal(waiting.work?.lifecycle, 'waiting');
  assert.deepEqual(waiting.work?.activityPath, [
    {
      id: 'goal-waiting',
      label: 'waiting for external event',
      compact: 'waiting',
    },
  ]);
});

test('focused OpenSpec identity remains authoritative during Goal execution', () => {
  const event = publisherModule.buildHeaderStatusEvent([], {
    openSpec,
    focusedTaskId: '3.8',
    lifecycle: 'working',
    goal: {
      id: 'goal-1',
      status: 'active',
      automaticModelTurns: 1,
      waiting: false,
    },
    goalAutomaticTurnLimit: 4,
  });

  assert.deepEqual(event.work?.titles, [
    'Shape a Pi-first closed-loop development harness',
    'Gondolin-backed permission profiles',
  ]);
  assert.deepEqual(event.work?.activityPath, [
    {
      id: 'goal-work',
      label: 'completing Goal',
      compact: 'Goal',
      current: 1,
      total: 4,
    },
  ]);
});

test('unknown focused OpenSpec task uses exact IDs instead of borrowing a headline', () => {
  const event = publisherModule.buildHeaderStatusEvent([], {
    openSpec,
    focusedTaskId: '9.9',
  });

  assert.deepEqual(event.work?.titles, [openSpec.changeId, '9.9']);
});

test('header event keeps lifecycle and every available narrative title off telemetry', () => {
  const widgets = buildWidgetSnapshots(snapshot(), { focusedTaskId: '3.8' });
  const event = publisherModule.buildHeaderStatusEvent(widgets, {
    openSpec,
    focusedTaskId: '3.8',
  });

  assert.deepEqual(event.work, {
    lifecycle: 'listening',
    titles: [
      'Shape a Pi-first closed-loop development harness',
      'Gondolin-backed permission profiles',
    ],
    color: 'accent',
  });
  assert.deepEqual(event.progress, [
    { icon: '󰘬', completed: 20, total: 22, color: 'accent' },
  ]);
  assert.deepEqual(event.counters, {
    agents: { active: 0, total: 0 },
    tasks: { completed: 2, total: 3 },
    steps: { completed: 6, total: 8 },
  });
});

test('header normalizes real Taskflow activity without exposing raw node text', () => {
  const now = Date.now();
  const event = publisherModule.buildHeaderStatusEvent([], {
    orchestration: {
      phase: 'checking',
      state: 'running',
      activeWorkers: 1,
      totalWorkers: 3,
      completedFiles: 37,
      totalFiles: 53,
      currentTask: 'Verify persistent chrome',
      meta: {
        source: 'taskflow',
        refreshedAt: now,
        attemptedAt: now,
        updatedAt: now,
        stale: false,
      },
    },
  });

  assert.deepEqual(event.work, {
    lifecycle: 'assuring',
    titles: ['Taskflow run'],
    color: 'accent',
    activity: { kind: 'regression' },
  });
  assert.deepEqual(event.counters, {
    agents: { active: 1, total: 3 },
    files: { completed: 37, total: 53 },
  });
  assert.doesNotMatch(JSON.stringify(event.work), /Verify persistent chrome/u);
});

test('attaches controlled Taskflow activity to the real focused conversation title', () => {
  const event = publisherModule.buildHeaderStatusEvent([], {
    openSpec,
    focusedTaskId: '3.8',
    orchestration: {
      phase: 'verifier',
      state: 'running',
      activeWorkers: 1,
      currentTask: 'Review private/internal/raw-task-name',
      meta: {
        source: 'taskflow',
        refreshedAt: 10,
        attemptedAt: 10,
        updatedAt: 10,
        stale: false,
      },
    },
  });

  assert.deepEqual(event.work, {
    lifecycle: 'assuring',
    titles: [
      'Shape a Pi-first closed-loop development harness',
      'Gondolin-backed permission profiles',
    ],
    color: 'accent',
    activity: { kind: 'verification' },
  });
  assert.doesNotMatch(JSON.stringify(event.work), /private|internal|raw-task-name/u);
});

test('projects meaningful global-loop ancestry without exposing plumbing', () => {
  const phase = publisherModule.taskflowUpdateHeaderPhase({
    content: [{ type: 'text', text: 'private generated output' }],
    details: {
      action: 'run',
      state: {
        def: {
          phases: [
            { id: 'understanding' },
            { id: 'assuring' },
            { id: 'assuring-private-child' },
          ],
        },
        phases: {
          understanding: { status: 'done' },
          assuring: {
            status: 'running',
            promotedPhases: {
              'assuring-private-child': { status: 'running' },
            },
          },
          'assuring-private-child': { status: 'running' },
        },
      },
    },
  });

  assert.equal(phase, 'assuring');
  assert.equal(publisherModule.taskflowPhaseHeaderLifecycle(phase), 'assuring');
  assert.equal(
    publisherModule.taskflowPhaseHeaderLifecycle('understanding'),
    'understanding',
  );
  assert.equal(publisherModule.taskflowPhaseHeaderLifecycle('working'), 'working');
  assert.equal(publisherModule.taskflowPhaseHeaderLifecycle('learning'), 'learning');
  assert.equal(publisherModule.taskflowPhaseHeaderLifecycle('answering'), 'answering');
  assert.equal(
    publisherModule.taskflowPhaseHeaderLifecycle('gather-context'),
    'understanding',
  );
  assert.equal(
    publisherModule.taskflowPhaseHeaderLifecycle('ask-for-clarification'),
    'waiting',
  );
  assert.equal(
    publisherModule.taskflowPhaseHeaderLifecycle('explain-boundary'),
    'blocked',
  );
  assert.equal(
    publisherModule.taskflowInitialHeaderPhase({
      action: 'run',
      name: 'ramona-loop',
    }),
    'understanding',
  );
  assert.deepEqual(publisherModule.taskflowPhaseHeaderActivityPath(phase), [
    { id: 'checking-quality', label: 'checking quality', compact: 'checking' },
  ]);
  assert.deepEqual(publisherModule.taskflowPhaseHeaderActivityPath('gather-context'), [
    { id: 'gathering-context', label: 'gathering context', compact: 'gathering' },
  ]);
  assert.equal(
    publisherModule.taskflowPhaseHeaderActivityPath('private-generated-phase'),
    undefined,
  );

  const event = publisherModule.buildHeaderStatusEvent([], {
    lifecycle: 'working',
    taskflowPhase: phase,
  });
  assert.deepEqual(event.work, {
    lifecycle: 'assuring',
    titles: [],
    color: 'accent',
    activityPath: [
      { id: 'checking-quality', label: 'checking quality', compact: 'checking' },
    ],
  });
  assert.doesNotMatch(
    JSON.stringify(event),
    /private generated output|private-child|private-generated/u,
  );
});

test('ignores malformed, non-run, and settled Taskflow updates', () => {
  const phase = publisherModule.taskflowUpdateHeaderPhase;
  assert.equal(phase(null), undefined);
  assert.equal(phase({ details: { action: 'list' } }), undefined);
  assert.equal(
    phase({
      details: {
        action: 'run',
        state: {
          def: { phases: [{ id: 'work' }] },
          phases: { work: { status: 'done' } },
        },
      },
    }),
    undefined,
  );
});

test('maps direct tools to bounded activity without exposing their inputs', () => {
  const activity = publisherModule.directToolHeaderActivity;

  assert.deepEqual(activity('read', { path: '/private/plan.md' }), {
    kind: 'inspection',
  });
  assert.deepEqual(activity('write', { path: '/private/result.md' }), {
    kind: 'mutation',
  });
  assert.deepEqual(activity('bash', { command: 'openspec new change private-plan' }), {
    kind: 'mutation',
  });
  assert.deepEqual(
    activity('bash', { command: 'openspec validate private-plan --strict' }),
    { kind: 'verification' },
  );
  assert.deepEqual(
    activity('bash', { command: 'openspec status --change private-plan' }),
    { kind: 'inspection' },
  );
  assert.equal(
    activity('bash', { command: 'private-command /secret/path generated prose' }),
    undefined,
  );
  assert.equal(
    JSON.stringify(activity('read', { path: '/secret/path generated prose' })).includes(
      '/secret/path',
    ),
    false,
  );

  const completion = publisherModule.directToolCompletionHeaderActivity;
  assert.deepEqual(completion({ kind: 'inspection' }), { kind: 'synthesis' });
  assert.deepEqual(completion({ kind: 'mutation' }), { kind: 'change-review' });
  assert.deepEqual(completion({ kind: 'verification' }), {
    kind: 'result-review',
  });
  assert.deepEqual(completion({ kind: 'inspection' }, true), { kind: 'recovery' });
  assert.equal(completion(undefined), undefined);
  assert.equal(
    JSON.stringify(completion(activity('read', { path: '/secret/path' }))).includes(
      '/secret/path',
    ),
    false,
  );
});

test('maps only known orchestration vocabulary to bounded activity kinds', () => {
  const activity = publisherModule.orchestrationHeaderActivity;
  const state = (phase: string, currentTask = '') => ({
    phase,
    currentTask,
    state: 'running' as const,
    activeWorkers: 1,
    meta: {
      source: 'taskflow',
      refreshedAt: 10,
      attemptedAt: 10,
      updatedAt: 10,
      stale: false,
    },
  });

  assert.deepEqual(activity(state('skill proposal')), { kind: 'skill-proposal' });
  assert.deepEqual(activity(state('planner')), { kind: 'planning' });
  assert.deepEqual(activity(state('executor')), { kind: 'implementation' });
  assert.deepEqual(activity(state('test-engineer')), { kind: 'regression' });
  assert.deepEqual(activity(state('verifier')), { kind: 'verification' });
  assert.deepEqual(activity(state('recover')), { kind: 'recovery' });
  assert.equal(
    activity(state('opaque-node', 'private generated paragraph')),
    undefined,
  );
  assert.equal(activity({ ...state('verifier'), state: 'complete' }), undefined);

  const lifecycle = publisherModule.orchestrationHeaderLifecycle;
  assert.equal(lifecycle(state('understand')), 'understanding');
  assert.equal(lifecycle(state('executor')), 'working');
  assert.equal(lifecycle(state('assure')), 'assuring');
  assert.equal(lifecycle(state('learn')), 'learning');
  assert.equal(lifecycle(state('reporter')), 'answering');
  assert.equal(lifecycle({ ...state('executor'), state: 'blocked' }), 'blocked');
  assert.equal(
    publisherModule.buildHeaderStatusEvent([], {
      lifecycle: 'understanding',
      orchestration: state('reporter'),
    }).work?.lifecycle,
    'answering',
  );

  const callActivity = publisherModule.taskflowCallHeaderActivity;
  assert.deepEqual(callActivity({ action: 'run', name: 'enrichment' }), {
    kind: 'planning',
  });
  assert.deepEqual(callActivity({ action: 'run', name: 'ramona-fix' }), {
    kind: 'recovery',
  });
  assert.deepEqual(callActivity({ action: 'run', name: 'deliver-change' }), {
    kind: 'implementation',
  });
  assert.equal(
    callActivity({
      action: 'run',
      task: '/private/path and model-generated paragraph',
    }),
    undefined,
  );
});

test('unfocused rendering shows progress and the complete change title', () => {
  const regular = formatOpenSpec(openSpec, null, false);
  const compact = formatOpenSpec(openSpec, null, true);

  assert.equal(regular, '20/22  Pi-first closed-loop development harness');
  assert.doesNotMatch(regular, /91%|…/u);
  assert.ok(compact.length < regular.length);
});

test('focused rendering replaces change metadata with the complete active task', () => {
  const focused = formatOpenSpec(
    {
      ...openSpec,
      pendingTasks: [
        {
          id: '1',
          title:
            'Step 1.1 Create root-level `greeting.txt` with exact contents beyond the old limit',
          done: false,
        },
      ],
    },
    '1',
    false,
  );

  assert.equal(
    focused,
    '20/22  ▶ 1.1 Create root-level `greeting.txt` with exact contents beyond the old limit',
  );
  assert.doesNotMatch(focused, /91%|Pi-first|…/u);
});

test('complete rendering relies on the state icon and keeps useful progress', () => {
  assert.equal(
    formatOpenSpec({ ...openSpec, phase: 'complete', completedTasks: 22 }, null, false),
    '22/22  Pi-first closed-loop development harness',
  );
});

test('cached diagnostics become stale without reparsing on every render', () => {
  const text = formatDiagnostics(
    {
      errors: 0,
      blockers: 0,
      warnings: 0,
      tests: 'pass',
      typecheck: 'unknown',
      meta: {
        source: 'fixture',
        refreshedAt: 1_000,
        attemptedAt: 1_000,
        updatedAt: 1_000,
        staleAfterMs: 60_000,
        stale: false,
      },
    },
    62_000,
  );
  assert.match(text, /stale 1m/);
});

test('transient refresh errors preserve the last good state as stale', () => {
  const store = new AtomicStatusStore({
    cwd: '/project',
    projectRoot: '/project',
    configPath: '/config.json',
  });
  store.applyRefresh({
    projectRoot: '/project',
    at: 10,
    openspec: { kind: 'success', value: openSpec },
    diagnostics: { kind: 'absent' },
    orchestration: { kind: 'absent' },
  });
  store.applyRefresh({
    projectRoot: '/project',
    at: 20,
    openspec: { kind: 'error', error: 'temporary parse failure' },
    diagnostics: { kind: 'absent' },
    orchestration: { kind: 'absent' },
  });

  assert.equal(store.get().openspec?.changeId, 'closed-loop');
  assert.equal(store.get().openspec?.meta.stale, true);
  assert.equal(store.get().openspec?.meta.error, 'temporary parse failure');
});

test('resource cleanup is idempotent and prevents duplicate cleanup', () => {
  const resources = new ResourceBag();
  let cleanups = 0;
  resources.add(() => {
    cleanups += 1;
  });
  resources.close();
  resources.close();
  assert.equal(cleanups, 1);
  assert.equal(resources.isClosed, true);
});
