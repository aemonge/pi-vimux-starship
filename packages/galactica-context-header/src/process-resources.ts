import { readdir, readFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';

export const CPU_WIDGET_ID = 'galactica.session-cpu';
export const MEMORY_WIDGET_ID = 'galactica.session-memory';
export const RESOURCE_REFRESH_MS = 3_000;
export const CPU_WARNING_PERCENT = 80;
export const CPU_WARNING_SAMPLES = 3;
export const MEMORY_WARNING_BYTES = 4 * 1024 ** 3;

const LINUX_CLOCK_TICKS_PER_SECOND = 100;
const LINUX_PAGE_BYTES = 4_096;
const MAX_PROC_PROCESSES = 4_096;
const CPU_SMOOTHING_ALPHA = 0.35;

export interface ProcStat {
  pid: number;
  parentPid: number;
  cpuTicks: number;
  startTimeTicks: number;
  rssPages: number;
}

export interface ProcessCpuSample {
  pid: number;
  startTimeTicks: number;
  cpuTimeMs: number;
}

export interface ProcessTreeSample {
  sampledAtMs: number;
  memoryBytes: number;
  memorySource: 'private-anon' | 'rss';
  processes: ProcessCpuSample[];
  source: 'proc' | 'current-process';
}

export interface CpuSmoothingState {
  percent: number;
  pressureSamples: number;
  warning: boolean;
}

export interface ResourceTelemetry {
  cpuPercent: number;
  memoryBytes: number;
  cpuWarning: boolean;
  memoryWarning: boolean;
}

export interface ProcReader {
  listPids(): Promise<number[]>;
  readStat(pid: number): Promise<string>;
  readStatus?(pid: number): Promise<string>;
  readChildren?(pid: number): Promise<string>;
}

export function parseProcStat(text: string): ProcStat | undefined {
  const open = text.indexOf('(');
  const close = text.lastIndexOf(')');
  if (open <= 0 || close <= open) return undefined;

  const pid = Number.parseInt(text.slice(0, open).trim(), 10);
  const fields = text
    .slice(close + 1)
    .trim()
    .split(/\s+/u);
  const parentPid = Number.parseInt(fields[1] ?? '', 10);
  const userTicks = Number.parseInt(fields[11] ?? '', 10);
  const systemTicks = Number.parseInt(fields[12] ?? '', 10);
  const startTimeTicks = Number.parseInt(fields[19] ?? '', 10);
  const rssPages = Number.parseInt(fields[21] ?? '', 10);

  if (
    !Number.isSafeInteger(pid) ||
    pid <= 0 ||
    !Number.isSafeInteger(parentPid) ||
    parentPid < 0 ||
    !Number.isFinite(userTicks) ||
    userTicks < 0 ||
    !Number.isFinite(systemTicks) ||
    systemTicks < 0 ||
    !Number.isFinite(startTimeTicks) ||
    startTimeTicks < 0 ||
    !Number.isFinite(rssPages)
  ) {
    return undefined;
  }

  return {
    pid,
    parentPid,
    cpuTicks: userTicks + systemTicks,
    startTimeTicks,
    rssPages: Math.max(0, rssPages),
  };
}

export function parseProcStatusPrivateBytes(text: string): number | undefined {
  const match = text.match(/^RssAnon:\s+(\d+)\s+kB$/mu);
  if (!match) return undefined;
  const kibibytes = Number.parseInt(match[1] ?? '', 10);
  return Number.isSafeInteger(kibibytes) && kibibytes >= 0
    ? kibibytes * 1024
    : undefined;
}

export function selectProcessTree(
  records: readonly ProcStat[],
  rootPid: number,
): ProcStat[] {
  const byPid = new Map(records.map((record) => [record.pid, record]));
  if (!byPid.has(rootPid)) return [];

  const children = new Map<number, number[]>();
  for (const record of records) {
    const siblings = children.get(record.parentPid) ?? [];
    siblings.push(record.pid);
    children.set(record.parentPid, siblings);
  }

  const selected: ProcStat[] = [];
  const pending = [rootPid];
  const visited = new Set<number>();
  while (pending.length > 0 && selected.length < MAX_PROC_PROCESSES) {
    const pid = pending.shift();
    if (pid === undefined || visited.has(pid)) continue;
    visited.add(pid);
    const record = byPid.get(pid);
    if (!record) continue;
    selected.push(record);
    pending.push(...(children.get(pid) ?? []));
  }
  return selected;
}

export function buildProcessTreeSample(
  records: readonly ProcStat[],
  rootPid: number,
  sampledAtMs: number,
): ProcessTreeSample | undefined {
  const tree = selectProcessTree(records, rootPid);
  if (tree.length === 0) return undefined;
  return {
    sampledAtMs,
    memoryBytes: tree.reduce(
      (total, record) => total + record.rssPages * LINUX_PAGE_BYTES,
      0,
    ),
    memorySource: 'rss',
    processes: tree.map((record) => ({
      pid: record.pid,
      startTimeTicks: record.startTimeTicks,
      cpuTimeMs: (record.cpuTicks * 1_000) / LINUX_CLOCK_TICKS_PER_SECOND,
    })),
    source: 'proc',
  };
}

async function collectCandidatePids(
  rootPid: number,
  reader: ProcReader,
): Promise<number[]> {
  if (!reader.readChildren) {
    const listed = await reader.listPids();
    return Array.from(
      new Set([
        rootPid,
        ...listed.filter((pid) => Number.isSafeInteger(pid) && pid > 0),
      ]),
    ).slice(0, MAX_PROC_PROCESSES);
  }

  const selected: number[] = [];
  const pending = [rootPid];
  const visited = new Set<number>();
  while (pending.length > 0 && selected.length < MAX_PROC_PROCESSES) {
    const pid = pending.shift();
    if (pid === undefined || visited.has(pid)) continue;
    visited.add(pid);
    selected.push(pid);
    try {
      const children = (await reader.readChildren(pid))
        .trim()
        .split(/\s+/u)
        .flatMap((value) => {
          const child = Number.parseInt(value, 10);
          return Number.isSafeInteger(child) && child > 0 ? [child] : [];
        });
      pending.push(...children);
    } catch {
      // A child may exit while the bounded tree is being discovered.
    }
  }
  return selected;
}

export async function collectProcessTreeFromProc(
  rootPid: number,
  reader: ProcReader,
  sampledAtMs = Date.now(),
): Promise<ProcessTreeSample | undefined> {
  const pids = await collectCandidatePids(rootPid, reader);
  const settled = await Promise.allSettled(pids.map((pid) => reader.readStat(pid)));
  const records: ProcStat[] = [];
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue;
    const record = parseProcStat(result.value);
    if (record) records.push(record);
  }
  const sample = buildProcessTreeSample(records, rootPid, sampledAtMs);
  if (!sample || !reader.readStatus) return sample;

  const tree = selectProcessTree(records, rootPid);
  const statuses = await Promise.allSettled(
    tree.map((record) => reader.readStatus!(record.pid)),
  );
  let privateSamples = 0;
  let memoryBytes = 0;
  for (let index = 0; index < tree.length; index += 1) {
    const record = tree[index]!;
    const result = statuses[index];
    const privateBytes =
      result?.status === 'fulfilled'
        ? parseProcStatusPrivateBytes(result.value)
        : undefined;
    if (privateBytes === undefined) {
      memoryBytes += record.rssPages * LINUX_PAGE_BYTES;
    } else {
      memoryBytes += privateBytes;
      privateSamples += 1;
    }
  }
  return {
    ...sample,
    memoryBytes,
    memorySource: privateSamples > 0 ? 'private-anon' : 'rss',
  };
}

