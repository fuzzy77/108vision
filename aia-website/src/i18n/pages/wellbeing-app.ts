import type { Locale } from '../config';
import type { HowItWorksStep, LocaleContent } from './types';

export interface WellbeingAppFeature {
  title: string;
  description: string;
}

export interface PricingPlan {
  name: string;
  price: string;
  description: string;
  highlighted?: boolean;
}

export interface WellbeingAppContent {
  meta: { title: string; description: string };
  brand: {
    name: string;
    signature: string;
    claim: string;
  };
  hero: {
    intro: string;
    primaryCta: string;
    secondaryCta: string;
  };
  features: {
    heading: string;
    subtitle: string;
    items: WellbeingAppFeature[];
  };
  ai: {
    heading: string;
    intro: string;
    flowLabel: string;
    steps: string[];
    note: string;
  };
  howItWorks: {
    heading: string;
    steps: HowItWorksStep[];
  };
  packages: {
    heading: string;
    subtitle: string;
    items: WellbeingAppFeature[];
  };
  pricing: {
    heading: string;
    intro: string;
    footnote: string;
    plans: PricingPlan[];
  };
  download: {
    heading: string;
    intro: string;
    storeCta: string;
    googlePlay: string;
    appStore: string;
    comingSoon: string;
    footnote: string;
  };
  disclaimer: string;
  legal: {
    privacy: string;
    terms: string;
    support: string;
  };
  builtBy: { title: string; text: string };
  urls: {
    storeLanding: string;
    privacy: string;
    terms: string;
    supportEmail: string;
    googlePlay: string | null;
    appStore: string | null;
  };
}

const STORE_LANDING = 'https://wellbeing-api-108.azurewebsites.net/store/';
const SUPPORT_EMAIL = '108@postecert.it';

