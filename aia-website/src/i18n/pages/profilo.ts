import type { Locale } from '../config';

export type ProfiloSlug = 'full-stack-ai' | 'software-manager' | 'team-leader';

export interface ProfiloSkillArea {
  title: string;
  description: string;
}

export interface ProfiloContent {
  meta: { title: string; description: string };
  pageTitle: string;
  subtitle: string;
  forCompaniesTitle: string;
  forCompaniesText: string;
  summaryTitle: string;
  summaryText: string;
  skillAreas: ProfiloSkillArea[];
  cvTitle: string;
  cvDescription: string;
  cvButton: string;
  cvPath: string;
  contactTitle: string;
  contactSubtitle: string;
  formSubject: string;
}

const profilo: Record<Locale, Record<ProfiloSlug, ProfiloContent>> = {
  it: {
    'full-stack-ai': {
      meta: {
        title: 'Elios Scoglio — Full-Stack AI Engineer',
        description:
          'Senior engineer con 15+ anni di esperienza in architettura software e AI/ML. Specializzato in LLM engineering, RAG systems, multi-agent orchestration e piattaforme AI production-ready.',
      },
      pageTitle: 'Elios Scoglio — Full-Stack AI Engineer',
      subtitle: '108 Vision | Profilo professionale',
      forCompaniesTitle: 'Per le aziende',
      forCompaniesText:
        'Se cercate un profilo che unisce competenza full-stack solida a specializzazione AI/ML applicata, con esperienza enterprise reale su sistemi ad alta affidabilità — questo è il profilo giusto. Non un data scientist teorico, ma un engineer che porta modelli in produzione.',
      summaryTitle: 'Sintesi competenze',
      summaryText:
        'Senior engineer con 15+ anni di esperienza in architettura software e AI/ML. Specializzato in LLM engineering, RAG systems, multi-agent orchestration, e piattaforme AI production-ready. Background enterprise su sistemi mission-critical (ticketing, compliance fiscale, e-commerce). Stack: TypeScript, Python, .NET, Java, React, Node.js, PostgreSQL, Redis, Qdrant, LangChain, OpenAI/Anthropic APIs.',
      skillAreas: [
        { title: 'AI / LLM Engineering', description: 'RAG systems, multi-agent orchestration, LLM evaluation, prompt engineering, AI gateway design, cost routing.' },
        { title: 'Backend & API', description: 'TypeScript/Hono, .NET 8, Java Spring Boot, REST/gRPC, event-driven (Kafka), microservizi, resilienza (Polly, Resilience4j).' },
        { title: 'Frontend', description: 'React 19, Angular 17, Vite, Tailwind CSS, shadcn/ui. SPA enterprise su sistemi B2C e B2B ad alta concorrenza.' },
        { title: 'Data & Infra', description: 'PostgreSQL + pgvector, Redis, Qdrant, Oracle, MS SQL. Docker, Kubernetes, CI/CD GitLab, OpenTelemetry.' },
      ],
      cvTitle: 'Scarica il CV completo',
      cvDescription: 'PDF con esperienze, progetti, certificazioni e stack tecnologico dettagliato.',
      cvButton: 'Scarica PDF',
      cvPath: '/cv/Elios_Scoglio_CV_FullStackAI.pdf',
      contactTitle: 'Interessato a questo profilo?',
      contactSubtitle: 'Compila il form e ti rispondo entro 24 ore.',
      formSubject: 'Contatto profilo: Full-Stack AI Engineer',
    },
    'software-manager': {
      meta: {
        title: 'Elios Scoglio — Software & Architecture Manager',
        description:
          'Manager con responsabilità su architettura, qualità tecnica, team leadership e governance per piattaforme enterprise. 93 componenti, milioni di transazioni/anno.',
      },
      pageTitle: 'Elios Scoglio — Software & Architecture Manager',
      subtitle: '108 Vision | Profilo professionale',
      forCompaniesTitle: 'Per le aziende',
      forCompaniesText:
        'Se cercate un manager tecnico che sa fare governance architetturale senza perdere il contatto con il codice, che gestisce team e stakeholder con la stessa competenza con cui progetta sistemi distribuiti — questo è il profilo giusto. Non un PM con slide, ma un leader tecnico con ownership reale.',
      summaryTitle: 'Sintesi competenze',
      summaryText:
        'Manager con responsabilità su architettura, qualità tecnica, team leadership e governance per piattaforme enterprise (93 componenti, milioni di transazioni/anno). Esperienza in modernizzazione legacy, microservizi, DDD, event-driven architecture, DevOps/SRE, compliance (GDPR, fiscale SIAE). Gestione team cross-funzionali, vendor management, stakeholder C-level.',
      skillAreas: [
        { title: 'Governance Architetturale', description: 'ADR, fitness functions, bounded context, API-first, event-driven, microservizi vs modular monolith. Decisioni trace-abili nel tempo.' },
        { title: 'Modernizzazione Legacy', description: 'Decomposizione CORBA/C++ in microservizi Java gRPC. Anticorruption layer, strangler fig, migrazione incrementale senza downtime.' },
        { title: 'Qualità & Compliance', description: 'Code review governance, SAST/DAST in CI, GDPR/PII management, compliance fiscale SIAE, standard Eventim Group (12 pilastri).' },
        { title: 'SRE & Operatività', description: '4 Golden Signals, OpenTelemetry, Prometheus/Grafana, circuit breaker, incident response, zero-downtime deploy via tag.' },
      ],
      cvTitle: 'Scarica il CV completo',
      cvDescription: 'PDF con esperienze, progetti, certificazioni e stack tecnologico dettagliato.',
      cvButton: 'Scarica PDF',
      cvPath: '/cv/Elios_Scoglio_CV_SoftwareManager.pdf',
      contactTitle: 'Interessato a questo profilo?',
      contactSubtitle: 'Compila il form e ti rispondo entro 24 ore.',
      formSubject: 'Contatto profilo: Software & Architecture Manager',
    },
    'team-leader': {
      meta: {
        title: 'Elios Scoglio — Technical Team Leader',
        description:
          'Tech lead con esperienza nel costruire e guidare team di sviluppo (5-12 persone). Mentoring, code review, standard tecnici, CI/CD e delivery continua in ambienti Agile.',
      },
      pageTitle: 'Elios Scoglio — Technical Team Leader',
      subtitle: '108 Vision | Profilo professionale',
      forCompaniesTitle: 'Per le aziende',
      forCompaniesText:
        'Se cercate un team leader che fa crescere le persone mentre mantiene alta la qualità tecnica e la velocità di delivery — questo è il profilo giusto. Non un tech lead che scrive solo codice, ma uno che costruisce team capaci di farlo senza di lui.',
      summaryTitle: 'Sintesi competenze',
      summaryText:
        'Tech lead con esperienza nel costruire e guidare team di sviluppo (5-12 persone). Mentoring, code review, definizione standard, CI/CD, sprint planning, technical debt management. Competenze full-stack (.NET, Java, Angular, React) con focus su qualità del codice, testing strategy, e delivery continua. Esperienza in ambienti Agile (Scrum/Kanban) con autonomia decisionale.',
      skillAreas: [
        { title: 'People & Mentoring', description: '1-1 strutturati, feedback continuo, piani di crescita, onboarding tecnico, gestione conflitti, psychological safety nel team.' },
        { title: 'Qualità & Standard', description: 'Definition of Done, code review process, coding guidelines (.NET/Java/Angular), testing strategy (unit + integration + E2E), PR governance.' },
        { title: 'Delivery & Agile', description: 'Sprint planning, backlog grooming, velocity tracking, technical debt management, stima effort (best/likely/worst), retrospective facilitazione.' },
        { title: 'CI/CD & DevOps', description: 'Pipeline GitLab CI, branching strategy (GitFlow + Release Flow), deploy via tag, rollback plan, environment management (dev/test/prod).' },
      ],
      cvTitle: 'Scarica il CV completo',
      cvDescription: 'PDF con esperienze, progetti, certificazioni e stack tecnologico dettagliato.',
      cvButton: 'Scarica PDF',
      cvPath: '/cv/Elios_Scoglio_CV_TeamLeader.pdf',
      contactTitle: 'Interessato a questo profilo?',
      contactSubtitle: 'Compila il form e ti rispondo entro 24 ore.',
      formSubject: 'Contatto profilo: Technical Team Leader',
    },
  },
  en: {
    'full-stack-ai': {
      meta: {
        title: 'Elios Scoglio — Full-Stack AI Engineer',
        description:
          'Senior engineer with 15+ years in software architecture and AI/ML. Specialised in LLM engineering, RAG systems, multi-agent orchestration, and production-ready AI platforms.',
      },
      pageTitle: 'Elios Scoglio — Full-Stack AI Engineer',
      subtitle: '108 Vision | Professional profile',
      forCompaniesTitle: 'For companies',
      forCompaniesText:
        'If you need a profile combining solid full-stack skills with applied AI/ML expertise and real enterprise experience on high-reliability systems — this is the right fit. Not a theoretical data scientist, but an engineer who ships models to production.',
      summaryTitle: 'Skills summary',
      summaryText:
        'Senior engineer with 15+ years in software architecture and AI/ML. Specialised in LLM engineering, RAG systems, multi-agent orchestration, and production-ready AI platforms. Enterprise background on mission-critical systems (ticketing, fiscal compliance, e-commerce). Stack: TypeScript, Python, .NET, Java, React, Node.js, PostgreSQL, Redis, Qdrant, LangChain, OpenAI/Anthropic APIs.',
      skillAreas: [
        { title: 'AI / LLM Engineering', description: 'RAG systems, multi-agent orchestration, LLM evaluation, prompt engineering, AI gateway design, cost routing.' },
        { title: 'Backend & API', description: 'TypeScript/Hono, .NET 8, Java Spring Boot, REST/gRPC, event-driven (Kafka), microservices, resilience (Polly, Resilience4j).' },
        { title: 'Frontend', description: 'React 19, Angular 17, Vite, Tailwind CSS, shadcn/ui. Enterprise SPAs on high-concurrency B2C and B2B systems.' },
        { title: 'Data & Infra', description: 'PostgreSQL + pgvector, Redis, Qdrant, Oracle, MS SQL. Docker, Kubernetes, GitLab CI/CD, OpenTelemetry.' },
      ],
      cvTitle: 'Download full CV',
      cvDescription: 'PDF with experience, projects, certifications, and detailed tech stack.',
      cvButton: 'Download PDF',
      cvPath: '/cv/Elios_Scoglio_CV_FullStackAI.pdf',
      contactTitle: 'Interested in this profile?',
      contactSubtitle: 'Fill in the form and I will reply within 24 hours.',
      formSubject: 'Profile enquiry: Full-Stack AI Engineer',
    },
    'software-manager': {
      meta: {
        title: 'Elios Scoglio — Software & Architecture Manager',
        description:
          'Manager responsible for architecture, technical quality, team leadership, and governance on enterprise platforms. 93 components, millions of transactions per year.',
      },
      pageTitle: 'Elios Scoglio — Software & Architecture Manager',
      subtitle: '108 Vision | Professional profile',
      forCompaniesTitle: 'For companies',
      forCompaniesText:
        'If you need a technical manager who can govern architecture without losing touch with code, who leads teams and stakeholders with the same skill used to design distributed systems — this is the right fit. Not a slide-driven PM, but a technical leader with real ownership.',
      summaryTitle: 'Skills summary',
      summaryText:
        'Manager responsible for architecture, technical quality, team leadership, and governance on enterprise platforms (93 components, millions of transactions/year). Experience in legacy modernisation, microservices, DDD, event-driven architecture, DevOps/SRE, compliance (GDPR, SIAE fiscal). Cross-functional team management, vendor management, C-level stakeholders.',
      skillAreas: [
        { title: 'Architectural Governance', description: 'ADRs, fitness functions, bounded contexts, API-first, event-driven, microservices vs modular monolith. Traceable decisions over time.' },
        { title: 'Legacy Modernisation', description: 'Decomposing CORBA/C++ into Java gRPC microservices. Anti-corruption layer, strangler fig, incremental migration without downtime.' },
        { title: 'Quality & Compliance', description: 'Code review governance, SAST/DAST in CI, GDPR/PII management, SIAE fiscal compliance, Eventim Group standards (12 pillars).' },
        { title: 'SRE & Operations', description: '4 Golden Signals, OpenTelemetry, Prometheus/Grafana, circuit breaker, incident response, zero-downtime deploy via tags.' },
      ],
      cvTitle: 'Download full CV',
      cvDescription: 'PDF with experience, projects, certifications, and detailed tech stack.',
      cvButton: 'Download PDF',
      cvPath: '/cv/Elios_Scoglio_CV_SoftwareManager.pdf',
      contactTitle: 'Interested in this profile?',
      contactSubtitle: 'Fill in the form and I will reply within 24 hours.',
      formSubject: 'Profile enquiry: Software & Architecture Manager',
    },
    'team-leader': {
      meta: {
        title: 'Elios Scoglio — Technical Team Leader',
        description:
          'Tech lead experienced in building and leading development teams (5-12 people). Mentoring, code review, technical standards, CI/CD, and continuous delivery in Agile environments.',
      },
      pageTitle: 'Elios Scoglio — Technical Team Leader',
      subtitle: '108 Vision | Professional profile',
      forCompaniesTitle: 'For companies',
      forCompaniesText:
        'If you need a team leader who grows people while maintaining high technical quality and delivery speed — this is the right fit. Not a tech lead who only writes code, but one who builds teams capable of doing it without them.',
      summaryTitle: 'Skills summary',
      summaryText:
        'Tech lead experienced in building and leading development teams (5-12 people). Mentoring, code review, standards definition, CI/CD, sprint planning, technical debt management. Full-stack skills (.NET, Java, Angular, React) with focus on code quality, testing strategy, and continuous delivery. Agile environments (Scrum/Kanban) with decision autonomy.',
      skillAreas: [
        { title: 'People & Mentoring', description: 'Structured 1:1s, continuous feedback, growth plans, technical onboarding, conflict management, psychological safety in the team.' },
        { title: 'Quality & Standards', description: 'Definition of Done, code review process, coding guidelines (.NET/Java/Angular), testing strategy (unit + integration + E2E), PR governance.' },
        { title: 'Delivery & Agile', description: 'Sprint planning, backlog grooming, velocity tracking, technical debt management, effort estimation (best/likely/worst), retrospective facilitation.' },
        { title: 'CI/CD & DevOps', description: 'GitLab CI pipelines, branching strategy (GitFlow + Release Flow), tag-based deploy, rollback plan, environment management (dev/test/prod).' },
      ],
      cvTitle: 'Download full CV',
      cvDescription: 'PDF with experience, projects, certifications, and detailed tech stack.',
      cvButton: 'Download PDF',
      cvPath: '/cv/Elios_Scoglio_CV_TeamLeader.pdf',
      contactTitle: 'Interested in this profile?',
      contactSubtitle: 'Fill in the form and I will reply within 24 hours.',
      formSubject: 'Profile enquiry: Technical Team Leader',
    },
  },
};

export function getProfiloContent(slug: ProfiloSlug, locale: Locale): ProfiloContent {
  return profilo[locale][slug];
}

export function getProfiloSlugs(): ProfiloSlug[] {
  return ['full-stack-ai', 'software-manager', 'team-leader'];
}
