#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "baseline", "source.sha256");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === "node_modules") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.isFile()) files.push(relative(root, path));
    else throw new Error(`unexpected non-file baseline path: ${relative(root, path)}`);
  }
  return files;
}

const manifest = (await readFile(manifestPath, "utf8"))
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const match = /^([a-f0-9]{64})  (packages\/.+)$/.exec(line);
    if (!match) throw new Error(`invalid manifest line: ${line}`);
    return { expected: match[1], path: match[2] };
  });

const expectedPaths = manifest.map(({ path }) => path).sort();
const actualPaths = (await walk(join(root, "packages"))).sort();
if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
  const expected = new Set(expectedPaths);
  const actual = new Set(actualPaths);
  const missing = expectedPaths.filter((path) => !actual.has(path));
  const unexpected = actualPaths.filter((path) => !expected.has(path));
  throw new Error(
    `baseline file set changed; missing=${missing.join(",") || "none"}; unexpected=${unexpected.join(",") || "none"}`,
  );
}

for (const { expected, path } of manifest) {
  const actual = createHash("sha256").update(await readFile(join(root, path))).digest("hex");
  if (actual !== expected) throw new Error(`baseline digest changed: ${path}`);
}

console.log(`baseline integrity: PASS (${manifest.length} files)`);
