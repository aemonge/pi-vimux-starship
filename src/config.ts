export const PACKAGE_SETTINGS_KEY = 'piVimuxStarship' as const;

export const PACKAGE_CONFIG_SECTIONS = ['footer', 'status', 'vim'] as const;
export type PackageConfigSection = (typeof PACKAGE_CONFIG_SECTIONS)[number];
export type ConfigRecord = Record<string, unknown>;

export interface NamespacedConfigLayers {
  global: ConfigRecord | undefined;
  project: ConfigRecord | undefined;
}

export function isConfigRecord(value: unknown): value is ConfigRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getNamespacedSection(
  settings: unknown,
  section: PackageConfigSection,
): ConfigRecord | undefined {
  if (!isConfigRecord(settings)) return undefined;
  const namespace = settings[PACKAGE_SETTINGS_KEY];
  if (!isConfigRecord(namespace)) return undefined;
  const value = namespace[section];
  return isConfigRecord(value) ? value : undefined;
}

export function readNamespacedLayers(
  globalSettings: unknown,
  projectSettings: unknown,
  section: PackageConfigSection,
  options: { allowProject?: boolean } = {},
): NamespacedConfigLayers {
  return {
    global: getNamespacedSection(globalSettings, section),
    project:
      options.allowProject === false
        ? undefined
        : getNamespacedSection(projectSettings, section),
  };
}

export function mergeConfigRecords(
  ...sources: Array<ConfigRecord | undefined>
): ConfigRecord {
  const output: ConfigRecord = {};
  for (const source of sources) {
    if (!source) continue;
    for (const [key, value] of Object.entries(source)) {
      const current = output[key];
      output[key] =
        isConfigRecord(current) && isConfigRecord(value)
          ? mergeConfigRecords(current, value)
          : structuredClone(value);
    }
  }
  return output;
}
