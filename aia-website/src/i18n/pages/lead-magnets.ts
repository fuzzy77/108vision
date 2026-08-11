import type { Locale } from '../config';

export interface LeadMagnetContent {
  title: string;
  description: string;
  pdfSlug: string;
  heroTitle: string;
  heroSubtitle: string;
  bullets: string[];
}

export interface GuideIndexItem {
  slug: string;
  title: string;
  description: string;
  tag: string;
  category: 'direzione-tecnica' | 'software-in-mano' | 'approfondimenti';
}

export interface RisorseIndexContent {
  meta: { title: string; description: string };
  eyebrow: string;
  heading: string;
  subheading: string;
  downloadCta: string;
  cta: { title: string; description: string; ctaText: string };
  breadcrumb: string;
  categoryTitles: Record<GuideIndexItem['category'], string>;
  guides: GuideIndexItem[];
}

export interface GrazieContent {
  meta: { title: string; description: string };
  heading: string;
  subheading: string;
  autoDownload: string;
  downloadButton: string;
  followUpTitle: string;
  followUpItems: string[];
  pdfTitles: Record<string, string>;
}

const magnets: Record<Locale, Record<string, LeadMagnetContent>> = {
  it: {
  "guida-agile-devops": {
    "title": "Guida Agile & DevOps",
    "description": "Agile pragmatico e delivery continua senza dogma. CI/CD pipeline, sprint structure, metriche che contano.",
    "pdfSlug": "agile-devops",
    "heroTitle": "Agile pragmatico: delivery continua senza dogma",
    "heroSubtitle": "Non Agile da manuale Scrum. Quello che funziona nelle PMI italiane: consegnare valore velocemente con un team piccolo e budget reale.",
    "bullets": [
      "CI/CD pipeline: come pianificare un'adozione incrementale",
      "Struttura sprint che non spreca tempo in cerimonie inutili",
      "4 metriche che contano davvero (e 6 da ignorare)",
      "Kanban vs Scrum: come scegliere per il tuo contesto",
      "Deploy frequency: come passare da mensile a quotidiano"
    ]
  },
  "guida-ai-pmi": {
    "title": "Guida AI Adoption per PMI",
    "description": "Framework pratico per adottare l'AI nella tua PMI. Checklist, criteri di valutazione ed errori da evitare.",
    "pdfSlug": "ai-adoption",
    "heroTitle": "Come adottare l'AI nella tua PMI senza bruciare budget",
    "heroSubtitle": "Una guida pratica per valutare opportunità, rischi e priorità prima di investire in AI.",
    "bullets": [
      "Framework AI Readiness Assessment in 5 step",
      "7 errori ricorrenti da evitare nelle PMI",
      "Checklist operativa per il primo progetto AI",
      "Schema per definire metriche e verificare il ROI",
      "Template per proposta al management"
    ]
  },
  "guida-architettura": {
    "title": "Guida Scaling Architetturale",
    "description": "Come scalare la tua architettura software senza riscrivere tutto. Modular monolith, bounded contexts, fitness functions.",
    "pdfSlug": "architettura",
    "heroTitle": "Scalare senza riscrivere: guida all'architettura evolutiva",
    "heroSubtitle": "Il metodo per far crescere il tuo sistema software in modo sostenibile — senza big bang rewrite e senza bloccare il business.",
    "bullets": [
      "Modular monolith vs microservizi: quando scegliere cosa",
      "Bounded context: come trovare i confini giusti nel tuo dominio",
      "Fitness functions: come verificare le regole architetturali",
      "Strategia di migrazione dal legacy in step incrementali",
      "Architecture Decision Records (ADR): template pronto all'uso"
    ]
  },
  "guida-compliance-ai": {
    "title": "Guida Compliance EU AI Act",
    "description": "Come orientarsi negli obblighi dell'EU AI Act. Classificazione del rischio, documentazione e scadenze applicabili.",
    "pdfSlug": "compliance-ai-act",
    "heroTitle": "EU AI Act: come orientarsi tra obblighi e scadenze",
    "heroSubtitle": "L'AI Act è legge. Non è un problema per il futuro. Questa guida ti dice esattamente cosa devi fare, in quale ordine e entro quando.",
    "bullets": [
      "Classificazione del rischio: dove si posizionano i tuoi sistemi AI",
      "Pratiche vietate: cosa devi fermare subito",
      "Documentazione obbligatoria: il minimo indispensabile per essere compliant",
      "Timeline 2024-2026: le scadenze che non puoi ignorare",
      "Quick compliance check: autovalutazione in 10 domande"
    ]
  },
  "guida-data-analytics": {
    "title": "Guida Data & Analytics per PMI",
    "description": "Come trasformare i dati aziendali in decisioni. Data audit, KPI framework, BI tools, data culture.",
    "pdfSlug": "data-analytics",
    "heroTitle": "Da dati a decisioni: analytics per PMI italiane",
    "heroSubtitle": "La tua azienda ha dati ovunque ma fatica a usarli per decidere. Questa guida propone un percorso concreto per costruire una cultura del dato.",
    "bullets": [
      "Data audit: dove sono i tuoi dati e quanto valgono",
      "KPI framework: scegliere le 5 metriche che contano davvero",
      "Visualizzazione: dashboard che il management capisce e usa",
      "BI tools per PMI italiane: confronto costi e capacità",
      "Data culture: come far diventare i dati un abito mentale del team"
    ]
  },
  "guida-digital-starter": {
    "title": "Guida Digital Starter",
    "description": "Il primo progetto digitale per chi parte da zero. MVP mindset, vendor selection, budget planning, no-code options.",
    "pdfSlug": "digital-starter",
    "heroTitle": "Il primo progetto digitale: guida per chi parte da zero",
    "heroSubtitle": "Non hai un team tech interno. Non sai da dove iniziare. Questa guida ti porta dal 'voglio digitalizzare' al primo sistema funzionante in 30 giorni.",
    "bullets": [
      "MVP mindset: come costruire il minimo che porta valore",
      "Come valutare e scegliere un fornitore software senza farsi fregare",
      "Budget planning: quanto costa davvero un progetto digitale",
      "No-code options: cosa puoi fare senza sviluppatori",
      "Piano dei primi 30 giorni dalla decisione al go-live"
    ]
  },
  "guida-factory": {
    "title": "Guida al Retainer evolutivo",
    "description": "Come governare un rapporto continuativo per far evolvere il software. Capacità, livelli di servizio, trasferimento di conoscenza ed exit strategy.",
    "pdfSlug": "factory",
    "heroTitle": "Retainer evolutivo: far crescere il software senza perdere il controllo",
    "heroSubtitle": "Una guida per impostare un rapporto continuativo con responsabilità, capacità mensile e decisioni chiare.",
    "bullets": [
      "Modelli di team: dedicated, shared, staff augmentation — differenze reali",
      "SLA operativi: cosa misurare e come scriverlo nel contratto",
      "Knowledge transfer: come evitare che la conoscenza rimanga fuori",
      "Governance quotidiana: cerimonie, report, decision authority",
      "Exit strategy: come rientrare il controllo senza disastri"
    ]
  },
  "guida-fractional-cto": {
    "title": "Guida alla Direzione Tecnica",
    "description": "Quando e perché serve una Direzione Tecnica. Governance, gestione fornitori e crescita del team per PMI.",
    "pdfSlug": "fractional-cto",
    "heroTitle": "Quando (e perché) serve una Direzione Tecnica",
    "heroSubtitle": "La guida pratica per capire se alla tua azienda manca una guida tecnica e come definire un ingaggio sostenibile.",
    "bullets": [
      "Framework per valutare se ti serve una Direzione Tecnica",
      "Governance tecnica: cosa gestisce, cosa non gestisce",
      "Come scalare il team senza sbagliare il primo hire",
      "Vendor management: come non farti gestire dai fornitori",
      "Red flag da evitare nel processo di selezione"
    ]
  },
  "guida-leadership": {
    "title": "Guida Tech Leadership",
    "description": "Come fare tech leadership senza burocrazia. Autonomia del team, 1:1 framework, hiring, performance culture.",
    "pdfSlug": "leadership",
    "heroTitle": "Tech Leadership senza burocrazia",
    "heroSubtitle": "La guida operativa per chi guida team tecnici: come costruire autonomia, mantenere la qualità e far crescere le persone senza microgestire.",
    "bullets": [
      "Framework per delegare senza perdere il controllo",
      "Template 1:1 settimanale che funziona davvero",
      "5 segnali che stai assumendo la persona sbagliata",
      "Performance culture: come misurare senza demotivare",
      "Knowledge sharing: come non dipendere dall'eroe solitario"
    ]
  },
  "guida-nocode": {
    "title": "Guida No-Code Automation per PMI",
    "description": "Come automatizzare i processi aziendali senza codice. Process mapping, tool selection, integration patterns, ROI.",
    "pdfSlug": "nocode-automation",
    "heroTitle": "Automatizzare senza codice: guida No-Code per PMI",
    "heroSubtitle": "Molti processi ripetitivi possono essere automatizzati con strumenti no-code. Questa guida ti aiuta a capire quali e come.",
    "bullets": [
      "Process mapping: identifica i processi automatizzabili in un pomeriggio",
      "Tool selection: confronto Make, Zapier, n8n, Power Automate per PMI italiane",
      "Integration patterns: come collegare i tuoi software senza API",
      "Calcolo ROI: template per giustificare l'investimento al management",
      "Quando smettere di usare no-code e passare allo sviluppo custom"
    ]
  },
  "guida-pa": {
    "title": "Guida PA Digitale",
    "description": "Innovare nella Pubblica Amministrazione italiana. PNRR, procurement, interoperabilità, SPID/CIE, compliance.",
    "pdfSlug": "pubblica-amministrazione",
    "heroTitle": "Tecnologia per la PA: innovare nella complessità",
    "heroSubtitle": "La guida tecnica per chi lavora con o dentro la Pubblica Amministrazione italiana e vuole portare innovazione reale — non solo slide.",
    "bullets": [
      "Opportunità PNRR: come valutare fondi e requisiti applicabili",
      "Procurement PA: come navigare il Codice degli Appalti per soluzioni tech",
      "Interoperabilità: come integrare i sistemi della PA con i propri",
      "SPID e CIE: integrazione pratica nei servizi digitali",
      "Framework di compliance: GDPR, AgID, CAD applicati ai progetti concreti"
    ]
  },
  "guida-sviluppo-progetto": {
    "title": "Guida Sviluppo Progetto a Scope Fisso",
    "description": "Come gestire un progetto software a prezzo fisso senza sorprese. Requirements, milestone, acceptance criteria, contratti.",
    "pdfSlug": "sviluppo-progetto",
    "heroTitle": "Progetto software a scope fisso: come non farsi fregare",
    "heroSubtitle": "La guida per chi commissiona un progetto software e vuole sapere esattamente cosa sta comprando — prima di firmare.",
    "bullets": [
      "Come scrivere requisiti che proteggono sia te che il fornitore",
      "Milestone e deliverable: come strutturarli in modo vincolante",
      "Acceptance criteria: come evitare il \"non è quello che intendevo\"",
      "Modelli contrattuali: T&M vs fixed price vs time-boxed",
      "8 red flag che segnalano un fornitore da evitare"
    ]
  },
  "guida-trasformazione-digitale": {
    "title": "Guida Trasformazione Digitale",
    "description": "Un metodo operativo per la trasformazione digitale nelle PMI italiane. Metriche di risultato, integrazione legacy e change management.",
    "pdfSlug": "trasformazione-digitale",
    "heroTitle": "Trasformazione digitale per PMI: il metodo che funziona",
    "heroSubtitle": "Non trasformazione digitale da slide: un percorso concreto, con budget reale, priorità e risultati misurabili.",
    "bullets": [
      "Framework per definire e verificare il ROI",
      "Come integrare i gestionali italiani (TeamSystem, Mexal, Fatture in Cloud)",
      "Change management: convincere le persone, non solo i processi",
      "Process mapping: trovare i quick win nascosti",
      "Piano di 6 settimane dalla diagnosi ai primi risultati"
    ]
  },
  "guida-wellbeing": {
    "title": "Guida Tech Wellbeing",
    "description": "Come prevenire il burnout nel team tech. Segnali precoci, sustainable pace, retention framework.",
    "pdfSlug": "wellbeing",
    "heroTitle": "Prevenire il burnout tech: guida per manager",
    "heroSubtitle": "Il burnout ha costi umani e operativi spesso invisibili. Questa guida aiuta a riconoscerlo prima e a prevenirlo con sistemi concreti.",
    "bullets": [
      "15 segnali precoci di burnout che i manager ignorano",
      "Sustainable pace: come misurare la velocità sostenibile del team",
      "Retention framework: cosa tiene le persone (non è lo stipendio)",
      "Team health metrics: 3 indicatori da monitorare ogni settimana",
      "Script per 1:1 focalizzati sul benessere reale"
    ]
  }
},
  en: {
  "guida-agile-devops": {
    "title": "Agile & DevOps Guide",
    "description": "Pragmatic Agile and continuous delivery without dogma. CI/CD pipeline, sprint structure, metrics that matter.",
    "heroTitle": "Pragmatic Agile: continuous delivery without dogma",
    "heroSubtitle": "Not textbook Scrum Agile. What works in Italian SMEs: delivering value fast with a small team and a real budget.",
    "bullets": [
      "CI/CD pipeline: planning an incremental adoption",
      "Sprint structure that does not waste time on useless ceremonies",
      "4 metrics that really matter (and 6 to ignore)",
      "Kanban vs Scrum: how to choose for your context",
      "Deploy frequency: moving from monthly to daily"
    ],
    "pdfSlug": "agile-devops"
  },
  "guida-ai-pmi": {
    "title": "AI Adoption Guide for SMEs",
    "description": "Practical framework to adopt AI in your SME. Checklists, evaluation criteria, and mistakes to avoid.",
    "heroTitle": "How to adopt AI in your SME without burning budget",
    "heroSubtitle": "A practical guide to assess opportunities, risks, and priorities before investing in AI.",
    "bullets": [
      "AI Readiness Assessment framework in 5 steps",
      "7 recurring mistakes SMEs should avoid",
      "Operational checklist for your first AI project",
      "A framework for defining metrics and validating ROI",
      "Template for a management proposal"
    ],
    "pdfSlug": "ai-adoption"
  },
  "guida-architettura": {
    "title": "Architectural Scaling Guide",
    "description": "How to scale your software architecture without rewriting everything. Modular monolith, bounded contexts, fitness functions.",
    "heroTitle": "Scale without rewriting: evolutionary architecture guide",
    "heroSubtitle": "The method to grow your software system sustainably — without a big-bang rewrite or blocking the business.",
    "bullets": [
      "Modular monolith vs microservices: when to choose what",
      "Bounded context: finding the right boundaries in your domain",
      "Fitness functions: verifying architectural rules",
      "Incremental legacy migration strategy",
      "Architecture Decision Records (ADR): ready-to-use template"
    ],
    "pdfSlug": "architettura"
  },
  "guida-compliance-ai": {
    "title": "EU AI Act Compliance Guide",
    "description": "How to navigate EU AI Act obligations. Risk classification, documentation, and applicable deadlines.",
    "heroTitle": "EU AI Act: navigating obligations and deadlines",
    "heroSubtitle": "The AI Act is law. It is not a future problem. This guide tells you exactly what to do, in which order, and by when.",
    "bullets": [
      "Risk classification: where your AI systems sit",
      "Prohibited practices: what you must stop immediately",
      "Mandatory documentation: the minimum to be compliant",
      "2024-2026 timeline: deadlines you cannot ignore",
      "Quick compliance check: self-assessment in 10 questions"
    ],
    "pdfSlug": "compliance-ai-act"
  },
  "guida-data-analytics": {
    "title": "Data & Analytics Guide for SMEs",
    "description": "How to turn business data into decisions. Data audit, KPI framework, BI tools, data culture.",
    "heroTitle": "From data to decisions: analytics for Italian SMEs",
    "heroSubtitle": "Your company has data everywhere but struggles to use it for decisions. This guide offers a practical path towards a data culture.",
    "bullets": [
      "Data audit: where your data is and what it is worth",
      "KPI framework: choosing the 5 metrics that really matter",
      "Visualisation: dashboards management understands and uses",
      "BI tools for Italian SMEs: cost and capability comparison",
      "Data culture: making data a mental habit for the team"
    ],
    "pdfSlug": "data-analytics"
  },
  "guida-digital-starter": {
    "title": "Digital Starter Guide",
    "description": "The first digital project for those starting from zero. MVP mindset, vendor selection, budget planning, no-code options.",
    "heroTitle": "The first digital project: guide for those starting from zero",
    "heroSubtitle": "You have no internal tech team and do not know where to start. This guide takes you from \"I want to digitise\" to a practical first delivery plan.",
    "bullets": [
      "MVP mindset: building the minimum that delivers value",
      "How to evaluate and choose a software vendor without getting burned",
      "Budget planning: realistic costs for your first project",
      "No-code options: when they are enough and when they are not",
      "30-day plan: week-by-week operational roadmap"
    ],
    "pdfSlug": "digital-starter"
  },
  "guida-factory": {
    "title": "Evolution Retainer Guide",
    "description": "How to govern an ongoing relationship that evolves your software. Capacity, service levels, knowledge transfer, and exit strategy.",
    "heroTitle": "Evolution retainer: grow your software without losing control",
    "heroSubtitle": "A guide to setting up an ongoing relationship with clear accountability, monthly capacity, and decisions.",
    "bullets": [
      "Team models: dedicated, shared, staff augmentation — real differences",
      "Operational SLAs: what to measure and how to write it in the contract",
      "Knowledge transfer: keeping IP and know-how in-house",
      "Daily governance: rituals, metrics, and escalation paths",
      "Exit strategy: how to end the engagement without chaos"
    ],
    "pdfSlug": "factory"
  },
  "guida-fractional-cto": {
    "title": "Technical Direction Guide",
    "description": "When and why you need Technical Direction. Governance, vendor management, and team growth for SMEs.",
    "heroTitle": "When (and why) you need Technical Direction",
    "heroSubtitle": "A practical guide to understanding whether your company lacks technical direction and how to define a sustainable engagement.",
    "bullets": [
      "Framework to assess whether you need Technical Direction",
      "Technical governance: what they manage, what they do not",
      "Vendor management: how to avoid being held hostage",
      "Team scaling: when to hire vs when to outsource",
      "Red flags in the selection process"
    ],
    "pdfSlug": "fractional-cto"
  },
  "guida-leadership": {
    "title": "Tech Leadership Guide",
    "description": "How to do tech leadership without bureaucracy. Team autonomy, 1:1 framework, hiring, performance culture.",
    "heroTitle": "Tech leadership without bureaucracy",
    "heroSubtitle": "The operational guide for leading technical teams: build autonomy, maintain quality, and grow people without micromanaging.",
    "bullets": [
      "Framework for delegating without losing control",
      "Weekly 1:1 template that actually works",
      "Signs of a bad hire before it is too late",
      "Performance metrics that motivate without gaming",
      "How to run effective retrospectives"
    ],
    "pdfSlug": "leadership"
  },
  "guida-nocode": {
    "title": "No-Code Automation Guide for SMEs",
    "description": "How to automate business processes without code. Process mapping, tool selection, integration patterns, ROI.",
    "heroTitle": "Automate without code: No-Code guide for SMEs",
    "heroSubtitle": "Many repetitive processes can be automated with no-code tools. This guide helps you identify which ones and how.",
    "bullets": [
      "Process mapping: identify automatable processes in an afternoon",
      "Tool selection: Make, Zapier, n8n, Power Automate compared for Italian SMEs",
      "Integration patterns: connecting legacy systems without developers",
      "ROI calculation: when automation pays for itself",
      "When to move from no-code to custom development"
    ],
    "pdfSlug": "nocode-automation"
  },
  "guida-pa": {
    "title": "Public Sector Digital Guide",
    "description": "Innovating in Italian Public Administration. PNRR, procurement, interoperability, SPID/CIE, compliance.",
    "heroTitle": "Technology for the public sector: innovating in complexity",
    "heroSubtitle": "The technical guide for those working with or within Italian Public Administration who want real innovation — not just slides.",
    "bullets": [
      "PNRR opportunities: evaluating applicable funding and requirements",
      "Public procurement: navigating the Contracts Code for tech solutions",
      "Interoperability: AgID standards and integration patterns",
      "SPID/CIE integration: practical implementation guide",
      "AgID/GDPR compliance: what you must document"
    ],
    "pdfSlug": "pubblica-amministrazione"
  },
  "guida-sviluppo-progetto": {
    "title": "Fixed-Scope Project Development Guide",
    "description": "How to manage a fixed-price software project without surprises. Requirements, milestones, acceptance criteria, contracts.",
    "heroTitle": "Fixed-scope software project: how not to get burned",
    "heroSubtitle": "The guide for those commissioning software who want to know exactly what they are buying — before signing.",
    "bullets": [
      "How to write requirements that protect both you and the vendor",
      "Milestones and deliverables: structuring them bindingly",
      "Acceptance criteria: objective definition before development starts",
      "Contract models: fixed price, T&M, hybrid — pros and cons",
      "8 red flags to avoid when choosing a vendor"
    ],
    "pdfSlug": "sviluppo-progetto"
  },
  "guida-trasformazione-digitale": {
    "title": "Digital Transformation Guide",
    "description": "An operational method for digital transformation in Italian SMEs. Outcome metrics, legacy integration, and change management.",
    "heroTitle": "Digital transformation for SMEs: the method that works",
    "heroSubtitle": "Not consulting-slide digital transformation: a concrete path with a real budget, priorities, and measurable outcomes.",
    "bullets": [
      "Framework to define and validate ROI",
      "How to integrate Italian ERPs (TeamSystem, Mexal, Fatture in Cloud)",
      "Change management: getting people on board without resistance",
      "Operational plan: week-by-week roadmap",
      "When to stop: knowing when a transformation has failed"
    ],
    "pdfSlug": "trasformazione-digitale"
  },
  "guida-wellbeing": {
    "title": "Tech Wellbeing Guide",
    "description": "How to prevent burnout in tech teams. Early signals, sustainable pace, retention framework.",
    "heroTitle": "Preventing tech burnout: guide for managers",
    "heroSubtitle": "Burnout creates human and operational costs that often remain hidden. This guide helps you recognise it early and prevent it with concrete systems.",
    "bullets": [
      "15 early burnout signals managers ignore",
      "Sustainable pace: measuring the team's sustainable velocity",
      "Retention framework: keeping talent without unlimited perks",
      "1:1 script for wellbeing conversations",
      "When to escalate: HR vs manager vs external support"
    ],
    "pdfSlug": "wellbeing"
  }
},
};

