import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import * as gaugeModule from '../src/gauge.ts';

const {
  buildContextGauge,
  contextFooterColor,
  countCompactions,
  contextGaugeColor,
  displayedHeaderWork,
  formatFooterBranch,
  formatFooterPath,
  lifecycleStatusLabel,
  normalizeContextPercent,
  reasoningFooterColor,
  runtimeHeaderWork,
} = gaugeModule;

test('uses the requested context label and header colors', () => {
  const presentation = (
    gaugeModule as unknown as {
      HEADER_PRESENTATION?: {
        contextIcon: string;
        contextLabel: string;
        contextColor: string;
        locationColor: string;
      };
    }
  ).HEADER_PRESENTATION;

  assert.deepEqual(presentation, {
    contextIcon: '󰧑',
    contextLabel: 'ctx',
    contextColor: 'success',
    locationColor: 'success',
  });
  assert.deepEqual(displayedHeaderWork(null), {
    work: {
      lifecycle: 'listening',
      titles: ['no focused task'],
      color: 'accent',
    },
    idle: true,
  });
  assert.equal(
    displayedHeaderWork({ lifecycle: 'active', titles: ['Refine'], color: 'accent' })
      .idle,
    false,
  );
  assert.equal(lifecycleStatusLabel(displayedHeaderWork(null).work), '⟩ listening');
  assert.deepEqual(runtimeHeaderWork(null, true), {
    work: {
      lifecycle: 'understanding',
      titles: ['no focus'],
      color: 'accent',
      activity: { kind: 'understanding' },
    },
    idle: false,
  });
  assert.deepEqual(
    runtimeHeaderWork(
      { lifecycle: 'waiting', titles: ['Refine'], color: 'accent' },
      true,
    ),
    {
      work: { lifecycle: 'waiting', titles: ['Refine'], color: 'accent' },
      idle: false,
    },
  );
  assert.equal(
    lifecycleStatusLabel(runtimeHeaderWork(null, true).work),
    '⟩ understanding',
  );
  assert.equal(
    lifecycleStatusLabel({
      lifecycle: 'waiting',
      titles: ['Refine'],
      color: 'accent',
    }),
    '⟩ waiting',
  );
});

test('colors context pressure semantically at stable boundaries', () => {
  assert.equal(contextGaugeColor(0), 'success');
  assert.equal(contextGaugeColor(64.9), 'success');
  assert.equal(contextGaugeColor(65), 'success');
  assert.equal(contextGaugeColor(84.9), 'success');
  assert.equal(contextGaugeColor(85), 'warning');
  assert.equal(contextGaugeColor(100), 'warning');
});

