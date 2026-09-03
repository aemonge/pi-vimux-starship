export const MCP_STATUS_EVENT = 'pi-mcp-adapter/status/v1';
export const LSP_STATUS_EVENT = 'pi-lsp-adapter/status/v1';
export const CAPABILITY_WIDGET_ID = 'galactica.project-capabilities';

export type CapabilityCount = {
  healthy: number;
  total: number;
};

export type McpCapability = CapabilityCount;
export type LspCapability = CapabilityCount;

const MCP_SERVER_STATUSES = new Set([
  'connected',
  'cached',
  'failed',
  'needs-auth',
  'not-connected',
  'disabled',
]);

function boundedCount(value: unknown): number | undefined {
  if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 999) {
    return undefined;
  }
  return Number(value);
}

export function parseLspCapability(value: unknown): LspCapability | null {
  if (!value || typeof value !== 'object') return null;
  const snapshot = value as Record<string, unknown>;
  const healthy = boundedCount(snapshot.healthy);
  const total = boundedCount(snapshot.total);
  if (snapshot.version !== 1 || healthy === undefined || total === undefined) {
    return null;
  }
  if (healthy > total) return null;
  return { healthy, total };
}

export function parseMcpCapability(value: unknown): McpCapability | null {
  if (!value || typeof value !== 'object') return null;
  const snapshot = value as Record<string, unknown>;
  if (
    snapshot.version !== 1 ||
    !Array.isArray(snapshot.servers) ||
    snapshot.servers.length > 999
  ) {
    return null;
  }

  let healthy = 0;
  let total = 0;
  for (const rawServer of snapshot.servers) {
    if (!rawServer || typeof rawServer !== 'object') return null;
    const server = rawServer as Record<string, unknown>;
    if (
      typeof server.status !== 'string' ||
      !MCP_SERVER_STATUSES.has(server.status) ||
      typeof server.disabled !== 'boolean' ||
      boundedCount(server.toolCount) === undefined
    ) {
      return null;
    }
    if (server.disabled || server.status === 'disabled') continue;
    total += 1;
    if (server.status !== 'failed' && server.status !== 'needs-auth') healthy += 1;
  }

  return total > 0 ? { healthy, total } : null;
}

export function capabilityText(capability: CapabilityCount | null): string {
  return capability ? `${capability.healthy}/${capability.total}` : '—';
}

export function buildCapabilityFooterWidget(mcp: McpCapability | null) {
  const text = capabilityText(mcp);
  const color = mcp ? (mcp.healthy < mcp.total ? 'warning' : 'accent') : 'dim';
  return {
    protocol: 1,
    type: 'upsert',
    widget: {
      id: CAPABILITY_WIDGET_ID,
      label: 'MCP availability',
      description: 'Available/total MCP servers from the live adapter status feed',
      content: { type: 'text', text },
      icon: {
        glyphs: { nerd: '', emoji: '🔌', unicode: '◇', ascii: 'MCP' },
        color,
      },
      style: {
        textColor: color,
      },
      layout: {
        row: 0,
        position: 7,
        align: 'left',
        fill: 'grow',
        minWidth: 0,
      },
    },
  } as const;
}
