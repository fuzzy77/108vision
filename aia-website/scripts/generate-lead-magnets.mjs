import fs from 'fs';

const raw = fs.readFileSync('scripts/lead-magnets-it.json', 'utf8').replace(/^\uFEFF/, '');
const itItems = JSON.parse(raw);

// English translations keyed by slug
const enBySlug = {
  'guida-agile-devops': {
    title: 'Agile & DevOps Guide',
    description: 'Pragmatic Agile and continuous delivery without dogma. CI/CD pipeline, sprint structure, metrics that matter.',
    heroTitle: 'Pragmatic Agile: continuous delivery without dogma',
    heroSubtitle: 'Not textbook Scrum Agile. What works in Italian SMEs: delivering value fast with a small team and a real budget.',
    bullets: [
      'CI/CD pipeline: how to implement it in 2 weeks',
      'Sprint structure that does not waste time on useless ceremonies',
      '4 metrics that really matter (and 6 to ignore)',
      'Kanban vs Scrum: how to choose for your context',
      'Deploy frequency: moving from monthly to daily',
    ],
  },
  'guida-ai-pmi': {
    title: 'AI Adoption Guide for SMEs',
    description: 'Practical framework to adopt AI in your SME. Checklists, case studies, mistakes to avoid.',
    heroTitle: 'How to adopt AI in your SME without burning budget',
    heroSubtitle: 'The complete guide with a framework tested on dozens of Italian companies. From zero to measurable results.',
    bullets: [
      'AI Readiness Assessment framework in 5 steps',
      '7 fatal mistakes 90% of SMEs make',
      'Operational checklist for your first AI project',
      'Real case studies with documented ROI',
      'Template for a management proposal',
    ],
  },
  'guida-architettura': {
    title: 'Architectural Scaling Guide',
    description: 'How to scale your software architecture without rewriting everything. Modular monolith, bounded contexts, fitness functions.',
    heroTitle: 'Scale without rewriting: evolutionary architecture guide',
    heroSubtitle: 'The method to grow your software system sustainably — without a big-bang rewrite or blocking the business.',
    bullets: [
      'Modular monolith vs microservices: when to choose what',
      'Bounded context: finding the right boundaries in your domain',
      'Fitness functions: verifying architectural rules',
      'Incremental legacy migration strategy',
      'Architecture Decision Records (ADR): ready-to-use template',
    ],
  },
  'guida-compliance-ai': {
    title: 'EU AI Act Compliance Guide',
    description: 'What your company must do to comply with the EU AI Act by 2025. Risk classification, documentation, timeline.',
    heroTitle: 'EU AI Act: what your company must do by 2025',
    heroSubtitle: 'The AI Act is law. It is not a future problem. This guide tells you exactly what to do, in which order, and by when.',
    bullets: [
      'Risk classification: where your AI systems sit',
      'Prohibited practices: what you must stop immediately',
      'Mandatory documentation: the minimum to be compliant',
      '2024-2026 timeline: deadlines you cannot ignore',
      'Quick compliance check: self-assessment in 10 questions',
    ],
  },
  'guida-data-analytics': {
    title: 'Data & Analytics Guide for SMEs',
    description: 'How to turn business data into decisions. Data audit, KPI framework, BI tools, data culture.',
    heroTitle: 'From data to decisions: analytics for Italian SMEs',
    heroSubtitle: 'Your company has data everywhere but nobody uses it to decide. This guide helps you build a data culture in 90 days.',
    bullets: [
      'Data audit: where your data is and what it is worth',
      'KPI framework: choosing the 5 metrics that really matter',
      'Visualisation: dashboards management understands and uses',
      'BI tools for Italian SMEs: cost and capability comparison',
      'Data culture: making data a mental habit for the team',
    ],
  },
  'guida-digital-starter': {
    title: 'Digital Starter Guide',
    description: 'The first digital project for those starting from zero. MVP mindset, vendor selection, budget planning, no-code options.',
    heroTitle: 'The first digital project: guide for those starting from zero',
    heroSubtitle: 'You have no internal tech team. You do not know where to start. This guide takes you from "I want to digitise" to a working system in 30 days.',
    bullets: [
      'MVP mindset: building the minimum that delivers value',
      'How to evaluate and choose a software vendor without getting burned',
      'Budget planning: realistic costs for your first project',
      'No-code options: when they are enough and when they are not',
      '30-day plan: week-by-week operational roadmap',
    ],
  },
  'guida-factory': {
    title: 'Development Factory Guide',
    description: 'How to manage an ongoing external team. Team models, SLAs, knowledge transfer, governance, and exit strategy.',
    heroTitle: 'Ongoing external team: Development Factory guide',
    heroSubtitle: 'You have an external team or are considering one? This guide teaches you to govern it without losing product control.',
    bullets: [
      'Team models: dedicated, shared, staff augmentation — real differences',
      'Operational SLAs: what to measure and how to write it in the contract',
      'Knowledge transfer: keeping IP and know-how in-house',
      'Daily governance: rituals, metrics, and escalation paths',
      'Exit strategy: how to end the engagement without chaos',
    ],
  },
  'guida-fractional-cto': {
    title: 'Fractional CTO Guide',
    description: 'When and why you need a Fractional CTO. Governance framework, vendor management, and team scaling for SMEs.',
    heroTitle: 'When (and why) you need a Fractional CTO',
    heroSubtitle: 'The practical guide to understand if a part-time CTO is the right move for your company — and how to engage one correctly.',
    bullets: [
      'Framework to assess if you need a Fractional CTO now',
      'Technical governance: what they manage, what they do not',
      'Vendor management: how to avoid being held hostage',
      'Team scaling: when to hire vs when to outsource',
      'Red flags in the selection process',
    ],
  },
  'guida-leadership': {
    title: 'Tech Leadership Guide',
    description: 'How to do tech leadership without bureaucracy. Team autonomy, 1:1 framework, hiring, performance culture.',
    heroTitle: 'Tech leadership without bureaucracy',
    heroSubtitle: 'The operational guide for leading technical teams: build autonomy, maintain quality, and grow people without micromanaging.',
    bullets: [
      'Framework for delegating without losing control',
      'Weekly 1:1 template that actually works',
      'Signs of a bad hire before it is too late',
      'Performance metrics that motivate without gaming',
      'How to run effective retrospectives',
    ],
  },
  'guida-nocode': {
    title: 'No-Code Automation Guide for SMEs',
    description: 'How to automate business processes without code. Process mapping, tool selection, integration patterns, ROI.',
    heroTitle: 'Automate without code: No-Code guide for SMEs',
    heroSubtitle: '70% of repetitive processes in your company can be automated without writing a line of code. This guide shows you how.',
    bullets: [
      'Process mapping: identify automatable processes in an afternoon',
      'Tool selection: Make, Zapier, n8n, Power Automate compared for Italian SMEs',
      'Integration patterns: connecting legacy systems without developers',
      'ROI calculation: when automation pays for itself',
      'When to move from no-code to custom development',
    ],
  },
  'guida-pa': {
    title: 'Public Sector Digital Guide',
    description: 'Innovating in Italian Public Administration. PNRR, procurement, interoperability, SPID/CIE, compliance.',
    heroTitle: 'Technology for the public sector: innovating in complexity',
    heroSubtitle: 'The technical guide for those working with or within Italian Public Administration who want real innovation — not just slides.',
    bullets: [
      'PNRR 2025 opportunities: where the funds are and how to access them',
      'Public procurement: navigating the Contracts Code for tech solutions',
      'Interoperability: AgID standards and integration patterns',
      'SPID/CIE integration: practical implementation guide',
      'AgID/GDPR compliance: what you must document',
    ],
  },
  'guida-sviluppo-progetto': {
    title: 'Fixed-Scope Project Development Guide',
    description: 'How to manage a fixed-price software project without surprises. Requirements, milestones, acceptance criteria, contracts.',
    heroTitle: 'Fixed-scope software project: how not to get burned',
    heroSubtitle: 'The guide for those commissioning software who want to know exactly what they are buying — before signing.',
    bullets: [
      'How to write requirements that protect both you and the vendor',
      'Milestones and deliverables: structuring them bindingly',
      'Acceptance criteria: objective definition before development starts',
      'Contract models: fixed price, T&M, hybrid — pros and cons',
      '8 red flags to avoid when choosing a vendor',
    ],
  },
  'guida-trasformazione-digitale': {
    title: 'Digital Transformation Guide',
    description: 'The method that works for digital transformation in Italian SMEs. ROI in 90 days, legacy integration, change management.',
    heroTitle: 'Digital transformation for SMEs: the method that works',
    heroSubtitle: 'Not consulting-slide digital transformation. The concrete kind, with a real budget, Italian team, and results in 90 days.',
    bullets: [
      'Framework to calculate ROI in 90 days',
      'How to integrate Italian ERPs (TeamSystem, Mexal, Fatture in Cloud)',
      'Change management: getting people on board without resistance',
      'Operational plan: week-by-week roadmap',
      'When to stop: knowing when a transformation has failed',
    ],
  },
  'guida-wellbeing': {
    title: 'Tech Wellbeing Guide',
    description: 'How to prevent burnout in tech teams. Early signals, sustainable pace, retention framework.',
    heroTitle: 'Preventing tech burnout: guide for managers',
    heroSubtitle: 'Burnout in a tech team costs twice what you think. This guide teaches you to recognise it early and prevent it with concrete systems.',
    bullets: [
      '15 early burnout signals managers ignore',
      'Sustainable pace: measuring the team\'s sustainable velocity',
      'Retention framework: keeping talent without unlimited perks',
      '1:1 script for wellbeing conversations',
      'When to escalate: HR vs manager vs external support',
    ],
  },
};

