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
        'Articoli su AI, architettura software, leadership tech e trasformazione digitale. Insight pratici da 15+ anni di esperienza.',
    },
    heading: 'Blog',
    subtitle:
      'Insight pratici su AI, architettura, leadership e trasformazione digitale. Niente hype, solo esperienza condensata.',
    posts: [
      {
        slug: 'benvenuto',
        title: 'Perche ogni PMI ha bisogno di un\'AI strategy nel 2025',
        description:
          'L\'AI non e piu un lusso per le grandi aziende. Ecco come costruire un piano che funziona per le PMI italiane.',
        excerpt:
          'L\'AI non e piu un lusso per le grandi aziende. Ma adottarla senza strategia e come comprare una Ferrari per andare a fare la spesa. Ecco come costruire un piano che funziona.',
        date: '2025-01-15',
        author: 'Elios Scoglio | 108 Vision',
        tags: ['AI', 'Strategia', 'PMI'],
        readTime: '5 min',
        sections: [
          {
            type: 'h2',
            text: 'Il contesto: l\'AI non aspetta',
          },
          {
            type: 'p',
            text: 'Nel 2025 l\'intelligenza artificiale non e piu una curiosita tecnologica. E uno strumento di produttivita che le aziende piu agili stanno gia usando per:',
          },
          {
            type: 'ul',
            items: [
              { label: 'Ridurre i tempi', text: 'di risposta al cliente del 40-60%' },
              { label: 'Automatizzare', text: 'task ripetitivi che consumano ore ogni settimana' },
              { label: 'Migliorare', text: 'la qualita delle decisioni con dati analizzati in tempo reale' },
            ],
          },
          {
            type: 'p',
            text: 'Ma c\'e un problema: la maggior parte delle PMI italiane non sa da dove iniziare.',
          },
          {
            type: 'h2',
            text: 'Il paradosso delle PMI',
          },
          {
            type: 'p',
            text: 'Le grandi aziende hanno team AI dedicati, budget milionari e accesso ai migliori talenti. Le PMI no. Ma sono proprio le PMI ad avere il maggior margine di miglioramento.',
          },
          {
            type: 'p',
            text: 'Un\'azienda da 20 persone che automatizza il 30% dei task amministrativi libera 2-3 FTE equivalenti. Senza assumere nessuno.',
          },
          {
            type: 'h2',
            text: 'I 3 errori che vedo piu spesso',
          },
          {
            type: 'h3',
            text: '1. Partire dallo strumento, non dal problema',
          },
          {
            type: 'p',
            text: '"Vogliamo usare ChatGPT" non e una strategia. La domanda giusta e: "Quale problema di business vogliamo risolvere, e l\'AI e lo strumento giusto per farlo?"',
          },
          {
            type: 'h3',
            text: '2. Investire troppo, troppo presto',
          },
          {
            type: 'p',
            text: 'Non serve un progetto da 100K per iniziare. Un pilot da 3-5K su un caso d\'uso specifico ti da dati reali in 4-6 settimane. Poi decidi se scalare.',
          },
          {
            type: 'h3',
            text: '3. Ignorare le persone',
          },
          {
            type: 'p',
            text: 'L\'AI migliore del mondo fallisce se il team non la adotta. Il change management non e un optional: e il 50% del successo.',
          },
          {
            type: 'h2',
            text: 'Come costruire una strategia AI per la tua PMI',
          },
          {
            type: 'h3',
            text: 'Step 1: Assessment (1 settimana)',
          },
          {
            type: 'p',
            text: 'Mappa i tuoi processi. Identifica dove il tempo viene sprecato in task ripetitivi, dove gli errori sono frequenti, dove le decisioni sono lente.',
          },
          {
            type: 'h3',
            text: 'Step 2: Prioritizzazione (2 giorni)',
          },
          {
            type: 'p',
            text: 'Non tutto si puo fare subito. Usa una matrice impatto/effort per scegliere il primo caso d\'uso. Deve essere:',
          },
          {
            type: 'ul',
            items: [
              { label: '', text: 'Ad alto impatto (ore risparmiate o errori evitati)' },
              { label: '', text: 'A basso rischio (non tocca processi critici)' },
              { label: '', text: 'Misurabile (KPI chiari prima di iniziare)' },
            ],
          },
          {
            type: 'h3',
            text: 'Step 3: Pilot (4-6 settimane)',
          },
          {
            type: 'p',
            text: 'Implementa il primo caso d\'uso. Misura. Impara. Il pilot non deve essere perfetto: deve generare dati per decidere il passo successivo.',
          },
          {
            type: 'h3',
            text: 'Step 4: Scale o Kill (1 giorno)',
          },
          {
            type: 'p',
            text: 'Se il pilot funziona, scala. Se non funziona, hai speso poco e imparato molto. In entrambi i casi, hai vinto.',
          },
          {
            type: 'h2',
            text: 'Conclusione',
          },
          {
            type: 'p',
            text: 'L\'AI strategy per le PMI non e complicata. E un processo disciplinato di sperimentazione con rischio controllato. Il peggior errore e non iniziare.',
          },
          {
            type: 'cta',
            before: 'Se vuoi capire da dove partire nella tua azienda, ',
            linkText: 'prenota una discovery call gratuita',
            after: '. 30 minuti, nessun impegno.',
          },
        ],
      },
    ],
  },
  en: {
    meta: {
      title: 'Blog',
      description:
        'Articles on AI, software architecture, tech leadership, and digital transformation. Practical insights from 15+ years of experience.',
    },
    heading: 'Blog',
    subtitle:
      'Practical insights on AI, architecture, leadership, and digital transformation. No hype — just distilled experience.',
    posts: [
      {
        slug: 'benvenuto',
        title: 'Why every SME needs an AI strategy in 2025',
        description:
          'AI is no longer a luxury for large enterprises. Here is how to build a plan that works for Italian SMEs.',
        excerpt:
          'AI is no longer a luxury for large companies. But adopting it without a strategy is like buying a Ferrari to go grocery shopping. Here is how to build a plan that works.',
        date: '2025-01-15',
        author: 'Elios Scoglio | 108 Vision',
        tags: ['AI', 'Strategy', 'SME'],
        readTime: '5 min',
        sections: [
          {
            type: 'h2',
            text: 'The context: AI will not wait',
          },
          {
            type: 'p',
            text: 'In 2025, artificial intelligence is no longer a technological curiosity. It is a productivity tool that the most agile companies are already using to:',
          },
          {
            type: 'ul',
            items: [
              { label: 'Reduce response times', text: 'to customers by 40-60%' },
              { label: 'Automate', text: 'repetitive tasks that consume hours every week' },
              { label: 'Improve', text: 'decision quality with data analysed in real time' },
            ],
          },
          {
            type: 'p',
            text: 'But there is a problem: most Italian SMEs do not know where to start.',
          },
          {
            type: 'h2',
            text: 'The SME paradox',
          },
          {
            type: 'p',
            text: 'Large companies have dedicated AI teams, million-euro budgets, and access to top talent. SMEs do not. But SMEs are exactly where the greatest room for improvement lies.',
          },
          {
            type: 'p',
            text: 'A 20-person company that automates 30% of administrative tasks frees up 2-3 FTE equivalents. Without hiring anyone.',
          },
          {
            type: 'h2',
            text: 'The 3 mistakes I see most often',
          },
          {
            type: 'h3',
            text: '1. Start with the tool, not the problem',
          },
          {
            type: 'p',
            text: '"We want to use ChatGPT" is not a strategy. The right question is: "Which business problem do we want to solve, and is AI the right tool to do it?"',
          },
          {
            type: 'h3',
            text: '2. Invest too much, too soon',
          },
          {
            type: 'p',
            text: 'You do not need a 100K project to get started. A 3-5K pilot on a specific use case gives you real data in 4-6 weeks. Then you decide whether to scale.',
          },
          {
            type: 'h3',
            text: '3. Ignore the people',
          },
          {
            type: 'p',
            text: 'The best AI in the world fails if the team does not adopt it. Change management is not optional: it is 50% of success.',
          },
          {
            type: 'h2',
            text: 'How to build an AI strategy for your SME',
          },
          {
            type: 'h3',
            text: 'Step 1: Assessment (1 week)',
          },
          {
            type: 'p',
            text: 'Map your processes. Identify where time is wasted on repetitive tasks, where errors are frequent, where decisions are slow.',
          },
          {
            type: 'h3',
            text: 'Step 2: Prioritisation (2 days)',
          },
          {
            type: 'p',
            text: 'You cannot do everything at once. Use an impact/effort matrix to choose the first use case. It must be:',
          },
          {
            type: 'ul',
            items: [
              { label: '', text: 'High impact (hours saved or errors avoided)' },
              { label: '', text: 'Low risk (does not touch critical processes)' },
              { label: '', text: 'Measurable (clear KPIs before you start)' },
            ],
          },
          {
            type: 'h3',
            text: 'Step 3: Pilot (4-6 weeks)',
          },
          {
            type: 'p',
            text: 'Implement the first use case. Measure. Learn. The pilot does not need to be perfect: it needs to generate data for the next step.',
          },
          {
            type: 'h3',
            text: 'Step 4: Scale or kill (1 day)',
          },
          {
            type: 'p',
            text: 'If the pilot works, scale. If it does not, you spent little and learned a lot. Either way, you win.',
          },
          {
            type: 'h2',
            text: 'Conclusion',
          },
          {
            type: 'p',
            text: 'AI strategy for SMEs is not complicated. It is a disciplined process of experimentation with controlled risk. The worst mistake is not starting.',
          },
          {
            type: 'cta',
            before: 'If you want to understand where to start in your company, ',
            linkText: 'book a free discovery call',
            after: '. 30 minutes, no commitment.',
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