function currentProcessSample(sampledAtMs = Date.now()): ProcessTreeSample {
  const usage = process.cpuUsage();
  return {
    sampledAtMs,
    memoryBytes: Math.max(0, process.memoryUsage().rss),
    memorySource: 'rss',
    processes: [
      {
        pid: process.pid,
        startTimeTicks: 0,
        cpuTimeMs: Math.max(0, usage.user + usage.system) / 1_000,
      },
    ],
    source: 'current-process',
  };
}

function linuxProcReader(procRoot = '/proc'): ProcReader {
  return {
    async listPids() {
      const entries = await readdir(procRoot, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory() && /^\d+$/u.test(entry.name))
        .map((entry) => Number.parseInt(entry.name, 10));
    },
    async readStat(pid) {
      return readFile(`${procRoot}/${pid}/stat`, 'utf8');
    },
    async readStatus(pid) {
      return readFile(`${procRoot}/${pid}/status`, 'utf8');
    },
    async readChildren(pid) {
      return readFile(`${procRoot}/${pid}/task/${pid}/children`, 'utf8');
    },
  };
}

export async function sampleProcessTreeResources(
  options: {
    rootPid?: number;
    platform?: NodeJS.Platform;
    reader?: ProcReader;
    sampledAtMs?: number;
  } = {},
): Promise<ProcessTreeSample> {
  const sampledAtMs = options.sampledAtMs ?? Date.now();
  if ((options.platform ?? process.platform) === 'linux') {
    try {
      const sample = await collectProcessTreeFromProc(
        options.rootPid ?? process.pid,
        options.reader ?? linuxProcReader(),
        sampledAtMs,
      );
      if (sample) return sample;
    } catch {
      // /proc may be unavailable or transiently unreadable. The fallback below
      // deliberately reports only the current process rather than estimating descendants.
    }
  }
  return currentProcessSample(sampledAtMs);
}

