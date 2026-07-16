import type { Locale } from '../config';
import type { LocaleContent, PrincipleCard, ServiceFeature, ServicePlan } from './types';

export interface ArchitetturaContent {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: { title: string; subtitle: string };
  philosophy: { heading: string; quote: string; principles: PrincipleCard[] };
  features: { heading: string; items: ServiceFeature[] };
  plans: ServicePlan[];
  pdfGuidePath: string;
}

const content: LocaleContent<ArchitetturaContent> = {
  it: {
    meta: {
      title: 'Architettura Software',
      description:
        'Design review, modernizzazione legacy, microservizi, cloud-native. Architettura software per team che vogliono scalare.',
    },
    breadcrumb: 'Architettura Software',
    hero: {
      title: 'Architettura che scala con il tuo business',
      subtitle:
        'Non serve riscrivere tutto da zero. Serve capire cosa cambiare, in che ordine, e perché. Architettura come trade-off consapevoli, non come dogma tecnologico.',
    },
    philosophy: {
      heading: "Il mio approccio all'architettura",
      quote:
        "L'architettura non è scegliere il framework del momento. È capire quali qualità del sistema contano davvero per il business e fare trade-off espliciti per ottenerle.",
      principles: [
        {
          title: 'Pragmatismo prima del dogma',
          text: 'Microservizi dove servono, monolite modulare dove basta. La soluzione giusta dipende dal contesto.',
        },
        {
          title: 'Decisioni documentate',
          text: 'Ogni scelta architetturale diventa un ADR. Tra 6 mesi saprai ancora perché hai scelto così.',
        },
        {
          title: 'Evoluzione incrementale',
          text: 'Niente big bang rewrite. Strangler fig, branch by abstraction, feature flags. Un passo alla volta.',
        },
        {
          title: 'Il team al centro',
          text: "L'architettura migliore è quella che il tuo team riesce a mantenere. Cognitive load sostenibile.",
        },
      ],
    },
    features: {
      heading: 'Servizi di architettura',
      items: [
        {
          title: 'Design Review',
          description:
            'Revisione architetturale del tuo sistema attuale. Identifico rischi, debt, e opportunità di miglioramento.',
          icon: '🔍',
        },
        {
          title: 'Modernizzazione Legacy',
          description:
            'Dal monolite ai microservizi (dove ha senso). Strangler fig pattern, migrazione incrementale, zero downtime.',
          icon: '🔄',
        },
        {
          title: 'Cloud-Native Design',
          description:
            'Architetture pensate per il cloud: container, Kubernetes, serverless, event-driven. Pay-per-use reale.',
          icon: '☁️',
        },
        {
          title: 'API Design',
          description:
            'API-first approach. REST, GraphQL, gRPC. Contratti solidi, versionamento, developer experience.',
          icon: '🔌',
        },
        {
          title: 'Performance & Scalability',
          description:
            'Load testing, profiling, caching strategy, database optimization. Sistemi che reggono il carico.',
          icon: '⚡',
        },
        {
          title: 'Resilience Engineering',
          description:
            'Circuit breaker, retry, timeout, graceful degradation. Sistemi che sopravvivono ai fallimenti.',
          icon: '🛡️',
        },
      ],
    },
    plans: [
      {
        name: 'Design Review',
        price: 'Su misura',
        description: 'Una tantum',
        features: [
          'Analisi architettura attuale',
          'Code review campione',
          'Assessment technical debt',
          'Report con raccomandazioni',
          'Priority matrix (effort/impact)',
          'Call di presentazione risultati',
        ],
        cta: 'Richiedi preventivo',
        highlighted: false,
      },
      {
        name: 'Architecture Sprint',
        price: 'Su misura',
        description: 'Progetto 4-8 settimane',
        features: [
          'Design review inclusa',
          'Progettazione nuova architettura',
          'PoC implementativo',
          'ADR documentati',
          'Migration path definito',
          'Supporto implementazione team',
          'Knowledge transfer',
        ],
        cta: 'Parliamone',
        highlighted: true,
      },
    ],
    pdfGuidePath: '/risorse/guida-architettura',
  },
  en: {
    meta: {
      title: 'Software Architecture',
      description:
        'Design review, legacy modernisation, microservices, cloud-native. Software architecture for teams that want to scale.',
    },
    breadcrumb: 'Software Architecture',
    hero: {
      title: 'Architecture that scales with your business',
      subtitle:
        'You do not need to rewrite everything from scratch. You need to know what to change, in what order, and why. Architecture as conscious trade-offs, not technological dogma.',
    },
    philosophy: {
      heading: 'My approach to architecture',
      quote:
        'Architecture is not choosing the framework of the moment. It is understanding which system qualities truly matter to the business and making explicit trade-offs to achieve them.',
      principles: [
        {
          title: 'Pragmatism before dogma',
          text: 'Microservices where they are needed, modular monolith where enough. The right solution depends on context.',
        },
        {
          title: 'Documented decisions',
          text: 'Every architectural choice becomes an ADR. In 6 months you will still know why you chose that way.',
        },
        {
          title: 'Incremental evolution',
          text: 'No big-bang rewrite. Strangler fig, branch by abstraction, feature flags. One step at a time.',
        },
        {
          title: 'Team at the centre',
          text: 'The best architecture is the one your team can maintain. Sustainable cognitive load.',
        },
      ],
    },
    features: {
      heading: 'Architecture services',
      items: [
        {
          title: 'Design Review',
          description:
            'Architectural review of your current system. I identify risks, debt, and improvement opportunities.',
          icon: '🔍',
        },
        {
          title: 'Legacy Modernisation',
          description:
            'From monolith to microservices (where it makes sense). Strangler fig pattern, incremental migration, zero downtime.',
          icon: '🔄',
        },
        {
          title: 'Cloud-Native Design',
          description:
            'Cloud-first architectures: containers, Kubernetes, serverless, event-driven. Real pay-per-use.',
          icon: '☁️',
        },
        {
          title: 'API Design',
          description:
            'API-first approach. REST, GraphQL, gRPC. Solid contracts, versioning, developer experience.',
          icon: '🔌',
        },
        {
          title: 'Performance & Scalability',
          description:
            'Load testing, profiling, caching strategy, database optimisation. Systems that handle the load.',
          icon: '⚡',
        },
        {
          title: 'Resilience Engineering',
          description:
            'Circuit breaker, retry, timeout, graceful degradation. Systems that survive failures.',
          icon: '🛡️',
        },
      ],
    },
    plans: [
      {
        name: 'Design Review',
        price: 'Custom',
        description: 'One-off',
        features: [
          'Current architecture analysis',
          'Sample code review',
          'Technical debt assessment',
          'Report with recommendations',
          'Priority matrix (effort/impact)',
          'Results presentation call',
        ],
        cta: 'Request a quote',
        highlighted: false,
      },
      {
        name: 'Architecture Sprint',
        price: 'Custom',
        description: '4-8 week project',
        features: [
          'Design review included',
          'New architecture design',
          'Implementation PoC',
          'Documented ADRs',
          'Defined migration path',
          'Team implementation support',
          'Knowledge transfer',
        ],
        cta: "Let's talk",
        highlighted: true,
      },
    ],
    pdfGuidePath: '/risorse/guida-architettura',
  },
};

export function getArchitetturaContent(locale: Locale): ArchitetturaContent {
  return content[locale];
}
