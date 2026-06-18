import { loadMcpConfig, saveMcpConfig } from './config.js';
import { callMcpTool } from './executor.js';
import { getMcpUsageSnapshot } from './usage.js';
import {
  addMcpServerDefinition,
  healthCheckMcpServer,
  listMcpRuntimes,
  loadMcpServersFromConfig,
  removeMcpServerDefinition,
  startMcpServer,
  stopMcpServer,
} from './manager.js';
import type { McpServerDefinition } from '../types.js';
import { parseMcpConfig } from '../schemas.js';
import { parseMcpInstall } from './install.js';

function bold(text: string): string {
  return `\x1b[1m${text}\x1b[0m`;
}

function ok(text: string): string {
  return `\x1b[32m${text}\x1b[0m`;
}

function dim(text: string): string {
  return `\x1b[90m${text}\x1b[0m`;
}

function statusIcon(status: string): string {
  if (status === 'running') return ok('●');
  if (status === 'error') return '\x1b[31m●\x1b[0m';
  return dim('○');
}

function formatMcpList(): string {
  const servers = listMcpRuntimes();
  const lines = [`  ${bold('MCP Servers')} (~/.108ai/mcp.yml)\n`];
  const usage = getMcpUsageSnapshot();

  if (servers.length === 0) {
    lines.push('  (nessun server configurato)\n');
    lines.push(`  ${dim('Aggiungi con /mcp add <nome> --command "npx ..."')}\n`);
    return lines.join('\n');
  }

  for (const s of servers) {
    const d = s.definition;
    const tools = s.tools.length > 0 ? s.tools.length : d.tools_exposed?.length ?? 0;
    const serverKey = d.name.toLowerCase();
    const totalCalls = Object.values(usage.servers?.[serverKey]?.tools ?? {}).reduce(
      (acc, t) => acc + t.calls,
      0,
    );
    lines.push(
      `  ${statusIcon(s.status)} ${bold(d.name)} ${dim(d.transport)} — ${tools} tool — ${s.status} — calls:${totalCalls}`,
    );
    if (d.description) lines.push(`      ${dim(d.description)}`);
    if (s.lastError) lines.push(`      \x1b[31m${s.lastError}\x1b[0m`);
  }

  lines.push('');
  return lines.join('\n');
}

