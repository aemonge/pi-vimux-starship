#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const REQUIRED_FILES = [
  'README.md',
  'docs/architecture.md',
  'docs/development.md',
  'licenses/pi-fancy-footer-LICENSE',
  'licenses/pi-vim-LICENSE',
  'package.json',
  'packages/galactica-context-header/index.ts',
  'packages/galactica-status/index.ts',
  'packages/pi-fancy-footer-full-palette/src/index.ts',
  'packages/pi-vim-top-border/index.ts',
  'src/deck-surface.ts',
  'src/health.ts',
  'src/index.ts',
];

const FORBIDDEN_PATHS = [
  /(^|\/)\.env(?:\.|$)/u,
  /(^|\/)\.git(?:\/|$)/u,
  /(^|\/)\.pi(?:\/|$)/u,
  /(^|\/)AGENTS\.md$/u,
  /(^|\/)baseline(?:\/|$)/u,
  /(^|\/)node_modules(?:\/|$)/u,
  /(^|\/)openspec(?:\/|$)/u,
  /(^|\/)scripts(?:\/|$)/u,
  /(^|\/)test(?:\/|$)/u,
  /\.test\.[cm]?[jt]sx?$/u,
  /(^|\/)(?:biome|eslint|tsconfig|lefthook)(?:\.|$)/u,
];

export function validatePackedFiles(paths) {
  const unique = [...new Set(paths)].sort();
  const missing = REQUIRED_FILES.filter((path) => !unique.includes(path));
  const forbidden = unique.filter((path) =>
    FORBIDDEN_PATHS.some((pattern) => pattern.test(path)),
  );
  const errors = [];
  if (missing.length > 0) errors.push(`missing=${missing.join(',')}`);
  if (forbidden.length > 0) errors.push(`forbidden=${forbidden.join(',')}`);
  if (unique.length > 80) errors.push(`entry-count=${unique.length}>80`);
  return { files: unique, errors };
}

export function packedPathsFromNpmJson(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('npm pack returned a non-object result');
  }
  const entries = Object.values(value);
  if (entries.length !== 1) {
    throw new Error(`npm pack returned ${entries.length} package results`);
  }
  const files = entries[0]?.files;
  if (!Array.isArray(files)) throw new Error('npm pack result has no files array');
  return files.map((file) => {
    if (!file || typeof file !== 'object' || typeof file.path !== 'string') {
      throw new Error('npm pack result contains an invalid file entry');
    }
    return file.path;
  });
}

export async function inspectPackedArtifact(cwd = process.cwd()) {
  const { stdout } = await execFileAsync(
    'npm',
    ['pack', '--dry-run', '--json', '--ignore-scripts'],
    { cwd, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 },
  );
  return validatePackedFiles(packedPathsFromNpmJson(JSON.parse(stdout)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await inspectPackedArtifact();
  if (result.errors.length > 0) {
    throw new Error(`packed artifact check failed: ${result.errors.join('; ')}`);
  }
  console.log(`packed artifact: PASS (${result.files.length} files)`);
}
