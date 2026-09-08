import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  collectVimuxHealthEvidence,
  evaluateVimuxHealth,
  formatVimuxHealth,
  registerVimuxHealth,
  type VimuxHealthEvidence,
} from '../src/health.ts';

const readyEvidence: VimuxHealthEvidence = {
  packageVersion: '0.1.0',
  mode: 'tui',
  hasUI: true,
  neovimTerminal: true,
  externalEditor: 'ready',
  commandNames: [
    'fancy-footer',
    'galactica-status',
    'galactica-status-debug',
    'galactica-status-refresh',
    'openspec-focus',
    'vimux-health',
    'work',
  ],
  capabilities: {
    git: true,
    openspec: true,
    devbox: true,
    tmux: false,
  },
};

test('health report classifies required, recommended, and optional readiness', () => {
  const report = evaluateVimuxHealth(readyEvidence);

  assert.equal(report.severity, 'info');
  assert.deepEqual(
    report.checks.map(({ status, id }) => `${status}:${id}`),
    [
      'PASS:package',
      'PASS:surface',
      'PASS:composer',
      'PASS:topology',
      'INFO:git',
      'INFO:openspec',
      'INFO:devbox',
      'INFO:tmux',
    ],
  );
  assert.match(formatVimuxHealth(report), /^pi-vimux-starship health 0\.1\.0\n/u);
  assert.match(formatVimuxHealth(report), /INFO  tmux · absent \(optional\)/u);
});

test('health report warns only for actionable cockpit problems', () => {
  const report = evaluateVimuxHealth({
    ...readyEvidence,
    mode: 'rpc',
    hasUI: true,
    neovimTerminal: false,
    externalEditor: 'missing',
    commandNames: [...readyEvidence.commandNames, 'work:1'],
    capabilities: {
      git: false,
      openspec: false,
      devbox: false,
      tmux: false,
    },
  });

  assert.equal(report.severity, 'warning');
  assert.equal(report.checks.find(({ id }) => id === 'package')?.status, 'WARN');
  assert.equal(report.checks.find(({ id }) => id === 'surface')?.status, 'WARN');
  assert.equal(report.checks.find(({ id }) => id === 'composer')?.status, 'WARN');
  assert.equal(report.checks.find(({ id }) => id === 'topology')?.status, 'INFO');
  assert.equal(report.checks.find(({ id }) => id === 'git')?.status, 'INFO');
});

test('health formatting cannot disclose raw environment or editor values', () => {
  const privateEvidence = {
    ...readyEvidence,
    NVIM: '/run/user/1000/private-nvim.sock',
    externalEditorCommand: '/home/private/bin/bridge --token secret',
    settingsContent: '{"apiKey":"secret"}',
  } as VimuxHealthEvidence;
  const output = formatVimuxHealth(evaluateVimuxHealth(privateEvidence));

  assert.doesNotMatch(output, /private|token|secret|settingsContent|NVIM/u);
});

test('runtime health collection uses bounded local evidence without executing the editor', async () => {
  const root = await mkdtemp(join(tmpdir(), 'vimux-health-'));
  const agentDir = join(root, 'agent');
  const project = join(root, 'project');
  const bin = join(root, 'bin');
  const editor = join(bin, 'bridge');
  const previous = {
    agentDir: process.env.PI_CODING_AGENT_DIR,
    path: process.env.PATH,
    nvim: process.env.NVIM,
    tmux: process.env.TMUX,
    devbox: process.env.DEVBOX_PROJECT_ROOT,
  };

  try {
    await mkdir(agentDir, { recursive: true });
    await mkdir(join(project, '.git'), { recursive: true });
    await mkdir(join(project, 'openspec'), { recursive: true });
    await mkdir(bin, { recursive: true });
    await writeFile(
      join(agentDir, 'settings.json'),
      `${JSON.stringify({ externalEditor: 'bridge' })}\n`,
      'utf8',
    );
    await writeFile(editor, '#!/bin/sh\nexit 99\n', 'utf8');
    await chmod(editor, 0o700);
    process.env.PI_CODING_AGENT_DIR = agentDir;
    process.env.PATH = bin;
    process.env.NVIM = 'private-endpoint';
    process.env.TMUX = 'private-tmux';
    process.env.DEVBOX_PROJECT_ROOT = '/private/project';

    const evidence = await collectVimuxHealthEvidence(
      {
        getCommands: () => readyEvidence.commandNames.map((name) => ({ name })),
      } as never,
      { cwd: project, mode: 'tui', hasUI: true } as never,
    );

    assert.equal(evidence.externalEditor, 'ready');
    assert.equal(evidence.neovimTerminal, true);
    assert.deepEqual(evidence.capabilities, {
      git: true,
      openspec: true,
      devbox: true,
      tmux: true,
    });
  } finally {
    for (const [key, value] of Object.entries({
      PI_CODING_AGENT_DIR: previous.agentDir,
      PATH: previous.path,
      NVIM: previous.nvim,
      TMUX: previous.tmux,
      DEVBOX_PROJECT_ROOT: previous.devbox,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(root, { recursive: true, force: true });
  }
});

test('root health command collects at invocation and emits one bounded notification', async () => {
  let handler:
    | ((
        args: string,
        ctx: { ui: { notify(text: string, level: string): void } },
      ) => void)
    | undefined;
  const notifications: Array<{ text: string; level: string }> = [];
  const pi = {
    registerCommand(name: string, command: { handler: typeof handler }) {
      assert.equal(name, 'vimux-health');
      handler = command.handler;
    },
  };

  registerVimuxHealth(pi as never, async () => readyEvidence);
  assert.ok(handler);
  await handler('', {
    ui: {
      notify(text, level) {
        notifications.push({ text, level });
      },
    },
  });

  assert.equal(notifications.length, 1);
  assert.equal(notifications[0]?.level, 'info');
  assert.ok((notifications[0]?.text.length ?? 0) < 1_000);
});
