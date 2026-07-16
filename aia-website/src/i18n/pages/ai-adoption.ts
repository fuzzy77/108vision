import type { Locale } from '../config';
import type {
  BulletCompare,
  LocaleContent,
  ProcessStep,
  ServiceFeature,
  ServicePlan,
} from './types';

export interface AiAdoptionContent {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: { title: string; subtitle: string };
  dilemma: { heading: string; intro: string; compare: BulletCompare };
  process: { heading: string; steps: ProcessStep[] };
  features: { heading: string; items: ServiceFeature[] };
  plans: ServicePlan[];
  pdfGuidePath: string;
}

const content: LocaleContent<AiAdoptionContent> = {
  it: {
    meta: {
      title: 'AI Adoption',
      description:
        "Percorso strutturato per adottare l'AI in azienda. Assessment, strategia, implementazione e formazione. Risultati misurabili.",
    },
    breadcrumb: 'AI Adoption',
    hero: {
      title: "Adotta l'AI senza rischi",
      subtitle:
        "Un percorso strutturato per portare l'intelligenza artificiale nella tua azienda. Partiamo dal piccolo, misuriamo i risultati, poi scaliamo. Nessun salto nel vuoto.",
    },
    dilemma: {
      heading: "Il dilemma dell'AI nelle PMI",
      intro:
        "Sai che l'AI può trasformare il tuo business. Ma da dove iniziare? Quali strumenti? Quanto budget? Il rischio di investire nel progetto sbagliato paralizza la decisione. Nel frattempo i competitor avanzano.",
      compare: {
        without: {
          title: 'Senza guida',
          items: [
            'Progetti AI che falliscono nel 70% dei casi',
            'Budget bruciato in sperimentazioni senza focus',
            'Team confuso e resistente al cambiamento',
            'Nessun ROI misurabile dopo 6-12 mesi',
          ],
        },
        with: {
          title: 'Con il percorso guidato',
          items: [
            'Primo risultato in 4-6 settimane',
            'Investimento proporzionale ai risultati',
            'Team formato e autonomo',
            'ROI documentato e scalabile',
          ],
        },
      },
    },
    process: {
      heading: 'Il percorso in 4 fasi',
      steps: [
        { title: 'Discover', text: 'Assessment processi, dati, team. Identifichiamo le opportunità ad alto impatto.' },
        { title: 'Design', text: 'Strategia, selezione tool, definizione KPI e piano di implementazione.' },
        { title: 'Deliver', text: "Pilot su caso d'uso prioritario. Risultati concreti in 4-6 settimane." },
        { title: 'Scale', text: 'Dal pilot al roll-out. Formazione, governance, evoluzione continua.' },
      ],
    },
    features: {
      heading: 'Cosa include il percorso',
      items: [
        { title: 'Assessment AI Readiness', description: 'Valutiamo la maturità digitale della tua azienda e identifichiamo le opportunità AI a maggior impatto.', icon: '🔍' },
        { title: 'Strategia AI Personalizzata', description: 'Roadmap concreta con priorità, tempi e budget. Niente slide generiche: azioni eseguibili.', icon: '🗺️' },
        { title: 'Pilot & Proof of Concept', description: "Implementiamo il primo caso d'uso AI in 4-6 settimane. Risultati misurabili prima di scalare.", icon: '🧪' },
        { title: 'Formazione Team', description: 'Il tuo team impara a usare e gestire gli strumenti AI. Autonomia, non dipendenza dal consulente.', icon: '🎓' },
        { title: 'Change Management', description: "Accompagniamo le persone nel cambiamento. L'AI funziona solo se il team la adotta davvero.", icon: '🤝' },
        { title: 'Scaling Plan', description: 'Dal pilot al roll-out completo. Metriche, governance, evoluzione continua della strategia AI.', icon: '📈' },
      ],
    },
    plans: [
      {
        name: 'Assessment',
        price: 'Su misura',
        description: 'Capire dove sei e dove andare',
        features: ['Analisi processi aziendali', 'Mapping opportunità AI', 'AI Readiness Score', 'Roadmap prioritizzata', 'Report executive (20+ pagine)', 'Presentazione al management'],
        cta: 'Richiedi preventivo',
        highlighted: false,
      },
      {
        name: 'Full Adoption',
        price: 'Su misura',
        description: 'Dal pilot alla produzione',
        features: ['Assessment completo incluso', 'Implementazione primo pilot', 'Formazione team (16 ore)', 'Change management', 'Supporto 3 mesi post-lancio', 'KPI e dashboard risultati', 'Scaling plan documentato'],
        cta: 'Parliamone',
        highlighted: true,
      },
    ],
    pdfGuidePath: '/risorse/guida-ai-pmi',
  },
  en: {
    meta: {
      title: 'AI Adoption',
      description:
        'Structured path to adopt AI in your company. Assessment, strategy, implementation, and training. Measurable results.',
    },
    breadcrumb: 'AI Adoption',
    hero: {
      title: 'Adopt AI without the risk',
      subtitle:
        'A structured path to bring artificial intelligence into your company. Start small, measure results, then scale. No leap in the dark.',
    },
    dilemma: {
      heading: 'The AI dilemma for SMEs',
      intro:
        'You know AI can transform your business. But where do you start? Which tools? What budget? The risk of investing in the wrong project paralyses the decision. Meanwhile competitors move ahead.',
      compare: {
        without: {
          title: 'Without guidance',
          items: [
            'AI projects fail 70% of the time',
            'Budget burned on unfocused experiments',
            'Confused team resistant to change',
            'No measurable ROI after 6-12 months',
          ],
        },
        with: {
          title: 'With a guided path',
          items: [
            'First result in 4-6 weeks',
            'Investment proportional to results',
            'Trained and autonomous team',
            'Documented and scalable ROI',
          ],
        },
      },
    },
    process: {
      heading: 'The 4-phase path',
      steps: [
        { title: 'Discover', text: 'Process, data, and team assessment. We identify high-impact opportunities.' },
        { title: 'Design', text: 'Strategy, tool selection, KPI definition, and implementation plan.' },
        { title: 'Deliver', text: 'Pilot on priority use case. Concrete results in 4-6 weeks.' },
        { title: 'Scale', text: 'From pilot to roll-out. Training, governance, continuous evolution.' },
      ],
    },
    features: {
      heading: 'What the path includes',
      items: [
        { title: 'AI Readiness Assessment', description: 'We assess your digital maturity and identify the highest-impact AI opportunities.', icon: '🔍' },
        { title: 'Tailored AI Strategy', description: 'Concrete roadmap with priorities, timelines, and budget. No generic slides — executable actions.', icon: '🗺️' },
        { title: 'Pilot & Proof of Concept', description: 'We implement the first AI use case in 4-6 weeks. Measurable results before scaling.', icon: '🧪' },
        { title: 'Team Training', description: 'Your team learns to use and manage AI tools. Autonomy, not consultant dependency.', icon: '🎓' },
        { title: 'Change Management', description: 'We support people through change. AI only works if the team truly adopts it.', icon: '🤝' },
        { title: 'Scaling Plan', description: 'From pilot to full roll-out. Metrics, governance, continuous AI strategy evolution.', icon: '📈' },
      ],
    },
    plans: [
      {
        name: 'Assessment',
        price: 'Custom',
        description: 'Understand where you are and where to go',
        features: ['Business process analysis', 'AI opportunity mapping', 'AI Readiness Score', 'Prioritised roadmap', 'Executive report (20+ pages)', 'Management presentation'],
        cta: 'Request a quote',
        highlighted: false,
      },
      {
        name: 'Full Adoption',
        price: 'Custom',
        description: 'From pilot to production',
        features: ['Full assessment included', 'First pilot implementation', 'Team training (16 hours)', 'Change management', '3 months post-launch support', 'KPI and results dashboard', 'Documented scaling plan'],
        cta: "Let's talk",
        highlighted: true,
      },
    ],
    pdfGuidePath: '/risorse/guida-ai-pmi',
  },
};

export function getAiAdoptionContent(locale: Locale): AiAdoptionContent {
  return content[locale];
}
