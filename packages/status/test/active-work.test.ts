import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { after, before } from 'node:test';
import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import galacticaStatus from '../index.ts';
import {
  formatActiveWorkTitle,
  NO_SESSION_SUBJECT,
  restoreSessionSubject,
  restoreSessionWorkFocus,
  sessionSubject,
  sessionWorkFocus,
  taskflowRunFocus,
} from '../src/active-work.ts';
import { collectOpenSpec } from '../src/openspec.ts';
import type { CommandRunner } from '../src/types.ts';

type Handler = (event: any, ctx: ExtensionContext) => unknown;
type Command = {
  handler: (args: string, ctx: ExtensionContext) => unknown;
};
type Tool = {
  parameters: any;
  execute: (
    toolCallId: string,
    params: any,
    signal: AbortSignal | undefined,
    onUpdate: undefined,
    ctx: ExtensionContext,
  ) => unknown;
};

const change = 'show-active-openspec-in-pi-title';
const taskId = '1.1';
const taskTitle = 'Show active OpenSpec in Pi title';
const activeTitle = `π  ${change} › ${taskId} ${taskTitle}`;
const replacementChange = 'replace-active-openspec-title';
const replacementTaskId = '2.4';
const replacementTaskTitle = 'Replace active title focus';
const replacementActiveTitle = `π  ${replacementChange} › ${replacementTaskId} ${replacementTaskTitle}`;

function goalStateEntry(
  status: string | null,
  options: {
    id?: string;
    automaticModelTurns?: number;
    waiting?: boolean;
    text?: string;
  } = {},
) {
  return {
    type: 'custom',
    customType: 'goal-state',
    data: {
      goal:
        status === null
          ? null
          : {
              id: options.id ?? 'goal-1',
              text: options.text ?? 'raw/private Goal objective',
              status,
              automaticModelTurns: options.automaticModelTurns ?? 0,
              ...(options.waiting
                ? { waiting: { reason: 'private wait reason' } }
                : {}),
            },
    },
  };
}

const originalEnvironment = {
  codingAgentDir: process.env.PI_CODING_AGENT_DIR,
  openspecChange: process.env.PI_OPENSPEC_CHANGE,
};

before(() => {
  process.env.PI_CODING_AGENT_DIR = join(
    tmpdir(),
    `galactica-status-test-agent-${process.pid}`,
  );
  delete process.env.PI_OPENSPEC_CHANGE;
});

after(() => {
  if (originalEnvironment.codingAgentDir === undefined) {
    delete process.env.PI_CODING_AGENT_DIR;
  } else {
    process.env.PI_CODING_AGENT_DIR = originalEnvironment.codingAgentDir;
  }
  if (originalEnvironment.openspecChange === undefined) {
    delete process.env.PI_OPENSPEC_CHANGE;
  } else {
    process.env.PI_OPENSPEC_CHANGE = originalEnvironment.openspecChange;
  }
});

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

function openSpecResult(
  args: string[],
  focusedTaskTitle = taskTitle,
  focusedTaskDone = false,
) {
  if (args[0] === 'list') {
    return {
      code: 0,
      stdout: JSON.stringify({
        changes: [
          {
            name: change,
            completedTasks: focusedTaskDone ? 1 : 0,
            totalTasks: 1,
            lastModified: '2026-08-01T00:00:00Z',
            status: focusedTaskDone ? 'complete' : 'in-progress',
          },
          {
            name: replacementChange,
            completedTasks: 0,
            totalTasks: 1,
            lastModified: '2026-08-02T00:00:00Z',
            status: 'in-progress',
          },
        ],
        root: { path: '/repos/galactica' },
      }),
      stderr: '',
    };
  }

  const requestedChange = args[0] === 'show' ? args[1] : args[3];
  const fixture =
    requestedChange === replacementChange
      ? {
          taskId: replacementTaskId,
          taskTitle: replacementTaskTitle,
          done: false,
        }
      : { taskId, taskTitle: focusedTaskTitle, done: focusedTaskDone };
  if (args[0] === 'show') {
    return {
      code: 0,
      stdout: JSON.stringify({ title: fixture.taskTitle }),
      stderr: '',
    };
  }
  if (args[0] === 'instructions') {
    return {
      code: 0,
      stdout: JSON.stringify({
        progress: { total: 1, complete: fixture.done ? 1 : 0 },
        tasks: [
          {
            id: fixture.taskId,
            description: `${fixture.taskId} ${fixture.taskTitle} Story`,
            done: fixture.done,
          },
        ],
      }),
      stderr: '',
    };
  }
  return { code: 1, stdout: '', stderr: `unexpected OpenSpec args: ${args}` };
}

type OpenSpecCommandResult = ReturnType<typeof openSpecResult>;
type OpenSpecResponder = (
  args: string[],
) => OpenSpecCommandResult | Promise<OpenSpecCommandResult>;

class RuntimeHarness {
  readonly handlers = new Map<string, Handler[]>();
  readonly commands = new Map<string, Command>();
  readonly tools = new Map<string, Tool>();
  readonly titles: string[] = [];
  readonly notifications: Array<{ message: string; level: string | undefined }> = [];
  readonly sharedEvents: Array<{ channel: string; message: unknown }> = [];
  readonly execCalls: Array<{ command: string; args: string[] }> = [];
  readonly entries: any[];
  private branchEntries: any[];
  readonly context: ExtensionContext;
  readonly pi: ExtensionAPI;

  constructor(
    options: {
      cwd?: string;
      sessionName?: string;
      entries?: any[];
      focusedTaskTitle?: string;
      focusedTaskDone?: boolean;
      persisted?: boolean;
      mode?: 'tui' | 'json';
      openSpecResponder?: OpenSpecResponder;
      onTitle?: (title: string) => void;
    } = {},
  ) {
    this.entries = [...(options.entries ?? [])];
    this.branchEntries = this.entries;
    const sharedHandlers = new Map<string, Array<(message: unknown) => void>>();
    let entryOrdinal = this.entries.length;

    this.context = {
      cwd: options.cwd ?? '/work/galactica',
      mode: options.mode ?? 'tui',
      hasUI: (options.mode ?? 'tui') === 'tui',
      ui: {
        setTitle: (title: string) => {
          this.titles.push(title);
          options.onTitle?.(title);
        },
        notify: (message: string, level?: string) => {
          this.notifications.push({ message, level });
        },
      },
      sessionManager: {
        getBranch: () => [...this.branchEntries],
        getEntries: () => [...this.entries],
        getSessionName: () => options.sessionName,
        getSessionFile: () =>
          options.persisted === false ? undefined : '/sessions/current.jsonl',
        isPersisted: () => options.persisted !== false,
      },
    } as unknown as ExtensionContext;

    this.pi = {
      on: (name: string, handler: Handler) => {
        const handlers = this.handlers.get(name) ?? [];
        handlers.push(handler);
        this.handlers.set(name, handlers);
      },
      registerCommand: (name: string, command: Command) => {
        this.commands.set(name, command);
      },
      registerTool: (tool: Tool & { name: string }) => {
        this.tools.set(tool.name, tool);
      },
      appendEntry: (customType: string, data: unknown) => {
        entryOrdinal += 1;
        const entry = {
          type: 'custom',
          id: `entry-${entryOrdinal}`,
          parentId: this.entries.at(-1)?.id ?? null,
          timestamp: new Date(entryOrdinal).toISOString(),
          customType,
          data,
        };
        this.entries.push(entry);
        return entry.id;
      },
      getSessionName: () => options.sessionName,
      exec: async (command: string, args: string[]) => {
        this.execCalls.push({ command, args });
        if (command === 'git') {
          return {
            code: 0,
            stdout: '/repos/galactica\n',
            stderr: '',
          };
        }
        if (command === 'openspec') {
          return options.openSpecResponder
            ? options.openSpecResponder(args)
            : openSpecResult(args, options.focusedTaskTitle, options.focusedTaskDone);
        }
        return { code: 1, stdout: '', stderr: `unexpected command: ${command}` };
      },
      events: {
        on: (channel: string, handler: (message: unknown) => void) => {
          const handlers = sharedHandlers.get(channel) ?? [];
          handlers.push(handler);
          sharedHandlers.set(channel, handlers);
          return () => {
            const current = sharedHandlers.get(channel) ?? [];
            sharedHandlers.set(
              channel,
              current.filter((candidate) => candidate !== handler),
            );
          };
        },
        emit: (channel: string, message: unknown) => {
          this.sharedEvents.push({ channel, message });
          for (const handler of sharedHandlers.get(channel) ?? []) handler(message);
        },
      },
    } as unknown as ExtensionAPI;

    galacticaStatus(this.pi);
  }

  navigateToBranch(entries: any[]): void {
    this.branchEntries = [...entries];
  }

  async emit(name: string, event: unknown = {}): Promise<unknown> {
    let result: unknown;
    for (const handler of this.handlers.get(name) ?? []) {
      const candidate = await handler(event, this.context);
      if (candidate !== undefined) result = candidate;
    }
    return result;
  }

  async command(name: string, args: string): Promise<void> {
    const command = this.commands.get(name);
    assert.ok(command, `/${name} should be registered`);
    await command.handler(args, this.context);
  }

  async tool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    assert.ok(tool, `${name} should be registered`);
    return tool.execute('tool-call', params, undefined, undefined, this.context);
  }

  async stop(): Promise<void> {
    await this.emit('session_shutdown', { reason: 'quit' });
  }
}

