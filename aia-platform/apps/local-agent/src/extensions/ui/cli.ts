import {
  renderAgentsPanel,
  renderDashboardPanel,
  renderMcpPanel,
  renderPalettePanel,
  renderSkillsPanel,
  renderStorePanel,
} from './panels.js';
import { getUiServerUrl, isUiServerRunning, startUiServer, stopUiServer } from './server.js';
import { dim, green } from './ansi.js';

export async function handleUiCli(args: string[]): Promise<string> {
  const sub = args[0]?.toLowerCase() ?? 'dashboard';
  const rest = args.slice(1);
  const query = rest.join(' ').trim();

  switch (sub) {
    case 'dashboard':
    case 'home':
      return `${renderDashboardPanel()}\n`;

    case 'commands':
    case 'command':
    case 'palette':
      return `${renderPalettePanel(query)}\n`;

    case 'skills':
    case 'skill':
      return `${renderSkillsPanel(query)}\n`;

    case 'agents':
    case 'agent':
      return `${renderAgentsPanel()}\n`;

    case 'mcp':
      return `${renderMcpPanel()}\n`;

    case 'store': {
      const type = rest[0] && !rest[0].includes(' ') ? rest[0] : 'all';
      const q = rest[0]?.includes(' ') ? query : rest.slice(1).join(' ');
      return `${renderStorePanel(q, type)}\n`;
    }

    case 'web': {
      const portArg = rest.find((a) => /^\d+$/.test(a));
      const port = portArg ? Number.parseInt(portArg, 10) : 7891;
      try {
        const url = await startUiServer(port);
        const lines = [
          `  ${green('[OK]')} Dashboard web avviata`,
          `  ${url}`,
          dim('  Apri nel browser. Solo localhost (127.0.0.1).'),
          dim('  /ui web stop — ferma il server'),
        ];
        return lines.join('\n') + '\n';
      } catch (err) {
        return `  Errore avvio UI: ${err instanceof Error ? err.message : String(err)}\n`;
      }
    }

    case 'web-stop':
    case 'stop-web':
      await stopUiServer();
      return `  ${green('[OK]')} Dashboard web fermata\n`;

    case 'web-status':
      return isUiServerRunning()
        ? `  Web UI attiva: ${getUiServerUrl()}\n`
        : `  Web UI non attiva. Usa /ui web\n`;

    default:
      return [
        '  Uso: /ui dashboard | commands [q] | agents | mcp | store | web [port]',
        dim('  Alias: /palette [q] → command palette'),
        '',
      ].join('\n');
  }
}
