import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { SKILLS_DIR, ensureExtensionDirs } from '../paths.js';
import { parseSkillManifest } from '../schemas.js';
import type { LoadedSkill } from '../types.js';
import { clearSkills, registerSkill, setDisabledSkills } from './registry.js';

const DISABLED_FILE = join(SKILLS_DIR, '..', 'skills-disabled.json');

const EMAIL_WRITER_MANIFEST = `name: email-writer
description: "Scrive email professionali nel tono appropriato al contesto"
version: "1.0.0"
author: "108ai-official"

trigger:
  explicit:
    - /write-email
    - /email
  implicit:
    patterns:
      - "scrivi.*email"
      - "rispondi.*email"
      - "componi.*messaggio"
      - "write.*email"
    confidence_threshold: 0.8

model: balanced
max_tokens: 2000
temperature: 0.7

tools_required:
  - gmail

params:
  - name: to
    type: string
    required: false
    description: "Destinatario email"
  - name: tone
    type: enum
    values: [formal, informal, friendly, cold, follow-up]
    default: formal
  - name: language
    type: enum
    values: [it, en]
    default: it

context:
  - type: file
    path: "./templates/{{detected_tone}}.md"
  - type: integration
    name: gmail
    action: list_unread
    limit: 3
    condition: "when replying"

output:
  format: text
  review_before_send: true
  action_after: gmail.draft
`;

const EMAIL_WRITER_PROMPT = `Sei un assistente specializzato nella scrittura di email professionali per PMI italiane.

Regole:
- Rispetta il tono indicato nel template di contesto
- Sii conciso ma completo
- Non inventare dati che non sono nel contesto
- Se manca il destinatario, chiedi chiarimento nel testo della bozza
- Lingua: segui il parametro language (default italiano)

Produci solo il corpo dell'email (oggetto opzionale su riga separata "Oggetto: ...").
`;

const FORMAL_TEMPLATE = `# Template formale

- Saluto: Gentile [Nome], / Spett.le [Azienda],
- Chiusura: Cordiali saluti,
- Registro: professionale, niente slang
`;

const INFORMAL_TEMPLATE = `# Template informale

- Saluto: Ciao [Nome],
- Chiusura: A presto, / Un saluto,
- Registro: diretto ma rispettoso
`;

function seedEmailWriterSkill(): void {
  const dir = join(SKILLS_DIR, 'email-writer');
  const manifestPath = join(dir, 'SKILL.yml');
  if (existsSync(manifestPath)) return;

  mkdirSync(join(dir, 'templates'), { recursive: true });
  writeFileSync(manifestPath, EMAIL_WRITER_MANIFEST, 'utf-8');
  writeFileSync(join(dir, 'prompt.md'), EMAIL_WRITER_PROMPT, 'utf-8');
  writeFileSync(join(dir, 'templates', 'formal.md'), FORMAL_TEMPLATE, 'utf-8');
  writeFileSync(join(dir, 'templates', 'informal.md'), INFORMAL_TEMPLATE, 'utf-8');
  writeFileSync(join(dir, 'templates', 'friendly.md'), INFORMAL_TEMPLATE, 'utf-8');
  writeFileSync(join(dir, 'templates', 'cold.md'), FORMAL_TEMPLATE, 'utf-8');
  writeFileSync(join(dir, 'templates', 'follow-up.md'), FORMAL_TEMPLATE, 'utf-8');
}

function loadDisabledList(): string[] {
  if (!existsSync(DISABLED_FILE)) return [];
  try {
    const raw = JSON.parse(readFileSync(DISABLED_FILE, 'utf-8')) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

export function saveDisabledList(names: string[]): void {
  writeFileSync(DISABLED_FILE, JSON.stringify(names, null, 2), 'utf-8');
  setDisabledSkills(names);
}

function parseSkillDirectory(dirPath: string): LoadedSkill {
  const manifestPath = join(dirPath, 'SKILL.yml');
  const altManifest = join(dirPath, 'SKILL.yaml');
  const path = existsSync(manifestPath) ? manifestPath : altManifest;

  if (!existsSync(path)) {
    throw new Error('SKILL.yml mancante');
  }

  const raw = parseYaml(readFileSync(path, 'utf-8')) as unknown;
  const manifest = parseSkillManifest(raw);

  const promptPath = join(dirPath, 'prompt.md');
  const systemPrompt = existsSync(promptPath)
    ? readFileSync(promptPath, 'utf-8')
    : manifest.description;

  return {
    manifest,
    systemPrompt,
    directory: dirPath,
    enabled: true,
  };
}

/** Load all skills from ~/.108ai/skills/ subdirectories */
export function loadSkillsFromDisk(): { loaded: number; errors: string[] } {
  ensureExtensionDirs();
  seedEmailWriterSkill();
  clearSkills();
  setDisabledSkills(loadDisabledList());

  const errors: string[] = [];
  let loaded = 0;

  let entries: string[] = [];
  try {
    entries = readdirSync(SKILLS_DIR);
  } catch {
    return { loaded: 0, errors: ['Impossibile leggere directory skills'] };
  }

  for (const entry of entries) {
    const dirPath = join(SKILLS_DIR, entry);
    try {
      const hasManifest =
        existsSync(join(dirPath, 'SKILL.yml')) || existsSync(join(dirPath, 'SKILL.yaml'));
      if (!hasManifest) continue;

      const skill = parseSkillDirectory(dirPath);
      registerSkill(skill);
      loaded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${entry}: ${message}`);
    }
  }

  return { loaded, errors };
}
