import type { Locale } from './config';

const ui = {
  it: {
    site: {
      titleSuffix: 'Partner Tecnico',
      tagline: 'Il partner tecnico che prende in mano la situazione.',
      description:
        'Partner tecnico per PMI: Direzione Tecnica e Software in Mano. Ownership su decisioni e deliverable, ore chiare.',
      founderTitle: 'Fondatore & Software Architecture Manager',
    },
    nav: {
      services: 'Canali',
      aiPlatform: 'AI Platform',
      fractionalCto: 'Fractional CTO',
      direzioneTecnica: 'Direzione Tecnica',
      softwareInMano: 'Software in Mano',
      app: 'App',
      digitalStarter: 'Digital Starter',
      development: 'Sviluppo',
      about: 'Chi Siamo',
      blog: 'Blog',
      wellbeingApp: 'WellBeing',
      cta: 'Parliamone',
      openMenu: 'Apri menu',
    },
    footer: {
      tagline:
        'Il partner tecnico che prende in mano la situazione. Direzione Tecnica e Software in Mano per PMI italiane.',
      services: 'Canali',
      resources: 'Risorse',
      legal: 'Legale',
      privacy: 'Privacy Policy',
      cookies: 'Cookie Policy',
      terms: 'Termini di Servizio',
      contact: 'Contatti',
      rights: 'Tutti i diritti riservati.',
    },
    common: {
      home: 'Home',
      bookCall: 'Prenota una call gratuita',
      learnMore: 'Scopri di più',
      readyToStart: 'Pronto a iniziare?',
      ctaDescription:
        'Prenota una call gratuita di 30 minuti per capire come posso aiutarti.',
      discoverApp: "Scopri l'app",
    },
    contactForm: {
      name: 'Nome e Cognome',
      email: 'Email',
      company: 'Azienda',
      service: 'Prossimo passo più probabile',
      message: 'Messaggio',
      submit: 'Invia messaggio',
      placeholderName: 'Mario Rossi',
      placeholderEmail: 'mario@azienda.it',
      placeholderCompany: 'Nome azienda (opzionale)',
      placeholderMessage: 'Qual è il problema, chi se ne occupa oggi e cosa dovrebbe cambiare?',
      selectService: 'Seleziona il percorso',
      other: 'Altro',
      services: [
        'Tech Assessment — abbiamo già un team tecnico',
        'Discovery — dobbiamo costruire o far evolvere il software',
        'Partnership / co-delivery',
        'Altro',
      ],
    },
    leadMagnet: {
      freePdf: 'PDF Gratuito',
      downloadFree: 'Scarica gratis',
      downloadFreeHeading: 'Scarica gratis',
      downloadFreeSub: 'Nessun costo. Nessuno spam. Solo valore.',
      noCreditCard: 'Nessuna carta di credito',
      oneClickCancel: 'Cancellazione con un click',
      gdprCompliant: 'GDPR compliant',
      form: {
        name: 'Nome',
        email: 'Email',
        namePlaceholder: 'Il tuo nome',
        emailPlaceholder: 'la-tua@email.it',
        consent:
          'Acconsento al trattamento dei miei dati per ricevere il PDF e comunicazioni informative. Posso cancellarmi in ogni momento.',
        privacyLink: 'Privacy Policy',
        submit: 'Scarica la guida gratuita',
        submitting: 'Invio in corso...',
        errorGeneric: 'Errore. Riprova tra qualche istante.',
        errorConnection: 'Errore di connessione. Riprova.',
      },
    },
    contact: {
      title: 'Contatti',
      metaDescription:
        'Parla con 108 Vision: Tech Assessment per team che cercano direzione, Discovery per software da costruire o far evolvere, e partnership.',
      heading: 'Partiamo dal problema giusto',
      intro:
        'Hai già un team tecnico oppure ti serve costruire o far evolvere il software? La risposta indica il punto di partenza, non ti vincola a un servizio.',
      pathsHeading: 'Quale percorso descrive meglio la situazione?',
      paths: [
        {
          title: 'Hai già un team tecnico',
          description: 'Il team consegna, ma manca una direzione chiara su architettura, priorità, qualità o responsabilità.',
          nextStep: 'Punto di partenza: Tech Assessment',
        },
        {
          title: 'Ti serve il software',
          description: 'Il prodotto non esiste, non regge più oppure il fornitore attuale non ne prende ownership.',
          nextStep: 'Punto di partenza: Discovery',
        },
      ],
      partnershipTitle: 'Partnership e co-delivery',
      partnershipDescription:
        'Lavori in una software house, in consulenza o con un team specialistico? Valutiamo partnership su architettura, delivery e competenze complementari, con responsabilità definite.',
      appDescription:
        'Cerchi WellBeing? L’App resta disponibile come prodotto di 108 Vision, ma non è un servizio di consulenza da selezionare nel form.',
      appLink: 'Vai all’App',
      sendMessage: 'Invia un messaggio',
      bookDirect: 'Oppure prenota direttamente',
      email: 'Email',
      linkedin: 'LinkedIn',
      breadcrumb: 'Contatti',
    },
    service: {
      packagesHeading: 'Pacchetti disponibili',
      packagesSubheading:
        'Ogni percorso è personalizzato. Parliamone per trovare la formula giusta.',
      faqHeading: 'Domande frequenti',
      downloadGuide: 'Scarica la guida gratuita',
      downloadGuideDesc:
        'Scarica il PDF con domande diagnostiche, metodo, deliverable e criteri di fit. Nessuna email richiesta.',
      downloadPdf: 'Scarica PDF omaggio',
      recommended: 'Consigliato',
      requestQuote: 'Richiedi preventivo',
      letsTalk: 'Parliamone',
      startNow: 'Inizia ora',
      requestDemo: 'Richiedi demo',
    },
    legal: {
      privacy: {
        title: 'Privacy Policy — 108 Vision',
        metaDescription: 'Informativa sulla privacy',
        heading: 'Informativa sulla Privacy',
        body: 'Questa pagina è in fase di redazione. Per informazioni sulla gestione dei tuoi dati personali, contattaci a',
        email: 'privacy@108vision.it',
      },
      cookies: {
        title: 'Cookie Policy — 108 Vision',
        metaDescription: 'Informativa sui cookie',
        heading: 'Cookie Policy',
        body: "Questa pagina è in fase di redazione. Per informazioni sull'uso dei cookie, contattaci a",
        email: 'privacy@108vision.it',
      },
      terms: {
        title: 'Termini e Condizioni — 108 Vision',
        metaDescription: 'Termini e condizioni del servizio',
        heading: 'Termini e Condizioni',
        body: 'Questa pagina è in fase di redazione. Per informazioni sui termini del servizio, contattaci a',
        email: 'info@108vision.it',
      },
    },
  },
  en: {
    site: {
      titleSuffix: 'Technical Partner',
      tagline: 'The technical partner that takes ownership of the situation.',
      description:
        'Technical partner for SMEs: Technical Direction and Software in Hand. Ownership of decisions and deliverables, clear hours.',
      founderTitle: 'Founder & Software Architecture Manager',
    },
    nav: {
      services: 'Channels',
      aiPlatform: 'AI Platform',
      fractionalCto: 'Fractional CTO',
      direzioneTecnica: 'Technical Direction',
      softwareInMano: 'Software in Hand',
      app: 'App',
      digitalStarter: 'Digital Starter',
      development: 'Development',
      about: 'About Us',
      blog: 'Blog',
      wellbeingApp: 'WellBeing',
      cta: "Let's talk",
      openMenu: 'Open menu',
    },
    footer: {
      tagline:
        'The technical partner that takes ownership. Technical Direction and Software in Hand for growing SMEs.',
      services: 'Channels',
      resources: 'Resources',
      legal: 'Legal',
      privacy: 'Privacy Policy',
      cookies: 'Cookie Policy',
      terms: 'Terms of Service',
      contact: 'Contact',
      rights: 'All rights reserved.',
    },
    common: {
      home: 'Home',
      bookCall: 'Book a free call',
      learnMore: 'Learn more',
      readyToStart: 'Ready to get started?',
      ctaDescription: 'Book a free 30-minute call to see how I can help.',
      discoverApp: 'Discover the app',
    },
    contactForm: {
      name: 'Full name',
      email: 'Email',
      company: 'Company',
      service: 'Most likely next step',
      message: 'Message',
      submit: 'Send message',
      placeholderName: 'John Smith',
      placeholderEmail: 'john@company.com',
      placeholderCompany: 'Company name (optional)',
      placeholderMessage: 'What is the problem, who owns it today, and what should change?',
      selectService: 'Select a path',
      other: 'Other',
      services: [
        'Tech Assessment — we already have a technical team',
        'Discovery — we need to build or evolve software',
        'Partnership / co-delivery',
        'Other',
      ],
    },
    leadMagnet: {
      freePdf: 'Free PDF',
      downloadFree: 'Download free',
      downloadFreeHeading: 'Download free',
      downloadFreeSub: 'No cost. No spam. Just value.',
      noCreditCard: 'No credit card required',
      oneClickCancel: 'Unsubscribe in one click',
      gdprCompliant: 'GDPR compliant',
      form: {
        name: 'Name',
        email: 'Email',
        namePlaceholder: 'Your name',
        emailPlaceholder: 'you@company.com',
        consent:
          'I consent to the processing of my data to receive the PDF and informational communications. I can unsubscribe at any time.',
        privacyLink: 'Privacy Policy',
        submit: 'Download the free guide',
        submitting: 'Sending...',
        errorGeneric: 'Something went wrong. Please try again shortly.',
        errorConnection: 'Connection error. Please try again.',
      },
    },
    contact: {
      title: 'Contact',
      metaDescription:
        'Talk to 108 Vision: Tech Assessment for teams that need direction, Discovery for software to build or evolve, and partnerships.',
      heading: 'Start with the right problem',
      intro:
        'Do you already have a technical team, or do you need software built or evolved? The answer points to a starting point; it does not lock you into a service.',
      pathsHeading: 'Which path best describes your situation?',
      paths: [
        {
          title: 'You already have a technical team',
          description: 'The team delivers, but lacks clear direction on architecture, priorities, quality, or accountability.',
          nextStep: 'Starting point: Tech Assessment',
        },
        {
          title: 'You need the software',
          description: 'The product does not exist, no longer holds up, or the current supplier does not take ownership of it.',
          nextStep: 'Starting point: Discovery',
        },
      ],
      partnershipTitle: 'Partnerships and co-delivery',
      partnershipDescription:
        'Do you work in a software house, consultancy, or specialist team? We consider partnerships across architecture, delivery, and complementary expertise, with clear responsibilities.',
      appDescription:
        'Looking for WellBeing? The App remains available as a 108 Vision product, but it is not a consulting service to select in the form.',
      appLink: 'Go to the App',
      sendMessage: 'Send a message',
      bookDirect: 'Or book directly',
      email: 'Email',
      linkedin: 'LinkedIn',
      breadcrumb: 'Contact',
    },
    service: {
      packagesHeading: 'Available packages',
      packagesSubheading:
        'Every engagement is tailored. Let us find the right fit together.',
      faqHeading: 'Frequently asked questions',
      downloadGuide: 'Download the free guide',
      downloadGuideDesc:
        'Download the PDF with diagnostic questions, method, deliverables and fit criteria. No email required.',
      downloadPdf: 'Download free PDF',
      recommended: 'Recommended',
      requestQuote: 'Request a quote',
      letsTalk: "Let's talk",
      startNow: 'Get started',
      requestDemo: 'Request a demo',
    },
    legal: {
      privacy: {
        title: 'Privacy Policy — 108 Vision',
        metaDescription: 'Privacy policy',
        heading: 'Privacy Policy',
        body: 'This page is being finalised. For information about how we handle your personal data, contact us at',
        email: 'privacy@108vision.it',
      },
      cookies: {
        title: 'Cookie Policy — 108 Vision',
        metaDescription: 'Cookie policy',
        heading: 'Cookie Policy',
        body: 'This page is being finalised. For information about cookie usage, contact us at',
        email: 'privacy@108vision.it',
      },
      terms: {
        title: 'Terms & Conditions — 108 Vision',
        metaDescription: 'Terms of service',
        heading: 'Terms & Conditions',
        body: 'This page is being finalised. For information about our terms of service, contact us at',
        email: 'info@108vision.it',
      },
    },
  },
} as const satisfies Record<Locale, Record<string, unknown>>;

export type UiStrings = (typeof ui)[Locale];

export function useTranslations(locale: Locale): UiStrings {
  return ui[locale];
}

export function getNavItems(locale: Locale, t: UiStrings) {
  const path = (p: string) => (locale === 'it' ? p : `/en${p === '/' ? '' : p}`);

  return [
    { label: t.nav.softwareInMano, href: path('/software-in-mano') },
    { label: t.nav.direzioneTecnica, href: path('/direzione-tecnica') },
    { label: t.nav.app, href: path('/wellbeing') },
    { label: t.nav.about, href: path('/chi-siamo') },
    { label: t.nav.blog, href: path('/blog') },
  ];
}

export function getFooterServices(locale: Locale, t: UiStrings) {
  const path = (p: string) => (locale === 'it' ? p : `/en${p}`);

  return [
    { label: t.nav.softwareInMano, href: path('/software-in-mano') },
    { label: t.nav.direzioneTecnica, href: path('/direzione-tecnica') },
    { label: t.nav.app, href: path('/wellbeing') },
  ];
}

export { ui };
