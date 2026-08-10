import type { Locale } from '../config';
import type { LocaleContent } from './types';

export type WellbeingLegalPage = 'privacy' | 'termini' | 'supporto';

export interface WellbeingLegalContent {
  meta: { title: string; description: string };
  brand: string;
  backLabel: string;
  pages: Record<
    WellbeingLegalPage,
    {
      heading: string;
      intro: string;
      body: string[];
      externalLabel: string;
      externalUrl: string;
      emailLabel?: string;
      email?: string;
    }
  >;
}

const content: LocaleContent<WellbeingLegalContent> = {
  it: {
    meta: {
      title: 'WellBeing — Legale e supporto',
      description: 'Privacy, termini e supporto per l’app WellBeing by 108 Vision.',
    },
    brand: 'WellBeing by 108 Vision',
    backLabel: 'Torna a WellBeing',
    pages: {
      privacy: {
        heading: 'Privacy',
        intro:
          'Trattiamo i dati personali in modo minimizzato e conforme al GDPR. Il testo completo della Privacy Policy è pubblicato sull’API ufficiale WellBeing.',
        body: [
          'L’app può elaborare account, preferenze di sessione e, se usi il Consigliere AI, i testi che invii per generare anteprima e audio.',
          'Non usiamo i contenuti delle sessioni per claim clinici. I contenuti supportano il benessere quotidiano e non sostituiscono un parere medico.',
          'Per esercitare i tuoi diritti (accesso, rettifica, cancellazione, limitazione) contatta il supporto indicato sotto.',
        ],
        externalLabel: 'Apri Privacy Policy completa',
        externalUrl: 'https://wellbeing-api-108.azurewebsites.net/legal/privacy.it.html',
        emailLabel: 'Supporto',
        email: '108@postecert.it',
      },
      termini: {
        heading: 'Termini di servizio',
        intro:
          'L’uso di WellBeing è regolato dai Termini pubblicati sull’API ufficiale. Qui trovi una sintesi utile per orientarti.',
        body: [
          'Alcune funzioni (accesso Consigliere AI e crediti) richiedono acquisto in-app o abbonamento tramite Google Play o App Store.',
          'I crediti non scadono. I prezzi effettivi sono quelli mostrati dallo store al momento dell’acquisto.',
          'I contenuti dell’app non costituiscono diagnosi, terapia o consiglio medico.',
        ],
        externalLabel: 'Apri Termini completi',
        externalUrl: 'https://wellbeing-api-108.azurewebsites.net/legal/terms.it.html',
      },
      supporto: {
        heading: 'Supporto',
        intro:
          'Hai bisogno di aiuto con installazione, acquisti, ripristino o il Consigliere AI? Scrivici.',
        body: [
          'Indica piattaforma (Android / iOS), versione dell’app se disponibile, e una descrizione breve del problema.',
          'Per ripristinare gli acquisti: usa la funzione di restore nello store dall’app, con lo stesso account store usato per l’acquisto.',
          'Non condividere password, receipt grezzi o dati sanitari sensibili via email.',
        ],
        externalLabel: 'Landing store ufficiale',
        externalUrl: 'https://wellbeing-api-108.azurewebsites.net/store/',
        emailLabel: 'Email di supporto',
        email: '108@postecert.it',
      },
    },
  },
  en: {
    meta: {
      title: 'WellBeing — Legal & support',
      description: 'Privacy, terms and support for the WellBeing app by 108 Vision.',
    },
    brand: 'WellBeing by 108 Vision',
    backLabel: 'Back to WellBeing',
    pages: {
      privacy: {
        heading: 'Privacy',
        intro:
          'We process personal data in a minimized, GDPR-aligned way. The full Privacy Policy is published on the official WellBeing API.',
        body: [
          'The app may process account data, session preferences and, if you use the AI Counselor, the text you send to generate preview and audio.',
          'We do not use session content for clinical claims. Content supports everyday wellbeing and does not replace medical advice.',
          'To exercise your rights (access, rectification, erasure, restriction), contact support below.',
        ],
        externalLabel: 'Open full Privacy Policy',
        externalUrl: 'https://wellbeing-api-108.azurewebsites.net/legal/privacy.en.html',
        emailLabel: 'Support',
        email: '108@postecert.it',
      },
      termini: {
        heading: 'Terms of service',
        intro:
          'Use of WellBeing is governed by the Terms published on the official API. Here is a short orientation summary.',
        body: [
          'Some features (AI Counselor access and credits) require an in-app purchase or subscription via Google Play or the App Store.',
          'Credits do not expire. Actual prices are those shown by the store at purchase time.',
          'App content is not diagnosis, therapy or medical advice.',
        ],
        externalLabel: 'Open full Terms',
        externalUrl: 'https://wellbeing-api-108.azurewebsites.net/legal/terms.en.html',
      },
      supporto: {
        heading: 'Support',
        intro:
          'Need help with install, purchases, restore or the AI Counselor? Write to us.',
        body: [
          'Include platform (Android / iOS), app version if available, and a short description of the issue.',
          'To restore purchases: use the in-app store restore flow with the same store account used for the purchase.',
          'Do not share passwords, raw receipts or sensitive health data by email.',
        ],
        externalLabel: 'Official store landing',
        externalUrl: 'https://wellbeing-api-108.azurewebsites.net/store/',
        emailLabel: 'Support email',
        email: '108@postecert.it',
      },
    },
  },
};

export function getWellbeingLegalContent(locale: Locale): WellbeingLegalContent {
  return content[locale];
}
