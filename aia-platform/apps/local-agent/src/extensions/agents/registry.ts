import type { LoadedPersonaAgent } from '../types.js';

const personasByName = new Map<string, LoadedPersonaAgent>();
let defaultPersonaName = 'assistant';

function normalizeKey(name: string): string {
  return name.toLowerCase();
}

export function registerPersonaAgent(agent: LoadedPersonaAgent): void {
  personasByName.set(normalizeKey(agent.definition.name), agent);
  if (agent.isDefault) {
    defaultPersonaName = agent.definition.name;
  }
}

export function clearPersonaAgents(): void {
  personasByName.clear();
  defaultPersonaName = 'assistant';
}

export function resolvePersonaAgent(name: string): LoadedPersonaAgent | undefined {
  return personasByName.get(normalizeKey(name));
}

export function getDefaultPersonaName(): string {
  return defaultPersonaName;
}

export function listPersonaAgents(): LoadedPersonaAgent[] {
  return [...personasByName.values()].sort((a, b) =>
    a.definition.name.localeCompare(b.definition.name),
  );
}

export function getPersonaAgentOrDefault(name?: string): LoadedPersonaAgent | undefined {
  if (name) {
    return resolvePersonaAgent(name) ?? resolvePersonaAgent(defaultPersonaName);
  }
  return resolvePersonaAgent(defaultPersonaName) ?? listPersonaAgents()[0];
}