const indexTags = {
  'guida-ai-pmi': ['AI Adoption', 'AI Adoption'],
  'guida-fractional-cto': ['Fractional CTO', 'Fractional CTO'],
  'guida-architettura': ['Architettura', 'Architecture'],
  'guida-trasformazione-digitale': ['Trasformazione Digitale', 'Digital Transformation'],
  'guida-leadership': ['Leadership', 'Leadership'],
  'guida-agile-devops': ['Agile & DevOps', 'Agile & DevOps'],
  'guida-wellbeing': ['Wellbeing', 'Wellbeing'],
  'guida-digital-starter': ['Digital Starter', 'Digital Starter'],
  'guida-sviluppo-progetto': ['Sviluppo Progetto', 'Project Development'],
  'guida-factory': ['Factory', 'Factory'],
  'guida-compliance-ai': ['Compliance AI Act', 'AI Act Compliance'],
  'guida-nocode': ['No-Code Automation', 'No-Code Automation'],
  'guida-data-analytics': ['Data & Analytics', 'Data & Analytics'],
  'guida-pa': ['Pubblica Amministrazione', 'Public Sector'],
};

function fixEncoding(s) {
  return s
    .replace(/ÔÇö/g, '—')
    .replace(/├¿/g, 'è')
    .replace(/capacit├á/g, 'capacità')
    .replace(/si pu├▓/g, 'si può');
}