test('builds grouped project, Git, left LLM, and right telemetry widgets', () => {
  const widgets = gaugeModule.buildAgentFooterWidgets({
    cwd: '~/galactica/.pi/agent',
    branch: 'feat/new-ui',
    git: { staged: 2, modified: 12, untracked: 4, conflicts: 1 },
    model: 'Opus',
    thinking: 'high',
    contextPercent: 42,
    compactionCount: 2,
  });
  const byId = (id: string) => {
    const message = widgets.find(({ widget }) => widget.id === id);
    assert.ok(message, `missing widget ${id}`);
    return message.widget;
  };

  const location = byId('galactica.location');
  assert.ok(location.icon);
  assert.equal(location.icon.glyphs.nerd, '');
  assert.equal(location.content.text, '~/galactica/.pi/agent');
  assert.equal(location.icon.color, 'accent');
  assert.deepEqual(location.style, { textColor: 'accent', bold: true });
  assert.equal(location.layout.position, 0);
  assert.equal(location.layout.fill, 'grow');
  assert.equal(location.layout.minWidth, 12);

  const gitBoundary = byId('galactica.git-scope-separator');
  assert.equal(gitBoundary.content.text, '›');
  assert.equal(gitBoundary.style.textColor, 'accent');
  assert.equal(gitBoundary.layout.position, 1);

  const branch = byId('galactica.git-branch');
  assert.ok(branch.icon);
  assert.equal(branch.icon.glyphs.nerd, '');
  assert.equal(branch.icon.color, 'success');
  assert.equal(branch.content.text, 'feat/new-ui');
  assert.equal(branch.style.textColor, 'success');
  assert.equal(branch.layout.position, 2);
  assert.equal(branch.layout.fill, 'none');
  assert.equal('minWidth' in branch.layout, false);

  const staged = byId('galactica.git-staged');
  assert.ok(staged.icon);
  assert.equal(staged.icon.glyphs.nerd, '');
  assert.equal(staged.icon.color, 'toolDiffAdded');
  assert.equal(staged.content.text, '2');
  assert.equal(staged.layout.position, 3);

  const modified = byId('galactica.git-modified');
  assert.ok(modified.icon);
  assert.equal(modified.icon.glyphs.nerd, '');
  assert.equal(modified.icon.color, 'warning');
  assert.equal(modified.content.text, '12');
  assert.equal(modified.layout.position, 4);

  const untracked = byId('galactica.git-untracked');
  assert.ok(untracked.icon);
  assert.equal(untracked.icon.glyphs.nerd, '');
  assert.equal(untracked.icon.color, 'mdHeading');
  assert.equal(untracked.content.text, '4');
  assert.equal(untracked.style.textColor, 'mdHeading');
  assert.equal(untracked.layout.position, 5);

  const conflict = byId('galactica.git-conflict');
  assert.ok(conflict.icon);
  assert.equal(conflict.icon.glyphs.nerd, '');
  assert.equal(conflict.icon.color, 'error');
  assert.equal(conflict.content.text, '1');
  assert.equal(conflict.layout.position, 6);

  const environment = byId('galactica.agent-environment');
  assert.equal(environment.content.text, 'Opus');
  assert.ok(environment.icon);
  assert.equal(environment.icon.color, 'accent');
  assert.equal(environment.style.textColor, 'accent');
  assert.equal(environment.layout.align, 'left');
  assert.equal(environment.layout.row, 1);
  assert.equal(environment.layout.position, 0);

  const reasoning = byId('galactica.reasoning-effort');
  assert.equal(reasoning.content.text, '› high');
  assert.equal(reasoning.layout.align, 'left');
  assert.equal(reasoning.layout.row, 1);
  assert.equal(reasoning.layout.position, 1);
  assert.equal(reasoning.style.textColor, 'borderAccent');

  const separator = byId('galactica.scope-separator');
  assert.equal(separator.content.text, '⟩');
  assert.equal(separator.style.textColor, 'thinkingHigh');
  assert.equal(separator.layout.row, 1);
  assert.equal(separator.layout.position, 5);

  const context = byId('galactica.context-usage');
  assert.equal(context.content.text, '42%');
  assert.equal(context.layout.align, 'right');
  assert.equal(context.layout.row, 1);
  assert.equal(context.layout.position, 9);
  assert.ok(context.icon);
  assert.equal(context.icon.glyphs.nerd, '󰾆');
  assert.equal(context.icon.color, 'accent');
  assert.equal(context.style.textColor, 'accent');

  const compactions = byId('galactica.compaction-count');
  assert.equal(compactions.content.text, '2');
  assert.ok(compactions.icon);
  assert.equal(compactions.icon.glyphs.nerd, '› 󰎞');
  assert.equal(compactions.icon.color, 'accent');
  assert.equal(compactions.style.textColor, 'accent');
  assert.equal(compactions.layout.row, 1);
  assert.equal(compactions.layout.position, 10);

  const resourceBoundary = byId('galactica.resource-separator');
  assert.equal(resourceBoundary.content.text, '⟩');
  assert.equal(resourceBoundary.style.textColor, 'thinkingHigh');
  assert.equal(resourceBoundary.layout.row, 1);
  assert.equal(resourceBoundary.layout.position, 8);

  assert.equal(reasoningFooterColor('medium'), 'thinkingMedium');
  assert.equal(contextFooterColor('medium', 42), 'accent');
  assert.equal(
    countCompactions([
      { type: 'message' },
      { type: 'compaction' },
      { type: 'compaction' },
    ]),
    2,
  );
});

test('shows an honest dim no-Git placeholder that can yield responsively', () => {
  const widgets = gaugeModule.buildAgentFooterWidgets({
    cwd: '~/galactica',
    branch: '',
    gitAvailable: false,
    git: { staged: 0, modified: 0, untracked: 0, conflicts: 0 },
    model: 'Opus',
    thinking: 'high',
    contextPercent: 42,
  });
  const byId = (id: string) => widgets.find(({ widget }) => widget.id === id)!.widget;

  assert.equal(byId('galactica.git-scope-separator').content.text, '');
  const branch = byId('galactica.git-branch');
  assert.equal(branch.content.text, '(no Git)');
  assert.ok(branch.icon);
  assert.equal(branch.icon.glyphs.nerd, '› ');
  assert.equal(branch.icon.color, 'dim');
  assert.deepEqual(branch.style, { textColor: 'dim' });
  assert.deepEqual(branch.layout, {
    row: 0,
    position: 2,
    align: 'left',
    fill: 'grow',
    minWidth: 0,
  });
});

