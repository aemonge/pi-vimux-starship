#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baselineDirectory = join(root, 'baseline');
const currentManifestPath = join(baselineDirectory, 'source.sha256');
const importedManifestPath = join(baselineDirectory, 'imported-source.sha256');
const importedManifestDigest =
  '005256ed0bbd7859d621f0ba3fcac039e0497b3bd357df4cc7b150c7659dc9a7';

function digest(content) {
  return createHash('sha256').update(content).digest('hex');
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === 'node_modules') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.isFile()) files.push(relative(root, path));
    else throw new Error(`unexpected non-file source path: ${relative(root, path)}`);
  }
  return files;
}

function parseManifest(content, label) {
  return content
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const match = /^([a-f0-9]{64})  (packages\/.+)$/.exec(line);
      if (!match) throw new Error(`invalid ${label} manifest line: ${line}`);
      return { expected: match[1], path: match[2] };
    });
}

async function renderCurrentManifest() {
  const paths = (await walk(join(root, 'packages'))).sort();
  const lines = [];
  for (const path of paths) {
    lines.push(`${digest(await readFile(join(root, path)))}  ${path}`);
  }
  return `${lines.join('\n')}\n`;
}

const importedManifest = await readFile(importedManifestPath);
if (digest(importedManifest) !== importedManifestDigest) {
  throw new Error('original import manifest digest changed');
}
const importedEntries = parseManifest(importedManifest.toString('utf8'), 'imported');

if (process.argv.includes('--write')) {
  await writeFile(currentManifestPath, await renderCurrentManifest());
  console.log('current source manifest: UPDATED');
}

const manifest = parseManifest(
  await readFile(currentManifestPath, 'utf8'),
  'current source',
);
const expectedPaths = manifest.map(({ path }) => path).sort();
const actualPaths = (await walk(join(root, 'packages'))).sort();
if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
  const expected = new Set(expectedPaths);
  const actual = new Set(actualPaths);
  const missing = expectedPaths.filter((path) => !actual.has(path));
  const unexpected = actualPaths.filter((path) => !expected.has(path));
  throw new Error(
    `current source file set changed; missing=${missing.join(',') || 'none'}; ` +
      `unexpected=${unexpected.join(',') || 'none'}`,
  );
}

for (const { expected, path } of manifest) {
  const actual = digest(await readFile(join(root, path)));
  if (actual !== expected) throw new Error(`current source digest changed: ${path}`);
}

console.log(`current source integrity: PASS (${manifest.length} files)`);
console.log(`original import record: PASS (${importedEntries.length} files)`);
