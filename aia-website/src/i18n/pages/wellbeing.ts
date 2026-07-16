import type { Locale } from '../config';
import type { LocaleContent, ServiceFeature, ServicePlan, StatCard } from './types';

export interface WellbeingContent {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: { title: string; subtitle: string };
  problem: { heading: string; stats: StatCard[]; conclusion: string };
  features: { heading: string; items: ServiceFeature[] };
  plans: ServicePlan[];
  pdfGuidePath: string;
}

const content: LocaleContent<WellbeingContent> = {
  it: {
    meta: {
      title: 'Tech Wellbeing',
      description:
        'Prevenzione burnout tech, sustainable pace, team health. Workshop e consulenza continuativa per team engineering che vogliono durare.',
    },
    breadcrumb: 'Tech Wellbeing',
    hero: {
      title: 'Team tech sani producono software migliore',
      subtitle:
        "Il burnout non è un badge d'onore. È un fallimento organizzativo. Aiuto team tech a costruire ritmi sostenibili, ambienti sicuri e performance durature.",
    },
    problem: {
      heading: 'Numeri che non puoi ignorare',
      stats: [
        { value: '62%', text: 'degli sviluppatori riporta sintomi di burnout (Stack Overflow 2024)' },
        { value: '40%', text: 'di turnover medio nei team tech con burnout non gestito' },
        { value: '6-9', text: 'mesi di stipendio: costo medio per sostituire uno sviluppatore senior' },
      ],
      conclusion:
        'Investire nel wellbeing del team non è buonismo. È strategia di retention, produttività e qualità. Un team sano produce codice migliore, più velocemente, più a lungo.',
    },
    features: {
      heading: 'Cosa offro',
      items: [
        { title: 'Burnout Prevention', description: 'Identificare i segnali prima che sia troppo tardi. Framework per sostenibilità del ritmo lavorativo.', icon: '🛡️' },
        { title: 'Sustainable Pace', description: 'Costruire un ritmo di lavoro che funziona nel lungo termine. Sprint marathon, non sprint burnout.', icon: '🏃' },
        { title: 'Team Health Check', description: 'Assessment periodico del benessere del team. Metriche qualitative e quantitative. Action plan concreto.', icon: '💚' },
        { title: 'Work-Life Integration', description: 'Non balance (impossibile), ma integration consapevole. Confini sani, flessibilità reale.', icon: '⚖️' },
        { title: 'Psychological Safety', description: 'Costruire un ambiente dove segnalare problemi non è pericoloso. Prerequisito per innovazione vera.', icon: '🌱' },
        { title: 'Manager Training', description: 'Formare i people manager a riconoscere e prevenire il malessere. One-on-one efficaci, non burocratici.', icon: '🎓' },
      ],
    },
    plans: [
      {
        name: 'Workshop',
        price: 'Su misura',
        description: 'Sessione singola (mezza giornata)',
        features: ['Workshop interattivo (4 ore)', 'Assessment team health iniziale', 'Framework pratici applicabili subito', 'Materiali e risorse per i partecipanti', 'Follow-up report'],
        cta: 'Richiedi preventivo',
        highlighted: false,
      },
      {
        name: 'Programma Continuativo',
        price: 'Su misura',
        description: 'Supporto trimestrale',
        features: ['Workshop mensile tematico', 'Team health check trimestrale', 'Coaching manager 1:1 (2 sessioni/mese)', 'Canale supporto dedicato', 'Metriche e reporting', 'Interventi correttivi tempestivi', 'Evoluzione culturale guidata'],
        cta: 'Parliamone',
        highlighted: true,
      },
    ],
    pdfGuidePath: '/risorse/guida-wellbeing',
  },
  en: {
    meta: {
      title: 'Tech Wellbeing',
      description:
        'Prevent tech burnout, promote sustainable pace, and foster team health. Workshops and ongoing consulting for engineering teams built to last.',
    },
    breadcrumb: 'Tech Wellbeing',
    hero: {
      title: 'Healthy tech teams produce better software',
      subtitle:
        "Burnout is not a badge of honor. It is an organizational failure. I help tech teams build sustainable rhythms, safe environments, and lasting performance.",
    },
    problem: {
      heading: 'Numbers you cannot ignore',
      stats: [
        { value: '62%', text: 'of developers report burnout symptoms (Stack Overflow 2024)' },
        { value: '40%', text: 'average turnover in tech teams with unmanaged burnout' },
        { value: '6-9', text: "months' salary: average cost to replace a senior developer" },
      ],
      conclusion:
        'Investing in team wellbeing is not altruism. It is a strategy for retention, productivity, and quality. A healthy team produces better code, faster, for longer.',
    },
    features: {
      heading: 'What I offer',
      items: [
        { title: 'Burnout Prevention', description: 'Identify the signs before it is too late. Frameworks for sustainable work pace.', icon: '🛡️' },
        { title: 'Sustainable Pace', description: 'Build a work rhythm that works long term. Sprint marathon, not sprint burnout.', icon: '🏃' },
        { title: 'Team Health Check', description: 'Periodic team wellbeing assessment. Qualitative and quantitative metrics. Concrete action plan.', icon: '💚' },
        { title: 'Work-Life Integration', description: 'Not balance (impossible), but conscious integration. Healthy boundaries, real flexibility.', icon: '⚖️' },
        { title: 'Psychological Safety', description: 'Build an environment where reporting problems is safe. A prerequisite for real innovation.', icon: '🌱' },
        { title: 'Manager Training', description: 'Train people managers to recognize and prevent distress. Effective, non-bureaucratic one-on-ones.', icon: '🎓' },
      ],
    },
    plans: [
      {
        name: 'Workshop',
        price: 'Custom',
        description: 'Single session (half-day)',
        features: ['Interactive workshop (4 hours)', 'Initial team health assessment', 'Practical frameworks you can apply immediately', 'Materials and resources for participants', 'Follow-up report'],
        cta: 'Request a quote',
        highlighted: false,
      },
      {
        name: 'Continuous Program',
        price: 'Custom',
        description: 'Quarterly support',
        features: ['Monthly thematic workshop', 'Quarterly team health check', 'Manager 1:1 coaching (2 sessions/month)', 'Dedicated support channel', 'Metrics and reporting', 'Timely corrective interventions', 'Guided cultural evolution'],
        cta: "Let's talk",
        highlighted: true,
      },
    ],
    pdfGuidePath: '/risorse/guida-wellbeing',
  },
};

export function getWellbeingContent(locale: Locale): WellbeingContent {
  return content[locale];
}
