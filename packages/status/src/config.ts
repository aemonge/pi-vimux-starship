import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { CommandSpec, GalacticaStatusConfig, LoadedConfig } from './types.ts';

const MIN_INTERVAL_SECONDS = 60;
const MAX_INTERVAL_SECONDS = 86_400;
const MIN_TIMEOUT_SECONDS = 1;
const MAX_TIMEOUT_SECONDS = 120;

export const DEFAULT_CONFIG: GalacticaStatusConfig = {
  version: 1,
  enabled: true,
  openspec: {
    enabled: true,
    change: null,
  },
  diagnostics: {
    enabled: true,
    sourceFile: null,
    command: null,
    intervalSeconds: 300,
    runAutomatically: false,
    timeoutSeconds: 15,
  },
  orchestration: {
    enabled: true,
    stateFile: null,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function nullableString(value: unknown, fallback: string | null): string | null {
  if (value === null) return null;
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function boundedInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.trunc(value)));
}

function parseCommand(value: unknown, warnings: string[]): CommandSpec | null {
  if (value === null || value === undefined) return null;

  if (Array.isArray(value)) {
    if (
      value.length > 0 &&
      value.every((part) => typeof part === 'string' && part.length > 0)
    ) {
      return {
        executable: value[0] as string,
        args: value.slice(1) as string[],
      };
    }
    warnings.push('diagnostics.command array was ignored because it is invalid');
    return null;
  }

  if (isRecord(value)) {
    const executable = value.executable;
    const args = value.args;
    if (
      typeof executable === 'string' &&
      executable.length > 0 &&
      (args === undefined ||
        (Array.isArray(args) && args.every((part) => typeof part === 'string')))
    ) {
      return { executable, args: (args ?? []) as string[] };
    }
  }

  warnings.push(
    'diagnostics.command was ignored; use null, an argv array, or { executable, args }',
  );
  return null;
}

function unknownKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  warnings: string[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) warnings.push(`${path}.${key} was ignored`);
  }
}

export function parseConfig(value: unknown): {
  config: GalacticaStatusConfig;
  warnings: string[];
} {
  const warnings: string[] = [];
  if (!isRecord(value)) {
    return {
      config: structuredClone(DEFAULT_CONFIG),
      warnings: ['configuration root is not an object; defaults are active'],
    };
  }

  unknownKeys(
    value,
    ['version', 'enabled', 'openspec', 'diagnostics', 'orchestration'],
    'config',
    warnings,
  );

  if (value.version !== undefined && value.version !== 1) {
    warnings.push('unsupported config version; version 1 defaults are active');
  }

  const openspec = isRecord(value.openspec) ? value.openspec : {};
  const diagnostics = isRecord(value.diagnostics) ? value.diagnostics : {};
  const orchestration = isRecord(value.orchestration) ? value.orchestration : {};

  unknownKeys(openspec, ['enabled', 'change'], 'openspec', warnings);
  unknownKeys(
    diagnostics,
    [
      'enabled',
      'sourceFile',
      'command',
      'intervalSeconds',
      'runAutomatically',
      'timeoutSeconds',
    ],
    'diagnostics',
    warnings,
  );
  unknownKeys(orchestration, ['enabled', 'stateFile'], 'orchestration', warnings);

  return {
    config: {
      version: 1,
      enabled: booleanValue(value.enabled, DEFAULT_CONFIG.enabled),
      openspec: {
        enabled: booleanValue(openspec.enabled, DEFAULT_CONFIG.openspec.enabled),
        change: nullableString(openspec.change, DEFAULT_CONFIG.openspec.change),
      },
      diagnostics: {
        enabled: booleanValue(diagnostics.enabled, DEFAULT_CONFIG.diagnostics.enabled),
        sourceFile: nullableString(
          diagnostics.sourceFile,
          DEFAULT_CONFIG.diagnostics.sourceFile,
        ),
        command: parseCommand(diagnostics.command, warnings),
        intervalSeconds: boundedInteger(
          diagnostics.intervalSeconds,
          DEFAULT_CONFIG.diagnostics.intervalSeconds,
          MIN_INTERVAL_SECONDS,
          MAX_INTERVAL_SECONDS,
        ),
        runAutomatically: booleanValue(
          diagnostics.runAutomatically,
          DEFAULT_CONFIG.diagnostics.runAutomatically,
        ),
        timeoutSeconds: boundedInteger(
          diagnostics.timeoutSeconds,
          DEFAULT_CONFIG.diagnostics.timeoutSeconds,
          MIN_TIMEOUT_SECONDS,
          MAX_TIMEOUT_SECONDS,
        ),
      },
      orchestration: {
        enabled: booleanValue(
          orchestration.enabled,
          DEFAULT_CONFIG.orchestration.enabled,
        ),
        stateFile: nullableString(
          orchestration.stateFile,
          DEFAULT_CONFIG.orchestration.stateFile,
        ),
      },
    },
    warnings,
  };
}

export function getConfigPath(): string {
  const agentDir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), '.pi', 'agent');
  return join(agentDir, 'galactica-status.json');
}

export async function loadConfig(path = getConfigPath()): Promise<LoadedConfig> {
  try {
    const raw = await fs.readFile(path, 'utf8');
    const parsed = parseConfig(JSON.parse(raw) as unknown);
    return { ...parsed, path };
  } catch (error) {
    const code = isRecord(error) ? error.code : undefined;
    if (code === 'ENOENT') {
      return {
        config: structuredClone(DEFAULT_CONFIG),
        path,
        warnings: [],
      };
    }
    const message = error instanceof Error ? error.message : String(error);
    return {
      config: structuredClone(DEFAULT_CONFIG),
      path,
      warnings: [`failed to load configuration: ${message}`],
    };
  }
}