export function calculateCpuPercent(
  previous: ProcessTreeSample | undefined,
  current: ProcessTreeSample,
  cpuCapacity = availableParallelism(),
): number {
  if (!previous) return 0;
  const elapsedMs = current.sampledAtMs - previous.sampledAtMs;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;

  const previousCpu = new Map(
    previous.processes.map((sample) => [
      `${sample.pid}:${sample.startTimeTicks}`,
      sample.cpuTimeMs,
    ]),
  );
  let usedCpuMs = 0;
  for (const sample of current.processes) {
    const before = previousCpu.get(`${sample.pid}:${sample.startTimeTicks}`);
    if (before === undefined) continue;
    usedCpuMs += Math.max(0, sample.cpuTimeMs - before);
  }
  const capacity =
    Number.isFinite(cpuCapacity) && cpuCapacity > 0 ? Math.floor(cpuCapacity) : 1;
  return Math.min(100, Math.max(0, (usedCpuMs / elapsedMs / capacity) * 100));
}

export function updateCpuSmoothing(
  previous: CpuSmoothingState | undefined,
  rawPercent: number,
): CpuSmoothingState {
  const normalized = Number.isFinite(rawPercent)
    ? Math.max(0, Math.min(100, rawPercent))
    : 0;
  const percent = previous
    ? previous.percent + CPU_SMOOTHING_ALPHA * (normalized - previous.percent)
    : normalized;
  const pressureSamples =
    normalized >= CPU_WARNING_PERCENT && percent >= CPU_WARNING_PERCENT
      ? (previous?.pressureSamples ?? 0) + 1
      : 0;
  return {
    percent,
    pressureSamples,
    warning: pressureSamples >= CPU_WARNING_SAMPLES,
  };
}

export function formatCpuPercent(percent: number): string {
  const normalized = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  return `${Math.round(normalized)}%`;
}

export function formatIecBytes(bytes: number): string {
  const normalized = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  const units = ['', 'K', 'M', 'G', 'T'];
  let value = normalized;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const decimals = unit > 0 && value < 10 ? 1 : 0;
  return `${value.toFixed(decimals).replace(/\.0$/u, '')}${units[unit]}`;
}

export function buildResourceTelemetry(
  cpu: CpuSmoothingState,
  memoryBytes: number,
): ResourceTelemetry {
  const normalizedMemory = Math.max(0, memoryBytes);
  return {
    cpuPercent: Math.max(0, Math.min(100, cpu.percent)),
    memoryBytes: normalizedMemory,
    cpuWarning: cpu.warning,
    memoryWarning: normalizedMemory >= MEMORY_WARNING_BYTES,
  };
}

export function buildResourceFooterWidgets(telemetry: ResourceTelemetry) {
  const cpuColor = telemetry.cpuWarning ? 'warning' : 'accent';
  const memoryColor = telemetry.memoryWarning ? 'warning' : 'accent';
  return [
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: CPU_WIDGET_ID,
        label: 'Session CPU',
        description: 'Share of available CPU capacity used by the Pi process tree',
        content: { type: 'text', text: formatCpuPercent(telemetry.cpuPercent) },
        icon: {
          glyphs: {
            nerd: '› ',
            emoji: '› 🧮',
            unicode: '› CPU',
            ascii: '> CPU',
          },
          color: cpuColor,
        },
        style: { textColor: cpuColor },
        layout: { row: 1, position: 7, align: 'right', fill: 'none' },
      },
    },
    {
      protocol: 1,
      type: 'upsert',
      widget: {
        id: MEMORY_WIDGET_ID,
        label: 'Session memory',
        description: 'Private resident memory used by the Pi process tree',
        content: { type: 'text', text: formatIecBytes(telemetry.memoryBytes) },
        icon: {
          glyphs: {
            nerd: '▤',
            emoji: '🧠',
            unicode: 'RAM',
            ascii: 'RAM',
          },
          color: memoryColor,
        },
        style: { textColor: memoryColor },
        layout: { row: 1, position: 6, align: 'right', fill: 'none' },
      },
    },
  ] as const;
}
