import assert from 'node:assert/strict';
import test from 'node:test';

import { ModalEditor } from '../index.js';
import { CTRL_V } from '../types.js';

const PASTE_START = '\x1b[200~';
const PASTE_END = '\x1b[201~';

type PasteImageArm = {
  fired: () => number;
  /** Payload the next native paste fires back through insertTextAtCursor. */
  deliver: (payload: string) => void;
};

function makeEditor() {
  const tui = { requestRender() {} };
  const theme = { borderColor: (text: string) => text, selectList: {} };
  const keybindings = {
    matches: (data: string, action: string) =>
      (data === '<external-editor>' && action === 'app.editor.external') ||
      (data === CTRL_V && action === 'app.clipboard.pasteImage'),
  };
  return new ModalEditor(tui as never, theme as never, keybindings as never);
}

/**
 * Arm the native clipboard paste exactly the way Pi core does: the
 * `app.clipboard.pasteImage` keybinding fires `onPasteImage`, whose async
 * clipboard read resolves through `handleClipboardPaste` and lands the text
 * (or the image's temp-file path) via `editor.insertTextAtCursor`. An unarmed
 * paste simulates a clipboard that fails or returns nothing.
 */
function armNativePaste(editor: ModalEditor): PasteImageArm {
  let fired = 0;
  let nextPayload: string | null = null;
  (editor as unknown as { onPasteImage?: () => void }).onPasteImage = () => {
    fired += 1;
    if (nextPayload !== null) {
      const payload = nextPayload;
      nextPayload = null;
      editor.insertTextAtCursor(payload);
    }
  };
  return {
    fired: () => fired,
    deliver: (payload: string) => {
      nextPayload = payload;
    },
  };
}

test('p pastes the clipboard natively at the cursor and opens the external editor pre-filled', () => {
  const editor = makeEditor();
  const arm = armNativePaste(editor);
  arm.deliver('PASTED');
  editor.setText('alpha beta');
  const launches: string[] = [];
  editor.setExternalEditorFn(() => {
    launches.push(editor.getText());
    return undefined;
  });

  editor.handleInput('\x1b');
  editor.handleInput('0');
  editor.handleInput('p');

  assert.equal(arm.fired(), 1);
  assert.equal(editor.getText(), 'PASTEDalpha beta');
  assert.deepEqual(launches, ['PASTEDalpha beta']);
  assert.equal(editor.getMode(), 'normal');
});

test('P pastes the clipboard natively and submits the prompt immediately', () => {
  const editor = makeEditor();
  const arm = armNativePaste(editor);
  arm.deliver('SENT');
  const submissions: string[] = [];
  editor.onSubmit = (text) => submissions.push(text);

  editor.handleInput('\x1b');
  editor.handleInput('0');
  editor.handleInput('P');

  assert.equal(arm.fired(), 1);
  assert.deepEqual(submissions, ['SENT']);
  assert.equal(editor.getText(), '');
});

test('P with an image clipboard sends the pasted file path', () => {
  const editor = makeEditor();
  const arm = armNativePaste(editor);
  arm.deliver('/tmp/pi-clipboard-1234.png');
  const submissions: string[] = [];
  editor.onSubmit = (text) => submissions.push(text);

  editor.handleInput('\x1b');
  editor.handleInput('P');

  assert.equal(arm.fired(), 1);
  assert.deepEqual(submissions, ['/tmp/pi-clipboard-1234.png']);
});

test('P never submits when the clipboard paste delivers nothing', () => {
  const editor = makeEditor();
  const arm = armNativePaste(editor);
  const submissions: string[] = [];
  editor.onSubmit = (text) => submissions.push(text);
  editor.setText('alpha beta');

  editor.handleInput('\x1b');
  editor.handleInput('P');

  assert.equal(arm.fired(), 1);
  assert.deepEqual(submissions, []);
  assert.equal(editor.getText(), 'alpha beta');
});

test('a count before p or P is consumed and discarded without leaking into motions', () => {
  const editor = makeEditor();
  const arm = armNativePaste(editor);
  arm.deliver('X');
  editor.setText('alpha beta');

  editor.handleInput('\x1b');
  editor.handleInput('0');
  editor.handleInput('3');
  editor.handleInput('p');

  assert.equal(editor.getText(), 'Xalpha beta');
  const before = editor.getCursor().col;

  editor.handleInput('l');

  assert.equal(editor.getCursor().col, before + 1);
});

test('a silent clipboard failure cancels the expectation instead of hanging', () => {
  const editor = makeEditor();
  const arm = armNativePaste(editor);
  const submissions: string[] = [];
  editor.onSubmit = (text) => submissions.push(text);
  editor.setText('alpha beta');

  editor.handleInput('\x1b');
  editor.handleInput('P');
  editor.handleInput('l');

  assert.equal(arm.fired(), 1);
  assert.deepEqual(submissions, []);
  // A paste arriving after the expectation died is stripped like any manual
  // normal-mode paste, never accepted and never submitted.
  editor.handleInput(`${PASTE_START}late${PASTE_END}`);
  assert.equal(editor.getText(), 'alpha beta');
  assert.deepEqual(submissions, []);
});

test('stray input between p and the payload cancels the expectation', () => {
  const editor = makeEditor();
  const arm = armNativePaste(editor);
  editor.setText('alpha beta');
  editor.setExternalEditorFn(() => undefined);

  editor.handleInput('\x1b');
  editor.handleInput('p');
  editor.handleInput('l');
  editor.insertTextAtCursor('late');

  assert.equal(editor.getText(), 'alpha betalate');
  assert.equal(arm.fired(), 1);
});

test('manual terminal paste in normal mode stays stripped without p or P', () => {
  const editor = makeEditor();
  editor.setText('alpha beta');

  editor.handleInput('\x1b');
  editor.handleInput(`${PASTE_START}manual${PASTE_END}`);

  assert.equal(editor.getText(), 'alpha beta');
});

test('a bracketed-paste delivery after p is still accepted as a fallback seam', () => {
  const editor = makeEditor();
  editor.setText('alpha beta');
  const launches: string[] = [];
  editor.setExternalEditorFn(() => {
    launches.push(editor.getText());
    return undefined;
  });

  editor.handleInput('\x1b');
  editor.handleInput('0');
  editor.handleInput('p');
  editor.handleInput(`${PASTE_START}FALLBACK${PASTE_END}`);

  assert.equal(editor.getText(), 'FALLBACKalpha beta');
  assert.deepEqual(launches, ['FALLBACKalpha beta']);
});

test('dot does not repeat p: the native paste is a host injection, not a replayable edit', () => {
  const editor = makeEditor();
  const arm = armNativePaste(editor);
  arm.deliver('X');
  editor.setText('alpha beta');

  editor.handleInput('\x1b');
  editor.handleInput('0');
  editor.handleInput('p');
  assert.equal(editor.getText(), 'Xalpha beta');

  editor.handleInput('.');

  assert.equal(arm.fired(), 1);
  assert.equal(editor.getText(), 'Xalpha beta');
});

test('p without an external editor fn still pastes and stays in normal mode', () => {
  const editor = makeEditor();
  const arm = armNativePaste(editor);
  arm.deliver('PASTED');
  editor.setText('alpha beta');

  editor.handleInput('\x1b');
  editor.handleInput('0');
  editor.handleInput('p');

  assert.equal(arm.fired(), 1);
  assert.equal(editor.getText(), 'PASTEDalpha beta');
  assert.equal(editor.getMode(), 'normal');
});