const risorseIndex: Record<Locale, Omit<RisorseIndexContent, 'guides'>> = {
  it: {
    meta: {
      title: 'Risorse Gratuite',
      description: 'Guide gratuite organizzate per Direzione Tecnica, Software in Mano e approfondimenti per PMI.',
    },
    eyebrow: 'Guide pratiche',
    heading: 'Risorse per prendere decisioni tecniche migliori',
    subheading: 'Scegli il tuo punto di partenza: guidare team e tecnologia, costruire ed evolvere software, oppure approfondire un tema specifico.',
    downloadCta: 'Scarica gratis',
    cta: {
      title: 'Hai bisogno di aiuto personalizzato?',
      description: 'Le guide sono un ottimo punto di partenza. Se vuoi andare oltre, parliamone.',
      ctaText: 'Prenota una call',
    },
    breadcrumb: 'Risorse',
    categoryTitles: {
      'direzione-tecnica': 'Direzione Tecnica',
      'software-in-mano': 'Software in Mano',
      approfondimenti: 'Approfondimenti',
    },
  },
  en: {
    meta: {
      title: 'Free Resources',
      description: 'Free guides organised by Technical Direction, Software in Hand, and focused insights for SMEs.',
    },
    eyebrow: 'Practical guides',
    heading: 'Resources for better technical decisions',
    subheading: 'Choose where to start: guide teams and technology, build and evolve software, or explore a focused topic.',
    downloadCta: 'Download free',
    cta: {
      title: 'Need personalised help?',
      description: 'The guides are a great starting point. If you want to go further, let us talk.',
      ctaText: 'Book a call',
    },
    breadcrumb: 'Resources',
    categoryTitles: {
      'direzione-tecnica': 'Technical Direction',
      'software-in-mano': 'Software in Hand',
      approfondimenti: 'Insights',
    },
  },
};

