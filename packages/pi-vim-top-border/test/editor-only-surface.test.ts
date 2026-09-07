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

test('editor-only keeps every autocomplete row after removing the inner bottom frame', () => {
  const framed = makeEditor(true);
  const editorOnly = makeEditor(false);
  const completions = ['first completion', 'second completion'];
  for (const editor of [framed, editorOnly]) {
    editor.setText('/command');
    const internals = editor as unknown as {
      autocompleteState: string;
      autocompleteList: { render: () => string[] };
    };
    internals.autocompleteState = 'regular';
    internals.autocompleteList = { render: () => completions };
  }

  const framedLines = framed.render(48);
  const editorOnlyLines = editorOnly.render(48);
  const bottomFrameIndex = framedLines.length - completions.length - 1;
  const expected = framedLines.filter(
    (_, index) => index !== 0 && index !== bottomFrameIndex,
  );

  assert.deepEqual(editorOnlyLines, expected);
  assert.equal(editorOnlyLines.at(-2)?.includes('first completion'), true);
  assert.equal(editorOnlyLines.at(-1)?.includes('second completion'), true);
  assert.equal(
    editorOnlyLines.some((line) => /^─+$/u.test(line)),
    false,
  );
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
