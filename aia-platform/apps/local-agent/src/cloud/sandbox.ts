/**
 * Sandbox abstraction layer — wraps E2B (or future alternatives)
 * behind a provider-agnostic interface.
 *
 * The coding-agent operates identically whether running local or cloud:
 * only the tool implementations change (local fs vs sandbox API).
 */

export interface SandboxFile {
  path: string;
  content: string;
  size: number;
}

export interface SandboxProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface SandboxDirEntry {
  name: string;
  type: 'file' | 'directory';
  size: number;
}

export interface Sandbox {
  readonly id: string;
  readonly provider: 'e2b' | 'fly' | 'local';

  filesystem: {
    read(path: string): Promise<string>;
    write(path: string, content: string): Promise<void>;
    list(path: string): Promise<SandboxDirEntry[]>;
    exists(path: string): Promise<boolean>;
  };

  process: {
    exec(command: string, opts?: {
      cwd?: string;
      timeout?: number;
      env?: Record<string, string>;
    }): Promise<SandboxProcessResult>;
  };

  destroy(): Promise<void>;
  keepAlive(durationMs: number): Promise<void>;
}

export interface SandboxCreateOptions {
  template?: string;
  timeout?: number;
  env?: Record<string, string>;
  metadata?: Record<string, string>;
}