async function waitFor(
  predicate: () => boolean,
  diagnostics: () => string,
  timeoutMs = 500,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  if (!predicate()) {
    throw new Error(`waitFor timed out after ${timeoutMs}ms: ${diagnostics()}`);
  }
}

async function waitForSignal(
  signal: Promise<void>,
  diagnostics: () => string,
  timeoutMs = 500,
): Promise<void> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      signal,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error(
                `waitForSignal timed out after ${timeoutMs}ms: ${diagnostics()}`,
              ),
            ),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function titleDiagnostics(harness: RuntimeHarness): string {
  return `observed titles: ${JSON.stringify(harness.titles)}`;
}

function latestWidgetMessage(harness: RuntimeHarness, id: string): unknown {
  for (let index = harness.sharedEvents.length - 1; index >= 0; index -= 1) {
    const message = harness.sharedEvents[index]?.message;
    if (typeof message !== 'object' || message === null) continue;
    if ('id' in message && message.id === id) return message;
    if (
      'widget' in message &&
      typeof message.widget === 'object' &&
      message.widget !== null &&
      'id' in message.widget &&
      message.widget.id === id
    ) {
      return message;
    }
  }
  return undefined;
}

function latestOpenSpecFooterMessage(harness: RuntimeHarness): unknown {
  return latestWidgetMessage(harness, 'galactica.openspec');
}

function latestOpenSpecProgressMessage(harness: RuntimeHarness): unknown {
  return latestWidgetMessage(harness, 'galactica.openspec-progress');
}

function latestWorkFooterMessage(harness: RuntimeHarness): unknown {
  for (let index = harness.sharedEvents.length - 1; index >= 0; index -= 1) {
    const message = harness.sharedEvents[index]?.message;
    if (typeof message !== 'object' || message === null) continue;
    if ('id' in message && message.id === 'galactica.work') return message;
    if (
      'widget' in message &&
      typeof message.widget === 'object' &&
      message.widget !== null &&
      'id' in message.widget &&
      message.widget.id === 'galactica.work'
    ) {
      return message;
    }
  }
  return undefined;
}

function latestHeader(harness: RuntimeHarness): Record<string, unknown> | undefined {
  for (let index = harness.sharedEvents.length - 1; index >= 0; index -= 1) {
    const event = harness.sharedEvents[index];
    if (event?.channel !== 'galactica-status:header') continue;
    if (typeof event.message !== 'object' || event.message === null) return undefined;
    return event.message as Record<string, unknown>;
  }
  return undefined;
}

function latestHeaderWork(harness: RuntimeHarness): unknown {
  return latestHeader(harness)?.work;
}

function openSpecFooterText(message: unknown): string | undefined {
  if (
    typeof message !== 'object' ||
    message === null ||
    !('widget' in message) ||
    typeof message.widget !== 'object' ||
    message.widget === null ||
    !('content' in message.widget) ||
    typeof message.widget.content !== 'object' ||
    message.widget.content === null ||
    !('text' in message.widget.content) ||
    typeof message.widget.content.text !== 'string'
  ) {
    return undefined;
  }
  return message.widget.content.text;
}

test('waitFor throws timeout diagnostics instead of silently continuing', async () => {
  await assert.rejects(
    waitFor(
      () => false,
      () => 'expected title was not emitted',
      10,
    ),
    /waitFor timed out after 10ms: expected title was not emitted/u,
  );
});

test('an unfocused OpenSpec repository does not select its newest incomplete change', async () => {
  const calls: string[][] = [];
  const runner: CommandRunner = async (_command, args) => {
    calls.push(args);
    return openSpecResult(args);
  };

  const state = await collectOpenSpec({ cwd: '/repos/galactica', runner });

  assert.equal(state, undefined);
  assert.deepEqual(calls, [['list', '--json']]);
});

test('an unfocused OpenSpec project publishes quiet feedback without warning', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-status-unfocused-'));
  await mkdir(join(root, 'openspec'));
  const harness = new RuntimeHarness({ cwd: root });

  try {
    await harness.emit('session_start', { reason: 'startup' });
    await waitFor(
      () =>
        openSpecFooterText(latestOpenSpecFooterMessage(harness)) ===
        'OpenSpec · no focus',
      () => JSON.stringify(harness.sharedEvents),
    );

    assert.equal(
      openSpecFooterText(latestOpenSpecProgressMessage(harness)),
      '0/2 ›  0/2',
    );

    await harness.command('openspec-focus', '');
    assert.deepEqual(harness.notifications.at(-1), {
      message: 'OpenSpec focus: none',
      level: 'info',
    });
    assert.equal(
      harness.notifications.filter(({ level }) => level === 'warning').length,
      0,
    );
    assert.deepEqual(
      harness.execCalls
        .filter(({ command }) => command === 'openspec')
        .map(({ args }) => args),
      [['list', '--json']],
      'feedback must inspect availability without auto-selecting a change',
    );
  } finally {
    await harness.stop();
    await rm(root, { recursive: true, force: true });
  }
});

test('focused metadata selects the exact task and an unknown ID never borrows another headline', async () => {
  const secondTaskId = '1.2';
  const secondTaskTitle = 'Select exact second task';
  const unknownTaskId = '9.9';
  const metadataResult: OpenSpecResponder = async (args) => {
    if (args[0] === 'list') {
      return {
        code: 0,
        stdout: JSON.stringify({
          changes: [
            {
              name: change,
              completedTasks: 0,
              totalTasks: 2,
              lastModified: '2026-08-01T00:00:00Z',
              status: 'in-progress',
            },
          ],
          root: { path: '/repos/galactica' },
        }),
        stderr: '',
      };
    }
    if (args[0] === 'show') {
      return {
        code: 0,
        stdout: JSON.stringify({ title: taskTitle }),
        stderr: '',
      };
    }
    if (args[0] === 'instructions') {
      return {
        code: 0,
        stdout: JSON.stringify({
          progress: { total: 2, complete: 0 },
          tasks: [
            {
              id: taskId,
              description: `${taskId} ${taskTitle} Story`,
              done: false,
            },
            {
              id: secondTaskId,
              description: `${secondTaskId} ${secondTaskTitle} Story`,
              done: false,
            },
          ],
        }),
        stderr: '',
      };
    }
    return { code: 1, stdout: '', stderr: `unexpected OpenSpec args: ${args}` };
  };
  const harness = new RuntimeHarness({ openSpecResponder: metadataResult });

  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.command('openspec-focus', `set ${change} ${secondTaskId}`);
    await harness.command('galactica-status-refresh', '');

    assert.equal(
      harness.titles.at(-1),
      `π  ${change} › ${secondTaskId} ${secondTaskTitle}`,
    );
    assert.equal(
      openSpecFooterText(latestOpenSpecFooterMessage(harness)),
      `0/2  ▶ ${secondTaskId} ${secondTaskTitle}`,
    );

    const titlesBeforeUnknownFocus = harness.titles.length;
    await harness.command('openspec-focus', `replace ${change} ${unknownTaskId}`);
    await harness.command('galactica-status-refresh', '');

    const unknownTitle = `π  ${change} › ${unknownTaskId}`;
    assert.equal(harness.titles.at(-1), unknownTitle);
    assert.ok(
      harness.titles
        .slice(titlesBeforeUnknownFocus)
        .every((title) => !title.includes(taskTitle)),
      'an unknown task ID must never borrow the first pending task headline',
    );
  } finally {
    await harness.stop();
  }
});

test('same-focus metadata refresh failure falls back to ID-only title', async () => {
  let rejectOpenSpecRefresh = false;
  const harness = new RuntimeHarness({
    openSpecResponder: async (args) => {
      if (rejectOpenSpecRefresh && args[0] === 'list') {
        return {
          code: 1,
          stdout: '',
          stderr: 'focused OpenSpec metadata unavailable',
        };
      }
      return openSpecResult(args);
    },
  });

  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.command('openspec-focus', `set ${change} ${taskId}`);
    await harness.command('galactica-status-refresh', '');

    assert.equal(harness.titles.at(-1), activeTitle);
    const resolvedFooter = latestOpenSpecFooterMessage(harness);
    assert.ok(
      typeof resolvedFooter === 'object' &&
        resolvedFooter !== null &&
        'type' in resolvedFooter &&
        resolvedFooter.type === 'upsert',
      'resolved metadata should publish the focused OpenSpec footer',
    );
    const focusEntry = harness.entries.at(-1);

    rejectOpenSpecRefresh = true;
    await harness.command('galactica-status-refresh', '');

    assert.equal(harness.entries.at(-1), focusEntry);
    assert.deepEqual(focusEntry?.data, { mode: 'task', change, taskId });
    assert.equal(
      harness.titles.at(-1),
      `π  ${change} › ${taskId}`,
      'failed same-focus metadata refresh must discard the stale task headline',
    );
    assert.doesNotMatch(harness.titles.at(-1) ?? '', new RegExp(taskTitle, 'u'));
    const health = harness.sharedEvents
      .filter(({ channel }) => channel === 'pi-vimux-starship:status-source/v1')
      .at(-1)?.message as
      { source?: string; conditions?: Array<Record<string, unknown>> } | undefined;
    assert.equal(health?.source, 'galactica-status');
    assert.deepEqual(
      health?.conditions?.find(({ id }) => id === 'openspec'),
      {
        id: 'openspec',
        severity: 'warning',
        summary: 'openspec refresh failed; previous status is retained',
      },
    );
  } finally {
    await harness.stop();
  }
});

