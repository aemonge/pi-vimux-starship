import assert from 'node:assert/strict';
import test from 'node:test';
import {
  boundedPhase,
  EventLedger,
  isLedgerEvent,
  LEDGER_EVENT_TYPES,
} from '../src/ledger.ts';
import type { LedgerEvent } from '../src/ledger.ts';

test('EventLedger appends events and exposes an isolated snapshot', () => {
  const ledger = new EventLedger();
  ledger.append({
    type: 'focus/subject',
    at: 1,
    subject: { state: 'set', title: 'x' },
  });
  ledger.append({ type: 'taskflow/phase', at: 2, phase: 'plan' });
  const first = ledger.snapshot();
  const second = ledger.snapshot();
  assert.notEqual(first, second);
  (first as LedgerEvent[]).push({ type: 'taskflow/phase', at: 3, phase: 'tamper' });
  assert.equal(ledger.size, 2);
  const last = second.at(-1);
  assert.ok(last && last.type === 'taskflow/phase');
  assert.equal(last.phase, 'plan');
});

test('EventLedger caps its history without failing', () => {
  const ledger = new EventLedger(3);
  for (let index = 0; index < 10; index += 1) {
    ledger.append({ type: 'taskflow/phase', at: index, phase: `p${index}` });
  }
  assert.equal(ledger.size, 3);
  const last = ledger.snapshot().at(-1);
  assert.ok(last && last.type === 'taskflow/phase');
  assert.equal(last.phase, 'p9');
});

test('EventLedger rejects invalid caps', () => {
  assert.throws(() => new EventLedger(0), RangeError);
});

test('boundedPhase normalizes and caps labels', () => {
  assert.equal(boundedPhase('  plan\tphase  '), 'plan phase');
  assert.equal(boundedPhase('x'.repeat(60)).length <= 41, true);
});

test('isLedgerEvent accepts real events and rejects junk', () => {
  const event: LedgerEvent = { type: 'run/end', at: 5, id: 'x' };
  assert.equal(isLedgerEvent(event), true);
  assert.equal(isLedgerEvent({ type: 'selection/set', at: 1 }), false);
  assert.equal(isLedgerEvent({ type: 'run/end' }), false);
  assert.equal(isLedgerEvent(null), false);
});

test('LEDGER_EVENT_TYPES covers all contract producer domains', () => {
  assert.deepEqual(
    [...LEDGER_EVENT_TYPES],
    [
      'focus/openspec',
      'focus/goal',
      'focus/work',
      'focus/subject',
      'run/start',
      'run/stage',
      'run/end',
      'progress/refresh',
      'diagnostics/refresh',
      'orchestration/refresh',
      'taskflow/phase',
    ],
  );
});
