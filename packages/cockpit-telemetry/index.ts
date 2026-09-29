import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

import { createSnapshotSink } from './src/sink.ts';

export const GALACTICA_HEADER_CHANNEL = 'galactica-status:header';

export default function cockpitTelemetry(pi: ExtensionAPI): void {
  // Mirrors the header deck's activity clock (packages/header/index.ts):
  // same Pi events, same marks and clears, so the stamped
  // `activityElapsedMs` ticks in lockstep with the deck's timer tile.
  let agentBusy = false;
  let lastObservedActivityAt: number | null = null;

  const markObservedActivity = (): void => {
    lastObservedActivityAt = Date.now();
  };

  const clearObservedActivity = (): void => {
    agentBusy = false;
    lastObservedActivityAt = null;
  };

  const activityClock = (): number | null =>
    agentBusy && lastObservedActivityAt !== null
      ? Math.max(0, Date.now() - lastObservedActivityAt)
      : null;

  const sink = createSnapshotSink({ activityClock });

  pi.on('before_agent_start', (_event, ctx) => {
    if (ctx.mode !== 'tui') return;
    agentBusy = true;
    markObservedActivity();
  });
  pi.on('turn_start', markObservedActivity);
  pi.on('before_provider_request', markObservedActivity);
  pi.on('after_provider_response', markObservedActivity);
  const markAssistantActivity = (event: { message?: { role?: unknown } }): void => {
    if (event.message?.role === 'assistant') markObservedActivity();
  };
  pi.on('message_start', markAssistantActivity);
  pi.on('message_update', markAssistantActivity);
  pi.on('message_end', markAssistantActivity);
  pi.on('tool_execution_end', markObservedActivity);
  pi.on('agent_settled', clearObservedActivity);

  pi.events.on(GALACTICA_HEADER_CHANNEL, (event: unknown) => {
    void sink.onHeaderEvent(event);
  });

  pi.on('session_start', (_event, ctx) => {
    sink.onSessionStart(ctx.sessionManager.getSessionId(), ctx.cwd);
  });

  pi.on('session_shutdown', () => {
    clearObservedActivity();
    void sink.onSessionShutdown();
  });
}
