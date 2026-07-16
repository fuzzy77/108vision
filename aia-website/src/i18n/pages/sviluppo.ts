import type { Locale } from '../config';
import type {
  IconProblemCard,
  LocaleContent,
  ModeCard,
  ModeSection,
  PainPointCard,
  PdfGuideBlock,
  ServiceFeature,
  ServicePlan,
} from './types';

export interface SviluppoContent {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: { title: string; subtitle: string };
  modePicker: ModeCard[];
  project: {
    section: ModeSection;
    painPoints: PainPointCard[];
    features: { heading: string; items: ServiceFeature[] };
    plans: { heading: string; subheading: string; items: ServicePlan[] };
    guide: PdfGuideBlock;
  };
  factory: {
    section: ModeSection;
    painPoints: IconProblemCard[];
    features: { heading: string; items: ServiceFeature[] };
    plans: { heading: string; subheading: string; items: ServicePlan[] };
    guide: PdfGuideBlock;
  };
  cta: { heading: string; text: string; button: string };
}

const content: LocaleContent<SviluppoContent> = {
  it: {
    meta: {
      title: 'Sviluppo Software',
      description:
        'Progetti a scope definito o team dedicato continuativo. Due modalità, un unico standard: risultati concreti, qualità garantita, zero sorprese.',
    },
    breadcrumb: 'Sviluppo Software',
    hero: {
      title: 'Sviluppo software. Due modi, un unico standard.',
      subtitle:
        'Hai un progetto con inizio e fine? Oppure hai bisogno di capacità tecnica continua? Scegli la modalità giusta — in entrambi i casi: scope chiaro, qualità garantita, risultato misurabile.',
    },
    modePicker: [
      {
        icon: '📋',
        title: 'Progetto a scope fisso',
        text: 'Un deliverable, un prezzo, una scadenza. Discovery, sviluppo, test, deploy — e garanzia post-consegna inclusa.',
        idealFor: 'Ideale per: MVP, funzionalità nuova, migrazione, integrazione',
        anchor: '#progetto',
      },
      {
        icon: '👥',
        title: 'Team continuativo (Factory)',
        text: 'Un team dedicato a canone mensile. Scala quando cresce, rallenta quando rallenti. Know-how che resta.',
        idealFor: 'Ideale per: prodotto in evoluzione, backlog continuo, team interno sottodimensionato',
        anchor: '#factory',
      },
    ],
    project: {
      section: { label: 'Modalità 1', title: 'Progetto a scope fisso', subtitle: 'Un progetto. Scope definito, risultato garantito.' },
      painPoints: [
        { quote: '"Il budget era X, la fattura è 2X"', text: 'Scope a contratto, preventivo vincolante. Variazioni si decidono insieme, prima.' },
        { quote: '"Doveva finire a marzo, siamo a settembre"', text: 'Milestone ogni 2 settimane. Slip visibili in anticipo.' },
        { quote: '"Funziona, ma solo quando vuole"', text: 'Testing rigoroso incluso. Non speranze: software che funziona.' },
        { quote: '"Dopo il go-live erano irraggiungibili"', text: '30 giorni supporto post-delivery inclusi.' },
      ],
      features: {
        heading: 'Come lavoriamo su un progetto',
        items: [
          { title: 'Discovery Sprint', description: 'Scope definito, requisiti chiari, rischi mappati. Nessuna sorpresa dopo il kickoff.', icon: '🔍' },
          { title: 'Architettura Solida', description: "Scelte tecniche all'inizio, non a metà progetto. Scalabilità e costi pianificati.", icon: '🏛️' },
          { title: 'Sviluppo Iterativo', description: 'Milestone visibili ogni 2 settimane. Feedback reale, non promesse.', icon: '🔄' },
          { title: 'Testing Rigoroso', description: 'Unit test, integration test, UAT. Il software consegnato funziona.', icon: '✅' },
          { title: 'Deploy & Training', description: 'Go-live accompagnato: deploy, formazione utenti, documentazione operativa.', icon: '🚀' },
          { title: 'Garanzia Post-Delivery', description: '30 giorni di supporto post-consegna inclusi. Bug fix garantiti.', icon: '🛡️' },
        ],
      },
      plans: {
        heading: 'Pacchetti progetto',
        subheading: 'Ogni progetto è personalizzato. Parliamone per trovare la formula giusta.',
        items: [
          { name: 'Progetto S', price: 'Su misura', description: 'Funzionalità singola', features: ['Discovery sprint (mezza giornata)', 'Una funzionalità o modulo definito', 'Testing incluso', 'Deploy assistito', '30 giorni garanzia'], cta: 'Parliamo del progetto', highlighted: false },
          { name: 'Progetto M', price: 'Su misura', description: 'Applicazione completa', features: ['Discovery sprint completo (1 giorno)', 'Architettura documentata', 'Sviluppo iterativo con milestone', 'Testing automatizzato', 'Deploy & training utenti', '30 giorni supporto post-lancio'], cta: 'Richiedi preventivo', highlighted: true },
          { name: 'Progetto L', price: 'Su misura', description: 'Piattaforma complessa', features: ['Discovery esteso + PoC', 'Architettura enterprise-grade', 'Team dedicato', 'QA e security review', 'Integrazione sistemi esistenti', '60 giorni supporto post-lancio'], cta: 'Parliamone', highlighted: false },
        ],
      },
      guide: {
        title: 'Guida gratuita: come non farsi fregare',
        description: 'Requirements, milestone, acceptance criteria, modelli contrattuali e 8 red flag da evitare.',
        path: '/risorse/guida-sviluppo-progetto',
        cta: 'Scarica PDF gratuito',
      },
    },
    factory: {
      section: { label: 'Modalità 2', title: 'Team continuativo — Factory', subtitle: 'Il tuo team esterno. Senza assumerlo.' },
      painPoints: [
        { icon: '⏰', title: '6+ mesi per assumere', text: 'Dal job posting al primo commit. Nel frattempo il backlog cresce.' },
        { icon: '💰', title: 'Costi fissi rigidi', text: 'Developer a tempo pieno anche quando il lavoro non c\'è.' },
        { icon: '🚪', title: 'Know-how che esce', text: 'Ogni developer che lascia porta via mesi di contesto.' },
      ],
      features: {
        heading: 'Cosa include la Factory',
        items: [
          { title: 'Team Dedicato', description: 'Developer che conoscono il tuo codebase, il tuo dominio, le tue priorità.', icon: '👥' },
          { title: 'Continuità Operativa', description: 'Nessuna interruzione per ferie o turnover. Il lavoro continua sempre.', icon: '🔁' },
          { title: 'Scaling Flessibile', description: 'Aumenta o riduci la capacità con preavviso di un mese.', icon: '📈' },
          { title: 'Knowledge Retention', description: "Documentazione sistematica. La conoscenza rimane nell'organizzazione.", icon: '🧠' },
          { title: 'Qualità Garantita', description: 'Code review, test automatizzati, standard condivisi. Qualità costante.', icon: '✅' },
          { title: 'Mobile Development', description: 'Capacità mobile nativa o cross-platform inclusa nei piani superiori.', icon: '📱' },
        ],
      },
      plans: {
        heading: 'Pacchetti Factory',
        subheading: 'Scala su e giù secondo il tuo business. Parliamone.',
        items: [
          { name: 'Factory Base', price: 'Su misura', description: '1 dev part-time', features: ['1 developer dedicato (20h/mese)', 'Weekly sync call', 'Canale dedicato', 'Report mensile', 'Preavviso modifiche: 30 giorni'], cta: 'Richiedi preventivo', highlighted: false },
          { name: 'Factory Standard', price: 'Su misura', description: 'Team 2-3 persone', features: ['2-3 figure tecniche dedicate', 'Project management incluso', 'Weekly sync + daily standup', 'Dashboard progresso real-time', 'Code review e quality gate', 'Documentazione aggiornata'], cta: 'Parliamone', highlighted: true },
          { name: 'Factory Enterprise', price: 'Su misura', description: 'Team completo + PM', features: ['Team completo (dev + QA + PM)', 'Capacità mobile inclusa', 'Architecture review mensile', 'Security audit trimestrale', 'SLA definiti e misurati', 'Escalation diretta con me'], cta: 'Parliamone', highlighted: false },
        ],
      },
      guide: {
        title: 'Guida gratuita: gestire un team esterno',
        description: 'Modelli di team, SLA operativi, knowledge transfer, governance ed exit strategy.',
        path: '/risorse/guida-factory',
        cta: 'Scarica PDF gratuito',
      },
    },
    cta: {
      heading: 'Non sai quale modalità fa per te?',
      text: 'In 15 minuti di call capiamo insieme se ti serve un progetto definito o un team continuativo. Spesso la risposta è: inizia con un progetto, poi passa alla factory.',
      button: 'Prenota una call gratuita',
    },
  },
  en: {
    meta: {
      title: 'Software Development',
      description:
        'Fixed-scope projects or dedicated ongoing team. Two modes, one standard: concrete results, guaranteed quality, zero surprises.',
    },
    breadcrumb: 'Software Development',
    hero: {
      title: 'Software development. Two ways, one standard.',
      subtitle:
        'Do you have a project with a start and end? Or do you need ongoing technical capacity? Choose the right mode — in both cases: clear scope, guaranteed quality, measurable outcome.',
    },
    modePicker: [
      {
        icon: '📋',
        title: 'Fixed-scope project',
        text: 'One deliverable, one price, one deadline. Discovery, development, testing, deploy — plus post-delivery warranty included.',
        idealFor: 'Ideal for: MVP, new feature, migration, integration',
        anchor: '#progetto',
      },
      {
        icon: '👥',
        title: 'Ongoing team (Factory)',
        text: 'A dedicated team on monthly retainer. Scale up when you grow, slow down when you need to. Knowledge that stays.',
        idealFor: 'Ideal for: evolving product, continuous backlog, understaffed internal team',
        anchor: '#factory',
      },
    ],
    project: {
      section: { label: 'Mode 1', title: 'Fixed-scope project', subtitle: 'One project. Defined scope, guaranteed outcome.' },
      painPoints: [
        { quote: '"The budget was X, the invoice is 2X"', text: 'Contracted scope, binding quote. Changes are decided together, upfront.' },
        { quote: '"It should finish in March, we are in September"', text: 'Milestones every 2 weeks. Slips visible early.' },
        { quote: '"It works, but only when it wants to"', text: 'Rigorous testing included. No hopes — software that works.' },
        { quote: '"After go-live they were unreachable"', text: '30 days post-delivery support included.' },
      ],
      features: {
        heading: 'How we work on a project',
        items: [
          { title: 'Discovery Sprint', description: 'Defined scope, clear requirements, mapped risks. No surprises after kickoff.', icon: '🔍' },
          { title: 'Solid Architecture', description: 'Technical choices upfront, not mid-project. Scalability and costs planned.', icon: '🏛️' },
          { title: 'Iterative Development', description: 'Visible milestones every 2 weeks. Real feedback, not promises.', icon: '🔄' },
          { title: 'Rigorous Testing', description: 'Unit tests, integration tests, UAT. Delivered software that works.', icon: '✅' },
          { title: 'Deploy & Training', description: 'Supported go-live: deploy, user training, operational documentation.', icon: '🚀' },
          { title: 'Post-Delivery Warranty', description: '30 days post-delivery support included. Bug fixes guaranteed.', icon: '🛡️' },
        ],
      },
      plans: {
        heading: 'Project packages',
        subheading: 'Every project is tailored. Let us find the right fit together.',
        items: [
          { name: 'Project S', price: 'Custom', description: 'Single feature', features: ['Discovery sprint (half day)', 'One defined feature or module', 'Testing included', 'Assisted deploy', '30-day warranty'], cta: "Let's discuss the project", highlighted: false },
          { name: 'Project M', price: 'Custom', description: 'Complete application', features: ['Full discovery sprint (1 day)', 'Documented architecture', 'Iterative development with milestones', 'Automated testing', 'Deploy & user training', '30 days post-launch support'], cta: 'Request a quote', highlighted: true },
          { name: 'Project L', price: 'Custom', description: 'Complex platform', features: ['Extended discovery + PoC', 'Enterprise-grade architecture', 'Dedicated team', 'QA and security review', 'Existing systems integration', '60 days post-launch support'], cta: "Let's talk", highlighted: false },
        ],
      },
      guide: {
        title: 'Free guide: how not to get burned',
        description: 'Requirements, milestones, acceptance criteria, contract models, and 8 red flags to avoid.',
        path: '/risorse/guida-sviluppo-progetto',
        cta: 'Download free PDF',
      },
    },
    factory: {
      section: { label: 'Mode 2', title: 'Ongoing team — Factory', subtitle: 'Your external team. Without hiring them.' },
      painPoints: [
        { icon: '⏰', title: '6+ months to hire', text: 'From job posting to first commit. Meanwhile the backlog grows.' },
        { icon: '💰', title: 'Rigid fixed costs', text: 'Full-time developer even when there is no work.' },
        { icon: '🚪', title: 'Knowledge walks out', text: 'Every developer who leaves takes months of context with them.' },
      ],
      features: {
        heading: 'What Factory includes',
        items: [
          { title: 'Dedicated Team', description: 'Developers who know your codebase, your domain, your priorities.', icon: '👥' },
          { title: 'Operational Continuity', description: 'No interruption for holidays or turnover. Work always continues.', icon: '🔁' },
          { title: 'Flexible Scaling', description: 'Increase or reduce capacity with one month notice.', icon: '📈' },
          { title: 'Knowledge Retention', description: 'Systematic documentation. Knowledge stays in the organisation.', icon: '🧠' },
          { title: 'Guaranteed Quality', description: 'Code review, automated tests, shared standards. Consistent quality.', icon: '✅' },
          { title: 'Mobile Development', description: 'Native or cross-platform mobile capability included in higher plans.', icon: '📱' },
        ],
      },
      plans: {
        heading: 'Factory packages',
        subheading: 'Scale up and down with your business. Let us talk.',
        items: [
          { name: 'Factory Base', price: 'Custom', description: '1 part-time dev', features: ['1 dedicated developer (20h/month)', 'Weekly sync call', 'Dedicated channel', 'Monthly report', 'Change notice: 30 days'], cta: 'Request a quote', highlighted: false },
          { name: 'Factory Standard', price: 'Custom', description: 'Team of 2-3', features: ['2-3 dedicated technical roles', 'Project management included', 'Weekly sync + daily standup', 'Real-time progress dashboard', 'Code review and quality gate', 'Updated documentation'], cta: "Let's talk", highlighted: true },
          { name: 'Factory Enterprise', price: 'Custom', description: 'Full team + PM', features: ['Full team (dev + QA + PM)', 'Mobile capability included', 'Monthly architecture review', 'Quarterly security audit', 'Defined and measured SLAs', 'Direct escalation with me'], cta: "Let's talk", highlighted: false },
        ],
      },
      guide: {
        title: 'Free guide: managing an external team',
        description: 'Team models, operational SLAs, knowledge transfer, governance, and exit strategy.',
        path: '/risorse/guida-factory',
        cta: 'Download free PDF',
      },
    },
    cta: {
      heading: 'Not sure which mode is right for you?',
      text: 'In a 15-minute call we figure out together whether you need a defined project or an ongoing team. Often the answer is: start with a project, then move to factory.',
      button: 'Book a free call',
    },
  },
};

export function getSviluppoContent(locale: Locale): SviluppoContent {
  return content[locale];
}
