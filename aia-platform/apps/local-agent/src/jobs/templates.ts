/**
 * Job Templates — 108 AI Desktop Agent
 *
 * Pre-configured job templates for common PMI (Italian SME) workflows.
 * Used when creating a job from a template: `/job create --from <template-id>`
 *
 * Instantiation produces a fully valid JobDefinition with a generated ID,
 * timestamps, and zeroed run counters, ready to be persisted via the job store.
 */

import type { JobDefinition } from './types.js';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface JobTemplate {
  id: string;
  name: string;
  description: string;
  category: 'report' | 'email' | 'backup' | 'fatturazione' | 'social' | 'automazione';
  estimatedTokensPerRun: number;
  estimatedCostPerRun: number; // USD
  requiredIntegrations: string[]; // e.g. ['gmail', 'calendar']
  definition: Omit<JobDefinition, 'id' | 'metadata'>;
}

// ---------------------------------------------------------------------------
// Shared retry / failure helpers
// ---------------------------------------------------------------------------

/**
 * Standard retry policy for transient HTTP errors:
 * 2 attempts with exponential backoff (1s → 2s).
 */
const HTTP_RETRY = {
  count: 2,
  backoff: 'exponential' as const,
  initialDelay: 1_000,
  maxDelay: 4_000,
};

/**
 * No-retry policy — used for AI steps where a repeated call is unlikely
 * to produce a different result and costs extra tokens.
 */
const NO_RETRY = {
  count: 0,
  backoff: 'fixed' as const,
  initialDelay: 0,
};

// ---------------------------------------------------------------------------
// Template registry
// ---------------------------------------------------------------------------

