import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeDiagnostics } from '../src/diagnostics.ts';

test('normalizes aggregate diagnostics and check states', () => {
  const state = normalizeDiagnostics(
    {
      summary: { errors: 2, warnings: 8 },
      checks: { tests: 'passed', types: 'failed' },
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      source: 'fixture.json',
      now: Date.parse('2026-01-01T00:01:00.000Z'),
    },
  );

  assert.equal(state.errors, 2);
  assert.equal(state.warnings, 8);
  assert.equal(state.tests, 'pass');
  assert.equal(state.typecheck, 'fail');
  assert.equal(state.meta.stale, false);
});

test('aggregates blocker, error, and warning findings', () => {
  const state = normalizeDiagnostics(
    {
      diagnostics: [
        { severity: 'error' },
        { severity: 'warning' },
        { severity: 'warning', semantic: 'blocking' },
      ],
    },
    { source: 'fixture.json', now: 100 },
  );

  assert.equal(state.errors, 1);
  assert.equal(state.blockers, 1);
  assert.equal(state.warnings, 1);
});

test('marks old cached results stale', () => {
  const state = normalizeDiagnostics(
    { errors: 0, warnings: 0, tests: true, updatedAt: 1_000 },
    { source: 'fixture.json', now: 701_000, staleAfterMs: 600_000 },
  );
  assert.equal(state.meta.stale, true);
});

test('rejects unrecognized diagnostics objects', () => {
  assert.throws(
    () => normalizeDiagnostics({ files: ['do-not-display.ts'] }, { source: 'bad' }),
    /no recognized aggregate fields/,
  );
});
