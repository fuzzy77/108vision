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
  audience: { heading: string; intro: string; cards: TextCard[] };
  modes: { heading: string; items: ServiceFeature[] };
  capacity: { heading: string; text: string };
  process: { heading: string; steps: HowItWorksStep[] };
  plans: ServicePlan[];
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
      title: 'Hai già un team. Ti manca chi lo guida.',
      subtitle:
        'Prendiamo in mano la direzione tecnica: strategica, operativa time-boxed, o di team building. Non slide che spariscono — decisioni e deliverable, con slot settimanali chiari.',
    },
    audience: {
      heading: 'Per chi è',
      intro:
        'Per PMI e scale-up che hanno sviluppatori ma non hanno (ancora) un riferimento tecnico solido — o ne hanno uno troppo debole rispetto alla crescita.',
      cards: [
        {
          title: 'Team senza guida',
          text: '3–10 sviluppatori, priorità confuse, debito tecnico che cresce, nessuno che firma le decisioni.',
        },
        {
          title: 'Assunzioni da strutturare',
          text: 'Devi assumere e non sai valutare stack, seniority o come organizzare ruoli e onboarding.',
        },
        {
          title: 'Alzare il livello',
          text: 'Il team c’è, ma serve code review reali, ritmo di delivery e standard che reggono la crescita.',
        },
      ],
    },
    modes: {
      heading: 'Tre modalità (si adattano al contesto)',
      items: [
        {
          title: 'Strategico',
          description:
            'Roadmap, architettura, decisioni tecnologiche, governance. Quando il team è capace e manca solo direzione.',
          icon: '🗺️',
        },
        {
          title: 'Operativo time-boxed',
          description:
            'Slot fissi: code review, pair, rituali di ritmo. Non full embed — presenza concentrata dove serve.',
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
    capacity: {
      heading: 'Ownership onesta',
      text: 'Ownership = responsabilità su decisioni e deliverable concordati, non presenza quotidiana 8 ore. Lavoriamo con ore/mese scritte in contratto — così restiamo affidabili. Se ti serve un embed full-time, ti aiutiamo a strutturare l’assunzione.',
    },
    process: {
      heading: 'Come funziona',
      steps: [
        {
          title: 'Call esplorativa',
          text: '20–30 minuti: capiamo se il problema è direzione del team (o altro). Nessun impegno.',
        },
        {
          title: 'Tech Assessment',
          text: 'Deliverable scritto: stato attuale, rischi, priorità 90 giorni, modalità e ore realistiche.',
        },
        {
          title: 'Ingaggio mensile',
          text: 'Retainer con modalità scelta e ore in contratto. Review periodiche, scope che si adatta.',
        },
      ],
    },
    plans: [
      {
        name: 'Tech Assessment',
        price: 'Entry',
        description: 'Diagnosi e piano 90 giorni — base per decidere.',
        features: [
          'Stato dello stack e del team',
          'Rischi e priorità',
          'Proposta modalità + ore',
          'Creditabile se si prosegue',
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
  },
  en: {
    meta: {
      title: 'Technical Direction',
      description:
        'Technical partner for SMEs with an in-house team: roadmap, architecture, time-boxed code review, team building. Ownership of decisions and deliverables, clear hours.',
    },
    breadcrumb: 'Technical Direction',
    hero: {
      title: 'You already have a team. You need someone to lead it.',
      subtitle:
        'We take ownership of technical direction — strategic, time-boxed operational, or team building. Not slides that disappear: decisions and deliverables, with clear weekly slots.',
    },
    audience: {
      heading: 'Who it is for',
      intro:
        'For SMEs and scale-ups that have developers but lack a solid technical lead — or have one that cannot keep up with growth.',
      cards: [
        {
          title: 'Team without direction',
          text: '3–10 developers, unclear priorities, growing tech debt, nobody signing off on decisions.',
        },
        {
          title: 'Hiring to structure',
          text: 'You need to hire and cannot assess stack, seniority, or how to organise roles and onboarding.',
        },
        {
          title: 'Raise the bar',
          text: 'The team exists, but you need real code review, delivery rhythm, and standards that scale.',
        },
      ],
    },
    modes: {
      heading: 'Three modes (adapted to context)',
      items: [
        {
          title: 'Strategic',
          description:
            'Roadmap, architecture, tech decisions, governance. When the team is capable and only direction is missing.',
          icon: '🗺️',
        },
        {
          title: 'Time-boxed operational',
          description:
            'Fixed slots: code review, pairing, delivery rituals. Not a full embed — focused presence where it matters.',
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
    capacity: {
      heading: 'Honest ownership',
      text: 'Ownership means accountability for agreed decisions and deliverables — not 8 hours a day on-site. We work with contracted hours per month so we stay reliable. If you need a full-time embed, we help you hire the right person.',
    },
    process: {
      heading: 'How it works',
      steps: [
        {
          title: 'Exploratory call',
          text: '20–30 minutes: we check whether the problem is team direction (or something else). No commitment.',
        },
        {
          title: 'Tech Assessment',
          text: 'Written deliverable: current state, risks, 90-day priorities, recommended mode and realistic hours.',
        },
        {
          title: 'Monthly engagement',
          text: 'Retainer with chosen mode and contracted hours. Periodic review; scope adapts.',
        },
      ],
    },
    plans: [
      {
        name: 'Tech Assessment',
        price: 'Entry',
        description: 'Diagnosis and 90-day plan — a basis to decide.',
        features: [
          'Stack and team state',
          'Risks and priorities',
          'Mode + hours proposal',
          'Creditable if we continue',
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
  },
};

export function getDirezioneTecnicaContent(locale: Locale): DirezioneTecnicaContent {
  return content[locale];
}
