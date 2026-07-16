/**
 * Sandbox Coding Tools — Same tool interface as local coding-tools.ts
 * but operations execute inside a remote sandbox.
 *
 * This is the key abstraction: the LLM sees identical tools whether
 * running locally or in cloud. Only the execution backend changes.
 */

// @ts-nocheck — AI SDK v6 tool() generics
import { z } from 'zod';
import { tool } from 'ai';
import { fuzzyReplace } from '../capabilities/fuzzy-edit.js';
import type { Sandbox } from './sandbox.js';

export function createSandboxCodingTools(sandbox: Sandbox) {
  return {
    readFile: tool({
      description: 'Read a file from the workspace. Use before editing to understand context.',
      parameters: z.object({
        path: z.string().describe('Path relative to /workspace'),
        startLine: z.number().optional().describe('Start line (1-based)'),
        endLine: z.number().optional().describe('End line (1-based)'),
      }),
      execute: async ({ path, startLine, endLine }) => {
        try {
          const fullPath = normalizePath(path);
          const content = await sandbox.filesystem.read(fullPath);
          const lines = content.split('\n');

          if (startLine || endLine) {
            const start = Math.max(0, (startLine ?? 1) - 1);
            const end = Math.min(lines.length, endLine ?? lines.length);
            return lines.slice(start, end).map((l, i) => `${start + i + 1}\t${l}`).join('\n');
          }
          return lines.map((l, i) => `${i + 1}\t${l}`).join('\n');
        } catch (e) {
          return `ERROR: ${(e as Error).message}`;
        }
      },
    }),

    writeFile: tool({
      description: 'Write content to a file (creates parent dirs). Use for new files only.',
      parameters: z.object({
        path: z.string().describe('Path relative to /workspace'),
        content: z.string().describe('Full file content'),
      }),
      execute: async ({ path, content }) => {
        try {
          const fullPath = normalizePath(path);
          // Ensure parent directory exists
          const dir = fullPath.split('/').slice(0, -1).join('/');
          if (dir) {
            await sandbox.process.exec(`mkdir -p ${dir}`);
          }
          await sandbox.filesystem.write(fullPath, content);
          return `Written ${Buffer.byteLength(content)} bytes to ${fullPath}`;
        } catch (e) {
          return `ERROR: ${(e as Error).message}`;
        }
      },
    }),

    editFile: tool({
      description: 'Edit an existing file by replacing oldString with newString. Uses fuzzy matching.',
      parameters: z.object({
        path: z.string().describe('Path relative to /workspace'),
        oldString: z.string().describe('Text to find (fuzzy matching handles whitespace)'),
        newString: z.string().describe('Replacement text'),
      }),
      execute: async ({ path, oldString, newString }) => {
        try {
          const fullPath = normalizePath(path);
          const content = await sandbox.filesystem.read(fullPath);

          const result = fuzzyReplace(content, oldString, newString);
          await sandbox.filesystem.write(fullPath, result.content);

          return `Edited ${fullPath} (strategy: ${result.strategy})`;
        } catch (e) {
          return `ERROR: ${(e as Error).message}`;
        }
      },
    }),

    listDirectory: tool({
      description: 'List files and directories.',
      parameters: z.object({
        path: z.string().describe('Path relative to /workspace'),
      }),
      execute: async ({ path }) => {
        try {
          const fullPath = normalizePath(path);
          const entries = await sandbox.filesystem.list(fullPath);
          return entries
            .map((e) => `${e.type === 'directory' ? '[DIR]' : `[${e.size}B]`} ${e.name}`)
            .join('\n');
        } catch (e) {
          return `ERROR: ${(e as Error).message}`;
        }
      },
    }),

    grep: tool({
      description: 'Search file contents using grep/ripgrep in the sandbox.',
      parameters: z.object({
        pattern: z.string().describe('Regex pattern'),
        directory: z.string().describe('Directory to search'),
        filePattern: z.string().optional().describe('Glob filter (e.g., "*.ts")'),
      }),
      execute: async ({ pattern, directory, filePattern }) => {
        try {
          const dir = normalizePath(directory);
          const includeFlag = filePattern ? `--include='${filePattern}'` : '';
          const cmd = `grep -rn ${includeFlag} '${pattern.replace(/'/g, "'\\''")}' ${dir} 2>/dev/null | head -50`;
          const result = await sandbox.process.exec(cmd, { timeout: 15_000 });
          return result.stdout || 'No matches found.';
        } catch (e) {
          return `ERROR: ${(e as Error).message}`;
        }
      },
    }),

    shell: tool({
      description: 'Execute a shell command in the sandbox. Use for tests, builds, git.',
      parameters: z.object({
        command: z.string().describe('Shell command to execute'),
        cwd: z.string().optional().describe('Working directory (default: /workspace)'),
        timeout: z.number().optional().describe('Timeout in ms (default: 60000)'),
      }),
      execute: async ({ command, cwd, timeout }) => {
        try {
          const result = await sandbox.process.exec(command, {
            cwd: cwd ? normalizePath(cwd) : '/workspace',
            timeout: timeout ?? 60_000,
          });
          const output = [
            result.stdout ? `STDOUT:\n${result.stdout.slice(0, 8000)}` : '',
            result.stderr ? `STDERR:\n${result.stderr.slice(0, 4000)}` : '',
          ].filter(Boolean).join('\n');
          return `EXIT ${result.exitCode}\n${output || '(no output)'}`;
        } catch (e) {
          return `ERROR: ${(e as Error).message}`;
        }
      },
    }),
  };
}

function normalizePath(path: string): string {
  if (path.startsWith('/')) return path;
  return `/workspace/${path.replace(/^\.\//, '')}`;
}
