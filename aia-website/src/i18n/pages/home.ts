import type { Locale } from '../config';

export interface HomeService {
  title: string;
  description: string;
  icon: string;
  link: string;
}

export interface HomeContent {
  meta: { title: string; description: string };
  hero: { title: string; subtitle: string };
  problem: {
    heading: string;
    intro: string;
    items: { title: string; text: string }[];
  };
  cost: { heading: string; text: string };
  channels: {
    heading: string;
    subheading: string;
    items: HomeService[];
  };
  fit: {
    heading: string;
    ideal: { title: string; items: string[] };
    notIdeal: { title: string; items: string[] };
  };
  entry: {
    heading: string;
    steps: { title: string; text: string }[];
  };
  wellbeing: {
    eyebrow: string;
    title: string;
    description: string;
  };
  cta: {
    title: string;
    description: string;
  };
}

const homeContent: Record<Locale, HomeContent> = {
  it: {
    meta: {
      title: 'Partner Tecnico per PMI',
      description:
        '108 Vision — il partner tecnico che prende in mano la situazione. Direzione Tecnica per team esistenti, Software in Mano per costruire ed evolvere il software.',
    },
    hero: {
      title: 'Il partner tecnico che prende in mano la situazione.',
      subtitle:
        'Quando le decisioni tecniche restano senza owner, il team rallenta e il software diventa un rischio. Guidiamo chi sviluppa oppure prendiamo in mano il prodotto, con deliverable e responsabilità chiari.',
    },
    problem: {
      heading: 'Il problema non è “fare più tecnologia”. È sapere cosa fare e chi ne risponde.',
      intro:
        '108 Vision entra quando il business dipende dal software, ma manca una direzione tecnica affidabile.',
      items: [
        {
          title: 'Le decisioni restano sospese',
          text: 'Stack, priorità e debito tecnico vengono decisi dall’urgenza, senza un criterio condiviso.',
        },
        {
          title: 'Il team consegna, ma senza direzione',
          text: 'Le persone lavorano; release, qualità e responsabilità restano però fragili o dipendono da una sola persona.',
        },
        {
          title: 'Il software non segue più il business',
          text: 'Processi manuali, integrazioni mancanti e fornitori che non restano trasformano ogni cambiamento in attrito.',
        },
      ],
    },
    cost: {
      heading: 'Rimandare rende ogni scelta più costosa',
      text: 'Il debito si accumula, la conoscenza resta nelle teste e ogni rilascio richiede più cautela. Prima si rende visibile lo stato reale, più opzioni restano aperte.',
    },
    channels: {
      heading: 'Due canali. Un solo metodo di ownership.',
      subheading:
        'Partiamo dal problema, rendiamo espliciti rischi e trade-off, scriviamo le decisioni e verifichiamo il risultato. La scelta del canale dipende da ciò che hai già.',
      items: [
        {
          title: 'Direzione Tecnica',
          description:
            'Hai già un team: portiamo State of the Stack, ADR, fitness function e una roadmap tecnica a 90 giorni, poi presidiamo le decisioni in slot concordati.',
          icon: '🧭',
          link: '/direzione-tecnica',
        },
        {
          title: 'Software in Mano',
          description:
            'Il software manca o non regge: Discovery pagata, build, integrazioni, test, CI/CD e osservabilità. Il codice resta tuo e noi restiamo per evolverlo.',
          icon: '🛠️',
          link: '/software-in-mano',
        },
      ],
    },
    fit: {
      heading: 'Quando siamo il partner giusto',
      ideal: {
        title: 'Ha senso se',
        items: [
          'Il software sostiene un processo importante e serve un owner tecnico.',
          'Vuoi decisioni motivate, deliverable verificabili e un perimetro scritto.',
          'Cerchi continuità senza dipendere da persone o tecnologie proprietarie.',
        ],
      },
      notIdeal: {
        title: 'Non ha senso se',
        items: [
          'Cerchi solo ore di sviluppo al prezzo più basso.',
          'Vuoi confermare una soluzione già scelta senza metterla in discussione.',
          'Ti serve una presenza full-time o una reperibilità continua non concordata.',
        ],
      },
    },
    entry: {
      heading: 'Il primo passo è piccolo, pagato e utilizzabile anche senza di noi',
      steps: [
        {
          title: '1. Call di inquadramento',
          text: 'Distinguiamo il problema: hai già un team da guidare, oppure serve costruire o adottare il software?',
        },
        {
          title: '2. Entry point pagato',
          text: 'Tech Assessment per Direzione Tecnica; Discovery per Software in Mano. In entrambi i casi ricevi un documento decisionale concreto.',
        },
        {
          title: '3. Go / no-go informato',
          text: 'Prosegui solo se perimetro, priorità, costi e responsabilità sono chiari. Nessun lock-in sul passo successivo.',
        },
      ],
    },
    wellbeing: {
      eyebrow: 'Prova di Software in Mano',
      title: 'WellBeing',
      description:
        'Un prodotto digitale che abbiamo costruito e continuiamo a gestire: requisiti, privacy, rilascio ed evoluzione. È prova del metodo Software in Mano, non un terzo canale commerciale.',
    },
    cta: {
      title: 'Partiamo dal problema, non dalla soluzione',
      description:
        'In una prima call capiamo se serve Direzione Tecnica, Software in Mano oppure nessuno dei due. Se c’è fit, proponiamo l’entry point pagato corretto.',
    },
  },
  en: {
    meta: {
      title: 'Technical Partner for SMEs',
      description:
        '108 Vision — the technical partner that takes ownership. Technical Direction for existing teams, Software in Hand to build and evolve software.',
    },
    hero: {
      title: 'The technical partner that takes ownership of the situation.',
      subtitle:
        'When technical decisions have no owner, teams slow down and software becomes a business risk. We lead the people building it or take ownership of the product, with clear deliverables and accountability.',
    },
    problem: {
      heading: 'The problem is not “more technology”. It is knowing what to do and who owns it.',
      intro:
        '108 Vision steps in when the business depends on software but lacks reliable technical direction.',
      items: [
        {
          title: 'Decisions remain unresolved',
          text: 'Stack, priorities and technical debt are driven by urgency rather than shared criteria.',
        },
        {
          title: 'The team delivers without direction',
          text: 'People are working, yet releases, quality and accountability remain fragile or depend on one person.',
        },
        {
          title: 'Software no longer follows the business',
          text: 'Manual processes, missing integrations and vendors who disappear turn every change into friction.',
        },
      ],
    },
    cost: {
      heading: 'Delay makes every choice more expensive',
      text: 'Debt accumulates, knowledge stays in people’s heads and every release requires more caution. The sooner the current state is visible, the more options remain open.',
    },
    channels: {
      heading: 'Two channels. One ownership method.',
      subheading:
        'We start from the problem, expose risks and trade-offs, document decisions and verify outcomes. The channel depends on what you already have.',
      items: [
        {
          title: 'Technical Direction',
          description:
            'You already have a team: we provide a State of the Stack, ADRs, fitness functions and a 90-day technical roadmap, then govern decisions in agreed slots.',
          icon: '🧭',
          link: '/direzione-tecnica',
        },
        {
          title: 'Software in Hand',
          description:
            'The software is missing or failing: paid Discovery, build, integrations, tests, CI/CD and observability. You own the code and we stay to evolve it.',
          icon: '🛠️',
          link: '/software-in-mano',
        },
      ],
    },
    fit: {
      heading: 'When we are the right partner',
      ideal: {
        title: 'A good fit if',
        items: [
          'Software supports an important process and needs a technical owner.',
          'You want reasoned decisions, verifiable deliverables and written scope.',
          'You want continuity without dependency on proprietary people or technology.',
        ],
      },
      notIdeal: {
        title: 'Not a fit if',
        items: [
          'You only want development hours at the lowest rate.',
          'You want validation for a solution already chosen, without challenge.',
          'You need an unbounded full-time presence or always-on availability.',
        ],
      },
    },
    entry: {
      heading: 'The first step is small, paid and useful even without us',
      steps: [
        {
          title: '1. Framing call',
          text: 'We distinguish the problem: do you have a team to lead, or do you need to build or adopt the software?',
        },
        {
          title: '2. Paid entry point',
          text: 'Tech Assessment for Technical Direction; Discovery for Software in Hand. Either way, you receive a concrete decision document.',
        },
        {
          title: '3. Informed go / no-go',
          text: 'Continue only when scope, priorities, cost and accountability are clear. No lock-in to the next step.',
        },
      ],
    },
    wellbeing: {
      eyebrow: 'Proof of Software in Hand',
      title: 'WellBeing',
      description:
        'A digital product we built and continue to operate: requirements, privacy, releases and evolution. It proves the Software in Hand method; it is not a third commercial channel.',
    },
    cta: {
      title: 'Start with the problem, not the solution',
      description:
        'In an initial call we determine whether you need Technical Direction, Software in Hand, or neither. If there is a fit, we propose the right paid entry point.',
    },
  },
};

export function getHomeContent(locale: Locale): HomeContent {
  return homeContent[locale];
}

/** Prefix channel links for the active locale. */
export function localizeHomeLinks(content: HomeContent, locale: Locale): HomeContent {
  const prefix = locale === 'en' ? '/en' : '';
  return {
    ...content,
    channels: {
      ...content.channels,
      items: content.channels.items.map((item) => ({
        ...item,
        link: `${prefix}${item.link}`,
      })),
    },
  };
}