const guideIndex: Record<Locale, GuideIndexItem[]> = {
  it: [
  {
    "slug": "guida-agile-devops",
    "title": "Agile pragmatico: delivery continua senza dogma",
    "description": "Agile pragmatico e delivery continua senza dogma. CI/CD pipeline, sprint structure, metriche che contano.",
    "tag": "Agile & DevOps",
    "category": "direzione-tecnica"
  },
  {
    "slug": "guida-ai-pmi",
    "title": "Come adottare l'AI nella tua PMI senza bruciare budget",
    "description": "Framework pratico per adottare l'AI nella tua PMI. Checklist, criteri di valutazione ed errori da evitare.",
    "tag": "Governance AI",
    "category": "direzione-tecnica"
  },
  {
    "slug": "guida-architettura",
    "title": "Scalare senza riscrivere: guida all'architettura evolutiva",
    "description": "Come scalare la tua architettura software senza riscrivere tutto. Modular monolith, bounded contexts, fitness functions.",
    "tag": "Architettura",
    "category": "direzione-tecnica"
  },
  {
    "slug": "guida-compliance-ai",
    "title": "EU AI Act: come orientarsi tra obblighi e scadenze",
    "description": "Come orientarsi negli obblighi dell'EU AI Act. Classificazione del rischio, documentazione e scadenze applicabili.",
    "tag": "Compliance AI Act",
    "category": "approfondimenti"
  },
  {
    "slug": "guida-data-analytics",
    "title": "Da dati a decisioni: analytics per PMI italiane",
    "description": "Come trasformare i dati aziendali in decisioni. Data audit, KPI framework, BI tools, data culture.",
    "tag": "Data & Analytics",
    "category": "software-in-mano"
  },
  {
    "slug": "guida-digital-starter",
    "title": "Il primo progetto digitale: guida per chi parte da zero",
    "description": "Il primo progetto digitale per chi parte da zero. MVP mindset, vendor selection, budget planning, no-code options.",
    "tag": "Primo progetto",
    "category": "software-in-mano"
  },
  {
    "slug": "guida-factory",
    "title": "Retainer evolutivo: far crescere il software senza perdere il controllo",
    "description": "Come governare un rapporto continuativo per far evolvere il software. Capacità, livelli di servizio, trasferimento di conoscenza ed exit strategy.",
    "tag": "Retainer evolutivo",
    "category": "software-in-mano"
  },
  {
    "slug": "guida-fractional-cto",
    "title": "Quando (e perché) serve una Direzione Tecnica",
    "description": "Quando e perché serve una Direzione Tecnica. Governance, gestione fornitori e crescita del team per PMI.",
    "tag": "Direzione Tecnica",
    "category": "direzione-tecnica"
  },
  {
    "slug": "guida-leadership",
    "title": "Tech Leadership senza burocrazia",
    "description": "Come fare tech leadership senza burocrazia. Autonomia del team, 1:1 framework, hiring, performance culture.",
    "tag": "Leadership",
    "category": "direzione-tecnica"
  },
  {
    "slug": "guida-nocode",
    "title": "Automatizzare senza codice: guida No-Code per PMI",
    "description": "Come automatizzare i processi aziendali senza codice. Process mapping, tool selection, integration patterns, ROI.",
    "tag": "No-Code Automation",
    "category": "software-in-mano"
  },
  {
    "slug": "guida-pa",
    "title": "Tecnologia per la PA: innovare nella complessità",
    "description": "Innovare nella Pubblica Amministrazione italiana. PNRR, procurement, interoperabilità, SPID/CIE, compliance.",
    "tag": "Pubblica Amministrazione",
    "category": "approfondimenti"
  },
  {
    "slug": "guida-sviluppo-progetto",
    "title": "Progetto software a scope fisso: come non farsi fregare",
    "description": "Come gestire un progetto software a prezzo fisso senza sorprese. Requirements, milestone, acceptance criteria, contratti.",
    "tag": "Sviluppo Progetto",
    "category": "software-in-mano"
  },
  {
    "slug": "guida-trasformazione-digitale",
    "title": "Trasformazione digitale per PMI: il metodo che funziona",
    "description": "Un metodo operativo per la trasformazione digitale nelle PMI italiane. Metriche di risultato, integrazione legacy e change management.",
    "tag": "Trasformazione Digitale",
    "category": "software-in-mano"
  },
  {
    "slug": "guida-wellbeing",
    "title": "Prevenire il burnout tech: guida per manager",
    "description": "Come prevenire il burnout nel team tech. Segnali precoci, sustainable pace, retention framework.",
    "tag": "Wellbeing team",
    "category": "direzione-tecnica"
  }
],
  en: [
  {
    "slug": "guida-agile-devops",
    "title": "Pragmatic Agile: continuous delivery without dogma",
    "description": "Pragmatic Agile and continuous delivery without dogma. CI/CD pipeline, sprint structure, metrics that matter.",
    "tag": "Agile & DevOps",
    "category": "direzione-tecnica"
  },
  {
    "slug": "guida-ai-pmi",
    "title": "How to adopt AI in your SME without burning budget",
    "description": "Practical framework to adopt AI in your SME. Checklists, evaluation criteria, and mistakes to avoid.",
    "tag": "AI Governance",
    "category": "direzione-tecnica"
  },
  {
    "slug": "guida-architettura",
    "title": "Scale without rewriting: evolutionary architecture guide",
    "description": "How to scale your software architecture without rewriting everything. Modular monolith, bounded contexts, fitness functions.",
    "tag": "Architecture",
    "category": "direzione-tecnica"
  },
  {
    "slug": "guida-compliance-ai",
    "title": "EU AI Act: navigating obligations and deadlines",
    "description": "How to navigate EU AI Act obligations. Risk classification, documentation, and applicable deadlines.",
    "tag": "AI Act Compliance",
    "category": "approfondimenti"
  },
  {
    "slug": "guida-data-analytics",
    "title": "From data to decisions: analytics for Italian SMEs",
    "description": "How to turn business data into decisions. Data audit, KPI framework, BI tools, data culture.",
    "tag": "Data & Analytics",
    "category": "software-in-mano"
  },
  {
    "slug": "guida-digital-starter",
    "title": "The first digital project: guide for those starting from zero",
    "description": "The first digital project for those starting from zero. MVP mindset, vendor selection, budget planning, no-code options.",
    "tag": "First project",
    "category": "software-in-mano"
  },
  {
    "slug": "guida-factory",
    "title": "Evolution retainer: grow your software without losing control",
    "description": "How to govern an ongoing relationship that evolves your software. Capacity, service levels, knowledge transfer, and exit strategy.",
    "tag": "Evolution Retainer",
    "category": "software-in-mano"
  },
  {
    "slug": "guida-fractional-cto",
    "title": "When (and why) you need Technical Direction",
    "description": "When and why you need Technical Direction. Governance, vendor management, and team growth for SMEs.",
    "tag": "Technical Direction",
    "category": "direzione-tecnica"
  },
  {
    "slug": "guida-leadership",
    "title": "Tech leadership without bureaucracy",
    "description": "How to do tech leadership without bureaucracy. Team autonomy, 1:1 framework, hiring, performance culture.",
    "tag": "Leadership",
    "category": "direzione-tecnica"
  },
  {
    "slug": "guida-nocode",
    "title": "Automate without code: No-Code guide for SMEs",
    "description": "How to automate business processes without code. Process mapping, tool selection, integration patterns, ROI.",
    "tag": "No-Code Automation",
    "category": "software-in-mano"
  },
  {
    "slug": "guida-pa",
    "title": "Technology for the public sector: innovating in complexity",
    "description": "Innovating in Italian Public Administration. PNRR, procurement, interoperability, SPID/CIE, compliance.",
    "tag": "Public Sector",
    "category": "approfondimenti"
  },
  {
    "slug": "guida-sviluppo-progetto",
    "title": "Fixed-scope software project: how not to get burned",
    "description": "How to manage a fixed-price software project without surprises. Requirements, milestones, acceptance criteria, contracts.",
    "tag": "Project Development",
    "category": "software-in-mano"
  },
  {
    "slug": "guida-trasformazione-digitale",
    "title": "Digital transformation for SMEs: the method that works",
    "description": "An operational method for digital transformation in Italian SMEs. Outcome metrics, legacy integration, and change management.",
    "tag": "Digital Transformation",
    "category": "software-in-mano"
  },
  {
    "slug": "guida-wellbeing",
    "title": "Preventing tech burnout: guide for managers",
    "description": "How to prevent burnout in tech teams. Early signals, sustainable pace, retention framework.",
    "tag": "Team Wellbeing",
    "category": "direzione-tecnica"
  }
],
};

