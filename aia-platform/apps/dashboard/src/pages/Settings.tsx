import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/ui.store';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { MODEL_TIERS } from '@/lib/constants';
import { api } from '@/lib/api';
import { Key, Database, Globe, Bell, Shield, Save, CheckCircle, AlertTriangle, Loader2, FlaskConical } from 'lucide-react';

interface SettingEntry {
  value: string;
  masked: boolean;
  updatedAt: string | null;
}

interface SettingsResponse {
  settings: Record<string, SettingEntry>;
  envKeys: Record<string, boolean>;
}

interface TestKeyResult {
  valid: boolean;
  status: number;
  message: string;
}

type Provider = 'deepseek' | 'dashscope' | 'openai' | 'anthropic';

function KeyTestButton({ provider, apiKey }: { provider: Provider; apiKey: string }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestKeyResult | null>(null);

  const handleTest = async () => {
    if (!apiKey) return;
    setTesting(true);
    setResult(null);
    try {
      const res = await api.post<TestKeyResult>('/admin/settings/test-key', { provider, apiKey });
      setResult(res);
    } catch (err) {
      setResult({ valid: false, status: 0, message: (err as Error).message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <button
        type="button"
        onClick={handleTest}
        disabled={!apiKey || testing}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <FlaskConical className="h-3 w-3" />}
        Testa
      </button>
      {result && (
        <span className={`text-xs ${result.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {result.valid ? 'Valida' : 'Non valida'} — {result.message}
        </span>
      )}
    </div>
  );
}

function SettingsPage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const { theme, setTheme } = useUIStore();
  const queryClient = useQueryClient();

  const [deepseekKey, setDeepseekKey] = useState('');
  const [dashscopeKey, setDashscopeKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [defaultModel, setDefaultModel] = useState('balanced');
  const [customDomain, setCustomDomain] = useState('');
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [budgetAlert, setBudgetAlert] = useState('500');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Impostazioni' }]);
  }, [setBreadcrumbs]);

  const { data: settingsData, isLoading } = useQuery<SettingsResponse>({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.get('/admin/settings'),
  });

  const { data: litellmStatus } = useQuery<{ status: string }>({
    queryKey: ['admin', 'settings', 'litellm-status'],
    queryFn: () => api.get('/admin/settings/litellm-status'),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (settingsData?.settings) {
      const s = settingsData.settings;
      if (s.default_model) setDefaultModel(s.default_model.value);
      if (s.budget_alert_eur) setBudgetAlert(s.budget_alert_eur.value);
      if (s.backup_enabled) setBackupEnabled(s.backup_enabled.value === 'true');
      if (s.email_notifications) setEmailNotifications(s.email_notifications.value === 'true');
      if (s.webhook_url) setWebhookUrl(s.webhook_url.value);
      if (s.custom_domain) setCustomDomain(s.custom_domain.value);
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      api.put<{ message: string; keys: string[] }>('/admin/settings', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setSaveSuccess(true);
      setDeepseekKey('');
      setDashscopeKey('');
      setOpenaiKey('');
      setAnthropicKey('');
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleSaveKeys = () => {
    const payload: Record<string, string> = {};
    if (deepseekKey) payload.deepseek_api_key = deepseekKey;
    if (dashscopeKey) payload.dashscope_api_key = dashscopeKey;
    if (openaiKey) payload.openai_api_key = openaiKey;
    if (anthropicKey) payload.anthropic_api_key = anthropicKey;
    if (Object.keys(payload).length === 0) return;
    saveMutation.mutate(payload);
  };

  const handleSaveAll = () => {
    const payload: Record<string, string> = {};
    if (deepseekKey) payload.deepseek_api_key = deepseekKey;
    if (dashscopeKey) payload.dashscope_api_key = dashscopeKey;
    if (openaiKey) payload.openai_api_key = openaiKey;
    if (anthropicKey) payload.anthropic_api_key = anthropicKey;
    payload.default_model = defaultModel;
    payload.budget_alert_eur = budgetAlert;
    payload.backup_enabled = String(backupEnabled);
    payload.email_notifications = String(emailNotifications);
    if (webhookUrl) payload.webhook_url = webhookUrl;
    if (customDomain) payload.custom_domain = customDomain;
    saveMutation.mutate(payload);
  };

  const getKeyStatus = (key: string): 'db' | 'env' | 'none' => {
    if (settingsData?.settings?.[key]) return 'db';
    if (settingsData?.envKeys?.[key]) return 'env';
    return 'none';
  };

  const getKeyPlaceholder = (key: string): string => {
    const status = getKeyStatus(key);
    if (status === 'db') {
      return settingsData!.settings[key].value;
    }
    if (status === 'env') return '(configurata in .env)';
    return 'Non configurata';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Impostazioni</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configurazione della piattaforma</p>
      </div>

      {/* Success toast */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4" />
          Impostazioni salvate con successo
        </div>
      )}

      {/* Error */}
      {saveMutation.isError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertTriangle className="h-4 w-4" />
          Errore: {(saveMutation.error as Error)?.message || 'Salvataggio fallito'}
        </div>
      )}

      {/* LiteLLM Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${litellmStatus?.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <CardTitle className="text-base">LiteLLM Gateway</CardTitle>
          </div>
          <CardDescription>
            {litellmStatus?.status === 'healthy'
              ? 'Il gateway AI è attivo e risponde correttamente'
              : 'Il gateway AI non risponde — le chiavi verranno applicate al prossimo avvio'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* LLM Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Chiavi API LLM</CardTitle>
          </div>
          <CardDescription>
            Le chiavi vengono salvate cifrate (AES-256-GCM). LiteLLM le legge dalle variabili d'ambiente;
            le chiavi salvate qui sovrascrivono quelle nel .env al prossimo deploy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Input
              label="DeepSeek API Key"
              type="password"
              value={deepseekKey}
              onChange={(e) => setDeepseekKey(e.target.value)}
              placeholder={getKeyPlaceholder('deepseek_api_key')}
              helperText={`Tier Veloce + Coding — Stato: ${getKeyStatus('deepseek_api_key') === 'db' ? 'salvata in DB' : getKeyStatus('deepseek_api_key') === 'env' ? 'da .env' : 'mancante'}`}
            />
            <KeyTestButton provider="deepseek" apiKey={deepseekKey} />
          </div>
          <div>
            <Input
              label="DashScope API Key (Alibaba/Qwen)"
              type="password"
              value={dashscopeKey}
              onChange={(e) => setDashscopeKey(e.target.value)}
              placeholder={getKeyPlaceholder('dashscope_api_key')}
              helperText={`Tier Potente + Vision + Embedding — Stato: ${getKeyStatus('dashscope_api_key') === 'db' ? 'salvata in DB' : getKeyStatus('dashscope_api_key') === 'env' ? 'da .env' : 'mancante'}`}
            />
            <KeyTestButton provider="dashscope" apiKey={dashscopeKey} />
          </div>
          <div>
            <Input
              label="OpenAI API Key"
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={getKeyPlaceholder('openai_api_key')}
              helperText={`Fallback embedding — Stato: ${getKeyStatus('openai_api_key') === 'db' ? 'salvata in DB' : getKeyStatus('openai_api_key') === 'env' ? 'da .env' : 'mancante'}`}
            />
            <KeyTestButton provider="openai" apiKey={openaiKey} />
          </div>
          <div>
            <Input
              label="Anthropic API Key"
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder={getKeyPlaceholder('anthropic_api_key')}
              helperText={`Premium tier (Claude) — Stato: ${getKeyStatus('anthropic_api_key') === 'db' ? 'salvata in DB' : getKeyStatus('anthropic_api_key') === 'env' ? 'da .env' : 'mancante'}`}
            />
            <KeyTestButton provider="anthropic" apiKey={anthropicKey} />
          </div>
          <Button size="sm" onClick={handleSaveKeys} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salva chiavi
          </Button>
        </CardContent>
      </Card>

      {/* Default preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Preferenze modello</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Modello predefinito per nuovi agenti"
            options={Object.entries(MODEL_TIERS).map(([key, val]) => ({
              value: key,
              label: `${val.label} — ${val.description}`,
            }))}
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
          />
          <Input
            label="Soglia budget mensile globale"
            type="number"
            value={budgetAlert}
            onChange={(e) => setBudgetAlert(e.target.value)}
            helperText="Ricevi un alert quando il costo totale supera questa soglia (EUR)"
          />
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base">Backup e sicurezza</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Switch
            checked={backupEnabled}
            onChange={setBackupEnabled}
            label="Backup automatico giornaliero"
            description="Esegui un backup completo ogni notte alle 03:00"
          />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Tema</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Scegli il tema dell&apos;interfaccia</p>
            </div>
            <Select
              options={[
                { value: 'light', label: 'Chiaro' },
                { value: 'dark', label: 'Scuro' },
              ]}
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom domain */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base">Dominio personalizzato</CardTitle>
          </div>
          <CardDescription>Configura un dominio personalizzato per il widget chat dei clienti</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Dominio"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="chat.tuazienda.it"
            helperText="Configura il CNAME nel DNS prima di attivare"
          />
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-500" />
            <CardTitle className="text-base">Notifiche</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Switch
            checked={emailNotifications}
            onChange={setEmailNotifications}
            label="Notifiche email"
            description="Ricevi email per alert budget, nuovi clienti e errori critici"
          />
          <Input
            label="Webhook URL"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/..."
            helperText="Ricevi notifiche anche via webhook (Slack, Teams, ecc.)"
          />
        </CardContent>
      </Card>

      {/* Save all */}
      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salva tutte le impostazioni
        </Button>
      </div>
    </div>
  );
}

export { SettingsPage };
