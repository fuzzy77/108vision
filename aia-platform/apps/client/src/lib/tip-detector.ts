export interface SmartTipData {
  type: 'verify' | 'ask_explanation' | 'ownership';
  message: string;
}

export function detectTip(assistantContent: string): SmartTipData | null {
  if (assistantContent.includes('[non verificato]') || assistantContent.includes('[ignoto]')) {
    return {
      type: 'verify',
      message: 'Questa risposta contiene elementi non verificati. Considera di chiedere fonti o verificare indipendentemente.',
    };
  }

  if (assistantContent.includes('[probabile]') && !assistantContent.includes('?')) {
    return {
      type: 'ask_explanation',
      message: 'L\'AI ha fatto inferenze probabili. Puoi chiedere "Perche\'?" per approfondire il ragionamento.',
    };
  }

  const wordCount = assistantContent.split(/\s+/).length;
  const hasQuestions = assistantContent.includes('?');
  if (wordCount > 300 && !hasQuestions) {
    return {
      type: 'ownership',
      message: 'Risposta lunga senza domande di conferma. Ricorda: sei tu il decisore. Chiedi chiarimenti se qualcosa non convince.',
    };
  }

  return null;
}
