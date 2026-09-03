import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const EXPECTED_EXTENSION_ENTRYPOINTS = [
  'packages/pi-fancy-footer-full-palette/src/index.ts',
  'packages/galactica-status/index.ts',
  'packages/galactica-context-header/index.ts',
  'packages/pi-vim-top-border/index.ts',
] as const;

interface ExtensionRegistration {
  entrypoint: string;
  lifecycleEvents: string[];
  eventChannels: string[];
  emittedChannels: string[];
  commands: string[];
  tools: string[];
}

export interface LocalLoadProbeResult {
  packageName: string;
  entrypoints: string[];
  registrations: ExtensionRegistration[];
  commands: string[];
  tools: string[];
}

interface ProbeState {
  lifecycleEvents: string[];
  eventChannels: string[];
  emittedChannels: string[];
  commands: string[];
  tools: string[];
}

function createRegistrationApi(state: ProbeState, claimed: Set<string>) {
  const claim = (kind: 'command' | 'tool', name: string) => {
    const key = `${kind}:${name}`;
    if (claimed.has(key)) throw new Error(`duplicate ${kind} registration: ${name}`);
    claimed.add(key);
    state[`${kind}s`].push(name);
  };

  return {
    events: {
      on(channel: string) {
        state.eventChannels.push(channel);
        return () => {};
      },
      emit(channel: string) {
        state.emittedChannels.push(channel);
      },
    },
    on(event: string) {
      state.lifecycleEvents.push(event);
    },
    registerCommand(name: string) {
      claim('command', name);
    },
    registerTool(tool: { name?: unknown }) {
      if (typeof tool.name !== 'string' || !tool.name) {
        throw new Error('tool registration is missing a name');
      }
      claim('tool', tool.name);
    },
    getSessionName() {
      return undefined;
    },
  };
}

export async function inspectLocalPackage(
  root = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
): Promise<LocalLoadProbeResult> {
  const packageManifest = JSON.parse(
    await readFile(join(root, 'package.json'), 'utf8'),
  ) as {
    name?: unknown;
    pi?: { extensions?: unknown };
  };
  if (typeof packageManifest.name !== 'string') {
    throw new Error('root package manifest is missing a name');
  }
  const entrypoints = packageManifest.pi?.extensions;
  if (
    !Array.isArray(entrypoints) ||
    !entrypoints.every((value) => typeof value === 'string')
  ) {
    throw new Error('root package manifest is missing string Pi extension entrypoints');
  }

  const normalizedEntrypoints = entrypoints.map((entrypoint) =>
    entrypoint.replace(/^\.\//u, ''),
  );
  if (
    JSON.stringify(normalizedEntrypoints) !==
    JSON.stringify(EXPECTED_EXTENSION_ENTRYPOINTS)
  ) {
    throw new Error('Pi extension entrypoint order changed');
  }
  if (new Set(normalizedEntrypoints).size !== normalizedEntrypoints.length) {
    throw new Error('Pi extension entrypoints contain a duplicate');
  }

  const claimed = new Set<string>();
  const registrations: ExtensionRegistration[] = [];
  for (const entrypoint of normalizedEntrypoints) {
    const extensionModule = (await import(
      pathToFileURL(join(root, entrypoint)).href
    )) as {
      default?: unknown;
    };
    if (typeof extensionModule.default !== 'function') {
      throw new Error(`extension entrypoint has no default factory: ${entrypoint}`);
    }

    const state: ProbeState = {
      lifecycleEvents: [],
      eventChannels: [],
      emittedChannels: [],
      commands: [],
      tools: [],
    };
    extensionModule.default(createRegistrationApi(state, claimed));
    if (state.lifecycleEvents.length + state.eventChannels.length === 0) {
      throw new Error(`extension factory registered no listeners: ${entrypoint}`);
    }
    registrations.push({ entrypoint, ...state });
  }

  return {
    packageName: packageManifest.name,
    entrypoints: normalizedEntrypoints,
    registrations,
    commands: [...claimed]
      .filter((key) => key.startsWith('command:'))
      .map((key) => key.slice('command:'.length))
      .sort(),
    tools: [...claimed]
      .filter((key) => key.startsWith('tool:'))
      .map((key) => key.slice('tool:'.length))
      .sort(),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await inspectLocalPackage();
  console.log(
    `local package composition: PASS (${result.entrypoints.length} extensions, ` +
      `${result.commands.length} commands, ${result.tools.length} tools)`,
  );
}
