import assert from 'node:assert/strict';
import test from 'node:test';

import { ModalEditor } from '../index.js';

function makeEditor(editorFrameEnabled: boolean): ModalEditor {
  const tui = { requestRender() {}, terminal: { rows: 40 } };
  const theme = {
    borderColor: (text: string) => text,
    selectList: {},
  };
  const keybindings = { matches: () => false };
  return new ModalEditor(tui as never, theme as never, keybindings as never, {
    promptRailsEnabled: false,
    editorFrameEnabled,
  });
}

test('editor-only removes inherited frame rows and preserves prompt content', () => {
  const framed = makeEditor(true);
  const editorOnly = makeEditor(false);
  for (const editor of [framed, editorOnly]) {
    editor.setText('first prompt line\nsecond prompt line');
  }

  const framedLines = framed.render(48);
  const editorOnlyLines = editorOnly.render(48);

  assert.ok(framedLines.length >= 4);
  assert.deepEqual(editorOnlyLines, framedLines.slice(1, -1));
  assert.equal(
    editorOnlyLines.some((line) => line.includes('first prompt line')),
    true,
  );
  assert.equal(
    editorOnlyLines.some((line) => line.includes('second prompt line')),
    true,
  );
  assert.equal(editorOnly.getText(), framed.getText());
  assert.equal(editorOnly.getMode(), framed.getMode());
});

test('rails surface retains the inherited editor frame', () => {
  const framed = makeEditor(true);
  framed.setText('prompt');

  const lines = framed.render(40);

  assert.ok(lines.length >= 3);
  assert.equal(lines[0]?.includes('─'), true);
  assert.equal(lines.at(-1)?.includes('─'), true);
  assert.equal(
    lines.some((line) => line.includes('prompt')),
    true,
  );
});
