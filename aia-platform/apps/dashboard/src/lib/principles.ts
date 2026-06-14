export interface PrincipleConfig {
  id: string;
  label: string;
  description: string;
  riskWarning: string;
  defaultEnabled: boolean;
}

export const PRINCIPLES: PrincipleConfig[] = [
  {
    id: 'ownership_markers',
    label: 'Marcatori di Certezza',
    description: "L'AI marca ogni affermazione con [verificato], [probabile], [non verificato], [ignoto].",
    riskWarning: "Senza marcatori, l'AI presentera' inferenze come fatti. Non potrai distinguere cosa e' verificato da cosa e' inventato.",
    defaultEnabled: true,
  },
  {
    id: 'ask_before_proceed',
    label: 'Chiedi Prima di Procedere',
    description: "L'AI chiede chiarimenti quando qualcosa e' ambiguo, invece di assumere e procedere.",
    riskWarning: "L'AI procedera' con assunzioni implicite. Se l'assunzione e' sbagliata, il risultato sara' sbagliato — senza avviso.",
    defaultEnabled: true,
  },
  {
    id: 'explain_reasoning',
    label: 'Spiega Cosa Fai e Perche\'',
    description: "L'AI spiega ogni azione non banale: cosa fa, perche', e le alternative considerate.",
    riskWarning: "L'AI eseguira' azioni senza spiegazione. Non potrai validare ne' imparare dal processo.",
    defaultEnabled: true,
  },
  {
    id: 'declare_uncertainty',
    label: 'Dichiara Incertezza',
    description: "L'AI dichiara esplicitamente quando non e' sicura, prima della conclusione.",
    riskWarning: "L'AI presentera' ogni risposta con la stessa sicurezza. Le allucinazioni saranno indistinguibili dai fatti.",
    defaultEnabled: true,
  },
  {
    id: 'checkpoint_irreversible',
    label: 'Checkpoint Azioni Irreversibili',
    description: "L'AI chiede conferma esplicita prima di azioni difficili da annullare.",
    riskWarning: "L'AI potra' eseguire azioni irreversibili senza conferma. Rischio di danni non recuperabili.",
    defaultEnabled: true,
  },
  {
    id: 'no_decide_for_user',
    label: 'Non Decidere per l\'Utente',
    description: "L'AI propone opzioni con trade-off invece di imporre soluzioni. Sfida le assunzioni.",
    riskWarning: "L'AI decidera' per te. Perderai ownership sulle scelte tecniche e strategiche.",
    defaultEnabled: true,
  },
  {
    id: 'act_only_when_needed',
    label: 'Agisci Solo Quando Necessario',
    description: "L'AI fa solo cio' che serve davvero, senza azioni superflue o refactoring non richiesti.",
    riskWarning: "L'AI agira' anche quando non necessario: feature extra, analisi ridondanti. Piu' rumore e rischio.",
    defaultEnabled: true,
  },
  {
    id: 'evaluate_risk_benefit',
    label: 'Valuta Rischi e Benefici',
    description: "L'AI esprime esplicitamente rischi e benefici prima di ogni azione non banale.",
    riskWarning: "L'AI procedera' senza dichiarare i rischi. Non saprai cosa potrebbe andare storto.",
    defaultEnabled: true,
  },
];