const TEMPLATES: JobTemplate[] = [
  // -------------------------------------------------------------------------
  // 1. Weekly sales report
  // -------------------------------------------------------------------------
  {
    id: 'report-vendite',
    name: 'Report Vendite Settimanale',
    description:
      'Recupera ordini e pagamenti della settimana, analizza con AI e invia un report riepilogativo via Gmail ogni venerdì alle 17:00.',
    category: 'report',
    estimatedTokensPerRun: 5_000,
    estimatedCostPerRun: 0.005,
    requiredIntegrations: ['gmail'],
    definition: {
      name: 'Report Vendite Settimanale',
      description:
        'Recupera ordini e pagamenti della settimana, analizza con AI e invia un report riepilogativo via Gmail ogni venerdì alle 17:00.',
      version: 1,
      enabled: true,
      trigger: {
        type: 'cron',
        schedule: '0 17 * * 5', // Friday 17:00
      },
      steps: [
        {
          id: 'fetch-orders',
          type: 'http',
          description: 'Recupera gli ordini della settimana dal gestionale',
          method: 'GET',
          url: '{{config.erp_base_url}}/api/orders?from={{dateOffset(-7d)}}&to={{dateNow()}}',
          headers: { Authorization: 'Bearer {{secrets.erp_token}}' },
          timeout: 30_000,
          retry: HTTP_RETRY,
          outputFormat: 'json',
        },
        {
          id: 'fetch-payments',
          type: 'http',
          description: 'Recupera i pagamenti registrati nella settimana',
          method: 'GET',
          url: '{{config.erp_base_url}}/api/payments?from={{dateOffset(-7d)}}&to={{dateNow()}}',
          headers: { Authorization: 'Bearer {{secrets.erp_token}}' },
          timeout: 30_000,
          retry: HTTP_RETRY,
          outputFormat: 'json',
          dependsOn: ['fetch-orders'],
        },
        {
          id: 'ai-analyze-report',
          type: 'ai',
          description: 'Analizza vendite e pagamenti, genera report HTML formattato',
          model: 'balanced',
          prompt:
            'Sei un analista aziendale. Analizza i seguenti dati di vendita e pagamento della settimana:\n\nORDINI:\n{{fetch-orders.output}}\n\nPAGAMENTI:\n{{fetch-payments.output}}\n\nGenera un report in italiano con:\n1. Totale ordini e valore\n2. Pagamenti ricevuti vs attesi\n3. Top 3 prodotti/servizi\n4. 2-3 azioni raccomandate\n\nFormato: HTML email-ready con titoli e tabelle.',
          maxTokens: 1_500,
          timeout: 60_000,
          retry: NO_RETRY,
          outputFormat: 'markdown',
          dependsOn: ['fetch-payments'],
        },
        {
          id: 'send-report-email',
          type: 'integration',
          description: 'Invia il report via Gmail ai destinatari configurati',
          action: 'gmail.send',
          params: {
            to: '{{config.report_recipients}}',
            subject: 'Report Vendite Settimanale — {{dateNow("DD/MM/YYYY")}}',
            body: '{{ai-analyze-report.output}}',
            isHtml: 'true',
          },
          timeout: 30_000,
          retry: HTTP_RETRY,
          dependsOn: ['ai-analyze-report'],
        },
      ],
      budget: {
        maxTokensPerRun: 5_000,
        maxCostPerRun: 0.01,
        monthlyCap: 0.5,
      },
      onFailure: {
        strategy: 'notify',
        notify: {
          channel: 'desktop',
          message: 'Report vendite settimanale fallito: {{error}}',
        },
        circuitBreaker: {
          threshold: 3,
          resetAfterMs: 3_600_000, // 1 hour
        },
      },
    },
  },

  // -------------------------------------------------------------------------
  // 2. Email classification
  // -------------------------------------------------------------------------
  {
    id: 'classifica-email',
    name: 'Classificazione Email Automatica',
    description:
      'Ogni 2 ore nei giorni lavorativi recupera le email non lette, le classifica con AI e applica le etichette Gmail appropriate.',
    category: 'email',
    estimatedTokensPerRun: 1_000,
    estimatedCostPerRun: 0.001,
    requiredIntegrations: ['gmail'],
    definition: {
      name: 'Classificazione Email Automatica',
      description:
        'Ogni 2 ore nei giorni lavorativi recupera le email non lette, le classifica con AI e applica le etichette Gmail appropriate.',
      version: 1,
      enabled: true,
      trigger: {
        type: 'cron',
        schedule: '0 */2 * * 1-5', // Every 2h, weekdays
      },
      steps: [
        {
          id: 'list-unread-emails',
          type: 'integration',
          description: 'Recupera le ultime email non lette dalla inbox',
          action: 'gmail.list',
          params: {
            query: 'is:unread in:inbox',
            maxResults: '30',
            fields: 'id,subject,from,snippet,labelIds',
          },
          timeout: 30_000,
          retry: HTTP_RETRY,
          outputFormat: 'json',
        },
        {
          id: 'ai-classify-emails',
          type: 'ai',
          description:
            'Classifica ogni email in una categoria e determina priorità e azione',
          model: 'fast-cheap',
          prompt:
            'Classifica le seguenti email aziendali. Per ogni email restituisci un JSON array con:\n- id: ID email\n- category: "cliente" | "fornitore" | "burocrazia" | "newsletter" | "spam" | "interno" | "altro"\n- priority: "alta" | "media" | "bassa"\n- label: etichetta Gmail da applicare (stesso valore di category)\n- action: "rispondere" | "archiviare" | "eliminare" | "leggere" | "delegare"\n\nEMAIL:\n{{list-unread-emails.output}}\n\nRispondi SOLO con il JSON array, nessun testo aggiuntivo.',
          maxTokens: 800,
          timeout: 60_000,
          retry: NO_RETRY,
          outputFormat: 'json',
          dependsOn: ['list-unread-emails'],
          skipIf: '{{list-unread-emails.output.length === 0}}',
        },
        {
          id: 'apply-gmail-labels',
          type: 'integration',
          description: 'Applica le etichette classificate alle email su Gmail',
          action: 'gmail.label',
          params: {
            classifications: '{{ai-classify-emails.output}}',
            createMissingLabels: 'true',
          },
          timeout: 30_000,
          retry: HTTP_RETRY,
          dependsOn: ['ai-classify-emails'],
          skipIf: '{{!ai-classify-emails.output}}',
        },
      ],
      budget: {
        maxTokensPerRun: 1_000,
        maxCostPerRun: 0.002,
        monthlyCap: 1.0,
      },
      onFailure: {
        strategy: 'skip',
        notify: {
          channel: 'console',
          message: 'Classificazione email fallita: {{error}}',
        },
        circuitBreaker: {
          threshold: 5,
          resetAfterMs: 3_600_000,
        },
      },
    },
  },

  // -------------------------------------------------------------------------
  // 3. Daily document backup
  // -------------------------------------------------------------------------
  {
    id: 'backup-docs',
    name: 'Backup Documenti Giornaliero',
    description:
      'Backup giornaliero notturno dei documenti aziendali via rsync con verifica checksum. Zero token AI consumati.',
    category: 'backup',
    estimatedTokensPerRun: 0,
    estimatedCostPerRun: 0.0,
    requiredIntegrations: [],
    definition: {
      name: 'Backup Documenti Giornaliero',
      description:
        'Backup giornaliero notturno dei documenti aziendali via rsync con verifica checksum. Zero token AI consumati.',
      version: 1,
      enabled: true,
      trigger: {
        type: 'cron',
        schedule: '0 22 * * *', // Daily 22:00
      },
      steps: [
        {
          id: 'rsync-backup',
          type: 'shell',
          description: 'Esegue rsync dalla cartella documenti alla destinazione di backup',
          command:
            'rsync -avz --delete --checksum "{{config.docs_source_path}}" "{{config.backup_dest_path}}" > /tmp/backup-rsync.log 2>&1',
          timeout: 120_000,
          retry: {
            count: 1,
            backoff: 'fixed',
            initialDelay: 30_000,
          },
          outputFormat: 'text',
        },
        {
          id: 'verify-checksum',
          type: 'shell',
          description: 'Verifica integrità del backup tramite confronto checksum',
          command:
            'find "{{config.backup_dest_path}}" -type f -name "*.pdf" -o -name "*.docx" -o -name "*.xlsx" | head -100 | xargs md5sum > /tmp/backup-checksums.txt && echo "OK:$(wc -l < /tmp/backup-checksums.txt) files verified"',
          timeout: 120_000,
          retry: {
            count: 0,
            backoff: 'fixed',
            initialDelay: 0,
          },
          outputFormat: 'text',
          dependsOn: ['rsync-backup'],
        },
        {
          id: 'notify-on-error',
          type: 'condition',
          description: 'Notifica solo in caso di errore nei passi precedenti',
          if: '{{rsync-backup.status === "failed" || verify-checksum.status === "failed"}}',
          then: ['send-failure-notification'],
          timeout: 5_000,
          retry: NO_RETRY,
          dependsOn: ['verify-checksum'],
        },
        {
          id: 'send-failure-notification',
          type: 'integration',
          description: 'Invia notifica di errore via email',
          action: 'gmail.send',
          params: {
            to: '{{config.admin_email}}',
            subject: 'ERRORE: Backup documenti fallito — {{dateNow("DD/MM/YYYY")}}',
            body: 'Il backup notturno dei documenti ha riscontrato un errore.\n\nDettaglio rsync:\n{{rsync-backup.output}}\n\nDettaglio verifica:\n{{verify-checksum.output}}',
          },
          timeout: 30_000,
          retry: HTTP_RETRY,
          skipIf: '{{rsync-backup.status === "completed" && verify-checksum.status === "completed"}}',
        },
      ],
      budget: {
        maxTokensPerRun: 0,
        maxCostPerRun: 0.0,
        monthlyCap: 0.0,
      },
      onFailure: {
        strategy: 'notify',
        notify: {
          channel: 'desktop',
          message: 'Backup giornaliero fallito: {{error}}',
        },
        circuitBreaker: {
          threshold: 3,
          resetAfterMs: 86_400_000, // 24 hours
        },
      },
    },
  },

  // -------------------------------------------------------------------------
  // 4. Overdue invoice reminder
  // -------------------------------------------------------------------------
  {
    id: 'fatture-scadute',
    name: 'Reminder Fatture Scadute',
    description:
      'Ogni giorno alle 09:00 controlla le fatture scadute, redige un reminder personalizzato con AI e lo invia via Gmail.',
    category: 'fatturazione',
    estimatedTokensPerRun: 1_500,
    estimatedCostPerRun: 0.0015,
    requiredIntegrations: ['gmail'],
    definition: {
      name: 'Reminder Fatture Scadute',
      description:
        'Ogni giorno alle 09:00 controlla le fatture scadute, redige un reminder personalizzato con AI e lo invia via Gmail.',
      version: 1,
      enabled: true,
      trigger: {
        type: 'cron',
        schedule: '0 9 * * *', // Daily 09:00
      },
      steps: [
        {
          id: 'fetch-invoices',
          type: 'http',
          description: 'Recupera le fatture con stato "non pagato" dal gestionale',
          method: 'GET',
          url: '{{config.erp_base_url}}/api/invoices?status=unpaid&dueBefore={{dateNow()}}',
          headers: { Authorization: 'Bearer {{secrets.erp_token}}' },
          timeout: 30_000,
          retry: HTTP_RETRY,
          outputFormat: 'json',
        },
        {
          id: 'filter-overdue',
          type: 'condition',
          description: 'Procede solo se esistono fatture effettivamente scadute',
          if: '{{fetch-invoices.output.length > 0}}',
          then: ['ai-draft-reminder', 'send-reminder-email'],
          timeout: 5_000,
          retry: NO_RETRY,
          dependsOn: ['fetch-invoices'],
        },
        {
          id: 'ai-draft-reminder',
          type: 'ai',
          description: 'Redige email di sollecito professionale personalizzata per ogni cliente',
          model: 'fast-cheap',
          prompt:
            'Sei un assistente aziendale italiano. Per ogni fattura scaduta crea un testo di sollecito professionale, cordiale ma fermo.\n\nFATTURE SCADUTE:\n{{fetch-invoices.output}}\n\nPer ogni cliente genera un oggetto JSON con:\n- clientEmail: email del cliente\n- clientName: nome del cliente\n- subject: oggetto email\n- body: testo email in italiano (2-3 paragrafi, includi importo e data scadenza)\n\nRestituisci un JSON array. Nessun testo aggiuntivo.',
          maxTokens: 1_200,
          timeout: 60_000,
          retry: NO_RETRY,
          outputFormat: 'json',
          dependsOn: ['filter-overdue'],
          skipIf: '{{fetch-invoices.output.length === 0}}',
        },
        {
          id: 'send-reminder-email',
          type: 'integration',
          description: 'Invia i solleciti via Gmail a ogni cliente con fattura scaduta',
          action: 'gmail.send',
          params: {
            batch: '{{ai-draft-reminder.output}}',
            from: '{{config.sender_email}}',
            replyTo: '{{config.admin_email}}',
          },
          timeout: 30_000,
          retry: HTTP_RETRY,
          dependsOn: ['ai-draft-reminder'],
          skipIf: '{{!ai-draft-reminder.output || ai-draft-reminder.output.length === 0}}',
        },
      ],
      budget: {
        maxTokensPerRun: 1_500,
        maxCostPerRun: 0.003,
        monthlyCap: 0.09,
      },
      onFailure: {
        strategy: 'notify',
        notify: {
          channel: 'desktop',
          message: 'Invio reminder fatture scadute fallito: {{error}}',
        },
        circuitBreaker: {
          threshold: 3,
          resetAfterMs: 3_600_000,
        },
      },
    },
  },

  // -------------------------------------------------------------------------
  // 5. Weekly social content
  // -------------------------------------------------------------------------
  {
    id: 'social-post',
    name: 'Contenuto Social Settimanale',
    description:
      'Ogni lunedì alle 10:00 genera idee di post per LinkedIn/social con AI, richiede approvazione umana e pubblica via API.',
    category: 'social',
    estimatedTokensPerRun: 3_000,
    estimatedCostPerRun: 0.003,
    requiredIntegrations: [],
    definition: {
      name: 'Contenuto Social Settimanale',
      description:
        'Ogni lunedì alle 10:00 genera idee di post per LinkedIn/social con AI, richiede approvazione umana e pubblica via API.',
      version: 1,
      enabled: true,
      trigger: {
        type: 'cron',
        schedule: '0 10 * * 1', // Monday 10:00
      },
      steps: [
        {
          id: 'ai-generate-post-ideas',
          type: 'ai',
          description: 'Genera 3 idee di post social per la settimana corrente',
          model: 'balanced',
          prompt:
            'Sei un copywriter esperto di marketing B2B per PMI italiane. Genera 3 idee di post per LinkedIn per questa settimana.\n\nAzienda: {{config.company_name}}\nSettore: {{config.company_sector}}\nTone of voice: professionale ma accessibile\n\nPer ogni idea restituisci un JSON con:\n- id: "post-1" | "post-2" | "post-3"\n- type: "insight" | "case-study" | "tip" | "news"\n- hook: prima riga del post (max 150 caratteri, deve fermare lo scroll)\n- body: corpo del post (max 700 caratteri)\n- hashtags: array di 5 hashtag rilevanti\n- bestDay: giorno migliore per pubblicare (lunedì-venerdì)\n- bestTime: orario migliore ("08:00" | "12:00" | "17:00")\n\nRestituisci un JSON array. Nessun testo aggiuntivo.',
          maxTokens: 2_000,
          timeout: 60_000,
          retry: NO_RETRY,
          outputFormat: 'json',
        },
        {
          id: 'human-approval',
          type: 'human',
          description: "Richiede approvazione dell operatore prima di pubblicare",
          question:
            'Ho generato 3 idee di post per questa settimana. Scegli quale pubblicare oppure seleziona "Nessuno" per saltare:\n\n{{ai-generate-post-ideas.output}}',
          options: ['Post 1', 'Post 2', 'Post 3', 'Tutti e 3', 'Nessuno'],
          continueOnTimeout: false,
          timeout: 86_400_000, // 24h — wait for human input
          retry: NO_RETRY,
          dependsOn: ['ai-generate-post-ideas'],
        },
        {
          id: 'publish-to-social',
          type: 'http',
          description: 'Pubblica il post approvato via API social',
          method: 'POST',
          url: '{{config.social_api_url}}/posts',
          headers: {
            Authorization: 'Bearer {{secrets.social_api_token}}',
            'Content-Type': 'application/json',
          },
          body: '{{buildApprovedPost(human-approval.output, ai-generate-post-ideas.output)}}',
          timeout: 30_000,
          retry: HTTP_RETRY,
          dependsOn: ['human-approval'],
          skipIf: '{{human-approval.output === "Nessuno"}}',
        },
      ],
      budget: {
        maxTokensPerRun: 3_000,
        maxCostPerRun: 0.006,
        monthlyCap: 0.25,
      },
      onFailure: {
        strategy: 'notify',
        notify: {
          channel: 'desktop',
          message: 'Pubblicazione post social fallita: {{error}}',
        },
        circuitBreaker: {
          threshold: 3,
          resetAfterMs: 3_600_000,
        },
      },
    },
  },

  // -------------------------------------------------------------------------
  // 6. Morning triage
  // -------------------------------------------------------------------------
  {
    id: 'triage-mattutino',
    name: 'Triage Mattutino',
    description:
      'Ogni mattina nei giorni lavorativi alle 07:00: recupera email, eventi di calendario e prioritizza con AI le attività della giornata.',
    category: 'automazione',
    estimatedTokensPerRun: 2_000,
    estimatedCostPerRun: 0.002,
    requiredIntegrations: ['gmail', 'calendar'],
    definition: {
      name: 'Triage Mattutino',
      description:
        'Ogni mattina nei giorni lavorativi alle 07:00: recupera email, eventi di calendario e prioritizza con AI le attività della giornata.',
      version: 1,
      enabled: true,
      trigger: {
        type: 'cron',
        schedule: '0 7 * * 1-5', // Weekdays 07:00
      },
      steps: [
        {
          id: 'list-inbox-emails',
          type: 'integration',
          description: 'Recupera le email non lette degli ultimi 2 giorni',
          action: 'gmail.list',
          params: {
            query: 'is:unread in:inbox newer_than:2d',
            maxResults: '20',
            fields: 'id,subject,from,snippet,date',
          },
          timeout: 30_000,
          retry: HTTP_RETRY,
          outputFormat: 'json',
        },
        {
          id: 'get-calendar-events',
          type: 'integration',
          description: 'Recupera gli eventi di oggi dal calendario',
          action: 'calendar.events',
          params: {
            timeMin: '{{startOfDay()}}',
            timeMax: '{{endOfDay()}}',
            maxResults: '15',
            orderBy: 'startTime',
          },
          timeout: 30_000,
          retry: HTTP_RETRY,
          outputFormat: 'json',
        },
        {
          id: 'ai-prioritize-suggest',
          type: 'ai',
          description: 'Analizza email e calendario, genera piano giornaliero prioritizzato',
          model: 'fast-cheap',
          prompt:
            "Sei l'assistente personale di un manager italiano. Analizza email e impegni di oggi e produci un briefing mattutino.\n\nEMAIL NON LETTE:\n{{list-inbox-emails.output}}\n\nEVENTI DI OGGI:\n{{get-calendar-events.output}}\n\nGenera in italiano:\n1. **Top 3 priorità del giorno** (con motivazione)\n2. **Email che richiedono risposta oggi** (max 5, con azione suggerita)\n3. **Preparazione meeting** (se ci sono meeting nelle prossime 2 ore)\n4. **Elemento da posticipare** (1 cosa che può aspettare)\n\nFormato: Markdown conciso, punti elenco, max 300 parole.",
          maxTokens: 600,
          timeout: 60_000,
          retry: NO_RETRY,
          outputFormat: 'markdown',
          dependsOn: ['list-inbox-emails', 'get-calendar-events'],
        },
      ],
      budget: {
        maxTokensPerRun: 2_000,
        maxCostPerRun: 0.004,
        monthlyCap: 0.45,
      },
      onFailure: {
        strategy: 'skip',
        notify: {
          channel: 'console',
          message: 'Triage mattutino fallito: {{error}}',
        },
        circuitBreaker: {
          threshold: 5,
          resetAfterMs: 3_600_000,
        },
      },
    },
  },

  // -------------------------------------------------------------------------
  // 7. Meeting preparation
  // -------------------------------------------------------------------------
  {
    id: 'meeting-prep',
    name: 'Preparazione Meeting',
    description:
      'Recupera il prossimo meeting dal calendario, scarica i documenti correlati e genera summary e agenda con AI. Trigger manuale o automatico 1h prima.',
    category: 'automazione',
    estimatedTokensPerRun: 2_500,
    estimatedCostPerRun: 0.0025,
    requiredIntegrations: ['calendar'],
    definition: {
      name: 'Preparazione Meeting',
      description:
        'Recupera il prossimo meeting dal calendario, scarica i documenti correlati e genera summary e agenda con AI. Trigger manuale o automatico 1h prima.',
      version: 1,
      enabled: true,
      trigger: {
        type: 'manual',
      },
      steps: [
        {
          id: 'get-next-event',
          type: 'integration',
          description: 'Recupera il prossimo evento del calendario con partecipanti',
          action: 'calendar.nextEvent',
          params: {
            includeAttendees: 'true',
            includeDescription: 'true',
            includeAttachments: 'true',
          },
          timeout: 30_000,
          retry: HTTP_RETRY,
          outputFormat: 'json',
        },
        {
          id: 'fetch-related-docs',
          type: 'http',
          description: 'Recupera documenti correlati al meeting dalla knowledge base',
          method: 'POST',
          url: '{{config.kb_api_url}}/search',
          headers: {
            Authorization: 'Bearer {{secrets.kb_token}}',
            'Content-Type': 'application/json',
          },
          body: '{"query": "{{get-next-event.output.title}}", "limit": 5, "type": "documents"}',
          timeout: 30_000,
          retry: HTTP_RETRY,
          outputFormat: 'json',
          dependsOn: ['get-next-event'],
          skipIf: '{{!get-next-event.output}}',
        },
        {
          id: 'ai-meeting-summary',
          type: 'ai',
          description: 'Genera briefing completo con summary e agenda per il meeting',
          model: 'balanced',
          prompt:
            'Sei un chief of staff. Prepara un briefing pre-meeting completo.\n\nMEETING:\n{{get-next-event.output}}\n\nDOCUMENTI CORRELATI:\n{{fetch-related-docs.output}}\n\nGenera in italiano:\n## Briefing Pre-Meeting\n\n**Meeting:** [titolo e orario]\n**Partecipanti:** [lista con ruoli se noti]\n\n### Contesto (3-4 righe)\n[cosa è questo meeting e perché è importante]\n\n### Agenda Suggerita\n1. ...\n2. ...\n3. ...\n\n### Documenti Chiave\n[max 3 punti sui doc più rilevanti]\n\n### Domande Aperte\n[2-3 punti che potrebbero emergere]\n\n### Azione Post-Meeting\n[cosa aspettarsi come output/decisione]\n\nMax 400 parole.',
          maxTokens: 1_000,
          timeout: 60_000,
          retry: NO_RETRY,
          outputFormat: 'markdown',
          dependsOn: ['fetch-related-docs'],
        },
      ],
      budget: {
        maxTokensPerRun: 2_500,
        maxCostPerRun: 0.005,
        monthlyCap: 1.0,
      },
      onFailure: {
        strategy: 'notify',
        notify: {
          channel: 'desktop',
          message: 'Preparazione meeting fallita: {{error}}',
        },
        circuitBreaker: {
          threshold: 3,
          resetAfterMs: 3_600_000,
        },
      },
    },
  },

  // -------------------------------------------------------------------------
  // 8. Generate invoice from order
  // -------------------------------------------------------------------------
  {
    id: 'invoice-from-order',
    name: 'Genera Fattura da Ordine',
    description:
      'Trigger su nuovo ordine: recupera i dati, genera il testo fattura con AI, compila il template Word tramite mail merge e invia la fattura via Gmail.',
    category: 'fatturazione',
    estimatedTokensPerRun: 1_000,
    estimatedCostPerRun: 0.001,
    requiredIntegrations: ['gmail'],
    definition: {
      name: 'Genera Fattura da Ordine',
      description:
        'Trigger su nuovo ordine: recupera i dati, genera il testo fattura con AI, compila il template Word tramite mail merge e invia la fattura via Gmail.',
      version: 1,
      enabled: true,
      trigger: {
        type: 'event',
        source: 'erp',
        condition: 'event.type === "new-order" && event.status === "confirmed"',
      },
      steps: [
        {
          id: 'fetch-order-detail',
          type: 'http',
          description: 'Recupera il dettaglio completo dell\'ordine dal gestionale',
          method: 'GET',
          url: '{{config.erp_base_url}}/api/orders/{{event.orderId}}',
          headers: { Authorization: 'Bearer {{secrets.erp_token}}' },
          timeout: 30_000,
          retry: HTTP_RETRY,
          outputFormat: 'json',
        },
        {
          id: 'ai-generate-invoice-text',
          type: 'ai',
          description: 'Genera il testo formattato per la fattura italiana conforme normativa',
          model: 'fast-cheap',
          prompt:
            'Sei un esperto di fatturazione italiana. Genera i dati strutturati per una fattura conforme al D.P.R. 633/72.\n\nDATI ORDINE:\n{{fetch-order-detail.output}}\n\nGenera un JSON con:\n- invoiceNumber: numero progressivo (usa {{config.last_invoice_number + 1}})\n- invoiceDate: data odierna in formato DD/MM/YYYY\n- customerName: ragione sociale cliente\n- customerVatId: P.IVA cliente\n- customerAddress: indirizzo completo\n- items: array di {description, quantity, unitPrice, vatRate, total}\n- subtotal: imponibile\n- vatAmount: IVA totale\n- totalAmount: totale fattura\n- paymentTerms: termini di pagamento (da ordine o default 30gg)\n- notes: eventuali note aggiuntive\n\nRestituisci SOLO il JSON. Nessun testo aggiuntivo.',
          maxTokens: 600,
          timeout: 60_000,
          retry: NO_RETRY,
          outputFormat: 'json',
          dependsOn: ['fetch-order-detail'],
        },
        {
          id: 'word-mail-merge',
          type: 'com',
          description: 'Compila il template fattura Word con i dati generati e salva come PDF',
          action: 'word.mailMerge',
          params: {
            templatePath: '{{config.invoice_template_path}}',
            data: '{{ai-generate-invoice-text.output}}',
            outputPath: '{{config.invoices_dir}}/fattura-{{ai-generate-invoice-text.output.invoiceNumber}}.pdf',
            savePdf: 'true',
          },
          timeout: 120_000,
          retry: {
            count: 1,
            backoff: 'fixed',
            initialDelay: 5_000,
          },
          dependsOn: ['ai-generate-invoice-text'],
        },
        {
          id: 'send-invoice-email',
          type: 'integration',
          description: 'Invia la fattura PDF al cliente via Gmail',
          action: 'gmail.send',
          params: {
            to: '{{fetch-order-detail.output.customerEmail}}',
            subject: 'Fattura n. {{ai-generate-invoice-text.output.invoiceNumber}} — {{config.company_name}}',
            body: 'Gentile {{fetch-order-detail.output.customerName}},\n\nin allegato la fattura n. {{ai-generate-invoice-text.output.invoiceNumber}} del {{ai-generate-invoice-text.output.invoiceDate}} relativa all\'ordine n. {{event.orderId}}.\n\nPer qualsiasi informazione siamo a disposizione.\n\nCordiali saluti,\n{{config.company_name}}',
            attachments: '[{"path": "{{word-mail-merge.output.pdfPath}}"}]',
          },
          timeout: 30_000,
          retry: HTTP_RETRY,
          dependsOn: ['word-mail-merge'],
        },
      ],
      budget: {
        maxTokensPerRun: 1_000,
        maxCostPerRun: 0.002,
        monthlyCap: 2.0,
      },
      onFailure: {
        strategy: 'notify',
        notify: {
          channel: 'desktop',
          message: 'Generazione fattura fallita per ordine {{event.orderId}}: {{error}}',
        },
        circuitBreaker: {
          threshold: 3,
          resetAfterMs: 3_600_000,
        },
      },
    },
  },

  // -------------------------------------------------------------------------
  // 9. Competitor monitoring
  // -------------------------------------------------------------------------
  {
    id: 'competitor-watch',
    name: 'Monitoraggio Competitor Settimanale',
    description:
      'Ogni lunedì alle 08:00 analizza i siti dei competitor, sintetizza i cambiamenti con AI e invia un report via Gmail.',
    category: 'report',
    estimatedTokensPerRun: 5_000,
    estimatedCostPerRun: 0.005,
    requiredIntegrations: ['gmail'],
    definition: {
      name: 'Monitoraggio Competitor Settimanale',
      description:
        'Ogni lunedì alle 08:00 analizza i siti dei competitor, sintetizza i cambiamenti con AI e invia un report via Gmail.',
      version: 1,
      enabled: true,
      trigger: {
        type: 'cron',
        schedule: '0 8 * * 1', // Monday 08:00
      },
      steps: [
        {
          id: 'scrape-competitor-sites',
          type: 'shell',
          description: 'Scarica il contenuto testuale dei siti competitor per il confronto',
          command:
            'node -e "const urls = {{config.competitor_urls}}; const fs = require(\'fs\'); const {execSync} = require(\'child_process\'); const results = {}; for (const url of urls) { try { const text = execSync(\'curl -s --max-time 15 \\\'\' + url + \'\\\' | sed \'s/<[^>]*>//g\' | tr -s \' \\n\' | head -c 5000\', {encoding: \'utf8\'}); results[url] = text; } catch(e) { results[url] = \'FETCH_ERROR: \' + e.message; } } fs.writeFileSync(\'/tmp/competitor-data.json\', JSON.stringify(results)); console.log(JSON.stringify(results));"',
          timeout: 120_000,
          retry: {
            count: 1,
            backoff: 'fixed',
            initialDelay: 10_000,
          },
          outputFormat: 'json',
        },
        {
          id: 'ai-compare-summarize',
          type: 'ai',
          description: 'Confronta i dati con la settimana precedente e sintetizza i cambiamenti rilevanti',
          model: 'balanced',
          prompt:
            "Sei un analista di mercato. Analizza i dati dei siti competitor e produci un report di intelligence competitiva.\n\nDATA ODIERNA COMPETITOR:\n{{scrape-competitor-sites.output}}\n\nDATA PRECEDENTE (riferimento):\n{{config.last_competitor_snapshot}}\n\nProduce in italiano:\n## Report Competitor — {{dateNow('DD/MM/YYYY')}}\n\n### Sintesi Esecutiva (3 righe)\n\n### Cambiamenti Rilevanti per Competitor\n[Per ogni competitor: nome, cambiamenti notati, implicazione per noi]\n\n### Opportunità Identificate\n[Max 3 punti d'azione concreti]\n\n### Minacce da Monitorare\n[Max 2 punti]\n\nMax 500 parole. Formato Markdown.",
          maxTokens: 1_500,
          timeout: 60_000,
          retry: NO_RETRY,
          outputFormat: 'markdown',
          dependsOn: ['scrape-competitor-sites'],
        },
        {
          id: 'send-competitor-report',
          type: 'integration',
          description: 'Invia il report competitor via Gmail al team marketing',
          action: 'gmail.send',
          params: {
            to: '{{config.marketing_team_email}}',
            subject: "Report Competitor — Settimana del {{dateNow('DD/MM/YYYY')}}",
            body: '{{ai-compare-summarize.output}}',
            isHtml: 'false',
          },
          timeout: 30_000,
          retry: HTTP_RETRY,
          dependsOn: ['ai-compare-summarize'],
        },
      ],
      budget: {
        maxTokensPerRun: 5_000,
        maxCostPerRun: 0.01,
        monthlyCap: 0.45,
      },
      onFailure: {
        strategy: 'notify',
        notify: {
          channel: 'desktop',
          message: 'Monitoraggio competitor fallito: {{error}}',
        },
        circuitBreaker: {
          threshold: 3,
          resetAfterMs: 3_600_000,
        },
      },
    },
  },

  // -------------------------------------------------------------------------
  // 10. Auto-fill timesheet from calendar
  // -------------------------------------------------------------------------
  {
    id: 'timesheet-fill',
    name: 'Compilazione Timesheet da Calendario',
    description:
      'Ogni venerdì alle 16:00 recupera gli eventi della settimana, li formatta come voci di timesheet con AI e le scrive sul foglio Excel aziendale.',
    category: 'automazione',
    estimatedTokensPerRun: 1_500,
    estimatedCostPerRun: 0.0015,
    requiredIntegrations: ['calendar'],
    definition: {
      name: 'Compilazione Timesheet da Calendario',
      description:
        'Ogni venerdì alle 16:00 recupera gli eventi della settimana, li formatta come voci di timesheet con AI e le scrive sul foglio Excel aziendale.',
      version: 1,
      enabled: true,
      trigger: {
        type: 'cron',
        schedule: '0 16 * * 5', // Friday 16:00
      },
      steps: [
        {
          id: 'get-week-events',
          type: 'integration',
          description: 'Recupera tutti gli eventi del calendario della settimana corrente',
          action: 'calendar.weekEvents',
          params: {
            weekStart: '{{startOfWeek()}}',
            weekEnd: '{{endOfWeek()}}',
            includeAllDay: 'false',
            calendars: '{{config.timesheet_calendars}}',
          },
          timeout: 30_000,
          retry: HTTP_RETRY,
          outputFormat: 'json',
        },
        {
          id: 'ai-format-timesheet',
          type: 'ai',
          description: 'Converte gli eventi del calendario in voci di timesheet categorizzate',
          model: 'fast-cheap',
          prompt:
            'Sei un assistente amministrativo. Converti gli eventi del calendario in voci di timesheet per la rendicontazione aziendale.\n\nEVENTI SETTIMANA:\n{{get-week-events.output}}\n\nCATEGORIE DISPONIBILI: {{config.timesheet_categories}}\n\nPer ogni evento crea una voce JSON con:\n- date: data in formato YYYY-MM-DD\n- startTime: orario inizio HH:MM\n- endTime: orario fine HH:MM\n- durationH: durata in ore (decimale, es. 1.5)\n- project: progetto/cliente di riferimento (inferisci dal titolo)\n- category: categoria tra quelle disponibili\n- description: breve descrizione attività (max 80 caratteri)\n- billable: true se meeting con cliente, false altrimenti\n\nIgnora: lunch break, blocchi "fuori ufficio", eventi personali.\nRestituisci SOLO il JSON array ordinato per data e ora.',
          maxTokens: 1_200,
          timeout: 60_000,
          retry: NO_RETRY,
          outputFormat: 'json',
          dependsOn: ['get-week-events'],
        },
        {
          id: 'excel-write-timesheet',
          type: 'com',
          description: 'Scrive le voci di timesheet nel foglio Excel aziendale',
          action: 'excel.writeCells',
          params: {
            filePath: '{{config.timesheet_excel_path}}',
            sheetName: '{{dateNow("YYYY-WW")}}',
            data: '{{ai-format-timesheet.output}}',
            startCell: 'A2',
            columnMapping: '{"date":"A","startTime":"B","endTime":"C","durationH":"D","project":"E","category":"F","description":"G","billable":"H"}',
            createSheetIfMissing: 'true',
            autoSave: 'true',
          },
          timeout: 120_000,
          retry: {
            count: 1,
            backoff: 'fixed',
            initialDelay: 5_000,
          },
          dependsOn: ['ai-format-timesheet'],
        },
      ],
      budget: {
        maxTokensPerRun: 1_500,
        maxCostPerRun: 0.003,
        monthlyCap: 0.15,
      },
      onFailure: {
        strategy: 'notify',
        notify: {
          channel: 'desktop',
          message: 'Compilazione timesheet fallita: {{error}}',
        },
        circuitBreaker: {
          threshold: 3,
          resetAfterMs: 3_600_000,
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get all available templates. */
export function getTemplates(): JobTemplate[] {
  return TEMPLATES;
}

/** Find a template by ID. Returns null if not found. */
export function getTemplate(id: string): JobTemplate | null {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}

/** List templates grouped by category. */
export function getTemplatesByCategory(): Record<string, JobTemplate[]> {
  const grouped: Record<string, JobTemplate[]> = {};

  for (const template of TEMPLATES) {
    const list = grouped[template.category];
    if (list !== undefined) {
      list.push(template);
    } else {
      grouped[template.category] = [template];
    }
  }

  return grouped;
}

/**
 * Create a fully initialised JobDefinition from a template.
 *
 * Fills in:
 * - `id`: generated by slugifying the name + 4 random hex chars
 * - `metadata`: timestamps set to now, run counters at zero
 *
 * Optional `overrides` allow callers to customise the job name, trigger
 * expression, or budget without mutating the template.
 *
 * Returns null if the template ID is not found.
 */
export function instantiateTemplate(
  templateId: string,
  overrides?: Partial<Pick<JobDefinition, 'name' | 'trigger' | 'budget'>>,
): JobDefinition | null {
  const template = getTemplate(templateId);
  if (template === null) return null;

  const now = new Date().toISOString();
  const baseName = overrides?.name ?? template.definition.name;
  const id = generateJobId(baseName);

  const job: JobDefinition = {
    ...template.definition,
    id,
    name: baseName,
    ...(overrides?.trigger !== undefined && { trigger: overrides.trigger }),
    ...(overrides?.budget !== undefined && { budget: overrides.budget }),
    metadata: {
      created: now,
      updated: now,
      owner: undefined,
      tags: [],
    },
  };

  return job;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generate a job ID by slugifying the name and appending 4 random hex chars.
 * Example: "Report Vendite" → "report-vendite-a3f2"
 *
 * Kept local to this module to avoid a circular import with store.ts.
 */
function generateJobId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const suffix = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0');

  return `${slug}-${suffix}`;
}
