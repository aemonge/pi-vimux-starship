import assert from 'node:assert/strict';
import test from 'node:test';

import { ModalEditor } from '../index.js';

function makeEditor(hostSynced = false, externalEditorOnly = false) {
  const tui = { requestRender() {} };
  const theme = { borderColor: (text: string) => text, selectList: {} };
  const keybindings = {
    matches: (data: string, action: string) =>
      data === '<external-editor>' && action === 'app.editor.external',
  };
  const modeColors = {
    insert: (text: string) => `[insert]${text}`,
    normal: (text: string) => `[normal]${text}`,
    visual: (text: string) => `[visual]${text}`,
    ex: (text: string) => `[ex]${text}`,
  };

  return new ModalEditor(
    tui as never,
    theme as never,
    keybindings as never,
    {
      borderColorizers: modeColors,
      borderSync: hostSynced
        ? { insert: 'host', normal: 'host', visual: 'host', ex: 'host' }
        : undefined,
      labelSync: hostSynced
        ? { insert: 'mode', normal: 'mode', visual: 'mode', ex: 'mode' }
        : undefined,
      externalEditorOnly,
    } as never,
  );
}

test('intercepts Pi external-editor input before the builtin handler', () => {
  const editor = makeEditor();
  let calls = 0;
  editor.setExternalEditorFn(() => {
    calls += 1;
  });

  editor.handleInput('<external-editor>');
  assert.equal(calls, 1);
});

test('external-editor-only defers every supported Insert transition until its command completes', () => {
  const cases = [
    { name: 'i', keys: ['0', 'i'], text: 'alpha beta', cursor: 0 },
    { name: 'a', keys: ['0', 'a'], text: 'alpha beta', cursor: 1 },
    { name: 'I', keys: ['I'], text: '  alpha beta', cursor: 2 },
    { name: 'A', keys: ['0', 'A'], text: 'alpha beta', cursor: 10 },
    { name: 'o', keys: ['o'], text: 'alpha beta\n', cursor: 0 },
    { name: 'O', keys: ['O'], text: '\nalpha beta', cursor: 0 },
    { name: 's', keys: ['0', 's'], text: 'lpha beta', cursor: 0 },
    { name: 'S', keys: ['S'], text: '', cursor: 0 },
    { name: 'C', keys: ['0', 'C'], text: '', cursor: 0 },
    { name: 'cc', keys: ['c', 'c'], text: '', cursor: 0 },
    { name: 'cw', keys: ['0', 'c', 'w'], text: 'beta', cursor: 0 },
    { name: 'ciw', keys: ['0', 'c', 'i', 'w'], text: ' beta', cursor: 0 },
    { name: 'visual c', keys: ['0', 'v', 'l', 'c'], text: 'pha beta', cursor: 0 },
    { name: 'visual-line C', keys: ['V', 'C'], text: '', cursor: 0 },
  ] as const;

  for (const fixture of cases) {
    const editor = makeEditor(false, true);
    editor.setText(fixture.name === 'I' ? '  alpha beta' : 'alpha beta');
    const launches: Array<{
      text: string;
      cursor: number;
      mode: string;
    }> = [];
    editor.setExternalEditorFn(() => {
      launches.push({
        text: editor.getText(),
        cursor: editor.getCursor().col,
        mode: editor.getMode(),
      });
    });

    for (const key of fixture.keys) editor.handleInput(key);

    assert.deepEqual(
      launches,
      [{ text: fixture.text, cursor: fixture.cursor, mode: 'normal' }],
      fixture.name,
    );
  }
});

test('external-editor-only keeps Ctrl-E direct and returned text does not relaunch', () => {
  const editor = makeEditor(false, true);
  let launches = 0;
  editor.setExternalEditorFn(() => {
    launches += 1;
    editor.setText('returned draft');
  });

  editor.handleInput('<external-editor>');

  assert.equal(launches, 1);
  assert.equal(editor.getText(), 'returned draft');
  assert.equal(editor.getMode(), 'normal');
});

test('external-editor-only submits the hidden returned draft only on Enter', () => {
  const editor = makeEditor(false, true);
  const submissions: string[] = [];
  editor.onSubmit = (text) => submissions.push(text);
  editor.setText('returned draft');

  assert.deepEqual(submissions, []);
  editor.handleInput('\r');

  assert.deepEqual(submissions, ['returned draft']);
  assert.equal(editor.getMode(), 'normal');
});

test('temporarily overrides the modal prompt border color', () => {
  const editor = makeEditor(true);
  const muted = (text: string) => `[muted]${text}`;

  editor.setBorderOverride(muted);
  assert.equal(editor.borderColor('─'), '[muted]─');

  editor.setBorderOverride(null);
  assert.equal(editor.borderColor('─'), '─');
});
