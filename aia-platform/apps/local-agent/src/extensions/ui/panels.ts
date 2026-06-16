import { listPersonaAgents } from '../agents/registry.js';
import { getActivePersonaName } from '../agents/switcher.js';
import { listRegisteredCommands } from '../registry.js';
import { listSkills } from '../skills/registry.js';
import { listMcpRuntimes } from '../mcp/manager.js';
import { formatExtensionsOverview } from '../cli/unified.js';
import { searchStoreCatalog } from './store/catalog.js';
import { bold, box, cyan, dim, green, red, yellow } from './ansi.js';

function statusDot(status: string): string {
  if (status === 'running') return green('●');
  if (status === 'error') return red('●');
  return dim('○');
}

export function renderDashboardPanel(): string {
  const lines = [
    formatExtensionsOverview().trim(),
    '',
    dim('Comandi: /ui commands | /ui agents | /ui mcp | /ui store | /ui web'),
  ];
  return lines.join('\n');
}

export function renderCommandsPanel(query = ''): string {
  const entries = listRegisteredCommands().filter((e) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const d = e.definition;
    return (
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      (d.aliases ?? []).some((a) => a.toLowerCase().includes(q))
    );
  });

  const lines: string[] = [];
  if (query) lines.push(dim(`Filtro: "${query}" — ${entries.length} risultati`));
  lines.push('');

  entries.slice(0, 20).forEach((e, i) => {
    const d = e.definition;
    const aliases = d.aliases?.length ? dim(` (${d.aliases.join(', ')})`) : '';
    lines.push(`  ${cyan(String(i + 1).padStart(2))}  ${bold('/' + d.name)}${aliases}`);
    lines.push(`      ${dim(d.description)}`);
  });

  if (entries.length === 0) lines.push(dim('  Nessun command trovato.'));
  if (entries.length > 20) lines.push(dim(`  … altri ${entries.length - 20} (affina la ricerca)`));

  lines.push('', dim('Esegui: /summarize-email  oppure  /command run <nome>'));
  return box('Command Palette', lines);
}

export function renderSkillsPanel(query = ''): string {
  const skills = listSkills().filter((s) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const m = s.manifest;
    return m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
  });

  const lines: string[] = [];
  skills.slice(0, 15).forEach((s, i) => {
    const m = s.manifest;
    const triggers = m.trigger?.explicit?.map((t) => t.replace(/^\//, '')).join(', ') ?? m.name;
    lines.push(`  ${cyan(String(i + 1).padStart(2))}  ${bold(m.name)} ${dim(`→ /${triggers.split(',')[0]}`)}`);
    lines.push(`      ${dim(m.description)}`);
  });
  if (skills.length === 0) lines.push(dim('  Nessuna skill.'));
  return box('Skills', lines);
}

export function renderAgentsPanel(): string {
  const active = getActivePersonaName();
  const agents = listPersonaAgents();
  const lines: string[] = [];

  for (const a of agents) {
    const d = a.definition;
    const marker = d.name === active ? green('*') : ' ';
    const avatar = d.avatar ?? '🤖';
    lines.push(`  ${marker} ${avatar} ${bold(d.display_name ?? d.name)} ${dim('@' + d.name)}`);
    lines.push(`      ${dim(d.description)}`);
  }

  lines.push('', dim(`Attivo: ${active} — /agent use <nome>`));
  return box('Agent Switcher', lines);
}

export function renderMcpPanel(): string {
  const servers = listMcpRuntimes();
  const lines: string[] = [];

  if (servers.length === 0) {
    lines.push(dim('  Nessun server in mcp.yml'));
    lines.push(dim('  /mcp add <nome> --command "npx ..."'));
  } else {
    for (const s of servers) {
      const d = s.definition;
      const tools = s.tools.length || d.tools_exposed?.length || 0;
      const ro = d.restrictions?.read_only ? dim(' R/O') : '';
      lines.push(
        `  ${statusDot(s.status)} ${bold(d.name)} ${dim(d.transport)} — ${tools} tool${ro}`,
      );
      if (d.description) lines.push(`      ${dim(d.description)}`);
      if (s.lastError) lines.push(`      ${red(s.lastError)}`);
    }
  }

  lines.push('', dim('/mcp start <nome> | /mcp tools <nome> | /mcp test <s> <tool>'));
  return box('MCP Manager', lines);
}

export function renderStorePanel(query = '', type = 'all'): string {
  const items = searchStoreCatalog(query, type);
  const lines: string[] = [];

  if (query || type !== 'all') {
    lines.push(dim(`Filtro: "${query || '*'}" tipo=${type} — ${items.length} item`));
    lines.push('');
  }

  for (const item of items.slice(0, 12)) {
    const badge = item.verified ? green('✓') : yellow('?');
    const bundled = item.bundled ? dim(' [bundled]') : '';
    lines.push(
      `  ${badge} ${bold(item.displayName)} ${dim(`(${item.type})`)}${bundled}`,
    );
    lines.push(`      ${dim(item.description)}`);
    if (item.rating) lines.push(`      ${dim(`★ ${item.rating} · ${item.category}`)}`);
  }

  lines.push('', dim('Install bundled: già in ~/.108ai/ al primo avvio'));
  lines.push(dim('Web store: /ui web → tab Store'));
  return box('108ai Store (locale)', lines);
}

export function renderPalettePanel(query = ''): string {
  const cmd = renderCommandsPanel(query);
  const skl = renderSkillsPanel(query);
  return [cmd, '', skl].join('\n');
}
