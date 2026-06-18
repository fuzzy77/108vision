import { resolveCommand } from './registry.js';
import type { ExtensionShellContext } from './types.js';
import { executeRegisteredCommand } from './commands/executor.js';

export interface ExtensionRouteResult {
  handled: boolean;
  output?: string;
  tokens?: number;
  model?: string;
}

/**
 * Try to execute a registered command (YAML prompt or platform builtin handler).
 */
export async function tryExecuteCustomCommand(
  cmd: string,
  args: string[],
  shellCtx: ExtensionShellContext,
): Promise<ExtensionRouteResult> {
  const entry = resolveCommand(cmd);
  if (!entry) {
    return { handled: false };
  }

  // Built-ins with explicit handlers (future migration path)
  if (entry.origin === 'builtin' && !entry.handler) {
    return { handled: false };
  }

  // Skip file commands without prompt or builtin handler
  if (entry.origin === 'file' && !entry.handler && !entry.definition.prompt?.trim()) {
    return { handled: false };
  }

  try {
    const result = await executeRegisteredCommand(entry, args, shellCtx);
    return {
      handled: true,
      output: result.output,
      tokens: result.tokens,
      model: result.model,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      handled: true,
      output: `  \x1b[31m[ERR]\x1b[0m ${message}\n`,
    };
  }
}
