import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  FANCY_FOOTER_TELEMETRY_CHANNEL,
  FANCY_FOOTER_WIDGET_CHANNEL,
  PI_STATUS_SOURCE_CHANNEL,
  parseFancyFooterTelemetry,
} from "./api.ts";
import fancyFooter from "./index.ts";

test("model and thinking changes request an immediate render", async () => {
  const handlers = new Map<string, (...args: never[]) => unknown>();
  let createFooter:
    | ((
        tui: unknown,
        theme: unknown,
        footerData: unknown,
      ) => {
        dispose(): void;
      })
    | undefined;
  let renderRequests = 0;

  const pi = {
    events: {
      emit() {},
      on() {
        return () => {};
      },
    },
    registerCommand() {},
    on(event: string, handler: (...args: never[]) => unknown) {
      handlers.set(event, handler);
    },
    getThinkingLevel() {
      return "medium";
    },
    async exec() {
      return { code: 1, stdout: "", stderr: "" };
    },
  };

  fancyFooter(pi as never);

  await handlers.get("session_start")?.(
    {} as never,
    {
      hasUI: true,
      cwd: "/tmp",
      sessionManager: { getBranch: () => [] },
      ui: {
        setFooter(factory: typeof createFooter) {
          createFooter = factory;
        },
      },
    } as never,
  );

  assert.ok(createFooter);
  const footer = createFooter(
    {
      requestRender() {
        renderRequests += 1;
      },
    },
    {},
    { onBranchChange: () => () => {} },
  );

  handlers.get("model_select")?.({} as never, {} as never);
  assert.equal(renderRequests, 1);

  handlers.get("thinking_level_select")?.({} as never, {} as never);
  assert.equal(renderRequests, 2);

  footer.dispose();
});

test("telemetry mode publishes bounded cost without installing a footer", async (t) => {
  const agentDir = await mkdtemp(join(tmpdir(), "pi-fancy-footer-telemetry-"));
  const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = agentDir;
  t.after(async () => {
    if (previousAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previousAgentDir;
    await rm(agentDir, { recursive: true, force: true });
  });

  const handlers = new Map<string, (...args: never[]) => unknown>();
  const emitted: Array<{ channel: string; message: unknown }> = [];
  let setFooterCalls = 0;
  const pi = {
    events: {
      emit(channel: string, message: unknown) {
        emitted.push({ channel, message });
      },
      on() {
        return () => {};
      },
    },
    registerCommand() {},
    on(event: string, handler: (...args: never[]) => unknown) {
      handlers.set(event, handler);
    },
    getThinkingLevel() {
      return "medium";
    },
    async exec() {
      return { code: 1, stdout: "", stderr: "" };
    },
  };

  fancyFooter(pi as never, { surface: "telemetry" });
  await handlers.get("session_start")?.(
    {} as never,
    {
      hasUI: true,
      cwd: agentDir,
      model: { id: "claude-fable-5" },
      sessionManager: {
        getBranch: () => [
          {
            type: "message",
            message: { role: "assistant", usage: { cost: { total: 0.125 } } },
          },
        ],
      },
      ui: {
        setFooter() {
          setFooterCalls += 1;
        },
      },
    } as never,
  );

  assert.equal(setFooterCalls, 0);
  const telemetry = emitted
    .filter(({ channel }) => channel === FANCY_FOOTER_TELEMETRY_CHANNEL)
    .map(({ message }) => parseFancyFooterTelemetry(message))
    .filter((message) => message !== null);
  assert.ok(telemetry.length > 0);
  assert.equal(telemetry[0]?.totalCost, 0.125);
  assert.deepEqual(
    emitted.find(({ channel }) => channel === PI_STATUS_SOURCE_CHANNEL)?.message,
    {
      protocol: 1,
      type: "snapshot",
      source: "fancy-footer",
      conditions: [],
    },
  );

  await handlers.get("session_shutdown")?.();
});

test("compaction handling coexists with data widget listener cleanup", async () => {
  let stopCalls = 0;
  let compact: (() => Promise<void>) | undefined;
  let shutdown: (() => Promise<void>) | undefined;
  const pi = {
    events: {
      emit() {},
      on(channel: string) {
        assert.equal(channel, FANCY_FOOTER_WIDGET_CHANNEL);
        return () => {
          stopCalls += 1;
        };
      },
    },
    registerCommand() {},
    on(event: string, handler: () => Promise<void>) {
      if (event === "session_compact") compact = handler;
      if (event === "session_shutdown") shutdown = handler;
    },
  };

  fancyFooter(pi as never);
  assert.ok(compact);
  assert.ok(shutdown);
  assert.equal(stopCalls, 0);

  await compact();
  assert.equal(stopCalls, 0);

  await shutdown();
  assert.equal(stopCalls, 1);
});
