import assert from 'node:assert/strict';
import test from 'node:test';

import galacticaContextHeader, { installEmptyDeckFooter } from '../index.ts';

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

test('editor-deck publishes a renderer without registering an above-editor widget', async () => {
  const handlers = new Map<string, Array<(event: unknown, ctx?: unknown) => void>>();
  const renderers: Array<((width: number, theme: unknown) => string[]) | null> = [];
  const deckSurface = {
    setRenderer(renderer: ((width: number, theme: unknown) => string[]) | null) {
      renderers.push(renderer);
    },
    requestRender() {},
  };
  const pi = {
    events: {
      on: () => () => {},
      emit() {},
    },
    on(name: string, handler: (event: unknown, ctx?: unknown) => void) {
      const current = handlers.get(name) ?? [];
      current.push(handler);
      handlers.set(name, current);
    },
    exec: async () => ({ code: 1, stdout: '', stderr: '' }),
    getThinkingLevel: () => 'high',
  };
  const footerFactories: unknown[] = [];
  const ctx = {
    mode: 'tui',
    hasUI: true,
    cwd: '/tmp/project',
    model: { name: 'Test Model', contextWindow: 100_000 },
    getContextUsage: () => ({ percent: 25, tokens: 25_000 }),
    sessionManager: { getBranch: () => [] },
    ui: {
      setWorkingVisible() {},
      setFooter(factory: unknown) {
        footerFactories.push(factory);
      },
      setWidget() {
        assert.fail('editor-deck must not register an above-editor widget');
      },
    },
  };

  galacticaContextHeader(pi as never, {
    surface: 'editor-deck',
    deckSurface: deckSurface as never,
  });
  handlers.get('session_start')?.[0]?.({}, ctx);

  const renderer = renderers.at(-1);
  assert.equal(typeof renderer, 'function');
  const theme = {
    fg: (_color: string, text: string) => text,
    bold: (text: string) => text,
  };
  const lines = renderer?.(120, theme) ?? [];
  assert.match(lines[0] ?? '', /󰠭/u);
  assert.equal(typeof footerFactories[0], 'function');

  handlers.get('session_shutdown')?.[0]?.({});
  assert.equal(renderers.at(-1), null);
  assert.equal(footerFactories.at(-1), undefined);
  await new Promise((resolve) => setImmediate(resolve));
});
