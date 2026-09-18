import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildProcessTreeSample,
  buildResourceFooterWidgets,
  buildResourceTelemetry,
  calculateCpuPercent,
  collectProcessTreeFromProc,
  CPU_WIDGET_ID,
  formatCpuPercent,
  formatIecBytes,
  MEMORY_WIDGET_ID,
  parseProcStat,
  parseProcStatusPrivateBytes,
  sampleProcessTreeResources,
  selectProcessTree,
  updateCpuSmoothing,
  type ProcStat,
  type ProcessTreeSample,
} from '../src/process-resources.ts';

function procStat(options: {
  pid: number;
  parentPid: number;
  userTicks: number;
  systemTicks: number;
  startTimeTicks: number;
  rssPages: number;
  name?: string;
}): string {
  const fields = Array.from({ length: 30 }, () => '0');
  fields[0] = 'S';
  fields[1] = String(options.parentPid);
  fields[11] = String(options.userTicks);
  fields[12] = String(options.systemTicks);
  fields[19] = String(options.startTimeTicks);
  fields[21] = String(options.rssPages);
  return `${options.pid} (${options.name ?? 'pi'}) ${fields.join(' ')}`;
}

const records: ProcStat[] = [
  { pid: 10, parentPid: 1, cpuTicks: 100, startTimeTicks: 1, rssPages: 10 },
  { pid: 11, parentPid: 10, cpuTicks: 40, startTimeTicks: 2, rssPages: 20 },
  { pid: 12, parentPid: 11, cpuTicks: 20, startTimeTicks: 3, rssPages: 30 },
  { pid: 99, parentPid: 1, cpuTicks: 900, startTimeTicks: 4, rssPages: 90 },
];

test('parses /proc stat fields without exposing the parenthesized process name', () => {
  assert.deepEqual(
    parseProcStat(
      procStat({
        pid: 42,
        parentPid: 10,
        userTicks: 120,
        systemTicks: 30,
        startTimeTicks: 900,
        rssPages: 96_000,
        name: 'worker ) helper',
      }),
    ),
    {
      pid: 42,
      parentPid: 10,
      cpuTicks: 150,
      startTimeTicks: 900,
      rssPages: 96_000,
    },
  );
  assert.equal(parseProcStat('not a proc stat'), undefined);
  assert.equal(
    parseProcStatusPrivateBytes(
      'VmRSS:              9000 kB\nRssAnon:            6400 kB\nRssFile:            2600 kB\n',
    ),
    6_400 * 1024,
  );
  assert.equal(parseProcStatusPrivateBytes('VmRSS: 9000 kB\n'), undefined);
});

test('selects only the current Pi PID and descendants with RSS fallback', () => {
  assert.deepEqual(
    selectProcessTree(records, 10).map(({ pid }) => pid),
    [10, 11, 12],
  );
  const sample = buildProcessTreeSample(records, 10, 5_000);
  assert.ok(sample);
  assert.equal(sample.source, 'proc');
  assert.equal(sample.memorySource, 'rss');
  assert.equal(sample.memoryBytes, 60 * 4_096);
  assert.deepEqual(
    sample.processes.map(({ pid, cpuTimeMs }) => [pid, cpuTimeMs]),
    [
      [10, 1_000],
      [11, 400],
      [12, 200],
    ],
  );
});

test('discovers only the live descendant tree through Linux children files', async () => {
  const readStats: number[] = [];
  const sample = await collectProcessTreeFromProc(
    10,
    {
      listPids: async () => {
        throw new Error('full proc scan should not run');
      },
      readChildren: async (pid) =>
        new Map([
          [10, '11 12'],
          [11, '13'],
          [12, ''],
          [13, ''],
        ]).get(pid) ?? '',
      readStat: async (pid) => {
        readStats.push(pid);
        return procStat({
          pid,
          parentPid: pid === 10 ? 1 : pid === 13 ? 11 : 10,
          userTicks: 1,
          systemTicks: 0,
          startTimeTicks: pid,
          rssPages: 1,
        });
      },
      readStatus: async () => 'VmRSS: 8 kB\nRssAnon: 4 kB\n',
    },
    5_500,
  );

  assert.deepEqual(
    readStats.sort((left, right) => left - right),
    [10, 11, 12, 13],
  );
  assert.deepEqual(
    sample?.processes.map(({ pid }) => pid),
    [10, 11, 12, 13],
  );
  assert.equal(sample?.memoryBytes, 16 * 1024);
});

