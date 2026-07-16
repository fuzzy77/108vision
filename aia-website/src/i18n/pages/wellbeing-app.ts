import type { Locale } from '../config';
import type { HowItWorksStep, LocaleContent, TextCard } from './types';

export interface WellbeingAppFeature {
  title: string;
  description: string;
}

export interface CounselorExample {
  title: string;
  description: string;
  highlighted?: boolean;
}

export interface WellbeingAppContent {
  meta: { title: string; description: string };
  hero: {
    title: string;
    subtitle: string;
    intro: string;
    downloadCta: string;
    featuresCta: string;
  };
  problem: {
    heading: string;
    intro: string;
    traditional: { title: string; items: string[] };
    wellbeing108: { title: string; items: string[] };
  };
  features: { heading: string; subtitle: string; items: WellbeingAppFeature[] };
  howItWorks: { heading: string; steps: HowItWorksStep[] };
  ai: {
    tag: string;
    heading: string;
    intro: string;
    items: string[];
    counselorLabel: string;
    counselorSubtitle: string;
    examples: CounselorExample[];
  };
  pricing: {
    heading: string;
    intro: string;
    items: TextCard[];
  };
  corporate: {
    tag: string;
    heading: string;
    intro: string;
    items: string[];
    imageCaption: string;
  };
  download: {
    heading: string;
    intro: string;
    googlePlay: string;
    appStore: string;
    footnote: string;
  };
  builtBy: { title: string; text: string };
}

