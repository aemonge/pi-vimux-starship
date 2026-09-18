import { StringEnum } from '@earendil-works/pi-ai';
import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from '@earendil-works/pi-coding-agent';
import { promises as fs, watch } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Type } from 'typebox';
import {
  formatActiveWorkTitle,
  NO_OPEN_SPEC_FOCUS,
  NO_SESSION_SUBJECT,
  NO_SESSION_WORK_FOCUS,
  OPEN_SPEC_FOCUS_ENTRY_TYPE,
  type OpenSpecFocus,
  restoreOpenSpecFocus,
  restoreSessionSubject,
  restoreSessionWorkFocus,
  sameOpenSpecFocus,
  sameSessionSubject,
  sameSessionWorkFocus,
  SESSION_SUBJECT_ENTRY_TYPE,
  SESSION_WORK_FOCUS_ENTRY_TYPE,
  type SessionSubject,
  type SessionWorkFocus,
  sessionSubject,
  sessionWorkFocus,
  taskflowRunFocus,
  taskFocus,
} from './src/active-work.ts';
import { collectDiagnostics } from './src/diagnostics.ts';
import { loadConfig } from './src/config.ts';
import {
  type GoalHeaderState,
  isGoalOwnedPrompt,
  loadGoalAutomaticTurnLimit,
  restoreGoalHeaderState,
  sameGoalHeaderState,
} from './src/goal.ts';
import { collectOpenSpec, collectOpenSpecOverview } from './src/openspec.ts';
import { collectOrchestration } from './src/orchestration.ts';
import {
  buildHeaderStatusEvent,
  buildWidgetSnapshots,
  FancyFooterPublisher,
  FANCY_FOOTER_READY_CHANNEL,
  FANCY_FOOTER_WIDGET_CHANNEL,
  formatDiagnostics,
  formatOpenSpec,
  formatOpenSpecOverview,
  formatOrchestration,
  GALACTICA_HEADER_CHANNEL,
  goalHeaderLifecycle,
  type HeaderActivity,
  type HeaderLifecycle,
  directToolCompletionHeaderActivity,
  directToolHeaderActivity,
  headerLifecycleForActivity,
  taskflowCallHeaderActivity,
  taskflowInitialHeaderPhase,
  taskflowPhaseHeaderLifecycle,
  taskflowUpdateHeaderPhase,
} from './src/publisher.ts';
import { RuntimeRunTracker } from './src/runtime-runs.ts';
import {
  AtomicStatusStore,
  createDebouncer,
  ResourceBag,
  type RefreshOutcome,
} from './src/state.ts';
import { boundedPhase, EventLedger, type LedgerEvent } from './src/ledger.ts';
import {
  applyEvent,
  emptyFacts,
  snapshotFromFacts,
  type ReducerFacts,
} from './src/reducer.ts';
import type {
  CockpitSnapshot,
  CommandRunner,
  DiagnosticsState,
  LoadedConfig,
  OpenSpecFeedback,
  OpenSpecOverview,
  OpenSpecState,
  OrchestrationState,
  RuntimeErrorRecord,
} from './src/types.ts';

type SessionContext = ExtensionContext | ExtensionCommandContext;
type Domain = RuntimeErrorRecord['domain'];
type OpenSpecFocusAction = 'status' | 'set' | 'replace' | 'clear';

type StatusHealthCondition = {
  id: string;
  severity: 'warning' | 'error';
  summary: string;
};

const PI_STATUS_SOURCE_CHANNEL = 'pi-vimux-starship:status-source/v1';

