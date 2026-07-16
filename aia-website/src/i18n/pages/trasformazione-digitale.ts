import type { Locale } from '../config';
import type { LocaleContent, ServiceFeature, ServicePlan, StatCard } from './types';

export interface TrasformazioneDigitaleContent {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: { title: string; subtitle: string };
  why: { heading: string; intro: string; stats: StatCard[] };
  features: { heading: string; items: ServiceFeature[] };
  plans: ServicePlan[];
  pdfGuidePath: string;
}

const content: LocaleContent<TrasformazioneDigitaleContent> = {
  it: {
    meta: {
      title: 'Trasformazione Digitale',
      description:
        'Digitalizzazione processi, automazione, cloud migration per PMI. Focus su ROI misurabile e risultati concreti.',
    },
    breadcrumb: 'Trasformazione Digitale',
    hero: {
      title: 'Digitalizza con un piano, non con la speranza',
      subtitle:
        'Trasformazione digitale per PMI manifatturiere e di servizi. Non vendiamo tecnologia: costruiamo efficienza misurabile. Ogni euro investito deve tornare.',
    },
    why: {
      heading: 'Perché trasformarsi ora',
      intro:
        'Il 60% delle PMI italiane ha processi ancora basati su carta, Excel e comunicazioni informali. Ogni giorno di ritardo è efficienza persa, errori evitabili e opportunità mancate.',
      stats: [
        { value: '-40%', text: 'Riduzione tempi operativi medi dopo digitalizzazione processi core' },
        { value: '-60%', text: 'Riduzione errori manuali con automazione workflow' },
        { value: '6-12', text: "Mesi per ROI positivo sull'investimento in trasformazione" },
      ],
    },
    features: {
      heading: 'Aree di intervento',
      items: [
        { title: 'Process Mapping', description: 'Mappiamo i tuoi processi attuali, identifichiamo colli di bottiglia e opportunità di automazione.', icon: '🗺️' },
        { title: 'Automazione Intelligente', description: 'RPA, workflow digitali, integrazioni API. Eliminiamo il lavoro manuale ripetitivo.', icon: '⚙️' },
        { title: 'Cloud Migration', description: 'Da on-premise a cloud, con strategia lift-and-shift o cloud-native. Sicurezza e compliance garantite.', icon: '☁️' },
        { title: 'Data Strategy', description: 'Dati sparsi in Excel e silos? Li centralizziamo in un sistema che genera insight azionabili.', icon: '📊' },
        { title: 'Digital Workplace', description: 'Strumenti di collaborazione, knowledge management, comunicazione interna. Produttività del team.', icon: '💻' },
        { title: 'ROI Tracking', description: "Ogni intervento ha KPI definiti. Misuriamo il ritorno sull'investimento in modo trasparente.", icon: '📈' },
      ],
    },
    plans: [
      {
        name: 'Assessment',
        price: 'Su misura',
        description: 'Analisi e piano',
        features: ['Mapping processi as-is', 'Gap analysis digitale', 'Identificazione quick wins', 'Roadmap trasformazione', 'Business case con ROI atteso', 'Report executive'],
        cta: 'Richiedi preventivo',
        highlighted: false,
      },
      {
        name: 'Trasformazione',
        price: 'Su misura',
        description: 'Implementazione completa',
        features: ['Assessment incluso', 'Implementazione soluzioni', 'Migrazione e integrazioni', 'Formazione utenti', 'Change management', 'Supporto 3 mesi post-go-live', 'Documentazione e procedure'],
        cta: 'Parliamone',
        highlighted: true,
      },
    ],
    pdfGuidePath: '/risorse/guida-trasformazione-digitale',
  },
  en: {
    meta: {
      title: 'Digital Transformation',
      description:
        'Process digitisation, automation, cloud migration for SMEs. Focus on measurable ROI and concrete results.',
    },
    breadcrumb: 'Digital Transformation',
    hero: {
      title: 'Digitise with a plan, not with hope',
      subtitle:
        'Digital transformation for manufacturing and service SMEs. We do not sell technology: we build measurable efficiency. Every euro invested must pay back.',
    },
    why: {
      heading: 'Why transform now',
      intro:
        '60% of Italian SMEs still run processes on paper, Excel, and informal communication. Every day of delay is lost efficiency, avoidable errors, and missed opportunities.',
      stats: [
        { value: '-40%', text: 'Average reduction in operational time after core process digitisation' },
        { value: '-60%', text: 'Reduction in manual errors with workflow automation' },
        { value: '6-12', text: 'Months to positive ROI on transformation investment' },
      ],
    },
    features: {
      heading: 'Areas of intervention',
      items: [
        { title: 'Process Mapping', description: 'We map your current processes, identify bottlenecks and automation opportunities.', icon: '🗺️' },
        { title: 'Intelligent Automation', description: 'RPA, digital workflows, API integrations. We eliminate repetitive manual work.', icon: '⚙️' },
        { title: 'Cloud Migration', description: 'From on-premise to cloud, with lift-and-shift or cloud-native strategy. Security and compliance guaranteed.', icon: '☁️' },
        { title: 'Data Strategy', description: 'Data scattered in Excel and silos? We centralise it in a system that generates actionable insights.', icon: '📊' },
        { title: 'Digital Workplace', description: 'Collaboration tools, knowledge management, internal communication. Team productivity.', icon: '💻' },
        { title: 'ROI Tracking', description: 'Every intervention has defined KPIs. We measure return on investment transparently.', icon: '📈' },
      ],
    },
    plans: [
      {
        name: 'Assessment',
        price: 'Custom',
        description: 'Analysis and plan',
        features: ['As-is process mapping', 'Digital gap analysis', 'Quick wins identification', 'Transformation roadmap', 'Business case with expected ROI', 'Executive report'],
        cta: 'Request a quote',
        highlighted: false,
      },
      {
        name: 'Transformation',
        price: 'Custom',
        description: 'Full implementation',
        features: ['Assessment included', 'Solution implementation', 'Migration and integrations', 'User training', 'Change management', '3 months post-go-live support', 'Documentation and procedures'],
        cta: "Let's talk",
        highlighted: true,
      },
    ],
    pdfGuidePath: '/risorse/guida-trasformazione-digitale',
  },
};

export function getTrasformazioneDigitaleContent(locale: Locale): TrasformazioneDigitaleContent {
  return content[locale];
}
