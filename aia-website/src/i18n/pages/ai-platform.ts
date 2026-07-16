import type { Locale } from '../config';
import type {
  ComparisonRow,
  FaqItem,
  IconCard,
  LocaleContent,
  ServiceFeature,
  ServicePlan,
  TextCard,
} from './types';

export interface AiPlatformContent {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: { title: string; subtitle: string };
  problem: { heading: string; intro: string; cards: TextCard[] };
  solution: { heading: string; intro: string; cards: IconCard[] };
  comparison: {
    heading: string;
    subheading: string;
    columns: [string, string, string, string];
    rows: ComparisonRow[];
  };
  features: { heading: string; subheading: string; items: ServiceFeature[] };
  plans: ServicePlan[];
  pdfGuidePath: string;
  faqs: FaqItem[];
}

const content: LocaleContent<AiPlatformContent> = {
  it: {
    meta: {
      title: 'AI Platform per PMI',
      description:
        'Piattaforma AI su misura per la tua azienda. Memoria persistente, Desktop Agent, governance integrata. Costa 5-10x meno di ChatGPT Teams.',
    },
    breadcrumb: 'AI Platform',
    hero: {
      title: "L'AI che ti conosce, ti aiuta e ricorda tutto",
      subtitle:
        'Non un chatbot generico. Una piattaforma AI con memoria persistente, un agente desktop che opera sul tuo PC, e una governance che ti protegge. Il tutto a un costo 5-10x inferiore rispetto a ChatGPT o Claude.',
    },
    problem: {
      heading: 'Il problema',
      intro:
        "Le PMI italiane sono tagliate fuori dalla rivoluzione AI. Gli strumenti enterprise costano troppo, quelli consumer sono troppo generici. Il risultato? Le aziende restano indietro mentre i competitor che adottano l'AI guadagnano efficienza ogni giorno.",
      cards: [
        {
          title: 'Costi proibitivi',
          text: 'Le soluzioni enterprise partono da 50K+/anno. Budget fuori portata per una PMI da 10-50 dipendenti.',
        },
        {
          title: 'Competenze mancanti',
          text: 'Servirebbero data scientist e ML engineer interni. Figure che costano 80K+/anno e sono introvabili.',
        },
        {
          title: 'Strumenti generici',
          text: 'ChatGPT non conosce i tuoi processi, clienti, prodotti. Ogni risposta va verificata manualmente.',
        },
      ],
    },
    solution: {
      heading: 'La soluzione: 108 AI',
      intro:
        'Una piattaforma AI che ti conosce davvero. Ricorda le tue preferenze, opera sul tuo PC, e costa una frazione di ChatGPT Teams. Non un prodotto generico: un sistema costruito per le PMI italiane.',
      cards: [
        {
          icon: '🧠',
          title: 'Ti ricorda tutto',
          text: 'Memoria persistente cross-device: preferenze, contesto, decisioni. Non ripeterai mai le stesse informazioni.',
        },
        {
          icon: '💻',
          title: 'Opera sul tuo PC',
          text: 'Desktop Agent: legge file, cerca contenuti, esegue comandi, automatizza task. Come avere un assistente instancabile.',
        },
        {
          icon: '💰',
          title: 'Costa 5-10x meno',
          text: "Routing intelligente su modelli economici ad alte prestazioni. Da 29 EUR/mese per l'intero team.",
        },
      ],
    },
    comparison: {
      heading: 'Perché 108 AI, non ChatGPT o Claude',
      subheading: 'Un confronto onesto con le alternative sul mercato.',
      columns: ['Feature', '108 AI', 'ChatGPT / Claude', 'Cursor / Claude Code'],
      rows: [
        {
          feature: 'Memoria persistente cross-device',
          ai108: '✓ Semantica (pgvector)',
          chatgpt: 'Solo stesso account',
          cursor: '✗ Solo file locali',
        },
        {
          feature: 'Desktop Agent (file, shell, GUI)',
          ai108: '✓ Con risk classification',
          chatgpt: '✗',
          cursor: 'Solo codice (dev)',
        },
        {
          feature: 'Knowledge Base aziendale',
          ai108: '✓ Hybrid RAG (vector + graph)',
          chatgpt: 'Upload base',
          cursor: '✗',
        },
        {
          feature: 'Governance AI (principi, guardrail)',
          ai108: '✓ 9 principi, UI integrata',
          chatgpt: '✗',
          cursor: '✗',
        },
        {
          feature: 'Funziona per non-developer',
          ai108: '✓ Target PMI',
          chatgpt: 'Parziale',
          cursor: '✗ Solo dev',
        },
        {
          feature: 'Costo mensile team',
          ai108: 'Da 29 EUR/mese',
          chatgpt: '20-30 USD/utente',
          cursor: '20-40 USD/utente',
        },
      ],
    },
    features: {
      heading: 'Tutto quello che include 108 AI',
      subheading: 'Ogni funzionalità è progettata per utenti non-tecnici. Zero configurazione richiesta.',
      items: [
        {
          title: 'Knowledge Base Intelligente',
          description:
            'I tuoi documenti diventano conoscenza navigabile: ricerca semantica + knowledge graph per risposte contestuali e ragionamento multi-hop.',
          icon: '📚',
        },
        {
          title: 'Memoria Persistente',
          description:
            "L'AI ricorda le tue preferenze, decisioni e contesto — su ogni dispositivo, in ogni sessione. Non ripeterai mai le stesse cose.",
          icon: '🧠',
        },
        {
          title: 'Desktop Agent',
          description:
            'Un assistente che opera sul tuo PC: legge file, esegue comandi, cerca nel codice, automatizza task ripetitivi. Come avere un junior instancabile.',
          icon: '💻',
        },
        {
          title: 'Governance AI Integrata',
          description:
            "9 principi di sicurezza baked-in: l'AI chiede conferma, marca l'incertezza, non decide al posto tuo. Nessun rischio di azioni incontrollate.",
          icon: '🛡️',
        },
        {
          title: 'Costi 5-10x Inferiori',
          description:
            'Routing intelligente su DeepSeek e Qwen: il 90% dei task usa modelli economici senza perdita di qualità. Da 29 EUR/mese, non 200+.',
          icon: '💰',
        },
        {
          title: 'Installazione Zero-Config',
          description:
            'Un eseguibile da scaricare, un login via browser, e sei operativo. Niente terminale, niente codice, niente configurazioni.',
          icon: '⚡',
        },
        {
          title: 'Agenti Specializzati',
          description:
            'Assistenti AI per customer service, vendite, HR, operations. Ognuno addestrato sul tuo dominio con istruzioni personalizzabili.',
          icon: '🤖',
        },
        {
          title: 'Privacy by Design',
          description:
            'I tuoi dati restano tuoi. Deployment su cloud privato europeo. Nessun dato condiviso con provider AI senza consenso esplicito.',
          icon: '🔒',
        },
        {
          title: 'Scalabilità Progressiva',
          description:
            "Parti con un agente, scala a tutta l'organizzazione. Costi proporzionali all'utilizzo reale, nessun lock-in.",
          icon: '📈',
        },
      ],
    },
    plans: [
      {
        name: 'Starter',
        price: 'Da 29 EUR/mese',
        description: "Per iniziare con l'AI",
        features: [
          'Chat AI con memoria persistente',
          'Knowledge base fino a 100 documenti',
          '1 agente specializzato',
          'Desktop Agent (lettura file)',
          'Governance AI integrata',
          'Supporto email',
        ],
        cta: 'Inizia ora',
        highlighted: false,
      },
      {
        name: 'Business',
        price: 'Da 99 EUR/mese',
        description: 'Per team e PMI',
        features: [
          'Tutto lo Starter incluso',
          'Knowledge base illimitata',
          'Fino a 5 agenti specializzati',
          'Desktop Agent completo (shell, grep, edit)',
          'Multi-utente (fino a 10)',
          'Modelli premium su richiesta',
          'Report utilizzo e ROI',
          'Supporto prioritario',
        ],
        cta: 'Parliamone',
        highlighted: true,
      },
      {
        name: 'Enterprise',
        price: 'Su misura',
        description: 'Setup dedicato + gestione',
        features: [
          'Tutto il Business incluso',
          'Setup knowledge base assistito',
          'Agenti illimitati',
          'Desktop Agent con automazione GUI',
          'Utenti illimitati',
          'Deployment privato (EU)',
          'SLA garantito',
          'Evoluzione continua della piattaforma',
        ],
        cta: 'Richiedi demo',
        highlighted: false,
      },
    ],
    pdfGuidePath: '/risorse/guida-ai-pmi',
    faqs: [
      {
        q: 'Quanto tempo serve per avere la piattaforma operativa?',
        a: 'Da 2 a 4 settimane per il setup iniziale. Il Desktop Agent è operativo in 5 minuti: scarica, accedi, inizia a lavorare.',
      },
      {
        q: 'I miei dati sono al sicuro?',
        a: "Assolutamente. Cloud privato europeo, nessun dato condiviso con provider AI terzi. La governance integrata impedisce all'AI di agire senza conferma su operazioni critiche.",
      },
      {
        q: 'Serve competenza tecnica interna?',
        a: 'No. La piattaforma funziona per utenti non-tech: interfaccia intuitiva, nessuna riga di codice richiesta. Il Desktop Agent si installa come qualsiasi altro programma.',
      },
      {
        q: 'In cosa è diverso da ChatGPT o Claude?',
        a: "Tre differenze cruciali: 1) memoria persistente (ti conosce davvero), 2) Desktop Agent (opera sul tuo PC, legge i tuoi file), 3) costa 5-10x meno grazie al routing intelligente su modelli economici.",
      },
      {
        q: 'Posso iniziare in piccolo e poi scalare?',
        a: "Esattamente il nostro approccio. Partiamo con un caso d'uso specifico, misuriamo i risultati, e poi estendiamo ad altri processi. Da 29 EUR/mese.",
      },
      {
        q: "L'AI può davvero operare sul mio PC?",
        a: 'Sì: il Desktop Agent può leggere file, cercare contenuti, eseguire comandi e automatizzare task. Ogni azione ha un livello di rischio — quelle critiche richiedono la tua conferma esplicita.',
      },
    ],
  },
  en: {
    meta: {
      title: 'AI Platform for SMEs',
      description:
        'Tailored AI platform for your business. Persistent memory, Desktop Agent, built-in governance. Costs 5-10x less than ChatGPT Teams.',
    },
    breadcrumb: 'AI Platform',
    hero: {
      title: 'AI that knows you, helps you, and remembers everything',
      subtitle:
        'Not a generic chatbot. An AI platform with persistent memory, a desktop agent that works on your PC, and governance that protects you — at 5-10x lower cost than ChatGPT or Claude.',
    },
    problem: {
      heading: 'The problem',
      intro:
        'Italian SMEs are being left behind by the AI revolution. Enterprise tools cost too much; consumer tools are too generic. Companies fall behind while competitors who adopt AI gain efficiency every day.',
      cards: [
        {
          title: 'Prohibitive costs',
          text: 'Enterprise solutions start at €50K+/year — out of reach for a 10-50 person SME.',
        },
        {
          title: 'Missing skills',
          text: 'You would need in-house data scientists and ML engineers — €80K+/year roles that are hard to hire.',
        },
        {
          title: 'Generic tools',
          text: 'ChatGPT does not know your processes, customers, or products. Every answer needs manual verification.',
        },
      ],
    },
    solution: {
      heading: 'The solution: 108 AI',
      intro:
        'An AI platform that truly knows you. It remembers your preferences, works on your PC, and costs a fraction of ChatGPT Teams. Not a generic product — a system built for Italian SMEs.',
      cards: [
        {
          icon: '🧠',
          title: 'Remembers everything',
          text: 'Cross-device persistent memory: preferences, context, decisions. You will never repeat the same information.',
        },
        {
          icon: '💻',
          title: 'Works on your PC',
          text: 'Desktop Agent: reads files, searches content, runs commands, automates tasks. Like having a tireless assistant.',
        },
        {
          icon: '💰',
          title: 'Costs 5-10x less',
          text: 'Smart routing to cost-efficient, high-performance models. From €29/month for the whole team.',
        },
      ],
    },
    comparison: {
      heading: 'Why 108 AI, not ChatGPT or Claude',
      subheading: 'An honest comparison with alternatives on the market.',
      columns: ['Feature', '108 AI', 'ChatGPT / Claude', 'Cursor / Claude Code'],
      rows: [
        {
          feature: 'Cross-device persistent memory',
          ai108: '✓ Semantic (pgvector)',
          chatgpt: 'Same account only',
          cursor: '✗ Local files only',
        },
        {
          feature: 'Desktop Agent (files, shell, GUI)',
          ai108: '✓ With risk classification',
          chatgpt: '✗',
          cursor: 'Code only (dev)',
        },
        {
          feature: 'Company knowledge base',
          ai108: '✓ Hybrid RAG (vector + graph)',
          chatgpt: 'Basic upload',
          cursor: '✗',
        },
        {
          feature: 'AI governance (principles, guardrails)',
          ai108: '✓ 9 principles, integrated UI',
          chatgpt: '✗',
          cursor: '✗',
        },
        {
          feature: 'Works for non-developers',
          ai108: '✓ SME-focused',
          chatgpt: 'Partial',
          cursor: '✗ Dev only',
        },
        {
          feature: 'Monthly team cost',
          ai108: 'From €29/month',
          chatgpt: '$20-30/user',
          cursor: '$20-40/user',
        },
      ],
    },
    features: {
      heading: 'Everything included in 108 AI',
      subheading: 'Every feature is designed for non-technical users. Zero configuration required.',
      items: [
        {
          title: 'Intelligent Knowledge Base',
          description:
            'Your documents become navigable knowledge: semantic search + knowledge graph for contextual answers and multi-hop reasoning.',
          icon: '📚',
        },
        {
          title: 'Persistent Memory',
          description:
            'AI remembers your preferences, decisions, and context — on every device, every session. Never repeat yourself.',
          icon: '🧠',
        },
        {
          title: 'Desktop Agent',
          description:
            'An assistant that works on your PC: reads files, runs commands, searches code, automates repetitive tasks.',
          icon: '💻',
        },
        {
          title: 'Built-in AI Governance',
          description:
            '9 security principles baked in: AI asks for confirmation, marks uncertainty, does not decide for you.',
          icon: '🛡️',
        },
        {
          title: '5-10x Lower Costs',
          description:
            'Smart routing via DeepSeek and Qwen: 90% of tasks use economical models without quality loss. From €29/month.',
          icon: '💰',
        },
        {
          title: 'Zero-Config Installation',
          description:
            'Download an executable, log in via browser, and you are ready. No terminal, no code, no configuration.',
          icon: '⚡',
        },
        {
          title: 'Specialised Agents',
          description:
            'AI assistants for customer service, sales, HR, operations — each trained on your domain with custom instructions.',
          icon: '🤖',
        },
        {
          title: 'Privacy by Design',
          description:
            'Your data stays yours. Private European cloud deployment. No data shared with AI providers without explicit consent.',
          icon: '🔒',
        },
        {
          title: 'Progressive Scalability',
          description:
            'Start with one agent, scale to the whole organisation. Costs proportional to actual usage, no lock-in.',
          icon: '📈',
        },
      ],
    },
    plans: [
      {
        name: 'Starter',
        price: 'From €29/month',
        description: 'To get started with AI',
        features: [
          'AI chat with persistent memory',
          'Knowledge base up to 100 documents',
          '1 specialised agent',
          'Desktop Agent (file reading)',
          'Built-in AI governance',
          'Email support',
        ],
        cta: 'Get started',
        highlighted: false,
      },
      {
        name: 'Business',
        price: 'From €99/month',
        description: 'For teams and SMEs',
        features: [
          'Everything in Starter',
          'Unlimited knowledge base',
          'Up to 5 specialised agents',
          'Full Desktop Agent (shell, grep, edit)',
          'Multi-user (up to 10)',
          'Premium models on request',
          'Usage and ROI reports',
          'Priority support',
        ],
        cta: "Let's talk",
        highlighted: true,
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        description: 'Dedicated setup + management',
        features: [
          'Everything in Business',
          'Assisted knowledge base setup',
          'Unlimited agents',
          'Desktop Agent with GUI automation',
          'Unlimited users',
          'Private deployment (EU)',
          'Guaranteed SLA',
          'Continuous platform evolution',
        ],
        cta: 'Request a demo',
        highlighted: false,
      },
    ],
    pdfGuidePath: '/risorse/guida-ai-pmi',
    faqs: [
      {
        q: 'How long until the platform is operational?',
        a: '2 to 4 weeks for initial setup. The Desktop Agent is ready in 5 minutes: download, sign in, start working.',
      },
      {
        q: 'Is my data safe?',
        a: 'Absolutely. Private European cloud, no data shared with third-party AI providers. Built-in governance prevents AI from acting without confirmation on critical operations.',
      },
      {
        q: 'Do we need in-house technical skills?',
        a: 'No. The platform works for non-technical users: intuitive interface, no code required. The Desktop Agent installs like any other application.',
      },
      {
        q: 'How is it different from ChatGPT or Claude?',
        a: 'Three crucial differences: 1) persistent memory (it truly knows you), 2) Desktop Agent (works on your PC, reads your files), 3) costs 5-10x less via smart model routing.',
      },
      {
        q: 'Can we start small and scale later?',
        a: 'Exactly our approach. We start with one use case, measure results, then extend to other processes. From €29/month.',
      },
      {
        q: 'Can AI really work on my PC?',
        a: 'Yes: the Desktop Agent can read files, search content, run commands, and automate tasks. Each action has a risk level — critical ones require your explicit confirmation.',
      },
    ],
  },
};

export function getAiPlatformContent(locale: Locale): AiPlatformContent {
  return content[locale];
}