const grazie: Record<Locale, GrazieContent> = {
  it: {
    meta: { title: 'Grazie!', description: 'Il tuo PDF è pronto per il download.' },
    heading: 'Grazie! Il tuo PDF è pronto.',
    subheading: 'Clicca il bottone qui sotto per scaricarlo subito. Riceverai anche un email con il link di download.',
    autoDownload: 'Il download partirà automaticamente...',
    downloadButton: 'Scarica PDF',
    followUpTitle: 'Nei prossimi giorni riceverai anche:',
    followUpItems: [
      'Approfondimenti pratici sull\'argomento',
      'Approfondimenti ed esempi applicativi per PMI',
      'Invito a una call strategica gratuita',
    ],
    pdfTitles: {
      'ai-adoption': 'Guida AI Adoption per PMI',
      'ai-platform': 'Presentazione Software in Mano',
      'fractional-cto': 'Guida alla Direzione Tecnica',
      'architettura': 'Guida Scaling Architetturale',
      'trasformazione-digitale': 'Guida Trasformazione Digitale',
      'leadership': 'Guida Tech Leadership',
      'agile-devops': 'Guida Agile & DevOps',
      'wellbeing': 'Guida Tech Wellbeing',
      'digital-starter': 'Guida Digital Starter',
      'sviluppo-progetto': 'Guida Sviluppo Progetto',
      'factory': 'Guida al Retainer evolutivo',
      'compliance-ai-act': 'Guida Compliance AI Act',
      'nocode-automation': 'Guida No-Code Automation',
      'data-analytics': 'Guida Data & Analytics',
      'pubblica-amministrazione': 'Guida PA Digitale',
    },
  },
  en: {
    meta: { title: 'Thank you!', description: 'Your PDF is ready to download.' },
    heading: 'Thank you! Your PDF is ready.',
    subheading: 'Click the button below to download it now. You will also receive an email with the download link.',
    autoDownload: 'Download will start automatically...',
    downloadButton: 'Download PDF',
    followUpTitle: 'In the coming days you will also receive:',
    followUpItems: [
      'Practical deep-dives on the topic',
      'Practical deep-dives and examples for SMEs',
      'Invitation to a free strategy call',
    ],
    pdfTitles: {
      'ai-adoption': 'AI Adoption Guide for SMEs',
      'ai-platform': 'Software in Hand Overview',
      'fractional-cto': 'Technical Direction Guide',
      'architettura': 'Architectural Scaling Guide',
      'trasformazione-digitale': 'Digital Transformation Guide',
      'leadership': 'Tech Leadership Guide',
      'agile-devops': 'Agile & DevOps Guide',
      'wellbeing': 'Tech Wellbeing Guide',
      'digital-starter': 'Digital Starter Guide',
      'sviluppo-progetto': 'Fixed-Scope Project Guide',
      'factory': 'Evolution Retainer Guide',
      'compliance-ai-act': 'EU AI Act Compliance Guide',
      'nocode-automation': 'No-Code Automation Guide',
      'data-analytics': 'Data & Analytics Guide',
      'pubblica-amministrazione': 'Public Sector Digital Guide',
    },
  },
};

export function getLeadMagnetContent(slug: string, locale: Locale): LeadMagnetContent | undefined {
  return magnets[locale][slug];
}

export function getRisorseIndexContent(locale: Locale): RisorseIndexContent {
  const availableSlugs = new Set(
    Object.entries(magnets[locale])
      .filter(([, magnet]) => Boolean(pdfUrls[magnet.pdfSlug]))
      .map(([slug]) => slug),
  );

  return {
    ...risorseIndex[locale],
    guides: guideIndex[locale].filter((guide) => availableSlugs.has(guide.slug)),
  };
}

export function getGrazieContent(locale: Locale): GrazieContent {
  return grazie[locale];
}

export function getLeadMagnetSlugs(): string[] {
  return Object.keys(magnets.it);
}

export const pdfUrls: Record<string, string> = {
  'ai-platform': '/downloads/108vision-software-in-mano.pdf',
  'fractional-cto': '/downloads/108vision-direzione-tecnica.pdf',
  'factory': '/downloads/108vision-software-in-mano.pdf',
};
