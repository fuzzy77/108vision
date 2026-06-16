export { ensureExtensionDirs, COMMANDS_DIR, SKILLS_DIR, PERMISSIONS_FILE } from './paths.js';
export type {
  CommandDefinition,
  ExtensionShellContext,
  LoadedSkill,
  PermissionsConfig,
  RegisteredCommand,
  SkillManifest,
} from './types.js';

export {
  initExtensions,
  initExtensionsAsync,
  reloadExtensions,
  loadCommandsFromDisk,
  type ExtensionInitResult,
} from './loader.js';
export {
  registerCommand,
  resolveCommand,
  listRegisteredCommands,
  getRegistryStats,
} from './registry.js';
export { loadPermissions, ensureDefaultPermissions } from './permissions.js';
export { tryExecuteCustomCommand } from './router.js';
export { handleCommandCli } from './commands/cli.js';
export { executeRegisteredCommand } from './commands/executor.js';
export { renderTemplate } from './commands/template.js';

export { loadSkillsFromDisk } from './skills/loader.js';
export { listSkills, resolveSkill, matchSkillImplicit } from './skills/registry.js';
export {
  tryExecuteSkillExplicit,
  tryExecuteSkillImplicit,
  tryExecuteSkillByName,
} from './skills/router.js';
export { handleSkillCli } from './skills/cli.js';
export { executeSkill } from './skills/executor.js';

export { loadPersonasFromDisk } from './agents/loader.js';
export { listPersonaAgents, resolvePersonaAgent, getDefaultPersonaName } from './agents/registry.js';
export {
  getActivePersona,
  getActivePersonaName,
  setActivePersona,
  formatActivePersonaLabel,
} from './agents/switcher.js';
export { chatWithPersona, chatWithPersonaByName } from './agents/executor.js';
export { askMultiplePersonas } from './agents/multi.js';
export { handleAgentCli, tryExecutePersonaOneShot } from './agents/cli.js';
export type { LoadedPersonaAgent, PersonaAgentDefinition } from './types.js';

export { loadMcpServersFromConfig, startMcpServer, stopMcpServer, listMcpRuntimes } from './mcp/manager.js';
export { callMcpTool } from './mcp/executor.js';
export { handleMcpCli } from './mcp/cli.js';
export { ensureMcpConfig, loadMcpConfig } from './mcp/config.js';

export {
  handleExtCli,
  handleImportCli,
  handleExportCli,
  formatExtensionsOverview,
} from './cli/unified.js';
export { importClaudePath } from './import/claude.js';
export { exportExtensionsBackup, restoreExtensionsBackup, readBackupManifest } from './export/backup.js';
export { loadExtensionsLock, recordInstalledExtension } from './lock.js';
export { handleUiCli } from './ui/cli.js';
