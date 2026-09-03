import assert from 'node:assert/strict';
import test from 'node:test';

import { ModalEditor } from '../index.js';

function makeEditor(hostSynced = false) {
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
    },
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

test('temporarily overrides the modal prompt border color', () => {
  const editor = makeEditor(true);
  const muted = (text: string) => `[muted]${text}`;

  editor.setBorderOverride(muted);
  assert.equal(editor.borderColor('─'), '[muted]─');

  editor.setBorderOverride(null);
  assert.equal(editor.borderColor('─'), '─');
});
