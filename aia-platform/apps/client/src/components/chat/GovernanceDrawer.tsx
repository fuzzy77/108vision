import { X, Shield } from 'lucide-react';

interface GovernanceDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function GovernanceDrawer({ open, onClose }: GovernanceDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Come funziona l'AI
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-6 text-sm text-slate-600 dark:text-slate-400">
          <section>
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
              Badge di certezza
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  verificato
                </span>
                <span>Fatto controllato direttamente</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  probabile
                </span>
                <span>Inferenza ragionevole, senza verifica diretta</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  non verificato
                </span>
                <span>Per analogia — richiede conferma</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  ignoto
                </span>
                <span>L'AI non lo sa — si ferma e chiede</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
              Perche' l'AI chiede conferma?
            </h3>
            <p className="leading-relaxed">
              Prima di azioni importanti o irreversibili, l'AI si ferma e ti chiede il permesso.
              Questo perche' <strong>tu sei il decisore</strong>. L'AI non agisce mai autonomamente
              su cose che potrebbero avere conseguenze.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
              Come leggere le risposte
            </h3>
            <ul className="space-y-2 leading-relaxed">
              <li>• Se vedi un badge <strong>arancione</strong> o <strong>rosso</strong>: verifica prima di agire</li>
              <li>• Se la risposta e' lunga e non fa domande: chiedile di spiegare cosa propone</li>
              <li>• Se non sei sicuro: chiedi <em>"Perche'?"</em> o <em>"Quali sono i rischi?"</em></li>
              <li>• Se qualcosa non torna: dillo — l'AI corregge subito</li>
            </ul>
          </section>

          <section>
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
              Il principio guida
            </h3>
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
              <p className="text-primary-800 dark:text-primary-300 font-medium">
                L'AI propone, tu decidi.
              </p>
              <p className="text-primary-600 dark:text-primary-400 text-xs mt-1">
                L'AI e' un advisor potente ma non infallibile. Il suo ruolo e' rendere
                le tue decisioni migliori — non prenderle al posto tuo.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
