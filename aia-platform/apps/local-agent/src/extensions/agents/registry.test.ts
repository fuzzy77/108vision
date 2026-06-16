import { describe, expect, it, beforeEach } from 'vitest';

import type { LoadedPersonaAgent } from '../types.js';
import {
  clearPersonaAgents,
  getDefaultPersonaName,
  listPersonaAgents,
  registerPersonaAgent,
  resolvePersonaAgent,
} from './registry.js';

function makeAgent(name: string, isDefault = false): LoadedPersonaAgent {
  return {
    definition: {
      name,
      description: `Test agent ${name}`,
      system_prompt: 'You are a test agent.',
    },
    filePath: `/tmp/${name}.yml`,
    isDefault,
  };
}

describe('persona agent registry', () => {
  beforeEach(() => {
    clearPersonaAgents();
  });

  it('registers and resolves by name case-insensitively', () => {
    registerPersonaAgent(makeAgent('accountant'));
    expect(resolvePersonaAgent('Accountant')?.definition.name).toBe('accountant');
  });

  it('tracks default persona name', () => {
    registerPersonaAgent(makeAgent('assistant', true));
    registerPersonaAgent(makeAgent('accountant'));
    expect(getDefaultPersonaName()).toBe('assistant');
    expect(listPersonaAgents()).toHaveLength(2);
  });
});
