import type { Locale } from '../config';
import type { IconProblemCard, LocaleContent, ServiceFeature, ServicePlan } from './types';

export interface DigitalStarterContent {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: { title: string; subtitle: string };
  problem: { heading: string; intro: string; cards: IconProblemCard[] };
  solution: { heading: string; text: string };
  features: { heading: string; items: ServiceFeature[] };
  plans: ServicePlan[];
  pdfGuidePath: string;
}

const content: LocaleContent<DigitalStarterContent> = {
  it: {
    meta: {
      title: 'Digital Starter',
      description:
        'Il tuo primo passo nel digitale, senza fuffa. Sito, e-commerce, CRM, cloud: un percorso guidato per PMI e startup che vogliono partire bene.',
    },
    breadcrumb: 'Digital Starter',
    hero: {
      title: 'Il tuo primo passo. Senza fuffa.',
      subtitle:
        'Troppi strumenti, troppe opzioni, troppi consulenti che vendono complessità. Ti aiuto a partire dal punto giusto, con gli strumenti giusti, senza spendere più del necessario.',
    },
    problem: {
      heading: 'Il problema',
      intro:
        "Hai un'azienda che funziona, ma il digitale è ancora un cantiere aperto. Un sito da aggiornare, un CRM da scegliere, un e-commerce da aprire — ma ogni volta che ci provi ti perdi tra le opzioni, i preventivi gonfiati e i consulenti che parlano tech invece di risultati.",
      cards: [
        { icon: '😵', title: 'Paralisi da scelta', text: 'Troppi tool, troppe promesse. Non sai da dove iniziare e ogni ricerca produce solo più confusione.' },
        { icon: '💸', title: 'Budget bruciato male', text: 'Hai pagato siti che non convertono, software che non usi, abbonamenti dimenticati.' },
        { icon: '⏳', title: 'Tempo perso', text: 'Ogni processo manuale rubato dalla crescita: fatture a mano, email ripetitive, dati sparsi.' },
      ],
    },
    solution: {
      heading: 'La soluzione',
      text: 'Un percorso in tre fasi: capiamo dove sei, decidiamo cosa vale davvero la pena fare, e lo facciamo. Nessuna proposta generica, nessun pacchetto standard. Solo il passo successivo giusto per la tua situazione — con tool semplici, budget controllato e risultati misurabili da subito.',
    },
    features: {
      heading: 'Cosa realizziamo insieme',
      items: [
        { title: 'First Website', description: 'Il tuo primo sito professionale. Veloce, mobile-first, ottimizzato SEO. Online in settimane, non mesi.', icon: '🌐' },
        { title: 'E-commerce Base', description: 'Vendere online senza complessità inutile. Catalogo, carrello, pagamenti. Setup completo e pronto a crescere.', icon: '🛒' },
        { title: 'CRM Setup', description: 'Gestione clienti e contatti da zero. Uno strumento che usi davvero, non uno che accumula polvere.', icon: '📋' },
        { title: 'Cloud Migration', description: 'Dalla cartella condivisa al cloud. Email, documenti, collaborazione — tutto in un posto solo, accessibile ovunque.', icon: '☁️' },
        { title: 'Email & Workflow', description: 'Automazioni semplici che risparmiano ore ogni settimana. Preventivi, follow-up, notifiche — senza toccarle manualmente.', icon: '📧' },
        { title: 'Digital Literacy', description: 'Non solo tool: capire cosa stai usando e perché. Formazione pratica per il tuo team su misura.', icon: '📚' },
      ],
    },
    plans: [
      {
        name: 'Quick Start',
        price: 'Su misura',
        description: 'Assessment iniziale',
        features: ['Audit digitale completo', 'Identificazione priorità immediate', 'Roadmap personalizzata', 'Report con quick wins', 'Sessione strategica (2 ore)'],
        cta: 'Richiedi preventivo',
        highlighted: false,
      },
      {
        name: 'Pacchetto Base',
        price: 'Su misura',
        description: 'Primo progetto digitale completo',
        features: ['Assessment incluso', 'Un progetto prioritario realizzato', 'Setup sito / e-commerce / CRM', 'Formazione team (4 ore)', 'Documentazione operativa', '30 giorni supporto post-lancio'],
        cta: 'Parliamone',
        highlighted: true,
      },
      {
        name: 'Accompagnamento',
        price: 'Su misura',
        description: 'Evoluzione continua',
        features: ['Check-in mensile (1 ora)', 'Supporto su nuovi tool e processi', 'Piccole implementazioni incluse', 'Canale dedicato per domande rapide', 'Aggiornamento roadmap trimestrale'],
        cta: 'Richiedi preventivo',
        highlighted: false,
      },
    ],
    pdfGuidePath: '/risorse/guida-digital-starter',
  },
  en: {
    meta: {
      title: 'Digital Starter',
      description:
        'Your first step into digital, without the fluff. Website, e-commerce, CRM, cloud: a guided path for SMEs and startups that want to start right.',
    },
    breadcrumb: 'Digital Starter',
    hero: {
      title: 'Your first step. No fluff.',
      subtitle:
        'Too many tools, too many options, too many consultants selling complexity. I help you start from the right point, with the right tools, without spending more than necessary.',
    },
    problem: {
      heading: 'The problem',
      intro:
        'Your business works, but digital is still a work in progress. A website to update, a CRM to choose, e-commerce to launch — but every time you try, you get lost among options, inflated quotes, and consultants who speak tech instead of results.',
      cards: [
        { icon: '😵', title: 'Choice paralysis', text: 'Too many tools, too many promises. You do not know where to start and every search adds more confusion.' },
        { icon: '💸', title: 'Budget wasted badly', text: 'You paid for websites that do not convert, software you do not use, forgotten subscriptions.' },
        { icon: '⏳', title: 'Lost time', text: 'Every manual process stolen from growth: invoices by hand, repetitive emails, scattered data.' },
      ],
    },
    solution: {
      heading: 'The solution',
      text: 'A three-phase path: understand where you are, decide what is truly worth doing, and do it. No generic proposal, no standard package. Only the right next step for your situation — with simple tools, controlled budget, and measurable results from day one.',
    },
    features: {
      heading: 'What we build together',
      items: [
        { title: 'First Website', description: 'Your first professional website. Fast, mobile-first, SEO optimised. Online in weeks, not months.', icon: '🌐' },
        { title: 'Basic E-commerce', description: 'Sell online without unnecessary complexity. Catalogue, cart, payments. Complete setup ready to grow.', icon: '🛒' },
        { title: 'CRM Setup', description: 'Customer and contact management from scratch. A tool you actually use, not one that gathers dust.', icon: '📋' },
        { title: 'Cloud Migration', description: 'From shared folders to the cloud. Email, documents, collaboration — all in one place, accessible anywhere.', icon: '☁️' },
        { title: 'Email & Workflow', description: 'Simple automations that save hours every week. Quotes, follow-ups, notifications — without manual work.', icon: '📧' },
        { title: 'Digital Literacy', description: 'Not just tools: understand what you use and why. Practical training tailored to your team.', icon: '📚' },
      ],
    },
    plans: [
      {
        name: 'Quick Start',
        price: 'Custom',
        description: 'Initial assessment',
        features: ['Complete digital audit', 'Immediate priority identification', 'Personalised roadmap', 'Quick wins report', 'Strategy session (2 hours)'],
        cta: 'Request a quote',
        highlighted: false,
      },
      {
        name: 'Base Package',
        price: 'Custom',
        description: 'Complete first digital project',
        features: ['Assessment included', 'One priority project delivered', 'Website / e-commerce / CRM setup', 'Team training (4 hours)', 'Operational documentation', '30 days post-launch support'],
        cta: "Let's talk",
        highlighted: true,
      },
      {
        name: 'Ongoing Support',
        price: 'Custom',
        description: 'Continuous evolution',
        features: ['Monthly check-in (1 hour)', 'Support on new tools and processes', 'Small implementations included', 'Dedicated channel for quick questions', 'Quarterly roadmap update'],
        cta: 'Request a quote',
        highlighted: false,
      },
    ],
    pdfGuidePath: '/risorse/guida-digital-starter',
  },
};

export function getDigitalStarterContent(locale: Locale): DigitalStarterContent {
  return content[locale];
}
