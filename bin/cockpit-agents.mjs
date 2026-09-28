#!/usr/bin/env node
// Mocked render of the pi-vimux-starship command center.
// Static fixtures only: colors, spacing, and wording are up for opinion.
// Palette borrows ramona-gruvbox-light-strong hex values directly.
// Snapshot wiring, -w, and --json arrive in the real implementation.
// Layout: STATE → AGENT → TASK → TIME, dynamic full terminal width.

const colorEnabled = process.stdout.isTTY && !process.env.NO_COLOR;

const THEME = {
  accent: '#076678', // blue — attention
  titlePurple: '#5c5ca8', // violet — title
  cyan: '#427b58', // project names
  green: '#689d6a', // working
  yellow: '#b57614', // secondary hints
  text: '#5c3a2e', // subject lines
  muted: '#574d47', // ids, time, counts
  dim: '#796d63', // parked, gone
};

const paint = (hex) => (text) =>
  colorEnabled
    ? `\u001b[38;2;${parseInt(hex.slice(1, 3), 16)};${parseInt(
        hex.slice(3, 5),
        16,
      )};${parseInt(hex.slice(5, 7), 16)}m${text}\u001b[39m`
    : text;

const accent = paint(THEME.accent);
const titlePurple = paint(THEME.titlePurple);
const cyan = paint(THEME.cyan);
const green = paint(THEME.green);
const yellow = paint(THEME.yellow);
const text = paint(THEME.text);
const muted = paint(THEME.muted);
const dim = paint(THEME.dim);

const bold = (chunk) => (colorEnabled ? `\u001b[1m${chunk}\u001b[22m` : chunk);

const pad = (value, width) =>
  value.length >= width ? value : value + ' '.repeat(width - value.length);

const padStart = (value, width) =>
  value.length >= width ? value : ' '.repeat(width - value.length) + value;

const ICON = '\u{f01a7}'; // deck PWD glyph 󰆧 (matches header gauge)
const TITLE = 'pi-vimux-starship command center';

const agents = [
  {
    marker: '!',
    markerPaint: accent,
    id: '003',
    project: 'pi-vimux-starship',
    task: 'validation',
    taskPaint: (chunk) => bold(accent(chunk)),
    sub: 'Pi agent telemetry CLI for vimux-starship notifications',
    time: '3:02:11',
  },
  {
    marker: '●',
    markerPaint: green,
    id: '001',
    project: 'galactica',
    task: 'Consolidate imported Pi cockpit',
    time: '0:12:34',
  },
  {
    marker: '●',
    markerPaint: green,
    id: '002',
    project: 'pi-vimux-starship',
    task: 'Route Insert through Neovim',
    time: '0:41:07',
  },
  {
    marker: '◌',
    markerPaint: dim,
    id: '004',
    project: 'articles',
    task: 'QMD taxonomy cleanup',
    time: '1:40:00',
  },
  {
    marker: '×',
    markerPaint: dim,
    id: '005',
    project: 'dotfiles',
    task: 'Shell hygiene pass',
    time: '0:22:45',
  },
];

const columns = process.stdout.columns ?? Number(process.env.COLUMNS ?? 80);
const PROJECT_WIDTH = Math.max(20, ...agents.map((agent) => agent.project.length)) + 2;
const TIME_WIDTH = 8;
const ROW_PREFIX_WIDTH = 2 + 3 + 2 + PROJECT_WIDTH + 2;

const renderRow = (agent) => {
  const taskWidth = Math.max(10, columns - ROW_PREFIX_WIDTH - TIME_WIDTH - 2);
  const taskPaint = agent.taskPaint ?? text;
  const main =
    `${agent.markerPaint(agent.marker)} ` +
    `${muted(pad(agent.id, 3))}  ` +
    `${cyan(pad(agent.project, PROJECT_WIDTH))}  ` +
    `${taskPaint(pad(agent.task, taskWidth))}` +
    `  ${muted(padStart(agent.time, TIME_WIDTH))}`;
  if (!agent.sub) return main;
  const indent = ' '.repeat(ROW_PREFIX_WIDTH);
  return `${main}\n${indent}${text(agent.sub)}`;
};

const live = agents.filter((agent) => agent.marker !== '×').length;
const attention = agents.filter((agent) => agent.marker === '!').length;

const titleLeft = `${ICON} ${TITLE}`;
const headerLeft = bold(titlePurple(titleLeft));
const headerRightPlain = `${live} agents · ${attention} attention`;
const headerRight = muted(`${live} agents · `) + accent(`${attention} attention`);
const headerGap = ' '.repeat(
  Math.max(1, columns - [...titleLeft].length - [...headerRightPlain].length),
);

const blocks = [];
for (const agent of agents) {
  blocks.push(renderRow(agent));
  if (agent.sub) blocks.push('');
}

process.stdout.write(
  `${headerLeft}${headerGap}${headerRight}\n\n${blocks.join('\n')}\n`,
);
