import type {
  DiagnosticsState,
  OrchestrationState,
  ProgressFact,
  RunSpan,
  SelectionState,
  StageValue,
} from './types.ts';

/**
 * Append-only event ledger for the cockpit status core.
 *
 * Every producer mutation becomes exactly one bounded event. The reducer is the
 * only reader that writes snapshot state. Payloads carry bounded presentation
 * facts only — never prompts, generated prose, tool arguments, child output,
 * credentials, or hidden reasoning (frozen contract, Privacy section).
 */

export const LEDGER_EVENT_TYPES = [
  'selection/set',
  'run/start',
  'run/stage',
  'run/end',
  'progress/refresh',
  'diagnostics/refresh',
  'orchestration/refresh',
  'taskflow/phase',
] as const;

export type LedgerEventType = (typeof LEDGER_EVENT_TYPES)[number];

export type LedgerEvent =
  | { type: 'selection/set'; at: number; selection: SelectionState }
  | { type: 'run/start'; at: number; span: RunSpan }
  | { type: 'run/stage'; at: number; id: string; stage: StageValue; declared: boolean }
  | { type: 'run/end'; at: number; id: string }
  | { type: 'progress/refresh'; at: number; progress: ProgressFact | null }
  | { type: 'diagnostics/refresh'; at: number; state: DiagnosticsState | null }
  | { type: 'orchestration/refresh'; at: number; state: OrchestrationState | null }
  | { type: 'taskflow/phase'; at: number; phase: string };

const DEFAULT_EVENT_CAP = 512;

export class EventLedger {
  private readonly events: LedgerEvent[] = [];
  private readonly cap: number;

  constructor(cap: number = DEFAULT_EVENT_CAP) {
    if (!Number.isInteger(cap) || cap < 1) {
      throw new RangeError('ledger cap must be a positive integer');
    }
    this.cap = cap;
  }

  append(event: LedgerEvent): void {
    this.events.push(event);
    if (this.events.length > this.cap) {
      this.events.splice(0, this.events.length - this.cap);
    }
  }

  snapshot(): readonly LedgerEvent[] {
    return this.events.slice();
  }

  get size(): number {
    return this.events.length;
  }
}

/** Bounded taskflow phase label: inline, trimmed, single line, hard-capped. */
export function boundedPhase(value: string): string {
  const normalized = value.replace(/[\u0000-\u001f\u007f-\u009f]/gu, ' ').replace(
    /\s+/gu,
    ' ',
  );
  const points = Array.from(normalized.trim());
  if (points.length <= 40) return points.join('');
  return `${points.slice(0, 39).join('')}…`;
}

/** Validate an unknown value as a ledger event (fail-soft for adapters). */
export function isLedgerEvent(value: unknown): value is LedgerEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as { type?: unknown; at?: unknown };
  if (typeof candidate.type !== 'string') return false;
  if (!(LEDGER_EVENT_TYPES as readonly string[]).includes(candidate.type)) {
    return false;
  }
  return typeof candidate.at === 'number' && Number.isFinite(candidate.at);
}
