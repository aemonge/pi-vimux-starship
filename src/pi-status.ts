import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

export const PI_STATUS_SOURCE_CHANNEL = 'pi-vimux-starship:status-source/v1';
export const PI_NATIVE_STATUS_CHANNEL = 'pi-vimux-starship:native-status/v1';
export const PI_STATUS_SNAPSHOT_CHANNEL = 'pi-vimux-starship:pi-status/v1';

const MAX_SOURCES = 64;
const MAX_CONDITIONS_PER_SOURCE = 32;
const MAX_NATIVE_STATUSES = 999;
const MAX_ID_LENGTH = 96;
const MAX_SUMMARY_LENGTH = 240;
const ANSI_ESCAPE = new RegExp(
  '\\u001b(?:\\][\\s\\S]*?(?:\\u0007|\\u001b\\\\)|\\[[0-?]*[ -/]*[@-~]|[@-_])',
  'gu',
);
const CONTROL_CHARACTER = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f]', 'gu');

export type PiStatusSeverity = 'warning' | 'error';

export interface PiStatusCondition {
  id: string;
  source: string;
  severity: PiStatusSeverity;
  summary: string;
}

export interface PiNativeStatus {
  key: string;
  text: string;
}

export interface PiStatusSnapshot {
  protocol: 1;
  type: 'snapshot';
  errors: number;
  warnings: number;
  nativeStatusCount: number;
  conditions: PiStatusCondition[];
  nativeStatuses: PiNativeStatus[];
}

export interface PiStatusSourceMessage {
  protocol: 1;
  type: 'snapshot';
  source: string;
  conditions: Array<{
    id: string;
    severity: PiStatusSeverity;
    summary: string;
  }>;
}

