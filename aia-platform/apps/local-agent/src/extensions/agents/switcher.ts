import {
  getDefaultPersonaName,
  getPersonaAgentOrDefault,
  listPersonaAgents,
  resolvePersonaAgent,
} from './registry.js';
import {
  loadActiveAgentName,
  saveActiveAgentName,
  clearPersonaHistory,
} from './history.js';

let activePersonaName = 'assistant';

export function initActivePersona(): void {
  activePersonaName = loadActiveAgentName();
  if (!resolvePersonaAgent(activePersonaName)) {
    activePersonaName = getDefaultPersonaName();
    const fallback = getPersonaAgentOrDefault();
    if (fallback) {
      activePersonaName = fallback.definition.name;
    }
    saveActiveAgentName(activePersonaName);
  }
}

export function getActivePersonaName(): string {
  return activePersonaName;
}

export function getActivePersona() {
  return getPersonaAgentOrDefault(activePersonaName);
}

export function setActivePersona(name: string): { ok: boolean; message: string } {
  const persona = resolvePersonaAgent(name);
  if (!persona) {
    const available = listPersonaAgents()
      .map((p) => p.definition.name)
      .join(', ');
    return {
      ok: false,
      message: `Agent non trovato: ${name}. Disponibili: ${available || '(nessuno)'}`,
    };
  }

  activePersonaName = persona.definition.name;
  saveActiveAgentName(activePersonaName);
  const label = persona.definition.display_name ?? persona.definition.name;
  return { ok: true, message: `Agent attivo: ${label} (@${persona.definition.name})` };
}

export function resetActivePersonaHistory(): void {
  clearPersonaHistory(activePersonaName);
}

export function formatActivePersonaLabel(): string {
  const persona = getActivePersona();
  if (!persona) return 'assistant';
  const d = persona.definition;
  const avatar = d.avatar ? `${d.avatar} ` : '';
  return `${avatar}${d.display_name ?? d.name}`;
}
