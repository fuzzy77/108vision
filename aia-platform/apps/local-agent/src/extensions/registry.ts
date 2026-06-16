import type { CommandDefinition, RegisteredCommand } from './types.js';

const commandsByName = new Map<string, RegisteredCommand>();
const aliasIndex = new Map<string, string>();

function normalizeKey(name: string): string {
  return name.toLowerCase();
}

/** Register a command (builtin or file-based). Later registrations override same name. */
export function registerCommand(entry: RegisteredCommand): void {
  const key = normalizeKey(entry.definition.name);
  commandsByName.set(key, entry);

  for (const alias of entry.definition.aliases ?? []) {
    aliasIndex.set(normalizeKey(alias), key);
  }
}

/** Remove a command and its aliases from the registry */
export function unregisterCommand(name: string): boolean {
  const key = normalizeKey(name);
  const existing = commandsByName.get(key);
  if (!existing) return false;

  commandsByName.delete(key);

  for (const alias of existing.definition.aliases ?? []) {
    const aliasKey = normalizeKey(alias);
    if (aliasIndex.get(aliasKey) === key) {
      aliasIndex.delete(aliasKey);
    }
  }

  return true;
}

/** Resolve command by primary name or alias */
export function resolveCommand(name: string): RegisteredCommand | undefined {
  const key = normalizeKey(name);
  const primary = aliasIndex.get(key) ?? key;
  return commandsByName.get(primary);
}

/** List all registered commands sorted by name */
export function listRegisteredCommands(): RegisteredCommand[] {
  return [...commandsByName.values()].sort((a, b) =>
    a.definition.name.localeCompare(b.definition.name),
  );
}

/** Clear file-based commands (keeps builtins if re-registered after) */
export function clearFileCommands(): void {
  for (const [key, entry] of commandsByName) {
    if (entry.origin === 'file') {
      commandsByName.delete(key);
    }
  }

  for (const [alias, primary] of aliasIndex) {
    if (!commandsByName.has(primary)) {
      aliasIndex.delete(alias);
    }
  }
}

/** Metadata-only registration for built-ins shown in /command list */
export function registerBuiltinMetadata(
  definition: Pick<CommandDefinition, 'name' | 'description' | 'aliases'>,
  handler: RegisteredCommand['handler'],
): void {
  registerCommand({
    definition: {
      name: definition.name,
      description: definition.description,
      aliases: definition.aliases,
      version: 1,
    },
    origin: 'builtin',
    handler,
  });
}

export function getRegistryStats(): { total: number; builtin: number; file: number } {
  const all = listRegisteredCommands();
  return {
    total: all.length,
    builtin: all.filter((c) => c.origin === 'builtin').length,
    file: all.filter((c) => c.origin === 'file').length,
  };
}
