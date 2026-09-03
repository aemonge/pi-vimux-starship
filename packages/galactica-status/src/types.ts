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
