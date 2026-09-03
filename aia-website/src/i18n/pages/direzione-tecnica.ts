import type { Locale } from '../config';
import type {
  HowItWorksStep,
  LocaleContent,
  ServiceFeature,
  ServicePlan,
  TextCard,
} from './types';

export interface DirezioneTecnicaContent {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: { title: string; subtitle: string };
  problem: { heading: string; intro: string; cards: TextCard[] };
  cost: { heading: string; text: string };
  modes: { heading: string; intro: string; items: ServiceFeature[] };
  deliverables: { heading: string; intro: string; items: ServiceFeature[] };
  evidence: { heading: string; text: string; items: string[] };
  capacity: { heading: string; text: string };
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

const content: LocaleContent<DirezioneTecnicaContent> = {
  it: {
    meta: {
      title: 'Direzione Tecnica',
      description:
        'Partner tecnico per PMI con team interno: roadmap, architettura, code review time-boxed, team building. Ownership su decisioni e deliverable, ore chiare.',
    },
    breadcrumb: 'Direzione Tecnica',
    hero: {
      title: 'Il team c’è. La direzione tecnica no.',
      subtitle:
        'Quando roadmap, architettura e qualità dipendono dall’urgenza, prendiamo ownership delle decisioni e dei deliverable. Il team continua a costruire; noi rendiamo chiara la direzione.',
    },
    problem: {
      heading: 'Segnali di un vuoto di direzione',
      intro:
        'Non serve un’altra persona che chiuda ticket. Serve qualcuno che colleghi le scelte tecniche agli obiettivi del business.',
      cards: [
        {
          title: 'Decisioni per inerzia',
          text: 'Stack, priorità e refactoring vengono decisi dall’ultima urgenza. Nessuno documenta trade-off e conseguenze.',
        },
        {
          title: 'Rilasci che fanno paura',
          text: 'Pipeline fragili, test poco affidabili e conoscenza concentrata rendono ogni cambiamento più lento del precedente.',
        },
        {
          title: 'Founder o senior come collo di bottiglia',
          text: 'Ogni scelta torna alla stessa persona; assunzioni, onboarding e crescita del team restano senza struttura.',
        },
      ],
    },
    cost: {
      heading: 'Il costo di non decidere',
      text: 'Il debito tecnico continua a maturare, le priorità business perdono prevedibilità e il rischio resta invisibile fino al prossimo incidente o alla prossima persona che lascia. Aggiungere sviluppatori senza una direzione condivisa aumenta il coordinamento, non necessariamente la capacità.',
    },
    modes: {
      heading: 'Il metodo si adatta al contesto, non il rigore',
      intro:
        'Partiamo da evidenze, rendiamo esplicite le decisioni e trasferiamo capacità al referente interno. Il coinvolgimento cambia; ownership e tracciabilità restano.',
      items: [
        {
          title: 'Strategico',
          description:
            'Roadmap, architettura, governance e allineamento con il business quando il team sa eseguire ma manca una direzione condivisa.',
          icon: '🗺️',
        },
        {
          title: 'Operativo time-boxed',
          description:
            'Review architetturali, pairing e rituali in slot fissi. Entriamo nei momenti decisivi senza sostituire il team o diventare un embed full-time.',
          icon: '⚙️',
        },
        {
          title: 'Team building',
          description:
            'Selezione, onboarding, struttura ruoli, crescita persone. Quando il problema è il team prima del codice.',
          icon: '👥',
        },
      ],
    },
    deliverables: {
      heading: 'Cosa resta in mano al team e al management',
      intro:
        'Non principi astratti: artefatti aggiornabili che rendono visibili stato, decisioni e progresso.',
      items: [
        {
          title: 'State of the Stack',
          description:
            'Fotografia leggibile di architettura, delivery, rischi, team e dipendenze, collegata all’impatto sul business.',
          icon: '📍',
        },
        {
          title: 'ADR',
          description:
            'Architecture Decision Record per le scelte strutturali: contesto, alternative, trade-off, decisione e conseguenze.',
          icon: '📝',
        },
        {
          title: 'Fitness function',
          description:
            'Controlli misurabili sulle proprietà importanti del sistema, così i principi architetturali restano verificabili nel tempo.',
          icon: '📐',
        },
        {
          title: 'Roadmap tecnica a 90 giorni',
          description:
            'Priorità ordinate per rischio e valore, con owner, dipendenze e criteri di successo. Il team sa cosa affrontare prima e perché.',
          icon: '🗓️',
        },
      ],
    },
    evidence: {
      heading: 'Evidenza prima delle opinioni',
      text: 'Il metodo nasce da esperienza diretta su sistemi enterprise mission-critical, dove rilascio, compliance e continuità operativa non possono dipendere da intuizioni. Nel tuo contesto, però, ogni conclusione deve essere dimostrata sui tuoi artefatti.',
      items: [
        'Repository e aree di codice campione',
        'Pipeline, test e processo di rilascio',
        'Log, incidenti e segnali operativi disponibili',
        'Interviste a management e team tecnico',
      ],
    },
    capacity: {
      heading: 'Ownership con un confine esplicito',
      text: 'Ownership = responsabilità su decisioni e deliverable concordati, non presenza quotidiana 8 ore. Lavoriamo con ore/mese scritte in contratto — così restiamo affidabili. Se ti serve un embed full-time, ti aiutiamo a strutturare l’assunzione.',
    },
    fit: {
      heading: 'Fit e no-fit',
      ideal: {
        title: 'Ha senso se',
        items: [
          'Hai un prodotto in uso e un team interno che può implementare.',
          'Mancano priorità, governance o un riferimento tecnico autorevole.',
          'Accetti decisioni basate su evidenze, anche quando sfidano lo status quo.',
        ],
      },
      notIdeal: {
        title: 'Non è Direzione Tecnica se',
        items: [
          'Non hai un team che possa eseguire: serve Software in Mano.',
          'Cerchi uno sviluppatore aggiuntivo o un project manager operativo.',
          'Ti serve un CTO full-time, on-call o presente ogni giorno.',
        ],
      },
    },
    process: {
      heading: 'Il primo incontro è gratuito — e ti lascia già indicazioni utili',
      steps: [
        {
          title: 'Incontro iniziale gratuito',
          text: 'Capiamo se c’è un problema di direzione tecnica e, in ogni caso, ti lasciamo un valore concreto: uno studio iniziale di qualche ora con punti di miglioramento specifici già pronti.',
        },
        {
          title: 'Tech Assessment',
          text: 'Analizziamo stack, delivery, rischi e team. Consegniamo State of the Stack, decisioni aperte, fitness function proposte e roadmap a 90 giorni.',
        },
        {
          title: 'Decisione sul seguito',
          text: 'Il documento resta tuo. Se proseguiamo, definiamo modalità, deliverable mensili e ore in contratto; altrimenti hai comunque una base utilizzabile.',
        },
      ],
    },
    plans: [
      {
        name: 'Tech Assessment',
        price: 'Entry',
        description: 'Diagnosi e piano 90 giorni — base per decidere.',
        features: [
          'State of the Stack',
          'ADR e decisioni aperte',
          'Fitness function prioritarie',
          'Roadmap tecnica a 90 giorni',
          'Raccomandazione go / no-go',
        ],
        cta: 'Prenota un Tech Assessment',
        highlighted: false,
      },
      {
        name: 'Direzione mensile',
        price: 'Retainer',
        description: 'Slot settimanali chiari, accountability sul mese.',
        features: [
          'Una delle tre modalità (o mix)',
          'Ore/mese in contratto',
          'Decisioni e deliverable tracciati',
          'AI valutata solo dove ha ROI',
        ],
        cta: 'Parliamone',
        highlighted: true,
      },
    ],
    pdf: {
      title: 'La presentazione che vende la direzione tecnica',
      description:
        'Cinque pagine pronte da inoltrare: quanto costa lo status quo, come portiamo ordine (metodo e deliverable) e come partire con un Tech Assessment.',
      cta: 'Scarica subito la presentazione Direzione Tecnica',
    },
    partnerPdf: {
      title: 'Il kit per qualificare l’opportunità',
      description:
        'Cinque pagine per agenzie: promessa e confini, modelli B/C, RACI, script commerciale e Tech Assessment. Pronto per la prossima call.',
      cta: 'Scarica subito il kit partner Direzione Tecnica',
    },
  },
  en: {
    meta: {
      title: 'Technical Direction',
      description:
        'Technical partner for SMEs with an in-house team: roadmap, architecture, time-boxed code review, team building. Ownership of decisions and deliverables, clear hours.',
    },
    breadcrumb: 'Technical Direction',
    hero: {
      title: 'The team exists. Technical direction does not.',
      subtitle:
        'When roadmap, architecture and quality are driven by urgency, we take ownership of decisions and deliverables. Your team keeps building; we make the direction clear.',
    },
    problem: {
      heading: 'Signs of a direction gap',
      intro:
        'You do not need another person closing tickets. You need someone connecting technical choices to business goals.',
      cards: [
        {
          title: 'Decisions by inertia',
          text: 'Stack, priorities and refactoring follow the latest urgency. Nobody documents trade-offs and consequences.',
        },
        {
          title: 'Releases create fear',
          text: 'Fragile pipelines, low-confidence tests and concentrated knowledge make each change slower than the last.',
        },
        {
          title: 'Founder or senior as bottleneck',
          text: 'Every choice returns to the same person; hiring, onboarding and team growth remain unstructured.',
        },
      ],
    },
    cost: {
      heading: 'The cost of not deciding',
      text: 'Technical debt keeps compounding, business priorities lose predictability and risk remains hidden until the next incident or departure. Adding developers without shared direction increases coordination, not necessarily capacity.',
    },
    modes: {
      heading: 'The method adapts to context; the rigour does not',
      intro:
        'We start from evidence, make decisions explicit and transfer capability to your internal lead. The level of involvement changes; ownership and traceability remain.',
      items: [
        {
          title: 'Strategic',
          description:
            'Roadmap, architecture, governance and business alignment when the team can execute but lacks shared direction.',
          icon: '🗺️',
        },
        {
          title: 'Time-boxed operational',
          description:
            'Architecture reviews, pairing and delivery rituals in fixed slots. We enter decisive moments without replacing the team or becoming a full-time embed.',
          icon: '⚙️',
        },
        {
          title: 'Team building',
          description:
            'Hiring, onboarding, role design, people growth. When the team is the problem before the code.',
          icon: '👥',
        },
      ],
    },
    deliverables: {
      heading: 'What stays with the team and management',
      intro:
        'Not abstract principles: maintainable artefacts that make state, decisions and progress visible.',
      items: [
        {
          title: 'State of the Stack',
          description:
            'A readable view of architecture, delivery, risks, team and dependencies, connected to business impact.',
          icon: '📍',
        },
        {
          title: 'ADRs',
          description:
            'Architecture Decision Records for structural choices: context, options, trade-offs, decision and consequences.',
          icon: '📝',
        },
        {
          title: 'Fitness functions',
          description:
            'Measurable checks on important system properties, keeping architectural principles verifiable over time.',
          icon: '📐',
        },
        {
          title: '90-day technical roadmap',
          description:
            'Priorities ordered by risk and value, with owners, dependencies and success criteria. The team knows what comes first and why.',
          icon: '🗓️',
        },
      ],
    },
    evidence: {
      heading: 'Evidence before opinions',
      text: 'The method comes from direct work on mission-critical enterprise systems, where releases, compliance and operational continuity cannot depend on intuition. In your context, however, every conclusion must be demonstrated against your artefacts.',
      items: [
        'Repository and representative code areas',
        'Pipelines, tests and release process',
        'Available logs, incidents and operational signals',
        'Interviews with management and the technical team',
      ],
    },
    capacity: {
      heading: 'Ownership with an explicit boundary',
      text: 'Ownership means accountability for agreed decisions and deliverables — not 8 hours a day on-site. We work with contracted hours per month so we stay reliable. If you need a full-time embed, we help you hire the right person.',
    },
    fit: {
      heading: 'Fit and no-fit',
      ideal: {
        title: 'A good fit if',
        items: [
          'You have a live product and an internal team able to implement.',
          'You lack priorities, governance or an authoritative technical lead.',
          'You accept evidence-based decisions, even when they challenge the status quo.',
        ],
      },
      notIdeal: {
        title: 'Not Technical Direction if',
        items: [
          'You have no team able to execute: you need Software in Hand.',
          'You want an extra developer or operational project manager.',
          'You need a full-time, on-call or daily CTO presence.',
        ],
      },
    },
    process: {
      heading: 'The first meeting is free — and already leaves you useful pointers',
      steps: [
        {
          title: 'Free initial meeting',
          text: 'We check for a technical direction problem and, in any case, leave you concrete value: a few hours of initial study with specific improvement points already ready.',
        },
        {
          title: 'Tech Assessment',
          text: 'We analyse stack, delivery, risks and team. You receive a State of the Stack, open decisions, proposed fitness functions and a 90-day roadmap.',
        },
        {
          title: 'Decision on what follows',
          text: 'The document is yours. If we continue, we define the mode, monthly deliverables and contracted hours; otherwise, you still have a usable basis.',
        },
      ],
    },
    plans: [
      {
        name: 'Tech Assessment',
        price: 'Entry',
        description: 'Diagnosis and 90-day plan — a basis to decide.',
        features: [
          'State of the Stack',
          'ADRs and open decisions',
          'Priority fitness functions',
          '90-day technical roadmap',
          'Go / no-go recommendation',
        ],
        cta: 'Book a Tech Assessment',
        highlighted: false,
      },
      {
        name: 'Monthly direction',
        price: 'Retainer',
        description: 'Clear weekly slots, monthly accountability.',
        features: [
          'One of three modes (or mix)',
          'Hours/month in contract',
          'Tracked decisions and deliverables',
          'AI only where ROI is clear',
        ],
        cta: "Let's talk",
        highlighted: true,
      },
    ],
    pdf: {
      title: 'The presentation that sells technical direction',
      description:
        'Five pages ready to forward: what the status quo costs, how we bring order (method and deliverables), and how to start with a Tech Assessment.',
      cta: 'Download the Technical Direction presentation now',
    },
    partnerPdf: {
      title: 'The kit to qualify the opportunity',
      description:
        'Five pages for agencies: promise and boundaries, B/C models, RACI, sales script and Tech Assessment. Ready for your next call.',
      cta: 'Download the Technical Direction partner kit now',
    },
  },
};

export function getDirezioneTecnicaContent(locale: Locale): DirezioneTecnicaContent {
  return content[locale];
}
