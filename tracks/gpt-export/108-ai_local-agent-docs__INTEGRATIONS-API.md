# Integrazioni — API Reference (local-agent)

Riferimento rapido agli adapter in `src/integrations/`. Ogni modulo è **ESM**, senza dipendenze esterne oltre a Node built-in.

## Indice

| Modulo | Namespace | Config / Auth |
|--------|-----------|---------------|
| Chrome CDP | `chromeCdp` | DevTools port |
| Google Auth | `googleAuth` | OAuth `~/.108ai/google-oauth.json` |
| Gmail | `gmail` | Token Google |
| Google Calendar | `googleCalendar` | Token Google |
| IMAP / PEC | `imapClient` | `~/.108ai/integrations/imap.json` |
| Outlook | `officeOutlook` | PowerShell + Outlook desktop |
| Excel / Word | `officeExcel`, `officeWord` | COM automation Windows |
| UI Automation | `uiAutomation` | Windows UIA |
| Vision LLM | `visionLlm` | Screenshot + gateway |
| Telegram | `telegramBot` | Bot token env |
| WhatsApp Business | `whatsappBusiness` | Meta Graph API config |
| WhatsApp Baileys | `whatsappBaileys` | Session locale |
| **Fatture in Cloud** | `fattureInCloud` | `FATTURE_IN_CLOUD_TOKEN`, `FATTURE_IN_CLOUD_COMPANY_ID` |

## Lazy loading

Il triage e altri hot path usano `loadIntegration(name)` da `lazy-loader.ts` per caricare i moduli solo al primo utilizzo.

```typescript
import { loadIntegration } from '../integrations/lazy-loader.js';

const gmail = await loadIntegration<typeof import('../integrations/gmail.js')>('gmail');
const messages = await gmail.listMessages(token, { query: 'is:unread', maxResults: 10 });
```

## Fatture in Cloud (Sprint 5 entry)

```typescript
import * as fic from '../integrations/fatture-in-cloud.js';

if (fic.isFattureInCloudConfigured()) {
  const { invoices, total } = await fic.listOverdueInvoices(20);
}
```

**Triage:** con `billing.enabled: true` in `~/.108ai/triage.json`, `/triage` include fatture scadute come item `source: billing`.

## Gmail — operazioni principali

| Funzione | Descrizione |
|----------|-------------|
| `listMessages(token, opts)` | Lista con query Gmail |
| `getMessage(token, id)` | Dettaglio singolo |
| `sendEmail(token, params)` | Invio / reply |
| `searchMessages(token, query)` | Wrapper search |

## MCP tools (extensions)

Tool referenziati come `mcp:<server>:<tool>` in agent/skill YAML. Richiedono server in `~/.108ai/mcp.yml` con transport `stdio` o `sse` + `url`.

## Estendere

1. Creare `src/integrations/<nome>.ts` con tipi esportati e funzioni pure/async.
2. Esportare namespace in `integrations/index.ts`.
3. Aggiungere case in `lazy-loader.ts`.
4. (Opzionale) Collegare al triage engine o a un command YAML `context.integration`.

## Sicurezza

- Mai loggare token o PII.
- Timeout su ogni `fetch` esterno (15–30s).
- Secret solo in env o file cifrati (`key-vault.ts` per provider LLM).
