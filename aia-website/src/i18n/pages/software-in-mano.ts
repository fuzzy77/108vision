import type { Locale } from '../config';
import type {
  HowItWorksStep,
  LocaleContent,
  ServiceFeature,
  ServicePlan,
  TextCard,
} from './types';

export interface SoftwareInManoContent {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: { title: string; subtitle: string };
  audience: { heading: string; intro: string; cards: TextCard[] };
  features: { heading: string; items: ServiceFeature[] };
  proof: { heading: string; text: string; cta: string; href: string };
  process: { heading: string; steps: HowItWorksStep[] };
  plans: ServicePlan[];
}

const content: LocaleContent<SoftwareInManoContent> = {
  it: {
    meta: {
      title: 'Software in Mano',
      description:
        'Progettiamo, costruiamo e facciamo evolvere il tuo software. Discovery, progetto fisso o retainer — un interlocutore unico che resta dopo la consegna.',
    },
    breadcrumb: 'Software in Mano',
    hero: {
      title: 'Il software lo costruiamo. E lo teniamo in mano.',
      subtitle:
        'Dalla definizione di cosa serve davvero, all’architettura, allo sviluppo, alle integrazioni, alla manutenzione evolutiva. Non spariamo dopo il go-live.',
    },
    audience: {
      heading: 'Per chi è',
      intro:
        'Per PMI che devono digitalizzare un pezzo critico del business, o adottare software esistente che non regge più — senza una software house che sparisce.',
      cards: [
        {
          title: 'Da zero',
          text: 'Serve un prodotto o un modulo che oggi non esiste. Prima capiamo lo scope, poi costruiamo.',
        },
        {
          title: 'Software da adottare',
          text: 'Hai già codice (o un fornitore), ma nessuno se ne prende cura: debito, integrazioni, evolutiva.',
        },
        {
          title: 'Integrazioni reali',
          text: 'Gestionale, CRM, flussi manuali che costano ore. Automazione e integrazioni con ROI misurabile.',
        },
      ],
    },
    features: {
      heading: 'Cosa include',
      items: [
        {
          title: 'Discovery chiusa',
          description:
            'Requisiti prioritizzati, architettura ad alto livello, stima onesta — prima di scrivere codice a vuoto.',
          icon: '🔍',
        },
        {
          title: 'Build con ownership',
          description:
            'Progetto a scope fisso o evolutiva a retainer. Milestone visibili, qualità e responsabilità sul risultato.',
          icon: '🛠️',
        },
        {
          title: 'AI dove crea valore',
          description:
            'Feature AI solo se c’è ROI entro 90 giorni. Non un progetto “AI” a parte — parte del prodotto.',
          icon: '✨',
        },
        {
          title: 'Restiamo dopo',
          description:
            'Manutenzione evolutiva, monitoring, priorità mensili. Il software resta in mano, non in un limbo.',
          icon: '🤝',
        },
      ],
    },
    proof: {
      heading: 'Prova concreta',
      text: 'WellBeing è un’app che abbiamo costruito e teniamo in mano — esempio del metodo Software in Mano, non un terzo canale.',
      cta: 'Scopri WellBeing',
      href: '/wellbeing',
    },
    process: {
      heading: 'Come funziona',
      steps: [
        {
          title: 'Call di scoping',
          text: 'Capire il problema in linguaggio business. Se serve build, partiamo da Discovery — non da una stima inventata.',
        },
        {
          title: 'Discovery',
          text: 'Scope chiuso, priorità, architettura e stima progetto o retainer. Sai cosa costa e cosa no.',
        },
        {
          title: 'Progetto o retainer',
          text: 'Consegna a milestone, oppure evolutiva mensile con ore chiare. Poi restiamo per far crescere il prodotto.',
        },
      ],
    },
    plans: [
      {
        name: 'Discovery',
        price: 'Entry',
        description: 'Scope, architettura, stima — senza impegno sul build.',
        features: [
          'Requisiti prioritizzati',
          'Architettura ad alto livello',
          'Stima progetto / retainer',
          'Decisioni go / no-go documentate',
        ],
        cta: 'Prenota una Discovery',
        highlighted: false,
      },
      {
        name: 'Build & evolve',
        price: 'Progetto / Retainer',
        description: 'Costruiamo e teniamo il software nel tempo.',
        features: [
          'Scope fisso o ore/mese',
          'Integrazioni e qualità',
          'AI solo con ROI chiaro',
          'Evolutiva dopo il go-live',
        ],
        cta: 'Parliamone',
        highlighted: true,
      },
    ],
  },
  en: {
    meta: {
      title: 'Software in Hand',
      description:
        'We design, build and evolve your software. Discovery, fixed project or retainer — one counterpart who stays after delivery.',
    },
    breadcrumb: 'Software in Hand',
    hero: {
      title: 'We build the software. And we keep it in hand.',
      subtitle:
        'From what you actually need, to architecture, build, integrations and ongoing evolution. We do not disappear after go-live.',
    },
    audience: {
      heading: 'Who it is for',
      intro:
        'For SMEs that need to digitise a critical business piece, or adopt existing software that no longer holds — without a software house that vanishes.',
      cards: [
        {
          title: 'From scratch',
          text: 'You need a product or module that does not exist yet. We clarify scope first, then build.',
        },
        {
          title: 'Software to adopt',
          text: 'You already have code (or a vendor), but nobody owns it: debt, integrations, evolution.',
        },
        {
          title: 'Real integrations',
          text: 'ERP, CRM, manual flows that burn hours. Automation and integrations with measurable ROI.',
        },
      ],
    },
    features: {
      heading: 'What you get',
      items: [
        {
          title: 'Closed Discovery',
          description:
            'Prioritised requirements, high-level architecture, honest estimate — before writing code into the void.',
          icon: '🔍',
        },
        {
          title: 'Build with ownership',
          description:
            'Fixed-scope project or retainer evolution. Visible milestones, quality, and accountability for outcomes.',
          icon: '🛠️',
        },
        {
          title: 'AI where it creates value',
          description:
            'AI features only if ROI within 90 days. Not a separate “AI project” — part of the product.',
          icon: '✨',
        },
        {
          title: 'We stay after',
          description:
            'Evolutionary maintenance, monitoring, monthly priorities. The software stays in hand, not in limbo.',
          icon: '🤝',
        },
      ],
    },
    proof: {
      heading: 'Concrete proof',
      text: 'WellBeing is an app we built and keep in hand — an example of the Software in Hand method, not a third channel.',
      cta: 'Discover WellBeing',
      href: '/wellbeing',
    },
    process: {
      heading: 'How it works',
      steps: [
        {
          title: 'Scoping call',
          text: 'Understand the business problem. If build is needed, we start with Discovery — not a made-up estimate.',
        },
        {
          title: 'Discovery',
          text: 'Closed scope, priorities, architecture and project/retainer estimate. You know what costs what.',
        },
        {
          title: 'Project or retainer',
          text: 'Milestone delivery, or monthly evolution with clear hours. Then we stay to grow the product.',
        },
      ],
    },
    plans: [
      {
        name: 'Discovery',
        price: 'Entry',
        description: 'Scope, architecture, estimate — no build commitment.',
        features: [
          'Prioritised requirements',
          'High-level architecture',
          'Project / retainer estimate',
          'Documented go / no-go',
        ],
        cta: 'Book a Discovery',
        highlighted: false,
      },
      {
        name: 'Build & evolve',
        price: 'Project / Retainer',
        description: 'We build and keep the software over time.',
        features: [
          'Fixed scope or hours/month',
          'Integrations and quality',
          'AI only with clear ROI',
          'Evolution after go-live',
        ],
        cta: "Let's talk",
        highlighted: true,
      },
    ],
  },
};

export function getSoftwareInManoContent(locale: Locale): SoftwareInManoContent {
  return content[locale];
}
