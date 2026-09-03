import type {
  DiagnosticsState,
  OpenSpecState,
  OrchestrationState,
  RuntimeErrorRecord,
  StatusSnapshot,
} from './types.ts';

export type DomainName = 'openspec' | 'diagnostics' | 'orchestration';

export type RefreshOutcome<T> =
  { kind: 'success'; value: T } | { kind: 'absent' } | { kind: 'error'; error: string };

export interface RefreshBatch {
  projectRoot: string;
  at: number;
  openspec: RefreshOutcome<OpenSpecState>;
  diagnostics: RefreshOutcome<DiagnosticsState>;
  orchestration: RefreshOutcome<OrchestrationState>;
}

function staleValue<
  T extends { meta: { stale: boolean; attemptedAt: number; error?: string } },
>(previous: T | null, error: string, at: number): T | null {
  if (!previous) return null;
  return {
    ...previous,
    meta: {
      ...previous.meta,
      stale: true,
      attemptedAt: at,
      error,
    },
  };
}

function applyOutcome<
  T extends { meta: { stale: boolean; attemptedAt: number; error?: string } },
>(previous: T | null, outcome: RefreshOutcome<T>, at: number): T | null {
  if (outcome.kind === 'success') return outcome.value;
  if (outcome.kind === 'absent') return null;
  return staleValue(previous, outcome.error, at);
}

export class AtomicStatusStore {
  private snapshot: StatusSnapshot;

  constructor(initial: {
    cwd: string;
    projectRoot: string;
    configPath: string;
    configWarnings?: string[];
  }) {
    this.snapshot = {
      cwd: initial.cwd,
      projectRoot: initial.projectRoot,
      configPath: initial.configPath,
      configWarnings: [...(initial.configWarnings ?? [])],
      openspec: null,
      diagnostics: null,
      orchestration: null,
      errors: [],
    };
  }

  get(): StatusSnapshot {
    return this.snapshot;
  }

  setConfig(configPath: string, warnings: string[]): void {
    this.snapshot = {
      ...this.snapshot,
      configPath,
      configWarnings: [...warnings],
    };
  }

  clearOpenSpec(): void {
    if (!this.snapshot.openspec) return;
    this.snapshot = { ...this.snapshot, openspec: null };
  }

  applyRefresh(batch: RefreshBatch): void {
    this.snapshot = {
      ...this.snapshot,
      projectRoot: batch.projectRoot,
      lastRefreshAt: batch.at,
      openspec: applyOutcome(this.snapshot.openspec, batch.openspec, batch.at),
      diagnostics: applyOutcome(this.snapshot.diagnostics, batch.diagnostics, batch.at),
      orchestration: applyOutcome(
        this.snapshot.orchestration,
        batch.orchestration,
        batch.at,
      ),
    };
  }

  recordError(error: RuntimeErrorRecord): void {
    const duplicate = this.snapshot.errors.at(-1);
    if (duplicate?.domain === error.domain && duplicate.message === error.message) {
      this.snapshot = {
        ...this.snapshot,
        errors: [...this.snapshot.errors.slice(0, -1), error],
      };
      return;
    }
    this.snapshot = {
      ...this.snapshot,
      errors: [...this.snapshot.errors, error].slice(-12),
    };
  }
}

export class ResourceBag {
  private cleanups: Array<() => void> = [];
  private closed = false;

  add(cleanup: () => void): () => void {
    if (this.closed) {
      cleanup();
      return () => {};
    }
    let active = true;
    const wrapped = () => {
      if (!active) return;
      active = false;
      cleanup();
    };
    this.cleanups.push(wrapped);
    return wrapped;
  }

  addInterval(
    callback: () => void,
    intervalMs: number,
  ): ReturnType<typeof setInterval> {
    const timer = setInterval(callback, intervalMs);
    timer.unref?.();
    this.add(() => clearInterval(timer));
    return timer;
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    for (const cleanup of this.cleanups.splice(0).reverse()) {
      try {
        cleanup();
      } catch {
        // Cleanup remains best-effort during Pi shutdown/reload.
      }
    }
  }

  get isClosed(): boolean {
    return this.closed;
  }
}

export function createDebouncer(
  callback: () => void,
  delayMs: number,
  resources: ResourceBag,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  resources.add(() => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  });
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      callback();
    }, delayMs);
    timer.unref?.();
  };
}
