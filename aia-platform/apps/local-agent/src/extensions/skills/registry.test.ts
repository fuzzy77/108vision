import { describe, expect, it } from 'vitest';

import { clearSkills, registerSkill, matchSkillImplicit } from './registry.js';
import type { LoadedSkill } from '../types.js';

function makeSkill(patterns: string[]): LoadedSkill {
  return {
    manifest: {
      name: 'email-writer',
      description: 'test',
      trigger: {
        explicit: ['/write-email'],
        implicit: { patterns, confidence_threshold: 0.8 },
      },
    },
    systemPrompt: 'test',
    directory: '/tmp',
    enabled: true,
  };
}

describe('matchSkillImplicit', () => {
  it('matches Italian email writing intent', () => {
    clearSkills();
    registerSkill(makeSkill(['scrivi.*email', 'rispondi.*email']));

    const match = matchSkillImplicit('Scrivi una email a Mario per confermare il meeting');
    expect(match).not.toBeNull();
    expect(match?.skill.manifest.name).toBe('email-writer');
    expect(match?.trigger).toBe('implicit');
  });

  it('returns null when no pattern matches', () => {
    clearSkills();
    registerSkill(makeSkill(['scrivi.*email']));

    expect(matchSkillImplicit('qual è il meteo domani')).toBeNull();
  });
});
