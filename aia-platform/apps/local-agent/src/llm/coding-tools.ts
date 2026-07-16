/**
 * Coding Tools — Native tool definitions for Vercel AI SDK tool-use loop.
 *
 * These tools are passed to generateText() and allow the LLM to perform
 * file operations, shell commands, and code editing in a multi-turn loop.
 * Equivalent to Claude Code / OpenCode built-in tools but embedded in 108ai.
 */

// @ts-nocheck — AI SDK v6 tool() generics are complex; runtime validated via Zod
import { z } from 'zod';
import { tool } from 'ai';
import { readFile, writeFile, editFile } from '../capabilities/filesystem.js';
import { listDirectory } from '../capabilities/filesystem.js';
import { grepFiles } from '../capabilities/grep.js';
import { getDiagnostics } from '../lsp/index.js';
import type { AgentConfig } from '../config.js';

export function createCodingTools(config: AgentConfig) {
  return {
    readFile: tool({
      description: 'Read a file and return its content. Use for understanding existing code before editing.',
      parameters: z.object({
        path: z.string().describe('Absolute path to the file'),
        startLine: z.number().optional().describe('Start line (1-based, inclusive)'),
        endLine: z.number().optional().describe('End line (1-based, inclusive)'),
      }),
      execute: async ({ path, startLine, endLine }) => {
        try {
          const { content } = readFile(path, config);
          if (startLine || endLine) {
            const lines = content.split('\n');
            const start = Math.max(0, (startLine ?? 1) - 1);
            const end = Math.min(lines.length, endLine ?? lines.length);
            return lines.slice(start, end).map((l, i) => `${start + i + 1}\t${l}`).join('\n');
          }
          const lines = content.split('\n');
          return lines.map((l, i) => `${i + 1}\t${l}`).join('\n');
        } catch (e) {
          return `ERROR: ${(e as Error).message}`;
        }
      },
    }),

    writeFile: tool({
      description: 'Write content to a file (creates parent dirs if needed). Use for creating new files only — use editFile for modifying existing files.',
      parameters: z.object({
        path: z.string().describe('Absolute path to the file'),
        content: z.string().describe('Full content to write'),
      }),
      execute: async ({ path, content }) => {
        try {
          const result = writeFile(path, content, config);
          return `Written ${result.size} bytes to ${result.path}`;
        } catch (e) {
          return `ERROR: ${(e as Error).message}`;
        }
      },
    }),

    editFile: tool({
      description: 'Edit an existing file by replacing oldString with newString. Uses fuzzy matching (handles whitespace/indent differences). For surgical edits — prefer over writeFile for modifications.',
      parameters: z.object({
        path: z.string().describe('Absolute path to the file'),
        oldString: z.string().describe('The text to find (can be approximate — fuzzy matching handles whitespace differences)'),
        newString: z.string().describe('The replacement text'),
        replaceAll: z.boolean().optional().describe('Replace all occurrences (default: false)'),
      }),
      execute: async ({ path, oldString, newString, replaceAll }) => {
        try {
          const result = editFile(
            path,
            [{ oldText: oldString, newText: newString, replaceAll }],
            config,
          );
          const strategy = (result as any).strategies?.[0] ?? 'exact';
          let msg = `Applied 1 edit to ${result.path} (strategy: ${strategy})`;

          // Post-edit LSP diagnostics (non-blocking — skip if server unavailable)
          try {
            const { content: updatedContent } = readFile(path, config);
            const diags = await getDiagnostics(path, updatedContent, 3000);
            const errors = diags.filter((d) => d.severity === 1);
            if (errors.length > 0) {
              msg += `\n⚠ ${errors.length} error(s) after edit:\n`;
              msg += errors.slice(0, 5).map((d) => `  L${d.range.start.line + 1}: ${d.message}`).join('\n');
            }
          } catch {
            // LSP not available — no problem, edit still applied
          }

          return msg;
        } catch (e) {
          return `ERROR: ${(e as Error).message}`;
        }
      },
    }),

    listDirectory: tool({
      description: 'List files and directories at a path. Returns names, types, and sizes.',
      parameters: z.object({
        path: z.string().describe('Absolute path to the directory'),
      }),
      execute: async ({ path }) => {
        try {
          const { entries } = listDirectory(path, config);
          return entries.map((e) => `${e.type === 'directory' ? '[DIR]' : `[${e.size}B]`} ${e.name}`).join('\n');
        } catch (e) {
          return `ERROR: ${(e as Error).message}`;
        }
      },
    }),

    grep: tool({
      description: 'Search file contents using regex. Returns matching lines with file paths and line numbers.',
      parameters: z.object({
        pattern: z.string().describe('Regex pattern to search for'),
        directory: z.string().describe('Directory to search in'),
        filePattern: z.string().optional().describe('Glob pattern to filter files (e.g., "*.ts")'),
        contextLines: z.number().optional().describe('Lines of context around matches (default: 0)'),
      }),
      execute: async ({ pattern, directory, filePattern, contextLines }) => {
        try {
          const results = grepFiles(
            { pattern, directory, filePattern, contextLines: contextLines ?? 0 },
            config,
          );
          if (results.matches.length === 0) return 'No matches found.';
          return results.matches
            .slice(0, 50)
            .map((m) => `${m.file}:${m.line}: ${m.text}`)
            .join('\n') + (results.matches.length > 50 ? `\n... (${results.matches.length - 50} more)` : '');
        } catch (e) {
          return `ERROR: ${(e as Error).message}`;
        }
      },
    }),

    shell: tool({
      description: 'Execute a shell command and return stdout/stderr. Use for running tests, git operations, builds.',
      parameters: z.object({
        command: z.string().describe('The shell command to execute'),
        cwd: z.string().optional().describe('Working directory (default: agent root)'),
        timeout: z.number().optional().describe('Timeout in milliseconds (default: 60000)'),
      }),
      execute: async ({ command, cwd, timeout }) => {
        try {
          const { execSync } = await import('node:child_process');
          const result = execSync(command, {
            cwd: cwd ?? config.allowedDirectories[0],
            timeout: timeout ?? 60_000,
            encoding: 'utf-8',
            maxBuffer: 1024 * 1024,
            shell: true,
          });
          return result.slice(0, 10_000) || '(no output)';
        } catch (e: any) {
          const stdout = e.stdout?.slice(0, 5000) ?? '';
          const stderr = e.stderr?.slice(0, 5000) ?? '';
          return `EXIT ${e.status ?? 1}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`;
        }
      },
    }),
  };
}