test('keeps local metrics blue until critical context turns them yellow', () => {
  const warning = gaugeModule
    .buildAgentFooterWidgets({
      cwd: '~',
      branch: 'main',
      git: { staged: 0, modified: 0, untracked: 0, conflicts: 0 },
      model: 'Opus',
      thinking: 'high',
      contextPercent: 70,
    })
    .find(({ widget }) => widget.id === 'galactica.context-usage')!.widget;
  assert.ok(warning.icon);
  assert.equal(warning.icon.color, 'accent');
  assert.equal(warning.style.textColor, 'accent');

  const critical = gaugeModule
    .buildAgentFooterWidgets({
      cwd: '~',
      branch: 'main',
      git: { staged: 0, modified: 0, untracked: 0, conflicts: 0 },
      model: 'Opus',
      thinking: 'high',
      contextPercent: 88.9,
    })
    .find(({ widget }) => widget.id === 'galactica.context-usage')!.widget;
  assert.ok(critical.icon);
  assert.equal(critical.icon.color, 'warning');
  assert.equal(critical.style.textColor, 'warning');
  assert.equal(contextFooterColor('max', 90), 'warning');
});

test('config keeps one footer row and moves compact telemetry to prompt rails', () => {
  const config = JSON.parse(
    readFileSync(new URL('./fixtures/fancy-footer.json', import.meta.url), 'utf8'),
  ) as {
    widgets: Record<
      string,
      { enabled?: boolean; row?: number; position?: number; align?: string }
    >;
    extensionWidgets: Record<
      string,
      { enabled?: boolean; row?: number; position?: number; align?: string }
    >;
  };

  assert.deepEqual(config.widgets['provider-status'], {
    row: 0,
    position: 2,
    align: 'right',
    icon: 'hide',
  });
  assert.deepEqual(config.widgets['total-cost'], { enabled: false });
  assert.deepEqual(config.extensionWidgets['galactica.agent-environment'], {
    row: 0,
    position: 0,
    align: 'right',
  });
  assert.deepEqual(config.extensionWidgets['galactica.reasoning-effort'], {
    row: 0,
    position: 1,
    align: 'right',
  });

  for (const id of [
    'galactica.openspec-progress',
    'galactica.work',
    'galactica.goal',
    'galactica.project-capabilities',
    'galactica.runtime-scope-separator',
    'galactica.runtime-state',
    'galactica.session-memory',
    'galactica.session-cpu',
    'galactica.resource-separator',
    'galactica.context-usage',
    'galactica.compaction-count',
  ]) {
    assert.deepEqual(config.extensionWidgets[id], { enabled: false }, id);
  }
});

