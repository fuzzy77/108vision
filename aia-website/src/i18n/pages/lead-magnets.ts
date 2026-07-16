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
}

export interface RisorseIndexContent {
  meta: { title: string; description: string };
  eyebrow: string;
  heading: string;
  subheading: string;
  downloadCta: string;
  cta: { title: string; description: string; ctaText: string };
  breadcrumb: string;
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
      "CI/CD pipeline: come implementarla in 2 settimane",
      "Struttura sprint che non spreca tempo in cerimonie inutili",
      "4 metriche che contano davvero (e 6 da ignorare)",
      "Kanban vs Scrum: come scegliere per il tuo contesto",
      "Deploy frequency: come passare da mensile a quotidiano"
    ]
  },
  "guida-ai-pmi": {
    "title": "Guida AI Adoption per PMI",
    "description": "Framework pratico per adottare l'AI nella tua PMI. Checklist, casi studio, errori da evitare.",
    "pdfSlug": "ai-adoption",
    "heroTitle": "Come adottare l'AI nella tua PMI senza bruciare budget",
    "heroSubtitle": "La guida completa con il framework testato su decine di aziende italiane. Da zero a risultati misurabili.",
    "bullets": [
      "Framework AI Readiness Assessment in 5 step",
      "7 errori fatali che il 90% delle PMI commette",
      "Checklist operativa per il primo progetto AI",
      "Casi studio reali con ROI documentato",
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
    "description": "Cosa deve fare la tua azienda per conformarsi all'EU AI Act entro il 2025. Risk classification, documentazione, timeline.",
    "pdfSlug": "compliance-ai-act",
    "heroTitle": "EU AI Act: cosa deve fare la tua azienda entro il 2025",
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
    "heroSubtitle": "La tua azienda ha dati ovunque ma nessuno li usa per decidere. Questa guida ti insegna a costruire una cultura del dato in 90 giorni.",
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
    "title": "Guida Development Factory",
    "description": "Come gestire un team esterno continuativo. Modelli di team, SLA, knowledge transfer, governance ed exit strategy.",
    "pdfSlug": "factory",
    "heroTitle": "Team esterno continuativo: guida alla Development Factory",
    "heroSubtitle": "Hai un team esterno o stai valutando di crearne uno? Questa guida ti insegna a governarlo senza perdere il controllo del prodotto.",
    "bullets": [
      "Modelli di team: dedicated, shared, staff augmentation — differenze reali",
      "SLA operativi: cosa misurare e come scriverlo nel contratto",
      "Knowledge transfer: come evitare che la conoscenza rimanga fuori",
      "Governance quotidiana: cerimonie, report, decision authority",
      "Exit strategy: come rientrare il controllo senza disastri"
    ]
  },
  "guida-fractional-cto": {
    "title": "Guida Fractional CTO",
    "description": "Quando e perch├® serve un Fractional CTO. Framework di governance, gestione vendor e team scaling per PMI.",
    "pdfSlug": "fractional-cto",
    "heroTitle": "Quando (e perch├®) serve un Fractional CTO",
    "heroSubtitle": "La guida pratica per capire se un CTO part-time è la mossa giusta per la tua azienda — e come ingaggiarlo correttamente.",
    "bullets": [
      "Framework per valutare se ti serve un Fractional CTO ora",
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
    "heroSubtitle": "La guida operativa per chi guida team tecnici: come costruire autonomia, mantenere la qualit├á e far crescere le persone senza microgestire.",
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
    "heroSubtitle": "Il 70% dei processi ripetitivi nella tua azienda si può automatizzare senza scrivere una riga di codice. Questa guida ti mostra come.",
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
    "description": "Innovare nella Pubblica Amministrazione italiana. PNRR, procurement, interoperabilit├á, SPID/CIE, compliance.",
    "pdfSlug": "pubblica-amministrazione",
    "heroTitle": "Tecnologia per la PA: innovare nella complessit├á",
    "heroSubtitle": "La guida tecnica per chi lavora con o dentro la Pubblica Amministrazione italiana e vuole portare innovazione reale — non solo slide.",
    "bullets": [
      "Opportunit├á PNRR 2025: dove sono i fondi e come accedervi",
      "Procurement PA: come navigare il Codice degli Appalti per soluzioni tech",
      "Interoperabilit├á: come integrare i sistemi della PA con i propri",
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
    "description": "Il metodo che funziona per la trasformazione digitale nelle PMI italiane. ROI in 90 giorni, integrazione legacy, change management.",
    "pdfSlug": "trasformazione-digitale",
    "heroTitle": "Trasformazione digitale per PMI: il metodo che funziona",
    "heroSubtitle": "Non la trasformazione digitale delle slide di consulenza. Quella concreta, con budget reale, team italiano e risultati in 90 giorni.",
    "bullets": [
      "Framework per calcolare il ROI in 90 giorni",
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
    "heroSubtitle": "Il burnout in un team tech costa il doppio di quanto pensi. Questa guida ti insegna a riconoscerlo prima e a prevenirlo con sistemi concreti.",
    "bullets": [
      "15 segnali precoci di burnout che i manager ignorano",
      "Sustainable pace: come misurare la velocit├á sostenibile del team",
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
      "CI/CD pipeline: how to implement it in 2 weeks",
      "Sprint structure that does not waste time on useless ceremonies",
      "4 metrics that really matter (and 6 to ignore)",
      "Kanban vs Scrum: how to choose for your context",
      "Deploy frequency: moving from monthly to daily"
    ],
    "pdfSlug": "agile-devops"
  },
  "guida-ai-pmi": {
    "title": "AI Adoption Guide for SMEs",
    "description": "Practical framework to adopt AI in your SME. Checklists, case studies, mistakes to avoid.",
    "heroTitle": "How to adopt AI in your SME without burning budget",
    "heroSubtitle": "The complete guide with a framework tested on dozens of Italian companies. From zero to measurable results.",
    "bullets": [
      "AI Readiness Assessment framework in 5 steps",
      "7 fatal mistakes 90% of SMEs make",
      "Operational checklist for your first AI project",
      "Real case studies with documented ROI",
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
    "description": "What your company must do to comply with the EU AI Act by 2025. Risk classification, documentation, timeline.",
    "heroTitle": "EU AI Act: what your company must do by 2025",
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
    "heroSubtitle": "Your company has data everywhere but nobody uses it to decide. This guide helps you build a data culture in 90 days.",
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
    "heroSubtitle": "You have no internal tech team. You do not know where to start. This guide takes you from \"I want to digitise\" to a working system in 30 days.",
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
    "title": "Development Factory Guide",
    "description": "How to manage an ongoing external team. Team models, SLAs, knowledge transfer, governance, and exit strategy.",
    "heroTitle": "Ongoing external team: Development Factory guide",
    "heroSubtitle": "You have an external team or are considering one? This guide teaches you to govern it without losing product control.",
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
    "title": "Fractional CTO Guide",
    "description": "When and why you need a Fractional CTO. Governance framework, vendor management, and team scaling for SMEs.",
    "heroTitle": "When (and why) you need a Fractional CTO",
    "heroSubtitle": "The practical guide to understand if a part-time CTO is the right move for your company — and how to engage one correctly.",
    "bullets": [
      "Framework to assess if you need a Fractional CTO now",
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
    "heroSubtitle": "70% of repetitive processes in your company can be automated without writing a line of code. This guide shows you how.",
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
      "PNRR 2025 opportunities: where the funds are and how to access them",
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
    "description": "The method that works for digital transformation in Italian SMEs. ROI in 90 days, legacy integration, change management.",
    "heroTitle": "Digital transformation for SMEs: the method that works",
    "heroSubtitle": "Not consulting-slide digital transformation. The concrete kind, with a real budget, Italian team, and results in 90 days.",
    "bullets": [
      "Framework to calculate ROI in 90 days",
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
    "heroSubtitle": "Burnout in a tech team costs twice what you think. This guide teaches you to recognise it early and prevent it with concrete systems.",
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
      description: 'Guide, template e checklist gratuite su AI, architettura software, DevOps, leadership tech e trasformazione digitale per PMI italiane.',
    },
    eyebrow: 'PDF Gratuiti',
    heading: 'Risorse gratuite per PMI italiane',
    subheading: 'Guide pratiche su AI, architettura, leadership e trasformazione digitale. Scaricale gratis — nessuna carta di credito, nessuno spam.',
    downloadCta: 'Scarica gratis',
    cta: {
      title: 'Hai bisogno di aiuto personalizzato?',
      description: 'Le guide sono un ottimo punto di partenza. Se vuoi andare oltre, parliamone.',
      ctaText: 'Prenota una call',
    },
    breadcrumb: 'Risorse',
  },
  en: {
    meta: {
      title: 'Free Resources',
      description: 'Free guides, templates, and checklists on AI, software architecture, DevOps, tech leadership, and digital transformation for SMEs.',
    },
    eyebrow: 'Free PDFs',
    heading: 'Free resources for SMEs',
    subheading: 'Practical guides on AI, architecture, leadership, and digital transformation. Download free — no credit card, no spam.',
    downloadCta: 'Download free',
    cta: {
      title: 'Need personalised help?',
      description: 'The guides are a great starting point. If you want to go further, let us talk.',
      ctaText: 'Book a call',
    },
    breadcrumb: 'Resources',
  },
};

const guideIndex: Record<Locale, GuideIndexItem[]> = {
  it: [
  {
    "slug": "guida-agile-devops",
    "title": "Agile pragmatico: delivery continua senza dogma",
    "description": "Agile pragmatico e delivery continua senza dogma. CI/CD pipeline, sprint structure, metriche che contano.",
    "tag": "Agile & DevOps"
  },
  {
    "slug": "guida-ai-pmi",
    "title": "Come adottare l'AI nella tua PMI senza bruciare budget",
    "description": "Framework pratico per adottare l'AI nella tua PMI. Checklist, casi studio, errori da evitare.",
    "tag": "AI Adoption"
  },
  {
    "slug": "guida-architettura",
    "title": "Scalare senza riscrivere: guida all'architettura evolutiva",
    "description": "Come scalare la tua architettura software senza riscrivere tutto. Modular monolith, bounded contexts, fitness functions.",
    "tag": "Architettura"
  },
  {
    "slug": "guida-compliance-ai",
    "title": "EU AI Act: cosa deve fare la tua azienda entro il 2025",
    "description": "Cosa deve fare la tua azienda per conformarsi all'EU AI Act entro il 2025. Risk classification, documentazione, timeline.",
    "tag": "Compliance AI Act"
  },
  {
    "slug": "guida-data-analytics",
    "title": "Da dati a decisioni: analytics per PMI italiane",
    "description": "Come trasformare i dati aziendali in decisioni. Data audit, KPI framework, BI tools, data culture.",
    "tag": "Data & Analytics"
  },
  {
    "slug": "guida-digital-starter",
    "title": "Il primo progetto digitale: guida per chi parte da zero",
    "description": "Il primo progetto digitale per chi parte da zero. MVP mindset, vendor selection, budget planning, no-code options.",
    "tag": "Digital Starter"
  },
  {
    "slug": "guida-factory",
    "title": "Team esterno continuativo: guida alla Development Factory",
    "description": "Come gestire un team esterno continuativo. Modelli di team, SLA, knowledge transfer, governance ed exit strategy.",
    "tag": "Factory"
  },
  {
    "slug": "guida-fractional-cto",
    "title": "Quando (e perch├®) serve un Fractional CTO",
    "description": "Quando e perch├® serve un Fractional CTO. Framework di governance, gestione vendor e team scaling per PMI.",
    "tag": "Fractional CTO"
  },
  {
    "slug": "guida-leadership",
    "title": "Tech Leadership senza burocrazia",
    "description": "Come fare tech leadership senza burocrazia. Autonomia del team, 1:1 framework, hiring, performance culture.",
    "tag": "Leadership"
  },
  {
    "slug": "guida-nocode",
    "title": "Automatizzare senza codice: guida No-Code per PMI",
    "description": "Come automatizzare i processi aziendali senza codice. Process mapping, tool selection, integration patterns, ROI.",
    "tag": "No-Code Automation"
  },
  {
    "slug": "guida-pa",
    "title": "Tecnologia per la PA: innovare nella complessit├á",
    "description": "Innovare nella Pubblica Amministrazione italiana. PNRR, procurement, interoperabilit├á, SPID/CIE, compliance.",
    "tag": "Pubblica Amministrazione"
  },
  {
    "slug": "guida-sviluppo-progetto",
    "title": "Progetto software a scope fisso: come non farsi fregare",
    "description": "Come gestire un progetto software a prezzo fisso senza sorprese. Requirements, milestone, acceptance criteria, contratti.",
    "tag": "Sviluppo Progetto"
  },
  {
    "slug": "guida-trasformazione-digitale",
    "title": "Trasformazione digitale per PMI: il metodo che funziona",
    "description": "Il metodo che funziona per la trasformazione digitale nelle PMI italiane. ROI in 90 giorni, integrazione legacy, change management.",
    "tag": "Trasformazione Digitale"
  },
  {
    "slug": "guida-wellbeing",
    "title": "Prevenire il burnout tech: guida per manager",
    "description": "Come prevenire il burnout nel team tech. Segnali precoci, sustainable pace, retention framework.",
    "tag": "Wellbeing"
  }
],
  en: [
  {
    "slug": "guida-agile-devops",
    "title": "Pragmatic Agile: continuous delivery without dogma",
    "description": "Pragmatic Agile and continuous delivery without dogma. CI/CD pipeline, sprint structure, metrics that matter.",
    "tag": "Agile & DevOps"
  },
  {
    "slug": "guida-ai-pmi",
    "title": "How to adopt AI in your SME without burning budget",
    "description": "Practical framework to adopt AI in your SME. Checklists, case studies, mistakes to avoid.",
    "tag": "AI Adoption"
  },
  {
    "slug": "guida-architettura",
    "title": "Scale without rewriting: evolutionary architecture guide",
    "description": "How to scale your software architecture without rewriting everything. Modular monolith, bounded contexts, fitness functions.",
    "tag": "Architecture"
  },
  {
    "slug": "guida-compliance-ai",
    "title": "EU AI Act: what your company must do by 2025",
    "description": "What your company must do to comply with the EU AI Act by 2025. Risk classification, documentation, timeline.",
    "tag": "AI Act Compliance"
  },
  {
    "slug": "guida-data-analytics",
    "title": "From data to decisions: analytics for Italian SMEs",
    "description": "How to turn business data into decisions. Data audit, KPI framework, BI tools, data culture.",
    "tag": "Data & Analytics"
  },
  {
    "slug": "guida-digital-starter",
    "title": "The first digital project: guide for those starting from zero",
    "description": "The first digital project for those starting from zero. MVP mindset, vendor selection, budget planning, no-code options.",
    "tag": "Digital Starter"
  },
  {
    "slug": "guida-factory",
    "title": "Ongoing external team: Development Factory guide",
    "description": "How to manage an ongoing external team. Team models, SLAs, knowledge transfer, governance, and exit strategy.",
    "tag": "Factory"
  },
  {
    "slug": "guida-fractional-cto",
    "title": "When (and why) you need a Fractional CTO",
    "description": "When and why you need a Fractional CTO. Governance framework, vendor management, and team scaling for SMEs.",
    "tag": "Fractional CTO"
  },
  {
    "slug": "guida-leadership",
    "title": "Tech leadership without bureaucracy",
    "description": "How to do tech leadership without bureaucracy. Team autonomy, 1:1 framework, hiring, performance culture.",
    "tag": "Leadership"
  },
  {
    "slug": "guida-nocode",
    "title": "Automate without code: No-Code guide for SMEs",
    "description": "How to automate business processes without code. Process mapping, tool selection, integration patterns, ROI.",
    "tag": "No-Code Automation"
  },
  {
    "slug": "guida-pa",
    "title": "Technology for the public sector: innovating in complexity",
    "description": "Innovating in Italian Public Administration. PNRR, procurement, interoperability, SPID/CIE, compliance.",
    "tag": "Public Sector"
  },
  {
    "slug": "guida-sviluppo-progetto",
    "title": "Fixed-scope software project: how not to get burned",
    "description": "How to manage a fixed-price software project without surprises. Requirements, milestones, acceptance criteria, contracts.",
    "tag": "Project Development"
  },
  {
    "slug": "guida-trasformazione-digitale",
    "title": "Digital transformation for SMEs: the method that works",
    "description": "The method that works for digital transformation in Italian SMEs. ROI in 90 days, legacy integration, change management.",
    "tag": "Digital Transformation"
  },
  {
    "slug": "guida-wellbeing",
    "title": "Preventing tech burnout: guide for managers",
    "description": "How to prevent burnout in tech teams. Early signals, sustainable pace, retention framework.",
    "tag": "Wellbeing"
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
      'Casi studio reali da PMI italiane',
      'Invito a una call strategica gratuita',
    ],
    pdfTitles: {
      'ai-adoption': 'Guida AI Adoption per PMI',
      'ai-platform': 'Guida Piattaforma AI Aziendale',
      'fractional-cto': 'Guida Fractional CTO',
      'architettura': 'Guida Scaling Architetturale',
      'trasformazione-digitale': 'Guida Trasformazione Digitale',
      'leadership': 'Guida Tech Leadership',
      'agile-devops': 'Guida Agile & DevOps',
      'wellbeing': 'Guida Tech Wellbeing',
      'digital-starter': 'Guida Digital Starter',
      'sviluppo-progetto': 'Guida Sviluppo Progetto',
      'factory': 'Guida Development Factory',
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
      'Real case studies from Italian SMEs',
      'Invitation to a free strategy call',
    ],
    pdfTitles: {
      'ai-adoption': 'AI Adoption Guide for SMEs',
      'ai-platform': 'Enterprise AI Platform Guide',
      'fractional-cto': 'Fractional CTO Guide',
      'architettura': 'Architectural Scaling Guide',
      'trasformazione-digitale': 'Digital Transformation Guide',
      'leadership': 'Tech Leadership Guide',
      'agile-devops': 'Agile & DevOps Guide',
      'wellbeing': 'Tech Wellbeing Guide',
      'digital-starter': 'Digital Starter Guide',
      'sviluppo-progetto': 'Fixed-Scope Project Guide',
      'factory': 'Development Factory Guide',
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
  return { ...risorseIndex[locale], guides: guideIndex[locale] };
}

export function getGrazieContent(locale: Locale): GrazieContent {
  return grazie[locale];
}

export function getLeadMagnetSlugs(): string[] {
  return Object.keys(magnets.it);
}

export const pdfUrls: Record<string, string> = {
  'ai-adoption': '/pdf/AI-Adoption-Manuale-PMI.pdf',
  'ai-platform': '/pdf/AIA-Manuale-Piattaforma.pdf',
  'fractional-cto': '/pdf/FCTO-Manuale-FractionalCTO.pdf',
  'architettura': '/pdf/ARCH-Manuale-Scaling.pdf',
  'trasformazione-digitale': '/pdf/DIGI-Manuale-Trasformazione.pdf',
  'leadership': '/pdf/LEAD-Manuale-Leadership.pdf',
  'agile-devops': '/pdf/AGILE-Manuale-AgileDevOps.pdf',
  'wellbeing': '/pdf/WELL-Manuale-Wellbeing.pdf',
  'digital-starter': '/pdf/ZERO-Manuale-FromScratch.pdf',
  'sviluppo-progetto': '/pdf/PROJ-Manuale-SviluppoProgetto.pdf',
  'factory': '/pdf/FACT-Manuale-Factory.pdf',
  'compliance-ai-act': '/pdf/COMP-Manuale-ComplianceAIAct.pdf',
  'nocode-automation': '/pdf/NOCODE-Manuale-Automation.pdf',
  'data-analytics': '/pdf/DATA-Manuale-Analytics.pdf',
  'pubblica-amministrazione': '/pdf/PA-Manuale-PubblicaAmministrazione.pdf',
};
