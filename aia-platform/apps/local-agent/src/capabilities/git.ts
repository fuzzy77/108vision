/**
 * Git capabilities — read-only and low-risk git operations within allowed directories.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, normalize } from 'node:path';

import type { AgentConfig } from '../config.js';
import { validatePath } from '../security.js';

export interface GitCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
  cwd: string;
}

function assertGitEnabled(config: AgentConfig): void {
  if (config.gitEnabled === false) {
    throw new Error('Git capabilities are disabled (gitEnabled: false)');
  }
}

function resolveGitCwd(cwd: string | undefined, config: AgentConfig): string {
  const base = cwd ?? config.allowedDirectories[0];
  if (!base) {
    throw new Error('No cwd specified and no allowedDirectories configured');
  }

  const resolved = resolve(normalize(base));
  const validated = validatePath(resolved, config.allowedDirectories);
  if (!validated) {
    throw new Error(`cwd "${base}" is outside allowed directories`);
  }

  if (!existsSync(validated)) {
    throw new Error(`Directory does not exist: ${validated}`);
  }

  return validated;
}

function runGit(
  args: string[],
  cwd: string,
  config: AgentConfig,
): GitCommandResult {
  assertGitEnabled(config);

  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf-8',
    maxBuffer: 2 * 1024 * 1024,
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      GCM_INTERACTIVE: 'Never',
    },
  });

  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
    command: `git ${args.join(' ')}`,
    cwd,
  };
}

function ensureGitRepo(cwd: string, config: AgentConfig): void {
  const check = runGit(['rev-parse', '--is-inside-work-tree'], cwd, config);
  if (check.exitCode !== 0 || check.stdout.trim() !== 'true') {
    throw new Error(`Not a git repository: ${cwd}`);
  }
}

export function gitStatus(
  params: { cwd?: string },
  config: AgentConfig,
): GitCommandResult {
  const cwd = resolveGitCwd(params.cwd, config);
  ensureGitRepo(cwd, config);
  return runGit(['status', '--porcelain=v2', '-b'], cwd, config);
}

export function gitDiff(
  params: { cwd?: string; staged?: boolean; file?: string },
  config: AgentConfig,
): GitCommandResult {
  const cwd = resolveGitCwd(params.cwd, config);
  ensureGitRepo(cwd, config);

  const args = ['diff'];
  if (params.staged) args.push('--staged');
  if (params.file) args.push('--', params.file);

  return runGit(args, cwd, config);
}

export function gitLog(
  params: { cwd?: string; count?: number; format?: string },
  config: AgentConfig,
): GitCommandResult {
  const cwd = resolveGitCwd(params.cwd, config);
  ensureGitRepo(cwd, config);

  const count = Math.min(Math.max(params.count ?? 20, 1), 200);
  const format = params.format ?? '%h %ad %s';
  return runGit(
    ['log', '-n', String(count), `--pretty=format:${format}`, '--date=short'],
    cwd,
    config,
  );
}

export function gitCommit(
  params: { message: string; files?: string[]; cwd?: string },
  config: AgentConfig,
): GitCommandResult {
  const cwd = resolveGitCwd(params.cwd, config);
  ensureGitRepo(cwd, config);

  if (!params.message?.trim()) {
    throw new Error('Commit message is required');
  }

  if (params.files && params.files.length > 0) {
    for (const file of params.files) {
      const validated = validatePath(resolve(cwd, file), config.allowedDirectories);
      if (!validated) {
        throw new Error(`File outside allowed directories: ${file}`);
      }
    }
    const add = runGit(['add', '--', ...params.files], cwd, config);
    if (add.exitCode !== 0) {
      return add;
    }
  }

  return runGit(['commit', '-m', params.message], cwd, config);
}

export function gitBranch(
  params: { action: string; name?: string; cwd?: string },
  config: AgentConfig,
): GitCommandResult {
  const cwd = resolveGitCwd(params.cwd, config);
  ensureGitRepo(cwd, config);

  const action = params.action.toLowerCase();
  switch (action) {
    case 'list':
      return runGit(['branch', '--list', '--verbose'], cwd, config);
    case 'create':
      if (!params.name) throw new Error('Branch name required for create');
      return runGit(['branch', params.name], cwd, config);
    case 'switch':
    case 'checkout':
      if (!params.name) throw new Error('Branch name required for switch');
      return runGit(['switch', params.name], cwd, config);
    case 'delete':
      if (!params.name) throw new Error('Branch name required for delete');
      return runGit(['branch', '-d', params.name], cwd, config);
    default:
      throw new Error(`Unknown branch action: ${params.action}`);
  }
}

export function gitStash(
  params: { action: string; cwd?: string },
  config: AgentConfig,
): GitCommandResult {
  const cwd = resolveGitCwd(params.cwd, config);
  ensureGitRepo(cwd, config);

  switch (params.action.toLowerCase()) {
    case 'list':
      return runGit(['stash', 'list'], cwd, config);
    case 'push':
      return runGit(['stash', 'push', '-m', '108ai-stash'], cwd, config);
    case 'pop':
      return runGit(['stash', 'pop'], cwd, config);
    default:
      throw new Error(`Unknown stash action: ${params.action}`);
  }
}

export function gitBlame(
  params: { filePath: string; startLine?: number; endLine?: number; cwd?: string },
  config: AgentConfig,
): GitCommandResult {
  const cwd = resolveGitCwd(params.cwd, config);
  ensureGitRepo(cwd, config);

  const validated = validatePath(resolve(cwd, params.filePath), config.allowedDirectories);
  if (!validated) {
    throw new Error(`File outside allowed directories: ${params.filePath}`);
  }

  const args = ['blame', '--line-porcelain'];
  if (params.startLine !== undefined && params.endLine !== undefined) {
    args.push(`-L${params.startLine},${params.endLine}`);
  }
  args.push('--', params.filePath);

  return runGit(args, cwd, config);
}

export function gitPush(
  params: { remote?: string; branch?: string; force?: boolean; cwd?: string; _approved?: boolean },
  config: AgentConfig,
): GitCommandResult {
  if (!config.gitAllowPush && params._approved !== true) {
    throw new Error('git push requires gitAllowPush: true or gateway approval (_approved: true)');
  }

  const cwd = resolveGitCwd(params.cwd, config);
  ensureGitRepo(cwd, config);

  if (params.force) {
    throw new Error('git push --force is blocked');
  }

  const args = ['push', params.remote ?? 'origin'];
  if (params.branch) args.push(params.branch);

  return runGit(args, cwd, config);
}

export function gitReset(
  params: { mode?: string; ref?: string; cwd?: string; _approved?: boolean },
  config: AgentConfig,
): GitCommandResult {
  if (!config.gitAllowDestructive && params._approved !== true) {
    throw new Error('git reset requires gitAllowDestructive: true or gateway approval (_approved: true)');
  }

  const mode = params.mode ?? 'mixed';
  if (mode === 'hard') {
    throw new Error('git reset --hard is blocked even with approval (use soft/mixed only)');
  }

  const cwd = resolveGitCwd(params.cwd, config);
  ensureGitRepo(cwd, config);

  const args = ['reset', `--${mode}`];
  if (params.ref) args.push(params.ref);

  return runGit(args, cwd, config);
}
