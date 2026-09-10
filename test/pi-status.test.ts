import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatPiStatus,
  ObservablePiStatusStore,
  PI_NATIVE_STATUS_CHANNEL,
  PI_STATUS_SNAPSHOT_CHANNEL,
  PI_STATUS_SOURCE_CHANNEL,
  registerPiStatus,
} from '../src/pi-status.ts';

test('status store deduplicates structured conditions and native footer statuses', () => {
  const store = new ObservablePiStatusStore();

  assert.equal(
    store.applySource({
      protocol: 1,
      type: 'snapshot',
      source: 'footer',
      conditions: [
        {
          id: 'quota',
          severity: 'warning',
          summary: 'Cached quota retained',
        },
      ],
    }),
    true,
  );
  assert.equal(
    store.applySource({
      protocol: 1,
      type: 'snapshot',
      source: 'footer',
      conditions: [
        {
          id: 'quota',
          severity: 'warning',
          summary: 'Cached quota retained',
        },
      ],
    }),
    false,
  );
  assert.equal(
    store.applyNative({
      protocol: 1,
      type: 'snapshot',
      statuses: [
        { key: 'ssh', text: '\u001b[31mconnected\u001b[0m' },
        { key: 'sandbox', text: 'ready\nnow' },
      ],
    }),
    true,
  );

  assert.deepEqual(store.snapshot(), {
    protocol: 1,
    type: 'snapshot',
    errors: 0,
    warnings: 1,
    nativeStatusCount: 2,
    conditions: [
      {
        id: 'quota',
        source: 'footer',
        severity: 'warning',
        summary: 'Cached quota retained',
      },
    ],
    nativeStatuses: [
      { key: 'ssh', text: 'connected' },
      { key: 'sandbox', text: 'ready now' },
    ],
  });
});

test('status store rejects malformed and conflicting source snapshots', () => {
  const store = new ObservablePiStatusStore();

  for (const raw of [
    null,
    { protocol: 2, type: 'snapshot', source: 'footer', conditions: [] },
    { protocol: 1, type: 'snapshot', source: '../footer', conditions: [] },
    {
      protocol: 1,
      type: 'snapshot',
      source: 'footer',
      conditions: [{ id: 'quota', severity: 'info', summary: 'nope' }],
    },
    {
      protocol: 1,
      type: 'snapshot',
      source: 'footer',
      conditions: [
        { id: 'quota', severity: 'error', summary: 'first' },
        { id: 'quota', severity: 'warning', summary: 'duplicate' },
      ],
    },
  ]) {
    assert.equal(store.applySource(raw), false);
  }
  assert.deepEqual(store.snapshot().conditions, []);
});

test('pi status formatting lists every bounded status and states coverage gap', () => {
  const store = new ObservablePiStatusStore();
  store.applySource({
    protocol: 1,
    type: 'snapshot',
    source: 'pi.agent',
    conditions: [
      {
        id: 'response-failure',
        severity: 'error',
        summary: 'Assistant response failed',
      },
    ],
  });
  store.applyNative({
    protocol: 1,
    type: 'snapshot',
    statuses: [
      { key: 'ssh', text: 'connected' },
      { key: 'plan', text: 'paused' },
    ],
  });

  const output = formatPiStatus(store.snapshot());
  assert.match(output, /^Pi status · 1 errors · 0 warnings$/mu);
  assert.match(output, /^ERROR pi\.agent · Assistant response failed$/mu);
  assert.match(output, /^ssh · connected$/mu);
  assert.match(output, /^plan · paused$/mu);
  assert.match(output, /Gap · Pi does not publish arbitrary extension-load/u);
  assert.doesNotMatch(output, /\u001b|\nconnected/u);
});

