import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PrincipleId, PrincipleDefinition, PrincipleOverrides, AgentConfig } from '@aia/shared';
import { PRINCIPLE_IDS } from '@aia/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolve(__dirname, '../../../../templates/base-principles.md');

interface ParsedPrinciple {
  id: PrincipleId;
  content: string;
}

const PRINCIPLE_METADATA: Record<PrincipleId, Omit<PrincipleDefinition, 'id' | 'defaultEnabled'>> = {
  ownership_markers: {
    label: 'Marcatori di Certezza',
    description: 'L\'AI marca ogni affermazione con il livello di certezza: [verificato], [probabile], [non verificato], [ignoto].',
    riskWarning: 'Senza marcatori, l\'AI presentera\' inferenze come fatti. Non potrai distinguere cosa e\' verificato da cosa e\' inventato.',
  },
  ask_before_proceed: {
    label: 'Chiedi Prima di Procedere',
    description: 'L\'AI chiede chiarimenti quando qualcosa e\' ambiguo, invece di assumere e procedere.',
    riskWarning: 'L\'AI procedera\' con assunzioni implicite. Se l\'assunzione e\' sbagliata, il risultato sara\' sbagliato — senza avviso.',
  },
  explain_reasoning: {
    label: 'Spiega Cosa Fai e Perche\'',
    description: 'L\'AI spiega ogni azione non banale: cosa fa, perche\', e le alternative considerate.',
    riskWarning: 'L\'AI eseguira\' azioni senza spiegazione. Non potrai validare ne\' imparare dal processo.',
  },
  declare_uncertainty: {
    label: 'Dichiara Incertezza',
    description: 'L\'AI dichiara esplicitamente quando non e\' sicura, prima della conclusione.',
    riskWarning: 'L\'AI presentera\' ogni risposta con la stessa sicurezza. Le allucinazioni saranno indistinguibili dai fatti.',
  },
  checkpoint_irreversible: {
    label: 'Checkpoint Azioni Irreversibili',
    description: 'L\'AI chiede conferma esplicita prima di azioni difficili da annullare.',
    riskWarning: 'L\'AI potra\' eseguire azioni irreversibili (deploy, cancellazioni, invii) senza conferma. Rischio di danni non recuperabili.',
  },
  no_decide_for_user: {
    label: 'Non Decidere per l\'Utente',
    description: 'L\'AI propone opzioni con trade-off invece di imporre soluzioni. Sfida le assunzioni.',
    riskWarning: 'L\'AI decidera\' per te. Perderai ownership sulle scelte tecniche e strategiche del tuo sistema.',
  },
  act_only_when_needed: {
    label: 'Agisci Solo Quando Necessario',
    description: 'L\'AI fa solo cio\' che serve davvero, senza azioni superflue, refactoring non richiesti o "miglioramenti" speculativi.',
    riskWarning: 'L\'AI agira\' anche quando non necessario: refactoring non richiesti, feature extra, analisi ridondanti. Piu\' rumore e rischio senza beneficio.',
  },
  evaluate_risk_benefit: {
    label: 'Valuta Rischi e Benefici',
    description: 'L\'AI esprime esplicitamente rischi e benefici prima di ogni azione non banale.',
    riskWarning: 'L\'AI procedera\' senza dichiarare i rischi. Non saprai cosa potrebbe andare storto finche\' non va storto.',
  },
  persistent_memory: {
    label: 'Memoria Persistente',
    description: 'L\'AI ricorda preferenze, contesto e decisioni tra sessioni e dispositivi senza che l\'utente debba ripetersi.',
    riskWarning: 'L\'AI non ricordera\' nulla tra le sessioni. L\'utente dovra\' fornire lo stesso contesto ogni volta.',
  },
  context_awareness: {
    label: 'Gestione del Contesto',
    description: 'L\'AI monitora la lunghezza della conversazione e suggerisce nuove sessioni quando la qualità potrebbe degradare.',
    riskWarning: 'L\'AI continuera\' a rispondere anche quando il contesto e\' saturo, con risposte progressivamente meno coerenti.',
  },
  token_efficiency: {
    label: 'Efficienza e Risparmio',
    description: 'L\'AI risponde in modo conciso e non spreca risorse inutilmente.',
    riskWarning: 'L\'AI produrra\' risposte verbose e ridondanti, aumentando costi e riducendo la chiarezza.',
  },
};

let cachedPrinciples: ParsedPrinciple[] | null = null;

function loadPrinciples(): ParsedPrinciple[] {
  if (cachedPrinciples) return cachedPrinciples;

  const raw = readFileSync(TEMPLATE_PATH, 'utf8');
  const sections = raw.split(/<!-- ID: (\w+) -->/);

  const principles: ParsedPrinciple[] = [];
  for (let i = 1; i < sections.length; i += 2) {
    const id = sections[i] as PrincipleId;
    const content = sections[i + 1]?.trim();
    if (PRINCIPLE_IDS.includes(id) && content) {
      principles.push({ id, content });
    }
  }

  cachedPrinciples = principles;
  return principles;
}

function compilePrinciplesPrompt(agentConfig: AgentConfig | Record<string, unknown>): string {
  const overrides = (agentConfig?.principlesOverrides ?? {}) as PrincipleOverrides;
  const principles = loadPrinciples();

  const enabledPrinciples = principles.filter((p) => {
    const override = overrides[p.id];
    return override !== false; // default = enabled (missing key = enabled)
  });

  if (enabledPrinciples.length === 0) return '';

  const blocks = enabledPrinciples.map((p) => p.content);
  return `# Principi di Governance AI\n\n${blocks.join('\n\n---\n\n')}`;
}

function getPrincipleDefinitions(): PrincipleDefinition[] {
  return PRINCIPLE_IDS.map((id) => ({
    id,
    ...PRINCIPLE_METADATA[id],
    defaultEnabled: true,
  }));
}

export const principlesService = {
  loadPrinciples,
  compilePrinciplesPrompt,
  getPrincipleDefinitions,
};
