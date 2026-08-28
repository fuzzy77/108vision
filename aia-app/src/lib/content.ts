/**
 * Static Italian copy for Vision108.
 *
 * Sourced from the 108 Vision website content modules:
 * - home:                 aia-website/src/i18n/pages/home.ts
 * - Direzione Tecnica:    aia-website/src/i18n/pages/direzione-tecnica.ts
 * - Software in Mano:     aia-website/src/i18n/pages/software-in-mano.ts
 * - contact:              aia-website/src/i18n/ui.ts
 */

import type { IconName } from './icons';

export interface HomeContent {
  hero: { title: string; subtitle: string };
  problem: { heading: string; intro: string; items: { title: string; text: string }[] };
  cost: { heading: string; text: string };
  channels: { heading: string; subheading: string; items: { title: string; description: string; icon: IconName }[] };
  fit: { heading: string; ideal: { title: string; items: string[] }; notIdeal: { title: string; items: string[] } };
  entry: { heading: string; steps: { title: string; text: string }[] };
  assistant: { eyebrow: string; title: string; description: string };
  cta: { title: string; description: string };
}

export interface ServiceFeatureItem {
  title: string;
  description: string;
  icon: IconName;
}

export interface ServiceSection {
  heading: string;
  intro: string;
  items: ServiceFeatureItem[];
}

export interface ServiceChannel {
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  features: ServiceSection;
}

export interface ServicesContent {
  heading: string;
  intro: string;
  channels: ServiceChannel[];
}

export interface ServicePlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export interface PricingContent {
  heading: string;
  intro: string;
  footnote: string;
  channels: { title: string; plans: ServicePlan[] }[];
}

export interface ContactContent {
  heading: string;
  intro: string;
  pathsHeading: string;
  paths: { title: string; description: string; nextStep: string }[];
  partnershipTitle: string;
  partnershipDescription: string;
  appDescription: string;
  appLink: string;
  email: string;
  linkedin: string;
  bookDirect: string;
}

export interface PromptContent {
  title: string;
  subtitle: string;
  inputPlaceholder: string;
  button: string;
  guestHint: string;
  loginAction: string;
  online: string;
  offline: string;
  checking: string;
  disclaimer: string;
  systemInstruction: string;
}

export const home: HomeContent = {
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
        icon: 'compass',
      },
      {
        title: 'Software in Mano',
        description:
          'Il software manca o non regge: Discovery pagata, build, integrazioni, test, CI/CD e osservabilità. Il codice resta tuo e noi restiamo per evolverlo.',
        icon: 'wrench',
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
  assistant: {
    eyebrow: 'Assistente AI',
    title: 'Chiedi, spiega, decidi',
    description:
      'Scrivi una domanda o un concetto tecnico: l’Assistente AI lo spiega con parole semplici, attingendo alla knowledge base di 108 Vision.',
  },
  cta: {
    title: 'Partiamo dal problema, non dalla soluzione',
    description:
      'In una prima call capiamo se serve Direzione Tecnica, Software in Mano oppure nessuno dei due. Se c’è fit, proponiamo l’entry point pagato corretto.',
  },
};

export const services: ServicesContent = {
  heading: 'Cosa facciamo',
  intro:
    'Due canali, un solo metodo: evidenze prima delle opinioni, decisioni scritte e verificabili, ownership chiara fino al risultato.',
  channels: [
    {
      name: 'Direzione Tecnica',
      heroTitle: 'Il team c’è. La direzione tecnica no.',
      heroSubtitle:
        'Quando roadmap, architettura e qualità dipendono dall’urgenza, prendiamo ownership delle decisioni e dei deliverable. Il team continua a costruire; noi rendiamo chiara la direzione.',
      features: {
        heading: 'Il metodo si adatta al contesto, non il rigore',
        intro:
          'Partiamo da evidenze, rendiamo esplicite le decisioni e trasferiamo capacità al referente interno. Il coinvolgimento cambia; ownership e tracciabilità restano.',
        items: [
          {
            title: 'Strategico',
            description:
              'Roadmap, architettura, governance e allineamento con il business quando il team sa eseguire ma manca una direzione condivisa.',
            icon: 'map',
          },
          {
            title: 'Operativo time-boxed',
            description:
              'Review architetturali, pairing e rituali in slot fissi. Entriamo nei momenti decisivi senza sostituire il team o diventare un embed full-time.',
            icon: 'settings',
          },
          {
            title: 'Team building',
            description:
              'Selezione, onboarding, struttura ruoli, crescita persone. Quando il problema è il team prima del codice.',
            icon: 'users',
          },
        ],
      },
    },
    {
      name: 'Software in Mano',
      heroTitle: 'Il software non deve diventare un altro problema da gestire.',
      heroSubtitle:
        'Progettiamo, costruiamo e facciamo evolvere il software che serve al tuo business. Un interlocutore dal requisito al go-live, con codice tuo e responsabilità che continuano dopo la consegna.',
      features: {
        heading: 'Dal problema al software che resta governabile',
        intro:
          'Discovery prima delle promesse, delivery con quality gate, gestione dopo il go-live. Ogni fase produce un risultato verificabile e può fermarsi senza lock-in.',
        items: [
          {
            title: 'Discover',
            description:
              'Mappiamo processo, utenti, dati, integrazioni, rischi e criteri di accettazione. Solo dopo definiamo architettura, perimetro e investimento.',
            icon: 'search',
          },
          {
            title: 'Build',
            description:
              'Costruiamo per milestone visibili, con review, test e pipeline automatizzate. Le variazioni di scope diventano decisioni esplicite.',
            icon: 'code-xml',
          },
          {
            title: 'Run & evolve',
            description:
              'Monitoriamo ciò che conta, gestiamo correzioni ed evoluzione e rivediamo le priorità con ore e responsabilità concordate.',
            icon: 'handshake',
          },
        ],
      },
    },
  ],
};

