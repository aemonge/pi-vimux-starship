export type CheckState = 'pass' | 'fail' | 'running' | 'unknown';
export type WorkflowState = 'running' | 'blocked' | 'complete' | 'idle' | 'unknown';
export type WidgetColor =
  | 'text'
  | 'accent'
  | 'muted'
  | 'dim'
  | 'success'
  | 'error'
  | 'warning'
  | 'customMessageLabel'
  | 'thinkingHigh';

export interface CommandSpec {
  executable: string;
  args: string[];
}

export interface GalacticaStatusConfig {
  version: 1;
  enabled: boolean;
  openspec: {
    enabled: boolean;
    change: string | null;
  };
  diagnostics: {
    enabled: boolean;
    sourceFile: string | null;
    command: CommandSpec | null;
    intervalSeconds: number;
    runAutomatically: boolean;
    timeoutSeconds: number;
  };
  orchestration: {
    enabled: boolean;
    stateFile: string | null;
  };
}

export interface LoadedConfig {
  config: GalacticaStatusConfig;
  path: string;
  warnings: string[];
}

export interface SourceMeta {
  source: string;
  refreshedAt: number;
  attemptedAt: number;
  updatedAt?: number;
  staleAfterMs?: number;
  stale: boolean;
  error?: string;
}

export interface OpenSpecTask {
  id: string;
  title: string;
  kind?: 'Story' | 'Spike' | 'Lab' | 'Hack';
  done: boolean;
}

export interface OpenSpecOverview {
  projectRoot: string;
  actionableChanges: number;
  totalChanges: number;
  completedPlans: number;
  totalPlans: number;
  completedTasks: number;
  totalTasks: number;
}

export type OpenSpecFeedback = 'clear' | 'no-focus' | 'unavailable';

export interface OpenSpecHierarchyProgress {
  tasks: { completed: number; total: number };
  stepsByTask: Record<string, { completed: number; total: number }>;
}

export interface OpenSpecState {
  projectRoot: string;
  changeId: string;
  title: string;
  phase: string;
  completedTasks: number;
  totalTasks: number;
  progressPercent: number;
  pendingTasks: OpenSpecTask[];
  allTasks?: OpenSpecTask[];
  tasksPath?: string;
  hierarchy?: OpenSpecHierarchyProgress;
  meta: SourceMeta;
}

export interface DiagnosticsState {
  errors: number;
  blockers: number;
  warnings: number;
  tests: CheckState;
  typecheck: CheckState;
  meta: SourceMeta;
}

export interface OrchestrationState {
  phase?: string;
  state: WorkflowState;
  activeWorkers: number;
  totalWorkers?: number;
  completedFiles?: number;
  totalFiles?: number;
  currentTask?: string;
  openspecTaskId?: string;
  startedAt?: number;
  elapsedMs?: number;
  meta: SourceMeta;
}

export interface RuntimeErrorRecord {
  domain: 'config' | 'openspec' | 'diagnostics' | 'orchestration' | 'watcher';
  message: string;
  at: number;
}

export interface StatusSnapshot {
  cwd: string;
  projectRoot: string;
  configPath: string;
  configWarnings: string[];
  lastRefreshAt?: number;
  openspec: OpenSpecState | null;
  diagnostics: DiagnosticsState | null;
  orchestration: OrchestrationState | null;
  errors: RuntimeErrorRecord[];
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  code: number;
  killed?: boolean;
}

export type CommandRunner = (
  command: string,
  args: string[],
  options: { cwd: string; timeoutMs: number },
) => Promise<CommandResult>;

export interface FancyFooterWidget {
  id: string;
  label?: string;
  description?: string;
  content: { type: 'text'; text: string };
  icon?:
    | false
    | {
        glyphs:
          string | Partial<Record<'nerd' | 'emoji' | 'unicode' | 'ascii', string>>;
        color?: WidgetColor;
      };
  style?: { textColor?: WidgetColor; bold?: boolean };
  layout?: {
    enabled?: boolean;
    row?: number;
    position?: number;
    align?: 'left' | 'middle' | 'right';
    fill?: 'none' | 'grow';
    minWidth?: number;
  };
}

export type FancyFooterMessage =
  | { protocol: 1; type: 'upsert'; widget: FancyFooterWidget }
  | { protocol: 1; type: 'remove'; id: string };

export type PublishOperation =
  { type: 'upsert'; widget: FancyFooterWidget } | { type: 'remove'; id: string };

// --- Frozen status contract: snapshot facts -------------------------------

export type StageValue =
  | 'understanding'
  | 'working'
  | 'assuring'
  | 'learning'
  | 'answering'
  | 'waiting'
  | 'blocked'
  | 'listening'
  | 'aborted';

export type SelectionState =
  | { kind: 'openspec-task'; change: string; task: string }
  | {
      kind: 'goal';
      status: 'active' | 'blocked' | 'stopped' | 'complete';
      waiting: boolean;
    }
  | { kind: 'session-work'; intent: string; phase: 'active' | 'validation' }
  | { kind: 'subject'; title: string }
  | { kind: 'none' };

export type RunSpan = {
  id: string;
  kind: 'agent' | 'subagent' | 'bash';
  parent: string | null;
  label?: string;
  agent?: string;
  stage: StageValue;
  stageDeclared: boolean;
  since: number;
  endedAt?: number;
};

export type ProgressFact = {
  tasks: { completed: number; total: number };
  steps: { completed: number; total: number };
  freshAt: number;
};

export type CockpitSnapshot = {
  version: number;
  selection: SelectionState;
  runs: RunSpan[];
  progress: ProgressFact | null;
};
