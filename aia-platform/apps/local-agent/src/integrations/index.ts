/**
 * Integration adapters for the 108 AI Desktop Agent.
 *
 * Each integration is exposed as a namespace so callers can use
 * tree-shakeable named imports or the full namespace:
 *
 *   import { chromeCdp } from './integrations/index.js';
 *   await chromeCdp.connectCdp();
 *
 *   // or
 *   import * as chromeCdp from './integrations/chrome-cdp.js';
 */

export * as chromeCdp from './chrome-cdp.js';
export * as googleAuth from './google-auth.js';
export * as gmail from './gmail.js';
export * as googleCalendar from './google-calendar.js';
export * as imapClient from './imap-client.js';
export * as officeExcel from './office-excel.js';
export * as officeWord from './office-word.js';
export * as officeOutlook from './office-outlook.js';
export * as uiAutomation from './ui-automation.js';
export * as visionLlm from './vision-llm.js';
export * as telegramBot from './telegram-bot.js';
export * as whatsappBusiness from './whatsapp-business.js';
export * as whatsappBaileys from './whatsapp-baileys.js';
export * as fattureInCloud from './fatture-in-cloud.js';
