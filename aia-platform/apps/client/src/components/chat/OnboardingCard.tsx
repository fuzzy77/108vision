import { useState } from 'react';
import { Shield, X } from 'lucide-react';

const STORAGE_KEY = 'aia_onboarding_seen';

export function OnboardingCard() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="relative bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-5 mb-6">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800"
        aria-label="Chiudi"
      >
        <X className="w-4 h-4 text-primary-400" />
      </button>

      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Come usare bene il tuo assistente AI
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>I <strong>badge colorati</strong> indicano quanto l'AI e' sicura delle sue risposte</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>L'AI ti <strong>chiedera' conferma</strong> prima di azioni importanti — non procede da sola</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>Se qualcosa non ti convince, <strong>chiedi "perche'?"</strong> — l'AI spiega sempre il suo ragionamento</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
              <span><strong>Tu decidi sempre</strong> — l'AI propone, tu validi</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
