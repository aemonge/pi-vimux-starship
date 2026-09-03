import assert from 'node:assert/strict';
import test from 'node:test';

import { visibleWidth } from '@earendil-works/pi-tui';

import { parseHeaderSnapshot, type HeaderWork } from '../src/gauge.ts';
import {
  ACTIVE_STATUS_ICON,
  activityLabels,
  effectiveActivityPathLabels,
  FOCUS_ICON,
  focusSectionColor,
  layoutLifecycleTitle,
  LIFECYCLE_CELL_BUDGET,
  lifecycleDisplayLabel,
  lifecycleSectionColor,
  MAJOR_SEPARATOR,
  MINOR_SEPARATOR,
  PASSIVE_STATUS_ICON,
  renderLifecycleTitleSections,
  TITLE_SECTION_COLORS,
} from '../src/title.ts';

const focus = 'Repair adapter compatibility';

function activityWork(
  kind: 'skill-proposal' | 'regression' = 'skill-proposal',
): HeaderWork {
  return {
    lifecycle: 'working',
    titles: [focus],
    color: 'accent',
    activity: kind === 'regression' ? { kind, current: 4, total: 4 } : { kind },
  };
}

function pathWork(titles: string[] = []): HeaderWork {
  return {
    lifecycle: 'assuring',
    titles,
    color: 'accent',
    activityPath: [
      {
        id: 'checking-quality',
        label: 'checking quality',
        compact: 'quality',
      },
      {
        id: 'cross-checking-evidence',
        label: 'cross-checking evidence',
        compact: 'evidence',
      },
      {
        id: 'assuring-tests',
        label: 'assuring tests',
        compact: 'tests',
      },
    ],
  };
}

function plain(layout: ReturnType<typeof layoutLifecycleTitle>): string {
  return `${layout.anchor}${layout.lifecycle}${layout.activity}${layout.focusBoundary}${layout.focus}${layout.focusDetail}`;
}

test('keeps lifecycle blue before the boundary and focus green after it', () => {
  assert.equal(MAJOR_SEPARATOR, '⟩');
  assert.equal(MINOR_SEPARATOR, '›');
  assert.equal(FOCUS_ICON, MAJOR_SEPARATOR);
  assert.deepEqual(TITLE_SECTION_COLORS, {
    anchor: 'accent',
    lifecycle: 'accent',
    activity: 'accent',
    focusBoundary: 'thinkingHigh',
    focus: 'success',
    focusDetail: 'success',
    emptyFocus: 'dim',
  });
  assert.equal(lifecycleSectionColor('working'), 'accent');
  assert.equal(lifecycleSectionColor('waiting'), 'accent');
  assert.equal(lifecycleSectionColor('blocked'), 'accent');
  assert.equal(lifecycleSectionColor('aborted'), 'accent');
});

test('renders bold/plain blue then bold/plain green across the boundary', () => {
  const work = activityWork();
  work.titles = ['Consolidate', 'Update'];
  const layout = layoutLifecycleTitle(work, 120);
  const rendered = renderLifecycleTitleSections(layout, work.lifecycle, false, {
    fg: (color, text) => `[${color}:${text}]`,
    bold: (text) => `<b>${text}</b>`,
  });

  assert.equal(
    rendered,
    `[accent:<b>${ACTIVE_STATUS_ICON} </b>]` +
      '[accent:<b>work</b>]' +
      `[accent: ${MINOR_SEPARATOR} preparing skill proposal]` +
      `[thinkingHigh: ${MAJOR_SEPARATOR} ]` +
      '[success:<b>Consolidate</b>]' +
      '[success: › Update]',
  );
});

test('dims only explicit empty focus fallbacks', () => {
  assert.equal(focusSectionColor('no focus'), 'dim');
  assert.equal(focusSectionColor('no OpenSpec'), 'dim');
  assert.equal(focusSectionColor('no focused task'), 'dim');
  assert.equal(focusSectionColor('Implement selected change'), 'success');

  const work: HeaderWork = {
    lifecycle: 'listening',
    titles: ['no focused task'],
    color: 'accent',
  };
  const rendered = renderLifecycleTitleSections(
    layoutLifecycleTitle(work, 120),
    work.lifecycle,
    true,
    {
      fg: (color, text) => `[${color}:${text}]`,
      bold: (text) => `<b>${text}</b>`,
    },
  );
  assert.match(rendered, /\[dim:<b>no focused task<\/b>\]\[dim:\]$/u);
});