const content: LocaleContent<WellbeingAppContent> = {
  it: {
    meta: {
      title: 'WellBeing — Visualizza. Respira. Ascolta.',
      description:
        'App di visualizzazioni guidate, cerchio del respiro e Consigliere AI: da te all’audio. WellBeing by 108 Vision.',
    },
    brand: {
      name: 'WellBeing',
      signature: 'by 108 Vision',
      claim: 'Visualizza. Respira. Ascolta.',
    },
    hero: {
      intro:
        'Sessioni guidate per obiettivi, meditazione, sonno e trasformazione. Quando serve, ciò che scrivi diventa una visualizzazione audio personale.',
      primaryCta: 'Inizia una sessione',
      secondaryCta: 'Scopri le funzioni',
    },
    features: {
      heading: 'Quattro pratiche, un’esperienza',
      subtitle: 'Feature a parità: nessuna scalza le altre. Il Consigliere AI è il differenziatore, non l’unico motivo per scaricare.',
      items: [
        {
          title: 'Visualizzazioni guidate',
          description:
            'Percorsi audio per obiettivi, meditazione, sonno e trasformazione. Catalogo chiaro, pronto all’ascolto.',
        },
        {
          title: 'Cerchio del respiro',
          description:
            'Tempi impostabili per inspiro, trattenimento ed espiro. Il respiro diventa parte della sessione, non un timer isolato.',
        },
        {
          title: 'Pezzi nelle pause',
          description:
            'Musica di sottofondo e pezzi audio nelle pause per ripetere lo stimolo che desideri, al tuo ritmo.',
        },
        {
          title: 'Consigliere AI',
          description:
            'Scrivi come ti senti, leggi l’anteprima, genera l’audio con voce femminile o maschile. Da te all’audio.',
        },
      ],
    },
    ai: {
      heading: 'Da te all’audio',
      intro:
        'Il Consigliere AI non è un chatbot. È il modo in cui ciò che scrivi diventa una visualizzazione audio personale, a fianco del catalogo guidato.',
      flowLabel: 'Flusso',
      steps: ['Prompt', 'Anteprima testo', 'Audio personale', 'Riascolto'],
      note: 'Accesso e crediti si acquistano sullo store. I crediti non scadono.',
    },
    howItWorks: {
      heading: 'Come funziona',
      steps: [
        { title: 'Scegli', text: 'Apri una visualizzazione guidata o parti dal Consigliere AI.' },
        { title: 'Respira', text: 'Sincronizza il cerchio del respiro con la sessione.' },
        { title: 'Ascolta', text: 'Segui l’audio, anche con pezzi nelle pause e musica di sottofondo.' },
        { title: 'Crea', text: 'Quando vuoi: prompt → anteprima → audio personale.' },
      ],
    },
    packages: {
      heading: 'Pacchetti di visualizzazione',
      subtitle: 'Un catalogo chiaro. Acquisti ciò che usi.',
      items: [
        {
          title: 'Pacchetto base',
          description: 'Punto di partenza: obiettivi, meditazione, respiro.',
        },
        {
          title: 'Sogno e sonno',
          description: 'Per lasciarti andare la sera.',
        },
        {
          title: 'Evoluzione',
          description: 'Dal dolore alla luce — percorsi di trasformazione interiore.',
        },
      ],
    },
    pricing: {
      heading: 'Accesso e crediti',
      intro: 'Alcune funzioni richiedono acquisto in-app o abbonamento. Prezzi indicativi per l’Italia.',
      footnote: 'I prezzi effettivi sono quelli mostrati sullo store al momento dell’acquisto.',
      plans: [
        {
          name: 'AI Starter',
          price: '~3,69 €',
          description: 'Accesso al Consigliere AI con crediti iniziali.',
        },
        {
          name: 'Smart',
          price: '~5,99 €',
          description: 'Più crediti per creare e riascoltare sessioni personali.',
          highlighted: true,
        },
        {
          name: 'Premium+AI',
          price: '~8,99 €/anno',
          description: 'Abbonamento annuale con accesso e crediti periodici.',
        },
        {
          name: 'Ricarica 20',
          price: '~4,89 €',
          description: 'Pacchetto crediti. I crediti non scadono.',
        },
      ],
    },
    download: {
      heading: 'Inizia una sessione',
      intro: 'Disponibile su Android e iOS. Italiano, inglese e spagnolo.',
      storeCta: 'Apri la pagina store',
      googlePlay: 'Google Play',
      appStore: 'App Store',
      comingSoon: 'Link store in arrivo — usa la landing ufficiale nel frattempo.',
      footnote: 'WellBeing by 108 Vision',
    },
    disclaimer:
      'I contenuti supportano il benessere quotidiano e non sostituiscono il parere di un medico o di uno specialista. In emergenza contatta i servizi competenti.',
    legal: {
      privacy: 'Privacy',
      terms: 'Termini',
      support: 'Supporto',
    },
    builtBy: {
      title: 'WellBeing by 108 Vision',
      text: 'Prodotto consumer di 108 Vision. Stessa cura operativa che portiamo nei progetti enterprise — tradotta in un’app di pratica quotidiana.',
    },
    urls: {
      storeLanding: STORE_LANDING,
      privacy: 'https://wellbeing-api-108.azurewebsites.net/legal/privacy.it.html',
      terms: 'https://wellbeing-api-108.azurewebsites.net/legal/terms.it.html',
      supportEmail: SUPPORT_EMAIL,
      googlePlay: null,
      appStore: null,
    },
  },
  en: {
    meta: {
      title: 'WellBeing — Visualize. Breathe. Listen.',
      description:
        'Guided visualizations, breath circle and AI Counselor: from your words to personal audio. WellBeing by 108 Vision.',
    },
    brand: {
      name: 'WellBeing',
      signature: 'by 108 Vision',
      claim: 'Visualize. Breathe. Listen.',
    },
    hero: {
      intro:
        'Guided sessions for goals, meditation, sleep and transformation. When you need it, what you write becomes a personal audio visualization.',
      primaryCta: 'Start a session',
      secondaryCta: 'Explore features',
    },
    features: {
      heading: 'Four practices, one experience',
      subtitle: 'Equal features: none outranks the others. The AI Counselor is the differentiator — not the only reason to download.',
      items: [
        {
          title: 'Guided visualizations',
          description:
            'Audio paths for goals, meditation, sleep and transformation. A clear catalog, ready to play.',
        },
        {
          title: 'Breath circle',
          description:
            'Set inhale, hold and exhale timings. Breath is part of the session — not a separate timer.',
        },
        {
          title: 'Pause pieces',
          description:
            'Background music and audio pieces in the pauses so you can repeat the stimulus you want, at your pace.',
        },
        {
          title: 'AI Counselor',
          description:
            'Write how you feel, read the preview, generate audio with a female or male voice. From you to audio.',
        },
      ],
    },
    ai: {
      heading: 'From you to audio',
      intro:
        'The AI Counselor is not a chatbot. It is how what you write becomes a personal audio visualization — alongside the guided catalog.',
      flowLabel: 'Flow',
      steps: ['Prompt', 'Text preview', 'Personal audio', 'Replay'],
      note: 'Access and credits are purchased on the store. Credits do not expire.',
    },
    howItWorks: {
      heading: 'How it works',
      steps: [
        { title: 'Choose', text: 'Open a guided visualization or start from the AI Counselor.' },
        { title: 'Breathe', text: 'Sync the breath circle with your session.' },
        { title: 'Listen', text: 'Follow the audio, including pause pieces and background music.' },
        { title: 'Create', text: 'When you want: prompt → preview → personal audio.' },
      ],
    },
    packages: {
      heading: 'Visualization packages',
      subtitle: 'A clear catalog. Buy what you use.',
      items: [
        {
          title: 'Starter pack',
          description: 'Starting point: goals, meditation, breath.',
        },
        {
          title: 'Dream & sleep',
          description: 'Let go in the evening.',
        },
        {
          title: 'Evolution',
          description: 'From pain to light — paths of inner transformation.',
        },
      ],
    },
    pricing: {
      heading: 'Access and credits',
      intro: 'Some features require an in-app purchase or subscription. Indicative Italy pricing.',
      footnote: 'Actual prices are those shown on the store at purchase time.',
      plans: [
        {
          name: 'AI Starter',
          price: '~€3.69',
          description: 'AI Counselor access with starter credits.',
        },
        {
          name: 'Smart',
          price: '~€5.99',
          description: 'More credits to create and replay personal sessions.',
          highlighted: true,
        },
        {
          name: 'Premium+AI',
          price: '~€8.99/year',
          description: 'Annual subscription with access and periodic credits.',
        },
        {
          name: 'Top-up 20',
          price: '~€4.89',
          description: 'Credit pack. Credits do not expire.',
        },
      ],
    },
    download: {
      heading: 'Start a session',
      intro: 'Available on Android and iOS. Italian, English and Spanish.',
      storeCta: 'Open store landing',
      googlePlay: 'Google Play',
      appStore: 'App Store',
      comingSoon: 'Store links coming soon — use the official landing in the meantime.',
      footnote: 'WellBeing by 108 Vision',
    },
    disclaimer:
      'Content supports everyday wellbeing and does not replace advice from a doctor or specialist. In an emergency, contact the appropriate services.',
    legal: {
      privacy: 'Privacy',
      terms: 'Terms',
      support: 'Support',
    },
    builtBy: {
      title: 'WellBeing by 108 Vision',
      text: 'A consumer product from 108 Vision. The same operational care we bring to enterprise work — translated into a daily practice app.',
    },
    urls: {
      storeLanding: STORE_LANDING,
      privacy: 'https://wellbeing-api-108.azurewebsites.net/legal/privacy.en.html',
      terms: 'https://wellbeing-api-108.azurewebsites.net/legal/terms.en.html',
      supportEmail: SUPPORT_EMAIL,
      googlePlay: null,
      appStore: null,
    },
  },
};

export function getWellbeingAppContent(locale: Locale): WellbeingAppContent {
  return content[locale];
}
