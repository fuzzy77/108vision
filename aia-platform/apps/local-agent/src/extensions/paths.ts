import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const EXTENSIONS_BASE_DIR = join(homedir(), '.108ai');
export const COMMANDS_DIR = join(EXTENSIONS_BASE_DIR, 'commands');
export const SKILLS_DIR = join(EXTENSIONS_BASE_DIR, 'skills');
export const AGENTS_DIR = join(EXTENSIONS_BASE_DIR, 'agents');
export const PERMISSIONS_FILE = join(EXTENSIONS_BASE_DIR, 'permissions.yml');
export const MCP_CONFIG_FILE = join(EXTENSIONS_BASE_DIR, 'mcp.yml');
export const EXTENSIONS_LOCK_FILE = join(EXTENSIONS_BASE_DIR, 'extensions-lock.json');

/** Ensure extension directories exist under ~/.108ai */
export function ensureExtensionDirs(): void {
  for (const dir of [EXTENSIONS_BASE_DIR, COMMANDS_DIR, SKILLS_DIR, AGENTS_DIR]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}
