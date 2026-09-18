import { visibleWidth } from '@earendil-works/pi-tui';

export const WIDE_ACTIVITY_AGE_CELLS = 6;
export const STANDARD_ACTIVITY_AGE_CELLS = 4;
export const COMPACT_ACTIVITY_AGE_CELLS = 3;
export const RAIL_CHRONOMETER_CELLS = 8;
export const RUNTIME_STATUS_WIDGET_ID = 'galactica.runtime-state';
export const RUNTIME_SCOPE_SEPARATOR_WIDGET_ID = 'galactica.runtime-scope-separator';

export type ActivityAgeSize = 6 | 4 | 3;

const ACTIVITY_AGE_SIZES: readonly ActivityAgeSize[] = [
  WIDE_ACTIVITY_AGE_CELLS,
  STANDARD_ACTIVITY_AGE_CELLS,
  COMPACT_ACTIVITY_AGE_CELLS,
];

function boundedAge(ageMs: number): number {
  return Number.isFinite(ageMs) ? Math.max(0, Math.floor(ageMs)) : 0;
}

function activityHeartbeat(ageMs: number): string {
  return Math.floor(boundedAge(ageMs) / 500) % 2 === 0 ? '·' : '•';
}

function wideActivityAge(ageMs: number): string {
  const age = boundedAge(ageMs);
  if (age < 100) return `${age}ms`;
  if (age < 60_000) {
    return `${Math.min(59.9, Math.floor(age / 100) / 10).toFixed(1)}s`;
  }

  const seconds = Math.floor(age / 1_000);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m${String(seconds % 60).padStart(2, '0')}s`;
  }

  const hours = Math.floor(minutes / 60);
  const heartbeat = activityHeartbeat(age);
  if (hours < 10) {
    return `${hours}h${String(minutes % 60).padStart(2, '0')}m${heartbeat}`;
  }
  if (hours < 100) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}${heartbeat}`;
  }

  const days = Math.min(99, Math.floor(hours / 24));
  if (days < 10) {
    return `${days}d${String(hours % 24).padStart(2, '0')}h${heartbeat}`;
  }
  return `${days}d${String(hours % 24).padStart(2, '0')}${heartbeat}`;
}

function standardActivityAge(ageMs: number): string {
  const age = boundedAge(ageMs);
  if (age < 100) return `${age}ms`;
  if (age < 10_000) return `${Math.min(9.9, age / 1_000).toFixed(1)}s`;

  const seconds = Math.floor(age / 1_000);
  if (seconds < 100) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 100) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 100) return `${hours}h`;
  return `${Math.min(99, Math.floor(hours / 24))}d`;
}

function compactActivityAge(ageMs: number): string {
  const age = boundedAge(ageMs);
  const seconds = Math.floor(age / 1_000);
  if (seconds < 100) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 100) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 100) return `${hours}h`;
  return `${Math.min(99, Math.floor(hours / 24))}d`;
}

export function formatActivityAge(ageMs: number, size: ActivityAgeSize): string {
  const text =
    size === WIDE_ACTIVITY_AGE_CELLS
      ? wideActivityAge(ageMs)
      : size === STANDARD_ACTIVITY_AGE_CELLS
        ? standardActivityAge(ageMs)
        : compactActivityAge(ageMs);
  return `${' '.repeat(Math.max(0, size - visibleWidth(text)))}${text}`;
}

export function passiveActivityStatus(
  lifecycle: string,
  size: ActivityAgeSize,
): string {
  const normalized = lifecycle.trim().toLowerCase();
  const full =
    normalized === 'listening'
      ? 'idle'
      : normalized === 'blocked'
        ? 'hold'
        : normalized === 'aborted'
          ? 'stop'
          : 'wait';
  if (size !== COMPACT_ACTIVITY_AGE_CELLS) {
    return `${' '.repeat(Math.max(0, size - visibleWidth(full)))}${full}`;
  }
  const compact =
    full === 'idle' ? '—' : full === 'hold' ? '!' : full === 'stop' ? '×' : '…';
  return `${' '.repeat(size - visibleWidth(compact))}${compact}`;
}

export function formatRailChronometer(ageMs: number | null): string {
  if (ageMs === null) return "00:00'00";

  const centiseconds = Math.floor(boundedAge(ageMs) / 10);
  const minutes = Math.floor(centiseconds / 6_000);
  if (minutes < 100) {
    const seconds = Math.floor(centiseconds / 100) % 60;
    const remainder = centiseconds % 100;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}'${String(remainder).padStart(2, '0')}`;
  }

  const totalSeconds = Math.floor(centiseconds / 100);
  const hours = Math.floor(totalSeconds / 3_600);
  if (hours < 100) {
    const remainderMinutes = Math.floor(totalSeconds / 60) % 60;
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}h${String(remainderMinutes).padStart(2, '0')}'${String(seconds).padStart(2, '0')}`;
  }

  const days = Math.min(99, Math.floor(hours / 24));
  const remainderHours = hours % 24;
  const remainderMinutes = Math.floor(totalSeconds / 60) % 60;
  return `${String(days).padStart(2, '0')}d${String(remainderHours).padStart(2, '0')}'${String(remainderMinutes).padStart(2, '0')}`;
}

export function activityAgeCandidates(
  ageMs: number | null,
  lifecycle = 'listening',
): ReadonlyArray<{ size: ActivityAgeSize; age: string }> {
  return ACTIVITY_AGE_SIZES.map((size) => ({
    size,
    age:
      ageMs === null
        ? passiveActivityStatus(lifecycle, size)
        : formatActivityAge(ageMs, size),
  }));
}

export function buildRuntimeFooterWidgets(status: string, active = false) {
  return [
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: RUNTIME_STATUS_WIDGET_ID,
        label: 'Runtime state',
        description: 'Time since foreground activity or the settled runtime state',
        content: { type: 'text', text: status },
        icon: false,
        style: { textColor: active ? 'accent' : 'dim' },
        layout: {
          row: 1,
          position: 4,
          align: 'left',
          fill: 'none',
          minWidth: RAIL_CHRONOMETER_CELLS,
        },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: RUNTIME_SCOPE_SEPARATOR_WIDGET_ID,
        label: 'Runtime scope separator',
        description: 'Separates the active LLM from runtime state',
        content: { type: 'text', text: '⟩' },
        icon: false,
        style: { textColor: 'thinkingHigh' },
        layout: { row: 1, position: 3, align: 'left', fill: 'none' },
      },
    },
  ] as const;
}