export interface PiNativeStatusMessage {
  protocol: 1;
  type: 'snapshot';
  statuses: PiNativeStatus[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeInline(value: unknown, maximum: number): string {
  if (typeof value !== 'string') return '';
  return Array.from(
    value
      .replace(ANSI_ESCAPE, '')
      .replace(CONTROL_CHARACTER, ' ')
      .replace(/\s+/gu, ' ')
      .trim(),
  )
    .slice(0, maximum)
    .join('');
}

function safeId(value: unknown): string {
  const id = sanitizeInline(value, MAX_ID_LENGTH);
  return /^[a-z0-9][a-z0-9._:-]*$/iu.test(id) ? id : '';
}

export function parsePiStatusSourceMessage(raw: unknown): PiStatusSourceMessage | null {
  if (!isRecord(raw) || raw.protocol !== 1 || raw.type !== 'snapshot') return null;
  const source = safeId(raw.source);
  if (!source || !Array.isArray(raw.conditions)) return null;
  if (raw.conditions.length > MAX_CONDITIONS_PER_SOURCE) return null;

  const conditions: PiStatusSourceMessage['conditions'] = [];
  const ids = new Set<string>();
  for (const entry of raw.conditions) {
    if (!isRecord(entry)) return null;
    const id = safeId(entry.id);
    const summary = sanitizeInline(entry.summary, MAX_SUMMARY_LENGTH);
    if (
      !id ||
      ids.has(id) ||
      !summary ||
      (entry.severity !== 'warning' && entry.severity !== 'error')
    ) {
      return null;
    }
    ids.add(id);
    conditions.push({ id, severity: entry.severity, summary });
  }
  return { protocol: 1, type: 'snapshot', source, conditions };
}

export function parsePiNativeStatusMessage(raw: unknown): PiNativeStatusMessage | null {
  if (!isRecord(raw) || raw.protocol !== 1 || raw.type !== 'snapshot') return null;
  if (!Array.isArray(raw.statuses) || raw.statuses.length > MAX_NATIVE_STATUSES) {
    return null;
  }

  const statuses: PiNativeStatus[] = [];
  const keys = new Set<string>();
  for (const entry of raw.statuses) {
    if (!isRecord(entry)) return null;
    const key = sanitizeInline(entry.key, MAX_ID_LENGTH);
    const text = sanitizeInline(entry.text, MAX_SUMMARY_LENGTH);
    if (!key || keys.has(key) || !text) return null;
    keys.add(key);
    statuses.push({ key, text });
  }
  return { protocol: 1, type: 'snapshot', statuses };
}

function snapshotSignature(snapshot: PiStatusSnapshot): string {
  return JSON.stringify(snapshot);
}

export class ObservablePiStatusStore {
  private readonly sources = new Map<string, PiStatusCondition[]>();
  private nativeStatuses: PiNativeStatus[] = [];
  private lastSignature = '';

  applySource(raw: unknown): boolean {
    const message = parsePiStatusSourceMessage(raw);
    if (!message) return false;
    if (!this.sources.has(message.source) && this.sources.size >= MAX_SOURCES) {
      return false;
    }
    const next = message.conditions.map((condition) => ({
      ...condition,
      source: message.source,
    }));
    if (
      JSON.stringify(this.sources.get(message.source) ?? []) === JSON.stringify(next)
    ) {
      return false;
    }
    if (next.length === 0) this.sources.delete(message.source);
    else this.sources.set(message.source, next);
    return true;
  }

  applyNative(raw: unknown): boolean {
    const message = parsePiNativeStatusMessage(raw);
    if (!message) return false;
    if (JSON.stringify(this.nativeStatuses) === JSON.stringify(message.statuses)) {
      return false;
    }
    this.nativeStatuses = message.statuses;
    return true;
  }

  setSource(message: PiStatusSourceMessage): boolean {
    return this.applySource(message);
  }

  clear(): boolean {
    if (this.sources.size === 0 && this.nativeStatuses.length === 0) return false;
    this.sources.clear();
    this.nativeStatuses = [];
    return true;
  }

  snapshot(): PiStatusSnapshot {
    const conditions = [...this.sources.values()]
      .flat()
      .sort(
        (left, right) =>
          (left.severity === right.severity ? 0 : left.severity === 'error' ? -1 : 1) ||
          left.source.localeCompare(right.source) ||
          left.id.localeCompare(right.id),
      );
    return {
      protocol: 1,
      type: 'snapshot',
      errors: conditions.filter(({ severity }) => severity === 'error').length,
      warnings: conditions.filter(({ severity }) => severity === 'warning').length,
      nativeStatusCount: this.nativeStatuses.length,
      conditions,
      nativeStatuses: [...this.nativeStatuses],
    };
  }

  changedSnapshot(): PiStatusSnapshot | null {
    const snapshot = this.snapshot();
    const signature = snapshotSignature(snapshot);
    if (signature === this.lastSignature) return null;
    this.lastSignature = signature;
    return snapshot;
  }
}

export function formatPiStatus(snapshot: PiStatusSnapshot): string {
  const headline =
    snapshot.errors > 0 || snapshot.warnings > 0
      ? `Pi status · ${snapshot.errors} errors · ${snapshot.warnings} warnings`
      : 'Pi status · no observed issues';
  const lines = [headline];

  for (const condition of snapshot.conditions) {
    lines.push(
      `${condition.severity === 'error' ? 'ERROR' : 'WARN '} ${condition.source} · ${condition.summary}`,
    );
  }

  if (snapshot.nativeStatuses.length > 0) {
    lines.push('', `Native extension statuses · ${snapshot.nativeStatuses.length}`);
    for (const status of snapshot.nativeStatuses) {
      lines.push(`${status.key} · ${status.text}`);
    }
  } else {
    lines.push('', 'Native extension statuses · none');
  }

  lines.push(
    '',
    'Coverage · observable session events and cooperating loaded extensions',
    'Gap · Pi does not publish arbitrary extension-load or handler exceptions',
  );
  return lines.join('\n');
}

export function registerPiStatus(pi: ExtensionAPI): ObservablePiStatusStore {
  const store = new ObservablePiStatusStore();

  const publish = (force = false) => {
    const snapshot = store.changedSnapshot();
    if (snapshot) pi.events.emit(PI_STATUS_SNAPSHOT_CHANNEL, snapshot);
    else if (force) pi.events.emit(PI_STATUS_SNAPSHOT_CHANNEL, store.snapshot());
  };

  pi.events.on(PI_STATUS_SOURCE_CHANNEL, (raw) => {
    if (store.applySource(raw)) publish();
  });
  pi.events.on(PI_NATIVE_STATUS_CHANNEL, (raw) => {
    if (store.applyNative(raw)) publish();
  });

  pi.on('session_start', () => {
    store.clear();
    publish(true);
  });
  pi.on('session_shutdown', () => {
    store.clear();
  });
  pi.on('session_compact', () => {
    if (
      store.setSource({
        protocol: 1,
        type: 'snapshot',
        source: 'pi.compaction',
        conditions: [],
      })
    ) {
      publish();
    }
  });
  pi.on('session_compact_failed', (event) => {
    if (event.aborted) return;
    const summary = event.errorMessage
      ? `Compaction failed: ${sanitizeInline(event.errorMessage, 160)}`
      : 'Compaction failed';
    if (
      store.setSource({
        protocol: 1,
        type: 'snapshot',
        source: 'pi.compaction',
        conditions: [
          {
            id: 'failure',
            severity: event.willRetry ? 'warning' : 'error',
            summary,
          },
        ],
      })
    ) {
      publish();
    }
  });
  pi.on('message_end', (event) => {
    if (event.message.role !== 'assistant') return;
    const message = event.message as typeof event.message & {
      stopReason?: string;
      errorMessage?: string;
    };
    const conditions: PiStatusSourceMessage['conditions'] =
      message.stopReason === 'error'
        ? [
            {
              id: 'response-failure',
              severity: 'error',
              summary: message.errorMessage
                ? `Assistant response failed: ${sanitizeInline(message.errorMessage, 160)}`
                : 'Assistant response failed',
            },
          ]
        : [];
    if (
      store.setSource({
        protocol: 1,
        type: 'snapshot',
        source: 'pi.agent',
        conditions,
      })
    ) {
      publish();
    }
  });

  pi.registerCommand('pi-status', {
    description: 'Show observable Pi session conditions and native extension statuses',
    handler: async (_args, ctx) => {
      const snapshot = store.snapshot();
      ctx.ui.notify(
        formatPiStatus(snapshot),
        snapshot.errors > 0 ? 'error' : snapshot.warnings > 0 ? 'warning' : 'info',
      );
    },
  });

  return store;
}