const content: LocaleContent<WellbeingAppContent> = {
  it: {
    meta: {
      title: 'Wellbeing 108 — App di benessere guidato',
      description:
        'App di benessere guidato con visualizzazioni immersive, respirazione sincronizzata, AI counselor e sessioni audio personalizzate. Disponibile su Android e iOS.',
    },
    hero: {
      title: 'Wellbeing 108',
      subtitle: 'by 108 Vision',
      intro:
        "Trasforma il benessere quotidiano in un'esperienza guidata. Visualizzazioni immersive, respirazione sincronizzata e AI counselor — tutto in un'unica app.",
      downloadCta: "Scarica l'app",
      featuresCta: 'Scopri le funzionalità',
    },
    problem: {
      heading: 'Il problema con le app di benessere',
      intro:
        "La maggior parte delle app offre solo timer per la respirazione o podcast generici. Nessuna sincronizza davvero contenuti audio, esercizi di respiro e percorsi guidati in un'esperienza unica e personalizzata.",
      traditional: {
        title: 'App tradizionali',
        items: [
          'Contenuti generici uguali per tutti',
          "Timer respirazione scollegati dall'audio",
          'Abbonamento mensile anche se usi poco',
          'Nessuna personalizzazione AI reale',
        ],
      },
      wellbeing108: {
        title: 'Wellbeing 108',
        items: [
          'Sessioni costruite su misura dalla tua libreria',
          'Respiro sincronizzato con audio e visualizzazioni',
          'Pacchetti acquistabili — paghi solo quello che usi',
          'AI Counselor che pianifica sessioni reali con i tuoi contenuti',
        ],
      },
    },
    features: {
      heading: 'Cosa rende Wellbeing 108 diversa',
      subtitle: "Un'esperienza integrata, non un insieme di funzioni slegate.",
      items: [
        { title: 'Sessioni Audio Immersive', description: 'Pacchetti audio premium con stream, musiche e percorsi guidati. Scaricabili per uso offline completo.' },
        { title: 'Respirazione Integrata', description: 'Anello del respiro sincronizzato con la sessione. Non un timer separato — parte del flusso audio.' },
        { title: 'AI Counselor', description: "Testo e piano di sessione generati dall'AI usando solo contenuti della tua libreria. Con voce sintetizzata." },
        { title: 'AI Visualization', description: "L'AI seleziona e combina i tuoi contenuti in un percorso personalizzato basato sul tuo stato d'animo." },
        { title: 'Offline-First', description: 'Scarica i contenuti e usali ovunque. Lo stato personale resta sincronizzato quando torni online.' },
        { title: 'Pause Personalizzabili', description: 'Contenuti davvero tuoi: ritmo, durata e combinazioni controllabili dentro percorsi narrativi acquistati.' },
      ],
    },
    howItWorks: {
      heading: 'Come funziona',
      steps: [
        { title: 'Scegli', text: 'Esplora i pacchetti e acquista quelli che risuonano con te.' },
        { title: 'Scarica', text: 'Download dei contenuti per uso offline, sempre disponibili.' },
        { title: 'Vivi', text: 'Sessione guidata: audio + respiro + visual, tutto sincronizzato.' },
        { title: 'Evolvi', text: "L'AI Counselor suggerisce sessioni sempre nuove dalla tua libreria." },
      ],
    },
    ai: {
      tag: 'Intelligenza Artificiale Responsabile',
      heading: 'AI che lavora con i tuoi contenuti',
      intro:
        'Il nostro AI Counselor non genera contenuti dal nulla. Usa esclusivamente la libreria di pacchetti che hai acquistato per creare piani di sessione personalizzati.',
      items: [
        'Pianificazione sessioni basata sul tuo catalogo',
        'Voce sintetizzata per guidance personalizzata',
        'Crediti senza scadenza — nessun abbonamento obbligatorio',
        'Santuario cloud: salva e rivivi le sessioni migliori',
      ],
      counselorLabel: 'AI Counselor',
      counselorSubtitle: 'Sessione suggerita per oggi',
      examples: [
        { title: 'Focus e concentrazione', description: '30 min — 3 stream + respirazione 4-7-8' },
        { title: 'Rilassamento serale', description: '20 min — 2 stream + respirazione lenta' },
        { title: 'Visualizzazione creativa', description: '45 min — percorso completo con pausa personalizzata', highlighted: true },
      ],
    },
    pricing: {
      heading: 'Paghi solo quello che usi',
      intro: 'Nessun abbonamento obbligatorio. Acquista pacchetti e crediti AI quando vuoi.',
      items: [
        { title: 'Pacchetti Audio', text: 'Stream, musiche e percorsi guidati. Acquista una volta, tieni per sempre.' },
        { title: 'Crediti AI', text: 'Crediti per sessioni AI Counselor e Visualization. Non scadono mai.' },
        { title: 'Abbonamento Annuale', text: 'Tutto incluso: tutti i pacchetti + AI illimitata + crediti mensili bonus.' },
      ],
    },
    corporate: {
      tag: 'Per le aziende',
      heading: 'Corporate Wellness',
      intro:
        "Wellbeing 108 supporta login enterprise-ready e gestione gruppi. Offri ai tuoi dipendenti uno strumento concreto per gestire stress e focus — non l'ennesimo benefit dimenticato.",
      items: [
        'Onboarding team con sessioni guidate pre-configurate',
        'Dashboard utilizzo aggregato (anonimo)',
        'Pacchetti contenuti personalizzabili per settore',
        'SSO / SAML integrazione enterprise',
      ],
      imageCaption: 'Disponibile per team da 10+ persone',
    },
    download: {
      heading: 'Scarica Wellbeing 108',
      intro: 'Disponibile su Android e iOS. Inizia con una sessione gratuita.',
      googlePlay: 'Google Play',
      appStore: 'App Store',
      footnote: 'Prima sessione gratuita. Nessuna carta di credito richiesta.',
    },
    builtBy: {
      title: 'Un prodotto 108 Vision',
      text: 'Progettata e sviluppata da Elios Scoglio con la stessa attenzione ai dettagli che portiamo nei progetti enterprise.',
    },
  },
  en: {
    meta: {
      title: 'Wellbeing 108 — Guided Wellness App',
      description:
        'Guided wellness app with immersive visualizations, synchronized breathing, AI counselor, and personalized audio sessions. Available on Android and iOS.',
    },
    hero: {
      title: 'Wellbeing 108',
      subtitle: 'by 108 Vision',
      intro:
        'Transform daily wellbeing into a guided experience. Immersive visualizations, synchronized breathing, and AI counselor — all in one app.',
      downloadCta: 'Download the app',
      featuresCta: 'Discover features',
    },
    problem: {
      heading: 'The problem with wellness apps',
      intro:
        'Most apps only offer breathing timers or generic podcasts. None truly synchronizes audio content, breathing exercises, and guided paths into a unique, personalized experience.',
      traditional: {
        title: 'Traditional apps',
        items: [
          'Generic content, same for everyone',
          'Breathing timers disconnected from audio',
          'Monthly subscription even with little use',
          'No real AI personalization',
        ],
      },
      wellbeing108: {
        title: 'Wellbeing 108',
        items: [
          'Sessions custom-built from your library',
          'Breathing synchronized with audio and visualizations',
          'Purchasable packages — pay only for what you use',
          'AI Counselor that plans real sessions with your content',
        ],
      },
    },
    features: {
      heading: 'What makes Wellbeing 108 different',
      subtitle: 'An integrated experience, not a collection of disconnected functions.',
      items: [
        { title: 'Immersive Audio Sessions', description: 'Premium audio packages with streams, music, and guided paths. Downloadable for full offline use.' },
        { title: 'Integrated Breathing', description: 'Breathing loop synchronized with the session. Not a separate timer — part of the audio flow.' },
        { title: 'AI Counselor', description: 'Session text and plan generated by AI using only content from your library. With synthesized voice.' },
        { title: 'AI Visualization', description: 'AI selects and combines your content into a personalized path based on your mood.' },
        { title: 'Offline-First', description: 'Download content and use it anywhere. Personal state stays synced when you come back online.' },
        { title: 'Customizable Pauses', description: 'Truly your content: rhythm, duration, and combinations controllable within purchased narrative paths.' },
      ],
    },
    howItWorks: {
      heading: 'How it works',
      steps: [
        { title: 'Choose', text: 'Explore packages and purchase those that resonate with you.' },
        { title: 'Download', text: 'Download content for offline use, always available.' },
        { title: 'Experience', text: 'Guided session: audio + breath + visual, all synchronized.' },
        { title: 'Evolve', text: 'The AI Counselor suggests new sessions from your library.' },
      ],
    },
    ai: {
      tag: 'Responsible Artificial Intelligence',
      heading: 'AI that works with your content',
      intro:
        "Our AI Counselor does not generate content from scratch. It exclusively uses the library of packages you have purchased to create personalized session plans.",
      items: [
        'Session planning based on your catalog',
        'Synthesized voice for personalized guidance',
        'Credits without expiration — no mandatory subscription',
        'Cloud sanctuary: save and relive the best sessions',
      ],
      counselorLabel: 'AI Counselor',
      counselorSubtitle: 'Suggested session for today',
      examples: [
        { title: 'Focus and concentration', description: '30 min — 3 streams + 4-7-8 breathing' },
        { title: 'Evening relaxation', description: '20 min — 2 streams + slow breathing' },
        { title: 'Creative visualization', description: '45 min — complete path with personalized pause', highlighted: true },
      ],
    },
    pricing: {
      heading: 'Pay only for what you use',
      intro: 'No mandatory subscription. Purchase packages and AI credits whenever you want.',
      items: [
        { title: 'Audio Packages', text: 'Streams, music, and guided paths. Buy once, keep forever.' },
        { title: 'AI Credits', text: 'Credits for AI Counselor and Visualization sessions. Never expire.' },
        { title: 'Annual Subscription', text: 'All-inclusive: all packages + unlimited AI + monthly bonus credits.' },
      ],
    },
    corporate: {
      tag: 'For businesses',
      heading: 'Corporate Wellness',
      intro:
        'Wellbeing 108 supports enterprise-ready login and group management. Offer your employees a concrete tool to manage stress and focus — not just another forgotten benefit.',
      items: [
        'Team onboarding with pre-configured guided sessions',
        'Aggregated usage dashboard (anonymous)',
        'Customizable content packages by sector',
        'SSO / SAML enterprise integration',
      ],
      imageCaption: 'Available for teams of 10+ people',
    },
    download: {
      heading: 'Download Wellbeing 108',
      intro: 'Available on Android and iOS. Start with a free session.',
      googlePlay: 'Google Play',
      appStore: 'App Store',
      footnote: 'First session free. No credit card required.',
    },
    builtBy: {
      title: 'A 108 Vision product',
      text: 'Designed and developed by Elios Scoglio with the same attention to detail we bring to enterprise projects.',
    },
  },
};

export function getWellbeingAppContent(locale: Locale): WellbeingAppContent {
  return content[locale];
}