test('a replaced focus rejects stale metadata and publishes replacement metadata once', async () => {
  const aShowStarted = deferred();
  const releaseA = deferred();
  const bShowStarted = deferred();
  const releaseB = deferred();
  const bTitlePublished = deferred();
  let aShowCalls = 0;
  let bShowCalls = 0;

  const harness = new RuntimeHarness({
    openSpecResponder: async (args) => {
      if (args[0] === 'show' && args[1] === change) {
        aShowCalls += 1;
        aShowStarted.resolve();
        await releaseA.promise;
      }
      if (args[0] === 'show' && args[1] === replacementChange) {
        bShowCalls += 1;
        bShowStarted.resolve();
        await releaseB.promise;
      }
      return openSpecResult(args);
    },
    onTitle: (title) => {
      if (title === replacementActiveTitle) bTitlePublished.resolve();
    },
  });

  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.command('openspec-focus', `set ${change} ${taskId}`);
    await waitForSignal(
      aShowStarted.promise,
      () => `change A show did not start; calls: ${JSON.stringify(harness.execCalls)}`,
    );

    await harness.command(
      'openspec-focus',
      `replace ${replacementChange} ${replacementTaskId}`,
    );
    const replacementIdTitle = `π  ${replacementChange} › ${replacementTaskId}`;
    const footerAfterReplacement = latestOpenSpecFooterMessage(harness);
    assert.equal(harness.titles.at(-1), replacementIdTitle);
    assert.equal(
      footerAfterReplacement,
      undefined,
      'replacement B should have no focused footer before its metadata resolves',
    );

    const titlesBeforeAResolution = harness.titles.length;
    releaseA.resolve();
    await waitForSignal(
      bShowStarted.promise,
      () =>
        `replacement B show did not start after releasing A; calls: ${JSON.stringify(harness.execCalls)}`,
    );

    assert.equal(harness.titles.at(-1), replacementIdTitle);
    assert.deepEqual(latestOpenSpecFooterMessage(harness), footerAfterReplacement);
    assert.deepEqual(
      harness.titles.slice(titlesBeforeAResolution),
      [],
      'stale A metadata must not emit a title while replacement B is unresolved',
    );

    releaseB.resolve();
    await waitForSignal(
      bTitlePublished.promise,
      () => `replacement B title was not published; ${titleDiagnostics(harness)}`,
    );

    const expectedBFooter = `0/1  ▶ ${replacementTaskId} ${replacementTaskTitle}`;
    assert.equal(harness.titles.at(-1), replacementActiveTitle);
    assert.equal(
      openSpecFooterText(latestOpenSpecFooterMessage(harness)),
      expectedBFooter,
    );
    assert.equal(aShowCalls, 1);
    assert.equal(bShowCalls, 1);
    assert.equal(
      harness.titles.filter((title) => title === replacementActiveTitle).length,
      1,
      'replacement B should update the title exactly once',
    );
    assert.equal(
      harness.sharedEvents.filter(
        ({ message }) => openSpecFooterText(message) === expectedBFooter,
      ).length,
      1,
      'replacement B should update the footer exactly once',
    );
  } finally {
    releaseA.resolve();
    releaseB.resolve();
    await harness.stop();
  }
});

test('session start emits the session-name fallback before asynchronous refresh', async () => {
  const harness = new RuntimeHarness({ sessionName: 'Review title contract' });
  try {
    const starting = harness.emit('session_start', { reason: 'startup' });
    assert.deepEqual(harness.titles, ['π  Review title contract']);
    await starting;
  } finally {
    await harness.stop();
  }
});

test('PI_OPENSPEC_CHANGE selects collection without establishing session focus', async () => {
  const previousChange = process.env.PI_OPENSPEC_CHANGE;
  process.env.PI_OPENSPEC_CHANGE = change;
  const harness = new RuntimeHarness({ sessionName: 'Environment fallback' });

  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.command('galactica-status-refresh', '');

    assert.ok(
      harness.execCalls.some(
        ({ command, args }) =>
          command === 'openspec' && args[0] === 'show' && args[1] === change,
      ),
      'the environment-selected change should be collected',
    );
    assert.equal(harness.titles.at(-1), 'π  Environment fallback');
    assert.equal(
      harness.sharedEvents.some(({ message }) => {
        if (typeof message !== 'object' || message === null) return false;
        if (!('type' in message) || message.type !== 'upsert') return false;
        return (
          'widget' in message &&
          typeof message.widget === 'object' &&
          message.widget !== null &&
          'id' in message.widget &&
          message.widget.id === 'galactica.openspec'
        );
      }),
      false,
      'an environment-selected change must not upsert a focused OpenSpec footer',
    );
    assert.deepEqual(
      harness.entries,
      [],
      'environment selection must not persist focus',
    );
  } finally {
    await harness.stop();
    if (previousChange === undefined) {
      delete process.env.PI_OPENSPEC_CHANGE;
    } else {
      process.env.PI_OPENSPEC_CHANGE = previousChange;
    }
  }
});

test('session_info_changed immediately propagates an unfocused session rename', async () => {
  const harness = new RuntimeHarness({ sessionName: 'Initial session name' });
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.emit('session_info_changed', { name: 'Renamed session' });

    assert.equal(harness.titles.at(-1), 'π  Renamed session');
  } finally {
    await harness.stop();
  }
});

test('work_focus exposes one provider-safe string action enum', () => {
  const harness = new RuntimeHarness();
  const tool = harness.tools.get('work_focus');
  assert.ok(tool, 'work_focus should be registered');

  const action = tool.parameters.properties.action as {
    type?: string;
    enum?: unknown[];
    anyOf?: unknown;
  };
  assert.equal(action.type, 'string');
  assert.deepEqual(
    new Set(action.enum),
    new Set(['status', 'set', 'validate', 'clear']),
  );
  assert.equal('anyOf' in action, false);
});

test('openspec_focus exposes one provider-safe string action enum', () => {
  const harness = new RuntimeHarness();
  const tool = harness.tools.get('openspec_focus');
  assert.ok(tool, 'openspec_focus should be registered');

  const action = tool.parameters.properties.action as {
    type?: string;
    enum?: unknown[];
    anyOf?: unknown;
  };
  assert.equal(action.type, 'string');
  assert.deepEqual(
    new Set(action.enum),
    new Set(['status', 'set', 'replace', 'clear']),
  );
  assert.equal('anyOf' in action, false);
});

test('conversation-driven Taskflow calls publish and clear controlled live activity', async () => {
  const intent = 'Consolidate proportional routing contracts';
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.tool('work_focus', { action: 'set', intent });
    await harness.emit('tool_call', {
      toolCallId: 'conversation-taskflow',
      toolName: 'taskflow',
      input: { action: 'run', name: 'enrichment', args: {} },
    });

    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'understanding',
      titles: [intent],
      color: 'accent',
      activity: { kind: 'planning' },
    });

    await harness.emit('tool_execution_end', {
      toolCallId: 'conversation-taskflow',
      toolName: 'taskflow',
      isError: false,
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'understanding',
      titles: [intent],
      color: 'accent',
    });
  } finally {
    await harness.stop();
  }
});

test('live Taskflow updates preserve focus and add bounded activity ancestry', async () => {
  const intent = 'Diagnose why profile edits are not applied';
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.tool('work_focus', { action: 'set', intent });
    await harness.emit('tool_call', {
      toolCallId: 'taskflow-live-phase',
      toolName: 'taskflow',
      input: { action: 'run', name: 'ramona-loop', args: {} },
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'understanding',
      titles: [intent],
      color: 'accent',
      activityPath: [
        {
          id: 'interpreting-intent',
          label: 'interpreting intent',
          compact: 'interpreting',
        },
      ],
    });

    await harness.emit('tool_execution_update', {
      toolCallId: 'taskflow-live-phase',
      toolName: 'taskflow',
      args: { action: 'run', name: 'ramona-loop', args: {} },
      partialResult: {
        content: [{ type: 'text', text: 'private live output' }],
        details: {
          action: 'run',
          state: {
            def: {
              phases: [
                { id: 'understanding' },
                { id: 'assuring' },
                { id: 'assuring-private-child' },
              ],
            },
            phases: {
              understanding: { status: 'done' },
              assuring: {
                status: 'running',
                promotedPhases: {
                  'assuring-private-child': { status: 'running' },
                },
              },
              'assuring-private-child': { status: 'running' },
            },
          },
        },
      },
    });

    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'assuring',
      titles: [intent],
      color: 'accent',
      activityPath: [
        { id: 'checking-quality', label: 'checking quality', compact: 'checking' },
      ],
    });
    assert.doesNotMatch(
      JSON.stringify(latestHeaderWork(harness)),
      /private live output|private-child/u,
    );

    await harness.emit('tool_execution_end', {
      toolCallId: 'taskflow-live-phase',
      toolName: 'taskflow',
      result: { content: [], details: {} },
      isError: false,
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'assuring',
      titles: [intent],
      color: 'accent',
    });
  } finally {
    await harness.stop();
  }
});

