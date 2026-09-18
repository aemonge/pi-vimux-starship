#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const REQUIRED_FILES = [
  'README.md',
  'demo/pi-vimux-starship.tape',
  'docs/architecture.md',
  'docs/development.md',
  'licenses/pi-fancy-footer-LICENSE',
  'licenses/pi-vim-LICENSE',
  'package.json',
  'packages/header/index.ts',
  'packages/status/index.ts',
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

export function validateDemoSources(readme, tape) {
  const errors = [];
  for (const required of [
    'docs/assets/pi-vimux-starship.gif',
    'nvim +terminal',
    '/vimux-health',
    '## Installation',
    '### Rollback',
    '## Reproducible VHS demo',
  ]) {
    if (!readme.includes(required)) errors.push(`README missing ${required}`);
  }
  for (const required of [
    'Output docs/assets/pi-vimux-starship.gif',
    'Set Theme "Gruvbox Light"',
    'Set Height 520',
    'Set Padding 20',
    '--offline',
    '--no-session',
    '--no-extensions',
    '--no-context-files',
    'Type "clear && pi ',
    'Wait+Screen /waiting/',
    'Type ":name Public cockpit demo"',
    'Wait+Screen /Public cockpit demo/',
    'Type ":vimux-health"',
    'Wait+Screen /pi-vimux-starship health/',
  ]) {
    if (!tape.includes(required)) errors.push(`tape missing ${required}`);
  }
  const orderedCommands = [
    'Hide',
    'Type "clear && pi ',
    'Wait+Screen /waiting/',
    'Show',
    'Type ":name Public cockpit demo"',
    'Wait+Screen /Public cockpit demo/',
    'Type ":vimux-health"',
    'Wait+Screen /pi-vimux-starship health/',
  ];
  let previous = -1;
  for (const command of orderedCommands) {
    const current = tape.indexOf(command, previous + 1);
    if (current < 0 || current <= previous) {
      errors.push(`tape command order invalid at ${command}`);
      break;
    }
    previous = current;
  }
  for (const forbidden of [
    /--api-key/u,
    /--provider\b/u,
    /token=/iu,
    /\bnvim\b/iu,
    /Type\s+"i"/u,
    /Type\s+":x"/u,
    /externalEditor/iu,
  ]) {
    if (forbidden.test(tape)) errors.push(`tape contains forbidden ${forbidden}`);
  }
  return errors;
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

export function credentialFreeProbeEnvironment(home, pathValue) {
  return {
    HOME: home,
    LANG: 'C.UTF-8',
    PATH: pathValue,
    PI_CODING_AGENT_DIR: join(home, '.pi', 'agent'),
    PI_OFFLINE: '1',
    TERM: 'xterm-256color',
  };
}

export async function inspectExtractedArtifact(cwd = process.cwd()) {
  const directory = await mkdtemp(join(tmpdir(), 'pi-vimux-package-'));
  const archiveDirectory = join(directory, 'archive');
  const extractedDirectory = join(directory, 'extracted');
  const home = join(directory, 'home');
  const work = join(directory, 'work');

  try {
    await Promise.all([
      mkdir(archiveDirectory),
      mkdir(extractedDirectory),
      mkdir(join(home, '.pi', 'agent'), { recursive: true }),
      mkdir(work),
    ]);
    const { stdout: packOutput } = await execFileAsync(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', archiveDirectory],
      { cwd, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 },
    );
    const packageResults = JSON.parse(packOutput);
    const paths = packedPathsFromNpmJson(packageResults);
    const validation = validatePackedFiles(paths);
    if (validation.errors.length > 0) {
      throw new Error(`packed artifact check failed: ${validation.errors.join('; ')}`);
    }

    const packageResult = Object.values(packageResults)[0];
    if (
      !packageResult ||
      typeof packageResult !== 'object' ||
      typeof packageResult.filename !== 'string'
    ) {
      throw new Error('npm pack result has no archive filename');
    }
    const archive = join(archiveDirectory, basename(packageResult.filename));
    await execFileAsync('tar', ['-xzf', archive, '-C', extractedDirectory], {
      encoding: 'utf8',
    });

    const pi = resolve(cwd, 'node_modules', '.bin', 'pi');
    const { stdout } = await execFileAsync(
      pi,
      [
        '--offline',
        '--no-session',
        '--no-extensions',
        '-e',
        join(extractedDirectory, 'package'),
        '--list-models',
      ],
      {
        cwd: work,
        encoding: 'utf8',
        env: credentialFreeProbeEnvironment(home, process.env.PATH ?? ''),
        maxBuffer: 2 * 1024 * 1024,
        timeout: 30_000,
      },
    );
    const rows = stdout.split('\n').filter(Boolean).length;
    if (rows === 0)
      throw new Error('offline extracted package load returned no models');
    return { files: validation.files, rows };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await inspectPackedArtifact();
  if (result.errors.length > 0) {
    throw new Error(`packed artifact check failed: ${result.errors.join('; ')}`);
  }
  console.log(`packed artifact: PASS (${result.files.length} files)`);
  const [readme, tape] = await Promise.all([
    readFile(resolve('README.md'), 'utf8'),
    readFile(resolve('demo', 'pi-vimux-starship.tape'), 'utf8'),
  ]);
  const demoErrors = validateDemoSources(readme, tape);
  if (demoErrors.length > 0) {
    throw new Error(`README/VHS check failed: ${demoErrors.join('; ')}`);
  }
  console.log('README/VHS source: PASS');
  if (process.argv.includes('--load')) {
    const extracted = await inspectExtractedArtifact();
    console.log(
      `extracted package load: PASS (${extracted.files.length} files, ${extracted.rows} model rows)`,
    );
  }
}
