import assert from 'node:assert/strict';
import test from 'node:test';

import galacticaContextHeader, { installEmptyDeckFooter } from '../index.ts';

test('deck mode captures native statuses through an otherwise empty footer', () => {
  const footerFactories: unknown[] = [];
  const snapshots: Array<Array<{ key: string; text: string }>> = [];
  const availability: boolean[] = [];
  let statusApiAvailable = true;
  const ctx = {
    ui: {
      setFooter(factory: unknown) {
        footerFactories.push(factory);
      },
    },
  };

  const cleanup = installEmptyDeckFooter(
    ctx as never,
    (statuses) => {
      snapshots.push(statuses);
    },
    (available) => {
      availability.push(available);
    },
  );
  const factory = footerFactories[0];
  const statuses = new Map([
    ['ssh', '\u001b[32mconnected\u001b[0m'],
    ['empty', ''],
  ]);

  assert.equal(typeof factory, 'function');
  const component = (
    factory as (
      tui: unknown,
      theme: unknown,
      footerData: { getExtensionStatuses(): ReadonlyMap<string, string> },
    ) => {
      render(width: number): string[];
      invalidate(): void;
    }
  )(
    {},
    {},
    {
      getExtensionStatuses: () => {
        if (!statusApiAvailable) throw new Error('unavailable');
        return statuses;
      },
    },
  );
  assert.deepEqual(component.render(120), []);
  assert.deepEqual(component.render(120), []);
  statusApiAvailable = false;
  assert.deepEqual(component.render(120), []);
  statusApiAvailable = true;
  assert.deepEqual(component.render(120), []);
  assert.deepEqual(snapshots, [
    [{ key: 'ssh', text: '\u001b[32mconnected\u001b[0m' }],
    [],
    [{ key: 'ssh', text: '\u001b[32mconnected\u001b[0m' }],
  ]);
  assert.deepEqual(availability, [true, false, true]);
  assert.doesNotThrow(() => component.invalidate());

  cleanup();
  assert.equal(footerFactories.at(-1), undefined);
});

test('editor-deck publishes a renderer without registering an above-editor widget', async () => {
  const handlers = new Map<string, Array<(event: unknown, ctx?: unknown) => void>>();
  const sharedHandlers = new Map<string, Array<(message: unknown) => void>>();
  const emitted: Array<{ channel: string; message: unknown }> = [];
  const renderers: Array<((width: number, theme: unknown) => string[]) | null> = [];
  const deckSurface = {
    setRenderer(renderer: ((width: number, theme: unknown) => string[]) | null) {
      renderers.push(renderer);
    },
    requestRender() {},
  };
  const pi = {
    events: {
      on(channel: string, handler: (message: unknown) => void) {
        const current = sharedHandlers.get(channel) ?? [];
        current.push(handler);
        sharedHandlers.set(channel, current);
        return () => {};
      },
      emit(channel: string, message: unknown) {
        emitted.push({ channel, message });
        for (const handler of sharedHandlers.get(channel) ?? []) handler(message);
      },
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
  // Frozen contract: with no selection the anchor row collapses entirely —
  // no slot, no dash, but the deck still renders its structure.
  assert.equal(
    lines.some((line) => line.includes('󰠭')),
    false,
  );
  assert.equal(
    // Gray-out amendment: dim placeholder dashes live on the title row only.
    lines.slice(1).some((line) => line.includes('—')),
    false,
  );
  assert.ok(lines.length > 0);
  assert.equal(typeof footerFactories[0], 'function');

  for (const handler of sharedHandlers.get('pi-mcp-adapter/status/v1') ?? []) {
    handler({
      version: 1,
      servers: [
        { status: 'connected', disabled: false, toolCount: 3 },
        { status: 'failed', disabled: false, toolCount: 0 },
      ],
    });
  }
  const degradedCapabilities = emitted
    .filter(({ channel }) => channel === 'pi-vimux-starship:status-source/v1')
    .at(-1)?.message as
    { source?: string; conditions?: Array<Record<string, unknown>> } | undefined;
  assert.equal(degradedCapabilities?.source, 'galactica-context-header');
  assert.deepEqual(degradedCapabilities?.conditions, [
    {
      id: 'mcp',
      severity: 'warning',
      summary: '1 MCP servers need attention',
    },
  ]);

  for (const handler of sharedHandlers.get('pi-mcp-adapter/status/v1') ?? []) {
    handler({
      version: 1,
      servers: [{ status: 'connected', disabled: false, toolCount: 3 }],
    });
  }
  const recoveredCapabilities = emitted
    .filter(({ channel }) => channel === 'pi-vimux-starship:status-source/v1')
    .at(-1)?.message as { conditions?: unknown[] } | undefined;
  assert.deepEqual(recoveredCapabilities?.conditions, []);

  const emptyFooter = (
    footerFactories[0] as (
      tui: unknown,
      theme: unknown,
      footerData: unknown,
    ) => { render(width: number): string[] }
  )({}, {}, {});
  assert.deepEqual(emptyFooter.render(120), []);
  const unavailableNativeStatuses = emitted
    .filter(({ channel }) => channel === 'pi-vimux-starship:status-source/v1')
    .at(-1)?.message as { conditions?: unknown[] } | undefined;
  assert.deepEqual(unavailableNativeStatuses?.conditions, [
    {
      id: 'native-status-api',
      severity: 'warning',
      summary: 'Pi native extension statuses are unavailable',
    },
  ]);

  handlers.get('session_shutdown')?.[0]?.({});
  assert.equal(renderers.at(-1), null);
  assert.equal(footerFactories.at(-1), undefined);
  await new Promise((resolve) => setImmediate(resolve));
});
