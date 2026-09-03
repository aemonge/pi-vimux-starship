#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const modulePath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(modulePath), '..');

function metadataScalar(metadata, key) {
  const matches = metadata
    .split('\n')
    .map((line) => new RegExp(`^${key}:\\s*(.*?)\\s*(?:#.*)?$`).exec(line))
    .filter(Boolean);
  if (matches.length > 1) throw new Error(`duplicate ${key} metadata`);
  return matches[0]?.[1];
}

export function evaluatePlanningChange(metadata, status) {
  const schema = metadataScalar(metadata, 'schema');
  if (!schema) throw new Error('change metadata is missing schema');
  if (status.schemaName !== schema) {
    throw new Error(
      `metadata schema ${schema} does not match status ${status.schemaName}`,
    );
  }

  const skipSpecsValue = metadataScalar(metadata, 'skip_specs');
  if (skipSpecsValue !== undefined && !['true', 'false'].includes(skipSpecsValue)) {
    throw new Error('skip_specs must be true or false');
  }
  const skipSpecs = skipSpecsValue === 'true';
  if (skipSpecs && !['ramona-idea', 'ramona-plan'].includes(schema)) {
    throw new Error(`skip_specs is not allowed for schema ${schema}`);
  }

  if (
    !status.isComplete ||
    status.artifacts?.some(({ status: value }) => value !== 'done')
  ) {
    throw new Error('required planning artifacts are incomplete');
  }

  return { schema, skipSpecs, requiresStrictValidation: !skipSpecs };
}

function runOpenSpec(args, root = projectRoot) {
  const result = spawnSync('openspec', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    throw new Error(
      `openspec ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`,
    );
  }
  return result.stdout;
}

export async function checkOpenSpec(root = projectRoot, run = runOpenSpec) {
  const changesDirectory = join(root, 'openspec', 'changes');
  const entries = await readdir(changesDirectory, { withFileTypes: true });
  const changes = entries
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
    .map((entry) => entry.name)
    .sort();

  for (const change of changes) {
    const metadata = await readFile(
      join(changesDirectory, change, '.openspec.yaml'),
      'utf8',
    );
    const status = JSON.parse(run(['status', '--change', change, '--json'], root));
    const evaluation = evaluatePlanningChange(metadata, status);
    if (evaluation.requiresStrictValidation) {
      run(
        [
          'validate',
          change,
          '--type',
          'change',
          '--strict',
          '--json',
          '--no-interactive',
        ],
        root,
      );
    }
    console.log(
      `OpenSpec ${change}: PASS (${evaluation.schema}, ${
        evaluation.skipSpecs ? 'planning-only' : 'strict'
      })`,
    );
  }

  console.log(`OpenSpec checks: PASS (${changes.length} changes)`);
}

if (process.argv[1] === modulePath) {
  await checkOpenSpec();
}
