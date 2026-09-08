import assert from 'node:assert/strict';
import { chmod, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  PromptExternalEditor,
  type PromptEditorSurface,
} from '../prompt-external-editor.js';

async function fixture(scriptBody: string) {
  const root = await mkdtemp(join(tmpdir(), 'pi-prompt-editor-test-'));
  const agentDir = join(root, 'agent');
  const cwd = join(root, 'project');
  await mkdir(agentDir, { recursive: true });
  await mkdir(cwd, { recursive: true });

  const command = join(root, 'editor');
  await writeFile(command, `#!/bin/sh\nset -eu\n${scriptBody}\n`, 'utf8');
  await chmod(command, 0o700);
  await writeFile(
    join(agentDir, 'settings.json'),
    `${JSON.stringify({ externalEditor: command })}\n`,
    'utf8',
  );

  return { root, agentDir, cwd };
}

function surface(initial = 'original') {
  let text = initial;
  const borders: Array<((value: string) => string) | null> = [];
  const editor: PromptEditorSurface = {
    getExpandedText: () => text,
    setText: (value) => {
      text = value;
    },
    setBorderOverride: (value) => {
      borders.push(value);
    },
  };
  return { editor, borders, getText: () => text };
}

test('round-trips the prompt without Pi external-editor output', async () => {
  const { root, agentDir, cwd } = await fixture('printf \'edited\\n\' > "$1"');
  const prompt = surface();
  const errors: string[] = [];
  const muted = (value: string) => `[muted]${value}`;

  try {
    const controller = new PromptExternalEditor({
      agentDir,
      cwd,
      editor: prompt.editor,
      mutedBorder: muted,
      notifyError: (message) => errors.push(message),
    });
    const result = await controller.open();

    assert.equal(result, 'saved');
    assert.equal(prompt.getText(), 'edited');
    assert.deepEqual(prompt.borders, [muted, null]);
    assert.deepEqual(errors, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('keeps the original prompt when Neovim closes without writing', async () => {
  const { root, agentDir, cwd } = await fixture(':');
  const prompt = surface('unchanged');

  try {
    const controller = new PromptExternalEditor({
      agentDir,
      cwd,
      editor: prompt.editor,
      mutedBorder: (value) => value,
      notifyError: () => assert.fail('cancel should not report an error'),
    });
    const result = await controller.open();
    assert.equal(result, 'unchanged');
    assert.equal(prompt.getText(), 'unchanged');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('recognizes an explicit same-content write as saved', async () => {
  const { root, agentDir, cwd } = await fixture('printf original > "$1"');
  const prompt = surface('original');

  try {
    const controller = new PromptExternalEditor({
      agentDir,
      cwd,
      editor: prompt.editor,
      mutedBorder: (value) => value,
      notifyError: () => assert.fail('same-content write should not fail'),
    });
    const result = await controller.open();

    assert.equal(result, 'saved');
    assert.equal(prompt.getText(), 'original');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('reports a failed editor without treating it as saved', async () => {
  const { root, agentDir, cwd } = await fixture('exit 7');
  const prompt = surface('original');
  const errors: string[] = [];

  try {
    const controller = new PromptExternalEditor({
      agentDir,
      cwd,
      editor: prompt.editor,
      mutedBorder: (value) => value,
      notifyError: (message) => errors.push(message),
    });
    const result = await controller.open();

    assert.equal(result, 'failed');
    assert.equal(prompt.getText(), 'original');
    assert.deepEqual(errors, ['Neovim prompt editor: editor closed with exit 7']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