test('labels direct inspection and mutation without exposing tool details', () => {
  assert.deepEqual(activityLabels({ kind: 'understanding' }), {
    full: 'interpreting current request',
    compact: 'interpreting',
  });
  assert.deepEqual(activityLabels({ kind: 'inspection' }), {
    full: 'inspecting project context',
    compact: 'inspection',
  });
  assert.deepEqual(activityLabels({ kind: 'synthesis' }), {
    full: 'finalizing current request',
    compact: 'finalizing',
  });
  assert.deepEqual(activityLabels({ kind: 'mutation' }), {
    full: 'updating selected files',
    compact: 'update',
  });
  assert.deepEqual(activityLabels({ kind: 'change-review' }), {
    full: 'reviewing applied changes',
    compact: 'reviewing changes',
  });
  assert.deepEqual(activityLabels({ kind: 'result-review' }), {
    full: 'reviewing check results',
    compact: 'reviewing results',
  });
  assert.deepEqual(activityLabels({ kind: 'awaiting-validation' }), {
    full: 'Human validation',
    compact: 'validation',
  });
  assert.deepEqual(activityLabels({ kind: 'operation-aborted' }), {
    full: 'operation aborted',
    compact: 'aborted',
  });
});

test('uses short readable lifecycle verbs instead of icon-only states', () => {
  assert.deepEqual(
    [
      'understanding',
      'working',
      'waiting',
      'assuring',
      'learning',
      'answering',
      'blocked',
      'listening',
      'aborted',
    ].map(lifecycleDisplayLabel),
    [
      'understand',
      'work',
      'wait',
      'assure',
      'learn',
      'answer',
      'blocked',
      'ready',
      'stopped',
    ],
  );
});

test('normalizes legacy activity to one effective structured segment', () => {
  assert.deepEqual(effectiveActivityPathLabels(activityWork()), [
    { full: 'preparing skill proposal', compact: 'skill proposal' },
  ]);
});

test('explicit activity path takes precedence over legacy activity', () => {
  const work = pathWork(['Implement global flow']);
  work.lifecycle = 'working';
  work.activity = { kind: 'implementation' };
  work.activityPath = [{ id: 'coding', label: 'coding' }];

  const output = plain(layoutLifecycleTitle(work, 120));
  assert.equal(
    output,
    `${ACTIVE_STATUS_ICON} work ${MINOR_SEPARATOR} coding ${MAJOR_SEPARATOR} Implement global flow`,
  );
  assert.doesNotMatch(output, /implementing selected change/u);
});

test('renders a full nested activity path without narrative focus', () => {
  const work: HeaderWork = {
    lifecycle: 'understanding',
    titles: [],
    color: 'accent',
    activityPath: [
      { id: 'investigating', label: 'investigating' },
      { id: 'reading-docs', label: 'reading docs' },
    ],
  };
  assert.equal(
    plain(layoutLifecycleTitle(work, 120)),
    `${ACTIVE_STATUS_ICON} understand ${MINOR_SEPARATOR} investigating ${MINOR_SEPARATOR} reading docs`,
  );
});

test('renders nested activity ancestry before the existing focus boundary', () => {
  const work: HeaderWork = {
    lifecycle: 'assuring',
    titles: ['Implement global flow'],
    color: 'accent',
    activityPath: [
      { id: 'checking-quality', label: 'checking quality' },
      { id: 'assuring-tests', label: 'assuring tests' },
    ],
  };
  assert.equal(
    plain(layoutLifecycleTitle(work, 120)),
    `${ACTIVE_STATUS_ICON} assure ${MINOR_SEPARATOR} checking quality ${MINOR_SEPARATOR} assuring tests ${MAJOR_SEPARATOR} Implement global flow`,
  );
});

