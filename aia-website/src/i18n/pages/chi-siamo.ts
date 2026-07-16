import type { Locale } from '../config';
import type { LocaleContent, PrincipleCard } from './types';

export interface SkillGroup {
  title: string;
  items: string[];
}

export interface ExperienceItem {
  period: string;
  title: string;
  description: string;
}

export interface ChiSiamoContent {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: {
    founderLabel: string;
    title: string;
    subtitle: string;
    paragraphs: string[];
  };
  skills: { heading: string; groups: SkillGroup[] };
  philosophy: { heading: string; items: PrincipleCard[] };
  experience: { heading: string; items: ExperienceItem[] };
  cta: { title: string; description: string; ctaText: string };
}

const content: LocaleContent<ChiSiamoContent> = {
  it: {
    meta: {
      title: 'Chi Siamo',
      description:
        '108 Vision - Consulenza tecnologica fondata da Elios Scoglio. 15+ anni in architettura software, AI e trasformazione digitale per PMI italiane.',
    },
    breadcrumb: 'Chi Siamo',
    hero: {
      founderLabel: 'Elios Scoglio, Fondatore',
      title: '108 Vision',
      subtitle: 'Fondata da Elios Scoglio — Software Architecture Manager | AI Consultant',
      paragraphs: [
        'Da oltre 15 anni progetto e costruisco sistemi software per enterprise e PMI. Il mio lavoro quotidiano è prendere decisioni architetturali difficili su sistemi che gestiscono milioni di transazioni: ticketing, e-commerce, sistemi di compliance fiscale.',
        "Come Software & Architecture Manager per TicketOne/Eventim Italy gestisco l'evoluzione di una piattaforma che vende milioni di biglietti l'anno, con vincoli di scalabilità, sicurezza e compliance che non ammettono errori.",
        "Parallelamente, supporto PMI e startup italiane nel loro percorso tecnologico: dall'adozione dell'AI alla modernizzazione dei sistemi legacy, dal team building tecnico alla trasformazione digitale. Con lo stesso rigore che applico ai sistemi enterprise.",
      ],
    },
    skills: {
      heading: 'Competenze e specializzazioni',
      groups: [
        {
          title: 'Architettura Software',
          items: ['Microservizi, DDD, Event-Driven', '.NET, Java, Spring Boot', 'Cloud-Native, Kubernetes', 'API Design (REST, gRPC, GraphQL)'],
        },
        {
          title: 'AI & Machine Learning',
          items: ['LLM Engineering & RAG', 'Multi-Agent Systems', 'AI Strategy & Adoption', 'MLOps & Production AI'],
        },
        {
          title: 'Leadership & Management',
          items: ['Engineering Management', 'Team Topology & Structure', 'Technical Governance', 'Stakeholder Communication'],
        },
        {
          title: 'DevOps & SRE',
          items: ['CI/CD Pipeline Design', 'OpenTelemetry, Prometheus', 'Resilience Engineering', 'Infrastructure as Code'],
        },
        {
          title: 'Domain Expertise',
          items: ['Ticketing & Live Entertainment', 'E-Commerce & Payments', 'Compliance Fiscale (SIAE)', 'Pubblica Amministrazione'],
        },
        {
          title: 'Metodologie',
          items: ['Agile (Scrum, Kanban, pragmatic)', 'SOLID, Clean Architecture', 'TDD, BDD', 'ADR, Design Docs'],
        },
      ],
    },
    philosophy: {
      heading: 'Il mio approccio',
      items: [
        { title: 'Pragmatismo over dogma', text: 'La tecnologia è un mezzo, non un fine. La soluzione migliore è quella che il team riesce a mantenere e che il business riesce a sostenere.' },
        { title: 'Evidence-based decisions', text: 'Niente decisioni "a pelle". Dati, metriche, esperimenti. Se non possiamo misurarlo, dobbiamo almeno documentare l\'ipotesi.' },
        { title: 'Autonomia come obiettivo', text: 'Il mio lavoro è rendermi non indispensabile. Trasferisco conoscenza, costruisco processi, faccio crescere le persone.' },
        { title: 'Trasparenza radicale', text: 'Dico quello che penso, anche quando non è comodo. Trade-off espliciti, rischi nominati, incertezze dichiarate.' },
      ],
    },
    experience: {
      heading: 'Esperienza',
      items: [
        { period: '2020 - Presente', title: 'Software & Architecture Manager — TicketOne/Eventim Italy', description: 'Governance architetturale piattaforma ticketing (93 componenti). Modernizzazione legacy, AI adoption, team leadership.' },
        { period: '2015 - 2020', title: 'Senior Software Architect — Enterprise', description: 'Architettura microservizi, cloud migration, DDD. Sistemi ad alta disponibilità e compliance.' },
        { period: '2010 - 2015', title: 'Full-Stack Developer & Tech Lead', description: 'Sviluppo applicazioni web enterprise. Primi ruoli di leadership tecnica e mentoring.' },
      ],
    },
    cta: {
      title: 'Parliamo del tuo progetto',
      description: '30 minuti per capire come posso aiutarti. Nessun impegno, nessun pitch aggressivo.',
      ctaText: 'Prenota una call',
    },
  },
  en: {
    meta: {
      title: 'About Us',
      description:
        '108 Vision - Technology consulting founded by Elios Scoglio. 15+ years in software architecture, AI, and digital transformation for Italian SMEs.',
    },
    breadcrumb: 'About Us',
    hero: {
      founderLabel: 'Elios Scoglio, Founder',
      title: '108 Vision',
      subtitle: 'Founded by Elios Scoglio — Software Architecture Manager | AI Consultant',
      paragraphs: [
        'For over 15 years, I have designed and built software systems for enterprises and SMEs. My daily work involves making difficult architectural decisions on systems that manage millions of transactions: ticketing, e-commerce, fiscal compliance systems.',
        'As Software & Architecture Manager for TicketOne/Eventim Italy, I oversee the evolution of a platform that sells millions of tickets annually, with scalability, security, and compliance constraints that leave no room for error.',
        'In parallel, I support Italian SMEs and startups in their technological journey: from AI adoption to legacy modernization, from technical team building to digital transformation — with the same rigor I apply to enterprise systems.',
      ],
    },
    skills: {
      heading: 'Skills and specializations',
      groups: [
        { title: 'Software Architecture', items: ['Microservices, DDD, Event-Driven', '.NET, Java, Spring Boot', 'Cloud-Native, Kubernetes', 'API Design (REST, gRPC, GraphQL)'] },
        { title: 'AI & Machine Learning', items: ['LLM Engineering & RAG', 'Multi-Agent Systems', 'AI Strategy & Adoption', 'MLOps & Production AI'] },
        { title: 'Leadership & Management', items: ['Engineering Management', 'Team Topology & Structure', 'Technical Governance', 'Stakeholder Communication'] },
        { title: 'DevOps & SRE', items: ['CI/CD Pipeline Design', 'OpenTelemetry, Prometheus', 'Resilience Engineering', 'Infrastructure as Code'] },
        { title: 'Domain Expertise', items: ['Ticketing & Live Entertainment', 'E-Commerce & Payments', 'Fiscal Compliance (SIAE)', 'Public Administration'] },
        { title: 'Methodologies', items: ['Agile (Scrum, Kanban, pragmatic)', 'SOLID, Clean Architecture', 'TDD, BDD', 'ADR, Design Docs'] },
      ],
    },
    philosophy: {
      heading: 'My approach',
      items: [
        { title: 'Pragmatism over dogma', text: 'Technology is a means, not an end. The best solution is the one the team can maintain and the business can sustain.' },
        { title: 'Evidence-based decisions', text: 'No gut-feeling decisions. Data, metrics, experiments. If we cannot measure it, we must at least document the hypothesis.' },
        { title: 'Autonomy as a goal', text: 'My job is to make myself redundant. I transfer knowledge, build processes, and help people grow.' },
        { title: 'Radical transparency', text: 'I say what I think, even when it is uncomfortable. Explicit trade-offs, named risks, declared uncertainties.' },
      ],
    },
    experience: {
      heading: 'Experience',
      items: [
        { period: '2020 - Present', title: 'Software & Architecture Manager — TicketOne/Eventim Italy', description: 'Architectural governance of the ticketing platform (93 components). Legacy modernization, AI adoption, team leadership.' },
        { period: '2015 - 2020', title: 'Senior Software Architect — Enterprise', description: 'Microservices architecture, cloud migration, DDD. Systems with high availability and compliance.' },
        { period: '2010 - 2015', title: 'Full-Stack Developer & Tech Lead', description: 'Development of enterprise web applications. First roles in technical leadership and mentoring.' },
      ],
    },
    cta: {
      title: "Let's talk about your project",
      description: '30 minutes to understand how I can help you. No obligation, no aggressive pitch.',
      ctaText: 'Book a call',
    },
  },
};

export function getChiSiamoContent(locale: Locale): ChiSiamoContent {
  return content[locale];
}
