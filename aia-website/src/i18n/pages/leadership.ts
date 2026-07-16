import type { Locale } from '../config';
import type { BulletCompare, LocaleContent, ServiceFeature, ServicePlan } from './types';

export interface LeadershipContent {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: { title: string; subtitle: string };
  challenge: { heading: string; compare: BulletCompare };
  features: { heading: string; items: ServiceFeature[] };
  plans: ServicePlan[];
  pdfGuidePath: string;
}

const content: LocaleContent<LeadershipContent> = {
  it: {
    meta: {
      title: 'Tech Leadership',
      description:
        'Coaching per tech lead e engineering manager. Da individual contributor a leader efficace. Sessioni 1:1 e workshop team.',
    },
    breadcrumb: 'Tech Leadership',
    hero: {
      title: 'Da developer a leader: il salto non è tecnico',
      subtitle:
        'Il passaggio da individual contributor a tech lead o engineering manager è il cambiamento più difficile di una carriera tech. Non basta essere bravi tecnicamente: serve imparare un mestiere nuovo.',
    },
    challenge: {
      heading: 'La sfida della leadership tecnica',
      compare: {
        without: {
          title: 'Senza coaching',
          items: [
            'Micromanagement perché "lo faccio meglio io"',
            'Burnout da doppio ruolo (coding + leading)',
            'Team che non cresce in autonomia',
            'Conflitti irrisolti che esplodono',
            'Stakeholder frustrati dalla comunicazione',
          ],
        },
        with: {
          title: 'Con un percorso strutturato',
          items: [
            'Delegation efficace con trust crescente',
            'Focus strategico, non tattico',
            'Team autonomo e motivato',
            'Conflitti gestiti come opportunità',
            'Business alignment naturale',
          ],
        },
      },
    },
    features: {
      heading: 'Cosa lavoriamo insieme',
      items: [
        { title: 'Coaching 1:1', description: 'Sessioni bisettimanali personalizzate. Dalla gestione del tempo alla comunicazione con stakeholder non tecnici.', icon: '🎯' },
        { title: 'Workshop Team', description: 'Sessioni pratiche su feedback, decision making, conflict resolution, delegation. Per tutto il team engineering.', icon: '👥' },
        { title: 'Career Path Design', description: 'Struttura progression framework per IC e manager track. Criteri chiari, aspettative esplicite.', icon: '📈' },
        { title: 'Communication Skills', description: 'Come comunicare decisioni tecniche al business. Tradurre complessità in chiarezza per stakeholder.', icon: '💬' },
        { title: 'Engineering Culture', description: 'Costruire una cultura di ownership, qualità e miglioramento continuo. Oltre le best practice di superficie.', icon: '🌟' },
        { title: 'Conflict Resolution', description: 'Gestire tensioni team-team, tech-business, senior-junior. Framework pratici per conversazioni difficili.', icon: '🤝' },
      ],
    },
    plans: [
      {
        name: 'Coaching Individuale',
        price: 'Su misura',
        description: '6 sessioni (3 mesi)',
        features: ['6 sessioni 1:1 da 60 minuti', 'Assessment iniziale competenze', 'Piano di sviluppo personalizzato', 'Supporto via email tra sessioni', 'Risorse e framework dedicati', 'Follow-up a 30 giorni'],
        cta: 'Richiedi preventivo',
        highlighted: false,
      },
      {
        name: 'Team Leadership Program',
        price: 'Su misura',
        description: 'Workshop + coaching (3 mesi)',
        features: ['Assessment team culture', '4 workshop da mezza giornata', 'Coaching 1:1 per i leader (4 sessioni)', 'Framework e tool personalizzati', 'Action plan per ogni partecipante', 'Metriche di miglioramento', 'Report finale con raccomandazioni'],
        cta: 'Parliamone',
        highlighted: true,
      },
    ],
    pdfGuidePath: '/risorse/guida-leadership',
  },
  en: {
    meta: {
      title: 'Tech Leadership',
      description:
        'Coaching for tech leads and engineering managers. From individual contributor to effective leader. 1:1 sessions and team workshops.',
    },
    breadcrumb: 'Tech Leadership',
    hero: {
      title: 'From developer to leader: the leap is not technical',
      subtitle:
        'The transition from individual contributor to tech lead or engineering manager is the hardest change in a tech career. Being technically strong is not enough — you need to learn a new craft.',
    },
    challenge: {
      heading: 'The challenge of technical leadership',
      compare: {
        without: {
          title: 'Without coaching',
          items: [
            'Micromanagement because "I do it better myself"',
            'Burnout from dual role (coding + leading)',
            'Team that does not grow in autonomy',
            'Unresolved conflicts that explode',
            'Stakeholders frustrated by communication',
          ],
        },
        with: {
          title: 'With a structured path',
          items: [
            'Effective delegation with growing trust',
            'Strategic focus, not tactical',
            'Autonomous and motivated team',
            'Conflicts managed as opportunities',
            'Natural business alignment',
          ],
        },
      },
    },
    features: {
      heading: 'What we work on together',
      items: [
        { title: '1:1 Coaching', description: 'Personalised bi-weekly sessions. From time management to communicating with non-technical stakeholders.', icon: '🎯' },
        { title: 'Team Workshops', description: 'Practical sessions on feedback, decision making, conflict resolution, delegation. For the whole engineering team.', icon: '👥' },
        { title: 'Career Path Design', description: 'Progression framework for IC and manager tracks. Clear criteria, explicit expectations.', icon: '📈' },
        { title: 'Communication Skills', description: 'How to communicate technical decisions to the business. Translating complexity into clarity for stakeholders.', icon: '💬' },
        { title: 'Engineering Culture', description: 'Building a culture of ownership, quality, and continuous improvement. Beyond surface-level best practices.', icon: '🌟' },
        { title: 'Conflict Resolution', description: 'Managing team-team, tech-business, senior-junior tensions. Practical frameworks for difficult conversations.', icon: '🤝' },
      ],
    },
    plans: [
      {
        name: 'Individual Coaching',
        price: 'Custom',
        description: '6 sessions (3 months)',
        features: ['6 x 60-minute 1:1 sessions', 'Initial skills assessment', 'Personalised development plan', 'Email support between sessions', 'Dedicated resources and frameworks', '30-day follow-up'],
        cta: 'Request a quote',
        highlighted: false,
      },
      {
        name: 'Team Leadership Program',
        price: 'Custom',
        description: 'Workshops + coaching (3 months)',
        features: ['Team culture assessment', '4 half-day workshops', '1:1 coaching for leaders (4 sessions)', 'Personalised frameworks and tools', 'Action plan per participant', 'Improvement metrics', 'Final report with recommendations'],
        cta: "Let's talk",
        highlighted: true,
      },
    ],
    pdfGuidePath: '/risorse/guida-leadership',
  },
};

export function getLeadershipContent(locale: Locale): LeadershipContent {
  return content[locale];
}
