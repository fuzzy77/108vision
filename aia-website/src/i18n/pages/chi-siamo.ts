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
export interface ClientItem {
  name: string;
  role: string;
  text: string;
}

export interface AiExpertiseItem {
  title: string;
  text: string;
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
  experience: { heading: string; intro: string; items: ExperienceItem[] };
  clients: { heading: string; intro: string; items: ClientItem[] };
  aiExpertise: { heading: string; intro: string; items: AiExpertiseItem[] };
  cta: { title: string; description: string; ctaText: string };
}

const content: LocaleContent<ChiSiamoContent> = {
  it: {
    meta: {
      title: 'Chi Siamo',
      description:
        '108 Vision è il partner tecnico per PMI fondato da Elios Scoglio: ownership, architettura, delivery e AI applicata solo quando serve.',
    },
    breadcrumb: 'Chi Siamo',
    hero: {
      founderLabel: 'Elios Scoglio, Fondatore',
      title: 'Rigore enterprise, applicato alla scala di una PMI',
      subtitle: 'Elios Scoglio, fondatore di 108 Vision',
      paragraphs: [
        'L’esperienza maturata in TicketOne/Eventim Italy copre architettura e software in un contesto enterprise: sistemi complessi, continuità operativa, sicurezza, compliance e decisioni che devono restare comprensibili nel tempo.',
        'Ho fondato 108 Vision per portare quel metodo nelle PMI italiane senza importare la complessità dell’enterprise: trade-off espliciti, responsabilità chiare e software che il team possa governare.',
        '108 Vision prende ownership delle decisioni tecniche e dei deliverable concordati. Se hai già un team, gli diamo direzione. Se il software manca o non regge, lo progettiamo, costruiamo e facciamo evolvere.',
      ],
    },
    skills: {
      heading: 'Quattro responsabilità, non un elenco di tecnologie',
      groups: [
        {
          title: 'Ownership',
          items: ['Decisioni e deliverable con un responsabile chiaro', 'Rischi e priorità messi per iscritto', 'Presenza concordata, senza promesse di disponibilità continua'],
        },
        {
          title: 'Architettura e governance',
          items: ['Trade-off comprensibili anche al business', 'Roadmap, decisioni architetturali e confini delle integrazioni', 'Sicurezza, costi e operatività considerati prima del rilascio'],
        },
        {
          title: 'Delivery',
          items: ['Dal requisito al software in produzione', 'Qualità verificabile e feedback rapido', 'Consegna, gestione ed evoluzione con continuità'],
        },
        {
          title: 'AI-native, non AI-first',
          items: ['Partiamo dal problema, non dal modello', 'Usiamo l’AI solo con valore e rischi verificabili', 'Privacy, costi, qualità e fallback fanno parte del progetto'],
        },
      ],
    },
    philosophy: {
      heading: 'Come lavoriamo',
      items: [
        { title: 'Il problema prima della soluzione', text: 'Prima di proporre software o AI, verifichiamo cosa blocca davvero l’azienda e quale risultato rendere osservabile.' },
        { title: 'Decisioni che restano', text: 'Roadmap, rischi e scelte architetturali diventano deliverable scritti, non conoscenza lasciata in una call.' },
        { title: 'Autonomia, non dipendenza', text: 'Trasferiamo contesto e metodo al team. Restare partner non significa diventare un collo di bottiglia.' },
        { title: 'Perimetro onesto', text: 'Responsabilità e momenti di presenza sono concordati. Se serve una figura interna a tempo pieno, lo diciamo prima di iniziare.' },
      ],
    },
    experience: {
      heading: 'Da dove nasce il metodo',
      intro: 'L’esperienza di Elios dà origine al metodo; gli impegni verso il cliente sono quelli assunti da 108 Vision. I due contesti restano distinti.',
      items: [
        { period: 'Esperienza enterprise', title: 'TicketOne / CTS Eventim Group', description: 'Architettura, governance e modernizzazione di sistemi ticketing mission-critical.' },
        { period: 'Percorso professionale', title: 'Architettura, sviluppo e leadership tecnica', description: 'Esperienza costruita tra progettazione di sistemi, delivery, modernizzazione e crescita dei team, con responsabilità progressivamente più ampie.' },
        { period: '108 Vision', title: 'Partner tecnico per PMI italiane', description: 'Lo stesso rigore decisionale viene adattato a budget, team e vincoli delle PMI, scegliendo solo la complessità che serve.' },
      ],
    },
    clients: {
      heading: 'Clienti con cui ho lavorato',
      intro: 'Esperienza costruita su prodotti reali e contesti in cui ho guidato delivery, mobile e AI.',
      items: [
        { name: 'TicketOne / CTS Eventim', role: 'Head of Software Architecture & Development', text: 'Architettura, governance e modernizzazione di sistemi ticketing mission-critical.' },
        { name: 'Aruba S.p.A.', role: 'Engineering Manager / Tech Lead', text: 'Delivery cloud, app mobile React Native/Expo e automazione per le operations.' },
        { name: 'Toscano Immobiliare', role: 'Technical Leader / Cloud Architect', text: 'Document intelligence, semantic search e app nativa Blazor Hybrid/.NET MAUI.' },
      ],
    },
    aiExpertise: {
      heading: 'Expertise AI: dal prodotto al cliente',
      intro: 'L’AI la costruiamo e la usiamo davvero, non la raccontiamo: dalla mia app personale alle esperienze con i clienti.',
      items: [
        { title: 'App personale', text: 'WellBeing e l’AIA Platform: generazione, retrieval e semantic search, pipeline LLM con validazione, fallback e controllo dei costi.' },
        { title: 'Aruba', text: 'AI applicata all’analisi dei log e all’automazione operativa, dentro i controlli di qualità e rilascio esistenti.' },
        { title: 'Toscano Immobiliare', text: 'Document intelligence, valutazione predittiva, semantic search e contenuti generativi integrati in una piattaforma multi-tenant.' },
      ],
    },
    cta: {
      title: 'Ti manca direzione o ti manca il software?',
      description: 'Partiamo da questa domanda e definiamo il prossimo passo: Tech Assessment oppure Discovery.',
      ctaText: 'Prenota una call',
    },
  },
  en: {
    meta: {
      title: 'About Us',
      description:
        '108 Vision is the technical partner for SMEs founded by Elios Scoglio: ownership, architecture, delivery, and AI only where it adds value.',
    },
    breadcrumb: 'About Us',
    hero: {
      founderLabel: 'Elios Scoglio, Founder',
      title: 'Enterprise rigour, applied at SME scale',
      subtitle: 'Elios Scoglio, founder of 108 Vision',
      paragraphs: [
        'Experience gained at TicketOne/Eventim Italy spans architecture and software in an enterprise environment: complex systems, operational continuity, security, compliance, and decisions that must remain understandable over time.',
        'I founded 108 Vision to bring that method to Italian SMEs without importing enterprise complexity: explicit trade-offs, clear accountability, and software the team can govern.',
        '108 Vision takes ownership of agreed technical decisions and deliverables. If you already have a team, we give it direction. If the software is missing or no longer holds up, we design, build, and evolve it.',
      ],
    },
    skills: {
      heading: 'Four responsibilities, not a technology catalogue',
      groups: [
        { title: 'Ownership', items: ['A clear owner for decisions and deliverables', 'Written risks and priorities', 'Agreed availability, without promises of constant presence'] },
        { title: 'Architecture and governance', items: ['Trade-offs the business can understand', 'Roadmaps, architecture decisions, and integration boundaries', 'Security, cost, and operations considered before release'] },
        { title: 'Delivery', items: ['From requirement to production software', 'Verifiable quality and fast feedback', 'Delivery, operation, and continuous evolution'] },
        { title: 'AI-native, not AI-first', items: ['We start with the problem, not the model', 'We use AI only when value and risks can be tested', 'Privacy, cost, quality, and fallbacks are part of the design'] },
      ],
    },
    philosophy: {
      heading: 'How we work',
      items: [
        { title: 'The problem before the solution', text: 'Before proposing software or AI, we verify what is actually blocking the company and which outcome should become observable.' },
        { title: 'Decisions that last', text: 'Roadmaps, risks, and architecture choices become written deliverables, not knowledge left behind in a call.' },
        { title: 'Autonomy, not dependency', text: 'We transfer context and method to the team. Remaining a partner does not mean becoming a bottleneck.' },
        { title: 'An honest scope', text: 'Responsibilities and working sessions are agreed upfront. If you need a full-time internal leader, we say so before starting.' },
      ],
    },
    experience: {
      heading: 'Where the method comes from',
      intro: "Elios's experience shapes the method; client commitments are made by 108 Vision. The two contexts remain separate.",
      items: [
        { period: 'Enterprise experience', title: 'TicketOne / CTS Eventim Group', description: 'Architecture, governance, and modernisation of mission-critical ticketing systems.' },
        { period: 'Professional background', title: 'Architecture, development, and technical leadership', description: 'Experience spanning system design, delivery, modernisation, and team growth, with progressively broader responsibility.' },
        { period: '108 Vision', title: 'Technical partner for Italian SMEs', description: 'The same decision-making rigour is adapted to SME budgets, teams, and constraints, choosing only the complexity that is needed.' },
      ],
    },
    clients: {
      heading: 'Clients I have worked with',
      intro: 'Experience built on real products and contexts where I led delivery, mobile, and AI.',
      items: [
        { name: 'TicketOne / CTS Eventim', role: 'Head of Software Architecture & Development', text: 'Architecture, governance, and modernisation of mission-critical ticketing systems.' },
        { name: 'Aruba S.p.A.', role: 'Engineering Manager / Tech Lead', text: 'Cloud delivery, React Native/Expo mobile app, and automation for operations.' },
        { name: 'Toscano Immobiliare', role: 'Technical Leader / Cloud Architect', text: 'Document intelligence, semantic search, and a native Blazor Hybrid/.NET MAUI app.' },
      ],
    },
    aiExpertise: {
      heading: 'AI expertise: from my own app to client work',
      intro: 'We build and use AI for real, not just talk about it: from my personal app to client engagements.',
      items: [
        { title: 'Personal app', text: 'WellBeing and the AIA Platform: generation, retrieval and semantic search, LLM pipelines with validation, fallbacks and cost control.' },
        { title: 'Aruba', text: 'AI applied to log analysis and operational automation, inside existing quality and release controls.' },
        { title: 'Toscano Immobiliare', text: 'Document intelligence, predictive valuation, semantic search and generative content integrated into a multi-tenant platform.' },
      ],
    },
    cta: {
      title: 'Do you lack direction, or do you lack the software?',
      description: 'We start with that question and define the right next step: a Tech Assessment or Discovery.',
      ctaText: 'Book a call',
    },
  },
};

export function getChiSiamoContent(locale: Locale): ChiSiamoContent {
  return content[locale];
}
