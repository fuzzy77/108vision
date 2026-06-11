import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { EmailProvider, EmailAccountConfig, TestEmailConnectionResult } from '@/types';

interface EmailAccountFormProps {
  onSubmit: (data: {
    provider: EmailProvider;
    email: string;
    config: EmailAccountConfig;
    password?: string;
  }) => void;
  onTestConnection: (data: {
    provider: EmailProvider;
    email: string;
    config: EmailAccountConfig;
    password?: string;
  }) => Promise<TestEmailConnectionResult>;
  onCancel: () => void;
  isSubmitting?: boolean;
  isTesting?: boolean;
}

type Step = 'provider' | 'config' | 'test' | 'confirm';

function EmailAccountForm({ onSubmit, onTestConnection, onCancel, isSubmitting, isTesting }: EmailAccountFormProps) {
  const [step, setStep] = useState<Step>('provider');
  const [provider, setProvider] = useState<EmailProvider | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [imapSecurity, setImapSecurity] = useState<'ssl' | 'tls' | 'none'>('ssl');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecurity, setSmtpSecurity] = useState<'ssl' | 'tls' | 'none'>('tls');
  const [testResult, setTestResult] = useState<TestEmailConnectionResult | null>(null);

  const providers: { id: EmailProvider; label: string; description: string; available: boolean }[] = [
    { id: 'imap', label: 'IMAP Generico', description: 'Qualsiasi provider con accesso IMAP/SMTP', available: true },
    { id: 'microsoft365', label: 'Microsoft 365', description: 'Connessione tramite OAuth Microsoft', available: true },
    { id: 'google', label: 'Google Workspace', description: 'Connessione tramite OAuth Google', available: false },
  ];

  function buildConfig(): EmailAccountConfig {
    if (provider === 'imap') {
      return {
        imapHost,
        imapPort: parseInt(imapPort, 10),
        imapSecurity,
        smtpHost,
        smtpPort: parseInt(smtpPort, 10),
        smtpSecurity,
        username: email,
      };
    }
    if (provider === 'microsoft365') {
      return { oauthConnected: true };
    }
    return {};
  }

  async function handleTest() {
    if (!provider) return;
    const config = buildConfig();
    const result = await onTestConnection({ provider, email, config, password: provider === 'imap' ? password : undefined });
    setTestResult(result);
    if (result.success) {
      setStep('confirm');
    }
  }

  function handleSubmit() {
    if (!provider) return;
    const config = buildConfig();
    onSubmit({ provider, email, config, password: provider === 'imap' ? password : undefined });
  }

  function handleMicrosoftOAuth() {
    setEmail('oauth-pending@microsoft365');
    setStep('test');
  }

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {(['provider', 'config', 'test', 'confirm'] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                step === s
                  ? 'bg-primary-600 text-white'
                  : idx < ['provider', 'config', 'test', 'confirm'].indexOf(step)
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              )}
            >
              {idx + 1}
            </div>
            {idx < 3 && (
              <div className={cn(
                'h-0.5 w-8',
                idx < ['provider', 'config', 'test', 'confirm'].indexOf(step)
                  ? 'bg-emerald-300 dark:bg-emerald-700'
                  : 'bg-slate-200 dark:bg-slate-700'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Provider selection */}
      {step === 'provider' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Scegli il provider email</h3>
          <div className="grid grid-cols-1 gap-3">
            {providers.map((p) => (
              <Card
                key={p.id}
                className={cn(
                  'cursor-pointer transition-all',
                  !p.available && 'opacity-50 cursor-not-allowed',
                  provider === p.id && 'ring-2 ring-primary-500 border-primary-500',
                )}
                onClick={() => p.available && setProvider(p.id)}
              >
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.label}</p>
                        {!p.available && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded dark:bg-slate-700 dark:text-slate-400">
                            Prossimamente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{p.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onCancel}>Annulla</Button>
            <Button disabled={!provider} onClick={() => setStep('config')}>Continua</Button>
          </div>
        </div>
      )}

      {/* Step 2: Configuration */}
      {step === 'config' && provider === 'imap' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Configurazione IMAP</h3>
          <Input
            label="Indirizzo email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@esempio.it"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password o app password"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Server IMAP"
              value={imapHost}
              onChange={(e) => setImapHost(e.target.value)}
              placeholder="imap.esempio.it"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Porta"
                value={imapPort}
                onChange={(e) => setImapPort(e.target.value)}
                placeholder="993"
              />
              <Select
                label="Sicurezza"
                value={imapSecurity}
                onChange={(e) => setImapSecurity(e.target.value as 'ssl' | 'tls' | 'none')}
                options={[
                  { value: 'ssl', label: 'SSL' },
                  { value: 'tls', label: 'TLS' },
                  { value: 'none', label: 'Nessuna' },
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Server SMTP"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.esempio.it"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Porta"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
              />
              <Select
                label="Sicurezza"
                value={smtpSecurity}
                onChange={(e) => setSmtpSecurity(e.target.value as 'ssl' | 'tls' | 'none')}
                options={[
                  { value: 'ssl', label: 'SSL' },
                  { value: 'tls', label: 'TLS' },
                  { value: 'none', label: 'Nessuna' },
                ]}
              />
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep('provider')}>Indietro</Button>
            <Button disabled={!email || !imapHost || !password} onClick={() => setStep('test')}>Continua</Button>
          </div>
        </div>
      )}

      {step === 'config' && provider === 'microsoft365' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Connessione Microsoft 365</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Clicca il pulsante per autorizzare l'accesso all'account Microsoft 365 tramite OAuth.
            Non memorizziamo la password: viene utilizzato un token di accesso sicuro.
          </p>
          <Button onClick={handleMicrosoftOAuth} className="w-full">
            <svg className="h-4 w-4" viewBox="0 0 21 21" fill="currentColor">
              <rect x="1" y="1" width="9" height="9" />
              <rect x="11" y="1" width="9" height="9" />
              <rect x="1" y="11" width="9" height="9" />
              <rect x="11" y="11" width="9" height="9" />
            </svg>
            Connetti con Microsoft
          </Button>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep('provider')}>Indietro</Button>
          </div>
        </div>
      )}

      {/* Step 3: Test connection */}
      {step === 'test' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Test connessione</h3>
          <div className="flex flex-col items-center py-6 gap-4">
            {!testResult && !isTesting && (
              <>
                <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-700">
                  <Mail className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  Verifica che la connessione all'account email funzioni correttamente.
                </p>
                <Button onClick={handleTest}>Testa connessione</Button>
              </>
            )}
            {isTesting && (
              <>
                <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Connessione in corso...</p>
              </>
            )}
            {testResult && testResult.success && (
              <>
                <div className="rounded-full bg-emerald-50 p-4 dark:bg-emerald-900/30">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Connessione riuscita</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{testResult.message}</p>
              </>
            )}
            {testResult && !testResult.success && (
              <>
                <div className="rounded-full bg-red-50 p-4 dark:bg-red-900/30">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Connessione fallita</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{testResult.message}</p>
                <Button variant="outline" size="sm" onClick={() => { setTestResult(null); setStep('config'); }}>
                  Modifica configurazione
                </Button>
              </>
            )}
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => { setTestResult(null); setStep('config'); }}>Indietro</Button>
            {testResult?.success && (
              <Button onClick={() => setStep('confirm')}>Continua</Button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Conferma configurazione</h3>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Provider</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {providers.find((p) => p.id === provider)?.label}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Email</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{email}</span>
            </div>
            {provider === 'imap' && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Server IMAP</span>
                  <span className="text-slate-900 dark:text-slate-100">{imapHost}:{imapPort}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Server SMTP</span>
                  <span className="text-slate-900 dark:text-slate-100">{smtpHost}:{smtpPort}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Test connessione</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> Superato
              </span>
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep('test')}>Indietro</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salva account
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { EmailAccountForm };
