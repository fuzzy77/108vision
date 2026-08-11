import type { Locale } from '../config';

export type BlogSlug = 'benvenuto';

export interface BlogListItem {
  slug: BlogSlug;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  readTime: string;
}

export interface BlogListItemBold {
  label: string;
  text: string;
}

export type BlogSection =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: BlogListItemBold[] }
  | { type: 'cta'; before: string; linkText: string; after: string };

export interface BlogPost {
  slug: BlogSlug;
  title: string;
  description: string;
  excerpt: string;
  date: string;
  author: string;
  tags: string[];
  readTime: string;
  sections: BlogSection[];
}

export interface BlogContent {
  meta: { title: string; description: string };
  heading: string;
  subtitle: string;
  posts: BlogPost[];
}

const blogContent: Record<Locale, BlogContent> = {
  it: {
    meta: {
      title: 'Blog',
      description:
        'Decisioni pratiche su direzione tecnica, architettura, delivery e software per PMI. AI quando serve, senza partire dall’hype.',
    },
    heading: 'Blog',
    subtitle:
      'Decisioni tecniche spiegate in linguaggio business: team, software, architettura e delivery. AI quando crea valore, non per moda.',
    posts: [
      {
        slug: 'benvenuto',
        title: 'Partner Tecnico: prima capiamo se il problema è il team o il software',
        description:
          'Cosa significa Partner Tecnico per una PMI e perché la prima scelta è tra dare direzione a un team esistente o prendere in mano il software.',
        excerpt:
          'Non sempre serve un altro fornitore. A volte il software team c’è già e manca direzione; altre volte serve qualcuno che costruisca e faccia evolvere il prodotto. Il punto di partenza cambia.',
        date: '2026-08-11',
        author: 'Elios Scoglio | 108 Vision',
        tags: ['Partner Tecnico', 'PMI', 'Delivery'],
        readTime: '5 min',
        sections: [
          {
            type: 'h2',
            text: 'Un partner tecnico non è un fornitore con un nome diverso',
          },
          {
            type: 'p',
            text: 'Un’agenzia può eseguire specifiche. Un consulente può consegnare una diagnosi. Il Partner Tecnico serve quando l’azienda ha bisogno che qualcuno prenda ownership delle decisioni tecniche e dei deliverable concordati, restando responsabile anche dopo la prima consegna.',
          },
          {
            type: 'p',
            text: 'Ownership non significa presenza quotidiana o disponibilità senza limiti. Significa perimetro scritto, responsabilità riconoscibili, rischi nominati e momenti di lavoro concordati. Se serve una guida interna a tempo pieno, la risposta corretta può essere strutturare quell’assunzione.',
          },
          {
            type: 'h2',
            text: 'La prima domanda: hai già un team o ti serve il software?',
          },
          {
            type: 'p',
            text: 'Questa distinzione evita di vendere sviluppo a chi ha già sviluppatori e di proporre governance a chi ha bisogno di vedere un prodotto funzionante.',
          },
          {
            type: 'h3',
            text: 'Hai già un team: Direzione Tecnica',
          },
          {
            type: 'p',
            text: 'Il team sviluppa, ma le decisioni restano sospese, la qualità dipende dalle singole persone o nessuno traduce le priorità aziendali in una roadmap tecnica. In questo caso non serve sostituire chi scrive codice: serve dare direzione, rendere espliciti i trade-off e far crescere la capacità del team.',
          },
          {
            type: 'ul',
            items: [
              { label: 'Punto di partenza:', text: 'Tech Assessment.' },
              { label: 'Output:', text: 'stato attuale, rischi, priorità e roadmap scritta.' },
              { label: 'Poi:', text: 'guida strategica, lavoro operativo in slot definiti o costruzione del team, secondo il contesto.' },
            ],
          },
          {
            type: 'h3',
            text: 'Il software manca o non regge: Software in Mano',
          },
          {
            type: 'p',
            text: 'Il prodotto deve ancora nascere, quello esistente blocca il business oppure manca un interlocutore che lo tenga nel tempo. Qui prendiamo in mano il percorso completo: capire cosa serve, progettare, costruire, integrare, gestire e far evolvere.',
          },
          {
            type: 'ul',
            items: [
              { label: 'Punto di partenza:', text: 'Discovery.' },
              { label: 'Output:', text: 'requisiti prioritizzati, perimetro, architettura ad alto livello e base concreta per stimare il lavoro.' },
              { label: 'Poi:', text: 'progetto e continuità evolutiva, con responsabilità e capacità dichiarate.' },
            ],
          },
          {
            type: 'h2',
            text: 'Due percorsi, la stessa competenza',
          },
          {
            type: 'p',
            text: 'Architettura, integrazioni, delivery e comprensione del business sono le stesse. Cambia il problema da prendere in mano. Un’azienda può anche passare da Software in Mano a Direzione Tecnica quando costruisce un team interno: è un’evoluzione naturale, non un’offerta forzata.',
          },
          {
            type: 'h2',
            text: 'AI-native, non AI-first',
          },
          {
            type: 'p',
            text: 'Non partiamo chiedendo dove inserire l’AI. Partiamo dal problema, dai dati disponibili, dal rischio e dal risultato atteso. Se l’AI rende il prodotto o il team più efficace con un valore verificabile, la usiamo. Se aggiunge solo costo, fragilità o complessità, scegliamo altro.',
          },
          {
            type: 'p',
            text: 'Per questo l’AI non è un terzo percorso commerciale: è una competenza trasversale dentro Direzione Tecnica e Software in Mano.',
          },
          {
            type: 'h2',
            text: 'Il prossimo passo deve ridurre l’incertezza',
          },
          {
            type: 'p',
            text: 'La prima call serve a capire il contesto e scegliere il percorso corretto. Il risultato utile non è una promessa generica: è decidere se approfondire con un Tech Assessment, con una Discovery oppure fermarsi perché non c’è fit.',
          },
          {
            type: 'cta',
            before: 'Hai già un team o ti serve il software? ',
            linkText: 'Raccontaci la situazione',
            after: ' e individuiamo il prossimo passo.',
          },
        ],
      },
    ],
  },
  en: {
    meta: {
      title: 'Blog',
      description:
        'Practical decisions on technical direction, architecture, delivery, and software for SMEs. AI where it helps, never as the starting hype.',
    },
    heading: 'Blog',
    subtitle:
      'Technical decisions in business language: teams, software, architecture, and delivery. AI where it creates value, not because it is fashionable.',
    posts: [
      {
        slug: 'benvenuto',
        title: 'Technical Partner: first determine whether the problem is the team or the software',
        description:
          'What a Technical Partner means for an SME, and why the first choice is between directing an existing team and taking ownership of the software.',
        excerpt:
          'You do not always need another supplier. Sometimes the software team already exists and lacks direction; sometimes you need someone to build and evolve the product. The starting point changes.',
        date: '2026-08-11',
        author: 'Elios Scoglio | 108 Vision',
        tags: ['Technical Partner', 'SME', 'Delivery'],
        readTime: '5 min',
        sections: [
          {
            type: 'h2',
            text: 'A Technical Partner is not a supplier with a different name',
          },
          {
            type: 'p',
            text: 'An agency can execute specifications. A consultant can deliver a diagnosis. A Technical Partner is needed when the company wants someone to take ownership of agreed technical decisions and deliverables, remaining accountable beyond the first delivery.',
          },
          {
            type: 'p',
            text: 'Ownership does not mean daily presence or unlimited availability. It means a written scope, identifiable responsibilities, named risks, and agreed working sessions. If you need a full-time internal leader, the right answer may be to structure that hire.',
          },
          {
            type: 'h2',
            text: 'The first question: do you already have a team, or do you need the software?',
          },
          {
            type: 'p',
            text: 'This distinction prevents selling development to a company that already has developers, or offering governance to one that needs a working product.',
          },
          {
            type: 'h3',
            text: 'You already have a team: Technical Direction',
          },
          {
            type: 'p',
            text: 'The team develops, but decisions remain unresolved, quality depends on individuals, or nobody translates business priorities into a technical roadmap. The answer is not to replace the people writing code: it is to provide direction, make trade-offs explicit, and strengthen the team’s capability.',
          },
          {
            type: 'ul',
            items: [
              { label: 'Starting point:', text: 'Tech Assessment.' },
              { label: 'Output:', text: 'current state, risks, priorities, and a written roadmap.' },
              { label: 'Then:', text: 'strategic direction, operational work in defined slots, or team building, depending on context.' },
            ],
          },
          {
            type: 'h3',
            text: 'The software is missing or no longer holds up: Software in Hand',
          },
          {
            type: 'p',
            text: 'The product has yet to be built, the existing one blocks the business, or nobody remains accountable for it over time. Here we take ownership of the full path: understand what is needed, design, build, integrate, operate, and evolve it.',
          },
          {
            type: 'ul',
            items: [
              { label: 'Starting point:', text: 'Discovery.' },
              { label: 'Output:', text: 'prioritised requirements, scope, high-level architecture, and a concrete basis for estimating the work.' },
              { label: 'Then:', text: 'project delivery and continuous evolution, with declared responsibilities and capacity.' },
            ],
          },
          {
            type: 'h2',
            text: 'Two paths, the same expertise',
          },
          {
            type: 'p',
            text: 'Architecture, integrations, delivery, and business understanding are shared. What changes is the problem we take ownership of. A company can also move from Software in Hand to Technical Direction as it builds an internal team: that is a natural evolution, not a forced upsell.',
          },
          {
            type: 'h2',
            text: 'AI-native, not AI-first',
          },
          {
            type: 'p',
            text: 'We do not start by asking where AI can be inserted. We start with the problem, available data, risk, and expected outcome. If AI makes the product or team more effective with testable value, we use it. If it only adds cost, fragility, or complexity, we choose something else.',
          },
          {
            type: 'p',
            text: 'That is why AI is not a third commercial path: it is a cross-cutting capability within Technical Direction and Software in Hand.',
          },
          {
            type: 'h2',
            text: 'The next step should reduce uncertainty',
          },
          {
            type: 'p',
            text: 'The first call is used to understand the context and choose the right path. The useful outcome is not a generic promise: it is deciding whether to continue with a Tech Assessment, a Discovery, or to stop because there is no fit.',
          },
          {
            type: 'cta',
            before: 'Do you already have a team, or do you need the software? ',
            linkText: 'Tell us about the situation',
            after: ' and we will identify the next step.',
          },
        ],
      },
    ],
  },
};

export const ui = {
  it: blogContent.it,
  en: blogContent.en,
} as const;

export function getBlogContent(locale: Locale): BlogContent {
  return blogContent[locale];
}

export function getBlogPost(locale: Locale, slug: string): BlogPost | undefined {
  return blogContent[locale].posts.find((post) => post.slug === slug);
}

export function getBlogSlugs(): BlogSlug[] {
  return ['benvenuto'];
}
