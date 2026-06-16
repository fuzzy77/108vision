import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { AGENTS_DIR, MCP_CONFIG_FILE, SKILLS_DIR } from '../paths.js';
import { parsePersonaAgentDefinition } from '../schemas.js';
import { reviewExtensionInstall } from '../security/install-guard.js';
import { recordInstalledExtension } from '../lock.js';
import { loadMcpConfig, saveMcpConfig } from '../mcp/config.js';
import type { McpServerDefinition } from '../types.js';

export interface ImportResult {
  ok: boolean;
  message: string;
  imported: string[];
  warnings: string[];
}

function ensureDir(path: string): void {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

/**
 * Import Claude Code skill directory → ~/.108ai/skills/{name}/
 * Expects SKILL.md or skill.md with YAML frontmatter optional.
 */
export function importClaudeSkill(skillDir: string): ImportResult {
  const imported: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(skillDir)) {
    return { ok: false, message: `Directory non trovata: ${skillDir}`, imported, warnings };
  }

  const skillMd = ['SKILL.md', 'skill.md', 'SKILL.yml'].find((f) => existsSync(join(skillDir, f)));
  const manifestPath = skillMd ? join(skillDir, skillMd) : join(skillDir, 'SKILL.yml');

  let name = basename(skillDir).toLowerCase().replace(/\s+/g, '-');
  let description = `Imported from Claude Code: ${name}`;
  let systemPrompt = '';

  if (existsSync(manifestPath)) {
    const review = reviewExtensionInstall(manifestPath, 'skill');
    if (!review.ok) {
      return { ok: false, message: review.warnings.join('; '), imported, warnings };
    }

    const raw = readFileSync(manifestPath, 'utf-8');
    if (manifestPath.endsWith('.yml')) {
      const doc = parseYaml(raw) as { name?: string; description?: string };
      name = doc.name ?? name;
      description = doc.description ?? description;
      systemPrompt = raw;
    } else {
      const frontmatter = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (frontmatter) {
        const meta = parseYaml(frontmatter[1] ?? '') as { name?: string; description?: string };
        name = meta.name ?? name;
        description = meta.description ?? description;
        systemPrompt = (frontmatter[2] ?? '').trim();
      } else {
        systemPrompt = raw.trim();
      }
    }
  }

  const targetDir = join(SKILLS_DIR, name);
  ensureDir(targetDir);

  const skillYaml = stringifyYaml({
    name,
    description,
    version: '1.0.0',
    author: 'imported-claude',
    trigger: {
      explicit: [`/${name}`],
      implicit: { patterns: [], confidence_threshold: 0.85 },
    },
    model: 'balanced',
    max_tokens: 2000,
    context: [],
    output: { format: 'text', review_before_send: true },
  });

  const skillYmlPath = join(targetDir, 'SKILL.yml');
  writeFileSync(skillYmlPath, skillYaml, 'utf-8');
  writeFileSync(join(targetDir, 'prompt.md'), systemPrompt || description, 'utf-8');
  recordInstalledExtension('skill', name, skillYmlPath, '1.0.0');
  imported.push(`skill:${name}`);

  return {
    ok: true,
    message: `Skill importata: ${name}`,
    imported,
    warnings,
  };
}

/**
 * Import Claude agent markdown → ~/.108ai/agents/{name}.yml
 */
export function importClaudeAgent(agentFile: string): ImportResult {
  const imported: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(agentFile)) {
    return { ok: false, message: `File non trovato: ${agentFile}`, imported, warnings };
  }

  const review = reviewExtensionInstall(agentFile, 'agent');
  if (!review.ok) {
    return { ok: false, message: review.warnings.join('; '), imported, warnings };
  }

  const raw = readFileSync(agentFile, 'utf-8');
  const baseName = basename(agentFile, '.md').toLowerCase().replace(/\s+/g, '-');
  let name = baseName;
  let description = `Agent importato da Claude Code (${baseName})`;
  let systemPrompt = raw.trim();

  const frontmatter = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (frontmatter) {
    const meta = parseYaml(frontmatter[1] ?? '') as {
      name?: string;
      description?: string;
    };
    name = (meta.name ?? baseName).toLowerCase();
    description = meta.description ?? description;
    systemPrompt = (frontmatter[2] ?? '').trim();
  }

  const agentDef = {
    name,
    display_name: name,
    description,
    version: '1.0.0',
    system_prompt: systemPrompt,
    model: 'balanced',
    max_tokens: 3000,
  };

  parsePersonaAgentDefinition(agentDef);

  const targetPath = join(AGENTS_DIR, `${name}.yml`);
  writeFileSync(targetPath, stringifyYaml(agentDef), 'utf-8');
  recordInstalledExtension('agent', name, targetPath, '1.0.0');
  imported.push(`agent:${name}`);

  return { ok: true, message: `Agent importato: ${name}`, imported, warnings };
}

/**
 * Import MCP servers from Claude settings.json (mcpServers field).
 */
export function importClaudeMcpSettings(settingsFile: string): ImportResult {
  const imported: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(settingsFile)) {
    return { ok: false, message: `File non trovato: ${settingsFile}`, imported, warnings };
  }

  const raw = JSON.parse(readFileSync(settingsFile, 'utf-8')) as {
    mcpServers?: Record<
      string,
      { command?: string; args?: string[]; env?: Record<string, string>; url?: string }
    >;
  };

  const servers = raw.mcpServers ?? {};
  const existing = loadMcpConfig().mcp_servers;
  const byName = new Map(existing.map((s) => [s.name, s]));

  for (const [name, cfg] of Object.entries(servers)) {
    const def: McpServerDefinition = {
      name: name.toLowerCase().replace(/\s+/g, '-'),
      description: `Imported from Claude MCP: ${name}`,
      transport: cfg.url ? 'sse' : 'stdio',
      command: cfg.command,
      args: cfg.args,
      url: cfg.url,
      env: cfg.env,
      auto_start: false,
      tools_exposed: [],
    };
    byName.set(def.name, def);
    imported.push(`mcp:${def.name}`);
  }

  saveMcpConfig([...byName.values()]);
  recordInstalledExtension('mcp', 'claude-import', MCP_CONFIG_FILE);

  return {
    ok: true,
    message: `Importati ${imported.length} MCP server in mcp.yml`,
    imported,
    warnings,
  };
}

export function importClaudePath(sourcePath: string): ImportResult {
  if (!existsSync(sourcePath)) {
    return { ok: false, message: `Path non trovato: ${sourcePath}`, imported: [], warnings: [] };
  }

  if (sourcePath.endsWith('.json')) {
    return importClaudeMcpSettings(sourcePath);
  }
  if (sourcePath.endsWith('.md')) {
    return importClaudeAgent(sourcePath);
  }

  const entries = readdirSync(sourcePath, { withFileTypes: true });
  const aggregated: ImportResult = {
    ok: true,
    message: '',
    imported: [],
    warnings: [],
  };

  for (const entry of entries) {
    const full = join(sourcePath, entry.name);
    if (entry.isDirectory()) {
      const r = importClaudeSkill(full);
      aggregated.imported.push(...r.imported);
      aggregated.warnings.push(...r.warnings);
      if (!r.ok) aggregated.ok = false;
    } else if (entry.name.endsWith('.md')) {
      const r = importClaudeAgent(full);
      aggregated.imported.push(...r.imported);
      aggregated.warnings.push(...r.warnings);
    }
  }

  aggregated.message = `Import Claude: ${aggregated.imported.length} elementi`;
  return aggregated;
}