test('ordinary direct tools publish bounded activity until agent settle', async () => {
  const intent = 'Plan a greeting canary';
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.tool('work_focus', { action: 'set', intent });

    await harness.emit('tool_call', {
      toolCallId: 'direct-read',
      toolName: 'read',
      input: { path: '/private/project/plan.md' },
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'understanding',
      titles: [intent],
      color: 'accent',
      activity: { kind: 'inspection' },
    });
    assert.deepEqual(latestHeader(harness)?.selection, {
      source: 'session-work',
      titles: [intent],
      color: 'accent',
    });
    assert.equal(latestHeader(harness)?.suggestion, null);

    await harness.emit('tool_execution_end', {
      toolCallId: 'direct-read',
      toolName: 'read',
      isError: false,
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'understanding',
      titles: [intent],
      color: 'accent',
      activity: { kind: 'synthesis' },
    });

    await harness.emit('tool_call', {
      toolCallId: 'direct-write',
      toolName: 'write',
      input: { path: '/private/project/result.md', content: 'private prose' },
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'working',
      titles: [intent],
      color: 'accent',
      activity: { kind: 'mutation' },
    });

    await harness.emit('tool_execution_end', {
      toolCallId: 'direct-write',
      toolName: 'write',
      isError: false,
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'working',
      titles: [intent],
      color: 'accent',
      activity: { kind: 'change-review' },
    });

    await harness.emit('tool_call', {
      toolCallId: 'direct-verify',
      toolName: 'bash',
      input: { command: 'openspec validate private-change --strict' },
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'assuring',
      titles: [intent],
      color: 'accent',
      activity: { kind: 'verification' },
    });

    await harness.emit('tool_execution_end', {
      toolCallId: 'direct-verify',
      toolName: 'bash',
      isError: false,
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'assuring',
      titles: [intent],
      color: 'accent',
      activity: { kind: 'result-review' },
    });
    assert.equal(latestHeader(harness)?.suggestion, null);
    assert.doesNotMatch(
      JSON.stringify(latestHeaderWork(harness)),
      /private|\/project|result\.md/u,
    );

    await harness.emit('agent_settled', {});
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'waiting',
      titles: [intent],
      color: 'accent',
      activity: { kind: 'awaiting-input' },
    });
    assert.equal(latestHeader(harness)?.suggestion, 'requesting-input');
  } finally {
    await harness.stop();
  }
});

test('parallel direct tools stay active until completion and surface bounded recovery', async () => {
  const intent = 'Inspect two bounded inputs';
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.tool('work_focus', { action: 'set', intent });
    await harness.emit('tool_call', {
      toolCallId: 'parallel-read-one',
      toolName: 'read',
      input: { path: '/private/one.md' },
    });
    await harness.emit('tool_call', {
      toolCallId: 'parallel-read-two',
      toolName: 'read',
      input: { path: '/private/two.md' },
    });

    await harness.emit('tool_execution_end', {
      toolCallId: 'parallel-read-one',
      toolName: 'read',
      isError: false,
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'understanding',
      titles: [intent],
      color: 'accent',
      activity: { kind: 'inspection' },
    });

    await harness.emit('tool_execution_end', {
      toolCallId: 'parallel-read-two',
      toolName: 'read',
      isError: true,
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'working',
      titles: [intent],
      color: 'accent',
      activity: { kind: 'recovery' },
    });
    assert.doesNotMatch(JSON.stringify(latestHeaderWork(harness)), /private|\.md/u);
  } finally {
    await harness.stop();
  }
});

test('publishes only lifecycle-evidenced active child runs and subagents', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    const initialTitleCount = harness.titles.length;

    await harness.emit('tool_execution_start', {
      toolCallId: 'bash-active',
      toolName: 'bash',
      args: { command: 'private command' },
    });
    assert.deepEqual(latestHeader(harness)?.counters, {
      agents: { active: 0, total: 0 },
      activeRuns: { children: 1, subagents: 0 },
    });

    await harness.emit('tool_execution_start', {
      toolCallId: 'subagent-active',
      toolName: 'subagent',
      args: { calls: [{ agent: 'private-agent', prompt: 'private prompt' }] },
    });
    assert.deepEqual(latestHeader(harness)?.counters, {
      agents: { active: 0, total: 0 },
      activeRuns: { children: 1, subagents: 0 },
    });

    await harness.emit('tool_execution_update', {
      toolCallId: 'subagent-active',
      toolName: 'subagent',
      args: { calls: [] },
      partialResult: {
        content: [{ type: 'text', text: 'private child output' }],
        details: {
          kind: 'pi-subagent',
          results: [
            { exitCode: -1, agent: 'queued-agent', prompt: 'queued prompt' },
            {
              exitCode: -1,
              sawAgentStart: true,
              sawAgentSettled: false,
              agent: 'active-agent',
              prompt: 'active prompt',
            },
            {
              exitCode: -1,
              sawAgentStart: true,
              agent: 'second-active-agent',
              prompt: 'second active prompt',
            },
            {
              exitCode: 0,
              sawAgentStart: true,
              sawAgentSettled: true,
              agent: 'complete-agent',
              prompt: 'complete prompt',
            },
          ],
        },
      },
    });
    assert.deepEqual(latestHeader(harness)?.counters, {
      agents: { active: 0, total: 0 },
      activeRuns: { children: 3, subagents: 2 },
    });
    assert.doesNotMatch(
      JSON.stringify(latestHeader(harness)?.counters),
      /private|prompt|output|queued-agent|active-agent|complete-agent/u,
    );

    await harness.emit('tool_execution_end', {
      toolCallId: 'subagent-active',
      toolName: 'subagent',
      isError: false,
    });
    await harness.emit('tool_execution_end', {
      toolCallId: 'bash-active',
      toolName: 'bash',
      isError: false,
    });
    assert.deepEqual(latestHeader(harness)?.counters, {
      agents: { active: 0, total: 0 },
      activeRuns: { children: 0, subagents: 0 },
    });
    assert.equal(harness.titles.length, initialTitleCount);
  } finally {
    await harness.stop();
  }
});

test('unfocused direct tools publish an activity-only header bridge', async () => {
  const harness = new RuntimeHarness();
  const latestHeader = () =>
    [...harness.sharedEvents]
      .reverse()
      .find((event) => event.channel === 'galactica-status:header')?.message as
      { activity?: unknown; work?: unknown } | undefined;
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.emit('tool_call', {
      toolCallId: 'unfocused-read',
      toolName: 'read',
      input: { path: '/private/project/README.md' },
    });

    assert.deepEqual(latestHeader()?.work, {
      lifecycle: 'understanding',
      titles: [], // frozen contract: no narration
      color: 'accent',
      activity: { kind: 'inspection' },
    });
    assert.deepEqual(latestHeader()?.activity, { kind: 'inspection' });
    assert.doesNotMatch(JSON.stringify(latestHeader()), /private|project|README/u);

    await harness.emit('agent_settled', {});
    assert.equal(latestHeader()?.work, null);
    assert.equal(latestHeader()?.activity, null);
  } finally {
    await harness.stop();
  }
});

test('Goal session state drives safe header identity and Human-validation waiting', async () => {
  const harness = new RuntimeHarness({
    entries: [
      {
        type: 'custom',
        customType: 'galactica-status.session-work.v1',
        data: { state: 'active', intent: 'Stale Session Work' },
      },
      goalStateEntry('active', {
        automaticModelTurns: 2,
        text: 'Inspect /private/objective without exposing it',
      }),
    ],
  });
  try {
    await harness.emit('session_start', { reason: 'startup' });
    assert.equal(harness.titles.at(-1), 'π  Goal');
    assert.equal(latestWorkFooterMessage(harness), undefined);
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'working',
      titles: ['Goal'],
      color: 'accent',
      activityPath: [{ id: 'goal-work', label: 'completing Goal', compact: 'Goal' }],
    });

    await harness.emit('before_agent_start', {
      prompt: 'private Goal continuation prompt',
      systemPrompt: 'Base prompt',
    });
    assert.equal(
      (latestHeaderWork(harness) as { lifecycle?: string } | undefined)?.lifecycle,
      'understanding',
    );

    harness.entries.push(
      goalStateEntry('complete', {
        automaticModelTurns: 2,
        text: 'Inspect /private/objective without exposing it',
      }),
    );
    await harness.emit('tool_execution_end', {
      toolCallId: 'goal-complete',
      toolName: 'goal_complete',
      result: { content: [{ type: 'text', text: 'private completion summary' }] },
      isError: false,
    });
    await new Promise<void>((resolve) => setImmediate(resolve));

    assert.equal(harness.titles.at(-1), 'π  Validate › Goal');
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'waiting',
      titles: ['Goal'],
      color: 'warning',
      activityPath: [
        {
          id: 'awaiting-human-validation',
          label: 'awaiting Human validation',
          compact: 'validation',
        },
      ],
    });
    assert.doesNotMatch(
      JSON.stringify(latestHeaderWork(harness)),
      /private|objective|completion summary/u,
    );
  } finally {
    await harness.stop();
  }
});

test('Goal polling notices idle slash-command clear without enabling RPC', async () => {
  const harness = new RuntimeHarness({ entries: [goalStateEntry('paused')] });
  try {
    await harness.emit('session_start', { reason: 'startup' });
    assert.equal(harness.titles.at(-1), 'π  Goal › paused');

    harness.entries.push(goalStateEntry(null));
    await waitFor(
      () => harness.titles.at(-1) !== 'π  Goal › paused',
      () => titleDiagnostics(harness),
      1_200,
    );

    assert.equal(latestHeaderWork(harness), null);
  } finally {
    await harness.stop();
  }
});

