const ENV_VAR_PATTERN = /\$\{([A-Z_][A-Z0-9_]*)\}/g;

/**
 * Resolve ${ENV_VAR} placeholders from process.env (never from YAML literals).
 */
export function resolveSecretString(value: string): string {
  return value.replace(ENV_VAR_PATTERN, (_, name: string) => process.env[name] ?? '');
}

export function resolveSecretRecord(
  env?: Record<string, string>,
): Record<string, string> | undefined {
  if (!env) return undefined;
  const resolved: Record<string, string> = {};
  for (const [key, val] of Object.entries(env)) {
    resolved[key] = resolveSecretString(val);
  }
  return resolved;
}

export function containsUnresolvedSecrets(value: string): boolean {
  ENV_VAR_PATTERN.lastIndex = 0;
  const match = ENV_VAR_PATTERN.exec(value);
  if (!match) return false;
  const envName = match[1];
  return !process.env[envName ?? ''];
}
