/**
 * Messaging CLI — Command handlers for /telegram, /whatsapp, /notify
 * within the 108 AI shell.
 *
 * Consumed by:
 *  - shell.ts slash commands: /telegram, /whatsapp, /notify
 *  - Direct invocation: handleTelegramCommand(args), etc.
 *
 * All functions return a formatted string — never throw.
 * All user-facing text is in Italian.
 *
 * Color scheme:
 *  - OK / active      → green  \x1b[32m
 *  - warning          → yellow \x1b[33m
 *  - error            → red    \x1b[31m
 *  - secondary / meta → gray   \x1b[90m
 *  - info / accent    → cyan   \x1b[36m
 *  - headers          → bold   \x1b[1m
 */

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
  cyan:   '\x1b[36m',
} as const;

function bold(s: string):   string { return `${C.bold}${s}${C.reset}`; }
function green(s: string):  string { return `${C.green}${s}${C.reset}`; }
function yellow(s: string): string { return `${C.yellow}${s}${C.reset}`; }
function red(s: string):    string { return `${C.red}${s}${C.reset}`; }
function gray(s: string):   string { return `${C.gray}${s}${C.reset}`; }
function cyan(s: string):   string { return `${C.cyan}${s}${C.reset}`; }

function ok(msg: string):   string { return `${green('[OK]')} ${msg}`; }
function err(msg: string):  string { return `${red('[ERR]')} ${msg}`; }
function warn(msg: string): string { return `${yellow('[WARN]')} ${msg}`; }

// ---------------------------------------------------------------------------
// /telegram command
// ---------------------------------------------------------------------------