test('registered status command aggregates source events and clears recovered failures', async () => {
  const eventHandlers = new Map<string, Array<(event: never) => void>>();
  const lifecycleHandlers = new Map<string, Array<(event: never) => void>>();
  const snapshots: unknown[] = [];
  let command:
    | {
        handler(
          args: string,
          ctx: { ui: { notify(text: string, level: string): void } },
        ): Promise<void>;
      }
    | undefined;

  const pi = {
    events: {
      on(channel: string, handler: (event: never) => void) {
        const handlers = eventHandlers.get(channel) ?? [];
        handlers.push(handler);
        eventHandlers.set(channel, handlers);
        return () => {};
      },
      emit(channel: string, message: unknown) {
        if (channel === PI_STATUS_SNAPSHOT_CHANNEL) snapshots.push(message);
        for (const handler of eventHandlers.get(channel) ?? [])
          handler(message as never);
      },
    },
    on(name: string, handler: (event: never) => void) {
      const handlers = lifecycleHandlers.get(name) ?? [];
      handlers.push(handler);
      lifecycleHandlers.set(name, handlers);
    },
    registerCommand(name: string, value: typeof command) {
      assert.equal(name, 'pi-status');
      command = value;
    },
  };

  registerPiStatus(pi as never);
  lifecycleHandlers.get('session_start')?.[0]?.({} as never);
  eventHandlers.get(PI_STATUS_SOURCE_CHANNEL)?.[0]?.({
    protocol: 1,
    type: 'snapshot',
    source: 'footer',
    conditions: [
      { id: 'quota', severity: 'warning', summary: 'Cached quota retained' },
    ],
  } as never);
  eventHandlers.get(PI_NATIVE_STATUS_CHANNEL)?.[0]?.({
    protocol: 1,
    type: 'snapshot',
    statuses: [{ key: 'ssh', text: 'connected' }],
  } as never);

  const notices: Array<{ text: string; level: string }> = [];
  assert.ok(command);
  await command.handler('', {
    ui: {
      notify(text, level) {
        notices.push({ text, level });
      },
    },
  });
  assert.equal(notices[0]?.level, 'warning');
  assert.match(notices[0]?.text ?? '', /Cached quota retained/u);
  assert.match(notices[0]?.text ?? '', /ssh · connected/u);

  eventHandlers.get(PI_STATUS_SOURCE_CHANNEL)?.[0]?.({
    protocol: 1,
    type: 'snapshot',
    source: 'footer',
    conditions: [],
  } as never);
  const recovered = snapshots.at(-1) as { warnings?: number } | undefined;
  assert.equal(recovered?.warnings, 0);

  lifecycleHandlers.get('message_end')?.[0]?.({
    message: {
      role: 'assistant',
      stopReason: 'error',
      errorMessage: 'provider failed\nwithout leaking controls\u001b[31m',
    },
  } as never);
  const responseFailure = snapshots.at(-1) as
    { errors?: number; conditions?: Array<{ summary: string }> } | undefined;
  assert.equal(responseFailure?.errors, 1);
  assert.match(responseFailure?.conditions?.[0]?.summary ?? '', /provider failed/u);
  assert.doesNotMatch(responseFailure?.conditions?.[0]?.summary ?? '', /\u001b|\n/u);

  lifecycleHandlers.get('message_end')?.[0]?.({
    message: { role: 'assistant', stopReason: 'stop' },
  } as never);
  assert.equal((snapshots.at(-1) as { errors?: number }).errors, 0);

  lifecycleHandlers.get('session_compact_failed')?.[0]?.({
    aborted: false,
    willRetry: true,
    errorMessage: 'temporary failure',
  } as never);
  assert.deepEqual(
    snapshots.at(-1) && {
      errors: (snapshots.at(-1) as { errors?: number }).errors,
      warnings: (snapshots.at(-1) as { warnings?: number }).warnings,
    },
    { errors: 0, warnings: 1 },
  );
  lifecycleHandlers.get('session_compact')?.[0]?.({} as never);
  assert.equal((snapshots.at(-1) as { warnings?: number }).warnings, 0);
});
