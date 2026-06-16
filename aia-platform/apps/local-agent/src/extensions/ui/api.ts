import { listPersonaAgents } from '../agents/registry.js';
import { getActivePersonaName } from '../agents/switcher.js';
import { listRegisteredCommands } from '../registry.js';
import { listSkills } from '../skills/registry.js';
import { listMcpRuntimes } from '../mcp/manager.js';
import { loadStoreCatalog, searchStoreCatalog } from './store/catalog.js';

export interface UiApiSnapshot {
  generatedAt: string;
  activeAgent: string;
  commands: Array<{ name: string; description: string; aliases: string[] }>;
  skills: Array<{ name: string; description: string; triggers: string[] }>;
  agents: Array<{ name: string; displayName: string; description: string; avatar?: string }>;
  mcp: Array<{
    name: string;
    status: string;
    transport: string;
    toolCount: number;
    description?: string;
    lastError?: string;
  }>;
  store: ReturnType<typeof loadStoreCatalog>;
}

export function buildUiApiSnapshot(query = '', storeType = 'all'): UiApiSnapshot {
  const q = query.toLowerCase();

  const commands = listRegisteredCommands()
    .map((e) => ({
      name: e.definition.name,
      description: e.definition.description,
      aliases: e.definition.aliases ?? [],
    }))
    .filter((c) => !q || `${c.name} ${c.description}`.toLowerCase().includes(q));

  const skills = listSkills()
    .map((s) => ({
      name: s.manifest.name,
      description: s.manifest.description,
      triggers: s.manifest.trigger?.explicit ?? [],
    }))
    .filter((s) => !q || `${s.name} ${s.description}`.toLowerCase().includes(q));

  const agents = listPersonaAgents().map((a) => ({
    name: a.definition.name,
    displayName: a.definition.display_name ?? a.definition.name,
    description: a.definition.description,
    avatar: a.definition.avatar,
  }));

  const mcp = listMcpRuntimes().map((r) => ({
    name: r.definition.name,
    status: r.status,
    transport: r.definition.transport,
    toolCount: r.tools.length || r.definition.tools_exposed?.length || 0,
    description: r.definition.description,
    lastError: r.lastError,
  }));

  return {
    generatedAt: new Date().toISOString(),
    activeAgent: getActivePersonaName(),
    commands,
    skills,
    agents,
    mcp,
    store: {
      ...loadStoreCatalog(),
      items: searchStoreCatalog(query, storeType),
    },
  };
}