test('keeps /proc sampling bounded and tolerates processes exiting mid-sample', async () => {
  const stats = new Map([
    [
      10,
      procStat({
        pid: 10,
        parentPid: 1,
        userTicks: 10,
        systemTicks: 0,
        startTimeTicks: 1,
        rssPages: 10,
      }),
    ],
    [
      11,
      procStat({
        pid: 11,
        parentPid: 10,
        userTicks: 5,
        systemTicks: 0,
        startTimeTicks: 2,
        rssPages: 20,
      }),
    ],
  ]);
  const sample = await collectProcessTreeFromProc(
    10,
    {
      listPids: async () => [10, 11, 12],
      readStat: async (pid) => {
        const stat = stats.get(pid);
        if (!stat) throw new Error('exited');
        return stat;
      },
      readStatus: async (pid) => {
        if (pid === 10) return 'VmRSS: 40 kB\nRssAnon: 8 kB\n';
        if (pid === 11) return 'VmRSS: 80 kB\nRssAnon: 12 kB\n';
        throw new Error('exited');
      },
    },
    6_000,
  );

  assert.ok(sample);
  assert.equal(sample.source, 'proc');
  assert.equal(sample.memorySource, 'private-anon');
  assert.equal(sample.memoryBytes, 20 * 1024);
  assert.deepEqual(
    sample.processes.map(({ pid }) => pid),
    [10, 11],
  );
});

test('falls back honestly to current-process metrics when /proc is unavailable', async () => {
  const sample = await sampleProcessTreeResources({
    platform: 'linux',
    reader: {
      listPids: async () => {
        throw new Error('no proc');
      },
      readStat: async () => '',
    },
    sampledAtMs: 7_000,
  });
  assert.equal(sample.source, 'current-process');
  assert.equal(sample.memorySource, 'rss');
  assert.equal(sample.processes.length, 1);
  assert.ok(sample.memoryBytes > 0);
});

function cpuSample(
  sampledAtMs: number,
  cpuTimes: Array<[number, number, number]>,
): ProcessTreeSample {
  return {
    sampledAtMs,
    memoryBytes: 0,
    memorySource: 'rss',
    source: 'proc',
    processes: cpuTimes.map(([pid, startTimeTicks, cpuTimeMs]) => ({
      pid,
      startTimeTicks,
      cpuTimeMs,
    })),
  };
}

test('normalizes process-tree CPU against available capacity and caps display', () => {
  const previous = cpuSample(1_000, [
    [10, 1, 100],
    [11, 2, 200],
  ]);
  const current = cpuSample(2_000, [
    [10, 1, 900],
    [11, 2, 700],
    [12, 3, 500],
  ]);
  assert.equal(calculateCpuPercent(previous, current, 2), 65);
  assert.equal(calculateCpuPercent(previous, current, 1), 100);
  assert.equal(formatCpuPercent(129.6), '100%');
  assert.equal(formatCpuPercent(Number.NaN), '0%');
});

test('smooths short CPU spikes and warns only after sustained pressure', () => {
  let state = updateCpuSmoothing(undefined, 0);
  state = updateCpuSmoothing(state, 500);
  assert.equal(Math.round(state.percent), 35);
  assert.equal(state.warning, false);
  state = updateCpuSmoothing(state, 0);
  assert.equal(state.warning, false);

  state = updateCpuSmoothing(undefined, 90);
  assert.equal(state.warning, false);
  state = updateCpuSmoothing(state, 90);
  assert.equal(state.warning, false);
  state = updateCpuSmoothing(state, 90);
  assert.equal(state.warning, true);
});

test('formats private resident memory with compact IEC units', () => {
  assert.equal(formatIecBytes(375 * 1024 ** 2), '375M');
  assert.equal(formatIecBytes(1.2 * 1024 ** 3), '1.2G');
  assert.equal(formatIecBytes(9 * 1024), '9K');
  assert.equal(formatIecBytes(Number.NaN), '0');
});

test('positions RAM before CPU with exact Nerd glyphs and semantic fallbacks', () => {
  const widgets = buildResourceFooterWidgets(
    buildResourceTelemetry(
      { percent: 12.2, pressureSamples: 0, warning: false },
      375 * 1024 ** 2,
    ),
  );
  assert.deepEqual(
    widgets.map(({ widget }) => widget.id),
    [CPU_WIDGET_ID, MEMORY_WIDGET_ID],
  );
  assert.deepEqual(
    widgets.map(({ widget }) => widget.layout.position),
    [7, 6],
  );
  assert.equal(widgets[0].widget.layout.row, 1);
  assert.equal(widgets[1].widget.layout.row, 1);
  assert.equal(widgets[0].widget.icon.glyphs.nerd, '› ');
  assert.equal(widgets[0].widget.icon.glyphs.ascii, '> CPU');
  assert.equal(widgets[0].widget.content.text, '12%');
  assert.equal(widgets[1].widget.icon.glyphs.nerd, '▤');
  assert.equal(widgets[1].widget.icon.glyphs.unicode, 'RAM');
  assert.equal(widgets[1].widget.content.text, '375M');
  assert.equal(widgets[0].widget.style.textColor, 'accent');
  assert.equal(widgets[1].widget.style.textColor, 'accent');

  const pressured = buildResourceFooterWidgets({
    cpuPercent: 200,
    memoryBytes: 5 * 1024 ** 3,
    cpuWarning: true,
    memoryWarning: true,
  });
  assert.equal(pressured[0].widget.content.text, '100%');
  assert.equal(pressured[0].widget.style.textColor, 'warning');
  assert.equal(pressured[1].widget.style.textColor, 'warning');
});
