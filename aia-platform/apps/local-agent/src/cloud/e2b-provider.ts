/**
 * E2B Sandbox Provider — Concrete implementation using E2B Code Interpreter.
 *
 * E2B provides ephemeral Linux VMs with ~300ms boot time.
 * Each sandbox is fully isolated (separate kernel via Firecracker).
 *
 * Requires: E2B_API_KEY env variable.
 */

import type { Sandbox, SandboxCreateOptions, SandboxDirEntry, SandboxProcessResult } from './sandbox.js';

export async function createE2BSandbox(opts: SandboxCreateOptions = {}): Promise<Sandbox> {
  const e2b = await importE2B();
  const template = opts.template ?? '108ai-workspace';

  const sbx = await e2b.Sandbox.create(template, {
    timeoutMs: opts.timeout ?? 300_000,
    envs: opts.env,
    metadata: opts.metadata,
  });

  const id = sbx.sandboxId;

  return {
    id,
    provider: 'e2b',

    filesystem: {
      async read(path: string): Promise<string> {
        return sbx.files.read(path);
      },

      async write(path: string, content: string): Promise<void> {
        await sbx.files.write(path, content);
      },

      async list(path: string): Promise<SandboxDirEntry[]> {
        const entries = await sbx.files.list(path);
        return entries.map((e: any) => ({
          name: e.name,
          type: e.type as 'file' | 'directory',
          size: e.type === 'file' ? e.size ?? 0 : 0,
        }));
      },

      async exists(path: string): Promise<boolean> {
        try {
          await sbx.files.read(path);
          return true;
        } catch {
          return false;
        }
      },
    },

    process: {
      async exec(command: string, execOpts?: {
        cwd?: string;
        timeout?: number;
        env?: Record<string, string>;
      }): Promise<SandboxProcessResult> {
        const fullCmd = execOpts?.cwd
          ? `cd ${execOpts.cwd} && ${command}`
          : command;

        const result = await sbx.commands.run(fullCmd, {
          timeoutMs: execOpts?.timeout ?? 60_000,
          envs: execOpts?.env,
        });

        return {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
        };
      },
    },

    async destroy(): Promise<void> {
      await sbx.kill();
    },

    async keepAlive(durationMs: number): Promise<void> {
      await sbx.setTimeout(durationMs);
    },
  };
}

async function importE2B(): Promise<any> {
  try {
    return await import('@e2b/code-interpreter');
  } catch {
    return await import('e2b');
  }
}
