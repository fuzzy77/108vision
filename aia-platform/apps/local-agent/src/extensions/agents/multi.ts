import type { ModelTier } from '@aia/shared';

import { createPlan, executeOrchestration } from '../../multi-agent/orchestrator.js';
import { loadPermissions } from '../permissions.js';
import type { LoadedPersonaAgent } from '../types.js';
import { resolvePersonaAgent } from './registry.js';

function mapModelTier(model?: string): ModelTier {
  const normalized = (model ?? 'balanced').toLowerCase();
  if (normalized === 'fast-cheap' || normalized === 'fast') return 'fast-cheap';
  if (normalized === 'powerful' || normalized === 'power') return 'powerful';
  return 'balanced';
}

function personaToOrchestratorAgent(persona: LoadedPersonaAgent) {
  const d = persona.definition;
  return {
    id: d.name,
    role: 'custom' as const,
    name: d.display_name ?? d.name,
    systemPrompt: d.system_prompt,
    model: mapModelTier(d.model),
    maxTokens: d.max_tokens ?? 3000,
    timeout: 120_000,
  };
}

/**
 * Query multiple persona agents in parallel and merge via orchestrator summarize.
 */
export async function askMultiplePersonas(
  names: string[],
  query: string,
): Promise<{ output: string; totalTokens: number; agents: string[] }> {
  const perms = loadPermissions();
  if (!perms.agents.allow_multi_agent) {
    throw new Error(
      'Multi-agent disabilitato. Imposta agents.allow_multi_agent: true in permissions.yml',
    );
  }

  if (names.length > perms.agents.max_agent_depth) {
    throw new Error(
      `Troppi agent (max ${perms.agents.max_agent_depth}). Riduci la lista o aggiorna permissions.yml`,
    );
  }

  const personas: LoadedPersonaAgent[] = [];
  const missing: string[] = [];

  for (const name of names) {
    const persona = resolvePersonaAgent(name.trim());
    if (persona) {
      personas.push(persona);
    } else {
      missing.push(name);
    }
  }

  if (personas.length === 0) {
    throw new Error(`Nessun agent valido. Non trovati: ${missing.join(', ')}`);
  }

  const builder = createPlan(
    'Multi-Persona Query',
    `Query parallela su ${personas.length} agent`,
  );

  for (const persona of personas) {
    const agent = personaToOrchestratorAgent(persona);
    builder.addAgent(agent).addTask(agent.id, query);
  }

  builder
    .setMerge(
      'summarize',
      'Sintetizza le risposte degli agenti in un unico documento coerente in italiano. ' +
        'Evidenzia accordi, divergenze e raccomandazioni operative.',
    )
    .setBudget(personas.length * 6_000);

  const result = await executeOrchestration(builder.build());

  let output = result.mergedOutput;
  if (missing.length > 0) {
    output += `\n\n---\n⚠️ Agent non trovati: ${missing.join(', ')}`;
  }

  return {
    output,
    totalTokens: result.totalTokens,
    agents: personas.map((p) => p.definition.name),
  };
}