const itMagnets = {};
const enMagnets = {};

for (const item of itItems) {
  const slug = item.slug;
  itMagnets[slug] = {
    title: item.title,
    description: fixEncoding(item.description),
    pdfSlug: item.pdfSlug,
    heroTitle: fixEncoding(item.heroTitle),
    heroSubtitle: fixEncoding(item.heroSubtitle),
    bullets: item.bullets.map(fixEncoding),
  };
  const en = enBySlug[slug];
  enMagnets[slug] = { ...en, pdfSlug: item.pdfSlug };
}

const indexIt = itItems.map((item) => ({
  slug: item.slug,
  title: fixEncoding(item.heroTitle),
  description: fixEncoding(item.description),
  tag: indexTags[item.slug]?.[0] ?? item.title,
}));

const indexEn = itItems.map((item) => ({
  slug: item.slug,
  title: enBySlug[item.slug].heroTitle,
  description: enBySlug[item.slug].description,
  tag: indexTags[item.slug]?.[1] ?? enBySlug[item.slug].title,
}));

const out = `import type { Locale } from '../config';

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
  it: ${JSON.stringify(itMagnets, null, 2)},
  en: ${JSON.stringify(enMagnets, null, 2)},
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
  it: ${JSON.stringify(indexIt, null, 2)},
  en: ${JSON.stringify(indexEn, null, 2)},
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
      'Approfondimenti pratici sull\\'argomento',
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
`;

fs.writeFileSync('src/i18n/pages/lead-magnets.ts', out, 'utf8');
console.log('Generated src/i18n/pages/lead-magnets.ts');
