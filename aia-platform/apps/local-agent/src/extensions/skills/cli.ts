import { loadSkillsFromDisk, saveDisabledList } from './loader.js';
import {
  isSkillDisabled,
  listAllSkills,
  listSkills,
  resolveSkill,
  setSkillEnabled,
} from './registry.js';
import { tryExecuteSkillByName } from './router.js';
import type { ExtensionShellContext } from '../types.js';

function bold(text: string): string {
  return `\x1b[1m${text}\x1b[0m`;
}

function ok(text: string): string {
  return `\x1b[32m${text}\x1b[0m`;
}

function dim(text: string): string {
  return `\x1b[90m${text}\x1b[0m`;
}

export async function handleSkillCli(
  args: string[],
  shellCtx: ExtensionShellContext,
  defaultMessage = '',
): Promise<string> {
  const sub = args[0]?.toLowerCase() ?? 'list';
  const rest = args.slice(1);

  switch (sub) {
    case 'list':
    case 'ls':
      return formatSkillList();

    case 'info': {
      const name = rest[0];
      if (!name) return '  Uso: /skill info <nome>\n';
      return formatSkillInfo(name);
    }

    case 'run': {
      const name = rest[0];
      if (!name) return '  Uso: /skill run <nome> [messaggio...]\n';
      const skillArgs = rest.slice(1);
      const message = skillArgs.join(' ') || defaultMessage;
      const result = await tryExecuteSkillByName(name, skillArgs, message, shellCtx);
      if (!result.handled) return `  Skill non trovata: ${name}\n`;
      return result.output ? `${result.output}\n` : '';
    }

    case 'reload': {
      const { loaded, errors } = loadSkillsFromDisk();
      const lines = [`  ${ok('[OK]')} Ricaricate ${loaded} skill.`];
      for (const e of errors) lines.push(`  \x1b[33m[WARN]\x1b[0m ${e}`);
      return lines.join('\n') + '\n';
    }

    case 'disable': {
      const name = rest[0];
      if (!name) return '  Uso: /skill disable <nome>\n';
      if (!resolveSkill(name) && !listAllSkills().find((s) => s.manifest.name === name)) {
        return `  Skill non trovata: ${name}\n`;
      }
      setSkillEnabled(name, false);
      persistDisabled();
      return `  ${ok('[OK]')} Skill disabilitata: ${name}\n`;
    }

    case 'enable': {
      const name = rest[0];
      if (!name) return '  Uso: /skill enable <nome>\n';
      setSkillEnabled(name, true);
      persistDisabled();
      return `  ${ok('[OK]')} Skill abilitata: ${name}\n`;
    }

    case 'search': {
      const q = rest.join(' ').toLowerCase();
      if (!q) return '  Uso: /skill search <keyword>\n';
      const matches = listAllSkills().filter((s) => {
        const hay = [s.manifest.name, s.manifest.description].join(' ').toLowerCase();
        return hay.includes(q);
      });
      if (matches.length === 0) return `  Nessuna skill per "${q}".\n`;
      return formatSkillList(matches);
    }

    default:
      return `  Sub-comandi: list, info, run, reload, disable, enable, search\n`;
  }
}

function persistDisabled(): void {
  const disabled = listAllSkills()
    .filter((s) => isSkillDisabled(s.manifest.name))
    .map((s) => s.manifest.name);
  saveDisabledList(disabled);
}

function formatSkillList(skills = listSkills()): string {
  const lines: string[] = ['', `  ${bold('Skills installate')}`, ''];

  if (skills.length === 0) {
    lines.push('  Nessuna skill in ~/.108ai/skills/');
    lines.push('');
    return lines.join('\n');
  }

  for (const skill of skills) {
    const explicit = skill.manifest.trigger.explicit?.join(', ') ?? '-';
    const implicitCount = skill.manifest.trigger.implicit?.patterns.length ?? 0;
    lines.push(`  ${skill.manifest.name}`);
    lines.push(`    ${dim(skill.manifest.description)}`);
    lines.push(`    ${dim(`explicit: ${explicit} | implicit patterns: ${implicitCount}`)}`);
  }

  lines.push('');
  lines.push(`  ${dim('Uso: /skill run <nome> | /write-email <testo> | linguaggio naturale')}`);
  lines.push('');
  return lines.join('\n');
}

function formatSkillInfo(name: string): string {
  const skill = listAllSkills().find((s) => s.manifest.name.toLowerCase() === name.toLowerCase());
  if (!skill) return `  Skill non trovata: ${name}\n`;

  const m = skill.manifest;
  const lines = [
    '',
    `  ${bold(`Skill: ${m.name}`)}`,
    `  ${m.description}`,
    `  Versione: ${m.version ?? 'n/a'}`,
    `  Modello:  ${m.model ?? 'balanced'}`,
    `  Dir:      ${skill.directory}`,
    `  Stato:    ${isSkillDisabled(m.name) ? 'disabilitata' : 'attiva'}`,
  ];

  if (m.trigger.explicit?.length) {
    lines.push(`  Explicit: ${m.trigger.explicit.join(', ')}`);
  }
  if (m.trigger.implicit?.patterns.length) {
    lines.push('  Implicit patterns:');
    for (const p of m.trigger.implicit.patterns) {
      lines.push(`    /${p}/`);
    }
  }
  if (m.tools_required?.length) {
    lines.push(`  Tools: ${m.tools_required.join(', ')}`);
  }

  lines.push('');
  return lines.join('\n');
}
