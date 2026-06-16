/**
 * Lazy-load heavy integration modules on first use (startup perf).
 */

export type IntegrationName =
  | 'chromeCdp'
  | 'gmail'
  | 'googleCalendar'
  | 'imapClient'
  | 'officeExcel'
  | 'officeWord'
  | 'officeOutlook'
  | 'uiAutomation'
  | 'visionLlm'
  | 'telegramBot'
  | 'whatsappBusiness'
  | 'whatsappBaileys'
  | 'fattureInCloud';

const cache = new Map<IntegrationName, unknown>();

export async function loadIntegration<T = unknown>(name: IntegrationName): Promise<T> {
  if (cache.has(name)) return cache.get(name) as T;

  let mod: unknown;
  switch (name) {
    case 'chromeCdp':
      mod = await import('../integrations/chrome-cdp.js');
      break;
    case 'gmail':
      mod = await import('../integrations/gmail.js');
      break;
    case 'googleCalendar':
      mod = await import('../integrations/google-calendar.js');
      break;
    case 'imapClient':
      mod = await import('../integrations/imap-client.js');
      break;
    case 'officeExcel':
      mod = await import('../integrations/office-excel.js');
      break;
    case 'officeWord':
      mod = await import('../integrations/office-word.js');
      break;
    case 'officeOutlook':
      mod = await import('../integrations/office-outlook.js');
      break;
    case 'uiAutomation':
      mod = await import('../integrations/ui-automation.js');
      break;
    case 'visionLlm':
      mod = await import('../integrations/vision-llm.js');
      break;
    case 'telegramBot':
      mod = await import('../integrations/telegram-bot.js');
      break;
    case 'whatsappBusiness':
      mod = await import('../integrations/whatsapp-business.js');
      break;
    case 'whatsappBaileys':
      mod = await import('../integrations/whatsapp-baileys.js');
      break;
    case 'fattureInCloud':
      mod = await import('../integrations/fatture-in-cloud.js');
      break;
    default:
      throw new Error(`Integration sconosciuta: ${name as string}`);
  }

  cache.set(name, mod);
  return mod as T;
}
