import assert from 'node:assert/strict';
import test from 'node:test';

import { createCockpitDeckSurface } from '../src/deck-surface.ts';

const theme = {} as never;

test('deck surface joins one bounded renderer to editor invalidation', () => {
  const surface = createCockpitDeckSurface();
  let rendersRequested = 0;
  surface.setRequestRender(() => {
    rendersRequested += 1;
  });

  assert.deepEqual(surface.render(80, theme), []);
  surface.setRenderer((width, receivedTheme) => {
    assert.equal(width, 80);
    assert.equal(receivedTheme, theme);
    return ['deck'];
  });

  assert.equal(rendersRequested, 1);
  assert.deepEqual(surface.render(80, theme), ['deck']);
  surface.requestRender();
  assert.equal(rendersRequested, 2);

  surface.setRenderer(null);
  assert.equal(rendersRequested, 3);
  assert.deepEqual(surface.render(80, theme), []);
});

test('deck surface reconnects after either extension starts first and fails soft', () => {
  const surface = createCockpitDeckSurface();
  let rendersRequested = 0;

  surface.setRenderer(() => ['ready']);
  surface.setRequestRender(() => {
    rendersRequested += 1;
  });
  assert.equal(rendersRequested, 1);
  assert.deepEqual(surface.render(80, theme), ['ready']);

  surface.setRenderer(() => {
    throw new Error('render failure');
  });
  assert.deepEqual(surface.render(80, theme), []);
  assert.deepEqual(surface.render(0, theme), []);

  surface.setRequestRender(null);
  assert.doesNotThrow(() => surface.requestRender());
});
