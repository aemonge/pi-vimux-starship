import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluatePlanningChange } from '../scripts/check-openspec.mjs';

const completePlan = {
  schemaName: 'ramona-plan',
  isComplete: true,
  artifacts: [
    { id: 'plan', status: 'done' },
    { id: 'tasks', status: 'done' },
  ],
};

test('planning-only Ramona changes use completed artifacts instead of spec deltas', () => {
  assert.deepEqual(
    evaluatePlanningChange('schema: ramona-plan\nskip_specs: true\n', completePlan),
    {
      schema: 'ramona-plan',
      skipSpecs: true,
      requiresStrictValidation: false,
    },
  );
});

test('ordinary changes retain upstream strict validation', () => {
  assert.deepEqual(
    evaluatePlanningChange('schema: spec-driven\n', {
      ...completePlan,
      schemaName: 'spec-driven',
    }),
    {
      schema: 'spec-driven',
      skipSpecs: false,
      requiresStrictValidation: true,
    },
  );
});

test('planning-only validation rejects incomplete artifacts', () => {
  assert.throws(
    () =>
      evaluatePlanningChange('schema: ramona-plan\nskip_specs: true\n', {
        ...completePlan,
        isComplete: false,
      }),
    /required planning artifacts are incomplete/u,
  );
});

test('skip_specs is restricted to planning schemas', () => {
  assert.throws(
    () =>
      evaluatePlanningChange('schema: spec-driven\nskip_specs: true\n', {
        ...completePlan,
        schemaName: 'spec-driven',
      }),
    /skip_specs is not allowed/u,
  );
});