test('stopped Goal title yields automatically on normal Pi input and returns on resume', async () => {
  const harness = new RuntimeHarness({
    entries: [goalStateEntry('budget_limited', { automaticModelTurns: 4 })],
  });
  try {
    await harness.emit('session_start', { reason: 'startup' });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'waiting',
      titles: ['Goal'],
      color: 'dim',
      activityPath: [
        {
          id: 'goal-budget-limited',
          label: 'Goal budget limited',
          compact: 'budget limit',
        },
      ],
    });

    const entriesBeforeNormalTurn = harness.entries.length;
    await harness.emit('before_agent_start', {
      prompt: 'APPROVE',
      systemPrompt: 'Base prompt',
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'understanding',
      titles: [], // frozen contract: no narration
      color: 'accent',
      activity: { kind: 'understanding' },
    });
    assert.equal(
      harness.entries.length,
      entriesBeforeNormalTurn,
      'automatic title projection must not mutate Goal or focus state',
    );

    await harness.emit('agent_settled', {});
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(latestHeaderWork(harness), null);

    harness.entries.push(
      goalStateEntry('active', { automaticModelTurns: 0, id: 'goal-1' }),
    );
    await harness.emit('before_agent_start', {
      prompt:
        'Resume Goal\n<!-- pi-goal-prompt:ffe5a524-6bb8-4b87-b3d3-57fea9fc9797 -->',
      systemPrompt: 'Base prompt',
    });
    assert.equal(harness.titles.at(-1), 'π  Goal');
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'understanding',
      titles: ['Goal'],
      color: 'accent',
      activityPath: [{ id: 'goal-work', label: 'completing Goal', compact: 'Goal' }],
    });
  } finally {
    await harness.stop();
  }
});

test('rich lifecycle reports understanding, answering, abort, and next-turn reset', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.emit('before_agent_start', {
      prompt: 'Private Human wording must not become focus',
      systemPrompt: 'Base prompt',
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'understanding',
      titles: [], // frozen contract: no narration
      color: 'accent',
      activity: { kind: 'understanding' },
    });

    await harness.emit('message_update', {
      message: {
        role: 'assistant',
        content: [{ type: 'text', text: 'Bounded answer' }],
      },
      assistantMessageEvent: { type: 'text_delta', delta: 'Bounded answer' },
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'answering',
      titles: [], // frozen contract: no narration
      color: 'accent',
    });

    const aborted = {
      role: 'assistant',
      content: [],
      stopReason: 'aborted',
    };
    await harness.emit('turn_end', {
      turnIndex: 0,
      message: aborted,
      toolResults: [],
    });
    await harness.emit('agent_settled', {});
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'aborted',
      titles: [], // frozen contract: no narration
      color: 'accent',
      activity: { kind: 'operation-aborted' },
    });

    await harness.emit('before_agent_start', {
      prompt: 'Next private request',
      systemPrompt: 'Base prompt',
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'understanding',
      titles: [], // frozen contract: no narration
      color: 'accent',
      activity: { kind: 'understanding' },
    });
    assert.doesNotMatch(
      JSON.stringify(latestHeaderWork(harness)),
      /Private Human|Next private/u,
    );
  } finally {
    await harness.stop();
  }
});

test('status package leaves generic routing to native Ramona policy', async () => {
  const parent = new RuntimeHarness();
  try {
    await parent.emit('session_start', { reason: 'startup' });
    const guided = await parent.emit('before_agent_start', {
      prompt: 'Research workflow routing',
      systemPrompt: 'Base prompt',
    });
    assert.equal(guided, undefined);
    assert.equal(
      await parent.emit('tool_call', {
        toolCallId: 'parent-read',
        toolName: 'read',
        input: { path: 'README.md' },
      }),
      undefined,
    );
  } finally {
    await parent.stop();
  }
});

test('generic outer and legacy none placeholders create no status focus side effect', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    for (const input of [
      {
        action: 'run',
        name: 'enrichment',
        args: { request: 'Research workflow routing' },
      },
      {
        action: 'run',
        name: 'enrichment',
        args: { change: 'none', task: 'none' },
      },
    ]) {
      assert.equal(
        await harness.emit('tool_call', {
          toolCallId: 'generic-work-loop',
          toolName: 'taskflow',
          input,
        }),
        undefined,
      );
    }
    assert.deepEqual(harness.entries, []);
    assert.equal(
      taskflowRunFocus({ action: 'run', args: { change: 'none', task: 'none' } }),
      undefined,
    );
  } finally {
    await harness.stop();
  }
});

test('specialized Taskflow focus remains exact and conflict-aware', async () => {
  const harness = new RuntimeHarness();
  const input = {
    action: 'run',
    name: 'ramona-fix',
    args: { change, task: taskId },
  };
  try {
    await harness.emit('session_start', { reason: 'startup' });
    assert.deepEqual(taskflowRunFocus(input), {
      mode: 'task',
      change,
      taskId,
    });
    assert.equal(
      await harness.emit('tool_call', {
        toolCallId: 'specialized-flow',
        toolName: 'taskflow',
        input,
      }),
      undefined,
    );
    assert.deepEqual(harness.entries.at(-1)?.data, {
      mode: 'task',
      change,
      taskId,
    });
  } finally {
    await harness.stop();
  }
});

test('/work persists active, validation, and clear metadata with matching UI state', async () => {
  const intent = 'Implement ephemeral Session Work metadata';
  const harness = new RuntimeHarness({ sessionName: 'Fallback session' });
  try {
    await harness.emit('session_start', { reason: 'startup' });
    assert.equal(latestWorkFooterMessage(harness), undefined);

    await harness.command('work', `set ${intent}`);
    assert.deepEqual(harness.entries.at(-1), {
      type: 'custom',
      id: 'entry-1',
      parentId: null,
      timestamp: new Date(1).toISOString(),
      customType: 'galactica-status.session-work.v1',
      data: { state: 'active', intent },
    });
    assert.equal(harness.titles.at(-1), `π  ${intent}`);
    assert.equal(openSpecFooterText(latestWorkFooterMessage(harness)), 'Focus');

    await harness.command('work', 'validate');
    assert.deepEqual(harness.entries.at(-1)?.data, {
      state: 'validation',
      intent,
    });
    assert.equal(harness.titles.at(-1), `π  Validate › ${intent}`);
    assert.equal(openSpecFooterText(latestWorkFooterMessage(harness)), 'Validate');

    await harness.command('work', 'clear');
    assert.deepEqual(harness.entries.at(-1)?.data, { state: 'clear' });
    assert.equal(harness.titles.at(-1), 'π  Fallback session');
    assert.equal(openSpecFooterText(latestWorkFooterMessage(harness)), undefined);
  } finally {
    await harness.stop();
  }
});

test('reload restores Session Work validation metadata before asynchronous refresh', async () => {
  const intent = 'Validate persistent Session Work metadata';
  const first = new RuntimeHarness();
  try {
    await first.emit('session_start', { reason: 'startup' });
    await first.command('work', `set ${intent}`);
    await first.command('work', 'validate');
  } finally {
    await first.stop();
  }

  const reloaded = new RuntimeHarness({
    entries: first.entries,
    sessionName: 'Fallback session',
  });
  try {
    const starting = reloaded.emit('session_start', { reason: 'reload' });
    assert.equal(reloaded.titles[0], `π  Validate › ${intent}`);
    assert.equal(openSpecFooterText(latestWorkFooterMessage(reloaded)), 'Validate');
    await starting;
    assert.equal(reloaded.titles.at(-1), `π  Validate › ${intent}`);
  } finally {
    await reloaded.stop();
  }
});

test('non-persisted Session Work remains process-local without resume durability', async () => {
  const intent = 'Keep ephemeral work in this process';
  const active = new RuntimeHarness({ persisted: false });
  try {
    assert.equal(active.context.sessionManager.getSessionFile(), undefined);
    await active.emit('session_start', { reason: 'startup' });
    await active.command('work', `set ${intent}`);

    const status = await active.tool('work_focus', { action: 'status' });
    assert.deepEqual(status.details.focus, { state: 'active', intent });
    assert.deepEqual(active.entries.at(-1)?.data, { state: 'active', intent });
  } finally {
    await active.stop();
  }

  const restarted = new RuntimeHarness({ persisted: false });
  try {
    await restarted.emit('session_start', { reason: 'startup' });
    const status = await restarted.tool('work_focus', { action: 'status' });

    assert.deepEqual(status.details.focus, { state: 'clear' });
    assert.deepEqual(restarted.entries, []);
  } finally {
    await restarted.stop();
  }
});

test('work_focus tool restores branch metadata and rejects hidden work under OpenSpec', async () => {
  const intent = 'Investigate an ad-hoc session concern';
  const harness = new RuntimeHarness({ sessionName: 'Fallback session' });
  try {
    await harness.emit('session_start', { reason: 'startup' });
    const setResult = await harness.tool('work_focus', {
      action: 'set',
      intent,
    });
    assert.equal(setResult.details.ok, true);
    assert.deepEqual(setResult.details.focus, { state: 'active', intent });

    await harness.command('openspec-focus', `set ${change} ${taskId}`);
    assert.deepEqual(
      harness.entries.slice(-2).map((entry) => ({
        customType: entry.customType,
        data: entry.data,
      })),
      [
        {
          customType: 'galactica-status.session-work.v1',
          data: { state: 'clear' },
        },
        {
          customType: 'galactica-status.openspec-focus.v1',
          data: { mode: 'task', change, taskId },
        },
      ],
      'OpenSpec acquisition must clear ephemeral work before taking precedence',
    );

    const entriesBeforeConflict = harness.entries.length;
    const conflict = await harness.tool('work_focus', {
      action: 'set',
      intent: 'Hidden conflicting work',
    });
    assert.equal(conflict.details.ok, false);
    assert.match(conflict.content[0].text, /Error: OpenSpec focus/u);
    assert.equal(harness.entries.length, entriesBeforeConflict);
  } finally {
    await harness.stop();
  }

  assert.deepEqual(restoreSessionWorkFocus(harness.entries), { state: 'clear' });
});