test('uses compact path labels at medium widths', () => {
  const work = pathWork(['Implement global flow']);
  const expected = `${ACTIVE_STATUS_ICON} assure ${MINOR_SEPARATOR} quality ${MINOR_SEPARATOR} evidence ${MINOR_SEPARATOR} tests ${MAJOR_SEPARATOR} Implement global flow`;
  assert.equal(plain(layoutLifecycleTitle(work, visibleWidth(expected))), expected);
});

test('collapses intermediate activity before removing the deepest segment', () => {
  const work = pathWork(['Implement global flow']);
  const expected = `${ACTIVE_STATUS_ICON} assure ${MINOR_SEPARATOR} … ${MINOR_SEPARATOR} assuring tests`;
  assert.equal(plain(layoutLifecycleTitle(work, visibleWidth(expected))), expected);
});

test('preserves compact lifecycle plus the deepest active segment when narrow', () => {
  const work = pathWork(['Implement global flow']);
  const expected = `${ACTIVE_STATUS_ICON} assure ${MINOR_SEPARATOR} assuring tests`;
  assert.equal(plain(layoutLifecycleTitle(work, visibleWidth(expected))), expected);
});

test('an explicit empty path contributes no separators or placeholder whitespace', () => {
  const work = activityWork();
  work.activityPath = [];
  const output = plain(layoutLifecycleTitle(work, 120));
  assert.equal(
    output,
    `${ACTIVE_STATUS_ICON} work ${MAJOR_SEPARATOR} Repair adapter compatibility`,
  );
  assert.doesNotMatch(output, /  |›/u);
});

test('switches the leading icon from runtime busy state, not focus wording', () => {
  const work = activityWork();
  work.lifecycle = 'understanding';

  assert.equal(layoutLifecycleTitle(work, 120, true).anchor, `${ACTIVE_STATUS_ICON} `);
  assert.equal(
    layoutLifecycleTitle(work, 120, false).anchor,
    `${PASSIVE_STATUS_ICON} `,
  );
  work.lifecycle = 'waiting';
  assert.equal(layoutLifecycleTitle(work, 120, true).anchor, `${PASSIVE_STATUS_ICON} `);
});

test('renders lifecycle, controlled activity, and authoritative focus icon when wide', () => {
  const output = plain(layoutLifecycleTitle(activityWork(), 120));
  assert.equal(
    output,
    `${ACTIVE_STATUS_ICON} work ${MINOR_SEPARATOR} preparing skill proposal ${MAJOR_SEPARATOR} Repair adapter compatibility`,
  );
  assert.ok(visibleWidth(output) <= 120);
});

test('colors additional focus hierarchy separately without changing its text', () => {
  const work = activityWork();
  work.titles = ['Consolidate', 'Update'];
  const wide = layoutLifecycleTitle(work, 120);
  assert.equal(wide.activity, ` ${MINOR_SEPARATOR} preparing skill proposal`);
  assert.equal(wide.focusBoundary, ` ${MAJOR_SEPARATOR} `);
  assert.equal(wide.focus, 'Consolidate');
  assert.equal(wide.focusDetail, ' › Update');
  assert.equal(
    plain(wide),
    `${ACTIVE_STATUS_ICON} work ${MINOR_SEPARATOR} preparing skill proposal ${MAJOR_SEPARATOR} Consolidate ${MINOR_SEPARATOR} Update`,
  );

  const narrowed = layoutLifecycleTitle(work, 45);
  assert.equal(narrowed.focusBoundary, ` ${MAJOR_SEPARATOR} `);
  assert.equal(narrowed.focus, 'Update');
  assert.equal(narrowed.focusDetail, '');
});

test('truncates arbitrary-length focus before compacting controlled activity', () => {
  const output = plain(layoutLifecycleTitle(activityWork(), 55));
  assert.equal(
    output,
    `${ACTIVE_STATUS_ICON} work ${MINOR_SEPARATOR} preparing skill proposal ${MAJOR_SEPARATOR} Repair adapter com…`,
  );
  assert.equal(visibleWidth(output), 55);
});

