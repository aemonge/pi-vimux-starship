import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCapabilityFooterWidget,
  CAPABILITY_WIDGET_ID,
  capabilityText,
  parseLspCapability,
  parseMcpCapability,
} from '../src/capabilities.ts';

test('normalizes MCP availability without treating lazy servers as failures', () => {
  assert.deepEqual(
    parseMcpCapability({
      version: 1,
      servers: [
        { status: 'connected', disabled: false, toolCount: 3 },
        { status: 'cached', disabled: false, toolCount: 4 },
        { status: 'not-connected', disabled: false, toolCount: 0 },
        { status: 'failed', disabled: false, toolCount: 0 },
        { status: 'disabled', disabled: true, toolCount: 2 },
      ],
    }),
    { healthy: 3, total: 4 },
  );
  assert.equal(parseMcpCapability({ version: 2, servers: [] }), null);
  assert.equal(
    parseMcpCapability({
      version: 1,
      servers: [{ status: 'invented', disabled: false, toolCount: 0 }],
    }),
    null,
  );
  assert.equal(
    parseMcpCapability({ version: 1, servers: [{ status: 'cached' }] }),
    null,
  );
});

test('normalizes only bounded LSP availability counters', () => {
  assert.deepEqual(parseLspCapability({ version: 1, healthy: 2, total: 3 }), {
    healthy: 2,
    total: 3,
  });
  assert.equal(parseLspCapability({ version: 1, healthy: 4, total: 3 }), null);
  assert.equal(parseLspCapability({ version: 1, healthy: -1, total: 3 }), null);
  assert.equal(parseLspCapability({ version: 2, healthy: 2, total: 3 }), null);
});

test('renders only MCP availability with a plug icon', () => {
  assert.equal(capabilityText({ healthy: 2, total: 3 }), '2/3');
  assert.equal(capabilityText(null), '');

  const message = buildCapabilityFooterWidget({ healthy: 2, total: 3 });
  assert.equal(message.type, 'upsert');
  if (message.type !== 'upsert') return;
  assert.equal(message.widget.id, CAPABILITY_WIDGET_ID);
  assert.equal(message.widget.content.text, '2/3');
  assert.deepEqual(message.widget.icon, {
    glyphs: { nerd: '', emoji: '🔌', unicode: '◇', ascii: 'MCP' },
    color: 'warning',
  });
  assert.equal(message.widget.style.textColor, 'warning');
  assert.deepEqual(message.widget.layout, {
    row: 0,
    position: 7,
    align: 'left',
    fill: 'grow',
    minWidth: 0,
  });

  const empty = buildCapabilityFooterWidget(null);
  assert.equal(empty.type, 'upsert');
  // Gray-out amendment: absent capability reports an empty slot.
  assert.equal(empty.widget.content.text, '');
  assert.deepEqual(empty.widget.icon, {
    glyphs: { nerd: '', emoji: '🔌', unicode: '◇', ascii: 'MCP' },
    color: 'dim',
  });
  assert.equal(empty.widget.style.textColor, 'dim');
});
