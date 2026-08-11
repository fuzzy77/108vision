import type { Locale } from '../config';
import type {
  HowItWorksStep,
  LocaleContent,
  ServiceFeature,
  ServicePlan,
  TextCard,
} from './types';

export interface SoftwareInManoContent {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: { title: string; subtitle: string };
  problem: { heading: string; intro: string; cards: TextCard[] };
  cost: { heading: string; text: string };
  method: { heading: string; intro: string; items: ServiceFeature[] };
  deliverables: { heading: string; intro: string; items: ServiceFeature[] };
  proof: { heading: string; text: string; cta: string; href: string };
  fit: {
    heading: string;
    ideal: { title: string; items: string[] };
    notIdeal: { title: string; items: string[] };
  };
  process: { heading: string; steps: HowItWorksStep[] };
  plans: ServicePlan[];
  pdf: { title: string; description: string; cta: string };
  partnerPdf: { title: string; description: string; cta: string };
}

const content: LocaleContent<SoftwareInManoContent> = {
  it: {
    meta: {
      title: 'Software in Mano',
      description:
        'Progettiamo, costruiamo e facciamo evolvere il tuo software. Discovery, progetto fisso o retainer — un interlocutore unico che resta dopo la consegna.',
    },
    breadcrumb: 'Software in Mano',
    hero: {
      title: 'Il software non deve diventare un altro problema da gestire.',
      subtitle:
        'Progettiamo, costruiamo e facciamo evolvere il software che serve al tuo business. Un interlocutore dal requisito al go-live, con codice tuo e responsabilità che continuano dopo la consegna.',
    },
    problem: {
      heading: 'Situazioni che riconosci',
      intro:
        'Il problema non è trovare qualcuno che scriva codice. È evitare di costruire la cosa sbagliata, o di restare soli quando entra in produzione.',
      cards: [
        {
          title: 'Il processo vive tra fogli e passaggi manuali',
          text: 'Le persone ricopiano dati, rincorrono email o usano strumenti che non comunicano tra loro.',
        },
        {
          title: 'Il software esiste, ma nessuno lo possiede',
          text: 'Il fornitore è sparito, il codice è fragile o ogni modifica apre una trattativa senza visibilità.',
        },
        {
          title: 'Hai un’idea, ma non un perimetro affidabile',
          text: 'Requisiti, integrazioni e priorità non sono abbastanza chiari per promettere prezzo e risultato senza inventare.',
        },
      ],
    },
    cost: {
      heading: 'Il costo del software lasciato a metà',
      text: 'Il lavoro manuale continua, le eccezioni aumentano e la dipendenza dal fornitore cresce. Partire dal codice senza chiarire processo, dati e integrazioni anticipa la spesa ma non riduce il rischio.',
    },
    method: {
      heading: 'Dal problema al software che resta governabile',
      intro:
        'Discovery prima delle promesse, delivery con quality gate, gestione dopo il go-live. Ogni fase produce un risultato verificabile e può fermarsi senza lock-in.',
      items: [
        {
          title: 'Discover',
          description:
            'Mappiamo processo, utenti, dati, integrazioni, rischi e criteri di accettazione. Solo dopo definiamo architettura, perimetro e investimento.',
          icon: '🔍',
        },
        {
          title: 'Build',
          description:
            'Costruiamo per milestone visibili, con review, test e pipeline automatizzate. Le variazioni di scope diventano decisioni esplicite.',
          icon: '🛠️',
        },
        {
          title: 'Run & evolve',
          description:
            'Monitoriamo ciò che conta, gestiamo correzioni ed evoluzione e rivediamo le priorità con ore e responsabilità concordate.',
          icon: '🤝',
        },
      ],
    },
    deliverables: {
      heading: 'Cosa consegniamo, oltre alle feature',
      intro:
        'Il software deve poter essere rilasciato, osservato e trasferito. La qualità è parte del deliverable, non un extra finale.',
      items: [
        {
          title: 'Codice e accessi di proprietà del cliente',
          description:
            'Repository, documentazione e credenziali restano sotto il tuo controllo. Stack standard e handoff esplicito riducono il lock-in.',
          icon: '🔑',
        },
        {
          title: 'Test e CI/CD',
          description:
            'Test sui comportamenti critici e pipeline automatizzate per build, controlli e deploy ripetibili.',
          icon: '✅',
        },
        {
          title: 'Osservabilità operativa',
          description:
            'Log, health check e segnali utili a capire errori, latenza e saturazione prima di lavorare alla cieca.',
          icon: '📡',
        },
        {
          title: 'Integrazioni governate',
          description:
            'ERP, CRM, email e sistemi esterni isolati dietro confini chiari, con timeout, gestione errori e tracciabilità.',
          icon: '🔌',
        },
        {
          title: 'AI solo con ROI misurabile',
          description:
            'L’AI entra se Discovery definisce metrica, baseline, rischio, revisione umana e risultato osservabile entro 90 giorni. Altrimenti non entra.',
          icon: '✨',
        },
      ],
    },
    proof: {
      heading: 'La prova è un prodotto che continua a vivere',
      text: 'WellBeing è un prodotto digitale che abbiamo costruito e continuiamo a gestire: requisiti, privacy, rilasci ed evoluzione. Mostra come teniamo in mano il software dopo il lancio; non è un terzo canale commerciale.',
      cta: 'Scopri WellBeing',
      href: '/wellbeing',
    },
    fit: {
      heading: 'Fit e no-fit',
      ideal: {
        title: 'Ha senso se',
        items: [
          'Devi digitalizzare un processo concreto o adottare software esistente.',
          'Puoi coinvolgere chi conosce il processo e decide le priorità.',
          'Vuoi possedere codice, accessi e conoscenza, non dipendere dal fornitore.',
        ],
      },
      notIdeal: {
        title: 'Non ha senso se',
        items: [
          'Cerchi sviluppatori a consumo senza responsabilità sul risultato.',
          'Vuoi un preventivo fisso prima di chiarire requisiti e rischi.',
          'L’obiettivo è “mettere l’AI” senza baseline o metrica di business.',
        ],
      },
    },
    process: {
      heading: 'Si entra con una Discovery pagata',
      steps: [
        {
          title: 'Call di inquadramento',
          text: 'Verifichiamo problema, decision maker, utenti, vincoli e accesso alle persone che conoscono il processo. Se non c’è fit, ci fermiamo.',
        },
        {
          title: 'Discovery',
          text: 'Consegniamo requisiti e criteri di accettazione, architettura proposta, integrazioni, rischi, perimetro incluso/escluso e stima motivata.',
        },
        {
          title: 'Go / no-go sul build',
          text: 'La Discovery resta tua e puoi usarla con chiunque. Se proseguiamo, scegliamo progetto a milestone o retainer evolutivo con ore chiare.',
        },
      ],
    },
    plans: [
      {
        name: 'Discovery',
        price: 'Entry',
        description: 'Scope, architettura, stima — senza impegno sul build.',
        features: [
          'Requisiti e criteri di accettazione',
          'Architettura e integrazioni',
          'Scope incluso / escluso',
          'Stima motivata e rischi',
          'Decisioni go / no-go documentate',
        ],
        cta: 'Prenota una Discovery',
        highlighted: false,
      },
      {
        name: 'Build & evolve',
        price: 'Progetto / Retainer',
        description: 'Costruiamo e teniamo il software nel tempo.',
        features: [
          'Codice e accessi del cliente',
          'Test, CI/CD e osservabilità',
          'Integrazioni resilienti',
          'AI solo con ROI misurabile',
        ],
        cta: 'Parliamone',
        highlighted: true,
      },
    ],
    pdf: {
      title: 'Presentazione per PMI (PDF)',
      description:
        'Cinque pagine: diagnosi, costo dell’inazione, Discovery → progetto → evoluzione, deliverable e fit.',
      cta: 'Scarica presentazione Software in Mano',
    },
    partnerPdf: {
      title: 'Kit per agenzie di consulenza (PDF)',
      description:
        'Cinque pagine per qualificare il bisogno software: promessa e confini, modelli B/C, RACI, script e Discovery.',
      cta: 'Scarica kit partner Software in Mano',
    },
  },
  en: {
    meta: {
      title: 'Software in Hand',
      description:
        'We design, build and evolve your software. Discovery, fixed project or retainer — one counterpart who stays after delivery.',
    },
    breadcrumb: 'Software in Hand',
    hero: {
      title: 'Software should not become another problem to manage.',
      subtitle:
        'We design, build and evolve the software your business needs. One counterpart from requirement to go-live, with code you own and accountability that continues after delivery.',
    },
    problem: {
      heading: 'Situations you will recognise',
      intro:
        'The problem is not finding someone who can write code. It is avoiding the wrong build—or being left alone once it reaches production.',
      cards: [
        {
          title: 'The process lives in spreadsheets and handoffs',
          text: 'People re-enter data, chase emails or use tools that do not communicate.',
        },
        {
          title: 'The software exists, but nobody owns it',
          text: 'The vendor has gone, the code is fragile or every change starts a negotiation with no visibility.',
        },
        {
          title: 'You have an idea, not a reliable scope',
          text: 'Requirements, integrations and priorities are not clear enough to promise price and outcome without guessing.',
        },
      ],
    },
    cost: {
      heading: 'The cost of half-owned software',
      text: 'Manual work continues, exceptions grow and vendor dependency deepens. Starting with code before clarifying process, data and integrations brings spending forward without reducing risk.',
    },
    method: {
      heading: 'From the problem to software that stays governable',
      intro:
        'Discovery before promises, delivery with quality gates, stewardship after go-live. Every phase produces a verifiable outcome and can stop without lock-in.',
      items: [
        {
          title: 'Discover',
          description:
            'We map process, users, data, integrations, risks and acceptance criteria. Only then do we define architecture, scope and investment.',
          icon: '🔍',
        },
        {
          title: 'Build',
          description:
            'We build through visible milestones, with reviews, tests and automated pipelines. Scope changes become explicit decisions.',
          icon: '🛠️',
        },
        {
          title: 'Run & evolve',
          description:
            'We monitor what matters, manage fixes and evolution, and revisit priorities with agreed hours and accountability.',
          icon: '🤝',
        },
      ],
    },
    deliverables: {
      heading: 'What we deliver beyond features',
      intro:
        'Software must be releasable, observable and transferable. Quality is part of the deliverable, not a final add-on.',
      items: [
        {
          title: 'Client-owned code and access',
          description:
            'Repository, documentation and credentials remain under your control. Standard technology and explicit handoff reduce lock-in.',
          icon: '🔑',
        },
        {
          title: 'Tests and CI/CD',
          description:
            'Tests around critical behaviour and automated pipelines for repeatable builds, checks and deployments.',
          icon: '✅',
        },
        {
          title: 'Operational observability',
          description:
            'Logs, health checks and useful signals for understanding errors, latency and saturation before working blind.',
          icon: '📡',
        },
        {
          title: 'Governed integrations',
          description:
            'ERP, CRM, email and external systems isolated behind clear boundaries, with timeouts, error handling and traceability.',
          icon: '🔌',
        },
        {
          title: 'AI only with measurable ROI',
          description:
            'AI enters only when Discovery defines a metric, baseline, risk, human review and an observable 90-day outcome. Otherwise it does not.',
          icon: '✨',
        },
      ],
    },
    proof: {
      heading: 'The proof is a product that stays alive',
      text: 'WellBeing is a digital product we built and continue to operate: requirements, privacy, releases and evolution. It shows how we own software after launch; it is not a third commercial channel.',
      cta: 'Discover WellBeing',
      href: '/wellbeing',
    },
    fit: {
      heading: 'Fit and no-fit',
      ideal: {
        title: 'A good fit if',
        items: [
          'You need to digitise a concrete process or adopt existing software.',
          'You can involve the people who know the process and decide priorities.',
          'You want to own code, access and knowledge rather than depend on a vendor.',
        ],
      },
      notIdeal: {
        title: 'Not a fit if',
        items: [
          'You want developers on demand with no accountability for outcomes.',
          'You expect a fixed quote before requirements and risks are understood.',
          'The goal is to “add AI” without a baseline or business metric.',
        ],
      },
    },
    process: {
      heading: 'Start with a paid Discovery',
      steps: [
        {
          title: 'Framing call',
          text: 'We confirm the problem, decision maker, users, constraints and access to people who know the process. If there is no fit, we stop.',
        },
        {
          title: 'Discovery',
          text: 'You receive requirements and acceptance criteria, proposed architecture, integrations, risks, included/excluded scope and a reasoned estimate.',
        },
        {
          title: 'Build go / no-go',
          text: 'The Discovery is yours to use with anyone. If we continue, we choose a milestone project or an evolution retainer with clear hours.',
        },
      ],
    },
    plans: [
      {
        name: 'Discovery',
        price: 'Entry',
        description: 'Scope, architecture, estimate — no build commitment.',
        features: [
          'Requirements and acceptance criteria',
          'Architecture and integrations',
          'Included / excluded scope',
          'Reasoned estimate and risks',
          'Documented go / no-go',
        ],
        cta: 'Book a Discovery',
        highlighted: false,
      },
      {
        name: 'Build & evolve',
        price: 'Project / Retainer',
        description: 'We build and keep the software over time.',
        features: [
          'Client-owned code and access',
          'Tests, CI/CD and observability',
          'Resilient integrations',
          'AI only with measurable ROI',
        ],
        cta: "Let's talk",
        highlighted: true,
      },
    ],
    pdf: {
      title: 'SME presentation (PDF)',
      description:
        'Five pages: diagnosis, cost of inaction, Discovery → project → evolution, deliverables and fit.',
      cta: 'Download Software in Hand presentation',
    },
    partnerPdf: {
      title: 'Consulting firm partner kit (PDF)',
      description:
        'Five pages to qualify the software need: promise and boundaries, B/C models, essential RACI, sales script and Discovery.',
      cta: 'Download Software in Hand partner kit',
    },
  },
};

export function getSoftwareInManoContent(locale: Locale): SoftwareInManoContent {
  return content[locale];
}