test('session work normalization rejects empty intent and bounds hostile metadata', () => {
  assert.equal(sessionWorkFocus('active', '   '), undefined);
  assert.equal(sessionWorkFocus('unknown', 'intent'), undefined);
  const focus = sessionWorkFocus(
    'active',
    `  Work\n\u0007 ${'🧪'.repeat(500)} FORBIDDEN-SUFFIX  `,
  );
  assert.equal(focus?.state, 'active');
  if (focus?.state !== 'active') assert.fail('expected active focus');
  assert.doesNotMatch(focus.intent, /[\u0000-\u001f\u007f]/u);
  assert.equal(Array.from(focus.intent).length, 160);
  assert.ok(focus.intent.endsWith('…'));
  assert.doesNotMatch(focus.intent, /FORBIDDEN-SUFFIX/u);
});

test('session subject normalization rejects empty titles and bounds hostile metadata', () => {
  assert.equal(sessionSubject('set', '   '), undefined);
  assert.equal(sessionSubject('unknown', 'title'), undefined);
  assert.equal(sessionSubject('clear'), NO_SESSION_SUBJECT);
  const subject = sessionSubject(
    'set',
    `  Subject\n\u0007 ${'🧪'.repeat(500)} FORBIDDEN-SUFFIX  `,
  );
  assert.equal(subject?.state, 'set');
  if (subject?.state !== 'set') assert.fail('expected set subject');
  assert.doesNotMatch(subject.title, /[\u0000-\u001f\u007f]/u);
  assert.equal(Array.from(subject.title).length, 120);
  assert.ok(subject.title.endsWith('…'));
  assert.doesNotMatch(subject.title, /FORBIDDEN-SUFFIX/u);
});

test('restoreSessionSubject prefers the latest valid subject entry', () => {
  const entries = [
    {
      type: 'custom',
      customType: 'galactica-status.session-subject.v1',
      data: { state: 'set', title: 'First subject' },
    },
    {
      type: 'custom',
      customType: 'galactica-status.session-work.v1',
      data: { state: 'active', intent: 'Work' },
    },
    {
      type: 'custom',
      customType: 'galactica-status.session-subject.v1',
      data: { state: 'set', title: 'Latest subject' },
    },
    {
      type: 'custom',
      customType: 'galactica-status.session-subject.v1',
      data: { state: 'invalid' },
    },
  ];
  assert.deepEqual(restoreSessionSubject(entries), {
    state: 'set',
    title: 'Latest subject',
  });
  assert.deepEqual(restoreSessionSubject([]), NO_SESSION_SUBJECT);
});

test('subject tool persists sanitized subjects and restores them on resume', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });

    const missing = await harness.tool('subject', { action: 'set', title: '   ' });
    assert.equal(missing.details.ok, false);
    assert.match(missing.content[0].text, /requires a non-empty title/u);

    const set = await harness.tool('subject', {
      action: 'set',
      title: '  Shape the never-empty focus row  ',
    });
    assert.equal(set.details.ok, true);
    assert.deepEqual(set.details.subject, {
      state: 'set',
      title: 'Shape the never-empty focus row',
    });

    const stable = await harness.tool('subject', {
      action: 'set',
      title: 'Shape the never-empty focus row',
    });
    assert.equal(stable.details.ok, true);

    const status = await harness.tool('subject', { action: 'status' });
    assert.equal(
      status.content[0].text,
      'Session subject: Shape the never-empty focus row',
    );

    const subjectEntries = harness.entries.filter(
      (entry) => entry.customType === 'galactica-status.session-subject.v1',
    );
    assert.equal(subjectEntries.length, 1);
  } finally {
    await harness.stop();
  }

  assert.deepEqual(restoreSessionSubject(harness.entries), {
    state: 'set',
    title: 'Shape the never-empty focus row',
  });
});

test('subject titles fill the fallback before session name and yield to work', () => {
  const common = {
    focus: { mode: 'none' } as const,
    projectRoot: '/repos/repository-choice',
    cwd: '/work/cwd-choice',
    sessionName: 'Fallback session',
  };
  const subject = { state: 'set', title: 'Session subject' } as const;

  assert.equal(formatActiveWorkTitle({ ...common, subject }), 'π  Session subject');
  assert.equal(
    formatActiveWorkTitle({
      ...common,
      subject,
      workFocus: { state: 'active', intent: 'Ephemeral work' },
    }),
    'π  Ephemeral work',
  );
  assert.equal(
    formatActiveWorkTitle({
      ...common,
      subject,
      focus: { mode: 'task', change, taskId },
    }),
    `π  ${change} › ${taskId}`,
  );
});

test('openspec_focus shares safeguarded branch transitions with the slash command', async () => {
  const intent = 'Clear this work when OpenSpec focus is acquired';
  const toolHarness = new RuntimeHarness();
  const commandHarness = new RuntimeHarness();
  const branchState = (harness: RuntimeHarness) =>
    harness.entries.map(({ customType, data }) => ({ customType, data }));

  try {
    await toolHarness.emit('session_start', { reason: 'startup' });

    const initialStatus = await toolHarness.tool('openspec_focus', {
      action: 'status',
    });
    assert.equal(initialStatus.details.ok, true);
    assert.deepEqual(initialStatus.details.focus, { mode: 'none' });
    assert.equal(toolHarness.entries.length, 0);

    for (const params of [
      { action: 'set', change },
      { action: 'set', change, task: '   ' },
      { action: 'replace', task: replacementTaskId },
    ]) {
      const invalid = await toolHarness.tool('openspec_focus', params);
      assert.equal(invalid.details.ok, false);
      assert.match(invalid.content[0].text, /Error:.*change and task/iu);
      assert.equal(toolHarness.entries.length, 0);
    }

    await toolHarness.tool('work_focus', { action: 'set', intent });
    const acquired = await toolHarness.tool('openspec_focus', {
      action: 'set',
      change,
      task: taskId,
    });
    assert.equal(acquired.details.ok, true);
    assert.deepEqual(acquired.details.focus, { mode: 'task', change, taskId });
    assert.deepEqual(branchState(toolHarness).slice(-2), [
      {
        customType: 'galactica-status.session-work.v1',
        data: { state: 'clear' },
      },
      {
        customType: 'galactica-status.openspec-focus.v1',
        data: { mode: 'task', change, taskId },
      },
    ]);

    const entriesBeforeConflict = toolHarness.entries.length;
    const conflict = await toolHarness.tool('openspec_focus', {
      action: 'set',
      change: replacementChange,
      task: replacementTaskId,
    });
    assert.equal(conflict.details.ok, false);
    assert.match(conflict.content[0].text, /Error:.*use replace/iu);
    assert.equal(toolHarness.entries.length, entriesBeforeConflict);

    const replaced = await toolHarness.tool('openspec_focus', {
      action: 'replace',
      change: replacementChange,
      task: replacementTaskId,
    });
    assert.equal(replaced.details.ok, true);
    assert.deepEqual(replaced.details.focus, {
      mode: 'task',
      change: replacementChange,
      taskId: replacementTaskId,
    });

    const cleared = await toolHarness.tool('openspec_focus', { action: 'clear' });
    assert.equal(cleared.details.ok, true);
    assert.deepEqual(cleared.details.focus, { mode: 'none' });
    assert.deepEqual(toolHarness.entries.at(-1)?.data, { mode: 'none' });

    const entriesAfterClear = toolHarness.entries.length;
    const clearedStatus = await toolHarness.tool('openspec_focus', {
      action: 'status',
    });
    assert.deepEqual(clearedStatus.details.focus, { mode: 'none' });
    assert.equal(toolHarness.entries.length, entriesAfterClear);

    await commandHarness.emit('session_start', { reason: 'startup' });
    await commandHarness.command('work', `set ${intent}`);
    await commandHarness.command('openspec-focus', `set ${change} ${taskId}`);
    await commandHarness.command(
      'openspec-focus',
      `replace ${replacementChange} ${replacementTaskId}`,
    );
    await commandHarness.command('openspec-focus', 'clear');

    assert.deepEqual(
      branchState(toolHarness),
      branchState(commandHarness),
      'tool and slash command must append equivalent branch-local state',
    );
  } finally {
    await toolHarness.stop();
    await commandHarness.stop();
  }
});

test('/openspec-focus set acquires focus and replace changes it explicitly', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });

    await harness.command('openspec-focus', `set ${change} ${taskId}`);
    assert.deepEqual(harness.entries.at(-1)?.data, {
      mode: 'task',
      change,
      taskId,
    });
    await waitFor(
      () => harness.titles.includes(activeTitle),
      () => titleDiagnostics(harness),
    );

    await harness.command(
      'openspec-focus',
      `replace ${replacementChange} ${replacementTaskId}`,
    );
    assert.deepEqual(harness.entries.at(-1)?.data, {
      mode: 'task',
      change: replacementChange,
      taskId: replacementTaskId,
    });
    await waitFor(
      () => harness.titles.includes(replacementActiveTitle),
      () => titleDiagnostics(harness),
    );
    assert.equal(harness.titles.at(-1), replacementActiveTitle);
  } finally {
    await harness.stop();
  }
});

