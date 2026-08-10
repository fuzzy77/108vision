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
  channels: {
    heading: string;
    subheading: string;
    items: HomeService[];
  };
  how: {
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
        'Due canali, una competenza: guidiamo il tuo team tecnico, oppure costruiamo e teniamo in mano il software — con ore chiare e responsabilità sul risultato.',
    },
    channels: {
      heading: 'Due canali. Una competenza.',
      subheading:
        'La scelta dipende dal problema, non dall’offerta. Stessa profondità tecnica: architettura, sistemi, AI dove serve, team e processo.',
      items: [
        {
          title: 'Direzione Tecnica',
          description:
            'Hai già un team. Ti manca chi lo guida, lo fa crescere, o alza il livello — con slot settimanali e deliverable chiari.',
          icon: '🧭',
          link: '/direzione-tecnica',
        },
        {
          title: 'Software in Mano',
          description:
            'Non hai (ancora) il software, o quello che hai non regge. Lo progettiamo, costruiamo e facciamo evolvere — e restiamo.',
          icon: '🛠️',
          link: '/software-in-mano',
        },
      ],
    },
    how: {
      heading: 'Come iniziamo',
      steps: [
        {
          title: '1. Una domanda',
          text: 'Hai già un team di sviluppo, o il problema è il software che manca / non regge?',
        },
        {
          title: '2. Entry chiaro',
          text: 'Tech Assessment (Direzione Tecnica) o Discovery (Software in Mano) — deliverable scritto, senza improvvisare.',
        },
        {
          title: '3. Ore in contratto',
          text: 'Ownership su decisioni e risultati. Slot settimanali dichiarati — non promesse di presenza full-time.',
        },
      ],
    },
    wellbeing: {
      eyebrow: 'Prova di Software in Mano',
      title: 'WellBeing',
      description:
        'Un’app che abbiamo costruito e teniamo in mano — esempio concreto del metodo, non un terzo canale di vendita.',
    },
    cta: {
      title: 'Parliamone',
      description:
        'Prenota una call di 20–30 minuti. Capiremo insieme se il problema è il team o il software — e il next step sensato.',
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
        'Two channels, one depth: we lead your engineering team, or we build and keep your software in hand — with clear hours and accountability for outcomes.',
    },
    channels: {
      heading: 'Two channels. One craft.',
      subheading:
        'The choice depends on the problem, not the catalogue. Same technical depth: architecture, systems, AI where it pays, team and process.',
      items: [
        {
          title: 'Technical Direction',
          description:
            'You already have a team. You need someone to lead it, grow it, or raise the bar — with weekly slots and clear deliverables.',
          icon: '🧭',
          link: '/direzione-tecnica',
        },
        {
          title: 'Software in Hand',
          description:
            'You do not have the software yet, or what you have does not hold. We design, build and evolve it — and we stay.',
          icon: '🛠️',
          link: '/software-in-mano',
        },
      ],
    },
    how: {
      heading: 'How we start',
      steps: [
        {
          title: '1. One question',
          text: 'Do you already have a development team, or is the problem missing / failing software?',
        },
        {
          title: '2. Clear entry',
          text: 'Tech Assessment (Technical Direction) or Discovery (Software in Hand) — written deliverable, no improvisation.',
        },
        {
          title: '3. Hours in contract',
          text: 'Ownership of decisions and outcomes. Declared weekly slots — not promises of full-time presence.',
        },
      ],
    },
    wellbeing: {
      eyebrow: 'Proof of Software in Hand',
      title: 'WellBeing',
      description:
        'An app we built and keep in hand — a concrete example of the method, not a third sales channel.',
    },
    cta: {
      title: "Let's talk",
      description:
        'Book a 20–30 minute call. We will see whether the problem is the team or the software — and the sensible next step.',
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
