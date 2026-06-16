import { reloadExtensions } from '../loader.js';
import { loadPermissions, ensureDefaultPermissions } from '../permissions.js';
import { listMcpRuntimes, loadMcpServersFromConfig } from '../mcp/manager.js';
import { listPersonaAgents } from '../agents/registry.js';
import { listRegisteredCommands } from '../registry.js';
import { listSkills } from '../skills/registry.js';
import { loadExtensionsLock } from '../lock.js';
import { importClaudePath } from '../import/claude.js';
import { importN8nWorkflow } from '../import/n8n.js';
import { importChatGptConfig } from '../import/chatgpt.js';
import { exportExtensionsBackup, restoreExtensionsBackup } from '../export/backup.js';
import { handleCommandCli } from '../commands/cli.js';
import { handleSkillCli } from '../skills/cli.js';
import { handleAgentCli } from '../agents/cli.js';
import { handleMcpCli } from '../mcp/cli.js';
import type { ExtensionShellContext } from '../types.js';

function bold(text: string): string {
  return `\x1b[1m${text}\x1b[0m`;
}

function dim(text: string): string {
  return `\x1b[90m${text}\x1b[0m`;
}

export function formatExtensionsOverview(): string {
  const cmds = listRegisteredCommands().length;
  const skills = listSkills().length;
  const agents = listPersonaAgents().length;
  const mcp = listMcpRuntimes().length;
  const lock = loadExtensionsLock();

  return [
    `  ${bold('108ai Extensions')}`,
    `  Commands: ${cmds} | Skills: ${skills} | Agents: ${agents} | MCP: ${mcp}`,
    `  Lock entries: ${lock.entries.length} ${dim('(~/.108ai/extensions-lock.json)')}`,
    '',
  ].join('\n');
}

export async function handleExtCli(
  args: string[],
  _shellCtx: ExtensionShellContext,
): Promise<string> {
  const sub = args[0]?.toLowerCase() ?? 'status';

  switch (sub) {
    case 'status':
    case 'list':
      return `${formatExtensionsOverview()}\n`;

    case 'reload': {
      const result = reloadExtensions();
      const mcp = loadMcpServersFromConfig();
      return [
        `  Ricaricato: ${result.commandsLoaded} cmd, ${result.skillsLoaded} skill, ${result.agentsLoaded} agent, ${mcp.loaded} mcp`,
        ...result.warnings.map((w) => `  [WARN] ${w}`),
        '',
      ].join('\n');
    }

    case 'permissions': {
      ensureDefaultPermissions();
      const p = loadPermissions(true);
      return `${bold('permissions.yml')}\n${JSON.stringify(p, null, 2)}\n`;
    }

    case 'audit':
      return [
        formatExtensionsOverview(),
        await handleMcpCli(['audit']),
      ].join('\n');

    default:
      return '  Uso: /ext status | reload | permissions | audit\n';
  }
}

export async function handleImportCli(args: string[]): Promise<string> {
  const source = args[0]?.toLowerCase();
  const path = args[1];

  if (!source || !path) {
    return '  Uso: /import claude|n8n|chatgpt <path> | /import restore <backup-dir>\n';
  }

  if (source === 'restore') {
    const result = restoreExtensionsBackup(path);
    if (!result.ok) return `  \x1b[31m[ERR]\x1b[0m ${result.message}\n`;
    const lines = [`  \x1b[32m[OK]\x1b[0m ${result.message}`];
    for (const item of result.restored) lines.push(`    - ${item}`);
    return lines.join('\n') + '\n';
  }

  if (source === 'claude') {
    const result = importClaudePath(path);
    if (!result.ok) return `  \x1b[31m[ERR]\x1b[0m ${result.message}\n`;
    const lines = [`  \x1b[32m[OK]\x1b[0m ${result.message}`];
    for (const item of result.imported) lines.push(`    - ${item}`);
    for (const w of result.warnings) lines.push(`  [WARN] ${w}`);
    return lines.join('\n') + '\n';
  }

  if (source === 'n8n') {
    const result = importN8nWorkflow(path);
    if (!result.ok) return `  \x1b[31m[ERR]\x1b[0m ${result.message}\n`;
    const lines = [`  \x1b[32m[OK]\x1b[0m ${result.message}`];
    for (const item of result.imported) lines.push(`    - ${item}`);
    for (const w of result.warnings) lines.push(`  [WARN] ${w}`);
    return lines.join('\n') + '\n';
  }

  if (source === 'chatgpt') {
    const result = importChatGptConfig(path);
    if (!result.ok) return `  \x1b[31m[ERR]\x1b[0m ${result.message}\n`;
    const lines = [`  \x1b[32m[OK]\x1b[0m ${result.message}`];
    for (const item of result.imported) lines.push(`    - ${item}`);
    for (const w of result.warnings) lines.push(`  [WARN] ${w}`);
    return lines.join('\n') + '\n';
  }

  return `  Fonte import non supportata: ${source}\n`;
}

export async function handleExportCli(args: string[]): Promise<string> {
  const fmt = args[0]?.toLowerCase() ?? 'backup';
  const target = args[1];

  if (fmt === 'backup' || fmt === 'all') {
    const result = exportExtensionsBackup(target);
    return result.ok ? `  \x1b[32m[OK]\x1b[0m ${result.message}\n` : `  Export fallito\n`;
  }

  if (fmt === 'restore') {
    if (!target) return '  Uso: /export restore <backup-directory>\n';
    const result = restoreExtensionsBackup(target);
    return result.ok
      ? `  \x1b[32m[OK]\x1b[0m ${result.message}\n`
      : `  \x1b[31m[ERR]\x1b[0m ${result.message}\n`;
  }

  return '  Uso: /export backup [directory] | /export restore <dir>\n';
}

export async function handleUnifiedExtensionCli(
  namespace: string,
  args: string[],
  shellCtx: ExtensionShellContext,
): Promise<string> {
  switch (namespace) {
    case 'command':
    case 'commands':
      return handleCommandCli(args);
    case 'skill':
    case 'skills':
      return handleSkillCli(args, shellCtx);
    case 'agent':
    case 'agents':
      return handleAgentCli(args, shellCtx);
    case 'mcp':
      return handleMcpCli(args);
    case 'ext':
    case 'extensions':
      return handleExtCli(args, shellCtx);
    case 'import':
      return handleImportCli(args);
    case 'export':
      return handleExportCli(args);
    default:
      return '';
  }
}
