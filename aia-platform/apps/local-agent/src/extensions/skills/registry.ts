import type { LoadedSkill, SkillMatch } from '../types.js';

const skillsByName = new Map<string, LoadedSkill>();
const explicitIndex = new Map<string, string>();
const disabledSkills = new Set<string>();

function normalizeKey(name: string): string {
  return name.toLowerCase();
}

export function registerSkill(skill: LoadedSkill): void {
  const key = normalizeKey(skill.manifest.name);
  skillsByName.set(key, skill);

  for (const trigger of skill.manifest.trigger.explicit ?? []) {
    explicitIndex.set(normalizeKey(trigger.replace(/^\//, '')), key);
  }
}

export function clearSkills(): void {
  skillsByName.clear();
  explicitIndex.clear();
}

export function setDisabledSkills(names: string[]): void {
  disabledSkills.clear();
  for (const name of names) {
    disabledSkills.add(normalizeKey(name));
  }
}

export function isSkillDisabled(name: string): boolean {
  return disabledSkills.has(normalizeKey(name));
}

export function setSkillEnabled(name: string, enabled: boolean): void {
  const key = normalizeKey(name);
  if (enabled) {
    disabledSkills.delete(key);
  } else {
    disabledSkills.add(key);
  }
}

export function resolveSkill(name: string): LoadedSkill | undefined {
  const skill = skillsByName.get(normalizeKey(name));
  if (!skill || isSkillDisabled(skill.manifest.name)) return undefined;
  return { ...skill, enabled: true };
}

export function resolveSkillByExplicitTrigger(trigger: string): LoadedSkill | undefined {
  const key = explicitIndex.get(normalizeKey(trigger.replace(/^\//, '')));
  if (!key) return undefined;
  return resolveSkill(key);
}

export function listSkills(): LoadedSkill[] {
  return [...skillsByName.values()]
    .filter((s) => !isSkillDisabled(s.manifest.name))
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
}

export function listAllSkills(): LoadedSkill[] {
  return [...skillsByName.values()].sort((a, b) =>
    a.manifest.name.localeCompare(b.manifest.name),
  );
}

/**
 * Match user input against implicit regex patterns declared in skill manifests.
 */
export function matchSkillImplicit(userInput: string): SkillMatch | null {
  const query = userInput.trim();
  if (!query) return null;

  let best: SkillMatch | null = null;

  for (const skill of skillsByName.values()) {
    if (isSkillDisabled(skill.manifest.name)) continue;

    const implicit = skill.manifest.trigger.implicit;
    if (!implicit?.patterns.length) continue;

    const threshold = implicit.confidence_threshold ?? 0.8;

    for (const pattern of implicit.patterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (!regex.test(query)) continue;

        const confidence = 0.9;
        if (confidence < threshold) continue;

        if (!best || confidence > best.confidence) {
          best = { skill, confidence, trigger: 'implicit' };
        }
      } catch {
        // invalid pattern in manifest — skip
      }
    }
  }

  return best;
}
