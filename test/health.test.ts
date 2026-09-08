import assert from 'node:assert/strict';
import test from 'node:test';

import {
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