export const pricing: PricingContent = {
  heading: 'Percorsi e investimento',
  intro:
    'Entrambi i canali partono da un entry point pagato, che produce un documento decisionale utilizzabile anche senza di noi.',
  footnote:
    'I perimetri e le ore si definiscono in contratto dopo l’entry point. Nessun lock-in sul passo successivo.',
  channels: [
    {
      title: 'Direzione Tecnica',
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
          highlighted: true,
        },
      ],
    },
    {
      title: 'Software in Mano',
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
          highlighted: true,
        },
      ],
    },
  ],
};

export const contact: ContactContent = {
  heading: 'Partiamo dal problema giusto',
  intro:
    'Hai già un team tecnico oppure ti serve costruire o far evolvere il software? La risposta indica il punto di partenza, non ti vincola a un servizio.',
  pathsHeading: 'Quale percorso descrive meglio la situazione?',
  paths: [
    {
      title: 'Hai già un team tecnico',
      description: 'Il team consegna, ma manca una direzione chiara su architettura, priorità, qualità o responsabilità.',
      nextStep: 'Punto di partenza: Tech Assessment',
    },
    {
      title: 'Ti serve il software',
      description: 'Il prodotto non esiste, non regge più oppure il fornitore attuale non ne prende ownership.',
      nextStep: 'Punto di partenza: Discovery',
    },
  ],
  partnershipTitle: 'Partnership e co-delivery',
  partnershipDescription:
    'Lavori in una software house, in consulenza o con un team specialistico? Valutiamo partnership su architettura, delivery e competenze complementari, con responsabilità definite.',
  appDescription:
    'Questa app è il punto di accesso mobile a 108 Vision: servizi, percorsi e l’Assistente AI.',
  appLink: 'Prova l’Assistente',
  email: 'info@108vision.it',
  linkedin: 'linkedin.com/in/eliosscoglio',
  bookDirect: 'Prenota una call',
};

export const prompt: PromptContent = {
  title: 'Assistente 108 Vision',
  subtitle:
    'Raccontami la tua situazione: ti dico cosa può fare 108 Vision per te.',
  inputPlaceholder: 'Es. ho un team di 5 sviluppatori ma nessuna direzione tecnica…',
  button: 'Chiedi',
  guestHint:
    'Nessun account richiesto. Risposte generiche sui servizi; accedi per risposte personalizzate.',
  loginAction: 'Accedi',
  online: 'Servizio AI online',
  offline: 'Servizio AI offline',
  checking: 'Verifica del servizio…',
  disclaimer: 'Risposte generate da AI: verifica sempre le informazioni critiche.',
  systemInstruction:
    'Sei l’Assistente di 108 Vision, il partner tecnico che prende in mano la situazione. Rispondi SOLO a domande su cosa può fare 108 Vision per l’utente e proponi i servizi pertinenti:\n\n- Direzione Tecnica: se l’utente ha già un team ma manca una guida. Entry point: Tech Assessment (State of the Stack, ADR, roadmap a 90 giorni).\n- Software in Mano: se serve costruire o far evolvere software. Entry point: Discovery (perimetro, architettura, stima).\n\nRegole:\n- Non rispondere a domande fuori dai servizi di 108 Vision.\n- Se la domanda non riguarda i servizi, dillo con cortesia e proponi uno dei due canali.\n- Termina sempre indicando il prossimo passo: la tab Contatti o info@108vision.it.',
};
