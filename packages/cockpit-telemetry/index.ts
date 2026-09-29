import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

import { createSnapshotSink } from './src/sink.ts';

export const GALACTICA_HEADER_CHANNEL = 'galactica-status:header';

export default function cockpitTelemetry(pi: ExtensionAPI): void {
  const sink = createSnapshotSink();

  pi.events.on(GALACTICA_HEADER_CHANNEL, (event: unknown) => {
    void sink.onHeaderEvent(event);
  });

  pi.on('session_start', (_event, ctx) => {
    sink.onSessionStart(ctx.sessionManager.getSessionId(), ctx.cwd);
  });

  pi.on('session_shutdown', () => {
    void sink.onSessionShutdown();
  });
}
