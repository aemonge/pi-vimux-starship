import assert from "node:assert/strict";
import test from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  createFancyFooterClient,
  FANCY_FOOTER_READY_CHANNEL,
  FANCY_FOOTER_WIDGET_CHANNEL,
  parseFancyFooterTelemetry,
} from "./api.ts";

class TestBus {
  readonly emissions: Array<[string, unknown]> = [];
  private readonly handlers = new Map<string, Set<(data: unknown) => void>>();

  on(channel: string, handler: (data: unknown) => void): () => void {
    const handlers = this.handlers.get(channel) ?? new Set();
    handlers.add(handler);
    this.handlers.set(channel, handlers);
    return () => handlers.delete(handler);
  }

  emit(channel: string, data: unknown): void {
    this.emissions.push([channel, data]);
    for (const handler of this.handlers.get(channel) ?? []) handler(data);
  }
}

test("typed client emits the raw data-widget protocol", () => {
  const bus = new TestBus();
  const client = createFancyFooterClient({ events: bus } as unknown as ExtensionAPI);
  client.upsert({
    id: "acme.status",
    content: {
      type: "text",
      text: "passing",
      href: "https://ci.example.com/build/1",
    },
  });
  client.remove("acme.status");

  assert.deepEqual(bus.emissions, [
    [
      FANCY_FOOTER_WIDGET_CHANNEL,
      {
        protocol: 1,
        type: "upsert",
        widget: {
          id: "acme.status",
          content: {
            type: "text",
            text: "passing",
            href: "https://ci.example.com/build/1",
          },
        },
      },
    ],
    [FANCY_FOOTER_WIDGET_CHANNEL, { protocol: 1, type: "remove", id: "acme.status" }],
  ]);
});

test("typed client filters ready messages and unsubscribes", () => {
  const bus = new TestBus();
  const client = createFancyFooterClient({ events: bus } as unknown as ExtensionAPI);
  const versions: string[] = [];
  const unsubscribe = client.onReady((message) => versions.push(message.version));

  bus.emit(FANCY_FOOTER_READY_CHANNEL, { protocol: 2, version: "future" });
  bus.emit(FANCY_FOOTER_READY_CHANNEL, { protocol: 1, version: "2.0.0" });
  unsubscribe();
  bus.emit(FANCY_FOOTER_READY_CHANNEL, { protocol: 1, version: "ignored" });
  assert.deepEqual(versions, ["2.0.0"]);
});

test("parseFancyFooterTelemetry accepts quota windows additively", () => {
  const message = {
    protocol: 1,
    type: "snapshot" as const,
    totalCost: 2.64,
    quotaPercent: 52,
    quotaWindows: [
      { label: "5h", percent: 52, resetAt: 1_789_397_375 },
      { label: "7d", percent: 9 },
    ],
  };

  assert.deepEqual(parseFancyFooterTelemetry(message), message);
  assert.deepEqual(
    parseFancyFooterTelemetry({ protocol: 1, type: "snapshot", totalCost: 2.64 }),
    { protocol: 1, type: "snapshot", totalCost: 2.64 },
  );
});

test("parseFancyFooterTelemetry rejects malformed quota windows", () => {
  assert.equal(
    parseFancyFooterTelemetry({
      protocol: 1,
      type: "snapshot",
      totalCost: 1,
      quotaWindows: [{ label: "5h", percent: 101 }],
    }),
    null,
  );
  assert.equal(
    parseFancyFooterTelemetry({
      protocol: 1,
      type: "snapshot",
      totalCost: 1,
      quotaWindows: [],
    }),
    null,
  );
  assert.equal(
    parseFancyFooterTelemetry({
      protocol: 1,
      type: "snapshot",
      totalCost: 1,
      quotaWindows: [{ label: "5h", percent: 10, resetAt: -5 }],
    }),
    null,
  );
});
