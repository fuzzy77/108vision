import type { Locale } from '../config';
import type {
  HowItWorksStep,
  LocaleContent,
  ServiceFeature,
  ServicePlan,
  TextCard,
} from './types';

export interface FractionalCtoContent {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: { title: string; subtitle: string };
  audience: { heading: string; intro: string; cards: TextCard[] };
  features: { heading: string; items: ServiceFeature[] };
  process: { heading: string; steps: HowItWorksStep[] };
  plans: ServicePlan[];
  pdfGuidePath: string;
}

const content: LocaleContent<FractionalCtoContent> = {
  it: {
    meta: {
      title: 'Fractional CTO',
      description:
        'CTO part-time per startup e PMI. Governance tecnica, team building, architettura e vendor management.',
    },
    breadcrumb: 'Fractional CTO',
    hero: {
      title: 'Il tuo CTO, senza il costo di un full-time',
      subtitle:
        'Leadership tecnica senior per startup e PMI che hanno bisogno di governance, visione architetturale e team building — con la flessibilità che serve alla tua fase di crescita.',
    },
    audience: {
      heading: 'Per chi è il Fractional CTO?',
      intro:
        'Per aziende tech-driven che stanno crescendo e hanno bisogno di un leader tecnico esperto, ma non sono pronte (o non vogliono) assumere un CTO full-time a 150K+/anno.',
      cards: [
        {
          title: 'Startup in crescita',
          text: 'Hai un MVP che funziona ma devi scalare. Serve architettura, processi, e un team strutturato.',
        },
        {
          title: 'PMI digitalizzate',
          text: 'Hai sviluppatori ma manca la direzione tecnica. Debito tecnico che cresce, decisioni senza criterio.',
        },
        {
          title: 'Scale-up pre/post funding',
          text: 'Investitori che chiedono un tech leader. Due diligence tecnica. Roadmap credibile per il board.',
        },
      ],
    },
    features: {
      heading: 'Cosa faccio come tuo Fractional CTO',
      items: [
        {
          title: 'Governance Tecnica',
          description:
            'Definizione standard, review architetturali, decisioni tecnologiche informate. ADR e documentazione viva.',
          icon: '🏛️',
        },
        {
          title: 'Team Building',
          description:
            'Hiring, onboarding, struttura team. Da freelancer sparsi a engineering team coeso e produttivo.',
          icon: '👥',
        },
        {
          title: 'Architettura & Stack',
          description:
            'Scelta tecnologie, design sistemi, technical debt management. Decisioni con trade-off espliciti.',
          icon: '🏗️',
        },
        {
          title: 'Vendor Management',
          description:
            'Valutazione fornitori, negoziazione contratti tech, gestione outsourcing. Il tuo interesse prima di tutto.',
          icon: '🤝',
        },
        {
          title: 'Roadmap Tecnologica',
          description:
            'Piano 6-12 mesi allineato al business. Priorità, dipendenze, rischi e milestone concrete.',
          icon: '🗺️',
        },
        {
          title: 'Mentoring & Coaching',
          description:
            'Crescita dei tuoi tech lead. Sessioni 1:1, code review formative, feedback strutturato.',
          icon: '🎯',
        },
      ],
    },
    process: {
      heading: 'Come funziona',
      steps: [
        {
          title: 'Discovery Call (gratuita)',
          text: '30 minuti per capire la tua situazione, le sfide e gli obiettivi. Nessun impegno.',
        },
        {
          title: 'Tech Assessment (settimana 1)',
          text: 'Analizzo codice, architettura, team, processi. Produco un report con stato attuale e raccomandazioni.',
        },
        {
          title: "Piano d'azione (settimana 2)",
          text: 'Roadmap 90 giorni con priorità, quick wins e obiettivi misurabili. Allineamento con il business.',
        },
        {
          title: 'Esecuzione (ongoing)',
          text: 'Lavoro fianco a fianco con il tuo team. Review settimanali, decisioni condivise, risultati tracciati.',
        },
      ],
    },
    plans: [
      {
        name: 'Advisory',
        price: 'Su misura',
        description: '2 giorni/mese',
        features: [
          'Consulenza strategica bisettimanale',
          'Review decisioni tecnologiche',
          'Partecipazione a meeting chiave',
          'Disponibilità via Slack/email',
          'Monthly tech report',
        ],
        cta: 'Richiedi preventivo',
        highlighted: false,
      },
      {
        name: 'Embedded',
        price: 'Su misura',
        description: '4 giorni/mese',
        features: [
          'Tutto Advisory incluso',
          'Partecipazione sprint planning',
          'Code review settimanali',
          'Mentoring tech lead 1:1',
          'Gestione fornitori tech',
          'Roadmap trimestrale',
          'Hiring support',
        ],
        cta: 'Parliamone',
        highlighted: true,
      },
      {
        name: 'Intensive',
        price: 'Su misura',
        description: '8 giorni/mese',
        features: [
          'Tutto Embedded incluso',
          'Presenza quasi-full-time',
          'Leadership team engineering',
          'Ristrutturazione team/processi',
          'Definizione architettura completa',
          'Due diligence tecnica',
          'Board/investor reporting',
        ],
        cta: 'Parliamone',
        highlighted: false,
      },
    ],
    pdfGuidePath: '/risorse/guida-fractional-cto',
  },
  en: {
    meta: {
      title: 'Fractional CTO',
      description:
        'Part-time CTO for startups and SMEs. Technical governance, team building, architecture, and vendor management.',
    },
    breadcrumb: 'Fractional CTO',
    hero: {
      title: 'Your CTO, without the full-time cost',
      subtitle:
        'Senior technical leadership for startups and SMEs that need governance, architectural vision, and team building — with the flexibility your growth stage requires.',
    },
    audience: {
      heading: 'Who is Fractional CTO for?',
      intro:
        'For tech-driven companies that are growing and need an experienced technical leader, but are not ready (or do not want) to hire a full-time CTO at €150K+/year.',
      cards: [
        {
          title: 'Growing startups',
          text: 'You have a working MVP but need to scale. Architecture, processes, and a structured team are required.',
        },
        {
          title: 'Digitised SMEs',
          text: 'You have developers but lack technical direction. Technical debt grows, decisions lack clear criteria.',
        },
        {
          title: 'Pre/post funding scale-ups',
          text: 'Investors asking for a tech leader. Technical due diligence. A credible roadmap for the board.',
        },
      ],
    },
    features: {
      heading: 'What I do as your Fractional CTO',
      items: [
        {
          title: 'Technical Governance',
          description:
            'Standards definition, architecture reviews, informed technology decisions. ADRs and living documentation.',
          icon: '🏛️',
        },
        {
          title: 'Team Building',
          description:
            'Hiring, onboarding, team structure. From scattered freelancers to a cohesive, productive engineering team.',
          icon: '👥',
        },
        {
          title: 'Architecture & Stack',
          description:
            'Technology choices, system design, technical debt management. Decisions with explicit trade-offs.',
          icon: '🏗️',
        },
        {
          title: 'Vendor Management',
          description:
            'Supplier evaluation, tech contract negotiation, outsourcing management. Your interests first.',
          icon: '🤝',
        },
        {
          title: 'Technology Roadmap',
          description:
            '6-12 month plan aligned with the business. Priorities, dependencies, risks, and concrete milestones.',
          icon: '🗺️',
        },
        {
          title: 'Mentoring & Coaching',
          description:
            'Growing your tech leads. 1:1 sessions, formative code reviews, structured feedback.',
          icon: '🎯',
        },
      ],
    },
    process: {
      heading: 'How it works',
      steps: [
        {
          title: 'Discovery call (free)',
          text: '30 minutes to understand your situation, challenges, and goals. No commitment.',
        },
        {
          title: 'Tech assessment (week 1)',
          text: 'I analyse code, architecture, team, and processes. I deliver a report with current state and recommendations.',
        },
        {
          title: 'Action plan (week 2)',
          text: '90-day roadmap with priorities, quick wins, and measurable goals. Aligned with the business.',
        },
        {
          title: 'Execution (ongoing)',
          text: 'I work alongside your team. Weekly reviews, shared decisions, tracked results.',
        },
      ],
    },
    plans: [
      {
        name: 'Advisory',
        price: 'Custom',
        description: '2 days/month',
        features: [
          'Bi-weekly strategic consulting',
          'Technology decision reviews',
          'Participation in key meetings',
          'Availability via Slack/email',
          'Monthly tech report',
        ],
        cta: 'Request a quote',
        highlighted: false,
      },
      {
        name: 'Embedded',
        price: 'Custom',
        description: '4 days/month',
        features: [
          'Everything in Advisory',
          'Sprint planning participation',
          'Weekly code reviews',
          '1:1 tech lead mentoring',
          'Tech vendor management',
          'Quarterly roadmap',
          'Hiring support',
        ],
        cta: "Let's talk",
        highlighted: true,
      },
      {
        name: 'Intensive',
        price: 'Custom',
        description: '8 days/month',
        features: [
          'Everything in Embedded',
          'Near full-time presence',
          'Engineering team leadership',
          'Team/process restructuring',
          'Full architecture definition',
          'Technical due diligence',
          'Board/investor reporting',
        ],
        cta: "Let's talk",
        highlighted: false,
      },
    ],
    pdfGuidePath: '/risorse/guida-fractional-cto',
  },
};

export function getFractionalCtoContent(locale: Locale): FractionalCtoContent {
  return content[locale];
}
