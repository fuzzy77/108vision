import type { Locale } from '../config';

export interface HomeService {
  title: string;
  description: string;
  icon: string;
  link: string;
}

export interface HomeTestimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

export interface HomeContent {
  meta: { title: string; description: string };
  hero: { title: string; subtitle: string };
  services: {
    heading: string;
    subheading: string;
    items: HomeService[];
  };
  stats: {
    items: { value: string; label: string; detail: string }[];
  };
  testimonials: {
    heading: string;
    subheading: string;
    items: HomeTestimonial[];
  };
  wellbeing: {
    title: string;
    description: string;
  };
  cta: {
    title: string;
    description: string;
  };
}

const homeContent: Record<Locale, HomeContent> = {
  it: {
    meta: {
      title: 'AI & Technology Consulting',
      description:
        'Consulenza AI, Fractional CTO, Architettura Software e Trasformazione Digitale. Aiuto PMI e enterprise a crescere con la tecnologia giusta.',
    },
    hero: {
      title: "Trasforma la tua azienda con l'AI e la tecnologia giusta",
      subtitle:
        'Consulenza strategica e operativa per PMI e enterprise che vogliono innovare senza rischi. 15+ anni di esperienza in architettura software, AI e trasformazione digitale.',
    },
    services: {
      heading: 'Come posso aiutarti',
      subheading:
        'Servizi di consulenza technology-driven per ogni fase della tua crescita aziendale.',
      items: [
        {
          title: 'AI Platform',
          description:
            "L'AI che ti conosce davvero: memoria persistente, Desktop Agent, governance integrata. 5-10x meno di ChatGPT Teams.",
          icon: '🤖',
          link: '/ai-platform',
        },
        {
          title: 'AI Adoption',
          description:
            "Percorso strutturato per adottare l'AI in azienda. Assessment, strategia, implementazione.",
          icon: '🧠',
          link: '/ai-adoption',
        },
        {
          title: 'Fractional CTO',
          description:
            'CTO part-time per startup e PMI. Governance tecnica, team building, architettura.',
          icon: '👔',
          link: '/fractional-cto',
        },
        {
          title: 'Trasformazione Digitale',
          description:
            'Digitalizzazione processi, automazione, cloud migration. Focus PMI con ROI misurabile.',
          icon: '🔄',
          link: '/trasformazione-digitale',
        },
        {
          title: 'Architettura Software',
          description:
            'Design review, modernizzazione legacy, microservizi, cloud-native. Per team che vogliono scalare.',
          icon: '🏗️',
          link: '/architettura',
        },
        {
          title: 'Tech Leadership',
          description:
            'Coaching per tech lead e engineering manager. Da individual contributor a leader.',
          icon: '🎯',
          link: '/leadership',
        },
        {
          title: 'Sviluppo Software',
          description:
            'Progetto a scope fisso o team dedicato continuativo. Milestone visibili, qualità garantita, zero sorprese.',
          icon: '💻',
          link: '/sviluppo',
        },
        {
          title: 'Agile & DevOps',
          description:
            'CI/CD, team topology, metodologia agile pragmatica. Assessment e implementazione.',
          icon: '⚡',
          link: '/agile-devops',
        },
        {
          title: 'Tech Wellbeing',
          description:
            'Prevenzione burnout tech, sustainable pace, team health. Workshop e consulenza.',
          icon: '🌱',
          link: '/wellbeing',
        },
        {
          title: 'Pubblica Amministrazione',
          description:
            'Consulenza digitalizzazione per enti pubblici. PNRR, interoperabilità, sicurezza.',
          icon: '🏛️',
          link: '/pubblica-amministrazione',
        },
      ],
    },
    stats: {
      items: [
        {
          value: '15+',
          label: 'Anni di esperienza',
          detail: 'Enterprise systems, startup, PMI',
        },
        {
          value: '50+',
          label: 'Progetti completati',
          detail: 'Architettura, AI, trasformazione',
        },
        {
          value: '3',
          label: 'Settori di focus',
          detail: 'Ticketing, fintech, manufacturing',
        },
      ],
    },
    testimonials: {
      heading: 'Cosa dicono i clienti',
      subheading: 'Risultati concreti, non promesse.',
      items: [
        {
          quote:
            'Elios ci ha aiutato a costruire una piattaforma AI interna che ha ridotto del 40% i tempi di risposta al cliente. Competenza tecnica e visione strategica rare da trovare insieme.',
          author: 'Marco Bianchi',
          role: 'CEO',
          company: 'TechStartup Srl',
        },
        {
          quote:
            "Il percorso di AI Adoption ha trasformato il modo in cui lavoriamo. Niente hype, solo risultati concreti e misurabili. Un approccio pragmatico e orientato al business.",
          author: 'Laura Verdi',
          role: 'COO',
          company: 'Manifattura Italiana SpA',
        },
        {
          quote:
            'Come Fractional CTO ci ha portato una governance tecnica che non avevamo. Il team è cresciuto in autonomia e la qualità del codice è migliorata enormemente.',
          author: 'Andrea Russo',
          role: 'Founder',
          company: 'InnovaDigital',
        },
      ],
    },
    wellbeing: {
      title: 'Wellbeing 108',
      description:
        'App di benessere guidato con visualizzazioni immersive, respirazione sincronizzata e AI counselor. Un prodotto 108 Vision.',
    },
    cta: {
      title: 'Pronto a iniziare?',
      description:
        'Prenota una call gratuita di 30 minuti. Analizzeremo insieme la tua situazione e capiremo se posso aiutarti.',
    },
  },
  en: {
    meta: {
      title: 'AI & Technology Consulting',
      description:
        'AI consulting, Fractional CTO, software architecture and digital transformation. I help SMEs and enterprises grow with the right technology.',
    },
    hero: {
      title: 'Transform your business with the right AI and technology',
      subtitle:
        'Strategic and hands-on consulting for SMEs and enterprises that want to innovate without unnecessary risk. 15+ years in software architecture, AI and digital transformation.',
    },
    services: {
      heading: 'How I can help',
      subheading:
        'Technology-driven consulting services for every stage of your business growth.',
      items: [
        {
          title: 'AI Platform',
          description:
            'AI that truly knows you: persistent memory, Desktop Agent, built-in governance. 5–10x less than ChatGPT Teams.',
          icon: '🤖',
          link: '/ai-platform',
        },
        {
          title: 'AI Adoption',
          description:
            'Structured path to adopt AI in your company. Assessment, strategy, implementation.',
          icon: '🧠',
          link: '/ai-adoption',
        },
        {
          title: 'Fractional CTO',
          description:
            'Part-time CTO for startups and SMEs. Technical governance, team building, architecture.',
          icon: '👔',
          link: '/fractional-cto',
        },
        {
          title: 'Digital Transformation',
          description:
            'Process digitisation, automation, cloud migration. SME-focused with measurable ROI.',
          icon: '🔄',
          link: '/trasformazione-digitale',
        },
        {
          title: 'Software Architecture',
          description:
            'Design review, legacy modernisation, microservices, cloud-native. For teams ready to scale.',
          icon: '🏗️',
          link: '/architettura',
        },
        {
          title: 'Tech Leadership',
          description:
            'Coaching for tech leads and engineering managers. From individual contributor to leader.',
          icon: '🎯',
          link: '/leadership',
        },
        {
          title: 'Software Development',
          description:
            'Fixed-scope projects or dedicated ongoing teams. Visible milestones, guaranteed quality, no surprises.',
          icon: '💻',
          link: '/sviluppo',
        },
        {
          title: 'Agile & DevOps',
          description:
            'CI/CD, team topologies, pragmatic agile methodology. Assessment and implementation.',
          icon: '⚡',
          link: '/agile-devops',
        },
        {
          title: 'Tech Wellbeing',
          description:
            'Tech burnout prevention, sustainable pace, team health. Workshops and consulting.',
          icon: '🌱',
          link: '/wellbeing',
        },
        {
          title: 'Public Sector',
          description:
            'Digitalisation consulting for public bodies. PNRR, interoperability, security.',
          icon: '🏛️',
          link: '/pubblica-amministrazione',
        },
      ],
    },
    stats: {
      items: [
        {
          value: '15+',
          label: 'Years of experience',
          detail: 'Enterprise systems, startups, SMEs',
        },
        {
          value: '50+',
          label: 'Projects delivered',
          detail: 'Architecture, AI, transformation',
        },
        {
          value: '3',
          label: 'Focus industries',
          detail: 'Ticketing, fintech, manufacturing',
        },
      ],
    },
    testimonials: {
      heading: 'What clients say',
      subheading: 'Concrete results, not promises.',
      items: [
        {
          quote:
            'Elios helped us build an internal AI platform that cut customer response times by 40%. Technical expertise and strategic vision rarely found together.',
          author: 'Marco Bianchi',
          role: 'CEO',
          company: 'TechStartup Srl',
        },
        {
          quote:
            'The AI Adoption programme changed how we work. No hype — just concrete, measurable results. A pragmatic, business-oriented approach.',
          author: 'Laura Verdi',
          role: 'COO',
          company: 'Manifattura Italiana SpA',
        },
        {
          quote:
            'As Fractional CTO he brought the technical governance we were missing. The team grew in autonomy and code quality improved dramatically.',
          author: 'Andrea Russo',
          role: 'Founder',
          company: 'InnovaDigital',
        },
      ],
    },
    wellbeing: {
      title: 'Wellbeing 108',
      description:
        'Guided wellbeing app with immersive visualisations, synchronised breathing and AI counsellor. A 108 Vision product.',
    },
    cta: {
      title: 'Ready to get started?',
      description:
        'Book a free 30-minute call. We will review your situation together and see if I can help.',
    },
  },
};

export function getHomeContent(locale: Locale): HomeContent {
  return homeContent[locale];
}

/** Prefix service links for the active locale. */
export function localizeHomeLinks(content: HomeContent, locale: Locale): HomeContent {
  const prefix = locale === 'en' ? '/en' : '';
  return {
    ...content,
    services: {
      ...content.services,
      items: content.services.items.map((item) => ({
        ...item,
        link: `${prefix}${item.link}`,
      })),
    },
  };
}