test('conflicting /openspec-focus set requires explicit replace', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.command('openspec-focus', `set ${change} ${taskId}`);
    await waitFor(
      () => harness.titles.includes(activeTitle),
      () => titleDiagnostics(harness),
    );
    const originalFocusEntry = harness.entries.at(-1);

    await harness.command(
      'openspec-focus',
      `set ${replacementChange} ${replacementTaskId}`,
    );

    assert.equal(
      harness.entries.at(-1),
      originalFocusEntry,
      'conflicting set must not persist a replacement focus',
    );
    assert.deepEqual(originalFocusEntry?.data, { mode: 'task', change, taskId });
    assert.equal(harness.titles.at(-1), activeTitle);

    await harness.command(
      'openspec-focus',
      `replace ${replacementChange} ${replacementTaskId}`,
    );
    assert.deepEqual(harness.entries.at(-1)?.data, {
      mode: 'task',
      change: replacementChange,
      taskId: replacementTaskId,
    });
    await waitFor(
      () => harness.titles.includes(replacementActiveTitle),
      () => titleDiagnostics(harness),
    );
    assert.equal(harness.titles.at(-1), replacementActiveTitle);
  } finally {
    await harness.stop();
  }
});

test('deliver-change Taskflow focus requires run with string nested change and task values', async (t) => {
  const cases = [
    {
      name: 'status action with nested values',
      input: {
        name: 'deliver-change',
        action: 'status',
        args: { change, task: taskId },
      },
    },
    {
      name: 'resume action with nested values',
      input: {
        name: 'deliver-change',
        action: 'resume',
        args: { change, task: taskId },
      },
    },
    {
      name: 'missing nested change',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { task: taskId },
      },
    },
    {
      name: 'missing nested task',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change },
      },
    },
    {
      name: 'non-string nested change',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change: 42, task: taskId },
      },
    },
    {
      name: 'non-string nested task',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change, task: 42 },
      },
    },
    {
      name: 'top-level change and task',
      input: {
        name: 'deliver-change',
        action: 'run',
        change,
        task: taskId,
      },
    },
  ] as const;

  for (const scenario of cases) {
    await t.test(scenario.name, async () => {
      const harness = new RuntimeHarness({ sessionName: 'No Taskflow focus' });
      try {
        await harness.emit('session_start', { reason: 'startup' });
        const result = await harness.emit('tool_call', {
          toolCallId: `taskflow-negative-${scenario.name}`,
          toolName: 'taskflow',
          input: scenario.input,
        });

        assert.equal(result, undefined);
        assert.deepEqual(harness.entries, []);
        assert.equal(harness.titles.at(-1), 'π  No Taskflow focus');
      } finally {
        await harness.stop();
      }
    });
  }
});

test('malformed Taskflow run inputs preserve an existing focused session', async (t) => {
  const cases = [
    {
      name: 'missing nested change',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { task: taskId },
      },
    },
    {
      name: 'missing nested task',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change },
      },
    },
    {
      name: 'non-string nested change',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change: 42, task: taskId },
      },
    },
    {
      name: 'non-string nested task',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change, task: 42 },
      },
    },
    {
      name: 'top-level-only change and task',
      input: {
        name: 'deliver-change',
        action: 'run',
        change,
        task: taskId,
      },
    },
  ] as const;

  for (const scenario of cases) {
    await t.test(scenario.name, async () => {
      const harness = new RuntimeHarness();
      try {
        await harness.emit('session_start', { reason: 'startup' });
        await harness.emit('tool_call', {
          toolCallId: `taskflow-focus-${scenario.name}`,
          toolName: 'taskflow',
          input: {
            name: 'deliver-change',
            action: 'run',
            args: { change, task: taskId },
          },
        });
        await harness.command('galactica-status-refresh', '');

        assert.equal(harness.titles.at(-1), activeTitle);
        const focusEntry = harness.entries.at(-1);
        const focusedTitle = harness.titles.at(-1);
        const focusedFooter = latestOpenSpecFooterMessage(harness);
        assert.ok(
          typeof focusedFooter === 'object' &&
            focusedFooter !== null &&
            'type' in focusedFooter &&
            focusedFooter.type === 'upsert',
          `${scenario.name} setup should publish the focused OpenSpec footer`,
        );

        const result = await harness.emit('tool_call', {
          toolCallId: `taskflow-malformed-${scenario.name}`,
          toolName: 'taskflow',
          input: scenario.input,
        });

        assert.equal(result, undefined);
        assert.equal(harness.entries.at(-1), focusEntry);
        assert.deepEqual(focusEntry?.data, { mode: 'task', change, taskId });
        assert.equal(harness.titles.at(-1), focusedTitle);
        assert.deepEqual(latestOpenSpecFooterMessage(harness), focusedFooter);
      } finally {
        await harness.stop();
      }
    });
  }
});

test('nameless Taskflow focus propagates the resolved title once and rejects a conflict', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    assert.equal(harness.titles[0], 'π  galactica');

    const requestedFocus = {
      action: 'run',
      args: { change, task: taskId },
    };
    const accepted = await harness.emit('tool_call', {
      toolCallId: 'taskflow-1',
      toolName: 'taskflow',
      input: requestedFocus,
    });

    assert.equal((accepted as { block?: boolean } | undefined)?.block, undefined);
    assert.deepEqual(harness.entries.at(-1)?.data, {
      mode: 'task',
      change,
      taskId,
    });

    await waitFor(
      () => harness.titles.includes(activeTitle),
      () => titleDiagnostics(harness),
    );
    assert.equal(harness.titles.at(-1), activeTitle);

    const beforeRefresh = harness.titles.length;
    await harness.command('galactica-status-refresh', '');
    assert.equal(harness.titles.length, beforeRefresh);

    const conflict = await harness.emit('tool_call', {
      toolCallId: 'taskflow-2',
      toolName: 'taskflow',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change: 'another-change', task: '2.1' },
      },
    });
    assert.equal((conflict as { block?: boolean } | undefined)?.block, true);
    assert.match(
      (conflict as { reason?: string } | undefined)?.reason ?? '',
      /focus|clear|replace/iu,
    );
  } finally {
    await harness.stop();
  }
});

test('Taskflow success, pause, and approval waiting preserve focus, title, and footer', async (t) => {
  const cases = [
    {
      name: 'success with completed focused-task metadata',
      focusedTaskDone: true,
      eventName: 'tool_result',
      event: {
        toolCallId: 'taskflow-success',
        toolName: 'taskflow',
        input: {
          name: 'deliver-change',
          action: 'run',
          args: { change, task: taskId },
        },
        content: [{ type: 'text', text: 'Taskflow completed' }],
        details: { action: 'run', state: { status: 'completed' } },
        isError: false,
      },
    },
    {
      name: 'pause',
      focusedTaskDone: false,
      eventName: 'tool_result',
      event: {
        toolCallId: 'taskflow-paused',
        toolName: 'taskflow',
        input: {
          name: 'deliver-change',
          action: 'run',
          args: { change, task: taskId },
        },
        content: [{ type: 'text', text: 'Taskflow paused' }],
        details: { action: 'run', state: { status: 'paused' } },
        isError: true,
      },
    },
    {
      name: 'approval waiting',
      focusedTaskDone: false,
      eventName: 'tool_execution_update',
      event: {
        toolCallId: 'taskflow-approval',
        toolName: 'taskflow',
        args: {
          name: 'deliver-change',
          action: 'run',
          args: { change, task: taskId },
        },
        partialResult: {
          content: [{ type: 'text', text: 'Waiting for approval' }],
          details: {
            action: 'run',
            state: {
              status: 'running',
              phases: {
                'approve-red': { type: 'approval', status: 'pending' },
              },
            },
          },
        },
      },
    },
  ] as const;

  for (const scenario of cases) {
    await t.test(scenario.name, async () => {
      const harness = new RuntimeHarness({
        focusedTaskDone: scenario.focusedTaskDone,
      });
      try {
        await harness.emit('session_start', { reason: 'startup' });
        await harness.emit('tool_call', {
          toolCallId: `taskflow-${scenario.name}-focus`,
          toolName: 'taskflow',
          input: {
            name: 'deliver-change',
            action: 'run',
            args: { change, task: taskId },
          },
        });
        await waitFor(
          () => harness.titles.includes(activeTitle),
          () => titleDiagnostics(harness),
        );
        const focusEntry = harness.entries.at(-1);
        const footer = latestOpenSpecFooterMessage(harness);
        assert.ok(
          typeof footer === 'object' &&
            footer !== null &&
            'type' in footer &&
            footer.type === 'upsert',
          `${scenario.name} setup should publish the focused OpenSpec footer`,
        );

        await harness.emit(scenario.eventName, scenario.event);

        assert.equal(harness.entries.at(-1), focusEntry);
        assert.deepEqual(focusEntry?.data, { mode: 'task', change, taskId });
        assert.equal(
          harness.titles.at(-1),
          activeTitle,
          `${scenario.name} should retain the metadata-resolved task headline`,
        );
        assert.deepEqual(latestOpenSpecFooterMessage(harness), footer);
      } finally {
        await harness.stop();
      }
    });
  }
});