export async function handleMcpCli(args: string[]): Promise<string> {
  const sub = args[0]?.toLowerCase() ?? 'list';
  const rest = args.slice(1);

  switch (sub) {
    case 'list':
    case 'ls':
      return formatMcpList();

    case 'reload': {
      const { loaded, errors } = loadMcpServersFromConfig();
      const lines = [`  ${ok('[OK]')} Ricaricati ${loaded} MCP server.`];
      for (const e of errors) lines.push(`  \x1b[33m[WARN]\x1b[0m ${e}`);
      return lines.join('\n') + '\n';
    }

    case 'start': {
      const name = rest[0];
      if (!name) return '  Uso: /mcp start <nome>\n';
      try {
        await startMcpServer(name);
        return `  ${ok('[OK]')} MCP avviato: ${name}\n`;
      } catch (err) {
        return `  \x1b[31m[ERR]\x1b[0m ${err instanceof Error ? err.message : String(err)}\n`;
      }
    }

    case 'stop': {
      const name = rest[0];
      if (!name) return '  Uso: /mcp stop <nome>\n';
      await stopMcpServer(name);
      return `  ${ok('[OK]')} MCP fermato: ${name}\n`;
    }

    case 'status': {
      const lines = [formatMcpList()];
      for (const s of listMcpRuntimes()) {
        if (s.status === 'running') {
          const healthy = await healthCheckMcpServer(s.definition.name);
          lines.push(`  ${s.definition.name}: ${healthy ? ok('healthy') : 'unhealthy'}`);
        }
      }
      return lines.join('\n') + '\n';
    }

    case 'tools': {
      const name = rest[0];
      if (!name) return '  Uso: /mcp tools <nome>\n';
      try {
        const runtime = await startMcpServer(name);
        const tools = runtime.tools;
        if (tools.length === 0) return `  Nessun tool esposto da ${name}\n`;
        return (
          tools.map((t) => `  - ${t.name}${t.description ? ` — ${dim(t.description)}` : ''}`).join('\n') +
          '\n'
        );
      } catch (err) {
        return `  \x1b[31m[ERR]\x1b[0m ${err instanceof Error ? err.message : String(err)}\n`;
      }
    }

    case 'install':
    case 'i': {
      if (rest.length === 0) {
        return [
          '  Uso:',
          '    /mcp install npm <package> [--name x] [--args a,b]',
          '    /mcp install git <https-url> --command <cmd> [--args a,b]',
          '    /mcp install everything-demo',
          '',
        ].join('\n');
      }

      try {
        const { name, definition } = parseMcpInstall(rest);
        parseMcpConfig({ mcp_servers: [definition] });
        const doc = loadMcpConfig();
        const servers = [...doc.mcp_servers.filter((s) => s.name !== name), definition];
        saveMcpConfig(servers);
        addMcpServerDefinition(definition);

        try {
          await startMcpServer(name);
        } catch {
          // install ok anche se start fallisce
        }

        return `  ${ok('[OK]')} MCP installato: ${name} (${definition.command} ${(definition.args ?? []).join(' ')})\n`;
      } catch (err) {
        return `  \x1b[31m[ERR]\x1b[0m ${err instanceof Error ? err.message : String(err)}\n`;
      }
    }

    case 'test':
    case 'call': {
      const name = rest[0];
      const tool = rest[1];
      if (!name || !tool) return '  Uso: /mcp test <server> <tool> [json-args]\n';
      const argsJson = rest.slice(2).join(' ') || '{}';
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(argsJson) as Record<string, unknown>;
      } catch {
        return '  Args devono essere JSON valido\n';
      }
      try {
        const result = await callMcpTool(name, tool, parsedArgs);
        return `${result.content}\n`;
      } catch (err) {
        return `  \x1b[31m[ERR]\x1b[0m ${err instanceof Error ? err.message : String(err)}\n`;
      }
    }

    case 'add': {
      const name = rest[0];
      if (!name) return '  Uso: /mcp add <nome> --command "cmd" [--args a,b] [--description text]\n';

      let command = '';
      let argsList: string[] = [];
      let description = `MCP server ${name}`;

      for (let i = 1; i < rest.length; i++) {
        const token = rest[i];
        if (token === '--command' && rest[i + 1]) {
          command = rest[++i] ?? '';
        } else if (token === '--args' && rest[i + 1]) {
          argsList = (rest[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        } else if (token === '--description' && rest[i + 1]) {
          description = rest[++i] ?? description;
        }
      }

      if (!command) return '  --command obbligatorio\n';

      const def: McpServerDefinition = {
        name,
        description,
        transport: 'stdio',
        command,
        args: argsList,
        auto_start: false,
        tools_exposed: [],
      };

      parseMcpConfig({ mcp_servers: [def] });
      const doc = loadMcpConfig();
      const servers = [...doc.mcp_servers.filter((s) => s.name !== name), def];
      saveMcpConfig(servers);
      addMcpServerDefinition(def);
      return `  ${ok('[OK]')} MCP aggiunto: ${name}\n`;
    }

    case 'remove':
    case 'delete': {
      const name = rest[0];
      if (!name) return '  Uso: /mcp remove <nome>\n';
      await stopMcpServer(name);
      removeMcpServerDefinition(name);
      const doc = loadMcpConfig();
      saveMcpConfig(doc.mcp_servers.filter((s) => s.name !== name));
      return `  ${ok('[OK]')} MCP rimosso: ${name}\n`;
    }

    case 'audit': {
      const lines = [`  ${bold('MCP Audit')}\n`];
      for (const s of listMcpRuntimes()) {
        const d = s.definition;
        const whitelist = d.tools_exposed?.length
          ? d.tools_exposed.join(', ')
          : dim('(tutti i tool — review consigliata)');
        lines.push(`  ${d.name}: tools=[${whitelist}] read_only=${d.restrictions?.read_only ?? false}`);
      }
      return lines.join('\n') + '\n';
    }

    default:
      return `  Sottocomando sconosciuto: ${sub}. Usa /mcp list\n`;
  }
}
