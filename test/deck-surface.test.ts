import assert from 'node:assert/strict';
import test from 'node:test';

import { createCockpitDeckSurface } from '../src/deck-surface.ts';

const theme = {} as never;

test('deck surface joins one bounded renderer to editor invalidation', () => {
  const surface = createCockpitDeckSurface();
  const modeRail = { plain: '󰆾', styled: '[normal]󰆾' };
  const contextualSurface = surface as unknown as {
    setRenderer(
      renderer:
        | ((
            width: number,
            receivedTheme: typeof theme,
            receivedModeRail?: typeof modeRail,
          ) => string[])
        | null,
    ): void;
    render(
      width: number,
      receivedTheme: typeof theme,
      mode?: typeof modeRail,
    ): string[];
  };
  let rendersRequested = 0;
  surface.setRequestRender(() => {
    rendersRequested += 1;
  });

  assert.deepEqual(contextualSurface.render(80, theme, modeRail), []);
  contextualSurface.setRenderer((width, receivedTheme, receivedModeRail) => {
    assert.equal(width, 80);
    assert.equal(receivedTheme, theme);
    assert.equal(receivedModeRail, modeRail);
    return ['deck'];
  });

  assert.equal(rendersRequested, 1);
  assert.deepEqual(contextualSurface.render(80, theme, modeRail), ['deck']);
  surface.requestRender();
  assert.equal(rendersRequested, 2);

  contextualSurface.setRenderer(null);
  assert.equal(rendersRequested, 3);
  assert.deepEqual(contextualSurface.render(80, theme, modeRail), []);
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