test('removes focus while retaining full activity at narrow width', () => {
  const output = plain(layoutLifecycleTitle(activityWork(), 36));
  assert.equal(
    output,
    `${ACTIVE_STATUS_ICON} work ${MINOR_SEPARATOR} preparing skill proposal`,
  );
  assert.ok(visibleWidth(output) <= 36);
});

test('compacts activity before lifecycle as emergency fallbacks', () => {
  assert.equal(
    plain(layoutLifecycleTitle(activityWork(), 26)),
    `${ACTIVE_STATUS_ICON} work ${MINOR_SEPARATOR} skill proposal`,
  );
  assert.equal(
    plain(layoutLifecycleTitle(activityWork(), 23)),
    `${ACTIVE_STATUS_ICON} work ${MINOR_SEPARATOR} skill proposal`,
  );
});

test('uses terminal display cells for Unicode focus and the installed Nerd Font icon', () => {
  const work = activityWork('regression');
  work.titles = ['修复 adapter compatibility'];
  const output = plain(layoutLifecycleTitle(work, 48));

  assert.ok(output.includes(`${FOCUS_ICON} `));
  assert.ok(output.includes('running regression 4/4'));
  assert.equal(visibleWidth(output), 48);
  assert.match(output, /…$/u);
});

test('fits Unicode nested activity with terminal display cells', () => {
  const work: HeaderWork = {
    lifecycle: 'working',
    titles: ['Implement global flow'],
    color: 'accent',
    activityPath: [
      { id: 'inspecting-code', label: '检查代码', compact: '检查' },
      { id: 'fixing-code', label: '修复代码', compact: '修复' },
    ],
  };
  const width = 34;
  const output = plain(layoutLifecycleTitle(work, width));
  assert.ok(output.startsWith(`${ACTIVE_STATUS_ICON} `));
  assert.ok(output.includes('修复'));
  assert.ok(visibleWidth(output) <= width);
});

test('omits the absent activity segment without leaving separator whitespace', () => {
  const work: HeaderWork = {
    lifecycle: 'working',
    titles: [focus],
    color: 'accent',
  };
  assert.equal(
    plain(layoutLifecycleTitle(work, 120)),
    `${ACTIVE_STATUS_ICON} work ${FOCUS_ICON} Repair adapter compatibility`,
  );
  assert.doesNotMatch(plain(layoutLifecycleTitle(work, 120)), /  /u);
});

test('preserves the accepted idle result without inventing activity', () => {
  const idle: HeaderWork = {
    lifecycle: 'listening',
    titles: ['no focused task'],
    color: 'accent',
  };
  const layout = layoutLifecycleTitle(idle, 120);
  assert.equal(
    plain(layout),
    `${PASSIVE_STATUS_ICON} ready ${FOCUS_ICON} no focused task`,
  );
  assert.equal('activity' in idle, false);
});

test('bounds full lifecycle labels and clips only as the final fallback', () => {
  const work = activityWork();
  work.lifecycle = 'an unexpectedly verbose internal lifecycle state';
  const layout = layoutLifecycleTitle(work, 120);
  assert.ok(
    visibleWidth(`${layout.anchor}${layout.lifecycle}`) <= LIFECYCLE_CELL_BUDGET,
  );
  assert.match(layout.lifecycle, /…$/u);
  assert.ok(visibleWidth(plain(layoutLifecycleTitle(work, 8))) <= 8);
});

test('accepts only structured allowlisted activity from the optional consumer contract', () => {
  const accepted = parseHeaderSnapshot({
    protocol: 1,
    work: {
      lifecycle: 'active',
      titles: ['Repair adapter compatibility'],
      color: 'accent',
      activity: { kind: 'regression', current: 4, total: 4 },
    },
  });
  assert.deepEqual(accepted?.work?.activity, {
    kind: 'regression',
    current: 4,
    total: 4,
  });

  const rejected = parseHeaderSnapshot({
    protocol: 1,
    work: {
      lifecycle: 'active',
      titles: ['Repair adapter compatibility'],
      color: 'accent',
      activity: { kind: 'raw', text: '/secret/path and generated prose' },
    },
  });
  assert.equal(rejected?.work?.activity, undefined);
});