test('extension never converts Human prompt text into title focus', () => {
  const extensionSource = readFileSync(new URL('../index.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(
    extensionSource,
    /event\.prompt|directWorkTitle|DIRECT_WORK_ENTRY|restoreDirectWork/u,
  );
});

test('hides Pi working row and wires foreground activity-age lifecycle', () => {
  const extensionSource = readFileSync(new URL('../index.ts', import.meta.url), 'utf8');
  assert.match(extensionSource, /ctx\.ui\.setWorkingVisible\(false\)/u);
  for (const event of [
    'turn_start',
    'before_provider_request',
    'after_provider_response',
    'message_start',
    'message_update',
    'message_end',
    'tool_execution_start',
    'tool_execution_update',
    'tool_execution_end',
    'agent_settled',
    'session_shutdown',
  ]) {
    assert.match(extensionSource, new RegExp(`pi\\.on\\('${event}'`, 'u'));
  }
  assert.match(extensionSource, /markObservedActivity/u);
  assert.match(extensionSource, /setInterval\(refreshActivityAge, 50\)/u);
  assert.match(extensionSource, /clearInterval\(activityAgeTimer\)/u);
  assert.match(extensionSource, /buildRuntimeFooterWidgets\(status, active\)/u);
  assert.match(extensionSource, /activityAge !== null/u);
  assert.doesNotMatch(extensionSource, /ageLayout|rightAlignActivityAge/u);
  assert.doesNotMatch(extensionSource, /assistantMessageEvent|text_delta/u);
});

test('accepts only bounded Footer telemetry and Vim mode events', () => {
  assert.deepEqual(
    gaugeModule.parseFooterTelemetry({
      protocol: 1,
      type: 'snapshot',
      totalCost: 5.16,
      quotaPercent: 63,
    }),
    { totalCost: 5.16, quotaPercent: 63 },
  );
  assert.equal(
    gaugeModule.parseFooterTelemetry({
      protocol: 1,
      type: 'snapshot',
      totalCost: 1,
      quotaPercent: 101,
    }),
    null,
  );
  assert.equal(gaugeModule.parseVimMode({ mode: 'normal' }), 'normal');
  assert.equal(gaugeModule.parseVimMode({ mode: 'private-mode' }), null);
});

test('parses bounded work counters without accepting impossible progress', () => {
  const parsed = gaugeModule.parseHeaderSnapshot({
    protocol: 1,
    counters: {
      agents: { active: 2, total: 3 },
      steps: { completed: 6, total: 16 },
      files: { completed: 37, total: 53 },
    },
  });
  assert.deepEqual(parsed?.counters, {
    agents: { active: 2, total: 3 },
    steps: { completed: 6, total: 16 },
    files: { completed: 37, total: 53 },
  });

  const invalid = gaugeModule.parseHeaderSnapshot({
    protocol: 1,
    counters: { agents: { active: 4, total: 3 } },
  });
  assert.deepEqual(invalid?.counters, { agents: { active: 0, total: 0 } });
});

test('never derives title focus from conversation-shaped fields', () => {
  const untrusted = gaugeModule.parseHeaderSnapshot({
    protocol: 1,
    prompt: 'Refine chrome exactly as the Human wrote it',
    title: 'Refine chrome exactly as the Human wrote it',
    activity: { kind: 'inspection' },
  });
  assert.equal(untrusted?.work, null);
  assert.deepEqual(untrusted?.activity, { kind: 'inspection' });

  const explicit = gaugeModule.parseHeaderSnapshot({
    protocol: 1,
    work: {
      lifecycle: 'active',
      titles: ['Ramona-authored focus update'],
      color: 'accent',
    },
  });
  assert.equal(explicit?.work?.titles[0], 'Ramona-authored focus update');
});

test('parses a bounded multi-segment activity path', () => {
  const parsed = gaugeModule.parseHeaderSnapshot({
    protocol: 1,
    work: {
      lifecycle: 'assuring',
      titles: ['Implement global flow'],
      color: 'accent',
      activityPath: [
        { id: 'checking-quality', label: 'checking quality', compact: 'quality' },
        {
          id: 'assuring-tests',
          label: 'assuring tests',
          current: 12_000,
          total: 20_000,
        },
      ],
    },
  });

  assert.deepEqual(parsed?.work?.activityPath, [
    { id: 'checking-quality', label: 'checking quality', compact: 'quality' },
    {
      id: 'assuring-tests',
      label: 'assuring tests',
      current: 9_999,
      total: 9_999,
    },
  ]);
});

test('rejects a malformed explicit path as a whole and falls back to legacy activity', () => {
  for (const activityPath of [
    [{ id: 'Bad-ID', label: 'coding' }],
    [{ id: 'coding', label: '   ' }],
    [
      { id: 'coding', label: 'coding' },
      { id: 'coding', label: 'duplicate' },
    ],
    'not-an-array',
  ]) {
    const parsed = gaugeModule.parseHeaderSnapshot({
      protocol: 1,
      work: {
        lifecycle: 'working',
        titles: ['Implement global flow'],
        color: 'accent',
        activity: { kind: 'implementation' },
        activityPath,
      },
    });
    assert.equal(parsed?.work?.activityPath, undefined);
    assert.deepEqual(parsed?.work?.activity, { kind: 'implementation' });
  }
});

test('strips ANSI and control characters from activity labels', () => {
  const parsed = gaugeModule.parseHeaderSnapshot({
    protocol: 1,
    work: {
      lifecycle: 'assuring',
      titles: [],
      color: 'accent',
      activityPath: [
        {
          id: 'checking-quality',
          label: '\u001b[31mchecking\nquality\u001b[0m',
          compact: '\u001b]0;unsafe title\u0007quality\tcheck',
        },
      ],
    },
  });

  assert.deepEqual(parsed?.work?.activityPath, [
    {
      id: 'checking-quality',
      label: 'checking quality',
      compact: 'quality check',
    },
  ]);
});

test('enforces exact activity-path depth and label bounds', () => {
  const overDepth = gaugeModule.parseHeaderSnapshot({
    protocol: 1,
    work: {
      lifecycle: 'working',
      titles: ['Implement global flow'],
      color: 'accent',
      activityPath: Array.from({ length: 7 }, (_, index) => ({
        id: `segment-${index}`,
        label: `segment ${index}`,
      })),
    },
  });
  assert.equal(overDepth?.work?.activityPath, undefined);

  const bounded = gaugeModule.parseHeaderSnapshot({
    protocol: 1,
    work: {
      lifecycle: 'working',
      titles: [],
      color: 'accent',
      activityPath: [
        {
          id: 'coding',
          label: 'L'.repeat(80),
          compact: 'C'.repeat(40),
        },
      ],
    },
  });
  assert.equal(
    Array.from(bounded?.work?.activityPath?.[0]?.label ?? '').length,
    gaugeModule.MAX_ACTIVITY_SEGMENT_LABEL_LENGTH,
  );
  assert.equal(
    Array.from(bounded?.work?.activityPath?.[0]?.compact ?? '').length,
    gaugeModule.MAX_ACTIVITY_SEGMENT_COMPACT_LENGTH,
  );
});

test('accepts path-only work and lets a valid explicit empty path suppress legacy activity', () => {
  const pathOnly = gaugeModule.parseHeaderSnapshot({
    protocol: 1,
    work: {
      lifecycle: 'answering',
      titles: [],
      color: 'accent',
      activityPath: [{ id: 'preparing-answer', label: 'preparing answer' }],
    },
  });
  assert.equal(pathOnly?.work?.titles.length, 0);
  assert.equal(pathOnly?.work?.activityPath?.[0]?.id, 'preparing-answer');

  const explicitEmpty = gaugeModule.parseHeaderSnapshot({
    protocol: 1,
    work: {
      lifecycle: 'working',
      titles: ['Implement global flow'],
      color: 'accent',
      activity: { kind: 'implementation' },
      activityPath: [],
    },
  });
  assert.deepEqual(explicitEmpty?.work?.activityPath, []);
  assert.deepEqual(explicitEmpty?.work?.activity, { kind: 'implementation' });
});

test('keeps the full home-relative path and puts the Devbox marker before the PWD folder icon', () => {
  assert.equal(formatFooterPath('/home/aemonge', '/home/aemonge'), '~');
  assert.equal(
    formatFooterPath('/home/aemonge/galactica/.pi/agent', '/home/aemonge'),
    '~/galactica/.pi/agent',
  );
  assert.equal(
    formatFooterPath('/very/long/path/here', '/home/aemonge'),
    '/very/long/path/here',
  );
  assert.equal(formatFooterPath('/srv/project', '/home/aemonge'), '/srv/project');

  const devboxLocation = gaugeModule
    .buildAgentFooterWidgets({
      cwd: '~/galactica',
      devbox: true,
      branch: '',
      git: { staged: 0, modified: 0, untracked: 0, conflicts: 0 },
      model: 'Opus',
      contextPercent: 42,
    })
    .find(({ widget }) => widget.id === 'galactica.location')?.widget;
  assert.ok(devboxLocation?.icon);
  assert.equal(devboxLocation.icon.glyphs.nerd, '[󰆧] ');
  assert.equal(devboxLocation.content.text, '~/galactica');

  const extensionSource = readFileSync(new URL('../index.ts', import.meta.url), 'utf8');
  assert.match(extensionSource, /cwd: formatFooterPath\(/u);
  assert.match(extensionSource, /branch: formatFooterBranch\(branch\)/u);
});

test('normalizes and compacts a Git branch for display after PWD', () => {
  const parseGitBranch = (
    gaugeModule as unknown as {
      parseGitBranch?: (stdout: string) => string;
    }
  ).parseGitBranch;

  assert.equal(typeof parseGitBranch, 'function');
  assert.equal(parseGitBranch?.('main\n'), 'main');
  assert.equal(parseGitBranch?.('HEAD\n'), '');
  assert.equal(parseGitBranch?.('\n'), '');
  assert.equal(formatFooterBranch('main'), 'main');
  assert.equal(formatFooterBranch('feat/new-ui'), 'f/new-ui');
  assert.equal(
    formatFooterBranch('feat/persist-versioned-prompts-in-duckdb'),
    'f/persist-versioned-prompts...',
  );
});

test('counts Git status entries without exposing long paths', () => {
  const parseGitStatus = (
    gaugeModule as unknown as {
      parseGitStatus?: (stdout: string) => {
        staged: number;
        modified: number;
        untracked: number;
      };
    }
  ).parseGitStatus;

  assert.equal(typeof parseGitStatus, 'function');
  assert.deepEqual(
    parseGitStatus?.(
      ' M src/app.ts\nA  notes/staged.md\nAM src/both.ts\n?? scratch.txt\n',
    ),
    { staged: 2, modified: 2, untracked: 1, conflicts: 0 },
  );
});

test('keeps approval state in the narrative header instead of duplicating it on the border', () => {
  const snapshot = gaugeModule.buildPromptStatusSnapshot(
    {
      work: {
        lifecycle: 'awaiting validation',
        titles: ['Refine footer'],
        color: 'warning',
      },
      diagnostics: null,
      backgroundActivity: false,
      approvalRequired: true,
      blocked: false,
      counters: { agents: { active: 0, total: 0 } },
      progress: [],
    },
    'main',
    { staged: 0, modified: 0, untracked: 0, conflicts: 0 },
  );

  assert.deepEqual(snapshot.signals, []);
});

test('accepts bounded diagnostic header events', () => {
  const parseDiagnosticsHeader = (
    gaugeModule as unknown as {
      parseDiagnosticsHeader?: (raw: unknown) => { text: string; color: string } | null;
    }
  ).parseDiagnosticsHeader;

  assert.equal(typeof parseDiagnosticsHeader, 'function');
  assert.deepEqual(
    parseDiagnosticsHeader?.({
      protocol: 1,
      diagnostics: { text: 'clean  ✓ tests', color: 'success', state: 'pass' },
    }),
    { text: 'clean ✓ tests', color: 'success', state: 'pass' },
  );
  assert.equal(parseDiagnosticsHeader?.({ protocol: 2 }), null);
});

test('renders a seven-cell gauge with one decimal place', () => {
  const gauge = buildContextGauge(26.2, 80);
  assert.equal(gauge.filled, '▰▰');
  assert.equal(gauge.empty, '▱▱▱▱▱');
  assert.equal(gauge.percentText, '26.2%');
});

test('shrinks the gauge before dropping the percentage', () => {
  const gauge = buildContextGauge(50, 9);
  assert.equal(gauge.filled.length + gauge.empty.length, 3);
  assert.equal(gauge.percentText, '50%');
});

test('derives usage from tokens when percent is unavailable', () => {
  assert.equal(normalizeContextPercent(null, 25_000, 100_000), 25);
});

test('clamps malformed and out-of-range usage', () => {
  assert.equal(normalizeContextPercent(120, null, null), 100);
  assert.equal(normalizeContextPercent(-3, null, null), 0);
  assert.equal(normalizeContextPercent('unknown', null, null), 0);
});

test('separates runtime metadata on wide headers and drops it when crowded', () => {
  const headerColumnGap = (
    gaugeModule as unknown as {
      headerColumnGap?: (
        width: number,
        leftWidth: number,
        rightWidth: number,
      ) => number | null;
    }
  ).headerColumnGap;

  assert.equal(typeof headerColumnGap, 'function');
  assert.equal(headerColumnGap?.(120, 15, 24), 81);
  assert.equal(headerColumnGap?.(38, 15, 24), null);
});

test('centers the working directory between context and runtime metadata', () => {
  const headerColumnLayout = (
    gaugeModule as unknown as {
      headerColumnLayout?: (
        width: number,
        leftWidth: number,
        centerWidth: number,
        rightWidth: number,
      ) => { beforeCenter: number; beforeRight: number } | null;
    }
  ).headerColumnLayout;

  assert.equal(typeof headerColumnLayout, 'function');
  assert.deepEqual(headerColumnLayout?.(120, 15, 18, 24), {
    beforeCenter: 36,
    beforeRight: 27,
  });
  assert.equal(headerColumnLayout?.(50, 15, 18, 24), null);
});