test('unrelated and failed or blocked Taskflow-adjacent events retain focus', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.emit('tool_call', {
      toolCallId: 'taskflow-1',
      toolName: 'taskflow',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change, task: taskId },
      },
    });
    await waitFor(
      () => harness.titles.includes(activeTitle),
      () => titleDiagnostics(harness),
    );
    const focusEntry = harness.entries.at(-1);

    await harness.emit('tool_call', {
      toolCallId: 'read-1',
      toolName: 'read',
      input: { path: 'README.md' },
    });
    await harness.emit('tool_call', {
      toolCallId: 'taskflow-status',
      toolName: 'taskflow',
      input: { action: 'status', runId: 'failed-run' },
    });
    await harness.emit('tool_result', {
      toolCallId: 'taskflow-1',
      toolName: 'taskflow',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change, task: taskId },
      },
      content: [{ type: 'text', text: 'verification failed' }],
      details: { state: 'failed' },
      isError: true,
    });
    const blocked = await harness.emit('tool_call', {
      toolCallId: 'taskflow-blocked',
      toolName: 'taskflow',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change: replacementChange, task: replacementTaskId },
      },
    });

    assert.equal((blocked as { block?: boolean } | undefined)?.block, true);
    assert.equal(harness.entries.at(-1), focusEntry);
    assert.deepEqual(focusEntry?.data, { mode: 'task', change, taskId });
    assert.equal(harness.titles.at(-1), activeTitle);
  } finally {
    await harness.stop();
  }
});

test('clear persists no focus and returns the title and footer to fallback', async () => {
  const first = new RuntimeHarness({ sessionName: 'Fallback title' });
  try {
    await first.emit('session_start', { reason: 'startup' });
    await first.emit('tool_call', {
      toolCallId: 'taskflow-1',
      toolName: 'taskflow',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change, task: taskId },
      },
    });
    await waitFor(
      () => first.titles.includes(activeTitle),
      () => titleDiagnostics(first),
    );

    await first.command('openspec-focus', 'clear');

    assert.deepEqual(first.entries.at(-1)?.data, { mode: 'none' });
    assert.equal(first.titles.at(-1), 'π  Fallback title');
    assert.ok(
      first.sharedEvents.some(
        ({ message }) =>
          typeof message === 'object' &&
          message !== null &&
          'type' in message &&
          message.type === 'remove' &&
          'id' in message &&
          message.id === 'galactica.openspec',
      ),
      'clearing focus should remove the OpenSpec footer widget',
    );
  } finally {
    await first.stop();
  }

  const reloaded = new RuntimeHarness({
    sessionName: 'Fallback title',
    entries: first.entries,
  });
  try {
    const starting = reloaded.emit('session_start', { reason: 'reload' });
    assert.equal(reloaded.titles[0], 'π  Fallback title');
    await starting;
    assert.equal(reloaded.titles.at(-1), 'π  Fallback title');
    assert.doesNotMatch(reloaded.titles.join('\n'), new RegExp(change, 'u'));
  } finally {
    await reloaded.stop();
  }
});

test('reload restores IDs before progressing to the metadata-resolved title', async () => {
  const first = new RuntimeHarness();
  try {
    await first.emit('session_start', { reason: 'startup' });
    await first.emit('tool_call', {
      toolCallId: 'taskflow-1',
      toolName: 'taskflow',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change, task: taskId },
      },
    });
    assert.equal(first.entries.at(-1)?.data?.mode, 'task');
  } finally {
    await first.stop();
  }

  const reloaded = new RuntimeHarness({ entries: first.entries });
  try {
    const starting = reloaded.emit('session_start', { reason: 'reload' });
    assert.equal(
      reloaded.titles[0],
      `π  ${change} › ${taskId}`,
      'restored explicit IDs should be visible without waiting for task metadata',
    );
    await starting;
    await waitFor(
      () => reloaded.titles.includes(activeTitle),
      () => titleDiagnostics(reloaded),
    );
    assert.equal(reloaded.titles.at(-1), activeTitle);
  } finally {
    await reloaded.stop();
  }
});

test('tree navigation restores the selected branch focus', async () => {
  const root = {
    type: 'message',
    id: 'root',
    parentId: null,
    timestamp: new Date(1).toISOString(),
    message: { role: 'user', content: 'Choose work' },
  };
  const focused = {
    type: 'custom',
    id: 'focused',
    parentId: root.id,
    timestamp: new Date(2).toISOString(),
    customType: 'galactica-status.openspec-focus.v1',
    data: { mode: 'task', change, taskId },
  };
  const cleared = {
    type: 'custom',
    id: 'cleared',
    parentId: root.id,
    timestamp: new Date(3).toISOString(),
    customType: 'galactica-status.openspec-focus.v1',
    data: { mode: 'none' },
  };
  const harness = new RuntimeHarness({
    sessionName: 'Branch fallback',
    entries: [root, focused, cleared],
  });
  try {
    harness.navigateToBranch([root, focused]);
    await harness.emit('session_start', { reason: 'resume' });
    assert.equal(harness.titles[0], `π  ${change} › ${taskId}`);

    harness.navigateToBranch([root, cleared]);
    await harness.emit('session_tree', {
      oldLeafId: focused.id,
      newLeafId: cleared.id,
    });

    assert.equal(harness.titles.at(-1), 'π  Branch fallback');
  } finally {
    await harness.stop();
  }
});

test('fallback titles use distinguishable session, repository, then cwd precedence', () => {
  const common = {
    focus: { mode: 'none' } as const,
    projectRoot: '/repos/repository-choice',
    cwd: '/work/cwd-choice',
  };

  assert.equal(
    formatActiveWorkTitle({ ...common, sessionName: 'session choice' }),
    'π  session choice',
  );
  assert.equal(formatActiveWorkTitle(common), 'π  repository-choice');
  assert.equal(
    formatActiveWorkTitle({ focus: common.focus, cwd: common.cwd }),
    'π  cwd-choice',
  );
});

test('OpenSpec, Session Work, and fallback title precedence stays explicit', () => {
  const common = {
    workFocus: { state: 'active', intent: 'Ephemeral work' } as const,
    sessionName: 'Fallback session',
    cwd: '/work/cwd-choice',
  };

  assert.equal(
    formatActiveWorkTitle({ focus: { mode: 'none' }, ...common }),
    'π  Ephemeral work',
  );
  assert.equal(
    formatActiveWorkTitle({
      focus: { mode: 'task', change, taskId },
      ...common,
    }),
    `π  ${change} › ${taskId}`,
  );
});

test('OpenSpec stays authoritative while Goal safely replaces Session Work title focus', () => {
  const common = {
    workFocus: { state: 'active', intent: 'Stale session work' } as const,
    goal: {
      id: 'goal-1',
      status: 'active',
      automaticModelTurns: 1,
      waiting: false,
    } as const,
    sessionName: 'Fallback session',
    cwd: '/work/cwd-choice',
  };

  assert.equal(
    formatActiveWorkTitle({ focus: { mode: 'none' }, ...common }),
    'π  Goal',
  );
  assert.equal(
    formatActiveWorkTitle({
      focus: { mode: 'none' },
      ...common,
      goal: { ...common.goal, status: 'complete' },
    }),
    'π  Validate › Goal',
  );
  assert.equal(
    formatActiveWorkTitle({
      focus: { mode: 'task', change, taskId },
      ...common,
    }),
    `π  ${change} › ${taskId}`,
  );
});

test('fallback titles normalize hostile session text and remain bounded', async () => {
  const longName = `  Review\n\u0007 title ${'x'.repeat(5_000)}  `;
  const harness = new RuntimeHarness({ sessionName: longName });
  try {
    await harness.emit('session_start', { reason: 'startup' });
    const title = harness.titles[0] ?? '';

    assert.match(title, /^π  Review title /u);
    assert.doesNotMatch(title, /[\u0000-\u001f\u007f]/u);
    assert.ok(Array.from(title).length <= 180);
    assert.ok(title.length < longName.length);
  } finally {
    await harness.stop();
  }
});

test('focused hostile headlines are sanitized and bounded independently', async () => {
  const hostileHeadline = `\n\u0007${'🧪'.repeat(500)} FORBIDDEN-SUFFIX`;
  const harness = new RuntimeHarness({ focusedTaskTitle: hostileHeadline });
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.command('openspec-focus', `set ${change} ${taskId}`);
    await waitFor(
      () => harness.titles.at(-1)?.includes('🧪') === true,
      () => titleDiagnostics(harness),
    );

    const title = harness.titles.at(-1) ?? '';
    const prefix = `π  ${change} › ${taskId} `;
    const headline = title.slice(prefix.length);
    assert.ok(title.startsWith(prefix));
    assert.doesNotMatch(title, /[\u0000-\u001f\u007f]/u);
    assert.equal(Array.from(headline).length, 72);
    assert.ok(headline.endsWith('…'));
    assert.doesNotMatch(title, /FORBIDDEN-SUFFIX/u);
    assert.ok(Array.from(title).length <= 180);
  } finally {
    await harness.stop();
  }
});

test('the overall title bound is exactly 180 Unicode code points', () => {
  const title = formatActiveWorkTitle({
    focus: { mode: 'task', change: '🛰'.repeat(500), taskId },
    cwd: '/work/cwd-choice',
  });

  assert.equal(Array.from(title).length, 180);
  assert.ok(title.endsWith('…'));
  assert.ok(title.length > 180, 'the bound must count code points, not UTF-16 units');
});
