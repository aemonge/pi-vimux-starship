import assert from 'node:assert/strict';
import test from 'node:test';

import { installEmptyDeckFooter } from '../index.ts';

test('deck mode replaces Pi footer with an empty surface and restores it on cleanup', () => {
  const footerFactories: unknown[] = [];
  const ctx = {
    ui: {
      setFooter(factory: unknown) {
        footerFactories.push(factory);
      },
    },
  };

  const cleanup = installEmptyDeckFooter(ctx as never);
  const factory = footerFactories[0];

  assert.equal(typeof factory, 'function');
  const component = (
    factory as () => {
      render(width: number): string[];
      invalidate(): void;
    }
  )();
  assert.deepEqual(component.render(120), []);
  assert.doesNotThrow(() => component.invalidate());

  cleanup();
  assert.equal(footerFactories.at(-1), undefined);
});