export async function handleTelegramCommand(args: string[]): Promise<string> {
  const sub = args[0] ?? 'status';

  try {
    switch (sub) {
      case 'status':
      case '':
        return await _telegramStatus();

      case 'setup': {
        const token = args[1];
        if (!token) {
          return err('Uso: /telegram setup <token>');
        }
        return await _telegramSetup(token);
      }

      case 'test':
        return await _telegramTest();

      case 'send': {
        const text = args.slice(1).join(' ');
        if (!text) return err('Uso: /telegram send <testo>');
        return await _telegramSend(text);
      }

      case 'start':
        return await _telegramStartPolling();

      case 'stop':
        return await _telegramStopPolling();

      case 'help':
        return await _telegramHelp();

      default:
        return err(`Sottocomando sconosciuto: ${bold(sub)}\n${_telegramUsage()}`);
    }
  } catch (e) {
    return err(`Errore inatteso: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function _telegramStatus(): Promise<string> {
  const { loadTelegramConfig, isTelegramConfigured } =
    await import('./telegram-bot.js');

  const configured = isTelegramConfigured();
  const config = loadTelegramConfig();

  const lines: string[] = [bold('Telegram Bot:')];

  if (!configured || !config) {
    lines.push(`  Stato: ${red('non configurato')}`);
    lines.push(gray('  Esegui /telegram setup <token> per iniziare.'));
    return lines.join('\n');
  }

  lines.push(`  Stato: ${green('configurato')}`);

  // Bot info (best effort)
  try {
    const { getBotInfo } = await import('./telegram-bot.js');
    const info = await getBotInfo();
    if (info.ok && info.username) {
      lines.push(`  Bot: ${cyan('@' + info.username)} ${gray('(' + (info.firstName ?? '') + ')')}`);
    }
  } catch {
    // non bloccante
  }

  if (config.chatId) {
    lines.push(`  Chat ID: ${gray(config.chatId)}`);
  } else {
    lines.push(`  Chat ID: ${yellow('non ancora registrato')}`);
    lines.push(gray('  Invia /start al bot per registrare il tuo chat_id.'));
  }

  lines.push(`  Polling: ${config.pollingEnabled ? green('attivo') : gray('inattivo')}`);

  if (config.lastUpdateId > 0) {
    lines.push(`  Ultimo update ID: ${gray(String(config.lastUpdateId))}`);
  }

  return lines.join('\n');
}

async function _telegramSetup(token: string): Promise<string> {
  const { getBotInfo, loadTelegramConfig, saveTelegramConfig } =
    await import('./telegram-bot.js');

  const info = await getBotInfo(token);
  if (!info.ok) {
    return err(`Token non valido: ${info.error ?? 'errore sconosciuto'}`);
  }

  const existing = loadTelegramConfig();
  const config = existing ?? {
    botToken: '',
    chatId: '',
    allowedUserIds: [],
    pollingEnabled: false,
    lastUpdateId: 0,
  };

  config.botToken = token;
  saveTelegramConfig(config);

  const lines: string[] = [
    ok(`Bot verificato: ${cyan('@' + (info.username ?? 'N/A'))} ${gray('(' + (info.firstName ?? '') + ')')}`),
    gray('Ora manda /start al bot per registrare il tuo chat_id.'),
    gray(`Poi avvia il polling con ${bold('/telegram start')}.`),
  ];
  return lines.join('\n');
}

async function _telegramTest(): Promise<string> {
  const { isTelegramConfigured, sendMessage } = await import('./telegram-bot.js');

  if (!isTelegramConfigured()) {
    return err('Telegram non configurato. Esegui /telegram setup <token>.');
  }

  const result = await sendMessage('🤖 Test da 108 AI Desktop Agent — tutto ok!');
  if (!result.ok) {
    return err(`Invio fallito: ${result.error ?? 'errore sconosciuto'}`);
  }
  return ok('Messaggio di test inviato.');
}

async function _telegramSend(text: string): Promise<string> {
  const { isTelegramConfigured, sendMessage } = await import('./telegram-bot.js');

  if (!isTelegramConfigured()) {
    return err('Telegram non configurato. Esegui /telegram setup <token>.');
  }

  const result = await sendMessage(text);
  if (!result.ok) {
    return err(`Invio fallito: ${result.error ?? 'errore sconosciuto'}`);
  }
  return ok('Messaggio inviato.');
}

async function _telegramStartPolling(): Promise<string> {
  const { isTelegramConfigured, startPolling } = await import('./telegram-bot.js');

  if (!isTelegramConfigured()) {
    return err('Telegram non configurato. Esegui /telegram setup <token>.');
  }

  try {
    await startPolling(() => {});
    return ok('Polling avviato. Il bot è in ascolto.');
  } catch (e) {
    return err(`Impossibile avviare il polling: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function _telegramStopPolling(): Promise<string> {
  const { stopPolling } = await import('./telegram-bot.js');

  try {
    await stopPolling();
    return ok('Polling fermato.');
  } catch (e) {
    return err(`Impossibile fermare il polling: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function _telegramHelp(): Promise<string> {
  try {
    const { getSetupInstructions } = await import('./telegram-bot.js');
    return getSetupInstructions();
  } catch {
    return _telegramUsage();
  }
}

function _telegramUsage(): string {
  return [
    bold('Uso:'),
    `  ${cyan('/telegram')}              — stato del bot`,
    `  ${cyan('/telegram setup')} <tok>  — configura token`,
    `  ${cyan('/telegram test')}         — invia messaggio di test`,
    `  ${cyan('/telegram send')} <testo> — invia messaggio rapido`,
    `  ${cyan('/telegram start')}        — avvia polling`,
    `  ${cyan('/telegram stop')}         — ferma polling`,
    `  ${cyan('/telegram help')}         — istruzioni di setup`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// /whatsapp command
// ---------------------------------------------------------------------------

export async function handleWhatsAppCommand(args: string[]): Promise<string> {
  const sub = args[0] ?? 'status';

  try {
    switch (sub) {
      case 'status':
      case '':
        return await _whatsappStatus();

      case 'connect':
        return await _whatsappConnect();

      case 'disconnect':
        return await _whatsappDisconnect();

      case 'send': {
        const number = args[1];
        const text   = args.slice(2).join(' ');
        if (!number || !text) return err('Uso: /whatsapp send <numero> <testo>');
        return await _whatsappSend(number, text);
      }

      case 'business': {
        const bizSub = args[1];
        if (bizSub === 'setup') {
          const [, , token, phoneId, accountId] = args;
          if (!token || !phoneId || !accountId) {
            return err('Uso: /whatsapp business setup <token> <phoneId> <accountId>');
          }
          return await _whatsappBusinessSetup(token, phoneId, accountId);
        }
        if (bizSub === 'send') {
          const number = args[2];
          const text   = args.slice(3).join(' ');
          if (!number || !text) return err('Uso: /whatsapp business send <numero> <testo>');
          return await _whatsappBusinessSend(number, text);
        }
        return err(`Sottocomando business sconosciuto: ${bold(bizSub ?? '')}\n${_whatsappUsage()}`);
      }

      case 'clear':
        return await _whatsappClear();

      case 'help':
        return await _whatsappHelp();

      default:
        return err(`Sottocomando sconosciuto: ${bold(sub)}\n${_whatsappUsage()}`);
    }
  } catch (e) {
    return err(`Errore inatteso: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function _whatsappStatus(): Promise<string> {
  const lines: string[] = [bold('WhatsApp:')];

  // --- WhatsApp Business ---
  try {
    const { isWABusinessConfigured, loadWABusinessConfig } =
      await import('./whatsapp-business.js');

    const configured = isWABusinessConfigured();
    lines.push(`  ${bold('Business API:')} ${configured ? green('configurato') : gray('non configurato')}`);

    if (configured) {
      const cfg = loadWABusinessConfig();
      if (cfg) {
        lines.push(`    Phone ID: ${gray(cfg.phoneNumberId)}`);
      }
    }
  } catch (e) {
    lines.push(`  ${bold('Business API:')} ${yellow('modulo non disponibile')} ${gray(String(e))}`);
  }

  // --- Baileys ---
  try {
    const { isConnected, getStatus, hasExistingSession } =
      await import('./whatsapp-baileys.js');

    const connected = isConnected();
    const hasSession = hasExistingSession();
    const status = await getStatus();

    lines.push(`  ${bold('WhatsApp (Baileys):')} ${connected ? green('connesso') : (hasSession ? yellow('sessione esistente, offline') : gray('non connesso'))}`);

    if (connected && status) {
      if (status.phone) {
        lines.push(`    Numero: ${cyan(status.phone)}`);
      }
      if (status.name) {
        lines.push(`    Nome: ${gray(status.name)}`);
      }
    } else if (hasSession && !connected) {
      lines.push(gray('    Usa /whatsapp connect per riconnetterti.'));
    }
  } catch (e) {
    lines.push(`  ${bold('WhatsApp (Baileys):')} ${yellow('modulo non disponibile')} ${gray(String(e))}`);
  }

  return lines.join('\n');
}

async function _whatsappConnect(): Promise<string> {
  const { connect, getConnectionState } = await import('./whatsapp-baileys.js');

  const lines: string[] = [cyan('Connessione WhatsApp via Baileys...')];
  lines.push(gray('Scansiona il QR code con WhatsApp sul telefono:'));
  lines.push('');

  try {
    // connect() may emit QR codes via events; we await the final result
    const result = await connect((qr: string) => {
      lines.push(qr);
      lines.push('');
      lines.push(gray('In attesa di connessione...'));
    });

    const state = getConnectionState();

    if (result) {
      if (state.phoneNumber) {
        lines.push(ok(`Connesso come ${cyan(state.phoneNumber)} ${state.pushName ? gray('(' + state.pushName + ')') : ''}`));
      } else {
        lines.push(ok('Connesso.'));
      }
      return lines.join('\n');
    }

    lines.push(err('Connessione non riuscita.'));
  } catch (e) {
    lines.push(err(`Connessione fallita: ${e instanceof Error ? e.message : String(e)}`));
  }

  return lines.join('\n');
}

async function _whatsappDisconnect(): Promise<string> {
  try {
    const { disconnect } = await import('./whatsapp-baileys.js');
    await disconnect();
    return ok('Sessione Baileys disconnessa.');
  } catch (e) {
    return err(`Disconnessione fallita: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function _whatsappSend(number: string, text: string): Promise<string> {
  try {
    const { isConnected, sendText } = await import('./whatsapp-baileys.js');

    if (!isConnected()) {
      return err('WhatsApp non connesso. Esegui /whatsapp connect prima.');
    }

    const result = await sendText(number, text);
    if (result && typeof result === 'object' && (result as Record<string, unknown>)['ok'] === false) {
      const r = result as Record<string, unknown>;
      return err(`Invio fallito: ${r['error'] ?? 'errore sconosciuto'}`);
    }
    return ok(`Messaggio inviato a ${cyan(number)}.`);
  } catch (e) {
    return err(`Invio fallito: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function _whatsappBusinessSetup(
  token: string,
  phoneId: string,
  accountId: string,
): Promise<string> {
  try {
    const { loadWABusinessConfig, saveWABusinessConfig } =
      await import('./whatsapp-business.js');

    const existing = loadWABusinessConfig();
    const config = existing ?? {
      accessToken: '',
      phoneNumberId: '',
      businessAccountId: '',
      verifyToken: '',
      allowedNumbers: [],
    };

    config.accessToken       = token;
    config.phoneNumberId     = phoneId;
    config.businessAccountId = accountId;

    saveWABusinessConfig(config);
    return ok(`WhatsApp Business configurato. Phone ID: ${gray(phoneId)}`);
  } catch (e) {
    return err(`Setup fallito: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function _whatsappBusinessSend(number: string, text: string): Promise<string> {
  try {
    const { isWABusinessConfigured, sendTextMessage } =
      await import('./whatsapp-business.js');

    if (!isWABusinessConfigured()) {
      return err('WhatsApp Business non configurato. Esegui /whatsapp business setup.');
    }

    const result = await sendTextMessage(number, text);
    if (!result.ok) {
      return err(`Invio fallito: ${result.error ?? 'errore sconosciuto'}`);
    }
    return ok(`Messaggio inviato a ${cyan(number)} via Business API.`);
  } catch (e) {
    return err(`Invio fallito: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function _whatsappClear(): Promise<string> {
  try {
    const { clearSession } = await import('./whatsapp-baileys.js');
    await clearSession();
    return ok('Sessione Baileys cancellata. Al prossimo /whatsapp connect verrà mostrato un nuovo QR code.');
  } catch (e) {
    return err(`Cancellazione sessione fallita: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function _whatsappHelp(): Promise<string> {
  const lines: string[] = [];

  try {
    const { getSetupInstructions: bizInstructions } =
      await import('./whatsapp-business.js');
    lines.push(bold('WhatsApp Business API:'));
    lines.push(bizInstructions());
    lines.push('');
  } catch {
    // modulo non disponibile
  }

  if (lines.length === 0) {
    lines.push(_whatsappUsage());
  }

  return lines.join('\n');
}

function _whatsappUsage(): string {
  return [
    bold('Uso:'),
    `  ${cyan('/whatsapp')}                              — stato connessioni`,
    `  ${cyan('/whatsapp connect')}                      — connetti via QR code (Baileys)`,
    `  ${cyan('/whatsapp disconnect')}                   — disconnetti sessione Baileys`,
    `  ${cyan('/whatsapp send')} <numero> <testo>        — invia messaggio (Baileys)`,
    `  ${cyan('/whatsapp business setup')} <tok> <pId> <aId> — configura Business API`,
    `  ${cyan('/whatsapp business send')} <numero> <testo>  — invia via Business API`,
    `  ${cyan('/whatsapp clear')}                        — cancella sessione Baileys (nuovo QR)`,
    `  ${cyan('/whatsapp help')}                         — istruzioni di setup`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// /notify command
// ---------------------------------------------------------------------------

export async function handleNotifyCommand(args: string[]): Promise<string> {
  const sub = args[0] ?? 'status';

  try {
    switch (sub) {
      case 'status':
      case '':
        return await _notifyStatus();

      case 'test': {
        const channel = args[1];
        if (!channel) return err('Uso: /notify test <canale>');
        return await _notifyTest(channel);
      }

      case 'route':
        return await _notifyRoute();

      case 'quiet': {
        const toggle = args[1];
        if (toggle !== 'on' && toggle !== 'off') {
          return err('Uso: /notify quiet on|off');
        }
        return await _notifyQuiet(toggle);
      }

      case 'send': {
        const channel = args[1];
        const text    = args.slice(2).join(' ');
        if (!channel || !text) return err('Uso: /notify send <canale> <testo>');
        return await _notifySend(channel, text);
      }

      default:
        return err(`Sottocomando sconosciuto: ${bold(sub)}\n${_notifyUsage()}`);
    }
  } catch (e) {
    return err(`Errore inatteso: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function _notifyStatus(): Promise<string> {
  const lines: string[] = [bold('CANALI NOTIFICA:')];

  try {
    const { getAvailableChannels, loadNotificationConfig } =
      await import('../notifications/channel.js');

    const channels = await getAvailableChannels();
    const config   = loadNotificationConfig();

    for (const ch of channels) {
      const c = ch as Record<string, unknown>;
      const name    = (typeof c['name']    === 'string' ? c['name']    : String(c['id'] ?? ''));
      const id      = (typeof c['id']      === 'string' ? c['id']      : '');
      const enabled = c['enabled'] !== false;
      const detail  = typeof c['detail']   === 'string' ? c['detail']  : '';

      const bullet = enabled ? green('[●]') : gray('[○]');
      const label  = `${bold(name.padEnd(14))} ${enabled ? green('attivo') : gray('non configurato')}`;
      const extra  = detail ? gray(`  (${detail})`) : '';

      lines.push(`  ${bullet} ${label}${extra}`);
      void id;
    }

    // Quiet hours
    if (config) {
      const active = config.quietHours.enabled;
      const start = config.quietHours.start;
      const end = config.quietHours.end;

      lines.push('');
      if (active) {
        lines.push(gray(`Ore silenziose: ${start}-${end} (attive, critical passano)`));
      } else {
        lines.push(gray(`Ore silenziose: ${start}-${end} (disattivate)`));
      }
    }
  } catch (e) {
    lines.push(warn(`Modulo notifiche non disponibile: ${e instanceof Error ? e.message : String(e)}`));
    lines.push(gray('  Verifica che ../notifications/channel.js esista e sia compilato.'));
  }

  return lines.join('\n');
}

async function _notifyTest(channel: string): Promise<string> {
  try {
    const { notifyAll } = await import('../notifications/channel.js');
    type NotificationChannel = import('../notifications/channel.js').NotificationChannel;

    await notifyAll([channel as NotificationChannel], {
      title: 'Test 108 AI',
      body: `Test notifica da 108 AI Desktop Agent — canale: ${channel}`,
      priority: 'normal',
      category: 'custom',
    });

    return ok(`Notifica di test inviata al canale ${cyan(channel)}.`);
  } catch (e) {
    return err(`Invio notifica fallito: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function _notifyRoute(): Promise<string> {
  const lines: string[] = [bold('ROUTING NOTIFICHE:')];

  try {
    const { loadNotificationConfig } = await import('../notifications/channel.js');
    const config = loadNotificationConfig();

    if (!config || typeof config !== 'object') {
      lines.push(gray('  Nessuna configurazione di routing trovata.'));
      return lines.join('\n');
    }

    for (const route of config.routing) {
      lines.push(`  ${bold(`${route.category}/${route.priority}`.padEnd(12))} → ${cyan(route.channel)}`);
    }
  } catch (e) {
    lines.push(warn(`Impossibile caricare il routing: ${e instanceof Error ? e.message : String(e)}`));
  }

  return lines.join('\n');
}

async function _notifyQuiet(toggle: 'on' | 'off'): Promise<string> {
  try {
    const { loadNotificationConfig, saveNotificationConfig } =
      await import('../notifications/channel.js');

    const config = loadNotificationConfig();
    config.quietHours.enabled = toggle === 'on';
    saveNotificationConfig(config);

    if (toggle === 'on') {
      const start = config.quietHours.start;
      const end = config.quietHours.end;
      return ok(`Ore silenziose attivate (${start}-${end}). Solo notifiche critical passano.`);
    }
    return ok('Ore silenziose disattivate.');
  } catch (e) {
    return err(`Impossibile aggiornare ore silenziose: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function _notifySend(channel: string, text: string): Promise<string> {
  try {
    const { notifyAll } = await import('../notifications/channel.js');
    type NotificationChannel = import('../notifications/channel.js').NotificationChannel;

    await notifyAll([channel as NotificationChannel], {
      title: '108 AI',
      body: text,
      priority: 'normal',
      category: 'custom',
    });

    return ok(`Messaggio inviato al canale ${cyan(channel)}.`);
  } catch (e) {
    return err(`Invio fallito: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function _notifyUsage(): string {
  return [
    bold('Uso:'),
    `  ${cyan('/notify')}                     — stato di tutti i canali`,
    `  ${cyan('/notify test')} <canale>        — invia notifica di test`,
    `  ${cyan('/notify route')}                — mostra regole di routing`,
    `  ${cyan('/notify quiet')} on|off         — attiva/disattiva ore silenziose`,
    `  ${cyan('/notify send')} <canale> <testo> — invia notifica diretta`,
  ].join('\n');
}