function stableStatusId(prefix: string, value: string): string {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }
  return `${prefix}.${(hash >>> 0).toString(16)}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function assistantStopReason(message: unknown): string | undefined {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return undefined;
  }
  const candidate = message as { role?: unknown; stopReason?: unknown };
  return candidate.role === 'assistant' && typeof candidate.stopReason === 'string'
    ? candidate.stopReason
    : undefined;
}

function assistantHasVisibleText(message: unknown): boolean {
  if (!message || typeof message !== 'object' || Array.isArray(message)) return false;
  const candidate = message as { role?: unknown; content?: unknown };
  if (candidate.role !== 'assistant') return false;
  if (typeof candidate.content === 'string') return candidate.content.length > 0;
  return (
    Array.isArray(candidate.content) &&
    candidate.content.some(
      (item) =>
        item !== null &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        (item as { type?: unknown }).type === 'text' &&
        typeof (item as { text?: unknown }).text === 'string' &&
        (item as { text: string }).text.length > 0,
    )
  );
}

async function pathIsDirectory(path: string): Promise<boolean> {
  try {
    return (await fs.stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function detectProjectRoot(cwd: string, runner: CommandRunner): Promise<string> {
  let candidate = resolve(cwd);
  for (let depth = 0; depth < 8; depth += 1) {
    if (await pathIsDirectory(join(candidate, 'openspec'))) return candidate;
    if (await pathIsDirectory(join(candidate, '.git'))) return candidate;
    const parent = dirname(candidate);
    if (parent === candidate) break;
    candidate = parent;
  }

  try {
    const result = await runner('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      timeoutMs: 2_000,
    });
    const root = result.stdout.trim();
    if (result.code === 0 && root) return root;
  } catch {
    // Non-Git projects use their session cwd.
  }
  return resolve(cwd);
}

class GalacticaStatusRuntime {
  private readonly resources = new ResourceBag();
  private watchCleanups: Array<() => void> = [];
  private watchSignature = '';
  private generation = 0;
  private stopped = false;
  private refreshPromise: Promise<void> | undefined;
  private refreshRequested = false;
  private pendingForceCommand = false;
  private loadedConfig: LoadedConfig | undefined;
  private openSpecFeedback: OpenSpecFeedback | undefined;
  private openSpecOverview: OpenSpecOverview | undefined;
  private openSpecProjectDetected: boolean | undefined;
  private focus: OpenSpecFocus;
  private workFocus: SessionWorkFocus;
  private subject: SessionSubject;
  private goal: GoalHeaderState | null;
  private goalProjectionSuppressed = false;
  private goalAutomaticTurnLimit: number | undefined;
  private goalPollCleanup: (() => void) | undefined;
  private sessionName: string | undefined;
  private lastTitle: string | undefined;
  private diagnosticsPath: string | undefined;
  private orchestrationPath: string | undefined;
  private liveLifecycle: HeaderLifecycle;
  private liveActivity: HeaderActivity | undefined;
  private liveTaskflowPhase: string | undefined;
  private readonly directToolActivities = new Map<string, HeaderActivity>();
  private directToolFailed = false;
  private readonly runtimeRuns = new RuntimeRunTracker();
  private readonly statusHealth = new Map<Domain, StatusHealthCondition>();
  private lastStatusHealthSignature = '';
  private readonly store: AtomicStatusStore;
  private readonly statusLedger = new EventLedger();
  private cockpitFacts: ReducerFacts = emptyFacts();
  private cockpitVersion = 0;
  private readonly pi: ExtensionAPI;
  private readonly ctx: SessionContext;
  private readonly publisher: FancyFooterPublisher;

  constructor(
    pi: ExtensionAPI,
    ctx: SessionContext,
    publisher: FancyFooterPublisher,
    focus: OpenSpecFocus,
    workFocus: SessionWorkFocus,
    subject: SessionSubject,
    goal: GoalHeaderState | null,
    sessionName: string | undefined,
  ) {
    this.pi = pi;
    this.ctx = ctx;
    this.publisher = publisher;
    this.focus = focus;
    this.workFocus = workFocus;
    this.subject = subject;
    this.goal = goal;
    this.sessionName = sessionName;
    this.liveLifecycle = goal
      ? goalHeaderLifecycle(goal)
      : workFocus.state === 'validation'
        ? 'waiting'
        : 'listening';
    this.liveActivity =
      !goal && workFocus.state === 'validation'
        ? { kind: 'awaiting-validation' }
        : undefined;
    this.store = new AtomicStatusStore({
      cwd: ctx.cwd,
      projectRoot: ctx.cwd,
      configPath: '',
    });
    const seededAt = Date.now();
    this.recordEvent({ type: 'focus/openspec', at: seededAt, focus });
    this.recordEvent({ type: 'focus/work', at: seededAt, work: workFocus });
    this.recordEvent({ type: 'focus/subject', at: seededAt, subject });
    if (goal) this.recordEvent({ type: 'focus/goal', at: seededAt, goal });
  }

  private runner: CommandRunner = async (command, args, options) => {
    const result = await this.pi.exec(command, args, {
      cwd: options.cwd,
      timeout: options.timeoutMs,
    });
    return {
      stdout: String(result.stdout ?? ''),
      stderr: String(result.stderr ?? ''),
      code: result.code,
      killed: result.killed,
    };
  };

  start(): void {
    this.publish();
    this.ensureGoalPolling();
    this.launch(
      loadGoalAutomaticTurnLimit().then((limit) => {
        if (this.stopped || this.goalAutomaticTurnLimit === limit) return;
        this.goalAutomaticTurnLimit = limit;
        this.publish();
      }),
      'config',
    );
    this.launch(
      (async () => {
        this.loadedConfig = await loadConfig();
        this.statusHealth.delete('config');
        this.store.setConfig(this.loadedConfig.path, this.loadedConfig.warnings);
        for (const warning of this.loadedConfig.warnings) {
          this.store.recordError({
            domain: 'config',
            message: warning,
            at: Date.now(),
          });
        }

        this.resources.addInterval(() => this.publish(), 60_000);
        if (
          this.loadedConfig.config.diagnostics.enabled &&
          this.loadedConfig.config.diagnostics.runAutomatically &&
          this.loadedConfig.config.diagnostics.command
        ) {
          this.resources.addInterval(
            () => this.launch(this.refresh(true), 'diagnostics'),
            this.loadedConfig.config.diagnostics.intervalSeconds * 1_000,
          );
        }
        await this.refresh(false);
      })(),
      'config',
    );
  }

  private launch(promise: Promise<unknown>, domain: Domain): void {
    void promise.catch((error) => {
      if (this.stopped) return;
      this.recordError(domain, errorMessage(error));
      this.publish();
    });
  }

  private recordError(domain: Domain, message: string): void {
    this.store.recordError({ domain, message, at: Date.now() });
    if (domain === 'config') {
      this.statusHealth.set(domain, {
        id: domain,
        severity: 'error',
        summary: 'Galactica status configuration could not be loaded',
      });
    }
  }

  private updateRefreshHealth(
    domain: Extract<Domain, 'openspec' | 'diagnostics' | 'orchestration'>,
    outcomes: readonly RefreshOutcome<unknown>[],
    retained: boolean,
  ): void {
    if (!outcomes.some((outcome) => outcome.kind === 'error')) {
      this.statusHealth.delete(domain);
      return;
    }
    this.statusHealth.set(domain, {
      id: domain,
      severity: retained ? 'warning' : 'error',
      summary: retained
        ? `${domain} refresh failed; previous status is retained`
        : `${domain} status is unavailable`,
    });
  }

  private publishStatusHealth(): void {
    const snapshot = this.store.get();
    const conditions: StatusHealthCondition[] = [
      ...snapshot.configWarnings.map((warning) => ({
        id: stableStatusId('config-warning', warning),
        severity: 'warning' as const,
        summary: 'A Galactica status configuration value was ignored',
      })),
      ...this.statusHealth.values(),
    ].sort((left, right) => left.id.localeCompare(right.id));
    const signature = JSON.stringify(conditions);
    if (signature === this.lastStatusHealthSignature) return;
    this.lastStatusHealthSignature = signature;
    this.pi.events.emit(PI_STATUS_SOURCE_CHANNEL, {
      protocol: 1,
      type: 'snapshot',
      source: 'galactica-status',
      conditions,
    });
  }

  private async outcome<T>(
    domain: Domain,
    collect: () => Promise<T | undefined>,
  ): Promise<RefreshOutcome<T>> {
    try {
      const value = await collect();
      return value === undefined ? { kind: 'absent' } : { kind: 'success', value };
    } catch (error) {
      const message = errorMessage(error);
      this.recordError(domain, message);
      return { kind: 'error', error: message };
    }
  }

  async refresh(forceCommand: boolean): Promise<void> {
    this.pendingForceCommand ||= forceCommand;
    if (this.refreshPromise) {
      this.refreshRequested = true;
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      do {
        const runCommand = this.pendingForceCommand;
        this.pendingForceCommand = false;
        this.refreshRequested = false;
        await this.refreshOnce(runCommand);
      } while (!this.stopped && (this.pendingForceCommand || this.refreshRequested));
    })().finally(() => {
      this.refreshPromise = undefined;
    });
    return this.refreshPromise;
  }

  private async refreshOnce(runCommand: boolean): Promise<void> {
    const generation = ++this.generation;
    if (!this.loadedConfig || this.stopped) return;
    const config = this.loadedConfig.config;
    const focus = this.focus;
    const at = Date.now();
    let projectRoot = await detectProjectRoot(this.ctx.cwd, this.runner);

    const openSpecEnabled = config.enabled && config.openspec.enabled;
    const hasOpenSpecProject =
      openSpecEnabled && (await pathIsDirectory(join(projectRoot, 'openspec')));
    let openSpecOverview: RefreshOutcome<OpenSpecOverview> = { kind: 'absent' };
    let openspec: RefreshOutcome<OpenSpecState> = { kind: 'absent' };

    if (hasOpenSpecProject) {
      openSpecOverview = await this.outcome('openspec', () =>
        collectOpenSpecOverview({ cwd: projectRoot, runner: this.runner }),
      );
      if (openSpecOverview.kind === 'success') {
        projectRoot = openSpecOverview.value.projectRoot;
      }
    }

    if (focus.mode === 'none') {
      const passiveChange = config.openspec.change ?? process.env.PI_OPENSPEC_CHANGE;
      if (passiveChange) {
        openspec = await this.outcome('openspec', () =>
          collectOpenSpec({
            cwd: projectRoot,
            runner: this.runner,
            configuredChange: passiveChange,
            now: at,
          }),
        );
        if (openspec.kind === 'success') projectRoot = openspec.value.projectRoot;
      }
    } else {
      openspec = await this.outcome('openspec', () =>
        collectOpenSpec({
          cwd: projectRoot,
          runner: this.runner,
          configuredChange: focus.change,
          now: at,
        }),
      );
      if (openspec.kind === 'success') projectRoot = openspec.value.projectRoot;
    }

    const [diagnostics, orchestration] = await Promise.all([
      !config.enabled || !config.diagnostics.enabled
        ? Promise.resolve<RefreshOutcome<DiagnosticsState>>({ kind: 'absent' })
        : this.outcome('diagnostics', async () => {
            const result = await collectDiagnostics({
              projectRoot,
              config: config.diagnostics,
              runner: this.runner,
              runCommand,
              now: at,
            });
            this.diagnosticsPath = result.sourcePath;
            return result.state;
          }),
      !config.enabled || !config.orchestration.enabled
        ? Promise.resolve<RefreshOutcome<OrchestrationState>>({
            kind: 'absent',
          })
        : this.outcome('orchestration', async () => {
            const result = await collectOrchestration({
              projectRoot,
              config: config.orchestration,
              now: at,
            });
            this.orchestrationPath = result.sourcePath;
            return result.state;
          }),
    ]);

    if (
      this.stopped ||
      generation !== this.generation ||
      !sameOpenSpecFocus(focus, this.focus)
    ) {
      return;
    }
    const previous = this.store.get();
    this.updateRefreshHealth(
      'openspec',
      [openSpecOverview, openspec],
      this.openSpecOverview !== null || previous.openspec !== null,
    );
    this.updateRefreshHealth(
      'diagnostics',
      [diagnostics],
      previous.diagnostics !== null,
    );
    this.updateRefreshHealth(
      'orchestration',
      [orchestration],
      previous.orchestration !== null,
    );
    this.openSpecProjectDetected = openSpecEnabled ? hasOpenSpecProject : undefined;
    if (openSpecOverview.kind === 'success') {
      this.openSpecOverview = openSpecOverview.value;
    } else if (openSpecOverview.kind === 'absent') {
      this.openSpecOverview = undefined;
    }
    this.openSpecFeedback =
      !hasOpenSpecProject || focus.mode === 'task'
        ? undefined
        : openSpecOverview.kind === 'error'
          ? 'unavailable'
          : openSpecOverview.kind === 'success' &&
              openSpecOverview.value.actionableChanges > 0
            ? 'no-focus'
            : 'clear';
    this.store.applyRefresh({
      projectRoot,
      at,
      openspec,
      diagnostics,
      orchestration,
    });
    const refreshed = this.store.get();
    const hierarchy = refreshed.openspec?.hierarchy;
    const recordedAt = Date.now();
    this.recordEvent({
      type: 'progress/refresh',
      at: recordedAt,
      progress: hierarchy
        ? {
            tasks: hierarchy.tasks,
            steps: {
              completed: Object.values(hierarchy.stepsByTask).reduce(
                (sum, entry) => sum + entry.completed,
                0,
              ),
              total: Object.values(hierarchy.stepsByTask).reduce(
                (sum, entry) => sum + entry.total,
                0,
              ),
            },
            freshAt: recordedAt,
          }
        : null,
    });
    this.recordEvent({
      type: 'diagnostics/refresh',
      at: recordedAt,
      state: refreshed.diagnostics,
    });
    this.recordEvent({
      type: 'orchestration/refresh',
      at: recordedAt,
      state: refreshed.orchestration,
    });
    this.configureWatchers();
    this.publish();
  }

  private configureWatchers(): void {
    const snapshot = this.store.get();
    const candidates = new Set<string>();
    if (this.openSpecOverview) {
      candidates.add(join(this.openSpecOverview.projectRoot, 'openspec', 'changes'));
    }
    if (snapshot.openspec) {
      candidates.add(join(snapshot.openspec.projectRoot, 'openspec', 'changes'));
      if (snapshot.openspec.tasksPath) {
        candidates.add(dirname(snapshot.openspec.tasksPath));
      }
    }
    if (this.diagnosticsPath) candidates.add(dirname(this.diagnosticsPath));
    if (this.orchestrationPath) candidates.add(dirname(this.orchestrationPath));

    const paths = [...candidates].sort();
    const signature = paths.join('\n');
    if (signature === this.watchSignature) return;
    this.clearWatchers();
    this.watchSignature = signature;

    const debounceResources = new ResourceBag();
    this.watchCleanups.push(() => debounceResources.close());
    const refreshDebounced = createDebouncer(
      () => this.launch(this.refresh(false), 'watcher'),
      250,
      debounceResources,
    );

    for (const path of paths) {
      try {
        const watcher = watch(path, { persistent: false }, refreshDebounced);
        this.watchCleanups.push(() => watcher.close());
      } catch (error) {
        this.recordError('watcher', `${path}: ${errorMessage(error)}`);
      }
    }
  }

  private clearWatchers(): void {
    for (const cleanup of this.watchCleanups.splice(0).reverse()) {
      try {
        cleanup();
      } catch {
        // Watchers may already be closed after an atomic file replacement.
      }
    }
    this.watchSignature = '';
  }

  private projectedGoal(): GoalHeaderState | null {
    return this.goalProjectionSuppressed ? null : this.goal;
  }

  private publish(): void {
    if (this.stopped) return;
    const snapshot = this.store.get();
    const goal = this.projectedGoal();
    // Builders read focus facts through the snapshot layer (recordEvent stores
    // the same object references), so output stays byte-identical while the
    // ledger becomes the feeding seam.
    const focus = this.cockpitFacts.openSpec;
    const work = this.cockpitFacts.work;
    const subject = this.cockpitFacts.subject;
    const focusedOpenSpec =
      focus.mode === 'task' && snapshot.openspec?.changeId === focus.change
        ? snapshot.openspec
        : null;
    const visibleWorkFocus =
      focus.mode === 'task' || goal || (work.state === 'clear' && this.openSpecFeedback)
        ? undefined
        : work;
    const widgets = buildWidgetSnapshots(
      { ...snapshot, openspec: focusedOpenSpec },
      {
        focusedTaskId: focus.mode === 'task' ? focus.taskId : undefined,
        openSpecFeedback:
          focus.mode === 'none' && !visibleWorkFocus
            ? this.openSpecFeedback
            : undefined,
        openSpecOverview: this.openSpecOverview,
        openSpecProjectDetected: this.openSpecProjectDetected,
        workFocus: visibleWorkFocus,
        goal,
      },
    );
    this.publisher.sync(widgets);
    this.pi.events.emit(
      GALACTICA_HEADER_CHANNEL,
      buildHeaderStatusEvent(widgets, {
        openSpec: focusedOpenSpec,
        focusedTaskId: focus.mode === 'task' ? focus.taskId : undefined,
        workFocus: visibleWorkFocus,
        subject,
        orchestration: snapshot.orchestration,
        lifecycle: this.liveLifecycle,
        activity: this.liveActivity,
        taskflowPhase: this.liveTaskflowPhase,
        goal,
        goalAutomaticTurnLimit: this.goalAutomaticTurnLimit,
        activeRuns: this.runtimeRuns.snapshot(),
      }),
    );
    this.updateTitle(snapshot);
    this.publishStatusHealth();
  }

  private updateTitle(snapshot = this.store.get()): void {
    const facts = this.cockpitFacts;
    const focusedTaskId =
      facts.openSpec.mode === 'task' ? facts.openSpec.taskId : undefined;
    const taskTitle =
      facts.openSpec.mode === 'task' &&
      snapshot.openspec?.changeId === facts.openSpec.change &&
      !snapshot.openspec.meta.stale
        ? (snapshot.openspec.allTasks ?? snapshot.openspec.pendingTasks).find(
            (task) => task.id === focusedTaskId,
          )?.title
        : undefined;
    const title = formatActiveWorkTitle({
      focus: facts.openSpec,
      workFocus: facts.work,
      subject: facts.subject,
      goal: this.projectedGoal(),
      ...(taskTitle ? { taskTitle } : {}),
      ...(this.sessionName ? { sessionName: this.sessionName } : {}),
      projectRoot: snapshot.projectRoot,
      cwd: snapshot.cwd,
    });
    if (title === this.lastTitle) return;
    this.lastTitle = title;
    this.ctx.ui.setTitle(title);
  }

  private recordEvent(event: LedgerEvent): void {
    this.cockpitFacts = applyEvent(this.cockpitFacts, event);
    this.cockpitVersion += 1;
    this.statusLedger.append(event);
  }

  cockpitSnapshot(): CockpitSnapshot {
    return snapshotFromFacts(this.cockpitFacts, this.cockpitVersion);
  }

  currentFocus(): OpenSpecFocus {
    return this.focus;
  }

  currentWorkFocus(): SessionWorkFocus {
    return this.workFocus;
  }

  currentSubject(): SessionSubject {
    return this.subject;
  }

  currentGoal(): GoalHeaderState | null {
    return this.goal;
  }

  syncGoalFromSession(): void {
    this.setGoal(restoreGoalHeaderState(this.ctx.sessionManager.getBranch()));
  }

  private ensureGoalPolling(): void {
    if (!this.goal || this.goalPollCleanup || this.stopped) return;
    const timer = setInterval(() => this.syncGoalFromSession(), 500);
    timer.unref?.();
    const cleanup = this.resources.add(() => clearInterval(timer));
    this.goalPollCleanup = () => {
      cleanup();
      this.goalPollCleanup = undefined;
    };
  }

  private stopGoalPolling(): void {
    this.goalPollCleanup?.();
  }

  setGoal(goal: GoalHeaderState | null): void {
    if (sameGoalHeaderState(this.goal, goal)) return;
    this.goal = goal;
    this.recordEvent({ type: 'focus/goal', at: Date.now(), goal });
    this.goalProjectionSuppressed = false;
    if (goal) {
      this.ensureGoalPolling();
      if (goal.status !== 'active' || goal.waiting) {
        this.liveLifecycle = goalHeaderLifecycle(goal);
        this.liveActivity = undefined;
      } else if (['listening', 'waiting', 'blocked'].includes(this.liveLifecycle)) {
        this.liveLifecycle = 'working';
        this.liveActivity = undefined;
      }
      this.publish();
      this.updateTitle();
      return;
    }
    this.stopGoalPolling();
    this.settle();
    this.updateTitle();
  }

  beginTurn(prompt: unknown): void {
    this.directToolActivities.clear();
    this.directToolFailed = false;
    this.syncGoalFromSession();
    const suppressStoppedGoal = Boolean(
      this.goal && this.goal.status !== 'active' && !isGoalOwnedPrompt(prompt),
    );
    const projectionChanged = this.goalProjectionSuppressed !== suppressStoppedGoal;
    this.goalProjectionSuppressed = suppressStoppedGoal;
    if (projectionChanged) {
      this.liveLifecycle = 'understanding';
      this.liveActivity = { kind: 'understanding' };
      this.publish();
      return;
    }
    this.setLiveProjection('understanding', { kind: 'understanding' });
  }

  setFocus(focus: OpenSpecFocus): void {
    if (sameOpenSpecFocus(this.focus, focus)) return;
    this.focus = focus;
    this.recordEvent({ type: 'focus/openspec', at: Date.now(), focus });
    this.store.clearOpenSpec();
    this.publish();
    this.launch(this.refresh(false), 'openspec');
  }

  setWorkFocus(focus: SessionWorkFocus): void {
    if (sameSessionWorkFocus(this.workFocus, focus)) return;
    this.workFocus = focus;
    this.recordEvent({ type: 'focus/work', at: Date.now(), work: focus });
    if (focus.state === 'validation') {
      this.liveLifecycle = 'waiting';
      this.liveActivity = { kind: 'awaiting-validation' };
    } else if (focus.state === 'clear' && this.focus.mode === 'none') {
      this.liveLifecycle = 'listening';
      this.liveActivity = undefined;
    }
    this.publish();
  }

  setSubject(subject: SessionSubject): void {
    if (sameSessionSubject(this.subject, subject)) return;
    this.subject = subject;
    this.recordEvent({ type: 'focus/subject', at: Date.now(), subject });
    this.publish();
  }

  setLiveProjection(lifecycle: HeaderLifecycle, activity?: HeaderActivity): void {
    if (
      this.liveLifecycle === lifecycle &&
      this.liveActivity?.kind === activity?.kind &&
      this.liveActivity?.current === activity?.current &&
      this.liveActivity?.total === activity?.total
    ) {
      return;
    }
    this.liveLifecycle = lifecycle;
    this.liveActivity = activity;
    this.publish();
  }

  setLiveActivity(activity: HeaderActivity | undefined): void {
    this.setLiveProjection(
      headerLifecycleForActivity(activity) ?? this.liveLifecycle,
      activity,
    );
  }

  beginDirectTool(toolCallId: string, activity: HeaderActivity | undefined): void {
    if (!activity) return;
    this.directToolActivities.set(toolCallId, activity);
    this.setLiveActivity(activity);
  }

  finishDirectTool(toolCallId: string, isError: boolean): void {
    const completed = this.directToolActivities.get(toolCallId);
    if (!completed) return;
    this.directToolActivities.delete(toolCallId);
    this.directToolFailed ||= isError;

    const stillRunning = [...this.directToolActivities.values()].at(-1);
    if (stillRunning) {
      this.setLiveActivity(stillRunning);
      return;
    }

    const completion = directToolCompletionHeaderActivity(
      completed,
      this.directToolFailed,
    );
    this.directToolFailed = false;
    this.setLiveActivity(completion);
  }

  beginRuntimeRun(toolCallId: string, toolName: string): void {
    if (!this.runtimeRuns.begin(toolCallId, toolName)) return;
    const at = Date.now();
    this.recordEvent({
      type: 'run/start',
      at,
      span: {
        id: toolCallId,
        kind: toolName === 'bash' ? 'bash' : 'subagent',
        parent: null,
        stage: 'working',
        stageDeclared: false,
        since: at,
      },
    });
    this.publish();
  }

  updateRuntimeRun(toolCallId: string, partialResult: unknown): void {
    if (this.runtimeRuns.update(toolCallId, partialResult)) this.publish();
  }

  finishRuntimeRun(toolCallId: string): void {
    if (!this.runtimeRuns.finish(toolCallId)) return;
    this.recordEvent({ type: 'run/end', at: Date.now(), id: toolCallId });
    this.publish();
  }

  setTaskflowPhase(phase: string | undefined): void {
    if (this.liveTaskflowPhase === phase) return;
    this.liveTaskflowPhase = phase;
    if (phase) {
      this.recordEvent({
        type: 'taskflow/phase',
        at: Date.now(),
        phase: boundedPhase(phase),
      });
    }
    if (phase) {
      this.liveLifecycle = taskflowPhaseHeaderLifecycle(phase);
      this.liveActivity = undefined;
    }
    this.publish();
  }

  markAborted(): void {
    this.setLiveProjection('aborted', { kind: 'operation-aborted' });
  }

  markAnswering(): void {
    if (this.liveLifecycle !== 'aborted') {
      this.setLiveProjection('answering');
    }
  }

  settle(): void {
    this.directToolActivities.clear();
    this.directToolFailed = false;
    if (this.liveLifecycle === 'aborted') {
      this.publish();
      return;
    }
    const goal = this.projectedGoal();
    if (goal) {
      if (goal.status === 'active' && !goal.waiting) {
        this.setLiveProjection('working');
      } else {
        this.setLiveProjection(goalHeaderLifecycle(goal));
      }
      return;
    }
    if (this.focus.mode === 'task' || this.workFocus.state === 'validation') {
      this.setLiveProjection('waiting', { kind: 'awaiting-validation' });
      return;
    }
    if (this.workFocus.state === 'active') {
      this.setLiveProjection('waiting', { kind: 'awaiting-input' });
      return;
    }
    this.setLiveProjection('listening');
  }

  setSessionName(name: string | undefined): void {
    this.sessionName = name;
    this.updateTitle();
  }

  async forceRefresh(): Promise<void> {
    this.loadedConfig = await loadConfig();
    this.store.setConfig(this.loadedConfig.path, this.loadedConfig.warnings);
    await this.refresh(true);
  }

  summary(): string {
    const snapshot = this.store.get();
    const lines = [`root: ${snapshot.projectRoot}`];
    lines.push(
      this.openSpecOverview
        ? `OpenSpec portfolio: ${formatOpenSpecOverview(this.openSpecOverview)}`
        : 'OpenSpec portfolio: hidden (no project)',
    );
    lines.push(
      snapshot.openspec
        ? `OpenSpec focus: ${formatOpenSpec(
            snapshot.openspec,
            this.focus.mode === 'task' ? this.focus.taskId : null,
          )}`
        : this.openSpecFeedback
          ? `OpenSpec focus: ${this.openSpecFeedback}`
          : 'OpenSpec focus: none',
    );
    lines.push(
      this.workFocus.state === 'clear'
        ? 'Work: clear'
        : `Work: ${this.workFocus.state} · ${this.workFocus.intent}`,
    );
    lines.push(
      this.goal
        ? `Goal: ${this.goal.status} · automatic ${this.goal.automaticModelTurns}/${this.goalAutomaticTurnLimit ?? '?'}`
        : 'Goal: none',
    );
    lines.push(
      snapshot.diagnostics
        ? `Diagnostics: ${formatDiagnostics(snapshot.diagnostics)}`
        : 'Diagnostics: hidden (no source)',
    );
    lines.push(
      snapshot.orchestration
        ? `Orchestration: ${formatOrchestration(snapshot.orchestration)}`
        : 'Orchestration: hidden (no state file)',
    );
    return lines.join('\n');
  }

  debug(): string {
    const snapshot = this.store.get();
    return JSON.stringify(
      {
        projectRoot: snapshot.projectRoot,
        configPath: snapshot.configPath,
        configWarnings: snapshot.configWarnings,
        focus: this.focus,
        workFocus: this.workFocus,
        goal: this.goal,
        goalProjected: this.projectedGoal(),
        goalAutomaticTurnLimit: this.goalAutomaticTurnLimit ?? null,
        openSpecFeedback: this.openSpecFeedback ?? null,
        openSpecOverview: this.openSpecOverview ?? null,
        detected: {
          openspecChange: snapshot.openspec?.changeId ?? null,
          openspecTasksPath: snapshot.openspec?.tasksPath ?? null,
          diagnosticsSource:
            snapshot.diagnostics?.meta.source ?? this.diagnosticsPath ?? null,
          orchestrationStateFile:
            snapshot.orchestration?.meta.source ?? this.orchestrationPath ?? null,
        },
        refresh: {
          all: snapshot.lastRefreshAt ?? null,
          openspec: snapshot.openspec?.meta ?? null,
          diagnostics: snapshot.diagnostics?.meta ?? null,
          orchestration: snapshot.orchestration?.meta ?? null,
        },
        errors: snapshot.errors,
        widgets: this.publisher.snapshots(),
      },
      null,
      2,
    );
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.generation += 1;
    this.clearWatchers();
    this.resources.close();
  }
}

export default function galacticaStatus(pi: ExtensionAPI): void {
  const publisher = new FancyFooterPublisher((message) => {
    pi.events.emit(FANCY_FOOTER_WIDGET_CHANNEL, message);
  });
  let runtime: GalacticaStatusRuntime | undefined;

  const stopReady = pi.events.on(FANCY_FOOTER_READY_CHANNEL, (message: unknown) => {
    if (
      typeof message === 'object' &&
      message !== null &&
      'protocol' in message &&
      message.protocol === 1
    ) {
      publisher.republish();
    }
  });

  function persistAndApplyWorkFocus(focus: SessionWorkFocus): void {
    pi.appendEntry(SESSION_WORK_FOCUS_ENTRY_TYPE, focus);
    runtime?.setWorkFocus(focus);
  }

  function persistAndApplySubject(subject: SessionSubject): void {
    pi.appendEntry(SESSION_SUBJECT_ENTRY_TYPE, subject);
    runtime?.setSubject(subject);
  }

  function persistAndApplyFocus(focus: OpenSpecFocus): void {
    if (
      focus.mode === 'task' &&
      (runtime?.currentWorkFocus() ?? NO_SESSION_WORK_FOCUS).state !== 'clear'
    ) {
      persistAndApplyWorkFocus(NO_SESSION_WORK_FOCUS);
    }
    pi.appendEntry(OPEN_SPEC_FOCUS_ENTRY_TYPE, focus);
    runtime?.setFocus(focus);
  }

  function workStatus(focus: SessionWorkFocus): string {
    return focus.state === 'clear'
      ? 'Work focus: clear'
      : `Work focus: ${focus.state} · ${focus.intent}`;
  }

  function subjectStatus(subject: SessionSubject): string {
    return subject.state === 'clear'
      ? 'Session subject: clear'
      : `Session subject: ${subject.title}`;
  }

  function applySubjectAction(
    action: 'status' | 'set',
    title?: string,
  ): { ok: boolean; message: string; subject: SessionSubject } {
    const current = runtime?.currentSubject() ?? NO_SESSION_SUBJECT;

    if (action === 'status') {
      return { ok: true, message: subjectStatus(current), subject: current };
    }

    const next = sessionSubject('set', title);
    if (!next || next.state !== 'set') {
      return {
        ok: false,
        message: 'Session subject requires a non-empty title',
        subject: current,
      };
    }
    if (!sameSessionSubject(current, next)) persistAndApplySubject(next);
    return { ok: true, message: subjectStatus(next), subject: next };
  }

  function applyWorkAction(
    action: 'status' | 'set' | 'validate' | 'clear',
    intent?: string,
  ): { ok: boolean; message: string; focus: SessionWorkFocus } {
    const current = runtime?.currentWorkFocus() ?? NO_SESSION_WORK_FOCUS;
    const openSpec = runtime?.currentFocus() ?? NO_OPEN_SPEC_FOCUS;

    if (action === 'status') {
      return { ok: true, message: workStatus(current), focus: current };
    }
    if (action === 'clear') {
      if (current.state !== 'clear') persistAndApplyWorkFocus(NO_SESSION_WORK_FOCUS);
      return {
        ok: true,
        message: 'Work focus cleared',
        focus: NO_SESSION_WORK_FOCUS,
      };
    }
    if (openSpec.mode === 'task') {
      return {
        ok: false,
        message:
          `OpenSpec focus is ${openSpec.change} › ${openSpec.taskId}; ` +
          'clear it before setting ephemeral work',
        focus: current,
      };
    }
    if (action === 'validate') {
      if (current.state === 'clear') {
        return {
          ok: false,
          message: 'No active Work focus to validate',
          focus: current,
        };
      }
      const validation = sessionWorkFocus('validation', current.intent);
      if (!validation) {
        return { ok: false, message: 'Invalid Work focus', focus: current };
      }
      if (!sameSessionWorkFocus(current, validation)) {
        persistAndApplyWorkFocus(validation);
      }
      return { ok: true, message: workStatus(validation), focus: validation };
    }

    const active = sessionWorkFocus('active', intent);
    if (!active) {
      return {
        ok: false,
        message: 'Work focus requires a non-empty intent',
        focus: current,
      };
    }
    if (!sameSessionWorkFocus(current, active)) persistAndApplyWorkFocus(active);
    return { ok: true, message: workStatus(active), focus: active };
  }

  function applyOpenSpecFocusAction(
    action: OpenSpecFocusAction,
    change?: string,
    taskId?: string,
  ): { ok: boolean; message: string; focus: OpenSpecFocus } {
    const current = runtime?.currentFocus() ?? NO_OPEN_SPEC_FOCUS;

    if (action === 'status') {
      return {
        ok: true,
        message:
          current.mode === 'task'
            ? `OpenSpec focus: ${current.change} › ${current.taskId}`
            : 'OpenSpec focus: none',
        focus: current,
      };
    }
    if (action === 'clear') {
      persistAndApplyFocus(NO_OPEN_SPEC_FOCUS);
      return {
        ok: true,
        message: 'OpenSpec focus cleared',
        focus: NO_OPEN_SPEC_FOCUS,
      };
    }

    const requested = taskFocus(change, taskId);
    if (!requested) {
      return {
        ok: false,
        message: 'OpenSpec focus requires non-empty change and task identifiers',
        focus: current,
      };
    }
    if (
      action === 'set' &&
      current.mode === 'task' &&
      !sameOpenSpecFocus(current, requested)
    ) {
      return {
        ok: false,
        message:
          `OpenSpec focus is ${current.change} › ${current.taskId}; ` +
          'use replace to change it deliberately',
        focus: current,
      };
    }
    if (!sameOpenSpecFocus(current, requested)) persistAndApplyFocus(requested);
    return {
      ok: true,
      message: `OpenSpec focus: ${requested.change} › ${requested.taskId}`,
      focus: requested,
    };
  }

  pi.on('session_start', (_event, ctx) => {
    runtime?.stop();
    const branch = ctx.sessionManager.getBranch();
    const focus = restoreOpenSpecFocus(branch);
    const workFocus = restoreSessionWorkFocus(branch);
    const subject = restoreSessionSubject(branch);
    const goal = restoreGoalHeaderState(branch);
    const sessionName = pi.getSessionName() ?? ctx.sessionManager.getSessionName();
    runtime = new GalacticaStatusRuntime(
      pi,
      ctx,
      publisher,
      focus,
      workFocus,
      subject,
      goal,
      sessionName,
    );
    runtime.start();
  });

  pi.on('session_info_changed', (event) => {
    runtime?.setSessionName(event.name);
  });

  pi.on('session_tree', (_event, ctx) => {
    const branch = ctx.sessionManager.getBranch();
    runtime?.setFocus(restoreOpenSpecFocus(branch));
    runtime?.setWorkFocus(restoreSessionWorkFocus(branch));
    runtime?.setSubject(restoreSessionSubject(branch));
    runtime?.setGoal(restoreGoalHeaderState(branch));
    runtime?.settle();
  });

  pi.on('before_agent_start', (event) => {
    runtime?.beginTurn(event.prompt);
  });

  pi.on('tool_execution_start', (event) => {
    runtime?.beginRuntimeRun(event.toolCallId, event.toolName);
  });

  pi.on('tool_call', (event) => {
    if (event.toolName !== 'taskflow') {
      runtime?.beginDirectTool(
        event.toolCallId,
        directToolHeaderActivity(event.toolName, event.input),
      );
      return;
    }
    const requested = taskflowRunFocus(event.input);

    if (requested) {
      const current = runtime?.currentFocus() ?? NO_OPEN_SPEC_FOCUS;
      if (current.mode === 'task' && !sameOpenSpecFocus(current, requested)) {
        return {
          block: true,
          reason:
            `OpenSpec focus is ${current.change} › ${current.taskId}; ` +
            'use /openspec-focus clear or /openspec-focus replace <change> <task> before starting a conflicting run',
        };
      }
      if (!sameOpenSpecFocus(current, requested)) {
        persistAndApplyFocus(requested);
      }
    }

    const initialPhase = taskflowInitialHeaderPhase(event.input);
    if (initialPhase) {
      runtime?.setTaskflowPhase(initialPhase);
      return;
    }

    runtime?.setTaskflowPhase(undefined);
    const activity = taskflowCallHeaderActivity(event.input);
    runtime?.setLiveProjection(
      headerLifecycleForActivity(activity) ?? 'working',
      activity,
    );
  });

  pi.on('tool_execution_update', (event) => {
    runtime?.updateRuntimeRun(event.toolCallId, event.partialResult);
    if (event.toolName !== 'taskflow') return;
    const phase = taskflowUpdateHeaderPhase(event.partialResult);
    if (phase) runtime?.setTaskflowPhase(phase);
  });

  pi.on('tool_execution_end', (event) => {
    runtime?.finishRuntimeRun(event.toolCallId);
    queueMicrotask(() => runtime?.syncGoalFromSession());
    if (event.toolName !== 'taskflow') {
      runtime?.finishDirectTool(event.toolCallId, event.isError);
      return;
    }
    runtime?.setTaskflowPhase(undefined);
    runtime?.setLiveActivity(undefined);
  });

  pi.on('message_update', (event) => {
    if (assistantHasVisibleText(event.message)) runtime?.markAnswering();
  });

  pi.on('turn_end', (event) => {
    if (assistantStopReason(event.message) === 'aborted') runtime?.markAborted();
    queueMicrotask(() => runtime?.syncGoalFromSession());
  });

  pi.on('agent_end', (event) => {
    if (event.messages.some((message) => assistantStopReason(message) === 'aborted')) {
      runtime?.markAborted();
    }
  });

  pi.on('agent_settled', () => {
    queueMicrotask(() => {
      runtime?.syncGoalFromSession();
      runtime?.settle();
    });
  });

  pi.on('session_shutdown', () => {
    runtime?.stop();
    runtime = undefined;
    publisher.removeAll();
    stopReady();
  });

  pi.registerTool({
    name: 'work_focus',
    label: 'Work Focus',
    description:
      'Show, set, mark for validation, or clear explicit ephemeral work metadata for this Pi session',
    promptSnippet: 'Manage explicit ephemeral Session Work focus metadata',
    parameters: Type.Object({
      action: StringEnum(['status', 'set', 'validate', 'clear'] as const),
      intent: Type.Optional(
        Type.String({
          description: 'Required only for set: the concise current intent',
        }),
      ),
    }),
    async execute(_toolCallId, params) {
      const result = applyWorkAction(params.action, params.intent);
      return {
        content: [
          {
            type: 'text',
            text: result.ok ? result.message : `Error: ${result.message}`,
          },
        ],
        details: {
          ok: result.ok,
          focus: result.focus,
        },
      };
    },
  });

  pi.registerTool({
    name: 'subject',
    label: 'Session Subject',
    description:
      'Show or set the sanitized session subject that keeps the focus row populated beneath OpenSpec, Goal, and Session Work',
    promptSnippet: 'Manage the automatic session subject title',
    promptGuidelines: [
      'Author a short sanitized subject (at most 120 characters, never raw prompt text) at the first conversational turn; revise it only when the topic clearly shifts. Never require Human action for it.',
    ],
    parameters: Type.Object({
      action: StringEnum(['status', 'set'] as const),
      title: Type.Optional(
        Type.String({
          description: 'Required only for set: the short sanitized subject title',
        }),
      ),
    }),
    async execute(_toolCallId, params) {
      const result = applySubjectAction(params.action, params.title);
      return {
        content: [
          {
            type: 'text',
            text: result.ok ? result.message : `Error: ${result.message}`,
          },
        ],
        details: {
          ok: result.ok,
          subject: result.subject,
        },
      };
    },
  });

  pi.registerTool({
    name: 'openspec_focus',
    label: 'OpenSpec Focus',
    description:
      'Show, safely set, deliberately replace, or clear branch-local OpenSpec Task focus',
    promptSnippet:
      'Manage exact branch-local OpenSpec Task focus with replacement safeguards',
    promptGuidelines: [
      'Use openspec_focus only for explicit Human direction or an exact declared OpenSpec Task handoff; never infer material Plan selection or Human validation.',
    ],
    parameters: Type.Object({
      action: StringEnum(['status', 'set', 'replace', 'clear'] as const),
      change: Type.Optional(
        Type.String({
          description: 'Required for set and replace: the exact OpenSpec change ID',
        }),
      ),
      task: Type.Optional(
        Type.String({
          description: 'Required for set and replace: the exact OpenSpec Task ID',
        }),
      ),
    }),
    async execute(_toolCallId, params) {
      const result = applyOpenSpecFocusAction(
        params.action,
        params.change,
        params.task,
      );
      return {
        content: [
          {
            type: 'text',
            text: result.ok ? result.message : `Error: ${result.message}`,
          },
        ],
        details: {
          ok: result.ok,
          focus: result.focus,
        },
      };
    },
  });

  pi.registerCommand('work', {
    description: "Show, set, validate, or clear this session's ephemeral Work focus",
    handler: async (args, ctx) => {
      const trimmed = args.trim();
      if (!trimmed || trimmed.toLowerCase() === 'status') {
        ctx.ui.notify(applyWorkAction('status').message, 'info');
        return;
      }

      const [rawAction, ...rest] = trimmed.split(/\s+/u);
      const action = rawAction?.toLowerCase();
      if (action === 'set') {
        const result = applyWorkAction('set', rest.join(' '));
        ctx.ui.notify(result.message, result.ok ? 'info' : 'warning');
        return;
      }
      if ((action === 'validate' || action === 'clear') && rest.length === 0) {
        const result = applyWorkAction(action);
        ctx.ui.notify(result.message, result.ok ? 'info' : 'warning');
        return;
      }

      ctx.ui.notify('Usage: /work [status|set <intent>|validate|clear]', 'warning');
    },
  });

  pi.registerCommand('openspec-focus', {
    description: "Show, clear, or explicitly set this session's OpenSpec task focus",
    handler: async (args, ctx) => {
      const parts = args.trim().split(/\s+/u).filter(Boolean);
      if (parts.length === 0) {
        ctx.ui.notify(applyOpenSpecFocusAction('status').message, 'info');
        return;
      }

      if (parts.length === 1 && parts[0]?.toLowerCase() === 'clear') {
        const result = applyOpenSpecFocusAction('clear');
        ctx.ui.notify(result.message, 'info');
        return;
      }

      const rawAction = parts[0]?.toLowerCase();
      const action: 'set' | 'replace' = ['set', 'replace'].includes(rawAction ?? '')
        ? (rawAction as 'set' | 'replace')
        : 'set';
      const identifiers = rawAction === action ? parts.slice(1) : parts;
      if (identifiers.length !== 2) {
        ctx.ui.notify(
          'Usage: /openspec-focus [set|replace] <change> <task> | clear',
          'warning',
        );
        return;
      }

      const result = applyOpenSpecFocusAction(action, identifiers[0], identifiers[1]);
      ctx.ui.notify(result.message, result.ok ? 'info' : 'warning');
    },
  });

  pi.registerCommand('galactica-status', {
    description: 'Show detected project status integrations',
    handler: async (_args, ctx) => {
      ctx.ui.notify(runtime?.summary() ?? 'galactica-status is starting', 'info');
    },
  });

  pi.registerCommand('galactica-status-refresh', {
    description: 'Refresh all enabled Galactica status sources',
    handler: async (_args, ctx) => {
      if (!runtime) {
        ctx.ui.notify('galactica-status is not active', 'warning');
        return;
      }
      await runtime.forceRefresh();
      ctx.ui.notify(runtime.summary(), 'info');
    },
  });

  pi.registerCommand('galactica-status-debug', {
    description: 'Show Galactica status detection and publication details',
    handler: async (_args, ctx) => {
      ctx.ui.notify(runtime?.debug() ?? 'galactica-status is not active', 'info');
    },
  });
}
