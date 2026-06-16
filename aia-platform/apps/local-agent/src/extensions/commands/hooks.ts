import type { ExtensionShellContext } from '../types.js';
import { resolveCommand } from '../registry.js';
import { executeRegisteredCommand } from './executor.js';

const MAX_HOOK_DEPTH = 2;

/**
 * Run a hook command by name (before/after main command). Same args as parent.
 * Skips silently if hook command is missing.
 */
export async function runCommandHook(
  hookName: string | null | undefined,
  args: string[],
  shellCtx: ExtensionShellContext,
  depth = 0,
): Promise<string | undefined> {
  if (!hookName?.trim()) return undefined;
  if (depth >= MAX_HOOK_DEPTH) return undefined;

  const hook = resolveCommand(hookName.trim());
  if (!hook) return undefined;

  const result = await executeRegisteredCommand(hook, args, shellCtx, depth + 1);
  return result.output;
}
