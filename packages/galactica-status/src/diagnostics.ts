import { promises as fs } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import type {
  CheckState,
  CommandRunner,
  DiagnosticsState,
  GalacticaStatusConfig,
} from './types.ts';

const DIAGNOSTIC_CANDIDATES = [
  '.pi/status/diagnostics.json',
  '.pi/diagnostics.json',
  '.galactica/diagnostics.json',
  '.taskflow/diagnostics.json',
  'status/diagnostics.json',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function count(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : undefined;
}

function firstCount(...values: unknown[]): number | undefined {
  for (const value of values) {
    const parsed = count(value);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
}

function parseTimestamp(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeCheck(value: unknown): CheckState {
  if (isRecord(value))
    return normalizeCheck(value.status ?? value.state ?? value.result);
  if (typeof value === 'boolean') return value ? 'pass' : 'fail';
  if (typeof value !== 'string') return 'unknown';
  switch (value.trim().toLowerCase()) {
    case 'pass':
    case 'passed':
    case 'passing':
    case 'success':
    case 'successful':
    case 'clean':
    case 'ok':
      return 'pass';
    case 'fail':
    case 'failed':
    case 'failing':
    case 'failure':
    case 'error':
      return 'fail';
    case 'running':
    case 'pending':
    case 'queued':
    case 'in-progress':
      return 'running';
    default:
      return 'unknown';
  }
}

export function normalizeDiagnostics(
  value: unknown,
  options: {
    source: string;
    now?: number;
    fallbackUpdatedAt?: number;
    staleAfterMs?: number;
  },
): DiagnosticsState {
  if (!isRecord(value)) throw new Error('diagnostics state is not an object');
  const now = options.now ?? Date.now();
  const summary = isRecord(value.summary) ? value.summary : {};
  const checks = isRecord(value.checks) ? value.checks : {};

  let errors = firstCount(value.errors, summary.errors) ?? 0;
  let blockers = firstCount(value.blockers, summary.blockers) ?? 0;
  let warnings = firstCount(value.warnings, summary.warnings) ?? 0;
  let recognized =
    value.errors !== undefined ||
    value.blockers !== undefined ||
    value.warnings !== undefined ||
    summary.errors !== undefined ||
    summary.blockers !== undefined ||
    summary.warnings !== undefined;

  const findings = Array.isArray(value.diagnostics)
    ? value.diagnostics
    : Array.isArray(value.findings)
      ? value.findings
      : [];
  if (findings.length > 0) recognized = true;
  for (const finding of findings) {
    if (!isRecord(finding)) continue;
    const severity = String(finding.severity ?? finding.level ?? '').toLowerCase();
    const semantic = String(finding.semantic ?? finding.status ?? '').toLowerCase();
    if (semantic === 'blocking' || semantic === 'blocker') blockers += 1;
    else if (severity === 'error' || severity === 'fatal') errors += 1;
    else if (severity === 'warning' || severity === 'warn') warnings += 1;
  }

  const tests = normalizeCheck(
    value.tests ?? value.test ?? checks.tests ?? checks.test,
  );
  const typecheck = normalizeCheck(
    value.typecheck ??
      value.typeCheck ??
      value.types ??
      checks.typecheck ??
      checks.types,
  );
  if (tests !== 'unknown' || typecheck !== 'unknown') recognized = true;
  if (!recognized)
    throw new Error('diagnostics state has no recognized aggregate fields');

  const updatedAt =
    parseTimestamp(value.updatedAt ?? value.timestamp ?? value.generatedAt) ??
    options.fallbackUpdatedAt ??
    now;
  const staleAfterMs = options.staleAfterMs ?? 600_000;

  return {
    errors,
    blockers,
    warnings,
    tests,
    typecheck,
    meta: {
      source: options.source,
      refreshedAt: now,
      attemptedAt: now,
      updatedAt,
      staleAfterMs,
      stale: now - updatedAt > staleAfterMs,
    },
  };
}

async function existingFile(paths: readonly string[]): Promise<string | undefined> {
  for (const path of paths) {
    try {
      if ((await fs.stat(path)).isFile()) return path;
    } catch {
      // Optional sources disappear normally between workflow runs.
    }
  }
  return undefined;
}

export async function detectDiagnosticsPath(
  projectRoot: string,
  configuredPath?: string | null,
): Promise<string | undefined> {
  if (configuredPath) {
    const path = isAbsolute(configuredPath)
      ? configuredPath
      : resolve(projectRoot, configuredPath);
    return (await existingFile([path])) ?? path;
  }
  return existingFile(DIAGNOSTIC_CANDIDATES.map((path) => resolve(projectRoot, path)));
}

export async function collectDiagnostics(options: {
  projectRoot: string;
  config: GalacticaStatusConfig['diagnostics'];
  runner: CommandRunner;
  runCommand: boolean;
  now?: number;
}): Promise<{ state?: DiagnosticsState; sourcePath?: string }> {
  const now = options.now ?? Date.now();
  const staleAfterMs = Math.max(options.config.intervalSeconds * 2_000, 300_000);

  if (options.runCommand && options.config.command) {
    const command = options.config.command;
    const result = await options.runner(command.executable, command.args, {
      cwd: options.projectRoot,
      timeoutMs: options.config.timeoutSeconds * 1_000,
    });
    if (result.code !== 0 || result.killed) {
      const detail = result.stderr.trim();
      throw new Error(
        `diagnostics command failed${result.killed ? ' (timeout)' : ''}${
          detail ? `: ${detail}` : ''
        }`,
      );
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(result.stdout) as unknown;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`diagnostics command returned malformed JSON: ${message}`);
    }
    return {
      state: normalizeDiagnostics(parsed, {
        source: `command:${command.executable}`,
        now,
        staleAfterMs,
      }),
    };
  }

  const sourcePath = await detectDiagnosticsPath(
    options.projectRoot,
    options.config.sourceFile,
  );
  if (!sourcePath) return {};

  try {
    const stat = await fs.stat(sourcePath);
    const parsed = JSON.parse(await fs.readFile(sourcePath, 'utf8')) as unknown;
    return {
      sourcePath,
      state: normalizeDiagnostics(parsed, {
        source: sourcePath,
        now,
        fallbackUpdatedAt: stat.mtimeMs,
        staleAfterMs,
      }),
    };
  } catch (error) {
    const code = isRecord(error) ? error.code : undefined;
    if (code === 'ENOENT' && !options.config.sourceFile) return {};
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`failed to read diagnostics state: ${message}`);
  }
}
